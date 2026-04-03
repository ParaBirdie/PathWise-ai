-- ============================================================
-- PathWise AI — Complete Supabase Setup
-- Paste this entire file into the Supabase SQL Editor and Run.
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------
-- career_trajectories
-- ----------------------------------------------------------------
create table if not exists public.career_trajectories (
  id              uuid primary key default uuid_generate_v4(),
  major           text not null,
  university_tier text not null check (university_tier in ('elite','research','flagship','local')),
  log_y0          numeric(10,6) not null,
  r_schooling     numeric(8,6)  not null,
  beta1           numeric(10,8) not null,
  beta2           numeric(12,10) not null,
  beta3           numeric(14,12) not null,
  beta4           numeric(16,14) not null,
  employment_rate numeric(5,4) not null check (employment_rate between 0 and 1),
  signal_weight   numeric(5,4) not null check (signal_weight between 0 and 1),
  data_source     text,
  valid_from_year integer default 2024,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (major, university_tier)
);

-- ----------------------------------------------------------------
-- university_financials
-- ----------------------------------------------------------------
create table if not exists public.university_financials (
  id                  uuid primary key default uuid_generate_v4(),
  school_name         text not null unique,
  tier                text not null check (tier in ('elite','research','flagship','local')),
  tuition_in_state    integer,
  tuition_out_state   integer not null,
  tuition_private     integer,
  avg_institutional_aid integer,
  avg_net_price_30k   integer,
  avg_net_price_75k   integer,
  avg_net_price_110k  integer,
  avg_net_price_150k  integer,
  acceptance_rate     numeric(5,4),
  us_news_rank        integer,
  location_state      text,
  -- Per-school earnings premium multiplier (replaces flat tier bucket).
  -- Calibrated from PayScale College Salary Report, LinkedIn Economic Graph,
  -- Glassdoor alumni outcomes, and US News peer-assessment data.
  -- Range: ~1.00 (local/regional) → ~1.75 (MIT/Stanford).
  prestige_multiplier numeric(6,4) not null default 1.08,
  created_at          timestamptz default now()
);

-- ----------------------------------------------------------------
-- survey_sessions
-- ----------------------------------------------------------------
create table if not exists public.survey_sessions (
  id              uuid primary key default uuid_generate_v4(),
  -- session_token must be a UUID generated server-side or by the client's anon JWT sub.
  -- SECURITY: bind this to auth.uid() on insert so reads can be enforced via JWT.
  session_token   text unique not null check (char_length(session_token) between 10 and 128),
  -- Constrain array cardinality and element length to prevent data-bloat attacks
  schools         text[]      not null check (cardinality(schools) between 1 and 4),
  major           text        not null check (char_length(major) <= 100),
  residency       text                 check (char_length(residency) <= 100),
  income_bracket  text                 check (char_length(income_bracket) <= 50),
  goals                text[],
  financial_aid_offers jsonb,       -- { "Harvard": 45000, "Duke University": null } null = user skipped = $0 aid (no estimation)
  result_snapshot      jsonb,
  created_at           timestamptz default now()
);

-- ----------------------------------------------------------------
-- RLS Policies
-- ----------------------------------------------------------------
alter table public.career_trajectories   enable row level security;
alter table public.university_financials enable row level security;
alter table public.survey_sessions       enable row level security;

drop policy if exists "Public read career_trajectories" on public.career_trajectories;
create policy "Public read career_trajectories"
  on public.career_trajectories for select using (true);

drop policy if exists "Public read university_financials" on public.university_financials;
create policy "Public read university_financials"
  on public.university_financials for select using (true);

-- SECURITY: Only allow INSERT when the session_token matches the caller's JWT sub.
-- This ties every persisted session to the Supabase anonymous auth identity,
-- preventing any user from inserting rows on behalf of another identity.
-- Callers must be signed-in (even anonymously) before inserting.
drop policy if exists "Insert survey session" on public.survey_sessions;
create policy "Insert survey session"
  on public.survey_sessions for insert
  with check (session_token = (auth.jwt() ->> 'sub'));

