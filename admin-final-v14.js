(() => {
"use strict";
const KEY="tina.v14.admin", SESSION="tina.v14.admin.session", USERS_KEY="tina.v14.users", ACTIVE_USER_KEY="tina.v14.active.user", USER_SESSION_KEY="tina.v14.user.session";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const cfg=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return{}}};
const loadCfg=cfg;
function saveCfg(x){localStorage.setItem(KEY,JSON.stringify(x||{}))}
const DEFAULT_ADMIN_USERNAME="admin";
const DEFAULT_ADMIN_HASH="03230de7cd9e2af0b5a5f4b8e49c54deae3747e397aabb8d54a9f9c8b565d7a5";
function seedInitialAdmin(){
  let c=cfg(),changed=false;
  if(!c.username){c.username=DEFAULT_ADMIN_USERNAME;changed=true}
  if(!c.hash){c.hash=DEFAULT_ADMIN_HASH;c.createdAt=new Date().toISOString();changed=true}
  if(typeof c.allowUserRegistration!=="boolean"){c.allowUserRegistration=true;changed=true}
  if(changed)saveCfg(c);
  try{
    let store=userStore();
    if(!store.users.some(u=>u.role==="admin"&&u.email===DEFAULT_ADMIN_USERNAME)){
      store.users.unshift({id:"usr-admin-default",name:"Tina Administrator",email:DEFAULT_ADMIN_USERNAME,role:"admin",status:"active",passwordHash:c.hash,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),lastLoginAt:null,notes:"Initial local administrator"});
      saveUserStore(store);
    }
  }catch{}
  return c;
}

