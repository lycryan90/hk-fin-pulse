#!/usr/bin/env bash
# Build a self-contained Linux folder: extract → run 開始.sh (Node bundled, no install)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

NODE_VERSION="${NODE_VERSION:-22.14.0}"
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64) NODE_ARCH="x64" ;;
  aarch64|arm64) NODE_ARCH="arm64" ;;
  *) echo "Unsupported arch: $ARCH"; exit 1 ;;
esac

OUT_NAME="hk-fin-pulse-linux-${NODE_ARCH}"
DIST="$ROOT/dist/$OUT_NAME"
NODE_DIST="node-v${NODE_VERSION}-linux-${NODE_ARCH}"
NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_DIST}.tar.xz"
CACHE="$ROOT/.cache/node"
PORTABLE_PORT="${PORTABLE_PORT:-3457}"

echo "==> Building Next.js standalone"
npm run build

echo "==> Preparing $DIST"
rm -rf "$DIST"
mkdir -p "$DIST" "$CACHE"

if [[ ! -x "$CACHE/$NODE_DIST/bin/node" ]]; then
  echo "==> Downloading Node $NODE_VERSION ($NODE_ARCH)"
  curl -fsSL "$NODE_URL" -o "$CACHE/${NODE_DIST}.tar.xz"
  tar -xJf "$CACHE/${NODE_DIST}.tar.xz" -C "$CACHE"
fi

cp "$CACHE/$NODE_DIST/bin/node" "$DIST/node"
chmod +x "$DIST/node"

echo "==> Copying standalone app"
cp -a "$ROOT/.next/standalone/." "$DIST/"
mkdir -p "$DIST/.next"
cp -a "$ROOT/.next/static" "$DIST/.next/static"
if [[ -d "$ROOT/public" ]]; then
  cp -a "$ROOT/public" "$DIST/public"
fi
mkdir -p "$DIST/data" "$DIST/config"
cp -a "$ROOT/config/." "$DIST/config/"
# seed demo digest if present so first open is not empty
if [[ -f "$ROOT/data/latest-digest.json" ]]; then
  cp "$ROOT/data/latest-digest.json" "$DIST/data/" || true
fi

cat > "$DIST/開始.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export PORT="${PORT:-3457}"
export HOSTNAME="127.0.0.1"
export NODE_ENV=production

echo "大局觀啟動中… http://127.0.0.1:${PORT}"
echo "用完撳 Ctrl+C 停止"
echo

# Open browser shortly after server starts (best-effort)
(
  sleep 2
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://127.0.0.1:${PORT}" >/dev/null 2>&1 || true
  fi
) &

exec ./node server.js
EOF
chmod +x "$DIST/開始.sh"

# ASCII alias for terminals that struggle with Chinese filenames
cp "$DIST/開始.sh" "$DIST/start.sh"
chmod +x "$DIST/start.sh"

cat > "$DIST/大局觀.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=大局觀
Comment=香港每日新聞 digest
Exec=bash -c 'cd "$(dirname %k)" 2>/dev/null || cd "%k/.."; ./開始.sh'
Path=
Terminal=true
Categories=Network;News;
EOF
chmod +x "$DIST/大局觀.desktop"

cat > "$DIST/先讀我.txt" <<EOF
大局觀 — Linux 免安裝版
========================

用法（最簡單）：
1. 解壓呢個資料夾到任意位置（桌面都得）
2. 右鍵「開始.sh」→ 內容 → 剔「容許以程式執行」
   （或者喺終端打：chmod +x 開始.sh）
3. 雙擊「開始.sh」，或喺終端打：./開始.sh
4. 瀏覽器會開 http://127.0.0.1:${PORTABLE_PORT}

唔使預先裝 Node.js / npm。

停止：喺終端撳 Ctrl+C

設定 LLM：開網頁後撳頂部「設定」
EOF

# Fix desktop Path to be relative-friendly: rewrite with a wrapper
cat > "$DIST/開大局觀.desktop" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=大局觀
Comment=香港每日新聞 digest（免安裝）
Exec=bash -c 'cd "\$(dirname "\$(readlink -f "%k")")" && ./開始.sh'
Terminal=true
Categories=Network;News;
EOF
chmod +x "$DIST/開大局觀.desktop"

echo "==> Creating archive"
mkdir -p "$ROOT/dist"
ARCHIVE="$ROOT/dist/${OUT_NAME}.tar.gz"
tar -C "$ROOT/dist" -czf "$ARCHIVE" "$OUT_NAME"

echo
echo "Done."
echo "  Folder : $DIST"
echo "  Archive: $ARCHIVE"
echo "  Size   : $(du -h "$ARCHIVE" | cut -f1)"
echo
echo "User steps: extract → ./開始.sh"