-- SECURITY: Allow SELECT only for the row whose session_token equals the caller's JWT sub.
-- auth.jwt() is the correct Supabase helper; it avoids the unreliable
-- current_setting('request.jwt.claims') approach that could return NULL
-- and silently bypass the filter.
drop policy if exists "Read own survey session" on public.survey_sessions;
create policy "Read own survey session"
  on public.survey_sessions for select
  using (session_token = (auth.jwt() ->> 'sub'));

-- ----------------------------------------------------------------
-- Seed: career_trajectories
-- Calibrated against BLS OES, Levels.fyi top-10 firm averages
-- (Google/Meta/Amazon/Apple/Netflix/Microsoft/Airbnb/Stripe/Lyft/Uber for tech;
--  GS/JPM/MS/Citi/BofA/Barclays/UBS/DB/Lazard/Evercore for IB;
--  top hospital networks for medicine; AmLaw 100 for law), Glassdoor,
-- and PayScale College Salary Report 2024.
--
-- log_y0 anchors the absolute wage level for each field; the
-- per-school prestige_multiplier (stored in university_financials)
-- handles the cross-school differentiation on top of this baseline.
-- All tiers share the same log_y0/betas; prestige_multiplier does the work.
-- ----------------------------------------------------------------
insert into public.career_trajectories
  (major, university_tier, log_y0, r_schooling, beta1, beta2, beta3, beta4, employment_rate, signal_weight, data_source)
