"""
Polymarket API Layer
Handles Gamma (discovery) + CLOB (execution) + Data APIs
"""
import os
import asyncio
from typing import Optional
import httpx
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

GAMMA_BASE = "https://gamma-api.polymarket.com"
CLOB_BASE  = "https://clob.polymarket.com"
DATA_BASE  = "https://data-api.polymarket.com"


class GammaClient:
    """Public Gamma API — no auth required. Market discovery & metadata."""

    def __init__(self):
        self.base = GAMMA_BASE
        self.session = httpx.AsyncClient(timeout=30)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def get_markets(
        self,
        tag: str = "weather",
        active: bool = True,
        limit: int = 200,
        offset: int = 0,
    ) -> list[dict]:
        """Fetch open weather markets from Gamma API."""
        params = {
            "tag": tag,
            "active": str(active).lower(),
            "closed": "false",
            "limit": limit,
            "offset": offset,
        }
        resp = await self.session.get(f"{self.base}/markets", params=params)
        resp.raise_for_status()
        data = resp.json()
        markets = data if isinstance(data, list) else data.get("markets", [])
        logger.debug(f"[Gamma] fetched {len(markets)} markets (tag={tag})")
        return markets

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
    async def get_all_weather_markets(self) -> list[dict]:
        """Paginate through all weather + climate markets."""
        all_markets = []
        for tag in ["weather", "climate", "temperature"]:
            offset = 0
            while True:
                batch = await self.get_markets(tag=tag, limit=200, offset=offset)
                if not batch:
                    break
                all_markets.extend(batch)
                if len(batch) < 200:
                    break
                offset += 200
        # Deduplicate by condition_id
        seen = set()
        unique = []
        for m in all_markets:
            cid = m.get("conditionId") or m.get("condition_id", "")
            if cid and cid not in seen:
                seen.add(cid)
                unique.append(m)
        logger.info(f"[Gamma] total unique weather markets: {len(unique)}")
        return unique

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
    async def get_market(self, condition_id: str) -> dict:
        resp = await self.session.get(f"{self.base}/markets/{condition_id}")
        resp.raise_for_status()
        return resp.json()

    async def close(self):
        await self.session.aclose()


class CLOBClient:
    """CLOB API — authenticated order execution."""

    def __init__(self):
        self.base = CLOB_BASE
        self.private_key = os.getenv("POLYMARKET_PRIVATE_KEY")
        self.funder = os.getenv("POLYMARKET_FUNDER_ADDRESS")
        self.sig_type = int(os.getenv("POLYMARKET_SIGNATURE_TYPE", "1"))
        self._client = None  # lazy init

    def _get_client(self):
        """Lazy import py_clob_client to avoid errors in paper mode."""
        if self._client is None:
            try:
                from py_clob_client.client import ClobClient
                from py_clob_client.clob_types import ApiCreds
                self._client = ClobClient(
                    self.base,
                    key=self.private_key,
                    chain_id=137,
                    signature_type=self.sig_type,
                    funder=self.funder,
                )
                creds = self._client.derive_api_key()
                self._client.set_api_creds(creds)
                logger.info("[CLOB] authenticated successfully")
            except Exception as e:
                logger.error(f"[CLOB] auth failed: {e}")
                raise
        return self._client

    async def get_price(self, token_id: str, side: str = "buy") -> Optional[float]:
        """Get best ask (buy) or best bid (sell) price."""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{self.base}/price",
                    params={"token_id": token_id, "side": side}
                )
                resp.raise_for_status()
                data = resp.json()
                return float(data.get("price", 0))
        except Exception as e:
            logger.warning(f"[CLOB] get_price failed for {token_id}: {e}")
            return None

    async def get_orderbook(self, token_id: str) -> dict:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{self.base}/book", params={"token_id": token_id})
            resp.raise_for_status()
            return resp.json()

    def place_order(self, token_id: str, side: str, price: float, size: float) -> dict:
        """Place limit order. side: 'BUY' | 'SELL'"""
        from py_clob_client.clob_types import OrderArgs, Side, OrderType
        client = self._get_client()
        order_args = OrderArgs(
            token_id=token_id,
            price=price,
            size=size,
            side=Side.BUY if side == "BUY" else Side.SELL,
        )
        resp = client.create_and_post_order(order_args)
        logger.info(f"[CLOB] order placed: {resp}")
        return resp

    def cancel_order(self, order_id: str) -> dict:
        client = self._get_client()
        resp = client.cancel(order_id)
        logger.info(f"[CLOB] order cancelled: {order_id}")
        return resp

    def get_positions(self) -> list[dict]:
        client = self._get_client()
        return client.get_positions()