const isSuperadminSession=()=>{try{return JSON.parse(sessionStorage.getItem(USER_SESSION_KEY)||"null")?.role==="superadmin"||sessionStorage.getItem("tina.v14.superadmin.session")==="1"}catch{return false}};
const isAdmin=()=>sessionStorage.getItem(SESSION)==="1"||isSuperadminSession();
async function digest(s){let b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function setPassword(p){let c=cfg();c.hash=await digest(p);c.username=c.username||DEFAULT_ADMIN_USERNAME;c.updatedAt=new Date().toISOString();if(!c.createdAt)c.createdAt=c.updatedAt;saveCfg(c);syncAdminManagedUserPassword(c.hash)}
function syncAdminManagedUserPassword(hash){try{let store=userStore(),u=store.users.find(x=>x.role==="admin"&&x.email===(cfg().username||DEFAULT_ADMIN_USERNAME));if(u){u.passwordHash=hash;u.updatedAt=new Date().toISOString();saveUserStore(store)}}catch{}}
async function loginAdmin(username,p){let c=seedInitialAdmin(),name=(username||"").trim().toLowerCase(),expected=(c.username||DEFAULT_ADMIN_USERNAME).toLowerCase();if(name!==expected)return false;let ok=(await digest(p))===c.hash;if(ok)sessionStorage.setItem(SESSION,"1");return ok}
async function login(p){return loginAdmin(cfg().username||DEFAULT_ADMIN_USERNAME,p)}



function installRegistrationAdminCard(){
  // Registration governance belongs exclusively to Superadmin → Authentication Gates.
  return;
}


function adminPasswordEditorView(){
 return `<div class="wrap v14wrap">
   <div class="sectionHead">
     <div><div class="eyebrow">ADMIN · SECURITY</div><h2>Change Admin Password</h2><p class="muted">Verify the current password, then set and confirm a new password.</p></div>
     <button class="ghost" id="backFromPasswordEditor">← Admin</button>
   </div>
   <section class="card passwordEditorCard">
     <div class="formgrid">
       <label class="fieldLabel">Current admin password
         <div class="passwordInputWrap"><input id="adminCurrentPassword" type="password" autocomplete="current-password" placeholder="Enter current password"><button type="button" class="passwordEye" data-target="adminCurrentPassword">Show</button></div>
       </label>
       <label class="fieldLabel">New admin password
         <div class="passwordInputWrap"><input id="adminNewPassword" type="password" autocomplete="new-password" placeholder="Minimum 6 characters"><button type="button" class="passwordEye" data-target="adminNewPassword">Show</button></div>
       </label>
       <label class="fieldLabel">Confirm new password
         <div class="passwordInputWrap"><input id="adminConfirmPassword" type="password" autocomplete="new-password" placeholder="Enter the new password again"><button type="button" class="passwordEye" data-target="adminConfirmPassword">Show</button></div>
       </label>
       <div class="passwordRequirements"><b>Password requirements</b><span>At least 6 characters.</span><span>The confirmation must match the new password.</span></div>
       <div id="adminPasswordFeedback"></div>
       <div class="actions">
         <button class="primary" id="saveAdminPassword" type="button">Save New Password</button>
         <button class="ghost" id="cancelAdminPassword" type="button">Cancel</button>
       </div>
     </div>
   </section>
 </div>`;
}
function openAdminPasswordEditor(){
 if(!isAdmin())return openAdmin();
 $("#app").innerHTML=adminPasswordEditorView();
 bindAdminPasswordEditor();
}
function bindAdminPasswordEditor(){
 $("#backFromPasswordEditor")?.addEventListener("click",openAdmin);
 $("#cancelAdminPassword")?.addEventListener("click",openAdmin);
 $$(".passwordEye").forEach(b=>b.addEventListener("click",()=>{
   const i=$("#"+b.dataset.target);if(!i)return;
   const show=i.type==="password";i.type=show?"text":"password";b.textContent=show?"Hide":"Show";
 }));
 $("#saveAdminPassword")?.addEventListener("click",async()=>{
   const feedback=$("#adminPasswordFeedback");
   const current=$("#adminCurrentPassword").value;
   const next=$("#adminNewPassword").value;
   const confirmNext=$("#adminConfirmPassword").value;
   if(!current){feedback.innerHTML='<div class="feedback bad">Enter the current admin password.</div>';return}
   if(next.length<6){feedback.innerHTML='<div class="feedback bad">New password must contain at least 6 characters.</div>';return}
   if(next!==confirmNext){feedback.innerHTML='<div class="feedback bad">New password and confirmation do not match.</div>';return}
   const cfg=loadCfg();
   if(await digest(current)!==cfg.hash){feedback.innerHTML='<div class="feedback bad">Current admin password is incorrect.</div>';return}
   if(await digest(next)===cfg.hash){feedback.innerHTML='<div class="feedback bad">New password must be different from the current password.</div>';return}
   cfg.hash=await digest(next);cfg.updatedAt=new Date().toISOString();saveCfg(cfg);syncAdminManagedUserPassword(cfg.hash);
   sessionStorage.setItem(SESSION,"1");
   $("#adminCurrentPassword").value="";$("#adminNewPassword").value="";$("#adminConfirmPassword").value="";
   feedback.innerHTML='<div class="feedback ok">Admin password changed successfully.</div>';
 });
}

function installAdminPasswordButton(){ return; /* credential management is Superadmin-only */
 if(!isAdmin())return;
 const app=$("#app");
 if(!app||$("#adminChangePassword"))return;
 const head=app.querySelector(".sectionHead");
 if(!head)return;
 const actions=document.createElement("div");
 actions.className="adminHeaderActions";
 actions.innerHTML='<button class="ghost" id="adminChangePassword" type="button">Change Admin Password</button>';
 head.appendChild(actions);
 $("#adminChangePassword").onclick=openAdminPasswordEditor;
}
async function changeAdminPassword(){
 if(!isAdmin())return openAdmin();
 const cfg=loadCfg();
 const current=prompt("Current admin password");
 if(current===null)return;
 if(await digest(current)!==cfg.hash){alert("Current password is incorrect.");return}
 const next=prompt("New admin password (minimum 6 characters)");
 if(next===null)return;
 if(next.length<6){alert("New password must contain at least 6 characters.");return}
 const confirmNext=prompt("Confirm new admin password");
 if(confirmNext===null)return;
 if(next!==confirmNext){alert("Passwords do not match.");return}
 cfg.hash=await digest(next);
 cfg.updatedAt=new Date().toISOString();
 saveCfg(cfg);
 sessionStorage.setItem(SESSION,"1");
 alert("Admin password changed successfully.");
}


function registrationEnabled(role=null){
  const intent=role||sessionStorage.getItem("tina.v14.login.intent")||"learner";
  try{
    const g=JSON.parse(localStorage.getItem("tina.v14.auth.governance")||"{}");
    if(g.register&&Object.prototype.hasOwnProperty.call(g.register,intent))return !!g.register[intent];
  }catch{}
  const cfg=loadCfg();
  return intent==="learner"&&cfg.allowUserRegistration!==false;
}
function registrationContactMode(role=null){return !registrationEnabled(role)}

function setRegistrationEnabled(enabled){
  const cfg=loadCfg();
  cfg.allowUserRegistration=!!enabled;
  cfg.updatedAt=new Date().toISOString();
  saveCfg(cfg);
  refreshUserAuthEntry();
}
function currentUserSession(){
  try{return JSON.parse(sessionStorage.getItem(USER_SESSION_KEY)||"null")}catch{return null}
}
function setUserSession(user,activeRole=null,keepSignedIn=false){
  if(user){
    const roles=Array.isArray(user.roles)&&user.roles.length?user.roles:[user.role||"learner"];
    const selected=activeRole&&roles.includes(activeRole)?activeRole:(user.activeRole&&roles.includes(user.activeRole)?user.activeRole:(user.primaryRole&&roles.includes(user.primaryRole)?user.primaryRole:roles[0]));
    const payload={id:user.id,name:user.name,email:user.email,roles,activeRole:selected,role:selected,loginAt:new Date().toISOString()};
    sessionStorage.setItem(USER_SESSION_KEY,JSON.stringify(payload));
    if(keepSignedIn)localStorage.setItem(PERSISTED_SESSION_KEY,JSON.stringify({session:payload,expiresAt:Date.now()+30*24*60*60*1000}));
  }else{
    sessionStorage.removeItem(USER_SESSION_KEY);
    localStorage.removeItem(PERSISTED_SESSION_KEY);
  }
  refreshUserAuthEntry();
}
async function loginManagedUser(email,password){
  seedInitialAdmin();
  const norm=(email||"").trim().toLowerCase(),intent=sessionStorage.getItem("tina.v14.login.intent")||"learner";
  if(window.TinaBackend?.available){
    try{
      const remote=await window.TinaBackend.login(norm,password,intent,!!document.querySelector("#authKeepSignedIn")?.checked||!!document.querySelector("#adminKeepSignedIn")?.checked);
      const u=normalizeManagedUser(remote.user);
      setActiveUser(u.id);setUserSession(u,intent);
      if(intent==="admin")sessionStorage.setItem(SESSION,"1");
      return u;
    }catch(e){if(window.TinaBackend?.required)throw e}
  }
  const store=userStore(),u=store.users.find(x=>x.email===norm);
  if(!u)throw new Error("Account not found.");
  if(u.status!=="active")throw new Error(`Account status: ${u.status||"pending_activation"}. Contact Superadmin if access should be activated.`);
  if(!u.passwordHash)throw new Error("This account has no password yet. Ask admin to reset it.");
  if(await hashPassword(password)!==u.passwordHash)throw new Error("Incorrect password.");
  const roles=u.roles||[u.role||"learner"];
  if(!roles.includes(intent)&&!roles.includes("superadmin"))throw new Error("This account is not assigned the selected role.");
  u.lastLoginAt=new Date().toISOString();u.updatedAt=new Date().toISOString();saveUserStore(store);
  setActiveUser(u.id);setUserSession(u,intent);
  if(intent==="admin")sessionStorage.setItem(SESSION,"1");
  return u;
}
async function registerManagedUser({name,email,password}){
  const intent=sessionStorage.getItem("tina.v14.login.intent")||"learner";
  if(!registrationEnabled(intent))throw new Error("Registration is disabled. Contact Superadmin.");
  if(!password||password.length<8)throw new Error("Password must contain at least 8 characters.");
  const status=intent==="learner"?"active":"pending_activation";
  return createManagedUser({name,email,role:intent,password,status});
}
function userAuthView(mode="login"){
  const signup=mode==="register";
  const intent=sessionStorage.getItem("tina.v14.login.intent")||"learner";
  const roleLabel=intent==="teacher"?"Teacher":intent==="business"?"Business":intent==="admin"?"Administrator":intent==="superadmin"?"Superadmin":"Student";
  return `<div class="wrap authWrap">
    <section class="authCard card">
      <div class="eyebrow">TINA LEARNING PLATFORM</div>
      <h2>${signup?`Register ${roleLabel} account`:`${roleLabel} Login`}</h2>
      <p class="muted">${signup?(intent==="learner"?"Create a student account.":"Submit a governed account registration. Superadmin activation is required before login."):`Sign in to your ${roleLabel.toLowerCase()} workspace.`}</p>
      <div class="formgrid">
        ${signup?'<input id="authName" placeholder="Full name">':""}
        <div class="credentialField"><input id="authEmail" placeholder="Email / username" autocomplete="username"><button type="button" data-auth-toggle="authEmail" data-kind="username">Hide</button></div>
        <div class="credentialField"><input id="authPassword" type="password" placeholder="Password" autocomplete="${signup?"new-password":"current-password"}"><button type="button" data-auth-toggle="authPassword" data-kind="password">Show</button></div>
        ${signup?'<input id="authConfirm" type="password" placeholder="Confirm password" autocomplete="new-password">':""}
        ${signup?"":`<div class="loginPreferenceGrid"><label><input type="checkbox" id="authRememberAccount"> Remember account</label><label><input type="checkbox" id="authKeepSignedIn"> Keep me signed in on this device</label></div>`}
        <button class="primary" id="authSubmit">${signup?"Register":"Login"}</button>
        <button class="ghost" id="authCancel">← Back</button>
      </div>
      <div id="authFeedback"></div>
      ${signup?"":'<div class="socialLoginDivider"><span>or continue with</span></div><div class="socialLoginGrid"><button type="button" class="socialLoginBtn" data-auth-social="google"><b>G</b><span>Google</span></button><button type="button" class="socialLoginBtn" data-auth-social="microsoft"><b>⊞</b><span>Microsoft</span></button></div>'}
      <div class="authSwitch">
        ${signup?'<button class="linkbtn" id="switchLogin">Already have an account? Login</button>':(registrationEnabled(intent)?'<button class="linkbtn" id="switchRegister">Create an account</button>':'<button class="linkbtn" id="contactSuperadminRegistration">Contact Superadmin</button>')}
      </div>
    </section>
  </div>`;
}
const REMEMBERED_ACCOUNT_KEY="tina.v14.remembered.account",PERSISTED_SESSION_KEY="tina.v14.persisted.user.session";
function openUserLogin(){ $("#app").innerHTML=userAuthView("login"); bindUserAuth("login"); const saved=localStorage.getItem(REMEMBERED_ACCOUNT_KEY);if(saved&&$("#authEmail")){$("#authEmail").value=saved;$("#authRememberAccount").checked=true} syncAuthSurfaceChrome() }
function openUserRegister(){
  const intent=sessionStorage.getItem("tina.v14.login.intent")||"learner";
  if(!registrationEnabled(intent))return openSuperadminContactRequest(intent);
  $("#app").innerHTML=userAuthView("register");bindUserAuth("register");syncAuthSurfaceChrome()
}

const SUPERADMIN_CONTACT_REQUEST_KEY="tina.v14.superadmin.contact.requests";
function openSuperadminContactRequest(role=null){
 const intent=role||sessionStorage.getItem("tina.v14.login.intent")||"learner";
 $("#app").innerHTML=`<div class="wrap authWrap"><section class="authCard card"><div class="eyebrow">ACCOUNT ACCESS</div><h2>Contact Superadmin</h2><p class="muted">Registration for the ${esc(intent)} role is not currently public. Send an access request to the platform Superadmin.</p><div class="formgrid"><input id="contactSAName" placeholder="Full name"><input id="contactSAEmail" placeholder="Email / username"><textarea id="contactSAMessage" rows="4" placeholder="Why do you need access?"></textarea><button class="primary" id="contactSASubmit">Send Request</button><button class="ghost" id="contactSABack">← Back to Login</button></div><div id="contactSAFeedback"></div></section></div>`;
 $("#contactSABack").onclick=openUserLogin;
 $("#contactSASubmit").onclick=()=>{const name=$("#contactSAName").value.trim(),email=$("#contactSAEmail").value.trim(),message=$("#contactSAMessage").value.trim();if(!name||!email)return $("#contactSAFeedback").innerHTML='<div class="feedback bad">Name and email / username are required.</div>';let rows=[];try{rows=JSON.parse(localStorage.getItem(SUPERADMIN_CONTACT_REQUEST_KEY)||"[]")}catch{};rows.push({id:"access-request-"+Date.now(),role:intent,name,email,message,status:"new",createdAt:new Date().toISOString()});localStorage.setItem(SUPERADMIN_CONTACT_REQUEST_KEY,JSON.stringify(rows.slice(-500)));$("#contactSAFeedback").innerHTML='<div class="feedback ok">Request saved for Superadmin review.</div>'};
 syncAuthSurfaceChrome()
}

function bindUserAuth(mode){
  $$("[data-auth-toggle]").forEach(b=>b.onclick=()=>{const i=$("#"+b.dataset.authToggle),hide=i.type!=="password";i.type=hide?"password":"text";b.textContent=hide?"Show":"Hide"});
  $$("[data-auth-social]").forEach(b=>b.onclick=()=>{const provider=b.dataset.authSocial,role=sessionStorage.getItem("tina.v14.login.intent")||"learner";if(window.TinaBackend?.oauthStart)return window.TinaBackend.oauthStart(provider,role);$("#authFeedback").innerHTML='<div class="feedback bad">Backend OAuth is not configured. Start the Tina backend and configure OAuth credentials.</div>'});

  $("#authCancel")?.addEventListener("click",openGuestGate);
  $("#switchLogin")?.addEventListener("click",openUserLogin);
  $("#switchRegister")?.addEventListener("click",openUserRegister);$("#contactSuperadminRegistration")?.addEventListener("click",()=>openSuperadminContactRequest());
  [$("#authName"),$("#authEmail"),$("#authPassword"),$("#authConfirm")].filter(Boolean).forEach(i=>i.addEventListener("keydown",e=>{if(e.key!=="Enter"||e.isComposing)return;e.preventDefault();$("#authSubmit")?.click()}));
  $("#authSubmit")?.addEventListener("click",async()=>{
    try{
      const email=$("#authEmail").value,password=$("#authPassword").value;
      if(mode==="register"){
        const confirm=$("#authConfirm").value;
        if(password!==confirm)throw new Error("Passwords do not match.");
        const u=await registerManagedUser({name:$("#authName").value,email,password});
        if(u.status==="active"){
          setUserSession(u);
          $("#authFeedback").innerHTML='<div class="feedback ok">Account created and signed in.</div>';
          setTimeout(()=>{refreshChrome();clickNav("Home")},250);
        }else{
          $("#authFeedback").innerHTML='<div class="feedback ok">Registration submitted. Account status: Pending activation. Contact Superadmin for activation.</div>';
        }
      }else{
        const u=await loginManagedUser(email,password);
        const intent=sessionStorage.getItem("tina.v14.login.intent")||"learner";
        const roleOk=(u.roles||[u.role]).includes(intent)||(u.roles||[]).includes("superadmin");
        if(!roleOk){setUserSession(null);throw new Error("Selected login role does not match this account.");}
        const remember=!!$("#authRememberAccount")?.checked,keep=!!$("#authKeepSignedIn")?.checked;
        if(remember)localStorage.setItem(REMEMBERED_ACCOUNT_KEY,email.trim().toLowerCase());else localStorage.removeItem(REMEMBERED_ACCOUNT_KEY);
        setUserSession(u,intent,keep);
        $("#authFeedback").innerHTML='<div class="feedback ok">Login successful.</div>';
        setTimeout(()=>{refreshChrome();window.TinaBackend?.syncNow?.("login").catch(()=>{});if(window.TinaWorkspaceActions?.roleLanding)return window.TinaWorkspaceActions.roleLanding();u.role==="admin"?openAdmin():clickNav("Home")},250);
      }
    }catch(e){$("#authFeedback").innerHTML=`<div class="feedback bad">${esc(e.message)}</div>`}
  });
}
function logoutManagedUser(){const s=currentUserSession();if(s?.role==="admin")return logoutAdminInstant();setUserSession(null);setActiveUser("");refreshChrome();openGuestGate()}
function refreshUserAuthEntry(){
  const nav=$("#nav");if(!nav)return;
  let login=$("#userLoginBtn"),register=$("#userRegisterBtn"),account=$("#userAccountBtn");
  const session=currentUserSession(),admin=effectiveAdminInterface();
  if(!login){login=document.createElement("button");login.id="userLoginBtn";login.className="navbtn userAuthBtn";login.type="button";login.textContent="User Login";login.onclick=openUserLogin;nav.appendChild(login)}
  if(!register){register=document.createElement("button");register.id="userRegisterBtn";register.className="navbtn userAuthBtn userRegisterBtn";register.type="button";register.textContent="Register";register.onclick=openUserRegister;nav.appendChild(register)}
  if(!account){account=document.createElement("button");account.id="userAccountBtn";account.className="navbtn userAuthBtn userAccountBtn";account.type="button";nav.appendChild(account)}
  account.onclick=()=>{const s=currentUserSession();if(!s)return openUserLogin();if(confirm(`Signed in as ${s.name} (${s.email}).\n\nLog out now?`))logoutManagedUser()};
  if(admin){login.style.display="none";register.style.display="none";account.style.display=session?"":"none";if(session)account.textContent=`${session.name} · Logout`}
  else if(session){login.style.display="none";register.style.display="none";account.style.display="";account.textContent=`${session.name} · Logout`}
  else{login.style.display="";login.textContent="User Login";register.style.display=registrationEnabled()?"":"none";register.textContent="Register";account.style.display="none";account.textContent="Account"}
}
function registrationAdminCard(){
  return `<section class="card registrationAdminCard">
    <div><div class="eyebrow">USER ACCESS</div><h3>Public Registration</h3><p class="muted">Control whether learners can see and use the Register button.</p></div>
    <label class="toggleRow"><input id="registrationToggle" type="checkbox" ${registrationEnabled()?"checked":""}><span>Show Register button to users</span></label>
    <div class="actions"><button class="ghost" id="previewUserLogin">Preview User Login</button>${registrationEnabled()?'<button class="ghost" id="previewUserRegister">Preview Registration</button>':""}</div>
  </section>`;
}
function bindRegistrationAdminControls(){
  $("#registrationToggle")?.addEventListener("change",e=>{setRegistrationEnabled(e.target.checked);refreshChrome();openAdmin()});
  $("#previewUserLogin")?.addEventListener("click",openUserLogin);
  $("#previewUserRegister")?.addEventListener("click",openUserRegister);
}


const ADMIN_TOOL_ICONS={
  users:"👤",password:"🔐",operations:"🛠️",system:"⚙️",
  academy:"🎓",content:"🧩",authoring:"✍️",practice:"🎮",
  assessment:"📝",adaptive:"🧠",data:"🗂️",backup:"💾",
  media:"🎬",publish:"🚀",search:"🔎",progress:"📊"
};
function adminToolIcon(id){return ADMIN_TOOL_ICONS[id]||"◆"}
function decorateAdminCards(){
  document.querySelectorAll("[data-tool]").forEach(card=>{
    if(card.querySelector(".adminToolIcon"))return;
    const id=card.dataset.tool||"";
    const h=card.querySelector("h3,b");
    if(!h)return;
    const span=document.createElement("span");
    span.className="adminToolIcon";
    span.setAttribute("aria-hidden","true");
    span.textContent=adminToolIcon(id);
    h.prepend(span);
    card.classList.add("adminVisualCard");
  });
  document.querySelectorAll(".adminOpsSection").forEach(section=>section.classList.add("adminVisualSection"));
}

function normalizeManagedUser(u){
  const roles=Array.isArray(u.roles)&&u.roles.length?[...new Set(u.roles)]:[u.role||"learner"];
  const primaryRole=roles.includes(u.primaryRole)?u.primaryRole:(roles.includes(u.role)?u.role:roles[0]);
  return Object.assign({},u,{roles,primaryRole,role:primaryRole});
}
function userStore(){
  try{
    const x=JSON.parse(localStorage.getItem(USERS_KEY)||"{}");
    const s=Object.assign({users:[],schemaVersion:"14.2"},x);
    s.users=(s.users||[]).map(normalizeManagedUser);
    return s;
  }catch{return{users:[],schemaVersion:"14.2"}}
}
function saveUserStore(x){x.users=(x.users||[]).map(normalizeManagedUser);localStorage.setItem(USERS_KEY,JSON.stringify(x))}
function activeUser(){return localStorage.getItem(ACTIVE_USER_KEY)||""}
function setActiveUser(id){if(id)localStorage.setItem(ACTIVE_USER_KEY,id);else localStorage.removeItem(ACTIVE_USER_KEY)}
function uid(){return "usr-"+Date.now()+"-"+Math.random().toString(36).slice(2,8)}
async function hashPassword(p){return digest(p)}
async function createManagedUser({name,email,role="learner",password="",status="active"}){
  const store=userStore();
  const norm=(email||"").trim().toLowerCase();
  if(!name?.trim())throw new Error("Name is required.");
  if(!norm)throw new Error("Email / username is required.");
  if(store.users.some(u=>u.email===norm))throw new Error("User already exists.");
  const rec={id:uid(),name:name.trim(),email:norm,role,status,passwordHash:password?await hashPassword(password):"",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),lastLoginAt:null,notes:""};
  store.users.push(rec);saveUserStore(store);return rec;
}
function adminUserView(){
  const store=userStore(),active=activeUser();
  return `<div class="wrap v14wrap"><div class="sectionHead"><div><div class="eyebrow">ADMIN · USER MANAGEMENT</div><h2>User Management</h2><p class="muted">Create, edit, activate, suspend, assign roles and inspect local user accounts.</p></div><div class="adminHeaderActions"><button class="ghost" id="backAdminUsers">← Admin</button></div></div>
  <section class="card"><h3>Add user</h3><div class="formgrid">
    <input id="usrName" placeholder="Full name">
    <input id="usrEmail" placeholder="Email / username">
    <select id="usrRole"><option value="learner">Student</option><option value="teacher">Teacher</option><option value="business">Business</option><option value="editor">Editor</option><option value="reviewer">Reviewer</option><option value="admin">Administrator</option><option value="superadmin">Superadmin</option></select>
    <input id="usrPassword" type="password" placeholder="Temporary password (optional)">
    <button class="primary" id="usrCreate">Create user</button>
  </div><div id="usrFb"></div></section>
  <section class="card" style="margin-top:14px"><div class="toolbar"><input id="usrSearch" placeholder="Search users…"><select id="usrFilter"><option value="all">All</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="admin">Admins</option><option value="learner">Learners</option></select></div><div id="usrRows" class="list">${userRows(store.users,active)}</div></section>
  </div>`;
}
function userRows(users,active){
  return users.length?users.map(u=>`<div class="row userRow" data-user="${u.id}"><div><div class="eyebrow">${esc(u.role)} · ${esc(u.status)}${u.id===active?" · active profile":""}</div><b>${esc(u.name)}</b><br><small>${esc(u.email)}</small><p>${esc(u.notes||"")}</p></div><div class="rowactions">
  <button class="ghost usrActivate" data-id="${u.id}">Use profile</button>
  <button class="ghost usrEdit" data-id="${u.id}">Edit</button>
  <button class="ghost usrRole" data-id="${u.id}">${u.role==="admin"?"Make learner":"Make admin"}</button>
  <button class="ghost usrStatus" data-id="${u.id}">${u.status==="active"?"Suspend":"Activate"}</button>
  <button class="ghost usrReset" data-id="${u.id}">Reset password</button>
  <button class="iconbtn usrDelete" data-id="${u.id}">×</button></div></div>`).join(""):'<div class="empty">No managed users yet.</div>';
}
function openUserManagement(){
  if(!isAdmin())return openAdmin();
  $("#app").innerHTML=adminUserView();bindUserManagement();
}
function bindUserManagement(){
  $("#backAdminUsers")?.addEventListener("click",openAdmin);
  $("#userAdminChangePassword")?.addEventListener("click",openAdminPasswordEditor);
  const rerender=()=>{
    const store=userStore(),q=($("#usrSearch")?.value||"").toLowerCase(),f=$("#usrFilter")?.value||"all";
    const rows=store.users.filter(u=>{
      const match=!q||JSON.stringify(u).toLowerCase().includes(q);
      const filter=f==="all"||u.status===f||u.role===f;
      return match&&filter;
    });
    $("#usrRows").innerHTML=userRows(rows,activeUser());bindUserRowActions();
  };
  $("#usrSearch")?.addEventListener("input",rerender);
  $("#usrFilter")?.addEventListener("change",rerender);
  $("#usrCreate")?.addEventListener("click",async()=>{
    try{
      await createManagedUser({name:$("#usrName").value,email:$("#usrEmail").value,role:$("#usrRole").value,password:$("#usrPassword").value});
      $("#usrFb").innerHTML='<div class="feedback ok">User created.</div>';openUserManagement();
    }catch(e){$("#usrFb").innerHTML=`<div class="feedback bad">${esc(e.message)}</div>`}
  });
  bindUserRowActions();
}
function bindUserRowActions(){
  const get=id=>userStore().users.find(x=>x.id===id);
  $$(".usrActivate").forEach(b=>b.onclick=()=>{setActiveUser(b.dataset.id);openUserManagement()});
  $$(".usrEdit").forEach(b=>b.onclick=()=>{let store=userStore(),u=store.users.find(x=>x.id===b.dataset.id);if(!u)return;let name=prompt("Name",u.name);if(name===null)return;let email=prompt("Email / username",u.email);if(email===null)return;let notes=prompt("Notes",u.notes||"");u.name=name.trim()||u.name;u.email=email.trim().toLowerCase()||u.email;if(notes!==null)u.notes=notes;u.updatedAt=new Date().toISOString();saveUserStore(store);openUserManagement()});
  $$(".usrRole").forEach(b=>b.onclick=()=>{let store=userStore(),u=store.users.find(x=>x.id===b.dataset.id);if(!u)return;u.role=u.role==="admin"?"learner":"admin";u.updatedAt=new Date().toISOString();saveUserStore(store);openUserManagement()});
  $$(".usrStatus").forEach(b=>b.onclick=()=>{let store=userStore(),u=store.users.find(x=>x.id===b.dataset.id);if(!u)return;u.status=u.status==="active"?"suspended":"active";u.updatedAt=new Date().toISOString();saveUserStore(store);openUserManagement()});
  $$(".usrReset").forEach(b=>b.onclick=async()=>{let p=prompt("New password (minimum 6 characters)");if(!p||p.length<6)return;let store=userStore(),u=store.users.find(x=>x.id===b.dataset.id);if(!u)return;u.passwordHash=await hashPassword(p);u.updatedAt=new Date().toISOString();saveUserStore(store);alert("Password reset.")});
  $$(".usrDelete").forEach(b=>b.onclick=()=>{if(!confirm("Delete this local user?"))return;let store=userStore();store.users=store.users.filter(x=>x.id!==b.dataset.id);saveUserStore(store);if(activeUser()===b.dataset.id)setActiveUser("");openUserManagement()});
}

