"""
PolyWeather Bot — Main Entry Point
Orchestrates engine, portfolio, scheduler, and Telegram bot.
"""
import asyncio
import os
import sys
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv
from loguru import logger

load_dotenv()

# Configure logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logger.remove()
logger.add(sys.stderr, level=LOG_LEVEL, colorize=True,
           format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")
logger.add("logs/bot.log", rotation="10 MB", retention="7 days", level="DEBUG")

from src.models.engine import ProbabilisticEngine
from src.models.paper_trading import PaperPortfolio
from src.telegram.bot import PolyWeatherBot


class Orchestrator:
    def __init__(self):
        self.engine = ProbabilisticEngine()
        self.portfolio = PaperPortfolio()
        self.bot = PolyWeatherBot(self.engine, self.portfolio)
        self.scheduler = AsyncIOScheduler(timezone="UTC")
        self.mode = os.getenv("TRADING_MODE", "paper")
        self.scan_interval = int(os.getenv("SCAN_INTERVAL_MINUTES", "5"))
        self.exit_check_interval = int(os.getenv("EXIT_CHECK_MINUTES", "15"))
        self._allowed_users = self._get_allowed_users()

    def _get_allowed_users(self) -> list[int]:
        raw = os.getenv("TELEGRAM_ALLOWED_USERS", "")
        if not raw:
            return []
        return [int(x.strip()) for x in raw.split(",") if x.strip()]

    async def scheduled_scan(self):
        """Periodic market scan — finds new signals and broadcasts them."""
        logger.info(f"[Scheduler] Starting periodic scan ({datetime.now(timezone.utc).strftime('%H:%M UTC')})")
        try:
            bankroll = self.portfolio.bankroll
            signals = await self.engine.scan_and_rank(bankroll)
            self.bot._signals_cache = signals

            if signals:
                logger.info(f"[Scheduler] {len(signals)} signals found, broadcasting top 3")
                for s in signals[:3]:
                    await self.bot.broadcast_signal(s, self._allowed_users)

                # Auto-execute paper trades for top signals if confidence is high
                for s in signals:
                    if s.confidence == "high" and abs(s.edge) >= 0.12:
                        trade = await self.portfolio.open_trade(s)
                        if trade:
                            logger.info(f"[Scheduler] Auto paper trade: {trade.trade_id} {s.city} {s.trade_side}")
        except Exception as e:
            logger.error(f"[Scheduler] scan error: {e}", exc_info=True)

    async def scheduled_exit_check(self):
        """Periodic exit condition check for open positions."""
        positions = await self.portfolio.get_open_positions()
        if not positions:
            return
        logger.info(f"[Scheduler] Checking {len(positions)} open positions for exits...")
        for pos in positions:
            try:
                result = await self.engine.check_exit_conditions(
                    {
                        "condition_id": pos.condition_id,
                        "model_prob": pos.model_prob,
                        "edge": pos.edge,
                        "trade_side": pos.trade_side,
                        "entry_price": pos.entry_price,
                        "trade_token_id": pos.condition_id,  # simplified for paper
                        "end_date": pos.end_date or "",
                    },
                    self.portfolio.bankroll,
                )
                action = result["action"]
                reason = result["reason"]

                if action != "hold":
                    logger.info(f"[Scheduler] Exit signal for {pos.trade_id}: {action} — {reason}")
                    # For paper trading: estimate exit price
                    if action in ("close_profit",):
                        exit_price = min(pos.entry_price + abs(pos.edge) * 0.6, 0.95)
                    elif action in ("close_loss",):
                        exit_price = max(pos.entry_price - 0.03, 0.05)
                    else:
                        exit_price = pos.entry_price  # neutral for decay

                    closed = await self.portfolio.close_trade(
                        pos.trade_id, exit_price=exit_price, reason=action
                    )
                    if closed:
                        pnl_str = f"${closed.pnl:+.2f}" if closed.pnl else "N/A"
                        msg = (
                            f"🔔 *Position Closed*\n\n"
                            f"Trade: `{closed.trade_id}`\n"
                            f"City: {closed.city} ({closed.trade_side})\n"
                            f"Reason: {reason}\n"
                            f"P&L: `{pnl_str}`"
                        )
                        for uid in self._allowed_users:
                            try:
                                await self.bot.app.bot.send_message(
                                    chat_id=uid, text=msg, parse_mode="Markdown"
                                )
                            except Exception:
                                pass
            except Exception as e:
                logger.warning(f"[Scheduler] exit check error for {pos.trade_id}: {e}")

    async def run(self):
        """Start everything."""
        logger.info("=" * 60)
        logger.info("🌦️  PolyWeather Bot starting...")
        logger.info(f"   Mode: {self.mode.upper()}")
        logger.info(f"   Scan interval: {self.scan_interval} min")
        logger.info("=" * 60)

        # Init portfolio DB
        await self.portfolio.init_db()
        logger.info(f"[Init] Portfolio bankroll: ${self.portfolio.bankroll:,.2f}")

        # Schedule jobs
        self.scheduler.add_job(
            self.scheduled_scan,
            "interval",
            minutes=self.scan_interval,
            id="market_scan",
            next_run_time=datetime.now(timezone.utc),  # run immediately on start
        )
        self.scheduler.add_job(
            self.scheduled_exit_check,
            "interval",
            minutes=self.exit_check_interval,
            id="exit_check",
        )
        self.scheduler.start()
        logger.info("[Scheduler] Jobs started")

        # Start Telegram bot
        app = self.bot.build_app()
        logger.info("[Telegram] Bot starting...")

        try:
            await app.initialize()
            await app.start()
            await app.updater.start_polling(drop_pending_updates=True)
            logger.info("[Telegram] Bot running. Press Ctrl+C to stop.")
            # Keep alive
            while True:
                await asyncio.sleep(60)
        except (KeyboardInterrupt, SystemExit):
            logger.info("Shutting down...")
        finally:
            await app.updater.stop()
            await app.stop()
            await app.shutdown()
            self.scheduler.shutdown()
            await self.engine.close()
            await self.portfolio.close()
            logger.info("Shutdown complete.")


async def main():
    import os
    os.makedirs("logs", exist_ok=True)
    orchestrator = Orchestrator()
    await orchestrator.run()


if __name__ == "__main__":
    asyncio.run(main())
