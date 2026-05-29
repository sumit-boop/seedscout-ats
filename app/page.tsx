/* eslint-disable */
// @ts-nocheck
"use client";
import { useState, useMemo, useRef, useCallback } from "react";
import { BriefcaseBusiness, ArrowDownToLine, Plus, X, Search, ChevronDown, Upload, User, Lock, LogOut, Users } from "lucide-react";

const CLIENTS = [
      { username: "admin", password: "hiring2024" },
      { username: "client1", password: "client123" },
      ];

const STORAGE_KEY = "hcc_v2";

function loadData(user) {
        if (typeof window === "undefined") return { jobs: [], candidates: [], owners: ["Sam","Priya","Alex","Jordan","Taylor"] };
        try {
                  const raw = localStorage.getItem(STORAGE_KEY + "_" + user);
                  if (raw) return JSON.parse(raw);
        } catch (e) {}
        return { jobs: [], candidates: [], owners: ["Sam","Priya","Alex","Jordan","Taylor"] };
}

function saveData(user, data) {
        if (typeof window !== "undefined") {
                  localStorage.setItem(STORAGE_KEY + "_" + user, JSON.stringify(data));
        }
}

const STOP = new Set(["and","the","for","with","from","this","that","into","role","work","own","build","lead","close","candidate","experience","will","have","team","you","are","they","we","is","in","of","a","to","be","as","at","by","on","an","or","but","not","more","has","can","all"]);

function tokens(text) {
        return [...new Set((text||"").toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)))].slice(0, 40);
}

function match(c, job) {
        if (!job) return { score: 0, reason: "Link candidate to a job.", matched: [], missing: [] };
        const jt = tokens([job.title, job.department, job.mustHaves, job.description].join(" "));
        const ct = new Set(tokens([c.role, c.cvText, c.notes, c.motivation].join(" ")));
        if (!jt.length) return { score: 0, reason: "Add job details.", matched: [], missing: [] };
        const m = jt.filter(w => ct.has(w));
        const miss = jt.filter(w => !ct.has(w)).slice(0,4);
        const score = m.length ? Math.min(98, Math.round(35 + 63 * (m.length / jt.length))) : 0;
        return { score, matched: m, missing: miss, reason: m.length ? "Matched: " + m.slice(0,4).join(", ") + ". " + (miss.length ? "Missing: " + miss.join(", ") + "." : "No major gaps.") : "No keyword overlap. Missing: " + miss.join(", ") + "." };
}

const STAGES = [
      { id: "sourced", title: "Sourced", hint: "Leads to review" },
      { id: "screen", title: "Screen", hint: "Intro calls" },
      { id: "interview", title: "Interview", hint: "Team loops" },
      { id: "offer", title: "Offer", hint: "Closing steps" },
      { id: "hired", title: "Hired", hint: "Accepted" },
      ];

async function parseCV(file) {
        return new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                              const text = ((e.target && e.target.result) || "").toString().replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim().substring(0, 3000);
                              resolve(text || "CV uploaded. Add key skills manually.");
                  };
                  reader.onerror = () => resolve("CV uploaded. Add key skills manually.");
                  if (file.type === "text/plain" || file.name.endsWith(".txt")) {
                              reader.readAsText(file);
                  } else {
                              resolve("CV: " + file.name + ". Add key skills in the notes field.");
                  }
        });
}

function Modal({ title, onClose, children }) {
        return (
                  <div className="modal-backdrop" onClick={onClose}>
                              <div className="modal-panel" onClick={function(e) { e.stopPropagation(); }}>
                                            <div className="modal-header">
                                                      <h2>{title}</h2>h2>
                                                      <button className="modal-close" onClick={onClose}><X size={20} /></button>button>
                                            </div>div>
                                    {children}
                              </div>div>
                  </div>div>
                );
}

