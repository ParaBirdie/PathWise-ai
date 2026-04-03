-- ============================================================
-- Migration: Add per-school prestige_multiplier + recalibrate
--            career_trajectories wage baselines.
--
-- Run this against an EXISTING Supabase instance that was set up
-- with schema.sql before this change. For fresh setups the updated
-- schema.sql already includes everything below.
-- ============================================================

-- ── 1. Add prestige_multiplier column ────────────────────────
alter table public.university_financials
  add column if not exists prestige_multiplier numeric(6,4) not null default 1.08;

-- ── 2. Set per-school values ──────────────────────────────────
-- Calibrated from PayScale College Salary Report, LinkedIn Economic Graph,
-- Glassdoor alumni earnings outcomes, and US News rankings (2024).
update public.university_financials
set prestige_multiplier = case school_name
  -- Elite
  when 'MIT'                                   then 1.75
  when 'Princeton'                             then 1.72
  when 'Stanford'                              then 1.72
  when 'Harvard'                               then 1.70
  when 'Yale'                                  then 1.67
  when 'Caltech'                               then 1.62
  when 'Duke University'                       then 1.63
  when 'Johns Hopkins University'              then 1.60
  when 'Northwestern University'               then 1.60
  when 'Dartmouth College'                     then 1.58
  when 'Brown University'                      then 1.56
  when 'Vanderbilt University'                 then 1.57
  when 'Rice University'                       then 1.55
  when 'Washington University in St. Louis'    then 1.50
  when 'Emory University'                      then 1.51
  when 'University of Notre Dame'              then 1.53
  when 'Georgetown University'                 then 1.50
  when 'Tufts University'                      then 1.47
  when 'Boston College'                        then 1.46
  when 'Wake Forest University'                then 1.45
  -- Research
  when 'UC Berkeley'                           then 1.38
  when 'UCLA'                                  then 1.37
  when 'Carnegie Mellon'                       then 1.36
  when 'University of Michigan'                then 1.36
  when 'UC San Diego'                          then 1.34
  when 'University of Virginia'                then 1.35
  when 'Georgia Tech'                          then 1.33
  when 'University of Florida'                 then 1.32
  when 'UNC Chapel Hill'                       then 1.32
  when 'NYU'                                   then 1.30
  when 'University of Illinois Urbana-Champaign' then 1.30
  when 'UC Santa Barbara'                      then 1.29
  when 'UC Davis'                              then 1.28
  when 'UC Irvine'                             then 1.28
  when 'University of Wisconsin–Madison'       then 1.28
  when 'UT Austin'                             then 1.28
  when 'Boston University'                     then 1.27
  when 'Tulane University'                     then 1.26
  when 'Purdue University'                     then 1.25
  when 'Villanova University'                  then 1.25
  when 'Case Western Reserve University'       then 1.25
  when 'University of Maryland'                then 1.24
  when 'Rensselaer Polytechnic Institute'      then 1.24
  when 'Lehigh University'                     then 1.24
  when 'University of Miami'                   then 1.24
  when 'Ohio State University'                 then 1.24
  when 'University of Minnesota'               then 1.23
  when 'Virginia Tech'                         then 1.23
  when 'University of Washington'              then 1.23
  when 'Worcester Polytechnic Institute'       then 1.23
  when 'Penn State University'                 then 1.22
  when 'Michigan State University'             then 1.22
  when 'University of Connecticut'             then 1.22
  when 'UMass Amherst'                         then 1.21
  when 'Rutgers University'                    then 1.21
  when 'Clemson University'                    then 1.21
  when 'Indiana University Bloomington'        then 1.21
  when 'Syracuse University'                   then 1.21
  when 'UC Santa Cruz'                         then 1.20
  when 'George Washington University'          then 1.20
  when 'University of Colorado Boulder'        then 1.20
  when 'Stevens Institute of Technology'       then 1.20
  when 'University of Denver'                  then 1.19
  when 'American University'                   then 1.19
  when 'Fordham University'                    then 1.19
  when 'Arizona State University'              then 1.18
  when 'Drexel University'                     then 1.18
  when 'Gonzaga University'                    then 1.18
  when 'Marquette University'                  then 1.18
  when 'Seton Hall University'                 then 1.18
  when 'DePaul University'                     then 1.18
  when 'Loyola University Chicago'             then 1.18
  -- Flagship
  when 'Cal Poly San Luis Obispo'              then 1.15
  when 'Florida State University'              then 1.13
  when 'SUNY Stony Brook'                      then 1.11
  when 'SUNY Buffalo'                          then 1.10
  when 'SUNY Binghamton'                       then 1.10
  when 'San Diego State University'            then 1.10
  when 'San Jose State University'             then 1.09
  when 'University of Utah'                    then 1.09
  when 'University of Vermont'                 then 1.08
  when 'University of Oregon'                  then 1.08
  when 'University of Arizona'                 then 1.08
  when 'Miami University Ohio'                 then 1.08
  when 'Iowa State University'                 then 1.08
  when 'University of Iowa'                    then 1.08
  when 'University of Missouri'                then 1.07
  when 'University of Tennessee'               then 1.07
  when 'University of Kentucky'                then 1.07
  when 'University of Oklahoma'                then 1.07
  when 'Louisiana State University'            then 1.07
  when 'University of South Carolina'          then 1.07
  when 'University of Alabama'                 then 1.07
  when 'Auburn University'                     then 1.07
  when 'Colorado State University'             then 1.07
  when 'University of Nebraska–Lincoln'        then 1.07
  when 'University of Kansas'                  then 1.06
  when 'Kansas State University'               then 1.06
  when 'University of Arkansas'                then 1.06
  when 'Oklahoma State University'             then 1.06
  when 'University of Mississippi'             then 1.05
  when 'Mississippi State University'          then 1.05
  when 'Utah State University'                 then 1.05
  when 'University of Nevada Las Vegas'        then 1.05
  when 'University of New Mexico'              then 1.05
  when 'West Virginia University'              then 1.05
  when 'University of Wyoming'                 then 1.05
  -- Local
  when 'Babson College'                        then 1.08
  when 'Bentley University'                    then 1.07
  when 'Bryant University'                     then 1.05
  when 'College of the Holy Cross'             then 1.04
  when 'CUNY Baruch College'                   then 1.03
  when 'Providence College'                    then 1.02
  when 'Fairfield University'                  then 1.02
  when 'Quinnipiac University'                 then 1.01
  when 'Sacred Heart University'               then 1.01
  when 'Marist College'                        then 1.01
  when 'Hofstra University'                    then 1.01
  when 'Roger Williams University'             then 1.00
  when 'Pace University'                       then 1.00
  else prestige_multiplier  -- leave any schools not listed at their default
