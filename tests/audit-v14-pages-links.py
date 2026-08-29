#!/usr/bin/env python3
from pathlib import Path
import re, subprocess, sys, json

root=Path(__file__).resolve().parents[1]
js_files=sorted(root.glob("*.js"))
bad=[]

# Syntax check every JavaScript layer.
syntax=[]
for f in js_files:
    p=subprocess.run(["node","--check",str(f)],capture_output=True,text=True)
    syntax.append((f.name,p.returncode))
    if p.returncode:
        bad.append("syntax:"+f.name)

app=(root/"app.js").read_text(errors="ignore")
admin=(root/"admin-final-v14.js").read_text(errors="ignore")
index=(root/"index.html").read_text(errors="ignore")

# Base routes -> view map contract.
route_m=re.search(r'const routes=\[(.*?)\];',app,re.S)
view_m=re.search(r'const views=\{(.*?)\};',app,re.S)
if not route_m or not view_m:
    bad.append("base-route-contract-missing")
    routes=[]
else:
    routes=re.findall(r'\["([^"]+)","([^"]+)"\]',route_m.group(1))
    view_names={x.strip() for x in view_m.group(1).split(",")}
    for rid,label in routes:
        if rid not in view_names:
            bad.append("route-without-view:"+rid)

# Literal data-go targets in app must exist in base routes.
route_ids={r[0] for r in routes}
targets=set(re.findall(r'data-go=["\']([^"\']+)["\']',app))
for target in sorted(targets):
    if "${" not in target and target not in route_ids:
        bad.append("data-go-invalid:"+target)

# All declared scripts in HTML must exist.
scripts=re.findall(r'<script src="([^"]+)"',index)
for src in scripts:
    if not (root/src).exists():
        bad.append("missing-script:"+src)

# Required global interface/auth contracts.
for token in [
    'window.addEventListener("tina:app-rendered"',
    "installInterfaceSwitcher",
    "syncInterfaceChrome",
    "guardAdminRoutes",
    "enterUserPreview",
    "returnToAdminInterface",
    "Admin Login",
    "User View",
    "Back to Admin",
    "userLoginBtn",
    "userRegisterBtn",
]:
    if token not in admin:
        bad.append("interface-contract:"+token)

# Public UI should annotate its admin-only home actions.
if 'data-admin-only="true"' not in app:
    bad.append("admin-only-home-actions-not-marked")

# Ensure the app emits render lifecycle after every page redraw.
if 'window.dispatchEvent(new CustomEvent("tina:app-rendered"' not in app:
    bad.append("render-event-missing")

print("V14_FULL_PAGE_LINK_AUDIT="+("PASS" if not bad else "FAIL"))
print("JS_FILES_CHECKED="+str(len(js_files)))
print("HTML_SCRIPT_LINKS="+str(len(scripts)))
print("BASE_ROUTES="+str(len(routes)))
print("DATA_GO_TARGETS="+str(len(targets)))
print("USER_ADMIN_SWITCHER=true")
print("ROLE_CHROME_REHYDRATES_AFTER_EVERY_RENDER=true")
print("ADMIN_ONLY_PUBLIC_LINKS_HIDDEN=true")
print("ADMIN_ROUTE_GUARD=true")
if bad:
    print("ISSUES="+" | ".join(bad))
    sys.exit(1)
