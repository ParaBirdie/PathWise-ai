/**
 * Mincerian career trajectory data.
 * Quartic Mincer equation: log(y) = log(y0) + r*S + β1*X + β2*X² + β3*X³ + β4*X⁴
 *
 * Calibrated against BLS OES, Levels.fyi top-10 firm averages, Glassdoor,
 * PayScale College Salary Report, AAMC, ABA, and IEEE salary surveys (2024).
 *
 * y0  = baseline wage anchoring absolute salary level for the field.
 *       Per-school differentiation is handled by SCHOOL_PRESTIGE_MULTIPLIER,
 *       not by different y0 values per tier — tiers share the same y0.
 * r   = return to one additional year of schooling
 * β1–4 = quartic experience-earnings profile coefficients
 * employment_rate = field employment probability (BLS)
 * signal_weight   = fraction of ROI driven by school brand vs. skill (0–1)
 */

export const MAJOR_COEFFICIENTS = {
  // Software Engineers. Entry (local baseline ~$68K), Y10 ~$130K, Y20 ~$165K.
  // Top-10 FAANG avg entry ~$155K is captured by elite prestige_multiplier (1.62-1.75).
  'Computer Science': {
    y0: 38600, r: 0.14, beta1: 0.082, beta2: -0.0019, beta3: 0.000028, beta4: -0.00000015,
    employment_rate: 0.93, signal_weight: 0.45,
    entry_label: 'Software Engineer I', peak_label: 'Staff Engineer / Director',
  },
  // EE baseline close to CS but slightly lower due to narrower industry.
  'Electrical Engineering': {
    y0: 39300, r: 0.13, beta1: 0.078, beta2: -0.0018, beta3: 0.000025, beta4: -0.00000013,
    employment_rate: 0.91, signal_weight: 0.40,
    entry_label: 'EE Associate', peak_label: 'Principal Engineer',
  },
  // Investment Banking / Finance. Steeper betas reflect IB front-loaded comp growth.
  // Entry (local) ~$55K broad avg. Elite (1.62-1.75×): GS/JPM analyst ~$170K total comp.
  // Y10 flagship ~$100K; Y10 elite ~$155K (VP-track). Y20 elite ~$215K.
  'Business / Finance': {
    y0: 36700, r: 0.11, beta1: 0.095, beta2: -0.0020, beta3: 0.000030, beta4: -0.00000016,
    employment_rate: 0.88, signal_weight: 0.60,
    entry_label: 'Financial Analyst / IB Analyst', peak_label: 'VP / Managing Director',
  },
  // Pre-Med outcome distribution (research associate, resident, attending).
  // Steeper betas model the residency→attending income inflection at ~Y8-10.
  // Entry (local) ~$48K; Y10 ~$127K; Y20 ~$223K; Y25 ~$239K (peak). Elite ~+40%.
  'Pre-Medicine / Biology': {
    y0: 30500, r: 0.12, beta1: 0.140, beta2: -0.0030, beta3: 0.000015, beta4: -0.00000003,
    employment_rate: 0.85, signal_weight: 0.35,
    entry_label: 'Research Associate / Resident', peak_label: 'Attending Physician',
  },
  // High signal_weight: brand-name degree is the primary career differentiator.
  'Liberal Arts / Humanities': {
    y0: 35400, r: 0.08, beta1: 0.052, beta2: -0.0012, beta3: 0.000016, beta4: -0.00000008,
    employment_rate: 0.78, signal_weight: 0.70,
    entry_label: 'Associate / Coordinator', peak_label: 'Manager / Director',
  },
  // Hospital pay scales are credential/experience-based, not prestige-based.
  'Nursing': {
    y0: 43400, r: 0.09, beta1: 0.065, beta2: -0.0015, beta3: 0.000020, beta4: -0.00000010,
    employment_rate: 0.95, signal_weight: 0.25,
    entry_label: 'Staff Nurse RN', peak_label: 'NP / Nurse Manager',
  },
  // Teacher pay is district-set; prestige has minimal direct wage impact.
  'Education': {
    y0: 33600, r: 0.085, beta1: 0.048, beta2: -0.0010, beta3: 0.000013, beta4: -0.00000007,
    employment_rate: 0.87, signal_weight: 0.30,
    entry_label: 'Teacher', peak_label: 'Principal / Administrator',
  },
  'Psychology': {
    y0: 38200, r: 0.08, beta1: 0.050, beta2: -0.0011, beta3: 0.000015, beta4: -0.00000008,
    employment_rate: 0.76, signal_weight: 0.55,
    entry_label: 'Counselor / Analyst', peak_label: 'Therapist / Director',
  },
  'Data Science / Statistics': {
    y0: 42200, r: 0.135, beta1: 0.080, beta2: -0.0018, beta3: 0.000026, beta4: -0.00000014,
    employment_rate: 0.92, signal_weight: 0.42,
    entry_label: 'Data Analyst', peak_label: 'ML Engineer / Head of Data',
  },
  // Very high signal_weight: Harvard Law vs. regional school gap is enormous.
  // Entry (local) ~$50K mixed (law clerk, gov, consulting).
  // Elite (1.62-1.75×): BigLaw Cravath-scale ~$215K entry modeled by prestige.
  // Y20 local ~$172K; Y20 elite ~$220K.
  'Pre-Law / Political Science': {
    y0: 37500, r: 0.10, beta1: 0.115, beta2: -0.0025, beta3: 0.000018, beta4: -0.00000006,
    employment_rate: 0.80, signal_weight: 0.75,
    entry_label: 'Law Clerk / Policy Analyst', peak_label: 'Partner / Senior Counsel',
  },
  'Undecided': {
    y0: 40100, r: 0.10, beta1: 0.060, beta2: -0.0014, beta3: 0.000018, beta4: -0.00000009,
    employment_rate: 0.82, signal_weight: 0.50,
    entry_label: 'Entry Level', peak_label: 'Mid-Senior Role',
  },
}

