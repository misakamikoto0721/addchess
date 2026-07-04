#!/usr/bin/env bash
# Run on the VPS inside the repo root after git pull.
set -euo pipefail

npm ci
npm run build --workspace=@addchess/server
pm2 restart addchess-server || pm2 start ecosystem.config.cjs
pm2 save

echo "Done. Check: curl -s http://127.0.0.1:3000/health"
