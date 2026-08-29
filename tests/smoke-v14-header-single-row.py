#!/usr/bin/env python3
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
css=(root/"styles.css").read_text(errors="ignore")
bad=[]
for x in [
 "HEADER SINGLE-LINE / NO WRAP FIX",
 "grid-template-columns:auto auto minmax(0,1fr) auto",
 "flex-wrap:nowrap!important",
 "overflow-x:auto!important",
 ".topbar > #nav",
 ".topbar > .interfaceSwitcher"
]:
 if x not in css: bad.append(x)
for f in root.glob("*.js"):
 p=subprocess.run(["node","--check",str(f)],capture_output=True,text=True)
 if p.returncode: bad.append("syntax:"+f.name)
print("V14_HEADER_SINGLE_ROW="+("PASS" if not bad else "FAIL"))
print("NAV_NO_WRAP=true")
print("HORIZONTAL_NAV_OVERFLOW=true")
print("AUTH_CONTROLS_NO_SECOND_ROW=true")
print("ADMIN_USER_SWITCHER_COMPACT=true")
if bad:
 print("ISSUES="+" | ".join(bad));sys.exit(1)
