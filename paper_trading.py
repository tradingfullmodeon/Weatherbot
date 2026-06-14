"""
Paper Trading Engine
Virtual portfolio with full P&L tracking and statistics.
Persists to SQLite for cross-session analysis.
"""
import os
import json
import uuid
import aiosqlite
from datetime import datetime, timezone
from typing import Optional
from dataclasses import dataclass, asdict
from loguru import logger

DB_PATH = os.getenv("PAPER_DB_PATH", "data/paper_trades/paper.db")


@dataclass
class PaperTrade:
    trade_id: str
    condition_id: str
    question: str
    city: str
    market_type: str
    trade_side: str      # YES | NO
    entry_price: float
    size_usd: float
    shares: float        # size_usd / entry_price
    model_prob: float
    edge: float
    confidence: str
    status: str = "open"  # open | closed_profit | closed_loss | closed_decay | resolved
    exit_price: Optional[float] = None
    pnl: Optional[float] = None
    pnl_pct: Optional[float] = None
    resolved_outcome: Optional[str] = None  # YES | NO
    entry_time: str = ""
    exit_time: Optional[str] = None
    end_date: str = ""
    signal_id: str = ""
    models_used: str = ""  # JSON list


class PaperPortfolio:
    """
    Manages paper trading portfolio.
    Tracks open positions, handles exits, computes stats.
    """

    def __init__(self):
        self.bankroll = float(os.getenv("PAPER_BANKROLL", "1000"))
        self.initial_bankroll = self.bankroll
        self.db_path = DB_PATH
        self._db = None

    async def init_db(self):
        """Initialize SQLite database."""
        import os
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._db = await aiosqlite.connect(self.db_path)
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS trades (
                trade_id TEXT PRIMARY KEY,
                condition_id TEXT,
                question TEXT,
                city TEXT,
                market_type TEXT,
                trade_side TEXT,
                entry_price REAL,
                size_usd REAL,
                shares REAL,
                model_prob REAL,
                edge REAL,
                confidence TEXT,
                status TEXT DEFAULT 'open',
                exit_price REAL,
                pnl REAL,
                pnl_pct REAL,
                resolved_outcome TEXT,
                entry_time TEXT,
                exit_time TEXT,
                end_date TEXT,
                signal_id TEXT,
                models_used TEXT
            )
        """)
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS portfolio_state (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        """)
        await self._db.commit()
        # Load saved bankroll
        saved = await self._get_state("bankroll")
        if saved:
            self.bankroll = float(saved)
        logger.info(f"[PaperPortfolio] initialized, bankroll=${self.bankroll:.2f}")

    async def _get_state(self, key: str) -> Optional[str]:
        async with self._db.execute(
            "SELECT value FROM portfolio_state WHERE key=?", (key,)
        ) as cur:
            row = await cur.fetchone()
            return row[0] if row else None

    async def _set_state(self, key: str, value: str):
        await self._db.execute(
            "INSERT OR REPLACE INTO portfolio_state (key, value) VALUES (?,?)",
            (key, value)
        )
        await self._db.commit()

    async def open_trade(self, signal) -> Optional[PaperTrade]:
        """Open a new paper trade from a TradingSignal."""
        # Check bankroll
        if signal.recommended_size_usd > self.bankroll:
            logger.warning(f"[Paper] insufficient bankroll for {signal.question[:40]}")
            return None

        # Check duplicate (same market already open)
        open_for_market = await self.get_open_by_condition(signal.condition_id)
        if open_for_market:
            logger.debug(f"[Paper] already have position in {signal.condition_id}")
            return None

        trade = PaperTrade(
            trade_id=str(uuid.uuid4())[:8],
            condition_id=signal.condition_id,
            question=signal.question,
            city=signal.city,
            market_type=signal.market_type,
            trade_side=signal.trade_side,
            entry_price=signal.trade_price,
            size_usd=signal.recommended_size_usd,
            shares=signal.recommended_size_usd / signal.trade_price,
            model_prob=signal.model_prob,
            edge=signal.edge,
            confidence=signal.confidence,
            entry_time=datetime.now(timezone.utc).isoformat(),
            end_date=getattr(signal, 'end_date', ''),
            signal_id=signal.signal_id,
            models_used=json.dumps(signal.models_used),
        )

        await self._db.execute("""
            INSERT INTO trades VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            trade.trade_id, trade.condition_id, trade.question, trade.city,
            trade.market_type, trade.trade_side, trade.entry_price, trade.size_usd,
            trade.shares, trade.model_prob, trade.edge, trade.confidence,
            trade.status, trade.exit_price, trade.pnl, trade.pnl_pct,
            trade.resolved_outcome, trade.entry_time, trade.exit_time,
            trade.end_date, trade.signal_id, trade.models_used,
        ))
        await self._db.commit()

        self.bankroll -= trade.size_usd
        await self._set_state("bankroll", str(self.bankroll))
        logger.info(f"[Paper] opened {trade.trade_side} {trade.city} ${trade.size_usd:.2f} (edge={trade.edge:.2%})")
        return trade

    async def close_trade(
        self,
        trade_id: str,
        exit_price: float,
        reason: str = "manual",
        resolved_outcome: Optional[str] = None,
    ) -> Optional[PaperTrade]:
        """Close a paper trade and compute P&L."""
        async with self._db.execute(
            "SELECT * FROM trades WHERE trade_id=? AND status='open'", (trade_id,)
        ) as cur:
            row = await cur.fetchone()
        if not row:
            return None

        trade = self._row_to_trade(row)
        trade.exit_price = exit_price
        trade.exit_time = datetime.now(timezone.utc).isoformat()

        # P&L: (exit_price - entry_price) * shares for YES
        # For NO: entry was "no" at no_price, value goes to 1 if market resolves NO
        if resolved_outcome:
            # Market resolved — binary outcome
            if trade.trade_side == resolved_outcome:
                pnl = (1.0 - trade.entry_price) * trade.shares
                trade.status = "resolved"
            else:
                pnl = -trade.size_usd
                trade.status = "resolved"
        else:
            # Market exit before resolution (sell position)
            pnl = (exit_price - trade.entry_price) * trade.shares
            trade.status = f"closed_{reason}"

        trade.pnl = round(pnl, 4)
        trade.pnl_pct = round(pnl / trade.size_usd, 4) if trade.size_usd > 0 else 0
        trade.resolved_outcome = resolved_outcome

        await self._db.execute("""
            UPDATE trades SET status=?, exit_price=?, pnl=?, pnl_pct=?,
            resolved_outcome=?, exit_time=? WHERE trade_id=?
        """, (trade.status, trade.exit_price, trade.pnl, trade.pnl_pct,
              trade.resolved_outcome, trade.exit_time, trade_id))
        await self._db.commit()

        # Return capital + pnl
        returned = trade.size_usd + pnl
        self.bankroll += returned
        await self._set_state("bankroll", str(self.bankroll))

        emoji = "✅" if pnl > 0 else "❌"
        logger.info(f"[Paper] {emoji} closed {trade.trade_id} P&L={pnl:+.2f} ({trade.pnl_pct:+.1%})")
        return trade

    async def get_open_positions(self) -> list[PaperTrade]:
        async with self._db.execute(
            "SELECT * FROM trades WHERE status='open' ORDER BY entry_time DESC"
        ) as cur:
            rows = await cur.fetchall()
        return [self._row_to_trade(r) for r in rows]

    async def get_open_by_condition(self, condition_id: str) -> Optional[PaperTrade]:
        async with self._db.execute(
            "SELECT * FROM trades WHERE condition_id=? AND status='open'", (condition_id,)
        ) as cur:
            row = await cur.fetchone()
        return self._row_to_trade(row) if row else None

    async def get_stats(self) -> dict:
        """Compute portfolio statistics."""
        async with self._db.execute(
            "SELECT * FROM trades WHERE status != 'open'"
        ) as cur:
            rows = await cur.fetchall()

        if not rows:
            return {"error": "No closed trades yet"}

        trades = [self._row_to_trade(r) for r in rows]
        pnls = [t.pnl for t in trades if t.pnl is not None]
        wins = [p for p in pnls if p > 0]
        losses = [p for p in pnls if p <= 0]

        total_pnl = sum(pnls)
        win_rate = len(wins) / len(pnls) if pnls else 0
        avg_win = sum(wins) / len(wins) if wins else 0
        avg_loss = sum(losses) / len(losses) if losses else 0
        profit_factor = abs(sum(wins) / sum(losses)) if losses and sum(losses) != 0 else float('inf')

        # Sharpe (simplified, daily)
        if len(pnls) > 1:
            mean_r = sum(pnls) / len(pnls)
            std_r = (sum((p - mean_r) ** 2 for p in pnls) / len(pnls)) ** 0.5
            sharpe = (mean_r / std_r * (252 ** 0.5)) if std_r > 0 else 0
        else:
            sharpe = 0

        # Max drawdown
        cumulative = 0
        peak = 0
        max_dd = 0
        for p in pnls:
            cumulative += p
            if cumulative > peak:
                peak = cumulative
            dd = peak - cumulative
            if dd > max_dd:
                max_dd = dd

        current_bankroll = self.bankroll + sum(
            t.size_usd for t in await self.get_open_positions()
        )
        roi = (current_bankroll - self.initial_bankroll) / self.initial_bankroll

        return {
            "total_trades": len(pnls),
            "open_positions": len(await self.get_open_positions()),
            "win_rate": round(win_rate, 4),
            "total_pnl": round(total_pnl, 2),
            "avg_win": round(avg_win, 2),
            "avg_loss": round(avg_loss, 2),
            "profit_factor": round(profit_factor, 2),
            "sharpe_ratio": round(sharpe, 2),
            "max_drawdown": round(max_dd, 2),
            "roi": round(roi, 4),
            "current_bankroll": round(self.bankroll, 2),
            "initial_bankroll": self.initial_bankroll,
            "ready_for_live": win_rate >= float(os.getenv("WINRATE_THRESHOLD", "0.55"))
                              and len(pnls) >= int(os.getenv("MIN_PAPER_TRADES", "50")),
        }

    async def get_recent_trades(self, limit: int = 10) -> list[PaperTrade]:
        async with self._db.execute(
            "SELECT * FROM trades ORDER BY entry_time DESC LIMIT ?", (limit,)
        ) as cur:
            rows = await cur.fetchall()
        return [self._row_to_trade(r) for r in rows]

    def _row_to_trade(self, row) -> PaperTrade:
        cols = [
            "trade_id", "condition_id", "question", "city", "market_type",
            "trade_side", "entry_price", "size_usd", "shares", "model_prob",
            "edge", "confidence", "status", "exit_price", "pnl", "pnl_pct",
            "resolved_outcome", "entry_time", "exit_time", "end_date",
            "signal_id", "models_used",
        ]
        d = dict(zip(cols, row))
        return PaperTrade(**d)

    async def close(self):
        if self._db:
            await self._db.close()
