import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";
import {DatabaseSync} from "node:sqlite";

const HERE=path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT=path.resolve(HERE,"..");
const DATA_DIR=path.resolve(process.env.TINA_DATA_DIR||path.join(HERE,"data"));
const MEDIA_DIR=path.join(DATA_DIR,"media");
const DB_PATH=path.join(DATA_DIR,"tina.sqlite");
const PORT=Number(process.env.TINA_PORT||8787);
const HOST=process.env.TINA_HOST||"127.0.0.1";
const COOKIE_SECURE=String(process.env.TINA_COOKIE_SECURE||"false")==="true";
const MASTER=Buffer.from(process.env.TINA_MASTER_KEY_BASE64||"","base64");
const SUPER_USER=(process.env.TINA_SUPERADMIN_USERNAME||"superadmin").trim().toLowerCase();
const SUPER_PASS=process.env.TINA_SUPERADMIN_PASSWORD||"";
const MAX_JSON=Number(process.env.TINA_MAX_JSON_BYTES||35_000_000);
const MAX_MEDIA=Number(process.env.TINA_MAX_MEDIA_BYTES||25_000_000);

if(MASTER.length!==32){console.error("TINA_MASTER_KEY_BASE64 must decode to exactly 32 bytes.");process.exit(1)}
if(SUPER_PASS.length<12){console.error("TINA_SUPERADMIN_PASSWORD must be at least 12 characters.");process.exit(1)}
fs.mkdirSync(DATA_DIR,{recursive:true,mode:0o700});
fs.mkdirSync(MEDIA_DIR,{recursive:true,mode:0o700});

const db=new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
const now=()=>new Date().toISOString();
const uuid=()=>crypto.randomUUID();
const jsonText=v=>JSON.stringify(v??null);
const parseJSON=(v,fallback=null)=>{try{return JSON.parse(v)}catch{return fallback}};
const roleSet=v=>[...new Set(Array.isArray(v)?v.filter(Boolean):[])];
const hmac=v=>crypto.createHmac("sha256",MASTER).update(String(v)).digest("hex");

