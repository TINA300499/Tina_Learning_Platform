(() => {
"use strict";
const KEY="tina.clean.v12.staging";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return{}}};
let S=Object.assign({drafts:[],media:[],validation:[],publication:[],canonical:null,canonicalStatus:"not-loaded"},load());
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const now=()=>new Date().toISOString();
const kinds=["course","unit","lesson","set","activity","item"];
function nav(){let n=$("#nav");if(!n||$('[data-view="content-v12"]'))return;let b=document.createElement("button");b.className="navbtn";b.dataset.view="content-v12";b.textContent="Content Studio";n.appendChild(b);b.onclick=open}
async function open(){$$(".navbtn").forEach(x=>x.classList.remove("active"));$('[data-view="content-v12"]')?.classList.add("active");await readCanonical();$("#app").innerHTML=hub();bindHub()}
async function readCanonical(){try{let r=await fetch("data/canonical-projection.json?ts="+Date.now(),{cache:"no-store"});if(!r.ok)throw 0;let d=await r.json();let connected=["levels","courses","units","lessons","sets","activities","items"].some(k=>Array.isArray(d[k])&&d[k].length);S.canonical=d;S.canonicalStatus=connected?"connected":"empty-projection"}catch{S.canonical=null;S.canonicalStatus="unavailable"}save()}
function counts(){let c=S.canonical||{};return ["levels","courses","units","lessons","sets","activities","items"].map(k=>[k,(c[k]||[]).length])}
function head(t,d){return `<div class="wrap v12wrap"><div class="sectionHead"><div><div class="eyebrow">Canonical · Authoring · Media v12</div><h2>${t}</h2><p class="muted">${d}</p></div><button class="ghost" id="v12Back">← Content Hub</button></div>`}
const MOD=[
["canonical","Canonical Explorer","Read-only projection browser and relationship inspection."],
["author","Authoring Studio","Create staged Course → Unit → Lesson → Set → Activity → Item drafts."],
["media","Media Library","Local image/audio/video preview plus metadata staging."],
["validate","Validation Center","Schema, relationship and publication-readiness checks."],
["publish","Publication Queue","Fail-closed staging workflow; no direct canonical writes."],
["transfer","Import / Export","Portable staging package for later controlled integration."]
];
function hub(){return `<div class="wrap v12wrap"><section class="card v12hero"><div><div class="eyebrow">Version 12 Closure</div><h1>Canonical · Authoring · Media</h1><p>Canonical remains read-only authority; authoring is an explicit staging layer.</p></div><div><span class="status ${S.canonicalStatus==="connected"?"ok":"warn"}">${esc(S.canonicalStatus)}</span></div></section><section class="countStrip">${counts().map(x=>`<span><b>${x[1]}</b>${x[0]}</span>`).join("")}</section><section class="grid">${MOD.map(x=>`<article class="card"><h3>${x[1]}</h3><p>${x[2]}</p><button class="primary v12open" data-open="${x[0]}">Open</button></article>`).join("")}</section></div>`}
function canonical(){let c=S.canonical||{},connected=S.canonicalStatus==="connected";return head("Canonical Explorer","Generated projection is a read-only cache, never the canonical authority.")+(connected?`<div class="toolbar"><input id="canonSearch" placeholder="Search canonical entities…"><select id="canonKind">${["all","levels","courses","units","lessons","sets","activities","items"].map(x=>`<option>${x}</option>`).join("")}</select></div><div id="canonRows" class="list">${canonRows(c,"all","")}</div>`:`<article class="card"><h3>Canonical adapter not connected</h3><p>Run the existing safe sync adapter against your Tina project. No fake canonical lessons are generated here.</p><pre>./sync-canonical.sh "/Users/nguyennhi/Desktop/Tina_Learning_Platform"</pre></article>`)+"</div>"}
function ident(x){return x.id||x.levelId||x.courseId||x.unitId||x.lessonId||x.setId||x.activityId||"(no-id)"}
function title(x){return x.title||x.name||x.label||x.id||"(untitled)"}
function canonRows(c,k,q){let ks=k==="all"?["levels","courses","units","lessons","sets","activities","items"]:[k],rows=[];ks.forEach(kind=>(c[kind]||[]).forEach(x=>{if(!q||JSON.stringify(x).toLowerCase().includes(q.toLowerCase()))rows.push(`<div class="row"><div><div class="eyebrow">${kind.slice(0,-1)}</div><b>${esc(title(x))}</b><br><small>${esc(ident(x))}</small></div><button class="ghost inspectCanon" data-kind="${kind}" data-id="${esc(ident(x))}">Inspect</button></div>`)}));return rows.join("")||'<div class="empty">No matching entities.</div>'}
function author(){return head("Authoring Studio","Drafts are staging records. They do not mutate canonical data.")+`<article class="card"><div class="formgrid"><select id="aKind">${kinds.map(x=>`<option value="${x}">${x}</option>`).join("")}</select><input id="aTitle" placeholder="Title"><input id="aParent" placeholder="Parent ID (optional for course)"><input id="aSkill" placeholder="Skill / domain"><textarea id="aDesc" rows="4" placeholder="Description / objective / instructions"></textarea>
<div class="uploadField"><label>Image</label><input id="aImage" type="file" accept="image/*"><small>PNG, JPG, WEBP, GIF</small></div>
<div class="uploadField"><label>Audio</label><input id="aAudio" type="file" accept="audio/*"><small>MP3, WAV, M4A, OGG</small></div>
<div class="uploadField"><label>Video</label><input id="aVideo" type="file" accept="video/*"><small>Optional lesson/activity video</small></div>
<div id="aUploadPreview" class="uploadPreview"></div>
<button class="primary" id="aCreate">Create staged draft</button></div></article><div class="list" style="margin-top:14px">${S.drafts.slice().reverse().map(d=>`<div class="row"><div><div class="eyebrow">${esc(d.kind)} · ${esc(d.status)}</div><b>${esc(d.title)}</b><br><small>${esc(d.id)}${d.parentId?" · parent "+esc(d.parentId):""}${d.attachments?.length?" · "+d.attachments.length+" media":""}</small></div><div class="rowactions"><button class="ghost editDraft" data-id="${d.id}">Edit</button><button class="ghost queueDraft" data-id="${d.id}">Queue</button><button class="iconbtn delDraft" data-id="${d.id}">×</button></div></div>`).join("")||'<div class="empty">No staged drafts.</div>'}</div></div>`}
function media(){return head("Media Library","Preview local media in-browser; retain metadata only in local staging.")+`<article class="card"><div class="formgrid"><select id="mType"><option>image</option><option>audio</option><option>video</option><option>external</option></select><input id="mTitle" placeholder="Title"><input id="mUrl" placeholder="External URL (optional)"><input id="mFile" type="file" accept="image/*,audio/*,video/*"><textarea id="mNotes" rows="3" placeholder="Transcript, alt text, caption, usage notes…"></textarea><button class="primary" id="mAdd">Add media staging record</button></div><div id="mPreview"></div></article><div class="list" style="margin-top:14px">${S.media.slice().reverse().map(m=>`<div class="row"><div><div class="eyebrow">${esc(m.type)}</div><b>${esc(m.title)}</b><br><small>${esc(m.fileName||m.url||"metadata only")}</small><p>${esc(m.notes||"")}</p></div><button class="iconbtn delMedia" data-id="${m.id}">×</button></div>`).join("")||'<div class="empty">No staged media.</div>'}</div></div>`}
function validate(){let r=runValidation();return head("Validation Center","Fail closed before anything enters the publication queue.")+`<section class="grid">${r.checks.map(x=>`<article class="card"><h3>${esc(x.name)}</h3><div class="metric">${x.pass?"PASS":"FAIL"}</div><p>${esc(x.detail)}</p></article>`).join("")}</section><article class="card" style="margin-top:14px"><h3>Overall</h3><div class="feedback ${r.pass?"ok":"bad"}">${r.pass?"STAGING VALID":"VALIDATION FAILED"}</div><button class="primary" id="rerunValidation">Run validation</button></article></div>`}
function runValidation(){let ids=S.drafts.map(x=>x.id),dups=ids.filter((x,i)=>ids.indexOf(x)!==i),missing=S.drafts.filter(d=>!d.title||!d.kind),parentMissing=S.drafts.filter(d=>d.kind!=="course"&&d.parentId&&!S.drafts.some(x=>x.id===d.parentId)&&!canonicalHas(d.parentId));let checks=[{name:"Draft schema",pass:missing.length===0,detail:missing.length?missing.length+" incomplete drafts":"Required draft fields present"},{name:"Unique draft IDs",pass:dups.length===0,detail:dups.length?dups.length+" duplicate IDs":"No duplicate draft IDs"},{name:"Parent references",pass:parentMissing.length===0,detail:parentMissing.length?parentMissing.length+" unresolved parents":"Known parent references resolve"},{name:"Canonical write boundary",pass:true,detail:"v12 frontend exposes no direct canonical write operation"},{name:"Media metadata",pass:S.media.every(m=>m.title&&m.type),detail:"Media records require title and type"}];let r={pass:checks.every(x=>x.pass),checks,at:now()};S.validation.push(r);save();return r}
function canonicalHas(id){let c=S.canonical||{};return ["levels","courses","units","lessons","sets","activities","items"].some(k=>(c[k]||[]).some(x=>ident(x)===id))}
function publish(){let queued=S.drafts.filter(d=>d.status==="queued");return head("Publication Queue","Review staging only. Publication to canonical is deliberately unavailable until controlled write governance exists.")+`<div class="list">${queued.map(d=>`<div class="row"><div><div class="eyebrow">${esc(d.kind)}</div><b>${esc(d.title)}</b><br><small>${esc(d.id)}</small></div><div class="rowactions"><button class="ghost approveDraft" data-id="${d.id}">Mark reviewed</button><button class="ghost returnDraft" data-id="${d.id}">Return</button></div></div>`).join("")||'<div class="empty">Publication queue is empty.</div>'}</div><article class="card" style="margin-top:14px"><b>Canonical publication: LOCKED</b><p>v12 is fail-closed. Reviewed drafts can be exported, but this browser runtime cannot write to canonical source files.</p></article></div>`}
function transfer(){return head("Import / Export","Move staging data without confusing it with canonical data.")+`<article class="card"><div class="actions"><button class="primary" id="exportV12">Export staging package</button><button class="ghost" id="importV12Btn">Import staging package</button></div><input hidden id="importV12File" type="file" accept="application/json"><p>Package contains drafts, media metadata, validation history and publication staging state only.</p></article></div>`}
function show(v){$("#app").innerHTML=({canonical,author,media,validate,publish,transfer}[v]||hub)();bind(v)}
function bindHub(){$$(".v12open").forEach(b=>b.onclick=()=>show(b.dataset.open))}
function bind(v){$("#v12Back")?.addEventListener("click",open);if(v==="canonical")bindCanonical();if(v==="author")bindAuthor();if(v==="media")bindMedia();if(v==="validate")$("#rerunValidation")?.addEventListener("click",()=>show("validate"));if(v==="publish")bindPublish();if(v==="transfer")bindTransfer()}
function bindCanonical(){let refresh=()=>{$("#canonRows").innerHTML=canonRows(S.canonical||{},$("#canonKind").value,$("#canonSearch").value);bindInspect()};$("#canonSearch").oninput=refresh;$("#canonKind").onchange=refresh;bindInspect()}
function bindInspect(){$$(".inspectCanon").forEach(b=>b.onclick=()=>{let x=(S.canonical?.[b.dataset.kind]||[]).find(y=>ident(y)===b.dataset.id);if(x)alert(JSON.stringify(x,null,2))})}