const ADMIN_ONLY_NAV=new Set(["Learning Core","Canonical Data","Academy","Authoring Hub","Content Studio","Data Manager","Assessment"]);
const USER_NAV_ORDER=["Home","Catalog","Active Learning","Study Plans","Research","Review","Progress","Study Runtime","Flashcards & Games","Learning Studio","Practice v10","Adaptive","Settings"];
const ADMIN_NAV_ORDER=["Home","Admin","Academy","Learning Core","Canonical Data","Data Manager","Authoring Hub","Content Studio","Practice v10","Assessment","Adaptive","Settings"];
function navText(b){return (b?.textContent||"").trim()}
function academyButtons(){return $$(".navbtn").filter(b=>ADMIN_ONLY_NAV.has(navText(b)))}
function applyRoleInterface(){
  const admin=effectiveAdminInterface(),nav=$("#nav");if(!nav)return;
  let adminBtn=$('[data-view="admin-v14"]');
  if(!adminBtn){adminBtn=document.createElement("button");adminBtn.className="navbtn adminV14Btn";adminBtn.dataset.view="admin-v14";adminBtn.type="button";adminBtn.onclick=openAdmin;nav.appendChild(adminBtn)}
  adminBtn.textContent=admin?"Admin":"Admin Login";adminBtn.style.display="";adminBtn.onclick=openAdmin;
  $$(".navbtn").forEach(b=>{
    if(b===adminBtn)return;
    const name=navText(b);if(!name)return;
    if(ADMIN_ONLY_NAV.has(name)){b.style.display=admin?"":"none";b.setAttribute("aria-hidden",admin?"false":"true")}
    else {b.style.display="";b.setAttribute("aria-hidden","false")}
  });
  document.documentElement.dataset.interface=admin?"admin":"user";
  document.body?.classList.toggle("adminInterface",admin);
  document.body?.classList.toggle("userInterface",!admin);
}
function enforce(){applyRoleInterface()}
function topbar(){ /* disabled: clean header */ }


