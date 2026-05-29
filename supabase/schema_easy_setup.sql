-- Hiring Command Center easy setup
-- Paste this whole file into Supabase SQL Editor and click Run.
-- If you already tried once, this script resets the SeedScout tables first.

create extension if not exists "uuid-ossp";

drop table if exists public.interviews cascade;
drop table if exists public.candidate_notes cascade;
drop table if exists public.candidates cascade;
drop table if exists public.jobs cascade;
drop table if exists public.company_members cascade;
drop table if exists public.companies cascade;

create table public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.company_members (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'recruiter', 'hiring_manager', 'viewer')),
  created_at timestamptz not null default now(),
  unique(company_id, user_id)
);

create table public.jobs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  department text default '',
  priority text not null default 'Important' check (priority in ('Critical', 'Important', 'Later')),
  status text not null default 'Active' check (status in ('Active', 'Planning', 'Paused', 'Filled')),
  owner text default '',
  target_date date,
  location text default '',
  compensation text default '',
  must_haves text default '',
  description text default '',
  selling_points text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.candidates (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  name text not null,
  email text default '',
  phone text default '',
  role text default '',
  stage text not null default 'sourced' check (stage in ('sourced', 'screen', 'interview', 'offer', 'hired')),
  priority text not null default 'Medium' check (priority in ('High', 'Medium', 'Low')),
  source text default '',
  next_step text default '',
  owner text default '',
  follow_up_date date,
  close_risk text not null default 'Medium' check (close_risk in ('High', 'Medium', 'Low')),
  motivation text default '',
  cv_text text default '',
  notes text default '',
  resume_path text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.candidate_notes (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.interviews (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  title text not null,
  interview_at timestamptz,
  interviewers text default '',
  scorecard text default '',
  created_at timestamptz not null default now()
);

alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.jobs enable row level security;
alter table public.candidates enable row level security;
alter table public.candidate_notes enable row level security;
alter table public.interviews enable row level security;

create policy "members_read_companies"
on public.companies for select
using (
  exists (
    select 1 from public.company_members cm
    where cm.company_id = companies.id
    and cm.user_id = auth.uid()
  )
);

create policy "members_read_members"
on public.company_members for select
using (
  exists (
    select 1 from public.company_members cm
    where cm.company_id = company_members.company_id
    and cm.user_id = auth.uid()
  )
);

create policy "members_manage_jobs"
on public.jobs for all
using (
  exists (
    select 1 from public.company_members cm
    where cm.company_id = jobs.company_id
    and cm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.company_members cm
    where cm.company_id = jobs.company_id
    and cm.user_id = auth.uid()
  )
);

create policy "members_manage_candidates"
on public.candidates for all
using (
  exists (
    select 1 from public.company_members cm
    where cm.company_id = candidates.company_id
    and cm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.company_members cm
    where cm.company_id = candidates.company_id
    and cm.user_id = auth.uid()
  )
);

create policy "members_manage_notes"
on public.candidate_notes for all
using (
  exists (
    select 1 from public.company_members cm
    where cm.company_id = candidate_notes.company_id
    and cm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.company_members cm
    where cm.company_id = candidate_notes.company_id
    and cm.user_id = auth.uid()
  )
);

create policy "members_manage_interviews"
on public.interviews for all
using (
  exists (
    select 1 from public.company_members cm
    where cm.company_id = interviews.company_id
    and cm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.company_members cm
    where cm.company_id = interviews.company_id
    and cm.user_id = auth.uid()
  )
);

-- Success check. Supabase should show one row with the text below.
select 'SeedScout database setup complete' as status;
