#!/bin/bash
# Railway build script - captures env vars at build time into .env.runtime
# Railway DOES inject service variables during the BUILD phase.
echo "=== PolyWeather Build Script ==="
echo "Capturing environment variables at build time..."

# Write all user-defined vars to .env.runtime so main.py can read them at runtime
ENV_FILE="/app/.env.runtime"
> "$ENV_FILE"  # clear/create

vars=(
  "TELEGRAM_BOT_TOKEN"
  "TELEGRAM_ALLOWED_USERS"
  "TRADING_MODE"
  "PAPER_BANKROLL"
  "MIN_EDGE"
  "KELLY_FRACTION"
  "MAX_POSITION_USD"
  "MAX_POSITION_PCT"
  "SCAN_INTERVAL_MINUTES"
  "EXIT_CHECK_MINUTES"
  "MIN_LIQUIDITY_USD"
  "LOG_LEVEL"
  "PAPER_DB_PATH"
)

found=0
for var in "${vars[@]}"; do
  val="${!var}"
  if [ -n "$val" ]; then
    echo "${var}=${val}" >> "$ENV_FILE"
    echo "  ✓ Captured: $var"
    found=$((found + 1))
  else
    echo "  ✗ Missing:  $var"
  fi
done

echo "Captured $found/${#vars[@]} variables to $ENV_FILE"
echo "Build complete."