function syncPublicChromeNow(){
  sessionStorage.removeItem(USER_PREVIEW_KEY);
  syncInterfaceChrome();
  const adminBtn=$('[data-view="admin-v14"]');
  if(adminBtn){
    adminBtn.style.display="inline-flex";
    adminBtn.style.visibility="visible";
    adminBtn.style.opacity="1";
    adminBtn.textContent="Admin Login";
    adminBtn.onclick=openAdmin;
  }
}
function logoutAdminInstant(){
  if(window.TinaWorkspaceActions?.logout)return window.TinaWorkspaceActions.logout();
  sessionStorage.removeItem(USER_PREVIEW_KEY);
  sessionStorage.removeItem(SESSION);
  sessionStorage.removeItem(USER_SESSION_KEY);
  localStorage.removeItem(ACTIVE_USER_KEY);
  localStorage.removeItem("tina.v14.persisted.user.session");
  syncPublicChromeNow();
  openGuestGate();
}


const USER_PREVIEW_KEY="tina.v14.admin.user-preview";
const BASE_ADMIN_ROUTES=new Set(["academy","author","data"]);
function isUserPreview(){return isAdmin()&&sessionStorage.getItem(USER_PREVIEW_KEY)==="1"}
function effectiveAdminInterface(){return isAdmin()&&!isUserPreview()}
function enterUserPreview(){
 if(!isAdmin())return;
 sessionStorage.setItem(USER_PREVIEW_KEY,"1");
 syncInterfaceChrome();
 clickNav("Home");
}
function returnToAdminInterface(){
 if(!isAdmin())return openAdmin();
 sessionStorage.removeItem(USER_PREVIEW_KEY);
 syncInterfaceChrome();
 openAdmin();
}
function leaveAdminSession(){
 sessionStorage.removeItem(USER_PREVIEW_KEY);
 logoutAdminInstant();
 if(!currentUserSession())openGuestGate();
}
function installInterfaceSwitcher(){
 const top=document.querySelector(".topbar");if(!top)return;
 let box=$("#interfaceSwitcher");
 if(!box){
   box=document.createElement("div");
   box.id="interfaceSwitcher";
   box.className="interfaceSwitcher";
   top.appendChild(box);
 }
 if(isAdmin()){
   if(isUserPreview()){
     box.innerHTML='<span class="interfaceBadge">User Preview</span><button type="button" id="switchBackAdmin">Back to Admin</button><button type="button" id="switchLogoutAdmin">Logout Admin</button>';
     $("#switchBackAdmin").onclick=returnToAdminInterface;
     $("#switchLogoutAdmin").onclick=leaveAdminSession;
   }else{
     box.innerHTML='<span class="interfaceBadge">Admin</span><button type="button" id="switchUserView">User View</button><button type="button" id="switchLogoutAdmin">Logout</button>';
     $("#switchUserView").onclick=enterUserPreview;
     $("#switchLogoutAdmin").onclick=leaveAdminSession;
   }
 }else{
   const s=currentUserSession();
   box.innerHTML=`<span class="interfaceBadge">${s?"User":"Public"}</span><button type="button" id="switchAdminLogin">Admin Login</button>`;
   $("#switchAdminLogin").onclick=openAdmin;
 }
}
function protectAdminOnlyContent(){
 const allow=effectiveAdminInterface();
 const superMode=isSuperadminSession();
 document.querySelectorAll('[data-admin-only="true"],.adminOnlyAction').forEach(el=>{
   const route=el.dataset?.go||el.dataset?.view||"";
   const allowed=route==="academy"?superMode:allow;
   el.style.display=allowed?"":"none";
   el.setAttribute("aria-hidden",allowed?"false":"true");
 });
}
function syncInterfaceChrome(){
 applyRoleInterface();
 refreshUserAuthEntry();
 finalChrome();
 protectAdminOnlyContent();
 installInterfaceSwitcher();
}
function guardAdminRoutes(){
 document.addEventListener("click",e=>{
   const t=e.target.closest("[data-go],[data-view]");
   if(!t)return;
   const route=t.dataset.go||t.dataset.view||"";
   if(!BASE_ADMIN_ROUTES.has(route))return;
   if(effectiveAdminInterface())return;
   e.preventDefault();e.stopImmediatePropagation();
   openAdmin();
 },true);
}