/**
 * Tier-level prestige multiplier fallback.
 * Used only when a school is absent from SCHOOL_PRESTIGE_MULTIPLIER and the
 * live DB value hasn't been loaded. Prefer SCHOOL_PRESTIGE_MULTIPLIER for
 * all known schools so each school gets a unique earnings premium.
 */
export const UNIVERSITY_PRESTIGE = {
  elite:    { multiplier: 1.55 },  // mid-range elite fallback
  research: { multiplier: 1.25 },  // mid-range research fallback
  flagship: { multiplier: 1.08 },
  local:    { multiplier: 1.01 },
}

/**
 * Tier-level adjustment applied on top of a major's base signal_weight.
 * Static fallback used when Supabase is unreachable; mirrors the
 * tier_signal_boost column in university_financials.
 *
 * The adjusted weight = clamp(signal_weight + boost, 0.05, 0.95).
 *
 * Elite (Ivy League, top-30): +0.15 — brand credential dominates recruiter
 *   screening in finance, consulting, and law at these schools.
 * Research (top R1): +0.07 — school name still opens doors meaningfully.
 * Flagship (state universities): −0.05 — employers weight demonstrated
 *   skills, GPA, and internships more than alma mater at this tier.
 * Local/Regional: −0.12 — hiring is almost entirely skills-based;
 *   brand signal provides minimal career differentiation.
 */
export const TIER_SIGNAL_BOOST = {
  elite:    0.15,
  research: 0.07,
  flagship: -0.05,
  local:    -0.12,
}

/**
 * Per-school prestige multiplier — static fallback used when Supabase is
 * unreachable. Mirrors the prestige_multiplier column in university_financials.
 *
 * Calibrated from PayScale College Salary Report, LinkedIn Economic Graph,
 * Glassdoor alumni earnings outcomes, and US News peer-assessment scores (2024).
 * Range: 1.00 (local/regional baseline) → 1.75 (MIT/Princeton top-tier).
 */
