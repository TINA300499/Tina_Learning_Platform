(() => {
"use strict";
const KEY="tina.clean.v11.assessment";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return{}}};
let S=Object.assign({attempts:[],tests:[],speaking:[],writing:[],dictation:[],shadowing:[],rubrics:[],evidence:[],mistakes:[]},load());
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const now=()=>new Date().toISOString();
function nav(){let n=$("#nav");if(!n||$('[data-view="assessment-v11"]'))return;let b=document.createElement("button");b.className="navbtn";b.dataset.view="assessment-v11";b.textContent="Assessment";n.appendChild(b);b.onclick=open}
function open(){$$(".navbtn").forEach(x=>x.classList.remove("active"));$('[data-view="assessment-v11"]')?.classList.add("active");$("#app").innerHTML=hub();bindHub()}
function head(t,d){return `<div class="wrap v11wrap"><div class="sectionHead"><div><div class="eyebrow">Learning & Assessment Engine v11</div><h2>${t}</h2><p class="muted">${d}</p></div><button class="ghost" id="v11Back">← Assessment Hub</button></div>`}
const MOD=[
["dictation","Dictation Assessment","Listen, type, compare and store exact-error evidence."],
["shadowing","Shadowing Assessment","Model audio, recording, self-rating and evidence."],
["speaking","Speaking Assessment","Record performance and score against a rubric."],
["writing","Writing Assessment","Draft, word count and rubric-based scoring."],
["wordform","Word Formation Test","Exact derived-form assessment with spelling feedback."],
["cloze","Cloze Test","Open-cloze retrieval and exact checking."],
["quiz","Quiz / Test Builder","Create reusable multiple-choice assessment items."],
["exam","Assessment Runner","Run saved tests and calculate scores."],
["evidence","Evidence Ledger","Unified assessment evidence and mistake trail."],
["analytics","Assessment Analytics","Accuracy and performance by skill."]
];
function hub(){let a=S.attempts,acc=a.length?Math.round(a.filter(x=>x.correct).length/a.length*100):0;return `<div class="wrap v11wrap"><section class="card v11hero"><div><div class="eyebrow">Version 11 Closure</div><h1>Learning & Assessment Engine</h1><p>Practice is converted into measurable evidence, scoring and review.</p></div><div class="v11stats"><b>${a.length}</b><span>attempts</span><b>${acc}%</b><span>accuracy</span><b>${S.evidence.length}</b><span>evidence</span></div></section><section class="grid">${MOD.map(x=>`<article class="card"><h3>${x[1]}</h3><p>${x[2]}</p><button class="primary v11open" data-open="${x[0]}">Open</button></article>`).join("")}</section></div>`}
function dictation(){return head("Dictation Assessment","Browser speech model + exact comparison.")+`<article class="card"><textarea id="dSource" rows="3">The committee decided to defer the proposal pending further evidence.</textarea><div class="actions"><button class="darkbtn" id="dListen">▶ Listen</button><button class="ghost" id="dSlow">Slow</button></div><div class="uploadField"><label>Optional source audio</label><input id="dAudioFile" type="file" accept="audio/*"><audio id="dAudioPreview" controls class="hidden"></audio></div><textarea id="dAnswer" rows="4" placeholder="Type exactly what you hear…"></textarea><button class="primary" id="dCheck">Check & save evidence</button><div id="dFb"></div></article></div>`}
function shadowing(){return head("Shadowing Assessment","Record a shadowing attempt and attach a structured self-rating.")+`<article class="card"><textarea id="shText" rows="3">Precision comes from repeated attention to sound, rhythm, stress and meaning.</textarea><div class="actions"><button class="darkbtn" id="shModel">▶ Model</button><button class="primary" id="shRec">● Record</button><button class="ghost" id="shStop">■ Stop</button></div><div class="uploadField"><label>Model audio</label><input id="shAudioFile" type="file" accept="audio/*"></div><div class="uploadField"><label>Prompt image/video</label><input id="shMediaFile" type="file" accept="image/*,video/*"></div><div id="shModelPreview" class="uploadPreview"></div><div id="shAudio"></div><div class="rubricGrid">${["Pronunciation","Rhythm","Stress","Fluency"].map(x=>`<label>${x}<input class="shRate" data-name="${x}" type="range" min="1" max="5" value="3"></label>`).join("")}</div><textarea id="shNote" rows="3" placeholder="What needs improvement?"></textarea><button class="primary" id="shSave">Save evidence</button></article></div>`}
function speaking(){return head("Speaking Assessment","CPE-oriented self-assessment evidence.")+`<article class="card"><input id="spTask" value="Discuss whether technological progress always improves education."><div class="actions"><button class="primary" id="spRec">● Record</button><button class="ghost" id="spStop">■ Stop</button></div><div class="uploadField"><label>Prompt image</label><input id="spImageFile" type="file" accept="image/*"></div><div class="uploadField"><label>Prompt audio</label><input id="spAudioFile" type="file" accept="audio/*"></div><div id="spPromptPreview" class="uploadPreview"></div><div id="spAudio"></div>${rubric(["Grammatical Resource","Lexical Resource","Discourse Management","Pronunciation","Interactive Communication"],"sp")}<textarea id="spNote" rows="3" placeholder="Reflection / examiner-style notes"></textarea><button class="primary" id="spSave">Save speaking assessment</button></article></div>`}
function writing(){return head("Writing Assessment","Draft and score against explicit dimensions.")+`<article class="card"><input id="wrTask" value="Essay: evaluate two ideas and explain which is more important."><textarea id="wrText" rows="14" placeholder="Write here…"></textarea><div id="wrWords" class="badge">0 words</div>${rubric(["Content","Communicative Achievement","Organisation","Language"],"wr")}<textarea id="wrNote" rows="3" placeholder="Revision notes"></textarea><button class="primary" id="wrSave">Score & save</button></article></div>`}
function rubric(names,p){return `<div class="rubricGrid">${names.map(n=>`<label>${n}<select class="${p}Rate" data-name="${n}">${[0,1,2,3,4,5].map(x=>`<option value="${x}" ${x===3?"selected":""}>${x}</option>`).join("")}</select></label>`).join("")}</div>`}
function wordform(){return head("Word Formation Test","Exact spelling and derivational control.")+`<article class="card"><div class="formgrid"><input id="wfSentence" value="Her explanation was remarkably _____ and easy to follow."><input id="wfBase" value="PERSUADE"><input id="wfTarget" value="persuasive"><input id="wfAnswer" placeholder="Derived form"><button class="primary" id="wfCheck">Check</button></div><div id="wfFb"></div></article></div>`}
function cloze(){return head("Cloze Test","Open retrieval without options.")+`<article class="card"><textarea id="clSentence" rows="3">The proposal was postponed _____ further evidence could be collected.</textarea><input id="clTarget" value="until"><input id="clAnswer" placeholder="Missing word"><button class="primary" id="clCheck">Check</button><div id="clFb"></div></article></div>`}
function quiz(){return head("Quiz / Test Builder","Build local assessment sets; staging only, not canonical authority.")+`<article class="card"><div class="formgrid"><input id="qTitle" placeholder="Test title" value="CPE Precision Check"><textarea id="qPrompt" rows="3" placeholder="Question"></textarea><input id="qOptions" placeholder="Options separated by |"><input id="qTarget" placeholder="Correct option"><div class="uploadField"><label>Question image</label><input id="qImageFile" type="file" accept="image/*"></div><div class="uploadField"><label>Question audio</label><input id="qAudioFile" type="file" accept="audio/*"></div><button class="primary" id="qAdd">Add item to test</button></div></article><div class="list" style="margin-top:12px">${S.tests.map(t=>`<div class="row"><div><b>${esc(t.title)}</b><br><small>${t.items.length} items</small></div><button class="ghost runTest" data-id="${t.id}">Run</button></div>`).join("")||'<div class="empty">No saved tests yet.</div>'}</div></div>`}
function exam(){return head("Assessment Runner","Run a saved assessment and produce a score.")+`<div class="list">${S.tests.map(t=>`<div class="row"><div><b>${esc(t.title)}</b><br><small>${t.items.length} items</small></div><button class="primary runTest" data-id="${t.id}">Start</button></div>`).join("")||'<div class="empty">Create a test in Quiz / Test Builder first.</div>'}</div></div>`}
function evidence(){return head("Evidence Ledger","Assessment evidence remains inspectable and portable.")+`<div class="list">${S.evidence.slice().reverse().map(e=>`<div class="row"><div><b>${esc(e.skill)}</b><br><small>${esc(e.summary)} · ${new Date(e.at).toLocaleString()}</small></div><span class="badge">${esc(e.score)}</span></div>`).join("")||'<div class="empty">No evidence yet.</div>'}</div></div>`}
function analytics(){let skills={};S.attempts.forEach(a=>{let x=skills[a.skill]||(skills[a.skill]={n:0,c:0});x.n++;if(a.correct)x.c++});return head("Assessment Analytics","Accuracy by assessed skill.")+`<section class="grid">${Object.entries(skills).map(([k,v])=>`<article class="card"><h3>${esc(k)}</h3><div class="metric">${Math.round(v.c/v.n*100)}%</div><p>${v.c}/${v.n} correct</p></article>`).join("")||'<div class="empty">No attempts yet.</div>'}</section></div>`}
function show(v){$("#app").innerHTML=({dictation,shadowing,speaking,writing,wordform,cloze,quiz,exam,evidence,analytics}[v]||hub)();bind(v)}
function bindHub(){$$(".v11open").forEach(b=>b.onclick=()=>show(b.dataset.open))}
function bind(v){$("#v11Back")?.addEventListener("click",open);if(v==="dictation")bindDictation();if(v==="shadowing")bindShadowing();if(v==="speaking")bindSpeaking();if(v==="writing")bindWriting();if(v==="wordform")bindWF();if(v==="cloze")bindCloze();if(v==="quiz"||v==="exam")bindTests()}
function speak(t,rate=0.9){speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(t);u.lang="en-GB";u.rate=rate;speechSynthesis.speak(u)}
function attempt(skill,prompt,answer,target,correct){S.attempts.push({skill,prompt,answer,target,correct,at:now()});if(!correct){S.mistakes.push({skill,prompt,answer,target,at:now()});save();window.dispatchEvent(new CustomEvent("tina:wrong-answer",{detail:{source:skill,prompt,answer,target}}));return}save()}
function ev(skill,summary,score,detail={}){S.evidence.push({id:"e-"+Date.now()+"-"+Math.random(),skill,summary,score,detail,at:now()});save()}

