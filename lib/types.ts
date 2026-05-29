export type Stage = "sourced" | "screen" | "interview" | "offer" | "hired";
export type Priority = "High" | "Medium" | "Low";
export type Risk = "High" | "Medium" | "Low";
export type JobPriority = "Critical" | "Important" | "Later";
export type JobStatus = "Active" | "Planning" | "Paused" | "Filled";

export type Job = {
  id: string;
  companyId: string;
  title: string;
  department: string;
  priority: JobPriority;
  status: JobStatus;
  owner: string;
  targetDate: string;
  location: string;
  compensation: string;
  mustHaves: string;
  description: string;
  sellingPoints: string;
};

export type Candidate = {
  id: string;
  companyId: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  stage: Stage;
  priority: Priority;
  source: string;
  nextStep: string;
  owner: string;
  followUpDate: string;
  risk: Risk;
  motivation: string;
  cvText: string;
  notes: string;
};

export type MatchResult = {
  score: number;
  reason: string;
  matched: string[];
  missing: string[];
};
