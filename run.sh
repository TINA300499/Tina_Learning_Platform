#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
echo "Tina Learning Platform Clean v1"
echo "Open http://127.0.0.1:5502/"
python3 -m http.server 5502
