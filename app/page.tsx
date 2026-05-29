"use client";
import { useState, useMemo, useRef } from "react";
import { BriefcaseBusiness, ArrowDownToLine, Plus, X, Search, ChevronDown, LogOut, Users, Upload, User, Lock } from "lucide-react";

/* — Types — */
interface Job {
        id: string; companyId: string; title: string; department: string;
        priority: string; status: string; owner: string; targetDate: string;
        location: string; compensation: string; mustHaves: string;
        description: string; sellingPoints: string;
}
interface Candidate {
        id: string; companyId: string; jobId: string; name: string; email: string;
        phone: string; role: string; stage: string; priority: string; source: string;
        nextStep: string; owner: string; followUpDate: string; risk: string;
        motivation: string; cvText: string; notes: string; cvFileName?: string;
}
interface MatchResult { score: number; reason: string; matched: string[]; missing: string[]; }
interface AppData { jobs: Job[]; candidates: Candidate[]; ownerPool: string[]; }

/* — Auth — */
const AUTH = [
      { u: "admin", p: "hiring2024" },
      { u: "client1", p: "client123" },
      ];

/* — Storage — */
const SK = "hcc_v2";
function load(user: string): AppData {
        if (typeof window === "undefined") return { jobs: [], candidates: [], ownerPool: ["Sam","Priya","Alex","Jordan","Taylor"] };
        try { const r = localStorage.getItem(SK+"_"+user); if (r) return JSON.parse(r); } catch(e) { void e; }
        return { jobs: [], candidates: [], ownerPool: ["Sam","Priya","Alex","Jordan","Taylor"] };
}
function save(user: string, d: AppData) { if (typeof window !== "undefined") localStorage.setItem(SK+"_"+user, JSON.stringify(d)); }

/* — Matching — */
const SW = new Set(["and","the","for","with","from","this","that","into","role","work","own","build","lead","close","candidate","experience","will","have","team","you","are","they","we","is","in","of","a","to","be","as","at","by","on","an","or","but","not"]);
function tok(t: string): string[] { return [...new Set((t||"").toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(w=>w.length>2&&!SW.has(w)))].slice(0,40); }
function calcMatch(c: Candidate, j: Job|undefined): MatchResult {
        if (!j) return { score:0, reason:"Link to a job.", matched:[], missing:[] };
        const jt = tok([j.title,j.department,j.mustHaves,j.description].join(" "));
        const ct = new Set(tok([c.role,c.cvText,c.notes,c.motivation].join(" ")));
        if (!jt.length) return { score:0, reason:"Add job details.", matched:[], missing:[] };
        const m = jt.filter(w=>ct.has(w)), ms = jt.filter(w=>!ct.has(w)).slice(0,4);
        const s = m.length ? Math.min(98, Math.round(35+63*(m.length/jt.length))) : 0;
        return { score:s, matched:m, missing:ms, reason: m.length ? "Matched: "+m.slice(0,4).join(", ")+". "+(ms.length?"Missing: "+ms.join(", ")+".":"No major gaps.") : "No keyword overlap. Missing: "+ms.join(", ")+"." };
}

const STAGES = [
      { id:"sourced", title:"Sourced", hint:"Leads to review" },
      { id:"screen", title:"Screen", hint:"Intro calls" },
      { id:"interview", title:"Interview", hint:"Team loops" },
      { id:"offer", title:"Offer", hint:"Closing steps" },
      { id:"hired", title:"Hired", hint:"Accepted" },
      ];

/* — CV Parser — */
function parseCV(file: File): Promise<string> {
        return new Promise(resolve => {
                  const r = new FileReader();
                  r.onload = e => { const t = ((e.target?.result as string)||"").replace(/[^\x20-\x7E\n\r\t]/g," ").replace(/\s+/g," ").trim().substring(0,3000); resolve(t||"CV uploaded. Add key skills manually."); };
                  r.onerror = () => resolve("CV uploaded. Add key skills manually.");
                  if (file.type==="text/plain"||file.name.endsWith(".txt")) r.readAsText(file);
                  else resolve("CV: "+file.name+". Add key skills in the notes field.");
        });
}

