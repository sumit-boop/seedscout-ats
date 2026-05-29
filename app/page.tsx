"use client";

import { ArrowDownToLine, BriefcaseBusiness, Plus, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { demoCandidates, demoJobs } from "@/lib/demo-data";
import { calculateMatch } from "@/lib/matching";
import type { Candidate, Job, Stage } from "@/lib/types";

const stages: Array<{ id: Stage; title: string; hint: string }> = [
  { id: "sourced", title: "Sourced", hint: "Leads to review" },
  { id: "screen", title: "Screen", hint: "Intro calls" },
  { id: "interview", title: "Interview", hint: "Team loops" },
  { id: "offer", title: "Offer", hint: "Closing steps" },
  { id: "hired", title: "Hired", hint: "Accepted" }
];

export default function Home() {
  const [jobs] = useState<Job[]>(demoJobs);
  const [candidates, setCandidates] = useState<Candidate[]>(demoCandidates);
  const [query, setQuery] = useState("");
  const [jobFilter, setJobFilter] = useState("all");

  const visibleCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const job = jobs.find((item) => item.id === candidate.jobId);
      const text = [
        candidate.name,
        candidate.role,
        candidate.source,
        candidate.notes,
        candidate.cvText,
        job?.title
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!query || text.includes(query.toLowerCase())) &&
        (jobFilter === "all" || candidate.jobId === jobFilter)
      );
    });
  }, [candidates, jobFilter, jobs, query]);

  const activeCandidates = visibleCandidates.filter((candidate) => candidate.stage !== "hired");
  const highPriority = activeCandidates.filter((candidate) => candidate.priority === "High").length;
  const offers = activeCandidates.filter((candidate) => candidate.stage === "offer").length;
  const dueSoon = activeCandidates.filter((candidate) => {
    if (!candidate.followUpDate) return false;
    const days = daysUntil(candidate.followUpDate);
    return days >= 0 && days <= 3;
  }).length;

  function moveCandidate(candidateId: string, stage: Stage) {
    setCandidates((current) =>
      current.map((candidate) => (candidate.id === candidateId ? { ...candidate, stage } : candidate))
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">SeedScout ATS</p>
          <h1>Founder hiring command center</h1>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" type="button">
            <BriefcaseBusiness size={18} />
            Add role
          </button>
          <button className="ghost-button" type="button">
            <ArrowDownToLine size={18} />
            Export
          </button>
          <button className="primary-button" type="button">
            <Plus size={18} />
            Add candidate
          </button>
        </div>
      </header>

      <section className="toolbar" aria-label="Board controls">
        <label className="search-field">
          <Sparkles size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            placeholder="Search candidates, CVs, sources, notes"
          />
        </label>
        <label className="select-field">
          Job
          <select value={jobFilter} onChange={(event) => setJobFilter(event.target.value)}>
            <option value="all">All jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="metrics" aria-label="Hiring metrics">
        <Metric label="Active candidates" value={activeCandidates.length} />
        <Metric label="High priority" value={highPriority} />
        <Metric label="Due in 3 days" value={dueSoon} />
        <Metric label="Offers out" value={offers} />
      </section>

      <section className="jobs-section" aria-label="Open jobs">
        <SectionHeader
          eyebrow="Open roles"
          title="Hiring plan"
          summary={`${jobs.length} roles, ${jobs.filter((job) => job.priority === "Critical").length} critical.`}
        />
        <div className="jobs-grid">
          {jobs.map((job) => {
            const jobCandidates = candidates.filter((candidate) => candidate.jobId === job.id);
            const topMatch = jobCandidates
              .map((candidate) => ({ candidate, match: calculateMatch(candidate, job) }))
              .sort((a, b) => b.match.score - a.match.score)[0];
            return (
              <article className="job-card" key={job.id}>
                <header>
                  <div>
                    <h3>{job.title}</h3>
                    <p>
                      {job.department} · {job.location}
                    </p>
                  </div>
                  <span className={`job-status ${job.status.toLowerCase()}`}>{job.status}</span>
                </header>
                <div className="job-meta">
                  <div>
                    <span>Pipeline</span>
                    <strong>{jobCandidates.length} candidates</strong>
                  </div>
                  <div>
                    <span>Owner</span>
                    <strong>{job.owner}</strong>
                  </div>
                </div>
                <p>{job.mustHaves}</p>
                <p>{topMatch ? `Top match: ${topMatch.candidate.name} (${topMatch.match.score}%)` : "No matches yet."}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="command-center" aria-label="Founder hiring command center">
        <SectionHeader
          eyebrow="Founder brief"
          title="This week in hiring"
          summary={`${activeCandidates.length} active candidates, ${highPriority} high priority, ${dueSoon} due soon.`}
        />
        <div className="command-grid">
          <article className="command-panel">
            <header>
              <h3>Next best actions</h3>
              <span>Do first</span>
            </header>
            <div className="action-list">
              {activeCandidates.slice(0, 4).map((candidate, index) => (
                <div className="action-item" key={candidate.id}>
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
              <h3>Algorithmic matching</h3>
              <span>Explainable</span>
            </header>
            <div className="action-list">
              {visibleCandidates.slice(0, 4).map((candidate) => {
                const job = jobs.find((item) => item.id === candidate.jobId);
                const match = calculateMatch(candidate, job);
                return (
                  <div className="action-item" key={candidate.id}>
                    <span className="action-rank">{match.score}</span>
                    <div>
                      <strong>{candidate.name}</strong>
                      <p>{match.reason}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
          <article className="command-panel">
            <header>
              <h3>Closing watch</h3>
              <span>Offers</span>
            </header>
            <div className="action-list">
              {activeCandidates
                .filter((candidate) => candidate.stage === "offer" || candidate.risk !== "Low")
                .slice(0, 4)
                .map((candidate) => (
                  <div className="closing-item" key={candidate.id}>
                    <strong>{candidate.name}</strong>
                    <p>{candidate.motivation || "Keep the close plan current."}</p>
                    <span className={`risk ${candidate.risk.toLowerCase()}`}>{candidate.risk} risk</span>
                  </div>
                ))}
            </div>
          </article>
        </div>
      </section>

      <section className="board" aria-label="Candidate pipeline">
        {stages.map((stage) => (
          <article className="column" key={stage.id}>
            <header className="column-header">
              <div>
                <h2>{stage.title}</h2>
                <p>{stage.hint}</p>
              </div>
              <span className="count">
                {visibleCandidates.filter((candidate) => candidate.stage === stage.id).length}
              </span>
            </header>
            <div className="dropzone">
              {visibleCandidates
                .filter((candidate) => candidate.stage === stage.id)
                .map((candidate) => {
                  const job = jobs.find((item) => item.id === candidate.jobId);
                  const match = calculateMatch(candidate, job);
                  return (
                    <article className="candidate-card" key={candidate.id}>
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
                          <dd>{candidate.nextStep}</dd>
                        </div>
                        <div>
                          <dt>Due</dt>
                          <dd>{formatDate(candidate.followUpDate)}</dd>
                        </div>
                        <div>
                          <dt>Owner</dt>
                          <dd>{candidate.owner}</dd>
                        </div>
                      </dl>
                      <div className="match-summary">
                        <strong>
                          {match.score}% match{job ? ` · ${job.title}` : ""}
                        </strong>
                        <span>{match.reason}</span>
                      </div>
                      <footer>
                        <span className="source">{candidate.source}</span>
                        <select
                          value={candidate.stage}
                          onChange={(event) => moveCandidate(candidate.id, event.target.value as Stage)}
                        >
                          {stages.map((nextStage) => (
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
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function SectionHeader({
  eyebrow,
  title,
  summary
}: {
  eyebrow: string;
  title: string;
  summary: string;
}) {
  return (
    <header className="section-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <p>{summary}</p>
    </header>
  );
}

function daysUntil(value: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${value}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function formatDate(value: string) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
    new Date(`${value}T00:00:00`)
  );
}
