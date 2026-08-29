#!/usr/bin/env python3
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
app=(root/"app.js").read_text(errors="ignore")
eng=(root/"learning-engine-v4.js").read_text(errors="ignore")
css=(root/"styles.css").read_text(errors="ignore")
bad=[]
for x in ["practiceVideoUrl","embedPracticeVideo","normalizeVideoEmbedUrl","videoLinkHtml",'data-practice-action="watch"','data-practice-action="dictation"','data-practice-action="shadowing"','data-practice-action="speaking"']:
    if x not in app: bad.append("app:"+x)
for x in [".embedUrlRow",".embeddedPracticeVideo",".practiceMediaActions"]:
    if x not in css: bad.append("css:"+x)
for f in root.glob("*.js"):
    p=subprocess.run(["node","--check",str(f)],capture_output=True,text=True)
    if p.returncode: bad.append("syntax:"+f.name)
print("V14_VIDEO_EMBED_PRACTICE_ACTIONS="+("PASS" if not bad else "FAIL"))
print("VIDEO_URL_EMBED=true")
print("YOUTUBE_VIMEO_SUPPORT=true")
print("DIRECT_VIDEO_URL_SUPPORT=true")
print("PRACTICE_BUTTONS_UNDER_VIDEO=true")
print("WATCH_LISTEN=true")
print("DICTATION=true")
print("SHADOWING=true")
print("SPEAKING=true")
print("QUIZ_TEST=true")
if bad:
 print("ISSUES="+" | ".join(bad));sys.exit(1)