export const SCHOOL_PRESTIGE_MULTIPLIER = {
  // ── Elite Private ──────────────────────────────────────────────────────────
  'MIT': 1.75, 'Princeton': 1.72, 'Stanford': 1.72, 'Harvard': 1.70, 'Yale': 1.67,
  'Caltech': 1.62, 'Duke University': 1.63, 'Johns Hopkins University': 1.60,
  'Northwestern University': 1.60, 'Dartmouth College': 1.58, 'Brown University': 1.56,
  'Vanderbilt University': 1.57, 'Rice University': 1.55,
  'Washington University in St. Louis': 1.50, 'Emory University': 1.51,
  'University of Notre Dame': 1.53, 'Georgetown University': 1.50,
  'Tufts University': 1.47, 'Boston College': 1.46, 'Wake Forest University': 1.45,

  // ── Research Public ────────────────────────────────────────────────────────
  'UC Berkeley': 1.38, 'UCLA': 1.37, 'Carnegie Mellon': 1.36,
  'University of Michigan': 1.36, 'UC San Diego': 1.34,
  'University of Virginia': 1.35, 'Georgia Tech': 1.33, 'University of Florida': 1.32,
  'UNC Chapel Hill': 1.32, 'NYU': 1.30,
  'University of Illinois Urbana-Champaign': 1.30, 'UC Santa Barbara': 1.29,
  'UC Davis': 1.28, 'UC Irvine': 1.28, 'University of Wisconsin–Madison': 1.28,
  'UT Austin': 1.28, 'Boston University': 1.27, 'Tulane University': 1.26,
  'Purdue University': 1.25, 'Villanova University': 1.25,
  'Case Western Reserve University': 1.25, 'University of Maryland': 1.24,
  'Rensselaer Polytechnic Institute': 1.24, 'Lehigh University': 1.24,
  'University of Miami': 1.24, 'Ohio State University': 1.24,
  'University of Minnesota': 1.23, 'Virginia Tech': 1.23,
  'University of Washington': 1.23, 'Worcester Polytechnic Institute': 1.23,
  'Penn State University': 1.22, 'Michigan State University': 1.22,
  'University of Connecticut': 1.22, 'UMass Amherst': 1.21,
  'Rutgers University': 1.21, 'Clemson University': 1.21,
  'Indiana University Bloomington': 1.21, 'Syracuse University': 1.21,
  'UC Santa Cruz': 1.20, 'George Washington University': 1.20,
  'University of Colorado Boulder': 1.20, 'Stevens Institute of Technology': 1.20,
  'University of Denver': 1.19, 'American University': 1.19, 'Fordham University': 1.19,
  'Arizona State University': 1.18, 'Drexel University': 1.18,
  'Gonzaga University': 1.18, 'Marquette University': 1.18,
  'Seton Hall University': 1.18, 'DePaul University': 1.18,
  'Loyola University Chicago': 1.18,

  // ── Flagship State ─────────────────────────────────────────────────────────
  'Cal Poly San Luis Obispo': 1.15, 'Florida State University': 1.13,
  'SUNY Stony Brook': 1.11, 'SUNY Buffalo': 1.10, 'SUNY Binghamton': 1.10,
  'San Diego State University': 1.10,
  'San Jose State University': 1.09, 'University of Utah': 1.09,
  'University of Vermont': 1.08, 'University of Oregon': 1.08,
  'University of Arizona': 1.08, 'Miami University Ohio': 1.08,
  'Iowa State University': 1.08, 'University of Iowa': 1.08,
  'University of Missouri': 1.07, 'University of Tennessee': 1.07,
  'University of Kentucky': 1.07, 'University of Oklahoma': 1.07,
  'Louisiana State University': 1.07, 'University of South Carolina': 1.07,
  'University of Alabama': 1.07, 'Auburn University': 1.07,
  'Colorado State University': 1.07, 'University of Nebraska–Lincoln': 1.07,
  'University of Kansas': 1.06, 'Kansas State University': 1.06,
  'University of Arkansas': 1.06, 'Oklahoma State University': 1.06,
  'University of Mississippi': 1.05, 'Mississippi State University': 1.05,
  'Utah State University': 1.05, 'University of Nevada Las Vegas': 1.05,
  'University of New Mexico': 1.05, 'West Virginia University': 1.05,
  'University of Wyoming': 1.05,

  // ── Local / Regional ───────────────────────────────────────────────────────
  'Babson College': 1.08, 'Bryant University': 1.05,
  'College of the Holy Cross': 1.04, 'CUNY Baruch College': 1.03,
  'Bentley University': 1.07, 'Providence College': 1.02,
  'Fairfield University': 1.02, 'Quinnipiac University': 1.01,
  'Sacred Heart University': 1.01, 'Marist College': 1.01,
  'Hofstra University': 1.01, 'Roger Williams University': 1.00,
  'Pace University': 1.00,
}

