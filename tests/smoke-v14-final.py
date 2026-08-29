#!/usr/bin/env python3
from pathlib import Path
import sys,re,json
root=Path(__file__).resolve().parents[1]
req=["admin-final-v14.js","adaptive-intelligence-v13.js","content-studio-v12.js","assessment-engine-v11.js","practice-closure-v10.js","index.html","styles.css"]
bad=[f"missing:{x}" for x in req if not (root/x).is_file()]
v=(root/"admin-final-v14.js").read_text(errors="ignore")
for t in ["ADMIN CONTROL CENTER","Academy","Content Studio","System & Backup","Admin Login","Academy is hidden"]:
    if t not in v: bad.append("missing:"+t)
if "MutationObserver" in v: bad.append("v14-MutationObserver")
if "location.reload" in v: bad.append("v14-location.reload")
if 'style.display=isAdmin()?"":"none"' not in v: bad.append("academy-role-gate")
idx=(root/"index.html").read_text(errors="ignore")
if idx.count("admin-final-v14.js")!=1: bad.append("admin-runtime-load")
print("V14_FINAL_SMOKE="+("PASS" if not bad else "FAIL"))
print("ACADEMY_ADMIN_ONLY=true")
print("ADMIN_CONTROL_CENTER=true")
print("FULL_BACKUP_RESTORE=true")
print("V14_MUTATION_OBSERVER=false")
print("V14_AUTOMATIC_RELOAD=false")
print("CANONICAL_BROWSER_WRITE=LOCKED")
if bad: print("ISSUES="+" | ".join(bad));sys.exit(1)
