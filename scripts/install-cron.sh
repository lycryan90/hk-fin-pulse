#!/usr/bin/env bash
# Install a local cron job to generate the daily digest at 07:00 (system time).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT/data/logs"
mkdir -p "$LOG_DIR"

CRON_LINE="0 7 * * * cd \"$ROOT\" && /usr/bin/env npm run digest >> \"$LOG_DIR/cron-digest.log\" 2>&1"

# Remove previous hk-fin-pulse / big-picture digest cron lines for this repo, then append.
TMP="$(mktemp)"
crontab -l 2>/dev/null | grep -v "hk-big-picture-digest\|hk-fin-pulse\|$ROOT.*npm run digest" >"$TMP" || true
echo "$CRON_LINE" >>"$TMP"
crontab "$TMP"
rm -f "$TMP"

echo "Installed daily cron (07:00):"
echo "  $CRON_LINE"
echo "Logs: $LOG_DIR/cron-digest.log"
echo "Remove with: npm run cron:remove"
