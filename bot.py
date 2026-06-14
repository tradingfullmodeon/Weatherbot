"""
Telegram Bot Interface
Full menu system with inline keyboards, signals, portfolio, paper trading dashboard.
"""
import os
import asyncio
import json
from typing import Optional
from datetime import datetime, timezone

from telegram import (
    Update, InlineKeyboardButton, InlineKeyboardMarkup, BotCommand
)
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler,
    ContextTypes, MessageHandler, filters
)
from loguru import logger

from src.models.engine import ProbabilisticEngine
from src.models.paper_trading import PaperPortfolio


# ─── Auth ───────────────────────────────────────────────────────────────────
def _allowed(user_id: int) -> bool:
    allowed_raw = os.getenv("TELEGRAM_ALLOWED_USERS", "")
    if not allowed_raw:
        return True  # no restriction if not set
    allowed = [int(x.strip()) for x in allowed_raw.split(",") if x.strip()]
    return user_id in allowed


def auth_required(func):
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        uid = update.effective_user.id
        if not _allowed(uid):
            await update.effective_message.reply_text("⛔ Not authorized.")
            return
        return await func(update, context)
    return wrapper


# ─── Keyboards ──────────────────────────────────────────────────────────────
def main_menu_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("🔍 Scan Markets", callback_data="scan"),
            InlineKeyboardButton("📊 Signals", callback_data="signals"),
        ],
        [
            InlineKeyboardButton("💼 Portfolio", callback_data="portfolio"),
            InlineKeyboardButton("📄 Paper Trading", callback_data="paper"),
        ],
        [
            InlineKeyboardButton("📈 Statistics", callback_data="stats"),
            InlineKeyboardButton("⚙️ Config", callback_data="config"),
        ],
        [
            InlineKeyboardButton("🔔 Toggle Alerts", callback_data="toggle_alerts"),
            InlineKeyboardButton("❓ Help", callback_data="help"),
        ],
    ])


def signal_action_keyboard(signal_id: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✅ Execute Paper Trade", callback_data=f"paper_trade_{signal_id}"),
            InlineKeyboardButton("🔴 Skip", callback_data=f"skip_{signal_id}"),
        ],
        [InlineKeyboardButton("◀️ Back to Signals", callback_data="signals")],
    ])


def position_keyboard(trade_id: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("🔴 Close Position", callback_data=f"close_{trade_id}"),
            InlineKeyboardButton("📊 Details", callback_data=f"detail_{trade_id}"),
        ],
        [InlineKeyboardButton("◀️ Back", callback_data="portfolio")],
    ])