function restorePublicAuthChrome(){logoutAdminInstant()}
function refreshChrome(){ seedInitialAdmin(); syncInterfaceChrome(); }
function openAdmin(){sessionStorage.removeItem(USER_PREVIEW_KEY);$$(".navbtn").forEach(x=>x.classList.remove("active"));$('[data-view="admin-v14"]')?.classList.add("active");$("#app").innerHTML=isAdmin()?dashboard():loginView();bindAdmin()}
function loginView(){seedInitialAdmin();return `<div class="wrap authWrap"><section class="authCard card adminGate"><div class="eyebrow">ADMIN ACCESS</div><h1>Admin Login</h1><p>Sign in to open the private administration interface.</p><div class="formgrid"><label class="fieldLabel">Admin username<input id="adminUser" autocomplete="username" value="${esc(cfg().username||DEFAULT_ADMIN_USERNAME)}"></label><label class="fieldLabel">Admin password<input id="adminPass" type="password" autocomplete="current-password" placeholder="Admin password"></label><button class="primary" id="adminLogin" type="button">Login as Admin</button><button class="ghost" id="adminLoginBack" type="button">← Back to User Interface</button></div><div id="adminFb"></div><p class="muted">Administrative tools are hidden from the public/user interface.</p></section></div>`}
function allState(){
 let out={};for(let i=0;i<localStorage.length;i++){let k=localStorage.key(i);if(k?.startsWith("tina.")||k==="tlp4.progress")out[k]=localStorage.getItem(k)}return out
}
function counts(){
 const read=k=>{try{return JSON.parse(localStorage.getItem(k)||"{}")}catch{return{}}};
 let p=read("tina.clean.v10.practice"),a=read("tina.clean.v11.assessment"),c=read("tina.clean.v12.staging");
 return {users:userStore().users.length,decks:(p.decks||[]).length,cards:(p.decks||[]).reduce((n,d)=>n+(d.cards||[]).length,0),tests:(a.tests||[]).length,evidence:(a.evidence||[]).length,drafts:(c.drafts||[]).length,media:(c.media||[]).length};
}
const TOOLS=[
 ["review","Review & Escalate","Review work outside Administrator authority and send decisions to Superadmin."],
 ["users","Lower-Role Accounts","Create and manage accounts only below Administrator."],
 ["editing","Delegated Editing","Open only content/data scopes explicitly assigned by Superadmin."],
 ["library","Tina Library","Use governed shared resources."],
 ["settings","Settings","Appearance, text size and workspace preferences."]
];
function dashboard(){let c=counts();return `<div class="wrap v14wrap"><section class="card v14hero"><div><div class="eyebrow">V14 FINAL · ADMINISTRATOR</div><h1>Administration Review Workspace</h1><p>Administrator reviews operational work, manages lower-role accounts and escalates restricted decisions. Sensitive data ownership, exports, credentials, Canon, Academy and destructive actions remain Superadmin-only.</p></div><button class="darkbtn" id="adminLogout">Log Out</button></section><section class="adminMetrics"><span><b>${c.users}</b>accounts</span><span><b>${c.drafts}</b>drafts</span><span><b>${c.media}</b>media items</span></section><section class="adminToolGrid">${TOOLS.map(x=>`<article class="card"><h3>${x[1]}</h3><p>${x[2]}</p><button class="primary adminTool" data-tool="${x[0]}">Open</button></article>`).join("")}</section></div>`}
function route(name){let b=$$(".navbtn").find(x=>x.textContent.trim()===name);if(b){b.style.display="";b.click();return true}return false}
function systemView(){return `<div class="wrap v14wrap"><article class="card"><div class="eyebrow">SUPERADMIN GOVERNANCE</div><h2>System export is unavailable to Administrator</h2><p>Sensitive platform exports, restore and credential management are owned by Superadmin.</p><button id="backAdmin">← Admin Dashboard</button></article></div>`}
function bindAdmin(){
 installAdminPasswordButton();
 setTimeout(decorateAdminCards,0);
 installRegistrationAdminCard();
 seedInitialAdmin();
 [$("#adminUser"),$("#adminPass")].filter(Boolean).forEach(i=>i.addEventListener("keydown",e=>{if(e.key!=="Enter"||e.isComposing)return;e.preventDefault();$("#adminLogin")?.click()}));
 $("#adminLogin")?.addEventListener("click",async()=>{
   const u=$("#adminUser")?.value||"",p=$("#adminPass")?.value||"";
   if(!u.trim()||!p){$("#adminFb").innerHTML='<div class="feedback bad">Enter admin username and password.</div>';return}
   if(await loginAdmin(u,p)){setUserSession(userStore().users.find(x=>x.role==="admin"&&x.email===u.trim().toLowerCase())||null,"admin",!!$("#adminKeepSignedIn")?.checked);refreshChrome();openAdmin();window.dispatchEvent(new CustomEvent("tina:admin-login-complete"))}
   else $("#adminFb").innerHTML='<div class="feedback bad">Incorrect admin username or password.</div>'
 });
 $("#adminLoginBack")?.addEventListener("click",()=>{sessionStorage.removeItem(SESSION);setUserSession(null);openGuestGate()});
 $("#adminLogout")?.addEventListener("click",logoutAdminInstant);
 $$(".adminTool").forEach(b=>b.onclick=()=>{const a=window.TinaWorkspaceActions;if(!a)return;const t=b.dataset.tool;if(t==="review")return a.adminReview?.();if(t==="users")return a.users?.();if(t==="editing")return a.adminEditing?.();if(t==="library")return a.library?.();if(t==="settings")return a.settings?.()})
}
function bindSystem(){ $("#backAdmin")?.addEventListener("click",openAdmin); }

