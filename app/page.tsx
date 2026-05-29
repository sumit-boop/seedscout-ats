"use client";
import React, { useState, useMemo, useRef, useCallback, FormEvent, ReactNode } from "react";
import { BriefcaseBusiness, ArrowDownToLine, Plus, X, Search, ChevronDown, Upload, User, Lock, LogOut, Users } from "lucide-react";

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
interface ClientUser { username: string; password: string; }
interface AppState { jobs: Job[]; candidates: Candidate[]; ownerPool: string[]; }

const CLIENTS: ClientUser[] = [
    { username: "admin", password: "hiring2024" },
    { username: "client1", password: "client123" },
    ];

const STORAGE_KEY = "hiring_cc_v2";
function loadState(username: string): AppState {
      if (typeof window === "undefined") return { jobs: [], candidates: [], ownerPool: ["Sam","Priya","Alex","Jordan","Taylor"] };
      try { const raw = localStorage.getItem(STORAGE_KEY + "_" + username); if (raw) return JSON.parse(raw); } catch {}
      return { jobs: [], candidates: [], ownerPool: ["Sam","Priya","Alex","Jordan","Taylor"] };
}
function saveState(username: string, state: AppState) {
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY + "_" + username, JSON.stringify(state));
}

const STOP = new Set(["and","the","for","with","from","this","that","into","role","work","own","build","lead","close","candidate","experience","will","have","team","our","your","you","are","its","they","their","we","is","in","of","a","to","be","as","at","by","on","an","or","but","not","also","more","has","was","can","all","who","able","strong","high","fast"]);
function tokenize(text: string): string[] {
      return [...new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)))].slice(0, 40);
}
function computeMatch(candidate: Candidate, job: Job | undefined): MatchResult {
      if (!job) return { score: 0, reason: "Link this candidate to a job.", matched: [], missing: [] };
      const jt = tokenize([job.title, job.department, job.mustHaves, job.description].filter(Boolean).join(" "));
      const ct = new Set(tokenize([candidate.role, candidate.cvText, candidate.notes, candidate.motivation].filter(Boolean).join(" ")));
      if (!jt.length) return { score: 0, reason: "Add job description.", matched: [], missing: [] };
      const matched = jt.filter(w => ct.has(w));
      const missing = jt.filter(w => !ct.has(w)).slice(0,4);
      const score = matched.length ? Math.min(98, Math.round(35 + 63 * (matched.length / jt.length))) : 0;
      return { score, matched, missing, reason: matched.length > 0 ? `Matched: ${matched.slice(0,4).join(", ")}. ${missing.length ? `Missing: ${missing.join(", ")}.` : "No major gaps."}` : `No keyword overlap. Missing: ${missing.join(", ")}.` };
}

const STAGES = [
    { id: "sourced", title: "Sourced", hint: "Leads to review" },
    { id: "screen", title: "Screen", hint: "Intro calls" },
    { id: "interview", title: "Interview", hint: "Team loops" },
    { id: "offer", title: "Offer", hint: "Closing steps" },
    { id: "hired", title: "Hired", hint: "Accepted" },
    ];

async function parseCV(file: File): Promise<string> {
      return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                        const text = ((e.target?.result as string) || "").replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim().substring(0, 3000);
                        resolve(text || "CV uploaded. Please add key skills manually.");
              };
              reader.onerror = () => resolve("CV uploaded. Please add key skills manually.");
              if (file.type === "text/plain" || file.name.endsWith(".txt")) { reader.readAsText(file); }
              else { resolve(`CV: ${file.name}. Add key skills and experience in the notes field.`); }
      });
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
      return (
              <div className="modal-backdrop" onClick={onClose}>
                        <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
                                    <div className="modal-header">
                                              <h2>{title}</h2>h2>
                                              <button className="modal-close" onClick={onClose}><X size={20} /></button>button>
                                    </div>div>
                            {children}
                        </div>div>
              </div>div>
            );
}

