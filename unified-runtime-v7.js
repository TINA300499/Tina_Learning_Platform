(() => {
"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
let D={generated:false,levels:[],courses:[],units:[],lessons:[],sets:[],activities:[],items:[]};
let R={course:null,unit:null,lesson:null,set:null,activity:null,query:"",skill:"all"};
async function load(){
 try{let r=await fetch("data/canonical-projection.json",{cache:"no-store"});if(r.ok)D=await r.json()}catch{}
}
const arr=k=>Array.isArray(D[k])?D[k]:[];
const id=x=>String(x?.id??"");
const title=x=>x?.title??x?.name??x?.label??x?.id??"Untitled";
const connected=()=>!!D.generated&&arr("courses").length>0;
const children=(k,f,v)=>arr(k).filter(x=>String(x?.[f]??"")===String(v??""));
function nav(){
 const n=$("#nav");if(!n||$('[data-view="study-runtime"]'))return;
 const b=document.createElement("button");b.className="navbtn";b.dataset.view="study-runtime";b.textContent="Study Runtime";n.appendChild(b);b.onclick=open;
}
function open(){
 $$(".navbtn").forEach(x=>x.classList.remove("active"));$('[data-view="study-runtime"]')?.classList.add("active");
 $("#app").innerHTML=connected()?render():offline();bind();
}
function offline(){return `<div class="wrap"><article class="card runtimeHero"><div class="eyebrow">Unified Runtime v7</div><h1>Canonical projection required</h1><p>v7 is ready to consume the read-only projection. It will not fabricate canonical courses or lessons.</p><pre>./sync-canonical.sh "/Users/nguyennhi/Desktop/Tina_Learning_Platform"</pre><button class="primary" id="v7Retry">Retry connection</button></article></div>`}
function levelsForCourse(c){return arr("levels").find(l=>id(l)===String(c.levelId))}
function render(){
 let courses=arr("courses");
 if(!R.course||!courses.some(x=>id(x)===R.course))R.course=id(courses[0]);
 let c=courses.find(x=>id(x)===R.course), units=children("units","courseId",R.course);
 if(!R.unit||!units.some(x=>id(x)===R.unit))R.unit=units[0]?id(units[0]):null;
 let u=units.find(x=>id(x)===R.unit), lessons=u?children("lessons","unitId",R.unit):[];
 if(!R.lesson||!lessons.some(x=>id(x)===R.lesson))R.lesson=lessons[0]?id(lessons[0]):null;
 let l=lessons.find(x=>id(x)===R.lesson);
 return `<div class="wrap runtimeWrap">
 <section class="runtimeHero card"><div><div class="eyebrow">Unified Canonical Study Runtime v7</div><h1>${esc(title(c))}</h1><p>${esc(c.description||"Canonical course")}</p></div><span class="badge">READ-ONLY CANON</span></section>
 <div class="runtimeGrid">
 <aside class="card runtimeTree">
  <input id="runtimeSearch" placeholder="Search curriculum…" value="${esc(R.query)}">
  <select id="runtimeCourse">${courses.map(x=>`<option value="${esc(id(x))}" ${id(x)===R.course?"selected":""}>${esc(title(x))}</option>`).join("")}</select>
  <div id="runtimeTreeBody">${tree(c,units,u,lessons)}</div>
 </aside>
 <main class="runtimeMain">${l?lessonView(l):`<div class="empty">No canonical lesson under this unit.</div>`}</main>
 </div></div>`;
}
function tree(c,units,u,lessons){
 let q=R.query.toLowerCase();
 return units.map(x=>{let ls=children("lessons","unitId",id(x));let show=!q||title(x).toLowerCase().includes(q)||ls.some(y=>title(y).toLowerCase().includes(q));if(!show)return"";return `<div class="rtUnit"><button class="rtUnitBtn ${id(x)===R.unit?"active":""}" data-rtunit="${esc(id(x))}">${esc(title(x))}<small>${ls.length}</small></button>${id(x)===R.unit?`<div>${ls.filter(y=>!q||title(y).toLowerCase().includes(q)||title(x).toLowerCase().includes(q)).map(y=>`<button class="rtLessonBtn ${id(y)===R.lesson?"active":""}" data-rtlesson="${esc(id(y))}"><span>${esc(title(y))}</span><small>${esc(y.skill||"")}</small></button>`).join("")}</div>`:""}</div>`}).join("");
}
function lessonRelations(l){
 let sets=children("sets","lessonId",id(l));
 let acts=arr("activities").filter(a=>String(a.lessonId||"")===id(l)||sets.some(s=>id(s)===String(a.practiceSetId||a.setId||"")));
 let items=arr("items").filter(i=>String(i.lessonId||"")===id(l)||acts.some(a=>id(a)===String(i.activityId||""))||sets.some(s=>id(s)===String(i.practiceSetId||i.setId||"")));
 return {sets,acts,items};
}
function lessonView(l){
 let {sets,acts,items}=lessonRelations(l);
 return `<article class="card runtimeLessonHead"><div class="eyebrow">${esc(l.skill||"Lesson")}</div><h2>${esc(title(l))}</h2><p>${esc(l.description||l.objective||"")}</p>
 <div class="relationStats"><span><b>${sets.length}</b> sets</span><span><b>${acts.length}</b> activities</span><span><b>${items.length}</b> items</span></div></article>
 <div class="runtimeTabs"><button class="runtimeTab active" data-rttab="overview">Overview</button><button class="runtimeTab" data-rttab="practice">Practice</button><button class="runtimeTab" data-rttab="items">Items</button><button class="runtimeTab" data-rttab="tools">Study Tools</button></div>
 <section id="runtimePanel">${overview(l,sets,acts)}</section>`;
}
function overview(l,sets,acts){
 return `<section class="grid">${[
 ["Learn","Open the lesson in active learning mode.","learn"],
 ["Practice",`${sets.length} canonical practice sets and ${acts.length} activities.`,"practice"],
 ["Review","Capture mistakes and revisit weak evidence.","review"],
 ["Research","Add notes, observations and synthesis.","research"]
 ].map(x=>`<article class="card"><h3>${x[0]}</h3><p>${x[1]}</p><button class="ghost rtGo" data-target="${x[2]}">Open</button></article>`).join("")}</section>`;
}
function practicePanel(l){
 let {sets,acts}=lessonRelations(l);
 return `<div class="list">${sets.length?sets.map(s=>{let aa=acts.filter(a=>String(a.practiceSetId||a.setId||"")===id(s));return `<div class="runtimeSet"><div class="row"><div><b>${esc(title(s))}</b><br><small>${esc(s.skill||s.description||"Practice set")}</small></div><span class="badge">${aa.length} activities</span></div>${aa.map(a=>`<button class="activityRow" data-activity="${esc(id(a))}"><span>${esc(title(a))}</span><small>${esc(a.activityType||a.type||"activity")}</small></button>`).join("")}</div>`}).join(""):`<div class="empty">No canonical practice sets for this lesson.</div>`}</div>`;
}
function itemsPanel(l){
 let {items}=lessonRelations(l);
 return `<div class="list">${items.length?items.slice(0,300).map(i=>`<div class="row"><div><b>${esc(title(i))}</b><br><small>${esc(i.type||i.itemType||"item")} · ${esc(i.prompt||i.front||i.question||"")}</small></div></div>`).join(""):`<div class="empty">No canonical items mapped to this lesson yet.</div>`}</div>`;
}
function toolsPanel(){
 let modes=[["learn","Lesson Player"],["listen","Watch / Listen"],["dictation","Dictation"],["shadowing","Shadowing"],["flashcards","Flashcards + SRS"],["speaking","Speaking Recorder"],["writing","Writing Studio"],["quiz","Quiz Engine"],["games","Games Hub"],["research","Research"],["review","Mistake Review"]];
 return `<section class="grid">${modes.map(([m,t])=>`<article class="card"><h3>${t}</h3><p>Launch with the current canonical lesson context.</p><button class="primary rtMode" data-mode="${m}">Launch</button></article>`).join("")}</section>`;
}
function bind(){
 $("#v7Retry")?.addEventListener("click",async()=>{await load();open()});
 $("#runtimeCourse")?.addEventListener("change",e=>{R.course=e.target.value;R.unit=R.lesson=null;open()});
 $("#runtimeSearch")?.addEventListener("input",e=>{R.query=e.target.value;let c=arr("courses").find(x=>id(x)===R.course),units=children("units","courseId",R.course),u=units.find(x=>id(x)===R.unit),lessons=u?children("lessons","unitId",R.unit):[];$("#runtimeTreeBody").innerHTML=tree(c,units,u,lessons);bindTree()});
 bindTree();bindTabs();
}
function bindTree(){
 $$("[data-rtunit]").forEach(b=>b.onclick=()=>{R.unit=b.dataset.rtunit;R.lesson=null;open()});
 $$("[data-rtlesson]").forEach(b=>b.onclick=()=>{R.lesson=b.dataset.rtlesson;open()});
}
function bindTabs(){
 $$("[data-rttab]").forEach(b=>b.onclick=()=>{$$(".runtimeTab").forEach(x=>x.classList.remove("active"));b.classList.add("active");let l=arr("lessons").find(x=>id(x)===R.lesson);$("#runtimePanel").innerHTML=b.dataset.rttab==="overview"?overview(l,...Object.values(lessonRelations(l)).slice(0,2)):b.dataset.rttab==="practice"?practicePanel(l):b.dataset.rttab==="items"?itemsPanel(l):toolsPanel();bindPanel()});
 bindPanel();
}
function bindPanel(){
 $$(".rtGo").forEach(b=>b.onclick=()=>launch(b.dataset.target));
 $$(".rtMode").forEach(b=>b.onclick=()=>launch(b.dataset.mode));
 $$(".activityRow").forEach(b=>b.onclick=()=>{R.activity=b.dataset.activity;let a=arr("activities").find(x=>id(x)===R.activity);let type=a?.activityType||a?.type||"learn";let map={learn:"learn",practice:"quiz",review:"review",dictation:"dictation",shadowing:"shadowing",speaking:"speaking",writing:"writing",game:"games",games:"games",quiz:"quiz",flashcard:"flashcards"};launch(map[type]||"quiz")});
}
function launch(mode){
 let learn=$('[data-view="learn"]');if(!learn)return;
 learn.click();
 setTimeout(()=>{let b=document.querySelector(`[data-mode="${mode}"]`);if(b)b.click();let h=$("#v4Engine");if(h){let ctx=document.createElement("div");ctx.className="canonicalContext";let l=arr("lessons").find(x=>id(x)===R.lesson);ctx.innerHTML=`<span class="badge">Canonical context</span><b>${esc(title(l))}</b>`;h.prepend(ctx)}},70);
}
function addHome(){
 document.addEventListener("click",e=>{if(e.target.closest('[data-view="home"]'))setTimeout(()=>{let g=$("#app .grid");if(g&&!$("#runtimeHome")){let a=document.createElement("article");a.id="runtimeHome";a.className="card";a.innerHTML=`<h3>Unified Study Runtime</h3><p>${connected()?"Study directly from the canonical Course → Unit → Lesson graph.":"Ready when canonical projection is connected."}</p><button class="primary" id="runtimeHomeOpen">Open Runtime</button>`;g.appendChild(a);$("#runtimeHomeOpen").onclick=open}},50)});
}
load().finally(()=>{if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{setTimeout(nav,160);addHome()});else{setTimeout(nav,160);addHome()}});
window.TinaUnifiedRuntimeV7=Object.freeze({open,load});
})();