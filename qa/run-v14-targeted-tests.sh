#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "============================================================"
echo " TINA LEARNING PLATFORM v14 FINAL"
echo " TARGETED REGRESSION TESTS"
echo "============================================================"

echo
echo "=== 1. JS/MJS SYNTAX ==="
node --check workspace-completion-v14.js
node --check backend-client.js
node --check app.js
echo "SYNTAX=PASS"

echo
echo "=== 2. TINA ACADEMY SINGLE-BUTTON REGRESSION ==="
node qa/academy-single-button-regression.mjs

echo
echo "=== 3. SYSTEM QA & RELIABILITY REGRESSION ==="
node qa/system-qa-reliability-regression.mjs

echo
echo "=== 4. ISSUE REPAIR + TINA DICTIONARY REGRESSION ==="
node qa/issue-repair-dictionary-regression.mjs

echo
echo "=== 5. DICTIONARY TABLE + MEDIA REGRESSION ==="
node qa/dictionary-table-media-regression.mjs

echo
echo "=== 6. FOOTER PATH MANAGER REGRESSION ==="
node qa/footer-path-manager-regression.mjs

echo

echo
echo "=== 7. BACKEND HTTP E2E ==="
node qa/deployment-http-e2e.mjs

echo
echo "TARGETED_TESTS=PASS"
