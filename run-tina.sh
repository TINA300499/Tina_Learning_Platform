#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
if [ ! -f "$ROOT/backend/.env" ]; then
  bash "$ROOT/backend/setup-production.sh"
fi
PORT="$(grep '^TINA_PORT=' "$ROOT/backend/.env" | tail -1 | cut -d= -f2 || true)"
PORT="${PORT:-8787}"
echo "============================================================"
echo " TINA LEARNING PLATFORM v14 FINAL"
echo " DEPLOYMENT CLOSURE"
echo "============================================================"
echo "URL=http://127.0.0.1:$PORT"
echo "DATA=$ROOT/backend/data"
echo
( sleep 1.5; command -v open >/dev/null 2>&1 && open "http://127.0.0.1:$PORT" || true ) &
cd "$ROOT/backend"
set -a
source .env
set +a
exec node server.mjs