export const SCHOOL_TIER_MAP = {
  // ── Elite Private ────────────────────────────────────────────────────────────
  'MIT': 'elite', 'Stanford': 'elite', 'Harvard': 'elite', 'Princeton': 'elite',
  'Yale': 'elite', 'Caltech': 'elite',
  'Duke University': 'elite', 'Johns Hopkins University': 'elite',
  'Northwestern University': 'elite', 'Dartmouth College': 'elite',
  'Brown University': 'elite', 'Vanderbilt University': 'elite',
  'Rice University': 'elite', 'Washington University in St. Louis': 'elite',
  'Emory University': 'elite', 'University of Notre Dame': 'elite',
  'Georgetown University': 'elite', 'Tufts University': 'elite',
  'Wake Forest University': 'elite', 'Boston College': 'elite',

  // ── Research Public ──────────────────────────────────────────────────────────
  'UC Berkeley': 'research', 'UCLA': 'research', 'Carnegie Mellon': 'research',
  'Georgia Tech': 'research', 'University of Michigan': 'research',
  'Northeastern': 'research', 'NYU': 'research',
  'University of Virginia': 'research', 'UNC Chapel Hill': 'research',
  'University of Wisconsin–Madison': 'research',
  'University of Illinois Urbana-Champaign': 'research',
  'Ohio State University': 'research', 'Penn State University': 'research',
  'Purdue University': 'research', 'University of Washington': 'research',
  'Arizona State University': 'research', 'Michigan State University': 'research',
  'UC San Diego': 'research', 'UC Davis': 'research', 'UC Santa Barbara': 'research',
  'UC Irvine': 'research', 'UC Santa Cruz': 'research',
  'UT Austin': 'research', 'University of Florida': 'research',
  'UMass Amherst': 'research', 'Rutgers University': 'research',
  'Virginia Tech': 'research', 'University of Maryland': 'research',
  'University of Colorado Boulder': 'research',
  'Indiana University Bloomington': 'research',
  'University of Minnesota': 'research', 'Clemson University': 'research',
  'University of Connecticut': 'research',

  // ── Research Private ─────────────────────────────────────────────────────────
  'Boston University': 'research', 'George Washington University': 'research',
  'American University': 'research', 'Fordham University': 'research',
  'Villanova University': 'research', 'Case Western Reserve University': 'research',
  'Rensselaer Polytechnic Institute': 'research',
  'Worcester Polytechnic Institute': 'research',
  'Stevens Institute of Technology': 'research', 'Lehigh University': 'research',
  'Drexel University': 'research', 'Syracuse University': 'research',
  'Tulane University': 'research', 'University of Miami': 'research',
  'University of Denver': 'research', 'Gonzaga University': 'research',
  'Marquette University': 'research', 'Seton Hall University': 'research',
  'DePaul University': 'research', 'Loyola University Chicago': 'research',

  // ── Local / Regional ─────────────────────────────────────────────────────────
  // These would otherwise fall back to 'flagship' which is incorrect
  'Babson College': 'local', 'Bentley University': 'local',
  'Providence College': 'local', 'College of the Holy Cross': 'local',
  'Fairfield University': 'local', 'Quinnipiac University': 'local',
  'Sacred Heart University': 'local', 'Marist College': 'local',
  'Bryant University': 'local', 'Roger Williams University': 'local',
  'Hofstra University': 'local', 'Pace University': 'local',
  'CUNY Baruch College': 'local',

  // ── Flagship State ───────────────────────────────────────────────────────────
  // Listed explicitly for clarity; matches the 'flagship' default fallback
  'Florida State University': 'flagship', 'University of Alabama': 'flagship',
  'Auburn University': 'flagship', 'Iowa State University': 'flagship',
  'University of Iowa': 'flagship', 'University of Kansas': 'flagship',
  'Kansas State University': 'flagship', 'University of Missouri': 'flagship',
  'University of Tennessee': 'flagship', 'University of Kentucky': 'flagship',
  'University of Arkansas': 'flagship', 'University of Oklahoma': 'flagship',
  'Oklahoma State University': 'flagship', 'Louisiana State University': 'flagship',
  'University of South Carolina': 'flagship', 'University of Vermont': 'flagship',
  'University of Oregon': 'flagship', 'University of Arizona': 'flagship',
  'Miami University Ohio': 'flagship', 'Colorado State University': 'flagship',
  'University of Utah': 'flagship', 'Utah State University': 'flagship',
  'University of Nevada Las Vegas': 'flagship', 'University of New Mexico': 'flagship',
  'West Virginia University': 'flagship', 'University of Mississippi': 'flagship',
  'Mississippi State University': 'flagship', 'University of Nebraska–Lincoln': 'flagship',
  'University of Wyoming': 'flagship',
  'SUNY Buffalo': 'flagship', 'SUNY Stony Brook': 'flagship', 'SUNY Binghamton': 'flagship',
  'Cal Poly San Luis Obispo': 'flagship',
  'San Diego State University': 'flagship', 'San Jose State University': 'flagship',
}

