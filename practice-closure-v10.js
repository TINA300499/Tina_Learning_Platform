(() => {
"use strict";
const KEY="tina.clean.v10.practice";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const get=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return{}}};
let S=Object.assign({
 decks:[{id:"v10-cpe",title:"CPE Precision Deck",cards:[
  {id:"v10-1",front:"meticulous",back:"showing extreme care and attention to detail",example:"She kept meticulous records.",tags:["CPE","adjective"],type:"basic",due:0,interval:0,ease:2.5,reps:0,lapses:0,mastery:0},
  {id:"v10-2",front:"substantiate",back:"support a claim with evidence",example:"The data substantiates the conclusion.",tags:["CPE","verb"],type:"basic",due:0,interval:0,ease:2.5,reps:0,lapses:0,mastery:0},
  {id:"v10-3",front:"inadvertently",back:"unintentionally; accidentally",example:"The file was inadvertently deleted.",tags:["CPE","adverb"],type:"basic",due:0,interval:0,ease:2.5,reps:0,lapses:0,mastery:0},
  {id:"v10-4",front:"defer",back:"postpone until a later time",example:"They deferred the decision.",tags:["CPE","verb"],type:"basic",due:0,interval:0,ease:2.5,reps:0,lapses:0,mastery:0},
  {id:"v10-5",front:"perceive",back:"become aware of; interpret",example:"The change was perceived as significant.",tags:["morphology"],type:"wordform",wordFamily:"perception, perceptive, perceptively",due:0,interval:0,ease:2.5,reps:0,lapses:0,mastery:0},
  {id:"v10-6",front:"The evidence was {{insufficient}} to support the claim.",back:"insufficient",example:"Cloze deletion",tags:["cloze"],type:"cloze",due:0,interval:0,ease:2.5,reps:0,lapses:0,mastery:0}
 ]}],selectedDeck:"v10-cpe",attempts:[],mistakes:[],gameBest:{},streak:0,lastStudyDay:null
},get());
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const deck=()=>S.decks.find(d=>d.id===S.selectedDeck)||S.decks[0];
const now=()=>Date.now(), day=()=>new Date().toISOString().slice(0,10);
function updateStreak(){let d=day();if(S.lastStudyDay===d)return;if(!S.lastStudyDay)S.streak=1;else{let a=new Date(S.lastStudyDay),b=new Date(d);S.streak=Math.round((b-a)/86400000)===1?S.streak+1:1}S.lastStudyDay=d;save()}
function nav(){let n=$("#nav");if(!n||$('[data-view="practice-v10"]'))return;let b=document.createElement("button");b.className="navbtn";b.dataset.view="practice-v10";b.textContent="Practice v10";n.appendChild(b);b.onclick=open}
function open(){$$(".navbtn").forEach(x=>x.classList.remove("active"));$('[data-view="practice-v10"]')?.classList.add("active");$("#app").innerHTML=hub();bindHub()}
function dueCards(){return deck().cards.filter(c=>(c.due||0)<=now())}
function hub(){let d=deck(),due=dueCards().length,mastered=d.cards.filter(c=>(c.mastery||0)>=80).length,acc=S.attempts.length?Math.round(S.attempts.filter(a=>a.correct).length/S.attempts.length*100):0;
return `<div class="wrap v10wrap"><section class="card v10hero"><div><div class="eyebrow">Version 10 Closure</div><h1>Flashcard · SRS · Game Engine</h1><p>One practice evidence loop: Card → Attempt → Error → Review → Mastery.</p></div><div class="v10metrics"><span><b>${d.cards.length}</b> cards</span><span><b>${due}</b> due</span><span><b>${mastered}</b> mastered</span><span><b>${acc}%</b> accuracy</span><span><b>${S.streak}</b> streak</span></div></section>
<section class="grid">${[
["cards","Advanced Flashcard Studio","Basic, cloze and word-formation cards; examples, tags and media URLs."],
["srs","SRS Review Queue","Due, new, learning and mastered states with SM-2-style scheduling."],
["games","Game Engine","30 playable retrieval modes with scoring and mistake capture."],
["mistakes","Mistake Recycling","Retry unresolved mistakes until recovered."],
["analytics","Practice Analytics","Accuracy, mastery, weak cards and game best scores."],
["decks","Deck Manager","Create, duplicate, import/export and switch decks."]
].map(x=>`<article class="card"><h3>${x[1]}</h3><p>${x[2]}</p><button class="primary v10open" data-open="${x[0]}">Open</button></article>`).join("")}</section></div>`}
function head(t,d){return `<div class="wrap v10wrap"><div class="sectionHead"><div><div class="eyebrow">Practice Closure v10</div><h2>${t}</h2><p class="muted">${d}</p></div><button class="ghost" id="v10Back">← Practice Hub</button></div>`}
function selector(){return `<select id="v10Deck">${S.decks.map(d=>`<option value="${d.id}" ${d.id===S.selectedDeck?"selected":""}>${esc(d.title)} (${d.cards.length})</option>`).join("")}</select>`}
function cards(){return head("Advanced Flashcard Studio","Rich local practice cards without creating another canonical authority.")+`<div class="toolbar">${selector()}<input id="v10Search" placeholder="Search cards / tags…"><select id="v10Filter"><option value="all">All types</option><option value="basic">Basic</option><option value="cloze">Cloze</option><option value="wordform">Word formation</option></select><button class="primary" id="v10NewCard">+ Card</button></div><div id="v10CardEditor" class="card v10CardEditor hidden">
<div class="formgrid">
<select id="v10CardType"><option value="basic">Basic</option><option value="cloze">Cloze</option><option value="wordform">Word formation</option></select>
<input id="v10CardFront" placeholder="Front / word / cloze sentence">
<input id="v10CardBack" placeholder="Back / answer / definition">
<input id="v10CardFamily" placeholder="Word family (optional)">
<textarea id="v10CardExample" rows="3" placeholder="Example / note"></textarea>
<input id="v10CardTags" placeholder="Tags, comma separated">
<div class="uploadField"><label>Image</label><input id="v10CardImage" type="file" accept="image/*"></div>
<div class="uploadField"><label>Audio</label><input id="v10CardAudio" type="file" accept="audio/*"></div>
<div id="v10CardUploadPreview" class="uploadPreview"></div>
<div class="actions"><button class="primary" id="v10SaveCard">Save card</button><button class="ghost" id="v10CancelCard">Cancel</button></div>
</div></div>
<div id="v10CardList" class="list">${cardRows(deck().cards)}</div></div>`}
function cardRows(a){return a.length?a.map(c=>`<div class="row"><div><div class="eyebrow">${esc(c.type||"basic")} · mastery ${c.mastery||0}%</div><b>${esc(c.front)}</b><br><small>${esc(c.back)}</small>${c.wordFamily?`<p>Family: ${esc(c.wordFamily)}</p>`:""}${c.example?`<p>${esc(c.example)}</p>`:""}${c.attachments?.length?`<div class="mediaMeta">${c.attachments.map(a=>`<span>${esc(a.role)}: ${esc(a.name)}</span>`).join("")}</div>`:""}<div class="tags">${(c.tags||[]).map(t=>`<span>${esc(t)}</span>`).join("")}</div></div><div class="rowactions"><button class="ghost editV10" data-id="${c.id}">Edit</button><button class="iconbtn delV10" data-id="${c.id}">×</button></div></div>`).join(""):`<div class="empty">No cards.</div>`}
function srs(){let q=dueCards(),c=q[0];return head("SRS Review Queue","Scheduling responds to retrieval quality and card history.")+`<div class="toolbar">${selector()}<span class="badge">${q.length} due</span></div>${c?reviewCard(c):'<div class="empty">Queue complete. No cards are due.</div>'}</div>`}
function reviewCard(c){let front=c.type==="cloze"?c.front.replace(/\{\{(.*?)\}\}/g,"_____"):c.front;return `<article class="card v10review" data-card="${c.id}"><div class="eyebrow">${esc(c.type||"basic")} · reps ${c.reps||0} · interval ${c.interval||0}d</div><div class="v10front">${esc(front)}</div><div id="v10answer" class="hidden v10answer"><b>${esc(c.back)}</b>${c.wordFamily?`<p>${esc(c.wordFamily)}</p>`:""}<p>${esc(c.example||"")}</p></div><div id="v10grades"><button class="darkbtn" id="v10Reveal">Reveal</button></div></article>`}
const G=[
["speed","Speed Match"],["memory","Memory Pairs"],["spelling","Spelling Sprint"],["definition","Definition Hunt"],["choice","Rapid Choice"],["reverse","Reverse Recall"],["typing","Typing Race"],["truefalse","True / False"],["odd","Odd One Out"],["scramble","Word Scramble"],["missing","Missing Letters"],["firstletter","First Letter"],["lastletter","Last Letter"],["length","Word Length"],["example","Example Match"],["tag","Tag Hunt"],["lightning","Lightning Round"],["survival","Survival"],["streak","Streak Builder"],["boss","Boss Battle"],["listen","Listen & Choose"],["listenType","Listen & Type"],["pronounce","Pronunciation Echo"],["cloze","Cloze Recall"],["meaning","Meaning Match"],["context","Context Choice"],["flip","Card Flip"],["lives","Three Lives"],["marathon","Marathon"],["random","Random Challenge"]];
function games(){return head("Game Engine","30 playable modes. Different rules, one shared card/evidence model.")+`<div class="toolbar">${selector()}<span class="badge">30 playable modes</span></div><section class="gameGrid">${G.map((g,i)=>`<article class="card gameTile"><div class="gameNo">${String(i+1).padStart(2,"0")}</div><h3>${g[1]}</h3><p>${gameRule(g[0])}</p><button class="primary v10game" data-game="${g[0]}">Play</button></article>`).join("")}</section></div>`}
function gameRule(t){let m={memory:"Match four word-definition pairs.",spelling:"Type the exact word from its definition.",truefalse:"Judge whether a pairing is valid.",scramble:"Recover a word from shuffled letters.",missing:"Restore missing vowels.",listen:"Listen and select the meaning.",listenType:"Listen and type exactly.",cloze:"Recover a deleted form from context.",tag:"Identify the tagged category.",length:"Choose the word with the requested length.",odd:"Find the card that differs by tag."};return m[t]||"Fast retrieval with scoring, feedback and error recycling."}
function mistakes(){return head("Mistake Recycling","Wrong answers stay unresolved until successfully retried.")+`<div class="list">${S.mistakes.filter(x=>!x.resolved).length?S.mistakes.filter(x=>!x.resolved).slice().reverse().map(m=>`<div class="row"><div><b>${esc(m.prompt)}</b><br><small>${esc(m.answer)} → ${esc(m.target)} · ${esc(m.source)}</small></div><button class="primary retryMistake" data-id="${m.id}">Retry</button></div>`).join(""):'<div class="empty">No unresolved mistakes.</div>'}</div></div>`}
function analytics(){let d=deck(),a=S.attempts,acc=a.length?Math.round(a.filter(x=>x.correct).length/a.length*100):0,weak=d.cards.slice().sort((x,y)=>(x.mastery||0)-(y.mastery||0)).slice(0,5);return head("Practice Analytics","Mastery is evidence-driven, not just completion.")+`<section class="grid">${[["Attempts",a.length],["Accuracy",acc+"%"],["Due",dueCards().length],["Mastered",d.cards.filter(c=>(c.mastery||0)>=80).length],["Mistakes",S.mistakes.filter(x=>!x.resolved).length],["Streak",S.streak]].map(x=>`<article class="card"><h3>${x[0]}</h3><div class="metric">${x[1]}</div></article>`).join("")}</section><article class="card" style="margin-top:14px"><h3>Weakest cards</h3><div class="list">${weak.map(c=>`<div class="row"><b>${esc(c.front)}</b><span class="badge">${c.mastery||0}%</span></div>`).join("")}</div></article><article class="card" style="margin-top:14px"><h3>Best game scores</h3><div class="tags">${Object.entries(S.gameBest).map(([k,v])=>`<span>${esc(G.find(x=>x[0]===k)?.[1]||k)}: ${v}</span>`).join("")||"<span>No scores yet</span>"}</div></article></div>`}
function decks(){return head("Deck Manager","Portable practice collections.")+`<div class="actions"><button class="primary" id="newV10Deck">+ Deck</button><button class="ghost" id="exportV10">Export selected</button><button class="ghost" id="importV10">Import deck</button></div><input hidden id="importV10File" type="file" accept="application/json"><div class="list" style="margin-top:14px">${S.decks.map(d=>`<div class="row"><div><b>${esc(d.title)}</b><br><small>${d.cards.length} cards</small></div><div class="rowactions"><button class="ghost chooseV10Deck" data-id="${d.id}">${d.id===S.selectedDeck?"Selected":"Select"}</button><button class="ghost dupV10Deck" data-id="${d.id}">Duplicate</button></div></div>`).join("")}</div></div>`}
function show(v){$("#app").innerHTML=({cards,srs,games,mistakes,analytics,decks}[v]||hub)();bind(v)}
function bindHub(){$$(".v10open").forEach(b=>b.onclick=()=>show(b.dataset.open))}
function bind(v){$("#v10Back")?.addEventListener("click",open);$("#v10Deck")?.addEventListener("change",e=>{S.selectedDeck=e.target.value;save();show(v)});if(v==="cards")bindCards();if(v==="srs")bindSrs();if(v==="games")bindGames();if(v==="mistakes")bindMistakes();if(v==="decks")bindDecks()}
let editingCardId=null;
function bindCards(){
 let refresh=()=>{let q=$("#v10Search").value.toLowerCase(),f=$("#v10Filter").value;$("#v10CardList").innerHTML=cardRows(deck().cards.filter(c=>(f==="all"||c.type===f)&&JSON.stringify(c).toLowerCase().includes(q)));bindCardRows()};
 $("#v10Search").oninput=refresh;$("#v10Filter").onchange=refresh;
 $("#v10NewCard").onclick=()=>openCardEditor();
 $("#v10SaveCard").onclick=saveCardEditor;
 $("#v10CancelCard").onclick=closeCardEditor;
 ["#v10CardImage","#v10CardAudio"].forEach(sel=>$(sel)?.addEventListener("change",renderCardUploadPreview));
 bindCardRows()
}
function bindCardRows(){$$(".editV10").forEach(b=>b.onclick=()=>openCardEditor(b.dataset.id));$$(".delV10").forEach(b=>b.onclick=()=>{deck().cards=deck().cards.filter(c=>c.id!==b.dataset.id);save();show("cards")})}
function openCardEditor(cid=null){
 editingCardId=cid;
 const c=deck().cards.find(x=>x.id===cid);
 $("#v10CardEditor").classList.remove("hidden");
 $("#v10CardType").value=c?.type||"basic";
 $("#v10CardFront").value=c?.front||"";
 $("#v10CardBack").value=c?.back||"";
 $("#v10CardFamily").value=c?.wordFamily||"";
 $("#v10CardExample").value=c?.example||"";
 $("#v10CardTags").value=(c?.tags||[]).join(", ");
 $("#v10CardImage").value="";
 $("#v10CardAudio").value="";
 renderCardUploadPreview();
 $("#v10CardFront").focus();
}
function closeCardEditor(){editingCardId=null;$("#v10CardEditor")?.classList.add("hidden")}
function cardFileMeta(file,role){return file?{id:"card-media-"+Date.now()+"-"+Math.random(),role,name:file.name,type:file.type||"",size:file.size||0}:null}
function renderCardUploadPreview(){
 const c=deck().cards.find(x=>x.id===editingCardId),existing=c?.attachments||[];
 const fresh=[cardFileMeta($("#v10CardImage")?.files?.[0],"image"),cardFileMeta($("#v10CardAudio")?.files?.[0],"audio")].filter(Boolean);
 $("#v10CardUploadPreview").innerHTML=[...existing,...fresh].map(a=>`<div class="uploadChip"><b>${esc(a.role)}</b><span>${esc(a.name)}</span></div>`).join("");
}
function saveCardEditor(){
 const type=$("#v10CardType").value,front=$("#v10CardFront").value.trim(),back=$("#v10CardBack").value.trim();
 if(!front||!back)return alert("Front and back are required.");
 const existing=deck().cards.find(x=>x.id===editingCardId);
 const attachments=[...(existing?.attachments||[]),cardFileMeta($("#v10CardImage")?.files?.[0],"image"),cardFileMeta($("#v10CardAudio")?.files?.[0],"audio")].filter(Boolean);
 const data={type,front,back,example:$("#v10CardExample").value.trim(),wordFamily:type==="wordform"?$("#v10CardFamily").value.trim():"",tags:$("#v10CardTags").value.split(",").map(x=>x.trim()).filter(Boolean),attachments};
 if(existing)Object.assign(existing,data);else deck().cards.push({id:"v10-"+Date.now(),...data,due:0,interval:0,ease:2.5,reps:0,lapses:0,mastery:0});
 save();show("cards")
}
function bindSrs(){$("#v10Reveal")?.addEventListener("click",()=>{$("#v10answer").classList.remove("hidden");$("#v10grades").innerHTML=`<button class="ghost v10grade" data-q="1">Again</button><button class="ghost v10grade" data-q="3">Hard</button><button class="primary v10grade" data-q="4">Good</button><button class="darkbtn v10grade" data-q="5">Easy</button>`;$$(".v10grade").forEach(b=>b.onclick=()=>grade(+b.dataset.q))})}
function grade(q){let c=deck().cards.find(x=>x.id===$(".v10review").dataset.card),ok=q>=3;if(!ok){c.reps=0;c.interval=0;c.lapses=(c.lapses||0)+1;c.due=now()+10*60000;c.mastery=Math.max(0,(c.mastery||0)-10)}else{c.reps=(c.reps||0)+1;c.ease=Math.max(1.3,(c.ease||2.5)+(0.1-(5-q)*(0.08+(5-q)*0.02)));c.interval=c.reps===1?1:c.reps===2?6:Math.max(1,Math.round((c.interval||1)*c.ease));if(q===3)c.interval=Math.max(1,Math.round(c.interval*.7));if(q===5)c.interval=Math.max(2,Math.round(c.interval*1.3));c.due=now()+c.interval*86400000;c.mastery=Math.min(100,(c.mastery||0)+(q===5?18:q===4?14:8))}record("srs",c.front,String(q),c.back,ok,c.id);if(!ok)window.dispatchEvent(new CustomEvent("tina:wrong-answer",{detail:{source:"srs",prompt:c.front,target:c.back}}));else show("srs")}
function record(source,prompt,answer,target,correct,cardId){updateStreak();S.attempts.push({id:"a-"+Date.now()+"-"+Math.random(),source,prompt,answer,target,correct,cardId,at:new Date().toISOString()});if(!correct)S.mistakes.push({id:"m-"+Date.now()+"-"+Math.random(),source,prompt,answer,target,cardId,resolved:false,at:new Date().toISOString()});let c=deck().cards.find(x=>x.id===cardId);if(c)c.mastery=Math.max(0,Math.min(100,(c.mastery||0)+(correct?5:-6)));save()}
function bindGames(){$$(".v10game").forEach(b=>b.onclick=()=>startGame(b.dataset.game))}
function sample(n=1){return deck().cards.slice().sort(()=>Math.random()-.5).slice(0,n)}
function options(c,field="back"){return [c,...deck().cards.filter(x=>x.id!==c.id).sort(()=>Math.random()-.5).slice(0,3)].sort(()=>Math.random()-.5).map(x=>({id:x.id,text:x[field]||x.front}))}
function startGame(type){
 if(deck().cards.length<2)return alert("Add at least two cards.");
 if(type==="memory")return memoryGame();
 let c=sample(1)[0],promptText=c.front,target=c.back,mode="choice",opts=options(c,"back");
 if(["spelling","reverse","typing","scramble","missing","firstletter","lastletter","listenType","cloze"].includes(type)){promptText=c.back;target=c.type==="cloze"?c.back:c.front;mode="type"}
 if(type==="cloze"&&c.type==="cloze")promptText=c.front.replace(/\{\{(.*?)\}\}/g,"_____");
 if(type==="scramble")promptText=c.front.split("").sort(()=>Math.random()-.5).join(" ");
 if(type==="missing")promptText=c.front.replace(/[aeiou]/gi,"_");
 if(type==="firstletter"){promptText=`${c.back} · starts with "${c.front[0]}"`;target=c.front}
 if(type==="lastletter"){promptText=`${c.back} · ends with "${c.front.slice(-1)}"`;target=c.front}
 if(type==="length"){let len=c.front.length;promptText=`Choose the ${len}-letter word`;target=c.front;opts=options(c,"front")}
 if(type==="example"){promptText=c.example||c.back;target=c.front;opts=options(c,"front")}
 if(type==="tag"){promptText=c.front;target=(c.tags||[])[0]||"untagged";mode="type"}
 if(type==="truefalse"){let x=Math.random()>.5?c:deck().cards.find(x=>x.id!==c.id);promptText=`${c.front} = ${x.back}`;target=x.id===c.id?"True":"False";opts=[{text:"True"},{text:"False"}]}
 if(type==="listen"||type==="pronounce"){promptText="🔊 Listen";target=c.back;opts=options(c,"back");setTimeout(()=>speak(c.front),100)}
 if(type==="listenType"){promptText="🔊 Listen and type";target=c.front;setTimeout(()=>speak(c.front),100)}
 if(type==="odd"){let same=deck().cards.filter(x=>(x.tags||[])[0]===(c.tags||[])[0]&&x.id!==c.id).slice(0,2),odd=deck().cards.find(x=>(x.tags||[])[0]!== (c.tags||[])[0]);if(same.length===2&&odd){opts=[c,...same,odd].sort(()=>Math.random()-.5).map(x=>({text:x.front}));target=odd.front;promptText="Choose the word with a different primary tag"}}
 if(["lightning","survival","streak","boss","lives","marathon","random","choice","speed","definition","meaning","context","flip"].includes(type)){promptText=type==="context"?(c.example||c.front):c.front;target=c.back;opts=options(c,"back")}
 renderGame(type,c,promptText,target,mode,opts)
}
function renderGame(type,c,promptText,target,mode,opts){$("#app").innerHTML=head(G.find(x=>x[0]===type)?.[1]||"Game","Score is stored and wrong answers enter Mistake Recycling.")+`<article class="card v10play" data-game="${type}" data-card="${c.id}" data-target="${esc(target)}"><div class="eyebrow">Prompt</div><h2>${esc(promptText)}</h2>${mode==="type"?'<input id="v10GameInput" placeholder="Type exact answer…"><button class="primary" id="v10Submit">Submit</button>':`<div class="optiongrid">${opts.map(o=>`<button class="option v10ans">${esc(o.text)}</button>`).join("")}</div>`}<div id="v10GameFb"></div><button class="ghost" id="v10Next">Next</button></article></div>`;$("#v10Back").onclick=()=>show("games");$("#v10Next").onclick=()=>startGame(type);if(mode==="type")$("#v10Submit").onclick=()=>judge($("#v10GameInput").value,target,type,promptText,c.id);else $$(".v10ans").forEach(b=>b.onclick=()=>judge(b.textContent,target,type,promptText,c.id))}
function memoryGame(){let cs=sample(Math.min(4,deck().cards.length));let tiles=cs.flatMap(c=>[{key:c.id,text:c.front},{key:c.id,text:c.back}]).sort(()=>Math.random()-.5);$("#app").innerHTML=head("Memory Pairs","Match each word to its definition.")+`<article class="card"><div class="memoryGrid">${tiles.map((t,i)=>`<button class="memoryTile" data-key="${t.key}" data-i="${i}">${esc(t.text)}</button>`).join("")}</div><div id="v10GameFb"></div></article></div>`;$("#v10Back").onclick=()=>show("games");let first=null,locked=false,pairs=0;$$(".memoryTile").forEach(b=>b.onclick=()=>{if(locked||b.disabled)return;if(!first){first=b;b.classList.add("selected");return}locked=true;let ok=first.dataset.key===b.dataset.key&&first!==b;if(ok){first.disabled=b.disabled=true;first.classList.add("matched");b.classList.add("matched");pairs++;record("game:memory","Memory pair",first.textContent,b.textContent,true,first.dataset.key);first=null;locked=false;if(pairs===cs.length){S.gameBest.memory=Math.max(S.gameBest.memory||0,pairs);save();$("#v10GameFb").innerHTML='<div class="feedback ok">Board complete.</div>'}}else{record("game:memory",first.textContent,b.textContent,"matching definition",false,first.dataset.key);window.dispatchEvent(new CustomEvent("tina:wrong-answer",{detail:{source:"game:memory",prompt:first.textContent,answer:b.textContent,target:"matching definition"}}));setTimeout(()=>{first?.classList.remove("selected");first=null;locked=false},500)}})}
function judge(answer,target,type,promptText,cardId){let ok=answer.trim().toLowerCase()===target.trim().toLowerCase();record("game:"+type,promptText,answer,target,ok,cardId);if(ok)S.gameBest[type]=Math.max(S.gameBest[type]||0,(S.gameBest[type]||0)+1);save();$("#v10GameFb").innerHTML=`<div class="feedback ${ok?"ok":"bad"}">${ok?"Correct.":"Target: "+esc(target)}</div>`;if(!ok)window.dispatchEvent(new CustomEvent("tina:wrong-answer",{detail:{source:"game:"+type,prompt:promptText,answer,target}}))}
function speak(t){speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(t);u.lang="en-GB";u.rate=.85;speechSynthesis.speak(u)}
function bindMistakes(){$$(".retryMistake").forEach(b=>b.onclick=()=>{let m=S.mistakes.find(x=>x.id===b.dataset.id);$("#app").innerHTML=head("Retry Mistake","Recover the exact target before resolving it.")+`<article class="card v10play"><h2>${esc(m.prompt)}</h2><input id="retryInput" placeholder="Type target…"><button class="primary" id="retryCheck">Check</button><div id="retryFb"></div></article></div>`;$("#v10Back").onclick=()=>show("mistakes");$("#retryCheck").onclick=()=>{let a=$("#retryInput").value,ok=a.trim().toLowerCase()===m.target.trim().toLowerCase();$("#retryFb").innerHTML=`<div class="feedback ${ok?"ok":"bad"}">${ok?"Recovered.":"Target: "+esc(m.target)}</div>`;if(ok){m.resolved=true;m.resolvedAt=new Date().toISOString();record("mistake-retry",m.prompt,a,m.target,true,m.cardId);save()}}})}
function bindDecks(){
 $("#newV10Deck").onclick=()=>{let t=prompt("Deck title");if(!t)return;let id="deck-"+Date.now();S.decks.push({id,title:t,cards:[]});S.selectedDeck=id;save();show("decks")};
 $$(".chooseV10Deck").forEach(b=>b.onclick=()=>{S.selectedDeck=b.dataset.id;save();show("decks")});
 $$(".dupV10Deck").forEach(b=>b.onclick=()=>{let d=S.decks.find(x=>x.id===b.dataset.id),n=JSON.parse(JSON.stringify(d));n.id="deck-"+Date.now();n.title+=" Copy";n.cards.forEach(c=>c.id="c-"+Date.now()+"-"+Math.random());S.decks.push(n);save();show("decks")});
 $("#exportV10").onclick=()=>{let blob=new Blob([JSON.stringify(deck(),null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=deck().id+".json";a.click()};
 $("#importV10").onclick=()=>$("#importV10File").click();$("#importV10File").onchange=e=>{let f=e.target.files[0],r=new FileReader();r.onload=()=>{try{let d=JSON.parse(r.result);if(!Array.isArray(d.cards))throw 0;d.id="deck-"+Date.now();S.decks.push(d);S.selectedDeck=d.id;save();show("decks")}catch{alert("Invalid deck JSON.")}};r.readAsText(f)}
}
save();
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(nav,280));else setTimeout(nav,280);
})();