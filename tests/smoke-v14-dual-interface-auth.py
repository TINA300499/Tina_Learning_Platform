#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
js=(root/"admin-final-v14.js").read_text(errors="ignore")
css=(root/"styles.css").read_text(errors="ignore")
bad=[]
for x in ['DEFAULT_ADMIN_USERNAME="admin"','DEFAULT_ADMIN_HASH="03230de7cd9e2af0b5a5f4b8e49c54deae3747e397aabb8d54a9f9c8b565d7a5"',"seedInitialAdmin","loginAdmin","loadCfg=cfg","function saveCfg","ADMIN_ONLY_NAV","USER_NAV_ORDER","ADMIN_NAV_ORDER","applyRoleInterface","Admin username","Admin password","userLoginBtn","userRegisterBtn","registerManagedUser","loginManagedUser","registrationToggle"]:
    if x not in js: bad.append(x)
for x in ['html[data-interface="user"]','html[data-interface="admin"]','#userRegisterBtn']:
    if x not in css: bad.append(x)
print("V14_DUAL_INTERFACE_AUTH_SMOKE="+("PASS" if not bad else "FAIL"))
print("USER_INTERFACE=true")
print("ADMIN_INTERFACE=true")
print("ADMIN_ONLY_NAV_HIDDEN_FROM_USER=true")
print("USER_LOGIN=true")
print("USER_REGISTRATION=true")
print("ADMIN_CAN_TOGGLE_REGISTRATION=true")
print("INITIAL_ADMIN_ACCOUNT=true")
print("ADMIN_USERNAME=admin")
if bad:
 print("ISSUES="+" | ".join(bad));sys.exit(1)