/* — Modal — */
function Modal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
        return (
                  <div className="modal-backdrop" onClick={onClose}>
                              <div className="modal-panel" onClick={e=>e.stopPropagation()}>
                                            <div className="modal-header"><h2>{title}</h2>h2><button className="modal-close" onClick={onClose}><X size={20}/></button>button></div>div>
                                    {children}
                              </div>div>
                  </div>div>
                );
}

/* — Login — */
function LoginScreen({ onLogin }: { onLogin:(u:string)=>void }) {
        const [u,setU]=useState(""), [p,setP]=useState(""), [err,setErr]=useState("");
        return (
                  <div className="login-screen"><div className="login-card">
                        <div className="login-logo"><BriefcaseBusiness size={40} color="var(--accent)"/></div>div>
                        <h1 className="login-title">Hiring Command Center</h1>h1>
                        <p className="login-subtitle">Sign in to access your hiring dashboard</p>p>
                        <form onSubmit={e=>{e.preventDefault();AUTH.find(a=>a.u===u&&a.p===p)?onLogin(u):setErr("Invalid credentials.");}} className="login-form">
                                <label>Username<div className="input-icon-wrap"><User size={16} className="input-icon"/><input type="text" value={u} onChange={e=>setU(e.target.value)} placeholder="Enter username" required/></div>div></label>label>
                                <label>Password<div className="input-icon-wrap"><Lock size={16} className="input-icon"/><input type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="Enter password" required/></div>div></label>label>
                              {err&&<p className="login-error">{err}</p>p>}
                                <button type="submit" className="primary-button login-btn">Sign In</button>button>
                        </form>form>
                  </div>div></div>div>
                );
}

/* — Manage Owners Modal — */
function ManageOwnersModal({ ownerPool, onSave, onClose }: { ownerPool:string[]; onSave:(o:string[])=>void; onClose:()=>void }) {
        const [list,setList]=useState([...ownerPool]), [nw,setNw]=useState("");
        const add=()=>{const t=nw.trim();if(t&&!list.includes(t)){setList([...list,t]);setNw("");}};
        return (
                  <Modal title="Manage Owner Pool" onClose={onClose}><div className="modal-form">
                        <p style={{color:"var(--muted)",fontSize:"0.85rem"}}>Manage the owner pool used in role and candidate dropdowns.</p>p>
                        <div className="owner-list">{list.map(o=><div key={o} className="owner-tag"><span>{o}</span>span><button onClick={()=>setList(list.filter(x=>x!==o))} className="owner-remove"><X size={14}/></button>button></div>div>)}</div>div>
                        <div className="owner-add-row"><input value={nw} onChange={e=>setNw(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();add();}}} placeholder="Add a name..."/><button type="button" className="ghost-button" onClick={add}><Plus size={16}/>Add</button>button></div>div>
                        <div className="modal-actions"><button type="button" className="ghost-button" onClick={onClose}>Cancel</button>button><button type="button" className="primary-button" onClick={()=>{onSave(list);onClose();}}>Save</button>button></div>div>
                  </div>div></Modal>Modal>
                );
}

