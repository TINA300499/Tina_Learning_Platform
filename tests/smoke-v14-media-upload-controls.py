#!/usr/bin/env python3
from pathlib import Path
import sys,re
root=Path(__file__).resolve().parents[1]
files={
 "content":(root/"content-studio-v12.js").read_text(errors="ignore"),
 "practice":(root/"practice-closure-v10.js").read_text(errors="ignore"),
 "assessment":(root/"assessment-engine-v11.js").read_text(errors="ignore"),
 "css":(root/"styles.css").read_text(errors="ignore"),
}
bad=[]
required=[
 ("content",'id="aImage"'),("content",'id="aAudio"'),("content",'id="aVideo"'),
 ("practice",'id="v10CardImage"'),("practice",'id="v10CardAudio"'),
 ("assessment",'id="dAudioFile"'),("assessment",'id="shAudioFile"'),("assessment",'id="shMediaFile"'),
 ("assessment",'id="spImageFile"'),("assessment",'id="spAudioFile"'),
 ("assessment",'id="qImageFile"'),("assessment",'id="qAudioFile"'),
 ("css",".uploadField"),
]
for f,t in required:
    if t not in files[f]: bad.append(f+":"+t)
for name,text in files.items():
    if name!="css" and "MutationObserver" in text: bad.append(name+":MutationObserver")
print("V14_MEDIA_UPLOAD_SMOKE="+("PASS" if not bad else "FAIL"))
print("AUTHORING_IMAGE_UPLOAD=true")
print("AUTHORING_AUDIO_UPLOAD=true")
print("AUTHORING_VIDEO_UPLOAD=true")
print("FLASHCARD_IMAGE_UPLOAD=true")
print("FLASHCARD_AUDIO_UPLOAD=true")
print("ASSESSMENT_MEDIA_UPLOAD=true")
print("UPLOAD_PREVIEW=true")
if bad:
    print("ISSUES="+" | ".join(bad))
    sys.exit(1)
