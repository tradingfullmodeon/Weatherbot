"""
PolyWeather Bot — Complete single-file Railway deployment.
"""
import asyncio, os, sys, re, uuid, json, math
from datetime import datetime, timezone
from typing import Optional
from dataclasses import dataclass, field

from dotenv import load_dotenv

# ── Hardcoded fallback defaults (used when Railway doesn't inject vars) ──────
_DEFAULTS = {
    "TELEGRAM_BOT_TOKEN":    "8794924683:AAHpPFPSd2HJrbpLlUgVcU2Z1trVHFCjvus",
    "TELEGRAM_ALLOWED_USERS":"1354452347",
    "TRADING_MODE":          "paper",
    "PAPER_BANKROLL":        "1000",
    "MIN_EDGE":              "0.08",
    "KELLY_FRACTION":        "0.15",
    "MAX_POSITION_USD":      "100",
    "MAX_POSITION_PCT":      "0.05",
    "SCAN_INTERVAL_MINUTES": "5",
    "EXIT_CHECK_MINUTES":    "15",
    "MIN_LIQUIDITY_USD":     "50",
    "LOG_LEVEL":             "INFO",
    "PAPER_DB_PATH":         "/app/logs/paper.db",
}

def _load_envs():
    for src in [".env", ".env.runtime", "/app/.env", "/app/.env.runtime", "/etc/environment"]:
        try: load_dotenv(src, override=False)
        except Exception: pass
    try:
        with open("/proc/1/environ", "rb") as f:
            for entry in f.read().split(b"\x00"):
                try:
                    k, v = entry.decode("utf-8", errors="replace").split("=", 1)
                    if k.strip() and k not in os.environ: os.environ[k] = v
                except ValueError: pass
    except Exception: pass
    for k, v in _DEFAULTS.items():
        if not os.environ.get(k): os.environ[k] = v

_load_envs()

