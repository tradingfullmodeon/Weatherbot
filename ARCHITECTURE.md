# 📐 PolyWeather Bot — Architecture & Strategy Paper

## Overview

PolyWeather Bot is a systematic, model-driven trading bot that identifies pricing inefficiencies between weather ensemble forecast models and Polymarket prediction markets. It operates through Telegram, provides paper trading for validation, and uses rigorous statistical methods to maximize edge while controlling risk.

---

## 1. The Core Thesis

Polymarket weather markets are priced by crowd sentiment. Professional weather ensemble models (GFS, ECMWF) often disagree with the crowd's implied probability by a statistically significant margin. When:

```
|P_model - P_market| > 8%
```

...there is a measurable edge. The bot exploits this edge systematically using:
- **31-member GFS ensemble** (Open-Meteo, free)
- **ECMWF IFS 9km** (open-data since October 2025, free)
- **HRRR/NBM** for US short-range (free)
- **Kelly Criterion** for optimal position sizing

---

## 2. Weather Models Used

### 2.1 GFS Ensemble (Primary)
- **Source**: NOAA/NCEP via Open-Meteo Ensemble API
- **Members**: 31
- **Resolution**: 0.25° (~25km)
- **Update**: Every 6 hours (00Z, 06Z, 12Z, 18Z)
- **Horizon**: 16 days
- **Usage**: Count members exceeding temperature threshold → P(YES)

### 2.2 ECMWF IFS (Secondary)
- **Source**: ECMWF via Open-Meteo (open-data, CC-BY 4.0 since Oct 2025)
- **Resolution**: 9km (native O1280 grid)
- **Update**: Every 6 hours
- **Horizon**: 15 days (10-day high skill)
- **Usage**: Deterministic forecast → logistic soft-probability conversion

### 2.3 HRRR + NBM (US Short-Range)
- **Source**: NOAA via Open-Meteo
- **Resolution**: 3km (HRRR), native (NBM)
- **Update**: Hourly (HRRR), every 6h (NBM)
- **Usage**: <48h US markets (highest accuracy zone)

### 2.4 Model Weighting
```
weighted_prob = (3 × P_gfs + 2 × P_ecmwf + 1 × P_bestmatch) / 6
```

---

## 3. Probability Computation

### 3.1 For Temperature Markets

**Input**: City, date, threshold (e.g., "Will Miami exceed 95°F on June 15?")

**GFS Ensemble Method**:
```python
members_above = count(member_max > threshold for member in gfs_members)
P_gfs = members_above / 31
```

**ECMWF Soft Probability**:
```python
# Logistic conversion assuming ±5°F = ±1σ
z = (ecmwf_forecast - threshold) / 5.0
P_ecmwf = sigmoid(z)
```

**Confidence Assessment**:
- **High**: spread < 3°F AND |P - 0.5| > 25%
- **Medium**: spread < 6°F AND |P - 0.5| > 10%
- **Low**: otherwise (skip or small size)

### 3.2 For Precipitation Markets
- Use `precipitation_probability` directly from Open-Meteo
- Cross-validate with ECMWF precipitation ensemble

### 3.3 For Hurricane/Extreme Events
- Use ECMWF seasonal ensemble (51 members, 6-week horizon)
- Track NHC advisories via NOAA API

---

## 4. Edge Detection & Signal Filtering

```
Edge = P_model - P_market

Signal = YES  if Edge > +MIN_EDGE (model says more likely than market)
Signal = NO   if Edge < -MIN_EDGE (model says less likely than market)
Skip          if |Edge| < MIN_EDGE
```

**Default MIN_EDGE = 8%** (based on transaction costs + noise floor)

### Signal Ranking
Signals are ranked by **Expected Value**:
```
EV = P_win × profit_per_dollar × size - P_lose × size
   = P_win × (1/price - 1) × size - P_lose × size
```

---

## 5. Kelly Criterion Position Sizing

The Kelly Criterion maximizes long-run bankroll growth:
```
Kelly_full = (win_prob × odds - loss_prob) / odds

where:
  win_prob = P_model for the chosen side
  loss_prob = 1 - win_prob
  odds = (1/market_price - 1)  # net profit per $1 risked
```

