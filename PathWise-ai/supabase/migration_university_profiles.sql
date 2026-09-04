-- ⚠️  SUPERSEDED — DO NOT RUN.
--
-- supabase/migration_ai_layer.sql now contains everything in this file, plus
-- the city/latitude/longitude seed for all 121 schools. This file was a
-- stopgap written before migration_ai_layer.sql existed, and is kept only as a
-- record of what was applied by hand on 2026-09-03. Maintaining the same DDL
-- in two places is how migrations drift — delete this file once you are
-- satisfied migration_ai_layer.sql is correct.

-- PathWise AI — AI layer, §2 data model: university_profiles
--
-- PROVENANCE: this DDL was applied by hand in the Supabase SQL editor on
-- 2026-09-03 to unblock the Agent A4 enrichment run. This file exists so the
-- schema is reproducible from the repo rather than living only in one project.
--
-- NOTE ON OWNERSHIP: supabase/migration_ai_layer.sql is owned by a separate
-- workstream (Batch 2a) and is deliberately NOT touched here. If that file
-- also creates university_profiles, both are idempotent and whichever runs
-- second is a no-op — there is no conflict, but do not maintain the table in
-- two places long term. Fold this into that migration when it lands.
--
-- Safe to run repeatedly.

create table if not exists public.university_profiles (
  school_name       text primary key references public.university_financials(school_name),
  facts             jsonb not null default '[]'::jsonb,
  climate           text check (climate in ('warm','cold','mild','wet')),
  setting           text check (setting in ('urban','suburban','rural')),
  student_body_size integer,
  greek_pct         numeric(4,3),
  notable_programs  text[],
  generated_at      timestamptz default now(),
  model_used        text
);

alter table public.university_profiles enable row level security;

-- create policy is not idempotent, so drop first. The client reads profiles
-- with the anon key and passes them into /api/fit-score, so public select is
-- required; there is deliberately no insert/update/delete policy — writes go
-- through scripts/enrich-schools.js with the service role key.
drop policy if exists "public read university_profiles" on public.university_profiles;
create policy "public read university_profiles"
  on public.university_profiles for select using (true);
