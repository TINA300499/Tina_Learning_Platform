#!/usr/bin/env python3
from pathlib import Path
import re, sys
root=Path(__file__).resolve().parents[1]
required=["index.html","app.js","practice-closure-v10.js","practice-suite-v8.js","learning-studio-v9.js","styles.css","run.sh"]
bad=[]
for f in required:
    if not (root/f).is_file(): bad.append("missing:"+f)
text="\n".join((root/f).read_text(errors="ignore") for f in ["app.js","practice-closure-v10.js","practice-suite-v8.js","learning-studio-v9.js"])
if "MutationObserver" in text: bad.append("MutationObserver-present")
# v10 itself must not reload or set recurring repaint logic.
v10=(root/"practice-closure-v10.js").read_text(errors="ignore")
if "location.reload" in v10: bad.append("v10-location.reload")
games=re.findall(r'\["[^"]+","[^"]+"\]',v10[v10.find("const G="):v10.find("function games")])
if len(games)<30: bad.append("games<30")
print("V10_SMOKE="+("PASS" if not bad else "FAIL"))
print("REQUIRED_FILES="+str(len(required)))
print("GAME_MODES="+str(len(games)))
print("MUTATION_OBSERVER_PRODUCTION="+("false" if "MutationObserver" not in text else "true"))
if bad:
    print("ISSUES="+" | ".join(bad));sys.exit(1)
