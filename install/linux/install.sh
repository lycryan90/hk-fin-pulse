#!/usr/bin/env bash
# hk-fin-pulse Linux installer
set -euo pipefail

APP_NAME="hk-fin-pulse"
DEFAULT_DIR="$HOME/$APP_NAME"
REPO_URL_DEFAULT="https://github.com/lycryan90/hk-fin-pulse.git"
PORT_DEFAULT="3457"

echo "==> hk-fin-pulse installer (Linux)"
echo

PORT="${PORT:-$PORT_DEFAULT}"
REPO_URL="${REPO_URL:-$REPO_URL_DEFAULT}"
WITH_CRON="${WITH_CRON:-ask}"

# Prefer in-place install when this script lives inside a checkout.
SELF_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/../.." 2>/dev/null && pwd || true)"
FROM_CHECKOUT=0
if [[ -z "${INSTALL_DIR:-}" && -n "${SELF_ROOT:-}" && -f "$SELF_ROOT/package.json" ]] \
  && grep -q '"name": "hk-fin-pulse"' "$SELF_ROOT/package.json" 2>/dev/null; then
  INSTALL_DIR="$SELF_ROOT"
  FROM_CHECKOUT=1
else
  INSTALL_DIR="${INSTALL_DIR:-$DEFAULT_DIR}"
fi

# Prefer nvm node if present
# shellcheck disable=SC1091
[[ -s "$HOME/.nvm/nvm.sh" ]] && . "$HOME/.nvm/nvm.sh"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js / npm not found."
  echo "Easiest fix — run the one-shot installer instead:"
  echo "  curl -fsSL https://cdn.jsdelivr.net/gh/lycryan90/hk-fin-pulse@main/setup.sh | bash"
  echo "Or from your downloaded folder:"
  echo "  bash setup.sh"
  exit 1
fi

NODE_MAJOR="$(node -v | sed 's/^v//' | cut -d. -f1)"
if [[ "$NODE_MAJOR" -lt 18 ]]; then
  echo "Node.js 18+ required (found $(node -v)). Run: bash setup.sh"
  exit 1
fi

if [[ "$FROM_CHECKOUT" -eq 1 ]]; then
  echo "==> Installing from existing checkout: $INSTALL_DIR"
elif [[ -d "$INSTALL_DIR/.git" ]]; then
  echo "==> Updating existing install at $INSTALL_DIR"
  git -C "$INSTALL_DIR" pull --ff-only || true
else
  if [[ -d "$INSTALL_DIR" ]] && [[ -n "$(ls -A "$INSTALL_DIR" 2>/dev/null || true)" ]]; then
    echo "Target directory exists and is not empty: $INSTALL_DIR"
    echo "Set INSTALL_DIR to another path, or remove it first."
    exit 1
  fi
  if ! command -v git >/dev/null 2>&1; then
    echo "git not found"
    exit 1
  fi
  echo "==> Cloning $REPO_URL -> $INSTALL_DIR"
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"
echo "==> npm install"
npm install

echo "==> Building"
npm run build

mkdir -p "$INSTALL_DIR/data" "$INSTALL_DIR/bin" "$HOME/.local/bin"

cat > "$INSTALL_DIR/bin/hk-fin-pulse" <<EOF
#!/usr/bin/env bash
set -euo pipefail
cd "$INSTALL_DIR"
export PORT="${PORT}"
exec npm run start -- --port "${PORT}"
EOF
chmod +x "$INSTALL_DIR/bin/hk-fin-pulse"

ln -sfn "$INSTALL_DIR/bin/hk-fin-pulse" "$HOME/.local/bin/hk-fin-pulse"

cat > "$INSTALL_DIR/bin/hk-fin-pulse-digest" <<EOF
#!/usr/bin/env bash
set -euo pipefail
cd "$INSTALL_DIR"
exec npm run digest
EOF
chmod +x "$INSTALL_DIR/bin/hk-fin-pulse-digest"
ln -sfn "$INSTALL_DIR/bin/hk-fin-pulse-digest" "$HOME/.local/bin/hk-fin-pulse-digest"

