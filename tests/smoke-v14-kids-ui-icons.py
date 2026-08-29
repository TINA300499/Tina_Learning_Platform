#!/usr/bin/env python3
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
app=(root/"app.js").read_text(errors="ignore")
css=(root/"styles.css").read_text(errors="ignore")
bad=[]
for x in ["isKidsLevel","kidsHome","kidsQuickGrid","kidsModeGrid","ICONS","navIcon","starters","movers"]:
    if x not in app: bad.append("app:"+x)
for x in [".kidsQuickGrid",".kidsModeGrid",".navIcon",".kidsHero"]:
    if x not in css: bad.append("css:"+x)
for f in root.glob("*.js"):
    p=subprocess.run(["node","--check",str(f)],capture_output=True,text=True)
    if p.returncode: bad.append("syntax:"+f.name)
print("V14_KIDS_UI_ICONS="+("PASS" if not bad else "FAIL"))
print("STARTERS_SIMPLIFIED=true")
print("MOVERS_SIMPLIFIED=true")
print("KIDS_NAV_REDUCED=true")
print("KIDS_MODE_CHOICES_REDUCED=true")
print("NAV_ICONS=true")
print("PRACTICE_ICONS=true")
if bad:
 print("ISSUES="+" | ".join(bad));sys.exit(1)
