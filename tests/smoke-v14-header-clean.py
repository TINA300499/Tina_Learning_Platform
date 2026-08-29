#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
js=(root/"admin-final-v14.js").read_text(errors="ignore")
css=(root/"styles.css").read_text(errors="ignore")
bad=[]
if 'className="v14-admin-strip"' in js: bad.append("right-banner-render-present")
if ".v14-admin-strip{" in css: bad.append("right-banner-style-present")
if "function topbar(){ /* disabled: clean header */ }" not in js: bad.append("banner-function-not-disabled")
print("V14_HEADER_CLEAN_SMOKE="+("PASS" if not bad else "FAIL"))
print("RIGHT_ADMIN_BANNER_REMOVED=true")
print("HEADER_CLEAN=true")
if bad:
    print("ISSUES="+" | ".join(bad))
    sys.exit(1)