function LoginScreen({ onLogin }) {
        const [u, setU] = useState("");
        const [p, setP] = useState("");
        const [err, setErr] = useState("");
        function handleSubmit(e) {
                  e.preventDefault();
                  const found = CLIENTS.find(function(c) { return c.username === u && c.password === p; });
                  if (found) { onLogin(u); } else { setErr("Invalid username or password."); }
        }
        return (
                  <div className="login-screen">
                        <div className="login-card">
                                <div className="login-logo"><BriefcaseBusiness size={40} color="var(--accent)" /></div>div>
                                <h1 className="login-title">Hiring Command Center</h1>h1>
                                <p className="login-subtitle">Sign in to access your hiring dashboard</p>p>
                                <form onSubmit={handleSubmit} className="login-form">
                                          <label>Username
                                                      <div className="input-icon-wrap">
                                                                    <User size={16} className="input-icon" />
                                                                    <input type="text" value={u} onChange={function(e) { setU(e.target.value); }} placeholder="Enter username" required />
                                                      </div>div>
                                          </label>label>
                                          <label>Password
                                                      <div className="input-icon-wrap">
                                                                    <Lock size={16} className="input-icon" />
                                                                    <input type="password" value={p} onChange={function(e) { setP(e.target.value); }} placeholder="Enter password" required />
                                                      </div>div>
                                          </label>label>
                                      {err && <p className="login-error">{err}</p>p>}
                                          <button type="submit" className="primary-button login-btn">Sign In</button>button>
                                </form>form>
                        </div>div>
                  </div>div>
                );
}

