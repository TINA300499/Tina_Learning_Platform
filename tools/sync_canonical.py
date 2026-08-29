#!/usr/bin/env python3
from pathlib import Path
import json, re, sys, datetime

NAMES = {
    "LEVELS":"levels","COURSES":"courses","UNITS":"units","LESSONS":"lessons",
    "SETS":"sets","ACTS":"activities","ITEMS":"items"
}

def scan_array(text, name):
    m = re.search(r'\b(?:const|let|var)\s+' + re.escape(name) + r'\s*=\s*\[', text)
    if not m:
        return None
    start = text.find("[", m.start())
    depth=0; quote=None; esc=False; line=False; block=False
    i=start
    while i < len(text):
        c=text[i]; n=text[i+1] if i+1<len(text) else ""
        if line:
            if c=="\n": line=False
            i+=1; continue
        if block:
            if c=="*" and n=="/": block=False; i+=2; continue
            i+=1; continue
        if quote:
            if esc: esc=False
            elif c=="\\": esc=True
            elif c==quote: quote=None
            i+=1; continue
        if c=="/" and n=="/": line=True; i+=2; continue
        if c=="/" and n=="*": block=True; i+=2; continue
        if c in ("'",'"','`'): quote=c; i+=1; continue
        if c=="[": depth+=1
        elif c=="]":
            depth-=1
            if depth==0: return text[start:i+1]
        i+=1
    return None

def js_like_to_json(s):
    # Canonical arrays historically use JSON-like object literals. First try strict JSON.
    try: return json.loads(s)
    except Exception: pass
    # Conservative conversion only: quote simple unquoted keys and convert single quoted strings.
    # Fail closed rather than execute JS.
    s2=re.sub(r'([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)', r'\1"\2"\3', s)
    def sq(m):
        body=m.group(1).replace('\\"','"').replace('"','\\"')
        return '"' + body.replace("\\'","'") + '"'
    s2=re.sub(r"'((?:\\.|[^'\\])*)'", sq, s2)
    s2=re.sub(r',(\s*[}\]])', r'\1', s2)
    return json.loads(s2)

def main():
    if len(sys.argv)<3:
        print("Usage: sync_canonical.py SOURCE_APP_JS OUTPUT_JSON")
        return 2
    src=Path(sys.argv[1]).expanduser().resolve()
    out=Path(sys.argv[2]).expanduser().resolve()
    if not src.is_file():
        print("ERROR: source app.js not found:", src); return 3
    text=src.read_text(encoding="utf-8", errors="replace")
    result={"schemaVersion":"1.0.0","source":str(src),"generated":True,
            "generatedAt":datetime.datetime.now(datetime.timezone.utc).isoformat()}
    missing=[]; failures=[]
    for js_name,key in NAMES.items():
        raw=scan_array(text,js_name)
        if raw is None:
            result[key]=[]; missing.append(js_name); continue
        try:
            value=js_like_to_json(raw)
            if not isinstance(value,list): raise ValueError("not an array")
            result[key]=value
        except Exception as e:
            result[key]=[]; failures.append(f"{js_name}: {e}")
    if failures:
        print("FAIL_CLOSED=true")
        print("PARSE_FAILURES=" + " | ".join(failures))
        return 4
    # Need hierarchy foundations. ITEMS may legitimately be sparse.
    required=["LEVELS","COURSES","UNITS","LESSONS","SETS","ACTS"]
    required_missing=[x for x in required if x in missing]
    if required_missing:
        print("FAIL_CLOSED=true")
        print("REQUIRED_ARRAYS_MISSING=" + ",".join(required_missing))
        return 5
    out.parent.mkdir(parents=True,exist_ok=True)
    tmp=out.with_suffix(out.suffix+".tmp")
    tmp.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
    tmp.replace(out)
    print("CANONICAL_PROJECTION=PASS")
    print("SOURCE_MODIFIED=false")
    for key in NAMES.values(): print(f"{key.upper()}={len(result[key])}")
    print("OUTPUT="+str(out))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
