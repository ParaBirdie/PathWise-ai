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
  created_at          timestamptz default now()
);

-- ----------------------------------------------------------------
-- survey_sessions
-- ----------------------------------------------------------------
create table if not exists public.survey_sessions (
  id              uuid primary key default uuid_generate_v4(),
  session_token   text unique not null,
  schools         text[]      not null,
  major           text        not null,
  residency       text,
  income_bracket  text,
  goal            text        check (goal in ('roi','prestige')),
  result_snapshot jsonb,
  created_at      timestamptz default now()
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

drop policy if exists "Insert survey session" on public.survey_sessions;
create policy "Insert survey session"
  on public.survey_sessions for insert with check (true);

drop policy if exists "Read own survey session" on public.survey_sessions;
create policy "Read own survey session"
  on public.survey_sessions for select
  using (session_token = current_setting('request.jwt.claims', true)::json->>'sub');

-- ----------------------------------------------------------------
-- Seed: career_trajectories
-- ----------------------------------------------------------------
insert into public.career_trajectories
  (major, university_tier, log_y0, r_schooling, beta1, beta2, beta3, beta4, employment_rate, signal_weight, data_source)
values
  ('Computer Science','elite',    10.240, 0.14, 0.082000, -0.001900, 0.0000280, -0.00000015, 0.93, 0.45, 'BLS OES + Levels.fyi 2024'),
  ('Computer Science','research', 10.240, 0.14, 0.082000, -0.001900, 0.0000280, -0.00000015, 0.93, 0.45, 'BLS OES + Levels.fyi 2024'),
  ('Computer Science','flagship', 10.240, 0.14, 0.082000, -0.001900, 0.0000280, -0.00000015, 0.93, 0.45, 'BLS OES + Levels.fyi 2024'),
  ('Computer Science','local',    10.240, 0.14, 0.082000, -0.001900, 0.0000280, -0.00000015, 0.93, 0.45, 'BLS OES + Levels.fyi 2024'),
  ('Business / Finance','elite',    9.998, 0.11, 0.068000, -0.001600, 0.0000220, -0.00000012, 0.88, 0.60, 'BLS OES + Glassdoor 2024'),
  ('Business / Finance','research', 9.998, 0.11, 0.068000, -0.001600, 0.0000220, -0.00000012, 0.88, 0.60, 'BLS OES + Glassdoor 2024'),
  ('Business / Finance','flagship', 9.998, 0.11, 0.068000, -0.001600, 0.0000220, -0.00000012, 0.88, 0.60, 'BLS OES + Glassdoor 2024'),
  ('Business / Finance','local',    9.998, 0.11, 0.068000, -0.001600, 0.0000220, -0.00000012, 0.88, 0.60, 'BLS OES + Glassdoor 2024'),
  ('Liberal Arts / Humanities','elite',    9.680, 0.08, 0.052000, -0.001200, 0.0000160, -0.00000008, 0.78, 0.70, 'PayScale 2024'),
  ('Liberal Arts / Humanities','flagship', 9.680, 0.08, 0.052000, -0.001200, 0.0000160, -0.00000008, 0.78, 0.70, 'PayScale 2024')
on conflict (major, university_tier) do nothing;

-- ----------------------------------------------------------------
-- Seed: university_financials — original 12
-- ----------------------------------------------------------------
insert into public.university_financials
  (school_name, tier, tuition_in_state, tuition_out_state, tuition_private, avg_net_price_30k, avg_net_price_75k, us_news_rank, location_state)
values
  ('MIT',                    'elite',    null,  57986, 57986,  3500,  15000,  1, 'MA'),
  ('Stanford',               'elite',    null,  56169, 56169,  2000,  12000,  3, 'CA'),
  ('Harvard',                'elite',    null,  57261, 57261,  2500,  13000,  3, 'MA'),
  ('Princeton',              'elite',    null,  57690, 57690,  1800,  11000,  1, 'NJ'),
  ('Yale',                   'elite',    null,  59950, 59950,  2200,  14000,  5, 'CT'),
  ('UC Berkeley',            'research', 14312, 44066,  null,  6200,  22000, 20, 'CA'),
  ('UCLA',                   'research', 13249, 43022,  null,  7100,  23000, 20, 'CA'),
  ('Carnegie Mellon',        'research',  null, 58924, 58924,  9000,  28000, 22, 'PA'),
  ('Georgia Tech',           'research', 12424, 33794,  null,  5800,  20000, 33, 'GA'),
  ('University of Michigan', 'research', 16736, 53232,  null,  4200,  18000, 23, 'MI'),
  ('Northeastern',           'research',  null, 59154, 59154, 14000,  32000, 49, 'MA'),
  ('NYU',                    'research',  null, 58168, 58168, 16000,  35000, 35, 'NY')
on conflict (school_name) do nothing;

-- ----------------------------------------------------------------
-- Seed: university_financials — 100 additional schools
-- ----------------------------------------------------------------
insert into public.university_financials
  (school_name, tier, tuition_in_state, tuition_out_state, tuition_private, avg_net_price_30k, avg_net_price_75k, us_news_rank, location_state)
values

  -- ── ELITE PRIVATE ───────────────────────────────────────────
  ('Caltech',                                  'elite', null,  63411, 63411,  3200,  16000,  9, 'CA'),
  ('Duke University',                          'elite', null,  63054, 63054,  4100,  17000,  7, 'NC'),
  ('Johns Hopkins University',                 'elite', null,  63340, 63340,  6200,  20000,  9, 'MD'),
  ('Northwestern University',                  'elite', null,  63468, 63468,  5800,  19000,  9, 'IL'),
  ('Dartmouth College',                        'elite', null,  62430, 62430,  3600,  15500, 12, 'NH'),
  ('Brown University',                         'elite', null,  65146, 65146,  4000,  16000, 13, 'RI'),
  ('Vanderbilt University',                    'elite', null,  60348, 60348,  8000,  22000, 12, 'TN'),
  ('Rice University',                          'elite', null,  54960, 54960,  3100,  13000, 16, 'TX'),
  ('Washington University in St. Louis',       'elite', null,  61750, 61750,  6500,  21000, 24, 'MO'),
  ('Emory University',                         'elite', null,  58280, 58280,  7000,  21000, 22, 'GA'),
  ('University of Notre Dame',                 'elite', null,  62693, 62693,  6200,  21000, 18, 'IN'),
  ('Georgetown University',                    'elite', null,  62532, 62532, 10000,  28000, 22, 'DC'),
  ('Tufts University',                         'elite', null,  65222, 65222, 12000,  30000, 28, 'MA'),
  ('Wake Forest University',                   'elite', null,  62930, 62930, 11000,  29000, 49, 'NC'),
  ('Boston College',                           'elite', null,  64208, 64208, 13000,  31000, 36, 'MA'),

  -- ── RESEARCH PUBLIC ─────────────────────────────────────────
  ('University of Virginia',                   'research', 18886, 54094,  null,  5100, 19000, 26, 'VA'),
  ('UNC Chapel Hill',                          'research',  8998, 37366,  null,  4400, 16000, 29, 'NC'),
  ('University of Wisconsin–Madison',          'research', 11205, 39378,  null,  5600, 19000, 35, 'WI'),
  ('University of Illinois Urbana-Champaign',  'research', 16040, 34312,  null,  7200, 22000, 35, 'IL'),
  ('Ohio State University',                    'research', 11936, 35019,  null,  6800, 21000, 49, 'OH'),
  ('Penn State University',                    'research', 18985, 37716,  null,  9200, 25000, 59, 'PA'),
  ('Purdue University',                        'research', 10002, 29794,  null,  5400, 17000, 49, 'IN'),
  ('University of Washington',                 'research', 12643, 41997,  null,  5300, 18000, 55, 'WA'),
  ('Arizona State University',                 'research', 11038, 28996,  null,  7800, 22000, 103, 'AZ'),
  ('Michigan State University',                'research', 15188, 42516,  null,  7100, 21000, 55, 'MI'),
  ('UC San Diego',                             'research', 14989, 44989,  null,  5800, 19000, 26, 'CA'),
  ('UC Davis',                                 'research', 14992, 44966,  null,  5900, 20000, 38, 'CA'),
  ('UC Santa Barbara',                         'research', 14901, 44875,  null,  5700, 19000, 35, 'CA'),
  ('UC Irvine',                                'research', 13727, 43701,  null,  5500, 18000, 35, 'CA'),
  ('UC Santa Cruz',                            'research', 14401, 44375,  null,  7200, 22000, 80, 'CA'),
  ('UT Austin',                                'research', 11020, 40022,  null,  5200, 18000, 38, 'TX'),
  ('University of Florida',                    'research',  6381, 28658,  null,  3200, 13000, 28, 'FL'),
  ('UMass Amherst',                            'research', 16091, 37591,  null,  8900, 24000, 65, 'MA'),
  ('Rutgers University',                       'research', 17239, 35509,  null,  9100, 24000, 65, 'NJ'),
  ('Virginia Tech',                            'research', 13891, 33708,  null,  7300, 21000, 55, 'VA'),
  ('University of Maryland',                   'research', 11505, 40307,  null,  5800, 19000, 55, 'MD'),
  ('University of Colorado Boulder',           'research', 12904, 38994,  null,  8600, 23000, 84, 'CO'),
  ('Indiana University Bloomington',           'research', 10533, 37970,  null,  7400, 21000, 75, 'IN'),
  ('University of Minnesota',                  'research', 16155, 34132,  null,  7600, 22000, 55, 'MN'),
  ('Clemson University',                       'research', 15316, 38550,  null,  8100, 23000, 65, 'SC'),
  ('University of Connecticut',                'research', 16384, 40684,  null,  9300, 25000, 55, 'CT'),

  -- ── FLAGSHIP STATE ──────────────────────────────────────────
  ('Florida State University',                 'flagship',  5656, 21683,  null,  4800, 16000, 55, 'FL'),
  ('University of Alabama',                    'flagship', 11100, 29400,  null,  8200, 21000, 103, 'AL'),
  ('Auburn University',                        'flagship', 11180, 31008,  null,  8700, 22000, 103, 'AL'),
  ('Iowa State University',                    'flagship', 10095, 27099,  null,  7900, 21000, 103, 'IA'),
  ('University of Iowa',                       'flagship',  9860, 32372,  null,  8400, 22000, 103, 'IA'),
  ('University of Kansas',                     'flagship', 10092, 27878,  null,  9200, 23000, 153, 'KS'),
  ('Kansas State University',                  'flagship',  9874, 27124,  null,  9800, 24000, 153, 'KS'),
  ('University of Missouri',                   'flagship', 12140, 29812,  null,  8300, 22000, 103, 'MO'),
  ('University of Tennessee',                  'flagship', 13244, 32162,  null,  7600, 21000, 103, 'TN'),
  ('University of Kentucky',                   'flagship', 13440, 31000,  null,  8100, 22000, 103, 'KY'),
  ('University of Arkansas',                   'flagship',  9290, 24354,  null,  7200, 19000, 153, 'AR'),
  ('University of Oklahoma',                   'flagship',  9957, 28126,  null,  8600, 22000, 153, 'OK'),
  ('Oklahoma State University',                'flagship',  9046, 25346,  null,  9000, 22000, 153, 'OK'),
  ('Louisiana State University',               'flagship', 10082, 28522,  null,  7900, 21000, 153, 'LA'),
  ('University of South Carolina',             'flagship', 12688, 34726,  null,  9400, 24000, 103, 'SC'),
  ('University of Vermont',                    'flagship', 19032, 47112,  null, 12000, 30000, 103, 'VT'),
  ('University of Oregon',                     'flagship', 13698, 38226,  null, 10200, 26000, 103, 'OR'),
  ('University of Arizona',                    'flagship', 12457, 37890,  null,  8400, 22000, 103, 'AZ'),
  ('Miami University Ohio',                    'flagship', 16368, 36448,  null, 11000, 27000, 103, 'OH'),
  ('Colorado State University',                'flagship', 12328, 33778,  null,  9200, 23000, 103, 'CO'),
  ('University of Utah',                       'flagship',  9284, 31422,  null,  7600, 21000, 103, 'UT'),
  ('Utah State University',                    'flagship',  7980, 25246,  null,  8300, 21000, 235, 'UT'),
  ('University of Nevada Las Vegas',           'flagship',  8312, 23862,  null,  7800, 20000, 235, 'NV'),
  ('University of New Mexico',                 'flagship',  8530, 25994,  null,  7200, 19000, 235, 'NM'),
  ('West Virginia University',                 'flagship',  8976, 24552,  null,  8900, 22000, 235, 'WV'),
  ('University of Mississippi',                'flagship',  8780, 24708,  null,  8100, 21000, 235, 'MS'),
  ('Mississippi State University',             'flagship',  8764, 23734,  null,  8400, 21000, 235, 'MS'),
  ('University of Nebraska–Lincoln',           'flagship',  9890, 25730,  null,  8700, 22000, 153, 'NE'),
  ('University of Wyoming',                    'flagship',  5880, 20790,  null,  7400, 19000, 235, 'WY'),
  ('SUNY Buffalo',                             'flagship',  9688, 27098,  null,  7600, 20000, 80, 'NY'),
  ('SUNY Stony Brook',                         'flagship',  9680, 27070,  null,  7400, 19000, 80, 'NY'),
  ('SUNY Binghamton',                          'flagship',  9617, 27007,  null,  7200, 19000, 80, 'NY'),
  ('Cal Poly San Luis Obispo',                 'flagship',  9727, 21887,  null,  6800, 18000,  2, 'CA'),
  ('San Diego State University',               'flagship',  7824, 19984,  null,  7200, 19000, 20, 'CA'),
  ('San Jose State University',                'flagship',  7936, 20096,  null,  7800, 20000, 35, 'CA'),

  -- ── RESEARCH PRIVATE ────────────────────────────────────────
  ('Boston University',                        'research', null, 61050, 61050, 14000, 32000, 41, 'MA'),
  ('George Washington University',             'research', null, 62560, 62560, 18000, 38000, 66, 'DC'),
  ('American University',                      'research', null, 54506, 54506, 17000, 36000, 66, 'DC'),
  ('Fordham University',                       'research', null, 58194, 58194, 19000, 38000, 66, 'NY'),
  ('Villanova University',                     'research', null, 62240, 62240, 14000, 32000, 49, 'PA'),
  ('Case Western Reserve University',          'research', null, 59870, 59870, 12000, 30000, 49, 'OH'),
  ('Rensselaer Polytechnic Institute',         'research', null, 60285, 60285, 13000, 31000, 49, 'NY'),
  ('Worcester Polytechnic Institute',          'research', null, 57460, 57460, 14000, 32000, 49, 'MA'),
  ('Stevens Institute of Technology',          'research', null, 60410, 60410, 16000, 34000, 66, 'NJ'),
  ('Lehigh University',                        'research', null, 62730, 62730, 14000, 32000, 49, 'PA'),
  ('Drexel University',                        'research', null, 57560, 57560, 19000, 38000, 103, 'PA'),
  ('Syracuse University',                      'research', null, 59106, 59106, 18000, 36000, 65, 'NY'),
  ('Tulane University',                        'research', null, 62608, 62608, 10000, 27000, 44, 'LA'),
  ('University of Miami',                      'research', null, 58322, 58322, 16000, 34000, 49, 'FL'),
  ('University of Denver',                     'research', null, 57162, 57162, 16000, 33000, 84, 'CO'),
  ('Gonzaga University',                       'research', null, 51510, 51510, 18000, 34000, 84, 'WA'),
  ('Marquette University',                     'research', null, 46380, 46380, 17000, 33000, 103, 'WI'),
  ('Seton Hall University',                    'research', null, 44656, 44656, 18000, 34000, 103, 'NJ'),
  ('DePaul University',                        'research', null, 41424, 41424, 20000, 36000, 103, 'IL'),
  ('Loyola University Chicago',                'research', null, 48600, 48600, 18000, 34000, 103, 'IL'),

  -- ── LOCAL / REGIONAL PRIVATE ────────────────────────────────
  ('Babson College',                           'local', null, 55656, 55656, 18000, 36000,  1, 'MA'),
  ('Bentley University',                       'local', null, 55760, 55760, 20000, 38000,  1, 'MA'),
  ('Providence College',                       'local', null, 54490, 54490, 19000, 36000,  5, 'RI'),
  ('College of the Holy Cross',                'local', null, 58620, 58620, 16000, 34000,  3, 'MA'),
  ('Fairfield University',                     'local', null, 54950, 54950, 20000, 37000,  5, 'CT'),
  ('Quinnipiac University',                    'local', null, 51630, 51630, 22000, 38000,  5, 'CT'),
  ('Sacred Heart University',                  'local', null, 47490, 47490, 22000, 37000, 10, 'CT'),
  ('Marist College',                           'local', null, 43740, 43740, 21000, 36000,  5, 'NY'),
  ('Bryant University',                        'local', null, 51992, 51992, 21000, 37000,  1, 'RI'),
  ('Roger Williams University',                'local', null, 39748, 39748, 22000, 36000, 15, 'RI'),
  ('Hofstra University',                       'local', null, 52480, 52480, 24000, 40000,  8, 'NY'),
  ('Pace University',                          'local', null, 48100, 48100, 26000, 42000, 35, 'NY'),
  ('CUNY Baruch College',                      'local',  7600, 15480,  null,  2800,  8000,  1, 'NY')

on conflict (school_name) do nothing;
