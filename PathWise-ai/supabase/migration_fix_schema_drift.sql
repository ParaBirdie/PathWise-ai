-- ============================================================
-- Migration: reconcile the live database with the columns the
--            application actually reads and writes.
--
-- Context: the live tables were created by an early run of
-- schema.sql. That file uses `create table if not exists`, so
-- re-running it never adds columns to a table that already exists,
-- and every column added to schema.sql afterwards silently never
-- landed. Three migration files in this directory were written for
-- exactly this and were never applied.
--
-- Verified missing on the live database (2026-09-04):
--   survey_sessions.goals
--   survey_sessions.financial_aid_offers
--   university_financials.prestige_multiplier
--   university_financials.tier_signal_boost
--
-- Every statement is idempotent, and neither part changes a single
-- number on the results page. Apply in the Supabase SQL Editor.
-- ============================================================


-- ── PART 1 — survey_sessions (the console error) ─────────────
-- Fixes: "[PathWise] survey_sessions save failed: Could not find
-- the 'financial_aid_offers' column ... PGRST204" on every Q7
-- submit. PostgREST reports only the first missing column, which
-- is why `goals` never appeared in that message.
--
-- Persistence only — nothing on the results page reads this table.

alter table public.survey_sessions
  add column if not exists goals                text[],
  add column if not exists financial_aid_offers jsonb;

-- The cardinality guard in migration_security_hardening.sql cannot
-- have applied, since it references a column that did not exist.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'chk_survey_goals_cardinality'
      and conrelid = 'public.survey_sessions'::regclass
  ) then
    alter table public.survey_sessions
      add constraint chk_survey_goals_cardinality
      check (goals is null or cardinality(goals) <= 6);
  end if;
end $$;


-- ── PART 2 — university_financials ───────────────────────────
-- fetchUniversityMaps() selects both columns below and bails with
-- `if (error || !data?.length) return null` when the query fails.
-- Two missing columns therefore discard the ENTIRE table: tier,
-- tuition and location all silently fall back to the static maps
-- in src/lib/economicData.js. The database is currently doing no
-- work at all for the money model.
--
-- NOTE ON `prestige_multiplier` — read before editing this.
-- migration_add_prestige_multiplier.sql declares this column
-- `not null default 1.08`. Adding it that way here would be a
-- REGRESSION, not a fix: every row would get 1.08, the service
-- would load that flat value for all 121 schools, and
-- resolvePrestigeMultiplier() prefers the DB value over the static
-- per-school map — collapsing all prestige differentiation and
-- moving every NPV on the page.
--
-- So it is added NULLABLE with no default. npvEngine reads it as
-- `if (prestige_multiplier != null)`, so NULL means "fall through
-- to the static per-school map" and behaviour is bit-identical to
-- today. The column can be populated later, on purpose.

alter table public.university_financials
  add column if not exists prestige_multiplier numeric(6,4),   -- nullable on purpose; see above
  add column if not exists tier_signal_boost   numeric(4,2);   -- nullable on purpose; see above

-- tier_signal_boost is safe to populate now: these four values are
-- byte-identical to TIER_SIGNAL_BOOST in economicData.js, which is
-- what the engine falls back to today. Verified identical.
--
-- VERIFIED NUMBER-NEUTRAL (2026-09-04). Every column in this table was
-- diffed against the static maps across all 121 rows: 0 conflicting
-- values. The database only ADDS data the static maps lack —
-- location_state and tuition_out_state for 55 private schools.
-- compareOffers() was then run with the maps off and on across five
-- residency/school combinations: identical NPV, identical tuition,
-- identical ranking in every case.
--
-- One behavioural difference, believed correct and not rendered
-- anywhere on the results page: a private school in the student's home
-- state now resolves isInState = true (e.g. Duke for an NC resident).
-- Tuition is unaffected, because estimateTuition() checks the private
-- tuition map before any in/out-of-state rate. The only consumer is the
-- advisor chat's context object, where it is more accurate, not less.
update public.university_financials set tier_signal_boost =  0.15 where tier = 'elite'    and tier_signal_boost is null;
update public.university_financials set tier_signal_boost =  0.07 where tier = 'research' and tier_signal_boost is null;
update public.university_financials set tier_signal_boost = -0.05 where tier = 'flagship' and tier_signal_boost is null;
update public.university_financials set tier_signal_boost = -0.12 where tier = 'local'    and tier_signal_boost is null;


-- ── Verification — expect one row, all zeros ─────────────────
select
  (select count(*) from information_schema.columns
     where table_name = 'survey_sessions'
       and column_name in ('goals','financial_aid_offers'))          as survey_cols_present_expect_2,
  (select count(*) from information_schema.columns
     where table_name = 'university_financials'
       and column_name in ('prestige_multiplier','tier_signal_boost')) as uf_cols_present_expect_2,
  (select count(*) from public.university_financials
     where tier_signal_boost is null)                                 as unset_signal_boost_expect_0;


-- ============================================================
-- OPTIONAL, AFTER THE DEMO — do not run today.
--
-- To make prestige DB-driven rather than static, run STEP 2 of
-- migration_add_prestige_multiplier.sql (the `update ... set
-- prestige_multiplier = case school_name ...` block). Its values
-- match the static map exactly for all 120 schools it lists, so it
-- is number-neutral — with one exception:
--
--   'Northeastern' is in university_financials but appears in
--   neither the CASE block nor the static per-school map. It
--   currently resolves to the research-tier fallback of 1.25.
--   Leaving it NULL preserves that. Do NOT give it the 1.08
--   default, which would quietly cut its earnings premium.
--
-- Do NOT run STEP 3 of that file. Step 3 rewrites
-- career_trajectories, which the app already reads successfully;
-- it would change every wage and NPV figure on the results page.
-- ============================================================
