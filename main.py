"""
PolyWeather Bot — Single-file entry point for Railway.
All modules inlined to avoid sys.path issues in Railway's /opt/venv environment.
"""
# ════════════════════════════════════════════════════════════════
#  STDLIB + THIRD-PARTY IMPORTS
# ════════════════════════════════════════════════════════════════
import asyncio, os, sys, re, uuid, json, math
from datetime import datetime, timezone
from typing import Optional
from dataclasses import dataclass, field

from dotenv import load_dotenv
load_dotenv()

from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential
import httpx
import numpy as np
from scipy.special import expit
import aiosqlite
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler, ContextTypes
)

# ════════════════════════════════════════════════════════════════
#  LOGGING SETUP
# ════════════════════════════════════════════════════════════════
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logger.remove()
logger.add(sys.stderr, level=LOG_LEVEL, colorize=True,
           format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")
os.makedirs("logs", exist_ok=True)
logger.add("logs/bot.log", rotation="10 MB", retention="7 days", level="DEBUG")

# ════════════════════════════════════════════════════════════════
#  CONSTANTS
# ════════════════════════════════════════════════════════════════
GAMMA_BASE = "https://gamma-api.polymarket.com"
CLOB_BASE  = "https://clob.polymarket.com"
OPEN_METEO_ENSEMBLE  = "https://ensemble-api.open-meteo.com/v1/ensemble"
OPEN_METEO_FORECAST  = "https://api.open-meteo.com/v1/forecast"

CITY_COORDS = {
    "New York": (40.7128, -74.0060), "Los Angeles": (34.0522, -118.2437),
    "Chicago": (41.8781, -87.6298),  "Miami": (25.7617, -80.1918),
    "Houston": (29.7604, -95.3698),  "Phoenix": (33.4484, -112.0740),
    "Dallas": (32.7767, -96.7970),   "Atlanta": (33.7490, -84.3880),
    "Seattle": (47.6062, -122.3321), "Denver": (39.7392, -104.9903),
    "Las Vegas": (36.1699, -115.1398), "Boston": (42.3601, -71.0589),
    "San Francisco": (37.7749, -122.4194), "Portland": (45.5051, -122.6750),
    "Minneapolis": (44.9778, -93.2650),    "Nashville": (36.1627, -86.7816),
    "Austin": (30.2672, -97.7431),   "Philadelphia": (39.9526, -75.1652),
    "Washington": (38.9072, -77.0369), "Detroit": (42.3314, -83.0457),
    "London": (51.5074, -0.1278),    "Tokyo": (35.6762, 139.6503),
    "Paris": (48.8566, 2.3522),      "Sydney": (-33.8688, 151.2093),
    "Toronto": (43.6532, -79.3832),  "Dubai": (25.2048, 55.2708),
    "Singapore": (1.3521, 103.8198),
}

DB_PATH = os.getenv("PAPER_DB_PATH", "logs/paper.db")
MIN_EDGE        = float(os.getenv("MIN_EDGE", "0.08"))
KELLY_FRACTION  = float(os.getenv("KELLY_FRACTION", "0.15"))
MAX_POS_USD     = float(os.getenv("MAX_POSITION_USD", "100"))
MAX_POS_PCT     = float(os.getenv("MAX_POSITION_PCT", "0.05"))
MIN_LIQUIDITY   = float(os.getenv("MIN_LIQUIDITY_USD", "500"))
SCAN_INTERVAL   = int(os.getenv("SCAN_INTERVAL_MINUTES", "5"))
EXIT_INTERVAL   = int(os.getenv("EXIT_CHECK_MINUTES", "15"))
PAPER_BANKROLL  = float(os.getenv("PAPER_BANKROLL", "1000"))
TRADING_MODE    = os.getenv("TRADING_MODE", "paper")

# ════════════════════════════════════════════════════════════════
#  DATA MODELS
# ════════════════════════════════════════════════════════════════
@dataclass
class TradingSignal:
    signal_id: str
    condition_id: str
    question: str
    city: str
    market_type: str
    threshold_f: Optional[float]
    yes_token_id: str
    no_token_id: str
    yes_price: float
    no_price: float
    model_prob: float
    market_prob: float
    edge: float
    trade_side: str
    trade_token_id: str
    trade_price: float
    kelly_fraction: float
    recommended_size_usd: float
    expected_value: float
    ensemble_members: int
    model_spread_f: float
    confidence: str
    models_used: list
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    end_date: str = ""


@dataclass
class PaperTrade:
    trade_id: str
    condition_id: str
    question: str
    city: str
    market_type: str
    trade_side: str
    entry_price: float
    size_usd: float
    shares: float
    model_prob: float
    edge: float
    confidence: str
    status: str = "open"
    exit_price: Optional[float] = None
    pnl: Optional[float] = None
    pnl_pct: Optional[float] = None
    resolved_outcome: Optional[str] = None
    entry_time: str = ""
    exit_time: Optional[str] = None
    end_date: str = ""
    signal_id: str = ""
    models_used: str = ""


# ════════════════════════════════════════════════════════════════
#  POLYMARKET API
# ════════════════════════════════════════════════════════════════
class GammaClient:
    def __init__(self):
        self.session = httpx.AsyncClient(timeout=30)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
    async def get_markets(self, tag="weather", limit=200, offset=0):
        resp = await self.session.get(f"{GAMMA_BASE}/markets", params={
            "tag": tag, "active": "true", "closed": "false",
            "limit": limit, "offset": offset,
        })
        resp.raise_for_status()
        data = resp.json()
        return data if isinstance(data, list) else data.get("markets", [])

    async def get_all_weather_markets(self):
        all_m = []
        for tag in ["weather", "climate", "temperature"]:
            offset = 0
            while True:
                batch = await self.get_markets(tag=tag, limit=200, offset=offset)
                if not batch:
                    break
                all_m.extend(batch)
                if len(batch) < 200:
                    break
                offset += 200
        seen, unique = set(), []
        for m in all_m:
            cid = m.get("conditionId", "")
            if cid and cid not in seen:
                seen.add(cid); unique.append(m)
        logger.info(f"[Gamma] {len(unique)} unique weather markets")
        return unique

    async def close(self):
        await self.session.aclose()


def _extract_threshold(question):
    for pat in [r'(?:above|exceed|reach|over|below|under)\s+(\d+\.?\d*)',
                r'(\d+\.?\d*)\s*°[fc]', r'(\d+\.?\d*)\s*degrees']:
        m = re.search(pat, question.lower())
        if m:
            return float(m.group(1))
    return None

def _extract_city(question):
    q = question.lower()
    for city in CITY_COORDS:
        if city.lower() in q:
            return city
    return None

def _classify_market(question):
    q = question.lower()
    if any(k in q for k in ["°f","°c","temperature","high","low","degrees"]): return "temperature"
    if any(k in q for k in ["rain","precipitation","snow","flood"]): return "precipitation"
    if "hurricane" in q or "typhoon" in q: return "hurricane"
    if "tornado" in q: return "tornado"
    return "general"

def _get_token_id(market, outcome):
    tokens = market.get("tokens", [])
    for t in tokens:
        if outcome.lower() in (t.get("outcome","")).lower():
            return t.get("token_id","")
    if outcome == "yes" and tokens: return tokens[0].get("token_id","")
    if outcome == "no" and len(tokens) > 1: return tokens[1].get("token_id","")
    return ""

def parse_weather_markets(markets):
    KEYWORDS = ["temperature","high","low","°f","°c","degrees","rain",
                "precipitation","snow","hurricane","tornado","wind","wildfire"]
    parsed = []
    for m in markets:
        q = (m.get("question","") or "").lower()
        d = (m.get("description","") or "").lower()
        if not any(k in q+d for k in KEYWORDS): continue
        city = _extract_city(m.get("question","") or "")
        if not city: continue
        threshold = _extract_threshold(m.get("question","") or "")
        if threshold is None: continue
        prices = m.get("outcomePrices", [0.5, 0.5])
        if isinstance(prices, list) and len(prices) >= 2:
            yp, np_ = float(prices[0]), float(prices[1])
        else:
            yp, np_ = 0.5, 0.5
        parsed.append({
            "condition_id": m.get("conditionId",""),
            "question": m.get("question",""),
            "yes_token_id": _get_token_id(m,"yes"),
            "no_token_id": _get_token_id(m,"no"),
            "yes_price": yp, "no_price": np_,
            "volume": float(m.get("volume",0) or 0),
            "liquidity": float(m.get("liquidity",0) or 0),
            "end_date": m.get("endDate",""),
            "city": city, "threshold_f": threshold,
            "market_type": _classify_market(m.get("question","") or ""),
        })
    return parsed


# ════════════════════════════════════════════════════════════════
#  WEATHER ENGINE
# ════════════════════════════════════════════════════════════════
class WeatherEngine:
    def __init__(self):
        self.session = httpx.AsyncClient(timeout=30)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
    async def _get_ensemble(self, lat, lon, days=7):
        resp = await self.session.get(OPEN_METEO_ENSEMBLE, params={
            "latitude": lat, "longitude": lon, "models": "gfs_seamless",
            "hourly": "temperature_2m", "forecast_days": days,
            "temperature_unit": "fahrenheit", "timezone": "auto",
        })
        resp.raise_for_status()
        return resp.json()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
    async def _get_forecast(self, lat, lon, days=7):
        resp = await self.session.get(OPEN_METEO_FORECAST, params={
            "latitude": lat, "longitude": lon,
            "models": "ecmwf_ifs_analysis_long_window",
            "daily": "temperature_2m_max,temperature_2m_min",
            "forecast_days": days, "temperature_unit": "fahrenheit", "timezone": "auto",
        })
        resp.raise_for_status()
        return resp.json()

    async def compute_prob(self, city, threshold_f, direction="above", target_date=None):
        coords = CITY_COORDS.get(city, (40.7128, -74.0060))
        lat, lon = coords
        probs = []
        members_data = []

        # GFS ensemble
        try:
            data = await self._get_ensemble(lat, lon)
            hourly = data.get("hourly", {})
            times = hourly.get("time", [])
            member_keys = [k for k in hourly if k.startswith("temperature_2m_member")] or ["temperature_2m"]
            member_maxes = []
            for key in member_keys:
                vals = hourly.get(key, [])
                if target_date:
                    day_v = [v for t,v in zip(times,vals) if t and t.startswith(target_date) and v is not None]
                else:
                    day_v = [v for v in vals[:24] if v is not None]
                if day_v:
                    member_maxes.append(max(day_v))
            if member_maxes:
                hitting = sum(1 for v in member_maxes if (v > threshold_f if direction=="above" else v < threshold_f))
                gfs_prob = hitting / len(member_maxes)
                probs.append(("gfs", gfs_prob, 3.0))
                members_data.extend(member_maxes)
        except Exception as e:
            logger.warning(f"[GFS] {city}: {e}")

        # ECMWF deterministic → soft prob
        try:
            data = await self._get_forecast(lat, lon)
            daily = data.get("daily", {})
            times = daily.get("time", [])
            maxes = daily.get("temperature_2m_max", [])
            if times and maxes:
                if target_date:
                    idx_list = [i for i,t in enumerate(times) if t == target_date]
                    idx = idx_list[0] if idx_list else 1
                else:
                    idx = 1 if len(times) > 1 else 0
                val = maxes[idx] if idx < len(maxes) and maxes[idx] is not None else None
                if val is not None:
                    z = (val - threshold_f) / 5.0
                    ecmwf_prob = float(expit(z)) if direction=="above" else float(1-expit(z))
                    probs.append(("ecmwf", ecmwf_prob, 2.0))
        except Exception as e:
            logger.warning(f"[ECMWF] {city}: {e}")

        if not probs:
            return None

        total_w = sum(w for _,_,w in probs)
        model_prob = sum(w*p for _,p,w in probs) / total_w
        spread = float(np.std(members_data)) if members_data else 0.0
        edge_from_50 = abs(model_prob - 0.5)
        if spread < 3 and edge_from_50 > 0.25: confidence = "high"
        elif spread < 6 and edge_from_50 > 0.1: confidence = "medium"
        else: confidence = "low"

        return {
            "model_prob": round(model_prob, 4),
            "ensemble_members": len(members_data) or 31,
            "model_spread_f": round(spread, 2),
            "confidence": confidence,
            "models_used": [n for n,_,_ in probs],
        }

    async def close(self):
        await self.session.aclose()


# ════════════════════════════════════════════════════════════════
#  PROBABILISTIC ENGINE
# ════════════════════════════════════════════════════════════════
class ProbEngine:
    def __init__(self):
        self.gamma = GammaClient()
        self.weather = WeatherEngine()

    async def scan_and_rank(self, bankroll):
        logger.info("[Engine] Scanning markets...")
        raw = await self.gamma.get_all_weather_markets()
        markets = parse_weather_markets(raw)
        actionable = [m for m in markets if m["liquidity"] >= MIN_LIQUIDITY and m["yes_token_id"]]
        logger.info(f"[Engine] {len(markets)} parsed, {len(actionable)} actionable")

        signals = []
        for i in range(0, len(actionable), 5):
            batch = actionable[i:i+5]
            results = await asyncio.gather(*[self._analyze(m, bankroll) for m in batch], return_exceptions=True)
            for r in results:
                if isinstance(r, TradingSignal):
                    signals.append(r)

        qualified = [s for s in signals if abs(s.edge) >= MIN_EDGE]
        qualified.sort(key=lambda s: s.expected_value, reverse=True)
        logger.info(f"[Engine] {len(qualified)} signals with edge ≥ {MIN_EDGE:.0%}")
        return qualified

    async def _analyze(self, market, bankroll):
        city = market["city"]
        threshold = market["threshold_f"]
        q = market["question"]
        direction = "below" if any(k in q.lower() for k in ["below","under","not reach"]) else "above"

        target_date = None
        if market.get("end_date"):
            try:
                dt = datetime.fromisoformat(market["end_date"].replace("Z","+00:00"))
                target_date = dt.strftime("%Y-%m-%d")
            except: pass

        wr = await self.weather.compute_prob(city, threshold, direction, target_date)
        if not wr or wr.get("model_prob") is None:
            return None

        mp = wr["model_prob"]
        yp = market["yes_price"]
        edge_yes = mp - yp
        edge_no  = (1 - mp) - market["no_price"]

        if abs(edge_yes) >= abs(edge_no):
            edge, side, price, token = edge_yes, "YES", yp, market["yes_token_id"]
        else:
            edge, side, price, token = edge_no, "NO", market["no_price"], market["no_token_id"]

        if abs(edge) < MIN_EDGE or price <= 0:
            return None

        win_prob = mp if side == "YES" else (1 - mp)
        odds = (1/price) - 1
        if odds <= 0: return None

        kelly_full = (win_prob * odds - (1-win_prob)) / odds
        kelly_used = max(0, kelly_full * KELLY_FRACTION)
        size = min(kelly_used * bankroll, MAX_POS_USD, bankroll * MAX_POS_PCT)
        size = max(1.0, size)
        ev = win_prob * size * odds - (1-win_prob) * size

        return TradingSignal(
            signal_id=str(uuid.uuid4())[:8],
            condition_id=market["condition_id"],
            question=q, city=city,
            market_type=market["market_type"],
            threshold_f=threshold,
            yes_token_id=market["yes_token_id"],
            no_token_id=market["no_token_id"],
            yes_price=yp, no_price=market["no_price"],
            model_prob=mp, market_prob=yp, edge=edge,
            trade_side=side, trade_token_id=token, trade_price=price,
            kelly_fraction=kelly_used, recommended_size_usd=round(size,2),
            expected_value=round(ev,4),
            ensemble_members=wr.get("ensemble_members",31),
            model_spread_f=wr.get("model_spread_f",0),
            confidence=wr.get("confidence","medium"),
            models_used=wr.get("models_used",[]),
            end_date=market.get("end_date",""),
        )

    async def check_exit(self, pos):
        try:
            end_date = pos.end_date or ""
            if end_date:
                dt = datetime.fromisoformat(end_date.replace("Z","+00:00"))
                hours_left = (dt - datetime.now(timezone.utc)).total_seconds() / 3600
                if hours_left < 2:
                    return {"action": "close_decay", "reason": f"Resolution in {hours_left:.1f}h"}
        except: pass
        return {"action": "hold", "reason": "Monitoring"}

    async def close(self):
        await self.gamma.close()
        await self.weather.close()


# ════════════════════════════════════════════════════════════════
#  PAPER PORTFOLIO
# ════════════════════════════════════════════════════════════════
class PaperPortfolio:
    def __init__(self):
        self.bankroll = PAPER_BANKROLL
        self.initial_bankroll = PAPER_BANKROLL
        self._db = None

    async def init_db(self):
        os.makedirs(os.path.dirname(DB_PATH) if os.path.dirname(DB_PATH) else ".", exist_ok=True)
        self._db = await aiosqlite.connect(DB_PATH)
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS trades (
                trade_id TEXT PRIMARY KEY, condition_id TEXT, question TEXT,
                city TEXT, market_type TEXT, trade_side TEXT, entry_price REAL,
                size_usd REAL, shares REAL, model_prob REAL, edge REAL, confidence TEXT,
                status TEXT DEFAULT 'open', exit_price REAL, pnl REAL, pnl_pct REAL,
                resolved_outcome TEXT, entry_time TEXT, exit_time TEXT,
                end_date TEXT, signal_id TEXT, models_used TEXT
            )""")
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, value TEXT)""")
        await self._db.commit()
        async with self._db.execute("SELECT value FROM state WHERE key='bankroll'") as c:
            row = await c.fetchone()
            if row: self.bankroll = float(row[0])
        logger.info(f"[DB] Bankroll: ${self.bankroll:.2f}")

    async def _save_bankroll(self):
        await self._db.execute("INSERT OR REPLACE INTO state VALUES ('bankroll',?)", (str(self.bankroll),))
        await self._db.commit()

    async def open_trade(self, signal):
        if signal.recommended_size_usd > self.bankroll: return None
        async with self._db.execute("SELECT trade_id FROM trades WHERE condition_id=? AND status='open'", (signal.condition_id,)) as c:
            if await c.fetchone(): return None

        t = PaperTrade(
            trade_id=str(uuid.uuid4())[:8], condition_id=signal.condition_id,
            question=signal.question, city=signal.city, market_type=signal.market_type,
            trade_side=signal.trade_side, entry_price=signal.trade_price,
            size_usd=signal.recommended_size_usd,
            shares=signal.recommended_size_usd/signal.trade_price,
            model_prob=signal.model_prob, edge=signal.edge, confidence=signal.confidence,
            entry_time=datetime.now(timezone.utc).isoformat(),
            end_date=signal.end_date, signal_id=signal.signal_id,
            models_used=json.dumps(signal.models_used),
        )
        await self._db.execute(
            "INSERT INTO trades VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (t.trade_id, t.condition_id, t.question, t.city, t.market_type,
             t.trade_side, t.entry_price, t.size_usd, t.shares, t.model_prob,
             t.edge, t.confidence, t.status, None, None, None, None,
             t.entry_time, None, t.end_date, t.signal_id, t.models_used))
        await self._db.commit()
        self.bankroll -= t.size_usd
        await self._save_bankroll()
        logger.info(f"[Paper] Opened {t.trade_id} {t.city} {t.trade_side} ${t.size_usd:.2f}")
        return t

    async def close_trade(self, trade_id, exit_price, reason="manual"):
        async with self._db.execute("SELECT * FROM trades WHERE trade_id=? AND status='open'", (trade_id,)) as c:
            row = await c.fetchone()
        if not row: return None
        cols = ["trade_id","condition_id","question","city","market_type","trade_side",
                "entry_price","size_usd","shares","model_prob","edge","confidence",
                "status","exit_price","pnl","pnl_pct","resolved_outcome","entry_time",
                "exit_time","end_date","signal_id","models_used"]
        t = PaperTrade(**dict(zip(cols, row)))
        pnl = (exit_price - t.entry_price) * t.shares
        pnl_pct = pnl / t.size_usd if t.size_usd > 0 else 0
        await self._db.execute(
            "UPDATE trades SET status=?,exit_price=?,pnl=?,pnl_pct=?,exit_time=? WHERE trade_id=?",
            (f"closed_{reason}", exit_price, round(pnl,4), round(pnl_pct,4),
             datetime.now(timezone.utc).isoformat(), trade_id))
        await self._db.commit()
        self.bankroll += t.size_usd + pnl
        await self._save_bankroll()
        t.pnl = round(pnl, 4); t.pnl_pct = round(pnl_pct, 4)
        logger.info(f"[Paper] Closed {trade_id} P&L={pnl:+.2f}")
        return t

    async def get_open(self):
        async with self._db.execute("SELECT * FROM trades WHERE status='open' ORDER BY entry_time DESC") as c:
            rows = await c.fetchall()
        cols = ["trade_id","condition_id","question","city","market_type","trade_side",
                "entry_price","size_usd","shares","model_prob","edge","confidence",
                "status","exit_price","pnl","pnl_pct","resolved_outcome","entry_time",
                "exit_time","end_date","signal_id","models_used"]
        return [PaperTrade(**dict(zip(cols,r))) for r in rows]

    async def get_stats(self):
        async with self._db.execute("SELECT pnl,size_usd FROM trades WHERE status!='open' AND pnl IS NOT NULL") as c:
            rows = await c.fetchall()
        if not rows: return {"error":"No closed trades yet. Run /scan to find signals."}
        pnls = [r[0] for r in rows]
        wins = [p for p in pnls if p > 0]
        losses = [p for p in pnls if p <= 0]
        total = sum(pnls)
        wr = len(wins)/len(pnls)
        pf = abs(sum(wins)/sum(losses)) if losses and sum(losses) != 0 else 99.0
        roi = (self.bankroll - self.initial_bankroll) / self.initial_bankroll
        open_pos = await self.get_open()
        ready = wr >= float(os.getenv("WINRATE_THRESHOLD","0.55")) and len(pnls) >= int(os.getenv("MIN_PAPER_TRADES","50"))
        return {
            "total_trades": len(pnls), "open_positions": len(open_pos),
            "win_rate": round(wr,4), "total_pnl": round(total,2),
            "avg_win": round(sum(wins)/len(wins),2) if wins else 0,
            "avg_loss": round(sum(losses)/len(losses),2) if losses else 0,
            "profit_factor": round(pf,2), "roi": round(roi,4),
            "current_bankroll": round(self.bankroll,2),
            "initial_bankroll": self.initial_bankroll, "ready_for_live": ready,
        }

    async def close(self):
        if self._db: await self._db.close()


