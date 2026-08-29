#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
DEST="${1:-$ROOT/backups}"
mkdir -p "$DEST"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$DEST/tina-v14-data-$STAMP.tar.gz"
if [ ! -d "$ROOT/backend/data" ]; then
  echo "No backend/data directory exists yet."
  exit 1
fi
tar -czf "$OUT" -C "$ROOT/backend" data
echo "BACKUP=PASS"
echo "FILE=$OUT"
