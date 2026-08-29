(() => {
"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const STORE="tina.clean.v3";
const LEVELS=[["starters","Pre-A1 Starters"],["movers","A1 Movers"],["flyers","A2 Flyers"],["preliminary","B1 Preliminary"],["first","B2 First"],["advanced","C1 Advanced"],["proficiency","C2 Proficiency"],["cpe230","CPE 230/230 Mastery"]];
const MODES=[["learn","Learn"],["listen","Watch / Listen"],["dictation","Dictation"],["shadowing","Shadowing"],["flashcards","Flashcards + SRS"],["speaking","Speaking"],["writing","Writing"],["quiz","Quiz / Test"],["games","Games"],["research","Notes / Research"],["review","Mistake Review"]];
const DOMAINS=["Language & Communication","Cognitive & Behavioral Sciences","Mathematics & Statistics","Computer Science & Engineering","Artificial Intelligence","Natural Sciences","Economics, Business & Finance","Education & Learning","Research & Scientific Practice","Society & Humanities","Law, Civics & Governance","Systems & Organization","Career & Personal Capability"].map((title,i)=>({id:`domain-${i+1}`,title}));
const old=()=>{try{return JSON.parse(localStorage.getItem(STORE)||"{}")}catch{return{}}}; const O=old();
const state={
 view:O.view||"home",level:O.level||"cpe230",mode:O.mode||"learn",query:"",
 plans:O.plans||[],notes:O.notes||[],mistakes:O.mistakes||[],bookmarks:O.bookmarks||[],
 lessons:O.lessons||[],practice:O.practice||[],media:O.media||[],session:O.session||null,
 academy:[],source:"fallback",selectedDomain:O.selectedDomain||null,
 progress:Object.assign({answered:0,correct:0,sessions:[]},(()=>{try{return JSON.parse(localStorage.getItem("tlp4.progress")||"{}")}catch{return{}}})(),O.progress||{})
};
const routes=[
 ["home","Home"],["catalog","Catalog"],["learn","Active Learning"],["plans","Study Plans"],
 ["research","Research"],["review","Review"],["progress","Progress"],["academy","Academy"],
 ["author","Authoring Hub"],["data","Data Manager"],["settings","Settings"]
];
function save(){localStorage.setItem(STORE,JSON.stringify({...state,academy:undefined,source:undefined,query:""}))}
function go(v){state.view=routes.some(x=>x[0]===v)?v:"home";if(state.view!=="learn"){state.practiceOpen=false;state.mediaPracticeOpen=false;}save();render()}

const ICONS={
  home:"🏠",catalog:"📚",learn:"🎯",plans:"🗓️",research:"🔎",review:"🔁",progress:"📈",
  academy:"🎓",author:"✍️",data:"🗂️",settings:"⚙️",
  learnMode:"💡",watch:"🎧",dictation:"⌨️",shadowing:"🗣️",flashcards:"🃏",speaking:"🎤",
  writing:"✏️",quiz:"✅",games:"🎮",notes:"📝",mistakes:"🧩",
  starters:"⭐",movers:"🚀",flyers:"🛫",
  course:"📘",unit:"🧱",lesson:"📖",activity:"🎯",media:"🎬",assessment:"📝",
  user:"👤",security:"🔐",system:"🛠️",backup:"💾",search:"🔎",publish:"🚀",
  analytics:"📊",content:"🧩",practice:"🎮",admin:"🛡️"
};
function icon(id,fallback="✨"){return ICONS[id]||fallback}
function isKidsLevel(){
  const x=(state.level||"").toLowerCase();
  return x.includes("starter")||x.includes("mover");
}
function levelIcon(){
  const x=(state.level||"").toLowerCase();
  if(x.includes("starter"))return icon("starters");
  if(x.includes("mover"))return icon("movers");
  if(x.includes("flyer"))return icon("flyers");
  return "🎓";
}

function lvl(){return LEVELS.find(x=>x[0]===state.level)?.[1]||state.level}
function mode(){return MODES.find(x=>x[0]===state.mode)?.[1]||state.mode}
async function academyLoad(){
 for(const u of ["integrations/academy/academy-domain-catalog.json"]){
  try{let r=await fetch(u,{cache:"no-store"});if(!r.ok)continue;let j=await r.json(),a=Array.isArray(j)?j:(j.domains||j.items||j.catalog||[]);if(a.length){state.academy=a.map((x,i)=>({id:x.id||x.slug||`domain-${i+1}`,title:x.title||x.name||x.label||`Domain ${i+1}`,description:x.description||""}));state.source=u;return}}catch{}
 } state.academy=DOMAINS;
}
function nav(){const navRoutes=isKidsLevel()?routes.filter(x=>["home","catalog","learn","review","progress","settings"].includes(x[0])):routes;return navRoutes.map(([id,t])=>`<button class="navbtn ${state.view===id?"active":""}" data-view="${id}"><span class="navIcon" aria-hidden="true">${icon(id)}</span><span>${t}</span></button>`).join("")}
const shell=x=>`<div class="wrap">${x}</div>`;
const card=(t,p,b="Open",attr="")=>`<article class="card visualCard"><div class="visualCardBody"><h3>${t}</h3><p>${p}</p></div><button class="ghost visualCardAction" ${attr}>${b}</button></article>`;

function kidsHome(){
 return shell(`<section class="kidsHero"><div><div class="eyebrow">${levelIcon()} ${esc(lvl())}</div><h1>Ready to learn?</h1><p>Choose one activity and start.</p></div></section>
 <section class="kidsQuickGrid">
   <button class="kidsQuickCard" data-go="learn"><span class="kidsBigIcon">🎯</span><b>Practice</b><small>Games, listening and speaking</small></button>
   <button class="kidsQuickCard" data-go="review"><span class="kidsBigIcon">🔁</span><b>Review</b><small>Practice what you learned</small></button>
   <button class="kidsQuickCard" data-go="progress"><span class="kidsBigIcon">🏆</span><b>My Progress</b><small>See stars and progress</small></button>
 </section>`);
}
function home(){
 let p=state.progress,a=+p.answered||0,c=+p.correct||0,acc=a?Math.round(c/a*100):0;
 return shell(`<section class="hero"><div class="heroCard"><div class="eyebrow">Tina Learning Platform</div><h1>Human Intelligence Infrastructure.</h1><p>Choose → Learn actively → Capture → Practice → Review → Measure → Continue.</p><div class="actions"><button class="primary" data-go="learn">${state.session?"Continue learning":"Start learning"}</button><button class="darkbtn adminOnlyAction" data-admin-only="true" data-go="academy">Tina Academy</button></div></div><div class="heroCard stats"><div class="stat"><b>${a}</b><span>Answered</span></div><div class="stat"><b>${c}</b><span>Correct</span></div><div class="stat"><b>${acc}%</b><span>Accuracy</span></div><div class="stat"><b>${p.sessions?.length||0}</b><span>Sessions</span></div></div></section>
 <div class="sectionHead"><div><div class="eyebrow">Command center</div><h2>Continue your work</h2></div></div><section class="grid">${[
 ["Learning Pathway","Cambridge Pre-A1 → C2 and CPE 230/230.","catalog"],["Active Learning","Eleven focused study modes.","learn"],["Study Plans","Programs, goals and next actions.","plans"],["Research","Notes, questions, claims and synthesis.","research"],["Review","Mistakes and weak-point queue.","review"],["Progress","Learning evidence and history.","progress"],["Tina Academy","Thirteen knowledge domains.","academy","admin"],["Authoring Hub","Build curriculum, lessons and practice.","author","admin"],["Data Manager","Import/export and local data control.","data","admin"]
 ].map(x=>card(x[0],x[1],"Open",`${x[3]==="admin"?'data-admin-only="true" class="adminOnlyAction"':""} data-go="${x[2]}"`)).join("")}</section>`);
}
function catalog(){
 const current=lvl();
 const levels=[
  ["Pre-A1 Starters","⭐","A playful first step with simple practice."],
  ["A1 Movers","🚀","Build confidence with guided practice."],
  ["A2 Flyers","🛫","Strengthen all core English skills."],
  ["B1 Preliminary","📘","Develop independent exam-ready skills."],
  ["B2 First","📗","Build stronger range, fluency and control."],
  ["C1 Advanced","📙","Advanced language practice and precision."],
  ["C2 Proficiency","📕","High-level mastery and sophisticated use."],
  ["CPE 230/230 Mastery","🏆","Precision, range, automaticity and exam mastery."]
 ];
 const cards=levels.map(([name,ico,descText])=>{
   const selected=name===current;
   return `<article class="card visualCard levelSelectCard ${selected?"selectedLevelCard":""}">
     <div class="levelCardTop">
       <span class="levelCardIcon" aria-hidden="true">${ico}</span>
       <div>
         <h3>${esc(name)}</h3>
         <p>${esc(descText)}</p>
       </div>
     </div>
     <button class="${selected?"primary":"ghost"}" data-select-level="${esc(name)}">${selected?"Continue Learning":"Start Learning"}</button>
   </article>`;
 }).join("");
 return shell(`<section class="sectionHead catalogHead">
   <div>
     <div class="eyebrow"><span class="sectionIcon">📚</span> Catalog</div>
     <h2>English Learning Pathway</h2>
     <p class="muted">Choose a level and go directly to its practice area.</p>
   </div>
   <div class="catalogContinueWrap">
     <button class="primary catalogContinueBtn" id="continueCurrentLevel">Continue ${esc(current)}</button>
   </div>
 </section>
 <section class="grid levelCatalogGrid">${cards}</section>`);
}
function learn(){
 if(state.practiceOpen&&state.mediaPracticeOpen){
  const media=currentPracticeMedia();
  return shell(`<div class="sectionHead practiceRoomHead"><div><div class="eyebrow">Media Practice · ${esc(lvl())}</div><h2>Choose how to practise this media</h2><p class="muted">The media stays as the source; each activity opens in its own practice interface.</p></div><div class="actions"><button class="ghost" id="backFromMediaPractice">← Practice Room</button></div></div>
   <section class="card mediaPracticeSource">${practiceMediaPreviewHtml()}</section>
   <section class="mediaPracticeModeGrid">
    <button data-media-practice-mode="watch"><span>🎧</span><b>Watch / Listen</b><small>Focused input and comprehension.</small></button>
    <button data-media-practice-mode="dictation"><span>⌨️</span><b>Dictation</b><small>Listen, type and check accuracy.</small></button>
    <button data-media-practice-mode="shadowing"><span>🗣️</span><b>Shadowing</b><small>Imitate rhythm, stress and pronunciation.</small></button>
    <button data-media-practice-mode="speaking"><span>🎤</span><b>Speaking</b><small>Respond and record your spoken output.</small></button>
    <button data-media-practice-mode="quiz"><span>✅</span><b>Quiz / Test</b><small>Check comprehension and retrieval.</small></button>
   </section>`);
 }

 if(!state.practiceOpen){
  return shell(`<div class="sectionHead"><div><div class="eyebrow"><span class="sectionIcon">🎯</span> Active Learning</div><h2><span class="titleLevelIcon">${levelIcon()}</span> ${esc(lvl())}</h2><p class="muted">Choose one practice mode. The activity opens on a separate practice page.</p></div></div>
  <section class="${isKidsLevel()?"kidsModeGrid":"grid learningModeGrid"}">${(isKidsLevel()?MODES.filter(([id])=>["learn","watch","flashcards","speaking","games","review"].includes(id)):MODES).map(([id,t])=>isKidsLevel()?`<button class="kidsModeCard" data-mode="${id}"><span class="kidsModeIcon">${icon(id==="learn"?"learnMode":id)}</span><b>${esc(t)}</b><small>${esc(desc(id))}</small></button>`:card(`<span class="modeTitleIcon">${icon(id==="learn"?"learnMode":id)}</span> ${t}`,desc(id),"Open",`data-mode="${id}"`)).join("")}</section>`);
 }
 return shell(`<div class="sectionHead practiceRoomHead"><div><div class="eyebrow">Practice Room · ${esc(lvl())}</div><h2>${esc(mode())}</h2><p class="muted">${esc(desc(state.mode))}</p></div><div class="actions"><button class="ghost" id="backToLearningModes">← All practice modes</button><button class="ghost" id="bookmarkCurrent">Bookmark</button></div></div>
 <section class="card practiceSourceMedia">
   <div class="practiceMediaHead"><div><div class="eyebrow">Source Media</div><h3>Lesson media</h3><p class="muted">Media is managed by platform administrators. Learners use it only for practice.</p></div></div>
   <div id="practiceMediaPreview" class="practiceMediaPreview">${practiceMediaPreviewHtml()}</div>
   <div class="actions mediaPracticeLaunchRow">
     <button class="primary" id="openMediaPractice" type="button">Practice with this media →</button>
   </div>
 </section>
 <div id="v4Engine" class="v4engine practiceRoomEngine"></div>
 <div class="sectionHead practiceNotesHead"><div><div class="eyebrow">Session Notes</div><h2>${esc(state.session?.title||`${lvl()} — ${mode()}`)}</h2></div><span class="badge">${esc(state.session?.started||"Ready")}</span></div>
 <article class="card sessionCaptureCard"><textarea id="capture" rows="7" placeholder="Examples, observations, questions, mistakes, synthesis...">${esc(state.session?.capture||"")}</textarea><div class="actions"><button class="primary" id="saveCapture">Save notes</button><button class="ghost" id="mistakeFromSession">Add mistake</button><button class="darkbtn" id="completeSession">Complete session</button></div></article>`);
}

let practiceObjectUrls=[];
function currentPracticeMedia(){
  const key=`${state.level}:${state.mode}`;
  return state.practiceMedia?.[key]||{};
}
function normalizeVideoEmbedUrl(raw){
  const url=(raw||"").trim();
  if(!url)return "";
  try{
    const u=new URL(url);
    if(u.hostname.includes("youtube.com")){
      const id=u.searchParams.get("v")||u.pathname.split("/").filter(Boolean).pop();
      return id?`https://www.youtube.com/embed/${encodeURIComponent(id)}`:"";
    }
    if(u.hostname==="youtu.be"){
      const id=u.pathname.split("/").filter(Boolean)[0];
      return id?`https://www.youtube.com/embed/${encodeURIComponent(id)}`:"";
    }
    if(u.hostname.includes("vimeo.com")){
      const id=u.pathname.split("/").filter(Boolean).pop();
      return id?`https://player.vimeo.com/video/${encodeURIComponent(id)}`:"";
    }
    return url;
  }catch{return ""}
}
function videoLinkHtml(raw){
  const url=normalizeVideoEmbedUrl(raw);
  if(!url)return "";
  const isEmbed=/youtube\.com\/embed|player\.vimeo\.com\/video/.test(url);
  if(isEmbed)return `<div class="embeddedPracticeVideo"><iframe src="${esc(url)}" title="Practice video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
  return `<div class="embeddedPracticeVideo"><video controls preload="metadata" src="${esc(url)}"></video></div>`;
}
function practiceMediaPreviewHtml(){
  const m=currentPracticeMedia();
  const rows=[];
  if(m.audio?.name)rows.push(`<div class="mediaFileChip"><b>Audio</b><span>${esc(m.audio.name)}</span><small>${Math.round((m.audio.size||0)/1024)} KB</small></div>`);
  if(m.video?.name)rows.push(`<div class="mediaFileChip"><b>Video</b><span>${esc(m.video.name)}</span><small>${Math.round((m.video.size||0)/1024)} KB</small></div>`);
  if(m.videoUrl)rows.push(`<div class="embeddedPracticeVideoWrap">${videoLinkHtml(m.videoUrl)}<small>${esc(m.videoUrl)}</small></div>`);
  return rows.join("")||'<div class="empty compactEmpty">No media uploaded or linked for this practice mode yet.</div>';
}
function practiceFileMeta(file,kind){
  return file?{kind,name:file.name,type:file.type||"",size:file.size||0,lastModified:file.lastModified||0,updatedAt:new Date().toISOString()}:null;
}
function updatePracticeMedia(kind,file){
  if(!file)return;
  const key=`${state.level}:${state.mode}`;
  state.practiceMedia=state.practiceMedia||{};
  state.practiceMedia[key]=state.practiceMedia[key]||{};
  state.practiceMedia[key][kind]=practiceFileMeta(file,kind);
  save();
  const preview=$("#practiceMediaPreview");
  if(preview)preview.innerHTML=practiceMediaPreviewHtml();
}


function desc(id){return {learn:"Concepts, examples and guided exposure.",listen:"Audio/video input and comprehension.",dictation:"Precision listening and transcription.",shadowing:"Pronunciation, rhythm and automaticity.",flashcards:"Retrieval and spaced repetition.",speaking:"Speaking production and self-review.",writing:"Draft, revise and improve.",quiz:"Knowledge and exam checking.",games:"Fast retrieval and repetition.",research:"Capture sources and synthesis.",review:"Return to weak evidence and errors."}[id]}
function plans(){return shell(`<div class="sectionHead"><div><div class="eyebrow">My Programs</div><h2>Study Plans</h2></div><button class="primary" id="newPlan">+ New Plan</button></div><div class="list">${state.plans.length?state.plans.map((p,i)=>`<div class="row"><div><b>${esc(p.title)}</b><br><small>${esc(p.goal)}</small></div><div class="rowactions"><button class="ghost" data-plan="${i}">Continue</button><button class="iconbtn" data-delplan="${i}">×</button></div></div>`).join(""):`<div class="empty">No plan yet. Create a CPE, linguistics, research or Academy program.</div>`}</div>`)}
function research(){return shell(`<div class="sectionHead"><div><div class="eyebrow">Knowledge Studio</div><h2>Research & Notes</h2></div><button class="primary" id="newNote">+ New Note</button></div><div class="toolbar"><input id="searchNotes" placeholder="Search notes…" value="${esc(state.query)}"></div><div class="list" id="notesList">${notesHtml()}</div>`)}
function notesHtml(){let q=state.query.toLowerCase(),a=state.notes.filter(n=>!q||(n.title+" "+n.text).toLowerCase().includes(q));return a.length?a.slice().reverse().map(n=>`<div class="row"><div><b>${esc(n.title)}</b><br><small>${esc(n.text).slice(0,220)}</small></div><small>${esc(n.date)}</small></div>`).join(""):`<div class="empty">No matching notes.</div>`}
function review(){return shell(`<div class="sectionHead"><div><div class="eyebrow">Review System</div><h2>Mistakes & Weaknesses</h2></div><button class="primary" id="addMistake">+ Add</button></div><div class="list">${state.mistakes.length?state.mistakes.map((m,i)=>`<div class="row"><div><b>${esc(m.title)}</b><br><small>${esc(m.note)}</small></div><button class="ghost" data-resolve="${i}">Resolve</button></div>`).join(""):`<div class="empty">Review queue clear.</div>`}</div>`)}
function progress(){let p=state.progress,a=+p.answered||0,c=+p.correct||0,acc=a?Math.round(c/a*100):0;return shell(`<div class="sectionHead"><div><div class="eyebrow">Analytics</div><h2>Progress & Learning Evidence</h2></div></div><section class="grid">${[["Accuracy",`${acc}% · ${c}/${a||0}`],["Historical sessions",String(p.sessions?.length||0)],["Study plans",String(state.plans.length)],["Research notes",String(state.notes.length)],["Review queue",String(state.mistakes.length)],["Bookmarks",String(state.bookmarks.length)]].map(x=>`<article class="card"><h3>${x[0]}</h3><div class="metric">${x[1]}</div></article>`).join("")}</section><article class="card" style="margin-top:16px"><h3>Accuracy</h3><div class="progress"><span style="width:${acc}%"></span></div></article>`)}
function academy(){let a=state.academy.length?state.academy:DOMAINS;return shell(`<div class="sectionHead"><div><div class="eyebrow">Tina Academy</div><h2>Knowledge Domains</h2></div><span class="muted">Source: ${esc(state.source)}</span></div><section class="grid">${a.map(x=>card(esc(x.title),esc(x.description||"Curriculum, learning, research and practice."),"Select",`data-domain="${esc(x.id)}"`)).join("")}</section>`)}
function author(){return shell(`<div class="sectionHead"><div><div class="eyebrow">Authoring</div><h2>Authoring Hub</h2></div></div><section class="grid">${[
 ["Curriculum Manager","Programs → courses → units → lessons.","lesson"],["Lesson Builder","Create structured lessons and objectives.","lesson"],["Content Manager","Learning items, explanations and examples.","lesson"],["Practice Builder","Practice sets and activities.","practice"],["Media Library","Audio, image and video references.","media"],["Publishing","Draft → review → publish workflow.","publish"]
 ].map(x=>card(x[0],x[1],"Open",`data-author="${x[2]}"`)).join("")}</section><div class="sectionHead"><h2>Local Draft Registry</h2></div><div class="list">${[...state.lessons,...state.practice,...state.media].length?[...state.lessons,...state.practice,...state.media].map(x=>`<div class="row"><div><b>${esc(x.title)}</b><br><small>${esc(x.type)} · ${esc(x.status)}</small></div></div>`).join(""):`<div class="empty">No local drafts. Canonical write adapter remains intentionally separate.</div>`}</div>`)}
function data(){return shell(`<div class="sectionHead"><div><div class="eyebrow">Data Manager</div><h2>Backup, Import & Export</h2></div></div><section class="grid">${card("Export Clean v3 Data","Download study plans, notes, review queue and local drafts.","Export JSON",'id="exportData"')}${card("Import Clean v3 Data","Restore a Clean v3 JSON backup.","Choose JSON",'id="importTrigger"')}${card("Reset UI State","Clear Clean v3 local workspace only. Canonical data is untouched.","Reset",'id="resetData"')}</section><input id="importFile" type="file" accept="application/json" hidden><article class="card" style="margin-top:16px"><h3>Data boundary</h3><p>This frontend never overwrites Tina canonical learning data. Canonical adapters will be connected explicitly.</p></article>`)}
function settings(){return shell(`<div class="sectionHead"><div><div class="eyebrow">Preferences</div><h2>Settings</h2></div></div><section class="grid">${card("Appearance","Red / Black / White Tina identity.","Toggle theme",'id="themeSettings"')}${card("Default pathway",esc(lvl()),"Change",'data-go="catalog"')}${card("Current mode",esc(mode()),"Change",'data-go="learn"')}</section>`)}
const views={home,catalog,learn,plans,research,review,progress,academy,author,data,settings};
function promptDraft(type){
 let title=prompt(`New ${type} title`);if(!title)return;
 let obj={id:crypto.randomUUID?.()||Date.now(),title,type,status:"draft",created:new Date().toISOString()};
 (type==="practice"?state.practice:type==="media"?state.media:state.lessons).push(obj);save();render()
}
function bind(){
 $("#openMediaPractice")?.addEventListener("click",()=>{state.mediaPracticeOpen=true;save();render()});
 $("#backFromMediaPractice")?.addEventListener("click",()=>{state.mediaPracticeOpen=false;save();render()});
 $$("[data-media-practice-mode]").forEach(btn=>btn.addEventListener("click",()=>{
   state.mode=btn.dataset.mediaPracticeMode;
   state.mediaPracticeOpen=false;
   state.practiceOpen=true;
   state.session={title:`${lvl()} — ${mode()}`,mode:state.mode,started:new Date().toLocaleString(),capture:""};
   save();render();
 }));

 $$("[data-select-level]").forEach(btn=>btn.addEventListener("click",()=>{
   state.level=btn.dataset.selectLevel;
   state.view="learn";
   state.practiceOpen=false;
   state.session=null;
   save();
   render();
 }));
 $("#continueCurrentLevel")?.addEventListener("click",()=>{
   state.view="learn";
   state.practiceOpen=false;
   state.session=null;
   save();
   render();
 });

 $$("[data-view]").forEach(x=>x.onclick=()=>go(x.dataset.view));$$("[data-go]").forEach(x=>x.onclick=()=>go(x.dataset.go));
 $$("[data-level]").forEach(x=>x.onclick=()=>{state.level=x.dataset.level;state.practiceOpen=false;save();render()});
 $$("[data-mode]").forEach(x=>x.onclick=()=>{
   state.mode=x.dataset.mode;
   state.practiceOpen=true;
   state.session={title:`${lvl()} — ${mode()}`,mode:state.mode,started:new Date().toLocaleString(),capture:""};
   save();render()
 });
 $("#backToLearningModes")?.addEventListener("click",()=>{state.practiceOpen=false;state.mediaPracticeOpen=false;state.session=null;save();render()});
 $("#saveCapture")?.addEventListener("click",()=>{if(!state.session)state.session={title:`${lvl()} — ${mode()}`,mode:state.mode,started:new Date().toLocaleString(),capture:""};state.session.capture=$("#capture").value;save();render()});
 $("#completeSession")?.addEventListener("click",()=>{if(state.session){const completed={...state.session,completed:new Date().toISOString()};state.session.capture=$("#capture").value;state.progress.sessions=state.progress.sessions||[];state.progress.sessions.push(completed);window.dispatchEvent(new CustomEvent("tina:learning-complete",{detail:{kind:"lesson",id:`${state.level||"level"}:${state.mode||"mode"}:${state.progress.sessions.length}`,title:completed.title||"",completedAt:completed.completed}}))}state.session=null;state.practiceOpen=false;save();render()});
 $("#mistakeFromSession")?.addEventListener("click",()=>{let t=prompt("Mistake / weakness");if(t){state.mistakes.push({title:t,note:$("#capture")?.value||""});save();render()}});
 $("#bookmarkCurrent")?.addEventListener("click",()=>{state.bookmarks.push({title:`${lvl()} — ${mode()}`,date:new Date().toISOString()});save();render()});
 $("#newPlan")?.addEventListener("click",()=>{let title=prompt("Plan title");if(!title)return;let goal=prompt("Goal")||"";state.plans.push({title,goal});save();render()});
 $$("[data-plan]").forEach(x=>x.onclick=()=>{let p=state.plans[+x.dataset.plan];state.mode="learn";state.practiceOpen=true;state.session={title:p.title,mode:"plan",started:new Date().toLocaleString(),capture:p.goal};save();state.view="learn";render()});
 $$("[data-delplan]").forEach(x=>x.onclick=()=>{state.plans.splice(+x.dataset.delplan,1);save();render()});
 $("#newNote")?.addEventListener("click",()=>{let title=prompt("Note title");if(!title)return;let text=prompt("Note / synthesis")||"";state.notes.push({title,text,date:new Date().toLocaleString()});save();render()});
 $("#searchNotes")?.addEventListener("input",e=>{state.query=e.target.value;$("#notesList").innerHTML=notesHtml()});
 $("#addMistake")?.addEventListener("click",()=>{let title=prompt("Mistake / weakness");if(!title)return;let note=prompt("Review note")||"";state.mistakes.push({title,note});save();render()});
 $$("[data-resolve]").forEach(x=>x.onclick=()=>{state.mistakes.splice(+x.dataset.resolve,1);save();render()});
 $$("[data-domain]").forEach(x=>x.onclick=()=>{state.selectedDomain=x.dataset.domain;save();go("learn")});
 $$("[data-author]").forEach(x=>x.onclick=()=>{let t=x.dataset.author;if(t==="publish")alert("Publishing gate reserved for canonical adapter.");else promptDraft(t)});
 $("#exportData")?.addEventListener("click",()=>{let blob=new Blob([JSON.stringify(JSON.parse(localStorage.getItem(STORE)||"{}"),null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="tina-clean-v3-backup.json";a.click();URL.revokeObjectURL(a.href)});
 $("#importTrigger")?.addEventListener("click",()=>$("#importFile").click());
 $("#importFile")?.addEventListener("change",e=>{let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{JSON.parse(r.result);localStorage.setItem(STORE,r.result);location.reload()}catch{alert("Invalid JSON backup.")}};r.readAsText(f)});
 $("#resetData")?.addEventListener("click",()=>{if(confirm("Reset Clean v3 local workspace? Canonical data will not be touched.")){localStorage.removeItem(STORE);location.reload()}});
 $("#themeSettings")?.addEventListener("click",()=>document.body.classList.toggle("dark"));
}
function render(){
 $("#nav").innerHTML=nav();
 $("#app").innerHTML=(views[state.view]||home)();
 bind();
 window.dispatchEvent(new CustomEvent("tina:app-rendered",{detail:{view:state.view}}));
}
$("#themeBtn").onclick=()=>document.body.classList.toggle("dark");
academyLoad().finally(render);
})();