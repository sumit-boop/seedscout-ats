# Hiring Command Center Production Starter

Hiring Command Center is a founder-focused ATS for early teams. This production starter is designed for:

- Vercel hosting
- Supabase Auth
- Supabase Postgres
- Supabase Storage for resumes
- OpenAI for AI candidate matching
- Stripe billing later

## Local Setup

1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add your Supabase project URL and publishable key.
5. Add your OpenAI API key as `OPENAI_API_KEY` if you want AI scoring.
6. Run the SQL in `supabase/schema_easy_setup.sql` inside Supabase SQL Editor.
7. Run `npm run dev`.
8. Open `http://localhost:3000`.

## Supabase Keys You Need

In Supabase, open your project and go to Project Settings -> Data API.

Copy these two values only:

- Project URL
- publishable key

Do not share or paste the service_role key into the frontend app.

Your `.env.local` file should look like this:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
OPENAI_API_KEY=your-openai-api-key
```

## What This Starter Includes

- Founder dashboard
- Open roles
- Candidate pipeline
- CV-to-job matching score
- Explainable match reasons
- Supabase-ready data model
- Row-level security policies
- Vercel-ready project structure

## Production Launch Checklist

- Create Supabase project
- Run database schema
- Enable Supabase Auth
- Add resume storage bucket
- Deploy to Vercel
- Add custom domain
- Add Stripe billing
- Add privacy policy and terms
