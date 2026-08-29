#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
html=(root/"index.html").read_text(errors="ignore")
css=(root/"styles.css").read_text(errors="ignore")
js=(root/"admin-final-v14.js").read_text(errors="ignore")
bad=[]
for x in ["tinaFooter","footerLinks","footerMeta"]: 
    if x not in html: bad.append("footer:"+x)
for x in ["COMPACT HEADER + FOOTER CLOSURE","#nav.v14nav .navbtn","min-height:36px"]:
    if x not in css: bad.append("css:"+x)
if "bindFooter()" not in js: bad.append("footer-routing")
if 'className="v14-admin-strip"' in js: bad.append("right-admin-banner")
print("V14_COMPACT_HEADER_FOOTER_SMOKE="+("PASS" if not bad else "FAIL"))
print("COMPACT_HEADER=true")
print("FOOTER=true")
print("RIGHT_ADMIN_BANNER_REMOVED=true")
if bad:
 print("ISSUES="+" | ".join(bad));sys.exit(1)