/* — Add Role Modal — */
function AddRoleModal({ ownerPool, onAdd, onClose }: { ownerPool:string[]; onAdd:(j:Job)=>void; onClose:()=>void }) {
        const [f,setF]=useState({title:"",department:"",location:"",compensation:"",mustHaves:"",description:"",owner:ownerPool[0]||"",priority:"Important",sellingPoints:""});
        const s=(k:string,v:string)=>setF(p=>({...p,[k]:v}));
        return (
                  <Modal title="Add new role" onClose={onClose}><form onSubmit={e=>{e.preventDefault();if(f.title.trim()){onAdd({id:"job-"+Date.now(),companyId:"client",status:"Active",targetDate:"",...f});onClose();}}} className="modal-form">
                        <div className="form-row"><label>Job title *<input required value={f.title} onChange={e=>s("title",e.target.value)} placeholder="e.g. Senior Backend Engineer"/></label>label><label>Department<input value={f.department} onChange={e=>s("department",e.target.value)} placeholder="e.g. Engineering"/></label>label></div>div>
                        <div className="form-row"><label>Location<input value={f.location} onChange={e=>s("location",e.target.value)} placeholder="e.g. Remote"/></label>label><label>Compensation<input value={f.compensation} onChange={e=>s("compensation",e.target.value)} placeholder="e.g. $120k-$150k"/></label>label></div>div>
                        <div className="form-row"><label>Owner<select value={f.owner} onChange={e=>s("owner",e.target.value)}>{ownerPool.map(o=><option key={o} value={o}>{o}</option>option>)}</select>select></label>label><label>Priority<select value={f.priority} onChange={e=>s("priority",e.target.value)}><option>Critical</option>option><option>Important</option>option><option>Nice to have</option>option></select>select></label>label></div>div>
                        <label>Must-haves<textarea rows={2} value={f.mustHaves} onChange={e=>s("mustHaves",e.target.value)} placeholder="Key skills"/></label>label>
                        <label>Job description<textarea rows={3} value={f.description} onChange={e=>s("description",e.target.value)} placeholder="Describe the role..."/></label>label>
                        <label>Selling points<textarea rows={2} value={f.sellingPoints} onChange={e=>s("sellingPoints",e.target.value)} placeholder="Why join?"/></label>label>
                        <div className="modal-actions"><button type="button" className="ghost-button" onClick={onClose}>Cancel</button>button><button type="submit" className="primary-button"><Plus size={16}/>Add role</button>button></div>div>
                  </form>form></Modal>Modal>
                );
}

