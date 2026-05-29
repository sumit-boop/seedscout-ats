import type { Candidate, Job, MatchResult } from "./types";

const stopWords = new Set([
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

export function calculateMatch(candidate: Candidate, job?: Job): MatchResult {
  if (!job) {
    return {
      score: 0,
      reason: "Link this candidate to a job to calculate a match score.",
      matched: [],
      missing: []
    };
  }

  const requirementText = [job.title, job.department, job.mustHaves, job.description]
    .filter(Boolean)
    .join(" ");
  const candidateText = [
    candidate.role,
    candidate.cvText,
    candidate.notes,
    candidate.motivation,
    candidate.source
  ]
    .filter(Boolean)
    .join(" ");

  const requirements = extractKeywords(requirementText);
  const candidateKeywords = new Set(extractKeywords(candidateText));

  if (requirements.length === 0 || candidateKeywords.size === 0) {
    return {
      score: 0,
      reason: "Add a job description and CV text to calculate a stronger match.",
      matched: [],
      missing: requirements.slice(0, 4)
    };
  }

  const matched = requirements.filter((word) => candidateKeywords.has(word));
  const missing = requirements.filter((word) => !candidateKeywords.has(word)).slice(0, 4);
  const ratio = matched.length / requirements.length;
  const score = matched.length ? Math.min(98, Math.round(35 + ratio * 63)) : 0;

  return {
    score,
    matched,
    missing,
    reason:
      matched.length > 0
        ? `Matched: ${matched.slice(0, 4).join(", ")}. ${
            missing.length ? `Missing: ${missing.join(", ")}.` : "No major gaps found."
          }`
        : `No strong keyword overlap yet. Missing: ${missing.join(", ")}.`
  };
}

function extractKeywords(text: string): string[] {
  return [
    ...new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 2 && !stopWords.has(word))
    )
  ].slice(0, 28);
}