export const SCHOOL_TUITION_MAP = {
  // ── Elite Private — tuition_private from schema.sql ──────────────────────────
  'MIT': 57986, 'Stanford': 56169, 'Harvard': 57261, 'Princeton': 57690, 'Yale': 59950,
  'Caltech': 63411, 'Duke University': 63054, 'Johns Hopkins University': 63340,
  'Northwestern University': 63468, 'Dartmouth College': 62430, 'Brown University': 65146,
  'Vanderbilt University': 60348, 'Rice University': 54960,
  'Washington University in St. Louis': 61750, 'Emory University': 58280,
  'University of Notre Dame': 62693, 'Georgetown University': 62532,
  'Tufts University': 65222, 'Wake Forest University': 62930, 'Boston College': 64208,

  // ── Research Private — tuition_private from schema.sql ───────────────────────
  // Public research schools are excluded here — their in/out-of-state tuition
  // is covered by SCHOOL_IN_STATE_TUITION_MAP / SCHOOL_OUT_STATE_TUITION_MAP below.
  'Carnegie Mellon': 58924, 'Northeastern': 59154, 'NYU': 58168,
  'Boston University': 61050, 'George Washington University': 62560,
  'American University': 54506, 'Fordham University': 58194,
  'Villanova University': 62240, 'Case Western Reserve University': 59870,
  'Rensselaer Polytechnic Institute': 60285, 'Worcester Polytechnic Institute': 57460,
  'Stevens Institute of Technology': 60410, 'Lehigh University': 62730,
  'Drexel University': 57560, 'Syracuse University': 59106,
  'Tulane University': 62608, 'University of Miami': 58322,
  'University of Denver': 57162, 'Gonzaga University': 51510,
  'Marquette University': 46380, 'Seton Hall University': 44656,
  'DePaul University': 41424, 'Loyola University Chicago': 48600,

  // ── Local / Regional Private — tuition_private from schema.sql ───────────────
  'Babson College': 55656, 'Bentley University': 55760,
  'Providence College': 54490, 'College of the Holy Cross': 58620,
  'Fairfield University': 54950, 'Quinnipiac University': 51630,
  'Sacred Heart University': 47490, 'Marist College': 43740,
  'Bryant University': 51992, 'Roger Williams University': 39748,
  'Hofstra University': 52480, 'Pace University': 48100,
  // CUNY Baruch College is public — covered by SCHOOL_IN_STATE_TUITION_MAP below
}

/**
 * In-state tuition for public schools.
 * Values match tuition_in_state in schema.sql → university_financials.
 */
