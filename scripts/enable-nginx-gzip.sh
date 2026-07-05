#!/usr/bin/env bash
# Enable gzip without duplicating "gzip on" if already set in nginx.conf.
# Run on the VPS from repo root: bash scripts/enable-nginx-gzip.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUR_CONF="/etc/nginx/conf.d/addchess-gzip.conf"
EXAMPLE="$ROOT/deploy/nginx-gzip.conf.example"

echo "==> check existing nginx gzip settings"
if sudo nginx -t 2>/dev/null; then
  :
else
  if [[ -f "$OUR_CONF" ]]; then
    echo "nginx -t failed; removing $OUR_CONF (likely duplicate gzip)"
    sudo rm -f "$OUR_CONF"
  fi
fi

GZIP_ON_ELSEWHERE=0
if sudo grep -rE '^\s*gzip\s+on\s*;' /etc/nginx/nginx.conf /etc/nginx/conf.d/ 2>/dev/null \
  | grep -v "$OUR_CONF" | grep -q .; then
  GZIP_ON_ELSEWHERE=1
fi

if [[ "$GZIP_ON_ELSEWHERE" -eq 1 ]]; then
  echo "gzip on already configured in nginx (skip duplicate)."
  if [[ -f "$OUR_CONF" ]]; then
    sudo rm -f "$OUR_CONF"
  fi
  if ! sudo nginx -T 2>/dev/null | grep -q 'application/javascript'; then
    echo ""
    echo "WARN: gzip is on but application/javascript may not be in gzip_types."
    echo "Edit /etc/nginx/nginx.conf http { ... } and add:"
    echo ""
    sed -n '9,16p' "$EXAMPLE"
    echo ""
    exit 1
  fi
else
  echo "==> install $OUR_CONF"
  sudo cp "$EXAMPLE" "$OUR_CONF"
fi

echo "==> nginx -t && reload"
sudo nginx -t
sudo systemctl reload nginx

echo "Done. Verify:"
echo "  curl -sI -H 'Accept-Encoding: gzip' https://addchess.cn/assets/index-*.js | grep -i content-encoding"
