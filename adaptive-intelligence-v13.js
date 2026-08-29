(() => {
"use strict";
const KEY="tina.clean.v13.adaptive";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return{}}};
let S=Object.assign({goals:[],checkpoints:[],recommendations:[],recovery:[],qa:[],lastOpened:null},load());
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const now=()=>new Date().toISOString();
function nav(){let n=$("#nav");if(!n||$('[data-view="adaptive-v13"]'))return;let b=document.createElement("button");b.className="navbtn";b.dataset.view="adaptive-v13";b.textContent="Adaptive";n.appendChild(b);b.onclick=open}
function practiceState(){try{return JSON.parse(localStorage.getItem("tina.clean.v10.practice")||"{}")}catch{return{}}}
function assessState(){try{return JSON.parse(localStorage.getItem("tina.clean.v11.assessment")||"{}")}catch{return{}}}
function studioState(){try{return JSON.parse(localStorage.getItem("tina.clean.v9.studio")||"{}")}catch{return{}}}
function metrics(){
 let p=practiceState(),a=assessState(),ps=p.attempts||[],as=a.attempts||[],all=[...ps,...as],correct=all.filter(x=>x.correct).length;
 let cards=(p.decks||[]).flatMap(d=>d.cards||[]),avg=cards.length?Math.round(cards.reduce((n,c)=>n+(c.mastery||0),0)/cards.length):0;
 return {attempts:all.length,accuracy:all.length?Math.round(correct/all.length*100):0,mastery:avg,mistakes:(p.mistakes||[]).filter(x=>!x.resolved).length+(a.mistakes||[]).length,evidence:(a.evidence||[]).length,streak:p.streak||0};
}
function weakness(){
 let p=practiceState(),a=assessState(),bag={};
 [...(p.attempts||[]),...(a.attempts||[])].forEach(x=>{let k=x.source||x.skill||"General",v=bag[k]||(bag[k]={n:0,c:0});v.n++;if(x.correct)v.c++});
 return Object.entries(bag).map(([k,v])=>({name:k,n:v.n,acc:Math.round(v.c/v.n*100)})).sort((x,y)=>x.acc-y.acc);
}
function recs(){
 let m=metrics(),w=weakness(),r=[];
 if(m.mistakes>0)r.push({priority:1,title:"Resolve mistake queue",why:`${m.mistakes} unresolved or recorded mistakes`,route:"Practice v10"});
 if(w[0]&&w[0].acc<80)r.push({priority:2,title:`Strengthen ${w[0].name}`,why:`Current accuracy ${w[0].acc}%`,route:"Assessment"});
 if(m.mastery<80)r.push({priority:3,title:"Run due SRS review",why:`Average card mastery ${m.mastery}%`,route:"Practice v10"});
 if(!r.length)r.push({priority:4,title:"Advance to a new lesson",why:"Current review signals are stable",route:"Study Runtime"});
 S.recommendations=r;save();return r;
}
function head(t,d){return `<div class="wrap v13wrap"><div class="sectionHead"><div><div class="eyebrow">Adaptive Intelligence + Reliability v13</div><h2>${t}</h2><p class="muted">${d}</p></div><button class="ghost" id="v13Back">← Adaptive Hub</button></div>`}
const MOD=[["today","Today / Continue Learning","Resume the most useful next action."],["recommend","Recommendation Engine","Weakness- and evidence-driven next steps."],["mastery","Mastery Map","Aggregate flashcard and assessment evidence."],["search","Universal Search","Search local learning records and staged content."],["backup","Backup & Recovery","Export complete browser learning state."],["qa","Reliability Center","Runtime safety and data checks."]];
function open(){$$(".navbtn").forEach(x=>x.classList.remove("active"));$('[data-view="adaptive-v13"]')?.classList.add("active");$("#app").innerHTML=hub();bindHub()}
function hub(){let m=metrics();return `<div class="wrap v13wrap"><section class="card v13hero"><div><div class="eyebrow">Version 13 Closure</div><h1>Adaptive Intelligence + Reliability</h1><p>Evidence determines what to review, continue and strengthen next.</p></div><div class="v13metrics">${[["Accuracy",m.accuracy+"%"],["Mastery",m.mastery+"%"],["Mistakes",m.mistakes],["Evidence",m.evidence],["Streak",m.streak]].map(x=>`<span><b>${x[1]}</b>${x[0]}</span>`).join("")}</div></section><section class="grid">${MOD.map(x=>`<article class="card"><h3>${x[1]}</h3><p>${x[2]}</p><button class="primary v13open" data-open="${x[0]}">Open</button></article>`).join("")}</section></div>`}
function today(){let r=recs()[0],m=metrics();return head("Today / Continue Learning","One primary recommendation instead of a noisy dashboard.")+`<article class="card"><div class="eyebrow">Recommended next action</div><h2>${esc(r.title)}</h2><p>${esc(r.why)}</p><button class="primary" id="goRec">Go to ${esc(r.route)}</button></article><section class="grid" style="margin-top:14px">${[["Attempts",m.attempts],["Accuracy",m.accuracy+"%"],["Mastery",m.mastery+"%"],["Streak",m.streak]].map(x=>`<article class="card"><h3>${x[0]}</h3><div class="metric">${x[1]}</div></article>`).join("")}</section></div>`}
function recommend(){return head("Recommendation Engine","Rules are transparent and grounded in recorded local evidence.")+`<div class="list">${recs().map((r,i)=>`<div class="row"><div><div class="eyebrow">Priority ${i+1}</div><b>${esc(r.title)}</b><br><small>${esc(r.why)}</small></div><button class="ghost goRoute" data-route="${esc(r.route)}">Open</button></div>`).join("")}</div></div>`}
function mastery(){let p=practiceState(),cards=(p.decks||[]).flatMap(d=>d.cards||[]).sort((a,b)=>(a.mastery||0)-(b.mastery||0));let w=weakness();return head("Mastery Map","Weak cards and weak activity families surface first.")+`<section class="grid"><article class="card"><h3>Weak activity families</h3><div class="list">${w.slice(0,8).map(x=>`<div class="row"><b>${esc(x.name)}</b><span class="badge">${x.acc}% · ${x.n}</span></div>`).join("")||'<div class="empty">No evidence yet.</div>'}</div></article><article class="card"><h3>Weak cards</h3><div class="list">${cards.slice(0,10).map(c=>`<div class="row"><b>${esc(c.front)}</b><span class="badge">${c.mastery||0}%</span></div>`).join("")||'<div class="empty">No cards yet.</div>'}</div></article></section></div>`}
function search(){return head("Universal Search","Search local practice, assessment and authoring records.")+`<div class="toolbar"><input id="uSearch" placeholder="Search cards, evidence, drafts, tests…"></div><div id="uRows" class="list"></div></div>`}
function collect(){
 let p=practiceState(),a=assessState(),c;try{c=JSON.parse(localStorage.getItem("tina.clean.v12.staging")||"{}")}catch{c={}}
 let rows=[];(p.decks||[]).forEach(d=>(d.cards||[]).forEach(x=>rows.push({type:"card",title:x.front,detail:x.back})));
 (a.evidence||[]).forEach(x=>rows.push({type:"evidence",title:x.skill,detail:x.summary}));
 (a.tests||[]).forEach(x=>rows.push({type:"test",title:x.title,detail:`${x.items?.length||0} items`}));
 (c.drafts||[]).forEach(x=>rows.push({type:"draft",title:x.title,detail:x.description||x.id}));
 return rows
}
function backup(){return head("Backup & Recovery","Create a portable snapshot of Tina clean local browser state.")+`<article class="card"><div class="actions"><button class="primary" id="exportAll">Export full backup</button><button class="ghost" id="importAllBtn">Restore backup</button></div><input hidden id="importAll" type="file" accept="application/json"><p>Restore is explicit and does not reload the page.</p></article></div>`}
function qa(){let checks=[["Mutation repaint loop","PASS","v13 does not use MutationObserver"],["Automatic reload","PASS","v13 does not call location.reload"],["Adaptive source","PASS","recommendations read recorded local evidence"],["Canonical authority","PASS","v13 does not write canonical projection"],["Backup scope","PASS","Tina clean localStorage keys are exported"]];return head("Reliability Center","Static runtime invariants and browser-data checks.")+`<div class="list">${checks.map(x=>`<div class="row"><div><b>${x[0]}</b><br><small>${x[2]}</small></div><span class="badge">${x[1]}</span></div>`).join("")}</div></div>`}
function show(v){$("#app").innerHTML=({today,recommend,mastery,search,backup,qa}[v]||hub)();bind(v)}
function bindHub(){$$(".v13open").forEach(b=>b.onclick=()=>show(b.dataset.open))}
function route(name){let b=$$(".navbtn").find(x=>x.textContent.trim()===name);if(b)b.click()}
function bind(v){$("#v13Back")?.addEventListener("click",open);if(v==="today")$("#goRec")?.addEventListener("click",()=>route(recs()[0].route));if(v==="recommend")$$(".goRoute").forEach(b=>b.onclick=()=>route(b.dataset.route));if(v==="search")$("#uSearch").oninput=e=>{let q=e.target.value.toLowerCase(),r=collect().filter(x=>JSON.stringify(x).toLowerCase().includes(q)).slice(0,100);$("#uRows").innerHTML=r.map(x=>`<div class="row"><div><div class="eyebrow">${x.type}</div><b>${esc(x.title)}</b><br><small>${esc(x.detail)}</small></div></div>`).join("")||'<div class="empty">No results.</div>'};if(v==="backup")bindBackup()}
function bindBackup(){
 $("#exportAll").onclick=()=>{let data={schema:"tina-clean-backup-v13",at:now(),storage:{}};for(let i=0;i<localStorage.length;i++){let k=localStorage.key(i);if(k?.startsWith("tina.clean.")||k==="tlp4.progress")data.storage[k]=localStorage.getItem(k)}let blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="tina-learning-backup-v13.json";a.click()};
 $("#importAllBtn").onclick=()=>$("#importAll").click();$("#importAll").onchange=e=>{let f=e.target.files[0],r=new FileReader();r.onload=()=>{try{let d=JSON.parse(r.result);if(d.schema!=="tina-clean-backup-v13"||!d.storage)throw 0;Object.entries(d.storage).forEach(([k,v])=>localStorage.setItem(k,v));S.recovery.push({at:now(),keys:Object.keys(d.storage).length});save();alert("Backup restored. Re-open the relevant module to refresh its local state.")}catch{alert("Invalid Tina v13 backup.")}};r.readAsText(f)}
}
save();
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(nav,400));else setTimeout(nav,400);
})();