function LoginScreen({ onLogin }: { onLogin: (u: string) => void }) {
      const [username, setUsername] = useState("");
      const [password, setPassword] = useState("");
      const [error, setError] = useState("");
      const handleSubmit = (e: FormEvent) => {
              e.preventDefault();
              if (CLIENTS.find(c => c.username === username && c.password === password)) { onLogin(username); }
              else { setError("Invalid username or password."); }
      };
      return (
              <div className="login-screen">
                    <div className="login-card">
                            <div className="login-logo"><BriefcaseBusiness size={40} color="var(--accent)" /></div>div>
                            <h1 className="login-title">Hiring Command Center</h1>h1>
                            <p className="login-subtitle">Sign in to access your hiring dashboard</p>p>
                            <form onSubmit={handleSubmit} className="login-form">
                                      <label>Username
                                                  <div className="input-icon-wrap"><User size={16} className="input-icon" /><input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" autoComplete="username" required /></div>div>
                                      </label>label>
                                      <label>Password
                                                  <div className="input-icon-wrap"><Lock size={16} className="input-icon" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password" required /></div>div>
                                      </label>label>
                                {error && <p className="login-error">{error}</p>p>}
                                      <button type="submit" className="primary-button login-btn">Sign In</button>button>
                            </form>form>
                    </div>div>
              </div>div>
            );
}

function ManageOwnersModal({ ownerPool, onSave, onClose }: { ownerPool: string[]; onSave: (o: string[]) => void; onClose: () => void }) {
      const [owners, setOwners] = useState<string[]>([...ownerPool]);
      const [newOwner, setNewOwner] = useState("");
      return (
              <Modal title="Manage Owner Pool" onClose={onClose}>
                    <div className="modal-form">
                            <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Manage the owner pool. These names appear in role and candidate dropdowns.</p>p>
                            <div className="owner-list">
                                {owners.map(o => (
                              <div key={o} className="owner-tag">
                                            <span>{o}</span>span>
                                            <button onClick={() => setOwners(owners.filter(x => x !== o))} className="owner-remove"><X size={14} /></button>button>
                              </div>div>
                            ))}
                            </div>div>
                            <div className="owner-add-row">
                                      <input value={newOwner} onChange={e => setNewOwner(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); const t = newOwner.trim(); if (t && !owners.includes(t)) { setOwners([...owners, t]); setNewOwner(""); } }}} placeholder="Add a name..." />
                                      <button type="button" className="ghost-button" onClick={() => { const t = newOwner.trim(); if (t && !owners.includes(t)) { setOwners([...owners, t]); setNewOwner(""); } }}><Plus size={16} />Add</button>button>
                            </div>div>
                            <div className="modal-actions">
                                      <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>button>
                                      <button type="button" className="primary-button" onClick={() => { onSave(owners); onClose(); }}>Save</button>button>
                            </div>div>
                    </div>div>
              </Modal>Modal>
            );
}

