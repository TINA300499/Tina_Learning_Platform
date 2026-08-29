#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pass(){ printf "PASS  %s\n" "$1"; }
fail(){ printf "FAIL  %s\n" "$1"; FAILURES=$((FAILURES+1)); }
FAILURES=0

echo "TINA LEARNING PLATFORM — V14 FINAL PUBLIC RELEASE AUDIT"
echo

test -f .gitignore && pass ".gitignore present" || fail ".gitignore missing"
test -f README.md && pass "README present" || fail "README missing"
test -f SECURITY.md && pass "SECURITY policy present" || fail "SECURITY policy missing"
test -f backend/.env.example && pass ".env.example present" || fail ".env.example missing"

# Files that must not be committed to a public repository.
BAD_FILES="$(find . -type f \( -name '.env' -o -name '*.sqlite' -o -name '*.sqlite3' -o -name '*.db' -o -name '*.pem' -o -name '*.key' -o -name '*.p12' -o -name '*.pfx' \) -not -path './.git/*' -print)"
if [ -z "$BAD_FILES" ]; then pass "no runtime secret/database/key files"; else echo "$BAD_FILES"; fail "runtime secret/database/key files found"; fi

# Detect the historical credential disclosure in public-facing source/docs.
if grep -RIl --exclude-dir=.git --exclude='public-release-audit.sh' --exclude='*.json' -- 'TinaSuperadmin@2026' . >/tmp/tina-public-secret-hits 2>/dev/null; then
  cat /tmp/tina-public-secret-hits
  fail "historical default Superadmin password string remains"
else
  pass "historical default Superadmin password absent"
fi

if grep -RIl --exclude-dir=.git --exclude='public-release-audit.sh' -- 'Fresh-copy account' . >/tmp/tina-public-account-hits 2>/dev/null; then
  cat /tmp/tina-public-account-hits
  fail "fresh-copy credential disclosure text remains"
else
  pass "fresh-copy credential disclosure absent"
fi

# Generic high-signal secret patterns. False positives should be reviewed, never silently ignored.
PATTERN='(BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,})'
if grep -REIl --exclude-dir=.git --exclude='public-release-audit.sh' "$PATTERN" . >/tmp/tina-generic-secret-hits 2>/dev/null; then
  cat /tmp/tina-generic-secret-hits
  fail "high-signal secret pattern found"
else
  pass "no high-signal secret pattern found"
fi

node --check workspace-completion-v14.js >/dev/null && pass "workspace JS syntax" || fail "workspace JS syntax"

echo
if [ "$FAILURES" -eq 0 ]; then
  echo "PUBLIC_GITHUB_READY=true"
  exit 0
else
  echo "PUBLIC_GITHUB_READY=false"
  echo "FAILURES=$FAILURES"
  exit 1
fi
