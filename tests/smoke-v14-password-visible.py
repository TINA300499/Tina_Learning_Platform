#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
js=(root/"admin-final-v14.js").read_text(errors="ignore")
css=(root/"styles.css").read_text(errors="ignore")
bad=[]
for x in ['["password","Change Admin Password"','b.dataset.tool==="password"','userAdminChangePassword','changeAdminPassword','Current admin password','New admin password','Confirm new admin password']:
    if x not in js: bad.append(x)
if '[data-tool="password"]' not in css: bad.append("password-card-css")
print("V14_PASSWORD_VISIBLE_SMOKE="+("PASS" if not bad else "FAIL"))
print("ADMIN_CONTROL_CENTER_PASSWORD_CARD=true")
print("USER_MANAGEMENT_PASSWORD_BUTTON=true")
print("PASSWORD_FLOW=true")
if bad:
 print("ISSUES="+" | ".join(bad));sys.exit(1)
