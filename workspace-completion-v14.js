(() => {
"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const WKEY="tina.v14.workspace.complete";
const USERS_KEY="tina.v14.users";
const USER_SESSION_KEY="tina.v14.user.session";
const ADMIN_SESSION="tina.v14.admin.session";
const BASE_KEY="tina.clean.v3";
const LEVELS=["Pre-A1 Starters","A1 Movers","A2 Flyers","B1 Preliminary","B2 First","C1 Advanced","C2 Proficiency","CPE 230/230 Mastery"];
const ROLES=["learner","teacher","business","editor","reviewer","admin","superadmin"];
const PERMS={
 learner:["learn","plans","research","review","progress","profile","games"],
 teacher:["learn","plans","research","review","progress","profile","games","teacher","assignments","gradebook"],
 business:["library","business","programs","reports","profile"],
 editor:["learn","plans","research","review","progress","profile","games","content-edit"],
 reviewer:["learn","plans","research","review","progress","profile","games","review-content"],
 admin:["*"],
 superadmin:["*"]
};
const gameDefs=[
 ["odd-one-out","Odd One Out","Find the item that does not belong."],
 ["sentence-order","Sentence Order","Put the words into the correct order."],
 ["missing-letter","Missing Letter","Complete the word by restoring a missing letter."],
 ["definition-match","Definition Match","Match the word with its definition."],
 ["true-false","True / False","Decide whether the statement matches the target."],
 ["listen-choice","Listening Choice","Listen and choose the word you hear."],
 ["speed-tap","Speed Tap","Tap the correct answer before the timer ends."],
 ["category-sort","Category Sort","Sort items into the right category."],
 ["unscramble","Word Unscramble","Unscramble the letters to rebuild the word."],
 ["recall-sprint","Recall Sprint","Recall as many learned items as possible."]
];

function uid(prefix="id"){return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}
function now(){return new Date().toISOString()}
function readJSON(key,fallback){
 try{return Object.assign({},fallback,JSON.parse(localStorage.getItem(key)||"{}"))}catch{return fallback}
}
function workspace(){
 const fallback={
  schema:"14.9",lessonPages:[],plans:[],researchProjects:[],profiles:{},teacher:{classes:[],assignments:[],submissions:[]},
  access:{},gameStats:{},pageTemplates:[]
 };
 const w=readJSON(WKEY,fallback);
 w.lessonPages=Array.isArray(w.lessonPages)?w.lessonPages:[];
 w.plans=Array.isArray(w.plans)?w.plans:[];
 w.researchProjects=Array.isArray(w.researchProjects)?w.researchProjects:[];
 w.teacher=Object.assign({classes:[],assignments:[],submissions:[]},w.teacher||{});
 w.access=w.access||{};w.profiles=w.profiles||{};w.gameStats=w.gameStats||{};
 return w;
}
function saveW(w){
 localStorage.setItem(WKEY,JSON.stringify(w));
 window.TinaBackend?.scheduleSync?.("workspace-save");
 queueMicrotask(()=>{try{refreshSidebarBadges()}catch{}});
}
function base(){
 try{return JSON.parse(localStorage.getItem(BASE_KEY)||"{}")}catch{return{}}
}
const PERSISTED_SESSION_KEY="tina.v14.persisted.user.session";
function session(){
 try{
   let s=JSON.parse(sessionStorage.getItem(USER_SESSION_KEY)||"null");
   if(!s){
     const p=JSON.parse(localStorage.getItem(PERSISTED_SESSION_KEY)||"null");
     if(p&&p.expiresAt>Date.now()&&p.session){
       s=p.session;
       sessionStorage.setItem(USER_SESSION_KEY,JSON.stringify(s));
     }else if(p)localStorage.removeItem(PERSISTED_SESSION_KEY);
   }
   if(!s)return null;
   const roles=Array.isArray(s.roles)&&s.roles.length?s.roles:[s.role||"learner"];
   const activeRole=s.activeRole&&roles.includes(s.activeRole)?s.activeRole:(s.role&&roles.includes(s.role)?s.role:roles[0]);
   return Object.assign({},s,{roles,activeRole,role:activeRole});
 }catch{return null}
}
function isSuperadmin(){return session()?.activeRole==="superadmin"||sessionStorage.getItem("tina.v14.superadmin.session")==="1"}
function isAdmin(){return isSuperadmin()||sessionStorage.getItem(ADMIN_SESSION)==="1"||session()?.activeRole==="admin"}
function role(){return isSuperadmin()?"superadmin":(sessionStorage.getItem(ADMIN_SESSION)==="1"&&session()?.activeRole!=="superadmin"?"admin":(session()?.activeRole||"learner"))}
function enforceSuperadminAcademyBoundary(){
 const superMode=isSuperadmin();
 document.querySelectorAll('[data-view="academy"],[data-role-target="academy"],[data-side-target="academy"]').forEach(el=>{
   el.style.display=superMode?"":"none";
   el.setAttribute("aria-hidden",superMode?"false":"true");
 });
}
function allowed(perm){
 const p=PERMS[role()]||PERMS.learner;
 return p.includes("*")||p.includes(perm);
}
function currentUserId(){return session()?.id||"guest"}
const AUTH_GOV_KEY="tina.v14.auth.governance";
function authGovernance(){
 try{
  const raw=JSON.parse(localStorage.getItem(AUTH_GOV_KEY)||"{}");
  return {
   login:Object.assign({learner:true,teacher:true,business:true,admin:true,superadmin:true},raw.login||{}),
   register:Object.assign({learner:false,teacher:false,business:false,admin:false,superadmin:false},raw.register||{}),
   publicRegistration:!!raw.register?.learner
  }
 }catch{return{login:{learner:true,teacher:true,business:true,admin:true,superadmin:true},register:{learner:false,teacher:false,business:false,admin:false,superadmin:false},publicRegistration:false}}
}
function saveAuthGovernance(x){localStorage.setItem(AUTH_GOV_KEY,JSON.stringify(x))}
function authRoleEnabled(kind,r){return !!authGovernance()?.[kind]?.[r]}
function roleLabel(r){return r==="learner"?"Student":r==="admin"?"Administrator":r==="superadmin"?"Superadmin":r.charAt(0).toUpperCase()+r.slice(1)}
function authGovernanceView(){
 if(!isSuperadmin())return show('<div class="feedback bad">Superadmin access is required.</div>');
 const g=authGovernance(),roles=["learner","teacher","business","admin","superadmin"];
 show(`<div class="sectionHead"><div><div class="eyebrow">SUPERADMIN · AUTHENTICATION GOVERNANCE</div><h2>Login & Registration Gates</h2><p class="muted">Each role has an independent login gate and registration/request gate. When registration is hidden, the login portal shows Contact Superadmin instead.</p></div></div>
 <section class="card"><div class="authGovernanceGrid">${roles.map(r=>`<article class="authGovernanceRow"><div><b>${roleLabel(r)}</b><small>${r==="learner"?"Learner workspace":"Governed role workspace"}</small></div><label><input type="checkbox" data-auth-login="${r}" ${g.login?.[r]?"checked":""}> Show login</label><label><input type="checkbox" data-auth-register="${r}" ${g.register?.[r]?"checked":""}> Show registration</label></article>`).join("")}</div>
 <div class="feedback warn"><b>Security rule:</b> Student registration may create an active learner account when enabled. Registration for Teacher, Business, Administrator and Superadmin creates a <code>pending_activation</code> account and still requires Superadmin activation.</div>
 <div class="actions"><button class="primary" id="authGovernanceSave">Save Authentication Gates</button><button id="authProvisionStudent">Create Student</button></div></section>`);
 $("#authGovernanceSave").onclick=()=>{const x=authGovernance();roles.forEach(r=>{x.login[r]=$(`[data-auth-login="${r}"]`)?.checked!==false;x.register[r]=!!$(`[data-auth-register="${r}"]`)?.checked});x.publicRegistration=!!x.register.learner;saveAuthGovernance(x);auditEvent("auth.gates.updated",x);alert("Authentication gates saved for all roles.")};
 $("#authProvisionStudent").onclick=()=>openRoleAccountCreator("learner");
}
function currentLevel(){
 const b=base(), map={starters:"Pre-A1 Starters",movers:"A1 Movers",flyers:"A2 Flyers",preliminary:"B1 Preliminary",first:"B2 First",advanced:"C1 Advanced",proficiency:"C2 Proficiency",cpe230:"CPE 230/230 Mastery"};
 return map[b.level]||b.level||"CPE 230/230 Mastery";
}
function currentMode(){return base().mode||"learn"}
function normalizeUserRecord(u){
 const roles=Array.isArray(u.roles)&&u.roles.length?[...new Set(u.roles)]:[u.role||"learner"];
 const primaryRole=roles.includes(u.primaryRole)?u.primaryRole:(roles.includes(u.role)?u.role:roles[0]);
 return Object.assign({},u,{roles,primaryRole,role:primaryRole});
}
function userStore(){
 try{
   const s=Object.assign({users:[]},JSON.parse(localStorage.getItem(USERS_KEY)||"{}"));
   s.users=(s.users||[]).map(normalizeUserRecord);
   return s;
 }catch{return{users:[]}}
}
function saveUsers(x){
 x.users=(x.users||[]).map(normalizeUserRecord);
 localStorage.setItem(USERS_KEY,JSON.stringify(x))
}
function userAccess(id){
 const w=workspace(),rec=w.access[id]||{};
 return Object.assign({levels:[...LEVELS],routes:["learn","plans","research","review","progress","profile","games"],enabled:true},rec);
}
function canLevel(level){
 if(isAdmin())return true;
 const a=userAccess(currentUserId());
 return a.enabled!==false && (a.levels||[]).includes(level);
}
function download(name,data,type="application/json"){
 const blob=new Blob([data],{type}),a=document.createElement("a");
 a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}
function routeButton(id,label){
 let n=$("#nav");if(!n)return null;
 let b=n.querySelector(`[data-v14-extra="${id}"]`);
 if(!b){b=document.createElement("button");b.type="button";b.className="navbtn";b.dataset.v14Extra=id;n.appendChild(b)}
 b.textContent=label;return b
}
function show(html){
 const app=$("#app");if(!app)return;
 app.innerHTML=`<div class="wrap workspaceV14">${html}</div>`;
 requestAnimationFrame(()=>document.dispatchEvent(new CustomEvent("tina:workspace-view-rendered")));
}
function modal(title,body,actions=""){
 let m=$("#v14WorkspaceModal");
 if(!m){m=document.createElement("div");m.id="v14WorkspaceModal";m.className="workspaceModal";document.body.appendChild(m)}
 m.innerHTML=`<div class="workspaceModalCard"><div class="sectionHead"><div><div class="eyebrow">WORKSPACE TOOL</div><h2>${esc(title)}</h2></div><button class="iconbtn" id="workspaceModalClose">×</button></div>${body}<div class="actions">${actions}</div></div>`;
 m.classList.add("open");$("#workspaceModalClose").onclick=()=>m.classList.remove("open");return m
}
function closeModal(){$("#v14WorkspaceModal")?.classList.remove("open")}
function textField(id,label,value="",type="text",placeholder=""){
 return `<label class="wsField"><span>${esc(label)}</span><input id="${id}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}"></label>`
}
function areaField(id,label,value="",placeholder=""){
 return `<label class="wsField wsFieldFull"><span>${esc(label)}</span><textarea id="${id}" placeholder="${esc(placeholder)}">${esc(value)}</textarea></label>`
}
function selectField(id,label,opts,value=""){
 return `<label class="wsField"><span>${esc(label)}</span><select id="${id}">${opts.map(x=>`<option ${x===value?"selected":""}>${esc(x)}</option>`).join("")}</select></label>`
}

/* Lesson Page Builder removed from learner runtime. */

/* ---------- STUDY PLAN BUILDER ---------- */
function planForm(p={}){
 return `<div class="wsFormGrid">${textField("spTitle","Plan title",p.title||"")}${textField("spGoal","Goal",p.goal||"")}
 ${selectField("spLevel","Level",LEVELS,p.level||currentLevel())}${selectField("spStatus","Status",["draft","active","paused","complete"],p.status||"active")}
 ${textField("spStart","Start date",p.start||"","date")}${textField("spEnd","Target date",p.end||"","date")}
 ${textField("spMinutes","Minutes / day",p.minutes||30,"number")}${textField("spDays","Study days",p.days||"Mon,Tue,Wed,Thu,Fri")}
 ${areaField("spTasks","Tasks",(p.tasks||[]).join("\n"),"One task per line")}${areaField("spMilestones","Milestones",(p.milestones||[]).join("\n"),"One milestone per line")}
 ${areaField("spResources","Resources",(p.resources||[]).join("\n"),"One URL/resource per line")}</div>`;
}
function openPlanEditor(id=null){
 const w=workspace(),p=id?w.plans.find(x=>x.id===id):{};
 modal(id?"Edit Study Plan":"Create Study Plan",planForm(p),`<button class="primary" id="spSave">Save Plan</button>`);
 $("#spSave").onclick=()=>{const rec={...p,id:p.id||uid("plan"),ownerId:currentUserId(),title:$("#spTitle").value.trim()||"Untitled Plan",goal:$("#spGoal").value,level:$("#spLevel").value,status:$("#spStatus").value,start:$("#spStart").value,end:$("#spEnd").value,minutes:+$("#spMinutes").value||30,days:$("#spDays").value,tasks:$("#spTasks").value.split("\n").filter(Boolean),milestones:$("#spMilestones").value.split("\n").filter(Boolean),resources:$("#spResources").value.split("\n").filter(Boolean),updatedAt:now(),createdAt:p.createdAt||now()};if(id){w.plans[w.plans.findIndex(x=>x.id===id)]=rec}else w.plans.push(rec);saveW(w);closeModal();renderStudyPlanWorkspace()}
}
function renderStudyPlanWorkspace(){
 const existing=$("#studyPlanWorkspace");if(!existing)return;
 const w=workspace(),items=w.plans.filter(x=>isAdmin()||x.ownerId===currentUserId());
 existing.innerHTML=`<div class="sectionHead"><div><div class="eyebrow">STUDY PLAN BUILDER</div><h3>Plan your learning</h3><p class="muted">Goals, dates, tasks, milestones, resources and daily workload.</p></div><button class="primary" id="spNew">+ Create Plan</button></div>
 <div class="wsPlanGrid">${items.length?items.map(p=>`<article class="workspaceMiniCard"><div class="eyebrow">${esc(p.level)} · ${esc(p.status)}</div><h4>${esc(p.title)}</h4><p>${esc(p.goal||"")}</p><div class="miniMeta">${esc(p.minutes)} min/day · ${esc(p.days||"")}</div><div class="actions"><button data-sp-edit="${p.id}">Edit</button><button data-sp-duplicate="${p.id}">Duplicate</button><button data-sp-delete="${p.id}">Delete</button></div></article>`).join(""):'<div class="empty">Create your first structured study plan.</div>'}</div>`;
 $("#spNew").onclick=()=>openPlanEditor();
 $$("[data-sp-edit]").forEach(b=>b.onclick=()=>openPlanEditor(b.dataset.spEdit));
 $$("[data-sp-duplicate]").forEach(b=>b.onclick=()=>{const p=w.plans.find(x=>x.id===b.dataset.spDuplicate);w.plans.push({...p,id:uid("plan"),title:`${p.title} Copy`,createdAt:now(),updatedAt:now()});saveW(w);renderStudyPlanWorkspace()});
 $$("[data-sp-delete]").forEach(b=>b.onclick=()=>{if(!confirm("Delete this plan?"))return;w.plans=w.plans.filter(x=>x.id!==b.dataset.spDelete);saveW(w);renderStudyPlanWorkspace()});
}

/* ---------- RESEARCH WORKSPACE ---------- */
function researchForm(p={}){
 return `<div class="wsFormGrid">${textField("rpTitle","Research title",p.title||"")}${selectField("rpStatus","Status",["idea","active","review","complete"],p.status||"active")}
 ${textField("rpQuestion","Research question",p.question||"")}${textField("rpTags","Tags", (p.tags||[]).join(", "))}
 ${areaField("rpNotes","Working notes",p.notes||"")}${areaField("rpSources","Sources",(p.sources||[]).join("\n"),"One source or URL per line")}
 ${areaField("rpEvidence","Evidence / findings",(p.evidence||[]).join("\n"),"One finding per line")}${areaField("rpNext","Next actions",(p.next||[]).join("\n"),"One action per line")}</div>`;
}
function openResearchEditor(id=null){
 const w=workspace(),p=id?w.researchProjects.find(x=>x.id===id):{};
 modal(id?"Edit Research Project":"New Research Project",researchForm(p),`<button class="primary" id="rpSave">Save Research</button>`);
 $("#rpSave").onclick=()=>{const rec={...p,id:p.id||uid("research"),ownerId:currentUserId(),title:$("#rpTitle").value||"Untitled Research",status:$("#rpStatus").value,question:$("#rpQuestion").value,tags:$("#rpTags").value.split(",").map(x=>x.trim()).filter(Boolean),notes:$("#rpNotes").value,sources:$("#rpSources").value.split("\n").filter(Boolean),evidence:$("#rpEvidence").value.split("\n").filter(Boolean),next:$("#rpNext").value.split("\n").filter(Boolean),updatedAt:now(),createdAt:p.createdAt||now()};if(id)w.researchProjects[w.researchProjects.findIndex(x=>x.id===id)]=rec;else w.researchProjects.push(rec);saveW(w);closeModal();renderResearchWorkspace()}
}
function renderResearchWorkspace(){
 const host=$("#researchWorkspace");if(!host)return;const w=workspace(),items=w.researchProjects.filter(x=>isAdmin()||x.ownerId===currentUserId());
 host.innerHTML=`<div class="sectionHead"><div><div class="eyebrow">RESEARCH WORKSPACE</div><h3>Research projects, evidence and sources</h3></div><button class="primary" id="rpNew">+ Research Project</button></div><div class="wsPlanGrid">${items.length?items.map(p=>`<article class="workspaceMiniCard"><div class="eyebrow">${esc(p.status)}</div><h4>${esc(p.title)}</h4><p>${esc(p.question||"")}</p><div class="tagRow">${(p.tags||[]).map(t=>`<span>${esc(t)}</span>`).join("")}</div><div class="actions"><button data-rp-edit="${p.id}">Edit</button><button data-rp-export="${p.id}">Export</button><button data-rp-delete="${p.id}">Delete</button></div></article>`).join(""):'<div class="empty">No research projects yet.</div>'}</div>`;
 $("#rpNew").onclick=()=>openResearchEditor();
 $$("[data-rp-edit]").forEach(b=>b.onclick=()=>openResearchEditor(b.dataset.rpEdit));
 $$("[data-rp-export]").forEach(b=>b.onclick=()=>{const p=w.researchProjects.find(x=>x.id===b.dataset.rpExport);download(`${p.title.replace(/\W+/g,"-")}.json`,JSON.stringify(p,null,2))});
 $$("[data-rp-delete]").forEach(b=>b.onclick=()=>{if(!confirm("Delete this research project?"))return;w.researchProjects=w.researchProjects.filter(x=>x.id!==b.dataset.rpDelete);saveW(w);renderResearchWorkspace()});
}

const V10_FLASH_KEY="tina.clean.v10.practice";
function studentFlashState(){try{return JSON.parse(localStorage.getItem(V10_FLASH_KEY)||"{}")}catch{return{}}}
let studentFlashIndex=0,studentFlashFlipped=false;
function flashSpeakCard(c,side="back"){if(!c)return;tinaSpeak(side==="front"?String(c.front||"").replace(/\{\{|\}\}/g,""):String(c.back||c.front||""),{lang:"en-US",rate:.88})}
function studentFlashcardView(){
 if(role()!=="learner"&&!isSuperadmin())return show('<div class="feedback bad">Student flashcards are available to Student and Superadmin preview.</div>');
 const s=studentFlashState(),decks=Array.isArray(s.decks)?s.decks:[],selected=s.selectedDeck||decks[0]?.id,d=decks.find(x=>x.id===selected)||decks[0],cards=d?.cards||[];if(studentFlashIndex>=cards.length)studentFlashIndex=Math.max(0,cards.length-1);const c=cards[studentFlashIndex];
 show(`<section class="studentFlashPage"><div class="pageTitleCompact"><div><h2>${uiIcon("cards",24)} Flashcards</h2><p class="muted">Flip to reveal the answer; Tina reads it aloud automatically. Use ← / → to navigate.</p></div><div class="flashDeckControl"><select id="studentFlashDeck">${decks.map(x=>`<option value="${esc(x.id)}" ${x.id===d?.id?"selected":""}>${esc(x.title)} (${x.cards?.length||0})</option>`).join("")}</select></div></div><section class="flashGameShortcuts"><div><b>${uiIcon("game",18)} Practice with games</b><span>Move from recognition to active retrieval.</span></div><div class="actions"><button class="primary" id="flashOpenGames">Game Hub</button><button id="flashOpenPractice">30-Game Practice</button><button id="flashOpenReview">Mistake Review</button></div></section>
 ${c?`<div class="studentFlashProgress"><span>${studentFlashIndex+1} / ${cards.length}</span><div><i style="width:${((studentFlashIndex+1)/Math.max(1,cards.length))*100}%"></i></div><span>${esc(d.title)}</span></div><div class="studentFlashCard ${studentFlashFlipped?"flipped":""}" id="studentFlashCard" role="button" tabindex="0" aria-pressed="${studentFlashFlipped?"true":"false"}" aria-label="Flip flashcard"><div class="studentFlashFace studentFlashFront" aria-hidden="${studentFlashFlipped?"true":"false"}"><small>${esc(c.type||"basic")}</small><strong>${esc(String(c.front||"").replace(/\{\{|\}\}/g,""))}</strong><div class="flashFaceActions"><span>Click to reveal</span><button type="button" class="flashSpeakSide" id="flashSpeakFront">▶ Listen</button></div></div><div class="studentFlashFace studentFlashBack" aria-hidden="${studentFlashFlipped?"false":"true"}"><small>Answer</small><strong>${esc(c.back||"No answer entered yet.")}</strong>${c.example?`<p>${esc(c.example)}</p>`:""}${c.wordFamily?`<p><b>Word family:</b> ${esc(c.wordFamily)}</p>`:""}<div class="flashFaceActions"><span>Click to hide</span><button type="button" class="flashSpeakSide" id="flashSpeakBack">▶ Listen again</button></div></div></div><div class="studentFlashNav"><button id="studentFlashPrev" ${studentFlashIndex===0?"disabled":""}>${uiIcon("play",16)} Previous</button><button class="primary" id="studentFlashFlip">${studentFlashFlipped?"Show Front":"Flip Card"}</button><button id="studentFlashNext" ${studentFlashIndex===cards.length-1?"disabled":""}>Next ${uiIcon("play",16)}</button></div><div class="studentFlashMeta"><div class="tags">${(c.tags||[]).map(t=>`<span>${esc(t)}</span>`).join("")}</div><span>Mastery ${Number(c.mastery||0)}%</span></div>`:`<section class="card empty">No flashcards are available yet.</section>`}</section>`);
 const render=()=>studentFlashcardView(),toggle=()=>{studentFlashFlipped=!studentFlashFlipped;const card=$("#studentFlashCard");card?.classList.toggle("flipped",studentFlashFlipped);card?.setAttribute("aria-pressed",String(studentFlashFlipped));$(".studentFlashFront")?.setAttribute("aria-hidden",String(studentFlashFlipped));$(".studentFlashBack")?.setAttribute("aria-hidden",String(!studentFlashFlipped));const b=$("#studentFlashFlip");if(b)b.textContent=studentFlashFlipped?"Show Front":"Flip Card";if(studentFlashFlipped)flashSpeakCard(c,"back")};
 const prev=()=>{if(studentFlashIndex<=0)return;studentFlashIndex--;studentFlashFlipped=false;render()},next=()=>{if(studentFlashIndex>=cards.length-1)return;studentFlashIndex++;studentFlashFlipped=false;render()};
 window.__tinaFlashController={toggle,prev,next,front:()=>flashSpeakCard(c,"front"),back:()=>flashSpeakCard(c,"back")};
 const card=$("#studentFlashCard");if(card){card.onclick=e=>{if(!e.target.closest(".flashSpeakSide"))toggle()};card.onkeydown=e=>{if((e.key==="Enter"||e.key===" ")&&!e.target.closest(".flashSpeakSide")){e.preventDefault();toggle()}}}
 const flip=$("#studentFlashFlip");if(flip)flip.onclick=toggle;const sf=$("#flashSpeakFront");if(sf)sf.onclick=e=>{e.stopPropagation();flashSpeakCard(c,"front")};const sb=$("#flashSpeakBack");if(sb)sb.onclick=e=>{e.stopPropagation();flashSpeakCard(c,"back")};
 const pb=$("#studentFlashPrev");if(pb)pb.onclick=prev;const nb=$("#studentFlashNext");if(nb)nb.onclick=next;$("#studentFlashDeck")?.addEventListener("change",e=>{s.selectedDeck=e.target.value;localStorage.setItem(V10_FLASH_KEY,JSON.stringify(s));window.TinaBackend?.scheduleSync?.("flashcard-deck");studentFlashIndex=0;studentFlashFlipped=false;render()});
 $("#flashOpenGames").onclick=()=>roleTargetOpen("games-extra");$("#flashOpenPractice").onclick=()=>roleTargetOpen("practice-v10");$("#flashOpenReview").onclick=()=>roleTargetOpen("review");
 if(window.__tinaFlashKeyHandler)document.removeEventListener("keydown",window.__tinaFlashKeyHandler);window.__tinaFlashKeyHandler=e=>{if(!$("#studentFlashCard")||e.isComposing||e.repeat||/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||""))return;const ctl=window.__tinaFlashController;if(!ctl)return;if(e.code==="Space"||e.key==="Enter"){e.preventDefault();ctl.toggle()}else if(e.key==="ArrowLeft"){e.preventDefault();ctl.prev()}else if(e.key==="ArrowRight"){e.preventDefault();ctl.next()}};document.addEventListener("keydown",window.__tinaFlashKeyHandler)
}

/* ---------- PROFILE ---------- */
function profile(){
 const w=workspace(),id=currentUserId(),s=session()||{},p=Object.assign({displayName:s.name||"Learner",bio:"",goal:"",interests:"",avatar:"",xp:0,streak:0,badges:[],joinedAt:now()},w.profiles[id]||{});
 w.profiles[id]=p;saveW(w);return p
}
function profileView(){
 const p=profile(),w=workspace(),myPlans=w.plans.filter(x=>x.ownerId===currentUserId()).length,myResearch=w.researchProjects.filter(x=>x.ownerId===currentUserId()).length;
 show(`<section class="profileHero card"><div class="profileAvatar profileAvatarLarge">${p.avatar?`<img src="${esc(p.avatar)}" alt="${esc(p.displayName)} avatar">`:(p.displayName||"U").slice(0,1).toUpperCase()}</div><div class="profileHeroCopy"><div class="eyebrow">MY PROFILE</div><h2>${esc(p.displayName)}</h2><p>${esc(p.bio||"Build your learning identity and track your growth.")}</p><div class="profileMiniMeta"><span>${uiIcon("trophy",15)} ${p.xp||0} XP</span><span>${uiIcon("calendar",15)} ${p.streak||0} day streak</span></div></div><button class="primary" id="profileEdit">${uiIcon("edit",16)} Edit Profile</button></section>
 <section class="profileStats"><article><b>${p.xp||0}</b><span>XP</span></article><article><b>${p.streak||0}</b><span>Day streak</span></article><article><b>${myPlans}</b><span>Plans</span></article><article><b>${myResearch}</b><span>Research</span></article></section>
 <section class="grid"><article class="card"><h3>Learning Goal</h3><p>${esc(p.goal||"No goal set yet.")}</p></article><article class="card"><h3>Interests</h3><p>${esc(p.interests||"No interests added yet.")}</p></article><article class="card"><h3>Badges</h3><div class="badgeShelf">${(p.badges||[]).length?p.badges.map(x=>`<span>★ ${esc(x)}</span>`).join(""):'<span class="muted">Complete learning activities to earn badges.</span>'}</div></article></section>`);
 $("#profileEdit").onclick=openProfileEditor
}
function openProfileEditor(){
 const p=profile();
 modal("Edit Profile",`<div class="profileAvatarEditor"><div class="profileAvatar profileAvatarPreview" id="pfAvatarPreview">${p.avatar?`<img src="${esc(p.avatar)}" alt="">`:(p.displayName||"U").slice(0,1).toUpperCase()}</div><div><b>Profile photo</b><p class="muted">Square images work best. Tina stores the image durably when the backend is available.</p><div class="actions"><label class="fileButton">${uiIcon("profile",16)} Choose Image<input id="pfAvatar" type="file" accept="image/png,image/jpeg,image/webp"></label>${p.avatar?'<button id="pfAvatarRemove" class="ghost">Remove</button>':""}</div></div></div><div class="wsFormGrid">${textField("pfName","Display name",p.displayName)}${textField("pfGoal","Main learning goal",p.goal)}${textField("pfInterests","Interests",p.interests)}${areaField("pfBio","Bio",p.bio)}</div>`,`<button class="primary" id="pfSave">Save Profile</button>`);
 let removeAvatar=false,selectedFile=null;
 $("#pfAvatar")?.addEventListener("change",e=>{selectedFile=e.target.files?.[0]||null;if(!selectedFile)return;if(selectedFile.size>5_000_000){selectedFile=null;e.target.value="";return alert("Avatar must be under 5 MB.")}const r=new FileReader();r.onload=()=>$("#pfAvatarPreview").innerHTML=`<img src="${r.result}" alt="Avatar preview">`;r.readAsDataURL(selectedFile)});
 $("#pfAvatarRemove")?.addEventListener("click",()=>{removeAvatar=true;selectedFile=null;$("#pfAvatarPreview").textContent=(p.displayName||"U").slice(0,1).toUpperCase()});
 $("#pfSave").onclick=async()=>{
  const w=workspace(),id=currentUserId(),rec=profile();rec.displayName=$("#pfName").value||rec.displayName;rec.goal=$("#pfGoal").value;rec.interests=$("#pfInterests").value;rec.bio=$("#pfBio").value;
  if(removeAvatar){rec.avatar="";rec.avatarMediaId=""}
  if(selectedFile){
    if(window.TinaBackend?.available){try{const m=await window.TinaBackend.uploadMedia(selectedFile);rec.avatar=m.url;rec.avatarMediaId=m.id;rec.avatarDurable=true}catch(e){return alert("Avatar upload failed: "+e.message)}}
    else{rec.avatar=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(selectedFile)});rec.avatarDurable=false}
  }
  w.profiles[id]=rec;saveW(w);auditEvent("profile.updated",{avatar:!!rec.avatar});closeModal();profileView();installRoleGroupedNav()
 }
}

/* ---------- TEACHER ---------- */

function teacherClassesView(){
 if(!(role()==="teacher"||isSuperadmin()))return show('<div class="feedback bad">Teacher access is required.</div>');
 const t=workspace().teacher;
 show(`<section class="teacherWorkspacePage"><div class="pageTitleCompact"><h2>My Classes</h2><button class="primary" id="teacherClassesAdd">+ Class</button></div><section class="card"><div class="teacherClassList">${t.classes.length?t.classes.map(c=>`<button class="teacherClassCard" data-class-edit="${c.id}"><span><b>${esc(c.name)}</b><small>${esc(c.code||"No code")}</small></span><strong>${(c.members||[]).length}</strong><em>learners</em></button>`).join(""):'<div class="empty">No classes yet.</div>'}</div></section></section>`);
 $("#teacherClassesAdd").onclick=()=>openClassEditor();$$("[data-class-edit]").forEach(b=>b.onclick=()=>openClassEditor(b.dataset.classEdit))
}
function teacherAssignmentsView(){
 if(!(role()==="teacher"||isSuperadmin()))return;
 const t=workspace().teacher;
 show(`<section class="teacherWorkspacePage"><div class="pageTitleCompact"><h2>Assignments</h2><button class="primary" id="teacherAssignmentsAdd">+ Assignment</button></div><section class="card"><div class="assignmentList">${t.assignments.length?t.assignments.map(a=>`<article class="assignmentCard"><div><b>${esc(a.title)}</b><small>${esc(a.level||"General")} · Due ${esc(a.due||"—")}</small></div><div class="actions"><button data-assignment-edit="${a.id}">Edit</button><button data-assignment-submissions="${a.id}">Submissions</button></div></article>`).join(""):'<div class="empty">No assignments yet.</div>'}</div></section></section>`);
 $("#teacherAssignmentsAdd").onclick=()=>openAssignmentEditor();$$("[data-assignment-edit]").forEach(b=>b.onclick=()=>openAssignmentEditor(b.dataset.assignmentEdit));$$("[data-assignment-submissions]").forEach(b=>b.onclick=()=>teacherSubmissionsView(b.dataset.assignmentSubmissions))
}
function teacherGradingView(){
 if(!(role()==="teacher"||isSuperadmin()))return;
 const t=workspace().teacher,learners=teacherLearners();
 show(`<section class="teacherWorkspacePage"><div class="pageTitleCompact"><h2>Submissions & Grading</h2><span class="badge">${t.submissions.filter(x=>x.status!=="graded").length} pending</span></div><section class="card"><div class="tableWrap"><table><thead><tr><th>Learner</th><th>Assignment</th><th>Status</th><th>Score</th><th>Action</th></tr></thead><tbody>${t.submissions.length?t.submissions.map(s=>{const u=learners.find(x=>x.id===s.userId),a=t.assignments.find(x=>x.id===s.assignmentId);return `<tr><td>${esc(u?.name||"Unknown")}</td><td>${esc(a?.title||"Unknown")}</td><td>${esc(s.status||"submitted")}</td><td>${s.score??"—"}</td><td><button data-grade-submission="${s.id}">${s.status==="graded"?"Review":"Grade"}</button></td></tr>`}).join(""):'<tr><td colspan="5">No submissions yet.</td></tr>'}</tbody></table></div></section></section>`);
 $$("[data-grade-submission]").forEach(b=>b.onclick=()=>gradeSubmissionView(b.dataset.gradeSubmission))
}
function teacherProgressView(){
 if(!(role()==="teacher"||isSuperadmin()))return;
 const t=workspace().teacher,learners=teacherLearners();
 show(`<section class="teacherWorkspacePage"><div class="pageTitleCompact"><h2>Learner Progress</h2></div><section class="card"><div class="tableWrap"><table><thead><tr><th>Learner</th><th>Classes</th><th>Assignments</th><th>Submitted</th><th>Graded</th></tr></thead><tbody>${learners.map(u=>{const cls=t.classes.filter(c=>(c.members||[]).includes(u.id)).length,ass=t.assignments.filter(a=>(a.assignees||[]).includes(u.id)).length,subs=t.submissions.filter(s=>s.userId===u.id).length,g=t.submissions.filter(s=>s.userId===u.id&&s.status==="graded").length;return `<tr><td><b>${esc(u.name)}</b><br><small>${esc(u.email)}</small>${canDeleteManagedUser(u)?`<div><button class="dangerAction teacherDeleteLearner" data-teacher-delete-user="${u.id}">Delete Account</button></div>`:""}</td><td>${cls}</td><td>${ass}</td><td>${subs}</td><td>${g}</td></tr>`}).join("")}</tbody></table></div></section></section>`);$$("[data-teacher-delete-user]").forEach(b=>b.onclick=()=>deleteManagedUserAccount(b.dataset.teacherDeleteUser,teacherProgressView))
}

function teacherLearners(){
 return userStore().users.filter(u=>userRoles(u).includes("learner")&&accountIsOperational(u))
}
function teacherView(){
 if(!(role()==="teacher"||isAdmin()))return show('<div class="feedback bad">Teacher access is required.</div>');
 const w=workspace(),t=w.teacher,learners=teacherLearners();
 const graded=t.submissions.filter(x=>x.status==="graded").length,pending=t.submissions.filter(x=>x.status!=="graded").length;
 show(`<div class="sectionHead"><div><div class="eyebrow">TEACHER WORKSPACE</div><h2>Teaching Dashboard</h2><p class="muted">Manage classes, assign work, review submissions and record grades.</p></div><div class="actions"><button class="primary" id="teacherNewAssignment">+ Assignment</button><button id="teacherNewClass">+ Class</button></div></div>
 <section class="teacherMetrics"><article><b>${t.classes.length}</b><span>Classes</span></article><article><b>${t.assignments.length}</b><span>Assignments</span></article><article><b>${pending}</b><span>Awaiting grading</span></article><article><b>${graded}</b><span>Graded</span></article></section>

 <section class="teacherWorkspaceGrid">
  <article class="card teacherPanel"><div class="panelHead"><div><h3>My Classes</h3><p>Teacher-owned class groups and learners.</p></div></div>
   <div class="teacherClassList">${t.classes.length?t.classes.map(c=>`<button class="teacherClassCard" data-class-edit="${c.id}"><span><b>${esc(c.name)}</b><small>${esc(c.code||"No code")}</small></span><strong>${(c.members||[]).length}</strong><em>learners</em></button>`).join(""):'<div class="empty">No classes yet. Create your first class.</div>'}</div>
  </article>

  <article class="card teacherPanel"><div class="panelHead"><div><h3>Assignments</h3><p>Create and manage work for classes or individual learners.</p></div></div>
   <div class="assignmentList">${t.assignments.length?t.assignments.map(a=>`<article class="assignmentCard"><div><b>${esc(a.title)}</b><small>${esc(a.level||"General")} · Due ${esc(a.due||"—")}</small><small>${(a.assignees||[]).length} learner(s)</small></div><div class="actions"><button data-assignment-edit="${a.id}">Edit</button><button data-assignment-submissions="${a.id}">Submissions</button></div></article>`).join(""):'<div class="empty">No assignments yet.</div>'}</div>
  </article>
 </section>

 <section class="card teacherPanel"><div class="panelHead"><div><h3>Submissions & Grading</h3><p>Open a submission, add feedback and record a score.</p></div></div>
  <div class="tableWrap"><table><thead><tr><th>Learner</th><th>Assignment</th><th>Status</th><th>Score</th><th>Submitted</th><th>Action</th></tr></thead><tbody>
  ${t.submissions.length?t.submissions.map(s=>{const u=learners.find(x=>x.id===s.userId),a=t.assignments.find(x=>x.id===s.assignmentId);return `<tr><td>${esc(u?.name||"Unknown learner")}</td><td>${esc(a?.title||"Unknown assignment")}</td><td><span class="badge">${esc(s.status||"submitted")}</span></td><td>${s.score??"—"}</td><td>${esc(s.submittedAt?new Date(s.submittedAt).toLocaleString():"—")}</td><td><button data-grade-submission="${s.id}">${s.status==="graded"?"Review Grade":"Grade"}</button></td></tr>`}).join(""):'<tr><td colspan="6"><div class="empty">No submissions yet.</div></td></tr>'}
  </tbody></table></div>
 </section>

 <section class="card teacherPanel"><div class="panelHead"><div><h3>Learner Gradebook</h3><p>Class membership, assignment load and grading status.</p></div></div><div class="tableWrap"><table><thead><tr><th>Learner</th><th>Classes</th><th>Assignments</th><th>Submitted</th><th>Graded</th></tr></thead><tbody>${learners.map(u=>{const cls=t.classes.filter(c=>(c.members||[]).includes(u.id)).length,ass=t.assignments.filter(a=>(a.assignees||[]).includes(u.id)).length,subs=t.submissions.filter(s=>s.userId===u.id).length,g=t.submissions.filter(s=>s.userId===u.id&&s.status==="graded").length;return `<tr><td><b>${esc(u.name)}</b><br><small>${esc(u.email)}</small></td><td>${cls}</td><td>${ass}</td><td>${subs}</td><td>${g}</td></tr>`}).join("")}</tbody></table></div></section>`);

 $("#teacherNewClass").onclick=()=>openClassEditor();
 $("#teacherNewAssignment").onclick=()=>openAssignmentEditor();
 $$("[data-class-edit]").forEach(b=>b.onclick=()=>openClassEditor(b.dataset.classEdit));
 $$("[data-assignment-edit]").forEach(b=>b.onclick=()=>openAssignmentEditor(b.dataset.assignmentEdit));
 $$("[data-assignment-submissions]").forEach(b=>b.onclick=()=>teacherSubmissionsView(b.dataset.assignmentSubmissions));
 $$("[data-grade-submission]").forEach(b=>b.onclick=()=>gradeSubmissionView(b.dataset.gradeSubmission));
}
function teacherSubmissionsView(assignmentId){
 const w=workspace(),t=w.teacher,a=t.assignments.find(x=>x.id===assignmentId),learners=teacherLearners();
 if(!a)return teacherView();
 const rows=t.submissions.filter(s=>s.assignmentId===assignmentId);
 show(`<div class="sectionHead"><div><div class="eyebrow">TEACHER · ASSIGNMENT</div><h2>${esc(a.title)}</h2><p class="muted">${rows.length} submission(s)</p></div><button id="teacherSubBack">← Teacher Dashboard</button></div><section class="card"><div class="tableWrap"><table><thead><tr><th>Learner</th><th>Status</th><th>Score</th><th>Feedback</th><th>Action</th></tr></thead><tbody>${rows.length?rows.map(s=>{const u=learners.find(x=>x.id===s.userId);return `<tr><td>${esc(u?.name||"Unknown")}</td><td>${esc(s.status||"submitted")}</td><td>${s.score??"—"}</td><td>${esc(s.feedback||"—")}</td><td><button data-grade-submission="${s.id}">${s.status==="graded"?"Edit Grade":"Grade"}</button></td></tr>`}).join(""):'<tr><td colspan="5">No submissions yet.</td></tr>'}</tbody></table></div></section>`);
 $("#teacherSubBack").onclick=teacherView;$$("[data-grade-submission]").forEach(b=>b.onclick=()=>gradeSubmissionView(b.dataset.gradeSubmission))
}
function gradeSubmissionView(id){
 const w=workspace(),t=w.teacher,s=t.submissions.find(x=>x.id===id);if(!s)return teacherView();
 const u=teacherLearners().find(x=>x.id===s.userId),a=t.assignments.find(x=>x.id===s.assignmentId);
 modal("Grade Submission",`<div class="submissionReview"><p><b>Learner:</b> ${esc(u?.name||"Unknown")}</p><p><b>Assignment:</b> ${esc(a?.title||"Unknown")}</p><div class="submissionBody">${esc(s.content||s.answer||"No submission content stored.")}</div></div><div class="wsFormGrid">${textField("gradeScore","Score",s.score??"","number")}${areaField("gradeFeedback","Teacher feedback",s.feedback||"")}</div>`,`<button class="primary" id="saveGrade">Save Grade</button>`);
 $("#saveGrade").onclick=()=>{const score=Number($("#gradeScore").value);if(Number.isNaN(score))return alert("Enter a numeric score.");s.score=score;s.feedback=$("#gradeFeedback").value;s.status="graded";s.gradedAt=now();s.gradedBy=currentUserId();saveW(w);auditEvent("teacher.submission.graded",{submissionId:s.id,assignmentId:s.assignmentId,userId:s.userId,score});closeModal();teacherView()}
}
function openClassEditor(id=null){
 const w=workspace(),c=id?w.teacher.classes.find(x=>x.id===id):{},learners=teacherLearners();
 modal(id?"Manage Class":"Create Class",`<div class="wsFormGrid">${textField("tcName","Class name",c.name||"")}${textField("tcCode","Class code",c.code||"")}</div><div class="accessChecks"><h4>Learners</h4>${learners.map(u=>`<label><input type="checkbox" data-tc-user="${u.id}" ${(c.members||[]).includes(u.id)?"checked":""}> ${esc(u.name)} <small>${esc(u.email)}</small></label>`).join("")||'<div class="empty">No learners yet.</div>'}</div>`,`<button class="primary" id="tcSave">Save Class</button>`);
 $("#tcSave").onclick=()=>{const rec={...c,id:c.id||uid("class"),name:$("#tcName").value||"Untitled Class",code:$("#tcCode").value,members:$$("[data-tc-user]:checked").map(x=>x.dataset.tcUser),updatedAt:now(),createdAt:c.createdAt||now()};if(id)w.teacher.classes[w.teacher.classes.findIndex(x=>x.id===id)]=rec;else w.teacher.classes.push(rec);saveW(w);closeModal();teacherView()}
}
function openAssignmentEditor(id=null){
 const w=workspace(),a=id?w.teacher.assignments.find(x=>x.id===id):{},learners=teacherLearners();
 modal(id?"Edit Assignment":"Create Assignment",`<div class="wsFormGrid">${textField("taTitle","Assignment title",a.title||"")}${selectField("taLevel","Level",LEVELS,a.level||currentLevel())}${textField("taDue","Due date",a.due||"","date")}${selectField("taType","Activity type",["Lesson","Listening","Flashcards","Speaking","Writing","Quiz","Game","Research"],a.type||"Lesson")}${areaField("taInstructions","Instructions",a.instructions||"")}</div><div class="accessChecks"><h4>Assign to learners</h4>${learners.map(u=>`<label><input type="checkbox" data-ta-user="${u.id}" ${(a.assignees||[]).includes(u.id)?"checked":""}> ${esc(u.name)}</label>`).join("")}</div>`,`<button class="primary" id="taSave">Save Assignment</button>`);
 $("#taSave").onclick=()=>{const rec={...a,id:a.id||uid("assignment"),teacherId:currentUserId(),title:$("#taTitle").value||"Untitled Assignment",level:$("#taLevel").value,due:$("#taDue").value,type:$("#taType").value,instructions:$("#taInstructions").value,assignees:$$("[data-ta-user]:checked").map(x=>x.dataset.taUser),updatedAt:now(),createdAt:a.createdAt||now()};if(id)w.teacher.assignments[w.teacher.assignments.findIndex(x=>x.id===id)]=rec;else w.teacher.assignments.push(rec);saveW(w);closeModal();teacherView()}
}

/* ---------- ADMIN ACCESS CONTROL ---------- */
function accessControlView(){
 if(!isSuperadmin())return show('<div class="feedback bad">User Access is managed only by Superadmin.</div>');
 const users=userStore().users,w=workspace();
 show(`<div class="sectionHead"><div><div class="eyebrow">ADMIN · ACCESS CONTROL</div><h2>Roles & Permissions</h2><p class="muted">Admin has the highest authority. Control role, account access and level availability per user.</p></div><button class="ghost" id="accessBackAdmin">← Admin</button></div>
 <section class="card"><div class="tableWrap"><table><thead><tr><th>User</th><th>Role</th><th>Enabled</th><th>Level access</th><th>Actions</th></tr></thead><tbody>${users.map(u=>{const a=userAccess(u.id);return `<tr><td><b>${esc(u.name)}</b><br><small>${esc(u.email)}</small></td><td><select data-role-user="${u.id}">${ROLES.map(r=>`<option value="${r}" ${u.role===r?"selected":""}>${r}</option>`).join("")}</select></td><td><input type="checkbox" data-enabled-user="${u.id}" ${a.enabled!==false?"checked":""}></td><td><div class="levelCheckGrid">${LEVELS.map(l=>`<label><input type="checkbox" data-level-user="${u.id}" value="${esc(l)}" ${(a.levels||[]).includes(l)?"checked":""}>${esc(l.replace(/^Pre-A1 |^A1 |^A2 |^B1 |^B2 |^C1 |^C2 /,""))}</label>`).join("")}</div></td><td><button data-access-save="${u.id}">Save</button></td></tr>`}).join("")}</tbody></table></div></section>`);
 $("#accessBackAdmin").onclick=()=>document.querySelector('[data-view="admin-v14"]')?.click();
 $$("[data-access-save]").forEach(b=>b.onclick=()=>{const id=b.dataset.accessSave,store=userStore(),u=store.users.find(x=>x.id===id);if(u){u.role=$(`[data-role-user="${id}"]`).value;saveUsers(store)}w.access[id]=Object.assign({},userAccess(id),{enabled:$(`[data-enabled-user="${id}"]`).checked,levels:$$(`[data-level-user="${id}"]:checked`).map(x=>x.value)});saveW(w);alert("Access updated.")})
}

/* ---------- 10 LINKED GAMES ---------- */
function learningBank(){
 let bank=[];
 try{
  const p=JSON.parse(localStorage.getItem("tina.clean.v10.practice")||"{}");
  const cards=p.cards||p.decks?.flatMap(d=>d.cards||[])||[];
  bank=cards.map(c=>({term:c.front||c.term||c.word||"",definition:c.back||c.definition||c.meaning||"",example:c.example||"",category:c.tag||c.category||"Vocabulary"})).filter(x=>x.term);
 }catch{}
 if(bank.length<8)bank=[
  ["meticulous","very careful and precise","She is meticulous about detail.","Vocabulary"],
  ["substantiate","support with evidence","The claim must be substantiated.","Vocabulary"],
  ["inadvertently","without intending to","He inadvertently revealed the answer.","Adverb"],
  ["defer","delay until later","They deferred the decision.","Verb"],
  ["perceive","become aware of","Children perceive patterns quickly.","Verb"],
  ["coherent","logical and consistent","Her argument was coherent.","Adjective"],
  ["plausible","seemingly reasonable","That is a plausible explanation.","Adjective"],
  ["synthesize","combine into a whole","Synthesize evidence from several sources.","Verb"],
  ["infer","reach a conclusion from evidence","We can infer the meaning from context.","Verb"],
  ["precise","exact and accurate","Use precise terminology.","Adjective"]
 ].map(x=>({term:x[0],definition:x[1],example:x[2],category:x[3]}));
 return bank
}
function gamesView(){
 const bank=learningBank(),level=currentLevel();
 show(`<div class="sectionHead"><div><div class="eyebrow">GAME LIBRARY</div><h2>Practice Games</h2><p class="muted">Choose a game first. The game itself opens on a dedicated player page so you can focus without the game rendering underneath the library.</p></div></div>
 <section class="gamePackGrid">${gameDefs.map(([id,name,desc])=>`<article class="card gameLibraryCard"><div class="gameIcon">🎮</div><h3>${esc(name)}</h3><p>${esc(desc)}</p><button class="primary" data-game-open="${id}">Play Game</button></article>`).join("")}</section>`);
 $$("[data-game-open]").forEach(b=>b.onclick=()=>gamePlayerView(b.dataset.gameOpen,bank))
}
function gamePlayerView(id,bank=learningBank()){
 const def=gameDefs.find(x=>x[0]===id)||[id,"Practice Game",""];
 show(`<div class="gamePlayerPage"><div class="sectionHead"><div><div class="eyebrow">GAME PLAYER · ${esc(currentLevel())}</div><h2>${esc(def[1])}</h2><p class="muted">${esc(def[2]||"Focused practice session.")}</p></div><button class="ghost" id="gamePlayerBack">← Game Library</button></div><div id="gameStage" class="gamePlayerStage"></div></div>`);
 $("#gamePlayerBack").onclick=gamesView;
 runGame(id,bank);
}
function shuffled(a){return [...a].sort(()=>Math.random()-.5)}
function runGame(id,bank){
 const stage=$("#gameStage"),item=bank[Math.floor(Math.random()*bank.length)],choices=shuffled(bank).slice(0,4);if(!choices.some(x=>x.term===item.term))choices[0]=item;
 const finish=(ok)=>{let w=workspace();w.gameStats[id]=w.gameStats[id]||{played:0,correct:0};w.gameStats[id].played++;if(ok)w.gameStats[id].correct++;saveW(w);stage.querySelector(".gameFeedback").innerHTML=`<div class="feedback ${ok?"ok":"bad"}">${ok?"Correct!":"Try again."}</div>`};
 if(id==="odd-one-out"){
  const categories=bank.reduce((a,x)=>(a[x.category]=(a[x.category]||[]).concat(x),a),{}),groups=Object.values(categories).filter(x=>x.length>=2);const g=groups[0]||bank.slice(0,3),other=bank.find(x=>x.category!==g[0]?.category)||bank.at(-1),opts=shuffled([...g.slice(0,3),other]);stage.innerHTML=gameShell("Odd One Out","Which item is different?",opts.map(x=>`<button data-answer="${x.term===other.term}">${esc(x.term)}</button>`).join(""));bindAnswers(stage,finish)
 } else if(id==="sentence-order"){
  const sentence=(item.example||`Use ${item.term} accurately in context`).replace(/[.!?]/g,""),words=shuffled(sentence.split(/\s+/));stage.innerHTML=gameShell("Sentence Order",`Arrange: ${words.join(" · ")}`,`<input id="gameInput"><button id="gameCheck">Check</button>`);$("#gameCheck").onclick=()=>finish($("#gameInput").value.trim().toLowerCase()===sentence.toLowerCase())
 } else if(id==="missing-letter"){
  const i=Math.max(1,Math.floor(item.term.length/2)),masked=item.term.slice(0,i)+"_"+item.term.slice(i+1);stage.innerHTML=gameShell("Missing Letter",masked,`<input id="gameInput" maxlength="1"><button id="gameCheck">Check</button>`);$("#gameCheck").onclick=()=>finish($("#gameInput").value.toLowerCase()===item.term[i].toLowerCase())
 } else if(id==="definition-match"){
  stage.innerHTML=gameShell("Definition Match",item.definition,choices.map(x=>`<button data-answer="${x.term===item.term}">${esc(x.term)}</button>`).join(""));bindAnswers(stage,finish)
 } else if(id==="true-false"){
  const truth=Math.random()>.5,def=truth?item.definition:bank.find(x=>x.term!==item.term)?.definition;stage.innerHTML=gameShell("True / False",`${item.term} = ${def}`,`<button data-answer="${truth}">True</button><button data-answer="${!truth}">False</button>`);bindAnswers(stage,finish)
 } else if(id==="listen-choice"){
  speechSynthesis.speak(new SpeechSynthesisUtterance(item.term));stage.innerHTML=gameShell("Listening Choice","Listen and choose.",choices.map(x=>`<button data-answer="${x.term===item.term}">${esc(x.term)}</button>`).join("")+`<button id="replayWord">🔊 Replay</button>`);$("#replayWord").onclick=()=>speechSynthesis.speak(new SpeechSynthesisUtterance(item.term));bindAnswers(stage,finish)
 } else if(id==="speed-tap"){
  let seconds=8;stage.innerHTML=gameShell("Speed Tap",`<span id="gameTimer">${seconds}</span>s · ${item.definition}`,choices.map(x=>`<button data-answer="${x.term===item.term}">${esc(x.term)}</button>`).join(""));const timer=setInterval(()=>{seconds--;if($("#gameTimer"))$("#gameTimer").textContent=seconds;if(seconds<=0){clearInterval(timer);finish(false)}},1000);$$("[data-answer]").forEach(b=>b.onclick=()=>{clearInterval(timer);finish(b.dataset.answer==="true")})
 } else if(id==="category-sort"){
  const opts=shuffled(bank).slice(0,6);stage.innerHTML=gameShell("Category Sort","Choose the correct category for the highlighted word.",`<h3>${esc(item.term)}</h3>${[...new Set(bank.map(x=>x.category))].slice(0,5).map(c=>`<button data-answer="${c===item.category}">${esc(c)}</button>`).join("")}`);bindAnswers(stage,finish)
 } else if(id==="unscramble"){
  const scr=shuffled(item.term.split("")).join("");stage.innerHTML=gameShell("Word Unscramble",scr,`<input id="gameInput"><button id="gameCheck">Check</button>`);$("#gameCheck").onclick=()=>finish($("#gameInput").value.trim().toLowerCase()===item.term.toLowerCase())
 } else if(id==="recall-sprint"){
  const targets=bank.slice(0,5).map(x=>x.term.toLowerCase());stage.innerHTML=gameShell("Recall Sprint","Type five words you remember from the learning bank.",`<textarea id="gameInput"></textarea><button id="gameCheck">Score</button>`);$("#gameCheck").onclick=()=>{const words=$("#gameInput").value.toLowerCase().split(/[,\n\s]+/);finish(targets.filter(x=>words.includes(x)).length>=3)}
 }

}
function gameShell(title,prompt,controls){return `<section class="card gameStageCard"><div class="eyebrow">GAME</div><h2>${esc(title)}</h2><p class="gamePrompt">${prompt}</p><div class="gameControls">${controls}</div><div class="gameFeedback"></div></section>`}
function bindAnswers(stage,finish){stage.querySelectorAll("[data-answer]").forEach(b=>b.onclick=()=>finish(b.dataset.answer==="true"))}

/* ---------- ADMIN OPERATIONS FAILSAFE ---------- */
const opRoutes={
 "course-new":"content-v12","course-edit":"content-v12","course-duplicate":"content-v12","course-archive":"content-v12",
 "unit-new":"content-v12","lesson-new":"content-v12","set-new":"content-v12","activity-new":"content-v12","item-new":"content-v12",
 "content-edit":"content-v12","content-bulk":"content-v12","content-move":"content-v12","content-clone":"content-v12","content-delete":"content-v12","content-validate":"content-v12",
 "media-add":"content-v12","media-image":"content-v12","media-audio":"content-v12","media-video":"content-v12","media-link":"content-v12","media-meta":"content-v12","media-transcript":"content-v12","media-alt":"content-v12","media-remove":"content-v12",
 "deck-new":"practice-v10","deck-import":"practice-v10","deck-export":"practice-v10","card-new":"practice-v10","card-bulk":"practice-v10","card-edit":"practice-v10","card-delete":"practice-v10","srs-reset":"practice-v10","mistakes-open":"practice-v10","games-open":"games-extra",
 "test-new":"assessment-v11","question-new":"assessment-v11","test-edit":"assessment-v11","test-duplicate":"assessment-v11","test-run":"assessment-v11","evidence-open":"assessment-v11","rubric-new":"assessment-v11","assessment-export":"assessment-v11",
 "draft-validate":"content-v12","queue-open":"content-v12","review-mark":"content-v12","review-return":"content-v12","publication-export":"content-v12","canonical-inspect":"canonical",
 "users-open":"access-control","user-new":"access-control","progress-open":"progress","plan-open":"plans","research-open":"research","adaptive-open":"adaptive-v13","history-open":"learning-studio","academy-open":"academy",
 "search-open":"adaptive-v13","data-open":"data","qa-open":"adaptive-v13","theme-open":"settings","password-change":"password"
};
function clickDataView(id){const b=document.querySelector(`[data-view="${CSS.escape(id)}"]`);if(b){b.click();return true}return false}
function operationWorkspace(op,label){
 if(op==="access-control"||["users-open","user-new"].includes(op))return accessControlView();
 if(op==="games-open")return gamesView();
 if(op==="plan-open")return clickDataView("plans");
 if(op==="research-open")return clickDataView("research");
 if(op==="progress-open")return clickDataView("progress");
 if(op==="academy-open")return clickDataView("academy");
 if(op==="theme-open")return clickDataView("settings");
 if(op==="data-open")return clickDataView("data");
 if(op==="password-change"){const b=$("#changePass")||$("#userAdminChangePassword");if(b){b.click();return}}
 const target=opRoutes[op];
 if(target&&clickDataView(target))return;
 modal(label||"Admin Operation",`<div class="feedback ok">The operation is available. Use this workspace to complete it without losing the Admin context.</div><div class="wsFormGrid">${textField("opTitle","Title / identifier","")}${areaField("opNotes","Operation notes","")}</div>`,`<button class="primary" id="opComplete">Complete Operation</button>`);
 $("#opComplete").onclick=()=>{const w=workspace();w.adminLog=w.adminLog||[];w.adminLog.push({id:uid("op"),op,label,title:$("#opTitle").value,notes:$("#opNotes").value,at:now(),admin:currentUserId()});saveW(w);closeModal();alert("Operation recorded.")}
}
function installAdminOperationFailsafe(){
 document.addEventListener("click",e=>{
  const b=e.target.closest(".adminOpBtn");if(!b)return;
  e.preventDefault();e.stopImmediatePropagation();
  operationWorkspace(b.dataset.op,b.textContent.trim())
 },true)
}


function enforceLoginIntent(){
 const intent=sessionStorage.getItem("tina.v14.login.intent"),s=session();
 if(!intent||!s)return true;
 sessionStorage.removeItem("tina.v14.login.intent");
 if(intent==="teacher"&&s.role!=="teacher"&&s.role!=="admin"){
   setUserSession(null);setActiveUser("");
   alert("This account is not assigned the Teacher role. Ask an administrator to change the role.");
   openRoleEntry();return false;
 }
 if(intent==="business"&&s.role!=="business"&&s.role!=="admin"&&s.role!=="superadmin"){
   setUserSession(null);setActiveUser("");
   alert("This account is not assigned the Business role. Ask an administrator to change the role.");
   openRoleEntry();return false;
 }
 if(intent==="superadmin"&&s.role!=="superadmin"){
   setUserSession(null);setActiveUser("");
   alert("This account is not assigned the Superadmin role.");
   openRoleEntry();return false;
 }
 return true;
}

/* ---------- RESPONSIVE APP ---------- */
function installMobileNav(){
 let bar=$("#mobileAppBar");if(!bar){bar=document.createElement("nav");bar.id="mobileAppBar";bar.className="mobileAppBar";document.body.appendChild(bar)}
 const entries=[["home","Home"],["catalog","Catalog"],["learn","Learn"],["progress","Progress"],["profile-extra","Profile"]];
 bar.innerHTML=entries.map(([id,l])=>`<button data-mobile="${id}">${esc(l)}</button>`).join("");
 $$("[data-mobile]").forEach(b=>b.onclick=()=>{if(b.dataset.mobile==="profile-extra")profileView();else clickDataView(b.dataset.mobile)})
}

/* ---------- PAGE AUGMENTATION ---------- */
function appendSection(id,html){
 if($("#"+id))return;const host=$("#app .wrap")||$("#app");if(!host)return;
 const s=document.createElement("section");s.id=id;s.className="workspaceInjected";s.innerHTML=html;host.appendChild(s)
}
function augmentView(view){
 if(view==="plans"){appendSection("studyPlanWorkspace",'<div></div>');renderStudyPlanWorkspace()}
 if(view==="research"){appendSection("researchWorkspace",'<div></div>');renderResearchWorkspace()}
 if(view==="review")appendSection("reviewTools",`<div class="workspaceToolCard"><div class="sectionHead"><div><div class="eyebrow">REVIEW TOOLKIT</div><h3>Quick review tools</h3></div></div><div class="builderToolbar"><button id="reviewToGames">Practice mistakes as games</button><button id="reviewToPlan">Create review plan</button><button id="reviewExport">Export review evidence</button></div></div>`);
 if(view==="progress")appendSection("progressTools",`<div class="workspaceToolCard"><div class="sectionHead"><div><div class="eyebrow">PROGRESS TOOLKIT</div><h3>Goals & evidence</h3></div></div><div class="builderToolbar"><button id="progressProfile">Learning Profile</button><button id="progressExport">Export learning snapshot</button><button id="progressTeacher">Teacher view</button></div></div>`);
 $("#reviewToGames")?.addEventListener("click",gamesView);$("#reviewToPlan")?.addEventListener("click",()=>{clickDataView("plans");setTimeout(()=>$("#spNew")?.click(),80)});$("#reviewExport")?.addEventListener("click",()=>download("tina-review-workspace.json",JSON.stringify({base:base(),workspace:workspace()},null,2)));
 $("#progressProfile")?.addEventListener("click",profileView);$("#progressExport")?.addEventListener("click",()=>download("tina-learning-snapshot.json",JSON.stringify({profile:profile(),base:base(),workspace:workspace()},null,2)));$("#progressTeacher")?.addEventListener("click",teacherView)
 installRoleButtons()
}
function refreshCurrentEnhancements(){
 const evt={detail:{view:base().view||document.querySelector(".navbtn.active")?.dataset.view||""}};setTimeout(()=>augmentView(evt.detail.view),20)
}
function installRoleButtons(){
 const s=session();if(!s&&!isAdmin())return;
 const pb=routeButton("profile","Profile");pb.onclick=profileView;
 if(role()==="teacher"||isAdmin()){const tb=routeButton("teacher","Teacher");tb.onclick=teacherView}
 if(isAdmin()){const ab=routeButton("access","Access Control");ab.onclick=accessControlView}
 const gb=routeButton("games","Games +10");gb.onclick=gamesView;
}
function enforceLevelCatalog(){
 document.addEventListener("click",e=>{
  const b=e.target.closest("[data-select-level]");if(!b)return;
  const level=b.dataset.selectLevel;
  if(!canLevel(level)){e.preventDefault();e.stopImmediatePropagation();alert("Your account does not have access to this level.");}
 },true)
}


/* ---------- TINA LIBRARY ---------- */
function libraryItems(){const w=workspace();w.library=Array.isArray(w.library)?w.library:[];saveW(w);return w.library}
function canSeeLibraryItem(item){
 if(isAdmin())return true;
 if(item.visibility==="public")return true;
 const r=role();
 return (item.allowedRoles||[]).includes(r)||(item.allowedUsers||[]).includes(currentUserId());
}
function libraryView(){
 const items=libraryItems().filter(canSeeLibraryItem);
 const canManage=isAdmin();
 show(`<div class="sectionHead"><div><div class="eyebrow">TINA LIBRARY</div><h2>Books, textbooks & learning resources</h2><p class="muted">A cross-disciplinary personal knowledge library.</p></div>${canManage?'<button class="primary" id="libraryNew">+ Add Resource</button>':""}</div>
 <div class="libraryToolbar"><input id="librarySearch" placeholder="Search title, author, field..."><select id="libraryTypeFilter"><option value="">All types</option><option>Book</option><option>Textbook</option><option>Course</option><option>Paper</option><option>Website</option><option>Video</option><option>Other</option></select><select id="libraryFieldFilter"><option value="">All fields</option></select></div>
 <section id="libraryGrid" class="libraryGrid"></section>`);
 const fields=[...new Set(items.map(x=>x.field).filter(Boolean))].sort();
 $("#libraryFieldFilter").innerHTML='<option value="">All fields</option>'+fields.map(x=>`<option>${esc(x)}</option>`).join("");
 const render=()=>{
  const q=$("#librarySearch").value.toLowerCase(),type=$("#libraryTypeFilter").value,field=$("#libraryFieldFilter").value;
  const filtered=items.filter(x=>(!q||[x.title,x.author,x.field,x.tags?.join(" "),x.notes].join(" ").toLowerCase().includes(q))&&(!type||x.type===type)&&(!field||x.field===field));
  $("#libraryGrid").innerHTML=filtered.length?filtered.map(x=>`<article class="card libraryCard"><div class="libraryTop"><span class="libraryType">${esc(x.type||"Resource")}</span><span class="libraryVisibility ${x.visibility==="public"?"public":"private"}">${x.visibility==="public"?"Public":"Private"}</span></div><h3>${esc(x.title)}</h3><p class="muted">${esc(x.author||"")}${x.author&&x.field?" · ":""}${esc(x.field||"")}</p><p>${esc(x.notes||"")}</p><div class="tagRow">${(x.tags||[]).map(t=>`<span>${esc(t)}</span>`).join("")}</div><div class="actions">${x.url?`<button data-lib-open="${x.id}">Open</button>`:""}${canManage?`<button data-lib-edit="${x.id}">Edit</button><button data-lib-delete="${x.id}">Delete</button>`:""}</div></article>`).join(""):'<div class="empty">No library resources match this view.</div>';
  $$("[data-lib-open]").forEach(b=>b.onclick=()=>{const x=libraryItems().find(v=>v.id===b.dataset.libOpen);if(x?.url)window.open(x.url,"_blank","noopener")});
  $$("[data-lib-edit]").forEach(b=>b.onclick=()=>openLibraryEditor(b.dataset.libEdit));
  $$("[data-lib-delete]").forEach(b=>b.onclick=()=>{if(!confirm("Delete this library resource?"))return;const w=workspace();w.library=w.library.filter(x=>x.id!==b.dataset.libDelete);saveW(w);libraryView()});
 };
 $("#librarySearch").oninput=render;$("#libraryTypeFilter").onchange=render;$("#libraryFieldFilter").onchange=render;render();
 $("#libraryNew")?.addEventListener("click",()=>openLibraryEditor())
}
function openLibraryEditor(id=null){
 if(!isAdmin())return;
 const w=workspace();w.library=Array.isArray(w.library)?w.library:[];const old=id?w.library.find(x=>x.id===id):{};
 modal(id?"Edit Library Resource":"Add Library Resource",`<div class="wsFormGrid">${textField("libTitle","Title",old.title||"")}${textField("libAuthor","Author / organisation",old.author||"")}${selectField("libType","Resource type",["Book","Textbook","Course","Paper","Website","Video","Other"],old.type||"Book")}${textField("libField","Field / discipline",old.field||"")}${textField("libUrl","URL / link",old.url||"","url")}${textField("libTags","Tags",(old.tags||[]).join(", "))}${selectField("libVisibility","Visibility",["private","public"],old.visibility||"private")}${areaField("libNotes","Notes",old.notes||"")}</div>
 <div class="accessChecks"><h4>Private access by role</h4>${["learner","teacher","editor","reviewer"].map(r=>`<label><input type="checkbox" data-lib-role="${r}" ${(old.allowedRoles||[]).includes(r)?"checked":""}> ${r}</label>`).join("")}</div>`,`<button class="primary" id="libSave">Save Resource</button>`);
 $("#libSave").onclick=()=>{const rec={...old,id:old.id||uid("lib"),title:$("#libTitle").value||"Untitled Resource",author:$("#libAuthor").value,type:$("#libType").value,field:$("#libField").value,url:$("#libUrl").value,tags:$("#libTags").value.split(",").map(x=>x.trim()).filter(Boolean),visibility:$("#libVisibility").value,allowedRoles:$$("[data-lib-role]:checked").map(x=>x.dataset.libRole),allowedUsers:old.allowedUsers||[],notes:$("#libNotes").value,updatedAt:now(),createdAt:old.createdAt||now()};if(id)w.library[w.library.findIndex(x=>x.id===id)]=rec;else w.library.push(rec);saveW(w);closeModal();libraryView()}
}

/* ---------- ROLE-BASED LOGIN ENTRY ---------- */
function roleEntryView(){
 const g=authGovernance();
 const defs=[
  ["learner","student","🎓","Student","Learning, practice, competition and progress"],
  ["teacher","teacher","🧑‍🏫","Teacher","Classes, assignments, grading and learner progress"],
  ["business","business","🏢","Business","Organization programs, members, teachers and reports"],
  ["admin","admin","🛡️","Administrator","Operational administration within assigned permissions"],
  ["superadmin","superadmin","👑","Superadmin","Owner governance, Canon, organizations and infrastructure"]
 ];
 const visible=defs.filter(([r])=>g.login?.[r]);
 return `<div class="wrap roleEntryWrap loginRestoreWrap">
  <section class="card roleEntryCard loginRestoreCard">
   <div class="loginRestoreBrand">TINA</div>
   <div class="eyebrow">TINA LEARNING PLATFORM</div>
   <h1>Choose your login</h1>
   <p class="guestGateLead">Select the workspace that matches your role.</p>

   <div class="loginRestoreList">
    ${visible.map(([r,cls,ico,title,desc])=>`
     <button class="loginRestoreRow ${cls}" data-role-login="${r}" type="button">
      <span class="loginRestoreIcon">${ico}</span>
      <span class="loginRestoreCopy"><b>${title}</b><small>${desc}</small></span>
      <span class="loginRestoreArrow">›</span>
     </button>`).join("") || '<div class="feedback bad">All login portals are currently disabled by Superadmin.</div>'}
   </div>

   <div class="loginRestoreFooter">
    <span>Access is controlled by Superadmin.</span>
    <small>Unauthorized registration is disabled.</small>
   </div>
  </section>
 </div>`;
}
function openRoleEntry(){
 if(session())return roleLandingView();
 $("#app").innerHTML=roleEntryView();
 const openManagedRole=(r)=>{
   sessionStorage.setItem("tina.v14.login.intent",r);
   if(r==="superadmin")return superadminLoginPortal();
   const open=()=>{if(r==="admin")window.TinaAuth?.openAdmin?.();else window.TinaAuth?.openUserLogin?.()};
   if(window.TinaAuth)return open();
   const once=()=>{window.removeEventListener("tina:auth-ready",once);open()};
   window.addEventListener("tina:auth-ready",once,{once:true});
 };
 $$("[data-role-login]").forEach(b=>b.onclick=()=>openManagedRole(b.dataset.roleLogin));
 hideBaseNavForGuest();
 document.documentElement.classList.add("authSurfaceActive");
 installSuperadminEntryLink();
}
function hideBaseNavForGuest(){
 if(session()||isAdmin())return;
 $("#nav")?.classList.add("roleNavHidden");
 $$(".navbtn").forEach(b=>b.style.display="none");
}


/* ---------- FIRST-SCREEN ROLE LOGIN GATE ---------- */
function forceRoleLoginGate(){
 if(session()||isAdmin())return;
 sessionStorage.removeItem("tina.v14.login.intent");
 requestAnimationFrame(()=>{if(!session()&&!isAdmin())openRoleEntry()});
}

/* ---------- ROLE-BASED GROUPED NAVIGATION ---------- */
const ROLE_MENUS={
 learner:[
  ["Learning",[["Home","home"],["Catalog","catalog"],["Games","games-extra"],["Tina Library","library-extra"]]],
  ["Organize",[["Study Plans","plans"],["Research","research"]]],
  ["Progress",[["Review","review"],["Progress","progress"],["Profile","profile-extra"]]],
  ["Community",[["Leaderboard","leaderboard-extra"],["Achievements","achievements-extra"]]],
  ["Account",[["Settings","settings"]]]
 ],
 teacher:[
  ["Teaching",[["Dashboard","teacher-dashboard-extra"],["Classes","teacher-classes-extra"],["Assignments","teacher-assignments-extra"],["Grading","teacher-grading-extra"],["Learner Progress","teacher-progress-extra"],["Shadowing Insights","shadowing-insights-extra"]]],
  ["Learning",[["Home","home"],["Catalog","catalog"],["Games","games-extra"]]],
  ["Resources",[["Tina Library","library-extra"],["Research","research"],["Study Plans","plans"]]],
  ["Progress",[["Review","review"],["Progress","progress"],["Profile","profile-extra"]]],
  ["Account",[["Settings","settings"]]]
 ],
 business:[
  ["Organization",[["Dashboard","business-dashboard-extra"],["Programs","business-programs-extra"],["Members","business-members-extra"],["Teachers","business-teachers-extra"],["Reports","business-reports-extra"]]],
  ["Resources",[["Tina Dictionary","dictionary-extra"],["Tina Library","library-extra"]]],
  ["Account",[["Account Center","account-extra"],["Profile","profile-extra"],["Settings","settings"]]]
 ],
 editor:[
  ["Learning",[["Home","home"],["Catalog","catalog"]]],
  ["Content",[["Tina Library","library-extra"],["Research","research"],["Study Plans","plans"]]],
  ["Progress",[["Review","review"],["Progress","progress"],["Profile","profile-extra"]]],
  ["Account",[["Settings","settings"]]]
 ],
 reviewer:[
  ["Learning",[["Home","home"],["Catalog","catalog"]]],
  ["Review",[["Review","review"],["Progress","progress"]]],
  ["Resources",[["Tina Library","library-extra"],["Research","research"]]],
  ["Account",[["Profile","profile-extra"],["Settings","settings"]]]
 ],
 superadmin:[
  ["System Control",[["Superadmin Dashboard","superadmin-extra"],["Learning Intelligence","learning-intelligence-extra"],["Governance Map","governance-map-extra"],["Data Standards","data-standards-extra"],["Role Permission Matrix","role-matrix-extra"],["Role Guides","role-guides-extra"],["Authentication Gates","auth-gates-extra"],["Security Readiness","security-readiness-extra"],["System Health","health-extra"],["System QA & Reliability","system-qa-extra"],["System Administration","system-admin-extra"],["Activity History","history-extra"],["Users & Roles","roles-extra"],["Users & Access","access-extra"],["User Permissions","permissions-extra"],["Business Organizations","organizations-extra"]]],
  ["Content Governance",[["Tina Academy","academy"],["Authoring Hub","author"],["Content Studio","content-v12"],["Editing Studio","editing-extra"],["Data Manager","data"]]],
  ["Learning Systems",[["Catalog","catalog"],["Active Learning","learn"],["Tina Shadowing","shadowing-extra"],["Practice","practice-v10"],["Assessment","assessment-v11"],["Adaptive","adaptive-v13"],["Teacher Workspace","teacher-extra"]]],
  ["Knowledge & Resources",[["Tina Library","library-extra"],["Research","research"],["Study Plans","plans"]]],
  ["Infrastructure",[["Infrastructure Overview","infrastructure-extra"],["Backend Migration","backend-extra"],["Canonical Creation","canon-create-extra"],["Canonical Data","canonical"],["Learning Core","core"],["Theme Studio","themes-extra"],["Settings","settings"],["System Backup","superadmin-extra"]]]
 ],
 admin:[
  ["Administration",[["Admin Dashboard","admin-v14"],["Editing Studio","editing-extra"],["Users & Roles","roles-extra"],["Teacher Workspace","teacher-extra"]]],
  ["Content",[["Authoring Hub","author"],["Content Studio","content-v12"],["Data Manager","data"]]],
  ["Learning",[["Catalog","catalog"],["Practice","practice-v10"],["Assessment","assessment-v11"],["Adaptive","adaptive-v13"]]],
  ["Resources",[["Tina Library","library-extra"],["Research","research"],["Study Plans","plans"]]],
  ["System",[["Learning Core","core"],["Settings","settings"]]]
 ]
};
function roleMenuView(){
 const r=role(),groups=ROLE_MENUS[r]||ROLE_MENUS.learner;
 return groups.map(([heading,items])=>`<div class="roleMenuGroup"><button class="roleMenuHeading" type="button"><span>${esc(heading)}</span><span class="roleMenuChevron">▾</span></button><div class="roleMenuDropdown">${items.map(([label,target])=>`<button class="roleMenuItem" data-role-target="${esc(target)}">${esc(label)}</button>`).join("")}</div></div>`).join("");
}
function installRoleGroupedNav(){
 if(!session()&&!isAdmin()){openRoleEntry();return}const header=document.querySelector(".topbar");if(!header)return;
 header.querySelectorAll(".roleMenuGroups,.roleMenuGroup,.roleMenuHeading,.roleNavMobileToggle,.groupedNav,.groupNav,.topGroupedNav").forEach(x=>x.remove());
 $("#nav")?.classList.add("roleNavHidden");$("#nav")?.setAttribute("aria-hidden","true");
 let shell=$("#roleGroupedNav");if(!shell){shell=document.createElement("div");shell.id="roleGroupedNav";header.appendChild(shell)}shell.className="roleGroupedNav roleHeaderActions";shell.innerHTML=`<span class="compactRoleBadge">${esc(role()==="learner"?"Student":role()==="admin"?"Administrator":role()==="superadmin"?"Superadmin":roleLabel(role()))}</span>`;
 $("#roleNavBackdrop")?.remove();document.documentElement.classList.remove("role-mobile-menu-open");installAccountChip();enforceAdminOnlyDataEditing()
}

/* ---------- EXPLICIT TEACHER ROLE MANAGEMENT ---------- */
const ASSIGNABLE_ROLES=[
 ["learner","Student"],["teacher","Teacher"],["business","Business"],["editor","Editor"],["reviewer","Reviewer"],["admin","Administrator"],["superadmin","Superadmin"]
];
function userRoles(u){return Array.isArray(u.roles)&&u.roles.length?u.roles:[u.role||"learner"]}
function roleAccessSummary(u){
 const roles=userRoles(u);
 if(roles.includes("superadmin"))return "All platform scopes";
 if(roles.includes("admin"))return "Administrative scopes";
 if(roles.includes("learner")||roles.includes("teacher")){const a=userAccess(u.id);return `${(a.levels||[]).length}/${LEVELS.length} English levels`}
 if(roles.includes("business"))return "B2B programs & resources";
 return "Feature permissions"
}
function openAccountEditor(id){
 const s=userStore(),u=s.users.find(x=>x.id===id);if(!u)return;
 const targetRoles=userRoles(u),superMode=isSuperadmin();
 if(!superMode&&targetRoles.some(r=>(ROLE_AUTHORITY_RANK[r]||0)>=ROLE_AUTHORITY_RANK.admin))return alert("Administrator cannot edit Administrator or Superadmin accounts.");
 modal("Edit Account",`<div class="wsFormGrid">${textField("editUserName","Full name",u.name||"")}${textField("editUserEmail","Email / username",u.email||"")}<label class="wsField"><span>Status</span><select id="editUserStatus">${accountStatusOptions(u.status||"pending_activation")}</select></label>${superMode?textField("editUserPassword","New password (optional)","","password"):""}</div><p class="muted">${superMode?"Leave password blank to keep the current credential.":"Credential and password management is Superadmin-only."}</p>`,`<button class="primary" id="editUserSave">Save Account</button>`);
 $("#editUserSave").onclick=async()=>{const name=$("#editUserName").value.trim(),email=$("#editUserEmail").value.trim().toLowerCase(),status=$("#editUserStatus").value;if(!name||!email)return alert("Name and email/username are required.");if(s.users.some(x=>x.id!==u.id&&(x.email||"").toLowerCase()===email))return alert("That email/username already exists.");u.name=name;u.email=email;u.status=status;u.updatedAt=now();if(superMode){const p=$("#editUserPassword")?.value||"";if(p){if(p.length<8)return alert("New password must contain at least 8 characters.");u.passwordHash=await roleHashPassword(p)}}saveUsers(s);auditEvent("user.edited",{targetUserId:u.id,credentialChanged:false});closeModal();roleManagementView()}
}
function saveUserRoles(id){
 const s=userStore(),u=s.users.find(x=>x.id===id);if(!u)return;
 if(!isSuperadmin()&&userRoles(u).includes("superadmin"))return alert("Administrator cannot modify a Superadmin account.");
 const selected=$$(`[data-role-check="${id}"]:checked`).map(x=>x.value);
 if(!selected.length)return alert("Assign at least one role.");
 if(selected.includes("superadmin")&&!isSuperadmin())return alert("Only Superadmin can assign the Superadmin role.");
 if(!selected.every(canAssignSystemRole))return alert("One or more selected roles exceed your authority.");
 u.roles=[...new Set(selected)];
 const primary=$(`[data-primary-role="${id}"]`)?.value;
 u.primaryRole=u.roles.includes(primary)?primary:u.roles[0];u.role=u.primaryRole;u.status=$(`[data-status-select="${id}"]`)?.value||u.status;u.updatedAt=now();
 saveUsers(s);
 const w=workspace(),a=normalizedAccessForUser(u),defaults=[...new Set(u.roles.flatMap(defaultPermissionsForRole))];
 a.permissions=defaults;a.routes=defaults;if(u.roles.includes("admin")||u.roles.includes("superadmin"))a.levels=[...LEVELS];w.access[id]=a;saveW(w);
 auditEvent("role.multi.change",{targetUserId:id,roles:u.roles,primaryRole:u.primaryRole});roleManagementView()
}


const ACCOUNT_STATUS_DEFS=Object.freeze([
 {id:"pending_activation",label:"Pending activation",vi:"Chưa kích hoạt",login:false,operational:false,description:"Account exists but activation/initial approval is not complete."},
 {id:"active",label:"Active",vi:"Đang hoạt động",login:true,operational:true,description:"Account may authenticate and use its assigned role/permissions."},
 {id:"inactive",label:"Inactive",vi:"Chưa hoạt động",login:false,operational:false,description:"Valid account intentionally not operating; data is retained."},
 {id:"suspended",label:"Suspended",vi:"Tạm ngưng",login:false,operational:false,description:"Access temporarily blocked by governance action."},
 {id:"locked",label:"Locked",vi:"Bị khóa",login:false,operational:false,description:"Security lock; access remains blocked until Superadmin resolves it."},
 {id:"archived",label:"Archived",vi:"Lưu trữ",login:false,operational:false,description:"Historical account retained for audit/reference and not usable for login."}
]);
const ACCOUNT_STATUS_IDS=ACCOUNT_STATUS_DEFS.map(x=>x.id);
function accountStatusDef(v){return ACCOUNT_STATUS_DEFS.find(x=>x.id===v)||ACCOUNT_STATUS_DEFS.find(x=>x.id==="pending_activation")}
function accountCanAuthenticate(u){return accountStatusDef(u?.status).login===true}
function accountIsOperational(u){return accountStatusDef(u?.status).operational===true}
function accountStatusOptions(selected="active"){return ACCOUNT_STATUS_DEFS.map(x=>`<option value="${x.id}" ${x.id===selected?"selected":""}>${esc(x.label)} — ${esc(x.vi)}</option>`).join("")}

const ROLE_AUTHORITY_RANK={learner:10,reviewer:20,editor:30,teacher:40,business:50,admin:80,superadmin:100};
function canAssignSystemRole(targetRole){
 if(isSuperadmin())return true;
 const actor=role();return actor==="admin"&&hasPermission("roles-lower")&&(ROLE_AUTHORITY_RANK[targetRole]||0)<ROLE_AUTHORITY_RANK.admin
}
function isLastActiveSuperadmin(target){
 const users=userStore().users.filter(u=>accountIsOperational(u)&&userRoles(u).includes("superadmin"));
 return userRoles(target).includes("superadmin")&&users.length<=1
}
function canDeleteManagedUser(target){
 if(!target||target.id===currentUserId())return false;
 const actor=role();
 if(isSuperadmin())return !isLastActiveSuperadmin(target);
 if(actor==="admin")return false;
 if(!hasPermission("user-delete-lower"))return false;
 const tr=userRoles(target);
 if(tr.some(r=>["admin","superadmin","editor","reviewer"].includes(r)))return false;
 if(actor==="business"){
   const org=businessOrgContext?.();
   return !!org&&(org.memberIds||[]).includes(target.id)&&tr.every(r=>["learner","teacher","business"].includes(r));
 }
 if(actor==="teacher"){
   const t=workspace().teacher||{},learnerIds=new Set((t.classes||[]).flatMap(c=>c.members||[]));
   return tr.every(r=>r==="learner")&&learnerIds.has(target.id);
 }
 return false
}
function deleteManagedUserAccount(id,returnView=roleManagementView){
 const s=userStore(),u=s.users.find(x=>x.id===id);if(!u)return;
 if(!canDeleteManagedUser(u))return alert("Your role does not have permission to delete this account.");
 if(!confirm(`Permanently delete ${u.name||u.email}? This action is audited.`))return;
 s.users=s.users.filter(x=>x.id!==id);saveUsers(s);
 const w=workspace();delete w.access[id];
 (w.organizations||[]).forEach(o=>{o.memberIds=(o.memberIds||[]).filter(x=>x!==id);o.teacherIds=(o.teacherIds||[]).filter(x=>x!==id);o.businessAccountIds=(o.businessAccountIds||[]).filter(x=>x!==id);if(o.memberPermissions)delete o.memberPermissions[id]});
 (w.teacher?.classes||[]).forEach(c=>c.members=(c.members||[]).filter(x=>x!==id));
 saveW(w);auditEvent("user.deleted",{targetUserId:id,targetRoles:userRoles(u),byRole:role()});
 returnView()
}

function roleManagementView(){
 if(!isAdmin())return;
 const store=userStore(),superMode=isSuperadmin(),visibleRoles=superMode?ASSIGNABLE_ROLES:ASSIGNABLE_ROLES.filter(([r])=>(ROLE_AUTHORITY_RANK[r]||0)<ROLE_AUTHORITY_RANK.admin),users=superMode?store.users:store.users.filter(u=>userRoles(u).every(r=>(ROLE_AUTHORITY_RANK[r]||0)<ROLE_AUTHORITY_RANK.admin));
 show(`<div class="sectionHead"><div><div class="eyebrow">${superMode?"SUPERADMIN":"ADMIN"} · USERS & ROLES</div><h2>${superMode?"Users, Roles & Permissions":"Lower-Role Account Management"}</h2><p class="muted">${superMode?"System-owner role governance.":"Administrator can create/edit accounts and assign roles only below Administrator. Passwords, Administrator accounts, Superadmin accounts and sensitive permissions are excluded."}</p></div><div class="actions"><button class="primary" id="newTeacherAccount">+ Teacher</button><button id="newStudentAccount">+ Student</button><button id="newBusinessAccount">+ Business</button>${superMode?'<button id="newAdminAccount">+ Administrator</button>':""}</div></div><section class="roleAdminList">${users.map(u=>{const roles=userRoles(u);return `<article class="card roleAdminCard"><div class="roleAdminUser"><div><h3>${esc(u.name||"Unnamed")}</h3><p>${esc(u.email||"")}</p></div><label class="compactField"><span>Status</span><select data-status-select="${u.id}">${accountStatusOptions(u.status||"pending_activation")}</select></label></div><div class="roleAdminSection"><h4>Assigned roles</h4><div class="roleCheckGrid">${visibleRoles.map(([r,label])=>`<label><input type="checkbox" data-role-check="${u.id}" value="${r}" ${roles.includes(r)?"checked":""}> <span>${esc(label)}</span></label>`).join("")}</div></div><div class="roleAdminMeta"><label class="compactField"><span>Default role</span><select data-primary-role="${u.id}">${roles.filter(r=>superMode||(ROLE_AUTHORITY_RANK[r]||0)<ROLE_AUTHORITY_RANK.admin).map(r=>`<option value="${r}" ${r===(u.primaryRole||u.role)?"selected":""}>${esc(r==="learner"?"Student":r.charAt(0).toUpperCase()+r.slice(1))}</option>`).join("")}</select></label><div><span class="metaLabel">Access model</span><b>${esc(roleAccessSummary(u))}</b></div></div><div class="roleAdminActions"><button class="primary" data-role-save="${u.id}">Save Roles</button><button data-user-edit="${u.id}">Edit Account</button>${superMode?`<button data-role-access="${u.id}">Permissions</button><button data-user-history="${u.id}">Activity</button>`:""}${canDeleteManagedUser(u)?`<button class="dangerAction" data-user-delete="${u.id}">Delete</button>`:""}</div></article>`}).join("")||'<div class="empty">No accounts are within this role’s management scope.</div>'}</section>`);
 $("#newTeacherAccount").onclick=()=>openRoleAccountCreator("teacher");$("#newStudentAccount").onclick=()=>openRoleAccountCreator("learner");$("#newBusinessAccount").onclick=()=>openRoleAccountCreator("business");$("#newAdminAccount")?.addEventListener("click",()=>openRoleAccountCreator("admin"));
 $$("[data-role-save]").forEach(b=>b.onclick=()=>saveUserRoles(b.dataset.roleSave));$$("[data-user-edit]").forEach(b=>b.onclick=()=>openAccountEditor(b.dataset.userEdit));$$("[data-role-access]").forEach(b=>b.onclick=()=>userPermissionMatrixView(b.dataset.roleAccess));$$("[data-user-history]").forEach(b=>b.onclick=()=>activityHistoryView(b.dataset.userHistory));$$("[data-user-delete]").forEach(b=>b.onclick=()=>deleteManagedUserAccount(b.dataset.userDelete,roleManagementView))
}
async function roleHashPassword(p){
 const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(p));
 return [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
function openRoleAccountCreator(defaultRole="teacher"){
 const options=isSuperadmin()?["teacher","learner","business","editor","reviewer","admin","superadmin"]:["teacher","learner","business","editor","reviewer"];
 if(!options.includes(defaultRole))defaultRole="learner";
 const title=defaultRole==="teacher"?"Create Teacher Account":defaultRole==="business"?"Create Business Account":defaultRole==="admin"?"Create Administrator Account":defaultRole==="superadmin"?"Create Superadmin Account":"Create Student Account";
 modal(title,`<div class="wsFormGrid">${textField("roleNewName","Full name","")}${textField("roleNewEmail","Email / username","")}${selectField("roleNewRole","Role",options,defaultRole)}${textField("roleNewPassword","Temporary password","","password")}</div><p class="muted">${isSuperadmin()?"Superadmin may create any system role.":"Administrator may create non-Superadmin accounts only."}</p>`,`<button class="primary" id="roleNewSave">Create Account</button>`);
 $("#roleNewSave").onclick=async()=>{const name=$("#roleNewName").value.trim(),email=$("#roleNewEmail").value.trim().toLowerCase(),r=$("#roleNewRole").value,p=$("#roleNewPassword").value;if(!name||!email||p.length<8)return alert("Name, email/username and a password of at least 8 characters are required.");if(!canAssignSystemRole(r))return alert("This role exceeds your authority.");const s=userStore();if(s.users.some(x=>(x.email||"").toLowerCase()===email))return alert("This email/username already exists.");const rec={id:uid("usr"),name,email,role:r,roles:[r],primaryRole:r,status:"pending_activation",passwordHash:await roleHashPassword(p),createdAt:now(),updatedAt:now()};s.users.push(rec);saveUsers(s);const w=workspace();w.access[rec.id]={enabled:true,levels:[...LEVELS],routes:defaultPermissionsForRole(r),permissions:defaultPermissionsForRole(r)};saveW(w);auditEvent("user.created",{targetUserId:rec.id,role:r});closeModal();roleManagementView()}
}


/* ---------- SUPERADMIN SYSTEM HEALTH / REPORTS / ALERTS ---------- */
const SYS_ALERT_KEY="tina.v14.superadmin.alerts";
function systemAlerts(){
 try{const x=JSON.parse(localStorage.getItem(SYS_ALERT_KEY)||"[]");return Array.isArray(x)?x:[]}catch{return[]}
}
function saveSystemAlerts(x){localStorage.setItem(SYS_ALERT_KEY,JSON.stringify(x.slice(-1000)))}
function systemHealthSnapshot(){
 const users=userStore().users,w=workspace(),hist=systemHistory(),alerts=systemAlerts();
 const active=users.filter(accountIsOperational).length;
 const statusCounts=Object.fromEntries(ACCOUNT_STATUS_DEFS.map(s=>[s.id,users.filter(u=>u.status===s.id).length]));
 const suspended=statusCounts.suspended||0;
 const recent=hist.filter(x=>Date.now()-new Date(x.at).getTime()<86400000).length;
 const failures=hist.filter(x=>/failed|error|blocked/i.test(x.type||"")&&Date.now()-new Date(x.at).getTime()<86400000).length;
 const superadmins=users.filter(u=>u.role==="superadmin"&&accountIsOperational(u)).length;
 const storageBytes=Object.keys(localStorage).reduce((n,k)=>n+(localStorage.getItem(k)||"").length*2,0);
 const checks=[
  {id:"auth",label:"Authentication",ok:superadmins>0,detail:`${superadmins} active Superadmin account(s)`},
  {id:"users",label:"User Accounts",ok:active>0,detail:`${active} active · ${suspended} suspended`},
  {id:"audit",label:"Audit History",ok:hist.length>0,detail:`${hist.length} recorded events · ${recent} in 24h`},
  {id:"errors",label:"Runtime Signals",ok:failures<5,detail:`${failures} failure/error signals in 24h`},
  {id:"storage",label:"Local Data Storage",ok:storageBytes<4_000_000,detail:`${Math.round(storageBytes/1024)} KB estimated local data`},
  {id:"canonical",label:"Canonical Boundary",ok:true,detail:"Browser canonical writes remain locked"}
 ];
 const score=Math.round(checks.filter(x=>x.ok).length/checks.length*100);
 const status=score>=90?"Healthy":score>=70?"Attention":"Critical";
 return {at:now(),score,status,checks,users:users.length,active,suspended,statusCounts,recent,failures,storageBytes,alerts:alerts.filter(x=>!x.resolved).length,library:(w.library||[]).length,plans:(w.plans||[]).length,research:(w.researchProjects||[]).length}
}
function generateHealthAlerts(snap){
 const a=systemAlerts(),existing=new Set(a.filter(x=>!x.resolved).map(x=>x.code));
 const add=(code,severity,title,message)=>{if(existing.has(code))return;a.push({id:uid("alert"),code,severity,title,message,createdAt:now(),resolved:false});existing.add(code)};
 if(snap.failures>=5)add("runtime-failures","high","Runtime failures elevated",`${snap.failures} failure/error signals were recorded in the last 24 hours.`);
 if(snap.suspended>0)add("suspended-users","info","Suspended accounts present",`${snap.suspended} account(s) are currently suspended.`);
 if(snap.storageBytes>=4_000_000)add("local-storage","high","Local storage is growing","Local browser data is approaching the practical storage threshold. Export a backup and plan backend persistence.");
 if(snap.alerts>=10)add("alert-backlog","medium","Alert backlog","There are many unresolved system alerts.");
 saveSystemAlerts(a);return a
}
function systemHealthView(){
 if(!isSuperadmin())return show('<div class="feedback bad">Superadmin access is required.</div>');
 let snap=systemHealthSnapshot();generateHealthAlerts(snap);snap=systemHealthSnapshot();
 const alerts=systemAlerts().filter(x=>!x.resolved).reverse();
 show(`<div class="sectionHead"><div><div class="eyebrow">SUPERADMIN · SYSTEM HEALTH</div><h2>Health, Reports & Alerts</h2><p class="muted">Operational overview for managing Tina from desktop or mobile.</p></div><div class="healthScore ${snap.status.toLowerCase()}"><b>${snap.score}</b><span>${snap.status}</span></div></div>
 <section class="healthMetrics"><article><b>${snap.active}</b><span>Active users</span></article><article><b>${snap.recent}</b><span>Events / 24h</span></article><article><b>${snap.failures}</b><span>Error signals</span></article><article><b>${snap.alerts}</b><span>Open alerts</span></article></section>
 <section class="healthLayout"><div class="card"><div class="sectionHead compact"><div><h3>System Checks</h3></div><button id="healthRefresh">Refresh</button></div><div class="healthChecks">${snap.checks.map(x=>`<div class="healthCheck ${x.ok?"ok":"bad"}"><span>${x.ok?"✓":"!"}</span><div><b>${esc(x.label)}</b><small>${esc(x.detail)}</small></div></div>`).join("")}</div></div>
 <div class="card"><div class="sectionHead compact"><div><h3>Alerts</h3></div><button id="resolveAllAlerts">Resolve all</button></div><div class="healthAlerts">${alerts.length?alerts.map(x=>`<article class="healthAlert ${esc(x.severity)}"><div><b>${esc(x.title)}</b><p>${esc(x.message)}</p><small>${esc(new Date(x.createdAt).toLocaleString())}</small></div><button data-alert-resolve="${x.id}">Resolve</button></article>`).join(""):'<div class="feedback ok">No unresolved alerts.</div>'}</div></div></section>
 <section class="card"><h3>Account Lifecycle Status</h3><div class="reportGrid">${ACCOUNT_STATUS_DEFS.map(x=>`<div><span>${esc(x.label)}</span><b>${snap.statusCounts?.[x.id]||0}</b><small>${esc(x.vi)}</small></div>`).join("")}</div></section><section class="card"><div class="sectionHead compact"><div><h3>System Report</h3><p class="muted">Snapshot suitable for operational review and export.</p></div><button class="primary" id="healthExport">Export Report</button></div>
 <div class="reportGrid"><div><span>Accounts</span><b>${snap.users}</b></div><div><span>Library resources</span><b>${snap.library}</b></div><div><span>Study plans</span><b>${snap.plans}</b></div><div><span>Research projects</span><b>${snap.research}</b></div><div><span>Storage</span><b>${Math.round(snap.storageBytes/1024)} KB</b></div><div><span>Generated</span><b>${esc(new Date(snap.at).toLocaleString())}</b></div></div></section>
 <section class="card mobileAdminQuick"><h3>Mobile Administration</h3><p class="muted">Critical Superadmin actions are kept one tap away on phones.</p><div class="mobileAdminActions"><button data-mobile-admin="users">Users</button><button data-mobile-admin="permissions">Permissions</button><button data-mobile-admin="history">Activity</button><button data-mobile-admin="academy">Academy</button><button data-mobile-admin="interfaces">Interfaces</button><button data-mobile-admin="backup">Backup</button></div></section>`);
 $("#healthRefresh").onclick=systemHealthView;$("#healthExport").onclick=()=>{auditEvent("system.health.report.exported",{score:snap.score});download(`tina-system-health-${Date.now()}.json`,JSON.stringify(snap,null,2))};
 $$("[data-alert-resolve]").forEach(b=>b.onclick=()=>{const a=systemAlerts(),x=a.find(y=>y.id===b.dataset.alertResolve);if(x){x.resolved=true;x.resolvedAt=now();saveSystemAlerts(a);auditEvent("system.alert.resolved",{alertId:x.id,code:x.code})}systemHealthView()});
 $("#resolveAllAlerts").onclick=()=>{const a=systemAlerts();a.forEach(x=>{if(!x.resolved){x.resolved=true;x.resolvedAt=now()}});saveSystemAlerts(a);auditEvent("system.alerts.resolved-all",{});systemHealthView()};
 $$("[data-mobile-admin]").forEach(b=>b.onclick=()=>{const x=b.dataset.mobileAdmin;if(x==="users")return roleManagementView();if(x==="permissions")return userPermissionMatrixView();if(x==="history")return activityHistoryView();if(x==="academy")return clickDataView("academy");if(x==="interfaces")return interfaceStudioView();if(x==="backup")return exportSuperadminBackup()})
}

/* ---------- SUPERADMIN SYSTEM GOVERNANCE ---------- */
const SYSTEM_HISTORY_KEY="tina.v14.system.activity";
const SUPERADMIN_DEFAULT_HASH="5901f07ca12ee5645a1bacd191d687220259d1bf551da6bac366609c57e12393";
function systemHistory(){
 try{const x=JSON.parse(localStorage.getItem(SYSTEM_HISTORY_KEY)||"[]");return Array.isArray(x)?x:[]}catch{return[]}
}
function saveSystemHistory(x){localStorage.setItem(SYSTEM_HISTORY_KEY,JSON.stringify(x.slice(-5000)))}
function auditEvent(type,detail={}){
 const s=session()||{},entry={id:uid("evt"),at:now(),type,userId:s.id||"system",name:s.name||s.email||"System",role:role(),view:base().view||"",detail};
 const h=systemHistory();h.push(entry);saveSystemHistory(h);window.dispatchEvent(new CustomEvent("tina:activity-recorded",{detail:entry}));
 window.TinaBackend?.telemetry?.(entry).catch(()=>{});
 return entry
}

const SYSTEM_USAGE_KEY="tina.v14.system.usage";
const USAGE_RUNTIME_KEY="tina.v14.usage.runtime";
function usageRecords(){try{const x=JSON.parse(localStorage.getItem(SYSTEM_USAGE_KEY)||"[]");return Array.isArray(x)?x:[]}catch{return[]}}
function saveUsageRecords(x){localStorage.setItem(SYSTEM_USAGE_KEY,JSON.stringify(x.slice(-20000)))}
function activeUsageRuntime(){try{return JSON.parse(sessionStorage.getItem(USAGE_RUNTIME_KEY)||"null")}catch{return null}}
function startUsageSession(){
 const s=session();if(!s)return;
 let r=activeUsageRuntime();
 if(r&&r.userId===s.id&&r.role===role())return;
 if(r)closeUsageSession("role-switch");
 r={id:uid("usage"),userId:s.id,name:s.name||s.email,role:role(),startedAt:Date.now(),lastSeenAt:Date.now(),activeMs:0,lastCommitAt:Date.now(),view:base().view||"home"};
 sessionStorage.setItem(USAGE_RUNTIME_KEY,JSON.stringify(r));
 auditEvent("usage.session.started",{usageId:r.id})
}
function touchUsage(){
 const s=session();if(!s)return;
 let r=activeUsageRuntime();if(!r||r.userId!==s.id||r.role!==role()){startUsageSession();r=activeUsageRuntime()}
 if(!r)return;
 const n=Date.now(),gap=Math.max(0,n-r.lastSeenAt);
 if(gap<=5*60*1000)r.activeMs+=gap;
 r.lastSeenAt=n;r.view=base().view||r.view;
 if(n-r.lastCommitAt>=60*1000){commitUsageRuntime(r);r.lastCommitAt=n}
 sessionStorage.setItem(USAGE_RUNTIME_KEY,JSON.stringify(r))
}
function commitUsageRuntime(r=activeUsageRuntime()){
 if(!r)return;
 const rows=usageRecords(),existing=rows.find(x=>x.id===r.id);
 const rec={id:r.id,userId:r.userId,name:r.name,role:r.role,startedAt:new Date(r.startedAt).toISOString(),lastSeenAt:new Date(r.lastSeenAt).toISOString(),activeMs:Math.max(0,Math.round(r.activeMs)),view:r.view||""};
 if(existing)Object.assign(existing,rec);else rows.push(rec);saveUsageRecords(rows);
 window.TinaBackend?.telemetry?.({id:`usage-${r.id}-${r.lastSeenAt}`,type:"usage.active",at:new Date(r.lastSeenAt).toISOString(),role:r.role,view:r.view||"",durationMs:Math.max(0,Math.round(r.activeMs)),detail:{usageId:r.id}}).catch(()=>{})
}
function closeUsageSession(reason="logout"){
 const r=activeUsageRuntime();if(!r)return;
 touchUsage();const latest=activeUsageRuntime()||r;commitUsageRuntime(latest);
 const rows=usageRecords(),rec=rows.find(x=>x.id===latest.id);if(rec){rec.endedAt=now();rec.endReason=reason;saveUsageRecords(rows)}
 sessionStorage.removeItem(USAGE_RUNTIME_KEY)
}
function fmtDuration(ms){
 ms=Math.max(0,Number(ms)||0);const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000);
 if(h>=24){const d=Math.floor(h/24);return `${d}d ${h%24}h ${m}m`}return h?`${h}h ${m}m`:`${m}m`
}
function systemActivityAnalyticsView(){
 if(!isSuperadmin())return show('<div class="feedback bad">System activity analytics are Superadmin-only.</div>');
 touchUsage();
 const records=usageRecords(),events=systemHistory(),users=userStore().users;
 const years=[...new Set(records.map(x=>new Date(x.startedAt).getFullYear()).filter(Boolean))].sort((a,b)=>b-a);
 show(`<section class="systemActivityPage"><div class="analyticsToolbar"><select id="activityYear"><option value="">All years</option>${years.map(y=>`<option value="${y}">${y}</option>`).join("")}</select><select id="activityMonth"><option value="">All months</option>${Array.from({length:12},(_,i)=>`<option value="${i+1}">${new Date(2000,i,1).toLocaleString(undefined,{month:"long"})}</option>`).join("")}</select><select id="activityRole"><option value="">All roles</option>${["learner","teacher","business","admin","superadmin","editor","reviewer"].map(r=>`<option value="${r}">${roleLabel(r)}</option>`).join("")}</select><select id="activityUser"><option value="">All users</option>${users.map(u=>`<option value="${u.id}">${esc(u.name||u.email)}</option>`).join("")}</select></div><div id="activityAnalyticsBody"></div></section>`);
 const render=()=>{
  const y=$("#activityYear").value,m=$("#activityMonth").value,r=$("#activityRole").value,u=$("#activityUser").value;
  const rows=records.filter(x=>{const d=new Date(x.startedAt);return(!y||d.getFullYear()==y)&&(!m||d.getMonth()+1==m)&&(!r||x.role===r)&&(!u||x.userId===u)});
  const total=rows.reduce((a,x)=>a+(x.activeMs||0),0),unique=new Set(rows.map(x=>x.userId)).size;
  const filteredEvents=events.filter(x=>{const d=new Date(x.at);return(!y||d.getFullYear()==y)&&(!m||d.getMonth()+1==m)&&(!r||x.role===r)&&(!u||x.userId===u)});
  const byUser={};rows.forEach(x=>{const k=x.userId;byUser[k]=byUser[k]||{name:x.name||k,role:x.role,ms:0,sessions:0};byUser[k].ms+=x.activeMs||0;byUser[k].sessions++});
  const byMonth={};rows.forEach(x=>{const d=new Date(x.startedAt),k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;byMonth[k]=(byMonth[k]||0)+(x.activeMs||0)});
  $("#activityAnalyticsBody").innerHTML=`<section class="healthMetrics"><article><b>${fmtDuration(total)}</b><span>Total active time</span></article><article><b>${rows.length}</b><span>Sessions</span></article><article><b>${unique}</b><span>Active users</span></article><article><b>${filteredEvents.length}</b><span>Activity events</span></article></section>
  <section class="analyticsGrid"><article class="card"><h3>Usage by month</h3><div class="analyticsList">${Object.entries(byMonth).sort().map(([k,v])=>`<div class="row"><span>${k}</span><b>${fmtDuration(v)}</b></div>`).join("")||'<div class="empty">No usage in this period.</div>'}</div></article><article class="card"><h3>Usage by user</h3><div class="analyticsList">${Object.values(byUser).sort((a,b)=>b.ms-a.ms).slice(0,100).map(x=>`<div class="row"><div><b>${esc(x.name)}</b><small>${roleLabel(x.role)} · ${x.sessions} session(s)</small></div><strong>${fmtDuration(x.ms)}</strong></div>`).join("")||'<div class="empty">No user sessions.</div>'}</div></article></section>
  <section class="card"><h3>Session detail</h3><div class="tableWrap"><table><thead><tr><th>Start</th><th>User</th><th>Role</th><th>Active time</th><th>Last view</th></tr></thead><tbody>${rows.slice().reverse().slice(0,500).map(x=>`<tr><td>${esc(new Date(x.startedAt).toLocaleString())}</td><td>${esc(x.name||x.userId)}</td><td>${esc(roleLabel(x.role))}</td><td>${fmtDuration(x.activeMs)}</td><td>${esc(x.view||"")}</td></tr>`).join("")}</tbody></table></div></section>`
 };
 ["activityYear","activityMonth","activityRole","activityUser"].forEach(id=>$("#"+id).onchange=render);render()
}
function installUsageTracking(){
 if(window.__tinaUsageTrackingInstalled)return;window.__tinaUsageTrackingInstalled=true;
 ["click","keydown","pointerdown","touchstart"].forEach(evt=>document.addEventListener(evt,touchUsage,{passive:true,capture:true}));
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")commitUsageRuntime();else touchUsage()});
 window.addEventListener("beforeunload",()=>commitUsageRuntime());
 setInterval(()=>{if(document.visibilityState==="visible")touchUsage()},60000);
 if(session())startUsageSession()
}

function seedSuperadmin(){
 const s=userStore();
 let u=s.users.find(x=>x.role==="superadmin");
 if(!u){
   u={id:"usr-superadmin-default",name:"Tina Superadmin",email:"superadmin",role:"superadmin",roles:["superadmin"],primaryRole:"superadmin",status:"active",passwordHash:SUPERADMIN_DEFAULT_HASH,createdAt:now(),updatedAt:now()};
   s.users.push(u);saveUsers(s);
   const w=workspace();w.access[u.id]={enabled:true,levels:[...LEVELS],routes:["*"]};saveW(w);
   const h=systemHistory();h.push({id:uid("evt"),at:now(),type:"system.superadmin.seeded",userId:"system",name:"System",role:"system",view:"startup",detail:{userId:u.id}});saveSystemHistory(h);
 }
}


const ROLE_GOVERNANCE_POLICY=Object.freeze({
 version:4,
 updatedAt:"2026-08-29",
 hierarchy:["superadmin","admin","business","teacher","editor","reviewer","learner"],
 principles:[
  "Superadmin owns identity, security, permissions, Data Standards, Canon, Academy, infrastructure, audit and recovery.",
  "Administrator is delegated operations: review/escalation and lower-role account administration; no owner authority.",
  "Business authority is organization-scoped.",
  "Teacher authority is class/teaching-scoped.",
  "Editor is authoring/content-scoped; Reviewer is review/evidence-scoped.",
  "Student is learner-scoped.",
  "Sensitive capabilities require explicit permission and server-side enforcement in production."
 ],
 roles:{
  learner:{title:"Student",scope:"Learning, practice, review, progress, community, support and own profile.",excluded:"Administration, organization governance, authoring governance, Canon, infrastructure and system security."},
  teacher:{title:"Teacher",scope:"Classes, assignments, grading, learner progress, Shadowing Insights and Tina Library.",excluded:"Active Learning authoring, global users, Canon, system administration and infrastructure."},
  business:{title:"Business",scope:"Assigned organization: programs, members, teachers, reports and Tina Library.",excluded:"Platform-wide users, Canon, Academy ownership, infrastructure and global security."},
  editor:{title:"Editor",scope:"Delegated authoring/content, research, library and profile.",excluded:"User/role administration, infrastructure and owner-level Canon/publication authority."},
  reviewer:{title:"Reviewer",scope:"Delegated review, evidence/progress, research, library and profile.",excluded:"Authoring ownership, user management, infrastructure and Canon owner authority."},
  admin:{title:"Administrator",scope:"Review & Escalate, lower-role accounts, activity/settings/library and explicitly delegated operational scopes.",excluded:"Cannot assign Administrator/Superadmin, change owner credentials, permanently delete users by default, or own Canon/Academy/infrastructure/security."},
  superadmin:{title:"Superadmin",scope:"Platform-wide owner and highest security/governance authority.",excluded:"No higher role."}
 }
});

const SYSTEM_ROLE_CAPABILITIES=[
 ["Learning / practice","✓","Teaching oversight","Org programs","—","—","Delegated","All"],
 ["Classes / assignments","—","✓","Org visibility","—","—","—","All"],
 ["Grade learner work","—","✓","—","—","Review evidence","Optional delegated","All"],
 ["Organization members","—","Assigned learners","✓ organization only","—","—","Lower roles only","All"],
 ["Content authoring","—","—","—","✓ delegated","—","Only if delegated","All"],
 ["Review / evidence","Own work","Teaching work","Org reports","Content QA","✓ delegated","✓ review/escalate","All"],
 ["Users & roles","Own account","Teaching scope","Organization scope","—","—","Roles below Admin","All users"],
 ["Account lifecycle status","—","—","Org operational context","—","—","Lower roles","All accounts"],
 ["Assign Administrator / Superadmin","—","—","—","—","—","—","Superadmin only"],
 ["Credential reset","Own supported flow","Own supported flow","Own supported flow","Own supported flow","Own supported flow","—","Superadmin / secure backend"],
 ["Permanent delete","—","—","Only if explicitly delegated","—","—","—","Superadmin governed"],
 ["Data Standards governance","—","—","—","—","—","—","Superadmin owner"],
 ["Tina Academy governance","—","—","—","—","—","—","Superadmin owner"],
 ["Canon creation","—","—","—","Explicit permission only","—","Explicit permission only","Superadmin owner"],
 ["Canonical publication","—","—","—","—","—","—","Governed owner workflow"],
 ["Infrastructure / backend / security","—","—","—","—","—","—","Superadmin owner"],
 ["Complete audit / recovery","—","Teaching-related","Org-related","Own events","Own events","Operational events","All + recovery"]
]
function superadminGovernanceMapView(){
 if(!isSuperadmin())return;
 const p=ROLE_GOVERNANCE_POLICY;
 show(`<section class="governanceMapPage"><div class="sectionHead"><div><div class="eyebrow">GOVERNANCE POLICY v${p.version}</div><h2>Authority & Scope Map</h2><p class="muted">One policy source is reused by Role Matrix, Role Guides and role-facing guidance.</p></div></div><div class="governanceFlow">
 <article class="governanceNode owner"><b>Superadmin</b><span>System owner / highest security authority</span><small>${esc(p.roles.superadmin.scope)}</small></article>
 <div class="governanceArrow">↓</div>
 <article class="governanceNode"><b>Administrator</b><span>Delegated operations</span><small>${esc(p.roles.admin.scope)}</small></article>
 <div class="governanceArrow">↓ scoped branches</div>
 <div class="governanceLayer"><article class="governanceNode"><b>Business</b><span>Organization scope</span><small>${esc(p.roles.business.scope)}</small></article><article class="governanceNode"><b>Teacher</b><span>Teaching scope</span><small>${esc(p.roles.teacher.scope)}</small></article><article class="governanceNode"><b>Editor</b><span>Authoring scope</span><small>${esc(p.roles.editor.scope)}</small></article><article class="governanceNode"><b>Reviewer</b><span>Review scope</span><small>${esc(p.roles.reviewer.scope)}</small></article></div>
 <div class="governanceArrow">↓</div><article class="governanceNode learner"><b>Student</b><span>Learner scope</span><small>${esc(p.roles.learner.scope)}</small></article>
 </div><section class="card"><h3>Governance principles</h3><div class="governanceRules">${p.principles.map((x,i)=>`<span><b>${i+1}.</b> ${esc(x)}</span>`).join("")}</div></section></section>`)
}
function systemRoleMatrixView(){
 if(!isSuperadmin())return;
 const cols=["Capability","Student","Teacher","Business","Editor","Reviewer","Administrator","Superadmin"];
 show(`<section class="roleMatrixPage"><div class="pageTitleCompact"><div><h2>System Role Permission Matrix</h2><p class="muted">Governance Policy v${ROLE_GOVERNANCE_POLICY.version}. This matrix and Role Guides are updated from the same policy contract.</p></div><button id="roleMatrixExport">Export Matrix</button></div><section class="card"><div class="tableWrap"><table class="roleMatrixTable"><thead><tr>${cols.map(x=>`<th>${esc(x)}</th>`).join("")}</tr></thead><tbody>${SYSTEM_ROLE_CAPABILITIES.map(r=>`<tr>${r.map((c,i)=>i?`<td>${esc(c)}</td>`:`<th>${esc(c)}</th>`).join("")}</tr>`).join("")}</tbody></table></div></section><section class="card"><h3>Delegation rule</h3><p>Any authority beyond a role's default scope must be explicitly granted by Superadmin. Production-sensitive APIs must independently enforce the same policy server-side.</p></section></section>`);
 $("#roleMatrixExport").onclick=()=>download("tina-role-permission-matrix.json",JSON.stringify({generatedAt:now(),policyVersion:ROLE_GOVERNANCE_POLICY.version,columns:cols,rows:SYSTEM_ROLE_CAPABILITIES},null,2))
}
function roleGuidesView(){
 if(!isSuperadmin())return;
 const order=["learner","teacher","business","editor","reviewer","admin","superadmin"],p=ROLE_GOVERNANCE_POLICY;
 show(`<section class="roleGuidesPage"><div class="sectionHead"><div><div class="eyebrow">GOVERNANCE POLICY v${p.version}</div><h2>Role Guides</h2><p class="muted">Generated from the same role policy used by the Governance Map and Permission Matrix.</p></div></div><div class="roleGuideGrid">${order.map(r=>{const d=p.roles[r];return `<article class="card roleGuideCard"><div class="eyebrow">${esc(d.title)}</div><h3>Default scope</h3><p>${esc(d.scope)}</p><h4>Excluded / governed</h4><p class="muted">${esc(d.excluded)}</p><button data-guide-switch="${r}">Preview / switch when assigned</button></article>`}).join("")}</div></section>`);
 $$("[data-guide-switch]").forEach(b=>b.onclick=()=>{const target=b.dataset.guideSwitch,s=session();if((s.roles||[]).includes(target))switchActiveRole(target);else alert("This Superadmin account is not assigned that preview role. Use Interface Studio for role preview.")})
}
function superadminDashboard(){
 if(!isSuperadmin())return show('<div class="feedback bad">Superadmin access is required.</div>');
 const users=userStore().users,w=workspace(),h=systemHistory(),counts=ROLES.reduce((a,r)=>(a[r]=users.filter(u=>u.role===r).length,a),{});
 show(`<div class="sectionHead"><div><div class="eyebrow">SUPERADMIN</div><h2>System Governance Center</h2><p class="muted">Highest-level control across users, content, access, data and system activity.</p></div></div>
 <section class="teacherMetrics"><article><b>${users.length}</b><span>Total accounts</span></article><article><b>${counts.teacher||0}</b><span>Teachers</span></article><article><b>${counts.business||0}</b><span>Businesses</span></article><article><b>${h.length}</b><span>Activity events</span></article></section>
 <section class="superadminGrid">
  <article class="card superadminPriorityCard"><div class="eyebrow">LEARNING QUALITY</div><h3>Learning Intelligence</h3><p>Measure engagement, learning signals, feedback and improvement recommendations across the system.</p><button class="primary" id="saLearningIntelligence">Open Learning Intelligence</button></article>
  <article class="card superadminPriorityCard"><div class="eyebrow">VOICE LAB</div><h3>Tina Shadowing</h3><p>Manage reference audio/video, inspect waveform-based learner attempts and pronunciation trends.</p><button class="primary" id="saShadowing">Open Tina Shadowing</button></article>
  <article class="card"><h3>Governance Map</h3><p>See the authority hierarchy and operating boundaries.</p><button class="primary" id="saGovernanceMap">Open Map</button></article><article class="card"><h3>Role Permission Matrix</h3><p>Detailed role-by-role capability table.</p><button class="primary" id="saRoleMatrix">Open Matrix</button></article><article class="card"><h3>Role Guides</h3><p>Usage guide and role relationships.</p><button class="primary" id="saRoleGuides">Open Guides</button></article><article class="card"><h3>Security Readiness</h3><p>Review CTO-level security controls, gaps and next hardening priorities.</p><button class="primary" id="saSecurity">Open Security Readiness</button></article><article class="card"><h3>System Health</h3><p>Monitor health score, reports, warnings and operational alerts.</p><button class="primary" id="saHealth">Open Health Center</button></article><article class="card"><h3>System Administration</h3><p>Manage all platform control surfaces from one place.</p><button class="primary" id="saSystem">Open System Administration</button></article>
  <article class="card"><h3>Users & Roles</h3><p>Create accounts, assign roles and control status.</p><button class="primary" id="saRoles">Manage Roles</button></article>
  <article class="card"><h3>Access Control</h3><p>Control level access and account availability.</p><button class="primary" id="saAccess">Manage Access</button></article><article class="card"><h3>User Permissions</h3><p>Tick feature-by-feature permissions for every account.</p><button class="primary" id="saPermissions">Open Permission Matrix</button></article>
  <article class="card"><h3>Activity History</h3><p>View all recorded user and system activity.</p><button class="primary" id="saHistory">Open History</button></article>
  <article class="card"><h3>Tina Academy</h3><p>Open the private multidisciplinary academy.</p><button class="primary" id="saAcademy">Open Tina Academy</button></article>
  <article class="card"><h3>Interface Studio</h3><p>Switch, preview and govern Student, Teacher, Business, Admin and Superadmin interfaces.</p><button class="primary" id="saInterfaces">Open Interface Studio</button></article>
  <article class="card"><h3>App Interface</h3><p>Preview and configure responsive desktop, tablet and mobile app layouts.</p><button class="primary" id="saAppInterface">Open App Interface</button></article>
  <article class="card"><h3>Backup & Export</h3><p>Export the complete local system state and audit history.</p><button class="primary" id="saBackup">Export System Backup</button></article>
 </section>`);
 $("#saLearningIntelligence").onclick=learningIntelligenceView;$("#saShadowing").onclick=tinaShadowingView;$("#saGovernanceMap").onclick=superadminGovernanceMapView;$("#saRoleMatrix").onclick=systemRoleMatrixView;$("#saRoleGuides").onclick=roleGuidesView;$("#saHealth").onclick=systemHealthView;$("#saSecurity").onclick=securityReadinessView;$("#saSystem").onclick=systemAdministrationView;$("#saRoles").onclick=roleManagementView;$("#saAccess").onclick=accessControlView;$("#saPermissions").onclick=userPermissionMatrixView;$("#saHistory").onclick=activityHistoryView;$("#saAcademy").onclick=()=>clickDataView("academy");$("#saInterfaces").onclick=interfaceStudioView;$("#saAppInterface").onclick=appInterfaceStudioView;$("#saBackup").onclick=exportSuperadminBackup
}

const SECURITY_READINESS_ITEMS=Object.freeze([
 {area:"Identity",state:"partial",current:"Role accounts, password hashing, HttpOnly persistent sessions in backend deployment.",next:"Require MFA/WebAuthn for Superadmin and Administrator; remove bootstrap/default credentials after provisioning."},
 {area:"Authorization",state:"partial",current:"Clear UI/RBAC role boundaries and explicit delegation.",next:"Enforce authorization server-side on every sensitive endpoint; deny-by-default policy tests."},
 {area:"Secrets",state:"partial",current:"Production setup supports environment-held master key and encrypted snapshots/media.",next:"Use managed secret storage/key rotation; never retain production secrets in browser/local files."},
 {area:"Transport",state:"missing",current:"Local deployment can run same-origin HTTP.",next:"Production HTTPS only, HSTS, secure cookies and reverse-proxy/TLS hardening."},
 {area:"Audit",state:"partial",current:"System activity history and backend telemetry exist.",next:"Append-only/tamper-evident audit storage, retention policy, security event correlation and export controls."},
 {area:"Backup & Recovery",state:"partial",current:"Backup/restore scripts and encrypted snapshots exist.",next:"Automated off-device backups, restore drills, RPO/RTO targets and disaster-recovery runbook."},
 {area:"Monitoring",state:"partial",current:"Health checks, alerts and runtime signals exist.",next:"Centralized logs/metrics, uptime checks, alert routing and incident severity/on-call workflow."},
 {area:"Application Security",state:"partial",current:"CSP/security headers and validation baseline exist.",next:"Dependency/SCA scanning, SAST, secret scanning, patch cadence, vulnerability management and penetration testing."},
 {area:"Data Governance",state:"partial",current:"Superadmin Data Standards, canonical boundaries and status registry.",next:"Data classification, retention/deletion policy, privacy inventory, encryption-at-rest coverage and access review cadence."},
 {area:"Operational Security",state:"missing",current:"Single-owner controlled operation is viable.",next:"Break-glass account, least-privilege admin workflow, quarterly access review, incident response and change-management process."}
]);
function securityReadinessView(){
 if(!isSuperadmin())return show('<div class="feedback bad">Superadmin access is required.</div>');
 const ready=SECURITY_READINESS_ITEMS.filter(x=>x.state==="ready").length,partial=SECURITY_READINESS_ITEMS.filter(x=>x.state==="partial").length,missing=SECURITY_READINESS_ITEMS.filter(x=>x.state==="missing").length;
 show(`<section class="securityReadinessPage"><div class="sectionHead"><div><div class="eyebrow">SUPERADMIN · CTO SECURITY</div><h2>Security Readiness</h2><p class="muted">Current-stage control inventory. “Partial” means a useful baseline exists but is not yet a production enterprise security boundary.</p></div></div><section class="healthMetrics"><article><b>${ready}</b><span>Ready</span></article><article><b>${partial}</b><span>Partial</span></article><article><b>${missing}</b><span>Missing</span></article><article><b>${SECURITY_READINESS_ITEMS.length}</b><span>Control areas</span></article></section><section class="securityControlGrid">${SECURITY_READINESS_ITEMS.map(x=>`<article class="card securityControlCard"><div class="securityState ${x.state}">${esc(x.state)}</div><h3>${esc(x.area)}</h3><p><b>Current:</b> ${esc(x.current)}</p><p><b>Next control:</b> ${esc(x.next)}</p></article>`).join("")}</section><article class="card"><h3>Stage decision</h3><p><b>Suitable now:</b> personal/single-machine or tightly controlled pilot deployment.</p><p><b>Not sufficient yet:</b> public SaaS, sensitive multi-tenant production, or enterprise deployment without the missing server-side and operational controls above.</p></article></section>`)
}

function systemAdministrationView(){
 if(!isSuperadmin())return show('<div class="feedback bad">Superadmin access is required.</div>');
 show(`<div class="sectionHead"><div><div class="eyebrow">SUPERADMIN · SYSTEM ADMINISTRATION</div><h2>Complete Platform Control</h2><p class="muted">Central control for every major subsystem.</p></div><button class="ghost" id="sysBack">← Superadmin</button></div>
 <section class="systemControlGrid">
  ${[
   ["System Health","health-extra","Health score, operational reports and alerts."],
   ["System QA & Reliability","system-qa-extra","Continuous runtime error monitoring, repeated-issue detection and Superadmin QA triage."],
   ["Security Readiness","security-readiness-extra","CTO-level security control inventory, gaps and next controls."],
   ["Learning Intelligence","learning-intelligence-extra","System-wide learning measurement, feedback and improvement recommendations."],
   ["Tina Shadowing","shadowing-extra","Reference media, waveform comparison and rubric-based voice practice."],
   ["Tina Academy","academy","Curriculum and multidisciplinary learning catalog."],
   ["Editing Studio","editing-extra","Platform data and content creation."],
   ["Content Studio","content-v12","Courses, units, lessons and content records."],
   ["Practice Administration","practice-v10","Flashcards, SRS and game content."],
   ["Assessment Administration","assessment-v11","Tests, questions and evidence."],
   ["Tina Library","library-extra","Books, textbooks and shared resources."],
   ["Teacher Workspace","teacher-extra","Classes, assignments and learner progress."],
   ["Users & Roles","roles-extra","Accounts and role governance."],
   ["Access Control","access-extra","Per-user level and access rules."],
   ["Canonical Data","canonical","Read-only canonical projection and system data."],
   ["Learning Core","core","Learning runtime and core systems."],
   ["System Settings","settings","Theme and platform preferences."],
   ["Activity History","history-extra","All user and system activity."],["Interface Studio","interface-studio-extra","Role-based interface switching and governance."],["App Interface","app-studio-extra","Desktop, tablet and mobile app interface preview."],
  ].map(([title,target,desc])=>`<article class="card"><h3>${title}</h3><p>${desc}</p><button data-sys-target="${target}">Open</button></article>`).join("")}
 </section>`);
 $("#sysBack").onclick=superadminDashboard;
 $$("[data-sys-target]").forEach(b=>b.onclick=()=>roleTargetOpen(b.dataset.sysTarget))
}
const ADMIN_UNDO_KEY="tina.v14.admin.undo.checkpoints";
function adminUndoRecords(){try{const x=JSON.parse(localStorage.getItem(ADMIN_UNDO_KEY)||"[]");return Array.isArray(x)?x:[]}catch{return[]}}
function undoAdminCheckpoint(id){
 if(!isSuperadmin())return;
 const all=adminUndoRecords(),rec=all.find(x=>x.id===id);if(!rec||rec.undone)return alert("This checkpoint is unavailable or already undone.");
 if(!confirm(`Undo Administrator operation "${rec.op}" and restore the governed content/practice state captured before it?`))return;
 Object.entries(rec.snapshot||{}).forEach(([k,v])=>{if(v===null||v===undefined)localStorage.removeItem(k);else localStorage.setItem(k,v)});
 rec.undone=true;rec.undoneAt=now();rec.undoneBy=currentUserId();localStorage.setItem(ADMIN_UNDO_KEY,JSON.stringify(all));
 auditEvent("admin.operation.undone",{checkpointId:id,operation:rec.op});activityHistoryView()
}
function activityHistoryView(){
 if(!isSuperadmin())return show('<div class="feedback bad">Only Superadmin can view complete system activity history.</div>');
 const h=systemHistory().slice().reverse(),undo=adminUndoRecords();
 show(`<div class="sectionHead"><div><div class="eyebrow">SUPERADMIN · ACTIVITY HISTORY</div><h2>All User & System Activity</h2><p class="muted">Audit trail with Superadmin rollback checkpoints for Administrator operations.</p></div><div class="actions"><button id="histExport">Export History</button><button id="histClear">Clear History</button></div></div>
 <div class="libraryToolbar"><input id="histSearch" placeholder="Search user, role, event, page..."><select id="histRole"><option value="">All roles</option>${[...new Set(h.map(x=>x.role).filter(Boolean))].map(r=>`<option>${esc(r)}</option>`).join("")}</select><select id="histType"><option value="">All events</option>${[...new Set(h.map(x=>x.type).filter(Boolean))].slice(0,100).map(t=>`<option>${esc(t)}</option>`).join("")}</select></div>
 <section class="card"><div id="historyTable" class="tableWrap"></div></section>`);
 const render=()=>{const q=$("#histSearch").value.toLowerCase(),r=$("#histRole").value,t=$("#histType").value;const rows=h.filter(x=>(!q||JSON.stringify(x).toLowerCase().includes(q))&&(!r||x.role===r)&&(!t||x.type===t));$("#historyTable").innerHTML=`<table><thead><tr><th>Time</th><th>User</th><th>Role</th><th>Event</th><th>View</th><th>Details</th><th>Governance</th></tr></thead><tbody>${rows.map(x=>{const cp=x.detail?.checkpointId?undo.find(u=>u.id===x.detail.checkpointId):null;return `<tr><td>${esc(new Date(x.at).toLocaleString())}</td><td><b>${esc(x.name||x.userId)}</b><br><small>${esc(x.userId)}</small></td><td>${esc(x.role)}</td><td>${esc(x.type)}</td><td>${esc(x.view||"")}</td><td><code>${esc(JSON.stringify(x.detail||{}).slice(0,240))}</code></td><td>${cp?cp.undone?'<span class="badge">Undone</span>':`<button class="dangerAction" data-undo-admin="${cp.id}">Undo</button>`:"—"}</td></tr>`}).join("")}</tbody></table>`;$$("[data-undo-admin]").forEach(b=>b.onclick=()=>undoAdminCheckpoint(b.dataset.undoAdmin))};
 $("#histSearch").oninput=render;$("#histRole").onchange=render;$("#histType").onchange=render;render();
 $("#histExport").onclick=()=>download("tina-system-activity-history.json",JSON.stringify(systemHistory(),null,2));
 $("#histClear").onclick=()=>{if(!confirm("Clear the complete local system activity history?"))return;saveSystemHistory([]);auditEvent("system.history.cleared",{by:currentUserId()});activityHistoryView()}
}
function exportSuperadminBackup(){
 if(!isSuperadmin())return;
 const data={schema:"tina-v14-superadmin-backup",exportedAt:now(),localStorage:{},session:session(),activity:systemHistory()};
 for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith("tina.")||k==="tlp4.progress")data.localStorage[k]=localStorage.getItem(k)}
 auditEvent("system.backup.exported",{keys:Object.keys(data.localStorage).length});
 download(`tina-superadmin-backup-${Date.now()}.json`,JSON.stringify(data,null,2))
}
function installActivityAudit(){
 document.addEventListener("click",e=>{const b=e.target.closest("button,a");if(!b)return;const text=(b.textContent||"").replace(/\s+/g," ").trim().slice(0,100);if(!text)return;auditEvent("ui.click",{label:text,id:b.id||"",view:b.dataset?.view||b.dataset?.roleTarget||b.dataset?.op||""})},true);

document.addEventListener("click",e=>{
 const t=e.target.closest('[data-view="academy"],[data-role-target="academy"],[data-side-target="academy"]');
 if(!t)return;
 if(isSuperadmin())return;
 e.preventDefault();e.stopImmediatePropagation();
 alert("Tina Academy is available only to Superadmin.");
},true);

window.addEventListener("tina:app-rendered",e=>{auditEvent("page.view",{view:e.detail?.view||""});enforceRoleAwareHome(e.detail?.view||"")});
 window.addEventListener("tina:wrong-answer",e=>auditEvent("learning.mistake",e.detail||{}));
}

/* ---------- BUSINESS B2B WORKSPACE ---------- */

function ensureOrganizations(){const w=workspace();w.organizations=Array.isArray(w.organizations)?w.organizations:[];return w}
function organizationForUser(uid=currentUserId()){return ensureOrganizations().organizations.find(o=>(o.businessAccountIds||[]).includes(uid)||(o.memberIds||[]).includes(uid))||null}
function organizationManagerView(){
 if(!isSuperadmin())return show('<div class="feedback bad">Business Organizations are managed only by Superadmin.</div>');
 const w=ensureOrganizations();
 show(`<div class="sectionHead"><div><div class="eyebrow">SUPERADMIN · BUSINESS ORGANIZATIONS</div><h2>Schools & Organizations</h2><p class="muted">Create the organization directory, then assign Business accounts that are allowed to enter each organization workspace.</p></div><button class="primary" id="orgNew">+ Organization</button></div><section class="organizationGrid">${w.organizations.length?w.organizations.map(o=>`<article class="card organizationCard"><div><div class="eyebrow">${esc(o.type||"Organization")}</div><h3>${esc(o.name)}</h3><p>${esc(o.code||"No organization code")}</p></div><div class="organizationStats"><span><b>${(o.businessAccountIds||[]).length}</b> business accounts</span><span><b>${(o.memberIds||[]).length}</b> members</span><span><b>${(o.teacherIds||[]).length}</b> teachers</span></div><button data-org-manage="${o.id}">Manage Organization</button></article>`).join(""):'<div class="empty">No organizations yet.</div>'}</section>`);
 $("#orgNew").onclick=()=>organizationEditor();$$("[data-org-manage]").forEach(b=>b.onclick=()=>organizationEditor(b.dataset.orgManage))
}
function organizationEditor(id=null){
 if(!isSuperadmin())return;
 const w=ensureOrganizations(),users=userStore().users,o=id?w.organizations.find(x=>x.id===id):{businessAccountIds:[],memberIds:[],teacherIds:[],programs:[],teams:[],reports:[]};
 const businessUsers=users.filter(u=>userRoles(u).includes("business")&&u.status!=="suspended"),teachers=users.filter(u=>userRoles(u).includes("teacher")&&u.status!=="suspended"),members=users.filter(u=>["learner","teacher","business"].some(r=>userRoles(u).includes(r))&&u.status!=="suspended");
 show(`<div class="sectionHead"><div><div class="eyebrow">SUPERADMIN · ORGANIZATION</div><h2>${id?esc(o.name):"Create Organization"}</h2></div><button id="orgBack">← Organizations</button></div><section class="card"><div class="wsFormGrid">${textField("orgName","Organization / school name",o.name||"")}${textField("orgCode","Organization code",o.code||"")}${selectField("orgType","Type",["School","Training Center","Company","University","Organization","Other"],o.type||"School")}${textField("orgContact","Primary contact",o.contact||"")}</div><div class="organizationAssignGrid"><div><h4>Business login accounts</h4>${businessUsers.map(u=>`<label><input type="checkbox" data-org-business="${u.id}" ${(o.businessAccountIds||[]).includes(u.id)?"checked":""}> ${esc(u.name)} · ${esc(u.email)}</label>`).join("")||'<div class="empty">Create a Business account first.</div>'}</div><div><h4>Teachers</h4>${teachers.map(u=>`<label><input type="checkbox" data-org-teacher="${u.id}" ${(o.teacherIds||[]).includes(u.id)?"checked":""}> ${esc(u.name)}</label>`).join("")||'<div class="empty">No teachers yet.</div>'}</div><div><h4>Organization members</h4>${members.map(u=>`<label><input type="checkbox" data-org-member="${u.id}" ${(o.memberIds||[]).includes(u.id)?"checked":""}> ${esc(u.name)} · ${esc(roleLabel(userRoles(u)[0]))}</label>`).join("")}</div></div><div class="actions"><button class="primary" id="orgSave">Save Organization</button>${id?'<button class="dangerAction" id="orgDelete">Delete Organization</button>':""}</div></section>`);
 $("#orgBack").onclick=organizationManagerView;
 $("#orgSave").onclick=()=>{const name=$("#orgName").value.trim();if(!name)return alert("Organization name is required.");const rec=id?o:{id:uid("org"),createdAt:now(),programs:[],teams:[],reports:[]};rec.name=name;rec.code=$("#orgCode").value.trim();rec.type=$("#orgType").value;rec.contact=$("#orgContact").value.trim();rec.businessAccountIds=$$("[data-org-business]:checked").map(x=>x.dataset.orgBusiness);rec.teacherIds=$$("[data-org-teacher]:checked").map(x=>x.dataset.orgTeacher);rec.memberIds=$$("[data-org-member]:checked").map(x=>x.dataset.orgMember);rec.updatedAt=now();if(!id)w.organizations.push(rec);saveW(w);auditEvent("organization.saved",{organizationId:rec.id});organizationManagerView()};
 $("#orgDelete")?.addEventListener("click",()=>{if(!confirm("Delete this organization?"))return;w.organizations=w.organizations.filter(x=>x.id!==o.id);saveW(w);organizationManagerView()})
}
function businessOrgContext(){const org=organizationForUser();if(!org)return null;org.programs=Array.isArray(org.programs)?org.programs:[];org.reports=Array.isArray(org.reports)?org.reports:[];org.memberIds=org.memberIds||[];org.teacherIds=org.teacherIds||[];return org}

function ensureBusinessStore(){
 const w=workspace();
 w.business=Object.assign({programs:[],teams:[],reports:[],teacherIds:[],cohorts:[]},w.business||{});
 return w
}
function businessTeachers(){
 const w=ensureBusinessStore(),users=userStore().users;
 return users.filter(u=>userRoles(u).includes("teacher")&&u.status!=="suspended"&&(!(w.business.teacherIds||[]).length||(w.business.teacherIds||[]).includes(u.id)))
}

const BUSINESS_MEMBER_ROLES=["learner","teacher","business"];
const BUSINESS_MEMBER_PERMISSIONS=[
 ["view-programs","View programs"],
 ["manage-programs","Manage programs"],
 ["view-members","View members"],
 ["manage-members","Manage members"],
 ["view-teachers","View teachers"],
 ["view-reports","View reports"],
 ["manage-reports","Generate reports"],
 ["library","Use organization resources"]
];
function businessOrgWritable(){
 const org=businessOrgContext();
 if(!org)return null;
 org.memberPermissions=org.memberPermissions&&typeof org.memberPermissions==="object"?org.memberPermissions:{};
 org.businessAccountIds=org.businessAccountIds||[];
 org.memberIds=org.memberIds||[];
 org.teacherIds=org.teacherIds||[];
 return org
}
function businessCan(permission){
 if(isSuperadmin())return true;
 const org=businessOrgWritable();if(!org)return false;
 if((org.businessAccountIds||[]).includes(currentUserId()))return true;
 const p=org.memberPermissions?.[currentUserId()]||[];
 return p.includes(permission)
}
function businessMemberRoleAllowed(u){
 return userRoles(u).every(r=>BUSINESS_MEMBER_ROLES.includes(r));
}
function businessProgramsView(){
 const org=businessOrgWritable();if(!org)return businessView();
 if(!businessCan("view-programs"))return show('<div class="feedback bad">Your organization role does not include program access.</div>');
 show(`<div class="sectionHead"><div><div class="eyebrow">BUSINESS · PROGRAMS</div><h2>${esc(org.name)} Programs</h2><p class="muted">Organization learning programs.</p></div>${businessCan("manage-programs")?'<button class="primary" id="businessProgramAdd">+ Program</button>':""}</div>
 <section class="businessProgramList">${org.programs.length?org.programs.map(p=>`<article class="card businessProgramCard"><div><b>${esc(p.title)}</b><small>${esc(p.status||"active")} · ${esc(p.pathway||"General")}</small></div><div class="actions">${businessCan("manage-programs")?`<button data-org-program="${p.id}">Edit</button><button class="dangerAction" data-org-program-delete="${p.id}">Delete</button>`:""}</div></article>`).join(""):'<div class="empty">No programs yet.</div>'}</section>`);
 $("#businessProgramAdd")?.addEventListener("click",()=>businessOrgProgramEditor());
 $$("[data-org-program]").forEach(b=>b.onclick=()=>businessOrgProgramEditor(b.dataset.orgProgram));
 $$("[data-org-program-delete]").forEach(b=>b.onclick=()=>{if(!confirm("Delete this program?"))return;org.programs=org.programs.filter(x=>x.id!==b.dataset.orgProgramDelete);saveW(workspace());auditEvent("organization.program.deleted",{organizationId:org.id,programId:b.dataset.orgProgramDelete});businessProgramsView()})
}
function businessTeachersView(){
 const org=businessOrgWritable();if(!org)return businessView();
 if(!businessCan("view-teachers"))return show('<div class="feedback bad">Your organization role does not include teacher access.</div>');
 const users=userStore().users,teachers=users.filter(u=>(org.teacherIds||[]).includes(u.id));
 show(`<div class="sectionHead"><div><div class="eyebrow">BUSINESS · TEACHERS</div><h2>${esc(org.name)} Teachers</h2><p class="muted">Teachers assigned to this organization by Superadmin or an authorized Business manager.</p></div></div>
 <section class="card"><div class="list">${teachers.length?teachers.map(t=>`<div class="row"><div><b>${esc(t.name)}</b><small>${esc(t.email)}</small></div><div class="actions"><button data-business-member-edit="${t.id}">Edit</button><button data-business-member-perm="${t.id}">Permissions</button></div></div>`).join(""):'<div class="empty">No teachers assigned.</div>'}</div></section>`);
 $$("[data-business-member-edit]").forEach(b=>b.onclick=()=>businessMemberEditor(b.dataset.businessMemberEdit));
 $$("[data-business-member-perm]").forEach(b=>b.onclick=()=>businessMemberPermissionEditor(b.dataset.businessMemberPerm))
}
function businessReportsView(){
 const org=businessOrgWritable();if(!org)return businessView();
 if(!businessCan("view-reports"))return show('<div class="feedback bad">Your organization role does not include report access.</div>');
 show(`<div class="sectionHead"><div><div class="eyebrow">BUSINESS · REPORTS</div><h2>${esc(org.name)} Reports</h2><p class="muted">Organization-level management reports.</p></div>${businessCan("manage-reports")?'<button class="primary" id="businessReportGenerate">Generate Report</button>':""}</div>
 <section class="card"><div class="list">${org.reports.length?org.reports.slice().reverse().map(r=>`<div class="row"><div><b>${esc(r.title)}</b><small>${esc(new Date(r.createdAt).toLocaleString())}</small></div><button data-org-report="${r.id}">Open</button></div>`).join(""):'<div class="empty">No reports yet.</div>'}</div></section>`);
 $("#businessReportGenerate")?.addEventListener("click",businessOrgGenerateReport);
 $$("[data-org-report]").forEach(b=>b.onclick=()=>businessOrgReportView(b.dataset.orgReport))
}
function businessMembersView(){
 const org=businessOrgWritable();if(!org)return businessView();
 if(!businessCan("view-members"))return show('<div class="feedback bad">Your organization role does not include member access.</div>');
 const users=userStore().users,members=users.filter(u=>(org.memberIds||[]).includes(u.id));
 show(`<div class="sectionHead"><div><div class="eyebrow">BUSINESS · MEMBERS</div><h2>${esc(org.name)} Members</h2><p class="muted">Business managers can manage organization members only at Business level or lower. Administrator and Superadmin roles cannot be assigned here.</p></div>${businessCan("manage-members")?'<button class="primary" id="businessMemberAdd">+ Add Member</button>':""}</div>
 <section class="card businessMemberTable"><div class="tableWrap"><table><thead><tr><th>Member</th><th>Roles</th><th>Status</th><th>Permissions</th><th>Actions</th></tr></thead><tbody>${members.length?members.map(u=>`<tr><td><b>${esc(u.name)}</b><br><small>${esc(u.email)}</small></td><td>${userRoles(u).map(roleLabel).join(", ")}</td><td>${esc(u.status||"active")}</td><td>${(org.memberPermissions?.[u.id]||[]).length}</td><td><div class="actions">${businessCan("manage-members")?`<button data-business-member-edit="${u.id}">Edit</button><button data-business-member-perm="${u.id}">Permissions</button><button data-business-member-remove="${u.id}">Remove from Organization</button>${canDeleteManagedUser(u)?`<button class="dangerAction" data-business-member-delete="${u.id}">Delete Account</button>`:""}`:""}</div></td></tr>`).join(""):'<tr><td colspan="5"><div class="empty">No members assigned.</div></td></tr>'}</tbody></table></div></section>`);
 $("#businessMemberAdd")?.addEventListener("click",businessMemberCreate);
 $$("[data-business-member-edit]").forEach(b=>b.onclick=()=>businessMemberEditor(b.dataset.businessMemberEdit));
 $$("[data-business-member-perm]").forEach(b=>b.onclick=()=>businessMemberPermissionEditor(b.dataset.businessMemberPerm));
 $$("[data-business-member-remove]").forEach(b=>b.onclick=()=>businessMemberRemove(b.dataset.businessMemberRemove));
 $$("[data-business-member-delete]").forEach(b=>b.onclick=()=>deleteManagedUserAccount(b.dataset.businessMemberDelete,businessMembersView))
}
function businessMemberCreate(){
 const org=businessOrgWritable();if(!org||!businessCan("manage-members"))return;
 modal("Add Organization Member",`<div class="wsFormGrid">${textField("bizMemberName","Full name","")}${textField("bizMemberEmail","Email / username","")}${selectField("bizMemberRole","Role",["learner","teacher","business"],"learner")}${textField("bizMemberPassword","Temporary password","","password")}</div><p class="muted">Business can create Student, Teacher, or Business accounts only. Administrator and Superadmin accounts must be created by Superadmin.</p>`,`<button class="primary" id="bizMemberCreateSave">Create Member</button>`);
 $("#bizMemberCreateSave").onclick=async()=>{
  const name=$("#bizMemberName").value.trim(),email=$("#bizMemberEmail").value.trim().toLowerCase(),r=$("#bizMemberRole").value,p=$("#bizMemberPassword").value;
  if(!name||!email||p.length<8)return alert("Name, email/username and a password of at least 8 characters are required.");
  if(!BUSINESS_MEMBER_ROLES.includes(r))return alert("That role cannot be created by Business.");
  const s=userStore();if(s.users.some(x=>(x.email||"").toLowerCase()===email))return alert("This email/username already exists.");
  const rec={id:uid("usr"),name,email,role:r,roles:[r],primaryRole:r,status:"pending_activation",passwordHash:await roleHashPassword(p),createdAt:now(),updatedAt:now()};
  s.users.push(rec);saveUsers(s);
  org.memberIds=[...new Set([...(org.memberIds||[]),rec.id])];
  if(r==="teacher")org.teacherIds=[...new Set([...(org.teacherIds||[]),rec.id])];
  if(r==="business")org.businessAccountIds=[...new Set([...(org.businessAccountIds||[]),rec.id])];
  org.memberPermissions[rec.id]=r==="business"?BUSINESS_MEMBER_PERMISSIONS.map(x=>x[0]):["view-programs","view-members","library"];
  saveW(workspace());auditEvent("business.member.created",{organizationId:org.id,userId:rec.id,role:r});closeModal();businessMembersView()
 }
}
function businessMemberEditor(id){
 const org=businessOrgWritable();if(!org||!businessCan("manage-members"))return;
 const s=userStore(),u=s.users.find(x=>x.id===id);if(!u||!(org.memberIds||[]).includes(id))return;
 if(!businessMemberRoleAllowed(u))return alert("This member has a higher-level role and can only be edited by Superadmin.");
 modal("Edit Organization Member",`<div class="wsFormGrid">${textField("bizEditName","Full name",u.name||"")}${textField("bizEditEmail","Email / username",u.email||"")}${selectField("bizEditRole","Primary role",["learner","teacher","business"],u.primaryRole||u.role||"learner")}${selectField("bizEditStatus","Status",["active","suspended"],u.status||"active")}${textField("bizEditPassword","New password (optional)","","password")}</div>`,`<button class="primary" id="bizEditSave">Save Changes</button>`);
 $("#bizEditSave").onclick=async()=>{
  const r=$("#bizEditRole").value,email=$("#bizEditEmail").value.trim().toLowerCase(),name=$("#bizEditName").value.trim(),pw=$("#bizEditPassword").value;
  if(!BUSINESS_MEMBER_ROLES.includes(r))return alert("Business cannot assign Administrator or Superadmin.");
  if(!name||!email)return alert("Name and email/username are required.");
  if(s.users.some(x=>x.id!==u.id&&(x.email||"").toLowerCase()===email))return alert("This email/username already exists.");
  u.name=name;u.email=email;u.roles=[r];u.primaryRole=r;u.role=r;u.status=$("#bizEditStatus").value;u.updatedAt=now();
  if(pw){if(pw.length<8)return alert("Password must contain at least 8 characters.");u.passwordHash=await roleHashPassword(pw)}
  saveUsers(s);
  org.teacherIds=(org.teacherIds||[]).filter(x=>x!==u.id);org.businessAccountIds=(org.businessAccountIds||[]).filter(x=>x!==u.id);
  if(r==="teacher")org.teacherIds.push(u.id);if(r==="business")org.businessAccountIds.push(u.id);
  saveW(workspace());auditEvent("business.member.edited",{organizationId:org.id,userId:u.id,role:r});closeModal();businessMembersView()
 }
}
function businessMemberPermissionEditor(id){
 const org=businessOrgWritable();if(!org||!businessCan("manage-members"))return;
 const u=userStore().users.find(x=>x.id===id);if(!u||!(org.memberIds||[]).includes(id))return;
 if(!businessMemberRoleAllowed(u))return alert("Higher-level role permissions are managed by Superadmin.");
 const current=org.memberPermissions?.[id]||[];
 modal("Member Permissions",`<p><b>${esc(u.name)}</b><br><small>${esc(u.email)}</small></p><div class="permissionCheckGrid">${BUSINESS_MEMBER_PERMISSIONS.map(([key,label])=>`<label><input type="checkbox" data-biz-permission="${key}" ${current.includes(key)?"checked":""}> ${esc(label)}</label>`).join("")}</div><p class="muted">These permissions apply only inside ${esc(org.name)} and cannot grant Administrator or Superadmin authority.</p>`,`<button class="primary" id="bizPermissionSave">Save Permissions</button>`);
 $("#bizPermissionSave").onclick=()=>{org.memberPermissions[id]=$$("[data-biz-permission]:checked").map(x=>x.dataset.bizPermission);saveW(workspace());auditEvent("business.member.permissions.updated",{organizationId:org.id,userId:id,count:org.memberPermissions[id].length});closeModal();businessMembersView()}
}
function businessMemberRemove(id){
 const org=businessOrgWritable();if(!org||!businessCan("manage-members"))return;
 const u=userStore().users.find(x=>x.id===id);if(!u)return;
 if(!businessMemberRoleAllowed(u))return alert("Higher-level roles can only be removed by Superadmin.");
 if(!confirm(`Remove ${u.name} from ${org.name}? The account itself will remain in the Tina user registry.`))return;
 org.memberIds=(org.memberIds||[]).filter(x=>x!==id);org.teacherIds=(org.teacherIds||[]).filter(x=>x!==id);org.businessAccountIds=(org.businessAccountIds||[]).filter(x=>x!==id);delete org.memberPermissions[id];saveW(workspace());auditEvent("business.member.removed",{organizationId:org.id,userId:id});businessMembersView()
}

function businessView(){
 if(!(role()==="business"||isSuperadmin()))return show('<div class="feedback bad">Business access is required.</div>');
 const org=businessOrgContext();
 if(!org)return show(`<div class="sectionHead"><div><div class="eyebrow">BUSINESS WORKSPACE</div><h2>Organization access not assigned</h2><p class="muted">Superadmin must first assign this Business account to a school or organization.</p></div></div><section class="card"><p>Ask Superadmin to add this account under <b>Business Organizations</b>.</p></section>`);
 const users=userStore().users,teachers=users.filter(u=>(org.teacherIds||[]).includes(u.id)),members=users.filter(u=>(org.memberIds||[]).includes(u.id));
 show(`<div class="sectionHead"><div><div class="eyebrow">${esc(org.type||"ORGANIZATION")}</div><h2>${esc(org.name)}</h2><p class="muted">Organization administration: programs, teachers, members and reports.</p></div><div class="actions"><button class="primary" id="bizOrgProgram">+ Program</button><button id="bizOrgMembers">Manage Members</button></div></div><section class="teacherMetrics"><article><b>${org.programs.length}</b><span>Programs</span></article><article><b>${teachers.length}</b><span>Teachers</span></article><article><b>${members.length}</b><span>Members</span></article><article><b>${org.reports.length}</b><span>Reports</span></article></section><section class="businessDashboardGrid"><article class="card businessPanel"><h3>Programs</h3><div class="businessProgramList">${org.programs.length?org.programs.map(p=>`<article class="businessProgramCard"><div><b>${esc(p.title)}</b><small>${esc(p.status||"active")} · ${esc(p.pathway||"General")}</small></div><button data-org-program="${p.id}">Manage</button></article>`).join(""):'<div class="empty">No programs yet.</div>'}</div></article><article class="card businessPanel"><h3>Teachers</h3><div class="list">${teachers.length?teachers.map(t=>`<div class="row"><div><b>${esc(t.name)}</b><small>${esc(t.email)}</small></div><span class="badge">teacher</span></div>`).join(""):'<div class="empty">No teachers assigned.</div>'}</div></article></section><section class="businessDashboardGrid"><article class="card businessPanel"><div class="panelHead"><div><h3>Members</h3><p>Accounts belonging to this organization.</p></div><button id="bizOrgMembers2">Manage</button></div><div class="list">${members.slice(0,10).map(m=>`<div class="row"><div><b>${esc(m.name)}</b><small>${esc(m.email)}</small></div><span>${userRoles(m).map(roleLabel).join(", ")}</span></div>`).join("")||'<div class="empty">No members assigned.</div>'}</div></article><article class="card businessPanel"><div class="panelHead"><div><h3>Organization Reports</h3></div><button id="bizOrgReport">Generate</button></div><div class="list">${org.reports.slice().reverse().map(r=>`<div class="row"><div><b>${esc(r.title)}</b><small>${esc(new Date(r.createdAt).toLocaleString())}</small></div><button data-org-report="${r.id}">Open</button></div>`).join("")||'<div class="empty">No reports yet.</div>'}</div></article></section>`);
 $("#bizOrgProgram").onclick=businessProgramsView;$("#bizOrgMembers").onclick=businessMembersView;$("#bizOrgMembers2").onclick=businessMembersView;$("#bizOrgReport").onclick=businessReportsView;$$("[data-org-program]").forEach(b=>b.onclick=()=>businessOrgProgramEditor(b.dataset.orgProgram));$$("[data-org-report]").forEach(b=>b.onclick=()=>businessOrgReportView(b.dataset.orgReport))
}
function businessOrgProgramEditor(id=null){
 const w=ensureOrganizations(),org=businessOrgContext();if(!org)return businessView();const p=id?org.programs.find(x=>x.id===id):{};
 modal(id?"Manage Program":"Create Program",`<div class="wsFormGrid">${textField("orgProgramTitle","Program title",p.title||"")}${textField("orgProgramPath","Pathway / course",p.pathway||"")}${selectField("orgProgramStatus","Status",["active","paused","completed","archived"],p.status||"active")}</div>`,`<button class="primary" id="orgProgramSave">Save Program</button>`);
 $("#orgProgramSave").onclick=()=>{const title=$("#orgProgramTitle").value.trim();if(!title)return alert("Program title is required.");const rec=id?p:{id:uid("org-program"),createdAt:now()};rec.title=title;rec.pathway=$("#orgProgramPath").value.trim();rec.status=$("#orgProgramStatus").value;rec.updatedAt=now();if(!id)org.programs.push(rec);saveW(w);closeModal();businessView()}
}
function businessOrgMemberManager(){
 const w=ensureOrganizations(),org=businessOrgContext();if(!org)return businessView();const eligible=userStore().users.filter(u=>u.status!=="suspended"&&!userRoles(u).includes("superadmin"));
 show(`<div class="sectionHead"><div><div class="eyebrow">BUSINESS · MEMBERS</div><h2>${esc(org.name)} Members</h2><p class="muted">Manage membership only inside this Superadmin-created organization.</p></div><button id="orgMemberBack">← Business Dashboard</button></div><section class="card"><div class="permissionCheckGrid">${eligible.map(u=>`<label><input type="checkbox" data-business-member="${u.id}" ${(org.memberIds||[]).includes(u.id)?"checked":""}> <span><b>${esc(u.name)}</b><br><small>${esc(u.email)} · ${userRoles(u).map(roleLabel).join(", ")}</small></span></label>`).join("")}</div><div class="actions"><button class="primary" id="businessMembersSave">Save Membership</button></div></section>`);
 $("#orgMemberBack").onclick=businessView;$("#businessMembersSave").onclick=()=>{org.memberIds=$$("[data-business-member]:checked").map(x=>x.dataset.businessMember);saveW(w);businessView()}
}
function businessOrgGenerateReport(){const w=ensureOrganizations(),org=businessOrgContext();if(!org)return;const r={id:uid("org-report"),title:`${org.name} · Report · ${new Date().toLocaleDateString()}`,createdAt:now(),programs:org.programs.length,teachers:(org.teacherIds||[]).length,members:(org.memberIds||[]).length};org.reports.push(r);saveW(w);businessOrgReportView(r.id)}
function businessOrgReportView(id){const org=businessOrgContext(),r=org?.reports.find(x=>x.id===id);if(!r)return businessView();show(`<div class="sectionHead"><div><div class="eyebrow">BUSINESS · REPORT</div><h2>${esc(r.title)}</h2></div><button id="orgReportBack">← Business Dashboard</button></div><section class="healthMetrics"><article><b>${r.programs}</b><span>Programs</span></article><article><b>${r.teachers}</b><span>Teachers</span></article><article><b>${r.members}</b><span>Members</span></article><article><b>${esc(org.code||"—")}</b><span>Organization code</span></article></section>`);$("#orgReportBack").onclick=businessView}
/* ---------- ACCOUNT CENTER / REMOVE DUPLICATE ADMIN LOGIN ---------- */
function superadminPasswordView(){
 if(!isSuperadmin())return accountCenter();
 const s=session()||{};
 show(`<div class="sectionHead"><div><div class="eyebrow">SUPERADMIN · SECURITY</div><h2>Change Superadmin Password</h2><p class="muted">Update the password for <b>${esc(s.email||"superadmin")}</b>. The new password is stored only in this local account store.</p></div><button class="ghost" id="saPasswordBack">← Account</button></div>
 <section class="card accountSecurityCard">
  <div class="wsFormGrid">
   <label class="wsField wsFieldFull"><span>Current password</span><input id="saCurrentPassword" type="password" autocomplete="current-password"></label>
   <label class="wsField wsFieldFull"><span>New password</span><input id="saNewPassword" type="password" autocomplete="new-password" placeholder="At least 8 characters"></label>
   <label class="wsField wsFieldFull"><span>Confirm new password</span><input id="saConfirmPassword" type="password" autocomplete="new-password"></label>
  </div>
  <div id="saPasswordFeedback"></div>
  <div class="actions"><button class="primary" id="saPasswordSave">Save New Password</button><button id="saPasswordCancel">Cancel</button></div>
 </section>`);
 $("#saPasswordBack").onclick=accountCenter;$("#saPasswordCancel").onclick=accountCenter;
 $("#saConfirmPassword").addEventListener("keydown",e=>{if(e.key==="Enter")$("#saPasswordSave").click()});
 $("#saPasswordSave").onclick=async()=>{
   const feedback=$("#saPasswordFeedback"),btn=$("#saPasswordSave");
   try{
     btn.disabled=true;btn.textContent="Saving...";
     const oldPass=$("#saCurrentPassword").value,newPass=$("#saNewPassword").value,confirmPass=$("#saConfirmPassword").value;
     if(newPass.length<8)throw new Error("New password must contain at least 8 characters.");
     if(newPass!==confirmPass)throw new Error("The new password confirmation does not match.");
     const store=userStore(),u=store.users.find(x=>x.id===s.id&&x.role==="superadmin");
     if(!u)throw new Error("Superadmin account record was not found.");
     if(await roleHashPassword(oldPass)!==u.passwordHash)throw new Error("Current password is incorrect.");
     u.passwordHash=await roleHashPassword(newPass);u.updatedAt=now();saveUsers(store);
     auditEvent("auth.superadmin.password.changed",{userId:u.id});
     feedback.innerHTML='<div class="feedback ok">Superadmin password updated successfully.</div>';
     setTimeout(accountCenter,500);
   }catch(err){feedback.innerHTML=`<div class="feedback bad">${esc(err?.message||String(err))}</div>`}
   finally{btn.disabled=false;btn.textContent="Save New Password"}
 }
}
async function logoutCurrentAccount(){
 const previous=session();
 try{closeUsageSession("logout")}catch{}
 window.TinaBackend?.syncNow?.("logout").catch(()=>{});
 window.TinaBackend?.logout?.().catch(()=>{});
 [USER_SESSION_KEY,ADMIN_SESSION,"tina.v14.superadmin.session","tina.v14.login.intent"].forEach(k=>sessionStorage.removeItem(k));
 localStorage.removeItem("tina.v14.active.user");localStorage.removeItem("tina.v14.persisted.user.session");
 document.documentElement.classList.remove("role-sidebar-active","role-sidebar-collapsed");
 $("#roleSidebar")?.remove();$("#roleGroupedNav")?.remove();
 showLoggedOutChoice(previous)
}
function showLoggedOutChoice(previous){
 document.documentElement.classList.add("authSurfaceActive");
 $("#app").innerHTML=`<div class="wrap loggedOutWrap"><section class="card loggedOutCard"><div class="eyebrow">SIGNED OUT</div><h1>You are signed out</h1><p>${previous?.email?`Signed out from <b>${esc(previous.email)}</b>.`:"Your session has ended."}</p><div class="loggedOutActions"><button class="primary" id="loginAgain">Log in again</button><button id="loginAnotherRole">Log in as another role</button></div></section></div>`;
 $("#loginAgain").onclick=()=>{const target=previous?.activeRole||previous?.role||"learner";if(!authRoleEnabled("login",target))return openRoleEntry();sessionStorage.setItem("tina.v14.login.intent",target);if(target==="superadmin")return superadminLoginPortal();if(target==="admin")return window.TinaAuth?.openAdmin?.();return window.TinaAuth?.openUserLogin?.()};
 $("#loginAnotherRole").onclick=openRoleEntry;window.TinaAuthChrome?.refresh?.();
}
function accountCenter(){
 const s=session()||{},r=role(),isSA=isSuperadmin();
 show(`<div class="sectionHead"><div><div class="eyebrow">ACCOUNT</div><h2>${esc(s.name||s.email||"Account")}</h2><p class="muted">${esc(r==="learner"?"Student":r==="superadmin"?"Superadmin":r.charAt(0).toUpperCase()+r.slice(1))} account</p></div></div>
 <section class="accountCenterGrid">
  <article class="card"><h3>Account Information</h3><div class="list"><div class="row"><span>Name</span><b>${esc(s.name||"—")}</b></div><div class="row"><span>Username / email</span><b>${esc(s.email||"—")}</b></div><div class="row"><span>Role</span><span class="badge">${esc(r)}</span></div></div></article>
  <article class="card"><h3>Account Actions</h3>${(s.roles||[]).length>1?`<div class="accountRoleSwitch"><label><span>Active role</span><select id="accountRoleSelect">${(s.roles||[]).map(x=>`<option value="${esc(x)}" ${x===r?"selected":""}>${esc(x==="learner"?"Student":x.charAt(0).toUpperCase()+x.slice(1))}</option>`).join("")}</select></label><button id="accountRoleSwitchBtn">Switch Role</button></div>`:""}<div class="accountActionGrid">
   ${r==="business"?`<button id="accountBusinessDashboard"><span>Organization Dashboard</span><small>Programs, teachers, members and reports</small></button><button id="accountBusinessMembers"><span>Manage Members</span><small>Add, edit, remove and assign organization permissions</small></button><button id="accountBusinessPrograms"><span>Programs</span><small>Manage organization learning programs</small></button><button id="accountBusinessTeachers"><span>Teachers</span><small>View and manage organization teachers</small></button><button id="accountBusinessReports"><span>Reports</span><small>Open organization reports</small></button>`:""}
   <button id="accountProfile"><span>Profile</span><small>Identity and account preferences</small></button>
   ${isSA?'<button id="accountPassword"><span>Change Password</span><small>Update your Superadmin credentials</small></button>':""}
   <button class="dangerAction" id="accountLogout"><span>Log Out</span><small>End this session and return to role selection</small></button>
  </div></article>
 </section>`);
 $("#accountRoleSwitchBtn")?.addEventListener("click",()=>switchActiveRole($("#accountRoleSelect").value));
 $("#accountBusinessDashboard")?.addEventListener("click",businessView);
 $("#accountBusinessMembers")?.addEventListener("click",businessMembersView);
 $("#accountBusinessPrograms")?.addEventListener("click",businessProgramsView);
 $("#accountBusinessTeachers")?.addEventListener("click",businessTeachersView);
 $("#accountBusinessReports")?.addEventListener("click",businessReportsView);
 $("#accountProfile").onclick=profileView;
 $("#accountPassword")?.addEventListener("click",superadminPasswordView);
 $("#accountLogout").onclick=logoutCurrentAccount;
}
function installAccountChip(){
 const shell=$("#roleGroupedNav");if(!shell)return;
 $$(".adminV14Btn,#interfaceSwitcher,.interfaceSwitcher").forEach(x=>x.style.display="none");
 let b=$("#roleAccountChip");
 if(!b){b=document.createElement("button");b.id="roleAccountChip";b.className="roleAccountChip";b.type="button";shell.appendChild(b)}
 const s=session()||{},rr=role(),p=profileSafe();
 b.innerHTML=`<span class="roleChipAvatar">${p?.avatar?`<img src="${esc(p.avatar)}" alt="">`:esc((s.name||s.email||"U").slice(0,1).toUpperCase())}</span><span><b>${esc(s.name||s.email||"Account")}</b><small>${esc(rr==="learner"?"Student":rr==="superadmin"?"Superadmin":rr.charAt(0).toUpperCase()+rr.slice(1))}</small></span>`;
 b.setAttribute("aria-label","Open account center");
 b.onclick=accountCenter
}
function profileSafe(){try{const w=workspace(),id=currentUserId(),s=session()||{};return w.profiles?.[id]||{displayName:s.name||"",avatar:""}}catch{return{}}}

/* ---------- ADMIN-ONLY DATA EDITING ---------- */
const DATA_EDIT_SELECTORS=[
 "#addCard","#newDeck","#newV10Deck",".editV10Card",".deleteV10Card",".dupV10Deck",
 ".editCard",".deleteCard",".usrEdit",".usrReset","#wsAddBlock","[data-add-type]",
 ".editDraft","#newGoal"
];
function enforceAdminOnlyDataEditing(){
 const adminMode=isAdmin();
 DATA_EDIT_SELECTORS.forEach(sel=>$$(sel).forEach(el=>{
   if(!adminMode){el.style.display="none";el.setAttribute("aria-hidden","true");el.disabled=true}
 }));
 // Authoring/content-management routes are never exposed to ordinary users.
 if(!adminMode)$$("#nav [data-view='author'],#nav [data-view='content-v12'],#nav [data-view='data'],#nav [data-view='academy']").forEach(x=>x.style.display="none");
}
function adminEscalations(){const w=workspace();w.adminEscalations=Array.isArray(w.adminEscalations)?w.adminEscalations:[];return w}
function adminReviewEscalationView(){
 if(role()!=="admin"&&!isSuperadmin())return;
 const w=adminEscalations(),mine=w.adminEscalations.filter(x=>isSuperadmin()||x.createdBy===currentUserId()).slice().reverse();
 show(`<section class="adminReviewPage"><div class="sectionHead"><div><div class="eyebrow">ADMIN · REVIEW & ESCALATE</div><h2>Review work outside your authority</h2><p class="muted">Record the issue, recommendation and evidence. Restricted decisions are sent to Superadmin instead of being executed by Administrator.</p></div><button class="primary" id="adminEscNew">+ Escalation</button></div><section class="card"><div class="list">${mine.map(x=>`<div class="row"><div><b>${esc(x.title)}</b><small>${esc(x.category)} · ${esc(x.status)} · ${esc(new Date(x.createdAt).toLocaleString())}</small><p>${esc(x.recommendation||"")}</p></div><span class="badge">${esc(x.priority)}</span></div>`).join("")||'<div class="empty">No escalation cases yet.</div>'}</div></section></section>`);
 $("#adminEscNew").onclick=()=>modal("Escalate to Superadmin",`<div class="wsFormGrid">${textField("escTitle","Issue / decision title","")}${selectField("escCategory","Category",["User access","Sensitive data","Course governance","Canonical / Academy","Destructive action","Security","Other"],"User access")}${selectField("escPriority","Priority",["normal","high","critical"],"normal")}${areaField("escEvidence","Evidence / context","")}${areaField("escRecommendation","Administrator recommendation","")}</div>`,`<button class="primary" id="escSubmit">Send to Superadmin</button>`);
 document.querySelector("#escSubmit")?.addEventListener("click",()=>{const title=$("#escTitle").value.trim();if(!title)return alert("Title is required.");w.adminEscalations.push({id:uid("esc"),title,category:$("#escCategory").value,priority:$("#escPriority").value,evidence:$("#escEvidence").value,recommendation:$("#escRecommendation").value,status:"submitted",createdBy:currentUserId(),createdAt:now(),updatedAt:now()});saveW(w);auditEvent("admin.escalation.submitted",{title,category:$("#escCategory").value});closeModal();adminReviewEscalationView()})
}
function superadminEscalationDeskView(){
 if(!isSuperadmin())return;
 const w=adminEscalations(),rows=w.adminEscalations.slice().reverse();
 show(`<section class="adminEscDesk"><div class="sectionHead"><div><div class="eyebrow">SUPERADMIN · ESCALATIONS</div><h2>Administrator Escalation Desk</h2><p class="muted">Decide work that exceeds Administrator authority.</p></div></div><section class="card"><div class="list">${rows.map(x=>`<div class="row"><div><b>${esc(x.title)}</b><small>${esc(x.category)} · ${esc(x.priority)} · ${esc(x.status)}</small><p>${esc(x.recommendation||x.evidence||"")}</p></div><select data-esc-status="${x.id}">${["submitted","in-review","approved","rejected","resolved"].map(s=>`<option value="${s}" ${x.status===s?"selected":""}>${s}</option>`).join("")}</select></div>`).join("")||'<div class="empty">No escalations.</div>'}</div></section></section>`);
 $$("[data-esc-status]").forEach(s=>s.onchange=()=>{const x=w.adminEscalations.find(v=>v.id===s.dataset.escStatus);if(x){x.status=s.value;x.updatedAt=now();saveW(w);auditEvent("admin.escalation.status",{id:x.id,status:x.status})}})
}
function adminDelegatedDataView(){
 if(role()!=="admin"||!hasPermission("data"))return show('<div class="feedback warn">Sensitive data editing requires explicit Superadmin delegation.</div>');
 const w=workspace();w.delegatedDataEdits=Array.isArray(w.delegatedDataEdits)?w.delegatedDataEdits:[];
 show(`<section><div class="sectionHead"><div><div class="eyebrow">DELEGATED DATA EDITING</div><h2>Non-destructive data work</h2><p class="muted">Administrator may edit only the delegated scope. Export, import, reset, delete and system backup remain Superadmin-only.</p></div><button class="primary" id="delegatedEditNew">+ Edit Note</button></div><section class="card"><div class="list">${w.delegatedDataEdits.map(x=>`<div class="row"><div><b>${esc(x.scope)}</b><small>${esc(x.status)} · ${esc(x.at)}</small><p>${esc(x.notes)}</p></div></div>`).join("")||'<div class="empty">No delegated edits recorded.</div>'}</div></section></section>`);
 $("#delegatedEditNew").onclick=()=>modal("Record Delegated Edit",`<div class="wsFormGrid">${textField("dedScope","Delegated scope","")}${areaField("dedNotes","Change / validation notes","")}</div>`,`<button class="primary" id="dedSave">Save</button>`);
 $("#dedSave")?.addEventListener("click",()=>{w.delegatedDataEdits.push({id:uid("ded"),scope:$("#dedScope").value||"Assigned scope",notes:$("#dedNotes").value,status:"recorded",at:now(),by:currentUserId()});saveW(w);closeModal();adminDelegatedDataView()})
}
function adminEditingStudio(){
 if(role()!=="admin"&&!isSuperadmin())return;
 if(isSuperadmin())return clickDataView("content-v12");
 const cards=[];
 if(hasPermission("content"))cards.push(["Content Studio","Edit delegated course/lesson content only.","content-v12"]);
 if(hasPermission("authoring"))cards.push(["Authoring Hub","Build content inside the explicitly delegated scope.","author"]);
 if(hasPermission("practice-admin"))cards.push(["Practice Administration","Edit delegated practice content.","practice-v10"]);
 if(hasPermission("assessment-admin"))cards.push(["Assessment Administration","Edit delegated assessment content.","assessment-v11"]);
 if(hasPermission("data"))cards.push(["Delegated Data Editing","Non-destructive edits only; no export/import/reset.","admin-data-extra"]);
 show(`<section><div class="sectionHead"><div><div class="eyebrow">ADMIN · DELEGATED EDITING</div><h2>Assigned operational scopes</h2><p class="muted">No content or user data is editable unless Superadmin explicitly delegates the corresponding permission.</p></div></div>${cards.length?`<section class="adminEditGrid">${cards.map(([t,d,r])=>`<article class="card"><h3>${esc(t)}</h3><p>${esc(d)}</p><button data-admin-delegated="${r}">Open</button></article>`).join("")}</section>`:`<article class="card empty"><h3>No editing scope assigned</h3><p>Use Review & Escalate to send restricted work to Superadmin.</p><button class="primary" id="adminEscalateInstead">Review & Escalate</button></article>`}</section>`);
 $$("[data-admin-delegated]").forEach(b=>b.onclick=()=>roleTargetOpen(b.dataset.adminDelegated));$("#adminEscalateInstead")?.addEventListener("click",adminReviewEscalationView)
}

/* ---------- AUTOMATIC MISTAKE ROUTING ---------- */
function unifiedMistakesView(detail={}){
 let p10={mistakes:[]},v8={mistakes:[]},v11={mistakes:[]},v4={attempts:[]};
 try{p10=JSON.parse(localStorage.getItem("tina.clean.v10.practice")||"{}")}catch{}
 try{v8=JSON.parse(localStorage.getItem("tina.clean.v8.practice")||"{}")}catch{}
 try{v11=JSON.parse(localStorage.getItem("tina.clean.v11.assessment")||"{}")}catch{}
 try{v4=JSON.parse(localStorage.getItem("tina.clean.v4.engine")||"{}")}catch{}
 const rows=[
  ...(p10.mistakes||[]).filter(x=>!x.resolved).map(x=>({source:x.source,prompt:x.prompt,target:x.target,answer:x.answer})),
  ...(v8.mistakes||[]).map(x=>({source:"Practice / Game",prompt:x.prompt,target:x.target,answer:x.answer})),
  ...(v11.mistakes||[]).map(x=>({source:x.skill,prompt:x.prompt,target:x.target,answer:x.answer})),
  ...(v4.attempts||[]).filter(x=>x.correct===false).map(x=>({source:x.type,prompt:x.prompt,target:"Review required",answer:x.answer||""}))
 ];
 show(`<div class="sectionHead"><div><div class="eyebrow">MISTAKES</div><h2>Review the error before continuing</h2><p class="muted">Wrong answers are automatically routed here for correction and recycling.</p></div><button class="primary" id="mistakeContinue">Continue Practice</button></div>
 <section class="card"><div class="list">${rows.length?rows.slice().reverse().map(x=>`<div class="row"><div><b>${esc(x.prompt||"Practice error")}</b><small>${esc(x.source||"Practice")} · Your answer: ${esc(x.answer||"—")}</small></div><span class="badge">${esc(x.target||"Review")}</span></div>`).join(""):'<div class="empty">No unresolved mistakes.</div>'}</div></section>`);
 $("#mistakeContinue").onclick=()=>clickDataView("learn")
}
window.addEventListener("tina:wrong-answer",e=>setTimeout(()=>unifiedMistakesView(e.detail||{}),120));


const ROLE_GUIDE_DATA={
 learner:{title:"Student",use:"Use Catalog, Active Learning, Games, Review, Progress, Reminders and Announcements. Access is controlled by assigned permissions.",higher:["Teacher","Business organization","Administrator","Superadmin"]},
 teacher:{title:"Teacher",use:"Manage classes, assignments, grading and learner progress. Teaching authority does not include system users, Canon or infrastructure.",higher:["Business organization (when assigned)","Administrator","Superadmin"]},
 business:{title:"Business",use:"Manage the assigned organization: programs, lower/equal-level members, teachers and reports. Authority stops at the organization boundary.",higher:["Administrator (system operations)","Superadmin"]},
 admin:{title:"Administrator",use:"Review operational work, manage roles below Administrator, and escalate restricted decisions to Superadmin. Content/data editing is available only when explicitly delegated; exports, credentials, Canon, Academy and destructive actions remain Superadmin-only.",higher:["Superadmin"]},
 superadmin:{title:"Superadmin",use:"Own identity, permissions, organizations, Canon, Tina Academy, infrastructure, system analytics, audit, announcements and issue resolution.",higher:[]},
 editor:{title:"Editor",use:"Edit delegated content and resources only.",higher:["Administrator","Superadmin"]},
 reviewer:{title:"Reviewer",use:"Review delegated assessment/content evidence and publication staging.",higher:["Administrator","Superadmin"]}
};

function syncRoleGuidePolicy(){
 if(typeof ROLE_GUIDE_DATA==="undefined"||typeof ROLE_GOVERNANCE_POLICY==="undefined")return;
 Object.entries(ROLE_GOVERNANCE_POLICY.roles).forEach(([r,d])=>{if(ROLE_GUIDE_DATA[r])ROLE_GUIDE_DATA[r].use=`${d.scope} Excluded/governed: ${d.excluded}`})
}

function myRoleGuideView(){
 syncRoleGuidePolicy();
 const d=ROLE_GUIDE_DATA[role()]||ROLE_GUIDE_DATA.learner;
 show(`<section class="roleHelpPage"><article class="card roleGuideHero"><div class="eyebrow">${esc(d.title)} GUIDE</div><h2>How to use your workspace</h2><p>${esc(d.use)}</p></article><section class="roleGuideSteps">${roleSidebarGroups().map(([group,items])=>`<article class="card"><h3>${esc(group)}</h3><ol>${items.map(([label])=>`<li>${esc(label)}</li>`).join("")}</ol></article>`).join("")}</section><article class="card"><h3>Who can help / govern this role?</h3><p>${d.higher.length?d.higher.map(x=>`<span class="roleRelationPill">${esc(x)}</span>`).join(" "):"This is the highest system role."}</p></article></section>`)
}
function roleHierarchyView(){
 const r=role(),d=ROLE_GUIDE_DATA[r]||ROLE_GUIDE_DATA.learner;
 const chain=[d.title,...d.higher];
 show(`<section class="roleHierarchyPage"><article class="card"><div class="eyebrow">ROLE HIERARCHY</div><h2>${esc(d.title)} → higher authority</h2><div class="roleHierarchyChain">${chain.map((x,i)=>`<div class="roleHierarchyNode ${i===0?"current":""}"><b>${esc(x)}</b><small>${i===0?"Current role":"Higher / related authority"}</small></div>${i<chain.length-1?'<span>→</span>':""}`).join("")}</div><p class="muted">Teacher and Business are domain-specific authority branches rather than a single linear rank. Superadmin remains the system owner.</p></article></section>`)
}
function supportContactsForRole(){
 const r=role(),org=organizationForUser?.(),users=userStore().users,contacts=[];
 if(r==="learner"){
   if(org){(org.teacherIds||[]).forEach(id=>{const u=users.find(x=>x.id===id);if(u)contacts.push({type:"Teacher",user:u})});(org.businessAccountIds||[]).forEach(id=>{const u=users.find(x=>x.id===id);if(u)contacts.push({type:"Organization",user:u})})}
   users.filter(u=>userRoles(u).includes("admin")&&accountCanAuthenticate(u)).slice(0,3).forEach(u=>contacts.push({type:"Administrator",user:u}))
 }else if(r==="teacher"){
   if(org)(org.businessAccountIds||[]).forEach(id=>{const u=users.find(x=>x.id===id);if(u)contacts.push({type:"Organization",user:u})});
   users.filter(u=>userRoles(u).includes("admin")&&accountCanAuthenticate(u)).slice(0,3).forEach(u=>contacts.push({type:"Administrator",user:u}))
 }else if(r==="business"||r==="admin"){
   users.filter(u=>userRoles(u).includes("superadmin")&&accountCanAuthenticate(u)).forEach(u=>contacts.push({type:"Superadmin",user:u}))
 }else if(r==="superadmin"){
   contacts.push({type:"System owner",user:session()||{name:"Superadmin",email:"superadmin"}})
 }
 return contacts
}

const CONTACT_DIRECTORY_KEY="tina.v14.contact.directory";
function contactDirectory(){
 try{const x=JSON.parse(localStorage.getItem(CONTACT_DIRECTORY_KEY)||"{}");return{personal:x.personal||{},roleContacts:Array.isArray(x.roleContacts)?x.roleContacts:[]}}catch{return{personal:{},roleContacts:[]}}
}
function saveContactDirectory(x){localStorage.setItem(CONTACT_DIRECTORY_KEY,JSON.stringify(x));window.TinaBackend?.scheduleSync?.("contact-directory")}
function manualContactsForCurrentRole(){const d=contactDirectory(),r=role(),mine=d.personal[currentUserId()]||[],shared=d.roleContacts.filter(x=>(x.roles||[]).includes("*")||(x.roles||[]).includes(r));return[...mine.map(x=>({...x,scope:"Personal"})),...shared.map(x=>({...x,scope:"Role contact"}))]}
function openManualContactEditor(id=null,roleWide=false){
 if(roleWide&&!isSuperadmin())return alert("Only Superadmin can edit role contacts.");
 const d=contactDirectory(),pool=roleWide?d.roleContacts:(d.personal[currentUserId()]||[]),x=id?pool.find(v=>v.id===id):{};
 const roleChoices=["learner","teacher","business","editor","reviewer","admin","superadmin"];
 modal(id?"Edit Contact":"Add Contact",`<div class="wsFormGrid">${textField("contactName","Contact name",x.name||"")}${textField("contactLabel","Role / label",x.label||"")}${textField("contactEmail","Email",x.email||"")}${textField("contactPhone","Phone",x.phone||"")}${roleWide?`<label class="wsField wsFieldFull"><span>Visible to roles</span><div class="roleCheckGrid">${roleChoices.map(rr=>`<label><input type="checkbox" data-contact-role="${rr}" ${(x.roles||[]).includes(rr)?"checked":""}> ${roleLabel(rr)}</label>`).join("")}</div></label>`:""}${areaField("contactNotes","Notes",x.notes||"")}</div>`,`<button class="primary" id="contactSave">Save Contact</button>`);
 $("#contactSave").onclick=()=>{const name=$("#contactName").value.trim(),email=$("#contactEmail").value.trim(),phone=$("#contactPhone").value.trim();if(!name)return alert("Contact name is required.");if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return alert("Use a valid email, for example: teacher@tina.local");const rec=id?x:{id:uid("contact"),createdAt:now()};Object.assign(rec,{name,label:$("#contactLabel").value.trim()||"Contact",email,phone,notes:$("#contactNotes").value.trim(),updatedAt:now()});if(roleWide){rec.roles=$$("[data-contact-role]:checked").map(b=>b.dataset.contactRole);if(!rec.roles.length)return alert("Select at least one role that can see this contact.");if(!id)d.roleContacts.push(rec)}else{d.personal[currentUserId()]=d.personal[currentUserId()]||[];if(!id)d.personal[currentUserId()].push(rec)}saveContactDirectory(d);closeModal();contactSupportView()}
}
function deleteManualContact(id){const d=contactDirectory();d.personal[currentUserId()]=(d.personal[currentUserId()]||[]).filter(x=>x.id!==id);if(isSuperadmin())d.roleContacts=d.roleContacts.filter(x=>x.id!==id);saveContactDirectory(d);contactSupportView()}

function contactSupportView(){
 const contacts=supportContactsForRole(),manual=manualContactsForCurrentRole();
 show(`<section class="supportPage"><div class="pageTitleCompact"><div><h2>Contact & Support</h2><p class="muted">System contacts follow your role hierarchy. You can also keep your own contact directory.</p></div><div class="actions"><button class="primary" id="contactAddPersonal">+ Add Contact</button>${isSuperadmin()?'<button id="contactAddRole">+ Role Contact</button>':""}</div></div><section class="supportContactGrid">${contacts.length?contacts.map(c=>`<article class="card"><div class="eyebrow">${esc(c.type)}</div><h3>${esc(c.user.name||"Contact")}</h3><p>${esc(c.user.email||"No email saved")}</p><button data-contact-compose="${esc(c.user.id||"system")}">Send internal message</button></article>`).join(""):''}${manual.map(c=>`<article class="card manualContactCard"><div class="eyebrow">${esc(c.scope)} · ${esc(c.label||"Contact")}</div><h3>${esc(c.name)}</h3>${c.email?`<p>${esc(c.email)}</p>`:""}${c.phone?`<p>${esc(c.phone)}</p>`:""}${c.notes?`<small>${esc(c.notes)}</small>`:""}<div class="actions">${c.email?`<button data-contact-email="${esc(c.email)}">Email</button>`:""}${c.phone?`<button data-contact-phone="${esc(c.phone)}">Call</button>`:""}${(c.scope==="Personal"||isSuperadmin())?`<button data-contact-edit="${c.id}" data-contact-scope="${c.scope}">Edit</button><button data-contact-delete="${c.id}">Delete</button>`:""}</div></article>`).join("")}${!contacts.length&&!manual.length?'<div class="empty">No role-appropriate contact is assigned yet. Add a personal contact or ask Superadmin to assign a role contact.</div>':""}</section><section class="card"><h3>Need help with a bug or suggestion?</h3><button class="primary" id="supportIssueOpen">Feedback / Bug Report</button></section></section>`);
 $("#supportIssueOpen").onclick=feedbackIssueView;$("#contactAddPersonal").onclick=()=>openManualContactEditor();$("#contactAddRole")?.addEventListener("click",()=>openManualContactEditor(null,true));
 $$("[data-contact-compose]").forEach(b=>b.onclick=()=>supportMessageComposer(b.dataset.contactCompose));$$("[data-contact-email]").forEach(b=>b.onclick=()=>window.location.href=`mailto:${b.dataset.contactEmail}`);$$("[data-contact-phone]").forEach(b=>b.onclick=()=>window.location.href=`tel:${b.dataset.contactPhone}`);$$("[data-contact-edit]").forEach(b=>b.onclick=()=>openManualContactEditor(b.dataset.contactEdit,b.dataset.contactScope==="Role contact"));$$("[data-contact-delete]").forEach(b=>b.onclick=()=>{if(confirm("Delete this contact?"))deleteManualContact(b.dataset.contactDelete)})
}
function ensureCommunicationStore(){const w=workspace();w.communication=Object.assign({messages:[],issues:[],announcements:[],reminders:[]},w.communication||{});return w}
function supportMessageComposer(targetId){
 const w=ensureCommunicationStore(),target=userStore().users.find(x=>x.id===targetId);
 modal("Send Internal Message",`<div class="wsFormGrid">${textField("supportMsgSubject","Subject","")}${areaField("supportMsgBody","Message","")}</div><p class="muted">To: ${esc(target?.name||targetId)}</p>`,`<button class="primary" id="supportMsgSend">Send Message</button>`);
 $("#supportMsgSend").onclick=()=>{const subject=$("#supportMsgSubject").value.trim(),body=$("#supportMsgBody").value.trim();if(!subject||!body)return alert("Subject and message are required.");w.communication.messages.push({id:uid("msg"),fromUserId:currentUserId(),toUserId:targetId,subject,body,status:"sent",createdAt:now()});saveW(w);auditEvent("support.message.sent",{targetUserId:targetId});closeModal();contactSupportView()}
}
function feedbackIssueView(){
 const w=ensureCommunicationStore(),mine=w.communication.issues.filter(x=>x.userId===currentUserId()).slice().reverse();
 show(`<section class="issuePage"><div class="pageTitleCompact"><h2>Feedback & Bug Reports</h2><button class="primary" id="issueNew">+ New Report</button></div><section class="card"><div class="list">${mine.length?mine.map(x=>`<div class="row"><div><b>${esc(x.title)}</b><small>${esc(x.type)} · ${esc(new Date(x.createdAt).toLocaleString())}</small>${x.superadminNote?`<small>Response: ${esc(x.superadminNote)}</small>`:""}</div><span class="badge">${esc(x.status)}</span></div>`).join(""):'<div class="empty">No reports submitted yet.</div>'}</div></section></section>`);
 $("#issueNew").onclick=issueComposer
}
function issueComposer(){
 const w=ensureCommunicationStore();
 modal("Submit Feedback / Bug",`<div class="wsFormGrid">${selectField("issueType","Type",["Bug","Suggestion","Content issue","Access issue","Other"],"Bug")}${selectField("issueSeverity","Severity",["Low","Medium","High","Critical"],"Medium")}${textField("issueTitle","Title","")}${areaField("issueBody","Description","")}</div>`,`<button class="primary" id="issueSubmit">Submit</button>`);
 $("#issueSubmit").onclick=()=>{const title=$("#issueTitle").value.trim(),body=$("#issueBody").value.trim();if(!title||!body)return alert("Title and description are required.");w.communication.issues.push({id:uid("issue"),userId:currentUserId(),role:role(),type:$("#issueType").value,severity:$("#issueSeverity").value,title,body,status:"open",createdAt:now(),updatedAt:now()});saveW(w);auditEvent("feedback.issue.created",{title,type:$("#issueType").value});closeModal();feedbackIssueView()}
}
function superadminIssueDeskView(){
 if(!isSuperadmin())return;
 const w=ensureCommunicationStore(),rows=w.communication.issues.slice().reverse();
 show(`<section class="issueDeskPage"><div class="pageTitleCompact"><h2>Feedback & Issue Desk</h2><span class="badge">${rows.filter(x=>!["resolved","closed"].includes(x.status)).length} open</span></div><section class="card"><div class="tableWrap"><table><thead><tr><th>User</th><th>Type</th><th>Severity</th><th>Issue</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map(x=>{const u=userStore().users.find(u=>u.id===x.userId);return `<tr><td>${esc(u?.name||x.userId)}<br><small>${esc(x.role)}</small></td><td>${esc(x.type)}</td><td>${esc(x.severity)}</td><td><b>${esc(x.title)}</b><br><small>${esc(x.body.slice(0,140))}</small></td><td>${esc(x.status)}</td><td><button data-issue-manage="${x.id}">Manage</button></td></tr>`}).join("")}</tbody></table></div></section></section>`);
 $$("[data-issue-manage]").forEach(b=>b.onclick=()=>superadminIssueEditor(b.dataset.issueManage))
}
function issueRepairProposal(x){
 const text=`${x.title||""} ${x.body||""}`.toLowerCase();
 let area="General runtime / UI",action="Reproduce the issue, inspect the affected route/state and runtime evidence, then apply the smallest isolated patch.",tests=["Reproduce before patch","Verify after patch","Run targeted regression tests"];
 if(/sidebar|menu|navigation/.test(text)){area="Sidebar / navigation shell";action="Inspect sidebar route rendering, geometry and duplicate navigation handlers. Reuse the existing shell contract and avoid a second layout system.";tests=["Sidebar route test","Desktop geometry check","Mobile overlay check"]}
 else if(/button|duplicate|twice|2 button|hai nút/.test(text)){area="Action rendering / idempotency";action="Identify the canonical existing action and make the repair/render function idempotent so it reuses the existing control instead of appending another.";tests=["Single-control count","Repeated-render idempotency","Action route test"]}
 else if(/login|auth|password|access/.test(text)){area="Authentication / access control";action="Trace role/auth gates and the backend authorization boundary, correct the smallest inconsistent gate, then verify role isolation.";tests=["Login test","Role gate test","Unauthorized-access test"]}
 else if(/modal|dialog|popup|clip|cut|cắt|che/.test(text)){area="Workspace modal / viewport geometry";action="Constrain the modal to the usable main viewport between fixed header/footer and outside the fixed sidebar, then verify overflow and responsive behavior.";tests=["Desktop modal geometry","Viewport resize","Mobile modal check"]}
 else if(/save|data|sync|persist/.test(text)){area="Persistence / data flow";action="Trace write → canonical/local owner → backend sync → reload persistence. Preserve the single source of truth and avoid duplicate stores.";tests=["Write test","Reload persistence","Backend sync test"]}
 else if(/dictionary|word|vocab/.test(text)){area="Tina Dictionary / Word Tools";action="Inspect dictionary persistence, catalog mapping, editor state and Word Inspector bridge, then verify CRUD and notes are preserved.";tests=["Dictionary CRUD","Catalog filter","Word Inspector save"]}
 const risk=x.severity==="Critical"?"High":x.severity==="High"?"Medium":"Low";
 return {generatedAt:now(),area,action,risk,tests,approvalStatus:x.repairProposal?.approvalStatus||"pending",approvedAt:x.repairProposal?.approvedAt||null,approvedBy:x.repairProposal?.approvedBy||null}
}
function ensureIssueRepairProposal(x){if(!x.repairProposal)x.repairProposal=issueRepairProposal(x);return x.repairProposal}
function issueRepairProposalHtml(x){
 const p=ensureIssueRepairProposal(x);
 return `<section class="issueRepairProposal"><div class="sectionHead compact"><div><div class="eyebrow">AUTO REPAIR PROPOSAL</div><h3>${esc(p.area)}</h3></div><span class="badge">${esc(p.approvalStatus||"pending")}</span></div><p>${esc(p.action)}</p><div class="issueRepairMeta"><span><b>Risk</b> ${esc(p.risk)}</span><span><b>Generated</b> ${esc(new Date(p.generatedAt).toLocaleString())}</span></div><div><b>Required verification</b><ul>${(p.tests||[]).map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div></section>`
}
function superadminIssueEditor(id){
 const w=ensureCommunicationStore(),x=w.communication.issues.find(x=>x.id===id);if(!x)return;
 ensureIssueRepairProposal(x);saveW(w);
 modal("Manage Issue",`<div class="issueSummary"><p><b>${esc(x.title)}</b></p><p>${esc(x.body)}</p></div>${issueRepairProposalHtml(x)}<div class="wsFormGrid">${selectField("issueStatus","Status",["open","triaged","in-progress","waiting-user","reviewer-review","repair-approved","resolved","closed","rejected"],x.status||"open")}${areaField("issueAdminNote","Superadmin response",x.superadminNote||"")}</div>`,
 `<button id="issueForwardReviewer">Forward to Reviewer</button><button id="issueApproveRepair">Approve Repair</button><button class="primary" id="issueManageSave">Save Status</button>`);
 $("#issueApproveRepair").onclick=()=>{const p=ensureIssueRepairProposal(x);p.approvalStatus="approved";p.approvedAt=now();p.approvedBy=currentUserId();x.status="repair-approved";x.updatedAt=now();x.handledBy=currentUserId();saveW(w);auditEvent("feedback.issue.repair-approved",{issueId:x.id,area:p.area,risk:p.risk});closeModal();superadminIssueDeskView()};
 $("#issueForwardReviewer").onclick=()=>{x.status="reviewer-review";x.reviewerForwardedAt=now();x.reviewerForwardedBy=currentUserId();x.updatedAt=now();saveW(w);auditEvent("feedback.issue.forwarded-reviewer",{issueId:x.id});closeModal();superadminIssueDeskView()};
 $("#issueManageSave").onclick=()=>{x.status=$("#issueStatus").value;x.superadminNote=$("#issueAdminNote").value;x.updatedAt=now();x.handledBy=currentUserId();saveW(w);auditEvent("feedback.issue.updated",{issueId:x.id,status:x.status});closeModal();superadminIssueDeskView()}
}
function reviewerIssueQueueView(){
 if(!["reviewer","superadmin"].includes(role()))return show('<div class="feedback bad">Reviewer access is required.</div>');
 const w=ensureCommunicationStore(),rows=w.communication.issues.filter(x=>x.status==="reviewer-review"||x.reviewerDecision==="needs-changes").slice().reverse();
 show(`<section class="reviewerIssueQueue"><div class="sectionHead"><div><div class="eyebrow">QUALITY REVIEW</div><h2>Issue Review Queue</h2><p class="muted">Issues forwarded by Superadmin for independent review before repair closure.</p></div><span class="badge">${rows.length} pending</span></div><section class="card">${rows.length?`<div class="qaIncidentList">${rows.map(x=>`<article class="qaIncident"><div class="qaIncidentHead"><div><b>${esc(x.title)}</b></div><small>${esc(x.severity||"")}</small></div><p>${esc(x.body)}</p>${issueRepairProposalHtml(x)}<div class="actions"><button data-review-issue="${x.id}" data-decision="needs-changes">Needs Changes</button><button class="primary" data-review-issue="${x.id}" data-decision="approved">Approve Proposal</button></div></article>`).join("")}</div>`:'<div class="empty">No issues are waiting for Reviewer.</div>'}</section></section>`);
 $$("[data-review-issue]").forEach(b=>b.onclick=()=>{const x=w.communication.issues.find(v=>v.id===b.dataset.reviewIssue);if(!x)return;x.reviewerDecision=b.dataset.decision;x.reviewerReviewedAt=now();x.reviewerReviewedBy=currentUserId();x.status=b.dataset.decision==="approved"?"triaged":"reviewer-review";saveW(w);auditEvent("feedback.issue.reviewer-decision",{issueId:x.id,decision:x.reviewerDecision});reviewerIssueQueueView()})
}

function reminderCenterView(){
 const w=ensureCommunicationStore(),mine=w.communication.reminders.filter(x=>x.userId===currentUserId()).sort((a,b)=>new Date(a.when)-new Date(b.when));
 show(`<section class="reminderPage"><div class="pageTitleCompact"><h2>Practice Reminders</h2><button class="primary" id="reminderNew">+ Reminder</button></div><section class="card"><div class="list">${mine.length?mine.map(x=>`<div class="row"><div><b>${esc(x.title)}</b><small>${esc(new Date(x.when).toLocaleString())} · ${esc(x.repeat||"once")}</small></div><div class="actions"><button data-reminder-toggle="${x.id}">${x.enabled!==false?"Pause":"Enable"}</button><button data-reminder-edit="${x.id}">Edit</button><button class="dangerAction" data-reminder-delete="${x.id}">Delete</button></div></div>`).join(""):'<div class="empty">No reminders yet.</div>'}</div><div class="actions"><button id="reminderNotifyPermission">Enable Browser/App Notifications</button></div></section></section>`);
 $("#reminderNew").onclick=()=>reminderEditor();$("#reminderNotifyPermission").onclick=async()=>{if(!("Notification"in window))return alert("Browser notifications are not supported here.");const p=await Notification.requestPermission();alert(`Notification permission: ${p}`)};
 $$("[data-reminder-edit]").forEach(b=>b.onclick=()=>reminderEditor(b.dataset.reminderEdit));
 $$("[data-reminder-toggle]").forEach(b=>b.onclick=()=>{const x=w.communication.reminders.find(x=>x.id===b.dataset.reminderToggle);x.enabled=x.enabled===false;saveW(w);reminderCenterView()});
 $$("[data-reminder-delete]").forEach(b=>b.onclick=()=>{w.communication.reminders=w.communication.reminders.filter(x=>x.id!==b.dataset.reminderDelete);saveW(w);reminderCenterView()})
}
function reminderEditor(id=null){
 const w=ensureCommunicationStore(),x=id?w.communication.reminders.find(x=>x.id===id):{};
 const initial=x.when?new Date(x.when).toISOString().slice(0,16):new Date(Date.now()+3600000).toISOString().slice(0,16);
 modal(id?"Edit Reminder":"Create Practice Reminder",`<div class="wsFormGrid">${textField("reminderTitle","Title",x.title||"Practice session")}${textField("reminderWhen","Date & time",initial,"datetime-local")}${selectField("reminderRepeat","Repeat",["once","daily","weekly","monthly"],x.repeat||"once")}${selectField("reminderTarget","Open when clicked",["learn","review","games-extra","plans"],x.target||"learn")}</div>`,`<button class="primary" id="reminderSave">Save Reminder</button>`);
 $("#reminderSave").onclick=()=>{const title=$("#reminderTitle").value.trim(),when=$("#reminderWhen").value;if(!title||!when)return alert("Title and time are required.");const rec=id?x:{id:uid("rem"),userId:currentUserId(),createdAt:now(),enabled:true,lastNotifiedAt:null};rec.title=title;rec.when=new Date(when).toISOString();rec.repeat=$("#reminderRepeat").value;rec.target=$("#reminderTarget").value;rec.updatedAt=now();if(!id)w.communication.reminders.push(rec);saveW(w);auditEvent("reminder.saved",{reminderId:rec.id});closeModal();reminderCenterView()}
}
function announcementCenterView(){
 const w=ensureCommunicationStore(),r=role(),rows=w.communication.announcements.filter(x=>x.status==="published"&&(x.roles||["*"]).some(z=>z==="*"||z===r)).filter(x=>!x.startsAt||new Date(x.startsAt)<=new Date()).filter(x=>!x.endsAt||new Date(x.endsAt)>=new Date()).slice().reverse();
 show(`<section class="announcementPage"><div class="pageTitleCompact"><h2>Announcements</h2></div><section class="announcementList">${rows.length?rows.map(x=>`<article class="card announcementCard"><div class="eyebrow">${esc(x.priority||"normal")} · ${esc(new Date(x.createdAt).toLocaleDateString())}</div><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p><small>${esc(x.authorName||"Tina Learning Platform")}</small></article>`).join(""):'<div class="empty">No current announcements.</div>'}</section></section>`)
}
function announcementManagerView(){
 if(!(isSuperadmin()||role()==="admin"))return;
 const w=ensureCommunicationStore(),rows=w.communication.announcements.slice().reverse();
 show(`<section class="announcementManager"><div class="pageTitleCompact"><h2>Posts & Announcements</h2><button class="primary" id="announcementNew">+ Announcement</button></div><section class="card"><div class="list">${rows.length?rows.map(x=>`<div class="row"><div><b>${esc(x.title)}</b><small>${esc(x.status)} · ${(x.roles||["*"]).map(roleLabel).join(", ")}</small></div><div class="actions"><button data-announcement-edit="${x.id}">Edit</button><button data-announcement-toggle="${x.id}">${x.status==="published"?"Unpublish":"Publish"}</button></div></div>`).join(""):'<div class="empty">No announcements yet.</div>'}</div></section></section>`);
 $("#announcementNew").onclick=()=>announcementEditor();$$("[data-announcement-edit]").forEach(b=>b.onclick=()=>announcementEditor(b.dataset.announcementEdit));$$("[data-announcement-toggle]").forEach(b=>b.onclick=()=>{const x=w.communication.announcements.find(x=>x.id===b.dataset.announcementToggle);x.status=x.status==="published"?"draft":"published";x.updatedAt=now();saveW(w);announcementManagerView()})
}
function announcementEditor(id=null){
 const w=ensureCommunicationStore(),x=id?w.communication.announcements.find(x=>x.id===id):{};
 const allowed=isSuperadmin()?["learner","teacher","business","admin","superadmin"]:["learner","teacher","business"];
 modal(id?"Edit Announcement":"Create Announcement",`<div class="wsFormGrid">${textField("annTitle","Title",x.title||"")}${areaField("annBody","Message",x.body||"")}${selectField("annPriority","Priority",["normal","important","urgent"],x.priority||"normal")}${textField("annStart","Start (optional)",x.startsAt?new Date(x.startsAt).toISOString().slice(0,16):"","datetime-local")}${textField("annEnd","End (optional)",x.endsAt?new Date(x.endsAt).toISOString().slice(0,16):"","datetime-local")}</div><div class="permissionCheckGrid"><h4>Target roles</h4>${allowed.map(r=>`<label><input type="checkbox" data-ann-role="${r}" ${(x.roles||["learner"]).includes(r)?"checked":""}> ${roleLabel(r)}</label>`).join("")}</div>`,`<button class="primary" id="annSave">Save Announcement</button>`);
 $("#annSave").onclick=()=>{const title=$("#annTitle").value.trim(),body=$("#annBody").value.trim(),roles=$$("[data-ann-role]:checked").map(b=>b.dataset.annRole);if(!title||!body||!roles.length)return alert("Title, message and at least one target role are required.");const rec=id?x:{id:uid("ann"),createdAt:now(),status:"draft",authorUserId:currentUserId(),authorName:session()?.name||roleLabel(role())};rec.title=title;rec.body=body;rec.priority=$("#annPriority").value;rec.roles=roles;rec.startsAt=$("#annStart").value?new Date($("#annStart").value).toISOString():null;rec.endsAt=$("#annEnd").value?new Date($("#annEnd").value).toISOString():null;rec.updatedAt=now();if(!id)w.communication.announcements.push(rec);saveW(w);auditEvent("announcement.saved",{announcementId:rec.id,roles});closeModal();announcementManagerView()}
}
function installReminderNotifications(){
 if(window.__tinaReminderTimer)return;window.__tinaReminderTimer=true;
 const check=()=>{const s=session();if(!s)return;const w=ensureCommunicationStore(),nowMs=Date.now();w.communication.reminders.filter(x=>x.userId===s.id&&x.enabled!==false).forEach(x=>{const due=new Date(x.when).getTime();if(!Number.isFinite(due)||due>nowMs)return;if(x.lastNotifiedAt&&nowMs-new Date(x.lastNotifiedAt).getTime()<60000)return;x.lastNotifiedAt=now();if("Notification"in window&&Notification.permission==="granted")new Notification(x.title,{body:"Tina Learning Platform practice reminder"});else window.dispatchEvent(new CustomEvent("tina:reminder-due",{detail:x}));if(x.repeat==="once")x.enabled=false;else{const d=new Date(x.when);if(x.repeat==="daily")d.setDate(d.getDate()+1);if(x.repeat==="weekly")d.setDate(d.getDate()+7);if(x.repeat==="monthly")d.setMonth(d.getMonth()+1);x.when=d.toISOString()}});saveW(w)};
 setInterval(check,60000);setTimeout(check,1500)
}

const WORD_TOOL_LANG_KEY="tina.v14.wordtool.language";
let wordToolMode=false;
const WORD_TOOL_LANGS=[["vi","Vietnamese"],["zh-CN","Chinese"],["ja","Japanese"],["ko","Korean"],["th","Thai"],["fr","French"],["de","German"],["es","Spanish"],["it","Italian"],["pt","Portuguese"]];
function selectedWordToolLanguage(){return localStorage.getItem(WORD_TOOL_LANG_KEY)||"vi"}
function installWordTools(){
 if(window.__tinaWordToolsInstalled)return;window.__tinaWordToolsInstalled=true;
 const top=document.querySelector(".topbar");if(top&&!$("#wordToolToggle")){const b=document.createElement("button");b.id="wordToolToggle";b.className="wordToolToggle";b.type="button";b.textContent="Dictionary";b.title="Click: toggle Word Tools. Double-click: open Tina Dictionary. ⌘/Ctrl+K opens Tina Dictionary.";top.appendChild(b);b.onclick=()=>{wordToolMode=!wordToolMode;b.classList.toggle("active",wordToolMode);b.textContent=wordToolMode?"Dictionary On":"Dictionary";document.documentElement.classList.toggle("word-tool-mode",wordToolMode)};b.ondblclick=e=>{e.preventDefault();e.stopPropagation();openTinaDictionary("")}}
 document.addEventListener("dblclick",e=>{if(!wordToolMode||e.target.closest("input,textarea,select,button,a,[contenteditable='true'],#wordInspector"))return;const word=wordFromPoint(e.clientX,e.clientY);if(word){e.preventDefault();e.stopPropagation();openWordInspector(word,e.clientX,e.clientY)}},true);
 document.addEventListener("click",e=>{if(!wordToolMode||e.target.closest("input,textarea,select,button,a,[contenteditable='true'],#wordInspector"))return;const word=wordFromPoint(e.clientX,e.clientY);if(word){e.preventDefault();e.stopPropagation();openWordInspector(word,e.clientX,e.clientY)}},true)
}
function wordFromPoint(x,y){
 let range=null;
 if(document.caretRangeFromPoint)range=document.caretRangeFromPoint(x,y);
 else if(document.caretPositionFromPoint){const p=document.caretPositionFromPoint(x,y);if(p){range=document.createRange();range.setStart(p.offsetNode,p.offset);range.collapse(true)}}
 if(!range||range.startContainer.nodeType!==Node.TEXT_NODE)return "";
 const text=range.startContainer.textContent||"",i=Math.min(range.startOffset,text.length-1);
 const isLetter=c=>/[A-Za-z'-]/.test(c||"");let a=i,b=i;if(!isLetter(text[i])&&i>0&&isLetter(text[i-1]))a=b=i-1;if(!isLetter(text[a]))return "";
 while(a>0&&isLetter(text[a-1]))a--;while(b<text.length-1&&isLetter(text[b+1]))b++;
 return text.slice(a,b+1).replace(/^['-]+|['-]+$/g,"").toLowerCase()
}
function ensureWordInspector(){
 let p=$("#wordInspector");if(p)return p;p=document.createElement("aside");p.id="wordInspector";p.className="wordInspector";document.body.appendChild(p);return p
}
/* ---------- TINA DICTIONARY ---------- */
const TINA_DICTIONARY_KEY="tina.v14.dictionary";
const TINA_DICTIONARY_DEFAULT_CATALOG=["General Vocabulary","Academic Vocabulary","Collocations","Phrasal Verbs","Idioms","Word Formation","Pronunciation","CPE / Exam English","Technical / Domain Terms","Personal Notes"];
function tinaDictionaryState(){try{const x=JSON.parse(localStorage.getItem(TINA_DICTIONARY_KEY)||"{}");return Object.assign({version:1,catalog:[...TINA_DICTIONARY_DEFAULT_CATALOG],entries:[],updatedAt:null},x||{})}catch{return{version:1,catalog:[...TINA_DICTIONARY_DEFAULT_CATALOG],entries:[],updatedAt:null}}}
function saveTinaDictionaryState(x){x.catalog=[...new Set((x.catalog||[]).map(v=>String(v).trim()).filter(Boolean))];x.entries=Array.isArray(x.entries)?x.entries:[];x.updatedAt=now();localStorage.setItem(TINA_DICTIONARY_KEY,JSON.stringify(x));window.TinaBackend?.scheduleSync?.("tina-dictionary")}
function tinaDictionaryEntry(word){const key=String(word||"").trim().toLowerCase();return tinaDictionaryState().entries.find(x=>String(x.headword||"").toLowerCase()===key)}
function openTinaDictionary(word=""){sessionStorage.setItem("tina.v14.dictionary.focus",String(word||""));return roleTargetOpen("dictionary-extra")}
function tinaDictionaryView(){
 const st=tinaDictionaryState(),focus=sessionStorage.getItem("tina.v14.dictionary.focus")||"",catalog=st.catalog||[];
 show(`<section class="tinaDictionaryPage"><div class="sectionHead"><div><div class="eyebrow">TINA KNOWLEDGE TOOL</div><h2>Tina Dictionary</h2><p class="muted">Your governed personal dictionary for vocabulary, collocations, morphology, pronunciation, examples and learning notes.</p></div><div class="actions">${isSuperadmin()?'<button id="dictCatalogManage">Manage Catalog</button>':""}<button class="primary" id="dictNew">+ New Entry</button></div></div>
 <section class="dictionaryToolbar card"><input id="dictSearch" placeholder="Search headword, meaning, note, tag… (⌘/Ctrl+K)" value="${esc(focus)}"><select id="dictCatalogFilter"><option value="">All catalog sections</option>${catalog.map(c=>`<option>${esc(c)}</option>`).join("")}</select><select id="dictStatusFilter"><option value="">All statuses</option><option>learning</option><option>review</option><option>mastered</option></select><button id="dictSearchClear">Clear</button></section>
 <div class="dictionaryViewBar"><button class="primary" id="dictTableViewBtn">Table</button><button id="dictEditorViewBtn">Editor</button><span class="muted">Table gives a fast catalog-wide overview; click a row to edit the full entry.</span></div>
 <section id="dictTablePanel" class="card dictionaryTablePanel"><div class="tableWrap"><table class="dictionaryTable"><thead><tr><th>Headword</th><th>POS</th><th>Catalog</th><th>Definition</th><th>Translation</th><th>Media</th><th>Status</th><th>Updated</th></tr></thead><tbody id="dictTableBody"></tbody></table></div></section>
 <section id="dictEditorPanel" class="dictionaryLayout" hidden><aside class="card dictionaryListPanel"><div class="dictionaryListHead"><b>Entries</b><span id="dictCount"></span></div><div id="dictEntryList" class="dictionaryEntryList"></div></aside><main id="dictEditorHost" class="card dictionaryEditorHost"><div class="empty">Select an entry or create a new one.</div></main></section>
 <section class="card dictionaryShortcutHelp"><b>Keyboard</b><span><kbd>⌘/Ctrl K</kbd> Search</span><span><kbd>N</kbd> New</span><span><kbd>⌘/Ctrl Enter</kbd> Save</span><span><kbd>Esc</kbd> Close editor</span></section></section>`);
 const renderList=()=>{const q=$("#dictSearch").value.trim().toLowerCase(),cat=$("#dictCatalogFilter").value,status=$("#dictStatusFilter").value;const rows=st.entries.filter(x=>(!q||[x.headword,x.definition,x.translation,x.notes,x.examples,x.collocations,x.wordFamily,(x.tags||[]).join(" ")].join(" ").toLowerCase().includes(q))&&(!cat||x.catalog===cat)&&(!status||x.status===status)).sort((a,b)=>String(a.headword).localeCompare(String(b.headword)));$("#dictCount").textContent=`${rows.length} / ${st.entries.length}`;$("#dictEntryList").innerHTML=rows.length?rows.map(x=>`<button class="dictionaryEntryRow" data-dict-open="${esc(x.id)}"><span><b>${esc(x.headword)}</b><small>${esc(x.partOfSpeech||"")} · ${esc(x.catalog||"")}</small></span><em>${esc(x.status||"learning")}</em></button>`).join(""):'<div class="empty">No entries match.</div>';
 const body=$("#dictTableBody");if(body)body.innerHTML=rows.length?rows.map(x=>`<tr data-dict-row="${esc(x.id)}" tabindex="0"><td><b>${esc(x.headword)}</b></td><td>${esc(x.partOfSpeech||"—")}</td><td>${esc(x.catalog||"—")}</td><td class="dictCellClamp">${esc(x.definition||"—")}</td><td class="dictCellClamp">${esc(x.translation||"—")}</td><td><span class="dictMediaCount">🖼 ${x.images?.length||0}</span> <span class="dictMediaCount">🔊 ${x.audios?.length||0}</span></td><td>${esc(x.status||"learning")}</td><td>${esc(x.updatedAt?new Date(x.updatedAt).toLocaleDateString():"—")}</td></tr>`).join(""):'<tr><td colspan="8" class="muted">No entries match.</td></tr>';
 $$("[data-dict-open]").forEach(b=>b.onclick=()=>{showDictEditorPanel();tinaDictionaryEditor(b.dataset.dictOpen)});
 $$("[data-dict-row]").forEach(r=>{const open=()=>{showDictEditorPanel();tinaDictionaryEditor(r.dataset.dictRow)};r.onclick=open;r.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();open()}}})
};
 const showDictTablePanel=()=>{$("#dictTablePanel").hidden=false;$("#dictEditorPanel").hidden=true;$("#dictTableViewBtn").classList.add("primary");$("#dictEditorViewBtn").classList.remove("primary")};
 const showDictEditorPanel=()=>{$("#dictTablePanel").hidden=true;$("#dictEditorPanel").hidden=false;$("#dictTableViewBtn").classList.remove("primary");$("#dictEditorViewBtn").classList.add("primary")};
 window.showDictEditorPanel=showDictEditorPanel;
 $("#dictTableViewBtn").onclick=showDictTablePanel;$("#dictEditorViewBtn").onclick=showDictEditorPanel;
 $("#dictSearch").oninput=renderList;$("#dictCatalogFilter").onchange=renderList;$("#dictStatusFilter").onchange=renderList;$("#dictSearchClear").onclick=()=>{$("#dictSearch").value="";renderList();$("#dictSearch").focus()};$("#dictNew").onclick=()=>{showDictEditorPanel();tinaDictionaryEditor(null,focus)};$("#dictCatalogManage")?.addEventListener("click",tinaDictionaryCatalogManager);renderList();
 if(focus){const existing=tinaDictionaryEntry(focus);showDictEditorPanel();tinaDictionaryEditor(existing?.id||null,focus);sessionStorage.removeItem("tina.v14.dictionary.focus")}
}
function tinaDictionaryEditor(id=null,prefill=""){
 const st=tinaDictionaryState(),old=id?st.entries.find(x=>x.id===id):null,x=old||{id:"",headword:prefill||"",partOfSpeech:"",phonetics:"",catalog:st.catalog[0]||"General Vocabulary",definition:"",translation:"",examples:"",collocations:"",wordFamily:"",synonyms:"",antonyms:"",register:"",source:"",notes:"",tags:[],status:"learning",images:[],audios:[]},host=$("#dictEditorHost");if(!host)return;
 host.innerHTML=`<div class="dictionaryEditor"><div class="sectionHead compact"><div><div class="eyebrow">${old?"EDIT ENTRY":"NEW ENTRY"}</div><h3>${esc(x.headword||"Dictionary Entry")}</h3></div><div class="actions">${old?'<button id="dictDelete">Delete</button>':""}<button id="dictListen">▶ Listen</button><button class="primary" id="dictSave">Save</button></div></div><div class="dictionaryForm">${textField("dictHeadword","Headword",x.headword||"")}${textField("dictPOS","Part of speech",x.partOfSpeech||"")}${textField("dictPhonetics","Phonetics / IPA",x.phonetics||"")}<label class="wsField"><span>Catalog section</span><select id="dictCatalog">${st.catalog.map(c=>`<option ${c===x.catalog?"selected":""}>${esc(c)}</option>`).join("")}</select></label>${areaField("dictDefinition","Definition",x.definition||"")}${areaField("dictTranslation","Translation / equivalent",x.translation||"")}${areaField("dictExamples","Examples",x.examples||"","One example per line")}${areaField("dictCollocations","Collocations / patterns",x.collocations||"","One item per line")}${areaField("dictWordFamily","Word family / morphology",x.wordFamily||"")}${textField("dictSynonyms","Synonyms",x.synonyms||"")}${textField("dictAntonyms","Antonyms",x.antonyms||"")}${textField("dictRegister","Register / usage",x.register||"")}${textField("dictSource","Source / reference",x.source||"")}<section class="dictionaryMediaSection">
 <div class="dictionaryMediaHead"><div><b>Images</b><small>Add one or more reference images for this entry.</small></div><label class="dictMediaAdd">+ Add images<input id="dictImageInput" type="file" accept="image/*" multiple hidden></label></div>
 <div id="dictImageGallery" class="dictImageGallery"></div>
 <div class="dictionaryMediaHead"><div><b>Audio</b><small>Add pronunciation, example, lecture or personal recording files.</small></div><label class="dictMediaAdd">+ Add audio<input id="dictAudioInput" type="file" accept="audio/*" multiple hidden></label></div>
 <div id="dictAudioList" class="dictAudioList"></div>
</section>${areaField("dictNotes","Personal learning notes",x.notes||"")}${textField("dictTags","Tags",(x.tags||[]).join(", "))}${selectField("dictStatus","Learning status",["learning","review","mastered"],x.status||"learning")}</div></div>`;
 let draftImages=Array.isArray(x.images)?x.images.map(v=>({...v})):[];
 let draftAudios=Array.isArray(x.audios)?x.audios.map(v=>({...v})):[];
 const readFileData=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||""));r.onerror=reject;r.readAsDataURL(file)});
 const renderMedia=()=>{
  const ig=$("#dictImageGallery");if(ig)ig.innerHTML=draftImages.length?draftImages.map((m,i)=>`<figure class="dictImageCard"><img src="${esc(m.src||"")}" alt="${esc(m.name||x.headword||"Dictionary image")}"><figcaption><span>${esc(m.name||`Image ${i+1}`)}</span><button type="button" data-dict-remove-image="${i}">Remove</button></figcaption></figure>`).join(""):'<div class="dictMediaEmpty">No images yet.</div>';
  const al=$("#dictAudioList");if(al)al.innerHTML=draftAudios.length?draftAudios.map((m,i)=>`<div class="dictAudioCard"><audio controls preload="metadata" src="${esc(m.src||"")}"></audio><div><b>${esc(m.name||`Audio ${i+1}`)}</b><small>${esc(m.type||"audio")}</small></div><button type="button" data-dict-remove-audio="${i}">Remove</button></div>`).join(""):'<div class="dictMediaEmpty">No audio yet.</div>';
  $$("[data-dict-remove-image]").forEach(b=>b.onclick=()=>{draftImages.splice(Number(b.dataset.dictRemoveImage),1);renderMedia()});
  $$("[data-dict-remove-audio]").forEach(b=>b.onclick=()=>{draftAudios.splice(Number(b.dataset.dictRemoveAudio),1);renderMedia()})
 };
 $("#dictImageInput")?.addEventListener("change",async e=>{for(const f of [...e.target.files]){draftImages.push({id:uid("dictimg"),name:f.name,type:f.type,size:f.size,src:await readFileData(f),addedAt:now()})}e.target.value="";renderMedia()});
 $("#dictAudioInput")?.addEventListener("change",async e=>{for(const f of [...e.target.files]){draftAudios.push({id:uid("dictaud"),name:f.name,type:f.type,size:f.size,src:await readFileData(f),addedAt:now()})}e.target.value="";renderMedia()});
 renderMedia();
 const save=()=>{const head=$("#dictHeadword").value.trim();if(!head)return alert("Headword is required.");const rec={...x,id:x.id||uid("dict"),headword:head,partOfSpeech:$("#dictPOS").value.trim(),phonetics:$("#dictPhonetics").value.trim(),catalog:$("#dictCatalog").value,definition:$("#dictDefinition").value.trim(),translation:$("#dictTranslation").value.trim(),examples:$("#dictExamples").value.trim(),collocations:$("#dictCollocations").value.trim(),wordFamily:$("#dictWordFamily").value.trim(),synonyms:$("#dictSynonyms").value.trim(),antonyms:$("#dictAntonyms").value.trim(),register:$("#dictRegister").value.trim(),source:$("#dictSource").value.trim(),images:draftImages,audios:draftAudios,notes:$("#dictNotes").value.trim(),tags:$("#dictTags").value.split(",").map(v=>v.trim()).filter(Boolean),status:$("#dictStatus").value,createdAt:x.createdAt||now(),updatedAt:now(),ownerId:x.ownerId||currentUserId()};const state=tinaDictionaryState(),i=state.entries.findIndex(v=>v.id===rec.id);if(i>=0)state.entries[i]=rec;else state.entries.push(rec);saveTinaDictionaryState(state);auditEvent("dictionary.entry.saved",{entryId:rec.id,headword:rec.headword,catalog:rec.catalog,status:rec.status});tinaDictionaryView()};
 $("#dictSave").onclick=save;$("#dictListen").onclick=()=>tinaSpeak($("#dictHeadword").value.trim()||x.headword);$("#dictDelete")?.addEventListener("click",()=>{if(!confirm("Delete this dictionary entry?"))return;const state=tinaDictionaryState();state.entries=state.entries.filter(v=>v.id!==x.id);saveTinaDictionaryState(state);auditEvent("dictionary.entry.deleted",{entryId:x.id});tinaDictionaryView()});host.onkeydown=e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){e.preventDefault();save()}}
}
function tinaDictionaryCatalogManager(){
 if(!isSuperadmin())return alert("Superadmin access is required.");const st=tinaDictionaryState();
 modal("Tina Dictionary Catalog",`<p class="muted">One catalog section per line. Existing entries keep their current section until edited.</p>${areaField("dictCatalogLines","Catalog sections",(st.catalog||[]).join("\n"))}`,`<button id="dictCatalogReset">Reset Defaults</button><button class="primary" id="dictCatalogSave">Save Catalog</button>`);
 $("#dictCatalogReset").onclick=()=>{$("#dictCatalogLines").value=TINA_DICTIONARY_DEFAULT_CATALOG.join("\n")};$("#dictCatalogSave").onclick=()=>{const x=tinaDictionaryState();x.catalog=$("#dictCatalogLines").value.split("\n").map(v=>v.trim()).filter(Boolean);saveTinaDictionaryState(x);auditEvent("dictionary.catalog.updated",{count:x.catalog.length});closeModal();tinaDictionaryView()}
}
function installTinaDictionaryShortcuts(){
 if(window.__tinaDictionaryShortcutsInstalled)return;window.__tinaDictionaryShortcutsInstalled=true;
 document.addEventListener("keydown",e=>{const typing=e.target?.matches?.("input,textarea,select,[contenteditable='true']");if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();if(document.querySelector(".tinaDictionaryPage"))$("#dictSearch")?.focus();else openTinaDictionary("")}else if(!typing&&e.key.toLowerCase()==="n"&&document.querySelector(".tinaDictionaryPage")){e.preventDefault();tinaDictionaryEditor()}else if(e.key==="Escape"&&document.querySelector(".tinaDictionaryPage")){const h=$("#dictEditorHost");if(h)h.innerHTML='<div class="empty">Select an entry or create a new one.</div>'}},true)
}

function tinaSpeak(text,opts={}){
 if(!("speechSynthesis"in window)||!text)return false;speechSynthesis.cancel();
 const u=new SpeechSynthesisUtterance(String(text));u.lang=opts.lang||"en-US";u.rate=Number(opts.rate||.9);
 const vs=speechSynthesis.getVoices?.()||[],v=vs.find(x=>x.name===opts.voiceName)||vs.find(x=>x.lang==="en-GB")||vs.find(x=>x.lang==="en-US")||vs.find(x=>String(x.lang).startsWith("en"));if(v)u.voice=v;speechSynthesis.speak(u);return true
}
function englishVoiceOptions(){return "speechSynthesis"in window?(speechSynthesis.getVoices?.()||[]).filter(v=>String(v.lang||"").toLowerCase().startsWith("en")).slice(0,30):[]}
async function openWordInspector(word,x=window.innerWidth/2,y=120){
 const p=ensureWordInspector(),lang=selectedWordToolLanguage(),voices=englishVoiceOptions();
 p.innerHTML=`<div class="wordInspectorHead"><div class="wordToolKicker">ENGLISH WORD TOOLS</div><div class="wordTitleRow"><h3>${esc(word)}</h3><button class="wordPrimaryListen" id="wordSpeak" type="button">▶ Listen</button></div><div id="wordPronunciationLine" class="wordPronunciationLine">Loading pronunciation…</div></div><button class="wordInspectorClose" id="wordInspectorClose" type="button">×</button><div class="wordAudioPanel"><div class="wordAudioHeading"><b>Pronunciation & Audio</b><span>Dictionary recording + browser voice</span></div><div id="wordDictionaryAudio">Looking for audio…</div><div class="wordVoiceRow"><label><span>English voice</span><select id="wordVoice">${voices.length?voices.map(v=>`<option value="${esc(v.name)}">${esc(v.name)} · ${esc(v.lang)}</option>`).join(""):'<option value="">System English voice</option>'}</select></label><label><span>Speed</span><select id="wordRate"><option value=".72">Slow</option><option value=".9" selected>Natural</option><option value="1">Normal</option><option value="1.12">Fast</option></select></label><button id="wordSpeakAgain">Read again</button></div></div><div class="wordInspectorControls"><label><span>Translate to</span><select id="wordToolLanguage">${WORD_TOOL_LANGS.map(([c,n])=>`<option value="${c}" ${c===lang?"selected":""}>${n}</option>`).join("")}</select></label></div><div class="wordToolContent"><div id="wordInspectorDefinition" class="wordToolSection">Looking up dictionary…</div><div id="wordInspectorTranslation" class="wordToolSection">Translating…</div></div><div class="wordInspectorLinks"><button class="primary" id="wordSaveTinaDictionary">Save to Tina Dictionary</button><button id="wordOpenWiktionary">Wiktionary</button><button id="wordOpenTranslate">Google Translate</button></div>`;
 p.classList.add("open");p.style.left=Math.min(Math.max(12,x+12),window.innerWidth-470)+"px";p.style.top=Math.min(Math.max(72,y+12),window.innerHeight-650)+"px";
 const speak=()=>tinaSpeak(word,{voiceName:$("#wordVoice")?.value||"",rate:Number($("#wordRate")?.value||.9)});
 $("#wordInspectorClose").onclick=()=>{speechSynthesis?.cancel?.();p.classList.remove("open")};$("#wordSpeak").onclick=speak;$("#wordSpeakAgain").onclick=speak;$("#wordSaveTinaDictionary").onclick=()=>{p.classList.remove("open");openTinaDictionary(word)};$("#wordVoice")?.addEventListener("change",speak);$("#wordRate")?.addEventListener("change",speak);
 $("#wordToolLanguage").onchange=()=>{localStorage.setItem(WORD_TOOL_LANG_KEY,$("#wordToolLanguage").value);loadWordTranslation(word,$("#wordToolLanguage").value)};
 $("#wordOpenWiktionary").onclick=()=>window.open(`https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`,"_blank","noopener");$("#wordOpenTranslate").onclick=()=>window.open(`https://translate.google.com/?sl=en&tl=${encodeURIComponent($("#wordToolLanguage").value)}&text=${encodeURIComponent(word)}&op=translate`,"_blank","noopener");
 loadWordDefinition(word);loadWordTranslation(word,lang)
}
async function loadWordDefinition(word){
 const box=$("#wordInspectorDefinition"),ab=$("#wordDictionaryAudio"),pl=$("#wordPronunciationLine");if(!box)return;
 try{const r=await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);if(!r.ok)throw 0;const data=await r.json(),entry=data[0],ph=(entry.phonetics||[]),phon=entry.phonetic||ph.find(x=>x.text)?.text||"",audio=ph.find(x=>x.audio)?.audio||"",meanings=(entry.meanings||[]).slice(0,4);
  if(pl)pl.innerHTML=phon?`<strong>${esc(phon)}</strong>`:"Browser pronunciation available";
  if(ab)ab.innerHTML=audio?`<audio class="wordNativeAudio" controls preload="none" src="${esc(audio)}"></audio><button id="wordPlayDictionaryAudio">Play recording</button>`:`<span>No dictionary recording found.</span><button id="wordAudioFallbackSpeak">Use browser voice</button>`;
  $("#wordPlayDictionaryAudio")?.addEventListener("click",()=>$(".wordNativeAudio")?.play().catch(()=>tinaSpeak(word)));$("#wordAudioFallbackSpeak")?.addEventListener("click",()=>tinaSpeak(word));
  box.innerHTML=`<section><div class="wordSectionHeading"><h4>Dictionary</h4>${phon?`<span>${esc(phon)}</span>`:""}</div>${meanings.map(m=>`<div class="wordMeaning"><div class="wordPartOfSpeech">${esc(m.partOfSpeech||"")}</div>${(m.definitions||[]).slice(0,3).map((d,i)=>`<div class="wordDefinition"><span>${i+1}</span><p>${esc(d.definition||"")}${d.example?`<small>“${esc(d.example)}”</small>`:""}</p></div>`).join("")}${m.synonyms?.length?`<div class="wordSynonyms"><b>Synonyms</b>${m.synonyms.slice(0,7).map(x=>`<span>${esc(x)}</span>`).join("")}</div>`:""}</div>`).join("")}</section>`
 }catch{if(pl)pl.textContent="Browser pronunciation available";if(ab)ab.innerHTML='<span>Dictionary audio unavailable.</span><button id="wordAudioFallbackSpeak">Use browser voice</button>';$("#wordAudioFallbackSpeak")?.addEventListener("click",()=>tinaSpeak(word));box.innerHTML='<div class="feedback warn">Dictionary lookup unavailable. Use Wiktionary as fallback.</div>'}
}
async function loadWordTranslation(word,lang){
 const box=$("#wordInspectorTranslation");if(!box)return;box.textContent="Translating…";
 try{const r=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en%7C${encodeURIComponent(lang)}`);if(!r.ok)throw 0;const d=await r.json(),t=d?.responseData?.translatedText;if(!t)throw 0;box.innerHTML=`<section><div class="wordSectionHeading"><h4>Translation</h4><span>${esc(WORD_TOOL_LANGS.find(x=>x[0]===lang)?.[1]||lang)}</span></div><div class="wordTranslation">${esc(t)}</div><small>Machine translation · verify important meanings in context.</small></section>`}catch{box.innerHTML='<div class="feedback warn">Translation unavailable. Use Google Translate as fallback.</div>'}
}

const TINA_ICON_PATHS={
 home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9 20v-6h6v6"/>',
 book:'<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20v17H7.5A3.5 3.5 0 0 0 4 22z"/><path d="M4 5.5V22"/>',
 play:'<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',
 cards:'<rect x="5" y="4" width="12" height="16" rx="2"/><path d="m9 2 10 2v14"/>',
 game:'<path d="M8 8h8a5 5 0 0 1 4.6 7l-1 2.3a2 2 0 0 1-3.4.6L14.5 16h-5l-1.7 1.9a2 2 0 0 1-3.4-.6L3.4 15A5 5 0 0 1 8 8Z"/><path d="M7 12h4M9 10v4M16 12h.01M18 14h.01"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 9h18"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
 chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 trophy:'<path d="M8 4h8v4a4 4 0 0 1-8 0z"/><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 12v5M8 21h8M9 17h6"/>',
 users:'<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2"/><path d="M15 15a5 5 0 0 1 6 5"/>',
 message:'<path d="M4 4h16v12H8l-4 4z"/>',
 bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
 profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2.8 2.8-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.7V21H10v-.1A1.8 1.8 0 0 0 8.9 19a1.8 1.8 0 0 0-2 .4l-.1.1L4 16.7l.1-.1a1.8 1.8 0 0 0 .4-2A1.8 1.8 0 0 0 2.8 13H2V9h.8a1.8 1.8 0 0 0 1.7-1.1 1.8 1.8 0 0 0-.4-2L4 5.8 6.8 3l.1.1a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 10 1.8V1h4v.8a1.8 1.8 0 0 0 1.1 1.7 1.8 1.8 0 0 0 2-.4l.1-.1L20 5.8l-.1.1a1.8 1.8 0 0 0-.4 2A1.8 1.8 0 0 0 21.2 9h.8v4h-.8a1.8 1.8 0 0 0-1.8 2Z"/>',
 edit:'<path d="M12 20h9"/><path d="m16.5 3.5 4 4L8 20H4v-4z"/>',
 building:'<path d="M4 21V3h11v18M15 8h5v13M8 7h3M8 11h3M8 15h3"/>',
 shield:'<path d="M12 2 20 5v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="m9 12 2 2 4-5"/>',
 blog:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.5 2.5 0 1 1 3.5 2.3c-.9.4-1.3 1-1.3 1.7M12 17h.01"/>',
 flag:'<path d="M5 21V4"/><path d="M5 5h11l-1 4 1 4H5"/>',
 library:'<path d="M4 4h4v16H4zM10 4h4v16h-4zM16 5l3-1 3 15-3 1z"/>',
 logout:'<path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h7v18h-7"/>'
};
function uiIcon(name,size=18){
 const body=TINA_ICON_PATHS[name]||TINA_ICON_PATHS.help;
 return `<svg class="tinaIcon" aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
}
function routeIcon(target){
 if(["home","student-dashboard-extra","teacher-dashboard-extra","business-dashboard-extra","superadmin-extra","admin-v14"].includes(target))return"home";
 if(["catalog","academy"].includes(target))return"book";
 if(target==="learn")return"play";
 if(target.includes("flash")||target.includes("practice"))return"cards";
 if(target.includes("games"))return"game";
 if(target.includes("plans")||target.includes("reminders"))return"calendar";
 if(target.includes("research")||target.includes("dictionary"))return"search";
 if(target.includes("progress")||target.includes("analytics")||target.includes("history")||target.includes("reports")||target.includes("intelligence"))return"chart";
 if(target.includes("achievements")||target.includes("leaderboard"))return"trophy";
 if(target.includes("members")||target.includes("teacher")||target.includes("roles")||target.includes("users")||target.includes("community"))return"users";
 if(target.includes("blog"))return"blog";
 if(target.includes("contact")||target.includes("chat")||target.includes("feedback")||target.includes("announcements"))return"message";
 if(target.includes("profile")||target.includes("account")||target.includes("shadowing"))return"profile";
 if(target.includes("settings")||target.includes("theme")||target.includes("interface"))return"settings";
 if(target.includes("content")||target.includes("author")||target.includes("editing"))return"edit";
 if(target.includes("business")||target.includes("organizations"))return"building";
 if(target.includes("access")||target.includes("permission")||target.includes("governance")||target.includes("system"))return"shield";
 if(target.includes("library"))return"library";
 return"help"
}
function communityStore(){
 const w=ensureCommunicationStore();w.blog=Array.isArray(w.blog)?w.blog:[];w.community=Object.assign({zaloUrl:"",zaloLabel:"Zalo Community"},w.community||{});w.communication.threads=Array.isArray(w.communication.threads)?w.communication.threads:[];return w
}
function canPublishBlog(){return ["admin","superadmin"].includes(role())}
function blogView(){
 const w=communityStore(),r=role(),posts=w.blog.filter(p=>p.status==="published"&&(p.roles||["*"]).some(x=>x==="*"||x===r)).slice().sort((a,b)=>new Date(b.publishedAt||b.createdAt)-new Date(a.publishedAt||a.createdAt));
 show(`<section class="blogPage"><div class="pageTitleCompact"><div><h2>${uiIcon("blog",24)} Tina Blog</h2><p class="muted">News, learning resources, research notes and community knowledge.</p></div><button class="primary" id="blogCreate">${canPublishBlog()?"+ New Post":"+ Share Draft"}</button></div><div class="blogToolbar"><input id="blogSearch" placeholder="Search posts, tags, authors…"><select id="blogTopic"><option value="">All topics</option>${[...new Set(posts.map(p=>p.topic).filter(Boolean))].map(t=>`<option>${esc(t)}</option>`).join("")}</select>${canPublishBlog()?'<button id="blogManage">Manage Posts</button>':""}</div><section id="blogFeed" class="blogGrid">${blogCards(posts)}</section></section>`);
 const render=()=>{const q=$("#blogSearch").value.toLowerCase(),t=$("#blogTopic").value;$("#blogFeed").innerHTML=blogCards(posts.filter(p=>(!t||p.topic===t)&&(!q||JSON.stringify(p).toLowerCase().includes(q)))) ;$$("[data-blog-open]").forEach(b=>b.onclick=()=>blogPostView(b.dataset.blogOpen))};
 $("#blogSearch").oninput=render;$("#blogTopic").onchange=render;$("#blogCreate").onclick=()=>blogEditor();$("#blogManage")?.addEventListener("click",blogManagerView);render()
}
function blogCards(posts){return posts.length?posts.map(p=>`<article class="card blogCard"><div class="eyebrow">${esc(p.topic||"GENERAL")}</div><h3>${esc(p.title)}</h3><p>${esc((p.summary||p.body||"").slice(0,180))}${(p.summary||p.body||"").length>180?"…":""}</p><div class="blogMeta"><span>${esc(p.authorName||"Tina")}</span><span>${esc(new Date(p.publishedAt||p.createdAt).toLocaleDateString())}</span></div><div class="tags">${(p.tags||[]).slice(0,5).map(t=>`<span>${esc(t)}</span>`).join("")}</div><button data-blog-open="${p.id}">Read</button></article>`).join(""):'<div class="empty">No published posts yet.</div>'}
function blogPostView(id){
 const w=communityStore(),p=w.blog.find(x=>x.id===id);if(!p)return blogView();
 show(`<article class="card blogArticle"><button class="ghost" id="blogBack">← Blog</button><div class="eyebrow">${esc(p.topic||"GENERAL")}</div><h1>${esc(p.title)}</h1><div class="blogMeta"><span>${esc(p.authorName||"Tina")}</span><span>${esc(new Date(p.publishedAt||p.createdAt).toLocaleString())}</span></div>${p.coverUrl?`<img class="blogCover" src="${esc(p.coverUrl)}" alt="">`:""}<div class="blogBody">${esc(p.body||"").replace(/\n/g,"<br>")}</div>${p.resourceUrl?`<p><button id="blogResource">Open related resource</button></p>`:""}<div class="tags">${(p.tags||[]).map(t=>`<span>${esc(t)}</span>`).join("")}</div></article>`);
 $("#blogBack").onclick=blogView;$("#blogResource")?.addEventListener("click",()=>window.open(p.resourceUrl,"_blank","noopener"))
}
function blogEditor(id=null){
 const w=communityStore(),p=id?w.blog.find(x=>x.id===id):{},admin=canPublishBlog();
 modal(id?"Edit Blog Post":admin?"Create Blog Post":"Share a Blog Draft",`<div class="wsFormGrid">${textField("blogTitle","Title",p.title||"")}${textField("blogTopicEdit","Topic",p.topic||"Learning")}${textField("blogTags","Tags",(p.tags||[]).join(", "))}${textField("blogResourceUrl","Related resource URL",p.resourceUrl||"")}${textField("blogCoverUrl","Cover image URL",p.coverUrl||"")}${areaField("blogSummary","Summary",p.summary||"")}${areaField("blogBody","Article",p.body||"")}</div>`,`<button class="primary" id="blogSave">${admin?"Save Post":"Submit for Review"}</button>`);
 $("#blogSave").onclick=()=>{const title=$("#blogTitle").value.trim(),body=$("#blogBody").value.trim();if(!title||!body)return alert("Title and article are required.");const rec=id?p:{id:uid("post"),authorUserId:currentUserId(),authorName:session()?.name||session()?.email||"User",authorRole:role(),createdAt:now()};Object.assign(rec,{title,topic:$("#blogTopicEdit").value.trim(),tags:$("#blogTags").value.split(",").map(x=>x.trim()).filter(Boolean),resourceUrl:$("#blogResourceUrl").value.trim(),coverUrl:$("#blogCoverUrl").value.trim(),summary:$("#blogSummary").value.trim(),body,updatedAt:now(),roles:rec.roles||["*"],status:admin?(rec.status||"draft"):"review"});if(!id)w.blog.push(rec);saveW(w);auditEvent("blog.post.saved",{postId:rec.id,status:rec.status});closeModal();admin?blogManagerView():blogView()}
}
function blogManagerView(){
 if(!canPublishBlog())return blogView();const w=communityStore();
 show(`<section class="blogManagerPage"><div class="pageTitleCompact"><h2>Blog Management</h2><button class="primary" id="blogManagerNew">+ Post</button></div><section class="card"><div class="list">${w.blog.slice().reverse().map(p=>`<div class="row"><div><b>${esc(p.title)}</b><small>${esc(p.authorName)} · ${esc(p.status)} · ${esc(p.topic||"")}</small></div><div class="actions"><button data-blog-edit="${p.id}">Edit</button><button data-blog-publish="${p.id}">${p.status==="published"?"Unpublish":"Publish"}</button></div></div>`).join("")||'<div class="empty">No posts yet.</div>'}</div></section></section>`);
 $("#blogManagerNew").onclick=()=>blogEditor();$$("[data-blog-edit]").forEach(b=>b.onclick=()=>blogEditor(b.dataset.blogEdit));$$("[data-blog-publish]").forEach(b=>b.onclick=()=>{const p=w.blog.find(x=>x.id===b.dataset.blogPublish);p.status=p.status==="published"?"draft":"published";if(p.status==="published")p.publishedAt=now();p.updatedAt=now();saveW(w);auditEvent("blog.post.status",{postId:p.id,status:p.status});blogManagerView()})
}
function communityChatContacts(){
 const users=userStore().users,w=workspace(),r=role(),me=currentUserId(),seen=new Set(),out=[],add=(relation,user,context="")=>{if(!user?.id||user.id===me||user.status==="suspended"||seen.has(user.id))return;seen.add(user.id);out.push({relation,user,context})},org=organizationForUser?.(me)||null;
 const S=users.filter(u=>userRoles(u).includes("superadmin")&&accountCanAuthenticate(u)),A=users.filter(u=>userRoles(u).includes("admin")&&accountCanAuthenticate(u));
 if(r==="learner"){const cls=(w.teacher?.classes||[]).filter(c=>(c.members||[]).includes(me)),ids=new Set();cls.forEach(c=>{if(c.teacherId)ids.add(c.teacherId);(c.teacherIds||[]).forEach(x=>ids.add(x))});if(!ids.size&&org)(org.teacherIds||[]).forEach(x=>ids.add(x));[...ids].map(id=>users.find(u=>u.id===id)).filter(Boolean).forEach(u=>add("Teacher",u,cls.length?"Your class":org?.name||"Assigned organization"));if(org)(org.businessAccountIds||[]).map(id=>users.find(u=>u.id===id)).filter(Boolean).forEach(u=>add("Organization administrator",u,org.name));if(!out.length)A.forEach(u=>add("Administrator",u,"Platform support"));S.forEach(u=>add("Superadmin",u,"Escalation"))}
 else if(r==="teacher"){const cls=(w.teacher?.classes||[]).filter(c=>!c.teacherId||c.teacherId===me||(c.teacherIds||[]).includes(me)),ids=new Set(cls.flatMap(c=>c.members||[]));[...ids].map(id=>users.find(u=>u.id===id)).filter(u=>u&&userRoles(u).includes("learner")).forEach(u=>add("Student",u,"Your class"));if(org)(org.businessAccountIds||[]).map(id=>users.find(u=>u.id===id)).filter(Boolean).forEach(u=>add("Organization administrator",u,org.name));A.forEach(u=>add("Administrator",u,"Platform administration"));S.forEach(u=>add("Superadmin",u,"Escalation"))}
 else if(r==="business"){if(org){(org.teacherIds||[]).map(id=>users.find(u=>u.id===id)).filter(Boolean).forEach(u=>add("Teacher",u,org.name));(org.memberIds||[]).map(id=>users.find(u=>u.id===id)).filter(u=>u&&userRoles(u).includes("learner")).forEach(u=>add("Student",u,org.name))}S.forEach(u=>add("Superadmin",u,"System owner"))}
 else if(r==="admin"){users.filter(u=>userRoles(u).some(x=>["teacher","business"].includes(x))).forEach(u=>add(userRoles(u).includes("business")?"Business":"Teacher",u,"Administrative scope"));S.forEach(u=>add("Superadmin",u,"Escalation"))}
 else if(r==="superadmin")users.filter(u=>u.id!==me).forEach(u=>add(roleLabel(userRoles(u)[0]||"learner"),u,"System-wide"));
 else{A.forEach(u=>add("Administrator",u,"Platform support"));S.forEach(u=>add("Superadmin",u,"System support"))}return out
}
function communityChatView(targetId=""){
 const w=communityStore(),me=currentUserId(),contacts=communityChatContacts(),sel=contacts.find(x=>x.user.id===targetId)||contacts[0],other=sel?.user;if(!other)return show('<div class="feedback warn">No role-appropriate contact is assigned yet.</div>');
 const msgs=w.communication.threads.filter(m=>(m.fromUserId===me&&m.toUserId===other.id)||(m.fromUserId===other.id&&m.toUserId===me)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 show(`<section class="chatPage"><div class="pageTitleCompact"><div><h2>${uiIcon("message",24)} Chat</h2><p class="muted">Contacts follow your class, organization and role hierarchy.</p></div></div><section class="chatContactLayout"><aside class="card chatContactPanel"><div class="chatContactPanelHead"><b>Contacts</b><span>${contacts.length}</span></div><div class="chatContactList">${contacts.map(c=>`<button class="chatContactCard ${c.user.id===other.id?"active":""}" data-chat-contact="${c.user.id}"><span class="chatContactAvatar">${esc((c.user.name||c.user.email||"U")[0].toUpperCase())}</span><span><b>${esc(c.user.name||c.user.email)}</b><small>${esc(c.relation)}</small><em>${esc(c.context||"")}</em></span></button>`).join("")}</div></aside><section class="card chatWindow"><div class="chatConversationHead"><span class="chatContactAvatar large">${esc((other.name||other.email||"U")[0].toUpperCase())}</span><div><b>${esc(other.name||other.email)}</b><span>${esc(sel.relation)}${sel.context?` · ${esc(sel.context)}`:""}</span><small>${esc(other.email||"")}</small></div></div><div id="chatMessages" class="chatMessages">${msgs.map(m=>`<div class="chatBubble ${m.fromUserId===me?"mine":"theirs"}"><p>${esc(m.body)}</p><small>${esc(new Date(m.createdAt).toLocaleString())}</small></div>`).join("")||'<div class="empty">Start the conversation.</div>'}</div><div class="chatComposer"><textarea id="chatBody" rows="3" placeholder="Write a message…"></textarea><button class="primary" id="chatSend">Send</button></div></section></section></section>`);
 $$("[data-chat-contact]").forEach(b=>b.onclick=()=>communityChatView(b.dataset.chatContact));$("#chatSend").onclick=()=>{const body=$("#chatBody").value.trim();if(!body)return;w.communication.threads.push({id:uid("chat"),fromUserId:me,toUserId:other.id,body,status:"sent",createdAt:now(),relation:sel.relation,context:sel.context});saveW(w);auditEvent("community.chat.sent",{toUserId:other.id,relation:sel.relation});communityChatView(other.id)};const box=$("#chatMessages");if(box)box.scrollTop=box.scrollHeight
}

function superadminChatInboxView(){
 if(!isSuperadmin())return communityChatView();const w=communityStore(),me=currentUserId(),threads=w.communication.threads.filter(m=>m.toUserId===me||m.fromUserId===me),people=[...new Set(threads.map(m=>m.fromUserId===me?m.toUserId:m.fromUserId))];
 show(`<section class="chatInboxPage"><div class="pageTitleCompact"><h2>Community Chat Inbox</h2></div><section class="card"><div class="list">${people.map(id=>{const u=userStore().users.find(x=>x.id===id),last=threads.filter(m=>m.fromUserId===id||m.toUserId===id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))[0];return `<button class="row chatInboxRow" data-chat-user="${id}"><div><b>${esc(u?.name||u?.email||id)}</b><small>${esc(last?.body||"")}</small></div><span>${esc(new Date(last?.createdAt||Date.now()).toLocaleDateString())}</span></button>`}).join("")||'<div class="empty">No conversations yet.</div>'}</div></section></section>`);
 $$("[data-chat-user]").forEach(b=>b.onclick=()=>communityChatWithUser(b.dataset.chatUser))
}
function communityChatWithUser(otherId){
 const w=communityStore(),me=currentUserId(),other=userStore().users.find(x=>x.id===otherId);if(!other)return superadminChatInboxView();const msgs=w.communication.threads.filter(m=>(m.fromUserId===me&&m.toUserId===otherId)||(m.fromUserId===otherId&&m.toUserId===me)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 show(`<section class="chatPage"><button class="ghost" id="chatInboxBack">← Inbox</button><h2>${esc(other.name||other.email)}</h2><section class="card chatWindow"><div class="chatMessages">${msgs.map(m=>`<div class="chatBubble ${m.fromUserId===me?"mine":"theirs"}"><p>${esc(m.body)}</p><small>${esc(new Date(m.createdAt).toLocaleString())}</small></div>`).join("")}</div><div class="chatComposer"><textarea id="chatBody" rows="3"></textarea><button class="primary" id="chatSend">Send</button></div></section></section>`);
 $("#chatInboxBack").onclick=superadminChatInboxView;$("#chatSend").onclick=()=>{const body=$("#chatBody").value.trim();if(!body)return;w.communication.threads.push({id:uid("chat"),fromUserId:me,toUserId:otherId,body,status:"sent",createdAt:now()});saveW(w);communityChatWithUser(otherId)}
}
function communitySettingsView(){
 if(!isSuperadmin())return communityHubView();const w=communityStore();
 show(`<section class="communitySettingsPage"><div class="pageTitleCompact"><h2>Community Settings</h2></div><section class="card wsFormGrid">${textField("communityZaloUrl","Zalo group / OA URL",w.community.zaloUrl||"")}${textField("communityZaloLabel","Zalo label",w.community.zaloLabel||"Zalo Community")}<div class="actions"><button class="primary" id="communitySettingsSave">Save Community Settings</button></div></section></section>`);
 $("#communitySettingsSave").onclick=()=>{w.community.zaloUrl=$("#communityZaloUrl").value.trim();w.community.zaloLabel=$("#communityZaloLabel").value.trim()||"Zalo Community";saveW(w);auditEvent("community.settings.updated",{});communityHubView()}
}
function communityHubView(){
 const w=communityStore(),z=w.community;
 show(`<section class="communityHubPage"><div class="communityHero"><div><div class="eyebrow">TINA COMMUNITY</div><h2>Learn together. Share useful knowledge.</h2><p>Read the blog, follow announcements, chat with support and contribute ideas.</p></div>${z.zaloUrl?`<button class="primary" id="communityZalo">Open ${esc(z.zaloLabel||"Zalo")}</button>`:""}</div><section class="communityHubGrid"><button data-community-go="blog-extra">${uiIcon("blog",22)}<span><b>Blog</b><small>News, resources and shared knowledge</small></span></button><button data-community-go="announcements-extra">${uiIcon("bell",22)}<span><b>Announcements</b><small>Updates from Tina administrators</small></span></button><button data-community-go="${isSuperadmin()?"chat-inbox-extra":"community-chat-extra"}">${uiIcon("message",22)}<span><b>Chat</b><small>Contact the appropriate administrator</small></span></button><button data-community-go="feedback-extra">${uiIcon("flag",22)}<span><b>Feedback & Bugs</b><small>Suggest improvements or report a problem</small></span></button></section>${isSuperadmin()?'<button id="communitySettings" class="ghost">Community Settings</button>':""}</section>`);
 $("#communityZalo")?.addEventListener("click",()=>window.open(z.zaloUrl,"_blank","noopener"));$("#communitySettings")?.addEventListener("click",communitySettingsView);$$("[data-community-go]").forEach(b=>b.onclick=()=>roleTargetOpen(b.dataset.communityGo))
}

/* ---------- SYSTEM-WIDE DATA STANDARDS + SIDEBAR NOTIFICATIONS ---------- */
const DATA_STANDARD_RULES={
 canonicalId:{label:"Canonical ID",sample:"cpe-use-of-english-unit-01",rule:"Lowercase kebab-case only: a–z, 0–9 and single hyphens; 3–96 characters.",test:v=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.trim())&&v.trim().length>=3&&v.trim().length<=96},
 languageCode:{label:"Language code",sample:"en-GB",rule:"Use a BCP-47-style code such as en, en-GB or vi-VN.",test:v=>/^[A-Za-z]{2,3}(?:-[A-Za-z]{2}|-[0-9]{3})?$/.test(v.trim())},
 version:{label:"Version",sample:"1",rule:"Positive integer starting from 1.",test:v=>/^\d+$/.test(v.trim())&&Number(v)>=1},
 title:{label:"Title / subject",sample:"CPE Listening Practice — Unit 01",rule:"2–160 characters; trim leading/trailing spaces; one line; sentence/title case; no decorative symbols at the start.",test:v=>v.trim().length>=2&&v.trim().length<=160&&!/[\r\n]/.test(v)},
 name:{label:"Person / contact name",sample:"Nguyen Minh Anh",rule:"2–100 characters; normal spacing; no leading/trailing spaces.",test:v=>v.trim().length>=2&&v.trim().length<=100&&!/\s{2,}/.test(v.trim())},
 email:{label:"Email",sample:"learner@example.com",rule:"Use name@domain.tld with no spaces.",test:v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())},
 url:{label:"URL",sample:"https://example.com/resource",rule:"Use a complete http:// or https:// URL.",test:v=>{try{const u=new URL(v.trim());return["http:","https:"].includes(u.protocol)}catch{return false}}},
 tags:{label:"Tags",sample:"CPE, listening, pronunciation",rule:"Comma-separated terms; 1–40 characters per tag; no empty tag.",test:v=>v.split(",").every(x=>x.trim().length>=1&&x.trim().length<=40)},
 phone:{label:"Phone",sample:"+84 912 345 678",rule:"Use 7–20 digits; spaces, +, -, (, ) are allowed.",test:v=>/^[+()\d\s-]{7,24}$/.test(v.trim())&&((v.match(/\d/g)||[]).length>=7)},
 date:{label:"Date / time",sample:"2026-08-29 09:30",rule:"Use the system date/time picker when available; otherwise YYYY-MM-DD or YYYY-MM-DD HH:MM.",test:v=>/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2})?$/.test(v.trim())},
 number:{label:"Number / score",sample:"85",rule:"Use digits only; decimal point is allowed when the field supports decimals.",test:v=>v.trim()!==""&&Number.isFinite(Number(v))}
};
function inferDataStandard(el){
 if(!el||!['INPUT','TEXTAREA'].includes(el.tagName)||el.type==="password"||el.closest('.authWrap,.superadminPortalWrap'))return null;
 const id=((el.id||"")+" "+(el.name||"")+" "+(el.getAttribute("aria-label")||"")).toLowerCase();
 if(/(canonicalid|courseid|unitid|lessonid|activityid|itemid|deckid|referenceid)/.test(id))return"canonicalId";
 if(/languagecode|locale/.test(id))return"languageCode";
 if(/version/.test(id)&&el.type!=="hidden")return"version";
 if(el.type==="email"||id.includes("email"))return"email";
 if(el.type==="url"||/(url|link)/.test(id))return"url";
 if(el.type==="tel"||id.includes("phone"))return"phone";
 if(el.type==="number"||/(score|percent|count|minutes|hours|rate$)/.test(id))return"number";
 if(el.type==="date"||el.type==="datetime-local")return"date";
 if(/tag/.test(id))return"tags";
 if(/subject|title/.test(id))return"title";
 if(/name/.test(id)&&!/(username|filename)/.test(id))return"name";
 return null;
}
function clearDataStandardError(el){el?.classList.remove("dataStandardInvalid");const n=el?.parentElement?.querySelector?.(`.dataStandardHint[data-for="${el.id||"field"}"]`);if(n)n.remove()}
function validateDataStandardField(el,{silent=false}={}){
 const key=el?.dataset?.standard||inferDataStandard(el),spec=effectiveDataStandardSpec(key);if(!key||!spec)return true;const v=String(el.value||"");clearDataStandardError(el);if(!v.trim()){if(el.required){if(!silent)showDataStandardError(el,`Required. Example: ${spec.sample}`);return false}return true}if(spec.test(v))return true;if(!silent)showDataStandardError(el,`${spec.rule} Example: ${spec.sample}`);return false
}
function showDataStandardError(el,msg){el.classList.add("dataStandardInvalid");const n=document.createElement("small");n.className="dataStandardHint";n.dataset.for=el.id||"field";n.textContent=msg;el.insertAdjacentElement("afterend",n)}
function applyDataStandardSuggestion(el){const key=el?.dataset?.standard||inferDataStandard(el),spec=effectiveDataStandardSpec(key);if(!key||!spec)return;el.dataset.standard=key;if(!el.placeholder)el.placeholder=`Example: ${spec.sample}`;el.title=`Data standard: ${spec.rule}`}
function installDataStandardsRuntime(){
 if(window.__tinaDataStandardsInstalled)return;window.__tinaDataStandardsInstalled=true;
 document.addEventListener("focusin",e=>applyDataStandardSuggestion(e.target),true);
 document.addEventListener("focusout",e=>validateDataStandardField(e.target),true);
 document.addEventListener("input",e=>{if(e.target?.classList?.contains("dataStandardInvalid"))validateDataStandardField(e.target,{silent:true})},true);
 document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b||b.type==="button"&&/cancel|close|back|preview|listen|open|flip|next|previous/i.test(b.textContent||""))return;const action=(b.textContent||"").trim();if(!/save|create|add|send|submit|publish|update/i.test(action))return;const scope=b.closest(".modal,.modalCard,.card,.wsFormGrid,form");if(!scope)return;const fields=[...scope.querySelectorAll("input,textarea")].filter(x=>inferDataStandard(x)||x.dataset.standard);let ok=true;fields.forEach(x=>{applyDataStandardSuggestion(x);if(!validateDataStandardField(x))ok=false});if(!ok){e.preventDefault();e.stopImmediatePropagation();fields.find(x=>x.classList.contains("dataStandardInvalid"))?.focus()}},true)
}
const DATA_STANDARDS_GOV_KEY="tina.v14.data.standards.governance";
function dataStandardsGovernance(){
 const baseline={version:1,status:"active",policyNote:"System-wide data entry standards controlled by Superadmin.",rules:{},updatedAt:null,updatedBy:null};
 try{
   const raw=JSON.parse(localStorage.getItem(DATA_STANDARDS_GOV_KEY)||"{}");
   const s=Object.assign({},baseline,raw);
   s.rules=Object.assign({},baseline.rules,raw.rules||{});
   return s
 }catch{return baseline}
}
function saveDataStandardsGovernance(s){
 s.updatedAt=now();s.updatedBy=currentUserId();
 localStorage.setItem(DATA_STANDARDS_GOV_KEY,JSON.stringify(s));
 window.TinaBackend?.scheduleSync?.("data-standards-governance");
 auditEvent("data.standards.updated",{version:s.version,status:s.status,ruleCount:Object.keys(s.rules||{}).length})
}
function effectiveDataStandardSpec(key){
 const base=DATA_STANDARD_RULES[key];if(!base)return null;
 const g=dataStandardsGovernance(),o=g.rules?.[key]||{};
 if(o.enabled===false)return null;
 return Object.assign({},base,{
   label:typeof o.label==="string"&&o.label.trim()?o.label.trim():base.label,
   rule:typeof o.rule==="string"&&o.rule.trim()?o.rule.trim():base.rule,
   sample:typeof o.sample==="string"&&o.sample.trim()?o.sample.trim():base.sample
 })
}
function dataStandardsView(){
 if(!isSuperadmin())return show('<div class="feedback bad">Data Standards governance is available only to Superadmin.</div>');
 const g=dataStandardsGovernance(),keys=Object.keys(DATA_STANDARD_RULES);
 show(`<section class="dataStandardsPage"><div class="sectionHead"><div><div class="eyebrow">SUPERADMIN · DATA GOVERNANCE</div><h2>Data Standards Manager</h2><p class="muted">Superadmin owns the platform-wide data-entry contract. Guidance and examples can be updated here; validator semantics remain platform-controlled so accidental edits cannot weaken validation.</p></div><div class="actions"><button id="dataStandardsReset">Reset Guidance</button><button class="primary" id="dataStandardsSave">Save Standards</button></div></div>
 <section class="card dataGovernanceMeta"><div class="wsFormGrid">
   <label class="fieldLabel">Policy version<input id="dataStandardsVersion" type="number" min="1" value="${esc(String(g.version||1))}"></label>
   <label class="fieldLabel">Status<select id="dataStandardsStatus"><option value="active" ${g.status!=="draft"?"selected":""}>Active</option><option value="draft" ${g.status==="draft"?"selected":""}>Draft</option></select></label>
   <label class="fieldLabel dataGovernanceWide">Governance note<textarea id="dataStandardsNote" rows="3">${esc(g.policyNote||"")}</textarea></label>
 </div><p class="muted">Last update: ${esc(g.updatedAt?new Date(g.updatedAt).toLocaleString():"Not yet customized")}.</p></section>
 <section class="card"><div class="sectionHead compact"><div><h3>Account Lifecycle Status Registry</h3><p class="muted">Canonical status data used by account management, authentication and system health.</p></div></div><div class="tableWrap"><table><thead><tr><th>ID</th><th>Status</th><th>Vietnamese</th><th>Login</th><th>Operational</th><th>Meaning</th></tr></thead><tbody>${ACCOUNT_STATUS_DEFS.map(x=>`<tr><td><code>${esc(x.id)}</code></td><td>${esc(x.label)}</td><td>${esc(x.vi)}</td><td>${x.login?"Yes":"No"}</td><td>${x.operational?"Yes":"No"}</td><td>${esc(x.description)}</td></tr>`).join("")}</tbody></table></div></section><section class="card"><h3>Core rules</h3><ol class="dataStandardPrinciples"><li>One canonical identity per concept; aliases never become duplicate canonical records.</li><li>UTF-8 text, normalized spacing, and no decorative symbols in canonical identifiers/titles unless semantically required.</li><li>Short titles; explanations belong in Description/Notes.</li><li>Normalized dates, URLs, emails, tags, language codes and numeric fields.</li><li>No passwords, secrets or credentials in content/data fields.</li><li>Invalid recognized fields must be corrected before Save/Send/Publish.</li></ol></section>
 <section class="card"><h3>Managed field standards</h3><div class="dataStandardsManager">${keys.map(key=>{const b=DATA_STANDARD_RULES[key],o=g.rules?.[key]||{},enabled=o.enabled!==false;return `<article class="dataStandardManageCard" data-standard-key="${esc(key)}"><div class="dataStandardManageHead"><div><b>${esc(key)}</b><small>Validator: platform locked</small></div><label><input type="checkbox" data-ds-enabled="${esc(key)}" ${enabled?"checked":""}> Enabled</label></div><label>Display name<input data-ds-label="${esc(key)}" value="${esc(o.label||b.label)}"></label><label>Required format<textarea data-ds-rule="${esc(key)}" rows="3">${esc(o.rule||b.rule)}</textarea></label><label>Suggested sample<input data-ds-sample="${esc(key)}" value="${esc(o.sample||b.sample)}"></label></article>`}).join("")}</div></section>
 <section class="card"><h3>Canonical learning record example</h3><pre class="dataStandardCode">${esc(JSON.stringify({id:"cpe-uoe-unit-01",title:"CPE Use of English — Unit 01",level:"C2 Proficiency",skill:"Use of English",status:"draft",tags:["CPE","word formation","open cloze"],sourceUrl:"https://example.com/source",version:1,updatedAt:"2026-08-29T09:30:00+07:00"},null,2))}</pre></section></section>`);
 $("#dataStandardsSave").onclick=()=>{
   const next=dataStandardsGovernance();
   next.version=Math.max(1,Number($("#dataStandardsVersion")?.value||1));
   next.status=$("#dataStandardsStatus")?.value||"active";
   next.policyNote=$("#dataStandardsNote")?.value.trim()||"System-wide data entry standards controlled by Superadmin.";
   next.rules={};
   keys.forEach(key=>next.rules[key]={
     enabled:$(`[data-ds-enabled="${key}"]`)?.checked!==false,
     label:$(`[data-ds-label="${key}"]`)?.value.trim()||DATA_STANDARD_RULES[key].label,
     rule:$(`[data-ds-rule="${key}"]`)?.value.trim()||DATA_STANDARD_RULES[key].rule,
     sample:$(`[data-ds-sample="${key}"]`)?.value.trim()||DATA_STANDARD_RULES[key].sample
   });
   saveDataStandardsGovernance(next);alert("Data Standards saved for the whole platform.");dataStandardsView()
 };
 $("#dataStandardsReset").onclick=()=>{
   if(!confirm("Reset managed guidance and samples to the platform defaults?"))return;
   localStorage.removeItem(DATA_STANDARDS_GOV_KEY);auditEvent("data.standards.reset",{});dataStandardsView()
 }
}
const SIDEBAR_READ_KEY="tina.v14.sidebar.read";
function sidebarReadState(){try{return JSON.parse(localStorage.getItem(SIDEBAR_READ_KEY)||"{}")}catch{return{}}}
function saveSidebarReadState(x){localStorage.setItem(SIDEBAR_READ_KEY,JSON.stringify(x))}
function sidebarLastRead(target){return Number(sidebarReadState()[`${currentUserId()}:${target}`]||0)}
function recordTime(x){const t=new Date(x||0).getTime();return Number.isFinite(t)?t:0}
function sidebarBadgeCount(target){
 if(!session())return 0;const last=sidebarLastRead(target),w=communityStore(),r=role(),me=currentUserId();
 if(target==="blog-extra")return w.blog.filter(p=>p.status==="published"&&(p.roles||["*"]).some(x=>x==="*"||x===r)&&recordTime(p.publishedAt||p.createdAt)>last).length;
 if(target==="announcements-extra")return w.communication.announcements.filter(x=>x.status==="published"&&(x.roles||["*"]).some(z=>z==="*"||z===r)&&recordTime(x.updatedAt||x.createdAt)>last).length;
 if(target==="community-chat-extra"||target==="chat-inbox-extra")return w.communication.threads.filter(x=>x.toUserId===me&&recordTime(x.createdAt)>last).length;
 if(target==="feedback-extra")return w.communication.issues.filter(x=>x.userId===me&&recordTime(x.updatedAt||x.createdAt)>last).length;
 if(target==="issue-desk-extra"&&isSuperadmin())return w.communication.issues.filter(x=>recordTime(x.updatedAt||x.createdAt)>last).length;
 return 0
}
function sidebarBadgeMarkup(target){const n=sidebarBadgeCount(target);return n?`<span class="sideNotifyBadge" data-side-badge="${esc(target)}">${n>99?"99+":n}</span>`:`<span class="sideNotifyBadge empty" data-side-badge="${esc(target)}"></span>`}
function refreshSidebarBadges(){document.querySelectorAll("[data-side-target]").forEach(b=>{let badge=b.querySelector(".sideNotifyBadge");if(!badge){badge=document.createElement("span");badge.className="sideNotifyBadge empty";b.appendChild(badge)}const n=sidebarBadgeCount(b.dataset.sideTarget);badge.textContent=n?(n>99?"99+":String(n)):"";badge.classList.toggle("empty",!n)})}
function markSidebarRouteRead(target){if(!["blog-extra","announcements-extra","community-chat-extra","chat-inbox-extra","feedback-extra","issue-desk-extra"].includes(target))return;const x=sidebarReadState();x[`${currentUserId()}:${target}`]=Date.now();saveSidebarReadState(x);queueMicrotask(refreshSidebarBadges)}

/* ---------- PERSISTENT ROLE NAVIGATION / SUBHEADINGS ---------- */
function roleSidebarGroups(){
 const r=role();
 const adminContent=[];
 if(hasPermission("authoring"))adminContent.push(["Authoring Hub","author"]);
 if(hasPermission("content"))adminContent.push(["Content Studio","content-v12"],["Editing Studio","editing-extra"]);
 if(hasPermission("data"))adminContent.push(["Delegated Data Editing","admin-data-extra"]);
 if(hasPermission("practice-admin"))adminContent.push(["Practice Administration","practice-v10"]);
 if(hasPermission("assessment-admin"))adminContent.push(["Assessment Administration","assessment-v11"]);
 const map={
  learner:[
   ["Learning",[["Dashboard","student-dashboard-extra"],["Catalog","catalog"],["Active Learning","learn"],["Tina Shadowing","shadowing-extra"],["Flashcards","flashcards-extra"],["Games","games-extra"]]],
   ["Resources",[["Tina Dictionary","dictionary-extra"],["Tina Library","library-extra"],["Study Plans","plans"],["Research","research"]]],
   ["Progress",[["Review","review"],["Progress","progress"],["Profile","profile-extra"]]],
   ["Community",[["Community Hub","community-extra"],["Blog","blog-extra"],["Leaderboard","leaderboard-extra"],["Achievements","achievements-extra"],["Announcements","announcements-extra"],["Chat","community-chat-extra"]]],
   ["Support",[["Reminders","reminders-extra"],["Quick Tour","onboarding-extra"],["Role Guide","my-role-guide-extra"],["Role Hierarchy","role-hierarchy-extra"],["Contact","contact-extra"],["Feedback / Bug Report","feedback-extra"]]],
   ["Account",[["Theme Studio","themes-extra"],["Settings","settings"]]]
  ],
  teacher:[
   ["Teaching",[["Dashboard","teacher-dashboard-extra"],["Classes","teacher-classes-extra"],["Assignments","teacher-assignments-extra"],["Grading","teacher-grading-extra"],["Learner Progress","teacher-progress-extra"],["Shadowing Insights","shadowing-insights-extra"]]],
   ["Resources",[["Tina Dictionary","dictionary-extra"],["Tina Library","library-extra"]]],
   ["Community",[["Community Hub","community-extra"],["Blog","blog-extra"],["Announcements","announcements-extra"],["Chat","community-chat-extra"]]],
   ["Support",[["Reminders","reminders-extra"],["Quick Tour","onboarding-extra"],["Role Guide","my-role-guide-extra"],["Role Hierarchy","role-hierarchy-extra"],["Contact","contact-extra"],["Feedback / Bug Report","feedback-extra"]]],
   ["Account",[["Profile","profile-extra"],["Theme Studio","themes-extra"],["Settings","settings"]]]
  ],
  business:[
   ["Organization",[["Dashboard","business-dashboard-extra"],["Programs","business-programs-extra"],["Members","business-members-extra"],["Teachers","business-teachers-extra"],["Reports","business-reports-extra"]]],
   ["Resources",[["Tina Dictionary","dictionary-extra"],["Tina Library","library-extra"]]],
   ["Community",[["Community Hub","community-extra"],["Blog","blog-extra"],["Announcements","announcements-extra"],["Chat","community-chat-extra"]]],
   ["Support",[["Reminders","reminders-extra"],["Quick Tour","onboarding-extra"],["Role Guide","my-role-guide-extra"],["Role Hierarchy","role-hierarchy-extra"],["Contact","contact-extra"],["Feedback / Bug Report","feedback-extra"]]],
   ["Account",[["Account Center","account-extra"],["Profile","profile-extra"],["Theme Studio","themes-extra"],["Settings","settings"]]]
  ],
  editor:[
   ["Content",[["Content Studio","content-v12"],["Tina Library","library-extra"],["Research","research"]]],
   ["Community",[["Community Hub","community-extra"],["Blog","blog-extra"],["Announcements","announcements-extra"],["Chat","community-chat-extra"]]],
   ["Account",[["Quick Tour","onboarding-extra"],["Profile","profile-extra"],["Theme Studio","themes-extra"],["Settings","settings"]]]
  ],
  reviewer:[
   ["Review",[["Review","review"],["Issue Review Queue","reviewer-issues-extra"],["Assessment","assessment-v11"],["Progress","progress"]]],
   ["Resources",[["Tina Dictionary","dictionary-extra"],["Tina Library","library-extra"]]],
   ["Community",[["Community Hub","community-extra"],["Blog","blog-extra"],["Announcements","announcements-extra"],["Chat","community-chat-extra"]]],
   ["Account",[["Quick Tour","onboarding-extra"],["Profile","profile-extra"],["Theme Studio","themes-extra"],["Settings","settings"]]]
  ],
  admin:[
   ["Administration",[["Admin Dashboard","admin-v14"],["Review & Escalate","admin-review-extra"],["Users & Roles","roles-extra"]]],
   ...(adminContent.length?[["Delegated Editing",adminContent]]:[]),
   ["Resources",[["Tina Dictionary","dictionary-extra"],["Tina Library","library-extra"]]],
   ["Communication",[["Community Hub","community-extra"],["Blog","blog-extra"],["Announcements","announcements-extra"],["Chat","community-chat-extra"],["Contact Superadmin","contact-extra"],["Feedback / Bug Report","feedback-extra"]]],
   ["Account",[["Quick Tour","onboarding-extra"],["Theme Studio","themes-extra"],["Settings","settings"]]]
  ],
  superadmin:[
   ["System Control",[["Superadmin Dashboard","superadmin-extra"],["Learning Intelligence","learning-intelligence-extra"],["Governance Map","governance-map-extra"],["Data Standards","data-standards-extra"],["Role Permission Matrix","role-matrix-extra"],["Role Guides","role-guides-extra"],["Authentication Gates","auth-gates-extra"],["Security Readiness","security-readiness-extra"],["System Health","health-extra"],["System QA & Reliability","system-qa-extra"],["System Administration","system-admin-extra"],["Activity History","history-extra"],["Users & Roles","roles-extra"],["Users & Access","access-extra"],["User Permissions","permissions-extra"],["Business Organizations","organizations-extra"],["Admin Escalations","admin-escalations-extra"]]],
   ["Content & Academy",[["Tina Academy","academy"],["Authoring Hub","author"],["Content Studio","content-v12"],["Editing Studio","editing-extra"],["Data Manager","data"]]],
   ["Learning Systems",[["Catalog","catalog"],["Active Learning","learn"],["Tina Shadowing","shadowing-extra"],["Practice","practice-v10"],["Assessment","assessment-v11"],["Adaptive","adaptive-v13"],["Teacher Workspace","teacher-extra"]]],
   ["Knowledge",[["Tina Dictionary","dictionary-extra"],["Tina Library","library-extra"],["Research","research"],["Study Plans","plans"]]],
   ["Interfaces",[["Interface Studio","interface-studio-extra"],["App Interface","app-studio-extra"],["Footer Editor","footer-editor-extra"]]],
   ["Communication",[["System Activity Analytics","system-activity-extra"],["Community Hub","community-extra"],["Blog","blog-extra"],["Blog Manager","blog-manage-extra"],["Announcements","announcements-extra"],["Announcement Manager","announcement-manager-extra"],["Community Chat Inbox","chat-inbox-extra"],["Community Settings","community-settings-extra"],["Feedback & Issue Desk","issue-desk-extra"],["Reminders","reminders-extra"],["Quick Tour","onboarding-extra"],["Role Guide","my-role-guide-extra"],["Role Hierarchy","role-hierarchy-extra"],["Contact","contact-extra"]]],
   ["Quality Assurance",[["System QA & Reliability","system-qa-extra"],["Reviewer Issue Queue","reviewer-issues-extra"],["Disposable System QA","qa-sandbox-extra"]]],
   ["Infrastructure",[["Infrastructure Overview","infrastructure-extra"],["Backend Migration","backend-extra"],["Canonical Creation","canon-create-extra"],["Canonical Data","canonical"],["Learning Core","core"],["Theme Studio","themes-extra"],["Settings","settings"]]]
  ]
 };
 return map[r]||map.learner;
}
const ROLE_BASE_TARGETS=new Set(["home","catalog","learn","plans","research","review","progress","settings","academy","author","content-v12","data","practice-v10","assessment-v11","adaptive-v13","core"]);
async function openCanonicalDataDirect(){
 if(!isSuperadmin()&&!canAccessCanon())return show('<div class="feedback bad">Canonical Data is Superadmin-governed.</div>');
 if(window.TinaCanonicalV6?.loadProjection)await window.TinaCanonicalV6.loadProjection();
 if(window.TinaCanonicalV6?.open)return window.TinaCanonicalV6.open();
 const ok=clickDataView("canonical");if(!ok)show('<div class="feedback bad">Canonical Data module is not registered. Check canonical-adapter-v6.js.</div>')
}
async function openLearningCoreDirect(){
 if(!isSuperadmin())return show('<div class="feedback bad">Learning Core is Superadmin-only.</div>');
 if(window.TinaUnifiedRuntimeV7?.load)await window.TinaUnifiedRuntimeV7.load();
 if(window.TinaUnifiedRuntimeV7?.open)return window.TinaUnifiedRuntimeV7.open();
 const ok=clickDataView("core");if(!ok)show('<div class="feedback bad">Learning Core module is not registered. Check canonical-learning-v5.js and unified-runtime-v7.js.</div>')
}
const ROLE_HISTORY_KEY="tina.v14.role.route.history";
let roleHistoryNavigating=false;
function roleHistoryState(){try{return JSON.parse(sessionStorage.getItem(ROLE_HISTORY_KEY)||'{"stack":[],"index":-1}')}catch{return{stack:[],index:-1}}}
function saveRoleHistory(x){sessionStorage.setItem(ROLE_HISTORY_KEY,JSON.stringify(x))}
function recordRoleHistory(target){
 if(roleHistoryNavigating||!target)return;const h=roleHistoryState();if(h.stack[h.index]===target)return;h.stack=h.stack.slice(0,h.index+1);h.stack.push(target);if(h.stack.length>120)h.stack.shift();h.index=h.stack.length-1;saveRoleHistory(h);updateRoleHistoryButtons()
}
function roleHistoryGo(delta){
 const h=roleHistoryState(),next=h.index+delta;if(next<0||next>=h.stack.length)return;h.index=next;saveRoleHistory(h);roleHistoryNavigating=true;try{roleTargetOpen(h.stack[h.index],true)}finally{roleHistoryNavigating=false;updateRoleHistoryButtons()}
}
function updateRoleHistoryButtons(){const h=roleHistoryState(),b=$("#appBackBtn"),f=$("#appForwardBtn");if(b)b.disabled=h.index<=0;if(f)f.disabled=h.index<0||h.index>=h.stack.length-1}
function installRoleHistoryBridge(){
 const b=$("#appBackBtn"),f=$("#appForwardBtn");if(b)b.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();roleHistoryGo(-1)};if(f)f.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();roleHistoryGo(1)};
 const h=roleHistoryState();if(h.index<0){h.stack=[role()==="learner"?"student-dashboard-extra":role()==="teacher"?"teacher-dashboard-extra":role()==="business"?"business-dashboard-extra":role()==="admin"?"admin-v14":"superadmin-extra"];h.index=0;saveRoleHistory(h)}updateRoleHistoryButtons()
}
function roleRouteAuthorized(target){
 if(isSuperadmin()||target==="home")return true;
 const visible=new Set(roleSidebarGroups().flatMap(g=>g[1].map(x=>x[1])));
 return visible.has(target)
}
function roleTargetOpen(t,fromHistory=false){
 markSidebarRouteRead(t);
 if(!fromHistory)recordRoleHistory(t);
 if(t==="home"){return roleLandingView()}
 if(!roleRouteAuthorized(t)){
   auditEvent("navigation.role.blocked",{target:t,role:role(),reason:"not-in-role-navigation-contract"});
   return show(`<div class="feedback bad">This workspace is not assigned to the active ${esc(role()==="learner"?"Student":role())} role.</div>`)
 }
 if(t==="learn"&&!["learner","superadmin"].includes(role())){
   auditEvent("navigation.role.blocked",{target:t,role:role()});
   return show('<div class="feedback bad">Active Learning is available only to Student and Superadmin.</div>');
 }
 const custom={
  "profile-extra":profileView,
  "teacher-extra":teacherView,
  "teacher-dashboard-extra":teacherDashboardView,
  "teacher-classes-extra":teacherClassesView,
  "teacher-assignments-extra":teacherAssignmentsView,
  "teacher-grading-extra":teacherGradingView,
  "teacher-progress-extra":teacherProgressView,
  "business-extra":businessView,
  "business-dashboard-extra":businessDashboardView,
  "business-programs-extra":businessProgramsView,
  "business-members-extra":businessMembersView,
  "business-teachers-extra":businessTeachersView,
  "business-reports-extra":businessReportsView,
  "account-extra":accountCenter,
  "superadmin-extra":superadminDashboardView,
  "system-admin-extra":systemAdministrationView,
  "health-extra":systemHealthView,
  "system-qa-extra":systemQAReliabilityView,
  "security-readiness-extra":securityReadinessView,
  "history-extra":activityHistoryView,
  "editing-extra":adminEditingStudio,
  "roles-extra":roleManagementView,
  "access-extra":accessControlView,
  "permissions-extra":userPermissionMatrixView,
  "games-extra":gamesView,
  "leaderboard-extra":leaderboardView,
  "achievements-extra":achievementsView,
  "dictionary-extra":tinaDictionaryView,
  "library-extra":libraryView,
  "interface-studio-extra":interfaceStudioView,
  "app-studio-extra":appInterfaceStudioView,
  "infrastructure-extra":infrastructureView,
  "auth-gates-extra":authGovernanceView,
  "organizations-extra":organizationManagerView,
  "backend-extra":backendMigrationView,
  "canon-create-extra":canonicalCreationStudio,
  "themes-extra":themeStudioView,
  "governance-map-extra":superadminGovernanceMapView,
  "role-matrix-extra":systemRoleMatrixView,
  "role-guides-extra":roleGuidesView,
  "my-role-guide-extra":myRoleGuideView,
  "role-hierarchy-extra":roleHierarchyView,
  "contact-extra":contactSupportView,
  "feedback-extra":feedbackIssueView,
  "reminders-extra":reminderCenterView,
  "announcements-extra":announcementCenterView,
  "announcement-manager-extra":announcementManagerView,
  "issue-desk-extra":superadminIssueDeskView,
  "reviewer-issues-extra":reviewerIssueQueueView,
  "system-activity-extra":systemActivityAnalyticsView,
  "qa-sandbox-extra":qaSandboxView,
  "student-dashboard-extra":studentDashboardView,
  "flashcards-extra":studentFlashcardView,
  "blog-extra":blogView,
  "blog-manage-extra":blogManagerView,
  "community-extra":communityHubView,
  "community-chat-extra":communityChatView,
  "chat-inbox-extra":superadminChatInboxView,
  "community-settings-extra":communitySettingsView,
  "onboarding-extra":restartOnboarding,
  "admin-review-extra":adminReviewEscalationView,
  "admin-escalations-extra":superadminEscalationDeskView,
  "admin-data-extra":adminDelegatedDataView,
  "footer-editor-extra":footerEditorView,
  "themes-extra":themeStudioView,
  "settings":enhancedSettingsView,
  "canonical":openCanonicalDataDirect,
  "core":openLearningCoreDirect,
  "learning-intelligence-extra":learningIntelligenceView,
  "shadowing-extra":tinaShadowingView,
  "shadowing-insights-extra":shadowingInsightsView,
  "data-standards-extra":dataStandardsView
 };
 if(custom[t])return custom[t]();
 if(t==="canonical"&&!canAccessCanon())return show('<div class="feedback bad">Canonical access requires explicit Superadmin permission.</div>');
 if(t==="admin-v14"){const b=document.querySelector('[data-view="admin-v14"]');if(b){b.click();setTimeout(()=>injectDashboardCharts("admin"),30);return}return show('<div class="feedback bad">Admin dashboard route is unavailable.</div>')}
 if(ROLE_BASE_TARGETS.has(t))return clickDataView(t);
 auditEvent("navigation.route.missing",{target:t,role:role()});
 return show(`<div class="feedback bad">Navigation target <b>${esc(t)}</b> is not registered. Superadmin can review the Sidebar Route Audit.</div>`);
}

document.addEventListener("click",e=>{
 const b=e.target.closest("[data-sys-target]");
 if(!b)return;
 e.preventDefault();e.stopPropagation();
 roleTargetOpen(b.dataset.sysTarget)
});

const ROLE_SIDEBAR_STATE_KEY="tina.v14.sidebar.groups";
function readRoleSidebarState(){
 try{const all=JSON.parse(localStorage.getItem(ROLE_SIDEBAR_STATE_KEY)||"{}");return all[role()]||{}}catch{return{}}
}
function saveRoleSidebarState(state){
 let all={};try{all=JSON.parse(localStorage.getItem(ROLE_SIDEBAR_STATE_KEY)||"{}")}catch{}
 all[role()]=state;localStorage.setItem(ROLE_SIDEBAR_STATE_KEY,JSON.stringify(all))
}
function installRoleSidebar(){
 if(!session()&&!isAdmin())return;
 let side=$("#roleSidebar");
 if(!side){side=document.createElement("aside");side.id="roleSidebar";side.className="roleSidebar";document.body.appendChild(side)}
 const groups=roleSidebarGroups(),saved=readRoleSidebarState();
 side.innerHTML=`<div class="roleSidebarTop"><div><small>Current role</small><b>${esc(role()==="learner"?"Student":role()==="superadmin"?"Superadmin":role().charAt(0).toUpperCase()+role().slice(1))}</b></div><button id="roleSidebarToggle" title="Collapse navigation">☰</button></div>
 <div class="roleSidebarGroups">${groups.map(([heading,items],gi)=>{const key=heading.toLowerCase().replace(/[^a-z0-9]+/g,"-"),open=Object.prototype.hasOwnProperty.call(saved,key)?!!saved[key]:(role()==="superadmin"?true:gi===0);return `<section class="roleSideGroup ${open?"open":""}" data-side-group="${key}"><button class="roleSideHeading" type="button"><span>${esc(heading)}</span><span>⌄</span></button><div class="roleSideItems">${items.map(([label,target])=>`<button class="roleSideItem" data-side-target="${esc(target)}">${uiIcon(routeIcon(target),16)}<span>${esc(label)}</span>${sidebarBadgeMarkup(target)}</button>`).join("")}</div></section>`}).join("")}</div>`;
 $("#roleSidebarToggle").onclick=()=>document.documentElement.classList.toggle("role-sidebar-collapsed");
 $$(".roleSideHeading").forEach(b=>b.onclick=()=>{const g=b.closest(".roleSideGroup");g.classList.toggle("open");const state=readRoleSidebarState();state[g.dataset.sideGroup]=g.classList.contains("open");saveRoleSidebarState(state)});
 $$("[data-side-target]").forEach(b=>b.onclick=()=>{roleTargetOpen(b.dataset.sideTarget); /* intentionally keep group open */});
 side.tabIndex=-1;side.onwheel=null;const scrollArea=side.querySelector(".roleSidebarGroups");if(scrollArea){scrollArea.tabIndex=0;scrollArea.style.overflowY="auto"};requestAnimationFrame(syncFixedChromeGeometry);
 document.documentElement.classList.add("role-sidebar-active");refreshSidebarBadges();
}


/* ---------- EXPLICIT SUPERADMIN ENTRY LINK ---------- */
function installSuperadminEntryLink(){
 let b=$("#superadminEntryLink");
 if(!b){
   b=document.createElement("button");
   b.id="superadminEntryLink";
   b.className="superadminEntryLink";
   b.type="button";
   b.innerHTML='<span>👑</span><b>Superadmin</b>';
   document.body.appendChild(b);
 }
 b.onclick=superadminLoginPortal;
 const guest=!session()&&!isAdmin();
 b.style.display=guest?"inline-flex":"none";
}

/* ---------- DEDICATED SUPERADMIN LOGIN PORTAL ---------- */
function superadminLoginPortal(){
 sessionStorage.removeItem("tina.v14.login.intent");
 document.documentElement.classList.add("authSurfaceActive");
 $("#app").innerHTML=`<div class="wrap superadminPortalWrap"><section class="card superadminPortalCard"><div class="superadminCrown">👑</div><div class="eyebrow">TINA · SUPERADMIN PORTAL</div><h1>System Owner Access..</h1><p class="muted">Highest-authority access to Tina Learning Platform, Tina Academy, system governance, interfaces and audit history.</p>
 <div class="wsFormGrid superadminLoginForm">
 <label class="wsField wsFieldFull"><span>Superadmin Username</span><div class="credentialField"><input id="saLoginUser" autocomplete="username" value="superadmin"><button type="button" data-credential-toggle="saLoginUser" data-kind="username">Hide</button></div></label>
 <label class="wsField wsFieldFull"><span>Password</span><div class="credentialField"><input id="saLoginPass" type="password" autocomplete="current-password"><button type="button" data-credential-toggle="saLoginPass" data-kind="password">Show</button></div></label>
 </div>
 <div class="socialLoginDivider"><span>or continue with</span></div>
 <div class="socialLoginGrid"><button type="button" class="socialLoginBtn" data-social-provider="google"><b>G</b><span>Google</span></button><button type="button" class="socialLoginBtn" data-social-provider="microsoft"><b>⊞</b><span>Microsoft</span></button></div>
 <div id="saLoginFeedback"></div><div class="actions superadminPortalActions"><button class="primary" id="saLoginSubmit">Enter Superadmin Console</button><button class="ghost" id="saLoginBack">← Back to role selection</button></div></section></div>`;
 $("#saLoginBack").onclick=openRoleEntry;
 $$("[data-credential-toggle]").forEach(b=>b.onclick=()=>{const i=$("#"+b.dataset.credentialToggle),hide=i.type!=="password";i.type=hide?"password":"text";b.textContent=hide?"Show":"Hide"});
 $$("[data-social-provider]").forEach(b=>b.onclick=()=>{const p=b.dataset.socialProvider;if(window.TinaBackend?.oauthStart)return window.TinaBackend.oauthStart(p,"superadmin");$("#saLoginFeedback").innerHTML='<div class="feedback bad">Backend OAuth is not configured yet. Start the Tina backend and configure the provider credentials.</div>'});
 [$("#saLoginUser"),$("#saLoginPass")].filter(Boolean).forEach(i=>i.addEventListener("keydown",e=>{if(e.key!=="Enter"||e.isComposing)return;e.preventDefault();$("#saLoginSubmit")?.click()}));
 $("#saLoginSubmit").onclick=async()=>{
   const btn=$("#saLoginSubmit"),feedback=$("#saLoginFeedback");
   try{
     btn.disabled=true;
     btn.textContent="Signing in...";
     const user=$("#saLoginUser").value.trim().toLowerCase(),pass=$("#saLoginPass").value;
     if(!user||!pass){feedback.innerHTML='<div class="feedback bad">Enter the Superadmin username and password.</div>';return}
     if(window.TinaBackend?.available){
       try{
         const remote=await window.TinaBackend.login(user,pass,"superadmin",true),u=remote.user;
         sessionStorage.setItem(USER_SESSION_KEY,JSON.stringify({id:u.id,name:u.name,email:u.email||u.username,roles:u.roles||["superadmin"],activeRole:"superadmin",role:"superadmin",loginAt:now()}));
         localStorage.setItem("tina.v14.active.user",u.id);sessionStorage.setItem("tina.v14.superadmin.session","1");sessionStorage.setItem(ADMIN_SESSION,"1");sessionStorage.removeItem("tina.v14.login.intent");
         auditEvent("auth.superadmin.login",{backend:true});feedback.innerHTML='<div class="feedback ok">Superadmin login successful.</div>';setTimeout(()=>{document.documentElement.classList.remove("authSurfaceActive");installRoleGroupedNav();installRoleSidebar();roleLandingView();window.TinaBackend?.syncNow?.("superadmin-login").catch(()=>{})},180);return
       }catch(e){if(window.TinaBackend.required){feedback.innerHTML=`<div class="feedback bad">${esc(e.message)}</div>`;return}}
     }
     const s=userStore(),u=s.users.find(x=>(x.email||"").toLowerCase()===user&&(x.roles||[x.role]).includes("superadmin")&&accountCanAuthenticate(x));
     if(!u){feedback.innerHTML='<div class="feedback bad">Superadmin account not found or disabled.</div>';return}
     const hash=await roleHashPassword(pass);
     if(hash!==u.passwordHash){feedback.innerHTML='<div class="feedback bad">Incorrect Superadmin password.</div>';auditEvent("auth.superadmin.failed",{username:user});return}

     // IMPORTANT: workspace-completion-v14.js is an isolated IIFE.
     // Do not call setUserSession()/setActiveUser() from admin-final-v14.js;
     // write the shared storage contract directly here.
     sessionStorage.setItem(USER_SESSION_KEY,JSON.stringify({
       id:u.id,name:u.name,email:u.email,roles:u.roles||["superadmin"],activeRole:"superadmin",role:"superadmin",loginAt:new Date().toISOString()
     }));
     localStorage.setItem("tina.v14.active.user",u.id);
     sessionStorage.setItem("tina.v14.superadmin.session","1");
     sessionStorage.setItem(ADMIN_SESSION,"1");
     sessionStorage.removeItem("tina.v14.login.intent");

     u.lastLoginAt=now();u.updatedAt=now();saveUsers(s);
     auditEvent("auth.superadmin.login",{userId:u.id});
     document.documentElement.dataset.auth="user";
     document.documentElement.dataset.role="superadmin";
     document.documentElement.classList.remove("authSurfaceActive");
     document.body.classList.add("superadminInterface");
     document.body.classList.remove("userInterface","adminInterface");
     feedback.innerHTML='<div class="feedback ok">Superadmin authenticated. Opening System Governance Center...</div>';

     installSuperadminEntryLink();
     enforceRoleView();
     installRoleGroupedNav();
     installRoleSidebar();
     enforceSuperadminAcademyBoundary();
     $("#app").innerHTML="";
     superadminDashboard();
     requestAnimationFrame(()=>{
       document.documentElement.classList.remove("authSurfaceActive");
       document.querySelector(".topbar")?.removeAttribute("aria-hidden");
       document.querySelector(".tinaFooter")?.removeAttribute("aria-hidden");
       window.TinaAuthChrome?.refresh?.();
       installRoleGroupedNav();
       installRoleSidebar();
       enforceSuperadminAcademyBoundary();
       ensureSuperadminHomeAccessButtons();
  applyManagementPageChrome();
     });
   }catch(err){
     console.error("SUPERADMIN_LOGIN_ERROR",err);
     feedback.innerHTML=`<div class="feedback bad">Superadmin login failed: ${esc(err?.message||String(err))}</div>`;
   }finally{
     btn.disabled=false;
     btn.textContent="Enter Superadmin Console";
   }
 }
}

/* ---------- SUPERADMIN INTERFACE STUDIO ---------- */
const INTERFACE_ROLES=["student","teacher","business","administrator","superadmin"];
function interfaceStudioView(){
 if(!isSuperadmin())return show('<div class="feedback bad">Superadmin access is required.</div>');
 show(`<div class="sectionHead"><div><div class="eyebrow">SUPERADMIN · INTERFACE STUDIO</div><h2>Role Interface Switcher & Editor</h2><p class="muted">Preview and manage every role-oriented interface without changing the underlying account.</p></div></div>
 <section class="interfaceStudioGrid">
  ${INTERFACE_ROLES.map(r=>`<article class="card"><h3>${esc(r.charAt(0).toUpperCase()+r.slice(1))} Interface</h3><p>Preview navigation, headings and available workspaces for the ${esc(r)} experience.</p><button data-interface-preview="${r}">Preview</button></article>`).join("")}
 </section>
 <section class="card"><h3>Interface Configuration</h3><div class="builderToolbar"><button id="ifEditNav">Edit Navigation Structure</button><button id="ifOpenApp">App Interface Studio</button><button id="ifResetPreview">Exit Preview</button></div><p class="muted">Preview mode changes only the interface presentation for this browser session; your Superadmin account remains active.</p></section>
 <div id="interfacePreviewPanel"></div>`);
 $$("[data-interface-preview]").forEach(b=>b.onclick=()=>renderInterfacePreview(b.dataset.interfacePreview));
 $("#ifOpenApp").onclick=appInterfaceStudioView;
 $("#ifResetPreview").onclick=()=>{sessionStorage.removeItem("tina.v14.interface.preview");installRoleSidebar();$("#interfacePreviewPanel").innerHTML='<div class="feedback ok">Returned to Superadmin interface.</div>'};
 $("#ifEditNav").onclick=()=>navigationEditorView()
}
function previewRoleGroups(r){
 const fake=r==="student"?"learner":r==="administrator"?"admin":r;
 const all={
  learner:[["Learning",["Home","Catalog","Active Learning","Games","Tina Library"]],["Organize",["Study Plans","Research"]],["Progress",["Review","Progress","Profile"]],["Account",["Settings"]]],
  teacher:[["Teaching",["Teacher Workspace","Assignments","Learner Progress"]],["Learning",["Home","Catalog","Active Learning","Games"]],["Resources",["Tina Library","Research","Study Plans"]],["Progress",["Review","Progress","Profile"]]],
  business:[["Business",["Business Dashboard","Programs","Team Access","Reports"]],["Resources",["Tina Library"]],["Account",["Profile","Settings"]]],
  admin:[["Administration",["Admin Dashboard","Editing Studio","Users & Roles","Users & Access"]],["Content",["Academy","Authoring Hub","Content Studio","Data Manager"]],["Learning",["Catalog","Active Learning","Practice","Assessment","Adaptive"]],["Resources",["Tina Library","Research","Study Plans"]]],
  superadmin:[["System Control",["Superadmin Dashboard","System Administration","Activity History","Users & Roles"]],["Content & Academy",["Tina Academy","Authoring Hub","Content Studio","Editing Studio","Data Manager"]],["Interfaces",["Interface Studio","App Interface"]],["Infrastructure",["Canonical Data","Learning Core","Settings"]]]
 };
 return all[fake]||all.learner
}
function renderInterfacePreview(r){
 sessionStorage.setItem("tina.v14.interface.preview",r);
 $("#interfacePreviewPanel").innerHTML=`<section class="card interfacePreviewCard"><div class="eyebrow">PREVIEW · ${esc(r)}</div><h3>${esc(r.charAt(0).toUpperCase()+r.slice(1))} navigation</h3><div class="previewGroups">${previewRoleGroups(r).map(([h,items])=>`<div><b>${esc(h)}</b>${items.map(x=>`<span>${esc(x)}</span>`).join("")}</div>`).join("")}</div></section>`;
}
function navigationEditorView(){
 if(!isSuperadmin())return;
 modal("Navigation Structure",`<p class="muted">Use this governance view to review the heading/subheading structure for every role.</p><div class="navStructureEditor">${INTERFACE_ROLES.map(r=>`<details><summary>${esc(r.charAt(0).toUpperCase()+r.slice(1))}</summary>${previewRoleGroups(r).map(([h,items])=>`<div class="navStructureGroup"><b>${esc(h)}</b><textarea data-nav-structure="${r}:${h}">${esc(items.join("\n"))}</textarea></div>`).join("")}</details>`).join("")}</div>`,`<button class="primary" id="navStructureSave">Save Interface Notes</button>`);
 $("#navStructureSave").onclick=()=>{const w=workspace();w.interfaceNotes={};$$("[data-nav-structure]").forEach(x=>w.interfaceNotes[x.dataset.navStructure]=x.value);saveW(w);auditEvent("interface.navigation.notes.saved",{count:Object.keys(w.interfaceNotes).length});closeModal();alert("Interface structure notes saved.")}
}

/* ---------- APP INTERFACE STUDIO ---------- */
function appInterfaceStudioView(){
 if(!isSuperadmin())return show('<div class="feedback bad">Superadmin access is required.</div>');
 show(`<div class="sectionHead"><div><div class="eyebrow">SUPERADMIN · APP INTERFACE</div><h2>App Interface Studio</h2><p class="muted">Preview responsive layouts and app navigation for desktop, tablet and mobile.</p></div></div>
 <section class="appStudioToolbar card"><div class="builderToolbar"><button data-device="desktop">Desktop</button><button data-device="tablet">Tablet</button><button data-device="mobile">Mobile</button><button id="appStudioRole">Change Role Preview</button></div></section>
 <section class="appPreviewShell"><div id="appDeviceFrame" class="appDeviceFrame desktop"><div class="appPreviewTop"><b>TINA</b><span>App Preview</span></div><div class="appPreviewBody"><aside class="appPreviewSide"><b>Navigation</b><span>Home</span><span>Learn</span><span>Library</span><span>Progress</span></aside><main><div class="appHero"><small>Responsive interface</small><h3>Learning workspace</h3><p>Preview how Tina Learning Platform behaves as an app-like interface on each device size.</p></div><div class="appPreviewCards"><article></article><article></article><article></article></div></main></div><nav class="appPreviewBottom"><span>Home</span><span>Learn</span><span>Library</span><span>Profile</span></nav></div></section>
 <section class="card mobileAppAdmin"><h3>Superadmin Mobile Console</h3><p class="muted">Open real administration tools directly from the phone interface.</p><div class="mobileAdminActions"><button data-app-admin="health">Health</button><button data-app-admin="users">Users</button><button data-app-admin="permissions">Permissions</button><button data-app-admin="alerts">Alerts</button><button data-app-admin="history">History</button><button data-app-admin="academy">Academy</button><button data-app-admin="content">Content</button><button data-app-admin="backup">Backup</button></div></section><section class="card"><h3>App Interface Controls</h3><div class="builderToolbar"><button id="appNavEdit">Edit App Navigation</button><button id="appThemeOpen">Open Theme Settings</button><button id="appPwaNotes">App / PWA Configuration</button></div></section>`);
 $$("[data-device]").forEach(b=>b.onclick=()=>{const f=$("#appDeviceFrame");f.className=`appDeviceFrame ${b.dataset.device}`;auditEvent("interface.app.device-preview",{device:b.dataset.device})});
 $("#appStudioRole").onclick=interfaceStudioView;
 $("#appNavEdit").onclick=navigationEditorView;
 $("#appThemeOpen").onclick=()=>clickDataView("settings");
 $("#appPwaNotes").onclick=()=>modal("App / PWA Configuration",`<div class="wsFormGrid">${textField("pwaName","App name","Tina Learning Platform")}${textField("pwaShort","Short name","TINA")}${textField("pwaStart","Start route","/")}${selectField("pwaDisplay","Display mode",["standalone","fullscreen","minimal-ui","browser"],"standalone")}${areaField("pwaNotes","Deployment notes","Responsive web app interface ready. Add manifest/service worker only when production deployment architecture is finalized.")}</div>`,`<button class="primary" id="pwaSave">Save App Configuration</button>`);
 document.addEventListener("click",e=>{if(e.target.id==="pwaSave"){const w=workspace();w.appConfig={name:$("#pwaName").value,shortName:$("#pwaShort").value,start:$("#pwaStart").value,display:$("#pwaDisplay").value,notes:$("#pwaNotes").value,updatedAt:now()};saveW(w);auditEvent("interface.app.config.saved",w.appConfig);closeModal()}},{once:true})
 $$("[data-app-admin]").forEach(b=>b.onclick=()=>{const x=b.dataset.appAdmin;if(x==="health"||x==="alerts")return systemHealthView();if(x==="users")return roleManagementView();if(x==="permissions")return userPermissionMatrixView();if(x==="history")return activityHistoryView();if(x==="academy")return clickDataView("academy");if(x==="content")return adminEditingStudio();if(x==="backup")return exportSuperadminBackup()});

}


/* ---------- PER-USER PERMISSION MATRIX ---------- */
const USER_PERMISSION_KEYS=[
 ["home","Home"],
 ["catalog","Catalog"],
 ["learn","Active Learning"],
 ["plans","Study Plans"],
 ["research","Research"],
 ["review","Review"],
 ["progress","Progress"],
 ["profile","Profile"],
 ["games","Games"],
 ["library","Tina Library"],
 ["teacher","Teacher Workspace"],
 ["assignments","Assignments"],
 ["gradebook","Learner Progress"],
 ["business","Business Dashboard"],
 ["programs","Business Programs"],
 ["reports","Business Reports"],
 ["academy","Tina Academy"],
 ["authoring","Authoring Hub"],
 ["content","Content Studio"],
 ["data","Data Manager"],
 ["practice-admin","Practice Administration"],
 ["assessment-admin","Assessment Administration"],
 ["adaptive","Adaptive Intelligence"],
 ["canonical","Canonical Data"],
 ["canon-create","Create Canon Drafts"],
 ["learning-core","Learning Core"],
 ["system-settings","System Settings"],
 ["interface-studio","Interface Studio"],
 ["app-interface","App Interface"],
 ["activity-history","Activity History"],
 ["system-admin","System Administration"]
,
 ["user-delete-lower","Delete lower-scope user accounts"],
 ["admin-review","Review and escalate restricted work"],
 ["roles-lower","Assign roles below Administrator"]
];
function defaultPermissionsForRole(r){
 if(r==="superadmin")return USER_PERMISSION_KEYS.map(x=>x[0]);
 if(r==="admin")return ["profile","library","system-settings","activity-history","admin-review","roles-lower"];
 if(r==="teacher")return ["profile","library","teacher","assignments","gradebook"];
 if(r==="business")return ["profile","library","business","programs","reports"];
 if(r==="editor")return ["profile","library","research","authoring","content"];
 if(r==="reviewer")return ["review","progress","profile","library","research"];
 return ["home","catalog","learn","plans","research","review","progress","profile","games","library"];
}
const ADMIN_AUTHORITY_POLICY_KEY="tina.v14.admin.authority.policy";
function migrateAdminAuthorityPolicy(){
 if(localStorage.getItem(ADMIN_AUTHORITY_POLICY_KEY)==="3")return;
 const w=workspace(),store=userStore(),minimal=defaultPermissionsForRole("admin");
 for(const u of store.users.filter(x=>userRoles(x).includes("admin")&&!userRoles(x).includes("superadmin"))){
   const old=w.access[u.id]||{};w.access[u.id]=Object.assign({},old,{enabled:old.enabled!==false,levels:[],permissions:[...minimal],routes:[...minimal],adminAuthorityPolicy:3,updatedAt:now()})
 }
 saveW(w);localStorage.setItem(ADMIN_AUTHORITY_POLICY_KEY,"3")
}
function combinedDefaultPermissions(u){return [...new Set(userRoles(u).flatMap(defaultPermissionsForRole))]}
function normalizedAccessForUser(u){
 const w=workspace(),a=w.access[u.id]||{},defs=combinedDefaultPermissions(u);
 return Object.assign({enabled:true,levels:[...LEVELS],routes:defs,permissions:defs},a,{permissions:Array.isArray(a.permissions)?a.permissions:(Array.isArray(a.routes)?a.routes:defs)});
}
function roleRelevantAccessHtml(u,a){
 const roles=userRoles(u);
 if(roles.includes("superadmin"))return `<div class="roleAccessNotice"><b>Platform-wide access</b><span>Superadmin has all scopes.</span></div>`;
 if(roles.includes("admin"))return `<div class="roleAccessNotice"><b>Delegated administrative access</b><span>Administrator reviews/escalates by default. Editing scopes must be explicitly assigned by Superadmin.</span></div>`;
 if(roles.includes("learner")||roles.includes("teacher"))return `<div class="permissionSection"><h4>English Learning Level Access</h4><div class="permissionCheckGrid">${LEVELS.map(l=>`<label><input type="checkbox" data-perm-level="${u.id}" value="${esc(l)}" ${(a.levels||[]).includes(l)?"checked":""}> ${esc(l)}</label>`).join("")}</div></div>`;
 if(roles.includes("business"))return `<div class="roleAccessNotice"><b>B2B access</b><span>Learning access is controlled through assigned programs, teams and published resources rather than Cambridge English levels.</span></div>`;
 return `<div class="roleAccessNotice"><b>Functional role</b><span>This account is controlled mainly through feature permissions below.</span></div>`;
}
function userPermissionMatrixView(focusId=""){
 if(!isSuperadmin())return show('<div class="feedback bad">Administrative access is required.</div>');
 const users=userStore().users,visible=focusId?users.filter(u=>u.id===focusId):users;
 show(`<div class="sectionHead"><div><div class="eyebrow">${isSuperadmin()?"SUPERADMIN":"ADMIN"} · PERMISSIONS</div><h2>User Permission Matrix</h2><p class="muted">Permissions are calculated from all assigned roles and can then be customized per account.</p></div><button class="ghost" id="permBack">← Users & Roles</button></div>
 <section class="permissionUsers">${visible.map(u=>{const a=normalizedAccessForUser(u),roles=userRoles(u);return `<article class="card permissionUserCard" data-perm-user="${u.id}"><div class="permissionUserHead"><div><h3>${esc(u.name||"Unnamed")}</h3><p>${esc(u.email||"")}</p><div class="roleBadgeRow">${roles.map(r=>`<span class="roleBadge">${esc(r==="learner"?"student":r)}</span>`).join("")}</div></div><label class="permissionEnabled"><input type="checkbox" data-perm-enabled="${u.id}" ${a.enabled!==false?"checked":""}> Account enabled</label></div>
 ${roleRelevantAccessHtml(u,a)}
 <div class="permissionSection"><h4>Feature Access</h4><div class="permissionCheckGrid permissionFeatureGrid">${USER_PERMISSION_KEYS.map(([key,label])=>`<label><input type="checkbox" data-perm-feature="${u.id}" value="${key}" ${(a.permissions||[]).includes(key)?"checked":""} ${roles.includes("superadmin")&&!isSuperadmin()?"disabled":""}> ${esc(label)}</label>`).join("")}</div></div>
 <div class="actions"><button class="primary" data-perm-save="${u.id}">Save Permissions</button><button data-perm-all="${u.id}">Select All</button><button data-perm-none="${u.id}">Clear</button><button data-perm-default="${u.id}">Role Defaults</button></div></article>`}).join("")}</section>`);
 $("#permBack").onclick=roleManagementView;
 $$("[data-perm-all]").forEach(b=>b.onclick=()=>$$(`[data-perm-feature="${b.dataset.permAll}"],[data-perm-level="${b.dataset.permAll}"]`).forEach(x=>{if(!x.disabled)x.checked=true}));
 $$("[data-perm-none]").forEach(b=>b.onclick=()=>$$(`[data-perm-feature="${b.dataset.permNone}"],[data-perm-level="${b.dataset.permNone}"]`).forEach(x=>{if(!x.disabled)x.checked=false}));
 $$("[data-perm-default]").forEach(b=>b.onclick=()=>{const s=userStore(),u=s.users.find(x=>x.id===b.dataset.permDefault),defs=combinedDefaultPermissions(u);$$(`[data-perm-feature="${b.dataset.permDefault}"]`).forEach(x=>{if(!x.disabled)x.checked=defs.includes(x.value)});if(userRoles(u).some(r=>["learner","teacher","admin","superadmin"].includes(r)))$$(`[data-perm-level="${b.dataset.permDefault}"]`).forEach(x=>x.checked=true)});
 $$("[data-perm-save]").forEach(b=>b.onclick=()=>{const id=b.dataset.permSave,s=userStore(),u=s.users.find(x=>x.id===id);if(!u)return;if(userRoles(u).includes("superadmin")&&!isSuperadmin())return alert("Only Superadmin can change Superadmin permissions.");const w=workspace(),old=normalizedAccessForUser(u),levelBoxes=$$(`[data-perm-level="${id}"]`);w.access[id]=Object.assign({},old,{enabled:$(`[data-perm-enabled="${id}"]`)?.checked!==false,levels:levelBoxes.length?levelBoxes.filter(x=>x.checked).map(x=>x.value):old.levels,permissions:$$(`[data-perm-feature="${id}"]:checked`).map(x=>x.value),routes:$$(`[data-perm-feature="${id}"]:checked`).map(x=>x.value),updatedAt:now()});saveW(w);auditEvent("permissions.updated",{targetUserId:id,roles:userRoles(u),permissionCount:w.access[id].permissions.length});alert("Permissions saved.")})
}
function hasPermission(key){
 if(isSuperadmin())return true;
 const s=session();if(!s)return false;
 const u=userStore().users.find(x=>x.id===s.id)||{id:s.id,role:s.role};
 const a=normalizedAccessForUser(u);
 return a.enabled!==false&&(a.permissions||[]).includes(key);
}



const CANON_CREATE_PERMISSION="canon-create";
function canAccessCanon(){
 if(isSuperadmin())return true;
 const s=session();if(!s)return false;
 const u=userStore().users.find(x=>x.id===s.id);if(!u)return false;
 return (normalizedAccessForUser(u).permissions||[]).includes(CANON_CREATE_PERMISSION)
}
function canonicalCreationStudio(){
 if(!canAccessCanon())return show('<div class="feedback bad">Canonical creation requires explicit Superadmin permission.</div>');
 const w=workspace();w.canonDrafts=Array.isArray(w.canonDrafts)?w.canonDrafts:[];
 show(`<div class="sectionHead"><div><div class="eyebrow">CANON GOVERNANCE</div><h2>Canonical Creation Studio</h2><p class="muted">Create governed canonical drafts. Browser publication remains locked.</p></div><button class="primary" id="canonNewDraft">+ Canon Draft</button></div><section class="card"><div class="list">${w.canonDrafts.length?w.canonDrafts.map(d=>`<div class="row"><div><b>${esc(d.title)}</b><small>${esc(d.entityType)} · ${esc(d.status)}</small></div><button data-canon-edit="${d.id}">Edit</button></div>`).join(""):'<div class="empty">No canonical drafts yet.</div>'}</div></section>`);
 $("#canonNewDraft").onclick=()=>canonDraftEditor();$$("[data-canon-edit]").forEach(b=>b.onclick=()=>canonDraftEditor(b.dataset.canonEdit))
}
function canonDraftEditor(id=null){
 if(!canAccessCanon())return;const w=workspace();w.canonDrafts=Array.isArray(w.canonDrafts)?w.canonDrafts:[];const d=id?w.canonDrafts.find(x=>x.id===id):{};
 modal(id?"Edit Canon Draft":"Create Canon Draft",`<div class="wsFormGrid">${textField("canonDraftTitle","Title",d.title||"")}${selectField("canonDraftType","Entity type",["domain","level","course","unit","lesson","item","practice-set","activity","taxonomy"],d.entityType||"course")}${areaField("canonDraftNotes","Canonical notes / specification",d.notes||"")}</div>`,`<button class="primary" id="canonDraftSave">Save Governed Draft</button>`);
 $("#canonDraftSave").onclick=()=>{const title=$("#canonDraftTitle").value.trim();if(!title)return alert("Title is required.");const rec=id?d:{id:uid("canon-draft"),createdAt:now(),createdBy:currentUserId()};rec.title=title;rec.entityType=$("#canonDraftType").value;rec.notes=$("#canonDraftNotes").value;rec.status="draft";rec.updatedAt=now();if(!id)w.canonDrafts.push(rec);saveW(w);auditEvent("canon.draft.saved",{canonDraftId:rec.id});closeModal();canonicalCreationStudio()}
}

/* ---------- LEADERBOARD + ACHIEVEMENTS ---------- */
const ACHIEVEMENT_DEFS=[
 ["first-login","First Step","Sign in and begin using Tina.","🌱"],
 ["explorer","Explorer","Visit at least 10 platform pages.","🧭"],
 ["practice-10","Practice Starter","Record at least 10 learning/practice events.","🎯"],
 ["game-5","Game Explorer","Play at least 5 game rounds.","🎮"],
 ["planner","Planner","Create your first study plan.","🗓️"],
 ["researcher","Researcher","Create your first research project.","🔎"],
 ["library-user","Library Explorer","Open and use Tina Library.","📚"],
 ["mistake-master","Mistake Master","Review at least 10 learning mistakes.","🧩"],
 ["century","Century Club","Reach 100 engagement XP.","💯"],
 ["champion","Top Competitor","Reach 500 engagement XP.","🏆"]
];
function userActivityFor(uid){return typeof systemHistory==="function"?systemHistory().filter(x=>x.userId===uid):[]}
function userGameScore(uid){
 const w=workspace(),s=session();
 if(uid===currentUserId())return Object.values(w.gameStats||{}).reduce((a,x)=>a+(x.correct||0)*10+(x.played||0)*2,0);
 return 0
}
function engagementScore(u){
 const ev=userActivityFor(u.id),w=workspace(),p=w.profiles?.[u.id]||{};
 const views=ev.filter(x=>x.type==="page.view").length;
 const clicks=ev.filter(x=>x.type==="ui.click").length;
 const mistakes=ev.filter(x=>x.type==="learning.mistake").length;
 const plans=(w.plans||[]).filter(x=>x.ownerId===u.id).length;
 const research=(w.researchProjects||[]).filter(x=>x.ownerId===u.id).length;
 return Math.max(0,(p.xp||0)+views+Math.floor(clicks/4)+plans*20+research*25+userGameScore(u.id)+mistakes*2)
}
function earnedAchievements(u){
 const ev=userActivityFor(u.id),w=workspace(),score=engagementScore(u),games=Object.values(w.gameStats||{}).reduce((a,x)=>a+(x.played||0),0),mistakes=ev.filter(x=>x.type==="learning.mistake").length;
 const yes={
  "first-login":ev.length>0||u.id===currentUserId(),
  "explorer":ev.filter(x=>x.type==="page.view").length>=10,
  "practice-10":ev.filter(x=>x.type.startsWith("learning.")||x.type==="page.view").length>=10,
  "game-5":u.id===currentUserId()&&games>=5,
  "planner":(w.plans||[]).some(x=>x.ownerId===u.id),
  "researcher":(w.researchProjects||[]).some(x=>x.ownerId===u.id),
  "library-user":ev.some(x=>JSON.stringify(x).toLowerCase().includes("library")),
  "mistake-master":mistakes>=10,
  "century":score>=100,
  "champion":score>=500
 };
 return ACHIEVEMENT_DEFS.filter(x=>yes[x[0]])
}
function leaderboardView(){
 const users=userStore().users.filter(u=>u.status!=="suspended"&&!["admin","superadmin","editor","reviewer"].includes(u.role));
 const ranked=users.map(u=>({...u,score:engagementScore(u),achievements:earnedAchievements(u).length})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
 show(`<div class="sectionHead"><div><div class="eyebrow">COMMUNITY</div><h2>Leaderboard</h2><p class="muted">Friendly competition based on learning engagement, games, plans, research and achievements.</p></div><button class="ghost" id="leaderAchievements">My Achievements</button></div>
 <section class="leaderPodium">${ranked.slice(0,3).map((u,i)=>`<article class="leaderTop rank${i+1}"><span class="leaderMedal">${["🥇","🥈","🥉"][i]}</span><b>${esc(u.name||u.email)}</b><strong>${u.score} XP</strong><small>${u.achievements} achievements</small></article>`).join("")}</section>
 <section class="card"><div class="tableWrap"><table><thead><tr><th>Rank</th><th>User</th><th>Role</th><th>XP</th><th>Achievements</th></tr></thead><tbody>${ranked.map((u,i)=>`<tr class="${u.id===currentUserId()?"currentRank":""}"><td><b>#${i+1}</b></td><td>${esc(u.name||u.email)}</td><td>${esc(u.role==="learner"?"student":u.role)}</td><td><b>${u.score}</b></td><td>${u.achievements}</td></tr>`).join("")}</tbody></table></div></section>`);
 $("#leaderAchievements").onclick=achievementsView;
 auditEvent?.("community.leaderboard.view",{ranked:ranked.length})
}
const ACHIEVEMENT_CATALOG=[
 ["first-login","First Step","Sign in and begin your Tina journey.","activity",1,"login",1,"Getting Started"],
 ["first-lesson","First Lesson","Complete your first lesson.","lessons",1,"",1,"Getting Started"],
 ["first-course","First Course","Complete your first course.","courses",1,"",1,"Getting Started"],
 ["first-practice","Practice Starter","Complete your first practice activity.","activity",1,"practice",1,"Getting Started"],
 ["first-review","Reflective Learner","Open mistake review.","activity",1,"review",1,"Getting Started"],
 ["first-game","Game On","Play your first learning game.","activity",1,"game",1,"Getting Started"],
 ["first-research","Research Spark","Use Research for the first time.","activity",1,"research",1,"Getting Started"],
 ["first-plan","Plan in Motion","Use a study plan.","activity",1,"plan",1,"Getting Started"],
 ["first-feedback","Voice Matters","Send feedback or a bug report.","activity",1,"feedback",1,"Getting Started"],
 ["first-community","Community Explorer","Open a community learning surface.","activity",1,"community",1,"Getting Started"],
 ["lesson-5","Five Lessons","Complete 5 lessons.","lessons",5,"",2,"Learning"],
 ["lesson-10","Ten Lessons","Complete 10 lessons.","lessons",10,"",2,"Learning"],
 ["lesson-20","Twenty Lessons","Complete 20 lessons.","lessons",20,"",2,"Learning"],
 ["lesson-30","Thirty Lessons","Complete 30 lessons.","lessons",30,"",2,"Learning"],
 ["lesson-50","Fifty Lessons","Complete 50 lessons.","lessons",50,"",2,"Learning"],
 ["lesson-75","75 Lessons","Complete 75 lessons.","lessons",75,"",2,"Learning"],
 ["lesson-100","Hundred-Lesson Scholar","Complete 100 lessons.","lessons",100,"",2,"Learning"],
 ["lesson-150","150 Lessons","Complete 150 lessons.","lessons",150,"",2,"Learning"],
 ["lesson-200","Two Hundred Lessons","Complete 200 lessons.","lessons",200,"",2,"Learning"],
 ["lesson-250","Learning Builder","Complete 250 lessons.","lessons",250,"",2,"Learning"],
 ["lesson-365","365 Lessons","Complete 365 lessons.","lessons",365,"",2,"Learning"],
 ["lesson-500","Five Hundred Lessons","Complete 500 lessons.","lessons",500,"",2,"Learning"],
 ["lesson-750","750 Lessons","Complete 750 lessons.","lessons",750,"",2,"Learning"],
 ["lesson-1000","Thousand-Lesson Legacy","Complete 1,000 lessons.","lessons",1000,"",2,"Learning"],
 ["lesson-2000","Two Thousand Lessons","Complete 2,000 lessons.","lessons",2000,"",2,"Learning"],
 ["course-2","Two Courses","Complete 2 courses.","courses",2,"",2,"Learning"],
 ["course-3","Course Explorer","Complete 3 courses.","courses",3,"",2,"Learning"],
 ["course-5","Five Courses","Complete 5 courses.","courses",5,"",2,"Learning"],
 ["course-10","Ten Courses","Complete 10 courses.","courses",10,"",2,"Learning"],
 ["course-15","Fifteen Courses","Complete 15 courses.","courses",15,"",2,"Learning"],
 ["course-20","Twenty Courses","Complete 20 courses.","courses",20,"",2,"Learning"],
 ["course-25","Cross-Domain Learner","Complete 25 courses.","courses",25,"",2,"Learning"],
 ["course-30","Thirty Courses","Complete 30 courses.","courses",30,"",2,"Learning"],
 ["course-40","Forty Courses","Complete 40 courses.","courses",40,"",2,"Learning"],
 ["course-50","Fifty-Course Scholar","Complete 50 courses.","courses",50,"",2,"Learning"],
 ["streak-2","Two-Day Return","Study for 2 consecutive days.","consecutiveDays",2,"",3,"Consistency"],
 ["streak-3","Three-Day Spark","Study for 3 consecutive days.","consecutiveDays",3,"",3,"Consistency"],
 ["streak-5","Five-Day Rhythm","Study for 5 consecutive days.","consecutiveDays",5,"",3,"Consistency"],
 ["streak-7","Seven-Day Streak","Study for 7 consecutive days.","consecutiveDays",7,"",3,"Consistency"],
 ["streak-14","Two-Week Streak","Study for 14 consecutive days.","consecutiveDays",14,"",3,"Consistency"],
 ["streak-21","Three-Week Habit","Study for 21 consecutive days.","consecutiveDays",21,"",3,"Consistency"],
 ["streak-30","Thirty-Day Streak","Study for 30 consecutive days.","consecutiveDays",30,"",3,"Consistency"],
 ["streak-60","Sixty-Day Discipline","Study for 60 consecutive days.","consecutiveDays",60,"",3,"Consistency"],
 ["streak-90","Quarter-Year Streak","Study for 90 consecutive days.","consecutiveDays",90,"",3,"Consistency"],
 ["streak-100","Hundred-Day Streak","Study for 100 consecutive days.","consecutiveDays",100,"",3,"Consistency"],
 ["streak-180","Half-Year Streak","Study for 180 consecutive days.","consecutiveDays",180,"",3,"Consistency"],
 ["streak-365","One-Year Streak","Study for 365 consecutive days.","consecutiveDays",365,"",3,"Consistency"],
 ["streak-730","Two-Year Streak","Study for 730 consecutive days.","consecutiveDays",730,"",3,"Consistency"],
 ["streak-1000","Thousand-Day Streak","Study for 1,000 consecutive days.","consecutiveDays",1000,"",3,"Consistency"],
 ["streak-1825","Five-Year Streak","Study for 1,825 consecutive days.","consecutiveDays",1825,"",3,"Consistency"],
 ["active-days-10","10 Active Days","Be active on 10 distinct days.","days",10,"",3,"Consistency"],
 ["active-days-30","30 Active Days","Be active on 30 distinct days.","days",30,"",3,"Consistency"],
 ["active-days-100","100 Active Days","Be active on 100 distinct days.","days",100,"",3,"Consistency"],
 ["active-days-250","250 Active Days","Be active on 250 distinct days.","days",250,"",3,"Consistency"],
 ["active-days-500","500 Active Days","Be active on 500 distinct days.","days",500,"",3,"Consistency"],
 ["active-days-1000","1,000 Active Days","Be active on 1,000 distinct days.","days",1000,"",3,"Consistency"],
 ["active-days-2000","2,000 Active Days","Be active on 2,000 distinct days.","days",2000,"",3,"Consistency"],
 ["active-days-5000","5,000 Active Days","Be active on 5,000 distinct days.","days",5000,"",3,"Consistency"],
 ["mastered-10","Ten Cards Mastered","Reach 80% mastery on 10 flashcards.","masteredCards",10,"",4,"Mastery"],
 ["mastered-25","25 Cards Mastered","Reach 80% mastery on 25 flashcards.","masteredCards",25,"",4,"Mastery"],
 ["mastered-50","Card Master","Reach 80% mastery on 50 flashcards.","masteredCards",50,"",4,"Mastery"],
 ["mastered-100","Hundred Cards Mastered","Reach 80% mastery on 100 flashcards.","masteredCards",100,"",4,"Mastery"],
 ["mastered-250","Memory Architect","Reach 80% mastery on 250 flashcards.","masteredCards",250,"",4,"Mastery"],
 ["mastered-500","500 Cards Mastered","Reach 80% mastery on 500 flashcards.","masteredCards",500,"",4,"Mastery"],
 ["mastered-750","750 Cards Mastered","Reach 80% mastery on 750 flashcards.","masteredCards",750,"",4,"Mastery"],
 ["mastered-1000","Thousand Cards Mastered","Reach 80% mastery on 1,000 flashcards.","masteredCards",1000,"",4,"Mastery"],
 ["mastered-1500","1,500 Cards Mastered","Reach 80% mastery on 1,500 flashcards.","masteredCards",1500,"",4,"Mastery"],
 ["mastered-2000","2,000 Cards Mastered","Reach 80% mastery on 2,000 flashcards.","masteredCards",2000,"",4,"Mastery"],
 ["mastered-3000","3,000 Cards Mastered","Reach 80% mastery on 3,000 flashcards.","masteredCards",3000,"",4,"Mastery"],
 ["mastered-5000","5,000 Cards Mastered","Reach 80% mastery on 5,000 flashcards.","masteredCards",5000,"",4,"Mastery"],
 ["rapid-7-10","Fast Start","Gain 10 mastery points within 7 days.","rapidProgress",10,"7",4,"Mastery"],
 ["rapid-14-15","Two-Week Acceleration","Gain 15 mastery points within 14 days.","rapidProgress",15,"14",4,"Mastery"],
 ["rapid-30-25","Rapid Growth","Gain 25 mastery points within 30 days.","rapidProgress",25,"30",4,"Mastery"],
 ["rapid-30-50","Breakthrough Month","Gain 50 mastery points within 30 days.","rapidProgress",50,"30",4,"Mastery"],
 ["rapid-90-100","Quarterly Breakthrough","Gain 100 mastery points within 90 days.","rapidProgress",100,"90",4,"Mastery"],
 ["hours-1","Focused Hour","Accumulate 1 active learning hours.","hours",1,"",5,"Time"],
 ["hours-5","Five Focused Hours","Accumulate 5 active learning hours.","hours",5,"",5,"Time"],
 ["hours-10","Ten-Hour Builder","Accumulate 10 active learning hours.","hours",10,"",5,"Time"],
 ["hours-25","Twenty-Five Hours","Accumulate 25 active learning hours.","hours",25,"",5,"Time"],
 ["hours-50","Deep Practice","Accumulate 50 active learning hours.","hours",50,"",5,"Time"],
 ["hours-100","Century of Focus","Accumulate 100 active learning hours.","hours",100,"",5,"Time"],
 ["hours-200","Two Hundred Hours","Accumulate 200 active learning hours.","hours",200,"",5,"Time"],
 ["hours-365","365 Hours","Accumulate 365 active learning hours.","hours",365,"",5,"Time"],
 ["hours-500","Long-Haul Learner","Accumulate 500 active learning hours.","hours",500,"",5,"Time"],
 ["hours-750","750 Hours","Accumulate 750 active learning hours.","hours",750,"",5,"Time"],
 ["hours-1000","Thousand-Hour Scholar","Accumulate 1,000 active learning hours.","hours",1000,"",5,"Time"],
 ["hours-1500","1,500 Hours","Accumulate 1,500 active learning hours.","hours",1500,"",5,"Time"],
 ["hours-2500","2,500 Hours","Accumulate 2,500 active learning hours.","hours",2500,"",5,"Time"],
 ["hours-5000","Lifetime Practice","Accumulate 5,000 active learning hours.","hours",5000,"",5,"Time"],
 ["hours-10000","Ten-Thousand-Hour Legacy","Accumulate 10,000 active learning hours.","hours",10000,"",5,"Time"],
 ["events-100","Active Explorer","Record 100 meaningful activities.","events",100,"",6,"Legacy"],
 ["events-1000","Power User","Record 1,000 meaningful activities.","events",1000,"",6,"Legacy"],
 ["events-10000","System Veteran","Record 10,000 meaningful activities.","events",10000,"",6,"Legacy"],
 ["tenure-30d","One Month Member","Remain a member for 30 days.","tenureDays",30,"",6,"Legacy"],
 ["tenure-90d","Seasoned Member","Remain a member for 90 days.","tenureDays",90,"",6,"Legacy"],
 ["tenure-1y","Year One","Remain a member for 1 year.","tenureYears",1,"",6,"Legacy"],
 ["tenure-5y","Five-Year Legacy","Remain a member for 5 years.","tenureYears",5,"",6,"Legacy"],
 ["tenure-10y","Decade Learner","Remain a member for 10 years.","tenureYears",10,"",6,"Legacy"],
 ["tenure-25y","Silver Learning Jubilee","Remain a member for 25 years.","tenureYears",25,"",6,"Legacy"],
 ["tenure-50y","Half-Century of Learning","Remain a member for 50 years.","tenureYears",50,"",6,"Legacy"]
];
function achievementProgress(def){
 const [id,, ,kind,target,activityType]=def,s=session(),uid=s?.id;if(!uid)return{value:0,target,earned:false};
 const events=systemHistory().filter(x=>x.userId===uid),usage=usageRecords().filter(x=>x.userId===uid);let value=0;
 if(kind==="events")value=events.length;
 else if(kind==="activity")value=events.filter(x=>String(x.type).includes(activityType||"")).length;
 else if(kind==="hours")value=usage.reduce((a,x)=>a+(x.activeMs||0),0)/3600000;
 else if(kind==="days")value=new Set([...events.map(x=>x.at),...usage.map(x=>x.startedAt)].map(x=>new Date(x).toISOString().slice(0,10))).size;
 else if(kind==="lessons"){let baseState={progress:{sessions:[]}};try{baseState=JSON.parse(localStorage.getItem("tina.clean.v3")||localStorage.getItem("tina.clean.state")||"{}")}catch{}value=Math.max(events.filter(x=>["learning.lesson.completed","learning.session.completed"].includes(x.type)).length,readCompletedSessionCount())}
 else if(kind==="courses")value=new Set(events.filter(x=>x.type==="learning.course.completed").map(x=>x.detail?.courseId||x.detail?.title||x.id)).size;
 else if(kind==="consecutiveDays")value=longestLearningStreak(uid);
 else if(kind==="rapidProgress"){const days=Number(activityType||30),cut=Date.now()-days*86400000;value=events.filter(x=>x.type==="learning.mastery.gain"&&new Date(x.at).getTime()>=cut).reduce((n,x)=>n+Number(x.detail?.gain||0),0)}
 else if(kind==="masteredCards"){try{const p=JSON.parse(localStorage.getItem(V10_FLASH_KEY)||"{}");value=(p.decks||[]).flatMap(d=>d.cards||[]).filter(c=>Number(c.mastery||0)>=80).length}catch{}}
 else{const u=userStore().users.find(x=>x.id===uid),created=u?.createdAt?new Date(u.createdAt):new Date();const days=Math.max(0,(Date.now()-created.getTime())/86400000);value=kind==="tenureYears"?days/365.2425:days}
 return{value,target,earned:value>=target}
}
function readCompletedSessionCount(){try{const b=JSON.parse(localStorage.getItem("tina.clean.v3")||"{}");return b?.progress?.sessions?.length||0}catch{}try{const b=JSON.parse(localStorage.getItem("tina.clean.v2")||"{}");return b?.progress?.sessions?.length||0}catch{}return systemHistory().filter(x=>x.type==="learning.session.completed").length}
function longestLearningStreak(uid=currentUserId()){
 const days=[...new Set([...systemHistory().filter(x=>x.userId===uid).map(x=>x.at),...usageRecords().filter(x=>x.userId===uid).map(x=>x.startedAt)].filter(Boolean).map(x=>new Date(x).toISOString().slice(0,10)))].sort();let best=0,run=0,prev=null;for(const d of days){const cur=new Date(d+"T00:00:00Z");if(prev&&Math.round((cur-prev)/86400000)===1)run++;else run=1;best=Math.max(best,run);prev=cur}return best
}
function recordLearningCompletion(kind,id,detail={}){
 const type=kind==="course"?"learning.course.completed":"learning.lesson.completed";auditEvent(type,Object.assign({[kind+"Id"]:id},detail))
}
window.TinaLearningEvidence=Object.freeze({
 completeLesson:(id,detail={})=>recordLearningCompletion("lesson",id,detail),
 completeCourse:(id,detail={})=>recordLearningCompletion("course",id,detail),
 masteryGain:(gain,detail={})=>auditEvent("learning.mastery.gain",Object.assign({gain:Number(gain)||0},detail))
});
function achievementsView(){
 const defs=ACHIEVEMENT_CATALOG.map(d=>[d,achievementProgress(d)]).sort((a,b)=>(a[0][6]||99)-(b[0][6]||99)||a[0][4]-b[0][4]),earned=defs.filter(x=>x[1].earned).length,groups=[...new Set(defs.map(x=>x[0][7]))];
 show(`<div class="sectionHead"><div><div class="eyebrow">100 ACHIEVEMENT MILESTONES</div><h2>Learning Milestones</h2><p class="muted">${earned}/100 earned · ordered from essential behaviors to long-term legacy.</p></div></div><section class="achievementSummary"><article><b>${earned}</b><span>Earned</span></article><article><b>${100-earned}</b><span>Remaining</span></article><article><b>100</b><span>Total</span></article></section><div class="achievementPriorityLegend">${[1,2,3,4,5,6].map(p=>`<span><b>P${p}</b>${["Essential","Learning","Consistency","Mastery","Time","Legacy"][p-1]}</span>`).join("")}</div>${groups.map(g=>`<section class="achievementGroup"><div class="achievementGroupHead"><h3>${esc(g)}</h3><span>${defs.filter(x=>x[0][7]===g&&x[1].earned).length}/${defs.filter(x=>x[0][7]===g).length}</span></div><section class="achievementGrid">${defs.filter(x=>x[0][7]===g).map(([d,p])=>{const [id,name,desc,kind,target,,priority]=d,pct=Math.min(100,Math.round(p.value/Math.max(1,target)*100));return `<article class="card achievementCard ${p.earned?"earned":""}"><div class="achievementMedal">${p.earned?"★":"☆"}</div><div><div class="achievementCardTop"><span class="priorityBadge">P${priority}</span><h3>${esc(name)}</h3></div><p>${esc(desc)}</p><div class="achievementProgress"><span style="width:${pct}%"></span></div><small>${p.earned?"Earned":`${kind==="tenureYears"?p.value.toFixed(1):Math.floor(p.value)} / ${target}`}</small></div></article>`}).join("")}</section></section>`).join("")}`)
}

/* ---------- SUPERADMIN HOME ACCESS CLOSURE ---------- */
function ensureSuperadminHomeAccessButtons(){
 if(!isSuperadmin())return;
 // Superadmin inherits operational edit access, but Tina Academy remains owner-only.
 document.querySelectorAll('[data-admin-only="true"],.adminOnlyAction').forEach(el=>{
   el.style.removeProperty("display");
   el.removeAttribute("aria-hidden");
   el.disabled=false;
 });
 // Guarantee Open buttons on the three owner/management cards even if a legacy
 // admin-visibility pass removed them earlier.
 const cards=[...document.querySelectorAll("#app .card")];
 const defs=[
   ["Tina Academy","academy","Open Tina Academy"],
   ["Authoring Hub","author","Open Authoring Hub"],
   ["Data Manager","data","Open Data Manager"]
 ];
 defs.forEach(([title,route,label])=>{
   const card=cards.find(c=>(c.querySelector("h3,h2")?.textContent||"").trim()===title);
   if(!card)return;
   let b=card.querySelector(`[data-superadmin-open="${route}"],[data-go="${route}"],#sa${route==="academy"?"Academy":route==="author"?"Authoring":route==="data"?"Data":""}`);
   if(!b){
     b=document.createElement("button");
     b.type="button";
     b.className="primary superadminCardOpen";
     b.dataset.superadminOpen=route;
     b.textContent=label;
     card.appendChild(b);
   }else{
     b.style.removeProperty("display");
     b.removeAttribute("aria-hidden");
     b.disabled=false;
     if(!b.dataset.superadminOpen)b.dataset.superadminOpen=route;
   }
 });
 document.querySelectorAll("[data-superadmin-open]").forEach(b=>{
   b.onclick=()=>clickDataView(b.dataset.superadminOpen);
 });
}



const TINA_THEMES=[
 ["tina","Tina Classic","Red, black and white."],
 ["midnight","Midnight","Deep charcoal for low-light work."],
 ["ivory","Ivory","Warm paper-like neutral interface."],
 ["ocean","Ocean","Cool blue productivity theme."],
 ["forest","Forest","Calm green knowledge workspace."],
 ["slate","Slate","Professional graphite and steel."],
 ["rose","Rose","Soft red/pink workspace."],
 ["contrast","High Contrast","Maximum visual separation for accessibility."]
];
function applyTinaTheme(id){
 const valid=TINA_THEMES.some(x=>x[0]===id)?id:"tina";
 document.documentElement.dataset.tinaTheme=valid;
 localStorage.setItem("tina.v14.theme",valid);
 requestAnimationFrame(()=>{
   normalizeRoleChromeGeometry();
   renderManagedFooter();
   syncFixedChromeGeometry();
   refreshSidebarBadges();
   document.dispatchEvent(new CustomEvent("tina:theme-changed",{detail:{theme:valid}}));
 })
}
function themeStudioView(){
 const active=localStorage.getItem("tina.v14.theme")||"tina";
 show(`<div class="sectionHead"><div><div class="eyebrow">APPEARANCE</div><h2>Theme Studio</h2><p class="muted">Choose a visual system without changing learning or account data.</p></div></div>
 <section class="themeChoiceGrid">${TINA_THEMES.map(([id,title,desc])=>`<button class="themeChoice ${id===active?"active":""}" data-theme-choice="${id}"><span class="themePreview ${id}"><i></i><i></i><i></i></span><b>${esc(title)}</b><small>${esc(desc)}</small></button>`).join("")}</section>`);
 $$("[data-theme-choice]").forEach(b=>b.onclick=()=>{applyTinaTheme(b.dataset.themeChoice);themeStudioView()})
}
applyTinaTheme(localStorage.getItem("tina.v14.theme")||"tina");

const FONT_SCALE_KEY="tina.v14.font.scale";
function applyFontScale(v){
 const allowed=["0.9","1","1.1","1.2","1.35","1.5"],x=allowed.includes(String(v))?String(v):"1";
 document.documentElement.style.setProperty("--tina-font-scale",x);document.documentElement.dataset.fontScale=x;localStorage.setItem(FONT_SCALE_KEY,x);
 requestAnimationFrame(()=>{normalizeRoleChromeGeometry();renderManagedFooter();refreshSidebarBadges();document.dispatchEvent(new CustomEvent("tina:font-scale-changed",{detail:{scale:Number(x)}}))})
}
function enhancedSettingsView(){
 const font=localStorage.getItem(FONT_SCALE_KEY)||"1",theme=localStorage.getItem("tina.v14.theme")||"tina";
 show(`<section class="settingsWorkspace"><div class="sectionHead"><div><div class="eyebrow">SETTINGS · ACCESSIBILITY</div><h2>Appearance & Reading</h2><p class="muted">Settings apply to this browser and role interface.</p></div></div><section class="settingsTwoCol"><article class="card"><h3>Text Size</h3><p class="muted">Increase interface text for comfortable reading without browser zoom.</p><div class="fontScaleChoices">${[["0.9","Compact"],["1","Default"],["1.1","Large"],["1.2","Larger"],["1.35","Extra Large"],["1.5","Maximum"]].map(([v,n])=>`<button class="${font===v?"active":""}" data-font-scale="${v}"><span style="font-size:calc(16px * ${v})">Aa</span><b>${n}</b><small>${Math.round(Number(v)*100)}%</small></button>`).join("")}</div><p class="settingsPreview">Preview: Learning should remain comfortable and readable for every student.</p></article><article class="card"><h3>Theme</h3><p class="muted">The same Theme Studio is available to every role and learning level.</p><div class="miniThemeGrid">${TINA_THEMES.map(([id,title])=>`<button class="${theme===id?"active":""}" data-settings-theme="${id}"><span class="themePreview ${id}"><i></i><i></i><i></i></span><b>${esc(title)}</b></button>`).join("")}</div></article></section></section>`);
 $$("[data-font-scale]").forEach(b=>b.onclick=()=>{applyFontScale(b.dataset.fontScale);const v=b.dataset.fontScale;$$("[data-font-scale]").forEach(x=>x.classList.toggle("active",x.dataset.fontScale===v))});$$("[data-settings-theme]").forEach(b=>b.onclick=()=>{applyTinaTheme(b.dataset.settingsTheme);enhancedSettingsView()})
}
applyFontScale(localStorage.getItem(FONT_SCALE_KEY)||"1");

function infrastructureView(){
 if(!isSuperadmin())return show('<div class="feedback bad">Infrastructure is available only to Superadmin.</div>');
 const backend=window.TinaBackend?.status||{available:false};
 show(`<div class="sectionHead"><div><div class="eyebrow">SUPERADMIN · INFRASTRUCTURE</div><h2>Infrastructure Control</h2><p class="muted">Runtime, canonical boundary, backend migration, backup and security status.</p></div></div>
 <section class="systemControlGrid">
  <article class="card"><h3>Backend Status</h3><p>${backend.available?"Backend API is reachable.":"Frontend-only mode. Start the backend to move authentication and sensitive data server-side."}</p><button id="infraBackend">Backend Migration Center</button></article>
  <article class="card"><h3>Canonical Data</h3><p>Inspect the read-only canonical projection and data boundary.</p><button data-infra-route="canonical">Open Canonical Data</button></article>
  <article class="card"><h3>Learning Core</h3><p>Inspect the unified learning runtime and core model.</p><button data-infra-route="core">Open Learning Core</button></article>
  <article class="card"><h3>System Health</h3><p>Health score, operational alerts and reports.</p><button id="infraHealth">Open Health</button></article>
  <article class="card"><h3>Backup</h3><p>Export a complete local system backup before migration or maintenance.</p><button id="infraBackup">Export Backup</button></article>
  <article class="card"><h3>Themes</h3><p>Manage platform appearance and accessibility themes.</p><button id="infraThemes">Theme Studio</button></article>
 </section>`);
 $$("[data-infra-route]").forEach(b=>b.onclick=()=>clickDataView(b.dataset.infraRoute));
 $("#infraBackend").onclick=backendMigrationView;$("#infraHealth").onclick=systemHealthView;$("#infraBackup").onclick=exportSuperadminBackup;$("#infraThemes").onclick=themeStudioView
}
function backendMigrationView(){
 if(!isSuperadmin())return;
 const st=window.TinaBackend?.status||{available:false,url:"same-origin"};
 show(`<div class="sectionHead"><div><div class="eyebrow">SUPERADMIN · BACKEND MIGRATION</div><h2>Backend Security & Migration</h2><p class="muted">Move sensitive account and platform state behind authenticated server APIs.</p></div><button id="backendBack">← Infrastructure</button></div>
 <section class="healthMetrics"><article><b>${st.available?"ONLINE":"OFFLINE"}</b><span>Backend API</span></article><article><b>HttpOnly</b><span>Session cookie target</span></article><article><b>AES-256-GCM</b><span>Encrypted store</span></article><article><b>scrypt</b><span>Password hashing</span></article></section>
 <section class="grid"><article class="card"><h3>Migration Snapshot</h3><p>Send the current Tina local state to the authenticated backend. Existing frontend modules continue to use local caches until each storage module is migrated.</p><button class="primary" id="backendMigrate" ${st.available?"":"disabled"}>Migrate Current Snapshot</button></article>
 <article class="card"><h3>Security Boundary</h3><p>Production deployment requires HTTPS, a private server-side master key, OAuth secrets in environment variables, restricted origins, backups and server patching.</p><p class="muted">No web application can guarantee absolute or unhackable security. This build establishes a stronger server-side security baseline.</p></article></section>
 <div id="backendMigrationFeedback"></div>`);
 $("#backendBack").onclick=infrastructureView;
 $("#backendMigrate").onclick=async()=>{const f=$("#backendMigrationFeedback");try{const snapshot={users:userStore(),workspace:workspace(),base:base(),exportedAt:now()};await window.TinaBackend.migrate(snapshot);f.innerHTML='<div class="feedback ok">Snapshot migrated to the encrypted backend store.</div>';auditEvent("backend.migration.completed",{users:snapshot.users.users.length})}catch(e){f.innerHTML=`<div class="feedback bad">${esc(e.message||String(e))}</div>`}}
}


function simpleBars(values,labels,maxValue=Math.max(1,...values)){
 return `<div class="miniBarChart">${values.map((v,i)=>`<div class="miniBarCol"><div class="miniBarTrack"><i style="height:${Math.max(4,Math.round(Number(v||0)/maxValue*100))}%"></i></div><b>${Number(v||0)}</b><span>${esc(labels[i]||"")}</span></div>`).join("")}</div>`
}
function activitySparkData(days=7){
 const uid=currentUserId(),out=[];for(let i=days-1;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const key=d.toISOString().slice(0,10),n=systemHistory().filter(x=>x.userId===uid&&String(x.at).slice(0,10)===key).length;out.push({label:d.toLocaleDateString(undefined,{weekday:"short"}),value:n})}return out
}
function dashboardChartSection(kind="student"){
 const a=activitySparkData(),vals=a.map(x=>x.value),labels=a.map(x=>x.label),p10=studentFlashState(),cards=(p10.decks||[]).flatMap(d=>d.cards||[]),mastered=cards.filter(c=>Number(c.mastery||0)>=80).length;
 if(kind==="student")return `<section class="dashboardCharts"><article class="card"><h3>7-Day Activity</h3>${simpleBars(vals,labels)}</article><article class="card"><h3>Flashcard Mastery</h3><div class="donutStat" style="--p:${cards.length?Math.round(mastered/cards.length*100):0}"><div><b>${cards.length?Math.round(mastered/cards.length*100):0}%</b><span>${mastered}/${cards.length} mastered</span></div></div></article></section>`;
 const t=workspace().teacher||{classes:[],assignments:[],submissions:[]};if(kind==="teacher")return `<section class="dashboardCharts"><article class="card"><h3>Teaching Activity</h3>${simpleBars([t.classes.length,t.assignments.length,t.submissions.length,t.submissions.filter(x=>x.status==="graded").length],["Classes","Assignments","Submitted","Graded"])}</article><article class="card"><h3>7-Day Platform Activity</h3>${simpleBars(vals,labels)}</article></section>`;
 const org=businessOrgContext?.();if(kind==="business"&&org)return `<section class="dashboardCharts"><article class="card"><h3>Organization Overview</h3>${simpleBars([org.programs?.length||0,org.teacherIds?.length||0,org.memberIds?.length||0,org.reports?.length||0],["Programs","Teachers","Members","Reports"])}</article><article class="card"><h3>7-Day Account Activity</h3>${simpleBars(vals,labels)}</article></section>`;
 const users=userStore().users;return `<section class="dashboardCharts"><article class="card"><h3>Accounts by Role</h3>${simpleBars(["learner","teacher","business","admin"].map(r=>users.filter(u=>userRoles(u).includes(r)).length),["Students","Teachers","Business","Admin"])}</article><article class="card"><h3>7-Day Activity</h3>${simpleBars(vals,labels)}</article></section>`
}
function studentDashboardView(){
 const p=profile(),a=activitySparkData(),w=workspace(),posts=(communityStore().blog||[]).filter(x=>x.status==="published").slice(-3).reverse();
 show(`<section class="studentDashboard"><div class="dashboardWelcome"><div class="profileAvatar">${p.avatar?`<img src="${esc(p.avatar)}" alt="">`:(p.displayName||"U").slice(0,1).toUpperCase()}</div><div><div class="eyebrow">STUDENT DASHBOARD</div><h2>Welcome back, ${esc(p.displayName||session()?.name||"Student")}</h2><p>Continue learning, review weak points and keep your momentum visible.</p></div></div><section class="dashboardQuickActions"><button class="primary" data-dash-go="learn">${uiIcon("play",18)}<span>Active Learning</span></button><button data-dash-go="flashcards-extra">${uiIcon("cards",18)}<span>Flashcards</span></button><button data-dash-go="review">${uiIcon("chart",18)}<span>Review Mistakes</span></button><button data-dash-go="blog-extra">${uiIcon("blog",18)}<span>Read Blog</span></button></section>${dashboardChartSection("student")}<section class="dashboardCharts"><article class="card"><h3>Current Profile</h3><div class="list"><div class="row"><span>Goal</span><b>${esc(p.goal||"Set a goal in Profile")}</b></div><div class="row"><span>Plans</span><b>${w.plans.filter(x=>x.ownerId===currentUserId()).length}</b></div><div class="row"><span>Research projects</span><b>${w.researchProjects.filter(x=>x.ownerId===currentUserId()).length}</b></div></div></article><article class="card"><h3>Latest Blog Posts</h3><div class="list">${posts.map(x=>`<button class="row" data-dash-blog="${x.id}"><span>${esc(x.title)}</span><small>${esc(x.topic||"")}</small></button>`).join("")||'<div class="empty">No posts yet.</div>'}</div></article></section></section>`);
 $$("[data-dash-go]").forEach(b=>b.onclick=()=>roleTargetOpen(b.dataset.dashGo));$$("[data-dash-blog]").forEach(b=>b.onclick=()=>blogPostView(b.dataset.dashBlog))
}
function injectDashboardCharts(kind){
 const app=$("#app"),existing=$("#roleDashboardCharts");if(!app||existing)return;const box=document.createElement("div");box.id="roleDashboardCharts";box.innerHTML=dashboardChartSection(kind);const first=app.querySelector(".teacherMetrics,.healthMetrics,.businessDashboardGrid,.roleAdminList");if(first)first.insertAdjacentElement("afterend",box);else app.querySelector(".wrap")?.appendChild(box)
}

function teacherDashboardView(){teacherView();setTimeout(()=>injectDashboardCharts("teacher"),0)}
function businessDashboardView(){businessView();setTimeout(()=>injectDashboardCharts("business"),0)}
function superadminDashboardView(){superadminDashboard();setTimeout(()=>injectDashboardCharts("superadmin"),0)}
function roleLandingView(){
 document.documentElement.classList.remove("authSurfaceActive");
 installRoleGroupedNav();installRoleSidebar();renderManagedFooter();installRoleHistoryBridge();normalizeRoleChromeGeometry();
 const r=role();
 if(r==="superadmin")return superadminDashboardView();
 if(r==="business")return businessDashboardView();
 if(r==="teacher")return teacherDashboardView();
 if(r==="admin"){roleTargetOpen("admin-v14");return}
 return studentDashboardView()
}


function applyManagementPageChrome(){
 const r=role();
 const management=(r==="admin"||r==="superadmin");
 document.documentElement.classList.toggle("managementPageChrome",management);
}

let __roleHomeRedirecting=false;
function enforceRoleAwareHome(view=""){
 if(view!=="home"||role()==="learner"||__roleHomeRedirecting)return;
 __roleHomeRedirecting=true;
 requestAnimationFrame(()=>{try{roleLandingView()}finally{setTimeout(()=>__roleHomeRedirecting=false,0)}})
}


/* ---------- SYSTEM QA & RELIABILITY CENTER ---------- */
const SYSTEM_QA_KEY="tina.v14.system.qa";
const SYSTEM_QA_RUNTIME_KEY="tina.v14.system.qa.runtime";
const SYSTEM_QA_MAX_BEHAVIOR=1500;
const SYSTEM_QA_MAX_INCIDENTS=1000;
const SYSTEM_QA_REPEAT_THRESHOLD=3;
const SYSTEM_QA_REPEAT_WINDOW_MS=10*60*1000;

function systemQAState(){
 try{
  const x=JSON.parse(localStorage.getItem(SYSTEM_QA_KEY)||"{}");
  return Object.assign({version:1,enabled:true,behavior:[],incidents:[],lastUpdatedAt:null},x||{});
 }catch{return {version:1,enabled:true,behavior:[],incidents:[],lastUpdatedAt:null}}
}
function saveSystemQAState(x){
 x.behavior=(Array.isArray(x.behavior)?x.behavior:[]).slice(-SYSTEM_QA_MAX_BEHAVIOR);
 x.incidents=(Array.isArray(x.incidents)?x.incidents:[]).slice(-SYSTEM_QA_MAX_INCIDENTS);
 x.lastUpdatedAt=now();
 localStorage.setItem(SYSTEM_QA_KEY,JSON.stringify(x))
}
function sanitizeQAText(v){
 return String(v??"")
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,"[email]")
  .replace(/https?:\/\/[^\s"'<>]+/gi,m=>{try{const u=new URL(m);return `${u.origin}${u.pathname}`}catch{return "[url]"}})
  .replace(/(["']).{24,}?\1/g,"[quoted]")
  .replace(/\b\d{8,}\b/g,"[number]")
  .slice(0,280)
}
function qaCurrentContext(){
 const s=session()||{};
 return {
  userId:s.id||"guest",
  role:role?.()||s.role||"guest",
  view:base?.().view||document.querySelector("[data-role-target].active")?.dataset.roleTarget||"",
  path:location.pathname
 }
}
function qaRecordBehavior(kind,detail={}){
 const st=systemQAState();if(!st.enabled)return;
 const c=qaCurrentContext();
 const entry={id:uid("qabeh"),at:now(),kind,userId:c.userId,role:c.role,view:c.view,detail};
 st.behavior.push(entry);saveSystemQAState(st)
}
function qaFingerprint(type,message,source,line,col){
 const raw=[type,sanitizeQAText(message),String(source||"").split("/").slice(-2).join("/"),line||"",col||""].join("|");
 let h=2166136261;for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}
 return `qa-${(h>>>0).toString(16)}`
}
function qaRecordIncident(type,message,meta={}){
 const st=systemQAState();if(!st.enabled)return;
 const c=qaCurrentContext(),at=Date.now();
 const cleanMessage=sanitizeQAText(message||type||"Unknown runtime error");
 const fp=qaFingerprint(type,cleanMessage,meta.source,meta.line,meta.col);
 let inc=st.incidents.find(x=>x.fingerprint===fp&&x.status!=="resolved");
 if(!inc){
  inc={id:uid("qainc"),fingerprint:fp,type,summary:cleanMessage,source:sanitizeQAText(meta.source||""),line:Number(meta.line)||0,col:Number(meta.col)||0,
       firstSeenAt:new Date(at).toISOString(),lastSeenAt:new Date(at).toISOString(),count:0,status:"open",severity:"observed",roles:[],views:[],users:[],recent:[],repeatedReported:false,
       fix:{status:"untriaged",location:sanitizeQAText(meta.source||""),line:Number(meta.line)||0,col:Number(meta.col)||0,owner:"Superadmin",notes:"",version:"",updatedAt:null}};
  st.incidents.push(inc)
 }
 inc.count+=1;inc.lastSeenAt=new Date(at).toISOString();
 if(c.role&&!inc.roles.includes(c.role))inc.roles.push(c.role);
 if(c.view&&!inc.views.includes(c.view))inc.views.push(c.view);
 if(c.userId&&!inc.users.includes(c.userId))inc.users.push(c.userId);
 inc.recent.push({at:new Date(at).toISOString(),role:c.role,view:c.view,userId:c.userId});
 inc.recent=inc.recent.slice(-20);
 const recentCount=inc.recent.filter(x=>at-new Date(x.at).getTime()<=SYSTEM_QA_REPEAT_WINDOW_MS).length;
 if(recentCount>=SYSTEM_QA_REPEAT_THRESHOLD){
  inc.severity=recentCount>=8?"high":"repeated";
  if(!inc.repeatedReported){
   inc.repeatedReported=true;
   inc.repeatedAt=now();
   auditEvent?.("qa.repeated-error.detected",{incidentId:inc.id,fingerprint:fp,count:inc.count,recentCount,type:inc.type,views:inc.views,roles:inc.roles});
  }
 }
 saveSystemQAState(st);
 window.TinaBackend?.telemetry?.({id:`qa-${inc.id}-${at}`,type:"qa.runtime.error",at:new Date(at).toISOString(),role:c.role,view:c.view,
   detail:{fingerprint:fp,errorType:type,count:inc.count,repeated:recentCount>=SYSTEM_QA_REPEAT_THRESHOLD,severity:inc.severity}}).catch(()=>{});
}
function qaBehaviorTarget(el){
 if(!el)return {};
 return {
  tag:(el.tagName||"").toLowerCase(),
  id:sanitizeQAText(el.id||""),
  route:sanitizeQAText(el.dataset?.roleTarget||el.dataset?.view||el.dataset?.sysTarget||el.dataset?.superadminOpen||""),
  action:sanitizeQAText(el.dataset?.op||el.dataset?.action||"")
 }
}
function installSystemQAMonitor(){
 if(window.__tinaSystemQAMonitorInstalled)return;
 window.__tinaSystemQAMonitorInstalled=true;
 const runtime={installedAt:now(),errors:0,behaviors:0};
 sessionStorage.setItem(SYSTEM_QA_RUNTIME_KEY,JSON.stringify(runtime));

 window.addEventListener("error",e=>{
  if(e.target&&e.target!==window){
   const tag=e.target.tagName||"RESOURCE",src=e.target.src||e.target.href||"";
   qaRecordIncident("resource-error",`${tag} failed to load`,{source:src});return
  }
  qaRecordIncident("javascript-error",e.message||"JavaScript error",{source:e.filename,line:e.lineno,col:e.colno})
 },true);

 window.addEventListener("unhandledrejection",e=>{
  const r=e.reason, msg=r?.message||String(r||"Unhandled promise rejection");
  qaRecordIncident("unhandled-rejection",msg,{source:r?.stack?.split("\n")?.[1]||""})
 });

 document.addEventListener("click",e=>{
  const el=e.target?.closest?.("button,a,[data-role-target],[data-view],[data-action],[data-op]");
  if(!el)return;
  qaRecordBehavior("click",qaBehaviorTarget(el))
 },true);

 document.addEventListener("submit",e=>{
  const f=e.target;
  qaRecordBehavior("submit",{id:sanitizeQAText(f?.id||""),action:sanitizeQAText(f?.getAttribute?.("action")||"")})
 },true);

 document.addEventListener("tina:view-changed",e=>qaRecordBehavior("view",{view:sanitizeQAText(e.detail?.view||"")}));
 window.addEventListener("online",()=>qaRecordBehavior("network",{state:"online"}));
 window.addEventListener("offline",()=>qaRecordBehavior("network",{state:"offline"}));
}
function qaIncidentRows(){
 const st=systemQAState();
 return [...st.incidents].sort((a,b)=>{
  const rank=x=>x.severity==="high"?3:x.severity==="repeated"?2:1;
  return rank(b)-rank(a)||new Date(b.lastSeenAt)-new Date(a.lastSeenAt)
 })
}
function systemQAReliabilityView(){
 if(!isSuperadmin())return show('<div class="feedback bad">Superadmin access is required.</div>');
 const st=systemQAState(),rows=qaIncidentRows(),open=rows.filter(x=>x.status!=="resolved"),repeated=open.filter(x=>["repeated","high"].includes(x.severity));
 const behaviors=st.behavior.slice(-80).reverse();
 const statusBadge=st.enabled?'<span class="qaLiveDot"></span> Monitoring active':'Monitoring paused';
 show(`<section class="systemQACenter">
  <div class="sectionHead"><div><div class="eyebrow">SUPERADMIN · SYSTEM QUALITY</div><h2>System QA & Reliability</h2>
  <p class="muted">Event-driven runtime monitoring for repeated system faults and privacy-minimized user interaction context.</p></div>
  <div class="actions"><button id="qaToggleMonitor">${st.enabled?"Pause monitoring":"Resume monitoring"}</button><button class="primary" id="qaRunDisposable">Run Disposable QA</button></div></div>

  <section class="qaMetricGrid">
   <article class="card qaMetric"><small>Status</small><strong>${statusBadge}</strong><span>No continuous polling or screen recording.</span></article>
   <article class="card qaMetric"><small>Open incidents</small><strong>${open.length}</strong><span>${rows.length} total fingerprints retained.</span></article>
   <article class="card qaMetric"><small>Repeated faults</small><strong>${repeated.length}</strong><span>Threshold: ${SYSTEM_QA_REPEAT_THRESHOLD} repeats / 10 min.</span></article>
   <article class="card qaMetric"><small>Behavior events</small><strong>${st.behavior.length}</strong><span>Click/route/submit metadata only; no form values.</span></article>
   <article class="card qaMetric"><small>Fix queue</small><strong>${open.filter(x=>!["fixed","verified"].includes(x.fix?.status||"")).length}</strong><span>Incidents still needing a verified correction.</span></article>
  </section>

  ${repeated.length?`<section class="card qaRepeatedPanel"><div class="sectionHead"><div><h3>Repeated-error alerts</h3><p class="muted">Prioritized faults that crossed the recurrence threshold.</p></div></div>
    <div class="qaIncidentList">${repeated.map(qaIncidentCard).join("")}</div></section>`:""}

  <section class="card"><div class="sectionHead"><div><h3>Incident registry</h3><p class="muted">A fingerprint groups the same runtime fault across repeated occurrences.</p></div>
   <div class="actions"><button id="qaExport">Export QA Report</button><button id="qaClearResolved">Clear Resolved</button></div></div>
   <div class="qaIncidentList">${rows.length?rows.map(qaIncidentCard).join(""):'<div class="empty">No runtime incidents recorded.</div>'}</div>
  </section>

  <section class="card"><div class="sectionHead"><div><h3>Recent behavior context</h3><p class="muted">Used to correlate faults with routes/actions. Input values, keystrokes and message bodies are not captured.</p></div></div>
   <div class="qaBehaviorTable">${behaviors.length?`<table><thead><tr><th>Time</th><th>Role</th><th>View</th><th>Event</th><th>Context</th></tr></thead><tbody>${behaviors.map(x=>`<tr><td>${esc(new Date(x.at).toLocaleString())}</td><td>${esc(x.role||"")}</td><td>${esc(x.view||"")}</td><td>${esc(x.kind)}</td><td><code>${esc(JSON.stringify(x.detail||{}))}</code></td></tr>`).join("")}</tbody></table>`:'<div class="empty">No behavior context recorded yet.</div>'}</div>
  </section>
 </section>`);

 $("#qaToggleMonitor").onclick=()=>{const x=systemQAState();x.enabled=!x.enabled;saveSystemQAState(x);auditEvent("qa.monitor.toggled",{enabled:x.enabled});systemQAReliabilityView()};
 $("#qaRunDisposable").onclick=()=>qaSandboxView();
 $("#qaExport").onclick=()=>download(`tina-system-qa-${Date.now()}.json`,JSON.stringify({exportedAt:now(),state:systemQAState()},null,2));
 $("#qaClearResolved").onclick=()=>{const x=systemQAState();x.incidents=x.incidents.filter(i=>i.status!=="resolved");saveSystemQAState(x);auditEvent("qa.resolved.cleared",{});systemQAReliabilityView()};
 $$("[data-qa-ack]").forEach(b=>b.onclick=()=>{const x=systemQAState(),i=x.incidents.find(v=>v.id===b.dataset.qaAck);if(i){i.status="acknowledged";i.acknowledgedAt=now()}saveSystemQAState(x);auditEvent("qa.incident.acknowledged",{incidentId:b.dataset.qaAck});systemQAReliabilityView()});
 $$("[data-qa-resolve]").forEach(b=>b.onclick=()=>{const x=systemQAState(),i=x.incidents.find(v=>v.id===b.dataset.qaResolve);if(i){i.status="resolved";i.resolvedAt=now()}saveSystemQAState(x);auditEvent("qa.incident.resolved",{incidentId:b.dataset.qaResolve});systemQAReliabilityView()});
 $$("[data-qa-reopen]").forEach(b=>b.onclick=()=>{const x=systemQAState(),i=x.incidents.find(v=>v.id===b.dataset.qaReopen);if(i){i.status="open";i.repeatedReported=false}saveSystemQAState(x);auditEvent("qa.incident.reopened",{incidentId:b.dataset.qaReopen});systemQAReliabilityView()});
 $$("[data-qa-fix]").forEach(b=>b.onclick=()=>qaOpenFixEditor(b.dataset.qaFix));
 $$("[data-qa-copy]").forEach(b=>b.onclick=()=>qaCopyFixContext(b.dataset.qaCopy));
}

function qaFixLocationText(x){
 const f=x.fix||{},src=f.location||x.source||"",line=Number(f.line||x.line)||0,col=Number(f.col||x.col)||0;
 return src?`${src}${line?`:${line}${col?`:${col}`:""}`:""}`:"Location not identified yet";
}
function qaOpenFixEditor(id){
 if(!isSuperadmin())return;
 const st=systemQAState(),x=st.incidents.find(v=>v.id===id);if(!x)return;
 const f=Object.assign({status:"untriaged",location:x.source||"",line:x.line||0,col:x.col||0,owner:"Superadmin",notes:"",version:"",updatedAt:null},x.fix||{});
 modal("Update Fix Location",`
  <div class="wsFormGrid">
   <label class="wsField"><span>Fix status</span><select id="qaFixStatus">
    ${["untriaged","investigating","fix-planned","fix-in-progress","fixed","verified"].map(v=>`<option value="${v}" ${f.status===v?"selected":""}>${v}</option>`).join("")}
   </select></label>
   ${textField("qaFixOwner","Owner",f.owner||"Superadmin")}
   ${textField("qaFixLocation","Source / file / module",f.location||x.source||"")}
   ${textField("qaFixLine","Line",String(f.line||x.line||""))}
   ${textField("qaFixCol","Column",String(f.col||x.col||""))}
   ${textField("qaFixVersion","Patch / version / commit",f.version||"")}
   ${areaField("qaFixNotes","Diagnosis & fix notes",f.notes||"")}
  </div>`,
  `<button id="qaFixCancel">Cancel</button><button class="primary" id="qaFixSave">Save Fix Update</button>`);
 $("#qaFixCancel").onclick=closeModal;
 $("#qaFixSave").onclick=()=>{
  const s=systemQAState(),inc=s.incidents.find(v=>v.id===id);if(!inc)return closeModal();
  inc.fix={
   status:$("#qaFixStatus").value,
   owner:sanitizeQAText($("#qaFixOwner").value||"Superadmin"),
   location:sanitizeQAText($("#qaFixLocation").value||""),
   line:Number($("#qaFixLine").value)||0,
   col:Number($("#qaFixCol").value)||0,
   version:sanitizeQAText($("#qaFixVersion").value||""),
   notes:sanitizeQAText($("#qaFixNotes").value||""),
   updatedAt:now()
  };
  if(["fixed","verified"].includes(inc.fix.status)&&inc.status==="open")inc.status="acknowledged";
  saveSystemQAState(s);
  auditEvent("qa.incident.fix-updated",{incidentId:id,fixStatus:inc.fix.status,location:inc.fix.location,line:inc.fix.line,version:inc.fix.version});
  closeModal();systemQAReliabilityView()
 }
}
function qaCopyFixContext(id){
 const st=systemQAState(),x=st.incidents.find(v=>v.id===id);if(!x)return;
 const f=x.fix||{};
 const payload=[
  `Incident: ${x.id}`,
  `Type: ${x.type}`,
  `Severity: ${x.severity}`,
  `Summary: ${x.summary}`,
  `Occurrences: ${x.count}`,
  `Fix location: ${qaFixLocationText(x)}`,
  `Affected views: ${(x.views||[]).join(", ")||"—"}`,
  `Affected roles: ${(x.roles||[]).join(", ")||"—"}`,
  `Fix status: ${f.status||"untriaged"}`,
  `Patch/version: ${f.version||"—"}`,
  `Notes: ${f.notes||"—"}`
 ].join("\\n");
 navigator.clipboard?.writeText(payload).then(()=>alert("Fix context copied.")).catch(()=>{});
}
function qaIncidentCard(x){
 const sev=x.severity||"observed",f=x.fix||{},fixStatus=f.status||"untriaged";
 return `<article class="qaIncident ${esc(sev)}"><div class="qaIncidentHead"><div><span class="qaSeverity">${esc(sev.toUpperCase())}</span><b>${esc(x.type)}</b></div><small>${esc(x.status||"open")}</small></div>
  <p>${esc(x.summary||"Unknown error")}</p>
  <div class="qaIncidentMeta"><span><b>${Number(x.count)||0}</b> occurrences</span><span>Last: ${esc(new Date(x.lastSeenAt).toLocaleString())}</span><span>Roles: ${esc((x.roles||[]).join(", ")||"—")}</span><span>Views: ${esc((x.views||[]).join(", ")||"—")}</span></div>
  <div class="qaFixBox">
   <div><small>FIX LOCATION</small><b>${esc(qaFixLocationText(x))}</b></div>
   <div><small>FIX STATUS</small><b>${esc(fixStatus)}</b>${f.version?`<span>${esc(f.version)}</span>`:""}</div>
   ${f.notes?`<p>${esc(f.notes)}</p>`:""}
  </div>
  <div class="actions"><button data-qa-fix="${esc(x.id)}">Update Fix</button><button data-qa-copy="${esc(x.id)}">Copy Fix Context</button>${x.status==="open"?`<button data-qa-ack="${esc(x.id)}">Acknowledge</button>`:""}${x.status!=="resolved"?`<button class="primary" data-qa-resolve="${esc(x.id)}">Resolve</button>`:`<button data-qa-reopen="${esc(x.id)}">Reopen</button>`}</div></article>`
}

function qaSandboxView(){
 if(!isSuperadmin())return;
 const last=localStorage.getItem("tina.v14.qa.last-report");
 show(`<section class="qaSandboxPage"><div class="pageTitleCompact"><h2>Disposable System QA</h2><button class="primary" id="qaRun">Run Test Data Audit</button></div><section class="card"><p>This audit snapshots governed local stores, creates tagged disposable Student/Teacher/Business/Admin-like test records, validates role routes, organization boundaries, communication data and cleanup, then restores the exact pre-test stores.</p><div id="qaStatus"></div></section>${last?`<section class="card"><h3>Last report</h3><pre class="qaReport">${esc(last)}</pre></section>`:""}</section>`);
 $("#qaRun").onclick=runDisposableSystemQA
}
async function runDisposableSystemQA(){
 const out=$("#qaStatus"),keys=["tina.v14.workspace","tina.v14.users","tina.v14.system.activity","tina.v14.system.usage"],snap=Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),results=[];
 const ok=(name,pass,detail="")=>results.push({name,pass:!!pass,detail});
 try{
   out.innerHTML='<div class="feedback warn">Creating disposable test data…</div>';
   const s=userStore(),w=ensureCommunicationStore(),tag="__tina_test__"+Date.now();
   const ids={student:tag+"-student",teacher:tag+"-teacher",business:tag+"-business",org:tag+"-org"};
   s.users.push(
    {id:ids.student,name:"QA Student",email:tag+"-student",role:"learner",roles:["learner"],primaryRole:"learner",status:"active",createdAt:now()},
    {id:ids.teacher,name:"QA Teacher",email:tag+"-teacher",role:"teacher",roles:["teacher"],primaryRole:"teacher",status:"active",createdAt:now()},
    {id:ids.business,name:"QA Business",email:tag+"-business",role:"business",roles:["business"],primaryRole:"business",status:"active",createdAt:now()}
   );saveUsers(s);
   const ww=workspace();ww.organizations=Array.isArray(ww.organizations)?ww.organizations:[];ww.organizations.push({id:ids.org,name:"QA Organization",code:"QA-TEMP",type:"School",businessAccountIds:[ids.business],teacherIds:[ids.teacher],memberIds:[ids.student,ids.teacher,ids.business],programs:[{id:tag+"-program",title:"QA Program",status:"active"}],reports:[]});
   ww.teacher.classes.push({id:tag+"-class",name:"QA Class",code:"QAT",members:[ids.student]});
   ww.teacher.assignments.push({id:tag+"-assignment",title:"QA Assignment",assignees:[ids.student]});
   ww.communication.reminders.push({id:tag+"-rem",userId:ids.student,title:"QA reminder",when:new Date(Date.now()+3600000).toISOString(),repeat:"once",enabled:true});
   ww.communication.announcements.push({id:tag+"-ann",title:"QA Announcement",body:"Temporary",roles:["learner"],status:"published",createdAt:now()});
   ww.communication.issues.push({id:tag+"-issue",userId:ids.student,role:"learner",type:"Bug",severity:"Low",title:"QA issue",body:"Temporary",status:"open",createdAt:now()});
   saveW(ww);

   ok("Disposable users created",userStore().users.filter(x=>x.id.startsWith(tag)).length===3);
   ok("Organization linkage",workspace().organizations.some(o=>o.id===ids.org&&o.businessAccountIds.includes(ids.business)&&o.teacherIds.includes(ids.teacher)));
   ok("Teacher class/assignment data",workspace().teacher.classes.some(x=>x.id===tag+"-class")&&workspace().teacher.assignments.some(x=>x.id===tag+"-assignment"));
   ok("Reminder data",ensureCommunicationStore().communication.reminders.some(x=>x.id===tag+"-rem"));
   ok("Announcement data",ensureCommunicationStore().communication.announcements.some(x=>x.id===tag+"-ann"));
   ok("Issue workflow data",ensureCommunicationStore().communication.issues.some(x=>x.id===tag+"-issue"));
   const routeGroups=roleSidebarGroups(),allTargets=routeGroups.flatMap(x=>x[1].map(y=>y[1]));
   ok("Current Superadmin sidebar targets registered",allTargets.every(t=>ROLE_BASE_TARGETS.has(t)||["profile-extra","teacher-extra","teacher-dashboard-extra","teacher-classes-extra","teacher-assignments-extra","teacher-grading-extra","teacher-progress-extra","business-extra","business-dashboard-extra","business-programs-extra","business-members-extra","business-teachers-extra","business-reports-extra","account-extra","superadmin-extra","system-admin-extra","health-extra","system-qa-extra","history-extra","editing-extra","roles-extra","access-extra","permissions-extra","games-extra","dictionary-extra","leaderboard-extra","achievements-extra","library-extra","interface-studio-extra","app-studio-extra","infrastructure-extra","auth-gates-extra","organizations-extra","backend-extra","canon-create-extra","themes-extra","governance-map-extra","role-matrix-extra","role-guides-extra","my-role-guide-extra","role-hierarchy-extra","contact-extra","feedback-extra","reminders-extra","announcements-extra","announcement-manager-extra","issue-desk-extra","reviewer-issues-extra","system-activity-extra","qa-sandbox-extra","learning-intelligence-extra","shadowing-extra","shadowing-insights-extra","security-readiness-extra"].includes(t)||t==="canonical"||t==="core"||t==="admin-v14"),allTargets.join(", "));
   ok("Business lower-role boundary",BUSINESS_MEMBER_ROLES.every(r=>["learner","teacher","business"].includes(r)));
   ok("Canon remains governed",typeof canAccessCanon==="function");
 }catch(e){ok("QA runtime",false,e.message||String(e))}
 finally{
   keys.forEach(k=>{const v=snap[k];if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)});
   /* TINA_V14_DISPOSABLE_QA_TRANSACTIONAL_ROLLBACK
    * The pre-test local stores have now been restored.
    * Purge only reserved disposable-QA identities, then publish
    * the restored clean state through the normal backend bridge.
    */
   try{
     window.TinaDisposableQaClosure?.purge?.();
   }catch{}

   try{
     window.TinaBackend?.scheduleSync?.("disposable-qa-rollback");
   }catch{}

   const residual=keys.some(k=>(localStorage.getItem(k)||"").includes("__tina_test__"));
   ok("Disposable test data removed",!residual);
   const report={generatedAt:now(),passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,results};
   localStorage.setItem("tina.v14.qa.last-report",JSON.stringify(report,null,2));
   auditEvent("qa.disposable.completed",{passed:report.passed,failed:report.failed,cleaned:!residual});
   if(out)out.innerHTML=`<div class="feedback ${report.failed?"bad":"ok"}">QA completed: ${report.passed} passed, ${report.failed} failed. Disposable data cleanup: ${!residual?"PASS":"FAIL"}.</div><pre class="qaReport">${esc(JSON.stringify(report,null,2))}</pre>`
 }
}

const ONBOARDING_KEY="tina.v14.onboarding";
function onboardingState(){try{return JSON.parse(localStorage.getItem(ONBOARDING_KEY)||"{}")}catch{return{}}}
function saveOnboardingState(x){localStorage.setItem(ONBOARDING_KEY,JSON.stringify(x))}
function onboardingSteps(){
 const r=role(),firstGroup="#roleSidebar .roleSideGroup:first-of-type > .roleSideHeading";
 const roleText={
  learner:"Use the Learning section for Dashboard, Catalog, Active Learning, Flashcards and Games.",
  teacher:"Use the Teaching section for classes, assignments, grading and learner progress.",
  business:"Use the Organization section for programs, members, teachers and reports.",
  admin:"Use Administration for review, escalation and lower-role account governance.",
  superadmin:"Use System Control for governance, access, organizations and infrastructure.",
  editor:"Use Content for governed authoring and content work.",
  reviewer:"Use Review for assessment and quality-review work."
 }[r]||"Use the first sidebar section for your main workspace.";
 return [
  {title:"Your workspace",text:"The header stays across the full screen. The sidebar is the main navigation for your current role.",target:"#roleSidebar"},
  {title:"Your main section",text:roleText,target:firstGroup},
  {title:"Your account",text:"Open your account for profile and session actions.",target:"#roleAccountChip"},
  {title:"Dictionary",text:"Use Dictionary to inspect English words, pronunciation, audio and translation.",target:"#wordToolToggle"},
  {title:"Help is always available",text:"Use Quick Tour in the sidebar whenever you want to see this guide again.",target:"#roleSidebar"}
 ]
}
function maybeStartOnboarding(){return}
function startOnboardingTour(index=0,key=`${currentUserId()}:${role()}`){
 const steps=onboardingSteps();
 if(index>=steps.length){
  const s=onboardingState();s[key]={complete:true,completedAt:now()};saveOnboardingState(s);
  $("#tinaCoachmark")?.remove();document.querySelectorAll(".tourHighlight").forEach(x=>x.classList.remove("tourHighlight"));return
 }
 let c=$("#tinaCoachmark");
 if(!c){c=document.createElement("aside");c.id="tinaCoachmark";c.className="tinaCoachmark tinaCoachmarkStable";c.setAttribute("role","dialog");c.setAttribute("aria-live","polite");document.body.appendChild(c)}
 const st=steps[index],target=document.querySelector(st.target);
 document.querySelectorAll(".tourHighlight").forEach(x=>x.classList.remove("tourHighlight"));
 if(target)target.classList.add("tourHighlight");
 c.style.left="";c.style.top="";c.style.transform="";
 c.innerHTML=`<div class="coachStep">${index+1}/${steps.length}</div><h3>${esc(st.title)}</h3><p>${esc(st.text)}</p>${target?"":'<small class="tourUnavailable">This control is not available for your current role.</small>'}<div class="actions"><button id="tourSkip">Skip tour</button><button class="primary" id="tourNext">${index===steps.length-1?"Finish":"Next"}</button></div>`;
 $("#tourNext").onclick=()=>startOnboardingTour(index+1,key);
 $("#tourSkip").onclick=()=>{const s=onboardingState();s[key]={complete:true,skipped:true,completedAt:now()};saveOnboardingState(s);document.querySelectorAll(".tourHighlight").forEach(x=>x.classList.remove("tourHighlight"));c.remove()}
}
function restartOnboarding(){const key=`${currentUserId()}:${role()}`;document.documentElement.classList.remove("authSurfaceActive");installRoleGroupedNav();installRoleSidebar();startOnboardingTour(0,key)}

const FOOTER_CONFIG_KEY="tina.v14.footer.config";
function footerConfig(){
 const fallback={tagline:"Learn → Practice → Review → Master.",links:[{label:"Home",target:"home",type:"route",roles:["*"]},{label:"Library",target:"library-extra",type:"route",roles:["*"]},{label:"Settings",target:"settings",type:"route",roles:["*"]},{label:"Support",target:"contact-extra",type:"route",roles:["*"]}]};
 try{return Object.assign(fallback,JSON.parse(localStorage.getItem(FOOTER_CONFIG_KEY)||"{}"))}catch{return fallback}
}
function saveFooterConfig(x){localStorage.setItem(FOOTER_CONFIG_KEY,JSON.stringify(x));window.TinaBackend?.scheduleSync?.("footer-config")}
function renderManagedFooter(){
 const f=document.querySelector("footer.tinaFooter");if(!f)return;const c=footerConfig(),r=role(),links=(c.links||[]).filter(x=>(x.roles||["*"]).includes("*")||(x.roles||[]).includes(r));
 f.innerHTML=`<div class="footerInner"><div class="footerBrand"><strong><span>TINA</span> Learning Platform</strong><p>${esc(c.tagline||"")}</p></div><nav class="footerLinks">${links.map((x,i)=>`<button type="button" data-managed-footer="${i}">${esc(x.label)}</button>`).join("")}</nav><div class="footerMeta"><span>V14 FINAL</span><small>${esc(r==="learner"?"Student":r.charAt(0).toUpperCase()+r.slice(1))} workspace</small></div></div>`;
 $$("[data-managed-footer]").forEach(b=>b.onclick=()=>{const x=links[Number(b.dataset.managedFooter)];if(!x)return;if(x.type==="url")window.open(x.target,"_blank","noopener");else roleTargetOpen(x.target)});requestAnimationFrame(syncFixedChromeGeometry)
}
const FOOTER_ROUTE_OPTIONS=[
 ["Home","home"],["Catalog","catalog"],["Active Learning","learn"],["Tina Academy","academy"],
 ["Tina Dictionary","dictionary-extra"],["Tina Library","library-extra"],["Study Plans","plans"],
 ["Research","research"],["Practice","practice-v10"],["Assessment","assessment-v11"],["Settings","settings"],
 ["Contact / Support","contact-extra"],["Community Hub","community-extra"],["Feedback & Issue Desk","issue-desk-extra"],
 ["System QA & Reliability","system-qa-extra"]
];
function footerRouteExists(target){
 if(!target)return false;
 if(ROLE_BASE_TARGETS.has(target))return true;
 const known=new Set(FOOTER_ROUTE_OPTIONS.map(x=>x[1]));
 const extra=["teacher-extra","business-extra","admin-v14","superadmin-extra","reviewer-issues-extra","themes-extra","footer-editor-extra","data-standards-extra","shadowing-extra","shadowing-insights-extra","learning-intelligence-extra"];
 return known.has(target)||extra.includes(target)
}
function footerEditorView(){
 if(!isSuperadmin())return;
 const c=footerConfig();
 const routeOptions=FOOTER_ROUTE_OPTIONS.map(([label,target])=>`<option value="${esc(target)}">${esc(label)} · ${esc(target)}</option>`).join("");
 show(`<section><div class="sectionHead"><div><div class="eyebrow">SUPERADMIN · INTERFACE</div><h2>Footer Editor</h2><p class="muted">Manage footer labels, destinations and role visibility. Use the route picker to update each footer path without memorising route IDs.</p></div><button class="primary" id="footerAddLink">+ Footer Link</button></div>
 <article class="card"><label class="fieldLabel">Footer tagline<input id="footerTagline" value="${esc(c.tagline||"")}"></label>
 <div class="footerRouteLegend"><b>Route helper</b><span>Select a known platform destination or enter an external URL. Route validation runs before saving.</span></div>
 <div class="list" id="footerEditList">${(c.links||[]).map((x,i)=>`<div class="footerEditRow footerEditRowAdvanced">
   <label><span>Label</span><input data-footer-label="${i}" value="${esc(x.label)}"></label>
   <label><span>Type</span><select data-footer-type="${i}"><option value="route" ${x.type!=="url"?"selected":""}>Platform route</option><option value="url" ${x.type==="url"?"selected":""}>External URL</option></select></label>
   <label><span>Quick destination</span><select data-footer-route-picker="${i}"><option value="">Choose route…</option>${routeOptions}</select></label>
   <label><span>Destination / path</span><input data-footer-target="${i}" value="${esc(x.target)}" placeholder="dictionary-extra or https://..."><small data-footer-route-state="${i}"></small></label>
   <label><span>Visible roles</span><input data-footer-roles="${i}" value="${esc((x.roles||["*"]).join(","))}" placeholder="*, learner, teacher..."></label>
   <div class="footerEditActions"><button data-footer-test="${i}">Test Path</button><button data-footer-remove="${i}">Remove</button></div>
  </div>`).join("")}</div>
 <div class="actions"><button id="footerValidateAll">Validate Paths</button><button class="primary" id="footerSave">Save Footer</button></div></article></section>`);
 const validateRow=i=>{
  const type=$(`[data-footer-type="${i}"]`)?.value,target=$(`[data-footer-target="${i}"]`)?.value.trim()||"",state=$(`[data-footer-route-state="${i}"]`);
  let ok=false,msg="";
  if(type==="url"){try{const u=new URL(target);ok=["http:","https:"].includes(u.protocol);msg=ok?"Valid external URL":"Only http/https URLs are allowed"}catch{msg="Invalid URL"}}
  else{ok=footerRouteExists(target);msg=ok?"Known platform route":"Unknown route — check the destination before saving"}
  if(state){state.textContent=msg;state.className=ok?"footerRouteOk":"footerRouteBad"}return ok
 };
 $("#footerAddLink").onclick=()=>{c.links=c.links||[];c.links.push({label:"New Link",target:"home",type:"route",roles:["*"]});saveFooterConfig(c);footerEditorView()};
 $$("[data-footer-route-picker]").forEach(s=>s.onchange=()=>{const i=s.dataset.footerRoutePicker;if(!s.value)return;const t=$(`[data-footer-target="${i}"]`),ty=$(`[data-footer-type="${i}"]`);ty.value="route";t.value=s.value;validateRow(i)});
 $$("[data-footer-type]").forEach(s=>s.onchange=()=>validateRow(s.dataset.footerType));
 $$("[data-footer-target]").forEach(t=>t.oninput=()=>validateRow(t.dataset.footerTarget));
 $$("[data-footer-test]").forEach(b=>b.onclick=()=>{const i=b.dataset.footerTest,type=$(`[data-footer-type="${i}"]`).value,target=$(`[data-footer-target="${i}"]`).value.trim();if(!validateRow(i))return;if(type==="url")window.open(target,"_blank","noopener");else roleTargetOpen(target)});
 $$("[data-footer-remove]").forEach(b=>b.onclick=()=>{c.links.splice(Number(b.dataset.footerRemove),1);saveFooterConfig(c);footerEditorView()});
 $("#footerValidateAll").onclick=()=>{const results=(c.links||[]).map((_,i)=>validateRow(i));alert(results.every(Boolean)?"All footer paths are valid.":"Some footer paths need attention.")};
 $("#footerSave").onclick=()=>{
  let valid=true;
  (c.links||[]).forEach((x,i)=>{x.label=$(`[data-footer-label="${i}"]`).value.trim();x.type=$(`[data-footer-type="${i}"]`).value;x.target=$(`[data-footer-target="${i}"]`).value.trim();x.roles=$(`[data-footer-roles="${i}"]`).value.split(",").map(v=>v.trim()).filter(Boolean);if(!validateRow(i))valid=false});
  if(!valid)return alert("Footer not saved. Fix invalid destinations first.");
  c.tagline=$("#footerTagline").value;saveFooterConfig(c);renderManagedFooter();auditEvent("footer.config.updated",{links:c.links.length});alert("Footer paths updated and saved.")
 };
 (c.links||[]).forEach((_,i)=>validateRow(i))
}

function normalizeRoleChromeGeometry(){
 const active=!!session()||isAdmin();
 document.documentElement.classList.toggle("tinaChromeReady",active&&!document.documentElement.classList.contains("authSurfaceActive"));
 document.body.style.removeProperty("padding-left");
 document.body.style.removeProperty("margin-left");
 document.body.style.removeProperty("width");
 const top=document.querySelector(".topbar"),footer=document.querySelector(".tinaFooter"),side=$("#roleSidebar"),app=$("#app");
 if(top){top.style.removeProperty("margin-left");top.style.removeProperty("width")}
 if(footer){footer.style.removeProperty("margin-left");footer.style.removeProperty("width")}
 if(side){side.style.removeProperty("margin")}
 if(app){app.style.removeProperty("width");app.style.removeProperty("margin-left")}
}


/* =====================================================================
   LEARNING INTELLIGENCE + TINA SHADOWING
   v14 FINAL — system measurement, feedback and improvement loop.
   ===================================================================== */
const LEARNING_INTELLIGENCE_KEY="tina.v14.learning.intelligence";
const SHADOWING_KEY="tina.v14.shadowing";
function learningIntelligenceStore(){
 let s={version:1,goals:{weeklyMinutes:180,targetAccuracy:80,targetCompletion:80},recommendationRules:[],manualFeedback:[],improvementActions:[],updatedAt:now()};
 try{s=Object.assign(s,JSON.parse(localStorage.getItem(LEARNING_INTELLIGENCE_KEY)||"{}"))}catch{}
 s.goals=Object.assign({weeklyMinutes:180,targetAccuracy:80,targetCompletion:80},s.goals||{});
 s.manualFeedback=Array.isArray(s.manualFeedback)?s.manualFeedback:[];s.improvementActions=Array.isArray(s.improvementActions)?s.improvementActions:[];
 return s
}
function saveLearningIntelligence(s){s.updatedAt=now();localStorage.setItem(LEARNING_INTELLIGENCE_KEY,JSON.stringify(s));window.TinaBackend?.scheduleSync?.("learning-intelligence")}
function shadowingStore(){
 let s={version:1,library:[],attempts:[],settings:{autoSpeak:false,defaultRate:1,rubricVersion:"1.0"},updatedAt:now()};
 try{s=Object.assign(s,JSON.parse(localStorage.getItem(SHADOWING_KEY)||"{}"))}catch{}
 s.library=Array.isArray(s.library)?s.library:[];s.attempts=Array.isArray(s.attempts)?s.attempts:[];
 s.settings=Object.assign({autoSpeak:false,defaultRate:1,rubricVersion:"1.0"},s.settings||{});
 return s
}
function saveShadowing(s){s.updatedAt=now();localStorage.setItem(SHADOWING_KEY,JSON.stringify(s));window.TinaBackend?.scheduleSync?.("shadowing")}
function allLearningEvents(){
 const hist=systemHistory?.()||[],usage=usageRecords?.()||[];
 return {hist,usage}
}
function learningMetricSnapshot({days=30,roleFilter="*",userId=""}={}){
 const {hist,usage}=allLearningEvents(),users=userStore().users||[],cut=days>0?Date.now()-days*86400000:0;
 const allowedUsers=new Set(users.filter(u=>{
  if(userId&&u.id!==userId)return false;
  if(roleFilter!=="*"&&!userRoles(u).includes(roleFilter))return false;
  return true
 }).map(u=>u.id));
 const H=hist.filter(x=>allowedUsers.has(x.userId)&&new Date(x.at||x.createdAt||0).getTime()>=cut);
 const U=usage.filter(x=>allowedUsers.has(x.userId)&&new Date(x.startedAt||0).getTime()>=cut);
 const shadow=shadowingStore().attempts.filter(x=>allowedUsers.has(x.userId)&&new Date(x.createdAt||0).getTime()>=cut);
 const minutes=U.reduce((n,x)=>n+Number(x.activeMs||0)/60000,0);
 const practice=H.filter(x=>/practice|quiz|game|flash|shadow|speaking|writing|dictation/i.test(x.type||"")).length;
 const mistakes=H.filter(x=>/wrong|mistake|error/i.test(x.type||"")).length;
 const completions=H.filter(x=>/completed|complete/i.test(x.type||"")).length;
 const sessions=new Set(U.map(x=>x.sessionId||`${x.userId}:${x.startedAt}`)).size;
 const activeUsers=new Set([...H.map(x=>x.userId),...U.map(x=>x.userId)]).size;
 const avgShadow=shadow.length?shadow.reduce((n,x)=>n+Number(x.score?.overall||0),0)/shadow.length:0;
 const completionRate=practice?Math.min(100,Math.round(completions/practice*100)):0;
 const mistakeRate=practice?Math.min(100,Math.round(mistakes/practice*100)):0;
 return {days,activeUsers,sessions,minutes,practice,mistakes,completions,completionRate,mistakeRate,shadowAttempts:shadow.length,avgShadow,H,U,shadow,users:users.filter(u=>allowedUsers.has(u.id))}
}
function learningRecommendations(snap){
 const g=learningIntelligenceStore().goals,out=[];
 const weekly=snap.days>0?snap.minutes/Math.max(1,snap.days/7):snap.minutes;
 if(weekly<g.weeklyMinutes*.55)out.push({severity:"high",area:"Engagement",title:"Increase active learning time",why:`Average ${Math.round(weekly)} min/week vs target ${g.weeklyMinutes}.`,action:"Schedule shorter, more frequent sessions and enable reminders."});
 else if(weekly<g.weeklyMinutes)out.push({severity:"medium",area:"Engagement",title:"Close the weekly practice gap",why:`Average ${Math.round(weekly)} min/week.`,action:"Add one focused review block to the weekly plan."});
 if(snap.mistakeRate>30)out.push({severity:"high",area:"Accuracy",title:"Mistake recycling is too high",why:`Mistake signal is ${snap.mistakeRate}% of recorded practice events.`,action:"Route weak items to spaced review and reduce new-item load temporarily."});
 if(snap.completionRate<g.targetCompletion&&snap.practice>4)out.push({severity:"medium",area:"Completion",title:"Improve task completion",why:`Completion indicator is ${snap.completionRate}% vs target ${g.targetCompletion}%.`,action:"Shorten practice sets and surface Continue Learning more prominently."});
 if(snap.shadowAttempts>=2&&snap.avgShadow<70)out.push({severity:"medium",area:"Pronunciation",title:"Shadowing quality needs targeted work",why:`Average Shadowing score is ${Math.round(snap.avgShadow)}.`,action:"Focus on rhythm and pause matching before speed."});
 if(!out.length)out.push({severity:"good",area:"System",title:"Learning signals are within current thresholds",why:"No high-priority issue was detected in this window.",action:"Maintain the current cadence and review trends monthly."});
 return out
}
function metricTile(label,value,sub=""){return `<article class="liMetric"><span>${esc(label)}</span><b>${esc(String(value))}</b><small>${esc(sub)}</small></article>`}
function learningIntelligenceView(){
 if(!isSuperadmin())return show('<div class="feedback bad">Learning Intelligence is Superadmin-only.</div>');
 const cfg=learningIntelligenceStore();
 show(`<section class="learningIntelligencePage"><div class="sectionHead"><div><div class="eyebrow">SUPERADMIN · LEARNING INTELLIGENCE</div><h2>Measure → Feedback → Improve</h2><p class="muted">System-wide learning measurement with cohort filters, feedback signals and actionable improvement recommendations.</p></div><button id="liSettings">Targets</button></div>
 <section class="card liFilters"><label>Window<select id="liDays"><option value="7">7 days</option><option value="30" selected>30 days</option><option value="90">90 days</option><option value="365">1 year</option><option value="0">All time</option></select></label><label>Role<select id="liRole"><option value="*">All roles</option><option value="learner">Students</option><option value="teacher">Teachers</option><option value="business">Business</option></select></label><label>User<select id="liUser"><option value="">All users</option>${(userStore().users||[]).map(u=>`<option value="${u.id}">${esc(u.name||u.email||u.id)}</option>`).join("")}</select></label><button class="primary" id="liRefresh">Refresh</button></section>
 <div id="liBody"></div></section>`);
 const render=()=>{
  const snap=learningMetricSnapshot({days:Number($("#liDays").value),roleFilter:$("#liRole").value,userId:$("#liUser").value}),rec=learningRecommendations(snap),weekly=snap.days>0?snap.minutes/Math.max(1,snap.days/7):snap.minutes;
  $("#liBody").innerHTML=`<section class="liMetrics">${metricTile("Active users",snap.activeUsers,snap.days?`${snap.days}-day window`:"All time")}${metricTile("Active time",`${Math.round(snap.minutes)} min`,`${Math.round(weekly)} min/week`)}${metricTile("Practice signals",snap.practice,"Recorded activities")}${metricTile("Mistake rate",`${snap.mistakeRate}%`,"Lower is better")}${metricTile("Completion",`${snap.completionRate}%`,"Practice → completion")}${metricTile("Shadowing",snap.shadowAttempts?`${Math.round(snap.avgShadow)}/100`:"—",`${snap.shadowAttempts} attempts`)}</section>
  <section class="liDashboardGrid"><article class="card"><h3>Activity trend</h3>${learningActivityBars(snap,14)}</article><article class="card"><h3>Learning funnel</h3>${learningFunnel(snap)}</article></section>
  <section class="card liTelemetryNote"><b>Measurement coverage</b><p>Recommendations are computed from activity history, usage telemetry, mistakes/completions and Tina Shadowing attempts currently captured by the platform. Missing instrumentation produces conservative recommendations rather than invented metrics.</p></section>
  <section class="card"><div class="sectionHead compact"><div><h3>System Recommendations</h3><p class="muted">Prioritized from current behavioral and performance signals.</p></div></div><div class="liRecommendations">${rec.map((x,i)=>`<article class="liRecommendation ${x.severity}"><div><span>${esc(x.area)}</span><h4>${esc(x.title)}</h4><p>${esc(x.why)}</p></div><div class="liAction"><b>Recommended action</b><p>${esc(x.action)}</p><button data-li-track="${i}">Track Improvement</button></div></article>`).join("")}</div></section>
  ${learningImprovementBoard(cfg)}
  <section class="liDashboardGrid"><article class="card"><h3>Feedback Loop</h3><p class="muted">User feedback and issue signals already flow to the Superadmin Issue Desk. Learning Intelligence adds performance context so decisions are not based on complaints alone.</p><div class="list"><div class="row"><span>Open feedback / issues</span><b>${(workspace().communication?.issues||[]).filter(x=>!["resolved","closed"].includes(x.status)).length}</b></div><div class="row"><span>Shadowing attempts</span><b>${snap.shadowAttempts}</b></div><div class="row"><span>Recorded mistakes</span><b>${snap.mistakes}</b></div></div></article><article class="card"><h3>Measurement Framework</h3><div class="liFramework"><span>1. Engagement</span><span>2. Practice</span><span>3. Accuracy</span><span>4. Completion</span><span>5. Retention</span><span>6. Pronunciation</span><span>7. Feedback</span><span>8. Intervention</span></div></article></section>`;
  $$("[data-li-track]").forEach(b=>b.onclick=()=>{const x=rec[Number(b.dataset.liTrack)],c=learningIntelligenceStore();c.improvementActions.push({id:uid("improve"),area:x.area,title:x.title,why:x.why,action:x.action,status:"planned",ownerUserId:currentUserId(),createdAt:now(),updatedAt:now()});saveLearningIntelligence(c);render()});
  $$("[data-improve-status]").forEach(sel=>sel.onchange=()=>{const c=learningIntelligenceStore(),x=c.improvementActions.find(v=>v.id===sel.dataset.improveStatus);if(x){x.status=sel.value;x.updatedAt=now();saveLearningIntelligence(c);auditEvent("learning.improvement.status",{id:x.id,status:x.status});render()}});

 };
 $("#liRefresh").onclick=render;$("#liDays").onchange=render;$("#liRole").onchange=render;$("#liUser").onchange=render;
 $("#liSettings").onclick=()=>learningIntelligenceSettings();render()
}
function learningActivityBars(snap,days=14){
 const vals=[],labels=[];for(let i=days-1;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const key=d.toISOString().slice(0,10);labels.push(d.toLocaleDateString(undefined,{month:"numeric",day:"numeric"}));vals.push(snap.H.filter(x=>String(x.at||x.createdAt).slice(0,10)===key).length+snap.U.filter(x=>String(x.startedAt).slice(0,10)===key).length)}
 return simpleBars(vals,labels,Math.max(1,...vals))
}
function learningFunnel(s){
 const vals=[Math.max(s.sessions,s.practice),s.practice,s.completions,Math.max(0,s.practice-s.mistakes)],labels=["Sessions","Practice","Completed","Clean signals"];return simpleBars(vals,labels,Math.max(1,...vals))
}
function learningImprovementBoard(cfg){
 const rows=(cfg.improvementActions||[]).slice().reverse();
 return `<section class="card liImprovementBoard"><div class="sectionHead compact"><div><h3>Improvement Board</h3><p class="muted">Turn recommendations into tracked Superadmin actions.</p></div></div><div class="list">${rows.map(x=>`<div class="row"><div><b>${esc(x.title)}</b><small>${esc(x.area)} · ${esc(new Date(x.createdAt).toLocaleDateString())}</small><p>${esc(x.action)}</p></div><select data-improve-status="${x.id}">${["planned","in-progress","measuring","completed","rejected"].map(s=>`<option value="${s}" ${x.status===s?"selected":""}>${s}</option>`).join("")}</select></div>`).join("")||'<div class="empty">Track a recommendation to create the first improvement action.</div>'}</div></section>`
}
function learningIntelligenceSettings(){
 const s=learningIntelligenceStore(),g=s.goals;
 modal("Learning Intelligence Targets",`<div class="wsFormGrid">${textField("liWeekly","Target active minutes / week",String(g.weeklyMinutes))}${textField("liAccuracy","Target accuracy %",String(g.targetAccuracy))}${textField("liCompletion","Target completion %",String(g.targetCompletion))}</div><p class="muted">These thresholds drive Superadmin recommendations. They do not change learner scores.</p>`,`<button class="primary" id="liSettingsSave">Save Targets</button>`);
 $("#liSettingsSave").onclick=()=>{g.weeklyMinutes=Math.max(10,Number($("#liWeekly").value)||180);g.targetAccuracy=Math.min(100,Math.max(0,Number($("#liAccuracy").value)||80));g.targetCompletion=Math.min(100,Math.max(0,Number($("#liCompletion").value)||80));saveLearningIntelligence(s);closeModal();learningIntelligenceView()}
}

/* ---------- TINA SHADOWING ---------- */
let tinaShadowRecorder=null,tinaShadowChunks=[],tinaShadowRecordingStarted=0,tinaShadowRefBuffer=null,tinaShadowUserBuffer=null,tinaShadowStream=null;
function tinaShadowingView(){
 if(!["learner","superadmin"].includes(role()))return show('<div class="feedback bad">Tina Shadowing practice is available to Student and Superadmin preview.</div>');
 const s=shadowingStore(),sel=s.selectedId||s.library[0]?.id,item=s.library.find(x=>x.id===sel)||s.library[0];
 show(`<section class="shadowingPage"><div class="sectionHead"><div><div class="eyebrow">TINA SHADOWING</div><h2>Voice & Pronunciation Laboratory</h2><p class="muted">Reference media → record → waveform comparison → rubric-based feedback → targeted retry.</p></div>${isSuperadmin()?'<button class="primary" id="shadowNew">+ Reference</button>':""}</div>
 <section class="shadowingWorkspace">
  <aside class="card shadowLibrary"><div class="shadowLibraryHead"><b>Reference Library</b><span>${s.library.length}</span></div><input id="shadowSearch" placeholder="Search title, accent, tags…"><div id="shadowLibraryList">${shadowLibraryList(s,item?.id)}</div></aside>
  <main><section class="card shadowReference">${item?shadowReferencePanel(item):'<div class="empty"><h3>No shadowing reference yet.</h3><p>Superadmin can add an audio/video reference, transcript and rubric metadata.</p></div>'}</section>
  ${item?`<section class="card shadowPractice"><div class="sectionHead compact"><div><h3>Practice & Compare</h3><p class="muted">Use headphones. Record the same utterance as the reference.</p></div><span class="shadowRubricVersion">Rubric ${esc(s.settings.rubricVersion)}</span></div>
   <div class="wavePair"><div><div class="waveLabel"><b>Reference waveform</b><span id="refDuration">—</span></div><canvas id="shadowRefWave" width="900" height="150"></canvas></div><div><div class="waveLabel"><b>Your waveform</b><span id="userDuration">—</span></div><canvas id="shadowUserWave" width="900" height="150"></canvas></div></div>
   <div class="shadowControls"><button class="primary" id="shadowRecord">● Start Recording</button><button id="shadowStop" disabled>■ Stop</button><button id="shadowPlayMine" disabled>▶ My Recording</button><button id="shadowScore" disabled>Evaluate</button></div><details class="shadowRubric"><summary>Scoring rubric</summary><div><span><b>Timing 22%</b>Overall duration alignment</span><span><b>Rhythm 28%</b>Energy-envelope timing similarity</span><span><b>Energy 15%</b>Relative vocal intensity</span><span><b>Pauses 18%</b>Phrase-boundary silence pattern</span><span><b>Waveform 17%</b>Normalized acoustic-envelope similarity</span><span class="pending"><b>Segmental pronunciation</b>Requires ASR/pronunciation service for phoneme-level scoring</span></div></details><audio id="shadowMineAudio" controls hidden></audio><div id="shadowEvaluation"></div></section>`:""}
  </main>
 </section></section>`);
 if(isSuperadmin())$("#shadowNew").onclick=()=>shadowReferenceEditor();
 $("#shadowSearch").oninput=e=>{const q=e.target.value.toLowerCase();$("#shadowLibraryList").innerHTML=shadowLibraryList(s,item?.id,q);bindShadowLibrary()};
 bindShadowLibrary();
 if(item)bindShadowPractice(item)
}
function shadowLibraryList(s,selected,q=""){
 const list=s.library.filter(x=>!q||JSON.stringify([x.title,x.accent,x.tags,x.transcript]).toLowerCase().includes(q));
 return list.length?list.map(x=>`<button class="shadowLibraryItem ${x.id===selected?"active":""}" data-shadow-id="${x.id}"><b>${esc(x.title)}</b><small>${esc(x.accent||"General English")} · ${esc(x.level||"All levels")}</small><span>${esc((x.tags||[]).join(" · "))}</span></button>`).join(""):'<div class="empty">No matching references.</div>'
}
function bindShadowLibrary(){
 $$("[data-shadow-id]").forEach(b=>b.onclick=()=>{const s=shadowingStore();s.selectedId=b.dataset.shadowId;saveShadowing(s);tinaShadowingView()})
}
function shadowReferencePanel(x){
 const media=x.mediaUrl?x.mediaType==="video"?`<video id="shadowReferenceMedia" src="${esc(x.mediaUrl)}" controls crossorigin="anonymous"></video>`:`<audio id="shadowReferenceMedia" src="${esc(x.mediaUrl)}" controls crossorigin="anonymous"></audio>`:'<div class="shadowNoMedia">No media attached.</div>';
 return `<div class="shadowRefHeader"><div><div class="eyebrow">${esc(x.level||"SHADOWING")}</div><h3>${esc(x.title)}</h3><p>${esc(x.description||"")}</p></div>${isSuperadmin()?`<button id="shadowEditRef">Edit</button>`:""}</div>${media}<div class="shadowTranscript"><span>Target transcript</span><p>${esc(x.transcript||"No transcript entered.")}</p></div><div class="shadowMeta">${["accent","speaker","speed","focus"].filter(k=>x[k]).map(k=>`<span><b>${esc(k)}</b>${esc(x[k])}</span>`).join("")}</div>`
}
async function bindShadowPractice(item){
 $("#shadowEditRef")?.addEventListener("click",()=>shadowReferenceEditor(item.id));
 const media=$("#shadowReferenceMedia");if(media){media.addEventListener("loadedmetadata",()=>$("#refDuration").textContent=isFinite(media.duration)?`${media.duration.toFixed(1)}s`:"—");try{await loadShadowReferenceBuffer(item.mediaUrl)}catch{}}
 $("#shadowRecord").onclick=()=>startShadowRecording(item);$("#shadowStop").onclick=stopShadowRecording;$("#shadowScore").onclick=()=>evaluateShadowAttempt(item);$("#shadowPlayMine").onclick=()=>$("#shadowMineAudio")?.play()
}
function shadowReferenceEditor(id=null){
 if(!isSuperadmin())return;const s=shadowingStore(),x=id?s.library.find(v=>v.id===id):{};
 modal(id?"Edit Shadowing Reference":"New Shadowing Reference",`<div class="wsFormGrid">${textField("shTitle","Title",x.title||"")}${selectField("shLevel","Level",["Pre-A1","A1","A2","B1","B2","C1","C2","CPE 230/230"],x.level||"B2")}${selectField("shMediaType","Media type",["audio","video"],x.mediaType||"audio")}${textField("shMediaUrl","Audio / video URL",x.mediaUrl||"")}${textField("shAccent","Accent / variety",x.accent||"General English")}${textField("shSpeaker","Speaker",x.speaker||"")}${textField("shSpeed","Speech speed",x.speed||"Natural")}${textField("shFocus","Primary focus",x.focus||"Rhythm & connected speech")}${textField("shTags","Tags",(x.tags||[]).join(", "))}${areaField("shTranscript","Target transcript",x.transcript||"")}${areaField("shDescription","Notes / teaching focus",x.description||"")}</div><label class="fileButton">Upload source media<input id="shMediaFile" type="file" accept="audio/*,video/*"></label><p class="muted">When Tina backend is available, uploaded media is stored durably. Otherwise use a stable URL.</p>`,`<button class="primary" id="shSave">Save Reference</button>`);
 $("#shSave").onclick=async()=>{const title=$("#shTitle").value.trim(),transcript=$("#shTranscript").value.trim();if(!title)return alert("Title is required.");let mediaUrl=$("#shMediaUrl").value.trim(),mediaType=$("#shMediaType").value;if(mediaUrl&&!/^(https?:|blob:|data:|\/)/i.test(mediaUrl))return alert("Use a valid http(s), local, blob or data media URL.");const file=$("#shMediaFile").files?.[0];if(file){mediaType=file.type.startsWith("video/")?"video":"audio";if(window.TinaBackend?.available){try{const m=await window.TinaBackend.uploadMedia(file);mediaUrl=m.url}catch(e){return alert("Media upload failed: "+e.message)}}else mediaUrl=URL.createObjectURL(file)}const rec=id?x:{id:uid("shadow-ref"),createdAt:now()};Object.assign(rec,{title,level:$("#shLevel").value,mediaType,mediaUrl,accent:$("#shAccent").value.trim(),speaker:$("#shSpeaker").value.trim(),speed:$("#shSpeed").value.trim(),focus:$("#shFocus").value.trim(),tags:$("#shTags").value.split(",").map(v=>v.trim()).filter(Boolean),transcript,description:$("#shDescription").value.trim(),updatedAt:now()});if(!id)s.library.push(rec);s.selectedId=rec.id;saveShadowing(s);auditEvent("shadowing.reference.saved",{id:rec.id,title:rec.title});closeModal();tinaShadowingView()}
}
async function loadShadowReferenceBuffer(url){
 tinaShadowRefBuffer=null;if(!url)return null;const r=await fetch(url);if(!r.ok)throw new Error("reference fetch failed");const ab=await r.arrayBuffer(),ctx=new (window.AudioContext||window.webkitAudioContext)();tinaShadowRefBuffer=await ctx.decodeAudioData(ab.slice(0));drawWaveform($("#shadowRefWave"),tinaShadowRefBuffer);$("#refDuration").textContent=`${tinaShadowRefBuffer.duration.toFixed(1)}s`;ctx.close();return tinaShadowRefBuffer
}
async function startShadowRecording(item){
 if(!navigator.mediaDevices?.getUserMedia)return alert("Microphone recording is unavailable in this browser.");
 try{
  tinaShadowStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});tinaShadowChunks=[];tinaShadowRecorder=new MediaRecorder(tinaShadowStream);tinaShadowRecordingStarted=Date.now();
  tinaShadowRecorder.ondataavailable=e=>{if(e.data.size)tinaShadowChunks.push(e.data)};tinaShadowRecorder.onstop=async()=>{const blob=new Blob(tinaShadowChunks,{type:tinaShadowRecorder.mimeType||"audio/webm"}),url=URL.createObjectURL(blob),a=$("#shadowMineAudio");a.src=url;a.hidden=false;$("#shadowPlayMine").disabled=false;$("#shadowScore").disabled=false;try{const ab=await blob.arrayBuffer(),ctx=new (window.AudioContext||window.webkitAudioContext)();tinaShadowUserBuffer=await ctx.decodeAudioData(ab.slice(0));drawWaveform($("#shadowUserWave"),tinaShadowUserBuffer);$("#userDuration").textContent=`${tinaShadowUserBuffer.duration.toFixed(1)}s`;ctx.close()}catch(e){console.warn(e)}};
  tinaShadowRecorder.start();$("#shadowRecord").disabled=true;$("#shadowStop").disabled=false;$("#shadowEvaluation").innerHTML='<div class="feedback warn">Recording… shadow the reference as closely as possible.</div>';auditEvent("shadowing.recording.started",{referenceId:item.id})
 }catch(e){alert("Microphone permission failed: "+e.message)}
}
function stopShadowRecording(){
 if(tinaShadowRecorder&&tinaShadowRecorder.state!=="inactive")tinaShadowRecorder.stop();tinaShadowStream?.getTracks?.().forEach(t=>t.stop());$("#shadowRecord").disabled=false;$("#shadowStop").disabled=true
}
function drawWaveform(canvas,buffer){
 if(!canvas||!buffer)return;const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height,data=buffer.getChannelData(0),step=Math.max(1,Math.floor(data.length/w));ctx.clearRect(0,0,w,h);ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue("--card")||"#fff";ctx.fillRect(0,0,w,h);ctx.strokeStyle="#D71920";ctx.lineWidth=1.5;ctx.beginPath();for(let x=0;x<w;x++){let min=1,max=-1;for(let i=0;i<step;i++){const v=data[x*step+i]||0;if(v<min)min=v;if(v>max)max=v}ctx.moveTo(x,(1+min)*h/2);ctx.lineTo(x,(1+max)*h/2)}ctx.stroke();ctx.strokeStyle="rgba(17,17,17,.12)";ctx.beginPath();ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.stroke()
}
function shadowEnvelope(buffer,bins=120){
 if(!buffer)return[];const d=buffer.getChannelData(0),step=Math.max(1,Math.floor(d.length/bins)),out=[];for(let b=0;b<bins;b++){let s=0,n=0;for(let i=b*step;i<Math.min(d.length,(b+1)*step);i++){s+=Math.abs(d[i]);n++}out.push(n?s/n:0)}const mx=Math.max(...out,.0001);return out.map(v=>v/mx)
}
function envelopeCorrelation(a,b){
 if(!a.length||!b.length)return 0;const n=Math.min(a.length,b.length),aa=a.slice(0,n),bb=b.slice(0,n),ma=aa.reduce((x,y)=>x+y,0)/n,mb=bb.reduce((x,y)=>x+y,0)/n;let num=0,da=0,db=0;for(let i=0;i<n;i++){const x=aa[i]-ma,y=bb[i]-mb;num+=x*y;da+=x*x;db+=y*y}return da&&db?Math.max(-1,Math.min(1,num/Math.sqrt(da*db))):0
}
function bufferRms(buffer){if(!buffer)return 0;const d=buffer.getChannelData(0),step=Math.max(1,Math.floor(d.length/50000));let s=0,n=0;for(let i=0;i<d.length;i+=step){s+=d[i]*d[i];n++}return Math.sqrt(s/Math.max(1,n))}
function pauseRatio(env,threshold=.12){return env.length?env.filter(v=>v<threshold).length/env.length:0}
async function shadowSpeechTranscript(expected){
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR||!expected)return{available:false,score:null,text:""};
 return new Promise(resolve=>{const r=new SR();r.lang="en-US";r.interimResults=false;r.maxAlternatives=1;let done=false;const finish=x=>{if(done)return;done=true;resolve(x)};r.onresult=e=>{const text=e.results?.[0]?.[0]?.transcript||"";finish({available:true,score:textSimilarity(expected,text),text})};r.onerror=()=>finish({available:false,score:null,text:""});r.onend=()=>finish({available:false,score:null,text:""});try{r.start();setTimeout(()=>{try{r.stop()}catch{}},6500)}catch{finish({available:false,score:null,text:""})}})
}
function textSimilarity(a,b){
 const norm=x=>String(x).toLowerCase().replace(/[^\p{L}\p{N}\s']/gu," ").split(/\s+/).filter(Boolean),A=norm(a),B=norm(b);if(!A.length||!B.length)return 0;const counts={};B.forEach(x=>counts[x]=(counts[x]||0)+1);let hit=0;A.forEach(x=>{if(counts[x]){hit++;counts[x]--}});return Math.round(100*hit/Math.max(A.length,B.length))
}
async function evaluateShadowAttempt(item){
 if(!tinaShadowUserBuffer)return alert("Record your voice first.");
 $("#shadowEvaluation").innerHTML='<div class="feedback warn">Analyzing acoustic timing, rhythm, energy and pauses…</div>';
 const ref=tinaShadowRefBuffer,user=tinaShadowUserBuffer,re=shadowEnvelope(ref),ue=shadowEnvelope(user),corr=ref?envelopeCorrelation(re,ue):0,durScore=ref?Math.max(0,100-Math.abs(user.duration-ref.duration)/Math.max(.1,ref.duration)*120):65,rhythm=ref?Math.max(0,Math.round((corr+1)/2*100)):65,energy=ref?Math.max(0,100-Math.abs(bufferRms(user)-bufferRms(ref))/Math.max(.02,bufferRms(ref))*80):70,pause=ref?Math.max(0,100-Math.abs(pauseRatio(ue)-pauseRatio(re))*180):65,wave=ref?Math.max(0,Math.round((corr+1)/2*100)):65;
 let intel={available:false,score:null,text:""}; // Web Speech cannot reliably score an already-finished recording across browsers.
 const timing=Math.round(durScore),scores={timing,rhythm:Math.round(rhythm),energy:Math.round(energy),pauses:Math.round(pause),waveform:Math.round(wave),intelligibility:intel.score};
 const overall=Math.round(scores.timing*.22+scores.rhythm*.28+scores.energy*.15+scores.pauses*.18+scores.waveform*.17),feedback=shadowFeedback(scores);
 const metrics={referenceDuration:ref?.duration||null,userDuration:user.duration,durationDelta:ref?user.duration-ref.duration:null,waveformCorrelation:ref?corr:null,referenceRms:ref?bufferRms(ref):null,userRms:bufferRms(user),referencePauseRatio:ref?pauseRatio(re):null,userPauseRatio:pauseRatio(ue)};
 const s=shadowingStore(),attempt={id:uid("shadow-attempt"),referenceId:item.id,userId:currentUserId(),createdAt:now(),duration:user.duration,score:{...scores,overall},metrics,feedback,rubricVersion:s.settings.rubricVersion};s.attempts.push(attempt);saveShadowing(s);auditEvent("shadowing.attempt.evaluated",{referenceId:item.id,overall});
 $("#shadowEvaluation").innerHTML=shadowEvaluationHtml(attempt,item);$("#shadowRetry")?.addEventListener("click",()=>{tinaShadowUserBuffer=null;$("#shadowEvaluation").innerHTML="";$("#shadowUserWave")?.getContext("2d")?.clearRect(0,0,900,150);$("#shadowScore").disabled=true;$("#shadowPlayMine").disabled=true})
}
function shadowFeedback(sc){
 const arr=[];if(sc.timing<75)arr.push("Match the reference duration before increasing speed.");if(sc.rhythm<75)arr.push("Shadow stress groups and syllable timing, not individual words.");if(sc.pauses<75)arr.push("Copy pause locations and phrase boundaries more precisely.");if(sc.energy<70)arr.push("Keep vocal energy and prominence closer to the reference.");if(sc.waveform<70)arr.push("Repeat short chunks and align onset/offset with the reference waveform.");if(!arr.length)arr.push("Strong acoustic match. Move to a longer passage or slightly faster reference.");return arr
}
function shadowEvaluationHtml(a,item){
 const s=a.score;return `<section class="shadowResult"><div class="shadowScoreRing" style="--score:${s.overall}"><div><b>${s.overall}</b><span>/100</span></div></div><div class="shadowResultBody"><div class="shadowScoreGrid">${[["Timing",s.timing],["Rhythm",s.rhythm],["Energy",s.energy],["Pauses",s.pauses],["Waveform",s.waveform]].map(([n,v])=>`<div><span>${n}</span><b>${v}</b><i><em style="width:${v}%"></em></i></div>`).join("")}</div><div class="shadowCoach"><h4>Targeted feedback</h4>${a.feedback.map(x=>`<p>• ${esc(x)}</p>`).join("")}<div class="shadowRawMetrics">${a.metrics?.durationDelta!=null?`<span>Duration Δ <b>${a.metrics.durationDelta>=0?"+":""}${a.metrics.durationDelta.toFixed(2)}s</b></span>`:""}${a.metrics?.waveformCorrelation!=null?`<span>Envelope correlation <b>${a.metrics.waveformCorrelation.toFixed(2)}</b></span>`:""}${a.metrics?.userPauseRatio!=null?`<span>Your pause ratio <b>${Math.round(a.metrics.userPauseRatio*100)}%</b></span>`:""}</div><small>Acoustic scores are browser-side similarity indicators, not phoneme-level pronunciation certification. For production phoneme scoring, connect an ASR/pronunciation assessment service.</small></div><button class="primary" id="shadowRetry">Retry this reference</button></div></section>`
}
function shadowTeacherCanViewLearner(userId){
 if(role()==="superadmin")return true;if(role()!=="teacher")return false;
 const me=currentUserId(),w=workspace(),classes=w.teacher?.classes||[];
 if(classes.some(c=>(!c.teacherId||c.teacherId===me||(c.teacherIds||[]).includes(me))&&(c.members||[]).includes(userId)))return true;
 const myOrg=organizationForUser?.(me),learnerOrg=organizationForUser?.(userId);return !!(myOrg&&learnerOrg&&myOrg.id===learnerOrg.id)
}
function shadowingInsightsView(){
 if(!["teacher","superadmin"].includes(role()))return show('<div class="feedback bad">Shadowing Insights is available to Teacher and Superadmin.</div>');
 const s=shadowingStore(),users=userStore().users||[],attempts=s.attempts.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)),filtered=role()==="teacher"?attempts.filter(a=>shadowTeacherCanViewLearner(a.userId)):attempts;
 const byUser={};filtered.forEach(a=>(byUser[a.userId]??=[]).push(a));
 show(`<section><div class="sectionHead"><div><div class="eyebrow">SHADOWING INSIGHTS</div><h2>Learner Voice Progress</h2><p class="muted">Review attempts, score trends and recurring acoustic weaknesses.</p></div></div><section class="card"><div class="list">${Object.entries(byUser).map(([uid,arr])=>{const u=users.find(x=>x.id===uid),avg=Math.round(arr.reduce((n,x)=>n+x.score.overall,0)/arr.length),latest=arr[0];return `<div class="row"><div><b>${esc(u?.name||u?.email||uid)}</b><small>${arr.length} attempts · latest ${new Date(latest.createdAt).toLocaleDateString()}</small></div><div class="shadowInsightScores"><b>${avg}/100 avg</b><span>Timing ${Math.round(arr.reduce((n,x)=>n+x.score.timing,0)/arr.length)}</span><span>Rhythm ${Math.round(arr.reduce((n,x)=>n+x.score.rhythm,0)/arr.length)}</span><span>Pauses ${Math.round(arr.reduce((n,x)=>n+x.score.pauses,0)/arr.length)}</span></div></div>`}).join("")||'<div class="empty">No Shadowing attempts yet.</div>'}</div></section></section>`)
}

/* ---------- ROLE-AWARE HOME / VISIBILITY ---------- */
function enforceRoleView(){
 const r=role();
 document.documentElement.dataset.role=r;
 $$("[data-v14-extra]").forEach(b=>b.style.display="none");
 const footer=document.querySelector("footer");if(footer)footer.dataset.role=r;
}

window.addEventListener("tina:app-rendered",e=>setTimeout(()=>{
  if(!session()&&!isAdmin()){openRoleEntry();return}
  if(!enforceLoginIntent())return;
  enforceRoleView();
  installRoleGroupedNav();
  installRoleSidebar();
  installRoleHistoryBridge();
  renderManagedFooter();
  normalizeRoleChromeGeometry();
  enforceSuperadminAcademyBoundary();
  augmentView(e.detail?.view||"");
  ensureSuperadminHomeAccessButtons();
  applyManagementPageChrome();
},25));
document.addEventListener("DOMContentLoaded",()=>{setTimeout(()=>{
  installMobileNav();
  if(!session()&&!isAdmin()){openRoleEntry();return}
  if(!enforceLoginIntent())return;
  enforceRoleView();installRoleGroupedNav();installRoleSidebar();installRoleHistoryBridge();renderManagedFooter();applyManagementPageChrome();enforceSuperadminAcademyBoundary();if((base().view||"home")==="home"&&["teacher","business","admin","superadmin"].includes(role()))roleLandingView();else augmentView(base().view||"home");ensureSuperadminHomeAccessButtons();
},450)});

/* ---------- CROSS-RUNTIME SUPERADMIN BRIDGE ---------- */
window.TinaSuperadmin = Object.freeze({
  openLogin: superadminLoginPortal,
  openDashboard: superadminDashboard,
  openHealth: systemHealthView,
  openUsers: roleManagementView,
  openPermissions: userPermissionMatrixView,
  openActivity: activityHistoryView,
  openInterfaces: interfaceStudioView,
  openAppInterface: appInterfaceStudioView,
  isSuperadmin
});
window.dispatchEvent(new CustomEvent("tina:superadmin-ready"));

window.addEventListener("tina:request-superadmin-login",()=>superadminLoginPortal());



function installContentProtection(){
 const formTarget=t=>!!t.closest("input,textarea,select,[contenteditable='true']");
 document.addEventListener("copy",e=>{if(formTarget(e.target)||isSuperadmin())return;e.preventDefault()},true);
 document.addEventListener("cut",e=>{if(formTarget(e.target)||isSuperadmin())return;e.preventDefault()},true);
 document.addEventListener("contextmenu",e=>{if(formTarget(e.target)||isSuperadmin())return;e.preventDefault()},true);
 document.addEventListener("dragstart",e=>{if(formTarget(e.target)||isSuperadmin())return;e.preventDefault()},true);
 document.addEventListener("keydown",e=>{if(formTarget(e.target)||isSuperadmin())return;const k=e.key.toLowerCase();if((e.ctrlKey||e.metaKey)&&["c","x","s","p","u"].includes(k))e.preventDefault()},true);
}


function syncFixedChromeGeometry(){
 const top=document.querySelector(".topbar"),foot=document.querySelector(".tinaFooter"),side=$("#roleSidebar");
 const topH=Math.max(56,Math.ceil(top?.getBoundingClientRect?.().height||64));
 const footH=Math.max(54,Math.ceil(foot?.getBoundingClientRect?.().height||64));
 const available=Math.max(180,window.innerHeight-topH-footH);
 const root=document.documentElement;
 root.style.setProperty("--tina-shell-header",`${topH}px`);
 root.style.setProperty("--tina-shell-footer",`${footH}px`);
 root.style.setProperty("--tina-shell-header-live",`${topH}px`);
 root.style.setProperty("--tina-shell-footer-live",`${footH}px`);
 if(side){
   side.style.setProperty("top",`${topH}px`,"important");
   side.style.setProperty("bottom","auto","important");
   side.style.setProperty("height",`${available}px`,"important");
   side.style.setProperty("min-height",`${available}px`,"important");
   side.style.setProperty("max-height",`${available}px`,"important");
   side.style.setProperty("overflow","hidden","important");
   const groups=side.querySelector(".roleSidebarGroups");
   const head=side.querySelector(".roleSidebarTop");
   if(groups){
     const headH=Math.ceil(head?.getBoundingClientRect?.().height||0);
     const menuH=Math.max(100,available-headH);
     groups.style.setProperty("height",`${menuH}px`,"important");
     groups.style.setProperty("max-height",`${menuH}px`,"important");
     groups.style.setProperty("min-height","0","important");
     groups.style.setProperty("overflow-y","auto","important");
     groups.style.setProperty("overflow-x","hidden","important");
   }
 }
}
window.addEventListener("resize",()=>requestAnimationFrame(syncFixedChromeGeometry),{passive:true});
window.addEventListener("load",()=>setTimeout(syncFixedChromeGeometry,60),{once:true});
document.addEventListener("tina:font-scale-changed",()=>requestAnimationFrame(syncFixedChromeGeometry));

function stabilizeInteractiveRuntime(){
 installDataStandardsRuntime();normalizeRoleChromeGeometry();renderManagedFooter();syncFixedChromeGeometry();refreshSidebarBadges();updateRoleHistoryButtons();
 const side=$("#roleSidebar");if(side){side.style.pointerEvents="auto";syncFixedChromeGeometry()}
}
document.addEventListener("tina:workspace-view-rendered",()=>requestAnimationFrame(()=>{stabilizeInteractiveRuntime();syncFixedChromeGeometry()}));
window.addEventListener("tina:admin-login-complete",()=>setTimeout(()=>{document.documentElement.classList.remove("authSurfaceActive");enforceRoleView();installRoleGroupedNav();installRoleSidebar();renderManagedFooter();installRoleHistoryBridge();normalizeRoleChromeGeometry();roleTargetOpen("admin-v14");stabilizeInteractiveRuntime()},0));

window.TinaWorkspaceActions=Object.freeze({
 logout:logoutCurrentAccount,
 roleLanding:roleLandingView,
 openRoleEntry,
 reminders:reminderCenterView,
 announcements:announcementCenterView,
 adminReview:adminReviewEscalationView,
 adminEditing:adminEditingStudio,
 users:roleManagementView,
 settings:enhancedSettingsView,
 library:libraryView,
 theme:themeStudioView
});
installUsageTracking();
installSystemQAMonitor();
installReminderNotifications();
installWordTools();
installTinaDictionaryShortcuts();
installDataStandardsRuntime();
window.addEventListener("tina:learning-complete",e=>{const d=e.detail||{};if(d.kind==="course")window.TinaLearningEvidence?.completeCourse?.(d.id,d);else window.TinaLearningEvidence?.completeLesson?.(d.id,d)});
/* Automatic onboarding disabled. Quick Tour remains available manually. */

installContentProtection();seedSuperadmin();migrateAdminAuthorityPolicy();installSuperadminEntryLink();installActivityAudit();installAdminOperationFailsafe();enforceLevelCatalog();
// V14 FINAL — guarantee role chooser is the first unauthenticated screen.
// Keep these calls inside the workspace IIFE because forceRoleLoginGate is scoped here.
setTimeout(forceRoleLoginGate,0);
setTimeout(forceRoleLoginGate,80);

document.addEventListener("click",e=>{const b=e.target.closest("#themeBtn");if(!b)return;if(session()||isAdmin()){e.preventDefault();e.stopImmediatePropagation();themeStudioView()}},true);
})();


/* TINA_V14_DISPOSABLE_QA_RESIDUAL_CLOSURE
 *
 * Reserved QA objects use IDs/identities beginning "__tina_test__".
 * Purge only that namespace.  Human-created content is never filtered merely
 * because its title/body contains test-like words.
 */
(()=>{
  const QA_PREFIX="__tina_test__";

  const qaIdentity=v=>
    typeof v==="string" &&
    v.startsWith(QA_PREFIX);

  const containsQaIdentity=obj=>{
    if(!obj||typeof obj!=="object")return false;

    return [
      obj.id,
      obj.userId,
      obj.user_id,
      obj.username,
      obj.email,
      obj.organizationId,
      obj.organization_id,
      obj.classId,
      obj.class_id,
      obj.assignmentId,
      obj.assignment_id
    ].some(qaIdentity);
  };

  const clean=value=>{
    if(Array.isArray(value)){
      return value
        .filter(item=>!containsQaIdentity(item))
        .map(clean);
    }

    if(value&&typeof value==="object"){
      if(containsQaIdentity(value)){
        return undefined;
      }

      const out={};

      for(const [key,item] of Object.entries(value)){
        const next=clean(item);

        if(next!==undefined){
          out[key]=next;
        }
      }

      return out;
    }

    return value;
  };

  const purge=()=>{
    let changed=0;

    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);

      if(!key)continue;

      const raw=localStorage.getItem(key);

      if(
        !raw ||
        !raw.includes(QA_PREFIX)
      ){
        continue;
      }

      try{
        const parsed=JSON.parse(raw);
        const cleaned=clean(parsed);
        const next=JSON.stringify(cleaned);

        if(next!==raw){
          localStorage.setItem(key,next);
          changed++;
        }
      }catch{
        /*
         * Never rewrite arbitrary non-JSON localStorage values.
         * Disposable QA stores are JSON.
         */
      }
    }

    if(changed){
      console.info(
        "[Tina v14] Disposable QA residual state removed:",
        changed
      );
    }

    return changed;
  };

  /*
   * Immediate cleanup handles an existing production browser.
   * pageshow handles restored browser sessions without a polling loop.
   * No MutationObserver and no automatic reload are introduced.
   */
  try{
    purge();
  }catch{}

  window.addEventListener(
    "pageshow",
    ()=>{
      try{purge()}catch{}
    },
    {passive:true}
  );

  window.TinaDisposableQaClosure={
    purge,
    prefix:QA_PREFIX
  };
})();
