#!/usr/bin/env bash
# Enable gzip for JS/CSS. Safe when nginx.conf already has "gzip on;".
# Run on the VPS from repo root: bash scripts/enable-nginx-gzip.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUR_CONF="/etc/nginx/conf.d/addchess-gzip.conf"
EXAMPLE="$ROOT/deploy/nginx-gzip.conf.example"

echo "==> install supplemental gzip_types at $OUR_CONF"
sudo cp "$EXAMPLE" "$OUR_CONF"

echo "==> nginx -t && reload"
if ! sudo nginx -t; then
  echo ""
  echo "nginx -t failed. If you see 'gzip directive is duplicate',"
  echo "remove any extra 'gzip on;' from $OUR_CONF (this file must not repeat it)."
  exit 1
fi
sudo systemctl reload nginx

echo "Done. Verify JS is compressed:"
echo "  curl -sI -H 'Accept-Encoding: gzip' https://addchess.cn/assets/index-*.js"
echo "Expect: Content-Encoding: gzip  (and no Content-Length: 226414)"