from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential
import httpx
import numpy as np
from scipy.special import expit
import aiosqlite
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logger.remove()
logger.add(sys.stderr, level=LOG_LEVEL, colorize=True,
           format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")
os.makedirs("logs", exist_ok=True)
logger.add("logs/bot.log", rotation="10 MB", retention="7 days", level="DEBUG")

# ══════════════════════════════════════════════════════════════════
#  CONFIG
# ══════════════════════════════════════════════════════════════════
GAMMA_BASE        = "https://gamma-api.polymarket.com"
OPEN_METEO_ENS    = "https://ensemble-api.open-meteo.com/v1/ensemble"
OPEN_METEO_FC     = "https://api.open-meteo.com/v1/forecast"

MIN_EDGE      = float(os.getenv("MIN_EDGE", "0.08"))
KELLY_FRAC    = float(os.getenv("KELLY_FRACTION", "0.15"))
MAX_POS_USD   = float(os.getenv("MAX_POSITION_USD", "100"))
MAX_POS_PCT   = float(os.getenv("MAX_POSITION_PCT", "0.05"))
MIN_LIQ       = float(os.getenv("MIN_LIQUIDITY_USD", "50"))
SCAN_INT      = int(os.getenv("SCAN_INTERVAL_MINUTES", "5"))
EXIT_INT      = int(os.getenv("EXIT_CHECK_MINUTES", "15"))
PAPER_BR      = float(os.getenv("PAPER_BANKROLL", "1000"))
TRADING_MODE  = os.getenv("TRADING_MODE", "paper")
DB_PATH       = os.getenv("PAPER_DB_PATH", "/app/logs/paper.db")

CITY_COORDS = {
    "New York":(40.7128,-74.0060),"Los Angeles":(34.0522,-118.2437),
    "Chicago":(41.8781,-87.6298),"Miami":(25.7617,-80.1918),
    "Houston":(29.7604,-95.3698),"Phoenix":(33.4484,-112.0740),
    "Dallas":(32.7767,-96.7970),"Atlanta":(33.7490,-84.3880),
    "Seattle":(47.6062,-122.3321),"Denver":(39.7392,-104.9903),
    "Las Vegas":(36.1699,-115.1398),"Boston":(42.3601,-71.0589),
    "San Francisco":(37.7749,-122.4194),"Portland":(45.5051,-122.6750),
    "Minneapolis":(44.9778,-93.2650),"Nashville":(36.1627,-86.7816),
    "Austin":(30.2672,-97.7431),"Philadelphia":(39.9526,-75.1652),
    "Washington":(38.9072,-77.0369),"Detroit":(42.3314,-83.0457),
    "London":(51.5074,-0.1278),"Tokyo":(35.6762,139.6503),
    "Paris":(48.8566,2.3522),"Sydney":(-33.8688,151.2093),
    "Toronto":(43.6532,-79.3832),"Dubai":(25.2048,55.2708),
    "Singapore":(1.3521,103.8198),"New Orleans":(29.9511,-90.0715),
    "Kansas City":(39.0997,-94.5786),"Tampa":(27.9506,-82.4572),
    "Orlando":(28.5383,-81.3792),"Charlotte":(35.2271,-80.8431),
    "Sacramento":(38.5816,-121.4944),"Salt Lake City":(40.7608,-111.8910),
    "Raleigh":(35.7796,-78.6382),"Memphis":(35.1495,-90.0490),
    "Indianapolis":(39.7684,-86.1581),"Columbus":(39.9612,-82.9988),
    "Cincinnati":(39.1031,-84.5120),"Pittsburgh":(40.4406,-79.9959),
    "St. Louis":(38.6270,-90.1994),"Oklahoma City":(35.4676,-97.5164),
    "San Diego":(32.7157,-117.1611),"San Jose":(37.3382,-121.8863),
    "Jacksonville":(30.3322,-81.6557),"Baltimore":(39.2904,-76.6122),
    "Milwaukee":(43.0389,-87.9065),"Albuquerque":(35.0844,-106.6504),
    "Tucson":(32.2226,-110.9747),"Honolulu":(21.3069,-157.8583),
    "Anchorage":(61.2181,-149.9003),"El Paso":(31.7619,-106.4850),
}
CITY_ALIASES = {
    "new york city":"New York","nyc":"New York","new york, ny":"New York",
    "los angeles":"Los Angeles","san francisco":"San Francisco","sf":"San Francisco",
    "washington dc":"Washington","washington, dc":"Washington","d.c.":"Washington",
    "st louis":"St. Louis","salt lake":"Salt Lake City",
    "new orleans":"New Orleans","kansas city":"Kansas City",
}

# ══════════════════════════════════════════════════════════════════
#  DATA MODELS
# ══════════════════════════════════════════════════════════════════
@dataclass
class Signal:
    signal_id: str; condition_id: str; question: str; city: str
    market_type: str; threshold_f: Optional[float]
    yes_token_id: str; no_token_id: str
    yes_price: float; no_price: float
    model_prob: float; market_prob: float; edge: float
    trade_side: str; trade_token_id: str; trade_price: float
    kelly_fraction: float; recommended_size_usd: float; expected_value: float
    ensemble_members: int; model_spread_f: float; confidence: str; models_used: list
    end_date: str = ""
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

@dataclass
class Trade:
    trade_id: str; condition_id: str; question: str; city: str; market_type: str
    trade_side: str; entry_price: float; size_usd: float; shares: float
    model_prob: float; edge: float; confidence: str
    status: str = "open"
    exit_price: Optional[float] = None; pnl: Optional[float] = None
    pnl_pct: Optional[float] = None; resolved_outcome: Optional[str] = None
    entry_time: str = ""; exit_time: Optional[str] = None
    end_date: str = ""; signal_id: str = ""; models_used: str = ""

# ══════════════════════════════════════════════════════════════════
#  MARKET PARSING HELPERS
# ══════════════════════════════════════════════════════════════════
def _threshold(q):
    for pat in [r'(?:exceed|above|reach|over|below|under)\s+(\d+\.?\d*)',
                r'(\d+\.?\d*)\s*\xb0[fc]', r'(\d+\.?\d*)\s*degrees']:
        m = re.search(pat, q.lower())
        if m: return float(m.group(1))
    return None

def _city(question):
    q = question.lower()
    for alias in sorted(CITY_ALIASES, key=len, reverse=True):
        if alias in q: return CITY_ALIASES[alias]
    for city in sorted(CITY_COORDS, key=len, reverse=True):
        if city.lower() in q: return city
    return None

def _mtype(q):
    q = q.lower()
    if any(k in q for k in ["\xb0f","\xb0c","temperature","high temp","low temp","degrees"]): return "temperature"
    if any(k in q for k in ["rain","precipitation","snow","flood","rainfall"]): return "precipitation"
    if "hurricane" in q or "typhoon" in q: return "hurricane"
    if "tornado" in q: return "tornado"
    return "general"

def _token(market, outcome):
    for t in market.get("tokens",[]):
        if outcome.lower() in str(t.get("outcome","")).lower(): return t.get("token_id","")
    tokens = market.get("tokens",[])
    if outcome=="yes" and tokens: return tokens[0].get("token_id","")
    if outcome=="no" and len(tokens)>1: return tokens[1].get("token_id","")
    cids = market.get("clobTokenIds",[])
    if isinstance(cids, list):
        if outcome=="yes" and cids: return str(cids[0])
        if outcome=="no" and len(cids)>1: return str(cids[1])
    return ""

def parse_markets(markets):
    parsed = []; sk = {"no_city":0,"no_thr":0,"no_price":0}

    for m in markets:
        # Check all possible question/title fields
        q = (m.get("question") or m.get("title") or m.get("name") or
             m.get("groupItemTitle") or m.get("subtitle") or "")
        if not q:
            continue

        # Try to find a city in the question
        city = _city(q)
        if not city:
            # Also check description/resolution_source for city names
            desc = m.get("description","") or m.get("resolutionSource","") or ""
            city = _city(desc)
        if not city:
            sk["no_city"] += 1
            continue

        mt = _mtype(q)
        thr = _threshold(q)

        # For non-temperature markets, threshold is optional
        if thr is None:
            if mt in ("precipitation","hurricane","tornado","wind","general"):
                thr = 0.0
            else:
                # Still try: look for any number that might be a threshold
                nums = re.findall(r'(\d{2,3})', q)
                plausible = [float(n) for n in nums if 32 <= float(n) <= 130]
                thr = plausible[0] if plausible else None

            if thr is None:
                sk["no_thr"] += 1
                continue

        # Parse prices
        prices = m.get("outcomePrices",[])
        try:
            if isinstance(prices,list) and len(prices)>=2:
                yp,np_=float(prices[0]),float(prices[1])
            elif isinstance(prices,str):
                pl=json.loads(prices); yp,np_=float(pl[0]),float(pl[1])
            else:
                yp,np_=0.5,0.5
        except Exception:
            yp,np_=0.5,0.5

        # Sanity check on prices
        if not (0.01 <= yp <= 0.99):
            sk["no_price"] += 1
            continue

        parsed.append({
            "condition_id": m.get("conditionId","") or m.get("condition_id",""),
            "question": q,
            "yes_token_id": _token(m,"yes"), "no_token_id": _token(m,"no"),
            "yes_price": yp, "no_price": np_,
            "volume":    float(m.get("volume",0) or 0),
            "liquidity": float(m.get("liquidity",0) or 0),
            "end_date":  m.get("endDate","") or m.get("end_date",""),
            "city": city, "threshold_f": thr, "market_type": mt,
        })

    logger.info(
        f"[Parser] {len(markets)} total -> {len(parsed)} parsed "
        f"(no_city={sk['no_city']}, no_thr={sk['no_thr']}, no_price={sk['no_price']})"
    )
    return parsed

# ══════════════════════════════════════════════════════════════════
#  POLYMARKET CLIENT
# ══════════════════════════════════════════════════════════════════
class GammaClient:
    def __init__(self): self.s = httpx.AsyncClient(timeout=30)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2,max=10))
    async def _fetch(self, tag, limit=200, offset=0):
        r = await self.s.get(f"{GAMMA_BASE}/markets", params={
            "tag":tag,"active":"true","closed":"false","limit":limit,"offset":offset})
        r.raise_for_status()
        d = r.json(); return d if isinstance(d,list) else d.get("markets",[])

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2,max=10))
    async def _search(self, query, limit=100):
        """Search markets by question text."""
        r = await self.s.get(f"{GAMMA_BASE}/markets", params={
            "q": query, "active": "true", "closed": "false", "limit": limit})
        if r.status_code == 200 and r.content:
            d = r.json()
            return d if isinstance(d, list) else d.get("markets", [])
        # Fallback: fetch all and filter client-side
        r2 = await self.s.get(f"{GAMMA_BASE}/markets", params={
            "active": "true", "closed": "false", "limit": limit})
        r2.raise_for_status()
        d2 = r2.json()
        all_m = d2 if isinstance(d2, list) else d2.get("markets", [])
        q_lower = query.lower()
        return [m for m in all_m if q_lower in (m.get("question","") or "").lower()]

    async def get_weather_markets(self):
        all_m=[]; seen=set()
        
        # Strategy 1: Search by weather-related query strings
        QUERIES = [
            "temperature", "degrees", "rainfall", "precipitation",
            "hurricane", "tornado", "snow", "heat wave", "blizzard",
            "high temperature", "low temperature", "weather",
        ]
        for q in QUERIES:
            try:
                batch = await self._search(q, 50)
                all_m.extend(batch)
            except Exception as e:
                logger.debug(f"[Gamma] search '{q}' failed: {e}")

        # Strategy 2: Also try tag-based (in case some still work)
        for tag in ["weather", "climate"]:
            try:
                batch = await self._fetch(tag, 100, 0)
                all_m.extend(batch)
            except Exception as e:
                logger.debug(f"[Gamma] tag '{tag}' failed: {e}")

        # Deduplicate
        unique = []
        for m in all_m:
            cid = m.get("conditionId","")
            if cid and cid not in seen:
                seen.add(cid); unique.append(m)

        # Filter: only keep markets whose question contains weather keywords
        WEATHER_KW = ["temperature","degrees","°f","°c","rain","snow","hurricane",
                      "tornado","heat","cold","wind","precipitation","weather",
                      "blizzard","frost","flood","drought","wildfire","storm"]
        weather = [m for m in unique
                   if any(k in (m.get("question","") or "").lower() for k in WEATHER_KW)]

        logger.info(f"[Gamma] {len(unique)} total, {len(weather)} weather-specific")
        for m in weather[:5]:
            q = m.get("question","") or "(no question)"
            liq = float(m.get("liquidity",0) or 0)
            logger.info(f"[Gamma] ✓ {q[:80]} (liq=${liq:.0f})")
        return weather

    async def close(self): await self.s.aclose()

