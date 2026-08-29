(() => {
"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
let P=null;
async function loadProjection(){
 try{
  const r=await fetch("data/canonical-projection.json",{cache:"no-store"});
  if(!r.ok)throw new Error("HTTP "+r.status);
  P=await r.json();
 }catch(e){P={generated:false,source:"unavailable",levels:[],courses:[],units:[],lessons:[],sets:[],activities:[],items:[]}}
}
const count=k=>Array.isArray(P?.[k])?P[k].length:0;
function status(){
 const connected=!!P?.generated && count("courses")>0;
 return `<div class="wrap v6status"><article class="card ${connected?"connected":"notconnected"}">
 <div class="eyebrow">Canonical Adapter v6</div>
 <div class="v6statusrow"><div><h2>${connected?"Canonical projection connected":"Canonical adapter not connected"}</h2>
 <p>${connected?`Read-only projection loaded from ${esc(P.source||"source")}.`:"Run sync-canonical.sh against the existing Tina project. No lesson/course data is fabricated."}</p></div>
 <span class="badge">${connected?"READ ONLY":"OFFLINE"}</span></div>
 <div class="v6counts">${["levels","courses","units","lessons","sets","activities","items"].map(k=>`<div><b>${count(k)}</b><span>${k}</span></div>`).join("")}</div>
 </article></div>`;
}
function addNav(){
 const nav=$("#nav");if(!nav||$('[data-view="canonical"]'))return;
 const b=document.createElement("button");b.className="navbtn";b.dataset.view="canonical";b.textContent="Canonical Data";nav.appendChild(b);b.onclick=open;
}
function open(){
 $$(".navbtn").forEach(x=>x.classList.remove("active"));$('[data-view="canonical"]')?.classList.add("active");
 $("#app").innerHTML=render();bind();
}
function render(){
 const connected=!!P?.generated&&count("courses")>0;
 return status()+`<div class="wrap"><div class="sectionHead"><div><div class="eyebrow">Read-only graph</div><h2>Canonical Data Explorer</h2></div></div>
 ${!connected?`<article class="card"><h3>Connect existing Tina data</h3><p>From the Clean v6 folder run:</p><pre>./sync-canonical.sh "/Users/your-name/Desktop/Tina_Learning_Platform"</pre><p class="muted">The extractor scans declarations statically. It does not execute or modify the legacy application.</p></article>`:explorer()}</div>`;
}
function id(x){return x?.id??x?.levelId??x?.courseId??""}
function title(x){return x?.title??x?.name??x?.label??id(x)}
function explorer(){
 const courses=P.courses||[];
 return `<div class="toolbar"><input id="v6Search" placeholder="Search canonical courses / lessons / items…"><button class="ghost" id="v6Validate">Validate graph</button></div>
 <div id="v6Results"><section class="grid">${courses.map(c=>`<article class="card"><div class="eyebrow">${esc(c.levelId||"course")}</div><h3>${esc(title(c))}</h3><p>${esc(c.description||"Canonical course")}</p><button class="primary v6course" data-course="${esc(id(c))}">Explore</button></article>`).join("")}</section></div>`;
}
function coursePanel(cid){
 const c=P.courses.find(x=>String(id(x))===String(cid)); if(!c)return;
 const units=P.units.filter(x=>String(x.courseId)===String(cid));
 $("#v6Results").innerHTML=`<div class="breadcrumbs"><button class="ghost" id="v6Back">← Courses</button><span>${esc(title(c))}</span></div><section class="grid">${units.map(u=>`<article class="card"><h3>${esc(title(u))}</h3><p>${P.lessons.filter(l=>String(l.unitId)===String(id(u))).length} lessons</p><button class="ghost v6unit" data-unit="${esc(id(u))}">Open unit</button></article>`).join("")||'<div class="empty">No units mapped to this course.</div>'}</section>`;
 $("#v6Back").onclick=()=>open(); $$(".v6unit").forEach(b=>b.onclick=()=>unitPanel(b.dataset.unit));
}
function unitPanel(uid){
 const u=P.units.find(x=>String(id(x))===String(uid));const ls=P.lessons.filter(x=>String(x.unitId)===String(uid));
 $("#v6Results").innerHTML=`<div class="breadcrumbs"><button class="ghost" id="v6BackCourse">← Back</button><span>${esc(title(u))}</span></div><div class="list">${ls.map(l=>`<div class="row"><div><b>${esc(title(l))}</b><br><small>${esc(l.skill||l.description||"lesson")}</small></div><button class="primary v6lesson" data-lesson="${esc(id(l))}">Inspect</button></div>`).join("")||'<div class="empty">No lessons mapped.</div>'}</div>`;
 $("#v6BackCourse").onclick=()=>coursePanel(u.courseId);$$(".v6lesson").forEach(b=>b.onclick=()=>lessonPanel(b.dataset.lesson));
}
function lessonPanel(lid){
 const l=P.lessons.find(x=>String(id(x))===String(lid));
 const sets=P.sets.filter(x=>String(x.lessonId)===String(lid));
 const acts=P.activities.filter(x=>String(x.lessonId)===String(lid)||sets.some(s=>String(id(s))===String(x.practiceSetId||x.setId)));
 const items=P.items.filter(x=>String(x.lessonId)===String(lid)||acts.some(a=>String(id(a))===String(x.activityId)));
 $("#v6Results").innerHTML=`<article class="card"><div class="eyebrow">${esc(l.skill||"Canonical Lesson")}</div><h2>${esc(title(l))}</h2><p>${esc(l.description||"")}</p><div class="v6counts"><div><b>${sets.length}</b><span>sets</span></div><div><b>${acts.length}</b><span>activities</span></div><div><b>${items.length}</b><span>items</span></div></div></article>
 <div class="sectionHead"><h2>Practice Sets & Activities</h2></div><div class="list">${sets.map(s=>`<div class="row"><div><b>${esc(title(s))}</b><br><small>${esc(s.skill||"practice set")}</small></div><span class="badge">${acts.filter(a=>String(a.practiceSetId||a.setId)===String(id(s))).length} activities</span></div>`).join("")||'<div class="empty">No practice sets mapped.</div>'}</div>`;
}
function validate(){
 const ids={};let dup=0;["levels","courses","units","lessons","sets","activities","items"].forEach(k=>(P[k]||[]).forEach(x=>{let q=id(x);if(!q)return;if(ids[q])dup++;ids[q]=k}));
 let orphanUnits=(P.units||[]).filter(x=>x.courseId&&!P.courses.some(c=>String(id(c))===String(x.courseId))).length;
 let orphanLessons=(P.lessons||[]).filter(x=>x.unitId&&!P.units.some(u=>String(id(u))===String(x.unitId))).length;
 alert(`Graph validation\nDuplicate IDs: ${dup}\nOrphan units: ${orphanUnits}\nOrphan lessons: ${orphanLessons}`);
}
function bind(){
 $$(".v6course").forEach(b=>b.onclick=()=>coursePanel(b.dataset.course));
 $("#v6Validate")?.addEventListener("click",validate);
 $("#v6Search")?.addEventListener("input",e=>{
  const q=e.target.value.trim().toLowerCase();if(!q){$("#v6Results").innerHTML=explorer().replace(/^.*?<div id="v6Results">|<\/div>$/g,"");return}
  let rows=[];
  for(const k of ["courses","units","lessons","items"])for(const x of P[k]||[])if(JSON.stringify(x).toLowerCase().includes(q))rows.push([k,x]);
  $("#v6Results").innerHTML=`<div class="list">${rows.slice(0,100).map(([k,x])=>`<div class="row"><div><b>${esc(title(x))}</b><br><small>${k} · ${esc(id(x))}</small></div></div>`).join("")||'<div class="empty">No matches.</div>'}</div>`;
 });
}
function homeStatus(){
 document.addEventListener("click",e=>{if(e.target.closest('[data-view="home"]'))setTimeout(()=>{let wrap=$("#app .wrap");if(wrap&&!$("#v6HomeStatus")){let d=document.createElement("div");d.id="v6HomeStatus";d.innerHTML=status();wrap.appendChild(d)}},50)});
}
loadProjection().finally(()=>{if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{setTimeout(addNav,120);homeStatus()});else{setTimeout(addNav,120);homeStatus()}});
window.TinaCanonicalV6=Object.freeze({open,loadProjection,status});
})();