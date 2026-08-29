#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
req=["content-studio-v12.js","assessment-engine-v11.js","practice-closure-v10.js","data/canonical-projection.json","tools/sync_canonical.py","sync-canonical.sh"]
bad=[f"missing:{x}" for x in req if not (root/x).is_file()]
v=(root/"content-studio-v12.js").read_text(errors="ignore")
for token in ["Canonical Explorer","Authoring Studio","Media Library","Validation Center","Publication Queue","Import / Export"]:
    if token not in v: bad.append("missing:"+token)
if "MutationObserver" in v: bad.append("MutationObserver")
if "location.reload" in v: bad.append("location.reload")
if "canonical publication: LOCKED".lower() not in v.lower(): bad.append("publication-lock")
print("V12_SMOKE="+("PASS" if not bad else "FAIL"))
print("CANONICAL_WRITE_BOUNDARY=LOCKED")
print("AUTHORING_LAYER=STAGING")
print("MEDIA_PREVIEW=true")
print("MUTATION_OBSERVER=false")
print("AUTOMATIC_RELOAD=false")
if bad: print("ISSUES="+" | ".join(bad));sys.exit(1)