# ══════════════════════════════════════════════════════════════════
#  WEATHER ENGINE
# ══════════════════════════════════════════════════════════════════
class WeatherEngine:
    def __init__(self): self.s = httpx.AsyncClient(timeout=30)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2,max=10))
    async def _ensemble(self, lat, lon, days=7):
        r = await self.s.get(OPEN_METEO_ENS, params={
            "latitude":lat,"longitude":lon,"models":"gfs_seamless",
            "hourly":"temperature_2m","forecast_days":days,
            "temperature_unit":"fahrenheit","timezone":"auto"})
        r.raise_for_status(); return r.json()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2,max=10))
    async def _forecast(self, lat, lon, days=7):
        r = await self.s.get(OPEN_METEO_FC, params={
            "latitude":lat,"longitude":lon,
            "models":"ecmwf_ifs_analysis_long_window",
            "daily":"temperature_2m_max,temperature_2m_min,precipitation_sum",
            "hourly":"precipitation_probability",
            "forecast_days":days,"temperature_unit":"fahrenheit","timezone":"auto"})
        r.raise_for_status(); return r.json()

    async def prob(self, city, threshold_f, direction="above", target_date=None, market_type="temperature"):
        lat,lon = CITY_COORDS.get(city,(40.7128,-74.0060))
        probs=[]; members=[]

        # GFS ensemble
        try:
            data = await self._ensemble(lat,lon)
            h=data.get("hourly",{}); times=h.get("time",[])
            mkeys=[k for k in h if k.startswith("temperature_2m_member")] or ["temperature_2m"]
            maxes=[]
            for k in mkeys:
                vals=h.get(k,[])
                dv=[v for t,v in zip(times,vals) if t and (t.startswith(target_date) if target_date else True) and v is not None]
                if not dv and not target_date: dv=[v for v in vals[:24] if v is not None]
                if dv: maxes.append(max(dv))
            if maxes:
                hitting=sum(1 for v in maxes if (v>threshold_f if direction=="above" else v<threshold_f))
                probs.append(("gfs", hitting/len(maxes), 3.0)); members.extend(maxes)
        except Exception as e: logger.warning(f"[GFS] {city}: {e}")

        # ECMWF
        try:
            data = await self._forecast(lat,lon)
            if market_type=="precipitation":
                # Use precipitation probability directly
                h=data.get("hourly",{}); times=h.get("time",[])
                pp=h.get("precipitation_probability",[])
                if target_date:
                    day_pp=[v for t,v in zip(times,pp) if t and t.startswith(target_date) and v is not None]
                else:
                    day_pp=[v for v in pp[:24] if v is not None]
                if day_pp:
                    avg_pp=sum(day_pp)/len(day_pp)/100.0
                    probs.append(("ecmwf_precip", avg_pp, 2.0))
            else:
                daily=data.get("daily",{}); times2=daily.get("time",[])
                maxes2=daily.get("temperature_2m_max",[])
                if times2 and maxes2:
                    idx_list=[i for i,t in enumerate(times2) if t==target_date] if target_date else []
                    idx=idx_list[0] if idx_list else (1 if len(times2)>1 else 0)
                    val=maxes2[idx] if idx<len(maxes2) and maxes2[idx] is not None else None
                    if val is not None:
                        z=(val-threshold_f)/5.0
                        p=float(expit(z)) if direction=="above" else float(1-expit(z))
                        probs.append(("ecmwf", p, 2.0))
        except Exception as e: logger.warning(f"[ECMWF] {city}: {e}")

        if not probs: return None
        tw=sum(w for _,_,w in probs)
        mp=sum(w*p for _,p,w in probs)/tw
        spread=float(np.std(members)) if members else 0.0
        e50=abs(mp-0.5)
        conf=("high" if spread<3 and e50>0.25 else "medium" if spread<6 and e50>0.1 else "low")
        return {"model_prob":round(mp,4),"ensemble_members":len(members) or 31,
                "model_spread_f":round(spread,2),"confidence":conf,
                "models_used":[n for n,_,_ in probs]}

    async def close(self): await self.s.aclose()