end;

-- ── 3. Recalibrate career_trajectories wage baselines ─────────
-- New log_y0 values calibrated from BLS OES, Levels.fyi top-10 firm
-- averages, Glassdoor, AAMC, NALP, and IEEE salary data (2024).
-- All tiers share the same log_y0; prestige_multiplier does the
-- per-school differentiation work.

insert into public.career_trajectories
  (major, university_tier, log_y0, r_schooling, beta1, beta2, beta3, beta4, employment_rate, signal_weight, data_source)
values
  ('Computer Science','elite',    10.561, 0.14, 0.082000, -0.001900, 0.0000280, -0.00000015, 0.93, 0.45, 'BLS OES + Levels.fyi top-10 2024'),
  ('Computer Science','research', 10.561, 0.14, 0.082000, -0.001900, 0.0000280, -0.00000015, 0.93, 0.45, 'BLS OES + Levels.fyi top-10 2024'),
  ('Computer Science','flagship', 10.561, 0.14, 0.082000, -0.001900, 0.0000280, -0.00000015, 0.93, 0.45, 'BLS OES + Levels.fyi top-10 2024'),
  ('Computer Science','local',    10.561, 0.14, 0.082000, -0.001900, 0.0000280, -0.00000015, 0.93, 0.45, 'BLS OES + Levels.fyi top-10 2024'),
  ('Electrical Engineering','elite',    10.580, 0.13, 0.078000, -0.001800, 0.0000250, -0.00000013, 0.91, 0.40, 'BLS OES + IEEE Salary Survey 2024'),
  ('Electrical Engineering','research', 10.580, 0.13, 0.078000, -0.001800, 0.0000250, -0.00000013, 0.91, 0.40, 'BLS OES + IEEE Salary Survey 2024'),
  ('Electrical Engineering','flagship', 10.580, 0.13, 0.078000, -0.001800, 0.0000250, -0.00000013, 0.91, 0.40, 'BLS OES + IEEE Salary Survey 2024'),
  ('Electrical Engineering','local',    10.580, 0.13, 0.078000, -0.001800, 0.0000250, -0.00000013, 0.91, 0.40, 'BLS OES + IEEE Salary Survey 2024'),
  ('Business / Finance','elite',    10.510, 0.11, 0.095000, -0.002000, 0.0000300, -0.00000016, 0.88, 0.60, 'BLS OES + Glassdoor IB top-10 2024'),
  ('Business / Finance','research', 10.510, 0.11, 0.095000, -0.002000, 0.0000300, -0.00000016, 0.88, 0.60, 'BLS OES + Glassdoor IB top-10 2024'),
  ('Business / Finance','flagship', 10.510, 0.11, 0.095000, -0.002000, 0.0000300, -0.00000016, 0.88, 0.60, 'BLS OES + Glassdoor IB top-10 2024'),
  ('Business / Finance','local',    10.510, 0.11, 0.095000, -0.002000, 0.0000300, -0.00000016, 0.88, 0.60, 'BLS OES + Glassdoor IB top-10 2024'),
  ('Pre-Medicine / Biology','elite',    10.325, 0.12, 0.140000, -0.003000, 0.0000150, -0.00000003, 0.85, 0.35, 'AAMC Physician Salary + BLS 2024'),
  ('Pre-Medicine / Biology','research', 10.325, 0.12, 0.140000, -0.003000, 0.0000150, -0.00000003, 0.85, 0.35, 'AAMC Physician Salary + BLS 2024'),
  ('Pre-Medicine / Biology','flagship', 10.325, 0.12, 0.140000, -0.003000, 0.0000150, -0.00000003, 0.85, 0.35, 'AAMC Physician Salary + BLS 2024'),
  ('Pre-Medicine / Biology','local',    10.325, 0.12, 0.140000, -0.003000, 0.0000150, -0.00000003, 0.85, 0.35, 'AAMC Physician Salary + BLS 2024'),
  ('Liberal Arts / Humanities','elite',    10.475, 0.08, 0.052000, -0.001200, 0.0000160, -0.00000008, 0.78, 0.70, 'PayScale + Glassdoor 2024'),
  ('Liberal Arts / Humanities','research', 10.475, 0.08, 0.052000, -0.001200, 0.0000160, -0.00000008, 0.78, 0.70, 'PayScale + Glassdoor 2024'),
  ('Liberal Arts / Humanities','flagship', 10.475, 0.08, 0.052000, -0.001200, 0.0000160, -0.00000008, 0.78, 0.70, 'PayScale + Glassdoor 2024'),
  ('Liberal Arts / Humanities','local',    10.475, 0.08, 0.052000, -0.001200, 0.0000160, -0.00000008, 0.78, 0.70, 'PayScale + Glassdoor 2024'),
  ('Nursing','elite',    10.679, 0.09, 0.065000, -0.001500, 0.0000200, -0.00000010, 0.95, 0.25, 'BLS OES + ANA Salary Survey 2024'),
  ('Nursing','research', 10.679, 0.09, 0.065000, -0.001500, 0.0000200, -0.00000010, 0.95, 0.25, 'BLS OES + ANA Salary Survey 2024'),
  ('Nursing','flagship', 10.679, 0.09, 0.065000, -0.001500, 0.0000200, -0.00000010, 0.95, 0.25, 'BLS OES + ANA Salary Survey 2024'),
  ('Nursing','local',    10.679, 0.09, 0.065000, -0.001500, 0.0000200, -0.00000010, 0.95, 0.25, 'BLS OES + ANA Salary Survey 2024'),
  ('Education','elite',    10.421, 0.085, 0.048000, -0.001000, 0.0000130, -0.00000007, 0.87, 0.30, 'BLS OES + NEA Salary Survey 2024'),
  ('Education','research', 10.421, 0.085, 0.048000, -0.001000, 0.0000130, -0.00000007, 0.87, 0.30, 'BLS OES + NEA Salary Survey 2024'),
  ('Education','flagship', 10.421, 0.085, 0.048000, -0.001000, 0.0000130, -0.00000007, 0.87, 0.30, 'BLS OES + NEA Salary Survey 2024'),
  ('Education','local',    10.421, 0.085, 0.048000, -0.001000, 0.0000130, -0.00000007, 0.87, 0.30, 'BLS OES + NEA Salary Survey 2024'),
  ('Psychology','elite',    10.550, 0.08, 0.050000, -0.001100, 0.0000150, -0.00000008, 0.76, 0.55, 'BLS OES + APA Salary Survey 2024'),
  ('Psychology','research', 10.550, 0.08, 0.050000, -0.001100, 0.0000150, -0.00000008, 0.76, 0.55, 'BLS OES + APA Salary Survey 2024'),
  ('Psychology','flagship', 10.550, 0.08, 0.050000, -0.001100, 0.0000150, -0.00000008, 0.76, 0.55, 'BLS OES + APA Salary Survey 2024'),
  ('Psychology','local',    10.550, 0.08, 0.050000, -0.001100, 0.0000150, -0.00000008, 0.76, 0.55, 'BLS OES + APA Salary Survey 2024'),
  ('Data Science / Statistics','elite',    10.650, 0.135, 0.080000, -0.001800, 0.0000260, -0.00000014, 0.92, 0.42, 'BLS OES + Levels.fyi DS 2024'),
  ('Data Science / Statistics','research', 10.650, 0.135, 0.080000, -0.001800, 0.0000260, -0.00000014, 0.92, 0.42, 'BLS OES + Levels.fyi DS 2024'),
  ('Data Science / Statistics','flagship', 10.650, 0.135, 0.080000, -0.001800, 0.0000260, -0.00000014, 0.92, 0.42, 'BLS OES + Levels.fyi DS 2024'),
  ('Data Science / Statistics','local',    10.650, 0.135, 0.080000, -0.001800, 0.0000260, -0.00000014, 0.92, 0.42, 'BLS OES + Levels.fyi DS 2024'),
  ('Pre-Law / Political Science','elite',    10.531, 0.10, 0.115000, -0.002500, 0.0000180, -0.00000006, 0.80, 0.75, 'NALP + BLS OES + Glassdoor AmLaw100 2024'),
  ('Pre-Law / Political Science','research', 10.531, 0.10, 0.115000, -0.002500, 0.0000180, -0.00000006, 0.80, 0.75, 'NALP + BLS OES + Glassdoor AmLaw100 2024'),
  ('Pre-Law / Political Science','flagship', 10.531, 0.10, 0.115000, -0.002500, 0.0000180, -0.00000006, 0.80, 0.75, 'NALP + BLS OES + Glassdoor AmLaw100 2024'),
  ('Pre-Law / Political Science','local',    10.531, 0.10, 0.115000, -0.002500, 0.0000180, -0.00000006, 0.80, 0.75, 'NALP + BLS OES + Glassdoor AmLaw100 2024'),
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
