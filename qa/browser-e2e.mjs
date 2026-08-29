import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import {spawn,execFileSync} from "node:child_process";

const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),"..");
const chromeCandidates=[
 process.env.CHROME_BIN,
 "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
 "/Applications/Chromium.app/Contents/MacOS/Chromium",
 "chromium","google-chrome"
].filter(Boolean);
let chrome=null;
for(const c of chromeCandidates){try{execFileSync(c,["--version"],{stdio:"ignore"});chrome=c;break}catch{}}
if(!chrome){console.error("BROWSER_E2E=SKIP — Chrome/Chromium not found.");process.exit(2)}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"tina-v14-browser-e2e-")),data=path.join(tmp,"data"),profile=path.join(tmp,"profile");
fs.mkdirSync(data);fs.mkdirSync(profile);
const appPort=18978,debugPort=19228,password="TinaBrowserE2E!2026";
const env={...process.env,TINA_PORT:String(appPort),TINA_HOST:"127.0.0.1",TINA_DATA_DIR:data,TINA_MASTER_KEY_BASE64:crypto.randomBytes(32).toString("base64"),TINA_SUPERADMIN_USERNAME:"superadmin",TINA_SUPERADMIN_PASSWORD:password,TINA_COOKIE_SECURE:"false"};
const server=spawn(process.execPath,[path.join(ROOT,"backend","server.mjs")],{cwd:ROOT,env,stdio:"ignore"});
const browser=spawn(chrome,["--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check",`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,`http://127.0.0.1:${appPort}/`],{stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitJSON(url){for(let i=0;i<80;i++){try{const r=await fetch(url);if(r.ok)return r.json()}catch{}await sleep(100)}throw new Error("Timed out waiting for browser")}
let ws,seq=0,pending=new Map();
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})}
try{
 const pages=await waitJSON(`http://127.0.0.1:${debugPort}/json`),page=pages.find(x=>x.type==="page");if(!page)throw new Error("No browser page");
 ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result)}};
 await send("Runtime.enable");await sleep(3500);
 const evalv=async expression=>(await send("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true})).result.value;
 const initial=await evalv(`({login:document.body.innerText.includes("Choose your login"),backend:document.body.innerText.includes("Backend + SQLite"),errors:window.__tinaE2EErrors||[]})`);
 const clicked=await evalv(`(()=>{const b=document.querySelector('[data-role-login="superadmin"]');if(!b)return false;b.click();return true})()`);
 await sleep(400);
 const form=await evalv(`!!document.querySelector("#saLoginSubmit")`);
 const result={generatedAt:new Date().toISOString(),initial,clicked,superadminForm:form,pass:!!(initial.login&&initial.backend&&clicked&&form)};
 console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1;
}finally{
 try{ws?.close()}catch{}browser.kill("SIGTERM");server.kill("SIGTERM");await sleep(400);fs.rmSync(tmp,{recursive:true,force:true})
}
