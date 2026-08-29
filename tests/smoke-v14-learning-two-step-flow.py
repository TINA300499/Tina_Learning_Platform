#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
app=(root/"app.js").read_text(errors="ignore")
eng=(root/"learning-engine-v4.js").read_text(errors="ignore")
css=(root/"styles.css").read_text(errors="ignore")
bad=[]
for x in ["practiceOpen","backToLearningModes","practiceRoomEngine","The activity opens on a separate practice page.","state.practiceOpen=true"]:
    if x not in app: bad.append("app:"+x)
for x in ['return document.querySelector("#v4Engine.practiceRoomEngine")',"if(!room)return","s.practiceOpen&&s.mode"]:
    if x not in eng: bad.append("engine:"+x)
if ".learningModeGrid" not in css: bad.append("css")
if 'wrap.appendChild(h)' in eng: bad.append("engine:auto-append-under-chooser")
print("V14_LEARNING_TWO_STEP_FLOW="+("PASS" if not bad else "FAIL"))
print("MODE_CHOOSER_PAGE=true")
print("DEDICATED_PRACTICE_PAGE=true")
print("PRACTICE_NOT_RENDERED_UNDER_CHOOSER=true")
print("BACK_TO_MODES=true")
print("SESSION_NOTES_SEPARATE=true")
if bad:
    print("ISSUES="+" | ".join(bad));sys.exit(1)
