-- ============================================================
-- Migration: Add tier_signal_boost to university_financials
--
-- Purpose: The Skill vs. Signal bar on the final report was
-- previously identical for every school sharing the same major,
-- because signal_weight was a major-only constant. This migration
-- adds a per-school adjustment column so that elite schools
-- (Ivy League, top-30) show higher Signal (Brand) weight while
-- state flagships and local schools show higher Skill (Major) weight.
--
-- The engine clamps the final adjusted weight to [0.05, 0.95].
-- Apply in the Supabase SQL Editor or via the CLI.
-- ============================================================

-- Step 1: Add the column (idempotent — safe to re-run)
alter table public.university_financials
  add column if not exists tier_signal_boost numeric(4,2) not null default 0;

-- Step 2: Populate by tier
-- Elite (Ivy League, top-30 schools): +0.15
--   Brand-name diploma dominates career outcomes; recruiters filter on
--   alma mater for finance, consulting, and law much more than at other tiers.
update public.university_financials
  set tier_signal_boost = 0.15
  where tier = 'elite';

-- Research universities (top R1 public & private): +0.07
--   School name still opens doors at top employers, but demonstrated
--   skill (projects, internships, GPA) carries increasing weight.
update public.university_financials
  set tier_signal_boost = 0.07
  where tier = 'research';

-- State flagship universities: −0.05
--   Employers value the degree but differentiate primarily by
--   demonstrated ability, portfolio, and internship track record.
update public.university_financials
  set tier_signal_boost = -0.05
  where tier = 'flagship';

-- Local / Regional schools: −0.12
--   Brand signal is weakest here; hiring is almost entirely skills-based.
--   Students compete on demonstrated ability, certifications, and networks.
update public.university_financials
  set tier_signal_boost = -0.12
  where tier = 'local';