function migrate(){
 db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);`);
 const done=new Set(db.prepare("SELECT version FROM schema_migrations").all().map(x=>x.version));
 const migrations=[
  [1,`
   CREATE TABLE IF NOT EXISTS users(
    id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    roles_json TEXT NOT NULL, primary_role TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active',
    password_hash TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, last_login_at TEXT
   );
   CREATE TABLE IF NOT EXISTS sessions(
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, active_role TEXT NOT NULL,
    expires_at INTEGER NOT NULL, created_at TEXT NOT NULL, last_seen_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
   );
   CREATE TABLE IF NOT EXISTS client_snapshots(
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at TEXT NOT NULL, schema_label TEXT,
    payload_enc BLOB NOT NULL, reason TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
   );
   CREATE INDEX IF NOT EXISTS idx_snapshots_user_time ON client_snapshots(user_id,created_at);
   CREATE TABLE IF NOT EXISTS telemetry(
    id TEXT PRIMARY KEY, user_id TEXT, role TEXT, event_type TEXT NOT NULL, at TEXT NOT NULL,
    view_name TEXT, duration_ms INTEGER NOT NULL DEFAULT 0, detail_enc BLOB,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
   );
   CREATE INDEX IF NOT EXISTS idx_telemetry_time ON telemetry(at);
   CREATE INDEX IF NOT EXISTS idx_telemetry_user ON telemetry(user_id,at);
   CREATE TABLE IF NOT EXISTS media(
    id TEXT PRIMARY KEY, owner_user_id TEXT NOT NULL, name TEXT NOT NULL, mime TEXT NOT NULL,
    size_bytes INTEGER NOT NULL, path TEXT NOT NULL, created_at TEXT NOT NULL,
    FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
   );
   CREATE TABLE IF NOT EXISTS audit(
    id TEXT PRIMARY KEY, actor_user_id TEXT, actor_role TEXT, action TEXT NOT NULL,
    target TEXT, at TEXT NOT NULL, detail_enc BLOB
   );
  `],
  [2,`
   CREATE TABLE IF NOT EXISTS app_settings(
    key TEXT PRIMARY KEY, value_enc BLOB NOT NULL, updated_at TEXT NOT NULL
   );
  `]
 ];
 for(const [version,sql] of migrations){
  if(done.has(version))continue;
  db.exec("BEGIN");
  try{db.exec(sql);db.prepare("INSERT INTO schema_migrations(version,applied_at) VALUES(?,?)").run(version,now());db.exec("COMMIT")}
  catch(e){db.exec("ROLLBACK");throw e}
 }
}
migrate();

function encryptBuffer(buf){
 const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv("aes-256-gcm",MASTER,iv);
 const enc=Buffer.concat([cipher.update(buf),cipher.final()]),tag=cipher.getAuthTag();
 return Buffer.concat([Buffer.from("TINA2"),iv,tag,enc])
}
function decryptBuffer(buf){
 if(!Buffer.isBuffer(buf))buf=Buffer.from(buf);
 if(buf.subarray(0,5).toString()!=="TINA2")throw new Error("Invalid encrypted payload");
 const iv=buf.subarray(5,17),tag=buf.subarray(17,33),enc=buf.subarray(33);
 const d=crypto.createDecipheriv("aes-256-gcm",MASTER,iv);d.setAuthTag(tag);
 return Buffer.concat([d.update(enc),d.final()])
}
const encryptJSON=v=>encryptBuffer(Buffer.from(JSON.stringify(v)));
const decryptJSON=v=>JSON.parse(decryptBuffer(v).toString("utf8"));

const scrypt=(password,salt=crypto.randomBytes(16).toString("base64"))=>new Promise((resolve,reject)=>
 crypto.scrypt(password,salt,64,{N:16384,r:8,p:1},(e,key)=>e?reject(e):resolve(`scrypt$${salt}$${key.toString("base64")}`))
);
async function verifyPassword(password,stored){
 stored=String(stored||"");
 if(stored.startsWith("scrypt$")){
  const [,salt,key]=stored.split("$"),got=await scrypt(password,salt);
  return crypto.timingSafeEqual(Buffer.from(got.split("$")[2],"base64"),Buffer.from(key,"base64"))
 }
 if(stored.startsWith("sha256$")){
  const expected=stored.slice(7),got=crypto.createHash("sha256").update(password).digest("hex");
  return expected.length===got.length&&crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(got))
 }
 return false
}
async function seedSuperadmin(){
 const row=db.prepare("SELECT * FROM users WHERE username=?").get(SUPER_USER);
 if(row)return;
 const ph=await scrypt(SUPER_PASS),t=now();
 db.prepare(`INSERT INTO users(id,username,name,roles_json,primary_role,status,password_hash,created_at,updated_at)
 VALUES(?,?,?,?,?,?,?,?,?)`).run(uuid(),SUPER_USER,"Tina Superadmin",jsonText(["superadmin"]),"superadmin","active",ph,t,t);
}
await seedSuperadmin();

function securityHeaders(res,isStatic=false){
 res.setHeader("X-Content-Type-Options","nosniff");
 res.setHeader("X-Frame-Options","DENY");
 res.setHeader("Referrer-Policy","strict-origin-when-cross-origin");
 res.setHeader("Cross-Origin-Opener-Policy","same-origin");
 res.setHeader("Permissions-Policy","geolocation=(), payment=(), usb=()");
 if(isStatic)res.setHeader("Content-Security-Policy",
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob: https:; connect-src 'self' https://api.dictionaryapi.dev https://api.mymemory.translated.net; frame-src https://www.youtube.com https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
 else res.setHeader("Content-Security-Policy","default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
}
function json(res,status,obj){securityHeaders(res,false);res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});res.end(JSON.stringify(obj))}
function cookies(req){return Object.fromEntries((req.headers.cookie||"").split(";").map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf("=");return [x.slice(0,i),decodeURIComponent(x.slice(i+1))]}))}
async function readBody(req,limit=MAX_JSON){
 let n=0,chunks=[];for await(const c of req){n+=c.length;if(n>limit)throw Object.assign(new Error("Request too large"),{status:413});chunks.push(c)}
 if(!chunks.length)return {};
 const text=Buffer.concat(chunks).toString("utf8");try{return JSON.parse(text)}catch{throw Object.assign(new Error("Invalid JSON"),{status:400})}
}
function userPublic(row){
 if(!row)return null;const roles=roleSet(parseJSON(row.roles_json,[]));
 return {id:row.id,email:row.username,username:row.username,name:row.name,roles,primaryRole:row.primary_role,role:row.primary_role,status:row.status,lastLoginAt:row.last_login_at}
}
function sessionFor(req){
 const token=cookies(req).tina_session;if(!token)return null;
 const hash=hmac(token),row=db.prepare(`SELECT s.*,u.username,u.name,u.roles_json,u.primary_role,u.status
 FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?`).get(hash);
 if(!row||row.expires_at<Date.now()||row.status!=="active"){if(row)db.prepare("DELETE FROM sessions WHERE token_hash=?").run(hash);return null}
 const roles=roleSet(parseJSON(row.roles_json,[]));if(!roles.includes(row.active_role)&&!roles.includes("superadmin"))return null;
 db.prepare("UPDATE sessions SET last_seen_at=? WHERE token_hash=?").run(now(),hash);
 return {tokenHash:hash,userId:row.user_id,username:row.username,name:row.name,roles,activeRole:row.active_role,primaryRole:row.primary_role}
}
function requireSession(req,res,roles=null){
 const s=sessionFor(req);if(!s){json(res,401,{error:"Authentication required"});return null}
 if(roles&&!roles.some(r=>s.roles.includes(r))){json(res,403,{error:"Forbidden"});return null}
 return s
}
function requireActiveRole(req,res,allowed){
 const s=requireSession(req,res);if(!s)return null;
 if(!allowed.includes(s.activeRole)&&!s.roles.includes("superadmin")){json(res,403,{error:"Active role is not authorized"});return null}
 return s
}
function setSession(res,user,activeRole,remember=false){
 const token=crypto.randomBytes(32).toString("base64url"),max=remember?30*24*3600:12*3600,expires=Date.now()+max*1000,t=now();
 db.prepare("INSERT INTO sessions(token_hash,user_id,active_role,expires_at,created_at,last_seen_at) VALUES(?,?,?,?,?,?)")
   .run(hmac(token),user.id,activeRole,expires,t,t);
 res.setHeader("Set-Cookie",`tina_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${max}${COOKIE_SECURE?"; Secure":""}`);
}
function clearSession(req,res){
 const token=cookies(req).tina_session;if(token)db.prepare("DELETE FROM sessions WHERE token_hash=?").run(hmac(token));
 res.setHeader("Set-Cookie",`tina_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${COOKIE_SECURE?"; Secure":""}`)
}
function audit(sess,action,target="",detail={}){
 db.prepare("INSERT INTO audit(id,actor_user_id,actor_role,action,target,at,detail_enc) VALUES(?,?,?,?,?,?,?)")
   .run(uuid(),sess?.userId||null,sess?.activeRole||"system",action,target,now(),encryptJSON(detail))
}
function sameOrigin(req){
 const o=req.headers.origin;if(!o)return true;
 try{const u=new URL(o),h=req.headers.host;return u.host===h}catch{return false}
}
const loginRate=new Map();
function rateOK(req){
 const key=req.socket.remoteAddress||"unknown",x=loginRate.get(key)||{n:0,start:Date.now()};
 if(Date.now()-x.start>60000){x.n=0;x.start=Date.now()}x.n++;loginRate.set(key,x);return x.n<=12
}
function upsertLegacyUsers(snapshot,sess){
 const actor=sess.activeRole;
 if(!["superadmin","admin","business","teacher"].includes(actor)&&!sess.roles.includes("superadmin"))return 0;
 const raw=Object.values(snapshot||{}).find((v,k)=>false);
 let users=null;
 // Snapshot format is a map of localStorage keys -> raw strings.
 for(const [key,val] of Object.entries(snapshot||{})){
  if(!/users/i.test(key)||typeof val!=="string")continue;
  const parsed=parseJSON(val,null);
  if(parsed&&Array.isArray(parsed.users)){users=parsed.users;break}
 }
 if(!users)return 0;
 let n=0;
 const get=db.prepare("SELECT * FROM users WHERE username=?");
 const insert=db.prepare(`INSERT INTO users(id,username,name,roles_json,primary_role,status,password_hash,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)`);
 const update=db.prepare(`UPDATE users SET name=?,roles_json=?,primary_role=?,status=?,password_hash=COALESCE(password_hash,?),updated_at=? WHERE username=?`);
 for(const u of users){
  const username=String(u.email||u.username||"").trim().toLowerCase();if(!username)continue;
  const roles=roleSet(u.roles?.length?u.roles:[u.role||"learner"]),primary=roles.includes(u.primaryRole)?u.primaryRole:(roles.includes(u.role)?u.role:roles[0]);
  const legacy=/^[a-f0-9]{64}$/i.test(String(u.passwordHash||""))?`sha256$${u.passwordHash}`:null,row=get.get(username);
  const permittedNew=sess.roles.includes("superadmin")||actor==="superadmin"||(actor==="admin"&&!roles.includes("superadmin"))||(actor==="business"&&roles.every(r=>["learner","teacher","business"].includes(r)))||(actor==="teacher"&&roles.every(r=>r==="learner"));
  if(!row&&permittedNew){insert.run(u.id||uuid(),username,u.name||username,jsonText(roles),primary,u.status||"active",legacy,u.createdAt||now(),now());n++}
  else if(row&&(sess.roles.includes("superadmin")||actor==="superadmin")&&username!==SUPER_USER){update.run(u.name||username,jsonText(roles),primary,u.status||"active",legacy,now(),username);n++}
 }
 return n
}
function pruneSnapshots(userId){
 const rows=db.prepare("SELECT id FROM client_snapshots WHERE user_id=? ORDER BY created_at DESC LIMIT -1 OFFSET 50").all(userId);
 const del=db.prepare("DELETE FROM client_snapshots WHERE id=?");for(const r of rows)del.run(r.id)
}

const mimeTypes={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".svg":"image/svg+xml",".webp":"image/webp",".ico":"image/x-icon",".wav":"audio/wav",".mp3":"audio/mpeg",".mp4":"video/mp4",".webm":"video/webm"};
function serveStatic(req,res,url){
 let p=decodeURIComponent(url.pathname);if(p==="/")p="/index.html";
 const full=path.resolve(APP_ROOT,"."+p);
 if(!full.startsWith(APP_ROOT+path.sep)||full.startsWith(DATA_DIR))return json(res,403,{error:"Forbidden"});
 if(!fs.existsSync(full)||!fs.statSync(full).isFile())return json(res,404,{error:"Not found"});
 securityHeaders(res,true);res.setHeader("Cache-Control",/\.(js|css)$/.test(full)?"no-cache":"no-store");
 res.writeHead(200,{"Content-Type":mimeTypes[path.extname(full).toLowerCase()]||"application/octet-stream"});
 fs.createReadStream(full).pipe(res)
}

async function handleApi(req,res,url){
 if(!sameOrigin(req))return json(res,403,{error:"Origin not allowed"});
 if(req.method==="GET"&&url.pathname==="/api/health"){
  const version=db.prepare("SELECT MAX(version) AS v FROM schema_migrations").get().v;
  return json(res,200,{ok:true,available:true,required:true,backend:"tina-v14-production-closure",database:"sqlite",schemaVersion:version,time:now()})
 }
 if(req.method==="POST"&&url.pathname==="/api/auth/login"){
  if(!rateOK(req))return json(res,429,{error:"Too many login attempts"});
  const b=await readBody(req),username=String(b.username||"").trim().toLowerCase(),row=db.prepare("SELECT * FROM users WHERE username=?").get(username);
  if(!row||row.status!=="active"||!row.password_hash||!await verifyPassword(String(b.password||""),row.password_hash))return json(res,401,{error:"Invalid credentials"});
  const roles=roleSet(parseJSON(row.roles_json,[])),active=String(b.role||row.primary_role||roles[0]);
  if(!roles.includes(active)&&!roles.includes("superadmin"))return json(res,403,{error:"Role not assigned"});
  if(row.password_hash.startsWith("sha256$"))db.prepare("UPDATE users SET password_hash=?,updated_at=? WHERE id=?").run(await scrypt(String(b.password||"")),now(),row.id);
  db.prepare("UPDATE users SET last_login_at=?,updated_at=? WHERE id=?").run(now(),now(),row.id);
  setSession(res,row,active,!!b.remember);audit({userId:row.id,activeRole:active},"auth.login",row.id,{remember:!!b.remember});
  return json(res,200,{user:userPublic({...row,last_login_at:now()}),activeRole:active})
 }
 if(req.method==="POST"&&url.pathname==="/api/auth/logout"){const s=sessionFor(req);if(s)audit(s,"auth.logout",s.userId);clearSession(req,res);return json(res,200,{ok:true})}
 if(req.method==="GET"&&url.pathname==="/api/me"){const s=requireSession(req,res);if(!s)return;return json(res,200,{user:{id:s.userId,email:s.username,username:s.username,name:s.name,roles:s.roles,primaryRole:s.primaryRole,activeRole:s.activeRole,role:s.activeRole}})}
 if(req.method==="POST"&&url.pathname==="/api/auth/switch-role"){const s=requireSession(req,res);if(!s)return;const b=await readBody(req),r=String(b.role||"");if(!s.roles.includes(r)&&!s.roles.includes("superadmin"))return json(res,403,{error:"Role not assigned"});db.prepare("UPDATE sessions SET active_role=?,last_seen_at=? WHERE token_hash=?").run(r,now(),s.tokenHash);audit(s,"auth.role.switch",r);return json(res,200,{ok:true,activeRole:r})}


/*
 * v14 FINAL — Disposable QA persistence boundary
 *
 * Disposable System QA uses the reserved "__tina_test__" namespace.
 * QA fixtures may exist temporarily in browser memory/localStorage while a
 * disposable test is running, but they must never become production snapshot
 * state.  This sanitizer is intentionally ID/identity based: normal user
 * content containing words such as "Temporary" is not removed.
 */
const DISPOSABLE_QA_PREFIX="__tina_test__";

function isDisposableQaIdentity(value){
  return typeof value==="string" &&
    value.startsWith(DISPOSABLE_QA_PREFIX);
}

function stripDisposableQaFixtures(value){
  if(Array.isArray(value)){
    return value
      .filter(item=>{
        if(!item||typeof item!=="object")return true;

        return ![
          item.id,
          item.userId,
          item.user_id,
          item.username,
          item.email,
          item.organizationId,
          item.organization_id,
          item.classId,
          item.class_id,
          item.assignmentId,
          item.assignment_id
        ].some(isDisposableQaIdentity);
      })
      .map(stripDisposableQaFixtures);
  }

  if(value&&typeof value==="object"){
    if([
      value.id,
      value.userId,
      value.user_id,
      value.username,
      value.email,
      value.organizationId,
      value.organization_id,
      value.classId,
      value.class_id,
      value.assignmentId,
      value.assignment_id
    ].some(isDisposableQaIdentity)){
      return undefined;
    }

    const out={};

    for(const [key,item] of Object.entries(value)){
      const clean=stripDisposableQaFixtures(item);

      if(clean!==undefined){
        out[key]=clean;
      }
    }

    return out;
  }

  return value;
}

if(req.method==="POST"&&url.pathname==="/api/sync/snapshot"){
  const s=requireSession(req,res);if(!s)return;const b=await readBody(req),snapshot=b.snapshot;if(!snapshot||typeof snapshot!=="object")return json(res,400,{error:"Invalid snapshot"});const cleanSnapshot=stripDisposableQaFixtures(snapshot);
  const imported=upsertLegacyUsers(cleanSnapshot,s),id=uuid();db.prepare("INSERT INTO client_snapshots(id,user_id,created_at,schema_label,payload_enc,reason) VALUES(?,?,?,?,?,?)").run(id,s.userId,now(),String(b.schema||"v14"),encryptJSON(cleanSnapshot),String(b.reason||"sync"));pruneSnapshots(s.userId);audit(s,"snapshot.sync",id,{keys:Object.keys(snapshot).length,legacyUsersImported:imported});return json(res,200,{ok:true,snapshotId:id,legacyUsersImported:imported})
 }
 if(req.method==="GET"&&url.pathname==="/api/sync/latest"){const s=requireSession(req,res);if(!s)return;const row=db.prepare("SELECT * FROM client_snapshots WHERE user_id=? ORDER BY created_at DESC LIMIT 1").get(s.userId);return json(res,200,{ok:true,snapshot:row?stripDisposableQaFixtures(decryptJSON(row.payload_enc)):null,createdAt:row?.created_at||null})}

 if(req.method==="POST"&&url.pathname==="/api/telemetry"){
  const s=requireSession(req,res);if(!s)return;const b=await readBody(req),events=Array.isArray(b.events)?b.events:[b];
  const ins=db.prepare("INSERT OR IGNORE INTO telemetry(id,user_id,role,event_type,at,view_name,duration_ms,detail_enc) VALUES(?,?,?,?,?,?,?,?)");
  let count=0;for(const e of events.slice(0,500)){ins.run(String(e.id||uuid()),s.userId,String(e.role||s.activeRole),String(e.type||"event"),String(e.at||now()),String(e.view||""),Number(e.durationMs||e.activeMs||0),encryptJSON(e.detail||{}));count++}
  return json(res,200,{ok:true,count})
 }
 if(req.method==="GET"&&url.pathname==="/api/telemetry/summary"){
  const s=requireSession(req,res,["superadmin"]);if(!s)return;
  const year=url.searchParams.get("year"),month=url.searchParams.get("month"),role=url.searchParams.get("role"),userId=url.searchParams.get("userId");
  const where=[],args=[];if(year){where.push("strftime('%Y',at)=?");args.push(String(year))}if(month){where.push("strftime('%m',at)=?");args.push(String(month).padStart(2,"0"))}if(role){where.push("role=?");args.push(role)}if(userId){where.push("user_id=?");args.push(userId)}
  const W=where.length?"WHERE "+where.join(" AND "):"",tot=db.prepare(`SELECT COUNT(*) events,COALESCE(SUM(duration_ms),0) durationMs,COUNT(DISTINCT user_id) users FROM telemetry ${W}`).get(...args);
  const monthly=db.prepare(`SELECT substr(at,1,7) month,COUNT(*) events,COALESCE(SUM(duration_ms),0) durationMs FROM telemetry ${W} GROUP BY substr(at,1,7) ORDER BY month`).all(...args);
  return json(res,200,{ok:true,total:tot,monthly})
 }

 if(req.method==="POST"&&url.pathname==="/api/media"){
  const s=requireSession(req,res);if(!s)return;const b=await readBody(req,Math.ceil(MAX_MEDIA*1.45)+1_000_000),raw=String(b.dataBase64||"");if(!raw)return json(res,400,{error:"Missing media data"});
  const buf=Buffer.from(raw,"base64");if(buf.length>MAX_MEDIA)return json(res,413,{error:"Media too large"});
  const id=uuid(),file=path.join(MEDIA_DIR,id+".enc");fs.writeFileSync(file,encryptBuffer(buf),{mode:0o600});
  db.prepare("INSERT INTO media(id,owner_user_id,name,mime,size_bytes,path,created_at) VALUES(?,?,?,?,?,?,?)").run(id,s.userId,String(b.name||"media"),String(b.mime||"application/octet-stream"),buf.length,file,now());audit(s,"media.upload",id,{name:b.name,size:buf.length});return json(res,200,{ok:true,id,url:`/api/media/${id}`,name:b.name,mime:b.mime,size:buf.length})
 }
 const mediaMatch=url.pathname.match(/^\/api\/media\/([0-9a-f-]+)$/);
 if(req.method==="GET"&&mediaMatch){const s=requireSession(req,res);if(!s)return;const m=db.prepare("SELECT * FROM media WHERE id=?").get(mediaMatch[1]);if(!m)return json(res,404,{error:"Media not found"});const buf=decryptBuffer(fs.readFileSync(m.path));securityHeaders(res,false);res.writeHead(200,{"Content-Type":m.mime,"Content-Length":buf.length,"Cache-Control":"private, max-age=3600"});return res.end(buf)}

 if(req.method==="GET"&&url.pathname==="/api/admin/users"){const s=requireSession(req,res,["admin","superadmin"]);if(!s)return;const rows=db.prepare("SELECT * FROM users ORDER BY created_at").all().map(userPublic);return json(res,200,{ok:true,users:rows})}
 if(req.method==="POST"&&url.pathname==="/api/admin/users"){
  const s=requireSession(req,res,["admin","superadmin"]);if(!s)return;const b=await readBody(req),roles=roleSet(b.roles?.length?b.roles:[b.role||"learner"]);if(s.activeRole!=="superadmin"&&roles.includes("superadmin"))return json(res,403,{error:"Administrator cannot create Superadmin"});
  const username=String(b.username||b.email||"").trim().toLowerCase();if(!username||String(b.password||"").length<8)return json(res,400,{error:"Username and 8+ character password required"});if(db.prepare("SELECT id FROM users WHERE username=?").get(username))return json(res,409,{error:"User already exists"});
  const id=uuid(),t=now(),ph=await scrypt(String(b.password)),primary=roles.includes(b.primaryRole)?b.primaryRole:roles[0];db.prepare("INSERT INTO users(id,username,name,roles_json,primary_role,status,password_hash,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)").run(id,username,String(b.name||username),jsonText(roles),primary,"active",ph,t,t);audit(s,"user.create",id,{roles});return json(res,200,{ok:true,user:userPublic(db.prepare("SELECT * FROM users WHERE id=?").get(id))})
 }
 const userPatch=url.pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
 if(req.method==="PATCH"&&userPatch){
  const s=requireSession(req,res,["admin","superadmin"]);if(!s)return;const target=db.prepare("SELECT * FROM users WHERE id=?").get(userPatch[1]);if(!target)return json(res,404,{error:"User not found"});const currentRoles=roleSet(parseJSON(target.roles_json,[]));if(s.activeRole!=="superadmin"&&currentRoles.includes("superadmin"))return json(res,403,{error:"Administrator cannot modify Superadmin"});
  const b=await readBody(req),roles=roleSet(b.roles||currentRoles);if(s.activeRole!=="superadmin"&&roles.includes("superadmin"))return json(res,403,{error:"Administrator cannot assign Superadmin"});
  const primary=roles.includes(b.primaryRole)?b.primaryRole:(roles.includes(target.primary_role)?target.primary_role:roles[0]);let ph=target.password_hash;if(b.password){if(String(b.password).length<8)return json(res,400,{error:"Password too short"});ph=await scrypt(String(b.password))}
  db.prepare("UPDATE users SET name=?,roles_json=?,primary_role=?,status=?,password_hash=?,updated_at=? WHERE id=?").run(String(b.name||target.name),jsonText(roles),primary,String(b.status||target.status),ph,now(),target.id);audit(s,"user.update",target.id,{roles,status:b.status||target.status});return json(res,200,{ok:true,user:userPublic(db.prepare("SELECT * FROM users WHERE id=?").get(target.id))})
 }
 if(req.method==="DELETE"&&userPatch){const s=requireSession(req,res,["superadmin"]);if(!s)return;if(userPatch[1]===s.userId)return json(res,400,{error:"Cannot delete current Superadmin account"});const target=db.prepare("SELECT * FROM users WHERE id=?").get(userPatch[1]);if(!target)return json(res,404,{error:"User not found"});const roles=roleSet(parseJSON(target.roles_json,[]));if(roles.includes("superadmin")){const n=db.prepare("SELECT COUNT(*) n FROM users WHERE status='active' AND roles_json LIKE '%superadmin%'").get().n;if(n<=1)return json(res,400,{error:"Cannot delete last active Superadmin"})}db.prepare("DELETE FROM users WHERE id=?").run(target.id);audit(s,"user.delete",target.id,{roles});return json(res,200,{ok:true})}

 if(req.method==="GET"&&url.pathname==="/api/backup"){
  const s=requireSession(req,res,["superadmin"]);if(!s)return;const tables={};
  for(const t of ["users","client_snapshots","telemetry","media","audit","app_settings","schema_migrations"]){tables[t]=db.prepare(`SELECT * FROM ${t}`).all().map(r=>{const o={...r};for(const k of Object.keys(o))if(Buffer.isBuffer(o[k]))o[k]={__b64:o[k].toString("base64")};if(t==="media"&&o.path&&fs.existsSync(o.path))o.file_enc_b64=fs.readFileSync(o.path).toString("base64");return o})}
  audit(s,"backup.export","database");return json(res,200,{schema:"tina-v14-production-backup",exportedAt:now(),tables})
 }
 if(req.method==="POST"&&url.pathname==="/api/backup/restore"){
  const s=requireSession(req,res,["superadmin"]);if(!s)return;const b=await readBody(req,MAX_JSON),pkg=b.backup;if(!pkg||pkg.schema!=="tina-v14-production-backup")return json(res,400,{error:"Invalid backup"});
  const allowed=["users","client_snapshots","telemetry","media","audit","app_settings"];db.exec("BEGIN");
  try{
   for(const t of allowed){if(!Array.isArray(pkg.tables?.[t]))continue;db.exec(`DELETE FROM ${t}`);for(const raw of pkg.tables[t]){const row={...raw},fileEnc=t==="media"?row.file_enc_b64:null;delete row.file_enc_b64;const keys=Object.keys(row),vals=keys.map(k=>row[k]&&row[k].__b64?Buffer.from(row[k].__b64,"base64"):row[k]);db.prepare(`INSERT INTO ${t}(${keys.join(",")}) VALUES(${keys.map(()=>"?").join(",")})`).run(...vals);if(t==="media"&&fileEnc&&row.path){fs.mkdirSync(path.dirname(row.path),{recursive:true});fs.writeFileSync(row.path,Buffer.from(fileEnc,"base64"),{mode:0o600})}}}
   db.exec("COMMIT");audit(s,"backup.restore","database");return json(res,200,{ok:true,restoredAt:now()})
  }catch(e){db.exec("ROLLBACK");throw e}
 }

 return json(res,404,{error:"Not found"})
}

const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,`http://${req.headers.host||`${HOST}:${PORT}`}`);
 try{if(url.pathname.startsWith("/api/"))return await handleApi(req,res,url);return serveStatic(req,res,url)}
 catch(e){console.error(e);return json(res,e.status||500,{error:e.status?e.message:"Internal server error"})}
});
server.listen(PORT,HOST,()=>console.log(`Tina v14 FINAL running at http://${HOST}:${PORT}`));
process.on("SIGINT",()=>{db.close();process.exit(0)});
process.on("SIGTERM",()=>{db.close();process.exit(0)});
