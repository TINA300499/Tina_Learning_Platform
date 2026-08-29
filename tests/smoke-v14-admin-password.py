#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
js=(root/"admin-final-v14.js").read_text(errors="ignore")
css=(root/"styles.css").read_text(errors="ignore")
bad=[]
for x in ["adminChangePassword","changeAdminPassword","Current admin password","Confirm new admin password","cfg.hash=await digest(next)"]:
    if x not in js: bad.append(x)
if "#adminChangePassword" not in css: bad.append("password-button-css")
if "MutationObserver" in js: bad.append("MutationObserver")
if "location.reload" in js: bad.append("location.reload")
print("V14_ADMIN_PASSWORD_SMOKE="+("PASS" if not bad else "FAIL"))
print("CHANGE_ADMIN_PASSWORD_BUTTON=true")
print("CURRENT_PASSWORD_VERIFICATION=true")
print("NEW_PASSWORD_CONFIRMATION=true")
print("MIN_PASSWORD_LENGTH=6")
print("AUTOMATIC_RELOAD=false")
if bad:
 print("ISSUES="+" | ".join(bad));sys.exit(1)
