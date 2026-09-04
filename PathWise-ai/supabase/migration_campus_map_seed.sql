-- ⚠️  SUPERSEDED — DO NOT RUN.
--
-- supabase/migration_ai_layer.sql now contains everything in this file, plus
-- the city/latitude/longitude seed for all 121 schools. This file was a
-- stopgap written before migration_ai_layer.sql existed, and is kept only as a
-- record of what was applied by hand on 2026-09-03. Maintaining the same DDL
-- in two places is how migrations drift — delete this file once you are
-- satisfied migration_ai_layer.sql is correct.

-- PathWise AI — AI layer, §2 data model: map + photo support
--
-- Adds the location and photo columns to university_financials and seeds
-- city/latitude/longitude for the five demo schools.
--
-- Coordinates are hardcoded rather than model-generated, per §2. Each value is
-- the institution's canonical coordinate from Wikidata (property P625), spot-
-- checked against OpenStreetMap Nominatim on 2026-09-03. Four of five agreed
-- within ~0.5 km; Nominatim placed Michigan ~3.3 km northeast of Central
-- Campus, so the Wikidata value is used throughout for consistency.
--
--   Duke           Q168751   36.001111, -78.938889   Durham, NC
--   Arizona State  Q670897   33.416944, -111.936111  Tempe, AZ
--   UCLA           Q174710   34.072222, -118.442778  Los Angeles, CA
--   Michigan       Q230492   42.276944, -83.738056   Ann Arbor, MI
--   Johns Hopkins  Q193727   39.328889, -76.620556   Baltimore, MD
--
-- photo_path and photo_credit are intentionally left null here; they are
-- populated by scripts/seed-campus-photos.js, which uploads the image and
-- records its Wikimedia Commons attribution in the same step so a path can
-- never exist without its credit.
--
-- Safe to run repeatedly.

alter table public.university_financials
  add column if not exists city         text,
  add column if not exists latitude     numeric(9,6),
  add column if not exists longitude    numeric(9,6),
  add column if not exists photo_path   text,   -- Supabase Storage object path
  add column if not exists photo_credit text;   -- attribution string, rendered in the pin

update public.university_financials as u
set city = v.city, latitude = v.lat, longitude = v.lon
from (values
  ('Duke University',           'Durham',      36.001111::numeric,  -78.938889::numeric),
  ('Arizona State University',  'Tempe',       33.416944::numeric, -111.936111::numeric),
  ('UCLA',                      'Los Angeles', 34.072222::numeric, -118.442778::numeric),
  ('University of Michigan',    'Ann Arbor',   42.276944::numeric,  -83.738056::numeric),
  ('Johns Hopkins University',  'Baltimore',   39.328889::numeric,  -76.620556::numeric)
) as v(school_name, city, lat, lon)
where u.school_name = v.school_name;

-- Storage bucket for campus photos. Public read: the map pins render these
-- directly, and §0.4's CSP already allows img-src https://*.supabase.co.
insert into storage.buckets (id, name, public)
values ('campus-photos', 'campus-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "public read campus photos" on storage.objects;
create policy "public read campus photos"
  on storage.objects for select using (bucket_id = 'campus-photos');
