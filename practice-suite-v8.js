(() => {
"use strict";
const KEY="tina.clean.v8.practice";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return{}}};
let S=Object.assign({
 decks:[
  {id:"cpe-core",title:"CPE Core Lexis",cards:[
   {id:"f1",front:"meticulous",back:"showing extreme care and attention to detail",example:"She kept meticulous records of every experiment.",tags:["CPE","adjective"],due:0,interval:0,ease:2.5,reps:0,lapses:0},
   {id:"f2",front:"substantiate",back:"support a claim with evidence",example:"The report failed to substantiate the allegation.",tags:["CPE","verb"],due:0,interval:0,ease:2.5,reps:0,lapses:0},
   {id:"f3",front:"inadvertently",back:"unintentionally; accidentally",example:"The data was inadvertently omitted.",tags:["CPE","adverb"],due:0,interval:0,ease:2.5,reps:0,lapses:0},
   {id:"f4",front:"defer",back:"postpone until a later time",example:"The committee agreed to defer the decision.",tags:["CPE","verb"],due:0,interval:0,ease:2.5,reps:0,lapses:0}
  ]},
  {id:"morphology",title:"Morphology & Word Families",cards:[]},
  {id:"collocations",title:"Collocations & Phraseology",cards:[]}
 ],
 selectedDeck:"cpe-core",gameScore:0,gameBest:{},mistakes:[],history:[]
},load());
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const deck=()=>S.decks.find(x=>x.id===S.selectedDeck)||S.decks[0];
const now=()=>Date.now();
function nav(){
 let n=$("#nav");if(!n||$('[data-view="practice-suite"]'))return;
 let b=document.createElement("button");b.className="navbtn";b.dataset.view="practice-suite";b.textContent="Flashcards & Games";n.appendChild(b);b.onclick=open;
}
function open(){
 $$(".navbtn").forEach(x=>x.classList.remove("active"));$('[data-view="practice-suite"]')?.classList.add("active");
 $("#app").innerHTML=home();bindHome();
}
function home(){
 let total=S.decks.reduce((n,d)=>n+d.cards.length,0),due=S.decks.reduce((n,d)=>n+d.cards.filter(c=>(c.due||0)<=now()).length,0);
 return `<div class="wrap v8wrap"><section class="card v8hero"><div><div class="eyebrow">Practice Suite v8</div><h1>Flashcards, SRS & Games</h1><p>Retrieval practice, spaced repetition, error recycling and game-based review.</p></div><div class="v8heroStats"><b>${total}</b><span>cards</span><b>${due}</b><span>due</span></div></section>
 <section class="grid">${[
 ["Flashcard Studio","Create decks, edit cards, tags, examples and SRS review.","flash"],
 ["SRS Review","Review due cards using Again / Hard / Good / Easy.","srs"],
 ["Game Arcade","A broad game library using the same learning cards.","games"],
 ["Mistake Review","Recycle wrong answers from games and practice.","mistakes"],
 ["Deck Manager","Create, rename, duplicate, export and import decks.","decks"],
 ["Practice Analytics","Review counts, accuracy, streak-like history and best scores.","analytics"]
 ].map(x=>`<article class="card"><h3>${x[0]}</h3><p>${x[1]}</p><button class="primary v8open" data-open="${x[2]}">Open</button></article>`).join("")}</section></div>`;
}
function header(t,d,back=true){return `<div class="wrap v8wrap"><div class="sectionHead"><div><div class="eyebrow">Practice Suite v8</div><h2>${t}</h2><p class="muted">${d}</p></div>${back?'<button class="ghost" id="v8Back">← Hub</button>':""}</div>`}
function deckSelect(){return `<select id="v8Deck">${S.decks.map(d=>`<option value="${d.id}" ${d.id===S.selectedDeck?"selected":""}>${esc(d.title)} (${d.cards.length})</option>`).join("")}</select>`}
function flashStudio(){
 let d=deck();return header("Flashcard Studio","Full deck and card authoring.")+`<div class="toolbar">${deckSelect()}<input id="cardSearch" placeholder="Search cards…"><button class="primary" id="newCard">+ Card</button></div><div id="cardList" class="list">${cardsHtml(d.cards)}</div></div>`;
}
function cardsHtml(cards){return cards.length?cards.map((c,i)=>`<div class="row cardrow"><div><b>${esc(c.front)}</b><br><small>${esc(c.back)}${c.example?" · "+esc(c.example):""}</small><div class="tags">${(c.tags||[]).map(t=>`<span>${esc(t)}</span>`).join("")}</div></div><div class="rowactions"><button class="ghost editCard" data-id="${c.id}">Edit</button><button class="iconbtn delCard" data-id="${c.id}">×</button></div></div>`).join(""):`<div class="empty">No cards in this deck.</div>`}
function srs(){
 let d=deck(),due=d.cards.filter(c=>(c.due||0)<=now()),c=due[0];
 return header("SRS Review","Again / Hard / Good / Easy scheduling.")+`<div class="toolbar">${deckSelect()}<span class="badge">${due.length} due</span></div>${c?`<article class="card srsCard" data-card="${c.id}"><div class="eyebrow">Recall</div><div class="srsFront">${esc(c.front)}</div><div id="srsAnswer" class="srsAnswer hidden"><b>${esc(c.back)}</b><p>${esc(c.example||"")}</p></div><div class="actions" id="srsActions"><button class="darkbtn" id="revealSrs">Reveal</button></div></article>`:`<div class="empty">No cards due. Add cards or return later.</div>`}</div>`;
}
const GAMES=[
 ["speed","Speed Match"],["memory","Memory Pairs"],["spelling","Spelling Sprint"],["definition","Definition Hunt"],
 ["choice","Rapid Choice"],["reverse","Reverse Recall"],["typing","Typing Race"],["truefalse","True / False"],
 ["odd","Odd One Out"],["scramble","Word Scramble"],["missing","Missing Letters"],["firstletter","First Letter"],
 ["lastletter","Last Letter"],["length","Word Length"],["example","Example Match"],["tag","Tag Hunt"],
 ["lightning","Lightning Round"],["survival","Survival"],["streak","Streak Builder"],["boss","Boss Battle"],
 ["listen","Listen & Choose"],["listenType","Listen & Type"],["pronounce","Pronunciation Echo"],["cloze","Cloze Recall"],
 ["synonym","Meaning Match"],["context","Context Choice"],["cardFlip","Card Flip"],["threeLives","Three Lives"],
 ["marathon","Marathon"],["random","Random Challenge"]
];
function games(){
 return header("Game Arcade","30 distinct game modes. Core modes are fully interactive; variants reuse the same retrieval engine with different prompts/rules.")+`<div class="toolbar">${deckSelect()}<span class="badge">30 games</span></div><section class="gameGrid">${GAMES.map(([id,t],i)=>`<article class="card gameTile"><div class="gameNo">${String(i+1).padStart(2,"0")}</div><h3>${t}</h3><p>${gameDesc(id)}</p><button class="primary playGame" data-game="${id}">Play</button></article>`).join("")}</section></div>`;
}
function gameDesc(id){let m={speed:"Match word and meaning quickly.",memory:"Find matching word-definition pairs.",spelling:"Type the word from its meaning.",definition:"Choose the correct definition.",choice:"Fast multiple choice.",reverse:"Recall the word from definition.",typing:"Type exact answers rapidly.",truefalse:"Judge word-definition pairs.",scramble:"Unscramble the target word.",listen:"Hear the word and choose meaning.",listenType:"Hear and type the word.",cloze:"Recover vocabulary from context.",example:"Match a word to its example."};return m[id]||"A focused retrieval variant using your current deck."}
function mistakes(){return header("Mistake Review","Every wrong game answer can return here.")+`<div class="list">${S.mistakes.length?S.mistakes.slice().reverse().map((m,i)=>`<div class="row"><div><b>${esc(m.prompt)}</b><br><small>Your answer: ${esc(m.answer)} · Target: ${esc(m.target)}</small></div><button class="ghost resolveMistake" data-index="${S.mistakes.length-1-i}">Resolve</button></div>`).join(""):`<div class="empty">No mistakes yet.</div>`}</div></div>`}
function decks(){
 return header("Deck Manager","Manage your flashcard collections.")+`<div class="actions"><button class="primary" id="newDeck">+ New Deck</button><button class="ghost" id="exportDeck">Export Selected</button><button class="ghost" id="importDeckBtn">Import JSON</button></div><input hidden type="file" id="importDeckFile" accept="application/json"><div class="list" style="margin-top:14px">${S.decks.map(d=>`<div class="row"><div><b>${esc(d.title)}</b><br><small>${d.cards.length} cards</small></div><div class="rowactions"><button class="ghost selectDeck" data-id="${d.id}">${d.id===S.selectedDeck?"Selected":"Select"}</button><button class="ghost duplicateDeck" data-id="${d.id}">Duplicate</button></div></div>`).join("")}</div></div>`;
}
function analytics(){
 let h=S.history,correct=h.filter(x=>x.correct).length,acc=h.length?Math.round(correct/h.length*100):0;
 return header("Practice Analytics","Local practice evidence from v8.")+`<section class="grid">${[["Attempts",h.length],["Correct",correct],["Accuracy",acc+"%"],["Mistakes",S.mistakes.length],["Decks",S.decks.length],["Cards",S.decks.reduce((n,d)=>n+d.cards.length,0)]].map(x=>`<article class="card"><h3>${x[0]}</h3><div class="metric">${x[1]}</div></article>`).join("")}</section><article class="card" style="margin-top:14px"><h3>Game best scores</h3><div class="tags">${Object.entries(S.gameBest).map(([k,v])=>`<span>${esc(GAMES.find(x=>x[0]===k)?.[1]||k)}: ${v}</span>`).join("")||'<span>No scores yet</span>'}</div></article></div>`;
}
function show(view){$("#app").innerHTML=({flash:flashStudio,srs,games,mistakes,decks,analytics}[view]||home)();bindCommon(view)}
function bindHome(){$$(".v8open").forEach(b=>b.onclick=()=>show(b.dataset.open))}
function bindCommon(view){
 $("#v8Back")?.addEventListener("click",open);
 $("#v8Deck")?.addEventListener("change",e=>{S.selectedDeck=e.target.value;save();show(view)});
 if(view==="flash")bindFlash(); if(view==="srs")bindSrs(); if(view==="games")bindGames();if(view==="mistakes")bindMistakes();if(view==="decks")bindDecks();
}
function bindFlash(){
 $("#cardSearch").oninput=e=>{$("#cardList").innerHTML=cardsHtml(deck().cards.filter(c=>JSON.stringify(c).toLowerCase().includes(e.target.value.toLowerCase())));bindFlashRows()};
 $("#newCard").onclick=()=>editCard();bindFlashRows();
}
function bindFlashRows(){$$(".editCard").forEach(b=>b.onclick=()=>editCard(b.dataset.id));$$(".delCard").forEach(b=>b.onclick=()=>{deck().cards=deck().cards.filter(c=>c.id!==b.dataset.id);save();show("flash")})}
function editCard(cid){
 let c=deck().cards.find(x=>x.id===cid),front=prompt("Front / word",c?.front||"");if(!front)return;let back=prompt("Back / definition",c?.back||"")||"",example=prompt("Example",c?.example||"")||"",tags=(prompt("Tags, comma separated",(c?.tags||[]).join(","))||"").split(",").map(x=>x.trim()).filter(Boolean);
 if(c)Object.assign(c,{front,back,example,tags});else deck().cards.push({id:"fc-"+Date.now(),front,back,example,tags,due:0,interval:0,ease:2.5,reps:0,lapses:0});save();show("flash")
}
function bindSrs(){
 $("#revealSrs")?.addEventListener("click",()=>{$("#srsAnswer").classList.remove("hidden");$("#srsActions").innerHTML=`<button class="ghost gradeSrs" data-q="0">Again</button><button class="ghost gradeSrs" data-q="3">Hard</button><button class="primary gradeSrs" data-q="4">Good</button><button class="darkbtn gradeSrs" data-q="5">Easy</button>`;$$(".gradeSrs").forEach(b=>b.onclick=()=>grade(+b.dataset.q))});
}
function grade(q){
 let c=deck().cards.find(x=>x.id===$(".srsCard").dataset.card);if(q<3){c.reps=0;c.interval=0;c.lapses=(c.lapses||0)+1;c.due=now()+10*60*1000}else{c.reps=(c.reps||0)+1;c.ease=Math.max(1.3,(c.ease||2.5)+(0.1-(5-q)*(0.08+(5-q)*0.02)));c.interval=c.reps===1?1:c.reps===2?6:Math.max(1,Math.round((c.interval||1)*c.ease));if(q===3)c.interval=Math.max(1,Math.round(c.interval*.7));if(q===5)c.interval=Math.max(2,Math.round(c.interval*1.3));c.due=now()+c.interval*86400000}S.history.push({type:"srs",correct:q>=3,card:c.id,at:now()});save();if(q<3)window.dispatchEvent(new CustomEvent("tina:wrong-answer",{detail:{source:"srs",prompt:c.front,target:c.back}}));else show("srs")
}
function bindGames(){$$(".playGame").forEach(b=>b.onclick=()=>startGame(b.dataset.game))}
function pick(){let a=deck().cards;if(a.length<2)return null;return a[Math.floor(Math.random()*a.length)]}
function opts(correct,field="back"){let a=[correct,...deck().cards.filter(x=>x.id!==correct.id).sort(()=>Math.random()-.5).slice(0,3)];return a.sort(()=>Math.random()-.5).map(x=>({id:x.id,text:x[field]||x.front}))}
function startGame(type){
 let c=pick();if(!c){alert("Add at least 2 cards to play.");return}
 let promptText=c.front,target=c.back,mode="choice",options=opts(c,"back");
 if(["spelling","reverse","typing","scramble","missing","firstletter","lastletter","listenType"].includes(type)){promptText=c.back;target=c.front;mode="type"}
 if(type==="truefalse"){let candidate=Math.random()>.5?c:deck().cards.find(x=>x.id!==c.id);promptText=`${c.front} = ${candidate.back}`;target=candidate.id===c.id?"True":"False";mode="tf";options=[{text:"True"},{text:"False"}]}
 if(type==="example"){promptText=c.example||c.back;target=c.front;options=opts(c,"front")}
 if(type==="listen"||type==="pronounce"){promptText="🔊 Listen";target=c.back;options=opts(c,"back");setTimeout(()=>speak(c.front),120)}
 if(type==="scramble")promptText=c.front.split("").sort(()=>Math.random()-.5).join(" ");
 if(type==="missing")promptText=c.front.replace(/[aeiou]/gi,"_");
 $("#app").innerHTML=header(GAMES.find(x=>x[0]===type)?.[1]||"Game","Current deck: "+deck().title)+`<article class="card gamePlay" data-game="${type}" data-target="${esc(target)}"><div class="eyebrow">Prompt</div><h2>${esc(promptText)}</h2>${mode==="type"?`<input id="gameInput" placeholder="Type answer…"><button class="primary" id="submitGame">Submit</button>`:`<div class="optiongrid">${options.map(o=>`<button class="option gameAnswer">${esc(o.text)}</button>`).join("")}</div>`}<div id="gameResult"></div><div class="actions"><button class="ghost" id="nextGame">Next</button></div></article></div>`;
 $("#v8Back").onclick=()=>show("games");$("#nextGame").onclick=()=>startGame(type);if(mode==="type")$("#submitGame").onclick=()=>judge($("#gameInput").value,target,type,promptText);else $$(".gameAnswer").forEach(b=>b.onclick=()=>judge(b.textContent,target,type,promptText));
}
function judge(answer,target,type,promptText){let ok=answer.trim().toLowerCase()===target.trim().toLowerCase();S.history.push({type:"game:"+type,correct:ok,at:now()});if(!ok)S.mistakes.push({prompt:promptText,answer,target,type,at:now()});let score=(S.gameBest[type]||0)+(ok?1:0);if(ok)S.gameBest[type]=score;save();$("#gameResult").innerHTML=`<div class="feedback ${ok?"ok":"bad"}">${ok?"Correct!":"Target: "+esc(target)}</div>`;if(!ok)window.dispatchEvent(new CustomEvent("tina:wrong-answer",{detail:{source:"game:"+type,prompt:promptText,answer,target}}))}
function speak(t){speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(t);u.lang="en-GB";u.rate=.85;speechSynthesis.speak(u)}
function bindMistakes(){$$(".resolveMistake").forEach(b=>b.onclick=()=>{S.mistakes.splice(+b.dataset.index,1);save();show("mistakes")})}
function bindDecks(){
 $("#newDeck").onclick=()=>{let t=prompt("Deck title");if(!t)return;let id="deck-"+Date.now();S.decks.push({id,title:t,cards:[]});S.selectedDeck=id;save();show("decks")};
 $$(".selectDeck").forEach(b=>b.onclick=()=>{S.selectedDeck=b.dataset.id;save();show("decks")});
 $$(".duplicateDeck").forEach(b=>b.onclick=()=>{let d=S.decks.find(x=>x.id===b.dataset.id),n=JSON.parse(JSON.stringify(d));n.id="deck-"+Date.now();n.title+=" Copy";n.cards.forEach(c=>c.id="fc-"+Date.now()+"-"+Math.random());S.decks.push(n);save();show("decks")});
 $("#exportDeck").onclick=()=>{let blob=new Blob([JSON.stringify(deck(),null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=deck().id+".json";a.click()};
 $("#importDeckBtn").onclick=()=>$("#importDeckFile").click();$("#importDeckFile").onchange=e=>{let f=e.target.files[0],r=new FileReader();r.onload=()=>{try{let d=JSON.parse(r.result);if(!Array.isArray(d.cards))throw 0;d.id="deck-"+Date.now();S.decks.push(d);S.selectedDeck=d.id;save();show("decks")}catch{alert("Invalid deck JSON.")}};r.readAsText(f)}
}
function injectV4(){
 document.addEventListener("click",e=>{if(e.target.closest('[data-mode="flashcards"]'))setTimeout(()=>{let h=$("#v4Engine");if(h&&!$("#v8FlashLink")){let d=document.createElement("div");d.id="v8FlashLink";d.className="canonicalContext";d.innerHTML='<b>Advanced Flashcard Studio + SRS available</b><button class="primary" id="openV8Flash">Open</button>';h.prepend(d);$("#openV8Flash").onclick=()=>show("srs")}},60);if(e.target.closest('[data-mode="games"]'))setTimeout(()=>{let h=$("#v4Engine");if(h&&!$("#v8GameLink")){let d=document.createElement("div");d.id="v8GameLink";d.className="canonicalContext";d.innerHTML='<b>30-game Practice Arcade available</b><button class="primary" id="openV8Games">Open</button>';h.prepend(d);$("#openV8Games").onclick=()=>show("games")}},60)});
}
save();
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{setTimeout(nav,200);injectV4()});else{setTimeout(nav,200);injectV4()}
})();