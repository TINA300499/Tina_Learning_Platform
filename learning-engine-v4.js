(() => {
"use strict";
const KEY="tina.clean.v4.engine";
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return{}}};
const E=Object.assign({
 cards:[
  {id:"c1",front:"meticulous",back:"showing great attention to detail",box:1,due:0},
  {id:"c2",front:"substantiate",back:"provide evidence to support a claim",box:1,due:0},
  {id:"c3",front:"inadvertently",back:"without intention; accidentally",box:1,due:0}
 ],
 quiz:[
  {q:"Choose the most natural completion: The evidence was insufficient to ___ the claim.",o:["substantiate","scatter","dissolve","evade"],a:0},
  {q:"Which word best describes extremely careful attention to detail?",o:["meticulous","sporadic","implicit","volatile"],a:0}
 ],
 dictation:[
  "Effective learning depends on retrieval, feedback and deliberate review.",
  "Precision develops when errors are captured and revisited systematically."
 ],
 writing:[],speaking:[],shadowing:[],attempts:[],gameScore:0
},load());
const save=()=>localStorage.setItem(KEY,JSON.stringify(E));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
let recorder=null,chunks=[],timer=null,seconds=0;

function mount(){
 const app=document.querySelector("#app"); if(!app)return;
 const old=window.__TINA_V4_BOUND__;
 if(old)return; window.__TINA_V4_BOUND__=true;
 document.addEventListener("click",e=>{
   const b=e.target.closest("[data-mode]");
   if(b)setTimeout(()=>injectMode(b.dataset.mode),30);
 });
 // The practice engine renders only inside the dedicated Practice Room.
 // Opening Active Learning itself shows mode choices only.
 setTimeout(injectCurrent,120);
}
function injectCurrent(){
 const room=document.querySelector("#v4Engine.practiceRoomEngine");
 if(!room)return;
 try{
   const s=JSON.parse(localStorage.getItem("tina.clean.v3")||"{}");
   if(s.practiceOpen&&s.mode)injectMode(s.mode);
 }catch{}
}

function linkedPracticeVideo(){
 try{
   const s=JSON.parse(localStorage.getItem("tina.clean.v3")||"{}");
   const key=`${s.level||"A2 Flyers"}:${s.mode||"watch"}`;
   return s.practiceMedia?.[key]?.videoUrl||"";
 }catch{return ""}
}