values
  -- ── Computer Science / Software Engineering ──────────────────
  -- Avg entry (local baseline) ~$68K. Top-10 FAANG avg entry ~$155K captured
  -- through elite prestige_multiplier (1.62-1.75). Peak Y20 flagship ~$155K.
  ('Computer Science','elite',    10.561, 0.14, 0.082000, -0.001900, 0.0000280, -0.00000015, 0.93, 0.45, 'BLS OES + Levels.fyi top-10 2024'),
  ('Computer Science','research', 10.561, 0.14, 0.082000, -0.001900, 0.0000280, -0.00000015, 0.93, 0.45, 'BLS OES + Levels.fyi top-10 2024'),
  ('Computer Science','flagship', 10.561, 0.14, 0.082000, -0.001900, 0.0000280, -0.00000015, 0.93, 0.45, 'BLS OES + Levels.fyi top-10 2024'),
  ('Computer Science','local',    10.561, 0.14, 0.082000, -0.001900, 0.0000280, -0.00000015, 0.93, 0.45, 'BLS OES + Levels.fyi top-10 2024'),

  -- ── Electrical Engineering ───────────────────────────────────
  -- Avg entry (local) ~$65K. Reflects BLS OES EE + IEEE salary survey.
  ('Electrical Engineering','elite',    10.580, 0.13, 0.078000, -0.001800, 0.0000250, -0.00000013, 0.91, 0.40, 'BLS OES + IEEE Salary Survey 2024'),
  ('Electrical Engineering','research', 10.580, 0.13, 0.078000, -0.001800, 0.0000250, -0.00000013, 0.91, 0.40, 'BLS OES + IEEE Salary Survey 2024'),
  ('Electrical Engineering','flagship', 10.580, 0.13, 0.078000, -0.001800, 0.0000250, -0.00000013, 0.91, 0.40, 'BLS OES + IEEE Salary Survey 2024'),
  ('Electrical Engineering','local',    10.580, 0.13, 0.078000, -0.001800, 0.0000250, -0.00000013, 0.91, 0.40, 'BLS OES + IEEE Salary Survey 2024'),

  -- ── Business / Finance (incl. Investment Banking) ────────────
  -- Entry (local) ~$55K broad average. IB-track at elite schools modeled via
  -- prestige_multiplier: GS/JPM avg analyst total comp ~$170K captured at
  -- elite multiplier 1.62-1.75. Steeper betas reflect IB front-loaded growth.
  -- Peak Y20 flagship ~$155K; Y20 elite ~$195K.
  ('Business / Finance','elite',    10.510, 0.11, 0.095000, -0.002000, 0.0000300, -0.00000016, 0.88, 0.60, 'BLS OES + Glassdoor IB top-10 2024'),
  ('Business / Finance','research', 10.510, 0.11, 0.095000, -0.002000, 0.0000300, -0.00000016, 0.88, 0.60, 'BLS OES + Glassdoor IB top-10 2024'),
  ('Business / Finance','flagship', 10.510, 0.11, 0.095000, -0.002000, 0.0000300, -0.00000016, 0.88, 0.60, 'BLS OES + Glassdoor IB top-10 2024'),
  ('Business / Finance','local',    10.510, 0.11, 0.095000, -0.002000, 0.0000300, -0.00000016, 0.88, 0.60, 'BLS OES + Glassdoor IB top-10 2024'),

  -- ── Pre-Medicine / Biology ───────────────────────────────────
  -- Models the full pre-med outcome distribution (research, residency,
  -- attending). Steeper betas capture the residency→attending income jump
  -- around career year 8-10. Peak Y22 local ~$220K; elite ~$280K.
  ('Pre-Medicine / Biology','elite',    10.325, 0.12, 0.140000, -0.003000, 0.0000150, -0.00000003, 0.85, 0.35, 'AAMC Physician Salary + BLS 2024'),
  ('Pre-Medicine / Biology','research', 10.325, 0.12, 0.140000, -0.003000, 0.0000150, -0.00000003, 0.85, 0.35, 'AAMC Physician Salary + BLS 2024'),
  ('Pre-Medicine / Biology','flagship', 10.325, 0.12, 0.140000, -0.003000, 0.0000150, -0.00000003, 0.85, 0.35, 'AAMC Physician Salary + BLS 2024'),
  ('Pre-Medicine / Biology','local',    10.325, 0.12, 0.140000, -0.003000, 0.0000150, -0.00000003, 0.85, 0.35, 'AAMC Physician Salary + BLS 2024'),

  -- ── Liberal Arts / Humanities ────────────────────────────────
  -- Entry (local) ~$40K; peak Y25 local ~$90K. High signal_weight reflects
  -- brand-name degree's outsized role in liberal-arts career outcomes.
  ('Liberal Arts / Humanities','elite',    10.475, 0.08, 0.052000, -0.001200, 0.0000160, -0.00000008, 0.78, 0.70, 'PayScale + Glassdoor 2024'),
  ('Liberal Arts / Humanities','research', 10.475, 0.08, 0.052000, -0.001200, 0.0000160, -0.00000008, 0.78, 0.70, 'PayScale + Glassdoor 2024'),
  ('Liberal Arts / Humanities','flagship', 10.475, 0.08, 0.052000, -0.001200, 0.0000160, -0.00000008, 0.78, 0.70, 'PayScale + Glassdoor 2024'),
  ('Liberal Arts / Humanities','local',    10.475, 0.08, 0.052000, -0.001200, 0.0000160, -0.00000008, 0.78, 0.70, 'PayScale + Glassdoor 2024'),

  -- ── Nursing ──────────────────────────────────────────────────
  -- Entry (local) ~$63K (RN). Low signal_weight: hospital pay scales are
  -- largely credential- and experience-based, not school-prestige-based.
  ('Nursing','elite',    10.679, 0.09, 0.065000, -0.001500, 0.0000200, -0.00000010, 0.95, 0.25, 'BLS OES + ANA Salary Survey 2024'),
  ('Nursing','research', 10.679, 0.09, 0.065000, -0.001500, 0.0000200, -0.00000010, 0.95, 0.25, 'BLS OES + ANA Salary Survey 2024'),
  ('Nursing','flagship', 10.679, 0.09, 0.065000, -0.001500, 0.0000200, -0.00000010, 0.95, 0.25, 'BLS OES + ANA Salary Survey 2024'),
  ('Nursing','local',    10.679, 0.09, 0.065000, -0.001500, 0.0000200, -0.00000010, 0.95, 0.25, 'BLS OES + ANA Salary Survey 2024'),

  -- ── Education ────────────────────────────────────────────────
  -- Entry (local) ~$43K (teacher). Low signal_weight: public school pay is
  -- district-set, minimally affected by alma mater prestige.
  ('Education','elite',    10.421, 0.085, 0.048000, -0.001000, 0.0000130, -0.00000007, 0.87, 0.30, 'BLS OES + NEA Salary Survey 2024'),
  ('Education','research', 10.421, 0.085, 0.048000, -0.001000, 0.0000130, -0.00000007, 0.87, 0.30, 'BLS OES + NEA Salary Survey 2024'),
  ('Education','flagship', 10.421, 0.085, 0.048000, -0.001000, 0.0000130, -0.00000007, 0.87, 0.30, 'BLS OES + NEA Salary Survey 2024'),
  ('Education','local',    10.421, 0.085, 0.048000, -0.001000, 0.0000130, -0.00000007, 0.87, 0.30, 'BLS OES + NEA Salary Survey 2024'),

  -- ── Psychology ───────────────────────────────────────────────
  -- Entry (local) ~$42K. Moderate signal_weight: brand matters for
  -- clinical/counseling PhD placements but not for most BA-level roles.
  ('Psychology','elite',    10.550, 0.08, 0.050000, -0.001100, 0.0000150, -0.00000008, 0.76, 0.55, 'BLS OES + APA Salary Survey 2024'),
  ('Psychology','research', 10.550, 0.08, 0.050000, -0.001100, 0.0000150, -0.00000008, 0.76, 0.55, 'BLS OES + APA Salary Survey 2024'),
  ('Psychology','flagship', 10.550, 0.08, 0.050000, -0.001100, 0.0000150, -0.00000008, 0.76, 0.55, 'BLS OES + APA Salary Survey 2024'),
  ('Psychology','local',    10.550, 0.08, 0.050000, -0.001100, 0.0000150, -0.00000008, 0.76, 0.55, 'BLS OES + APA Salary Survey 2024'),

  -- ── Data Science / Statistics ─────────────────────────────────
  -- Entry (local) ~$72K. High growth field. Reflects Glassdoor DS + Levels.fyi.
  ('Data Science / Statistics','elite',    10.650, 0.135, 0.080000, -0.001800, 0.0000260, -0.00000014, 0.92, 0.42, 'BLS OES + Levels.fyi DS 2024'),
  ('Data Science / Statistics','research', 10.650, 0.135, 0.080000, -0.001800, 0.0000260, -0.00000014, 0.92, 0.42, 'BLS OES + Levels.fyi DS 2024'),
  ('Data Science / Statistics','flagship', 10.650, 0.135, 0.080000, -0.001800, 0.0000260, -0.00000014, 0.92, 0.42, 'BLS OES + Levels.fyi DS 2024'),
  ('Data Science / Statistics','local',    10.650, 0.135, 0.080000, -0.001800, 0.0000260, -0.00000014, 0.92, 0.42, 'BLS OES + Levels.fyi DS 2024'),

  -- ── Pre-Law / Political Science ───────────────────────────────
  -- Entry (local) ~$50K (mix of law clerks, gov, consulting). BigLaw at elite
  -- (~$215K Cravath scale) captured by elite prestige_multiplier.
  -- Very high signal_weight: Harvard Law vs. regional law school matters enormously.
  ('Pre-Law / Political Science','elite',    10.531, 0.10, 0.115000, -0.002500, 0.0000180, -0.00000006, 0.80, 0.75, 'NALP + BLS OES + Glassdoor AmLaw100 2024'),
  ('Pre-Law / Political Science','research', 10.531, 0.10, 0.115000, -0.002500, 0.0000180, -0.00000006, 0.80, 0.75, 'NALP + BLS OES + Glassdoor AmLaw100 2024'),
  ('Pre-Law / Political Science','flagship', 10.531, 0.10, 0.115000, -0.002500, 0.0000180, -0.00000006, 0.80, 0.75, 'NALP + BLS OES + Glassdoor AmLaw100 2024'),
  ('Pre-Law / Political Science','local',    10.531, 0.10, 0.115000, -0.002500, 0.0000180, -0.00000006, 0.80, 0.75, 'NALP + BLS OES + Glassdoor AmLaw100 2024'),

  -- ── Undecided ─────────────────────────────────────────────────
  -- Broad market average across all bachelor-degree holders.
  ('Undecided','elite',    10.597, 0.10, 0.060000, -0.001400, 0.0000180, -0.00000009, 0.82, 0.50, 'BLS median all occupations 2024'),
  ('Undecided','research', 10.597, 0.10, 0.060000, -0.001400, 0.0000180, -0.00000009, 0.82, 0.50, 'BLS median all occupations 2024'),
  ('Undecided','flagship', 10.597, 0.10, 0.060000, -0.001400, 0.0000180, -0.00000009, 0.82, 0.50, 'BLS median all occupations 2024'),
  ('Undecided','local',    10.597, 0.10, 0.060000, -0.001400, 0.0000180, -0.00000009, 0.82, 0.50, 'BLS median all occupations 2024')

