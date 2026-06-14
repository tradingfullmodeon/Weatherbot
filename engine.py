"""
Probabilistic Trading Engine
Edge detection + Kelly Criterion + Signal generation
"""
import os
import math
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Optional
import numpy as np
from loguru import logger

from src.api.weather import WeatherEnsemble
from src.api.polymarket import GammaClient, MarketParser


@dataclass
class TradingSignal:
    """A trade recommendation with full metadata."""
    signal_id: str
    condition_id: str
    question: str
    city: str
    market_type: str
    threshold_f: Optional[float]

    # Market data
    yes_token_id: str
    no_token_id: str
    yes_price: float
    no_price: float

    # Edge analysis
    model_prob: float
    market_prob: float   # = yes_price
    edge: float          # model_prob - market_prob
    trade_side: str      # "YES" | "NO"
    trade_token_id: str
    trade_price: float

    # Sizing
    kelly_fraction: float
    recommended_size_usd: float
    expected_value: float

    # Weather metadata
    ensemble_members: int
    model_spread_f: float
    confidence: str      # high | medium | low
    models_used: list[str]

    # Meta
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    notes: str = ""


class ProbabilisticEngine:
    """
    Core engine that:
    1. Scans Polymarket weather markets
    2. Fetches ensemble weather forecasts
    3. Computes edge = model_prob - market_price
    4. Sizes positions via Kelly Criterion
    5. Returns ranked TradingSignals
    """

    def __init__(self):
        self.gamma = GammaClient()
        self.weather = WeatherEnsemble()
        self.parser = MarketParser()

        # Config from env
        self.min_edge = float(os.getenv("MIN_EDGE", "0.08"))
        self.kelly_fraction = float(os.getenv("KELLY_FRACTION", "0.15"))
        self.max_position_usd = float(os.getenv("MAX_POSITION_USD", "100"))
        self.max_position_pct = float(os.getenv("MAX_POSITION_PCT", "0.05"))
        self.min_liquidity = float(os.getenv("MIN_LIQUIDITY_USD", "500"))

    async def scan_and_rank(self, bankroll: float) -> list[TradingSignal]:
        """Full scan: fetch markets → compute probabilities → rank by EV."""
        logger.info("[Engine] Starting full market scan...")

        # 1. Fetch all weather markets
        raw_markets = await self.gamma.get_all_weather_markets()
        parsed = self.parser.extract_weather_markets(raw_markets)

        # Filter: need a city and threshold for quantitative analysis
        actionable = [
            m for m in parsed
            if m["city"] != "Unknown"
            and m["threshold_f"] is not None
            and m["liquidity"] >= self.min_liquidity
            and m["yes_token_id"]
        ]
        logger.info(f"[Engine] {len(parsed)} weather markets, {len(actionable)} actionable")

        # 2. Compute model probs concurrently (batch of 5 to avoid rate limits)
        signals = []
        batch_size = 5
        for i in range(0, len(actionable), batch_size):
            batch = actionable[i:i+batch_size]
            tasks = [self._analyze_market(m, bankroll) for m in batch]
            import asyncio
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in results:
                if isinstance(r, TradingSignal):
                    signals.append(r)
                elif isinstance(r, Exception):
                    logger.debug(f"[Engine] market analysis error: {r}")

        # 3. Filter by minimum edge and rank by EV
        qualified = [s for s in signals if abs(s.edge) >= self.min_edge]
        qualified.sort(key=lambda s: s.expected_value, reverse=True)

        logger.info(f"[Engine] {len(qualified)} signals with edge >= {self.min_edge:.0%}")
        return qualified

    async def _analyze_market(self, market: dict, bankroll: float) -> Optional[TradingSignal]:
        """Analyze a single market and generate a signal if edge exists."""
        city = market["city"]
        threshold = market["threshold_f"]
        question = market["question"]

        # Determine direction from question text
        q_lower = question.lower()
        direction = "above"
        if any(kw in q_lower for kw in ["below", "under", "not reach", "fail to"]):
            direction = "below"

        # Extract target date from end_date
        target_date = None
        end_date = market.get("end_date", "")
        if end_date:
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                target_date = dt.strftime("%Y-%m-%d")
            except Exception:
                pass

        # Get weather model probability
        weather_result = await self.weather.compute_threshold_probability(
            city=city,
            threshold_f=threshold,
            direction=direction,
            target_date=target_date,
            market_type=market["market_type"],
        )

        if not weather_result or weather_result.get("model_prob") is None:
            return None

        model_prob = weather_result["model_prob"]
        yes_price = market["yes_price"]  # = market's implied P(YES)
        no_price = market["no_price"]

        # Edge calculation
        edge_yes = model_prob - yes_price
        edge_no = (1 - model_prob) - no_price

        if abs(edge_yes) >= abs(edge_no):
            edge = edge_yes
            trade_side = "YES"
            trade_price = yes_price
            trade_token_id = market["yes_token_id"]
            market_prob = yes_price
        else:
            edge = edge_no
            trade_side = "NO"
            trade_price = no_price
            trade_token_id = market["no_token_id"]
            market_prob = yes_price  # always store YES price as market reference

        if abs(edge) < self.min_edge:
            return None

        # Kelly Criterion sizing
        win_prob = model_prob if trade_side == "YES" else (1 - model_prob)
        loss_prob = 1 - win_prob
        odds = (1 / trade_price) - 1  # net odds (profit per $1 risked)

        if odds <= 0:
            return None

        kelly_full = (win_prob * odds - loss_prob) / odds
        kelly_used = max(0, kelly_full * self.kelly_fraction)

        # Position sizing
        raw_size = kelly_used * bankroll
        max_by_pct = bankroll * self.max_position_pct
        recommended_size = min(raw_size, self.max_position_usd, max_by_pct)
        recommended_size = max(1.0, recommended_size)  # min $1

        # Expected Value
        ev = win_prob * (recommended_size * odds) - loss_prob * recommended_size

        import uuid
        signal = TradingSignal(
            signal_id=str(uuid.uuid4())[:8],
            condition_id=market["condition_id"],
            question=question,
            city=city,
            market_type=market["market_type"],
            threshold_f=threshold,
            yes_token_id=market["yes_token_id"],
            no_token_id=market["no_token_id"],
            yes_price=yes_price,
            no_price=no_price,
            model_prob=model_prob,
            market_prob=market_prob,
            edge=edge,
            trade_side=trade_side,
            trade_token_id=trade_token_id,
            trade_price=trade_price,
            kelly_fraction=kelly_used,
            recommended_size_usd=round(recommended_size, 2),
            expected_value=round(ev, 4),
            ensemble_members=weather_result.get("ensemble_members", 31),
            model_spread_f=weather_result.get("model_spread_f", 0),
            confidence=weather_result.get("confidence", "medium"),
            models_used=weather_result.get("models_used", []),
        )
        return signal

    async def check_exit_conditions(
        self,
        position: dict,
        current_bankroll: float,
    ) -> dict:
        """
        Check if an open position should be closed.
        Returns: {"action": "hold"|"close_profit"|"close_loss"|"close_decay", "reason": str}
        """
        condition_id = position["condition_id"]
        entry_model_prob = position["model_prob"]
        entry_edge = position["edge"]
        trade_side = position["trade_side"]
        entry_price = position["entry_price"]

        # Fetch current price
        from src.api.polymarket import CLOBClient
        clob = CLOBClient()
        token_id = position["trade_token_id"]
        current_price = await clob.get_price(token_id)

        if current_price is None:
            return {"action": "hold", "reason": "price unavailable"}

        # Current edge (unrealized P&L direction)
        if trade_side == "YES":
            price_move = current_price - entry_price
        else:
            price_move = entry_price - current_price

        # Time to expiry check
        from datetime import datetime, timezone
        try:
            end_dt = datetime.fromisoformat(position["end_date"].replace("Z", "+00:00"))
            hours_left = (end_dt - datetime.now(timezone.utc)).total_seconds() / 3600
        except Exception:
            hours_left = 24  # assume plenty of time

        # --- Exit rules ---
        # 1. Time decay: close 2h before resolution
        if hours_left < 2:
            return {"action": "close_decay", "reason": f"Resolution in {hours_left:.1f}h, locking in position"}

        # 2. Take profit: captured >60% of max theoretical gain
        if price_move > abs(entry_edge) * 0.6:
            return {"action": "close_profit", "reason": f"Captured {price_move:.2%} gain (entry edge {entry_edge:.2%})"}

        # 3. Model-based exit: re-check weather forecast
        # (heavy: only do on full check cycles, not here)

        # 4. Stop loss: price moved badly (3% adverse)
        if price_move < -0.03:
            return {"action": "close_loss", "reason": f"Adverse move of {price_move:.2%}"}

        return {"action": "hold", "reason": f"Edge intact, {hours_left:.0f}h remaining"}

    async def close(self):
        await self.gamma.close()
        await self.weather.close()