function ManageOwnersModal({ owners, onSave, onClose }) {
        const [list, setList] = useState([].concat(owners));
        const [newOwner, setNewOwner] = useState("");
        function add() {
                  const t = newOwner.trim();
                  if (t && list.indexOf(t) === -1) { setList(list.concat([t])); setNewOwner(""); }
        }
        return (
                  <Modal title="Manage Owner Pool" onClose={onClose}>
                        <div className="modal-form">
                                <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Manage the owner pool used in role and candidate dropdowns.</p>p>
                                <div className="owner-list">
                                      {list.map(function(o) {
                                    return (
                                                        <div key={o} className="owner-tag">
                                                                        <span>{o}</span>span>
                                                                        <button onClick={function() { setList(list.filter(function(x) { return x !== o; })); }} className="owner-remove"><X size={14} /></button>button>
                                                        </div>div>
                                                      );
                  })}
                                </div>div>
                                <div className="owner-add-row">
                                          <input value={newOwner} onChange={function(e) { setNewOwner(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") { e.preventDefault(); add(); }}} placeholder="Add a name..." />
                                          <button type="button" className="ghost-button" onClick={add}><Plus size={16} />Add</button>button>
                                </div>div>
                                <div className="modal-actions">
                                          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>button>
                                          <button type="button" className="primary-button" onClick={function() { onSave(list); onClose(); }}>Save</button>button>
                                </div>div>
                        </div>div>
                  </Modal>Modal>
                );
}

function AddRoleModal({ owners, onAdd, onClose }) {
        const [f, setF] = useState({ title: "", department: "", location: "", compensation: "", mustHaves: "", description: "", owner: owners[0] || "", priority: "Important", sellingPoints: "" });
        function set(k, v) { setF(function(prev) { const n = Object.assign({}, prev); n[k] = v; return n; }); }
        function handleSubmit(e) {
                  e.preventDefault();
                  if (f.title.trim()) {
                              onAdd(Object.assign({ id: "job-" + Date.now(), companyId: "client", status: "Active", targetDate: "" }, f));
                              onClose();
                  }
        }
        return (
                  <Modal title="Add new role" onClose={onClose}>
                        <form onSubmit={handleSubmit} className="modal-form">
                                <div className="form-row">
                                          <label>Job title *<input required value={f.title} onChange={function(e) { set("title", e.target.value); }} placeholder="e.g. Senior Backend Engineer" /></label>label>
                                          <label>Department<input value={f.department} onChange={function(e) { set("department", e.target.value); }} placeholder="e.g. Engineering" /></label>label>
                                </div>div>
                                <div className="form-row">
                                          <label>Location<input value={f.location} onChange={function(e) { set("location", e.target.value); }} placeholder="e.g. Remote, Hybrid" /></label>label>
                                          <label>Compensation<input value={f.compensation} onChange={function(e) { set("compensation", e.target.value); }} placeholder="e.g. $120k-$150k" /></label>label>
                                </div>div>
                                <div className="form-row">
                                          <label>Owner
                                                      <select value={f.owner} onChange={function(e) { set("owner", e.target.value); }}>
                                                            {owners.map(function(o) { return <option key={o} value={o}>{o}</option>option>; })}
                                                      </select>select>
                                          </label>label>
                                          <label>Priority
                                                      <select value={f.priority} onChange={function(e) { set("priority", e.target.value); }}>
                                                                    <option>Critical</option>option><option>Important</option>option><option>Nice to have</option>option>
                                                      </select>select>
                                          </label>label>
                                </div>div>
                                <label>Must-haves<textarea rows={2} value={f.mustHaves} onChange={function(e) { set("mustHaves", e.target.value); }} placeholder="Key skills and requirements" /></label>label>
                                <label>Job description<textarea rows={3} value={f.description} onChange={function(e) { set("description", e.target.value); }} placeholder="Describe the role..." /></label>label>
                                <label>Selling points<textarea rows={2} value={f.sellingPoints} onChange={function(e) { set("sellingPoints", e.target.value); }} placeholder="Why join?" /></label>label>
                                <div className="modal-actions">
                                          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>button>
                                          <button type="submit" className="primary-button"><Plus size={16} />Add role</button>button>
                                </div>div>
                        </form>form>
                  </Modal>Modal>
                );
}

function AddCandidateModal({ jobs, owners, onAdd, onClose }) {
        const firstJobId = jobs.length > 0 ? jobs[0].id : "";
        const [f, setF] = useState({ name: "", email: "", role: "", jobId: firstJobId, source: "LinkedIn", nextStep: "", owner: owners[0] || "", followUpDate: "", priority: "Medium", cvText: "", notes: "", cvFileName: "" });
        const [parsing, setParsing] = useState(false);
        const fileRef = useRef(null);
        function set(k, v) { setF(function(prev) { const n = Object.assign({}, prev); n[k] = v; return n; }); }
        async function handleFile(e) {
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;
                  setParsing(true);
                  const parsed = await parseCV(file);
                  setF(function(prev) { return Object.assign({}, prev, { cvText: parsed, cvFileName: file.name }); });
                  setParsing(false);
        }
        function handleSubmit(e) {
                  e.preventDefault();
                  if (f.name.trim()) {
                              onAdd(Object.assign({ id: "cand-" + Date.now(), companyId: "client", stage: "sourced", risk: "Low", motivation: "", phone: "" }, f));
                              onClose();
                  }
        }
        return (
                  <Modal title="Add candidate" onClose={onClose}>
                        <form onSubmit={handleSubmit} className="modal-form">
                                <div className="form-row">
                                          <label>Full name *<input required value={f.name} onChange={function(e) { set("name", e.target.value); }} placeholder="e.g. Alex Johnson" /></label>label>
                                          <label>Email<input type="email" value={f.email} onChange={function(e) { set("email", e.target.value); }} placeholder="candidate@email.com" /></label>label>
                                </div>div>
                                <div className="form-row">
                                          <label>Role / Title<input value={f.role} onChange={function(e) { set("role", e.target.value); }} placeholder="e.g. Product Designer" /></label>label>
                                          <label>Job opening
                                                      <select value={f.jobId} onChange={function(e) { set("jobId", e.target.value); }}>
                                                            {jobs.map(function(j) { return <option key={j.id} value={j.id}>{j.title}</option>option>; })}
                                                      </select>select>
                                          </label>label>
                                </div>div>
                                <div className="form-row">
                                          <label>Source
                                                      <select value={f.source} onChange={function(e) { set("source", e.target.value); }}>
                                                            {["LinkedIn","Referral","AngelList","Inbound","Cold outreach","Other"].map(function(s) { return <option key={s}>{s}</option>option>; })}
                                                      </select>select>
                                          </label>label>
                                          <label>Priority
                                                      <select value={f.priority} onChange={function(e) { set("priority", e.target.value); }}>
                                                                    <option>High</option>option><option>Medium</option>option><option>Low</option>option>
                                                      </select>select>
                                          </label>label>
                                </div>div>
                                <div className="form-row">
                                          <label>Owner
                                                      <select value={f.owner} onChange={function(e) { set("owner", e.target.value); }}>
                                                            {owners.map(function(o) { return <option key={o} value={o}>{o}</option>option>; })}
                                                      </select>select>
                                          </label>label>
                                          <label>Follow-up date<input type="date" value={f.followUpDate} onChange={function(e) { set("followUpDate", e.target.value); }} /></label>label>
                                </div>div>
                                <label>Next step<input value={f.nextStep} onChange={function(e) { set("nextStep", e.target.value); }} placeholder="e.g. Phone screen, Review portfolio" /></label>label>
                                <div className="cv-upload-section">
                                          <div className="cv-upload-label">Upload CV / Resume</div>div>
                                          <div className="cv-upload-row">
                                                      <button type="button" className="ghost-button cv-upload-btn" onClick={function() { if (fileRef.current) fileRef.current.click(); }} disabled={parsing}>
                                                                    <Upload size={16} />{parsing ? "Parsing..." : f.cvFileName ? "Replace CV" : "Upload CV"}
                                                      </button>button>
                                                {f.cvFileName && <span className="cv-filename">{f.cvFileName}</span>span>}
                                                      <input ref={fileRef} type="file" accept=".txt,.pdf,.doc,.docx" style={{ display: "none" }} onChange={handleFile} />
                                          </div>div>
                                      {parsing && <p className="cv-parsing-note">Extracting text from CV...</p>p>}
                                </div>div>
                                <label>CV / Skills notes<textarea rows={3} value={f.cvText} onChange={function(e) { set("cvText", e.target.value); }} placeholder="Key skills and experience..." /></label>label>
                                <label>Notes<textarea rows={2} value={f.notes} onChange={function(e) { set("notes", e.target.value); }} placeholder="Additional observations..." /></label>label>
                                <div className="modal-actions">
                                          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>button>
                                          <button type="submit" className="primary-button"><Plus size={16} />Add candidate</button>button>
                                </div>div>
                        </form>form>
                  </Modal>Modal>
                );
}

function ExportModal({ candidates, jobs, onClose }) {
        const rows = candidates.map(function(c) {
                  const job = jobs.find(function(j) { return j.id === c.jobId; });
                  const m = match(c, job);
                  return [c.name,c.role,c.stage,c.priority,c.source,(job && job.title) || "",m.score+"%",c.owner,c.followUpDate,c.nextStep].join(",");
        });
        const csv = ["Name,Role,Stage,Priority,Source,Job,Match,Owner,Follow-up,Next Step"].concat(rows).join("\n");
        function download() {
                  const b = new Blob([csv], { type: "text/csv" });
                  const u = URL.createObjectURL(b);
                  const a = document.createElement("a");
                  a.href = u; a.download = "candidates.csv"; a.click();
                  URL.revokeObjectURL(u);
        }
        return (
                  <Modal title="Export candidates" onClose={onClose}>
                        <div className="modal-form">
                                <p style={{ color: "var(--muted)", marginBottom: 16 }}>{candidates.length} candidate{candidates.length !== 1 ? "s" : ""} will be exported.</p>p>
                                <div className="export-preview"><pre>{csv.substring(0,400)}{csv.length > 400 ? "\n..." : ""}</pre>pre></div>div>
                                <div className="modal-actions">
                                          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>button>
                                          <button type="button" className="primary-button" onClick={download}><ArrowDownToLine size={16} />Download CSV</button>button>
                                </div>div>
                        </div>div>
                  </Modal>Modal>
                );
}

export default function App() {
        const [loggedIn, setLoggedIn] = useState(false);
        const [currentUser, setCurrentUser] = useState("");
        const [jobs, setJobs] = useState([]);
        const [candidates, setCandidates] = useState([]);
        const [owners, setOwners] = useState(["Sam","Priya","Alex","Jordan","Taylor"]);
        const [search, setSearch] = useState("");
        const [jobFilter, setJobFilter] = useState("all");
        const [modal, setModal] = useState(null);
      
        function handleLogin(u) {
                  const data = loadData(u);
                  setJobs(data.jobs || []);
                  setCandidates(data.candidates || []);
                  setOwners(data.owners || ["Sam","Priya","Alex","Jordan","Taylor"]);
                  setCurrentUser(u);
                  setLoggedIn(true);
        }
      
        function handleLogout() {
                  setLoggedIn(false); setCurrentUser(""); setJobs([]); setCandidates([]); setOwners(["Sam","Priya","Alex","Jordan","Taylor"]); setSearch(""); setJobFilter("all");
        }
      
        function persist(newJobs, newCandidates, newOwners) {
                  saveData(currentUser, { jobs: newJobs, candidates: newCandidates, owners: newOwners });
        }
      
        function addJob(j) { const nj = jobs.concat([j]); setJobs(nj); persist(nj, candidates, owners); }
        function addCandidate(c) { const nc = candidates.concat([c]); setCandidates(nc); persist(jobs, nc, owners); }
        function updateOwners(o) { setOwners(o); persist(jobs, candidates, o); }
        function moveStage(id, stage) { const nc = candidates.map(function(c) { return c.id === id ? Object.assign({}, c, { stage: stage }) : c; }); setCandidates(nc); persist(jobs, nc, owners); }
      
        const filtered = useMemo(function() {
                  return candidates.filter(function(c) {
                              const job = jobs.find(function(j) { return j.id === c.jobId; });
                              const text = [c.name, c.role, c.source, c.notes, c.cvText, job && job.title].join(" ").toLowerCase();
                              return (!search || text.indexOf(search.toLowerCase()) !== -1) && (jobFilter === "all" || c.jobId === jobFilter);
                  });
        }, [candidates, jobs, search, jobFilter]);
      
        const active = filtered.filter(function(c) { return c.stage !== "hired"; });
        const highPri = active.filter(function(c) { return c.priority === "High"; }).length;
        const offers = active.filter(function(c) { return c.stage === "offer"; }).length;
        const now = new Date(); now.setHours(0,0,0,0);
        const dueSoon = active.filter(function(c) {
                  if (!c.followUpDate) return false;
                  const d = Math.round((new Date(c.followUpDate + "T00:00:00").getTime() - now.getTime()) / 86400000);
                  return d >= 0 && d <= 3;
        }).length;
      
        if (!loggedIn) return <LoginScreen onLogin={handleLogin} />;
      
        return (
                  <main className="app-shell">
                        {modal === "addRole" && <AddRoleModal owners={owners} onAdd={addJob} onClose={function() { setModal(null); }} />}
                        {modal === "addCandidate" && <AddCandidateModal jobs={jobs} owners={owners} onAdd={addCandidate} onClose={function() { setModal(null); }} />}
                        {modal === "export" && <ExportModal candidates={candidates} jobs={jobs} onClose={function() { setModal(null); }} />}
                        {modal === "owners" && <ManageOwnersModal owners={owners} onSave={updateOwners} onClose={function() { setModal(null); }} />}
                  
                        <header className="topbar">
                                <div>
                                          <p className="eyebrow">Hiring Command Center</p>p>
                                          <h1>Hiring Command<br />Center</h1>h1>
                                </div>div>
                                <div className="topbar-actions">
                                          <button className="ghost-button" type="button" onClick={function() { setModal("owners"); }}><Users size={17} />Manage Owners</button>button>
                                          <button className="ghost-button" type="button" onClick={function() { setModal("addRole"); }}><BriefcaseBusiness size={17} />Add role</button>button>
                                          <button className="ghost-button" type="button" onClick={function() { setModal("export"); }}><ArrowDownToLine size={17} />Export</button>button>
                                          <button className="primary-button" type="button" onClick={function() { setModal("addCandidate"); }}><Plus size={17} />Add candidate</button>button>
                                          <button className="ghost-button logout-btn" type="button" onClick={handleLogout} title={"Sign out (" + currentUser + ")"}><LogOut size={17} /></button>button>
                                </div>div>
                        </header>header>
                  
                        <section className="toolbar" aria-label="Board controls">
                                <label className="search-field">
                                          <Search size={16} />
                                          <input value={search} onChange={function(e) { setSearch(e.target.value); }} type="search" placeholder="Search candidates, CVs, sources, notes..." />
                                </label>label>
                                <label className="select-field">
                                          <span className="select-label">Job</span>span>
                                          <select value={jobFilter} onChange={function(e) { setJobFilter(e.target.value); }}>
                                                      <option value="all">All jobs</option>option>
                                                {jobs.map(function(j) { return <option key={j.id} value={j.id}>{j.title}</option>option>; })}
                                          </select>select>
                                          <ChevronDown size={14} className="select-chevron" />
                                </label>label>
                        </section>section>
                  
                        <section className="metrics" aria-label="Hiring metrics">
                                <article className="metric"><span className="metric-label">Active candidates</span>span><strong className="metric-value">{active.length}</strong>strong></article>article>
                                <article className="metric"><span className="metric-label">High priority</span>span><strong className="metric-value metric-amber">{highPri}</strong>strong></article>article>
                                <article className="metric"><span className="metric-label">Due in 3 days</span>span><strong className="metric-value metric-rose">{dueSoon}</strong>strong></article>article>
                                <article className="metric"><span className="metric-label">Offers out</span>span><strong className="metric-value metric-accent">{offers}</strong>strong></article>article>
                        </section>section>
                  
                        <section className="jobs-section" aria-label="Open jobs">
                                <header className="section-header">
                                          <div><p className="eyebrow">Open roles</p>p><h2>Hiring plan</h2>h2></div>div>
                                          <p className="section-summary">{jobs.length} roles, {jobs.filter(function(j) { return j.priority === "Critical"; }).length} critical.</p>p>
                                </header>header>
                              {jobs.length === 0 ? (
                                  <div className="empty-state">
                                              <BriefcaseBusiness size={40} color="var(--muted)" />
                                              <p>No roles yet. Click <strong>Add role</strong>strong> to get started.</p>p>
                                  </div>div>
                                ) : (
                                  <div className="jobs-grid">
                                        {jobs.map(function(job) {
                                                      const jc = candidates.filter(function(c) { return c.jobId === job.id; });
                                                      const scored = jc.map(function(c) { return { c: c, m: match(c, job) }; }).sort(function(a,b) { return b.m.score - a.m.score; });
                                                      const top = scored[0];
                                                      return (
                                                                            <article key={job.id} className="job-card">
                                                                                              <header>
                                                                                                                  <div><h3>{job.title}</h3>h3><p className="job-meta-sub">{job.department} · {job.location}</p>p></div>div>
                                                                                                                  <span className={"job-status " + job.status.toLowerCase()}>{job.status}</span>span>
                                                                                                    </header>header>
                                                                                              <div className="job-stats">
                                                                                                                  <div className="job-stat"><span>Pipeline</span>span><strong>{jc.length} candidates</strong>strong></div>div>
                                                                                                                  <div className="job-stat"><span>Owner</span>span><strong>{job.owner}</strong>strong></div>div>
                                                                                                                  <div className="job-stat"><span>Comp</span>span><strong>{job.compensation}</strong>strong></div>div>
                                                                                                                  <div className="job-stat"><span>Priority</span>span><strong className={"priority-inline " + job.priority.toLowerCase()}>{job.priority}</strong>strong></div>div>
                                                                                                    </div>div>
                                                                                              <p className="job-must-haves">{job.mustHaves}</p>p>
                                                                                              <div className="ai-match-box">
                                                                                                    {top ? (
                                                                                                        <span className="job-top-match">
                                                                                                                                <span className="ai-tag">AI</span>span> Top match: {top.c.name} ({top.m.score}%) — {top.m.reason}
                                                                                                              </span>span>
                                                                                                      ) : (
                                                                                                        <span className="job-top-match no-match">No candidates yet — add one to see AI match.</span>span>
                                                                                                                  )}
                                                                                                    </div>div>
                                                                            </article>article>
                                                                          );
                                  })}
                                  </div>div>
                                )}
                        </section>section>
                  
                        <section className="command-center" aria-label="This week in hiring">
                                <header className="section-header">
                                          <div><p className="eyebrow">Founder brief</p>p><h2>This week in hiring</h2>h2></div>div>
                                          <p className="section-summary">{active.length} active · {highPri} high priority · {dueSoon} due soon</p>p>
                                </header>header>
                                <div className="command-grid">
                                          <article className="command-panel">
                                                      <header><h3>Next best actions</h3>h3><span className="panel-tag">Do first</span>span></header>header>
                                                      <div className="action-list">
                                                            {active.slice(0,4).map(function(c, i) {
                                        return (
                                                                <div key={c.id} className="action-item">
                                                                                    <span className="action-rank">{i+1}</span>span>
                                                                                    <div><strong>{c.nextStep || "Move " + c.name + " forward"}</strong>strong><p>{c.name} · {c.role}</p>p></div>div>
                                                                </div>div>
                                                              );
                  })}
                                                            {active.length === 0 && <p style={{color:"var(--muted)",fontSize:"0.85rem",padding:"8px 0"}}>Add candidates to see actions.</p>p>}
                                                      </div>div>
                                          </article>article>
                                          <article className="command-panel">
                                                      <header><h3>AI Match scores</h3>h3><span className="panel-tag">AI-powered</span>span></header>header>
                                                      <div className="action-list">
                                                            {filtered.slice(0,4).map(function(c) {
                                        const job = jobs.find(function(j) { return j.id === c.jobId; });
                                        const m = match(c, job);
                                        return (
                                                                <div key={c.id} className="action-item">
                                                                                    <span className={"action-rank " + (m.score >= 70 ? "rank-high" : m.score >= 50 ? "rank-mid" : "rank-low")}>{m.score}</span>span>
                                                                                    <div><strong>{c.name}</strong>strong><p>{m.reason}</p>p></div>div>
                                                                </div>div>
                                                              );
                  })}
                                                            {filtered.length === 0 && <p style={{color:"var(--muted)",fontSize:"0.85rem",padding:"8px 0"}}>Add candidates to see scores.</p>p>}
                                                      </div>div>
                                          </article>article>
                                          <article className="command-panel">
                                                      <header><h3>Closing watch</h3>h3><span className="panel-tag">Offers</span>span></header>header>
                                                      <div className="action-list">
                                                            {active.filter(function(c) { return c.stage === "offer" || c.risk !== "Low"; }).slice(0,4).map(function(c) {
                                        return (
                                                                <div key={c.id} className="closing-item">
                                                                                    <div className="closing-top"><strong>{c.name}</strong>strong><span className={"risk " + c.risk.toLowerCase()}>{c.risk} risk</span>span></div>div>
                                                                                    <p>{c.motivation || "Keep close plan current."}</p>p>
                                                                </div>div>
                                                              );
                  })}
                                                            {active.filter(function(c) { return c.stage === "offer" || c.risk !== "Low"; }).length === 0 && <p style={{color:"var(--muted)",fontSize:"0.85rem",padding:"8px 0"}}>No high-risk candidates.</p>p>}
                                                      </div>div>
                                          </article>article>
                                </div>div>
                        </section>section>
                  
                        <section className="board" aria-label="Candidate pipeline">
                              {STAGES.map(function(stage) {
                                  return (
                                                    <article key={stage.id} className="column">
                                                                  <header className="column-header">
                                                                                  <div><h2>{stage.title}</h2>h2><p>{stage.hint}</p>p></div>div>
                                                                                  <span className="count">{filtered.filter(function(c) { return c.stage === stage.id; }).length}</span>span>
                                                                  </header>header>
                                                                  <div className="dropzone">
                                                                        {filtered.filter(function(c) { return c.stage === stage.id; }).map(function(c) {
                                                                            const job = jobs.find(function(j) { return j.id === c.jobId; });
                                                                            const m = match(c, job);
                                                                            const dl = c.followUpDate ? new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric"}).format(new Date(c.followUpDate + "T00:00:00")) : "No date";
                                                                            return (
                                                                                                      <article key={c.id} className="candidate-card">
                                                                                                                            <header>
                                                                                                                                                    <div><h3>{c.name}</h3>h3><p className="role">{c.role}</p>p></div>div>
                                                                                                                                                    <span className={"priority " + c.priority.toLowerCase()}>{c.priority}</span>span>
                                                                                                                                  </header>header>
                                                                                                                            <dl>
                                                                                                                                                    <div><dt>Next</dt>dt><dd>{c.nextStep}</dd>dd></div>div>
                                                                                                                                                    <div><dt>Due</dt>dt><dd>{dl}</dd>dd></div>div>
                                                                                                                                                    <div><dt>Owner</dt>dt><dd>{c.owner}</dd>dd></div>div>
                                                                                                                                  </dl>dl>
                                                                                                                            <div className="match-summary">
                                                                                                                                                    <strong>{m.score}% match{job ? " · " + job.title : ""}</strong>strong>
                                                                                                                                                    <span>{m.reason}</span>span>
                                                                                                                                  </div>div>
                                                                                                            {c.cvFileName && <div className="cv-badge"><Upload size={11} />{c.cvFileName}</div>div>}
                                                                                                                            <footer>
                                                                                                                                                    <span className="source">{c.source}</span>span>
                                                                                                                                                    <select value={c.stage} onChange={function(ev) { moveStage(c.id, ev.target.value); }}>
                                                                                                                                                          {STAGES.map(function(s) { return <option key={s.id} value={s.id}>{s.title}</option>option>; })}
                                                                                                                                                          </select>select>
                                                                                                                                  </footer>footer>
                                                                                                            </article>article>
                                                                                                    );
                                                    })}
                                                                  </div>div>
                                                    </article>article>
                                                  );
                  })}
                        </section>section>
                  </main>main>
                );
}</div>
