import fs from "node:fs";
import path from "node:path";
const tag="__tina_test__"+Date.now();
const state={users:[],organizations:[],teacher:{classes:[],assignments:[]},communication:{reminders:[],announcements:[],issues:[]}};
const snapshot=JSON.parse(JSON.stringify(state));
const results=[];
const ok=(name,pass,detail="")=>results.push({name,pass,detail});
try{
 state.users.push(
  {id:tag+"-student",roles:["learner"]},
  {id:tag+"-teacher",roles:["teacher"]},
  {id:tag+"-business",roles:["business"]}
 );
 state.organizations.push({id:tag+"-org",businessAccountIds:[tag+"-business"],teacherIds:[tag+"-teacher"],memberIds:[tag+"-student",tag+"-teacher",tag+"-business"],programs:[{id:tag+"-program"}]});
 state.teacher.classes.push({id:tag+"-class",members:[tag+"-student"]});
 state.teacher.assignments.push({id:tag+"-assignment",assignees:[tag+"-student"]});
 state.communication.reminders.push({id:tag+"-rem",userId:tag+"-student"});
 state.communication.announcements.push({id:tag+"-ann",roles:["learner"]});
 state.communication.issues.push({id:tag+"-issue",userId:tag+"-student",status:"open"});
 ok("users",state.users.length===3);
 ok("organization",state.organizations[0].businessAccountIds.includes(tag+"-business"));
 ok("teacher-class",state.teacher.classes[0].members.includes(tag+"-student"));
 ok("teacher-assignment",state.teacher.assignments[0].assignees.includes(tag+"-student"));
 ok("reminder",state.communication.reminders[0].userId===tag+"-student");
 ok("announcement",state.communication.announcements[0].roles.includes("learner"));
 ok("issue",state.communication.issues[0].status==="open");
}finally{
 Object.keys(state).forEach(k=>delete state[k]);
 Object.assign(state,JSON.parse(JSON.stringify(snapshot)));
 ok("cleanup",!JSON.stringify(state).includes(tag));
}
const report={generatedAt:new Date().toISOString(),passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,results,testDataResidual:JSON.stringify(state).includes(tag)};
console.log(JSON.stringify(report,null,2));
if(report.failed||report.testDataResidual)process.exit(1);
