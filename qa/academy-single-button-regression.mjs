import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,"..");
const SOURCE_PATH=path.join(ROOT,"workspace-completion-v14.js");
const source=fs.readFileSync(SOURCE_PATH,"utf8");
const results=[];

function check(name,pass,detail=""){
  results.push({name,pass:!!pass,detail:String(detail)});
}

function extractFunction(src,name){
  const marker=`function ${name}(`;
  const start=src.indexOf(marker);
  if(start<0)throw new Error(`Missing function: ${name}`);
  const brace=src.indexOf("{",start);
  let depth=0, quote=null, escape=false, templateDepth=0;
  for(let i=brace;i<src.length;i++){
    const ch=src[i], prev=src[i-1];
    if(quote){
      if(escape){escape=false;continue}
      if(ch==="\\"){escape=true;continue}
      if(quote==="`" && ch==="$" && src[i+1]==="{"){templateDepth++;i++;continue}
      if(quote==="`" && ch==="}" && templateDepth>0){templateDepth--;continue}
      if(ch===quote && templateDepth===0)quote=null;
      continue;
    }
    if(ch==="'"||ch==='"'||ch==="`"){quote=ch;continue}
    if(ch==="{")depth++;
    if(ch==="}"){depth--;if(depth===0)return src.slice(start,i+1)}
  }
  throw new Error(`Unclosed function: ${name}`);
}

class FakeStyle{
  constructor(){this.map=new Map()}
  removeProperty(k){this.map.delete(k)}
}
class FakeButton{
  constructor({id="",dataset={},text=""}={}){
    this.id=id;this.dataset={...dataset};this.textContent=text;
    this.style=new FakeStyle();this.disabled=false;this.onclick=null;
    this.attributes=new Map();this.type="button";this.className="";
  }
  removeAttribute(k){this.attributes.delete(k)}
}
class FakeHeading{constructor(text){this.textContent=text}}
class FakeCard{
  constructor(title,buttons=[]){this.title=title;this.buttons=buttons}
  querySelector(selector){
    if(selector==="h3,h2")return new FakeHeading(this.title);
    const parts=selector.split(",").map(x=>x.trim());
    for(const part of parts){
      let m=part.match(/^\[data-superadmin-open="([^"]+)"\]$/);
      if(m){const b=this.buttons.find(x=>x.dataset.superadminOpen===m[1]);if(b)return b}
      m=part.match(/^\[data-go="([^"]+)"\]$/);
      if(m){const b=this.buttons.find(x=>x.dataset.go===m[1]);if(b)return b}
      if(part.startsWith("#")){
        const b=this.buttons.find(x=>x.id===part.slice(1));if(b)return b;
      }
    }
    return null;
  }
  appendChild(b){this.buttons.push(b);return b}
}
function buildHarness(superadmin=true){
  const academyExisting=new FakeButton({id:"saAcademy",text:"Open Tina Academy"});
  const cards=[
    new FakeCard("Tina Academy",[academyExisting]),
    new FakeCard("Authoring Hub",[]),
    new FakeCard("Data Manager",[])
  ];
  const clicks=[];
  const document={
    querySelectorAll(selector){
      if(selector==='[data-admin-only="true"],.adminOnlyAction')return [];
      if(selector==="#app .card")return cards;
      if(selector==="[data-superadmin-open]")return cards.flatMap(c=>c.buttons).filter(b=>b.dataset.superadminOpen);
      return [];
    },
    createElement(tag){if(tag!=="button")throw new Error(`Unexpected element ${tag}`);return new FakeButton()}
  };
  const context={
    document,
    isSuperadmin:()=>superadmin,
    clickDataView:(route)=>clicks.push(route),
    console
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(source,"ensureSuperadminHomeAccessButtons"),context);
  return {context,cards,academyExisting,clicks};
}

try{
  const markupMatches=[...source.matchAll(/id=["']saAcademy["'][^>]*>\s*Open Tina Academy\s*<\/button>/g)];
  check("academy-home-markup-has-one-existing-button",markupMatches.length===1,`matches=${markupMatches.length}`);

  const fn=extractFunction(source,"ensureSuperadminHomeAccessButtons");
  check("closure-recognizes-existing-saAcademy",fn.includes('route==="academy"?"Academy"'),"selector maps academy to #saAcademy");

  const h=buildHarness(true);
  h.context.ensureSuperadminHomeAccessButtons();
  const academy=h.cards[0];

  check("first-run-does-not-duplicate-academy-button",academy.buttons.length===1,`buttons=${academy.buttons.length}`);
  check("existing-academy-button-is-reused",academy.buttons[0]===h.academyExisting);
  check("existing-button-receives-route-dataset",academy.buttons[0].dataset.superadminOpen==="academy",academy.buttons[0].dataset.superadminOpen);
  check("existing-button-is-enabled",academy.buttons[0].disabled===false);

  h.context.ensureSuperadminHomeAccessButtons();
  check("second-run-is-idempotent",academy.buttons.length===1,`buttons=${academy.buttons.length}`);

  academy.buttons[0].onclick?.();
  check("academy-button-opens-academy-route",h.clicks.at(-1)==="academy",`click=${h.clicks.at(-1)}`);

  check("authoring-hub-gets-exactly-one-button",h.cards[1].buttons.length===1,`buttons=${h.cards[1].buttons.length}`);
  check("data-manager-gets-exactly-one-button",h.cards[2].buttons.length===1,`buttons=${h.cards[2].buttons.length}`);

  const guarded=buildHarness(false);
  guarded.context.ensureSuperadminHomeAccessButtons();
  check("non-superadmin-guard-does-not-mutate",guarded.cards[1].buttons.length===0&&guarded.cards[2].buttons.length===0);
}catch(err){
  check("test-runner-execution",false,err?.stack||err);
}

const failed=results.filter(x=>!x.pass);
console.log(JSON.stringify({
  suite:"v14-final-academy-single-button-regression",
  generatedAt:new Date().toISOString(),
  passed:results.length-failed.length,
  failed:failed.length,
  results
},null,2));
if(failed.length)process.exitCode=1;
