import type { Candidate, Job } from "./types";

const companyId = "demo-company";

export const demoJobs: Job[] = [
  {
    id: "job-product-designer",
    companyId,
    title: "Product Designer",
    department: "Product",
    priority: "Critical",
    status: "Active",
    owner: "Sam",
    targetDate: "2026-07-10",
    location: "Remote",
    compensation: "$120k-$150k",
    mustHaves: "B2B product design, systems thinking, portfolio with shipped work.",
    description:
      "Own product design for a founder-led B2B platform. Partner with engineering on workflows, design systems, user research, and polished product experiences.",
    sellingPoints: "Own the design system and shape the founder-led product direction."
  },
  {
    id: "job-frontend-engineer",
    companyId,
    title: "Frontend Engineer",
    department: "Engineering",
    priority: "Important",
    status: "Active",
    owner: "Priya",
    targetDate: "2026-07-25",
    location: "Hybrid",
    compensation: "$140k-$175k",
    mustHaves: "React, accessibility, product sense, design system experience.",
    description:
      "Build fast, accessible frontend experiences in React. Collaborate closely with design and founders on product surfaces, dashboards, and reusable UI systems.",
    sellingPoints: "High ownership, modern stack, direct collaboration with design."
  }
];

export const demoCandidates: Candidate[] = [
  {
    id: "candidate-maya",
    companyId,
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
    cvText:
      "Product designer with B2B marketplace experience, shipped design systems, portfolio case studies, user research, and close collaboration with engineering.",
    notes: "Strong marketplace experience and polished systems thinking."
  },
  {
    id: "candidate-jordan",
    companyId,
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
    cvText:
      "Frontend engineer focused on React, accessibility, component libraries, dashboards, TypeScript, and design system implementation.",
    notes: "React, accessibility, and design system background."
  }
];
