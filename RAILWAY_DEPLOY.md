# 🚀 Railway Deployment Guide — PolyWeather Bot

## Prerequisites
- GitHub account with this repo forked/pushed
- Railway account: https://railway.app (free tier works)
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- Your Telegram User ID (from [@userinfobot](https://t.me/userinfobot))

---

## Step 1 — Create Telegram Bot

1. Open Telegram → search `@BotFather`
2. Send `/newbot`
3. Give it a name: `PolyWeather Bot`
4. Give it a username: `polyweather_yourname_bot`
5. Copy the **Bot Token** (looks like `123456:ABCdef...`)
6. Get your user ID from `@userinfobot` → send `/start`

---

## Step 2 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial PolyWeather Bot"
git branch -M main
git remote add origin https://github.com/yourusername/polyweather-bot.git
git push -u origin main
```

---

## Step 3 — Create Railway Project

1. Go to https://railway.app → **New Project**
2. Select **Deploy from GitHub repo**
3. Connect your GitHub account if needed
4. Select your `polyweather-bot` repo
5. Railway auto-detects Python via `nixpacks.toml`

---

## Step 4 — Set Environment Variables

In Railway dashboard → your service → **Variables** tab:

| Variable | Value | Required |
|----------|-------|----------|
| `TELEGRAM_BOT_TOKEN` | `your_bot_token` | ✅ |
| `TELEGRAM_ALLOWED_USERS` | `your_telegram_user_id` | ✅ |
| `TRADING_MODE` | `paper` | ✅ |
| `PAPER_BANKROLL` | `1000` | ✅ |
| `MIN_EDGE` | `0.08` | ✅ |
| `KELLY_FRACTION` | `0.15` | ✅ |
| `MAX_POSITION_USD` | `100` | ✅ |
| `MAX_POSITION_PCT` | `0.05` | ✅ |
| `MAX_OPEN_POSITIONS` | `10` | ✅ |
| `SCAN_INTERVAL_MINUTES` | `5` | ✅ |
| `EXIT_CHECK_MINUTES` | `15` | ✅ |
| `MIN_LIQUIDITY_USD` | `500` | ✅ |
| `LOG_LEVEL` | `INFO` | ✅ |
| `POLYMARKET_PRIVATE_KEY` | `0x...` | ⏳ (live only) |
| `POLYMARKET_FUNDER_ADDRESS` | `0x...` | ⏳ (live only) |

---

## Step 5 — Add Persistent Volume (for SQLite DB)

1. Railway dashboard → your service → **Volumes** tab
2. **Add Volume**
   - Mount path: `/app/data`
   - Size: 1 GB (free tier)
3. Update `PAPER_DB_PATH` env var:
   ```
   PAPER_DB_PATH=/app/data/paper.db
   ```

---

## Step 6 — Deploy

1. Railway auto-deploys on git push
2. Monitor logs: Railway dashboard → **Logs** tab
3. Look for:
   ```
   🌦️  PolyWeather Bot starting...
   [Init] Portfolio bankroll: $1000.00
   [Telegram] Bot running.
   ```

---

## Step 7 — Test the Bot

Open Telegram → search your bot name → `/start`

You should see:
```
🌦️ PolyWeather Bot — Active
📄 Mode: PAPER
💵 Bankroll: $1,000.00
```

Try `/scan` to trigger a market scan.

---

## Step 8 — Going Live (after 55%+ win rate on paper)

1. Create a Polymarket account at https://polymarket.com
2. Fund with USDC on Polygon
3. Export wallet private key from Polymarket
4. Add to Railway env vars:
   ```
   POLYMARKET_PRIVATE_KEY=0x_your_key
   POLYMARKET_FUNDER_ADDRESS=0x_your_address
   TRADING_MODE=live
   ```
5. **Start small**: set `MAX_POSITION_USD=10` for the first week live

---

## Monitoring & Maintenance

### Logs
```bash
# Railway CLI
railway logs --tail
```

### Updating the bot
```bash
git add .
git commit -m "Update strategy"
git push
# Railway auto-redeploys
```

### Checking stats
- Telegram: `/stats`
- Direct DB: Railway → Volumes → open `paper.db`

---

## Cost Estimate (Railway)

| Resource | Free Tier | Paid |
|----------|-----------|------|
| Compute | 500h/mo | $5/mo |
| Volume | 1GB | included |
| Bandwidth | 100GB/mo | included |

**Free tier is sufficient** for paper trading and light live trading.

---

## Troubleshooting

### Bot not responding
- Check `TELEGRAM_BOT_TOKEN` is correct
- Check `TELEGRAM_ALLOWED_USERS` includes your user ID
- Check Railway logs for errors

### Weather API errors
- Open-Meteo is free and public — no key needed
- If rate limited, increase `SCAN_INTERVAL_MINUTES`

### No signals found
- Polymarket may have few active weather markets
- Lower `MIN_EDGE` to `0.05` temporarily
- Check `MIN_LIQUIDITY_USD` isn't too high

### Database errors
- Make sure `/app/data` volume is mounted
- Check `PAPER_DB_PATH` env var points to the volume
