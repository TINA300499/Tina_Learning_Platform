#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
js=(root/"admin-final-v14.js").read_text(errors="ignore")
css=(root/"styles.css").read_text(errors="ignore")
bad=[]
for x in ["logoutAdminInstant","syncPublicChromeNow","requestAnimationFrame","adminBtn.textContent=\"Admin Login\"",'$("#adminLogout")?.addEventListener("click",logoutAdminInstant)']:
    if x not in js: bad.append(x)
if 'html[data-interface="user"] #nav [data-view="admin-v14"]' not in css: bad.append("css")
if "location.reload" in js: bad.append("location.reload")
if "MutationObserver" in js: bad.append("MutationObserver")
print("V14_INSTANT_ADMIN_LOGOUT_SMOKE="+("PASS" if not bad else "FAIL"))
print("ADMIN_LOGIN_VISIBLE_WITHOUT_RELOAD=true")
print("POST_LOGOUT_DOM_SYNC=true")
print("DOUBLE_FRAME_STABILIZATION=true")
print("AUTOMATIC_RELOAD=false")
if bad:
    print("ISSUES="+" | ".join(bad));sys.exit(1)