class MarketParser:
    """Parse Gamma market data into structured format for the engine."""

    CITY_KEYWORDS = [
        "temperature", "high", "low", "°f", "°c", "degrees",
        "rain", "precipitation", "snow", "hurricane", "tornado",
        "wildfire", "drought", "flood", "wind"
    ]

    @classmethod
    def extract_weather_markets(cls, markets: list[dict]) -> list[dict]:
        """Filter and enrich weather markets with structured metadata."""
        parsed = []
        for m in markets:
            question = (m.get("question") or "").lower()
            description = (m.get("description") or "").lower()
            text = question + " " + description

            # Skip non-weather markets
            if not any(kw in text for kw in cls.CITY_KEYWORDS):
                continue

            # Extract numeric threshold if present (e.g. "above 75°F")
            threshold = cls._extract_threshold(question)
            city = cls._extract_city(question)
            market_type = cls._classify_market(question)

            parsed.append({
                "condition_id": m.get("conditionId", ""),
                "question": m.get("question", ""),
                "description": m.get("description", ""),
                "yes_token_id": cls._get_token_id(m, "yes"),
                "no_token_id": cls._get_token_id(m, "no"),
                "yes_price": float(m.get("outcomePrices", [0.5, 0.5])[0] if isinstance(m.get("outcomePrices"), list) else 0.5),
                "no_price": float(m.get("outcomePrices", [0.5, 0.5])[1] if isinstance(m.get("outcomePrices"), list) else 0.5),
                "volume": float(m.get("volume", 0) or 0),
                "end_date": m.get("endDate", ""),
                "resolution_source": m.get("resolutionSource", ""),
                "city": city,
                "threshold": threshold,
                "market_type": market_type,
                "liquidity": float(m.get("liquidity", 0) or 0),
                "active": m.get("active", True),
            })
        return parsed

    @staticmethod
    def _get_token_id(market: dict, outcome: str) -> str:
        tokens = market.get("tokens", [])
        for t in tokens:
            if outcome.lower() in (t.get("outcome", "")).lower():
                return t.get("token_id", "")
        # fallback: first=yes, second=no
        if outcome == "yes" and tokens:
            return tokens[0].get("token_id", "")
        if outcome == "no" and len(tokens) > 1:
            return tokens[1].get("token_id", "")
        return ""

    @staticmethod
    def _extract_threshold(question: str) -> Optional[float]:
        import re
        # Match patterns like "above 75", "exceed 90°F", "below 32"
        patterns = [
            r'(?:above|exceed|reach|over|below|under)\s+(\d+\.?\d*)',
            r'(\d+\.?\d*)\s*°[fc]',
            r'(\d+\.?\d*)\s*degrees',
        ]
        for pat in patterns:
            m = re.search(pat, question.lower())
            if m:
                return float(m.group(1))
        return None

    @staticmethod
    def _extract_city(question: str) -> str:
        """Simple heuristic city extraction."""
        # Common city names in Polymarket weather markets
        CITIES = [
            "New York", "Los Angeles", "Chicago", "Miami", "Houston",
            "Phoenix", "Dallas", "Atlanta", "Seattle", "Denver",
            "Las Vegas", "Boston", "San Francisco", "Portland",
            "Minneapolis", "Detroit", "Philadelphia", "Washington",
            "Nashville", "Austin", "London", "Tokyo", "Paris",
            "Sydney", "Toronto", "Mexico City", "Dubai", "Singapore",
        ]
        q = question.lower()
        for city in CITIES:
            if city.lower() in q:
                return city
        return "Unknown"

    @staticmethod
    def _classify_market(question: str) -> str:
        q = question.lower()
        if any(kw in q for kw in ["°f", "°c", "temperature", "high", "low", "degrees"]):
            return "temperature"
        if any(kw in q for kw in ["rain", "precipitation", "snow", "flood"]):
            return "precipitation"
        if "hurricane" in q or "typhoon" in q or "cyclone" in q:
            return "hurricane"
        if "tornado" in q:
            return "tornado"
        if "wildfire" in q or "fire" in q:
            return "wildfire"
        if "wind" in q:
            return "wind"
        return "general"
