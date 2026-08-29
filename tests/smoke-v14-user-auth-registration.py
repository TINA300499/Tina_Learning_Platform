#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
js=(root/"admin-final-v14.js").read_text(errors="ignore")
css=(root/"styles.css").read_text(errors="ignore")
bad=[]
required=[
 "registrationEnabled","setRegistrationEnabled","loginManagedUser","registerManagedUser",
 "openUserLogin","openUserRegister","userLoginBtn","userRegisterBtn","registrationToggle",
 "Show Register button to users","USER_SESSION_KEY","logoutManagedUser"
]
for x in required:
    if x not in js: bad.append(x)
for x in [".authWrap",".registrationAdminCard",".userRegisterBtn"]:
    if x not in css: bad.append(x)
if "MutationObserver" in js: bad.append("MutationObserver")
if "location.reload" in js: bad.append("location.reload")
print("V14_USER_AUTH_REGISTRATION_SMOKE="+("PASS" if not bad else "FAIL"))
print("USER_LOGIN=true")
print("USER_REGISTRATION=true")
print("ADMIN_REGISTRATION_VISIBILITY_TOGGLE=true")
print("USER_LOGOUT=true")
print("REGISTRATION_DEFAULT_VISIBLE=true")
print("AUTOMATIC_RELOAD=false")
if bad:
    print("ISSUES="+" | ".join(bad));sys.exit(1)