**Fractional Kelly (0.15×)** is used to account for:
- Model uncertainty (P_model is estimated, not exact)
- Parameter estimation error
- Psychological stability during drawdowns

**Size caps**:
```python
size = min(
    kelly_full × 0.15 × bankroll,
    MAX_POSITION_USD,           # hard $ cap
    bankroll × MAX_POSITION_PCT # % cap
)
```

---

## 6. Exit Rules

| Condition | Action | Logic |
|-----------|--------|-------|
| Market price converges to model | Take Profit | `price_move > 60% of entry_edge` |
| Time to expiry < 2h | Close (Decay) | Lock in position, avoid resolution variance |
| Adverse move > 3% | Stop Loss | Prevent large losses on single trade |
| Ensemble shifts direction | Model Stop | Re-run forecast shows edge flipped |

---

## 7. Paper Trading Validation Protocol

Before going live, the bot must demonstrate:
- **≥ 50 resolved trades** (statistically significant)
- **Win rate ≥ 55%**
- **Positive total P&L**
- **Profit factor ≥ 1.2**
- **Max drawdown < 25% of initial bankroll**

The paper trading engine:
1. Tracks exact entry/exit prices
2. Simulates fractional Kelly sizing
3. Logs all decisions with timestamps
4. Computes Brier Score per model (calibration)
5. Generates weekly performance reports

---

## 8. Risk Management

### Position Limits
- Max 10 simultaneous positions (diversification)
- Max 5% bankroll per trade
- Max $100 per trade (absolute)

### Model Risk
- Only trade markets where ≥2 models agree on direction
- Skip markets within 6h of resolution (high noise)
- Skip markets with liquidity < $500

### Regime Filters
- During extreme weather events (hurricane season): halve Kelly fraction
- When model spread > 8°F: skip or quarter size (low confidence)

---

## 9. Resolution Sources Mapping

Polymarket weather markets specify their resolution source. The bot must match:

| Resolution Source | Best Data Match |
|-------------------|-----------------|
| NOAA official station | NOAA NWS API + Open-Meteo bias-corrected |
| Weather Underground | Open-Meteo best_match |
| AccuWeather | Open-Meteo ECMWF |
| NWS forecast | NOAA NWS API |

**Critical**: The bot's probability estimate is compared against the **same data source** that will be used for resolution.

---

## 10. Competitive Landscape

| Tool | Approach | Status |
|------|----------|--------|
| **WeatherBot.fi** | 4-model ensemble, Bayesian, Kelly, 67+ cities | Commercial, paid |
| **suislanchez/polymarket-kalshi-weather-bot** | GFS 31-member, Kalshi+Poly, React dashboard | Open-source, GitHub |
| **Predict & Profit** | GFS/HGEFS 62-member, calibrated | Paid subscription |
| **Wethr** | Analytics platform | SaaS |
| **PolyWeather Bot (this)** | Multi-model, Telegram, paper→live | Open-source |

**Our advantages**:
- Free (Open-Meteo, no paid APIs)
- Telegram-native (no dashboard to manage)
- Paper trading with automatic live promotion
- ECMWF IFS 9km (highest resolution available free since Oct 2025)

---

## 11. Expected Performance (Based on Literature)

Based on comparable prediction market arbitrage strategies:
- **Win rate**: 55-65% (weather markets are more predictable than politics)
- **Average edge captured**: 4-8% per trade
- **Annualized Sharpe**: 0.8-1.5 (with conservative Kelly)
- **Monthly ROI**: 3-8% (highly variable by market availability)

The key driver is **calibration** — the more accurately the model probability matches reality, the better the long-run results.

---

## 12. Future Improvements

1. **Bayesian calibration**: Adjust model_prob using historical forecast errors per city/season
2. **Cross-platform arbitrage**: Kalshi ↔ Polymarket price differences
3. **NLP market parsing**: Use LLM to extract city/threshold from complex questions
4. **Reinforcement Learning**: Optimize Kelly fraction dynamically based on recent performance
5. **HGEFS 62-member**: Upgrade to higher-member ensemble for lower variance
6. **Seasonal climatology**: Use historical percentile data as prior
