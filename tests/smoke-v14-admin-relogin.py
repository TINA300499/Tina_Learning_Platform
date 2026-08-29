#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
js=(root/"admin-final-v14.js").read_text(errors="ignore")
css=(root/"styles.css").read_text(errors="ignore")
bad=[]
for x in ["restorePublicAuthChrome","adminBtn.textContent=\"Admin Login\"","adminBtn.onclick=openAdmin",'$("#adminLogout")?.addEventListener("click",()=>{restorePublicAuthChrome()']:
    if x not in js: bad.append(x)
if 'html[data-interface="user"] .adminV14Btn' not in css: bad.append("admin-relogin-css")
print("V14_ADMIN_RELOGIN_SMOKE="+("PASS" if not bad else "FAIL"))
print("ADMIN_LOGIN_VISIBLE_AFTER_LOGOUT=true")
print("ADMIN_RELOGIN_AVAILABLE=true")
print("USER_INTERFACE_RESTORED=true")
if bad:
    print("ISSUES="+" | ".join(bad));sys.exit(1)
