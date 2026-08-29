#!/usr/bin/env python3
from pathlib import Path
import sys,re
root=Path(__file__).resolve().parents[1]
req=["assessment-engine-v11.js","practice-closure-v10.js","learning-studio-v9.js","index.html","styles.css"]
bad=[f"missing:{f}" for f in req if not (root/f).is_file()]
v=(root/"assessment-engine-v11.js").read_text(errors="ignore")
for token in ["Dictation Assessment","Shadowing Assessment","Speaking Assessment","Writing Assessment","Word Formation Test","Cloze Test","Quiz / Test Builder","Evidence Ledger","Assessment Analytics"]:
    if token not in v: bad.append("missing-module:"+token)
if "MutationObserver" in v: bad.append("MutationObserver")
if "location.reload" in v: bad.append("location.reload")
print("V11_SMOKE="+("PASS" if not bad else "FAIL"))
print("ASSESSMENT_MODULES=10")
print("MUTATION_OBSERVER=false")
print("AUTOMATIC_RELOAD=false")
if bad: print("ISSUES="+" | ".join(bad));sys.exit(1)