function AddRoleModal({ ownerPool, onAdd, onClose }: { ownerPool: string[]; onAdd: (j: Job) => void; onClose: () => void }) {
      const [form, setForm] = useState({ title: "", department: "", location: "", compensation: "", mustHaves: "", description: "", owner: ownerPool[0] || "", priority: "Important", sellingPoints: "" });
      const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
      return (
              <Modal title="Add new role" onClose={onClose}>
                    <form onSubmit={(e: FormEvent) => { e.preventDefault(); if (form.title.trim()) { onAdd({ id: "job-" + form.title.toLowerCase().replace(/\s+/g,"-") + "-" + Date.now(), companyId: "client", status: "Active", targetDate: "", ...form }); onClose(); }}} className="modal-form">
                            <div className="form-row">
                                      <label>Job title *<input required value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Senior Backend Engineer" /></label>label>
                                      <label>Department<input value={form.department} onChange={e => set("department", e.target.value)} placeholder="e.g. Engineering" /></label>label>
                            </div>div>
                            <div className="form-row">
                                      <label>Location<input value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. Remote, Hybrid" /></label>label>
                                      <label>Compensation<input value={form.compensation} onChange={e => set("compensation", e.target.value)} placeholder="e.g. $120k–$150k" /></label>label>
                            </div>div>
                            <div className="form-row">
                                      <label>Owner<select value={form.owner} onChange={e => set("owner", e.target.value)}>{ownerPool.map(o => <option key={o} value={o}>{o}</option>option>)}</select>select></label>label>
                                      <label>Priority<select value={form.priority} onChange={e => set("priority", e.target.value)}><option>Critical</option>option><option>Important</option>option><option>Nice to have</option>option></select>select></label>label>
                            </div>div>
                            <label>Must-haves<textarea rows={2} value={form.mustHaves} onChange={e => set("mustHaves", e.target.value)} placeholder="Key skills and requirements" /></label>label>
                            <label>Job description<textarea rows={3} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe the role..." /></label>label>
                            <label>Selling points<textarea rows={2} value={form.sellingPoints} onChange={e => set("sellingPoints", e.target.value)} placeholder="Why join?" /></label>label>
                            <div className="modal-actions">
                                      <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>button>
                                      <button type="submit" className="primary-button"><Plus size={16} />Add role</button>button>
                            </div>div>
                    </form>form>
              </Modal>Modal>
            );
}

function AddCandidateModal({ jobs, ownerPool, onAdd, onClose }: { jobs: Job[]; ownerPool: string[]; onAdd: (c: Candidate) => void; onClose: () => void }) {
      const [form, setForm] = useState({ name: "", email: "", role: "", jobId: jobs[0]?.id || "", source: "LinkedIn", nextStep: "", owner: ownerPool[0] || "", followUpDate: "", priority: "Medium", cvText: "", notes: "", cvFileName: "" });
      const [isParsing, setIsParsing] = useState(false);
      const fileRef = useRef<HTMLInputElement>(null);
      const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
      const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0]; if (!file) return;
              setIsParsing(true);
              const parsed = await parseCV(file);
              setForm(f => ({ ...f, cvText: parsed, cvFileName: file.name }));
              setIsParsing(false);
      };
      return (
              <Modal title="Add candidate" onClose={onClose}>
                    <form onSubmit={(e: FormEvent) => { e.preventDefault(); if (form.name.trim()) { onAdd({ id: "cand-" + Date.now(), companyId: "client", stage: "sourced", risk: "Low", motivation: "", phone: "", ...form }); onClose(); }}} className="modal-form">
                            <div className="form-row">
                                      <label>Full name *<input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Alex Johnson" /></label>label>
                                      <label>Email<input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="candidate@email.com" /></label>label>
                            </div>div>
                            <div className="form-row">
                                      <label>Role / Title<input value={form.role} onChange={e => set("role", e.target.value)} placeholder="e.g. Product Designer" /></label>label>
                                      <label>Job opening<select value={form.jobId} onChange={e => set("jobId", e.target.value)}>{jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>option>)}</select>select></label>label>
                            </div>div>
                            <div className="form-row">
                                      <label>Source<select value={form.source} onChange={e => set("source", e.target.value)}>{["LinkedIn","Referral","AngelList","Inbound","Cold outreach","Other"].map(s => <option key={s}>{s}</option>option>)}</select>select></label>label>
                                      <label>Priority<select value={form.priority} onChange={e => set("priority", e.target.value)}><option>High</option>option><option>Medium</option>option><option>Low</option>option></select>select></label>label>
                            </div>div>
                            <div className="form-row">
                                      <label>Owner<select value={form.owner} onChange={e => set("owner", e.target.value)}>{ownerPool.map(o => <option key={o} value={o}>{o}</option>option>)}</select>select></label>label>
                                      <label>Follow-up date<input type="date" value={form.followUpDate} onChange={e => set("followUpDate", e.target.value)} /></label>label>
                            </div>div>
                            <label>Next step<input value={form.nextStep} onChange={e => set("nextStep", e.target.value)} placeholder="e.g. Phone screen, Review portfolio" /></label>label>
                            <div className="cv-upload-section">
                                      <div className="cv-upload-label">Upload CV / Resume</div>div>
                                      <div className="cv-upload-row">
                                                  <button type="button" className="ghost-button cv-upload-btn" onClick={() => fileRef.current?.click()} disabled={isParsing}>
                                                                <Upload size={16} />{isParsing ? "Parsing..." : form.cvFileName ? "Replace CV" : "Upload CV"}
                                                  </button>button>
                                          {form.cvFileName && <span className="cv-filename">{form.cvFileName}</span>span>}
                                                  <input ref={fileRef} type="file" accept=".txt,.pdf,.doc,.docx" style={{ display: "none" }} onChange={handleFile} />
                                      </div>div>
                                {isParsing && <p className="cv-parsing-note">Extracting text from CV...</p>p>}
                            </div>div>
                            <label>CV / Skills notes<textarea rows={3} value={form.cvText} onChange={e => set("cvText", e.target.value)} placeholder="Key skills and experience (auto-filled from CV upload, or paste manually)..." /></label>label>
                            <label>Notes<textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Additional observations..." /></label>label>
                            <div className="modal-actions">
                                      <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>button>
                                      <button type="submit" className="primary-button"><Plus size={16} />Add candidate</button>button>
                            </div>div>
                    </form>form>
              </Modal>Modal>
            );
}

