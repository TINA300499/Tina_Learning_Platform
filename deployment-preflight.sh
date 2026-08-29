#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
echo "=== TINA v14 FINAL DEPLOYMENT PREFLIGHT ==="
command -v node >/dev/null 2>&1 || { echo "NODE=FAIL"; exit 1; }
NODE_VERSION="$(node -p 'process.versions.node' | tr -cd '0-9.\n')"
NODE_MAJOR="${NODE_VERSION%%.*}"
test "${NODE_MAJOR:-0}" -ge 22 || { echo "NODE_VERSION=FAIL (v$NODE_VERSION)"; exit 1; }
echo "NODE_VERSION=PASS (v$NODE_VERSION)"
for f in workspace-completion-v14.js admin-final-v14.js backend-client.js app.js backend/server.mjs; do
  node --check "$f"
done
echo "JS_MJS_SYNTAX=PASS"
node qa/deployment-http-e2e.mjs
echo "HTTP_E2E=PASS"
test -f integrations/academy/academy-domain-catalog.json && echo "ACADEMY_CATALOG=PASS" || { echo "ACADEMY_CATALOG=FAIL"; exit 1; }
test -x run-tina.sh || chmod +x run-tina.sh
echo "RUNNER=PASS"
echo "DEPLOYMENT_PREFLIGHT=PASS"
