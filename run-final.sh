#!/bin/bash
set -e
cd "$(dirname "$0")"
echo "=== TINA LEARNING PLATFORM V14 FINAL ==="
python3 tests/smoke-v14-final.py
echo
echo "Open: http://127.0.0.1:5502/"
python3 -m http.server 5502
