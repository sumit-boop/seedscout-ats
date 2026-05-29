"use client";
import { useState, useMemo } from "react";
import { BriefcaseBusiness, ArrowDownToLine, Plus, X, Search, ChevronDown } from "lucide-react";

/* ── Types ── */
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
  motivation: string; cvText: string; notes: string;
}
interface MatchResult { score: number; reason: string; matched: string[]; missing: string[]; }

const COMPANY_ID = "demo-company";

const INITIAL_JOBS: Job[] = [
  {
    id: "job-product-designer", companyId: COMPANY_ID,
    title: "Product Designer", department: "Product", priority: "Critical",
    status: "Active", owner: "Sam", targetDate: "2026-07-10", location: "Remote",
    compensation: "$120k–$150k",
    mustHaves: "B2B product design, systems thinking, portfolio with shipped work.",
    description: "Own product design for a founder-led B2B platform.",
    sellingPoints: "Own the design system and shape the founder-led product direction.",
  },
  {
    id: "job-frontend-engineer", companyId: COMPANY_ID,
    title: "Frontend Engineer", department: "Engineering", priority: "Important",
    status: "Active", owner: "Priya", targetDate: "2026-07-25", location: "Hybrid",
    compensation: "$140k–$175k",
    mustHaves: "React, accessibility, product sense, design system experience.",
    description: "Build fast, accessible frontend experiences in React.",
    sellingPoints: "High ownership, modern stack, direct collaboration with design.",
  },
];

const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: "candidate-maya", companyId: COMPANY_ID, jobId: "job-product-designer",
    name: "Maya Patel", email: "maya@example.com", phone: "",
    role: "Product Designer", stage: "sourced", priority: "High", source: "Referral",
    nextStep: "Review portfolio", owner: "Sam", followUpDate: "2026-05-27",
    risk: "Medium", motivation: "Wants design ownership and a tighter product surface.",
    cvText: "Product designer with B2B marketplace experience, shipped design systems, portfolio case studies, user research, and close collaboration with engineering.",
    notes: "Strong marketplace experience and polished systems thinking.",
  },
  {
    id: "candidate-jordan", companyId: COMPANY_ID, jobId: "job-frontend-engineer",
    name: "Jordan Lee", email: "jordan@example.com", phone: "",
    role: "Frontend Engineer", stage: "screen", priority: "Medium", source: "LinkedIn",
    nextStep: "Phone screen", owner: "Priya", followUpDate: "2026-05-29",
    risk: "Low", motivation: "Interested in frontend platform work.",
    cvText: "Frontend engineer focused on React, accessibility, component libraries, dashboards, TypeScript, and design system implementation.",
    notes: "React, accessibility, and design system background.",
  },
];

const STOP_WORDS = new Set(["and","the","for","with","from","this","that","into","role","work","own","build","lead","close","candidate","experience"]);

function tokenize(text: string): string[] {
  return [...new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w))
  )].slice(0, 28);
}

function matchScore(candidate: Candidate, job: Job | undefined): MatchResult {
  if (!job) return { score: 0, reason: "Link this candidate to a job.", matched: [], missing: [] };
  const jobTokens = tokenize([job.title, job.department, job.mustHaves, job.description].filter(Boolean).join(" "));
  const candTokens = new Set(tokenize([candidate.role, candidate.cvText, candidate.notes, candidate.motivation, candidate.source].filter(Boolean).join(" ")));
  if (!jobTokens.length || !candTokens.size) return { score: 0, reason: "Add job description and CV text.", matched: [], missing: jobTokens.slice(0, 4) };
  const matched = jobTokens.filter(t => candTokens.has(t));
  const missing = jobTokens.filter(t => !candTokens.has(t)).slice(0, 4);
  const ratio = matched.length / jobTokens.length;
  return {
    score: matched.length ? Math.min(98, Math.round(35 + 63 * ratio)) : 0,
    matched, missing,
    reason: matched.length > 0
      ? `Matched: ${matched.slice(0, 4).join(", ")}. ${missing.length ? `Missing: ${missing.join(", ")}.` : "No major gaps found."}`
      : `No strong keyword overlap. Missing: ${missing.join(", ")}.`,
  };
}

const STAGES = [
  { id: "sourced", title: "Sourced", hint: "Leads to review" },
  { id: "screen",  title: "Screen",  hint: "Intro calls"    },
  { id: "interview", title: "Interview", hint: "Team loops" },
  { id: "offer",  title: "Offer",  hint: "Closing steps"    },
  { id: "hired",  title: "Hired",  hint: "Accepted"         },
];