/* — Add Candidate Modal — */
function AddCandidateModal({ jobs, ownerPool, onAdd, onClose }: { jobs:Job[]; ownerPool:string[]; onAdd:(c:Candidate)=>void; onClose:()=>void }) {
        const [f,setF]=useState({name:"",email:"",role:"",jobId:jobs[0]?.id||"",source:"LinkedIn",nextStep:"",owner:ownerPool[0]||"",followUpDate:"",priority:"Medium",cvText:"",notes:"",cvFileName:""});
        const [prg,setPrg]=useState(false);
        const fr=useRef<HTMLInputElement>(null);
        const s=(k:string,v:string)=>setF(p=>({...p,[k]:v}));
        const onFile=async(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;setPrg(true);const t=await parseCV(file);setF(p=>({...p,cvText:t,cvFileName:file.name}));setPrg(false);};
        return (
                  <Modal title="Add candidate" onClose={onClose}><form onSubmit={e=>{e.preventDefault();if(f.name.trim()){onAdd({id:"c-"+Date.now(),companyId:"client",stage:"sourced",risk:"Low",motivation:"",phone:"",...f});onClose();}}} className="modal-form">
                        <div className="form-row"><label>Full name *<input required value={f.name} onChange={e=>s("name",e.target.value)} placeholder="e.g. Alex Johnson"/></label>label><label>Email<input type="email" value={f.email} onChange={e=>s("email",e.target.value)} placeholder="candidate@email.com"/></label>label></div>div>
                        <div className="form-row"><label>Role<input value={f.role} onChange={e=>s("role",e.target.value)} placeholder="e.g. Product Designer"/></label>label><label>Job opening<select value={f.jobId} onChange={e=>s("jobId",e.target.value)}>{jobs.map(j=><option key={j.id} value={j.id}>{j.title}</option>option>)}</select>select></label>label></div>div>
                        <div className="form-row"><label>Source<select value={f.source} onChange={e=>s("source",e.target.value)}>{["LinkedIn","Referral","AngelList","Inbound","Cold outreach","Other"].map(x=><option key={x}>{x}</option>option>)}</select>select></label>label><label>Priority<select value={f.priority} onChange={e=>s("priority",e.target.value)}><option>High</option>option><option>Medium</option>option><option>Low</option>option></select>select></label>label></div>div>
                        <div className="form-row"><label>Owner<select value={f.owner} onChange={e=>s("owner",e.target.value)}>{ownerPool.map(o=><option key={o} value={o}>{o}</option>option>)}</select>select></label>label><label>Follow-up date<input type="date" value={f.followUpDate} onChange={e=>s("followUpDate",e.target.value)}/></label>label></div>div>
                        <label>Next step<input value={f.nextStep} onChange={e=>s("nextStep",e.target.value)} placeholder="e.g. Phone screen"/></label>label>
                        <div className="cv-upload-section">
                                <div className="cv-upload-label">Upload CV / Resume</div>div>
                                <div className="cv-upload-row"><button type="button" className="ghost-button cv-upload-btn" onClick={()=>fr.current?.click()} disabled={prg}><Upload size={16}/>{prg?"Parsing...":f.cvFileName?"Replace CV":"Upload CV"}</button>button>{f.cvFileName&&<span className="cv-filename">{f.cvFileName}</span>span>}<input ref={fr} type="file" accept=".txt,.pdf,.doc,.docx" style={{display:"none"}} onChange={onFile}/></div>div>
                              {prg&&<p className="cv-parsing-note">Extracting text...</p>p>}
                        </div>div>
                        <label>CV / Skills notes<textarea rows={3} value={f.cvText} onChange={e=>s("cvText",e.target.value)} placeholder="Key skills and experience..."/></label>label>
                        <label>Notes<textarea rows={2} value={f.notes} onChange={e=>s("notes",e.target.value)} placeholder="Additional observations..."/></label>label>
                        <div className="modal-actions"><button type="button" className="ghost-button" onClick={onClose}>Cancel</button>button><button type="submit" className="primary-button"><Plus size={16}/>Add candidate</button>button></div>div>
                  </form>form></Modal>Modal>
                );
}

