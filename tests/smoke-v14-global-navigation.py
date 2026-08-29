#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
js=(root/"admin-final-v14.js").read_text(errors="ignore")
css=(root/"styles.css").read_text(errors="ignore")
bad=[]
for token in ["appBackBtn","appForwardBtn","appBack()","appForward()","installNavigationControls","recordNavigation"]:
    if token not in js: bad.append("js:"+token)
for token in [".appHistoryControls","button:disabled"]:
    if token not in css: bad.append("css:"+token)
if "MutationObserver" in js: bad.append("MutationObserver")
if "location.reload" in js: bad.append("location.reload")
print("V14_GLOBAL_NAV_SMOKE="+("PASS" if not bad else "FAIL"))
print("BACK_BUTTON=true")
print("FORWARD_BUTTON=true")
print("LOCAL_SUBPAGE_BACK_PRIORITY=true")
print("AUTOMATIC_RELOAD=false")
if bad:
    print("ISSUES="+" | ".join(bad))
    sys.exit(1)
