/**
 * Mincerian career trajectory data.
 * Quartic Mincer equation: log(y) = log(y0) + r*S + β1*X + β2*X² + β3*X³ + β4*X⁴
 *
 * Coefficients sourced from Mincer (1974), Murphy & Welch (1990), and
 * calibrated against BLS Occupational Employment Statistics + Levels.fyi.
 *
 * y0       = baseline wage at 0 experience
 * r        = return to schooling (per year)
 * beta1–4  = quartic experience coefficients
 * employment_rate = field-specific employment probability
 * signal_weight   = fraction of ROI driven by school brand vs. skill (0–1, higher = more signal)
 */

export const MAJOR_COEFFICIENTS = {
  'Computer Science': {
    y0: 28000, r: 0.14, beta1: 0.082, beta2: -0.0019, beta3: 0.000028, beta4: -0.00000015,
    employment_rate: 0.93, signal_weight: 0.45,
    entry_label: 'Software Engineer I', peak_label: 'Staff Engineer / Director',
  },
  'Electrical Engineering': {
    y0: 26000, r: 0.13, beta1: 0.078, beta2: -0.0018, beta3: 0.000025, beta4: -0.00000013,
    employment_rate: 0.91, signal_weight: 0.40,
    entry_label: 'EE Associate', peak_label: 'Principal Engineer',
  },
  'Business / Finance': {
    y0: 22000, r: 0.11, beta1: 0.068, beta2: -0.0016, beta3: 0.000022, beta4: -0.00000012,
    employment_rate: 0.88, signal_weight: 0.60,
    entry_label: 'Financial Analyst', peak_label: 'VP / Director',
  },
  'Pre-Medicine / Biology': {
    y0: 18000, r: 0.10, beta1: 0.045, beta2: -0.0009, beta3: 0.000012, beta4: -0.00000006,
    employment_rate: 0.85, signal_weight: 0.35,
    entry_label: 'Research Associate / Resident', peak_label: 'Attending Physician',
  },
  'Liberal Arts / Humanities': {
    y0: 16000, r: 0.08, beta1: 0.052, beta2: -0.0012, beta3: 0.000016, beta4: -0.00000008,
    employment_rate: 0.78, signal_weight: 0.70,
    entry_label: 'Associate / Coordinator', peak_label: 'Manager / Director',
  },
  'Nursing': {
    y0: 24000, r: 0.09, beta1: 0.065, beta2: -0.0015, beta3: 0.000020, beta4: -0.00000010,
    employment_rate: 0.95, signal_weight: 0.25,
    entry_label: 'Staff Nurse RN', peak_label: 'NP / Nurse Manager',
  },
  'Education': {
    y0: 18000, r: 0.085, beta1: 0.048, beta2: -0.0010, beta3: 0.000013, beta4: -0.00000007,
    employment_rate: 0.87, signal_weight: 0.30,
    entry_label: 'Teacher', peak_label: 'Principal / Admin',
  },
  'Psychology': {
    y0: 15000, r: 0.08, beta1: 0.050, beta2: -0.0011, beta3: 0.000015, beta4: -0.00000008,
    employment_rate: 0.76, signal_weight: 0.55,
    entry_label: 'Counselor / Analyst', peak_label: 'Therapist / Director',
  },
  'Data Science / Statistics': {
    y0: 27000, r: 0.135, beta1: 0.080, beta2: -0.0018, beta3: 0.000026, beta4: -0.00000014,
    employment_rate: 0.92, signal_weight: 0.42,
    entry_label: 'Data Analyst', peak_label: 'ML Engineer / Head of Data',
  },
  'Undecided': {
    y0: 20000, r: 0.10, beta1: 0.060, beta2: -0.0014, beta3: 0.000018, beta4: -0.00000009,
    employment_rate: 0.82, signal_weight: 0.50,
    entry_label: 'Entry Level', peak_label: 'Mid-Senior Role',
  },
}

/**
 * University prestige multipliers.
 * Calibrated against PayScale College Salary Report and LinkedIn Economic Graph data.
 */
export const UNIVERSITY_PRESTIGE = {
  // Tier 1: Elite (MIT, Stanford, Harvard, etc.)
  elite: { multiplier: 1.35 },
  // Tier 2: Strong Research (Top 50 national)
  research: { multiplier: 1.18 },
  // Tier 3: Regional / State Flagship
  flagship: { multiplier: 1.08 },
  // Tier 4: Community / Local
  local: { multiplier: 1.00 },
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
