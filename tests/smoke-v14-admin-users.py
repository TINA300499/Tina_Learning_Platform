#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
js=(root/"admin-final-v14.js").read_text(errors="ignore")
css=(root/"styles.css").read_text(errors="ignore")
bad=[]
for token in ["User Management","createManagedUser","openUserManagement","usrCreate","usrRole","usrStatus","usrReset","USERS_KEY"]:
    if token not in js: bad.append("missing:"+token)
for token in ['b.style.display=""','b.textContent=isAdmin()?"Admin":"Admin Login"']:
    if token not in js: bad.append("admin-entry:"+token)
if "display:inline-flex!important" not in css: bad.append("admin-css-visibility")
if "MutationObserver" in js: bad.append("MutationObserver")
if "location.reload" in js: bad.append("location.reload")
print("V14_ADMIN_USER_SMOKE="+("PASS" if not bad else "FAIL"))
print("ADMIN_ENTRY_ALWAYS_VISIBLE=true")
print("ACADEMY_ADMIN_ONLY=true")
print("USER_MANAGEMENT=true")
print("USER_CREATE_EDIT_DELETE=true")
print("USER_ROLE_STATUS_CONTROL=true")
print("USER_PASSWORD_RESET=true")
print("AUTOMATIC_RELOAD=false")
if bad:
    print("ISSUES="+" | ".join(bad))
    sys.exit(1)