function host(){
 return document.querySelector("#v4Engine.practiceRoomEngine");
}
function injectMode(mode){
 const h=host(); if(!h)return;
 const map={learn:lesson,listen:listen,dictation:dictation,shadowing:shadowing,flashcards:flashcards,speaking:speaking,writing:writing,quiz:quiz,games:games,research:research,review:review};
 h.innerHTML=(map[mode]||lesson)();
 bindMode(mode);
}
const header=(ey,t,d)=>`<div class="sectionHead"><div><div class="eyebrow">${ey}</div><h2>${t}</h2><p class="muted">${d}</p></div></div>`;
function lesson(){return header("Learning Engine v4","Lesson Player","Concept → Example → Retrieval → Reflection.")+`<div class="lessonlayout"><aside class="card"><b>Lesson outline</b><ol><li>Concept</li><li>Worked example</li><li>Retrieval</li><li>Reflection</li></ol></aside><article class="card lessonbody"><div class="eyebrow">Concept</div><h2>Deliberate retrieval</h2><p>Learning becomes durable when information must be reconstructed from memory rather than merely re-read.</p><blockquote>Study input, close the source, reconstruct the idea, check accuracy, then repair the gap.</blockquote><h3>Quick retrieval</h3><textarea id="retrievalAnswer" rows="5" placeholder="Explain deliberate retrieval from memory…"></textarea><div class="actions"><button class="primary" id="saveRetrieval">Save evidence</button></div></article></div>`}
function listen(){return header("Input Lab","Watch / Listen","A stable media workspace ready for canonical media URLs.")+`<article class="card"><div class="mediaPlaceholder">MEDIA</div><h3>Comprehension capture</h3><textarea id="listenNotes" rows="6" placeholder="Key ideas, unfamiliar language, questions…"></textarea><button class="primary" id="saveListen">Save notes</button></article>`}
function dictation(){let i=Math.floor(Math.random()*E.dictation.length);return header("Precision Listening","Dictation","Listen → type → reveal → compare.")+`<article class="card" data-dict="${i}"><button class="darkbtn" id="speakDictation">▶ Play sentence</button><textarea id="dictInput" rows="4" placeholder="Type exactly what you hear…"></textarea><div class="actions"><button class="primary" id="checkDict">Check</button><button class="ghost" id="revealDict">Reveal</button></div><div id="dictResult"></div></article>`}
function shadowing(){return header("Pronunciation Lab","Shadowing","Listen, imitate, record and compare.")+`<article class="card"><p id="shadowText">Precision develops when errors are captured and revisited systematically.</p><div class="actions"><button class="darkbtn" id="playShadow">▶ Model</button><button class="primary" id="recordShadow">● Record</button><button class="ghost" id="stopShadow">■ Stop</button></div><div id="shadowAudio"></div></article>`}
function flashcards(){let due=E.cards.filter(c=>c.due<=Date.now());let c=due[0]||E.cards[0];return header("SRS","Flashcards","Active recall with lightweight spaced review.")+`<article class="card flashcard" data-card="${esc(c.id)}"><div class="eyebrow">Prompt</div><div class="flashfront">${esc(c.front)}</div><div id="flashBack" class="flashback hidden">${esc(c.back)}</div><div class="actions"><button class="darkbtn" id="showCard">Show answer</button><button class="ghost grade" data-grade="again">Again</button><button class="ghost grade" data-grade="good">Good</button><button class="primary grade" data-grade="easy">Easy</button></div></article><article class="card" style="margin-top:12px"><button class="ghost" id="addCard">+ Add flashcard</button> <span class="muted">${E.cards.length} cards</span></article>`}
function speaking(){return header("Production Lab","Speaking Recorder","Record → playback → self-review → save evidence.")+`<article class="card"><h3>Prompt</h3><p>Explain one idea you learned today and give a concrete example.</p><div class="timer" id="speakTimer">00:00</div><div class="actions"><button class="primary" id="startSpeak">● Record</button><button class="darkbtn" id="stopSpeak">■ Stop</button></div><div id="speakPlayback"></div><textarea id="speakReflection" rows="4" placeholder="Self-review: fluency, precision, pronunciation, vocabulary…"></textarea></article>`}
function writing(){return header("Production Lab","Writing Studio","Draft → inspect → revise → save.")+`<article class="card"><div class="toolbar"><select id="writingType"><option>Essay</option><option>Report</option><option>Review</option><option>Article</option><option>Email</option></select><span id="wordCount" class="badge">0 words</span></div><textarea id="writingText" rows="16" placeholder="Write here…"></textarea><div class="actions"><button class="primary" id="saveWriting">Save draft</button><button class="ghost" id="clearWriting">Clear</button></div></article>`}
function quiz(){let q=E.quiz[Math.floor(Math.random()*E.quiz.length)];return header("Assessment","Quiz Engine","Answer → immediate feedback → mistake capture.")+`<article class="card" data-answer="${q.a}"><h3>${esc(q.q)}</h3><div class="optiongrid">${q.o.map((x,i)=>`<button class="option" data-option="${i}">${esc(x)}</button>`).join("")}</div><div id="quizFeedback"></div></article>`}
function games(){return header("Retrieval Games","Games Hub","Fast, low-friction retrieval practice.")+`<section class="grid">${["Speed Match","Memory Recall","Spelling Sprint","Definition Hunt","Odd One Out","Rapid Choice"].map((x,i)=>`<article class="card"><h3>${x}</h3><p>${i===0?"Match a word with its definition before time runs out.":"Game module slot ready for canonical items."}</p><button class="${i===0?"primary":"ghost"}" ${i===0?'id="startGame"':"disabled"}>${i===0?"Play":"Coming next"}</button></article>`).join("")}</section><div id="gameArea"></div>`}
function research(){return header("Research Mode","Evidence Capture","Question → claim → evidence → synthesis.")+`<article class="card"><input id="researchQuestion" placeholder="Research question"><textarea id="researchEvidence" rows="5" placeholder="Evidence / source notes…"></textarea><textarea id="researchSynthesis" rows="5" placeholder="Your synthesis…"></textarea><button class="primary" id="saveResearchV4">Save research evidence</button></article>`}
function review(){let wrong=E.attempts.filter(x=>x.correct===false).slice(-10).reverse();return header("Adaptive Review","Engine Mistake Queue","Recent errors generated by functional practice.")+`<div class="list">${wrong.length?wrong.map(x=>`<div class="row"><div><b>${esc(x.type)}</b><br><small>${esc(x.prompt||x.answer||"Practice error")}</small></div><span class="badge">Review</span></div>`).join(""):`<div class="empty">No v4 practice errors yet.</div>`}</div>`}