# ══════════════════════════════════════════════════════════════════
#  PROB ENGINE
# ══════════════════════════════════════════════════════════════════
class ProbEngine:
    def __init__(self): self.gamma=GammaClient(); self.wx=WeatherEngine()

    async def scan(self, bankroll):
        logger.info("[Engine] Scanning markets...")
        raw=await self.gamma.get_weather_markets()
        markets=parse_markets(raw)
        actionable=[m for m in markets if m["liquidity"]>=MIN_LIQ and m["yes_token_id"]]
        logger.info(f"[Engine] {len(markets)} parsed, {len(actionable)} actionable")
        signals=[]
        for i in range(0,len(actionable),5):
            batch=actionable[i:i+5]
            res=await asyncio.gather(*[self._analyze(m,bankroll) for m in batch],return_exceptions=True)
            for r in res:
                if isinstance(r,Signal): signals.append(r)
        qualified=[s for s in signals if abs(s.edge)>=MIN_EDGE]
        qualified.sort(key=lambda s:s.expected_value,reverse=True)
        logger.info(f"[Engine] {len(qualified)} signals with edge >= {MIN_EDGE:.0%}")
        return qualified

    async def _analyze(self, market, bankroll):
        city=market["city"]; thr=market["threshold_f"]; q=market["question"]
        direction="below" if any(k in q.lower() for k in ["below","under","not reach"]) else "above"
        td=None
        if market.get("end_date"):
            try:
                dt=datetime.fromisoformat(market["end_date"].replace("Z","+00:00"))
                td=dt.strftime("%Y-%m-%d")
            except Exception: pass
        wr=await self.wx.prob(city,thr,direction,td,market["market_type"])
        if not wr: return None
        mp=wr["model_prob"]; yp=market["yes_price"]
        ey=mp-yp; en=(1-mp)-market["no_price"]
        if abs(ey)>=abs(en): edge,side,price,tok=ey,"YES",yp,market["yes_token_id"]
        else: edge,side,price,tok=en,"NO",market["no_price"],market["no_token_id"]
        if abs(edge)<MIN_EDGE or price<=0: return None
        wp=mp if side=="YES" else (1-mp); odds=(1/price)-1
        if odds<=0: return None
        kf=max(0,(wp*odds-(1-wp))/odds*KELLY_FRAC)
        size=min(kf*bankroll,MAX_POS_USD,bankroll*MAX_POS_PCT); size=max(1.0,size)
        ev=wp*size*odds-(1-wp)*size
        return Signal(signal_id=str(uuid.uuid4())[:8],condition_id=market["condition_id"],
            question=q,city=city,market_type=market["market_type"],threshold_f=thr,
            yes_token_id=market["yes_token_id"],no_token_id=market["no_token_id"],
            yes_price=yp,no_price=market["no_price"],model_prob=mp,market_prob=yp,
            edge=edge,trade_side=side,trade_token_id=tok,trade_price=price,
            kelly_fraction=kf,recommended_size_usd=round(size,2),
            expected_value=round(ev,4),ensemble_members=wr.get("ensemble_members",31),
            model_spread_f=wr.get("model_spread_f",0),confidence=wr.get("confidence","medium"),
            models_used=wr.get("models_used",[]),end_date=market.get("end_date",""))

    async def check_exit(self, pos):
        if pos.end_date:
            try:
                dt=datetime.fromisoformat(pos.end_date.replace("Z","+00:00"))
                h=(dt-datetime.now(timezone.utc)).total_seconds()/3600
                if h<2: return {"action":"close_decay","reason":f"Resolves in {h:.1f}h"}
            except Exception: pass
        return {"action":"hold","reason":"Monitoring"}

    async def close(self): await self.gamma.close(); await self.wx.close()