function ExportModal({ candidates, jobs, onClose }: { candidates: Candidate[]; jobs: Job[]; onClose: () => void }) {
      const csv = ["Name,Role,Stage,Priority,Source,Job,Match,Owner,Follow-up,Next Step", ...candidates.map(c => {
              const job = jobs.find(j => j.id === c.jobId); const m = computeMatch(c, job);
              return [c.name,c.role,c.stage,c.priority,c.source,job?.title||"",m.score+"%",c.owner,c.followUpDate,c.nextStep].join(",");
      })].join("\n");
      return (
              <Modal title="Export candidates" onClose={onClose}>
                    <div className="modal-form">
                            <p style={{ color: "var(--muted)", marginBottom: 16 }}>{candidates.length} candidate{candidates.length !== 1 ? "s" : ""} will be exported.</p>p>
                            <div className="export-preview"><pre>{csv.substring(0,400)}{csv.length > 400 ? "\n..." : ""}</pre>pre></div>div>
                            <div className="modal-actions">
                                      <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>button>
                                      <button type="button" className="primary-button" onClick={() => { const b = new Blob([csv],{type:"text/csv"}); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href=u; a.download="candidates.csv"; a.click(); URL.revokeObjectURL(u); }}><ArrowDownToLine size={16} />Download CSV</button>button>
                            </div>div>
                    </div>div>
              </Modal>Modal>
            );
}

function Metric({ label, value, color }: { label: string; value: number; color?: string }) {
      return <article className="metric"><span className="metric-label">{label}</span>span><strong className={["metric-value", color ? `metric-${color}` : ""].join(" ").trim()}>{value}</strong>strong></article>article>;
}

function SectionHeader({ eyebrow, title, summary }: { eyebrow: string; title: string; summary: string }) {
      return (
              <header className="section-header">
                    <div><p className="eyebrow">{eyebrow}</p>p><h2>{title}</h2>h2></div>div>
                    <p className="section-summary">{summary}</p>p>
              </header>header>
            );
}

