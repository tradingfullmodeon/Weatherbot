"""Basic tests for PolyWeather Bot components."""
import pytest
import asyncio
import os

os.environ.setdefault("TRADING_MODE", "paper")
os.environ.setdefault("PAPER_BANKROLL", "1000")
os.environ.setdefault("MIN_EDGE", "0.08")
os.environ.setdefault("KELLY_FRACTION", "0.15")
os.environ.setdefault("MAX_POSITION_USD", "100")
os.environ.setdefault("MAX_POSITION_PCT", "0.05")


def test_market_parser_city_extraction():
    from src.api.polymarket import MarketParser
    assert MarketParser._extract_city("Will New York temperature exceed 90°F?") == "New York"
    assert MarketParser._extract_city("Will Miami high reach 95 degrees?") == "Miami"


def test_market_parser_threshold_extraction():
    from src.api.polymarket import MarketParser
    assert MarketParser._extract_threshold("Will temperature exceed 90°F on June 15?") == 90.0
    assert MarketParser._extract_threshold("Will Chicago be above 75 degrees?") == 75.0


def test_market_parser_classify():
    from src.api.polymarket import MarketParser
    assert MarketParser._classify_market("Will temperature exceed 90°F?") == "temperature"
    assert MarketParser._classify_market("Will total rainfall exceed 2 inches?") == "precipitation"
    assert MarketParser._classify_market("Will hurricane make landfall?") == "hurricane"


def test_kelly_criterion():
    """Test Kelly formula gives sensible results."""
    win_prob = 0.65
    price = 0.50
    odds = (1 / price) - 1  # = 1.0
    loss_prob = 1 - win_prob
    kelly_full = (win_prob * odds - loss_prob) / odds
    kelly_fraction = 0.15
    kelly_used = kelly_full * kelly_fraction

    assert 0 < kelly_used < 0.5  # should be positive and not crazy large
    assert kelly_used < kelly_full  # fractional is smaller


@pytest.mark.asyncio
async def test_paper_portfolio_open_close():
    """Test paper trading open and close cycle."""
    from src.models.paper_trading import PaperPortfolio
    from src.models.engine import TradingSignal

    portfolio = PaperPortfolio()
    portfolio.db_path = ":memory:"
    import aiosqlite
    portfolio._db = await aiosqlite.connect(":memory:")
    await portfolio._db.execute("""
        CREATE TABLE IF NOT EXISTS trades (
            trade_id TEXT PRIMARY KEY, condition_id TEXT, question TEXT,
            city TEXT, market_type TEXT, trade_side TEXT, entry_price REAL,
            size_usd REAL, shares REAL, model_prob REAL, edge REAL,
            confidence TEXT, status TEXT DEFAULT 'open', exit_price REAL,
            pnl REAL, pnl_pct REAL, resolved_outcome TEXT, entry_time TEXT,
            exit_time TEXT, end_date TEXT, signal_id TEXT, models_used TEXT
        )
    """)
    await portfolio._db.execute("""
        CREATE TABLE IF NOT EXISTS portfolio_state (key TEXT PRIMARY KEY, value TEXT)
    """)
    await portfolio._db.commit()

    signal = TradingSignal(
        signal_id="test01",
        condition_id="0x123",
        question="Will Miami exceed 95°F tomorrow?",
        city="Miami",
        market_type="temperature",
        threshold_f=95.0,
        yes_token_id="0xabc",
        no_token_id="0xdef",
        yes_price=0.40,
        no_price=0.60,
        model_prob=0.72,
        market_prob=0.40,
        edge=0.32,
        trade_side="YES",
        trade_token_id="0xabc",
        trade_price=0.40,
        kelly_fraction=0.05,
        recommended_size_usd=50.0,
        expected_value=12.0,
        ensemble_members=31,
        model_spread_f=3.2,
        confidence="high",
        models_used=["gfs_ensemble", "ecmwf"],
    )

    trade = await portfolio.open_trade(signal)
    assert trade is not None
    assert trade.city == "Miami"
    assert trade.size_usd == 50.0
    assert portfolio.bankroll == 950.0

    closed = await portfolio.close_trade(trade.trade_id, exit_price=0.65, reason="profit")
    assert closed is not None
    assert closed.pnl is not None
    assert closed.pnl > 0  # should be profitable

    await portfolio.close()