# ─── Bot ────────────────────────────────────────────────────────────────────
class PolyWeatherBot:
    def __init__(self, engine: ProbabilisticEngine, portfolio: PaperPortfolio):
        self.engine = engine
        self.portfolio = portfolio
        self.token = os.getenv("TELEGRAM_BOT_TOKEN")
        self._signals_cache: list = []
        self._alerts_enabled = True
        self.mode = os.getenv("TRADING_MODE", "paper")
        self.app = None

    async def _get_bankroll(self) -> float:
        return self.portfolio.bankroll

    # ── Command Handlers ──────────────────────────────────────────────────
    @auth_required
    async def cmd_start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        mode_emoji = "📄" if self.mode == "paper" else "💰"
        bankroll = await self._get_bankroll()
        text = (
            f"🌦️ *PolyWeather Bot* — Active\n\n"
            f"{mode_emoji} Mode: *{self.mode.upper()}*\n"
            f"💵 Bankroll: *${bankroll:,.2f}*\n\n"
            f"Real-time weather ensemble arbitrage on Polymarket.\n"
            f"GFS (31-member) + ECMWF IFS + HRRR → Kelly Criterion sizing.\n\n"
            f"Select an action below:"
        )
        await update.message.reply_text(
            text, parse_mode="Markdown", reply_markup=main_menu_keyboard()
        )

    @auth_required
    async def cmd_menu(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text(
            "📋 *Main Menu*", parse_mode="Markdown", reply_markup=main_menu_keyboard()
        )

    @auth_required
    async def cmd_scan(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        msg = await update.message.reply_text("🔍 Scanning Polymarket weather markets...\n⏳ Fetching ensemble forecasts...")
        bankroll = await self._get_bankroll()
        signals = await self.engine.scan_and_rank(bankroll)
        self._signals_cache = signals
        count = len(signals)
        text = f"✅ Scan complete!\n\n📊 Found *{count}* signal(s) with edge ≥ {float(os.getenv('MIN_EDGE','0.08')):.0%}\n\nUse /signals to view them."
        await msg.edit_text(text, parse_mode="Markdown")
        if signals:
            await self._send_top_signals(update, signals[:3])

    @auth_required
    async def cmd_signals(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not self._signals_cache:
            await update.message.reply_text(
                "No signals cached. Run /scan first."
            )
            return
        await self._send_top_signals(update, self._signals_cache[:5])

    @auth_required
    async def cmd_portfolio(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        positions = await self.portfolio.get_open_positions()
        if not positions:
            await update.message.reply_text(
                "💼 *Portfolio*\n\nNo open positions.",
                parse_mode="Markdown"
            )
            return

        text = f"💼 *Open Positions* ({len(positions)})\n\n"
        for t in positions:
            edge_str = f"{t.edge:+.1%}"
            text += (
                f"🔹 `{t.trade_id}` — {t.city}\n"
                f"   {t.trade_side} @ ${t.entry_price:.3f} | ${t.size_usd:.2f}\n"
                f"   Edge: {edge_str} | {t.confidence.upper()}\n"
                f"   *{t.question[:50]}...*\n\n"
            )
        await update.message.reply_text(text, parse_mode="Markdown")

    @auth_required
    async def cmd_paper(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        stats = await self.portfolio.get_stats()
        if "error" in stats:
            await update.message.reply_text(
                f"📄 *Paper Trading Dashboard*\n\n{stats['error']}\n\nRun /scan to start generating signals.",
                parse_mode="Markdown"
            )
            return
        await update.message.reply_text(
            _format_paper_stats(stats), parse_mode="Markdown"
        )

    @auth_required
    async def cmd_stats(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        stats = await self.portfolio.get_stats()
        if "error" in stats:
            await update.message.reply_text(stats["error"])
            return
        await update.message.reply_text(_format_paper_stats(stats), parse_mode="Markdown")

    @auth_required
    async def cmd_config(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        text = (
            "⚙️ *Bot Configuration*\n\n"
            f"Mode: `{self.mode}`\n"
            f"Min Edge: `{float(os.getenv('MIN_EDGE','0.08')):.0%}`\n"
            f"Kelly Fraction: `{float(os.getenv('KELLY_FRACTION','0.15')):.0%}`\n"
            f"Max Position USD: `${float(os.getenv('MAX_POSITION_USD','100')):.0f}`\n"
            f"Max Position %: `{float(os.getenv('MAX_POSITION_PCT','0.05')):.0%}`\n"
            f"Max Positions: `{os.getenv('MAX_OPEN_POSITIONS','10')}`\n"
            f"Scan Interval: `{os.getenv('SCAN_INTERVAL_MINUTES','5')} min`\n"
            f"Min Liquidity: `${float(os.getenv('MIN_LIQUIDITY_USD','500')):.0f}`\n"
            f"Alerts: `{'ON' if self._alerts_enabled else 'OFF'}`\n"
        )
        await update.message.reply_text(text, parse_mode="Markdown")

    @auth_required
    async def cmd_help(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        text = (
            "❓ *PolyWeather Bot — Commands*\n\n"
            "/start — Welcome screen & menu\n"
            "/menu — Show main menu\n"
            "/scan — Scan all weather markets for edges\n"
            "/signals — Show cached signals\n"
            "/portfolio — Open positions\n"
            "/paper — Paper trading dashboard\n"
            "/stats — Detailed statistics\n"
            "/config — Bot configuration\n"
            "/alerts on|off — Toggle notifications\n"
            "/help — This message\n\n"
            "*Strategy:* GFS 31-member ensemble + ECMWF IFS → edge vs Polymarket → Kelly sizing\n"
            "*Min edge:* 8% | *Kelly fraction:* 15% (conservative)\n"
        )
        await update.message.reply_text(text, parse_mode="Markdown")

    # ── Callback Handlers ─────────────────────────────────────────────────
    @auth_required
    async def callback_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        await query.answer()
        data = query.data

        if data == "scan":
            await query.edit_message_text("🔍 Scanning markets... ⏳")
            bankroll = await self._get_bankroll()
            signals = await self.engine.scan_and_rank(bankroll)
            self._signals_cache = signals
            await query.edit_message_text(
                f"✅ Found *{len(signals)}* signal(s).",
                parse_mode="Markdown",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("📊 View Signals", callback_data="signals")],
                    [InlineKeyboardButton("◀️ Menu", callback_data="menu")],
                ])
            )

        elif data == "signals":
            if not self._signals_cache:
                await query.edit_message_text("No signals. Press 'Scan Markets' first.", reply_markup=main_menu_keyboard())
                return
            text = _format_signals_list(self._signals_cache[:5])
            await query.edit_message_text(text, parse_mode="Markdown", reply_markup=main_menu_keyboard())

        elif data == "portfolio":
            positions = await self.portfolio.get_open_positions()
            if not positions:
                await query.edit_message_text("💼 No open positions.", reply_markup=main_menu_keyboard())
                return
            text = "💼 *Open Positions*\n\n"
            for t in positions:
                text += f"• `{t.trade_id}` {t.city} {t.trade_side} ${t.size_usd:.2f} edge={t.edge:+.1%}\n"
            await query.edit_message_text(text, parse_mode="Markdown", reply_markup=main_menu_keyboard())

        elif data == "paper":
            stats = await self.portfolio.get_stats()
            if "error" in stats:
                await query.edit_message_text(stats["error"], reply_markup=main_menu_keyboard())
                return
            await query.edit_message_text(_format_paper_stats(stats), parse_mode="Markdown", reply_markup=main_menu_keyboard())

        elif data == "stats":
            stats = await self.portfolio.get_stats()
            text = _format_paper_stats(stats) if "error" not in stats else stats["error"]
            await query.edit_message_text(text, parse_mode="Markdown", reply_markup=main_menu_keyboard())

        elif data == "config":
            await query.edit_message_text(
                f"⚙️ Mode: {self.mode} | Edge: {float(os.getenv('MIN_EDGE','0.08')):.0%} | Kelly: {float(os.getenv('KELLY_FRACTION','0.15')):.0%}",
                reply_markup=main_menu_keyboard()
            )

        elif data == "toggle_alerts":
            self._alerts_enabled = not self._alerts_enabled
            status = "ON 🔔" if self._alerts_enabled else "OFF 🔕"
            await query.edit_message_text(f"Alerts: {status}", reply_markup=main_menu_keyboard())

        elif data == "help":
            await query.edit_message_text(
                "Use /help for full command list.", reply_markup=main_menu_keyboard()
            )

        elif data.startswith("paper_trade_"):
            signal_id = data.replace("paper_trade_", "")
            signal = next((s for s in self._signals_cache if s.signal_id == signal_id), None)
            if not signal:
                await query.edit_message_text("Signal expired. Rescan.", reply_markup=main_menu_keyboard())
                return
            trade = await self.portfolio.open_trade(signal)
            if trade:
                await query.edit_message_text(
                    f"✅ Paper trade opened!\n\n"
                    f"ID: `{trade.trade_id}`\n"
                    f"City: {trade.city}\n"
                    f"Side: {trade.trade_side} @ ${trade.entry_price:.3f}\n"
                    f"Size: ${trade.size_usd:.2f}\n"
                    f"Edge: {trade.edge:+.1%}",
                    parse_mode="Markdown",
                    reply_markup=main_menu_keyboard()
                )
            else:
                await query.edit_message_text("❌ Could not open trade (insufficient bankroll or duplicate).", reply_markup=main_menu_keyboard())

        elif data.startswith("close_"):
            trade_id = data.replace("close_", "")
            # Close at mid-price (simplified for paper)
            trade = await self.portfolio.close_trade(trade_id, exit_price=0.5, reason="manual")
            if trade:
                pnl_str = f"{trade.pnl:+.2f}" if trade.pnl else "N/A"
                await query.edit_message_text(
                    f"🔴 Position `{trade_id}` closed\nP&L: ${pnl_str}",
                    parse_mode="Markdown", reply_markup=main_menu_keyboard()
                )

        elif data == "menu":
            bankroll = await self._get_bankroll()
            await query.edit_message_text(
                f"📋 *Menu* | Bankroll: ${bankroll:,.2f}",
                parse_mode="Markdown",
                reply_markup=main_menu_keyboard()
            )

    # ── Alert Broadcasting ────────────────────────────────────────────────
    async def broadcast_signal(self, signal, chat_ids: list[int]):
        """Send a signal alert to all allowed users."""
        if not self._alerts_enabled:
            return
        text = _format_single_signal(signal)
        for cid in chat_ids:
            try:
                await self.app.bot.send_message(
                    chat_id=cid,
                    text=text,
                    parse_mode="Markdown",
                    reply_markup=signal_action_keyboard(signal.signal_id),
                )
            except Exception as e:
                logger.warning(f"[Bot] broadcast failed to {cid}: {e}")

    # ── Helpers ────────────────────────────────────────────────────────────
    async def _send_top_signals(self, update: Update, signals: list):
        for s in signals:
            text = _format_single_signal(s)
            await update.effective_message.reply_text(
                text,
                parse_mode="Markdown",
                reply_markup=signal_action_keyboard(s.signal_id),
            )
            await asyncio.sleep(0.3)

    # ── Application Setup ─────────────────────────────────────────────────
    def build_app(self) -> Application:
        app = Application.builder().token(self.token).build()
        self.app = app

        app.add_handler(CommandHandler("start", self.cmd_start))
        app.add_handler(CommandHandler("menu", self.cmd_menu))
        app.add_handler(CommandHandler("scan", self.cmd_scan))
        app.add_handler(CommandHandler("signals", self.cmd_signals))
        app.add_handler(CommandHandler("portfolio", self.cmd_portfolio))
        app.add_handler(CommandHandler("paper", self.cmd_paper))
        app.add_handler(CommandHandler("stats", self.cmd_stats))
        app.add_handler(CommandHandler("config", self.cmd_config))
        app.add_handler(CommandHandler("help", self.cmd_help))
        app.add_handler(CallbackQueryHandler(self.callback_handler))

        return app


# ─── Formatters ─────────────────────────────────────────────────────────────
def _format_single_signal(s) -> str:
    conf_emoji = {"high": "🟢", "medium": "🟡", "low": "🔴"}.get(s.confidence, "⚪")
    side_emoji = "📈" if s.trade_side == "YES" else "📉"
    return (
        f"🌦️ *Weather Signal* | `{s.signal_id}`\n\n"
        f"📍 *{s.city}* — {s.market_type.title()}\n"
        f"❓ {s.question[:80]}\n\n"
        f"*Model Analysis:*\n"
        f"  🤖 Model Prob: `{s.model_prob:.1%}`\n"
        f"  💹 Market Price: `{s.market_prob:.1%}`\n"
        f"  📐 Edge: `{s.edge:+.1%}`\n"
        f"  {conf_emoji} Confidence: `{s.confidence.upper()}`\n"
        f"  🔬 Models: `{', '.join(s.models_used)}`\n\n"
        f"*Trade Recommendation:*\n"
        f"  {side_emoji} Side: `{s.trade_side}` @ `${s.trade_price:.3f}`\n"
        f"  💰 Size: `${s.recommended_size_usd:.2f}`\n"
        f"  📊 Expected Value: `${s.expected_value:.2f}`\n"
        f"  🎯 Kelly: `{s.kelly_fraction:.1%}`\n"
    )


def _format_signals_list(signals: list) -> str:
    if not signals:
        return "No signals available. Run /scan."
    text = f"📊 *Top {len(signals)} Signals*\n\n"
    for i, s in enumerate(signals, 1):
        conf_emoji = {"high": "🟢", "medium": "🟡", "low": "🔴"}.get(s.confidence, "⚪")
        text += (
            f"{i}. {conf_emoji} *{s.city}* — {s.trade_side}\n"
            f"   Edge: `{s.edge:+.1%}` | Size: `${s.recommended_size_usd:.2f}` | EV: `${s.expected_value:.2f}`\n"
            f"   _{s.question[:55]}..._\n\n"
        )
    text += "_Use /scan to refresh_"
    return text


def _format_paper_stats(stats: dict) -> str:
    win_emoji = "🟢" if stats.get("win_rate", 0) >= 0.55 else "🔴"
    ready = "✅ READY FOR LIVE" if stats.get("ready_for_live") else "📄 Keep paper trading"
    pnl_emoji = "📈" if stats.get("total_pnl", 0) > 0 else "📉"
    return (
        f"📄 *Paper Trading Dashboard*\n\n"
        f"💰 Bankroll: `${stats.get('current_bankroll', 0):,.2f}` "
        f"(start: `${stats.get('initial_bankroll', 0):,.2f}`)\n"
        f"{pnl_emoji} Total P&L: `${stats.get('total_pnl', 0):+,.2f}`\n"
        f"📊 ROI: `{stats.get('roi', 0):+.1%}`\n\n"
        f"*Trade Stats:*\n"
        f"  📋 Total Trades: `{stats.get('total_trades', 0)}`\n"
        f"  💼 Open: `{stats.get('open_positions', 0)}`\n"
        f"  {win_emoji} Win Rate: `{stats.get('win_rate', 0):.1%}`\n"
        f"  ✅ Avg Win: `${stats.get('avg_win', 0):+.2f}`\n"
        f"  ❌ Avg Loss: `${stats.get('avg_loss', 0):+.2f}`\n"
        f"  ⚖️ Profit Factor: `{stats.get('profit_factor', 0):.2f}`\n\n"
        f"*Risk Metrics:*\n"
        f"  📐 Sharpe Ratio: `{stats.get('sharpe_ratio', 0):.2f}`\n"
        f"  📉 Max Drawdown: `${stats.get('max_drawdown', 0):.2f}`\n\n"
        f"*Status:* {ready}\n"
        f"_(Need: ≥55% WR + ≥50 trades)_"
    )
