# 🌦️ PolyWeather Bot

> **Automated Polymarket Weather Trading Bot** — Ensemble forecasting meets prediction market arbitrage, operated via Telegram.

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![Railway](https://img.shields.io/badge/deploy-Railway-blueviolet)](https://railway.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        TELEGRAM BOT (UI)                        │
│           /menu  /scan  /signals  /portfolio  /paper            │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     ORCHESTRATOR ENGINE                         │
│         Scheduler → Signal Generator → Risk Manager             │
└───────┬──────────────────────┬──────────────────────────────────┘
        │                      │
┌───────▼──────┐    ┌──────────▼──────────┐
│  WEATHER     │    │   POLYMARKET LAYER   │
│  DATA LAYER  │    │                      │
│              │    │  Gamma API (discover) │
│ Open-Meteo   │    │  CLOB API (execute)  │
│ GFS 31-memb  │    │  Data API (history)  │
│ ECMWF IFS    │    │  WebSocket (live)    │
│ HRRR (US)    │    └──────────────────────┘
│ NBM Prob     │
│ NWS/NOAA     │
└───────┬───────┘
        │
┌───────▼───────────────────────────────────────────────────────┐
│                   PROBABILISTIC ENGINE                         │
│                                                                │
│  1. Ensemble voting (31+ members) → P(threshold exceeded)      │
│  2. Bayesian calibration (historical bias correction)          │
│  3. Edge detection: model_prob vs market_price                 │
│  4. Kelly Criterion sizing (fractional, capped 5% bankroll)    │
│  5. EV filter: only trade when EV > 3%                         │
└───────────────────────────────────────────────────────────────┘
        │
┌───────▼───────────────────────────────────────────────────────┐
│                    PAPER TRADING ENGINE                        │
│   Virtual portfolio → Track W/L → Winrate → Go Live trigger   │
└───────────────────────────────────────────────────────────────┘
```

---

## 🧠 Strategy: How the Edge is Found

### 1. Weather Probability Estimation
- Pull **31-member GFS ensemble** from Open-Meteo (free)
- Pull **ECMWF IFS 9km** (free since Oct 2025)
- Count fraction of members above/below market threshold
- `model_prob = members_above / total_members`
- Apply historical **bias correction** per city/season

### 2. Market Price vs Model Probability
- Fetch live Polymarket YES price (= implied probability)
- `edge = model_prob - market_price`
- Trade YES if `edge > +MIN_EDGE` (default 8%)
- Trade NO if `edge < -MIN_EDGE`

### 3. Kelly Criterion Position Sizing
```
kelly = (win_prob * (1/price - 1) - loss_prob) / (1/price - 1)
position = kelly * KELLY_FRACTION * bankroll
position = min(position, MAX_POSITION_USD, bankroll * MAX_PCT)
```

### 4. Exit Logic
- **Take profit**: when market price moves toward model_prob (edge < 2%)
- **Stop loss**: when ensemble shifts and edge flips sign
- **Time decay**: auto-close 2h before market resolution

---

## 🌐 Data Sources

| Source | Data | Cost | Update |
|--------|------|------|--------|
| Open-Meteo Ensemble | GFS 31-member, ECMWF 51-member | Free | 6h |
| Open-Meteo Forecast | HRRR, NBM, GFS-GraphCast | Free | 1-6h |
| NOAA NWS API | Official US observations | Free | 1h |
| Open-Meteo Historical | Bias correction archive | Free | Daily |
| Polymarket Gamma API | Market discovery | Free | Live |
| Polymarket CLOB API | Order execution | Free* | Live |
| Polymarket WebSocket | Real-time price feed | Free | <100ms |

---

## 📦 Installation

### Prerequisites
- Python 3.11+
- Telegram Bot Token ([@BotFather](https://t.me/BotFather))
- Polymarket wallet private key (for live trading)
- USDC on Polygon network

### Local Setup
```bash
git clone https://github.com/yourusername/polyweather-bot
cd polyweather-bot

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env with your credentials

# Run in paper trading mode (no real funds)
python -m src.main --mode paper

# Run bot
python -m src.main
```

### Environment Variables
```env
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_ALLOWED_USERS=123456789,987654321  # comma-separated user IDs

# Polymarket (only needed for live trading)
POLYMARKET_PRIVATE_KEY=0x...
POLYMARKET_FUNDER_ADDRESS=0x...

# Trading Config
TRADING_MODE=paper          # paper | live
BANKROLL_USD=1000           # starting virtual bankroll for paper
MIN_EDGE=0.08               # minimum edge to trade (8%)
KELLY_FRACTION=0.15         # fractional Kelly (conservative)
MAX_POSITION_USD=100        # max $ per trade
MAX_POSITION_PCT=0.05       # max 5% of bankroll per trade
MAX_OPEN_POSITIONS=10       # simultaneous positions

# Scanning
SCAN_INTERVAL_MINUTES=5     # how often to scan markets
EXIT_CHECK_MINUTES=15       # how often to check exit conditions

# Paper Trading
PAPER_BANKROLL=1000
WINRATE_THRESHOLD=0.55      # min winrate to go live
MIN_PAPER_TRADES=50         # min trades before going live
```

---

## 🤖 Telegram Commands

| Command | Description |
|---------|-------------|
| `/start` | Initialize bot, show menu |
| `/menu` | Interactive main menu |
| `/scan` | Trigger manual market scan |
| `/signals` | Show current trading signals with edge |
| `/portfolio` | Open positions + P&L |
| `/paper` | Paper trading dashboard |
| `/stats` | Win rate, Sharpe, ROI stats |
| `/alerts on/off` | Toggle auto-signal alerts |
| `/config` | View/edit bot parameters |
| `/market [slug]` | Detail on specific market |
| `/close [id]` | Manually close a position |
| `/help` | Command reference |

---

## 🚀 Deploy to Railway

See [RAILWAY_DEPLOY.md](docs/RAILWAY_DEPLOY.md) for full step-by-step.

**Quick deploy:**
1. Fork this repo
2. Connect Railway to your GitHub
3. Set environment variables in Railway dashboard
4. Deploy — Railway auto-detects `Procfile`

---

## 📊 Performance Tracking

The bot tracks:
- **Win Rate** (target >55%)
- **Average Edge Captured**
- **Sharpe Ratio** (risk-adjusted returns)
- **Max Drawdown**
- **ROI** per market category
- **Model Calibration** (Brier Score per model)

Paper trading requires **50+ resolved trades** and **>55% win rate** before recommending live mode.

---

## ⚠️ Disclaimer

This bot is for **educational and research purposes**. Prediction market trading involves financial risk. Always use paper trading first. Never risk capital you cannot afford to lose. The authors are not responsible for financial losses.

---

## 📄 License

MIT — see [LICENSE](LICENSE)
