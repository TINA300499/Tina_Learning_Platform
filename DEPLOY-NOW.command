#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "============================================================"
echo " TINA LEARNING PLATFORM v14 FINAL"
echo " PERSONAL / CONTROLLED PILOT DEPLOYMENT"
echo "============================================================"
echo

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is not installed."
  echo "Install Node.js 22+ and run this file again."
  exit 1
fi

NODE_VERSION="$(node -p 'process.versions.node' | tr -cd '0-9.\n')"
NODE_MAJOR="${NODE_VERSION%%.*}"
echo "Node=v$NODE_VERSION"
if [ "${NODE_MAJOR:-0}" -lt 22 ]; then
  echo "ERROR: Node.js 22+ is required for the built-in SQLite backend."
  exit 1
fi

echo
echo "=== 1. SOURCE VALIDATION ==="
for f in workspace-completion-v14.js admin-final-v14.js backend-client.js app.js backend/server.mjs; do
  test -f "$ROOT/$f" || { echo "MISSING=$f"; exit 1; }
done
node --check workspace-completion-v14.js
node --check admin-final-v14.js
node --check backend-client.js
node --check app.js
node --check backend/server.mjs
echo "SOURCE_VALIDATION=PASS"

echo
echo "=== 2. PORTABLE HTTP E2E ==="
node qa/deployment-http-e2e.mjs
echo "HTTP_E2E=PASS"

echo
echo "=== 3. PRODUCTION CONFIGURATION ==="
if [ ! -f backend/.env ]; then
  bash backend/setup-production.sh
else
  echo "backend/.env already exists."
fi
chmod 600 backend/.env || true
mkdir -p backend/data
chmod 700 backend/data || true

echo
echo "=== 4. DEPLOY ==="
echo "Starting Tina on the same-origin backend..."
echo "Production URL: http://127.0.0.1:8787"
echo "Do not use VS Code Live Server (:5501) for this deployed runtime."
echo
exec bash run-tina.sh
