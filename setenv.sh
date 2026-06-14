#!/bin/bash
# Run this in Railway Console to inject the token:
# bash setenv.sh

export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-PASTE_YOUR_TOKEN_HERE}"
export TELEGRAM_ALLOWED_USERS="${TELEGRAM_ALLOWED_USERS:-1354452347}"
export TRADING_MODE="paper"
export PAPER_BANKROLL="1000"
export MIN_EDGE="0.08"
export KELLY_FRACTION="0.15"
export MAX_POSITION_USD="100"
export MAX_POSITION_PCT="0.05"
export SCAN_INTERVAL_MINUTES="5"
export EXIT_CHECK_MINUTES="15"
export MIN_LIQUIDITY_USD="500"
export LOG_LEVEL="INFO"
export PAPER_DB_PATH="/app/logs/paper.db"

echo "Vars set:"
env | grep -E "TELEGRAM|TRADING|PAPER" | sort
echo ""
echo "Starting bot..."
python /app/main.py
