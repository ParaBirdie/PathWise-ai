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
  elite: { multiplier: 1.35, aid_base: 55000, aid_income_sensitivity: 0.85 },
  // Tier 2: Strong Research (Top 50 national)
  research: { multiplier: 1.18, aid_base: 30000, aid_income_sensitivity: 0.65 },
  // Tier 3: Regional / State Flagship
  flagship: { multiplier: 1.08, aid_base: 15000, aid_income_sensitivity: 0.50 },
  // Tier 4: Community / Local
  local: { multiplier: 1.00, aid_base: 6000, aid_income_sensitivity: 0.40 },
}

export const SCHOOL_TIER_MAP = {
  // Elite
  'MIT': 'elite', 'Stanford': 'elite', 'Harvard': 'elite', 'Princeton': 'elite',
  'Yale': 'elite', 'Columbia': 'elite', 'UPenn': 'elite', 'Caltech': 'elite',
  'Duke': 'elite', 'Dartmouth': 'elite', 'Brown': 'elite', 'Cornell': 'elite',
  'Northwestern': 'elite', 'Vanderbilt': 'elite', 'Rice': 'elite', 'Notre Dame': 'elite',
  // Research
  'UCLA': 'research', 'UC Berkeley': 'research', 'Carnegie Mellon': 'research',
  'NYU': 'research', 'Georgetown': 'research', 'Tufts': 'research',
  'University of Michigan': 'research', 'UNC Chapel Hill': 'research',
  'University of Virginia': 'research', 'Boston University': 'research',
  'Northeastern': 'research', 'Emory': 'research', 'Tulane': 'research',
  'USC': 'research', 'Georgia Tech': 'research',
  // Flagship defaults — everything else
}

export const INCOME_BRACKETS = [
  { label: 'Under $30,000', value: 25000 },
  { label: '$30,000 – $60,000', value: 45000 },
  { label: '$60,000 – $100,000', value: 80000 },
  { label: '$100,000 – $150,000', value: 125000 },
  { label: 'Over $150,000', value: 175000 },
]

export const FIELDS_OF_STUDY = Object.keys(MAJOR_COEFFICIENTS)

export const PRIMARY_GOALS = [
  { value: 'roi', label: 'Maximize ROI', desc: 'Find the best financial return on my investment' },
  { value: 'prestige', label: 'Prestige & Connections', desc: 'Brand, network, and long-term signaling value' },
]
