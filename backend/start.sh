#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
if [ ! -f .env ]; then
  echo "Missing backend/.env"
  echo "Run: bash backend/setup-production.sh"
  exit 1
fi
set -a
source .env
set +a
exec node server.mjs
