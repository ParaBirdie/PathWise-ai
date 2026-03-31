-- ============================================================
-- PathWise AI — Security Hardening Migration
-- Run in the Supabase SQL Editor after schema.sql and question_data.sql.
--
-- Addresses:
--   1. Unbounded `goals` arrays (no cardinality or element-length constraint)
--   2. Unbounded `schools` array element length (cardinality was already checked)
--   3. No explicit UPDATE / DELETE RLS policies (implicit deny is fragile)
-- ============================================================


-- ----------------------------------------------------------------
-- 1. Cardinality constraints for goals arrays
--    (CHECK constraints can reference only the current row, no
--     subqueries, so cardinality is the limit of what CHECK alone
--     can express; element-length is enforced via triggers below.)
-- ----------------------------------------------------------------

ALTER TABLE public.survey_sessions
  ADD CONSTRAINT chk_survey_goals_cardinality
    CHECK (goals IS NULL OR cardinality(goals) <= 6);

ALTER TABLE public.question_data
  ADD CONSTRAINT chk_qd_goals_cardinality
    CHECK (q5_goals IS NULL OR cardinality(q5_goals) <= 6);


-- ----------------------------------------------------------------
-- 2. Trigger-based element-length validation for text[] columns
--    PostgreSQL CHECK constraints cannot contain subqueries, so we
--    use BEFORE INSERT/UPDATE triggers to inspect individual elements.
-- ----------------------------------------------------------------

-- Validator for survey_sessions
CREATE OR REPLACE FUNCTION public.validate_survey_sessions_arrays()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Each school name must be <= 120 characters
  IF EXISTS (
    SELECT 1 FROM unnest(NEW.schools) AS s WHERE char_length(s) > 120
  ) THEN
    RAISE EXCEPTION 'survey_sessions: school name exceeds 120 characters';
  END IF;

  -- Each goal value must be <= 50 characters
  IF NEW.goals IS NOT NULL AND EXISTS (
    SELECT 1 FROM unnest(NEW.goals) AS g WHERE char_length(g) > 50
  ) THEN
    RAISE EXCEPTION 'survey_sessions: goal value exceeds 50 characters';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_survey_sessions_arrays ON public.survey_sessions;
CREATE TRIGGER trg_validate_survey_sessions_arrays
  BEFORE INSERT OR UPDATE ON public.survey_sessions
  FOR EACH ROW EXECUTE FUNCTION public.validate_survey_sessions_arrays();


-- Validator for question_data
CREATE OR REPLACE FUNCTION public.validate_question_data_arrays()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Each school name must be <= 120 characters
  IF EXISTS (
    SELECT 1 FROM unnest(NEW.q1_schools) AS s WHERE char_length(s) > 120
  ) THEN
    RAISE EXCEPTION 'question_data: school name exceeds 120 characters';
  END IF;

  -- Each goal value must be <= 50 characters
  IF NEW.q5_goals IS NOT NULL AND EXISTS (
    SELECT 1 FROM unnest(NEW.q5_goals) AS g WHERE char_length(g) > 50
  ) THEN
    RAISE EXCEPTION 'question_data: goal value exceeds 50 characters';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_question_data_arrays ON public.question_data;
CREATE TRIGGER trg_validate_question_data_arrays
  BEFORE INSERT OR UPDATE ON public.question_data
  FOR EACH ROW EXECUTE FUNCTION public.validate_question_data_arrays();


-- ----------------------------------------------------------------
-- 3. Explicit DENY policies for UPDATE and DELETE
--
--    With RLS enabled, operations with no matching policy are
--    implicitly denied — but that relies on no accidental FOR ALL
--    policy being added later. Explicit USING (false) policies are
--    self-documenting and robust against future schema changes.
-- ----------------------------------------------------------------

-- survey_sessions: deny UPDATE
DROP POLICY IF EXISTS "Deny update survey_sessions" ON public.survey_sessions;
CREATE POLICY "Deny update survey_sessions"
  ON public.survey_sessions FOR UPDATE
  USING (false);

-- survey_sessions: deny DELETE
DROP POLICY IF EXISTS "Deny delete survey_sessions" ON public.survey_sessions;
CREATE POLICY "Deny delete survey_sessions"
  ON public.survey_sessions FOR DELETE
  USING (false);

-- question_data: deny UPDATE
DROP POLICY IF EXISTS "Deny update question_data" ON public.question_data;
CREATE POLICY "Deny update question_data"
  ON public.question_data FOR UPDATE
  USING (false);

-- question_data: deny DELETE
DROP POLICY IF EXISTS "Deny delete question_data" ON public.question_data;
CREATE POLICY "Deny delete question_data"
  ON public.question_data FOR DELETE
  USING (false);
