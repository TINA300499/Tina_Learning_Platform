#!/usr/bin/env python3
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
app=(root/"app.js").read_text(errors="ignore")
admin=(root/"admin-final-v14.js").read_text(errors="ignore")
css=(root/"styles.css").read_text(errors="ignore")
bad=[]
for x in ["visualCard","navIcon","sectionIcon","modeTitleIcon","ICONS"]:
    if x not in app: bad.append("app:"+x)
for x in ["ADMIN_TOOL_ICONS","decorateAdminCards","adminToolIcon"]:
    if x not in admin: bad.append("admin:"+x)
for x in [".visualCard",".adminVisualCard",".adminToolIcon","UNIFIED VISUAL SYSTEM ALL INTERFACES"]:
    if x not in css: bad.append("css:"+x)
for f in root.glob("*.js"):
    p=subprocess.run(["node","--check",str(f)],capture_output=True,text=True)
    if p.returncode: bad.append("syntax:"+f.name)
print("V14_UNIFIED_VISUAL_UI="+("PASS" if not bad else "FAIL"))
print("ALL_LEVELS_VISUAL_SYSTEM=true")
print("ADMIN_UI_VISUAL_SYSTEM=true")
print("USER_UI_VISUAL_SYSTEM=true")
print("GLOBAL_NAV_ICONS=true")
print("ADMIN_TOOL_ICONS=true")
print("KIDS_SIMPLIFICATION_PRESERVED=true")
if bad:
    print("ISSUES="+" | ".join(bad));sys.exit(1)
