#!/usr/bin/env bash
set -euo pipefail

APP_NAME="hk-fin-pulse"
INSTALL_DIR="${INSTALL_DIR:-$HOME/$APP_NAME}"

echo "==> Uninstalling hk-fin-pulse from $INSTALL_DIR"

if [[ -d "$INSTALL_DIR" ]]; then
  (cd "$INSTALL_DIR" && npm run cron:remove 2>/dev/null) || true
fi

rm -f "$HOME/.local/bin/hk-fin-pulse" \
      "$HOME/.local/bin/hk-fin-pulse-digest" \
      "$HOME/.local/bin/hk-fin-pulse-outlook" \
      "$HOME/.local/share/applications/hk-fin-pulse.desktop" \
      "$HOME/start-hk-fin-pulse.sh"

read -r -p "Delete install directory $INSTALL_DIR ? [y/N] " ans || ans=""
if [[ "${ans,,}" == "y" || "${ans,,}" == "yes" ]]; then
  rm -rf "$INSTALL_DIR"
  echo "Removed $INSTALL_DIR"
else
  echo "Kept $INSTALL_DIR"
fi

echo "Done."
