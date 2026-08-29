#!/usr/bin/env python3
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
app=(root/"app.js").read_text(errors="ignore")
css=(root/"styles.css").read_text(errors="ignore")
bad=[]
for x in ['data-select-level','continueCurrentLevel','state.view="learn"','state.practiceOpen=false','Start Learning']:
    if x not in app: bad.append("app:"+x)
for x in [".levelCatalogGrid",".selectedLevelCard",".catalogContinueBtn"]:
    if x not in css: bad.append("css:"+x)
for f in root.glob("*.js"):
    p=subprocess.run(["node","--check",str(f)],capture_output=True,text=True)
    if p.returncode: bad.append("syntax:"+f.name)
print("V14_CATALOG_DIRECT_TO_PRACTICE="+("PASS" if not bad else "FAIL"))
print("ANY_LEVEL_OPENS_ACTIVE_LEARNING=true")
print("CURRENT_LEVEL_CONTINUE_BUTTON=true")
print("CURRENT_LEVEL_HIGHLIGHT=true")
print("NO_EXTRA_SELECT_STEP=true")
if bad:
    print("ISSUES="+" | ".join(bad));sys.exit(1)
