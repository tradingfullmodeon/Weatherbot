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

from dotenv import load_dotenv, dotenv_values

# ══════════════════════════════════════════════════════════════
#  HARDCODED FALLBACK CONFIG
#  Edit these values directly if Railway fails to inject vars.
#  These are ONLY used when env vars are not set externally.
# ══════════════════════════════════════════════════════════════
_DEFAULTS = {
    "TELEGRAM_BOT_TOKEN":        "8794924683:AAHpPFPSd2HJrbpLlUgVcU2Z1trVHFCjvus",
    "TELEGRAM_ALLOWED_USERS":    "1354452347",
    "TRADING_MODE":              "paper",
    "PAPER_BANKROLL":            "1000",
    "MIN_EDGE":                  "0.08",
    "KELLY_FRACTION":            "0.15",
    "MAX_POSITION_USD":          "100",
    "MAX_POSITION_PCT":          "0.05",
    "SCAN_INTERVAL_MINUTES":     "5",
    "EXIT_CHECK_MINUTES":        "15",
    "MIN_LIQUIDITY_USD":         "50",
    "LOG_LEVEL":                 "INFO",
    "PAPER_DB_PATH":             "/app/logs/paper.db",
}

def _load_all_env_sources():
    """Load env from files, then apply hardcoded defaults for missing keys."""
    for src in [".env", ".env.runtime", "/app/.env", "/app/.env.runtime", "/etc/environment"]:
        try:
            load_dotenv(src, override=False)
        except Exception:
            pass
    # /proc/1/environ — parent process env
    try:
        with open("/proc/1/environ", "rb") as f:
            for entry in f.read().split(b"\x00"):
                try:
                    k, v = entry.decode("utf-8", errors="replace").split("=", 1)
                    if k.strip() and k not in os.environ:
                        os.environ[k] = v
                except ValueError:
                    pass
    except Exception:
        pass
    # Apply hardcoded defaults for any key still missing
    for k, v in _DEFAULTS.items():
        if not os.environ.get(k):
            os.environ[k] = v

_load_all_env_sources()

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
    "Singapore": (1.3521, 103.8198), "New Orleans": (29.9511, -90.0715),
    "Kansas City": (39.0997, -94.5786), "Tampa": (27.9506, -82.4572),
    "Orlando": (28.5383, -81.3792),  "Charlotte": (35.2271, -80.8431),
    "Sacramento": (38.5816, -121.4944), "Salt Lake City": (40.7608, -111.8910),
    "Raleigh": (35.7796, -78.6382),  "Memphis": (35.1495, -90.0490),
    "Louisville": (38.2527, -85.7585), "Richmond": (37.5407, -77.4360),
    "Indianapolis": (39.7684, -86.1581), "Columbus": (39.9612, -82.9988),
    "Cincinnati": (39.1031, -84.5120),  "Pittsburgh": (40.4406, -79.9959),
    "St. Louis": (38.6270, -90.1994),  "Oklahoma City": (35.4676, -97.5164),
    "Albuquerque": (35.0844, -106.6504), "Tucson": (32.2226, -110.9747),
    "El Paso": (31.7619, -106.4850),  "Boise": (43.6150, -116.2023),
    "Anchorage": (61.2181, -149.9003), "Honolulu": (21.3069, -157.8583),
    "San Diego": (32.7157, -117.1611), "San Jose": (37.3382, -121.8863),
    "Jacksonville": (30.3322, -81.6557), "Baltimore": (39.2904, -76.6122),
    "Milwaukee": (43.0389, -87.9065),
}

# City aliases for common variations in Polymarket questions
CITY_ALIASES = {
    "new york city": "New York", "nyc": "New York", "new york, ny": "New York",
    "los angeles": "Los Angeles", "la": "Los Angeles",
    "san francisco": "San Francisco", "sf": "San Francisco", "bay area": "San Francisco",
    "washington dc": "Washington", "washington, dc": "Washington", "d.c.": "Washington",
    "st louis": "St. Louis",
    "salt lake": "Salt Lake City",
}

DB_PATH = os.getenv("PAPER_DB_PATH", "logs/paper.db")
MIN_EDGE        = float(os.getenv("MIN_EDGE", "0.08"))
KELLY_FRACTION  = float(os.getenv("KELLY_FRACTION", "0.15"))
MAX_POS_USD     = float(os.getenv("MAX_POSITION_USD", "100"))
MAX_POS_PCT     = float(os.getenv("MAX_POSITION_PCT", "0.05"))
MIN_LIQUIDITY   = float(os.getenv("MIN_LIQUIDITY_USD", "50"))
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
    # Check aliases first (longer strings take priority)
    for alias in sorted(CITY_ALIASES, key=len, reverse=True):
        if alias in q:
            return CITY_ALIASES[alias]
    # Then check full city names (longest first to avoid partial matches)
    for city in sorted(CITY_COORDS, key=len, reverse=True):
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
    KEYWORDS = ["temperature","high","low","\u00b0f","\u00b0c","degrees","rain",
                "precipitation","snow","hurricane","tornado","wind","wildfire",
                "weather","heat","cold","freeze","frost","rainfall","storm","flood"]
    parsed = []
    skipped = {"no_keyword": 0, "no_city": 0, "no_threshold": 0}

    for m in markets:
        question = m.get("question","") or m.get("title","") or ""
        q = question.lower()
        d = (m.get("description","") or "").lower()

        if not any(k in q+d for k in KEYWORDS):
            skipped["no_keyword"] += 1
            continue

        city = _extract_city(question)
        if not city:
            skipped["no_city"] += 1
            continue

        market_type = _classify_market(question)
        threshold = _extract_threshold(question)

        # Allow precipitation/general markets without numeric threshold
        if threshold is None:
            if market_type in ("precipitation","hurricane","tornado","wind","general"):
                threshold = 0.0
            else:
                skipped["no_threshold"] += 1
                continue

        # Parse outcomePrices — handle string or float format
        prices = m.get("outcomePrices", [])
        try:
            if isinstance(prices, list) and len(prices) >= 2:
                yp, np_ = float(prices[0]), float(prices[1])
            elif isinstance(prices, str):
                import json as _j; pl = _j.loads(prices)
                yp, np_ = float(pl[0]), float(pl[1])
            else:
                yp, np_ = 0.5, 0.5
        except Exception:
            yp, np_ = 0.5, 0.5

        # Get token IDs — also try clobTokenIds fallback
        yes_tok = _get_token_id(m, "yes")
        no_tok  = _get_token_id(m, "no")
        if not yes_tok:
            cids = m.get("clobTokenIds", [])
            if isinstance(cids, list):
                if len(cids) >= 1: yes_tok = str(cids[0])
                if len(cids) >= 2: no_tok  = str(cids[1])

        parsed.append({
            "condition_id": m.get("conditionId","") or m.get("condition_id",""),
            "question": question,
            "yes_token_id": yes_tok,
            "no_token_id": no_tok,
            "yes_price": yp, "no_price": np_,
            "volume":    float(m.get("volume",0) or 0),
            "liquidity": float(m.get("liquidity",0) or 0),
            "end_date":  m.get("endDate","") or m.get("end_date",""),
            "city": city, "threshold_f": threshold,
            "market_type": market_type,
        })

    logger.info(
        f"[Parser] {len(markets)} total -> {len(parsed)} parsed "
        f"(no_keyword={skipped['no_keyword']}, no_city={skipped['no_city']}, "
        f"no_threshold={skipped['no_threshold']})"
    )
    return parsed


