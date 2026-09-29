#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp)"
crontab -l 2>/dev/null | grep -v "hk-big-picture-digest\|hk-fin-pulse\|$ROOT.*npm run digest\|$ROOT.*npm run outlook" >"$TMP" || true
crontab "$TMP" 2>/dev/null || true
rm -f "$TMP"
echo "Removed digest/outlook cron entries for $ROOT"