const ADMIN_SAFE_OPERATION_GROUPS=[
 ["Curriculum — Add / Edit",[
  ["course-new","New Course"],["course-edit","Edit Course"],["unit-new","New Unit"],["lesson-new","New Lesson"],["set-new","New Practice Set"],["activity-new","New Activity"],["item-new","New Learning Item"]
 ]],
 ["Content — Edit / Validate",[
  ["content-edit","Edit Content"],["content-bulk","Bulk Edit"],["content-move","Move / Re-parent"],["content-clone","Clone to Staging"],["content-validate","Validate Selected"]
 ]],
 ["Media — Add / Edit",[
  ["media-add","Add Media"],["media-image","Add Image"],["media-audio","Add Audio"],["media-video","Add Video"],["media-link","Add External Link"],["media-meta","Edit Metadata"],["media-transcript","Edit Transcript"],["media-alt","Edit Alt Text"]
 ]],
 ["Practice — Add / Edit",[
  ["deck-new","New Deck"],["deck-import","Import Deck"],["deck-export","Export Deck"],["card-new","New Card"],["card-bulk","Bulk Add Cards"],["card-edit","Edit Card"],["mistakes-open","Mistake Queue"],["games-open","Game Manager"]
 ]],
 ["Assessment — Add / Edit",[
  ["test-new","New Test"],["question-new","New Question"],["test-edit","Edit Test"],["test-duplicate","Duplicate Test"],["test-run","Run Test"],["evidence-open","Evidence Ledger"],["rubric-new","Rubric Builder"],["assessment-export","Export Results"]
 ]],
 ["Review / Publication Staging",[
  ["draft-validate","Validate Drafts"],["queue-open","Publication Queue"],["review-mark","Mark Reviewed"],["review-return","Return to Draft"],["publication-export","Export Publication Package"]
 ]],
 ["Operational Views",[
  ["progress-open","Progress Dashboard"],["plan-open","Study Plans"],["research-open","Research"],["adaptive-open","Adaptive Recommendations"],["history-open","Learning History"],["search-open","Universal Search"],["data-open","Data Manager"],["qa-open","Reliability Center"],["theme-open","Theme / Settings"]
 ]]
];
function adminOperationsView(){
 return `<div class="wrap v14wrap adminSafeOperations"><div class="adminRoleNotice"><b>Administrator scope</b><span>Add, edit, validate and export only. Permanent delete, Canon ownership, access governance, Academy ownership and destructive restore actions are Superadmin-only.</span></div>
 ${ADMIN_SAFE_OPERATION_GROUPS.map(([title,items])=>`<section class="card adminOpsSection"><h3>${title}</h3><div class="adminOpsGrid">${items.map(([id,label])=>`<button class="adminOpBtn" data-op="${id}">${label}</button>`).join("")}</div></section>`).join("")}</div>`;
}
function openAdminOperations(){ if(!isAdmin()) return openAdmin(); $("#app").innerHTML=adminOperationsView(); bindAdminOperations(); }
function clickNav(name){ return route(name); }
function openContentSub(label){
  if(!route("Content Studio")) return;
  setTimeout(()=>{
    const b=[...document.querySelectorAll("button")].find(x=>x.textContent.trim()===label);
    if(b) b.click();
  },120);
}
function openPracticeSub(label){
  if(!route("Practice v10")) return;
  setTimeout(()=>{
    const b=[...document.querySelectorAll("button")].find(x=>x.textContent.trim()===label);
    if(b) b.click();
  },120);
}
function openAssessmentSub(label){
  if(!route("Assessment")) return;
  setTimeout(()=>{
    const b=[...document.querySelectorAll("button")].find(x=>x.textContent.trim()===label);
    if(b) b.click();
  },120);
}

const ADMIN_UNDO_KEY="tina.v14.admin.undo.checkpoints";
const ADMIN_UNDO_DATA_KEYS=[
 "tina.clean.v8.practice","tina.clean.v9.studio","tina.clean.v10.practice","tina.clean.v11.assessment",
 "tina.clean.v12.staging","tina.clean.v13.adaptive","tina.v14.workspace"
];
function adminUndoCheckpoints(){try{const x=JSON.parse(localStorage.getItem(ADMIN_UNDO_KEY)||"[]");return Array.isArray(x)?x:[]}catch{return[]}}
function adminCheckpoint(op){
 const snapshot={};
 ADMIN_UNDO_DATA_KEYS.forEach(k=>snapshot[k]=localStorage.getItem(k));
 const id="undo-"+Date.now()+"-"+Math.random().toString(36).slice(2,7);
 const rec={id,op,at:new Date().toISOString(),snapshot,undone:false};
 const all=adminUndoCheckpoints();all.push(rec);localStorage.setItem(ADMIN_UNDO_KEY,JSON.stringify(all.slice(-100)));
 try{
  const historyKey="tina.v14.system.activity",h=JSON.parse(localStorage.getItem(historyKey)||"[]");
  h.push({id:"evt-"+id,at:rec.at,type:"admin.operation.checkpoint",userId:(JSON.parse(sessionStorage.getItem("tina.v14.user.session")||"null")||{}).id||"admin",name:"Administrator",role:"admin",view:"admin-operations",detail:{checkpointId:id,operation:op,reversible:true}});
  localStorage.setItem(historyKey,JSON.stringify(h.slice(-5000)));
 }catch{}
 return id
}

function bindAdminOperations(){
  $("#backAdminOps")?.addEventListener("click",openAdmin);
  $$(".adminOpBtn").forEach(b=>b.onclick=()=>{adminCheckpoint(b.dataset.op);handleAdminOperation(b.dataset.op)});
}
function handleAdminOperation(op){
  const blocked=new Set(["course-archive","content-delete","media-remove","card-delete","srs-reset","backup-import","staging-import","canonical-sync","canonical-inspect","academy-open","users-open","user-new"]);
  if(blocked.has(op)){alert("This operation is reserved for Superadmin or is destructive and unavailable to Administrator.");return}

  const contentMap={
    "course-new":"Authoring Studio","course-edit":"Authoring Studio","course-duplicate":"Authoring Studio","course-archive":"Authoring Studio",
    "unit-new":"Authoring Studio","lesson-new":"Authoring Studio","set-new":"Authoring Studio","activity-new":"Authoring Studio","item-new":"Authoring Studio",
    "content-edit":"Authoring Studio","content-bulk":"Authoring Studio","content-move":"Authoring Studio","content-clone":"Authoring Studio","content-delete":"Authoring Studio",
    "content-validate":"Validation Center","media-add":"Media Library","media-image":"Media Library","media-audio":"Media Library","media-video":"Media Library",
    "media-link":"Media Library","media-meta":"Media Library","media-transcript":"Media Library","media-alt":"Media Library","media-remove":"Media Library",
    "draft-validate":"Validation Center","queue-open":"Publication Queue","review-mark":"Publication Queue","review-return":"Publication Queue",
    "publication-export":"Import / Export","staging-export":"Import / Export","staging-import":"Import / Export","canonical-inspect":"Canonical Explorer"
  };
  const practiceMap={
    "deck-new":"Deck Manager","deck-import":"Deck Manager","deck-export":"Deck Manager","card-new":"Advanced Flashcard Studio","card-bulk":"Advanced Flashcard Studio",
    "card-edit":"Advanced Flashcard Studio","card-delete":"Advanced Flashcard Studio","srs-reset":"SRS Review Queue","mistakes-open":"Mistake Recycling","games-open":"Game Engine"
  };
  const assessmentMap={
    "test-new":"Quiz / Test Builder","question-new":"Quiz / Test Builder","test-edit":"Quiz / Test Builder","test-duplicate":"Quiz / Test Builder","test-run":"Assessment Runner",
    "evidence-open":"Evidence Ledger","rubric-new":"Speaking Assessment","assessment-export":"Evidence Ledger"
  };
  if(contentMap[op]) return openContentSub(contentMap[op]);
  if(practiceMap[op]) return openPracticeSub(practiceMap[op]);
  if(assessmentMap[op]) return openAssessmentSub(assessmentMap[op]);
  if(op==="users-open"||op==="user-new") return openUserManagement();
  if(op==="progress-open") return clickNav("Progress");
  if(op==="plan-open") return clickNav("Study Plans");
  if(op==="research-open") return clickNav("Research");
  if(op==="adaptive-open") return clickNav("Adaptive");
  if(op==="history-open") return clickNav("Learning Studio");
  if(op==="academy-open") return clickNav("Academy");
  if(op==="search-open"){ if(route("Adaptive")) setTimeout(()=>{let b=[...document.querySelectorAll("button")].find(x=>x.textContent.trim()==="Open"&&x.closest(".card")?.textContent.includes("Universal Search")); if(b)b.click()},120); return; }
  if(op==="data-open") return clickNav("Data Manager");
  if(op==="qa-open"){ if(route("Adaptive")) setTimeout(()=>{let cards=[...document.querySelectorAll(".card")];let c=cards.find(x=>x.textContent.includes("Reliability Center"));c?.querySelector("button")?.click()},120); return; }
  if(op==="theme-open") return clickNav("Settings");
  if(op==="backup-export"||op==="backup-import") { $("#app").innerHTML=systemView(); bindSystem(); return; }
  if(op==="password-change"){alert("Administrator credential changes are Superadmin-controlled in this interface.");return;}
  if(op==="canonical-sync"){ alert('Canonical sync is intentionally performed by the local shell adapter:\\n\\n./sync-canonical.sh "/Users/nguyennhi/Desktop/Tina_Learning_Platform"\\n\\nThe browser does not write canonical source files.'); return; }
  if(op==="logout"){ sessionStorage.removeItem(SESSION); refreshChrome(); return openAdmin(); }
}

function guardAcademyClicks(){
 document.addEventListener("click",e=>{let b=e.target.closest(".navbtn");if(!b)return;if(["Academy","Authoring Hub","Content Studio"].includes(b.textContent.trim())&&!isAdmin()){e.preventDefault();e.stopImmediatePropagation();openAdmin()}},true)
}

