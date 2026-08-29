(() => {
"use strict";
const KEY="tina.clean.v9.studio";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return{}}};
let S=Object.assign({
 sessions:[], recordings:[], writings:[], media:[], wordforms:[], cloze:[], bookmarks:[],
 goals:[{id:"g-cpe",title:"CPE 230/230 Mastery",target:100,progress:0}],
 settings:{autoMistakes:true,dailyTarget:30},
 mistakes:[]
},load());
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
function nav(){
 let n=$("#nav"); if(!n||$('[data-view="learning-studio"]'))return;
 let b=document.createElement("button");b.className="navbtn";b.dataset.view="learning-studio";b.textContent="Learning Studio";n.appendChild(b);b.onclick=open;
}
function open(){
 $$(".navbtn").forEach(x=>x.classList.remove("active"));$('[data-view="learning-studio"]')?.classList.add("active");
 $("#app").innerHTML=home(); bindHome();
}
const modules=[
 ["session","Session Center","Start focused study sessions and preserve evidence."],
 ["wordform","Word Formation Lab","Base → derived forms → morphology → spelling."],
 ["cloze","Cloze Studio","Create and practise deletion-based retrieval."],
 ["speaking","Speaking Library","Record, label, review and retain speaking evidence."],
 ["writing","Writing Library","Store drafts, revisions and self-assessment."],
 ["media","Media Studio","Attach images, audio and video references to learning objects."],
 ["mistakes","Unified Mistake Center","Capture, classify, resolve and recycle errors."],
 ["history","Learning History","Chronological study and evidence ledger."],
 ["goals","Mastery Goals","Track CPE and other learning targets."],
 ["manager","Studio Data Manager","Export, import and inspect v9 studio data."]
];
function home(){
 let today=new Date().toDateString(),mins=S.sessions.filter(x=>new Date(x.start).toDateString()===today).reduce((n,x)=>n+(x.minutes||0),0);
 return `<div class="wrap v9wrap"><section class="card v9hero"><div><div class="eyebrow">Full Learning Studio v9</div><h1>Learn → Practise → Capture → Review → Master</h1><p>One learner-side workspace for language precision, production evidence and long-term review.</p></div><div class="v9today"><b>${mins}</b><span>/ ${S.settings.dailyTarget} min today</span></div></section>
 <section class="grid">${modules.map(x=>`<article class="card"><h3>${x[1]}</h3><p>${x[2]}</p><button class="primary v9open" data-open="${x[0]}">Open</button></article>`).join("")}</section></div>`;
}
function head(t,d){return `<div class="wrap v9wrap"><div class="sectionHead"><div><div class="eyebrow">Learning Studio v9</div><h2>${t}</h2><p class="muted">${d}</p></div><button class="ghost" id="v9Back">← Studio</button></div>`}
function session(){
 return head("Session Center","Create focused study blocks and keep a durable session ledger.")+`<article class="card"><div class="formgrid"><input id="sessTitle" placeholder="Session title" value="CPE focused practice"><select id="sessMode"><option>Use of English</option><option>Reading</option><option>Writing</option><option>Listening</option><option>Speaking</option><option>Language Engineering</option><option>Research</option></select><input id="sessMinutes" type="number" min="1" value="30"><textarea id="sessGoal" rows="4" placeholder="What must be achieved in this session?"></textarea><button class="primary" id="startSession">Start session</button></div></article><div id="activeSession"></div></div>`;
}
function wordform(){
 return head("Word Formation Lab","Model exact derivation instead of memorising isolated answers.")+`<article class="card"><div class="formgrid"><input id="wfBase" placeholder="Base word, e.g. perceive"><input id="wfFamily" placeholder="Word family, e.g. perception, perceptive, perceptively"><input id="wfPattern" placeholder="Morphological pattern / affix"><textarea id="wfNotes" rows="4" placeholder="Spelling changes, constraints, example sentences…"></textarea><button class="primary" id="addWf">Add word family</button></div></article><div class="list" style="margin-top:12px">${S.wordforms.slice().reverse().map((x,i)=>`<div class="row"><div><b>${esc(x.base)}</b><br><small>${esc(x.family)} · ${esc(x.pattern||"")}</small><p>${esc(x.notes||"")}</p></div></div>`).join("")||'<div class="empty">No word families yet.</div>'}</div></div>`;
}
function cloze(){
 return head("Cloze Studio","Create reusable deletion-based retrieval items.")+`<article class="card"><p>Use <b>{{answer}}</b> to mark a deletion.</p><textarea id="clozeText" rows="6" placeholder="The evidence was {{insufficient}} to substantiate the claim."></textarea><button class="primary" id="addCloze">Add cloze</button></article><div class="list" style="margin-top:12px">${S.cloze.map(x=>`<div class="row"><div><b>${esc(x.text.replace(/\{\{(.*?)\}\}/g,"_____"))}</b></div><button class="ghost practiceCloze" data-id="${x.id}">Practise</button></div>`).join("")||'<div class="empty">No cloze items yet.</div>'}</div><div id="clozePractice"></div></div>`;
}
function speaking(){
 return head("Speaking Library","Recordings remain in-browser for the current session; metadata is retained locally.")+`<article class="card"><div class="formgrid"><input id="spPrompt" placeholder="Speaking prompt"><select id="spType"><option>Individual long turn</option><option>Collaborative task</option><option>Discussion</option><option>Shadowing</option><option>Pronunciation</option></select><div class="actions"><button class="primary" id="spStart">● Record</button><button class="darkbtn" id="spStop">■ Stop</button></div><div id="spPlayback"></div><textarea id="spReview" rows="4" placeholder="Self-review: fluency, pronunciation, grammar, vocabulary, discourse…"></textarea><button class="ghost" id="saveSpMeta">Save review</button></div></article><div class="list" style="margin-top:12px">${S.recordings.slice().reverse().map(x=>`<div class="row"><div><b>${esc(x.prompt||"Speaking evidence")}</b><br><small>${esc(x.type)} · ${new Date(x.at).toLocaleString()}</small><p>${esc(x.review||"")}</p></div></div>`).join("")||'<div class="empty">No saved speaking metadata yet.</div>'}</div></div>`;
}
function writing(){
 return head("Writing Library","Draft, revise and retain writing evidence.")+`<article class="card"><div class="toolbar"><select id="wrType"><option>Essay</option><option>Report</option><option>Review</option><option>Article</option><option>Email</option><option>Research note</option></select><span id="wrCount" class="badge">0 words</span></div><input id="wrTitle" placeholder="Title / task"><textarea id="wrText" rows="14" placeholder="Draft…"></textarea><textarea id="wrReview" rows="4" placeholder="Self-assessment / revision notes…"></textarea><button class="primary" id="saveWr">Save writing evidence</button></article><div class="list" style="margin-top:12px">${S.writings.slice().reverse().map(x=>`<div class="row"><div><b>${esc(x.title||x.type)}</b><br><small>${esc(x.type)} · ${x.words} words · ${new Date(x.at).toLocaleString()}</small></div></div>`).join("")||'<div class="empty">No writing evidence yet.</div>'}</div></div>`;
}
function media(){
 return head("Media Studio","A local metadata layer for learning media; no duplicate canonical authority.")+`<article class="card"><div class="formgrid"><select id="mediaType"><option>Image</option><option>Audio</option><option>Video</option><option>External resource</option></select><input id="mediaTitle" placeholder="Media title"><input id="mediaUrl" placeholder="URL or local reference"><textarea id="mediaNotes" rows="4" placeholder="Usage / transcript / caption / notes"></textarea><button class="primary" id="addMedia">Add media reference</button></div></article><div class="list" style="margin-top:12px">${S.media.map(x=>`<div class="row"><div><b>${esc(x.title)}</b><br><small>${esc(x.type)} · ${esc(x.url)}</small></div></div>`).join("")||'<div class="empty">No media references yet.</div>'}</div></div>`;
}
function mistakes(){
 return head("Unified Mistake Center","Classify errors by cause so review targets the actual failure mode.")+`<article class="card"><div class="formgrid"><input id="mkPrompt" placeholder="Prompt / problem"><input id="mkAnswer" placeholder="Your answer"><input id="mkTarget" placeholder="Correct target"><select id="mkCause"><option>Meaning</option><option>Collocation</option><option>Grammar</option><option>Morphology</option><option>Spelling</option><option>Register</option><option>Listening decoding</option><option>Pronunciation</option><option>Reasoning</option><option>Careless error</option></select><button class="primary" id="addMistake">Add mistake</button></div></article><div class="list" style="margin-top:12px">${S.mistakes.slice().reverse().map((x,i)=>`<div class="row"><div><b>${esc(x.prompt)}</b><br><small>${esc(x.answer)} → ${esc(x.target)} · ${esc(x.cause)}</small></div><button class="ghost resolveMk" data-index="${S.mistakes.length-1-i}">Resolve</button></div>`).join("")||'<div class="empty">No v9 mistakes.</div>'}</div></div>`;
}
function history(){
 let rows=[...S.sessions.map(x=>({at:x.start,type:"Session",text:x.title+" · "+x.minutes+" min"})),...S.recordings.map(x=>({at:x.at,type:"Speaking",text:x.prompt||x.type})),...S.writings.map(x=>({at:x.at,type:"Writing",text:x.title||x.type})),...S.wordforms.map(x=>({at:x.at,type:"Word formation",text:x.base}))].sort((a,b)=>new Date(b.at)-new Date(a.at));
 return head("Learning History","Chronological evidence ledger.")+`<div class="list">${rows.map(x=>`<div class="row"><div><b>${esc(x.type)}</b><br><small>${esc(x.text)}</small></div><small>${new Date(x.at).toLocaleString()}</small></div>`).join("")||'<div class="empty">No history yet.</div>'}</div></div>`;
}
function goals(){
 return head("Mastery Goals","Track explicit outcomes rather than activity alone.")+`<div class="list">${S.goals.map(g=>`<article class="card"><div class="row"><div><b>${esc(g.title)}</b><br><small>${g.progress}% / ${g.target}%</small></div><button class="ghost editGoal" data-id="${g.id}">Update</button></div><div class="progress"><span style="width:${Math.min(100,g.progress)}%"></span></div></article>`).join("")}</div><button class="primary" id="newGoal" style="margin-top:12px">+ Goal</button></div>`;
}
function manager(){
 let bytes=new Blob([JSON.stringify(S)]).size;
 return head("Studio Data Manager","Portable local backup for v9 learner evidence.")+`<section class="grid">${[["Sessions",S.sessions.length],["Speaking",S.recordings.length],["Writing",S.writings.length],["Word families",S.wordforms.length],["Cloze",S.cloze.length],["Media",S.media.length],["Mistakes",S.mistakes.length],["Storage",Math.round(bytes/1024)+" KB"]].map(x=>`<article class="card"><h3>${x[0]}</h3><div class="metric">${x[1]}</div></article>`).join("")}</section><article class="card" style="margin-top:14px"><div class="actions"><button class="primary" id="exportV9">Export v9 JSON</button><button class="ghost" id="importV9Btn">Import v9 JSON</button></div><input hidden type="file" id="importV9File" accept="application/json"></article></div>`;
}
function show(v){let fn={session,wordform,cloze,speaking,writing,media,mistakes,history,goals,manager}[v]||home;$("#app").innerHTML=fn();bind(v)}
function bindHome(){$$(".v9open").forEach(b=>b.onclick=()=>show(b.dataset.open))}
function bind(v){
 $("#v9Back")?.addEventListener("click",open);
 if(v==="session")bindSession();if(v==="wordform")bindWordform();if(v==="cloze")bindCloze();if(v==="speaking")bindSpeaking();if(v==="writing")bindWriting();if(v==="media")bindMedia();if(v==="mistakes")bindMistakes();if(v==="goals")bindGoals();if(v==="manager")bindManager();
}
function bindSession(){
 $("#startSession").onclick=()=>{let minutes=Math.max(1,+$("#sessMinutes").value||30),x={id:"s-"+Date.now(),title:$("#sessTitle").value,mode:$("#sessMode").value,goal:$("#sessGoal").value,minutes,start:new Date().toISOString(),complete:false};S.sessions.push(x);save();let end=Date.now()+minutes*60000;$("#activeSession").innerHTML=`<article class="card activeSession"><div class="eyebrow">Active session</div><h2>${esc(x.title)}</h2><div class="sessionClock" id="sessionClock">${minutes}:00</div><p>${esc(x.goal)}</p><button class="primary" id="finishSession">Complete now</button></article>`;let t=setInterval(()=>{let left=Math.max(0,end-Date.now()),m=Math.floor(left/60000),s=Math.floor(left%60000/1000),el=$("#sessionClock");if(el)el.textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;if(!left)clearInterval(t)},1000);$("#finishSession").onclick=()=>{x.complete=true;x.completedAt=new Date().toISOString();save();clearInterval(t);open()}}
}
function bindWordform(){$("#addWf").onclick=()=>{let base=$("#wfBase").value.trim();if(!base)return;S.wordforms.push({id:"wf-"+Date.now(),base,family:$("#wfFamily").value,pattern:$("#wfPattern").value,notes:$("#wfNotes").value,at:new Date().toISOString()});save();show("wordform")}}
function bindCloze(){
 $("#addCloze").onclick=()=>{let text=$("#clozeText").value.trim();if(!/\{\{.+?\}\}/.test(text))return alert("Add at least one {{answer}} deletion.");S.cloze.push({id:"cl-"+Date.now(),text,at:new Date().toISOString()});save();show("cloze")};
 $$(".practiceCloze").forEach(b=>b.onclick=()=>{let x=S.cloze.find(y=>y.id===b.dataset.id),answers=[...x.text.matchAll(/\{\{(.*?)\}\}/g)].map(m=>m[1]),masked=x.text.replace(/\{\{(.*?)\}\}/g,"_____");$("#clozePractice").innerHTML=`<article class="card"><h3>${esc(masked)}</h3><input id="clozeAnswer" placeholder="Answer(s), comma separated"><button class="primary" id="checkCloze">Check</button><div id="clozeFb"></div></article>`;$("#checkCloze").onclick=()=>{let a=$("#clozeAnswer").value.split(",").map(z=>z.trim().toLowerCase()),ok=answers.every((z,i)=>z.toLowerCase()===a[i]);$("#clozeFb").innerHTML=`<div class="feedback ${ok?"ok":"bad"}">${ok?"Correct.":"Target: "+esc(answers.join(", "))}</div>`;if(!ok&&S.settings.autoMistakes)S.mistakes.push({prompt:masked,answer:a.join(", "),target:answers.join(", "),cause:"Cloze retrieval",at:new Date().toISOString()});save()}})
}
let rec=null,chunks=[],lastBlob=null;
function bindSpeaking(){
 $("#spStart").onclick=async()=>{try{let stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];rec=new MediaRecorder(stream);rec.ondataavailable=e=>chunks.push(e.data);rec.onstop=()=>{lastBlob=new Blob(chunks,{type:"audio/webm"});let url=URL.createObjectURL(lastBlob);$("#spPlayback").innerHTML=`<audio controls src="${url}"></audio>`;stream.getTracks().forEach(t=>t.stop())};rec.start()}catch{alert("Microphone permission is required.")}};
 $("#spStop").onclick=()=>{if(rec&&rec.state!=="inactive")rec.stop()};
 $("#saveSpMeta").onclick=()=>{S.recordings.push({id:"sp-"+Date.now(),prompt:$("#spPrompt").value,type:$("#spType").value,review:$("#spReview").value,recorded:!!lastBlob,at:new Date().toISOString()});save();show("speaking")}
}
function bindWriting(){let t=$("#wrText");t.oninput=()=>$("#wrCount").textContent=((t.value.trim().match(/\S+/g)||[]).length)+" words";$("#saveWr").onclick=()=>{let words=(t.value.trim().match(/\S+/g)||[]).length;S.writings.push({id:"wr-"+Date.now(),type:$("#wrType").value,title:$("#wrTitle").value,text:t.value,review:$("#wrReview").value,words,at:new Date().toISOString()});save();show("writing")}}
function bindMedia(){$("#addMedia").onclick=()=>{let title=$("#mediaTitle").value.trim();if(!title)return;S.media.push({id:"md-"+Date.now(),type:$("#mediaType").value,title,url:$("#mediaUrl").value,notes:$("#mediaNotes").value,at:new Date().toISOString()});save();show("media")}}
function bindMistakes(){$("#addMistake").onclick=()=>{S.mistakes.push({prompt:$("#mkPrompt").value,answer:$("#mkAnswer").value,target:$("#mkTarget").value,cause:$("#mkCause").value,at:new Date().toISOString()});save();show("mistakes")};$$(".resolveMk").forEach(b=>b.onclick=()=>{S.mistakes.splice(+b.dataset.index,1);save();show("mistakes")})}
function bindGoals(){$$(".editGoal").forEach(b=>b.onclick=()=>{let g=S.goals.find(x=>x.id===b.dataset.id),p=prompt("Progress 0-100",g.progress);if(p===null)return;g.progress=Math.max(0,Math.min(100,+p||0));save();show("goals")});$("#newGoal").onclick=()=>{let t=prompt("Goal title");if(!t)return;S.goals.push({id:"g-"+Date.now(),title:t,target:100,progress:0});save();show("goals")}}
function bindManager(){
 $("#exportV9").onclick=()=>{let blob=new Blob([JSON.stringify(S,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="tina-learning-studio-v9-backup.json";a.click()};
 $("#importV9Btn").onclick=()=>$("#importV9File").click();$("#importV9File").onchange=e=>{let f=e.target.files[0],r=new FileReader();r.onload=()=>{try{let d=JSON.parse(r.result);if(typeof d!=="object")throw 0;S=Object.assign(S,d);save();show("manager")}catch{alert("Invalid v9 backup.")}};r.readAsText(f)}
}
save();
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(nav,240));else setTimeout(nav,240);
})();