let v11ObjectUrls=[];
function previewLocalFile(inputSel,targetSel){
 const input=$(inputSel),target=$(targetSel),f=input?.files?.[0];
 if(!f||!target)return;
 const url=URL.createObjectURL(f);v11ObjectUrls.push(url);
 if(f.type.startsWith("image/"))target.innerHTML=`<img class="mediaPreview" src="${url}" alt="Local preview">`;
 else if(f.type.startsWith("audio/"))target.innerHTML=`<audio controls src="${url}"></audio>`;
 else if(f.type.startsWith("video/"))target.innerHTML=`<video controls class="mediaPreview" src="${url}"></video>`;
}
function assessFileMeta(sel,role){const f=$(sel)?.files?.[0];return f?{role,name:f.name,type:f.type||"",size:f.size||0}:null}

function bindDictation(){$("#dAudioFile")?.addEventListener("change",()=>{const f=$("#dAudioFile").files[0];if(!f)return;const u=URL.createObjectURL(f);v11ObjectUrls.push(u);$("#dAudioPreview").src=u;$("#dAudioPreview").classList.remove("hidden")});$("#dListen").onclick=()=>{if($("#dAudioFile")?.files?.[0])$("#dAudioPreview")?.play();else speak($("#dSource").value,.9)};$("#dSlow").onclick=()=>speak($("#dSource").value,.65);$("#dCheck").onclick=()=>{let t=$("#dSource").value.trim(),a=$("#dAnswer").value.trim(),ok=a.toLowerCase()===t.toLowerCase();attempt("Dictation",t,a,t,ok);let tw=t.split(/\s+/),aw=a.split(/\s+/),diff=tw.filter((x,i)=>x.toLowerCase()!==(aw[i]||"").toLowerCase()).length;ev("Dictation",ok?"Exact dictation":"Dictation with "+diff+" token-position differences",ok?"100%":Math.max(0,Math.round((1-diff/tw.length)*100))+"%");$("#dFb").innerHTML=`<div class="feedback ${ok?"ok":"bad"}">${ok?"Exact match.":"Target: "+esc(t)}</div>`}}
let rec=null,chunks=[];
async function startRec(out){try{let st=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];rec=new MediaRecorder(st);rec.ondataavailable=e=>chunks.push(e.data);rec.onstop=()=>{let url=URL.createObjectURL(new Blob(chunks,{type:"audio/webm"}));$(out).innerHTML=`<audio controls src="${url}"></audio>`;st.getTracks().forEach(t=>t.stop())};rec.start()}catch{alert("Microphone permission is required.")}}
function stopRec(){if(rec&&rec.state!=="inactive")rec.stop()}
function scores(sel){let o={};$$(sel).forEach(x=>o[x.dataset.name]=+x.value);return o}
function bindShadowing(){$("#shAudioFile")?.addEventListener("change",()=>previewLocalFile("#shAudioFile","#shModelPreview"));$("#shMediaFile")?.addEventListener("change",()=>previewLocalFile("#shMediaFile","#shModelPreview"));$("#shModel").onclick=()=>{const a=$("#shModelPreview audio");if(a)a.play();else speak($("#shText").value,.85)};$("#shRec").onclick=()=>startRec("#shAudio");$("#shStop").onclick=stopRec;$("#shSave").onclick=()=>{let sc=scores(".shRate"),avg=Object.values(sc).reduce((a,b)=>a+b,0)/Object.keys(sc).length;S.shadowing.push({text:$("#shText").value,scores:sc,note:$("#shNote").value,at:now()});ev("Shadowing","Self-rated shadowing",avg.toFixed(1)+"/5",sc);save();show("evidence")}}
function bindSpeaking(){$("#spImageFile")?.addEventListener("change",()=>previewLocalFile("#spImageFile","#spPromptPreview"));$("#spAudioFile")?.addEventListener("change",()=>previewLocalFile("#spAudioFile","#spPromptPreview"));$("#spRec").onclick=()=>startRec("#spAudio");$("#spStop").onclick=stopRec;$("#spSave").onclick=()=>{let sc=scores(".spRate"),avg=Object.values(sc).reduce((a,b)=>a+b,0)/Object.keys(sc).length;S.speaking.push({task:$("#spTask").value,scores:sc,note:$("#spNote").value,at:now()});ev("Speaking",$("#spTask").value,avg.toFixed(1)+"/5",sc);save();show("evidence")}}
function bindWriting(){let t=$("#wrText");t.oninput=()=>$("#wrWords").textContent=((t.value.match(/\S+/g)||[]).length)+" words";$("#wrSave").onclick=()=>{let sc=scores(".wrRate"),sum=Object.values(sc).reduce((a,b)=>a+b,0),words=(t.value.match(/\S+/g)||[]).length;S.writing.push({task:$("#wrTask").value,text:t.value,scores:sc,note:$("#wrNote").value,words,at:now()});ev("Writing",`${words}-word writing assessment`,sum+"/20",sc);save();show("evidence")}}
function bindWF(){$("#wfCheck").onclick=()=>{let a=$("#wfAnswer").value.trim(),t=$("#wfTarget").value.trim(),ok=a.toLowerCase()===t.toLowerCase();attempt("Word Formation",$("#wfSentence").value,a,t,ok);ev("Word Formation",$("#wfBase").value+" → "+t,ok?"Correct":"Incorrect");$("#wfFb").innerHTML=`<div class="feedback ${ok?"ok":"bad"}">${ok?"Correct.":"Target: "+esc(t)}</div>`}}
function bindCloze(){$("#clCheck").onclick=()=>{let a=$("#clAnswer").value.trim(),t=$("#clTarget").value.trim(),ok=a.toLowerCase()===t.toLowerCase();attempt("Cloze",$("#clSentence").value,a,t,ok);ev("Cloze",$("#clSentence").value,ok?"Correct":"Incorrect");$("#clFb").innerHTML=`<div class="feedback ${ok?"ok":"bad"}">${ok?"Correct.":"Target: "+esc(t)}</div>`}}
function bindTests(){
 $("#qAdd")?.addEventListener("click",()=>{let title=$("#qTitle").value.trim(),prompt=$("#qPrompt").value.trim(),opts=$("#qOptions").value.split("|").map(x=>x.trim()).filter(Boolean),target=$("#qTarget").value.trim();if(!title||!prompt||opts.length<2||!target)return alert("Complete title, prompt, 2+ options and target.");let t=S.tests.find(x=>x.title===title);if(!t){t={id:"t-"+Date.now(),title,items:[]};S.tests.push(t)}t.items.push({id:"qi-"+Date.now(),prompt,options:opts,target,attachments:[assessFileMeta("#qImageFile","image"),assessFileMeta("#qAudioFile","audio")].filter(Boolean)});save();show("quiz")});
 $$(".runTest").forEach(b=>b.onclick=()=>runTest(b.dataset.id))
}
function runTest(id){
 let t=S.tests.find(x=>x.id===id);
 if(!t||!t.items.length)return;
 let i=0,score=0;
 function q(){
   const x=t.items[i];
   $("#app").innerHTML=head(t.title,`Question ${i+1} / ${t.items.length}`)+
     `<article class="card"><h2>${esc(x.prompt)}</h2><div class="optiongrid">${x.options.map(o=>`<button class="option testAns">${esc(o)}</button>`).join("")}</div><div id="testFb"></div></article></div>`;
   $("#v11Back").onclick=()=>show("exam");
   $$(".testAns").forEach(b=>b.onclick=()=>{
     const ok=b.textContent.trim().toLowerCase()===x.target.toLowerCase();
     if(ok)score++;
     attempt("Quiz/Test",x.prompt,b.textContent,x.target,ok);
     $("#testFb").innerHTML=`<div class="feedback ${ok?"ok":"bad"}">${ok?"Correct.":"Target: "+esc(x.target)}</div>`;
     setTimeout(()=>{
       i++;
       if(i<t.items.length){q();return}
       const pct=Math.round(score/t.items.length*100);
       ev("Quiz/Test",t.title,pct+"%",{score,total:t.items.length});
       $("#app").innerHTML=head(t.title,"Assessment complete.")+
         `<article class="card"><div class="metric">${score}/${t.items.length}</div><h2>${pct}%</h2><button class="primary" id="doneTest">Evidence Ledger</button></article></div>`;
       $("#v11Back").onclick=()=>show("exam");
       $("#doneTest").onclick=()=>show("evidence");
     },350);
   });
 }
 q();
}

save();
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(nav,320));else setTimeout(nav,320);
})();