"use client";

import {
  ArrowDownToLine,
  BriefcaseBusiness,
  ChevronDown,
  FileText,
  Loader2,
  Plus,
  Search,
  Upload,
  X
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type ReactNode
} from "react";

interface Job {
  id: string;
  companyId: string;
  title: string;
  department: string;
  priority: string;
  status: string;
  owner: string;
  targetDate: string;
  location: string;
  compensation: string;
  mustHaves: string;
  description: string;
  sellingPoints: string;
}

interface Candidate {
  id: string;
  companyId: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  stage: string;
  priority: string;
  source: string;
  nextStep: string;
  owner: string;
  followUpDate: string;
  risk: string;
  motivation: string;
  cvText: string;
  notes: string;
  aiScore?: number | null;
  aiReason?: string;
}

interface MatchResult {
  score: number;
  reason: string;
}

const COMPANY_ID = "demo-company";
const STOP_WORDS = new Set([
  "and",
  "the",
  "for",
  "with",
  "from",
  "this",
  "that",
  "into",
  "role",
  "work",
  "own",
  "build",
  "lead",
  "close",
  "candidate",
  "experience"
]);

const STAGES = [
  { id: "sourced", title: "Sourced", hint: "Leads to review" },
  { id: "screen", title: "Screen", hint: "Intro calls" },
  { id: "interview", title: "Interview", hint: "Team loops" },
  { id: "offer", title: "Offer", hint: "Closing steps" },
  { id: "hired", title: "Hired", hint: "Accepted" }
];

function tokenize(text: string): string[] {
  return [
    ...new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    )
  ].slice(0, 28);
}

function keywordMatch(candidate: Candidate, job: Job): MatchResult {
  const jobTokens = tokenize([job.title, job.department, job.mustHaves, job.description].join(" "));
  const candidateTokens = new Set(tokenize([candidate.role, candidate.cvText, candidate.notes].join(" ")));
  if (!jobTokens.length || !candidateTokens.size) {
    return { score: 0, reason: "Add CV text to calculate a match." };
  }
  const matched = jobTokens.filter((token) => candidateTokens.has(token));
  const missing = jobTokens.filter((token) => !candidateTokens.has(token)).slice(0, 4);
  const ratio = matched.length / jobTokens.length;
  const score = matched.length ? Math.min(98, Math.round(35 + 63 * ratio)) : 0;
  return {
    score,
    reason:
      matched.length > 0
        ? `Matched: ${matched.slice(0, 4).join(", ")}. ${
            missing.length ? `Missing: ${missing.join(", ")}.` : "No major gaps."
          }`
        : `No keyword overlap. Missing: ${missing.join(", ")}.`
  };
}

function getMatch(candidate: Candidate, job: Job | undefined): MatchResult {
  if (!job) return { score: 0, reason: "Link candidate to a job." };
  if (candidate.aiScore != null) return { score: candidate.aiScore, reason: candidate.aiReason ?? "" };
  return keywordMatch(candidate, job);
}

async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      text += `${content.items.map((item) => ("str" in item ? item.str : "")).join(" ")}\n`;
    }
    return text.trim();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve((event.target?.result as string) ?? "");
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function scoreWithAI(candidate: Candidate, job: Job): Promise<{ score: number | null; reason: string }> {
  if (!candidate.cvText?.trim()) return { score: null, reason: "No CV text to score." };
  try {
    const res = await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cvText: candidate.cvText,
        jobTitle: job.title,
        jobDescription: job.description,
        mustHaves: job.mustHaves
      })
    });
    const data = await res.json();
    return { score: data.score ?? null, reason: data.reason ?? "" };
  } catch {
    return { score: null, reason: "AI scoring failed." };
  }
}