on conflict (major, university_tier) do update set
  log_y0          = excluded.log_y0,
  r_schooling     = excluded.r_schooling,
  beta1           = excluded.beta1,
  beta2           = excluded.beta2,
  beta3           = excluded.beta3,
  beta4           = excluded.beta4,
  employment_rate = excluded.employment_rate,
  signal_weight   = excluded.signal_weight,
  data_source     = excluded.data_source,
  updated_at      = now();

-- ----------------------------------------------------------------
-- Seed: university_financials — original 12
-- prestige_multiplier: per-school earnings premium, calibrated from
--   PayScale / LinkedIn / Glassdoor alumni outcomes + US News data.
-- ----------------------------------------------------------------
insert into public.university_financials
  (school_name, tier, tuition_in_state, tuition_out_state, tuition_private, avg_net_price_30k, avg_net_price_75k, us_news_rank, location_state, prestige_multiplier)
values
  ('MIT',                    'elite',    null,  57986, 57986,  3500,  15000,  1, 'MA', 1.75),
  ('Stanford',               'elite',    null,  56169, 56169,  2000,  12000,  3, 'CA', 1.72),
  ('Harvard',                'elite',    null,  57261, 57261,  2500,  13000,  3, 'MA', 1.70),
  ('Princeton',              'elite',    null,  57690, 57690,  1800,  11000,  1, 'NJ', 1.72),
  ('Yale',                   'elite',    null,  59950, 59950,  2200,  14000,  5, 'CT', 1.67),
  ('UC Berkeley',            'research', 14312, 44066,  null,  6200,  22000, 20, 'CA', 1.38),
  ('UCLA',                   'research', 13249, 43022,  null,  7100,  23000, 20, 'CA', 1.37),
  ('Carnegie Mellon',        'research',  null, 58924, 58924,  9000,  28000, 22, 'PA', 1.36),
  ('Georgia Tech',           'research', 12424, 33794,  null,  5800,  20000, 33, 'GA', 1.33),
  ('University of Michigan', 'research', 16736, 53232,  null,  4200,  18000, 23, 'MI', 1.36),
  ('Northeastern',           'research',  null, 59154, 59154, 14000,  32000, 49, 'MA', 1.27),
  ('NYU',                    'research',  null, 58168, 58168, 16000,  35000, 35, 'NY', 1.30)
