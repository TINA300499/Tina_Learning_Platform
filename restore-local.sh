#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
ARCHIVE="${1:-}"
if [ -z "$ARCHIVE" ] || [ ! -f "$ARCHIVE" ]; then
  echo "Usage: bash restore-local.sh /path/to/tina-v14-data-YYYYMMDD-HHMMSS.tar.gz"
  exit 1
fi
echo "Stop Tina before restoring."
printf "Restore backend data from %s? Type RESTORE: " "$ARCHIVE"
read -r CONFIRM
[ "$CONFIRM" = "RESTORE" ] || { echo "Cancelled."; exit 1; }
STAMP="$(date +%Y%m%d-%H%M%S)"
if [ -d "$ROOT/backend/data" ]; then
  mv "$ROOT/backend/data" "$ROOT/backend/data.before-restore-$STAMP"
fi
tar -xzf "$ARCHIVE" -C "$ROOT/backend"
echo "RESTORE=PASS"
echo "Previous data kept at backend/data.before-restore-$STAMP"