function fileMeta(file,role){
 if(!file)return null;
 return {id:"att-"+Date.now()+"-"+Math.random(),role,name:file.name,type:file.type||"",size:file.size||0,lastModified:file.lastModified||0};
}
function bindAuthorUploadPreview(){
 const box=$("#aUploadPreview");
 const inputs=[["#aImage","image"],["#aAudio","audio"],["#aVideo","video"]];
 const render=()=>{
   if(!box)return;
   box.innerHTML=inputs.map(([sel,role])=>{
     const f=$(sel)?.files?.[0];
     return f?`<div class="uploadChip"><b>${role}</b><span>${esc(f.name)}</span><small>${Math.round(f.size/1024)} KB</small></div>`:"";
   }).join("");
 };
 inputs.forEach(([sel])=>$(sel)?.addEventListener("change",render));
}

function bindAuthor(){
 bindAuthorUploadPreview();
 $("#aCreate").onclick=()=>{let kind=$("#aKind").value,title=$("#aTitle").value.trim();if(!title)return alert("Title is required.");let attachments=[fileMeta($("#aImage")?.files?.[0],"image"),fileMeta($("#aAudio")?.files?.[0],"audio"),fileMeta($("#aVideo")?.files?.[0],"video")].filter(Boolean);let d={id:"draft-"+kind+"-"+Date.now(),kind,title,parentId:$("#aParent").value.trim(),skill:$("#aSkill").value.trim(),description:$("#aDesc").value.trim(),attachments,status:"draft",createdAt:now(),updatedAt:now()};S.drafts.push(d);save();show("author")};
 $$(".editDraft").forEach(b=>b.onclick=()=>{let d=S.drafts.find(x=>x.id===b.dataset.id),t=prompt("Title",d.title);if(t===null)return;d.title=t.trim()||d.title;let desc=prompt("Description",d.description||"");if(desc!==null)d.description=desc;d.updatedAt=now();save();show("author")});
 $$(".queueDraft").forEach(b=>b.onclick=()=>{let d=S.drafts.find(x=>x.id===b.dataset.id);d.status="queued";d.updatedAt=now();save();show("author")});
 $$(".delDraft").forEach(b=>b.onclick=()=>{S.drafts=S.drafts.filter(x=>x.id!==b.dataset.id);save();show("author")})
}
let previewUrl=null;
function bindMedia(){
 $("#mFile").onchange=e=>{let f=e.target.files[0];if(!f)return;if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(f);let h=f.type.startsWith("image/")?`<img class="mediaPreview" src="${previewUrl}" alt="Preview">`:f.type.startsWith("audio/")?`<audio controls src="${previewUrl}"></audio>`:f.type.startsWith("video/")?`<video controls class="mediaPreview" src="${previewUrl}"></video>`:"";$("#mPreview").innerHTML=h};
 $("#mAdd").onclick=async()=>{let title=$("#mTitle").value.trim();if(!title)return alert("Media title is required.");let f=$("#mFile").files[0],durable=null;if(f&&window.TinaBackend?.available){try{durable=await window.TinaBackend.uploadMedia(f)}catch(e){return alert("Durable media upload failed: "+e.message)}}S.media.push({id:"media-"+Date.now(),type:$("#mType").value,title,url:durable?.url||$("#mUrl").value.trim(),backendMediaId:durable?.id||"",durable:!!durable,fileName:f?.name||"",mime:f?.type||"",size:f?.size||0,notes:$("#mNotes").value,createdAt:now()});save();window.TinaBackend?.scheduleSync?.("media-add");show("media")};
 $$(".delMedia").forEach(b=>b.onclick=()=>{S.media=S.media.filter(x=>x.id!==b.dataset.id);save();show("media")})
}
function bindPublish(){$$(".approveDraft").forEach(b=>b.onclick=()=>{let d=S.drafts.find(x=>x.id===b.dataset.id);d.status="reviewed";d.reviewedAt=now();S.publication.push({draftId:d.id,decision:"reviewed",at:now()});save();show("publish")});$$(".returnDraft").forEach(b=>b.onclick=()=>{let d=S.drafts.find(x=>x.id===b.dataset.id);d.status="draft";save();show("publish")})}
function bindTransfer(){
 $("#exportV12").onclick=()=>{let pkg={schemaVersion:"12.0",type:"tina-authoring-staging",exportedAt:now(),drafts:S.drafts,media:S.media,validation:S.validation,publication:S.publication};let blob=new Blob([JSON.stringify(pkg,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="tina-v12-staging.json";a.click()};
 $("#importV12Btn").onclick=()=>$("#importV12File").click();$("#importV12File").onchange=e=>{let f=e.target.files[0],r=new FileReader();r.onload=()=>{try{let p=JSON.parse(r.result);if(p.type!=="tina-authoring-staging"||!Array.isArray(p.drafts))throw 0;S.drafts=p.drafts;S.media=Array.isArray(p.media)?p.media:[];S.validation=Array.isArray(p.validation)?p.validation:[];S.publication=Array.isArray(p.publication)?p.publication:[];save();show("transfer")}catch{alert("Invalid Tina v12 staging package.")}};r.readAsText(f)}
}
save();
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(nav,360));else setTimeout(nav,360);
})();