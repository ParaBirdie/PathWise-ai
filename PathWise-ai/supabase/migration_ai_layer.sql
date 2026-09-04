-- ============================================================
-- Migration: AI layer §2 — map + photo support and campus profiles.
--
-- Run this against an EXISTING Supabase instance that was set up with
-- schema.sql. Safe to run repeatedly: every statement is guarded with
-- "if not exists" or is an idempotent UPDATE.
--
-- Sections:
--   1. Map + photo columns on university_financials
--   2. university_profiles table (populated offline by scripts/enrich-schools.js)
--   3. city / latitude / longitude seed for all 121 schools
--   4. Notes on what is deliberately left NULL
--
-- COORDINATE PROVENANCE — read before editing any number below.
-- Coordinates are hardcoded rather than model-generated, per §2. Every value is
-- the institution's canonical coordinate from Wikidata (property P625),
-- independently cross-checked against an OpenStreetMap Nominatim forward
-- geocode. Each school also had its reverse-geocoded state compared against the
-- location_state already in university_financials; all 121 agreed on both
-- country and state. Cities come from that reverse geocode except where noted
-- in section 3.
-- Do not "correct" these from memory — re-derive them from the same sources.
-- ============================================================

-- ── 1. Map + photo support ───────────────────────────────────
alter table public.university_financials
  add column if not exists city         text,
  add column if not exists latitude     numeric(9,6),
  add column if not exists longitude    numeric(9,6),
  add column if not exists photo_path   text,   -- Supabase Storage path
  add column if not exists photo_credit text;   -- attribution string

-- ── 2. Structured campus facts, populated offline by A4 ──────
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

-- §2 lists a bare "create policy", which is not idempotent and errors on a
-- second run. Dropping first is the only deviation from the spec's SQL, and it
-- is required by the "safe to run twice" constraint.
drop policy if exists "public read university_profiles" on public.university_profiles;
create policy "public read university_profiles"
  on public.university_profiles for select using (true);

-- ── 3. Seed city / latitude / longitude ──────────────────────
-- Most cities come from reverse-geocoding the Wikidata coordinate. Two groups
-- did not resolve that way and were sourced differently:
--
-- (a) Campus on unincorporated county land, or OSM returned an administrative
--     unit rather than a municipality — city taken from Wikidata P131:
--       East Lansing (Michigan State), Poughkeepsie (Marist), Troy (RPI),
--       Vestal (SUNY Binghamton), Buffalo (SUNY Buffalo), Syracuse (Syracuse),
--       South Bend (Notre Dame), San Luis Obispo (Cal Poly), Clemson (Clemson),
--       Starkville (Mississippi State), Davis (UC Davis), Oxford (Ole Miss),
--       Charlottesville (UVA), St. Louis (WashU).
--
-- (b) Neither source names a municipality — city taken from the institution's
--     published postal city:
--       Hempstead (Hofstra, 11549), Villanova (Villanova, 19085),
--       Las Vegas (UNLV, 89154), Santa Barbara (UCSB, 93106),
--       Stanford (Stanford, 94305).
update public.university_financials as u
set city      = v.city,
    latitude  = v.lat,
    longitude = v.lon
