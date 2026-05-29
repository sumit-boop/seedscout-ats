"use client";
import { useState, useMemo } from "react";
import { BriefcaseBusiness, ArrowDownToLine, Plus, X, Search, ChevronDown } from "lucide-react";

const COMPANY_ID = "demo-company";

const INITIAL_JOBS = [
  {
    id: "job-product-designer",
    companyId: COMPANY_ID,
    title: "Product Designer",
    department: "Product",
    priority: "Critical",
    status: "Active",
    owner: "Sam",
    targetDate: "2026-07-10",
    location: "Remote",
    compensation: "$120k-$150k",
    mustHaves: "B2B product design, systems thinking, portfolio with shipped work.",
    description: "Own product design for a founder-led B2B platform.",
    sellingPoints: "Own the design system and shape the founder-led product direction.",
  },
  {
    id: "job-frontend-engineer",
    companyId: COMPANY_ID,
    title: "Frontend Engineer",
    department: "Engineering",
    priority: "Important",
    status: "Active",
    owner: "Priya",
    targetDate: "2026-07-25",
    location: "Hybrid",
    compensation: "$140k-$175k",
    mustHaves: "React, accessibility, product sense, design system experience.",
    description: "Build fast, accessible frontend experiences in React.",
    sellingPoints: "High ownership, modern stack, direct collaboration with design.",
  },
];

const INITIAL_CANDIDATES = [
  {
    id: "candidate-maya",
    companyId: COMPANY_ID,
    jobId: "job-product-designer",
    name: "Maya Patel",
    email: "maya@example.com",
    phone: "",
    role: "Product Designer",
    stage: "sourced",
    priority: "High",
    source: "Referral",
    nextStep: "Review portfolio",
    owner: "Sam",
    followUpDate: "2026-05-27",
    risk: "Medium",
    motivation: "Wants design ownership and a tighter product surface.",
    cvText: "Product designer with B2B marketplace experience, shipped design systems, portfolio case studies, user research, and close collaboration with engineering.",
    notes: "Strong marketplace experience and polished systems thinking.",
  },
  {
    id: "candidate-jordan",
    companyId: COMPANY_ID,
    jobId: "job-frontend-engineer",
    name: "Jordan Lee",
    email: "jordan@example.com",
    phone: "",
    role: "Frontend Engineer",
    stage: "screen",
    priority: "Medium",
    source: "LinkedIn",
    nextStep: "Phone screen",
    owner: "Priya",
    followUpDate: "2026-05-29",
    risk: "Low",
    motivation: "Interested in frontend platform work.",
    cvText: "Frontend engineer focused on React, accessibility, component libraries, dashboards, TypeScript, and design system implementation.",
    notes: "React, accessibility, and design system background.",
  },
];

const STOP_WORDS = new Set(["and","the","for","with","from","this","that","into","role","work","own","build","lead","close","candidate","experience"]);

function tokenize(text: string) {
  return [...new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w)))].slice(0, 28);
}

function matchScore(candidate: any, job: any) {
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
      ? `Matched: ${matched.slice(0,4).join(", ")}. ${missing.length ? `Missing: ${missing.join(", ")}.` : "No major gaps found."}`
      : `No strong keyword overlap. Missing: ${missing.join(", ")}.`,
  };
}

const STAGES = [
  { id: "sourced", title: "Sourced", hint: "Leads to review" },
  { id: "screen", title: "Screen", hint: "Intro calls" },
  { id: "interview", title: "Interview", hint: "Team loops" },
  { id: "offer", title: "Offer", hint: "Closing steps" },
  { id: "hired", title: "Hired", hint: "Accepted" },
];

function Modal({ title, onClose, children }: any) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AddRoleModal({ jobs, onAdd, onClose }: any) {
  const [form, setForm] = useState({ title: "", department: "", location: "", compensation: "", mustHaves: "", description: "", owner: "", priority: "Important" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onAdd({ id: "job-" + form.title.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(), companyId: COMPANY_ID, status: "Active", ...form });
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
          <label>Compensation<input value={form.compensation} onChange={e => set("compensation", e.target.value)} placeholder="e.g. $120k-$150k" /></label>
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

function AddCandidateModal({ jobs, onAdd, onClose }: any) {
  const [form, setForm] = useState({ name: "", email: "", role: "", jobId: jobs[0]?.id || "", source: "LinkedIn", nextStep: "", owner: "", followUpDate: "", priority: "Medium", cvText: "", notes: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd({ id: "candidate-" + form.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(), companyId: COMPANY_ID, stage: "sourced", risk: "Low", motivation: "", phone: "", ...form });
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
              {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.title}</option>)}
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
          <button type="button"