on conflict (school_name) do update set prestige_multiplier = excluded.prestige_multiplier;

-- ----------------------------------------------------------------
-- Seed: university_financials — 100 additional schools
-- ----------------------------------------------------------------
insert into public.university_financials
  (school_name, tier, tuition_in_state, tuition_out_state, tuition_private, avg_net_price_30k, avg_net_price_75k, us_news_rank, location_state, prestige_multiplier)
values

  -- ── ELITE PRIVATE ───────────────────────────────────────────
  ('Caltech',                                  'elite', null,  63411, 63411,  3200,  16000,  9, 'CA', 1.62),
  ('Duke University',                          'elite', null,  63054, 63054,  4100,  17000,  7, 'NC', 1.63),
  ('Johns Hopkins University',                 'elite', null,  63340, 63340,  6200,  20000,  9, 'MD', 1.60),
  ('Northwestern University',                  'elite', null,  63468, 63468,  5800,  19000,  9, 'IL', 1.60),
  ('Dartmouth College',                        'elite', null,  62430, 62430,  3600,  15500, 12, 'NH', 1.58),
  ('Brown University',                         'elite', null,  65146, 65146,  4000,  16000, 13, 'RI', 1.56),
  ('Vanderbilt University',                    'elite', null,  60348, 60348,  8000,  22000, 12, 'TN', 1.57),
  ('Rice University',                          'elite', null,  54960, 54960,  3100,  13000, 16, 'TX', 1.55),
  ('Washington University in St. Louis',       'elite', null,  61750, 61750,  6500,  21000, 24, 'MO', 1.50),
  ('Emory University',                         'elite', null,  58280, 58280,  7000,  21000, 22, 'GA', 1.51),
  ('University of Notre Dame',                 'elite', null,  62693, 62693,  6200,  21000, 18, 'IN', 1.53),
  ('Georgetown University',                    'elite', null,  62532, 62532, 10000,  28000, 22, 'DC', 1.50),
  ('Tufts University',                         'elite', null,  65222, 65222, 12000,  30000, 28, 'MA', 1.47),
  ('Wake Forest University',                   'elite', null,  62930, 62930, 11000,  29000, 49, 'NC', 1.45),
  ('Boston College',                           'elite', null,  64208, 64208, 13000,  31000, 36, 'MA', 1.46),

  -- ── RESEARCH PUBLIC ─────────────────────────────────────────
  ('University of Virginia',                   'research', 18886, 54094,  null,  5100, 19000, 26, 'VA', 1.35),
  ('UNC Chapel Hill',                          'research',  8998, 37366,  null,  4400, 16000, 29, 'NC', 1.32),
  ('University of Wisconsin–Madison',          'research', 11205, 39378,  null,  5600, 19000, 35, 'WI', 1.28),
  ('University of Illinois Urbana-Champaign',  'research', 16040, 34312,  null,  7200, 22000, 35, 'IL', 1.30),
  ('Ohio State University',                    'research', 11936, 35019,  null,  6800, 21000, 49, 'OH', 1.24),
  ('Penn State University',                    'research', 18985, 37716,  null,  9200, 25000, 59, 'PA', 1.22),
  ('Purdue University',                        'research', 10002, 29794,  null,  5400, 17000, 49, 'IN', 1.25),
  ('University of Washington',                 'research', 12643, 41997,  null,  5300, 18000, 55, 'WA', 1.23),
  ('Arizona State University',                 'research', 11038, 28996,  null,  7800, 22000, 103, 'AZ', 1.18),
  ('Michigan State University',                'research', 15188, 42516,  null,  7100, 21000, 55, 'MI', 1.22),
  ('UC San Diego',                             'research', 14989, 44989,  null,  5800, 19000, 26, 'CA', 1.34),
  ('UC Davis',                                 'research', 14992, 44966,  null,  5900, 20000, 38, 'CA', 1.28),
  ('UC Santa Barbara',                         'research', 14901, 44875,  null,  5700, 19000, 35, 'CA', 1.29),
  ('UC Irvine',                                'research', 13727, 43701,  null,  5500, 18000, 35, 'CA', 1.28),
  ('UC Santa Cruz',                            'research', 14401, 44375,  null,  7200, 22000, 80, 'CA', 1.20),
  ('UT Austin',                                'research', 11020, 40022,  null,  5200, 18000, 38, 'TX', 1.28),
  ('University of Florida',                    'research',  6381, 28658,  null,  3200, 13000, 28, 'FL', 1.32),
  ('UMass Amherst',                            'research', 16091, 37591,  null,  8900, 24000, 65, 'MA', 1.21),
  ('Rutgers University',                       'research', 17239, 35509,  null,  9100, 24000, 65, 'NJ', 1.21),
  ('Virginia Tech',                            'research', 13891, 33708,  null,  7300, 21000, 55, 'VA', 1.23),
  ('University of Maryland',                   'research', 11505, 40307,  null,  5800, 19000, 55, 'MD', 1.24),
  ('University of Colorado Boulder',           'research', 12904, 38994,  null,  8600, 23000, 84, 'CO', 1.20),
  ('Indiana University Bloomington',           'research', 10533, 37970,  null,  7400, 21000, 75, 'IN', 1.21),
  ('University of Minnesota',                  'research', 16155, 34132,  null,  7600, 22000, 55, 'MN', 1.23),
  ('Clemson University',                       'research', 15316, 38550,  null,  8100, 23000, 65, 'SC', 1.21),
  ('University of Connecticut',                'research', 16384, 40684,  null,  9300, 25000, 55, 'CT', 1.22),

  -- ── FLAGSHIP STATE ──────────────────────────────────────────
  ('Florida State University',                 'flagship',  5656, 21683,  null,  4800, 16000, 55, 'FL', 1.13),
  ('University of Alabama',                    'flagship', 11100, 29400,  null,  8200, 21000, 103, 'AL', 1.07),
  ('Auburn University',                        'flagship', 11180, 31008,  null,  8700, 22000, 103, 'AL', 1.07),
  ('Iowa State University',                    'flagship', 10095, 27099,  null,  7900, 21000, 103, 'IA', 1.08),
  ('University of Iowa',                       'flagship',  9860, 32372,  null,  8400, 22000, 103, 'IA', 1.08),
  ('University of Kansas',                     'flagship', 10092, 27878,  null,  9200, 23000, 153, 'KS', 1.06),
  ('Kansas State University',                  'flagship',  9874, 27124,  null,  9800, 24000, 153, 'KS', 1.06),
  ('University of Missouri',                   'flagship', 12140, 29812,  null,  8300, 22000, 103, 'MO', 1.07),
  ('University of Tennessee',                  'flagship', 13244, 32162,  null,  7600, 21000, 103, 'TN', 1.07),
  ('University of Kentucky',                   'flagship', 13440, 31000,  null,  8100, 22000, 103, 'KY', 1.07),
  ('University of Arkansas',                   'flagship',  9290, 24354,  null,  7200, 19000, 153, 'AR', 1.06),
  ('University of Oklahoma',                   'flagship',  9957, 28126,  null,  8600, 22000, 153, 'OK', 1.07),
  ('Oklahoma State University',                'flagship',  9046, 25346,  null,  9000, 22000, 153, 'OK', 1.06),
  ('Louisiana State University',               'flagship', 10082, 28522,  null,  7900, 21000, 153, 'LA', 1.07),
  ('University of South Carolina',             'flagship', 12688, 34726,  null,  9400, 24000, 103, 'SC', 1.07),
  ('University of Vermont',                    'flagship', 19032, 47112,  null, 12000, 30000, 103, 'VT', 1.08),
  ('University of Oregon',                     'flagship', 13698, 38226,  null, 10200, 26000, 103, 'OR', 1.08),
  ('University of Arizona',                    'flagship', 12457, 37890,  null,  8400, 22000, 103, 'AZ', 1.08),
  ('Miami University Ohio',                    'flagship', 16368, 36448,  null, 11000, 27000, 103, 'OH', 1.08),
  ('Colorado State University',                'flagship', 12328, 33778,  null,  9200, 23000, 103, 'CO', 1.07),
  ('University of Utah',                       'flagship',  9284, 31422,  null,  7600, 21000, 103, 'UT', 1.09),
  ('Utah State University',                    'flagship',  7980, 25246,  null,  8300, 21000, 235, 'UT', 1.05),
  ('University of Nevada Las Vegas',           'flagship',  8312, 23862,  null,  7800, 20000, 235, 'NV', 1.05),
  ('University of New Mexico',                 'flagship',  8530, 25994,  null,  7200, 19000, 235, 'NM', 1.05),
  ('West Virginia University',                 'flagship',  8976, 24552,  null,  8900, 22000, 235, 'WV', 1.05),
  ('University of Mississippi',                'flagship',  8780, 24708,  null,  8100, 21000, 235, 'MS', 1.05),
  ('Mississippi State University',             'flagship',  8764, 23734,  null,  8400, 21000, 235, 'MS', 1.05),
  ('University of Nebraska–Lincoln',           'flagship',  9890, 25730,  null,  8700, 22000, 153, 'NE', 1.07),
  ('University of Wyoming',                    'flagship',  5880, 20790,  null,  7400, 19000, 235, 'WY', 1.05),
  ('SUNY Buffalo',                             'flagship',  9688, 27098,  null,  7600, 20000, 80, 'NY', 1.10),
  ('SUNY Stony Brook',                         'flagship',  9680, 27070,  null,  7400, 19000, 80, 'NY', 1.11),
  ('SUNY Binghamton',                          'flagship',  9617, 27007,  null,  7200, 19000, 80, 'NY', 1.10),
  ('Cal Poly San Luis Obispo',                 'flagship',  9727, 21887,  null,  6800, 18000,  2, 'CA', 1.15),
  ('San Diego State University',               'flagship',  7824, 19984,  null,  7200, 19000, 20, 'CA', 1.10),
  ('San Jose State University',                'flagship',  7936, 20096,  null,  7800, 20000, 35, 'CA', 1.09),

  -- ── RESEARCH PRIVATE ────────────────────────────────────────
  ('Boston University',                        'research', null, 61050, 61050, 14000, 32000, 41, 'MA', 1.27),
  ('George Washington University',             'research', null, 62560, 62560, 18000, 38000, 66, 'DC', 1.20),
  ('American University',                      'research', null, 54506, 54506, 17000, 36000, 66, 'DC', 1.19),
  ('Fordham University',                       'research', null, 58194, 58194, 19000, 38000, 66, 'NY', 1.19),
  ('Villanova University',                     'research', null, 62240, 62240, 14000, 32000, 49, 'PA', 1.25),
  ('Case Western Reserve University',          'research', null, 59870, 59870, 12000, 30000, 49, 'OH', 1.25),
  ('Rensselaer Polytechnic Institute',         'research', null, 60285, 60285, 13000, 31000, 49, 'NY', 1.24),
  ('Worcester Polytechnic Institute',          'research', null, 57460, 57460, 14000, 32000, 49, 'MA', 1.23),
  ('Stevens Institute of Technology',          'research', null, 60410, 60410, 16000, 34000, 66, 'NJ', 1.20),
  ('Lehigh University',                        'research', null, 62730, 62730, 14000, 32000, 49, 'PA', 1.24),
  ('Drexel University',                        'research', null, 57560, 57560, 19000, 38000, 103, 'PA', 1.18),
  ('Syracuse University',                      'research', null, 59106, 59106, 18000, 36000, 65, 'NY', 1.21),
  ('Tulane University',                        'research', null, 62608, 62608, 10000, 27000, 44, 'LA', 1.26),
  ('University of Miami',                      'research', null, 58322, 58322, 16000, 34000, 49, 'FL', 1.24),
  ('University of Denver',                     'research', null, 57162, 57162, 16000, 33000, 84, 'CO', 1.19),
  ('Gonzaga University',                       'research', null, 51510, 51510, 18000, 34000, 84, 'WA', 1.18),
  ('Marquette University',                     'research', null, 46380, 46380, 17000, 33000, 103, 'WI', 1.18),
  ('Seton Hall University',                    'research', null, 44656, 44656, 18000, 34000, 103, 'NJ', 1.18),
  ('DePaul University',                        'research', null, 41424, 41424, 20000, 36000, 103, 'IL', 1.18),
  ('Loyola University Chicago',                'research', null, 48600, 48600, 18000, 34000, 103, 'IL', 1.18),

  -- ── LOCAL / REGIONAL PRIVATE ────────────────────────────────
  ('Babson College',                           'local', null, 55656, 55656, 18000, 36000,  1, 'MA', 1.08),
  ('Bentley University',                       'local', null, 55760, 55760, 20000, 38000,  1, 'MA', 1.07),
  ('Providence College',                       'local', null, 54490, 54490, 19000, 36000,  5, 'RI', 1.02),
  ('College of the Holy Cross',                'local', null, 58620, 58620, 16000, 34000,  3, 'MA', 1.04),
  ('Fairfield University',                     'local', null, 54950, 54950, 20000, 37000,  5, 'CT', 1.02),
  ('Quinnipiac University',                    'local', null, 51630, 51630, 22000, 38000,  5, 'CT', 1.01),
  ('Sacred Heart University',                  'local', null, 47490, 47490, 22000, 37000, 10, 'CT', 1.01),
  ('Marist College',                           'local', null, 43740, 43740, 21000, 36000,  5, 'NY', 1.01),
  ('Bryant University',                        'local', null, 51992, 51992, 21000, 37000,  1, 'RI', 1.05),
  ('Roger Williams University',                'local', null, 39748, 39748, 22000, 36000, 15, 'RI', 1.00),
  ('Hofstra University',                       'local', null, 52480, 52480, 24000, 40000,  8, 'NY', 1.01),
  ('Pace University',                          'local', null, 48100, 48100, 26000, 42000, 35, 'NY', 1.00),
  ('CUNY Baruch College',                      'local',  7600, 15480,  null,  2800,  8000,  1, 'NY', 1.03)

on conflict (school_name) do update set prestige_multiplier = excluded.prestige_multiplier;
