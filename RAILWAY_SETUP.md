# Railway Variables Setup — Step by Step

The bot requires TELEGRAM_BOT_TOKEN to be set in Railway.
If you see "Token invalid" in logs, follow these steps exactly:

## Step 1 — Set Variables in Railway

1. Open your Railway project
2. Click on your **Weatherbot** service
3. Click the **Variables** tab
4. Click **+ New Variable** and add each one:

| Name | Value | Example |
|------|-------|---------|
| `TELEGRAM_BOT_TOKEN` | Your bot token from BotFather | `8794924683:AAHpPFPSd2HJ...` |
| `TELEGRAM_ALLOWED_USERS` | Your Telegram user ID | `1354452347` |
| `TRADING_MODE` | `paper` | `paper` |
| `PAPER_BANKROLL` | `1000` | `1000` |
| `MIN_EDGE` | `0.08` | `0.08` |
| `KELLY_FRACTION` | `0.15` | `0.15` |
| `MAX_POSITION_USD` | `100` | `100` |
| `MAX_POSITION_PCT` | `0.05` | `0.05` |
| `SCAN_INTERVAL_MINUTES` | `5` | `5` |
| `EXIT_CHECK_MINUTES` | `15` | `15` |
| `MIN_LIQUIDITY_USD` | `500` | `500` |
| `LOG_LEVEL` | `INFO` | `INFO` |
| `PAPER_DB_PATH` | `/app/data/paper.db` | `/app/data/paper.db` |

## Step 2 — Force Redeploy AFTER saving variables

Variables only apply to NEW deployments. After saving all variables:

1. Click **Deployments** tab
2. Click `...` on the latest deployment
3. Click **Redeploy**

OR use Raw Editor to paste all at once:
```
TELEGRAM_BOT_TOKEN=8794924683:AAHpPFPSd2HJrbpLlUgVcU2Z1trVHFCjvus
TELEGRAM_ALLOWED_USERS=1354452347
TRADING_MODE=paper
PAPER_BANKROLL=1000
MIN_EDGE=0.08
KELLY_FRACTION=0.15
MAX_POSITION_USD=100
MAX_POSITION_PCT=0.05
SCAN_INTERVAL_MINUTES=5
EXIT_CHECK_MINUTES=15
MIN_LIQUIDITY_USD=500
LOG_LEVEL=INFO
PAPER_DB_PATH=/app/data/paper.db
```

## Step 3 — Add Persistent Volume (required for paper trading DB)

1. Variables tab → scroll to bottom
2. Click **Add Volume**
3. Mount path: `/app/data`
4. This keeps your paper trades across redeploys

## Step 4 — Verify in logs

After redeploy, Deploy Logs should show:
```
[ENV]   TELEGRAM_BOT_TOKEN = 8794...jvus
[ENV]   TELEGRAM_ALLOWED_USERS = 1354452347
[Init] Token OK: ...FCjvus
✅ Bot running — send /start in Telegram
```

## Common Issues

**Token still empty after setting it:**
- Try the Raw Editor approach (paste all vars at once)
- Make sure there are no spaces in the token value
- Delete the variable and re-add it

**Bot crashes immediately:**
- Check Build Logs (not Deploy Logs) for pip install errors
- Make sure requirements.txt was committed to GitHub
