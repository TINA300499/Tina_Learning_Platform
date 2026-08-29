(() => {
"use strict";
const KEY="tina.clean.v5.core";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return{}}};
const seed={
 schemaVersion:"5.0.0",
 selectedCourse:"cpe-230",
 selectedUnit:"cpe-uoe",
 selectedLesson:"cpe-uoe-p1",
 evidence:[],
 courses:[
  {id:"cpe-230",levelId:"cpe230",title:"CPE 230/230 Mastery",description:"Precision-first C2 mastery workspace.",status:"active",
   units:[
    {id:"cpe-uoe",title:"Reading & Use of English",order:1,lessons:[
      {id:"cpe-uoe-p1",title:"Part 1 — Multiple-choice Cloze",skill:"Use of English",objective:"Build lexical precision, collocation control and semantic discrimination.",items:[
       {id:"p1-1",type:"concept",title:"Lexical discrimination",content:"Choose by meaning, collocation, register and grammar together — not by translation alone."},
       {id:"p1-2",type:"example",title:"Worked example",prompt:"The committee decided to ___ the proposal pending further evidence.",options:["defer","scatter","improvise","dissolve"],answer:0,explanation:"Defer naturally means postpone a decision or action until later."},
       {id:"p1-3",type:"retrieval",title:"Retrieval",prompt:"Name four dimensions you should check when discriminating CPE Part 1 options."}
      ]},
      {id:"cpe-uoe-p2",title:"Part 2 — Open Cloze",skill:"Use of English",objective:"Master grammatical words, fixed phrases and discourse relations.",items:[]},
      {id:"cpe-uoe-p3",title:"Part 3 — Word Formation",skill:"Morphology",objective:"Derive exact forms through morphology, spelling and contextual constraints.",items:[]},
      {id:"cpe-uoe-p4",title:"Part 4 — Key Word Transformations",skill:"Grammar & Lexis",objective:"Reconstruct meaning under strict lexical and grammatical constraints.",items:[]}
    ]},
    {id:"cpe-reading",title:"Reading",order:2,lessons:[
      {id:"cpe-reading-discourse",title:"Discourse & Text Architecture",skill:"Reading",objective:"Track stance, cohesion, implication and rhetorical structure.",items:[]}
    ]},
    {id:"cpe-writing",title:"Writing",order:3,lessons:[
      {id:"cpe-writing-essay",title:"Essay Mastery",skill:"Writing",objective:"Produce precise, coherent, sophisticated evaluative writing.",items:[]},
      {id:"cpe-writing-other",title:"Reports, Reviews & Articles",skill:"Writing",objective:"Control genre, register, organization and communicative effect.",items:[]}
    ]},
    {id:"cpe-listening",title:"Listening",order:4,lessons:[
      {id:"cpe-listening-precision",title:"Precision Listening",skill:"Listening",objective:"Decode connected speech, implication and detail reliably.",items:[]}
    ]},
    {id:"cpe-speaking",title:"Speaking",order:5,lessons:[
      {id:"cpe-speaking-fluency",title:"Fluency, Precision & Interaction",skill:"Speaking",objective:"Develop automatic, precise and flexible C2 production.",items:[]}
    ]},
    {id:"cpe-language-engineering",title:"Language Engineering",order:6,lessons:[
      {id:"morphology",title:"Morphology & Word Families",skill:"Language Engineering",objective:"Model derivation, inflection, allomorphy and spelling constraints.",items:[]},
      {id:"collocation",title:"Collocation & Phraseology",skill:"Language Engineering",objective:"Build phraseological control and lexical association networks.",items:[]},
      {id:"corpus",title:"Corpus Analysis",skill:"Language Engineering",objective:"Use corpus evidence to validate usage, frequency and patterning.",items:[]}
    ]}
   ]},
  {id:"linguistics-core",levelId:"academy",title:"English Linguistics Core",description:"Language science pathway supporting advanced language engineering.",status:"planned",units:[
    {id:"ling-foundations",title:"Foundations",order:1,lessons:[
      {id:"phonetics",title:"Phonetics & Phonology",skill:"Linguistics",objective:"Speech sounds, phonological systems and prosody.",items:[]},
      {id:"morph",title:"Morphology",skill:"Linguistics",objective:"Word structure and morphological processes.",items:[]},
      {id:"syntax",title:"Syntax",skill:"Linguistics",objective:"Constituent structure, relations and grammatical architecture.",items:[]},
      {id:"semantics",title:"Semantics & Pragmatics",skill:"Linguistics",objective:"Meaning, inference and language use.",items:[]}
    ]}
  ]}
 ]
};
let C=Object.assign({},seed,read());
if(!Array.isArray(C.courses)||!C.courses.length) C=seed;
function save(){localStorage.setItem(KEY,JSON.stringify(C))}
function course(){return C.courses.find(x=>x.id===C.selectedCourse)||C.courses[0]}
function unit(){let c=course();return c.units.find(x=>x.id===C.selectedUnit)||c.units[0]}
function lesson(){let u=unit();return u.lessons.find(x=>x.id===C.selectedLesson)||u.lessons[0]}
function ensureSelection(){let c=course();C.selectedCourse=c.id;let u=c.units.find(x=>x.id===C.selectedUnit)||c.units[0];C.selectedUnit=u.id;let l=u.lessons.find(x=>x.id===C.selectedLesson)||u.lessons[0];C.selectedLesson=l.id;save()}
function addEvidence(type,payload={}){C.evidence.push({id:"ev-"+Date.now()+"-"+Math.random().toString(36).slice(2,7),type,courseId:course().id,unitId:unit().id,lessonId:lesson().id,at:new Date().toISOString(),...payload});save()}
function progressForLesson(id){let a=C.evidence.filter(x=>x.lessonId===id);return Math.min(100,a.length*20)}
function renderWorkspace(){
 ensureSelection();
 const c=course(),u=unit(),l=lesson(),pct=progressForLesson(l.id);
 return `<div class="wrap v5wrap">
 <div class="sectionHead"><div><div class="eyebrow">Canonical Learning Core v5</div><h2>${esc(c.title)}</h2><p class="muted">${esc(c.description)}</p></div><div class="actions"><button class="ghost" id="v5Export">Export Core</button><button class="primary" id="v5Study">Study Lesson</button></div></div>
 <div class="v5layout">
  <aside class="card v5tree">
   <div class="eyebrow">Curriculum</div>
   <select id="v5Course">${C.courses.map(x=>`<option value="${x.id}" ${x.id===c.id?"selected":""}>${esc(x.title)}</option>`).join("")}</select>
   ${c.units.map(x=>`<div class="treeunit"><button class="treebtn ${x.id===u.id?"active":""}" data-v5unit="${x.id}">${esc(x.title)}</button>${x.id===u.id?`<div class="treelessons">${x.lessons.map(y=>`<button class="lessonbtn ${y.id===l.id?"active":""}" data-v5lesson="${y.id}">${esc(y.title)} <small>${progressForLesson(y.id)}%</small></button>`).join("")}</div>`:""}</div>`).join("")}
  </aside>
  <section class="v5main">
   <article class="card">
    <div class="eyebrow">${esc(l.skill)}</div><h1>${esc(l.title)}</h1><p>${esc(l.objective)}</p>
    <div class="progress"><span style="width:${pct}%"></span></div><small class="muted">${pct}% evidence progress</small>
   </article>
   <div class="v5tabs"><button class="v5tab active" data-v5tab="learn">Learn</button><button class="v5tab" data-v5tab="practice">Practice</button><button class="v5tab" data-v5tab="evidence">Evidence</button><button class="v5tab" data-v5tab="author">Add Content</button></div>
   <div id="v5panel">${panelLearn(l)}</div>
  </section>
 </div></div>`;
}
function panelLearn(l){
 if(!l.items.length)return `<div class="empty">This lesson structure is ready. Add canonical learning items or use Add Content.</div>`;
 return l.items.map((x,i)=>`<article class="card v5item"><div class="eyebrow">${esc(x.type)}</div><h3>${esc(x.title)}</h3>${x.content?`<p>${esc(x.content)}</p>`:""}${x.prompt?`<p><b>${esc(x.prompt)}</b></p>`:""}${x.type==="example"?`<div class="optiongrid">${x.options.map((o,j)=>`<button class="option v5example" data-answer="${x.answer}" data-choice="${j}" data-item="${x.id}">${esc(o)}</button>`).join("")}</div><div id="fb-${x.id}"></div>`:""}${x.type==="retrieval"?`<textarea id="ret-${x.id}" rows="5" placeholder="Reconstruct the answer from memory…"></textarea><button class="primary v5retrieval" data-item="${x.id}">Save retrieval</button>`:""}</article>`).join("");
}
function panelPractice(l){
 return `<article class="card"><div class="eyebrow">Practice Set</div><h3>${esc(l.title)} — deliberate practice</h3><p>Use the functional v4 modes while evidence is attached to this exact Course → Unit → Lesson node.</p><div class="modechips">${["dictation","shadowing","flashcards","speaking","writing","quiz","games"].map(x=>`<button class="ghost v5mode" data-mode="${x}">${x}</button>`).join("")}</div></article>`;
}
function panelEvidence(l){
 let a=C.evidence.filter(x=>x.lessonId===l.id).slice().reverse();
 return `<div class="list">${a.length?a.map(x=>`<div class="row"><div><b>${esc(x.type)}</b><br><small>${esc(x.answer||x.result||"Learning evidence")}</small></div><small>${new Date(x.at).toLocaleString()}</small></div>`).join(""):`<div class="empty">No evidence for this lesson yet.</div>`}</div>`;
}
function panelAuthor(l){
 return `<article class="card"><div class="eyebrow">Local canonical draft</div><h3>Add learning item</h3><div class="formgrid"><select id="v5ItemType"><option value="concept">Concept</option><option value="example">Example</option><option value="retrieval">Retrieval</option></select><input id="v5ItemTitle" placeholder="Item title"><textarea id="v5ItemContent" rows="6" placeholder="Content or prompt"></textarea><button class="primary" id="v5AddItem">Add to lesson</button></div><p class="muted">Stored in the v5 local core. External Tina canonical write integration remains a separate controlled adapter.</p></article>`;
}
function mountRoute(){
 const nav=document.querySelector("#nav");if(!nav||document.querySelector('[data-view="core"]'))return;
 let b=document.createElement("button");b.className="navbtn";b.dataset.view="core";b.textContent="Learning Core";nav.appendChild(b);
 b.onclick=()=>openCore();
}
function openCore(){
 document.querySelectorAll(".navbtn").forEach(x=>x.classList.remove("active"));
 document.querySelector('[data-view="core"]')?.classList.add("active");
 document.querySelector("#app").innerHTML=renderWorkspace();bind();
}
function bind(){
 $("#v5Course")?.addEventListener("change",e=>{C.selectedCourse=e.target.value;C.selectedUnit="";C.selectedLesson="";save();openCore()});
 $$("[data-v5unit]").forEach(x=>x.onclick=()=>{C.selectedUnit=x.dataset.v5unit;C.selectedLesson="";save();openCore()});
 $$("[data-v5lesson]").forEach(x=>x.onclick=()=>{C.selectedLesson=x.dataset.v5lesson;save();openCore()});
 $$("[data-v5tab]").forEach(x=>x.onclick=()=>{$$(".v5tab").forEach(y=>y.classList.remove("active"));x.classList.add("active");let l=lesson(),p=x.dataset.v5tab;$("#v5panel").innerHTML=p==="learn"?panelLearn(l):p==="practice"?panelPractice(l):p==="evidence"?panelEvidence(l):panelAuthor(l);bindPanel()});
 $("#v5Study")?.addEventListener("click",()=>{$('[data-v5tab="learn"]').click()});
 $("#v5Export")?.addEventListener("click",()=>{let blob=new Blob([JSON.stringify(C,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="tina-canonical-learning-core-v5.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});
 bindPanel();
}
function bindPanel(){
 $$(".v5example").forEach(b=>b.onclick=()=>{let ok=+b.dataset.choice===+b.dataset.answer;b.closest(".optiongrid").querySelectorAll(".option").forEach(x=>x.disabled=true);b.classList.add(ok?"correct":"wrong");let item=lesson().items.find(x=>x.id===b.dataset.item);$("#fb-"+b.dataset.item).innerHTML=`<div class="feedback ${ok?"ok":"bad"}">${ok?"Correct.":esc(item.explanation||"Review the distinction.")}</div>`;addEvidence("worked-example",{itemId:b.dataset.item,answer:b.textContent,correct:ok})});
 $$(".v5retrieval").forEach(b=>b.onclick=()=>{let val=$("#ret-"+b.dataset.item).value.trim();if(!val)return;addEvidence("retrieval",{itemId:b.dataset.item,answer:val});b.textContent="Saved";b.disabled=true});
 $$(".v5mode").forEach(b=>b.onclick=()=>{let learn=document.querySelector('[data-view="learn"]');if(learn){learn.click();setTimeout(()=>{let m=document.querySelector(`[data-mode="${b.dataset.mode}"]`);m?.click()},50)}});
 $("#v5AddItem")?.addEventListener("click",()=>{let type=$("#v5ItemType").value,title=$("#v5ItemTitle").value.trim(),content=$("#v5ItemContent").value.trim();if(!title)return;let item={id:"item-"+Date.now(),type,title};if(type==="retrieval")item.prompt=content;else item.content=content;lesson().items.push(item);save();openCore();setTimeout(()=>document.querySelector('[data-v5tab="author"]')?.click(),20)});
}
function installHomeShortcut(){
 document.addEventListener("click",e=>{if(e.target.closest('[data-view="home"]'))setTimeout(()=>{let grid=document.querySelector("#app .grid");if(grid&&!document.querySelector("#v5HomeCard")){let a=document.createElement("article");a.className="card";a.id="v5HomeCard";a.innerHTML='<h3>Canonical Learning Core</h3><p>Course → Unit → Lesson → Item → Practice → Evidence.</p><button class="primary" id="v5HomeOpen">Open Core</button>';grid.appendChild(a);$("#v5HomeOpen").onclick=openCore}},30)});
}
ensureSelection();
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{setTimeout(mountRoute,80);installHomeShortcut()});else{setTimeout(mountRoute,80);installHomeShortcut()}
window.TinaLearningCoreV5=Object.freeze({open:()=>{const b=document.querySelector('[data-view="core"]');if(b)b.click();},read:()=>C});
})();