# ══════════════════════════════════════════════════════════════════
#  PAPER PORTFOLIO
# ══════════════════════════════════════════════════════════════════
class Portfolio:
    def __init__(self):
        self.bankroll=PAPER_BR; self.initial=PAPER_BR; self._db=None

    async def init(self):
        os.makedirs(os.path.dirname(DB_PATH) or ".", exist_ok=True)
        self._db=await aiosqlite.connect(DB_PATH)
        await self._db.execute("""CREATE TABLE IF NOT EXISTS trades(
            trade_id TEXT PRIMARY KEY,condition_id TEXT,question TEXT,city TEXT,
            market_type TEXT,trade_side TEXT,entry_price REAL,size_usd REAL,shares REAL,
            model_prob REAL,edge REAL,confidence TEXT,status TEXT DEFAULT 'open',
            exit_price REAL,pnl REAL,pnl_pct REAL,resolved_outcome TEXT,
            entry_time TEXT,exit_time TEXT,end_date TEXT,signal_id TEXT,models_used TEXT)""")
        await self._db.execute("CREATE TABLE IF NOT EXISTS state(key TEXT PRIMARY KEY,value TEXT)")
        await self._db.commit()
        async with self._db.execute("SELECT value FROM state WHERE key='bankroll'") as c:
            row=await c.fetchone()
            if row: self.bankroll=float(row[0])
        logger.info(f"[DB] Bankroll: ${self.bankroll:.2f}")

    async def _save(self):
        await self._db.execute("INSERT OR REPLACE INTO state VALUES('bankroll',?)",(str(self.bankroll),))
        await self._db.commit()

    COLS=["trade_id","condition_id","question","city","market_type","trade_side",
          "entry_price","size_usd","shares","model_prob","edge","confidence","status",
          "exit_price","pnl","pnl_pct","resolved_outcome","entry_time","exit_time",
          "end_date","signal_id","models_used"]

    async def open(self, sig):
        if sig.recommended_size_usd>self.bankroll: return None
        async with self._db.execute("SELECT trade_id FROM trades WHERE condition_id=? AND status='open'",(sig.condition_id,)) as c:
            if await c.fetchone(): return None
        t=Trade(trade_id=str(uuid.uuid4())[:8],condition_id=sig.condition_id,
            question=sig.question,city=sig.city,market_type=sig.market_type,
            trade_side=sig.trade_side,entry_price=sig.trade_price,
            size_usd=sig.recommended_size_usd,
            shares=sig.recommended_size_usd/sig.trade_price,
            model_prob=sig.model_prob,edge=sig.edge,confidence=sig.confidence,
            entry_time=datetime.now(timezone.utc).isoformat(),
            end_date=sig.end_date,signal_id=sig.signal_id,
            models_used=json.dumps(sig.models_used))
        await self._db.execute("INSERT INTO trades VALUES("+",".join(["?"]*22)+")",
            (t.trade_id,t.condition_id,t.question,t.city,t.market_type,t.trade_side,
             t.entry_price,t.size_usd,t.shares,t.model_prob,t.edge,t.confidence,
             t.status,None,None,None,None,t.entry_time,None,t.end_date,t.signal_id,t.models_used))
        await self._db.commit()
        self.bankroll-=t.size_usd; await self._save()
        logger.info(f"[Paper] Opened {t.trade_id} {t.city} {t.trade_side} ${t.size_usd:.2f}")
        return t

    async def close_pos(self, trade_id, exit_price, reason="manual"):
        async with self._db.execute("SELECT * FROM trades WHERE trade_id=? AND status='open'",(trade_id,)) as c:
            row=await c.fetchone()
        if not row: return None
        t=Trade(**dict(zip(self.COLS,row)))
        pnl=(exit_price-t.entry_price)*t.shares; pct=pnl/t.size_usd if t.size_usd>0 else 0
        await self._db.execute("UPDATE trades SET status=?,exit_price=?,pnl=?,pnl_pct=?,exit_time=? WHERE trade_id=?",
            (f"closed_{reason}",exit_price,round(pnl,4),round(pct,4),
             datetime.now(timezone.utc).isoformat(),trade_id))
        await self._db.commit()
        self.bankroll+=t.size_usd+pnl; await self._save()
        t.pnl=round(pnl,4); t.pnl_pct=round(pct,4)
        return t

    async def get_open(self):
        async with self._db.execute("SELECT * FROM trades WHERE status='open' ORDER BY entry_time DESC") as c:
            rows=await c.fetchall()
        return [Trade(**dict(zip(self.COLS,r))) for r in rows]

    async def stats(self):
        async with self._db.execute("SELECT pnl,size_usd FROM trades WHERE status!='open' AND pnl IS NOT NULL") as c:
            rows=await c.fetchall()
        if not rows: return {"error":"No closed trades yet. Use /scan to find signals."}
        pnls=[r[0] for r in rows]; wins=[p for p in pnls if p>0]; losses=[p for p in pnls if p<=0]
        wr=len(wins)/len(pnls); total=sum(pnls)
        pf=abs(sum(wins)/sum(losses)) if losses and sum(losses)!=0 else 99.0
        roi=(self.bankroll-self.initial)/self.initial
        open_pos=await self.get_open()
        return {"total_trades":len(pnls),"open_positions":len(open_pos),
                "win_rate":round(wr,4),"total_pnl":round(total,2),
                "avg_win":round(sum(wins)/len(wins),2) if wins else 0,
                "avg_loss":round(sum(losses)/len(losses),2) if losses else 0,
                "profit_factor":round(pf,2),"roi":round(roi,4),
                "current_bankroll":round(self.bankroll,2),"initial_bankroll":self.initial,
                "ready":wr>=0.55 and len(pnls)>=50}

    async def close(self):
        if self._db: await self._db.close()

