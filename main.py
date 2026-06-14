"""
PolyWeather Bot — Main Entry Point
Orchestrates engine, portfolio, scheduler, and Telegram bot.
"""
import asyncio
import os
import sys

# ── Ensure src/ is importable regardless of working directory ──
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

from loguru import logger

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logger.remove()
logger.add(sys.stderr, level=LOG_LEVEL, colorize=True,
           format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")

os.makedirs("logs", exist_ok=True)
logger.add("logs/bot.log", rotation="10 MB", retention="7 days", level="DEBUG")

# ── Guard: fail fast with clear message if deps missing ─────────
try:
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
except ImportError:
    logger.error("APScheduler not installed. Run: pip install APScheduler==3.10.4")
    sys.exit(1)

try:
    from telegram.ext import Application
except ImportError:
    logger.error("python-telegram-bot not installed. Run: pip install python-telegram-bot==21.6")
    sys.exit(1)

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
        logger.info(f"[Scheduler] Scan @ {datetime.now(timezone.utc).strftime('%H:%M UTC')}")
        try:
            bankroll = self.portfolio.bankroll
            signals = await self.engine.scan_and_rank(bankroll)
            self.bot._signals_cache = signals

            if signals:
                logger.info(f"[Scheduler] {len(signals)} signal(s) found, broadcasting top 3")
                for s in signals[:3]:
                    await self.bot.broadcast_signal(s, self._allowed_users)

                # Auto paper-trade high-confidence signals
                for s in signals:
                    if s.confidence == "high" and abs(s.edge) >= 0.12:
                        trade = await self.portfolio.open_trade(s)
                        if trade:
                            logger.info(f"[Scheduler] Auto paper: {trade.trade_id} {s.city} {s.trade_side}")
        except Exception as e:
            logger.error(f"[Scheduler] scan error: {e}", exc_info=True)

    async def scheduled_exit_check(self):
        """Check open positions for exit conditions."""
        positions = await self.portfolio.get_open_positions()
        if not positions:
            return
        logger.info(f"[Scheduler] Checking {len(positions)} position(s) for exits...")
        for pos in positions:
            try:
                result = await self.engine.check_exit_conditions(
                    {
                        "condition_id": pos.condition_id,
                        "model_prob": pos.model_prob,
                        "edge": pos.edge,
                        "trade_side": pos.trade_side,
                        "entry_price": pos.entry_price,
                        "trade_token_id": pos.condition_id,
                        "end_date": pos.end_date or "",
                    },
                    self.portfolio.bankroll,
                )
                action = result["action"]
                reason = result["reason"]

                if action != "hold":
                    logger.info(f"[Scheduler] Exit {pos.trade_id}: {action} — {reason}")
                    if action == "close_profit":
                        exit_price = min(pos.entry_price + abs(pos.edge) * 0.6, 0.95)
                    elif action == "close_loss":
                        exit_price = max(pos.entry_price - 0.03, 0.05)
                    else:
                        exit_price = pos.entry_price

                    closed = await self.portfolio.close_trade(
                        pos.trade_id, exit_price=exit_price, reason=action
                    )
                    if closed and self._allowed_users:
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
                logger.warning(f"[Scheduler] exit check error {pos.trade_id}: {e}")

    async def run(self):
        """Main entry — start all services."""
        logger.info("=" * 60)
        logger.info("🌦️  PolyWeather Bot starting...")
        logger.info(f"   Mode    : {self.mode.upper()}")
        logger.info(f"   Scan    : every {self.scan_interval} min")
        logger.info(f"   Users   : {self._allowed_users}")
        logger.info("=" * 60)

        await self.portfolio.init_db()
        logger.info(f"[Init] Bankroll: ${self.portfolio.bankroll:,.2f}")

        # Validate Telegram token
        token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        if not token or token == "your_telegram_bot_token_here":
            logger.error("TELEGRAM_BOT_TOKEN is not set! Add it to Railway env vars.")
            sys.exit(1)

        # Schedule jobs
        self.scheduler.add_job(
            self.scheduled_scan, "interval", minutes=self.scan_interval,
            id="market_scan", next_run_time=datetime.now(timezone.utc),
        )
        self.scheduler.add_job(
            self.scheduled_exit_check, "interval", minutes=self.exit_check_interval,
            id="exit_check",
        )
        self.scheduler.start()
        logger.info("[Scheduler] Jobs started")

        app = self.bot.build_app()
        logger.info("[Telegram] Starting bot...")

        try:
            await app.initialize()
            await app.start()
            await app.updater.start_polling(drop_pending_updates=True)
            logger.info("[Telegram] ✅ Bot running. Send /start in Telegram.")
            while True:
                await asyncio.sleep(60)
        except (KeyboardInterrupt, SystemExit):
            logger.info("Shutting down...")
        finally:
            try:
                await app.updater.stop()
                await app.stop()
                await app.shutdown()
            except Exception:
                pass
            self.scheduler.shutdown(wait=False)
            await self.engine.close()
            await self.portfolio.close()
            logger.info("Shutdown complete.")


async def main():
    orchestrator = Orchestrator()
    await orchestrator.run()


if __name__ == "__main__":
    asyncio.run(main())