/* ── Modal shell ── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Add Role Modal ── */
interface RoleForm {
  title: string; department: string; location: string; compensation: string;
  mustHaves: string; description: string; owner: string; priority: string;
}
function AddRoleModal({ jobs, onAdd, onClose }: { jobs: Job[]; onAdd: (j: Job) => void; onClose: () => void }) {
  const [form, setForm] = useState<RoleForm>({
    title: "", department: "", location: "", compensation: "",
    mustHaves: "", description: "", owner: "", priority: "Important",
  });
  const set = (k: keyof RoleForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onAdd({
      id: "job-" + form.title.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
      companyId: COMPANY_ID, status: "Active",
      targetDate: "", sellingPoints: "",
      ...form,
    });
    onClose();
  };

  return (
    <Modal title="Add new role" onClose={onClose}>
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-row">
          <label>Job title *<input required value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Senior Backend Engineer" /></label>
          <label>Department<input value={form.department} onChange={e => set("department", e.target.value)} placeholder="e.g. Engineering" /></label>
        </div>
        <div className="form-row">
          <label>Location<input value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. Remote, Hybrid, NYC" /></label>
          <label>Compensation<input value={form.compensation} onChange={e => set("compensation", e.target.value)} placeholder="e.g. $120k–$150k" /></label>
        </div>
        <div className="form-row">
          <label>Owner<input value={form.owner} onChange={e => set("owner", e.target.value)} placeholder="e.g. Sam" /></label>
          <label>Priority
            <select value={form.priority} onChange={e => set("priority", e.target.value)}>
              <option>Critical</option><option>Important</option><option>Nice to have</option>
            </select>
          </label>
        </div>
        <label>Must-haves<textarea rows={2} value={form.mustHaves} onChange={e => set("mustHaves", e.target.value)} placeholder="Key skills and requirements" /></label>
        <label>Job description<textarea rows={3} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe the role..." /></label>
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-button"><Plus size={16} />Add role</button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Add Candidate Modal ── */
interface CandidateForm {
  name: string; email: string; role: string; jobId: string; source: string;
  nextStep: string; owner: string; followUpDate: string; priority: string;
  cvText: string; notes: string;
}
function AddCandidateModal({ jobs, onAdd, onClose }: { jobs: Job[]; onAdd: (c: Candidate) => void; onClose: () => void }) {
  const [form, setForm] = useState<CandidateForm>({
    name: "", email: "", role: "", jobId: jobs[0]?.id ?? "",
    source: "LinkedIn", nextStep: "", owner: "", followUpDate: "",
    priority: "Medium", cvText: "", notes: "",
  });
  const set = (k: keyof CandidateForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd({
      id: "candidate-" + form.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
      companyId: COMPANY_ID, stage: "sourced", risk: "Low",
      motivation: "", phone: "",
      ...form,
    });
    onClose();
  };

  return (
    <Modal title="Add candidate" onClose={onClose}>
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-row">
          <label>Full name *<input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Alex Johnson" /></label>
          <label>Email<input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="candidate@email.com" /></label>
        </div>
        <div className="form-row">
          <label>Role / Title<input value={form.role} onChange={e => set("role", e.target.value)} placeholder="e.g. Product Designer" /></label>
          <label>Job opening
            <select value={form.jobId} onChange={e => set("jobId", e.target.value)}>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>Source
            <select value={form.source} onChange={e => set("source", e.target.value)}>
              {["LinkedIn","Referral","AngelList","Inbound","Cold outreach","Other"].map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label>Priority
            <select value={form.priority} onChange={e => set("priority", e.target.value)}>
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>Owner<input value={form.owner} onChange={e => set("owner", e.target.value)} placeholder="e.g. Priya" /></label>
          <label>Follow-up date<input type="date" value={form.followUpDate} onChange={e => set("followUpDate", e.target.value)} /></label>
        </div>
        <label>Next step<input value={form.nextStep} onChange={e => set("nextStep", e.target.value)} placeholder="e.g. Phone screen, Review portfolio" /></label>
        <label>CV / Resume notes<textarea rows={2} value={form.cvText} onChange={e => set("cvText", e.target.value)} placeholder="Paste key skills and experience from their CV..." /></label>
        <label>Notes<textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any additional observations..." /></label>
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-button"><Plus size={16} />Add candidate</button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Export Modal ── */
function ExportModal({ candidates, jobs, onClose }: { candidates: Candidate[]; jobs: Job[]; onClose: () => void }) {
  const rows = candidates.map(c => {
    const job = jobs.find(j => j.id === c.jobId);
    const m = matchScore(c, job);
    return [c.name, c.role, c.stage, c.priority, c.source, job?.title ?? "", m.score + "%", c.owner, c.followUpDate, c.nextStep, c.notes].join(",");
  });
  const csv = ["Name,Role,Stage,Priority,Source,Job,Match,Owner,Follow-up,Next Step,Notes", ...rows].join("\n");

  const download = () => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "candidates-export.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal title="Export candidates" onClose={onClose}>
      <div className="modal-form">
        <p style={{ color: "var(--muted)", marginBottom: 16 }}>
          {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} will be exported as CSV.
        </p>
        <div className="export-preview">
          <pre>{csv.substring(0, 400)}{csv.length > 400 ? "\n..." : ""}</pre>
        </div>
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
          <button type="button" className="primary-button" onClick={download}><ArrowDownToLine size={16} />Download CSV</button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Metric card ── */
function MetricCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <article className="metric">
      <span className="metric-label">{label}</span>
      <strong className={["metric-value", color ? `metric-${color}` : ""].join(" ").trim()}>{value}</strong>
    </article>
  );
}

/* ── Section header ── */
function SectionHeader({ eyebrow, title, summary }: { eyebrow: string; title: string; summary: string }) {
  return (
    <header className="section-header">
      <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>
      <p className="section-summary">{summary}</p>
    </header>
  );
}

/* ── Main app ── */
export default function App() {
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [modal, setModal] = useState<"addRole" | "addCandidate" | "export" | null>(null);

  const filtered = useMemo(() => candidates.filter(c => {
    const job = jobs.find(j => j.id === c.jobId);
    const text = [c.name, c.role, c.source, c.notes, c.cvText, job?.title].join(" ").toLowerCase();
    return (!search || text.includes(search.toLowerCase())) && (jobFilter === "all" || c.jobId === jobFilter);
  }), [candidates, jobs, search, jobFilter]);

  const active = filtered.filter(c => c.stage !== "hired");
  const highPriority = active.filter(c => c.priority === "High").length;
  const offersOut = active.filter(c => c.stage === "offer").length;
  const dueSoon = active.filter(c => {
    if (!c.followUpDate) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Math.round((new Date(c.followUpDate + "T00:00:00").getTime() - today.getTime()) / 86400000);
    return days >= 0 && days <= 3;
  }).length;

  const addJob = (job: Job) => setJobs(js => [...js, job]);
  const addCandidate = (c: Candidate) => setCandidates(cs => [...cs, c]);
  const updateStage = (id: string, stage: string) =>
    setCandidates(cs => cs.map(c => c.id === id ? { ...c, stage } : c));

  return (
    <main className="app-shell">
      {modal === "addRole"      && <AddRoleModal      jobs={jobs} onAdd={addJob}       onClose={() => setModal(null)} />}
      {modal === "addCandidate" && <AddCandidateModal jobs={jobs} onAdd={addCandidate} onClose={() => setModal(null)} />}
      {modal === "export"       && <ExportModal candidates={candidates} jobs={jobs}    onClose={() => setModal(null)} />}

      {/* Topbar */}
      <header className="topbar">
        <div>
          <p className="eyebrow">SeedScout ATS</p>
          <h1>Founder hiring<br />command center</h1>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" type="button" onClick={() => setModal("addRole")}>
            <BriefcaseBusiness size={17} />Add role
          </button>
          <button className="ghost-button" type="button" onClick={() => setModal("export")}>
            <ArrowDownToLine size={17} />Export
          </button>
          <button className="primary-button" type="button" onClick={() => setModal("addCandidate")}>
            <Plus size={17} />Add candidate
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <section className="toolbar" aria-label="Board controls">
        <label className="search-field">
          <Search size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} type="search" placeholder="Search candidates, CVs, sources, notes…" />
        </label>
        <label className="select-field">
          <span className="select-label">Job</span>
          <select value={jobFilter} onChange={e => setJobFilter(e.target.value)}>
            <option value="all">All jobs</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <ChevronDown size={14} className="select-chevron" />
        </label>
      </section>

      {/* Metrics */}
      <section className="metrics" aria-label="Hiring metrics">
        <MetricCard label="Active candidates" value={active.length} />
        <MetricCard label="High priority"     value={highPriority} color="amber" />
        <MetricCard label="Due in 3 days"     value={dueSoon}      color="rose"  />
        <MetricCard label="Offers out"        value={offersOut}    color="accent" />
      </section>

      {/* Jobs */}
      <section className="jobs-section" aria-label="Open jobs">
        <SectionHeader
          eyebrow="Open roles" title="Hiring plan"
          summary={`${jobs.length} roles, ${jobs.filter(j => j.priority === "Critical").length} critical.`}
        />
        <div className="jobs-grid">
          {jobs.map(job => {
            const pool = candidates.filter(c => c.jobId === job.id);
            const top = pool.map(c => ({ c, m: matchScore(c, job) })).sort((a, b) => b.m.score - a.m.score)[0];
            return (
              <article key={job.id} className="job-card">
                <header>
                  <div>
                    <h3>{job.title}</h3>
                    <p className="job-meta-sub">{job.department} · {job.location}</p>
                  </div>
                  <span className={`job-status ${job.status.toLowerCase()}`}>{job.status}</span>
                </header>
                <div className="job-stats">
                  <div className="job-stat"><span>Pipeline</span><strong>{pool.length} candidates</strong></div>
                  <div className="job-stat"><span>Owner</span><strong>{job.owner}</strong></div>
                  <div className="job-stat"><span>Comp</span><strong>{job.compensation}</strong></div>
                  <div className="job-stat"><span>Priority</span><strong className={`priority-inline ${job.priority.toLowerCase()}`}>{job.priority}</strong></div>
                </div>
                <p className="job-must-haves">{job.mustHaves}</p>
                <p className="job-top-match">{top ? `🏆 Top match: ${top.c.name} (${top.m.score}%)` : "No candidates yet."}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Command center */}
      <section className="command-center" aria-label="This week in hiring">
        <SectionHeader
          eyebrow="Founder brief" title="This week in hiring"
          summary={`${active.length} active · ${highPriority} high priority · ${dueSoon} due soon`}
        />
        <div className="command-grid">
          <article className="command-panel">
            <header><h3>Next best actions</h3><span className="panel-tag">Do first</span></header>
            <div className="action-list">
              {active.slice(0, 4).map((c, i) => (
                <div key={c.id} className="action-item">
                  <span className="action-rank">{i + 1}</span>
                  <div>
                    <strong>{c.nextStep || `Move ${c.name} forward`}</strong>
                    <p>{c.name} · {c.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="command-panel">
            <header><h3>Match scores</h3><span className="panel-tag">AI-powered</span></header>
            <div className="action-list">
              {filtered.slice(0, 4).map(c => {
                const job = jobs.find(j => j.id === c.jobId);
                const m = matchScore(c, job);
                return (
                  <div key={c.id} className="action-item">
                    <span className={`action-rank ${m.score >= 70 ? "rank-high" : m.score >= 50 ? "rank-mid" : "rank-low"}`}>{m.score}</span>
                    <div><strong>{c.name}</strong><p>{m.reason}</p></div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="command-panel">
            <header><h3>Closing watch</h3><span className="panel-tag">Offers</span></header>
            <div className="action-list">
              {active.filter(c => c.stage === "offer" || c.risk !== "Low").slice(0, 4).map(c => (
                <div key={c.id} className="closing-item">
                  <div className="closing-top">
                    <strong>{c.name}</strong>
                    <span className={`risk ${c.risk.toLowerCase()}`}>{c.risk} risk</span>
                  </div>
                  <p>{c.motivation || "Keep the close plan current."}</p>
                </div>
              ))}
              {active.filter(c => c.stage === "offer" || c.risk !== "Low").length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", padding: "8px 0" }}>No high-risk candidates right now.</p>
              )}
            </div>
          </article>
        </div>
      </section>

      {/* Kanban board */}
      <section className="board" aria-label="Candidate pipeline">
        {STAGES.map(stage => (
          <article key={stage.id} className="column">
            <header className="column-header">
              <div><h2>{stage.title}</h2><p>{stage.hint}</p></div>
              <span className="count">{filtered.filter(c => c.stage === stage.id).length}</span>
            </header>
            <div className="dropzone">
              {filtered.filter(c => c.stage === stage.id).map(c => {
                const job = jobs.find(j => j.id === c.jobId);
                const m = matchScore(c, job);
                const dueDate = c.followUpDate
                  ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(c.followUpDate + "T00:00:00"))
                  : "No date";
                return (
                  <article key={c.id} className="candidate-card">
                    <header>
                      <div><h3>{c.name}</h3><p className="role">{c.role}</p></div>
                      <span className={`priority ${c.priority.toLowerCase()}`}>{c.priority}</span>
                    </header>
                    <dl>
                      <div><dt>Next</dt><dd>{c.nextStep}</dd></div>
                      <div><dt>Due</dt><dd>{dueDate}</dd></div>
                      <div><dt>Owner</dt><dd>{c.owner}</dd></div>
                    </dl>
                    <div className="match-summary">
                      <strong>{m.score}% match{job ? ` · ${job.title}` : ""}</strong>
                      <span>{m.reason}</span>
                    </div>
                    <footer>
                      <span className="source">{c.source}</span>
                      <select value={c.stage} onChange={e => updateStage(c.id, e.target.value)}>
                        {STAGES.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                      </select>
                    </footer>
                  </article>
                );
              })}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
