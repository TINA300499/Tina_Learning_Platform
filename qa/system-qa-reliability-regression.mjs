import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const src=fs.readFileSync(path.join(ROOT,"workspace-completion-v14.js"),"utf8");
const results=[];
const check=(name,pass,detail="")=>results.push({name,pass:!!pass,detail:String(detail)});

check("superadmin-sidebar-has-system-qa",src.includes('["System QA & Reliability","system-qa-extra"]'));
check("system-qa-route-registered",src.includes('"system-qa-extra":systemQAReliabilityView'));
check("superadmin-guard-present",/function systemQAReliabilityView\(\)\{\s*if\(!isSuperadmin\(\)\)/.test(src));
check("monitor-installed-once",src.includes("window.__tinaSystemQAMonitorInstalled"));
check("javascript-error-listener",src.includes('window.addEventListener("error"'));
check("unhandled-rejection-listener",src.includes('window.addEventListener("unhandledrejection"'));
check("behavior-click-metadata",src.includes('qaRecordBehavior("click",qaBehaviorTarget(el))'));
check("no-input-value-capture",!src.includes('qaRecordBehavior("input"')&&!src.includes('qaRecordBehavior("keydown"'));
check("repeat-threshold-three",src.includes("SYSTEM_QA_REPEAT_THRESHOLD=3"));
check("repeat-window-ten-minutes",src.includes("SYSTEM_QA_REPEAT_WINDOW_MS=10*60*1000"));
check("incident-lifecycle",["acknowledged","resolved","reopened"].every(x=>src.includes(`qa.incident.${x}`)));
check("backend-telemetry-bridge",src.includes('type:"qa.runtime.error"'));
check("fix-location-record-created",src.includes('fix:{status:"untriaged",location:sanitizeQAText(meta.source||"")'));
check("fix-editor-present",src.includes("function qaOpenFixEditor(id)"));
check("fix-version-tracking",src.includes("Patch / version / commit"));
check("copy-fix-context",src.includes("function qaCopyFixContext(id)"));
check("fix-lifecycle-statuses",["untriaged","investigating","fix-planned","fix-in-progress","fixed","verified"].every(x=>src.includes(`"${x}"`)));
check("disposable-qa-remains",src.includes("function runDisposableSystemQA()"));
check("no-mutation-observer-added",!src.slice(src.indexOf("SYSTEM QA & RELIABILITY CENTER"),src.indexOf("function qaSandboxView")).includes("MutationObserver"));
check("no-polling-loop-added",!src.slice(src.indexOf("SYSTEM QA & RELIABILITY CENTER"),src.indexOf("function qaSandboxView")).includes("setInterval("));

const failed=results.filter(x=>!x.pass);
console.log(JSON.stringify({suite:"v14-final-system-qa-reliability",passed:results.length-failed.length,failed:failed.length,results},null,2));
if(failed.length)process.exitCode=1;
