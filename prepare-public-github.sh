#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

bash qa/public-release-audit.sh

if [ ! -d .git ]; then
  git init
  git branch -M main
fi

echo
echo "Review the files that would be committed:"
git status --short
echo
echo "NEXT:"
echo "  git add ."
echo "  git status"
echo "  git commit -m 'Public release - Tina Learning Platform v14 FINAL'"
echo "  git remote add origin <YOUR_GITHUB_REPOSITORY_URL>"
echo "  git push -u origin main"
echo
echo "This helper intentionally does NOT commit or push automatically."
