-- Migration: add financial_aid_offers column to survey_sessions
-- Run this against an existing database that was created before this column was added.

alter table public.survey_sessions
  add column if not exists financial_aid_offers jsonb;