cat > "$INSTALL_DIR/bin/hk-fin-pulse-outlook" <<EOF
#!/usr/bin/env bash
set -euo pipefail
cd "$INSTALL_DIR"
exec npm run outlook
EOF
chmod +x "$INSTALL_DIR/bin/hk-fin-pulse-outlook"
ln -sfn "$INSTALL_DIR/bin/hk-fin-pulse-outlook" "$HOME/.local/bin/hk-fin-pulse-outlook"

APPS_DIR="$HOME/.local/share/applications"
mkdir -p "$APPS_DIR"
cat > "$APPS_DIR/hk-fin-pulse.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=大局觀 hk-fin-pulse
Comment=Hong Kong news digest
Exec=$INSTALL_DIR/bin/hk-fin-pulse
Terminal=true
Categories=Network;News;
EOF

if [[ "$WITH_CRON" == "ask" ]]; then
  if [[ -t 0 ]]; then
    read -r -p "Install daily digest + Friday outlook cron? [y/N] " ans || ans=""
    if [[ "${ans,,}" == "y" || "${ans,,}" == "yes" ]]; then
      WITH_CRON="yes"
    else
      WITH_CRON="no"
    fi
  else
    WITH_CRON="no"
    echo "==> Non-interactive shell: skipping cron (set WITH_CRON=yes to enable)"
  fi
fi

if [[ "$WITH_CRON" == "yes" ]]; then
  npm run cron:install || true
fi

if [[ ! -f "$INSTALL_DIR/.env.local" && ! -f "$INSTALL_DIR/data/settings.json" ]]; then
  echo
  echo "Tip: open Settings in the web UI to add LLM API key / local Ollama URL."
fi

# Ensure ~/.local/bin is on PATH for future shells
PATH_LINE='export PATH="$HOME/.local/bin:$PATH"'
ensure_path_line() {
  local file="$1"
  [[ -f "$file" ]] || touch "$file"
  if ! grep -qF '.local/bin' "$file" 2>/dev/null; then
    printf '\n# hk-fin-pulse\n%s\n' "$PATH_LINE" >> "$file"
    echo "==> Added ~/.local/bin to PATH in $file"
  fi
}
ensure_path_line "$HOME/.profile"
ensure_path_line "$HOME/.bashrc"
[[ -f "$HOME/.zshrc" ]] && ensure_path_line "$HOME/.zshrc"

# Also expose full-path helper so it works even before reloading shell
cat > "$HOME/start-hk-fin-pulse.sh" <<EOF
#!/usr/bin/env bash
export PATH="\$HOME/.local/bin:\$PATH"
# shellcheck disable=SC1091
[[ -s "\$HOME/.nvm/nvm.sh" ]] && . "\$HOME/.nvm/nvm.sh"
exec "$INSTALL_DIR/bin/hk-fin-pulse"
EOF
chmod +x "$HOME/start-hk-fin-pulse.sh"

echo
echo "Installed."
echo "  App dir : $INSTALL_DIR"
echo "  Start   : hk-fin-pulse"
echo "            or: $INSTALL_DIR/bin/hk-fin-pulse"
echo "            or: bash ~/start-hk-fin-pulse.sh"
echo "  URL     : http://127.0.0.1:${PORT}"
echo "  Digest  : hk-fin-pulse-digest"
echo "  Outlook : hk-fin-pulse-outlook"
echo "  Uninstall: bash $INSTALL_DIR/install/linux/uninstall.sh"
echo
echo "如果而家打 hk-fin-pulse 話 command not found，用下面其中一個："
echo "  source ~/.bashrc"
echo "  # 或者直接："
echo "  $INSTALL_DIR/bin/hk-fin-pulse"
echo "  bash ~/start-hk-fin-pulse.sh"