# ════════════════════════════════════════════════════════════════
#  FORMATTERS
# ════════════════════════════════════════════════════════════════
def fmt_signal(s):
    ce = {"high":"🟢","medium":"🟡","low":"🔴"}.get(s.confidence,"⚪")
    se = "📈" if s.trade_side=="YES" else "📉"
    return (
        f"🌦️ *Signal* `{s.signal_id}` — {ce} {s.confidence.upper()}\n\n"
        f"📍 *{s.city}* — {s.market_type}\n"
        f"❓ _{s.question[:80]}_\n\n"
        f"🤖 Model: `{s.model_prob:.1%}` vs Market: `{s.market_prob:.1%}`\n"
        f"📐 Edge: `{s.edge:+.1%}` | Models: `{', '.join(s.models_used)}`\n\n"
        f"{se} Trade *{s.trade_side}* @ `${s.trade_price:.3f}` — Size: `${s.recommended_size_usd:.2f}`\n"
        f"💰 Expected Value: `${s.expected_value:.2f}`"
    )

def fmt_stats(st):
    we = "🟢" if st.get("win_rate",0) >= 0.55 else "🔴"
    pe = "📈" if st.get("total_pnl",0) >= 0 else "📉"
    ready = "✅ READY FOR LIVE" if st.get("ready_for_live") else "📄 Keep paper trading (need ≥50 trades + ≥55% WR)"
    return (
        f"📊 *Paper Trading Stats*\n\n"
        f"💵 Bankroll: `${st['current_bankroll']:,.2f}` / `${st['initial_bankroll']:,.2f}`\n"
        f"{pe} P&L: `${st['total_pnl']:+,.2f}` ({st['roi']:+.1%} ROI)\n\n"
        f"📋 Trades: `{st['total_trades']}` | Open: `{st['open_positions']}`\n"
        f"{we} Win Rate: `{st['win_rate']:.1%}`\n"
        f"✅ Avg Win: `${st['avg_win']:+.2f}` | ❌ Avg Loss: `${st['avg_loss']:+.2f}`\n"
        f"⚖️ Profit Factor: `{st['profit_factor']:.2f}`\n\n"
        f"*Status:* {ready}"
    )