from (values
  ('American University',                     'Washington',       38.937055,   -77.086922),
  ('Arizona State University',                'Tempe',            33.416944,  -111.936111),
  ('Auburn University',                       'Auburn',           32.603374,   -85.486078),
  ('Babson College',                          'Wellesley',        42.298231,   -71.261192),
  ('Bentley University',                      'Waltham',            42.3876,     -71.2206),
  ('Boston College',                          'Newton',           42.335083,   -71.170361),
  ('Boston University',                       'Boston',           42.348889,   -71.100278),
  ('Brown University',                        'Providence',       41.826111,   -71.403056),
  ('Bryant University',                       'Smithfield',        41.92545,    -71.53241),
  ('Cal Poly San Luis Obispo',                'San Luis Obispo',  35.301667,  -120.659819),
  ('Caltech',                                 'Pasadena',           34.1385,    -118.1244),
  ('Carnegie Mellon',                         'Pittsburgh',         40.4425,   -79.943333),
  ('Case Western Reserve University',         'Cleveland',           41.504,      -81.608),
  ('Clemson University',                      'Clemson',          34.678333,   -82.839167),
  ('College of the Holy Cross',               'Worcester',        42.239167,   -71.808333),
  ('Colorado State University',               'Fort Collins',     40.574836,  -105.080978),
  ('CUNY Baruch College',                     'New York',         40.740159,    -73.98338),
  ('Dartmouth College',                       'Hanover',          43.703333,   -72.288333),
  ('DePaul University',                       'Chicago',          41.923558,   -87.653542),
  ('Drexel University',                       'Philadelphia',     39.956441,   -75.188686),
  ('Duke University',                         'Durham',           36.001111,   -78.938889),
  ('Emory University',                        'Atlanta',            33.7925,   -84.324167),
  ('Fairfield University',                    'Fairfield',          41.1815,     -73.2903),
  ('Florida State University',                'Tallahassee',      30.441667,      -84.295),
  ('Fordham University',                      'New York',         40.862827,   -73.885752),
  ('George Washington University',            'Washington',       38.900833,   -77.050833),
  ('Georgetown University',                   'Washington',       38.907222,   -77.072778),
  ('Georgia Tech',                            'Atlanta',          33.775806,   -84.394694),
  ('Gonzaga University',                      'Spokane',           47.66721,   -117.40235),
  ('Harvard',                                 'Cambridge',        42.374444,   -71.116944),
  ('Hofstra University',                      'Hempstead',        40.714606,   -73.600458),
  ('Indiana University Bloomington',          'Bloomington',      39.167222,   -86.521389),
  ('Iowa State University',                   'Ames',             42.026194,   -93.648444),
  ('Johns Hopkins University',                'Baltimore',        39.328889,   -76.620556),
  ('Kansas State University',                 'Manhattan',        39.191667,   -96.580833),
  ('Lehigh University',                       'Bethlehem',        40.607167,      -75.379),
  ('Louisiana State University',              'Baton Rouge',        30.4145,     -91.1783),
  ('Loyola University Chicago',               'Chicago',           41.89722,    -87.62389),
  ('Marist College',                          'Poughkeepsie',        41.726,     -73.9335),
  ('Marquette University',                    'Milwaukee',        43.039167,     -87.9325),
  ('Miami University Ohio',                   'Oxford',           39.511905,   -84.734674),
  ('Michigan State University',               'East Lansing',     42.701864,   -84.482161),
  ('Mississippi State University',            'Starkville',       33.453747,   -88.790049),
  ('MIT',                                     'Cambridge',        42.359722,   -71.091944),
  ('Northeastern',                            'Boston',               42.34,   -71.088333),
  ('Northwestern University',                 'Evanston',         42.056459,   -87.675267),
  ('NYU',                                     'New York',             40.73,      -73.995),
  ('Ohio State University',                   'Columbus',         40.000556,   -83.014444),
  ('Oklahoma State University',               'Stillwater',       36.132222,   -97.080833),
  ('Pace University',                         'New York',           40.7114,      -74.005),
  ('Penn State University',                   'State College',    40.796111,   -77.862778),
  ('Princeton',                               'Princeton',        40.345278,   -74.656111),
  ('Providence College',                      'Providence',       41.843889,      -71.435),
  ('Purdue University',                       'West Lafayette',      40.425,   -86.923056),
  ('Quinnipiac University',                   'Hamden',           41.420111,     -72.8945),
  ('Rensselaer Polytechnic Institute',        'Troy',             42.729014,   -73.676728),
  ('Rice University',                         'Houston',          29.716944,   -95.402778),
  ('Roger Williams University',               'Bristol',          41.649506,   -71.260564),
  ('Rutgers University',                      'New Brunswick',    40.501667,   -74.448056),
  ('Sacred Heart University',                 'Fairfield',          41.2214,     -73.2419),
  ('San Diego State University',              'San Diego',        32.775278,  -117.072222),
  ('San Jose State University',               'San Jose',         37.335556,  -121.881111),
  ('Seton Hall University',                   'South Orange',     40.743144,   -74.246635),
  ('Stanford',                                'Stanford',           37.4275,      -122.17),
  ('Stevens Institute of Technology',         'Hoboken',          40.744906,   -74.023937),
  ('SUNY Binghamton',                         'Vestal',            42.08925,    -75.96989),
  ('SUNY Buffalo',                            'Buffalo',                 43,   -78.789167),
  ('SUNY Stony Brook',                        'Stony Brook',      40.917321,   -73.124554),
  ('Syracuse University',                     'Syracuse',         43.037639,      -76.134),
  ('Tufts University',                        'Medford',          42.406949,    -71.11982),
  ('Tulane University',                       'New Orleans',      29.940833,   -90.120556),
  ('UC Berkeley',                             'Berkeley',         37.871944,  -122.258333),
  ('UC Davis',                                'Davis',                38.54,      -121.75),
  ('UC Irvine',                               'Irvine',            33.64535,  -117.842642),
  ('UC San Diego',                            'San Diego',        32.878889,  -117.236111),
  ('UC Santa Barbara',                        'Santa Barbara',    34.416323,  -119.846392),
  ('UC Santa Cruz',                           'Santa Cruz',       36.991389,  -122.060833),
  ('UCLA',                                    'Los Angeles',      34.072222,  -118.442778),
  ('UMass Amherst',                           'Amherst',          42.388889,   -72.527778),
  ('UNC Chapel Hill',                         'Chapel Hill',      35.908611,   -79.049167),
  ('University of Alabama',                   'Tuscaloosa',       33.210833,   -87.546111),
  ('University of Arizona',                   'Tucson',           32.231944,    -110.9525),
  ('University of Arkansas',                  'Fayetteville',     36.068611,   -94.176111),
  ('University of Colorado Boulder',          'Boulder',          40.006667,  -105.267222),
  ('University of Connecticut',               'Mansfield',        41.807222,     -72.2525),
  ('University of Denver',                    'Denver',           39.678333,  -104.962222),
  ('University of Florida',                   'Gainesville',        29.6475,      -82.345),
  ('University of Illinois Urbana-Champaign', 'Urbana',           40.110539,   -88.228411),
  ('University of Iowa',                      'Iowa City',        41.661667,   -91.536389),
  ('University of Kansas',                    'Lawrence',         38.958056,   -95.247778),
  ('University of Kentucky',                  'Lexington',          38.0325,     -84.5025),
  ('University of Maryland',                  'College Park',     38.988056,     -76.9425),
  ('University of Miami',                     'Coral Gables',     25.721644,   -80.279267),
  ('University of Michigan',                  'Ann Arbor',        42.276944,   -83.738056),
  ('University of Minnesota',                 'Minneapolis',         44.975,   -93.235278),
  ('University of Mississippi',               'Oxford',           34.365278,      -89.535),
  ('University of Missouri',                  'Columbia',           38.9453,     -92.3288),
  ('University of Nebraska–Lincoln',          'Lincoln',            40.8175,   -96.701389),
  ('University of Nevada Las Vegas',          'Las Vegas',         36.10779,   -115.14376),
  ('University of New Mexico',                'Albuquerque',       35.08389,   -106.61861),
  ('University of Notre Dame',                'South Bend',            41.7,   -86.238889),
  ('University of Oklahoma',                  'Norman',           35.208611,   -97.445833),
  ('University of Oregon',                    'Eugene',           44.044167,  -123.075833),
  ('University of South Carolina',            'Columbia',           33.9975,   -81.025278),
  ('University of Tennessee',                 'Knoxville',          35.9517,       -83.93),
  ('University of Utah',                      'Salt Lake City',   40.764167,  -111.846389),
  ('University of Vermont',                   'Burlington',         44.4775,    -73.19361),
  ('University of Virginia',                  'Charlottesville',  38.035556,   -78.503333),
  ('University of Washington',                'Seattle',          47.654167,  -122.308056),
  ('University of Wisconsin–Madison',         'Madison',          43.075278,   -89.404167),
  ('University of Wyoming',                   'Laramie',          41.313056,  -105.581389),
  ('UT Austin',                               'Austin',            30.28614,    -97.73942),
  ('Utah State University',                   'Logan',              41.7425,    -111.8125),
  ('Vanderbilt University',                   'Nashville',          36.1475,     -86.8025),
  ('Villanova University',                    'Villanova',         40.03771,    -75.33755),
  ('Virginia Tech',                           'Blacksburg',          37.225,      -80.425),
  ('Wake Forest University',                  'Winston-Salem',       36.135,      -80.277),
  ('Washington University in St. Louis',      'St. Louis',           38.648,      -90.305),
  ('West Virginia University',                'Morgantown',        39.63582,    -79.95453),
  ('Worcester Polytechnic Institute',         'Worcester',        42.273489,    -71.80735),
  ('Yale',                                    'New Haven',        41.311111,   -72.926667)
) as v(school_name, city, lat, lon)
where u.school_name = v.school_name;

-- ── 4. Deliberately left NULL ────────────────────────────────
-- No school is left without a city, latitude, or longitude. All 121 rows in
-- university_financials passed the country, state, and cross-source distance
-- checks described in the header.
--
-- photo_path and photo_credit ARE left NULL here. They are written by
-- scripts/seed-campus-photos.js, which uploads the image and records its
-- Wikimedia Commons attribution in the same statement, so a stored path can
-- never exist without its credit.
