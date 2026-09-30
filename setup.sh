#!/usr/bin/env bash
# 最簡單安裝：喺已下載嘅資料夾執行，或用 curl 一鍵裝
#   bash setup.sh
#   curl -fsSL https://raw.githubusercontent.com/lycryan90/hk-fin-pulse/main/setup.sh | bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/lycryan90/hk-fin-pulse.git}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/hk-fin-pulse}"
PORT="${PORT:-3457}"
WITH_CRON="${WITH_CRON:-no}"
NODE_VERSION="${NODE_VERSION:-22}"

echo "==> 大局觀（hk-fin-pulse）一鍵安裝"
echo

ensure_node() {
  # shellcheck disable=SC1091
  if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
    . "$HOME/.nvm/nvm.sh"
  fi

  if command -v node >/dev/null 2>&1; then
    local major
    major="$(node -v | sed 's/^v//' | cut -d. -f1)"
    if [[ "$major" -ge 18 ]]; then
      echo "==> Node.js $(node -v) OK"
      return 0
    fi
    echo "==> Node.js 太舊 ($(node -v))，改用 nvm 裝 v${NODE_VERSION}"
  else
    echo "==> 未有 Node.js，用 nvm 自動安裝（唔使 sudo）"
  fi

  if [[ ! -s "$HOME/.nvm/nvm.sh" ]]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  fi
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh"
  nvm install "$NODE_VERSION"
  nvm use "$NODE_VERSION"
  nvm alias default "$NODE_VERSION"
  echo "==> Node.js $(node -v) ready"
}

ensure_git() {
  if command -v git >/dev/null 2>&1; then
    return 0
  fi
  echo "==> 未有 git，試吓用系統套件安裝…"
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -y && sudo apt-get install -y git
  elif command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y git
  elif command -v pacman >/dev/null 2>&1; then
    sudo pacman -Sy --noconfirm git
  else
    echo "請先手動安裝 git，再重跑呢條指令。"
    exit 1
  fi
}

# 已喺下載好嘅資料夾入面？
SELF_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || true)"
FROM_CHECKOUT=0
if [[ -n "${SELF_ROOT:-}" && -f "$SELF_ROOT/package.json" ]] \
  && grep -q '"name": "hk-fin-pulse"' "$SELF_ROOT/package.json" 2>/dev/null; then
  INSTALL_DIR="$SELF_ROOT"
  FROM_CHECKOUT=1
fi

ensure_node
ensure_git

if [[ "$FROM_CHECKOUT" -eq 1 ]]; then
  echo "==> 用現有資料夾：$INSTALL_DIR"
else
  if [[ -d "$INSTALL_DIR/.git" ]]; then
    echo "==> 更新 $INSTALL_DIR"
    git -C "$INSTALL_DIR" pull --ff-only || true
  elif [[ -d "$INSTALL_DIR" ]] && [[ -n "$(ls -A "$INSTALL_DIR" 2>/dev/null || true)" ]]; then
    echo "目錄已存在而且唔係空：$INSTALL_DIR"
    echo "刪咗佢，或者：INSTALL_DIR=\$HOME/hk-fin-pulse2 bash setup.sh"
    exit 1
  else
    echo "==> 下載程式 → $INSTALL_DIR"
    git clone "$REPO_URL" "$INSTALL_DIR"
  fi
fi

export INSTALL_DIR PORT WITH_CRON
# 強制用上面準備好嘅 node（nvm）
export PATH="$PATH"
bash "$INSTALL_DIR/install/linux/install.sh"

echo
echo "搞掂。之後每次啟動只需要打："
echo "  hk-fin-pulse"
echo "然後開瀏覽器：http://127.0.0.1:${PORT}"
echo
echo "如果話搵唔到指令，先執行："
echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
echo "  # 若用咗 nvm，新開終端或："
echo "  source \"\$HOME/.nvm/nvm.sh\""
