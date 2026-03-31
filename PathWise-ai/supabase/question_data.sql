-- ============================================================
-- PathWise AI — Question_Data Table Migration
-- Logs every student's full survey inputs (Q1–Q9) plus the
-- computed NPV result snapshot for analytics and result recovery.
-- Run this file in the Supabase SQL Editor after schema.sql.
-- ============================================================

-- Enable UUID extension (safe if already enabled)
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------
-- question_data
-- One row per completed survey. Captures all Q1–Q9 inputs and
-- the full comparison result so results can be restored on reload.
-- ----------------------------------------------------------------
create table if not exists public.question_data (
  id               uuid primary key default uuid_generate_v4(),

  -- Session identity (bound to Supabase anonymous JWT sub)
  session_token    text not null check (char_length(session_token) between 10 and 128),

  -- Q1: Schools selected (1–4)
  q1_schools       text[] not null check (cardinality(q1_schools) between 1 and 4),

  -- Q2: Major
  q2_major         text not null check (char_length(q2_major) <= 100),

  -- Q3: Residency / state selection and derived in-state flag
  q3_residency     text check (char_length(q3_residency) <= 100),
  q3_is_in_state   boolean default false,

  -- Q4: Household income bracket
  q4_income_label  text check (char_length(q4_income_label) <= 50),
  q4_income_value  integer,

  -- Q5: Goals (one or more)
  q5_goals         text[],

  -- Q6: Alumni network data per school  { "MIT": "20-50", "Stanford": "50+" }
  q6_alumni_data   jsonb,

  -- Q7: Financial aid offers per school  { "MIT": 45000, "Harvard": null } null = no offer entered = $0 aid (no estimation)
  q7_financial_aid jsonb,

  -- Q8: Student personal ratings per school  { "MIT": 9, "Harvard": 7 }
  q8_student_ratings jsonb,

  -- Q9: Lifestyle preferences
  q9_work_hours    text check (char_length(q9_work_hours) <= 20),
  q9_interests     text check (char_length(q9_interests) <= 2000),
  q9_greek_life    text check (char_length(q9_greek_life) <= 20),
  q9_weather_pref  text check (char_length(q9_weather_pref) <= 20),

  -- Full NPV comparison result (includes trajectory arrays for chart recovery)
  result_snapshot  jsonb,

  created_at       timestamptz default now()
);

-- Index to look up a user's latest session quickly
create index if not exists idx_question_data_session_token
  on public.question_data (session_token, created_at desc);

-- ----------------------------------------------------------------
-- RLS Policies
-- ----------------------------------------------------------------
alter table public.question_data enable row level security;

-- Insert: caller must own the session token (tied to JWT sub)
drop policy if exists "Insert own question_data" on public.question_data;
create policy "Insert own question_data"
  on public.question_data for insert
  with check (session_token = (auth.jwt() ->> 'sub'));

-- Select: caller can only read their own rows
drop policy if exists "Read own question_data" on public.question_data;
create policy "Read own question_data"
  on public.question_data for select
  using (session_token = (auth.jwt() ->> 'sub'));
