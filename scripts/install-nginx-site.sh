#!/usr/bin/env bash
# One-time Nginx setup on the VPS. Run from repo root after DNS is ready.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f deploy/config.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source deploy/config.env
  set +a
fi

DOMAIN="${ADDCHESS_DOMAIN:-addchess.cn}"
WS_HOST="${ADDCHESS_WS_HOST:-ws.addchess.cn}"
WEB_ROOT="${ADDCHESS_WEB_ROOT:-/var/www/addchess}"

sudo mkdir -p "$WEB_ROOT"
sudo cp deploy/nginx-site.conf.example /tmp/addchess-nginx.conf
sudo sed -i "s|addchess.cn|${DOMAIN}|g" /tmp/addchess-nginx.conf
sudo sed -i "s|ws.addchess.cn|${WS_HOST}|g" /tmp/addchess-nginx.conf
sudo sed -i "s|/var/www/addchess|${WEB_ROOT}|g" /tmp/addchess-nginx.conf
sudo mv /tmp/addchess-nginx.conf /etc/nginx/sites-available/addchess
sudo ln -sf /etc/nginx/sites-available/addchess /etc/nginx/sites-enabled/addchess
sudo nginx -t
sudo systemctl reload nginx

echo "Nginx site installed. Next:"
echo "  sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} -d ${WS_HOST}"
