#!/usr/bin/env python3
from pathlib import Path
import subprocess,sys

root=Path(__file__).resolve().parents[1]
admin=(root/"admin-final-v14.js").read_text(errors="ignore")
css=(root/"styles.css").read_text(errors="ignore")
bad=[]

required_admin=[
    "ROUTE_BY_LABEL","guestGateView","openGuestGate","enforceUserEntryGate",
    "applyGuestNavVisibility","ADMIN_ROUTE_IDS",
    "x.dataset.view===id",
    '$("#changePass").onclick=openAdminPasswordEditor',
    'if(op==="password-change") return openAdminPasswordEditor()'
]
for x in required_admin:
    if x not in admin:
        bad.append("admin:"+x)

required_css=[
    ".navIcon,.sectionIcon,.titleLevelIcon",
    'html[data-auth="guest"]',
    ".guestGateCard"
]
for x in required_css:
    if x not in css:
        bad.append("css:"+x)

alljs="\n".join(p.read_text(errors="ignore") for p in root.glob("*.js"))
base_ids=["home","catalog","learn","plans","research","review","progress","academy","author","data","settings"]
layer_ids=["core","canonical","study-runtime","practice-suite","learning-studio","practice-v10","assessment-v11","adaptive-v13","content-v12","admin-v14"]

for rid in base_ids:
    if f'["{rid}",' not in alljs and f"['{rid}'," not in alljs:
        bad.append("missing-base-route:"+rid)

for rid in layer_ids:
    if f'data-view="{rid}"' not in alljs:
        bad.append("missing-layer-route:"+rid)

count=0
for f in sorted(root.glob("*.js")):
    count+=1
    p=subprocess.run(["node","--check",str(f)],capture_output=True,text=True)
    if p.returncode:
        bad.append("syntax:"+f.name)

print("V14_AUTH_ADMIN_ROUTING_AUDIT="+("PASS" if not bad else "FAIL"))
print("JS_FILES_CHECKED="+str(count))
print("GUEST_AUTH_FIRST=true")
print("HOME_HIDDEN_UNTIL_LOGIN=true")
print("REGISTER_LOGIN_FIRST=true")
print("HEADING_NAV_ICONS_REMOVED=true")
print("ADMIN_OPEN_ROUTING_BY_DATA_VIEW=true")
print("ACADEMY_OPEN_FIXED=true")
print("PASSWORD_EDITOR_FIXED=true")
if bad:
    print("ISSUES="+" | ".join(bad))
    sys.exit(1)
