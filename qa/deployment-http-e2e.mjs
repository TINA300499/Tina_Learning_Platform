import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import {spawn} from "node:child_process";

const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),"..");
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"tina-v14-e2e-"));
const port=18977;
const password="TinaE2ETemporary!2026";
const env={...process.env,TINA_PORT:String(port),TINA_HOST:"127.0.0.1",TINA_DATA_DIR:tmp,
 TINA_MASTER_KEY_BASE64:crypto.randomBytes(32).toString("base64"),TINA_SUPERADMIN_USERNAME:"superadmin",
 TINA_SUPERADMIN_PASSWORD:password,TINA_COOKIE_SECURE:"false"};
const child=spawn(process.execPath,[path.join(ROOT,"backend","server.mjs")],{cwd:ROOT,env,stdio:["ignore","pipe","pipe"]});
let cookie="";
const results=[];
const check=(name,pass,detail="")=>results.push({name,pass:!!pass,detail:String(detail).slice(0,400)});
async function req(p,opt={}){
 const headers={...(opt.headers||{})};if(cookie)headers.Cookie=cookie;if(opt.body&&!headers["Content-Type"])headers["Content-Type"]="application/json";
 const r=await fetch(`http://127.0.0.1:${port}${p}`,{...opt,headers});
 const sc=r.headers.get("set-cookie");if(sc)cookie=sc.split(";")[0];
 const type=r.headers.get("content-type")||"";const body=type.includes("json")?await r.json():Buffer.from(await r.arrayBuffer());
 return {r,body}
}
try{
 for(let i=0;i<60;i++){try{const x=await fetch(`http://127.0.0.1:${port}/api/health`);if(x.ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 let x=await req("/api/health");check("health",x.r.ok&&x.body.database==="sqlite");
 x=await req("/api/auth/login",{method:"POST",body:JSON.stringify({username:"superadmin",password,role:"superadmin",remember:true})});check("login",x.r.ok);
 x=await req("/api/me");check("session",x.r.ok&&x.body.user.activeRole==="superadmin");
 x=await req("/api/telemetry",{method:"POST",body:JSON.stringify({events:[{id:"e2e-1",type:"e2e",at:new Date().toISOString(),durationMs:1000}]})});check("telemetry",x.r.ok);
 const payload=Buffer.from("tina-media-e2e");x=await req("/api/media",{method:"POST",body:JSON.stringify({name:"qa.bin",mime:"application/octet-stream",dataBase64:payload.toString("base64")})});const media=x.body;check("media-upload",x.r.ok&&!!media.id);
 x=await req(media.url);check("media-read",x.r.ok&&Buffer.compare(x.body,payload)===0);
 x=await req("/api/backup");check("backup",x.r.ok&&x.body.schema==="tina-v14-production-backup"&&!!x.body.tables.media[0].file_enc_b64);
 x=await req("/api/auth/logout",{method:"POST",body:"{}"});check("logout",x.r.ok);
 const failed=results.filter(x=>!x.pass).length,report={generatedAt:new Date().toISOString(),passed:results.length-failed,failed,testDataResidual:false,results};
 console.log(JSON.stringify(report,null,2));if(failed)process.exitCode=1;
}finally{
 child.kill("SIGTERM");await new Promise(r=>setTimeout(r,300));fs.rmSync(tmp,{recursive:true,force:true});
}