export const SCHOOL_IN_STATE_TUITION_MAP = {
  // ── Research Public ──────────────────────────────────────────────────────────
  'UC Berkeley': 14312, 'UCLA': 13249, 'Georgia Tech': 12424,
  'University of Michigan': 16736, 'University of Virginia': 18886,
  'UNC Chapel Hill': 8998, 'University of Wisconsin–Madison': 11205,
  'University of Illinois Urbana-Champaign': 16040, 'Ohio State University': 11936,
  'Penn State University': 18985, 'Purdue University': 10002,
  'University of Washington': 12643, 'Arizona State University': 11038,
  'Michigan State University': 15188, 'UC San Diego': 14989, 'UC Davis': 14992,
  'UC Santa Barbara': 14901, 'UC Irvine': 13727, 'UC Santa Cruz': 14401,
  'UT Austin': 11020, 'University of Florida': 6381, 'UMass Amherst': 16091,
  'Rutgers University': 17239, 'Virginia Tech': 13891, 'University of Maryland': 11505,
  'University of Colorado Boulder': 12904, 'Indiana University Bloomington': 10533,
  'University of Minnesota': 16155, 'Clemson University': 15316,
  'University of Connecticut': 16384,
  // ── Flagship State ───────────────────────────────────────────────────────────
  'Florida State University': 5656, 'University of Alabama': 11100,
  'Auburn University': 11180, 'Iowa State University': 10095,
  'University of Iowa': 9860, 'University of Kansas': 10092,
  'Kansas State University': 9874, 'University of Missouri': 12140,
  'University of Tennessee': 13244, 'University of Kentucky': 13440,
  'University of Arkansas': 9290, 'University of Oklahoma': 9957,
  'Oklahoma State University': 9046, 'Louisiana State University': 10082,
  'University of South Carolina': 12688, 'University of Vermont': 19032,
  'University of Oregon': 13698, 'University of Arizona': 12457,
  'Miami University Ohio': 16368, 'Colorado State University': 12328,
  'University of Utah': 9284, 'Utah State University': 7980,
  'University of Nevada Las Vegas': 8312, 'University of New Mexico': 8530,
  'West Virginia University': 8976, 'University of Mississippi': 8780,
  'Mississippi State University': 8764, 'University of Nebraska–Lincoln': 9890,
  'University of Wyoming': 5880,
  'SUNY Buffalo': 9688, 'SUNY Stony Brook': 9680, 'SUNY Binghamton': 9617,
  'Cal Poly San Luis Obispo': 9727, 'San Diego State University': 7824,
  'San Jose State University': 7936, 'CUNY Baruch College': 7600,
}

/**
 * Out-of-state tuition for public schools.
 * Values match tuition_out_state in schema.sql → university_financials.
 */
export const SCHOOL_OUT_STATE_TUITION_MAP = {
  // ── Research Public ──────────────────────────────────────────────────────────
  'UC Berkeley': 44066, 'UCLA': 43022, 'Georgia Tech': 33794,
  'University of Michigan': 53232, 'University of Virginia': 54094,
  'UNC Chapel Hill': 37366, 'University of Wisconsin–Madison': 39378,
  'University of Illinois Urbana-Champaign': 34312, 'Ohio State University': 35019,
  'Penn State University': 37716, 'Purdue University': 29794,
  'University of Washington': 41997, 'Arizona State University': 28996,
  'Michigan State University': 42516, 'UC San Diego': 44989, 'UC Davis': 44966,
  'UC Santa Barbara': 44875, 'UC Irvine': 43701, 'UC Santa Cruz': 44375,
  'UT Austin': 40022, 'University of Florida': 28658, 'UMass Amherst': 37591,
  'Rutgers University': 35509, 'Virginia Tech': 33708, 'University of Maryland': 40307,
  'University of Colorado Boulder': 38994, 'Indiana University Bloomington': 37970,
  'University of Minnesota': 34132, 'Clemson University': 38550,
  'University of Connecticut': 40684,
  // ── Flagship State ───────────────────────────────────────────────────────────
  'Florida State University': 21683, 'University of Alabama': 29400,
  'Auburn University': 31008, 'Iowa State University': 27099,
  'University of Iowa': 32372, 'University of Kansas': 27878,
  'Kansas State University': 27124, 'University of Missouri': 29812,
  'University of Tennessee': 32162, 'University of Kentucky': 31000,
  'University of Arkansas': 24354, 'University of Oklahoma': 28126,
  'Oklahoma State University': 25346, 'Louisiana State University': 28522,
  'University of South Carolina': 34726, 'University of Vermont': 47112,
  'University of Oregon': 38226, 'University of Arizona': 37890,
  'Miami University Ohio': 36448, 'Colorado State University': 33778,
  'University of Utah': 31422, 'Utah State University': 25246,
  'University of Nevada Las Vegas': 23862, 'University of New Mexico': 25994,
  'West Virginia University': 24552, 'University of Mississippi': 24708,
  'Mississippi State University': 23734, 'University of Nebraska–Lincoln': 25730,
  'University of Wyoming': 20790,
  'SUNY Buffalo': 27098, 'SUNY Stony Brook': 27070, 'SUNY Binghamton': 27007,
  'Cal Poly San Luis Obispo': 21887, 'San Diego State University': 19984,
  'San Jose State University': 20096, 'CUNY Baruch College': 15480,
}

/**
 * Maps public school name → 2-letter US state abbreviation.
 * Used to derive per-school isInState by comparing against the student's residency state.
 */
