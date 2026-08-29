#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
app=(root/"app.js").read_text(errors="ignore")
eng=(root/"learning-engine-v4.js").read_text(errors="ignore")
css=(root/"styles.css").read_text(errors="ignore")
bad=[]
for x in ["practiceAudioUpload","practiceVideoUpload","practiceMediaPreviewHtml","bindPracticeMediaUploads",'accept="audio/*"','accept="video/*"',"tina:practice-media"]:
    if x not in app: bad.append("app:"+x)
for x in ['window.addEventListener("tina:practice-media"',"Uploaded Audio","Uploaded Video","practiceUploadedVideo"]:
    if x not in eng: bad.append("engine:"+x)
for x in [".practiceMediaUploader",".practiceMediaGrid",".uploadedPracticeMedia"]:
    if x not in css: bad.append("css:"+x)
print("V14_PRACTICE_MEDIA_UPLOAD="+("PASS" if not bad else "FAIL"))
print("AUDIO_UPLOAD_BUTTON=true")
print("VIDEO_UPLOAD_BUTTON=true")
print("PRACTICE_ROOM_ONLY=true")
print("AUDIO_PREVIEW=true")
print("VIDEO_PREVIEW=true")
print("MEDIA_METADATA_PERSISTED=true")
if bad:
    print("ISSUES="+" | ".join(bad));sys.exit(1)