function CVDropZone({ onFile, fileName }: { onFile: (text: string, name: string) => void; fileName: string }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError("");
      try {
        const text = await extractTextFromFile(file);
        if (!text.trim()) {
          setError("Couldn't extract text from this file.");
          setLoading(false);
          return;
        }
        onFile(text, file.name);
      } catch {
        setError("Failed to read file. Try a PDF or .txt file.");
      }
      setLoading(false);
    },
    [onFile]
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div>
      <div
        className={`cv-dropzone ${dragging ? "cv-dropzone--active" : ""} ${fileName ? "cv-dropzone--done" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.text"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {loading ? (
          <>
            <Loader2 size={22} className="spin" />
            <span>Reading CV...</span>
          </>
        ) : fileName ? (
          <>
            <FileText size={22} />
            <span>{fileName}</span>
            <span className="cv-dropzone__hint">Click to replace</span>
          </>
        ) : (
          <>
            <Upload size={22} />
            <span>Drop CV here or click to upload</span>
            <span className="cv-dropzone__hint">PDF or .txt. Text is extracted automatically.</span>
          </>
        )}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface RoleForm {
  title: string;
  department: string;
  location: string;
  compensation: string;
  mustHaves: string;
  description: string;
  owner: string;
  priority: string;
}

function AddRoleModal({ onAdd, onClose }: { onAdd: (job: Job) => void; onClose: () => void }) {
  const [form, setForm] = useState<RoleForm>({
    title: "",
    department: "",
    location: "",
    compensation: "",
    mustHaves: "",
    description: "",
    owner: "",
    priority: "Important"
  });
  const set = (key: keyof RoleForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    onAdd({
      id: `job-${form.title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      companyId: COMPANY_ID,
      status: "Active",
      targetDate: "",
      sellingPoints: "",
      ...form
    });
    onClose();
  };

  return (
    <Modal title="Add new role" onClose={onClose}>
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-row">
          <label>
            Job title *
            <input required value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="e.g. Senior Backend Engineer" />
          </label>
          <label>
            Department
            <input value={form.department} onChange={(event) => set("department", event.target.value)} placeholder="e.g. Engineering" />
          </label>
        </div>
        <div className="form-row">
          <label>
            Location
            <input value={form.location} onChange={(event) => set("location", event.target.value)} placeholder="e.g. Remote, Hybrid, NYC" />
          </label>
          <label>
            Compensation
            <input value={form.compensation} onChange={(event) => set("compensation", event.target.value)} placeholder="e.g. $120k-$150k" />
          </label>
        </div>
        <div className="form-row">
          <label>
            Owner
            <input value={form.owner} onChange={(event) => set("owner", event.target.value)} placeholder="e.g. Sam" />
          </label>
          <label>
            Priority
            <select value={form.priority} onChange={(event) => set("priority", event.target.value)}>
              <option>Critical</option>
              <option>Important</option>
              <option>Later</option>
            </select>
          </label>
        </div>
        <label>
          Must-haves *
          <textarea required rows={2} value={form.mustHaves} onChange={(event) => set("mustHaves", event.target.value)} placeholder="Key skills and requirements used for matching" />
        </label>
        <label>
          Job description *
          <textarea required rows={4} value={form.description} onChange={(event) => set("description", event.target.value)} placeholder="Full role description. More detail improves match scores." />
        </label>
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button">
            <Plus size={16} />
            Add role
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface CandidateForm {
  name: string;
  email: string;
  role: string;
  jobId: string;
  source: string;
  nextStep: string;
  owner: string;
  followUpDate: string;
  priority: string;
  cvText: string;
  notes: string;
}

function AddCandidateModal({
  jobs,
  onAdd,
  onClose
}: {
  jobs: Job[];
  onAdd: (candidate: Candidate) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CandidateForm>({
    name: "",
    email: "",
    role: "",
    jobId: jobs[0]?.id ?? "",
    source: "LinkedIn",
    nextStep: "",
    owner: "",
    followUpDate: "",
    priority: "Medium",
    cvText: "",
    notes: ""
  });
  const [cvFileName, setCvFileName] = useState("");
  const set = (key: keyof CandidateForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const handleCVFile = useCallback((text: string, name: string) => {
    set("cvText", text);
    setCvFileName(name);
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    onAdd({
      id: `candidate-${form.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      companyId: COMPANY_ID,
      stage: "sourced",
      risk: "Low",
      motivation: "",
      phone: "",
      aiScore: null,
      aiReason: undefined,
      ...form
    });
    onClose();
  };

  return (
    <Modal title="Add candidate" onClose={onClose}>
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-row">
          <label>
            Full name *
            <input required value={form.name} onChange={(event) => set("name", event.target.value)} placeholder="e.g. Alex Johnson" />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => set("email", event.target.value)} placeholder="candidate@email.com" />
          </label>
        </div>
        <div className="form-row">
          <label>
            Role / title
            <input value={form.role} onChange={(event) => set("role", event.target.value)} placeholder="e.g. Product Designer" />
          </label>
          <label>
            Job opening
            <select value={form.jobId} onChange={(event) => set("jobId", event.target.value)}>
              {jobs.length === 0 && <option value="">Add a role first</option>}
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            Source
            <select value={form.source} onChange={(event) => set("source", event.target.value)}>
              {["LinkedIn", "Referral", "AngelList", "Inbound", "Cold outreach", "Other"].map((source) => (
                <option key={source}>{source}</option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select value={form.priority} onChange={(event) => set("priority", event.target.value)}>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            Owner
            <input value={form.owner} onChange={(event) => set("owner", event.target.value)} placeholder="e.g. Priya" />
          </label>
          <label>
            Follow-up date
            <input type="date" value={form.followUpDate} onChange={(event) => set("followUpDate", event.target.value)} />
          </label>
        </div>
        <label>
          Next step
          <input value={form.nextStep} onChange={(event) => set("nextStep", event.target.value)} placeholder="e.g. Phone screen, review portfolio" />
        </label>
        <label>
          CV / Resume
          <CVDropZone onFile={handleCVFile} fileName={cvFileName} />
        </label>
        {form.cvText && (
          <div className="cv-preview">
            <p className="cv-preview__label">Extracted text preview</p>
            <pre>
              {form.cvText.slice(0, 400)}
              {form.cvText.length > 400 ? "\n..." : ""}
            </pre>
          </div>
        )}
        <label>
          Notes
          <textarea rows={2} value={form.notes} onChange={(event) => set("notes", event.target.value)} placeholder="Any additional observations..." />
        </label>
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button">
            <Plus size={16} />
            Add candidate
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ExportModal({ candidates, jobs, onClose }: { candidates: Candidate[]; jobs: Job[]; onClose: () => void }) {
  const rows = candidates.map((candidate) => {
    const job = jobs.find((item) => item.id === candidate.jobId);
    const match = getMatch(candidate, job);
    return [
      candidate.name,
      candidate.role,
      candidate.stage,
      candidate.priority,
      candidate.source,
      job?.title ?? "",
      `${match.score}%`,
      candidate.owner,
      candidate.followUpDate,
      candidate.nextStep,
      candidate.notes
    ].map(csvCell).join(",");
  });
  const csv = ["Name,Role,Stage,Priority,Source,Job,Match,Owner,Follow-up,Next Step,Notes", ...rows].join("\n");

  const download = () => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hiring-command-center-candidates.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal title="Export candidates" onClose={onClose}>
      <div className="modal-form">
        <p className="muted-copy">
          {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} will be exported as CSV.
        </p>
        <div className="export-preview">
          <pre>
            {csv.substring(0, 400)}
            {csv.length > 400 ? "\n..." : ""}
          </pre>
        </div>
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-button" onClick={download}>
            <ArrowDownToLine size={16} />
            Download CSV
          </button>
        </div>
      </div>
    </Modal>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <article className="metric">
      <span className="metric-label">{label}</span>
      <strong className={["metric-value", color ? `metric-${color}` : ""].join(" ").trim()}>{value}</strong>
    </article>
  );
}

function SectionHeader({ eyebrow, title, summary }: { eyebrow: string; title: string; summary: string }) {
  return (
    <header className="section-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <p className="section-summary">{summary}</p>
    </header>
  );
}

function EmptyState({
  icon,
  title,
  body,
  action
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [modal, setModal] = useState<"addRole" | "addCandidate" | "export" | null>(null);
  const [scoring, setScoring] = useState<Set<string>>(new Set());

  useEffect(() => {
    candidates.forEach((candidate) => {
      if (candidate.cvText && candidate.aiScore == null && !scoring.has(candidate.id)) {
        const job = jobs.find((item) => item.id === candidate.jobId);
        if (!job) return;
        setScoring((current) => new Set(current).add(candidate.id));
        scoreWithAI(candidate, job).then(({ score, reason }) => {
          setCandidates((current) =>
            current.map((item) => (item.id === candidate.id ? { ...item, aiScore: score, aiReason: reason } : item))
          );
          setScoring((current) => {
            const next = new Set(current);
            next.delete(candidate.id);
            return next;
          });
        });
      }
    });
  }, [candidates, jobs, scoring]);

  const filtered = useMemo(
    () =>
      candidates.filter((candidate) => {
        const job = jobs.find((item) => item.id === candidate.jobId);
        const text = [candidate.name, candidate.role, candidate.source, candidate.notes, candidate.cvText, job?.title]
          .join(" ")
          .toLowerCase();
        return (!search || text.includes(search.toLowerCase())) && (jobFilter === "all" || candidate.jobId === jobFilter);
      }),
    [candidates, jobs, search, jobFilter]
  );

  const active = filtered.filter((candidate) => candidate.stage !== "hired");
  const highPriority = active.filter((candidate) => candidate.priority === "High").length;
  const offersOut = active.filter((candidate) => candidate.stage === "offer").length;
  const dueSoon = active.filter((candidate) => {
    if (!candidate.followUpDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((new Date(`${candidate.followUpDate}T00:00:00`).getTime() - today.getTime()) / 86400000);
    return days >= 0 && days <= 3;
  }).length;

  const addJob = (job: Job) => setJobs((current) => [...current, job]);
  const addCandidate = (candidate: Candidate) => setCandidates((current) => [...current, candidate]);
  const updateStage = (id: string, stage: string) =>
    setCandidates((current) => current.map((candidate) => (candidate.id === id ? { ...candidate, stage } : candidate)));

  return (
    <main className="app-shell">
      {modal === "addRole" && <AddRoleModal onAdd={addJob} onClose={() => setModal(null)} />}
      {modal === "addCandidate" && (
        <AddCandidateModal jobs={jobs} onAdd={addCandidate} onClose={() => setModal(null)} />
      )}
      {modal === "export" && <ExportModal candidates={candidates} jobs={jobs} onClose={() => setModal(null)} />}

      <header className="topbar">
        <div>
          <p className="eyebrow">Hiring Command Center</p>
          <h1>
            Founder hiring
            <br />
            command center
          </h1>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" type="button" onClick={() => setModal("addRole")}>
            <BriefcaseBusiness size={17} />
            Add role
          </button>
          <button className="ghost-button" type="button" onClick={() => setModal("export")} disabled={candidates.length === 0}>
            <ArrowDownToLine size={17} />
            Export
          </button>
          <button className="primary-button" type="button" onClick={() => setModal("addCandidate")} disabled={jobs.length === 0}>
            <Plus size={17} />
            Add candidate
          </button>
        </div>
      </header>

      <section className="toolbar" aria-label="Board controls">
        <label className="search-field">
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Search candidates, CVs, sources, notes..." />
        </label>
        <label className="select-field">
          <span className="select-label">Job</span>
          <select value={jobFilter} onChange={(event) => setJobFilter(event.target.value)}>
            <option value="all">All jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="select-chevron" />
        </label>
      </section>

      {jobs.length === 0 && (
        <EmptyState
          icon={<BriefcaseBusiness size={36} />}
          title="No roles yet"
          body="Add your first open role to start building a pipeline. More job detail means better AI match scores."
          action={
            <button className="primary-button" type="button" onClick={() => setModal("addRole")}>
              <Plus size={16} />
              Add your first role
            </button>
          }
        />
      )}

      {jobs.length > 0 && (
        <>
          <section className="metrics" aria-label="Hiring metrics">
            <MetricCard label="Active candidates" value={active.length} />
            <MetricCard label="High priority" value={highPriority} color="amber" />
            <MetricCard label="Due in 3 days" value={dueSoon} color="rose" />
            <MetricCard label="Offers out" value={offersOut} color="accent" />
          </section>

          <section className="jobs-section" aria-label="Open jobs">
            <SectionHeader
              eyebrow="Open roles"
              title="Hiring plan"
              summary={`${jobs.length} role${jobs.length !== 1 ? "s" : ""}, ${
                jobs.filter((job) => job.priority === "Critical").length
              } critical.`}
            />
            <div className="jobs-grid">
              {jobs.map((job) => {
                const pool = candidates.filter((candidate) => candidate.jobId === job.id);
                const top = pool
                  .map((candidate) => ({ candidate, match: getMatch(candidate, job) }))
                  .sort((a, b) => b.match.score - a.match.score)[0];
                return (
                  <article key={job.id} className="job-card">
                    <header>
                      <div>
                        <h3>{job.title}</h3>
                        <p className="job-meta-sub">
                          {job.department}
                          {job.location ? ` · ${job.location}` : ""}
                        </p>
                      </div>
                      <span className={`job-status ${job.status.toLowerCase()}`}>{job.status}</span>
                    </header>
                    <div className="job-stats">
                      <div className="job-stat">
                        <span>Pipeline</span>
                        <strong>{pool.length} candidates</strong>
                      </div>
                      <div className="job-stat">
                        <span>Owner</span>
                        <strong>{job.owner || "-"}</strong>
                      </div>
                      <div className="job-stat">
                        <span>Comp</span>
                        <strong>{job.compensation || "-"}</strong>
                      </div>
                      <div className="job-stat">
                        <span>Priority</span>
                        <strong className={`priority-inline ${job.priority.toLowerCase()}`}>{job.priority}</strong>
                      </div>
                    </div>
                    {job.mustHaves && <p className="job-must-haves">{job.mustHaves}</p>}
                    <p className="job-top-match">
                      {top ? `Top match: ${top.candidate.name} (${top.match.score}%)` : "No candidates yet. Add one to see AI match scores."}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          {candidates.length > 0 && (
            <section className="command-center" aria-label="This week in hiring">
              <SectionHeader
                eyebrow="Founder brief"
                title="This week in hiring"
                summary={`${active.length} active · ${highPriority} high priority · ${dueSoon} due soon`}
              />
              <div className="command-grid">
                <article className="command-panel">
                  <header>
                    <h3>Next best actions</h3>
                    <span className="panel-tag">Do first</span>
                  </header>
                  <div className="action-list">
                    {active.slice(0, 4).map((candidate, index) => (
                      <div key={candidate.id} className="action-item">
                        <span className="action-rank">{index + 1}</span>
                        <div>
                          <strong>{candidate.nextStep || `Move ${candidate.name} forward`}</strong>
                          <p>
                            {candidate.name} · {candidate.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="command-panel">
                  <header>
                    <h3>AI match scores</h3>
                    <span className="panel-tag">GPT-4o-mini</span>
                  </header>
                  <div className="action-list">
                    {filtered.slice(0, 4).map((candidate) => {
                      const job = jobs.find((item) => item.id === candidate.jobId);
                      const match = getMatch(candidate, job);
                      const isScoring = scoring.has(candidate.id);
                      return (
                        <div key={candidate.id} className="action-item">
                          {isScoring ? (
                            <span className="action-rank rank-loading">
                              <Loader2 size={16} className="spin" />
                            </span>
                          ) : (
                            <span className={`action-rank ${match.score >= 70 ? "rank-high" : match.score >= 50 ? "rank-mid" : "rank-low"}`}>
                              {match.score}
                            </span>
                          )}
                          <div>
                            <strong>{candidate.name}</strong>
                            <p>{isScoring ? "Running AI analysis..." : match.reason}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>

                <article className="command-panel">
                  <header>
                    <h3>Closing watch</h3>
                    <span className="panel-tag">Offers</span>
                  </header>
                  <div className="action-list">
                    {active
                      .filter((candidate) => candidate.stage === "offer" || candidate.risk !== "Low")
                      .slice(0, 4)
                      .map((candidate) => (
                        <div key={candidate.id} className="closing-item">
                          <div className="closing-top">
                            <strong>{candidate.name}</strong>
                            <span className={`risk ${candidate.risk.toLowerCase()}`}>{candidate.risk} risk</span>
                          </div>
                          <p>{candidate.motivation || "Keep the close plan current."}</p>
                        </div>
                      ))}
                    {active.filter((candidate) => candidate.stage === "offer" || candidate.risk !== "Low").length === 0 && (
                      <p className="muted-copy">No high-risk candidates right now.</p>
                    )}
                  </div>
                </article>
              </div>
            </section>
          )}

          <section className="board" aria-label="Candidate pipeline">
            {STAGES.map((stage) => (
              <article key={stage.id} className="column">
                <header className="column-header">
                  <div>
                    <h2>{stage.title}</h2>
                    <p>{stage.hint}</p>
                  </div>
                  <span className="count">{filtered.filter((candidate) => candidate.stage === stage.id).length}</span>
                </header>
                <div className="dropzone">
                  {filtered.filter((candidate) => candidate.stage === stage.id).length === 0 && <p className="column-empty">No candidates here yet.</p>}
                  {filtered
                    .filter((candidate) => candidate.stage === stage.id)
                    .map((candidate) => {
                      const job = jobs.find((item) => item.id === candidate.jobId);
                      const match = getMatch(candidate, job);
                      const isScoring = scoring.has(candidate.id);
                      const dueDate = candidate.followUpDate
                        ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(`${candidate.followUpDate}T00:00:00`))
                        : "No date";
                      return (
                        <article key={candidate.id} className="candidate-card">
                          <header>
                            <div>
                              <h3>{candidate.name}</h3>
                              <p className="role">{candidate.role}</p>
                            </div>
                            <span className={`priority ${candidate.priority.toLowerCase()}`}>{candidate.priority}</span>
                          </header>
                          <dl>
                            <div>
                              <dt>Next</dt>
                              <dd>{candidate.nextStep || "-"}</dd>
                            </div>
                            <div>
                              <dt>Due</dt>
                              <dd>{dueDate}</dd>
                            </div>
                            <div>
                              <dt>Owner</dt>
                              <dd>{candidate.owner || "-"}</dd>
                            </div>
                          </dl>
                          <div className="match-summary">
                            {isScoring ? (
                              <strong className="match-scoring">
                                <Loader2 size={13} className="spin" /> Scoring with AI...
                              </strong>
                            ) : (
                              <>
                                <strong>
                                  {match.score}% match{job ? ` · ${job.title}` : ""}
                                  {candidate.aiScore != null ? " · AI" : ""}
                                </strong>
                                <span>{match.reason}</span>
                              </>
                            )}
                          </div>
                          <footer>
                            <span className="source">{candidate.source}</span>
                            <select value={candidate.stage} onChange={(event) => updateStage(candidate.id, event.target.value)}>
                              {STAGES.map((nextStage) => (
                                <option key={nextStage.id} value={nextStage.id}>
                                  {nextStage.title}
                                </option>
                              ))}
                            </select>
                          </footer>
                        </article>
                      );
                    })}
                </div>
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  );
}

function csvCell(value: string) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}
