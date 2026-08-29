#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SOURCE_PROJECT="${1:-}"
if [[ -z "$SOURCE_PROJECT" ]]; then
  echo 'Usage: ./sync-canonical.sh "/path/to/Tina_Learning_Platform"'
  exit 2
fi
SOURCE_APP="$SOURCE_PROJECT/app.js"
if [[ ! -f "$SOURCE_APP" && -f "$SOURCE_PROJECT/dist/app.js" ]]; then SOURCE_APP="$SOURCE_PROJECT/dist/app.js"; fi
echo "TINA CLEAN v6 — READ-ONLY CANONICAL PROJECTION"
echo "SOURCE=$SOURCE_APP"
echo "SOURCE_MODIFIED=false"
python3 "$HERE/tools/sync_canonical.py" "$SOURCE_APP" "$HERE/data/canonical-projection.json"
echo "DONE. Restart/refresh the Clean v6 site."
