#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required (Node 22+ recommended)."
  exit 1
fi
if [ -f .env ]; then
  echo "backend/.env already exists; leaving it unchanged."
  exit 0
fi
KEY="$(node generate-secrets.mjs | cut -d= -f2-)"
printf "Create a new Tina Superadmin password (12+ characters): "
stty -echo
IFS= read -r PASS
stty echo
printf "\n"
if [ "${#PASS}" -lt 12 ]; then
  echo "Password too short."
  exit 1
fi
cat > .env <<EOF
TINA_PORT=8787
TINA_HOST=127.0.0.1
TINA_DATA_DIR=./data
TINA_MASTER_KEY_BASE64=$KEY
TINA_SUPERADMIN_USERNAME=superadmin
TINA_SUPERADMIN_PASSWORD=$PASS
TINA_COOKIE_SECURE=false
TINA_MAX_JSON_BYTES=35000000
TINA_MAX_MEDIA_BYTES=25000000
EOF
chmod 600 .env
echo "SETUP=PASS"
echo "Superadmin username: superadmin"
echo "Use the password you just created."