function bindMode(mode){
 if(mode==="learn")document.querySelector("#saveRetrieval")?.addEventListener("click",()=>{E.attempts.push({type:"retrieval",answer:document.querySelector("#retrievalAnswer").value,date:Date.now()});save();toast("Learning evidence saved.")});
 if(mode==="listen")document.querySelector("#saveListen")?.addEventListener("click",()=>{E.attempts.push({type:"listening-note",answer:document.querySelector("#listenNotes").value,date:Date.now()});save();toast("Listening notes saved.")});
 if(mode==="dictation")bindDict();
 if(mode==="shadowing")bindShadow();
 if(mode==="flashcards")bindCards();
 if(mode==="speaking")bindSpeaking();
 if(mode==="writing")bindWriting();
 if(mode==="quiz")bindQuiz();
 if(mode==="games")document.querySelector("#startGame")?.addEventListener("click",startGame);
 if(mode==="research")document.querySelector("#saveResearchV4")?.addEventListener("click",()=>{E.attempts.push({type:"research",prompt:document.querySelector("#researchQuestion").value,answer:document.querySelector("#researchSynthesis").value,evidence:document.querySelector("#researchEvidence").value,date:Date.now()});save();toast("Research evidence saved.")});
}
function speak(text,rate=.85){speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(text);u.lang="en-GB";u.rate=rate;speechSynthesis.speak(u)}
function bindDict(){let box=document.querySelector("[data-dict]"),i=+box.dataset.dict,s=E.dictation[i];document.querySelector("#speakDictation").onclick=()=>speak(s,.78);document.querySelector("#revealDict").onclick=()=>document.querySelector("#dictResult").innerHTML=`<div class="feedback">${esc(s)}</div>`;document.querySelector("#checkDict").onclick=()=>{let a=document.querySelector("#dictInput").value.trim(),ok=a.toLowerCase()===s.toLowerCase();E.attempts.push({type:"dictation",prompt:s,answer:a,correct:ok,date:Date.now()});save();document.querySelector("#dictResult").innerHTML=`<div class="feedback ${ok?"ok":"bad"}">${ok?"Exact match.":"Compare with the target:"}<br>${esc(s)}</div>`;if(!ok)window.dispatchEvent(new CustomEvent("tina:wrong-answer",{detail:{source:"dictation",prompt:s,answer:a,target:s}}))}}
function bindShadow(){let t=document.querySelector("#shadowText").textContent;document.querySelector("#playShadow").onclick=()=>speak(t,.82);document.querySelector("#recordShadow").onclick=()=>record("shadowAudio","shadowing");document.querySelector("#stopShadow").onclick=stopRecord}
function bindCards(){let card=document.querySelector(".flashcard"),id=card.dataset.card;document.querySelector("#showCard").onclick=()=>document.querySelector("#flashBack").classList.remove("hidden");document.querySelectorAll(".grade").forEach(b=>b.onclick=()=>{let c=E.cards.find(x=>x.id===id),g=b.dataset.grade,days=g==="again"?0:g==="good"?1:4;c.box=g==="again"?1:Math.min(5,(c.box||1)+1);c.due=Date.now()+days*86400000;E.attempts.push({type:"flashcard",prompt:c.front,correct:g!=="again",date:Date.now()});save();if(g==="again")window.dispatchEvent(new CustomEvent("tina:wrong-answer",{detail:{source:"flashcard",prompt:c.front,target:c.back}}));else injectMode("flashcards")});document.querySelector("#addCard").onclick=()=>{let front=prompt("Front / prompt");if(!front)return;let back=prompt("Back / answer")||"";E.cards.push({id:"c"+Date.now(),front,back,box:1,due:0});save();if(g==="again")window.dispatchEvent(new CustomEvent("tina:wrong-answer",{detail:{source:"flashcard",prompt:c.front,target:c.back}}));else injectMode("flashcards")}}
async function record(target,type){try{let stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>chunks.push(e.data);recorder.onstop=async()=>{let blob=new Blob(chunks,{type:"audio/webm"}),url=URL.createObjectURL(blob),backendMediaId="";if(window.TinaBackend?.available){try{const f=new File([blob],`${type}-${Date.now()}.webm`,{type:"audio/webm"}),m=await window.TinaBackend.uploadMedia(f);url=m.url;backendMediaId=m.id}catch{}}let h=document.querySelector("#"+target);if(h)h.innerHTML=`<audio controls src="${url}"></audio>`;E.attempts.push({type,recorded:true,backendMediaId,durable:!!backendMediaId,date:Date.now()});save();window.TinaBackend?.scheduleSync?.("recording");stream.getTracks().forEach(t=>t.stop())};recorder.start()}catch(e){toast("Microphone permission is required.")}}
function stopRecord(){if(recorder&&recorder.state!=="inactive")recorder.stop()}
function bindSpeaking(){document.querySelector("#startSpeak").onclick=()=>{seconds=0;clearInterval(timer);timer=setInterval(()=>{seconds++;let m=String(Math.floor(seconds/60)).padStart(2,"0"),s=String(seconds%60).padStart(2,"0");let e=document.querySelector("#speakTimer");if(e)e.textContent=`${m}:${s}`},1000);record("speakPlayback","speaking")};document.querySelector("#stopSpeak").onclick=()=>{clearInterval(timer);stopRecord()}}
function bindWriting(){let t=document.querySelector("#writingText"),wc=document.querySelector("#wordCount");t.oninput=()=>wc.textContent=((t.value.trim().match(/\S+/g)||[]).length)+" words";document.querySelector("#saveWriting").onclick=()=>{E.writing.push({type:document.querySelector("#writingType").value,text:t.value,date:Date.now()});save();toast("Writing draft saved.")};document.querySelector("#clearWriting").onclick=()=>{t.value="";t.dispatchEvent(new Event("input"))}}
function bindQuiz(){document.querySelectorAll(".option").forEach(b=>b.onclick=()=>{let box=b.closest("[data-answer]"),ok=+b.dataset.option===+box.dataset.answer;document.querySelectorAll(".option").forEach(x=>x.disabled=true);b.classList.add(ok?"correct":"wrong");E.attempts.push({type:"quiz",prompt:box.querySelector("h3").textContent,answer:b.textContent,correct:ok,date:Date.now()});save();document.querySelector("#quizFeedback").innerHTML=`<div class="feedback ${ok?"ok":"bad"}">${ok?"Correct.":"Incorrect — added to review evidence."}</div>`;if(!ok)window.dispatchEvent(new CustomEvent("tina:wrong-answer",{detail:{source:"quiz",prompt:box.querySelector("h3").textContent,answer:b.textContent}}))})}
function startGame(){let pool=[...E.cards].sort(()=>Math.random()-.5),c=pool[0],opts=[c,...pool.filter(x=>x.id!==c.id).slice(0,2)].sort(()=>Math.random()-.5);document.querySelector("#gameArea").innerHTML=`<article class="card gamebox"><div class="eyebrow">Speed Match</div><h2>${esc(c.front)}</h2><p>Choose the matching definition.</p>${opts.map(x=>`<button class="option gameopt" data-ok="${x.id===c.id}">${esc(x.back)}</button>`).join("")}<div id="gameFeedback"></div></article>`;document.querySelectorAll(".gameopt").forEach(b=>b.onclick=()=>{let ok=b.dataset.ok==="true";E.gameScore+=ok?1:0;E.attempts.push({type:"game",prompt:c.front,answer:b.textContent,correct:ok,date:Date.now()});save();document.querySelector("#gameFeedback").innerHTML=`<div class="feedback ${ok?"ok":"bad"}">${ok?"Match! Score: "+E.gameScore:"Try again."}</div>`;if(!ok)window.dispatchEvent(new CustomEvent("tina:wrong-answer",{detail:{source:"game",prompt:c.front,answer:b.textContent,target:c.back}}))})}
function toast(msg){let x=document.createElement("div");x.className="toast";x.textContent=msg;document.body.appendChild(x);setTimeout(()=>x.remove(),1800)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();

window.addEventListener("tina:practice-media",e=>{
 const d=e.detail||{},h=host();
 if(!h)return;
 let box=h.querySelector(".uploadedPracticeMedia");
 if(!box){
   box=document.createElement("div");
   box.className="uploadedPracticeMedia";
   h.prepend(box);
 }
 if(d.kind==="audio"){
   box.innerHTML=`<div class="uploadedMediaBlock"><div class="eyebrow">Uploaded Audio</div><audio controls src="${d.url}"></audio><small>${esc(d.name||"Audio")}</small></div>`+
     [...box.querySelectorAll(".uploadedMediaBlock")].filter(x=>x.querySelector("video")).map(x=>x.outerHTML).join("");
 }
 if(d.kind==="video"){
   const audioHtml=[...box.querySelectorAll(".uploadedMediaBlock")].filter(x=>x.querySelector("audio")).map(x=>x.outerHTML).join("");
   box.innerHTML=audioHtml+`<div class="uploadedMediaBlock"><div class="eyebrow">Uploaded Video</div><video controls class="practiceUploadedVideo" src="${d.url}"></video><small>${esc(d.name||"Video")}</small></div>`;
 }
});

})();