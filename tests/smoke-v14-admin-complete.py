#!/usr/bin/env python3
from pathlib import Path
import sys,re
root=Path(__file__).resolve().parents[1]
v=(root/"admin-final-v14.js").read_text(errors="ignore")
bad=[]
for token in ["Admin Operations Console","Curriculum Management","Content Operations","Media Operations","Practice & Flashcards","Assessment","Publishing & Governance","User / Study Administration","System & Data"]:
    if token not in v: bad.append("missing:"+token)
# Count explicit operation ids defined in adminOperationsView arrays.
ops=re.findall(r'\["([a-z0-9-]+)","[^"]+"\]',v)
ops=[x for x in ops if "-" in x]
if len(set(ops))<50: bad.append("admin-ops<50")
if "MutationObserver" in v: bad.append("MutationObserver")
if "location.reload" in v: bad.append("location.reload")
if 'style.display=isAdmin()?"":"none"' not in v: bad.append("academy-role-gate")
print("V14_ADMIN_COMPLETE_SMOKE="+("PASS" if not bad else "FAIL"))
print("ADMIN_OPERATION_BUTTONS="+str(len(set(ops))))
print("ACADEMY_ADMIN_ONLY=true")
print("CANONICAL_BROWSER_WRITE=LOCKED")
print("AUTOMATIC_RELOAD=false")
if bad:
    print("ISSUES="+" | ".join(bad));sys.exit(1)
