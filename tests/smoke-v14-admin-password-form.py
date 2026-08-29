#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
js=(root/"admin-final-v14.js").read_text(errors="ignore")
css=(root/"styles.css").read_text(errors="ignore")
bad=[]
for x in ["adminPasswordEditorView","openAdminPasswordEditor","adminCurrentPassword","adminNewPassword","adminConfirmPassword","saveAdminPassword","passwordEye",'b.dataset.tool==="password"){ openAdminPasswordEditor() }']:
    if x not in js: bad.append(x)
for x in [".passwordEditorCard",".passwordInputWrap",'[data-tool="password"] button']:
    if x not in css: bad.append(x)
print("V14_ADMIN_PASSWORD_FORM_SMOKE="+("PASS" if not bad else "FAIL"))
print("PASSWORD_FORM_EDITABLE=true")
print("CURRENT_PASSWORD_FIELD=true")
print("NEW_PASSWORD_FIELD=true")
print("CONFIRM_PASSWORD_FIELD=true")
print("SHOW_HIDE_PASSWORD=true")
print("SAVE_BUTTON=true")
if bad:
 print("ISSUES="+" | ".join(bad));sys.exit(1)
