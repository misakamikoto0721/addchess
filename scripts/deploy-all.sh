#!/usr/bin/env bash
# Build frontend + backend and publish static files. Run on the VPS in repo root.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f deploy/config.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source deploy/config.env
  set +a
fi

VITE_WS_URL="${VITE_WS_URL:-wss://ws.addchess.cn}"
WEB_ROOT="${ADDCHESS_WEB_ROOT:-/var/www/addchess}"

echo "==> npm ci"
npm ci

echo "==> build server"
npm run build --workspace=@addchess/server

echo "==> build frontend (VITE_WS_URL=$VITE_WS_URL)"
VITE_WS_URL="$VITE_WS_URL" npm run build --workspace=@addchess/app

echo "==> publish static site to $WEB_ROOT"
sudo mkdir -p "$WEB_ROOT"
sudo rsync -a --delete packages/app/dist/ "$WEB_ROOT/"

echo "==> restart multiplayer server"
pm2 restart addchess-server 2>/dev/null || pm2 start ecosystem.config.cjs
pm2 save

echo "Done."
echo "  Frontend files: $WEB_ROOT"
echo "  Backend health: curl -s http://127.0.0.1:3000/health"
echo "  Public site:    https://${ADDCHESS_DOMAIN:-addchess.cn}"
echo "  Public WS:      ${VITE_WS_URL}"