# ════════════════════════════════════════════════════════════════
#  TELEGRAM BOT
# ════════════════════════════════════════════════════════════════
def _allowed(uid):
    raw = os.getenv("TELEGRAM_ALLOWED_USERS","")
    if not raw: return True
    return uid in [int(x.strip()) for x in raw.split(",") if x.strip()]

def main_kb():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🔍 Scan Markets", callback_data="scan"),
         InlineKeyboardButton("📊 Signals", callback_data="signals")],
        [InlineKeyboardButton("💼 Portfolio", callback_data="portfolio"),
         InlineKeyboardButton("📄 Paper Stats", callback_data="paper")],
        [InlineKeyboardButton("⚙️ Config", callback_data="config"),
         InlineKeyboardButton("❓ Help", callback_data="help")],
    ])

def signal_kb(sid):
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("✅ Paper Trade", callback_data=f"pt_{sid}"),
         InlineKeyboardButton("⏭ Skip", callback_data="signals")],
        [InlineKeyboardButton("◀️ Menu", callback_data="menu")],
    ])


class Bot:
    def __init__(self, engine, portfolio):
        self.engine = engine
        self.portfolio = portfolio
        self._cache: list[TradingSignal] = []
        self._alerts = True
        self.app = None

    async def _check_auth(self, update):
        if not _allowed(update.effective_user.id):
            await update.effective_message.reply_text("⛔ Not authorized.")
            return False
        return True

    async def cmd_start(self, u: Update, c: ContextTypes.DEFAULT_TYPE):
        if not await self._check_auth(u): return
        await u.message.reply_text(
            f"🌦️ *PolyWeather Bot* — Active\n\n"
            f"📄 Mode: *{TRADING_MODE.upper()}*\n"
            f"💵 Bankroll: *${self.portfolio.bankroll:,.2f}*\n\n"
            f"GFS 31-member + ECMWF IFS → Kelly sizing on Polymarket weather markets.\n\n"
            f"Select an action:",
            parse_mode="Markdown", reply_markup=main_kb()
        )

    async def cmd_scan(self, u: Update, c: ContextTypes.DEFAULT_TYPE):
        if not await self._check_auth(u): return
        msg = await u.message.reply_text("🔍 Scanning Polymarket weather markets... ⏳")
        try:
            signals = await self.engine.scan_and_rank(self.portfolio.bankroll)
            self._cache = signals
            await msg.edit_text(f"✅ Found *{len(signals)}* signal(s) with edge ≥ {MIN_EDGE:.0%}", parse_mode="Markdown")
            for s in signals[:3]:
                await u.message.reply_text(fmt_signal(s), parse_mode="Markdown", reply_markup=signal_kb(s.signal_id))
                await asyncio.sleep(0.3)
        except Exception as e:
            await msg.edit_text(f"❌ Scan error: {e}")

    async def cmd_portfolio(self, u: Update, c: ContextTypes.DEFAULT_TYPE):
        if not await self._check_auth(u): return
        pos = await self.portfolio.get_open()
        if not pos:
            await u.message.reply_text("💼 No open positions.", reply_markup=main_kb())
            return
        txt = f"💼 *Open Positions ({len(pos)})*\n\n"
        for t in pos:
            txt += f"• `{t.trade_id}` {t.city} {t.trade_side} @ ${t.entry_price:.3f} | ${t.size_usd:.2f} | edge={t.edge:+.1%}\n"
        await u.message.reply_text(txt, parse_mode="Markdown", reply_markup=main_kb())

    async def cmd_paper(self, u: Update, c: ContextTypes.DEFAULT_TYPE):
        if not await self._check_auth(u): return
        st = await self.portfolio.get_stats()
        txt = st.get("error", fmt_stats(st)) if "error" in st else fmt_stats(st)
        await u.message.reply_text(txt, parse_mode="Markdown", reply_markup=main_kb())

    async def cmd_signals(self, u: Update, c: ContextTypes.DEFAULT_TYPE):
        if not await self._check_auth(u): return
        if not self._cache:
            await u.message.reply_text("No signals cached. Use /scan first.", reply_markup=main_kb())
            return
        for s in self._cache[:5]:
            await u.message.reply_text(fmt_signal(s), parse_mode="Markdown", reply_markup=signal_kb(s.signal_id))
            await asyncio.sleep(0.3)

    async def cmd_help(self, u: Update, c: ContextTypes.DEFAULT_TYPE):
        if not await self._check_auth(u): return
        await u.message.reply_text(
            "❓ *Commands*\n\n"
            "/start — Welcome\n/scan — Scan markets\n/signals — View signals\n"
            "/portfolio — Open positions\n/paper — Paper stats\n/help — This",
            parse_mode="Markdown", reply_markup=main_kb()
        )

    async def callback(self, u: Update, c: ContextTypes.DEFAULT_TYPE):
        if not await self._check_auth(u): return
        q = u.callback_query
        await q.answer()
        d = q.data

        if d == "scan":
            await q.edit_message_text("🔍 Scanning... ⏳")
            try:
                signals = await self.engine.scan_and_rank(self.portfolio.bankroll)
                self._cache = signals
                await q.edit_message_text(f"✅ *{len(signals)}* signal(s) found.", parse_mode="Markdown",
                    reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("📊 View Signals", callback_data="signals")],[InlineKeyboardButton("◀️ Menu", callback_data="menu")]]))
            except Exception as e:
                await q.edit_message_text(f"❌ Error: {e}", reply_markup=main_kb())

        elif d == "signals":
            if not self._cache:
                await q.edit_message_text("No signals. Press Scan first.", reply_markup=main_kb()); return
            txt = f"📊 *Top {min(5,len(self._cache))} Signals*\n\n"
            for i,s in enumerate(self._cache[:5],1):
                ce = {"high":"🟢","medium":"🟡","low":"🔴"}.get(s.confidence,"⚪")
                txt += f"{i}. {ce} *{s.city}* {s.trade_side} | Edge: `{s.edge:+.1%}` | EV: `${s.expected_value:.2f}`\n"
            await q.edit_message_text(txt, parse_mode="Markdown", reply_markup=main_kb())

        elif d == "portfolio":
            pos = await self.portfolio.get_open()
            txt = f"💼 *{len(pos)} Open Position(s)*\n\n" + "".join(f"• `{t.trade_id}` {t.city} {t.trade_side} ${t.size_usd:.2f}\n" for t in pos) if pos else "💼 No open positions."
            await q.edit_message_text(txt, parse_mode="Markdown", reply_markup=main_kb())

        elif d == "paper":
            st = await self.portfolio.get_stats()
            txt = st.get("error","") if "error" in st else fmt_stats(st)
            await q.edit_message_text(txt, parse_mode="Markdown", reply_markup=main_kb())

        elif d == "config":
            await q.edit_message_text(
                f"⚙️ *Config*\n\nMode: `{TRADING_MODE}` | Edge: `{MIN_EDGE:.0%}` | Kelly: `{KELLY_FRACTION:.0%}`\n"
                f"Max $: `${MAX_POS_USD:.0f}` | Max %: `{MAX_POS_PCT:.0%}` | Scan: `{SCAN_INTERVAL}min`",
                parse_mode="Markdown", reply_markup=main_kb())

        elif d == "help":
            await q.edit_message_text("/scan /signals /portfolio /paper /help", reply_markup=main_kb())

        elif d == "menu":
            await q.edit_message_text(
                f"📋 *Menu* | Bankroll: `${self.portfolio.bankroll:,.2f}`",
                parse_mode="Markdown", reply_markup=main_kb())

        elif d.startswith("pt_"):
            sid = d[3:]
            s = next((x for x in self._cache if x.signal_id == sid), None)
            if not s:
                await q.edit_message_text("Signal expired. Rescan.", reply_markup=main_kb()); return
            t = await self.portfolio.open_trade(s)
            if t:
                await q.edit_message_text(
                    f"✅ *Paper Trade Opened*\n\n`{t.trade_id}` — {t.city} {t.trade_side}\n"
                    f"Entry: `${t.entry_price:.3f}` | Size: `${t.size_usd:.2f}` | Edge: `{t.edge:+.1%}`",
                    parse_mode="Markdown", reply_markup=main_kb())
            else:
                await q.edit_message_text("❌ Could not open (duplicate or low bankroll).", reply_markup=main_kb())

    async def broadcast(self, signal, user_ids):
        if not self._alerts or not self.app: return
        for uid in user_ids:
            try:
                await self.app.bot.send_message(uid, fmt_signal(signal), parse_mode="Markdown", reply_markup=signal_kb(signal.signal_id))
            except Exception as e:
                logger.warning(f"[Bot] broadcast to {uid}: {e}")

    def build(self, token):
        self.app = Application.builder().token(token).build()
        for cmd, handler in [
            ("start", self.cmd_start), ("scan", self.cmd_scan),
            ("signals", self.cmd_signals), ("portfolio", self.cmd_portfolio),
            ("paper", self.cmd_paper), ("help", self.cmd_help),
        ]:
            self.app.add_handler(CommandHandler(cmd, handler))
        self.app.add_handler(CallbackQueryHandler(self.callback))
        return self.app


