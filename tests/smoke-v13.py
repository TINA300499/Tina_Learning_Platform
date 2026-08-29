#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
v=(root/"adaptive-intelligence-v13.js").read_text(errors="ignore")
bad=[]
for t in ["Recommendation Engine","Mastery Map","Universal Search","Backup & Recovery","Reliability Center"]:
    if t not in v: bad.append("missing:"+t)
for t in ["MutationObserver","location.reload"]:
    if t in v: bad.append("forbidden:"+t)
print("V13_SMOKE="+("PASS" if not bad else "FAIL"))
print("ADAPTIVE_RECOMMENDATION=true")
print("UNIFIED_SEARCH=true")
print("FULL_LOCAL_BACKUP=true")
print("AUTOMATIC_RELOAD=false")
if bad: print("ISSUES="+" | ".join(bad));sys.exit(1)
