(() => {
"use strict";
const state={available:false,required:false,url:"same-origin",checked:false,database:null,schemaVersion:null};
async function request(path,opts={}){
 const headers=Object.assign({},opts.headers||{});
 if(opts.body!==undefined&&!headers["Content-Type"])headers["Content-Type"]="application/json";
 const r=await fetch(path,Object.assign({credentials:"include",headers},opts));
 let body={};const type=r.headers.get("content-type")||"";
 if(type.includes("application/json")){try{body=await r.json()}catch{}}
 else body=await r.text();
 if(!r.ok)throw new Error(body?.error||`Backend request failed (${r.status})`);
 return body;
}
async function probe(){
 const staticDevPorts=new Set(["5500","5501","5502","3000","5173","5174"]);
 const staticHint=(location.hostname==="127.0.0.1"||location.hostname==="localhost")&&staticDevPorts.has(location.port);
 if(staticHint){state.available=false;state.checked=true;state.mode="local-static";return false}
 try{const x=await request("/api/health",{method:"GET"});state.available=!!x.ok;state.checked=true;Object.assign(state,x);return true}
 catch{state.available=false;state.checked=true;return false}
}
function fileToBase64(file){
 return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||"").split(",")[1]||"");r.onerror=reject;r.readAsDataURL(file)})
}
function localSnapshot(){
 const snapshot={};
 for(let i=0;i<localStorage.length;i++){
  const k=localStorage.key(i);
  if(k&&(k.startsWith("tina.")||k==="tlp4.progress"))snapshot[k]=localStorage.getItem(k);
 }
 return snapshot
}
let syncTimer=null;
async function syncNow(reason="manual"){
 if(!state.available)return {ok:false,offline:true};
 return request("/api/sync/snapshot",{method:"POST",body:JSON.stringify({schema:"v14-final",reason,snapshot:localSnapshot()})})
}
function scheduleSync(reason="change"){
 clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncNow(reason).catch(()=>{}),1200)
}
window.TinaBackend={
 status:state,
 get available(){return state.available},
 get required(){return state.required},
 async probe(){return probe()},
 async login(username,password,role,remember=false){return request("/api/auth/login",{method:"POST",body:JSON.stringify({username,password,role,remember})})},
 async logout(){return request("/api/auth/logout",{method:"POST",body:"{}"})},
 async me(){return request("/api/me",{method:"GET"})},
 async switchRole(role){return request("/api/auth/switch-role",{method:"POST",body:JSON.stringify({role})})},
 async syncNow(reason){return syncNow(reason)},
 scheduleSync,
 async latestSnapshot(){return request("/api/sync/latest",{method:"GET"})},
 async telemetry(events){if(!state.available)return {ok:false,offline:true};return request("/api/telemetry",{method:"POST",body:JSON.stringify({events:Array.isArray(events)?events:[events]})})},
 async telemetrySummary(filters={}){if(!state.available)return {ok:false,offline:true,events:[]};const q=new URLSearchParams(Object.entries(filters).filter(([,v])=>v!==""&&v!=null));return request(`/api/telemetry/summary?${q}`,{method:"GET"})},
 async uploadMedia(file){if(!file)throw new Error("File is required");const dataBase64=await fileToBase64(file);return request("/api/media",{method:"POST",body:JSON.stringify({name:file.name,mime:file.type||"application/octet-stream",dataBase64})})},
 async createUser(data){return request("/api/admin/users",{method:"POST",body:JSON.stringify(data)})},
 async updateUser(id,data){return request(`/api/admin/users/${encodeURIComponent(id)}`,{method:"PATCH",body:JSON.stringify(data)})},
 async users(){return request("/api/admin/users",{method:"GET"})},
 async deleteUser(id){return request(`/api/admin/users/${encodeURIComponent(id)}`,{method:"DELETE"})},
 async exportBackup(){return request("/api/backup",{method:"GET"})},
 async restoreBackup(backup){return request("/api/backup/restore",{method:"POST",body:JSON.stringify({backup})})},
 localSnapshot
};
window.addEventListener("beforeunload",()=>{if(state.available)navigator.sendBeacon?.("/api/telemetry",new Blob([JSON.stringify({events:[{type:"browser.unload",at:new Date().toISOString()}]})],{type:"application/json"}))});
probe().then(ok=>{const b=document.createElement("div");b.className="backendProductionBadge "+(ok?"ok":"bad");b.textContent=ok?"Backend + SQLite":"Local fallback";document.body.appendChild(b);if(ok){setTimeout(()=>syncNow("startup").catch(()=>{}),2500)}});
})()
