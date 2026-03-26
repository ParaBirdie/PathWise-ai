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
  // Public research schools are intentionally excluded — their in/out-of-state
  // tuition is handled by the isInState tier-based fallback in estimateTuition()
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
  // CUNY Baruch College is public — uses tier-based in/out-of-state fallback
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
