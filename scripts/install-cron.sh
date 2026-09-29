#!/usr/bin/env bash
# Install local cron jobs:
# - daily digest at 07:00
# - weekly outlook Friday 21:00
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT/data/logs"
mkdir -p "$LOG_DIR"

DIGEST_LINE="0 7 * * * cd \"$ROOT\" && /usr/bin/env npm run digest >> \"$LOG_DIR/cron-digest.log\" 2>&1"
OUTLOOK_LINE="0 21 * * 5 cd \"$ROOT\" && /usr/bin/env npm run outlook >> \"$LOG_DIR/cron-outlook.log\" 2>&1"

TMP="$(mktemp)"
crontab -l 2>/dev/null | grep -v "hk-big-picture-digest\|hk-fin-pulse\|$ROOT.*npm run digest\|$ROOT.*npm run outlook" >"$TMP" || true
echo "$DIGEST_LINE" >>"$TMP"
echo "$OUTLOOK_LINE" >>"$TMP"
crontab "$TMP"
rm -f "$TMP"

echo "Installed cron jobs:"
echo "  $DIGEST_LINE"
echo "  $OUTLOOK_LINE"
echo "Logs: $LOG_DIR/cron-digest.log , $LOG_DIR/cron-outlook.log"
echo "Remove with: npm run cron:remove"