const NAVKEY="tina.v14.navigation";
function navState(){
  try{return JSON.parse(sessionStorage.getItem(NAVKEY)||'{"stack":[],"index":-1,"locked":false}')}catch{return{stack:[],index:-1,locked:false}}
}
function saveNavState(x){sessionStorage.setItem(NAVKEY,JSON.stringify(x))}
function currentRouteName(){
  const a=[...document.querySelectorAll(".navbtn.active")].find(x=>x.offsetParent!==null);
  return a?.textContent?.trim()||"Home";
}
function recordNavigation(name){
  if(!name)return;
  let n=navState();
  if(n.locked){n.locked=false;saveNavState(n);updateNavControls();return}
  if(n.stack[n.index]===name){updateNavControls();return}
  n.stack=n.stack.slice(0,n.index+1);
  n.stack.push(name);
  if(n.stack.length>80)n.stack.shift();
  n.index=n.stack.length-1;
  saveNavState(n);
  updateNavControls();
}
function navigateToRecorded(name){
  if(!name)return false;
  const b=[...document.querySelectorAll(".navbtn")].find(x=>x.textContent.trim()===name);
  if(b){b.click();return true}
  if(name==="Admin"){openAdmin();return true}
  return false;
}
function appBack(){
  const localBack=document.querySelector("#v10Back,#v11Back,#v12Back,#v13Back,#backAdminOps,#backAdmin");
  if(localBack && localBack.offsetParent!==null){localBack.click();return}
  let n=navState();
  if(n.index<=0)return;
  n.index-=1;n.locked=true;saveNavState(n);
  navigateToRecorded(n.stack[n.index]);
  updateNavControls();
}
function appForward(){
  let n=navState();
  if(n.index<0||n.index>=n.stack.length-1)return;
  n.index+=1;n.locked=true;saveNavState(n);
  navigateToRecorded(n.stack[n.index]);
  updateNavControls();
}
function updateNavControls(){
  const n=navState(),back=document.querySelector("#appBackBtn"),forward=document.querySelector("#appForwardBtn");
  if(back)back.disabled=n.index<=0;
  if(forward)forward.disabled=n.index<0||n.index>=n.stack.length-1;
}
function installNavigationControls(){
  const top=document.querySelector(".topbar");
  if(!top||document.querySelector(".appHistoryControls"))return;
  const box=document.createElement("div");
  box.className="appHistoryControls";
  box.setAttribute("aria-label","Navigation history");
  box.innerHTML='<button id="appBackBtn" type="button" title="Back" aria-label="Back">←</button><button id="appForwardBtn" type="button" title="Forward" aria-label="Forward">→</button>';
  const nav=document.querySelector("#nav");
  if(nav)top.insertBefore(box,nav);else top.appendChild(box);
  box.querySelector("#appBackBtn").onclick=appBack;
  box.querySelector("#appForwardBtn").onclick=appForward;

  document.addEventListener("click",e=>{
    const b=e.target.closest(".navbtn");
    if(!b||b.id==="appBackBtn"||b.id==="appForwardBtn")return;
    setTimeout(()=>recordNavigation(b.textContent.trim()),0);
  },true);

  let n=navState();
  if(n.index<0){
    n.stack=["Home"];n.index=0;saveNavState(n);
  }
  updateNavControls();
}

function bindFooter(){
 document.querySelectorAll("[data-footer-route]").forEach(b=>{
   b.onclick=()=>{
     const name=b.dataset.footerRoute;
     if(name==="Admin") return openAdmin();
     const target=[...document.querySelectorAll(".navbtn")].find(x=>x.textContent.trim()===name);
     if(target) target.click();
   };
 });
}

function finalChrome(){
 let n=$("#nav");if(!n)return;
 n.classList.add("v14nav");
 const order=effectiveAdminInterface()?ADMIN_NAV_ORDER:USER_NAV_ORDER;
 const buttons=$$(".navbtn");
 order.forEach(name=>{let b=buttons.find(x=>navText(x)===name||(name==="Admin"&&x.dataset.view==="admin-v14"));if(b)n.appendChild(b)});
 const adminBtn=$('[data-view="admin-v14"]');
 if(!effectiveAdminInterface()){
   if($("#userLoginBtn"))n.appendChild($("#userLoginBtn"));
   if($("#userRegisterBtn"))n.appendChild($("#userRegisterBtn"));
   if($("#userAccountBtn"))n.appendChild($("#userAccountBtn"));
   if(adminBtn){adminBtn.style.display="";adminBtn.textContent="Admin Login";adminBtn.onclick=openAdmin;n.appendChild(adminBtn)}
 }else{
   if($("#userAccountBtn"))n.appendChild($("#userAccountBtn"));
 }
}


/* V14 FINAL CORRECTION — AUTH GATE + ADMIN ROUTING */
const ROUTE_BY_LABEL={
  "Home":"home",
  "Catalog":"catalog",
  "Active Learning":"learn",
  "Study Plans":"plans",
  "Research":"research",
  "Review":"review",
  "Progress":"progress",
  "Academy":"academy",
  "Authoring Hub":"author",
  "Data Manager":"data",
  "Settings":"settings",
  "Learning Core":"core",
  "Canonical Data":"canonical",
  "Study Runtime":"study-runtime",
  "Flashcards & Games":"practice-suite",
  "Learning Studio":"learning-studio",
  "Practice v10":"practice-v10",
  "Assessment":"assessment-v11",
  "Adaptive":"adaptive-v13",
  "Content Studio":"content-v12",
  "Admin":"admin-v14",
  "Admin Login":"admin-v14"
};
const ADMIN_ROUTE_IDS=new Set(["academy","author","data","core","canonical","content-v12","assessment-v11","admin-v14"]);

function navText(b){
  if(!b)return "";
  const route=b.dataset?.view||"";
  const byRoute=Object.entries(ROUTE_BY_LABEL).find(([,id])=>id===route)?.[0];
  if(byRoute)return byRoute;
  const clone=b.cloneNode(true);
  clone.querySelectorAll(".navIcon").forEach(x=>x.remove());
  return (clone.textContent||"").replace(/\s+/g," ").trim();
}
function route(name){
  const id=ROUTE_BY_LABEL[name]||name;
  if(id==="admin-v14"){openAdmin();return true}
  const b=document.querySelector(`.navbtn[data-view="${CSS.escape(id)}"]`);
  if(!b)return false;
  if(ADMIN_ROUTE_IDS.has(id)&&!effectiveAdminInterface()){openAdmin();return false}
  b.style.display="";
  b.removeAttribute("aria-hidden");
  b.click();
  return true;
}
function clickNav(name){return route(name)}

function guestGateView(){
  return `<div class="wrap guestGateWrap roleGatewaySource">
    <section class="card guestGateCard roleGatewaySourceCard">
      <div class="guestGateBrand">TINA</div>
      <div class="eyebrow">TINA LEARNING PLATFORM</div>
      <h1>Choose your login</h1>
      <p class="guestGateLead">Select the workspace that matches your role.</p>
      <div class="sourceRoleLoginList">
        <button class="sourceRoleLogin student" id="guestStudentBtn" type="button">
          <span class="sourceRoleIcon">🎓</span>
          <span class="sourceRoleCopy"><b>Student</b><small>Learn · Practice · Compete · Achievements</small></span>
          <span class="sourceRoleArrow">›</span>
        </button>
        <button class="sourceRoleLogin teacher" id="guestTeacherBtn" type="button">
          <span class="sourceRoleIcon">🧑‍🏫</span>
          <span class="sourceRoleCopy"><b>Teacher</b><small>Classes · Assignments · Learner progress</small></span>
          <span class="sourceRoleArrow">›</span>
        </button>
        <button class="sourceRoleLogin business" id="guestBusinessBtn" type="button">
          <span class="sourceRoleIcon">🏢</span>
          <span class="sourceRoleCopy"><b>Business</b><small>Programs · Teams · Resources · Reports</small></span>
          <span class="sourceRoleArrow">›</span>
        </button>
        <button class="sourceRoleLogin admin" id="guestAdminBtn" type="button">
          <span class="sourceRoleIcon">🛡️</span>
          <span class="sourceRoleCopy"><b>Administrator</b><small>Users · Content · Assessment · Operations</small></span>
          <span class="sourceRoleArrow">›</span>
        </button>
        <button class="sourceRoleLogin superadmin" id="guestSuperadminBtn" type="button">
          <span class="sourceRoleIcon">👑</span>
          <span class="sourceRoleCopy"><b>Superadmin</b><small>Tina Academy · Health · Governance · Interfaces</small></span>
          <span class="sourceRoleArrow">›</span>
        </button>
      </div>
      ${registrationEnabled()?'<button class="ghost sourceRegisterBtn" id="guestRegisterBtn" type="button">Create Student Account</button>':""}
    </section>
  </div>`;
}
function openGuestGate(){
  sessionStorage.removeItem(USER_PREVIEW_KEY);
  sessionStorage.removeItem("tina.v14.login.intent");
  if(isAdmin())return openAdmin();
  $("#app").innerHTML=guestGateView();
  $("#guestStudentBtn")?.addEventListener("click",()=>{sessionStorage.setItem("tina.v14.login.intent","learner");openUserLogin()});
  $("#guestTeacherBtn")?.addEventListener("click",()=>{sessionStorage.setItem("tina.v14.login.intent","teacher");openUserLogin()});
  $("#guestBusinessBtn")?.addEventListener("click",()=>{sessionStorage.setItem("tina.v14.login.intent","business");openUserLogin()});
  $("#guestAdminBtn")?.addEventListener("click",openAdmin);
  $("#guestSuperadminBtn")?.addEventListener("click",()=>{
    sessionStorage.setItem("tina.v14.login.intent","superadmin");
    if(window.TinaSuperadmin?.openLogin)return window.TinaSuperadmin.openLogin();
    const btn=$("#guestSuperadminBtn");
    if(btn){btn.disabled=true;btn.querySelector(".sourceRoleCopy small").textContent="Loading Superadmin portal...";}
    const once=()=>{window.removeEventListener("tina:superadmin-ready",once);if(btn)btn.disabled=false;window.TinaSuperadmin?.openLogin?.()};
    window.addEventListener("tina:superadmin-ready",once,{once:true});
  });
  $("#guestRegisterBtn")?.addEventListener("click",openUserRegister);
  applyGuestNavVisibility();
  syncAuthSurfaceChrome();
}