# ════════════════════════════════════════════════════════════════
#  ORCHESTRATOR
# ════════════════════════════════════════════════════════════════
class Orchestrator:
    def __init__(self):
        self.engine    = ProbEngine()
        self.portfolio = PaperPortfolio()
        self.bot       = Bot(self.engine, self.portfolio)
        self.scheduler = AsyncIOScheduler(timezone="UTC")
        self._users    = [int(x.strip()) for x in os.getenv("TELEGRAM_ALLOWED_USERS","").split(",") if x.strip()]

    async def _scan_job(self):
        logger.info(f"[Scheduler] Scan @ {datetime.now(timezone.utc).strftime('%H:%M UTC')}")
        try:
            signals = await self.engine.scan_and_rank(self.portfolio.bankroll)
            self.bot._cache = signals
            for s in signals[:3]:
                await self.bot.broadcast(s, self._users)
            for s in signals:
                if s.confidence == "high" and abs(s.edge) >= 0.12:
                    await self.portfolio.open_trade(s)
        except Exception as e:
            logger.error(f"[Scheduler] scan error: {e}", exc_info=True)

    async def _exit_job(self):
        for pos in await self.portfolio.get_open():
            try:
                r = await self.engine.check_exit(pos)
                if r["action"] != "hold":
                    exit_price = pos.entry_price * (1.05 if r["action"]=="close_profit" else 0.97)
                    closed = await self.portfolio.close_trade(pos.trade_id, exit_price, r["action"])
                    if closed:
                        for uid in self._users:
                            try:
                                await self.bot.app.bot.send_message(uid,
                                    f"🔔 Closed `{closed.trade_id}` — {r['reason']}\nP&L: `${closed.pnl:+.2f}`",
                                    parse_mode="Markdown")
                            except: pass
            except Exception as e:
                logger.warning(f"[Exit] {pos.trade_id}: {e}")

    async def run(self):
        logger.info("=" * 55)
        logger.info("🌦️  PolyWeather Bot — Starting")
        logger.info(f"   Mode: {TRADING_MODE.upper()} | Scan: {SCAN_INTERVAL}min")
        logger.info("=" * 55)

        token = os.getenv("TELEGRAM_BOT_TOKEN","").strip()
        if not token:
            logger.error("❌ TELEGRAM_BOT_TOKEN is empty. Go to Railway → Variables and add it, then redeploy.")
            sys.exit(1)
        if len(token) < 20 or ":" not in token:
            logger.error(f"❌ TELEGRAM_BOT_TOKEN looks invalid (got {len(token)} chars). Check Railway Variables.")
            sys.exit(1)
        logger.info(f"[Init] Token loaded: ...{token[-8:]}")

        await self.portfolio.init_db()

        self.scheduler.add_job(self._scan_job, "interval", minutes=SCAN_INTERVAL,
            id="scan", next_run_time=datetime.now(timezone.utc))
        self.scheduler.add_job(self._exit_job, "interval", minutes=EXIT_INTERVAL, id="exit")
        self.scheduler.start()

        app = self.bot.build(token)
        try:
            await app.initialize()
            await app.start()
            await app.updater.start_polling(drop_pending_updates=True)
            logger.info("✅ Bot running — send /start in Telegram")
            while True:
                await asyncio.sleep(60)
        except (KeyboardInterrupt, SystemExit):
            logger.info("Shutting down...")
        finally:
            try:
                await app.updater.stop(); await app.stop(); await app.shutdown()
            except: pass
            self.scheduler.shutdown(wait=False)
            await self.engine.close()
            await self.portfolio.close()
            logger.info("Done.")


# ════════════════════════════════════════════════════════════════
#  ENTRY POINT
# ════════════════════════════════════════════════════════════════
async def main():
    await Orchestrator().run()

if __name__ == "__main__":
    asyncio.run(main())