export default function HiringCommandCenter() {
      const [loggedIn, setLoggedIn] = useState(false);
      const [currentUser, setCurrentUser] = useState("");
      const [appState, setAppState] = useState<AppState>({ jobs: [], candidates: [], ownerPool: ["Sam","Priya","Alex","Jordan","Taylor"] });
      const [search, setSearch] = useState("");
      const [jobFilter, setJobFilter] = useState("all");
      const [modal, setModal] = useState<string | null>(null);
    
      const handleLogin = (username: string) => {
              setAppState(loadState(username));
              setCurrentUser(username);
              setLoggedIn(true);
      };
      const handleLogout = () => { setLoggedIn(false); setCurrentUser(""); setAppState({ jobs: [], candidates: [], ownerPool: ["Sam","Priya","Alex","Jordan","Taylor"] }); setSearch(""); setJobFilter("all"); };
      const updateState = useCallback((updater: (prev: AppState) => AppState) => {
              setAppState(prev => { const next = updater(prev); saveState(currentUser, next); return next; });
      }, [currentUser]);
    
      const filtered = useMemo(() => appState.candidates.filter(c => {
              const job = appState.jobs.find(j => j.id === c.jobId);
              const text = [c.name, c.role, c.source, c.notes, c.cvText, job?.title].join(" ").toLowerCase();
              return (!search || text.includes(search.toLowerCase())) && (jobFilter === "all" || c.jobId === jobFilter);
      }), [appState.candidates, appState.jobs, search, jobFilter]);
    
      const active = filtered.filter(c => c.stage !== "hired");
      const highPri = active.filter(c => c.priority === "High").length;
      const offers = active.filter(c => c.stage === "offer").length;
      const dueSoon = active.filter(c => {
              if (!c.followUpDate) return false;
              const now = new Date(); now.setHours(0,0,0,0);
              const d = Math.round((new Date(c.followUpDate + "T00:00:00").getTime() - now.getTime()) / 86400000);
              return d >= 0 && d <= 3;
      }).length;
    
      if (!loggedIn) return <LoginScreen onLogin={handleLogin} />;
    
      return (
              <main className="app-shell">
                  {modal === "addRole" && <AddRoleModal ownerPool={appState.ownerPool} onAdd={j => updateState(s => ({ ...s, jobs: [...s.jobs, j] }))} onClose={() => setModal(null)} />}
                  {modal === "addCandidate" && <AddCandidateModal jobs={appState.jobs} ownerPool={appState.ownerPool} onAdd={c => updateState(s => ({ ...s, candidates: [...s.candidates, c] }))} onClose={() => setModal(null)} />}
                  {modal === "export" && <ExportModal candidates={appState.candidates} jobs={appState.jobs} onClose={() => setModal(null)} />}
                  {modal === "owners" && <ManageOwnersModal ownerPool={appState.ownerPool} onSave={owners => updateState(s => ({ ...s, ownerPool: owners }))} onClose={() => setModal(null)} />}
              
                    <header className="topbar">
                            <div>
                                      <p className="eyebrow">Hiring Command Center</p>p>
                                      <h1>Hiring Command<br />Center</h1>h1>
                            </div>div>
                            <div className="topbar-actions">
                                      <button className="ghost-button" type="button" onClick={() => setModal("owners")}><Users size={17} />Manage Owners</button>button>
                                      <button className="ghost-button" type="button" onClick={() => setModal("addRole")}><BriefcaseBusiness size={17} />Add role</button>button>
                                      <button className="ghost-button" type="button" onClick={() => setModal("export")}><ArrowDownToLine size={17} />Export</button>button>
                                      <button className="primary-button" type="button" onClick={() => setModal("addCandidate")}><Plus size={17} />Add candidate</button>button>
                                      <button className="ghost-button logout-btn" type="button" onClick={handleLogout} title={`Sign out (${currentUser})`}><LogOut size={17} /></button>button>
                            </div>div>
                    </header>header>
              
                    <section className="toolbar" aria-label="Board controls">
                            <label className="search-field">
                                      <Search size={16} />
                                      <input value={search} onChange={e => setSearch(e.target.value)} type="search" placeholder="Search candidates, CVs, sources, notes…" />
                            </label>label>
                            <label className="select-field">
                                      <span className="select-label">Job</span>span>
                                      <select value={jobFilter} onChange={e => setJobFilter(e.target.value)}>
                                                  <option value="all">All jobs</option>option>
                                          {appState.jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>option>)}
                                      </select>select>
                                      <ChevronDown size={14} className="select-chevron" />
                            </label>label>
                    </section>section>
              
                    <section className="metrics" aria-label="Hiring metrics">
                            <Metric label="Active candidates" value={active.length} />
                            <Metric label="High priority" value={highPri} color="amber" />
                            <Metric label="Due in 3 days" value={dueSoon} color="rose" />
                            <Metric label="Offers out" value={offers} color="accent" />
                    </section>section>
              
                    <section className="jobs-section" aria-label="Open jobs">
                            <SectionHeader eyebrow="Open roles" title="Hiring plan" summary={`${appState.jobs.length} roles, ${appState.jobs.filter(j => j.priority === "Critical").length} critical.`} />
                        {appState.jobs.length === 0 ? (
                            <div className="empty-state">
                                        <BriefcaseBusiness size={40} color="var(--muted)" />
                                        <p>No roles yet. Click <strong>Add role</strong>strong> to get started.</p>p>
                            </div>div>
                          ) : (
                            <div className="jobs-grid">
                                {appState.jobs.map(job => {
                                              const jc = appState.candidates.filter(c => c.jobId === job.id);
                                              const top = jc.map(c => ({ c, m: computeMatch(c, job) })).sort((a,b) => b.m.score - a.m.score)[0];
                                              return (
                                                                  <article key={job.id} className="job-card">
                                                                                    <header>
                                                                                                        <div><h3>{job.title}</h3>h3><p className="job-meta-sub">{job.department} · {job.location}</p>p></div>div>
                                                                                                        <span className={`job-status ${job.status.toLowerCase()}`}>{job.status}</span>span>
                                                                                        </header>header>
                                                                                    <div className="job-stats">
                                                                                                        <div className="job-stat"><span>Pipeline</span>span><strong>{jc.length} candidates</strong>strong></div>div>
                                                                                                        <div className="job-stat"><span>Owner</span>span><strong>{job.owner}</strong>strong></div>div>
                                                                                                        <div className="job-stat"><span>Comp</span>span><strong>{job.compensation}</strong>strong></div>div>
                                                                                                        <div className="job-stat"><span>Priority</span>span><strong className={`priority-inline ${job.priority.toLowerCase()}`}>{job.priority}</strong>strong></div>div>
                                                                                        </div>div>
                                                                                    <p className="job-must-haves">{job.mustHaves}</p>p>
                                                                                    <div className="ai-match-box">
                                                                                        {top ? (
                                                                                            <>
                                                                                                                    <span className="ai-tag">AI Match</span>span>
                                                                                                                    <span className="job-top-match">🏆 Top match: {top.c.name} ({top.m.score}%)</span>span>
                                                                                                                    <span className="match-detail">{top.m.reason}</span>span>
                                                                                                </>>
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
                            <SectionHeader eyebrow="Founder brief" title="This week in hiring" summary={`${active.length} active · ${highPri} high priority · ${dueSoon} due soon`} />
                            <div className="command-grid">
                                      <article className="command-panel">
                                                  <header><h3>Next best actions</h3>h3><span className="panel-tag">Do first</span>span></header>header>
                                                  <div className="action-list">
                                                      {active.slice(0,4).map((c,i) => (
                                  <div key={c.id} className="action-item">
                                                    <span className="action-rank">{i+1}</span>span>
                                                    <div><strong>{c.nextStep || `Move ${c.name} forward`}</strong>strong><p>{c.name} · {c.role}</p>p></div>div>
                                  </div>div>
                                ))}
                                                      {active.length === 0 && <p style={{color:"var(--muted)",fontSize:"0.85rem",padding:"8px 0"}}>Add candidates to see actions.</p>p>}
                                                  </div>div>
                                      </article>article>
                                      <article className="command-panel">
                                                  <header><h3>AI Match scores</h3>h3><span className="panel-tag">AI-powered</span>span></header>header>
                                                  <div className="action-list">
                                                      {filtered.slice(0,4).map(c => {
                                  const job = appState.jobs.find(j => j.id === c.jobId);
                                  const m = computeMatch(c, job);
                                  return (
                                                        <div key={c.id} className="action-item">
                                                                            <span className={`action-rank ${m.score >= 70 ? "rank-high" : m.score >= 50 ? "rank-mid" : "rank-low"}`}>{m.score}</span>span>
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
                                                      {active.filter(c => c.stage === "offer" || c.risk !== "Low").slice(0,4).map(c => (
                                  <div key={c.id} className="closing-item">
                                                    <div className="closing-top"><strong>{c.name}</strong>strong><span className={`risk ${c.risk.toLowerCase()}`}>{c.risk} risk</span>span></div>div>
                                                    <p>{c.motivation || "Keep close plan current."}</p>p>
                                  </div>div>
                                ))}
                                                      {active.filter(c => c.stage === "offer" || c.risk !== "Low").length === 0 && <p style={{color:"var(--muted)",fontSize:"0.85rem",padding:"8px 0"}}>No high-risk candidates.</p>p>}
                                                  </div>div>
                                      </article>article>
                            </div>div>
                    </section>section>
              
                    <section className="board" aria-label="Candidate pipeline">
                        {STAGES.map(stage => (
                            <article key={stage.id} className="column">
                                        <header className="column-header">
                                                      <div><h2>{stage.title}</h2>h2><p>{stage.hint}</p>p></div>div>
                                                      <span className="count">{filtered.filter(c => c.stage === stage.id).length}</span>span>
                                        </header>header>
                                        <div className="dropzone">
                                            {filtered.filter(c => c.stage === stage.id).map(c => {
                                                const job = appState.jobs.find(j => j.id === c.jobId);
                                                const m = computeMatch(c, job);
                                                const dl = c.followUpDate ? new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric"}).format(new Date(c.followUpDate + "T00:00:00")) : "No date";
                                                return (
                                                                      <article key={c.id} className="candidate-card">
                                                                                          <header>
                                                                                                                <div><h3>{c.name}</h3>h3><p className="role">{c.role}</p>p></div>div>
                                                                                                                <span className={`priority ${c.priority.toLowerCase()}`}>{c.priority}</span>span>
                                                                                              </header>header>
                                                                                          <dl>
                                                                                                                <div><dt>Next</dt>dt><dd>{c.nextStep}</dd>dd></div>div>
                                                                                                                <div><dt>Due</dt>dt><dd>{dl}</dd>dd></div>div>
                                                                                                                <div><dt>Owner</dt>dt><dd>{c.owner}</dd>dd></div>div>
                                                                                              </dl>dl>
                                                                                          <div className="match-summary">
                                                                                                                <strong>{m.score}% match{job ? ` · ${job.title}` : ""}</strong>strong>
                                                                                                                <span>{m.reason}</span>span>
                                                                                              </div>div>
                                                                          {c.cvFileName && <div className="cv-badge"><Upload size={11} />{c.cvFileName}</div>div>}
                                                                                          <footer>
                                                                                                                <span className="source">{c.source}</span>span>
                                                                                                                <select value={c.stage} onChange={ev => updateState(s => ({ ...s, candidates: s.candidates.map(x => x.id === c.id ? { ...x, stage: ev.target.value } : x) }))}>
                                                                                                                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.title}</option>option>)}
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