function openSuperadminFromAdminRuntime(){
  sessionStorage.setItem("tina.v14.login.intent","superadmin");
  if(window.TinaSuperadmin?.openLogin)return window.TinaSuperadmin.openLogin();
  window.dispatchEvent(new CustomEvent("tina:request-superadmin-login"));
}


function syncAuthSurfaceChrome(){
 const auth=!!$("#app .authCard,#app .adminGate,#app .guestGateCard,#app .roleEntryCard,#app .superadminPortalCard");
 document.documentElement.classList.toggle("authSurfaceActive",auth);
 const header=document.querySelector(".topbar");
 const footer=document.querySelector(".tinaFooter");
 if(header)header.setAttribute("aria-hidden",auth?"true":"false");
 if(footer)footer.setAttribute("aria-hidden",auth?"true":"false");
}

window.TinaAuthChrome={sync:syncAuthSurfaceChrome,refresh:()=>{syncAuthSurfaceChrome();syncInterfaceChrome();}};

function isAuthSurface(){
  return !!$("#app .authCard,#app .adminGate,#app .guestGateCard");
}
function applyGuestNavVisibility(){
  const nav=$("#nav");
  const guest=!currentUserSession()&&!isAdmin();
  document.documentElement.dataset.auth=guest?"guest":(isAdmin()?"admin":"user");
  if(!nav)return;
  $$(".navbtn").forEach(b=>{
    const isAuth=b.classList.contains("userAuthBtn")||b.dataset.view==="admin-v14";
    if(guest&&!isAuth){
      b.style.display="none";
      b.setAttribute("aria-hidden","true");
    }
  });
  if(guest){
    $("#userLoginBtn")?.style.setProperty("display","inline-flex");
    if(registrationEnabled())$("#userRegisterBtn")?.style.setProperty("display","inline-flex");
    $("#userAccountBtn")?.style.setProperty("display","none");
    const ab=$('[data-view="admin-v14"]');
    if(ab){ab.style.display="inline-flex";ab.textContent="Admin Login";ab.onclick=openAdmin}
  }
}
function enforceUserEntryGate(){
  const guest=!currentUserSession()&&!isAdmin();
  applyGuestNavVisibility();
  if(guest&&!isAuthSurface())openGuestGate();
}
function syncInterfaceChrome(){
  applyRoleInterface();
  refreshUserAuthEntry();
  finalChrome();
  protectAdminOnlyContent();
  installInterfaceSwitcher();
  enforceUserEntryGate();
}
function applyRoleInterface(){
  const admin=effectiveAdminInterface(),nav=$("#nav");
  if(!nav)return;
  let adminBtn=$('[data-view="admin-v14"]');
  if(!adminBtn){
    adminBtn=document.createElement("button");
    adminBtn.className="navbtn adminV14Btn";
    adminBtn.dataset.view="admin-v14";
    adminBtn.type="button";
    nav.appendChild(adminBtn);
  }
  adminBtn.textContent=admin?"Admin":"Admin Login";
  adminBtn.style.display="";
  adminBtn.onclick=openAdmin;
  $$(".navbtn").forEach(b=>{
    if(b===adminBtn)return;
    const id=b.dataset.view||"";
    const adminOnly=ADMIN_ROUTE_IDS.has(id);
    b.style.display=adminOnly?(admin?"":"none"):"";
    b.setAttribute("aria-hidden",adminOnly&&!admin?"true":"false");
  });
  document.documentElement.dataset.interface=admin?"admin":"user";
  document.body?.classList.toggle("adminInterface",admin);
  document.body?.classList.toggle("userInterface",!admin);
  applyGuestNavVisibility();
  syncAuthSurfaceChrome();
}
function finalChrome(){
  const n=$("#nav");if(!n)return;
  n.classList.add("v14nav");
  const order=effectiveAdminInterface()?ADMIN_NAV_ORDER:USER_NAV_ORDER;
  const buttons=$$(".navbtn");
  order.forEach(name=>{
    const id=ROUTE_BY_LABEL[name];
    const b=id?buttons.find(x=>x.dataset.view===id):buttons.find(x=>navText(x)===name);
    if(b)n.appendChild(b);
  });
  const adminBtn=$('[data-view="admin-v14"]');
  if(!effectiveAdminInterface()){
    if($("#userLoginBtn"))n.appendChild($("#userLoginBtn"));
    if($("#userRegisterBtn"))n.appendChild($("#userRegisterBtn"));
    if($("#userAccountBtn"))n.appendChild($("#userAccountBtn"));
    if(adminBtn){adminBtn.style.display="";adminBtn.textContent="Admin Login";adminBtn.onclick=openAdmin;n.appendChild(adminBtn)}
  }else if($("#userAccountBtn"))n.appendChild($("#userAccountBtn"));
  applyGuestNavVisibility();
  syncAuthSurfaceChrome();
}

window.addEventListener("tina:app-rendered",()=>{
  syncInterfaceChrome();
  setTimeout(decorateAdminCards,0);
});

guardAcademyClicks();guardAdminRoutes();
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(()=>{seedInitialAdmin();/* managed footer is bound by workspace-completion-v14.js */installNavigationControls();syncInterfaceChrome()},80));else setTimeout(()=>{seedInitialAdmin();/* managed footer is bound by workspace-completion-v14.js */installNavigationControls();syncInterfaceChrome()},80);

/* ---------- CROSS-RUNTIME AUTH BRIDGE ---------- */
window.TinaAuth = Object.freeze({
  openUserLogin,
  openUserRegister,
  openAdmin,
  openGuestGate,
  syncChrome: typeof syncAuthSurfaceChrome==="function" ? syncAuthSurfaceChrome : ()=>{},
  registrationEnabled: typeof registrationEnabled==="function" ? registrationEnabled : ()=>false
});
window.dispatchEvent(new CustomEvent("tina:auth-ready"));

})();
// V14 FINAL: grouped role navigation owns the authenticated account entry.
// Legacy duplicate Admin Login controls are suppressed when authenticated.
document.addEventListener("click",()=>setTimeout(()=>{
  const logged=!!sessionStorage.getItem("tina.v14.user.session")||sessionStorage.getItem("tina.v14.admin.session")==="1";
  if(logged){
    document.querySelectorAll(".adminV14Btn,#switchAdminLogin").forEach(x=>x.style.display="none");
  }
},0),true);

// V14 FINAL — Tina Academy is Superadmin-only.
// Legacy Administrator chrome must never expose the Academy button.
window.addEventListener("tina:app-rendered",()=>setTimeout(()=>{
  let superRole=false;
  try{const s=JSON.parse(sessionStorage.getItem("tina.v14.user.session")||"null");superRole=s?.role==="superadmin"}catch{}
  document.querySelectorAll('.navbtn[data-view="academy"]').forEach(b=>{b.style.display=superRole?"":"none";b.setAttribute("aria-hidden",superRole?"false":"true")});
},0));

// V14 FINAL governance: hide Canonical Data from ordinary Administrator.
window.addEventListener("tina:app-rendered",()=>setTimeout(()=>{
  let superMode=false;try{const s=JSON.parse(sessionStorage.getItem("tina.v14.user.session")||"null");superMode=s?.role==="superadmin"||s?.activeRole==="superadmin"}catch{}
  document.querySelectorAll('.navbtn').forEach(b=>{if((b.textContent||"").trim()==="Canonical Data"&&!superMode)b.style.display="none"});
},0));