# ══════════════════════════════════════════════════════════════════
#  FORMATTERS
# ══════════════════════════════════════════════════════════════════
def fmt_sig(s):
    ce={"high":"🟢","medium":"🟡","low":"🔴"}.get(s.confidence,"⚪")
    se="📈" if s.trade_side=="YES" else "📉"
    return (f"🌦️ *Signal* `{s.signal_id}` {ce} {s.confidence.upper()}\n\n"
            f"📍 *{s.city}* — {s.market_type}\n"
            f"❓ _{s.question[:80]}_\n\n"
            f"🤖 Model: `{s.model_prob:.1%}` vs Market: `{s.market_prob:.1%}`\n"
            f"📐 Edge: `{s.edge:+.1%}` | Models: `{', '.join(s.models_used)}`\n\n"
            f"{se} *{s.trade_side}* @ `${s.trade_price:.3f}` — Size: `${s.recommended_size_usd:.2f}`\n"
            f"💰 EV: `${s.expected_value:.2f}`")

def fmt_stats(st):
    we="🟢" if st.get("win_rate",0)>=0.55 else "🔴"
    pe="📈" if st.get("total_pnl",0)>=0 else "📉"
    ready="✅ READY FOR LIVE" if st.get("ready") else "📄 Keep paper trading (need ≥50 trades + ≥55% WR)"
    return (f"📊 *Paper Stats*\n\n"
            f"💵 Bankroll: `${st['current_bankroll']:,.2f}` / `${st['initial_bankroll']:,.2f}`\n"
            f"{pe} P&L: `${st['total_pnl']:+,.2f}` ({st['roi']:+.1%} ROI)\n\n"
            f"📋 Trades: `{st['total_trades']}` | Open: `{st['open_positions']}`\n"
            f"{we} Win Rate: `{st['win_rate']:.1%}`\n"
            f"✅ Avg Win: `${st['avg_win']:+.2f}` | ❌ Avg Loss: `${st['avg_loss']:+.2f}`\n"
            f"⚖️ Profit Factor: `{st['profit_factor']:.2f}`\n\n"
            f"*Status:* {ready}")

# ══════════════════════════════════════════════════════════════════
#  TELEGRAM BOT
# ══════════════════════════════════════════════════════════════════
def _ok(uid):
    raw=os.getenv("TELEGRAM_ALLOWED_USERS","")
    if not raw: return True
    return uid in [int(x.strip()) for x in raw.split(",") if x.strip()]

def mk():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🔍 Scan",callback_data="scan"),
         InlineKeyboardButton("📊 Signals",callback_data="signals")],
        [InlineKeyboardButton("💼 Portfolio",callback_data="portfolio"),
         InlineKeyboardButton("📄 Stats",callback_data="paper")],
        [InlineKeyboardButton("⚙️ Config",callback_data="config"),
         InlineKeyboardButton("❓ Help",callback_data="help")],
    ])

def sk(sid):
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("✅ Paper Trade",callback_data=f"pt_{sid}"),
         InlineKeyboardButton("⏭ Skip",callback_data="signals")],
        [InlineKeyboardButton("◀️ Menu",callback_data="menu")],
    ])