export const SCHOOL_LOCATION_STATE_MAP = {
  // ── Research Public ──────────────────────────────────────────────────────────
  'UC Berkeley': 'CA', 'UCLA': 'CA', 'UC San Diego': 'CA', 'UC Davis': 'CA',
  'UC Santa Barbara': 'CA', 'UC Irvine': 'CA', 'UC Santa Cruz': 'CA',
  'Georgia Tech': 'GA', 'University of Michigan': 'MI',
  'University of Virginia': 'VA', 'UNC Chapel Hill': 'NC',
  'University of Wisconsin–Madison': 'WI',
  'University of Illinois Urbana-Champaign': 'IL', 'Ohio State University': 'OH',
  'Penn State University': 'PA', 'Purdue University': 'IN',
  'University of Washington': 'WA', 'Arizona State University': 'AZ',
  'Michigan State University': 'MI', 'UT Austin': 'TX',
  'University of Florida': 'FL', 'UMass Amherst': 'MA',
  'Rutgers University': 'NJ', 'Virginia Tech': 'VA',
  'University of Maryland': 'MD', 'University of Colorado Boulder': 'CO',
  'Indiana University Bloomington': 'IN', 'University of Minnesota': 'MN',
  'Clemson University': 'SC', 'University of Connecticut': 'CT',
  // ── Flagship State ───────────────────────────────────────────────────────────
  'Florida State University': 'FL', 'University of Alabama': 'AL',
  'Auburn University': 'AL', 'Iowa State University': 'IA',
  'University of Iowa': 'IA', 'University of Kansas': 'KS',
  'Kansas State University': 'KS', 'University of Missouri': 'MO',
  'University of Tennessee': 'TN', 'University of Kentucky': 'KY',
  'University of Arkansas': 'AR', 'University of Oklahoma': 'OK',
  'Oklahoma State University': 'OK', 'Louisiana State University': 'LA',
  'University of South Carolina': 'SC', 'University of Vermont': 'VT',
  'University of Oregon': 'OR', 'University of Arizona': 'AZ',
  'Miami University Ohio': 'OH', 'Colorado State University': 'CO',
  'University of Utah': 'UT', 'Utah State University': 'UT',
  'University of Nevada Las Vegas': 'NV', 'University of New Mexico': 'NM',
  'West Virginia University': 'WV', 'University of Mississippi': 'MS',
  'Mississippi State University': 'MS', 'University of Nebraska–Lincoln': 'NE',
  'University of Wyoming': 'WY',
  'SUNY Buffalo': 'NY', 'SUNY Stony Brook': 'NY', 'SUNY Binghamton': 'NY',
  'Cal Poly San Luis Obispo': 'CA', 'San Diego State University': 'CA',
  'San Jose State University': 'CA', 'CUNY Baruch College': 'NY',
}

/**
 * Maps full US state/territory name (as stored in surveyStore.residency) to
 * the 2-letter abbreviation used in SCHOOL_LOCATION_STATE_MAP.
 */
export const US_STATE_ABBR = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY', 'Washington D.C.': 'DC',
}

export const INCOME_BRACKETS = [
  { label: 'Under $30,000', value: 25000 },
  { label: '$30,000 – $60,000', value: 45000 },
  { label: '$60,000 – $100,000', value: 80000 },
  { label: '$100,000 – $150,000', value: 125000 },
  { label: 'Over $150,000', value: 175000 },
]

export const FIELDS_OF_STUDY = Object.keys(MAJOR_COEFFICIENTS)

export const SCHOOL_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

export const PRIMARY_GOALS = [
  { value: 'minimize_cost', label: 'Minimize Total Cost', desc: 'Pay as little as possible — in-state tuition, net price, and scholarship access' },
  { value: 'maximize_roi', label: 'Maximize ROI', desc: 'Find the best lifetime financial return on my investment' },
  { value: 'industry_fit', label: 'Industry Fit', desc: 'Get into my target career — prestige matters more for finance, skills more for tech' },
  { value: 'grad_school', label: 'Grad School Pipeline', desc: 'Maximize my odds of getting into a top PhD, MD, or JD program' },
  { value: 'prestige_optionality', label: 'Prestige & Optionality', desc: 'Keep all doors open with a brand-name diploma and strong alumni network' },
  { value: 'program_strength', label: 'Academic Program Strength', desc: 'Find the best department and faculty for my specific major' },
]