/* — Export Modal — */
function ExportModal({ candidates, jobs, onClose }: { candidates:Candidate[]; jobs:Job[]; onClose:()=>void }) {
        const csv=["Name,Role,Stage,Priority,Source,Job,Match,Owner,Follow-up,Next Step",...candidates.map(c=>{const j=jobs.find(x=>x.id===c.jobId),m=calcMatch(c,j);return[c.name,c.role,c.stage,c.priority,c.source,j?.title||"",m.score+"%",c.owner,c.followUpDate,c.nextStep].join(",");})].join("\n");
        return (
                  <Modal title="Export candidates" onClose={onClose}><div className="modal-form">
                        <p style={{color:"var(--muted)",marginBottom:16}}>{candidates.length} candidate{candidates.length!==1?"s":""} will be exported.</p>p>
                        <div className="export-preview"><pre>{csv.substring(0,400)}{csv.length>400?"\n...":""}</pre>pre></div>div>
                        <div className="modal-actions"><button type="button" className="ghost-button" onClick={onClose}>Cancel</button>button><button type="button" className="primary-button" onClick={()=>{const b=new Blob([csv],{type:"text/csv"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="candidates.csv";a.click();URL.revokeObjectURL(u);}}><ArrowDownToLine size={16}/>Download CSV</button>button></div>div>
                  </div>div></Modal>Modal>
                );
}

/* — Main Page — */
export default function Page() {
        const [loggedIn,setLoggedIn]=useState(false);
        const [user,setUser]=useState("");
        const [data,setData]=useState<AppData>({jobs:[],candidates:[],ownerPool:["Sam","Priya","Alex","Jordan","Taylor"]});
        const [search,setSearch]=useState("");
        const [jobFilter,setJobFilter]=useState("all");
        const [modal,setModal]=useState<string|null>(null);
      
        function doLogin(u:string){setData(load(u));setUser(u);setLoggedIn(true);}
        function doLogout(){setLoggedIn(false);setUser("");setData({jobs:[],candidates:[],ownerPool:["Sam","Priya","Alex","Jordan","Taylor"]});setSearch("");setJobFilter("all");}
        function upd(fn:(d:AppData)=>AppData){setData(d=>{const n=fn(d);save(user,n);return n;});}
      
        const filtered=useMemo(()=>data.candidates.filter(c=>{const j=data.jobs.find(x=>x.id===c.jobId),t=[c.name,c.role,c.source,c.notes,c.cvText,j?.title].join(" ").toLowerCase();return(!search||t.includes(search.toLowerCase()))&&(jobFilter==="all"||c.jobId===jobFilter);}), [data.candidates,data.jobs,search,jobFilter]);
        const active=filtered.filter(c=>c.stage!=="hired");
        const highPri=active.filter(c=>c.priority==="High").length;
        const offers=active.filter(c=>c.stage==="offer").length;
        const now=new Date();now.setHours(0,0,0,0);
        const due=active.filter(c=>{if(!c.followUpDate)return false;const d=Math.round((new Date(c.followUpDate+"T00:00:00").getTime()-now.getTime())/86400000);return d>=0&&d<=3;}).length;
      
        if (!loggedIn) return <LoginScreen onLogin={doLogin}/>;
      
        return (
                  <main className="app-shell">
                        {modal==="addRole"&&<AddRoleModal ownerPool={data.ownerPool} onAdd={j=>upd(d=>({...d,jobs:[...d.jobs,j]}))} onClose={()=>setModal(null)}/>}
                        {modal==="addCandidate"&&<AddCandidateModal jobs={data.jobs} ownerPool={data.ownerPool} onAdd={c=>upd(d=>({...d,candidates:[...d.candidates,c]}))} onClose={()=>setModal(null)}/>}
                        {modal==="export"&&<ExportModal candidates={data.candidates} jobs={data.jobs} onClose={()=>setModal(null)}/>}
                        {modal==="owners"&&<ManageOwnersModal ownerPool={data.ownerPool} onSave={o=>upd(d=>({...d,ownerPool:o}))} onClose={()=>setModal(null)}/>}
                  
                        <header className="topbar">
                                <div><p className="eyebrow">Hiring Command Center</p>p><h1>Hiring Command<br/>Center</h1>h1></div>div>
                                <div className="topbar-actions">
                                          <button className="ghost-button" type="button" onClick={()=>setModal("owners")}><Users size={17}/>Manage Owners</button>button>
                                          <button className="ghost-button" type="button" onClick={()=>setModal("addRole")}><BriefcaseBusiness size={17}/>Add role</button>button>
                                          <button className="ghost-button" type="button" onClick={()=>setModal("export")}><ArrowDownToLine size={17}/>Export</button>button>
                                          <button className="primary-button" type="button" onClick={()=>setModal("addCandidate")}><Plus size={17}/>Add candidate</button>button>
                                          <button className="ghost-button logout-btn" type="button" onClick={doLogout} title={"Sign out ("+user+")"}><LogOut size={17}/></button>button>
                                </div>div>
                        </header>header>
                  
                        <section className="toolbar" aria-label="Board controls">
                                <label className="search-field"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} type="search" placeholder="Search candidates, CVs, sources, notes..."/></label>label>
                                <label className="select-field"><span className="select-label">Job</span>span><select value={jobFilter} onChange={e=>setJobFilter(e.target.value)}><option value="all">All jobs</option>option>{data.jobs.map(j=><option key={j.id} value={j.id}>{j.title}</option>option>)}</select>select><ChevronDown size={14} className="select-chevron"/></label>label>
                        </section>section>
                  
                        <section className="metrics" aria-label="Hiring metrics">
                                <article className="metric"><span className="metric-label">Active candidates</span>span><strong className="metric-value">{active.length}</strong>strong></article>article>
                                <article className="metric"><span className="metric-label">High priority</span>span><strong className="metric-value metric-amber">{highPri}</strong>strong></article>article>
                                <article className="metric"><span className="metric-label">Due in 3 days</span>span><strong className="metric-value metric-rose">{due}</strong>strong></article>article>
                                <article className="metric"><span className="metric-label">Offers out</span>span><strong className="metric-value metric-accent">{offers}</strong>strong></article>article>
                        </section>section>
                  
                        <section className="jobs-section" aria-label="Open jobs">
                                <header className="section-header"><div><p className="eyebrow">Open roles</p>p><h2>Hiring plan</h2>h2></div>div><p className="section-summary">{data.jobs.length} roles, {data.jobs.filter(j=>j.priority==="Critical").length} critical.</p>p></header>header>
                              {data.jobs.length===0 ? (
                                  <div className="empty-state"><BriefcaseBusiness size={40} color="var(--muted)"/><p>No roles yet. Click <strong>Add role</strong>strong> to get started.</p>p></div>div>
                                ) : (
                                  <div className="jobs-grid">{data.jobs.map(job=>{
                                                    const jc=data.candidates.filter(c=>c.jobId===job.id);
                                                    const top=jc.map(c=>({c,m:calcMatch(c,job)})).sort((a,b)=>b.m.score-a.m.score)[0];
                                                    return (
                                                                        <article key={job.id} className="job-card">
                                                                                        <header><div><h3>{job.title}</h3>h3><p className="job-meta-sub">{job.department} · {job.location}</p>p></div>div><span className={"job-status "+job.status.toLowerCase()}>{job.status}</span>span></header>header>
                                                                                        <div className="job-stats">
                                                                                                          <div className="job-stat"><span>Pipeline</span>span><strong>{jc.length} candidates</strong>strong></div>div>
                                                                                                          <div className="job-stat"><span>Owner</span>span><strong>{job.owner}</strong>strong></div>div>
                                                                                                          <div className="job-stat"><span>Comp</span>span><strong>{job.compensation}</strong>strong></div>div>
                                                                                                          <div className="job-stat"><span>Priority</span>span><strong className={"priority-inline "+job.priority.toLowerCase()}>{job.priority}</strong>strong></div>div>
                                                                                              </div>div>
                                                                                        <p className="job-must-haves">{job.mustHaves}</p>p>
                                                                                        <div className="ai-match-box">
                                                                                              {top ? <><span className="ai-tag">AI Match</span>span><span className="job-top-match">Top match: {top.c.name} ({top.m.score}%)</span>span><span className="match-detail">{top.m.reason}</span>span></>> : <span className="job-top-match no-match">No candidates yet.</span>span>}
                                                                                              </div>div>
                                                                        </article>article>
                                                                      );
                                  })}</div>div>
                                )}
                        </section>section>
                  
                        <section className="command-center" aria-label="This week in hiring">
                                <header className="section-header"><div><p className="eyebrow">Founder brief</p>p><h2>This week in hiring</h2>h2></div>div><p className="section-summary">{active.length} active · {highPri} high priority · {due} due soon</p>p></header>header>
                                <div className="command-grid">
                                          <article className="command-panel">
                                                      <header><h3>Next best actions</h3>h3><span className="panel-tag">Do first</span>span></header>header>
                                                      <div className="action-list">
                                                            {active.slice(0,4).map((c,i)=><div key={c.id} className="action-item"><span className="action-rank">{i+1}</span>span><div><strong>{c.nextStep||"Move "+c.name+" forward"}</strong>strong><p>{c.name} · {c.role}</p>p></div>div></div>div>)}
                                                            {active.length===0&&<p style={{color:"var(--muted)",fontSize:"0.85rem",padding:"8px 0"}}>Add candidates to see actions.</p>p>}
                                                      </div>div>
                                          </article>article>
                                          <article className="command-panel">
                                                      <header><h3>AI Match scores</h3>h3><span className="panel-tag">AI-powered</span>span></header>header>
                                                      <div className="action-list">
                                                            {filtered.slice(0,4).map(c=>{const j=data.jobs.find(x=>x.id===c.jobId),m=calcMatch(c,j);return(<div key={c.id} className="action-item"><span className={"action-rank "+(m.score>=70?"rank-high":m.score>=50?"rank-mid":"rank-low")}>{m.score}</span>span><div><strong>{c.name}</strong>strong><p>{m.reason}</p>p></div>div></div>div>);})}
                                                            {filtered.length===0&&<p style={{color:"var(--muted)",fontSize:"0.85rem",padding:"8px 0"}}>Add candidates to see scores.</p>p>}
                                                      </div>div>
                                          </article>article>
                                          <article className="command-panel">
                                                      <header><h3>Closing watch</h3>h3><span className="panel-tag">Offers</span>span></header>header>
                                                      <div className="action-list">
                                                            {active.filter(c=>c.stage==="offer"||c.risk!=="Low").slice(0,4).map(c=><div key={c.id} className="closing-item"><div className="closing-top"><strong>{c.name}</strong>strong><span className={"risk "+c.risk.toLowerCase()}>{c.risk} risk</span>span></div>div><p>{c.motivation||"Keep close plan current."}</p>p></div>div>)}
                                                            {active.filter(c=>c.stage==="offer"||c.risk!=="Low").length===0&&<p style={{color:"var(--muted)",fontSize:"0.85rem",padding:"8px 0"}}>No high-risk candidates.</p>p>}
                                                      </div>div>
                                          </article>article>
                                </div>div>
                        </section>section>
                  
                        <section className="board" aria-label="Candidate pipeline">
                              {STAGES.map(stage=>(
                                  <article key={stage.id} className="column">
                                              <header className="column-header"><div><h2>{stage.title}</h2>h2><p>{stage.hint}</p>p></div>div><span className="count">{filtered.filter(c=>c.stage===stage.id).length}</span>span></header>header>
                                              <div className="dropzone">
                                                    {filtered.filter(c=>c.stage===stage.id).map(c=>{
                                                        const j=data.jobs.find(x=>x.id===c.jobId),m=calcMatch(c,j);
                                                        const dl=c.followUpDate?new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric"}).format(new Date(c.followUpDate+"T00:00:00")):"No date";
                                                        return (
                                                                                <article key={c.id} className="candidate-card">
                                                                                                    <header><div><h3>{c.name}</h3>h3><p className="role">{c.role}</p>p></div>div><span className={"priority "+c.priority.toLowerCase()}>{c.priority}</span>span></header>header>
                                                                                                    <dl><div><dt>Next</dt>dt><dd>{c.nextStep}</dd>dd></div>div><div><dt>Due</dt>dt><dd>{dl}</dd>dd></div>div><div><dt>Owner</dt>dt><dd>{c.owner}</dd>dd></div>div></dl>dl>
                                                                                                    <div className="match-summary"><strong>{m.score}% match{j?" · "+j.title:""}</strong>strong><span>{m.reason}</span>span></div>div>
                                                                                      {c.cvFileName&&<div className="cv-badge"><Upload size={11}/>{c.cvFileName}</div>div>}
                                                                                                    <footer>
                                                                                                                          <span className="source">{c.source}</span>span>
                                                                                                                          <select value={c.stage} onChange={ev=>upd(d=>({...d,candidates:d.candidates.map(x=>x.id===c.id?{...x,stage:ev.target.value}:x)}))}>
                                                                                                                                {STAGES.map(s=><option key={s.id} value={s.id}>{s.title}</option>option>)}
                                                                                                                                </select>select>
                                                                                                          </footer>footer>
                                                                                </article>article>
                                                                              );
                                  })}
                                              </div>div>
                                  </article>article>
                                ))}
                        </section>section>
                  </main>main>
                );
}</></div>