class Bot:
    def __init__(self,engine,portfolio):
        self.engine=engine; self.portfolio=portfolio
        self._cache=[]; self._alerts=True; self.app=None

    async def _auth(self,u):
        if not _ok(u.effective_user.id):
            await u.effective_message.reply_text("⛔ Not authorized."); return False
        return True

    async def start(self,u:Update,c:ContextTypes.DEFAULT_TYPE):
        if not await self._auth(u): return
        await u.message.reply_text(
            f"🌦️ *PolyWeather Bot*\n\n📄 Mode: *{TRADING_MODE.upper()}*\n"
            f"💵 Bankroll: *${self.portfolio.bankroll:,.2f}*\n\n"
            f"GFS ensemble + ECMWF → Kelly sizing on Polymarket weather.",
            parse_mode="Markdown",reply_markup=mk())

    async def scan_cmd(self,u:Update,c:ContextTypes.DEFAULT_TYPE):
        if not await self._auth(u): return
        msg=await u.message.reply_text("🔍 Scanning... ⏳")
        try:
            sigs=await self.engine.scan(self.portfolio.bankroll)
            self._cache=sigs
            await msg.edit_text(f"✅ *{len(sigs)}* signal(s) with edge ≥ {MIN_EDGE:.0%}",parse_mode="Markdown")
            for s in sigs[:3]:
                await u.message.reply_text(fmt_sig(s),parse_mode="Markdown",reply_markup=sk(s.signal_id))
                await asyncio.sleep(0.3)
        except Exception as e: await msg.edit_text(f"❌ Error: {e}")

    async def signals_cmd(self,u:Update,c:ContextTypes.DEFAULT_TYPE):
        if not await self._auth(u): return
        if not self._cache: await u.message.reply_text("No signals. Use /scan first.",reply_markup=mk()); return
        for s in self._cache[:5]:
            await u.message.reply_text(fmt_sig(s),parse_mode="Markdown",reply_markup=sk(s.signal_id))
            await asyncio.sleep(0.3)

    async def portfolio_cmd(self,u:Update,c:ContextTypes.DEFAULT_TYPE):
        if not await self._auth(u): return
        pos=await self.portfolio.get_open()
        if not pos: await u.message.reply_text("💼 No open positions.",reply_markup=mk()); return
        txt=f"💼 *Open Positions ({len(pos)})*\n\n"
        for t in pos: txt+=f"• `{t.trade_id}` {t.city} {t.trade_side} @ ${t.entry_price:.3f} | ${t.size_usd:.2f}\n"
        await u.message.reply_text(txt,parse_mode="Markdown",reply_markup=mk())

    async def paper_cmd(self,u:Update,c:ContextTypes.DEFAULT_TYPE):
        if not await self._auth(u): return
        st=await self.portfolio.stats()
        txt=st.get("error","") if "error" in st else fmt_stats(st)
        await u.message.reply_text(txt,parse_mode="Markdown",reply_markup=mk())

    async def help_cmd(self,u:Update,c:ContextTypes.DEFAULT_TYPE):
        if not await self._auth(u): return
        await u.message.reply_text(
            "❓ *Commands*\n\n/start /scan /signals /portfolio /paper /debug /help",
            parse_mode="Markdown",reply_markup=mk())

    async def debug_cmd(self,u:Update,c:ContextTypes.DEFAULT_TYPE):
        if not await self._auth(u): return
        msg = await u.message.reply_text("🔍 Fetching raw markets from Polymarket...")
        try:
            raw = await self.engine.gamma.get_weather_markets()
            lines = [f"*{len(raw)} raw markets — first 8 questions:*\n"]
            for i,m in enumerate(raw[:8],1):
                q = m.get("question","") or m.get("title","") or "(empty)"
                liq = float(m.get("liquidity",0) or 0)
                prices = m.get("outcomePrices",[])
                yp = float(prices[0]) if prices and len(prices)>=2 else 0
                lines.append(f"{i}. {q[:70]}  liq=${liq:.0f} yes={yp:.2f}")
            await msg.edit_text("\n\n".join(lines), parse_mode="Markdown")
        except Exception as e:
            await msg.edit_text(f"❌ Error: {e}")

    async def cb(self,u:Update,c:ContextTypes.DEFAULT_TYPE):
        if not await self._auth(u): return
        q=u.callback_query; await q.answer(); d=q.data

        if d=="scan":
            await q.edit_message_text("🔍 Scanning... ⏳")
            try:
                sigs=await self.engine.scan(self.portfolio.bankroll); self._cache=sigs
                await q.edit_message_text(f"✅ *{len(sigs)}* signal(s) found.",parse_mode="Markdown",
                    reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("📊 Signals",callback_data="signals")],
                                                       [InlineKeyboardButton("◀️ Menu",callback_data="menu")]]))
            except Exception as e: await q.edit_message_text(f"❌ {e}",reply_markup=mk())

        elif d=="signals":
            if not self._cache: await q.edit_message_text("No signals. Scan first.",reply_markup=mk()); return
            txt=f"📊 *Top {min(5,len(self._cache))} Signals*\n\n"
            for i,s in enumerate(self._cache[:5],1):
                ce={"high":"🟢","medium":"🟡","low":"🔴"}.get(s.confidence,"⚪")
                txt+=f"{i}. {ce} *{s.city}* {s.trade_side} | Edge:`{s.edge:+.1%}` EV:`${s.expected_value:.2f}`\n"
            await q.edit_message_text(txt,parse_mode="Markdown",reply_markup=mk())

        elif d=="portfolio":
            pos=await self.portfolio.get_open()
            txt=f"💼 *{len(pos)} Position(s)*\n\n"+"".join(f"• `{t.trade_id}` {t.city} {t.trade_side} ${t.size_usd:.2f}\n" for t in pos) if pos else "💼 No positions."
            await q.edit_message_text(txt,parse_mode="Markdown",reply_markup=mk())

        elif d=="paper":
            st=await self.portfolio.stats()
            await q.edit_message_text(st.get("error","") if "error" in st else fmt_stats(st),parse_mode="Markdown",reply_markup=mk())

        elif d=="config":
            await q.edit_message_text(
                f"⚙️ Mode:`{TRADING_MODE}` Edge:`{MIN_EDGE:.0%}` Kelly:`{KELLY_FRAC:.0%}`\n"
                f"Max$:`${MAX_POS_USD:.0f}` MaxPct:`{MAX_POS_PCT:.0%}` Scan:`{SCAN_INT}min`",
                parse_mode="Markdown",reply_markup=mk())

        elif d=="help":
            await q.edit_message_text("/scan /signals /portfolio /paper /help",reply_markup=mk())

        elif d=="menu":
            await q.edit_message_text(f"📋 *Menu* | `${self.portfolio.bankroll:,.2f}`",
                parse_mode="Markdown",reply_markup=mk())

        elif d.startswith("pt_"):
            sid=d[3:]; s=next((x for x in self._cache if x.signal_id==sid),None)
            if not s: await q.edit_message_text("Signal expired.",reply_markup=mk()); return
            t=await self.portfolio.open(s)
            if t:
                await q.edit_message_text(
                    f"✅ *Trade Opened*\n`{t.trade_id}` {t.city} {t.trade_side}\n"
                    f"@ `${t.entry_price:.3f}` | `${t.size_usd:.2f}` | edge:`{t.edge:+.1%}`",
                    parse_mode="Markdown",reply_markup=mk())
            else: await q.edit_message_text("❌ Could not open (duplicate or low bankroll).",reply_markup=mk())

    async def broadcast(self,sig,uids):
        if not self._alerts or not self.app: return
        for uid in uids:
            try: await self.app.bot.send_message(uid,fmt_sig(sig),parse_mode="Markdown",reply_markup=sk(sig.signal_id))
            except Exception as e: logger.warning(f"[Bot] broadcast to {uid}: {e}")

    def build(self,token):
        self.app=Application.builder().token(token).build()
        for cmd,fn in [("start",self.start),("scan",self.scan_cmd),("signals",self.signals_cmd),
                       ("portfolio",self.portfolio_cmd),("paper",self.paper_cmd),
                       ("debug",self.debug_cmd),("help",self.help_cmd)]:
            self.app.add_handler(CommandHandler(cmd,fn))
        self.app.add_handler(CallbackQueryHandler(self.cb))
        return self.app

# ══════════════════════════════════════════════════════════════════
#  ORCHESTRATOR
# ══════════════════════════════════════════════════════════════════
class Orchestrator:
    def __init__(self):
        self.engine=ProbEngine(); self.portfolio=Portfolio()
        self.bot=Bot(self.engine,self.portfolio)
        self.scheduler=AsyncIOScheduler(timezone="UTC")
        self._users=[int(x.strip()) for x in os.getenv("TELEGRAM_ALLOWED_USERS","").split(",") if x.strip()]

    async def _scan_job(self):
        logger.info(f"[Scheduler] Scan @ {datetime.now(timezone.utc).strftime('%H:%M UTC')}")
        try:
            sigs=await self.engine.scan(self.portfolio.bankroll)
            self.bot._cache=sigs
            for s in sigs[:3]: await self.bot.broadcast(s,self._users)
            for s in sigs:
                if s.confidence=="high" and abs(s.edge)>=0.12:
                    await self.portfolio.open(s)
        except Exception as e: logger.error(f"[Scheduler] scan error: {e}",exc_info=True)

    async def _exit_job(self):
        for pos in await self.portfolio.get_open():
            try:
                r=await self.engine.check_exit(pos)
                if r["action"]!="hold":
                    ep=pos.entry_price*(1.05 if r["action"]=="close_profit" else 0.97)
                    closed=await self.portfolio.close_pos(pos.trade_id,ep,r["action"])
                    if closed:
                        for uid in self._users:
                            try: await self.bot.app.bot.send_message(uid,
                                    f"🔔 Closed `{closed.trade_id}` — {r['reason']}\nP&L:`${closed.pnl:+.2f}`",
                                    parse_mode="Markdown")
                            except Exception: pass
            except Exception as e: logger.warning(f"[Exit] {pos.trade_id}: {e}")

    async def run(self):
        logger.info("="*55)
        logger.info("🌦️  PolyWeather Bot — Starting")
        logger.info(f"   Mode: {TRADING_MODE.upper()} | Scan: {SCAN_INT}min")
        logger.info("="*55)

        token=os.environ.get("TELEGRAM_BOT_TOKEN","").strip()
        logger.info(f"[Init] Token len={len(token)} has_colon={(':' in token)}")
        if not token or len(token)<20 or ":" not in token:
            logger.error("TELEGRAM_BOT_TOKEN invalid — check _DEFAULTS in main.py")
            sys.exit(1)
        logger.info(f"[Init] Token OK: ...{token[-8:]}")

        await self.portfolio.init()

        self.scheduler.add_job(self._scan_job,"interval",minutes=SCAN_INT,
            id="scan",next_run_time=datetime.now(timezone.utc))
        self.scheduler.add_job(self._exit_job,"interval",minutes=EXIT_INT,id="exit")
        self.scheduler.start()

        app = self.bot.build(token)

        # Use run_polling() which handles Conflict internally with proper backoff
        # We run it in a separate task so scheduler stays alive
        async def _run_bot():
            try:
                # Aggressive timeout to detect and release Conflict fast
                await app.initialize()
                # Delete webhook + drop pending to clear any conflict state
                await app.bot.delete_webhook(drop_pending_updates=True)
                await asyncio.sleep(2)  # Brief pause after clearing
                await app.start()
                await app.updater.start_polling(
                    drop_pending_updates=True,
                    poll_interval=1.0,
                    timeout=10,
                    read_timeout=15,
                    write_timeout=15,
                    connect_timeout=15,
                    pool_timeout=15,
                    allowed_updates=["message", "callback_query"],
                    
                )
                logger.info("✅ Bot running — send /start in Telegram")
                # Keep alive
                while True:
                    await asyncio.sleep(30)
            except Exception as e:
                logger.error(f"[Bot] {e}")
            finally:
                try:
                    await app.updater.stop()
                    await app.stop()
                    await app.shutdown()
                except Exception:
                    pass

        # Retry with backoff until we get past any Conflict from old instances
        for attempt in range(1, 16):
            logger.info(f"[Telegram] Connect attempt {attempt}/15...")
            try:
                # Clear webhook/conflict state first via raw API call
                async with httpx.AsyncClient(timeout=10) as hc:
                    await hc.post(
                        f"https://api.telegram.org/bot{token}/deleteWebhook",
                        json={"drop_pending_updates": True}
                    )
                await asyncio.sleep(3)

                bot_task = asyncio.create_task(_run_bot())
                # Wait a bit to see if it crashes immediately (Conflict)
                await asyncio.sleep(8)
                if bot_task.done():
                    exc = bot_task.exception()
                    if exc and "Conflict" in str(exc):
                        wait = min(attempt * 5, 60)
                        logger.warning(f"[Telegram] Conflict on attempt {attempt}. Waiting {wait}s for old instance to die...")
                        await asyncio.sleep(wait)
                        continue
                    elif exc:
                        logger.error(f"[Telegram] Bot failed: {exc}")
                        break
                    else:
                        logger.warning("[Telegram] Bot task ended unexpectedly")
                        break
                else:
                    # Bot is running! Wait for it
                    logger.info(f"[Telegram] Connected on attempt {attempt} ✅")
                    try:
                        await bot_task
                    except (KeyboardInterrupt, SystemExit):
                        pass
                    except Exception as e:
                        logger.error(f"[Telegram] Runtime error: {e}")
                    break
            except (KeyboardInterrupt, SystemExit):
                break
            except Exception as e:
                logger.error(f"[Telegram] Attempt {attempt} error: {e}")
                await asyncio.sleep(5)

        self.scheduler.shutdown(wait=False)
        await self.engine.close()
        await self.portfolio.close()
        logger.info("Done.")

async def main():
    await Orchestrator().run()

if __name__ == "__main__":
    asyncio.run(main())
