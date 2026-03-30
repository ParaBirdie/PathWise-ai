/**
 * PathWise AI — Economic Brain
 *
 * Implements the Quartic Mincerian Earnings Model + NPV framework.
 *
 * Quartic Mincer Equation:
 *   log(y) = log(y0) + r*S + β1*X + β2*X² + β3*X³ + β4*X⁴
 *
 * Where:
 *   y0   = base wage (no schooling, no experience)
 *   r    = return to one year of schooling
 *   S    = years of schooling (4 for bachelor's)
 *   X    = years of post-schooling experience
 *   β1–4 = quartic experience-earnings coefficients
 *
 * NPV Components:
 *   Cost        = (annual_tuition × 4) − aid
 *   Opp. Cost   = 4 × $35,000 (foregone wages during college)
 *   Total Cost  = Cost + Opp. Cost (discounted)
 *   Benefit     = Sum of discounted annual earnings over 40-year horizon
 *   NPV         = Benefit − Total Cost
 */

import { MAJOR_COEFFICIENTS, UNIVERSITY_PRESTIGE, SCHOOL_TIER_MAP, SCHOOL_TUITION_MAP } from './economicData.js'

// Runtime-overridable maps — start with the static seed data from economicData.js.
// Call setUniversityMaps() (e.g. from Q6Alumni after fetching Supabase) to inject
// live DB values so newly added schools are automatically correct without a code deploy.
let _tierMap = SCHOOL_TIER_MAP
let _tuitionMap = SCHOOL_TUITION_MAP

/**
 * Override the tier and tuition maps with live data from the database.
 * DB values are merged on top of the static fallbacks, so the static data
 * still covers any school the DB query might miss.
 */
export function setUniversityMaps(tierMap, tuitionMap) {
  _tierMap = { ...SCHOOL_TIER_MAP, ...tierMap }
  _tuitionMap = { ...SCHOOL_TUITION_MAP, ...tuitionMap }
}

const DISCOUNT_RATE = 0.05
const SCHOOLING_YEARS = 4
const CAREER_YEARS = 40
const FOREGONE_WAGE = 35000
const DEFAULT_TUITION = { inState: 12000, outOfState: 36000, private: 58000 }

/**
 * Estimate annual tuition for a school name.
 * Production would query the Supabase `career_trajectories` table.
 */
export function estimateTuition(schoolName, isInState) {
  const name = schoolName?.toLowerCase() || ''
  const tier = _tierMap[schoolName] || 'flagship'

  if (name.includes('community') || name.includes('cc ')) return 5500
  if (_tuitionMap[schoolName]) return _tuitionMap[schoolName]
  if (tier === 'elite') return DEFAULT_TUITION.private
  if (tier === 'research') return isInState ? 18000 : DEFAULT_TUITION.outOfState
  return isInState ? DEFAULT_TUITION.inState : DEFAULT_TUITION.outOfState
}

/**
 * Estimate financial aid based on household income and university tier.
 */
export function estimateAid(householdIncome, schoolName) {
  const tier = _tierMap[schoolName] || 'flagship'
  const tierData = UNIVERSITY_PRESTIGE[tier] || UNIVERSITY_PRESTIGE.flagship
  const aidBase = tierData.aid_base
  const sensitivity = tierData.aid_income_sensitivity

  // Aid decreases as income increases (simplified FAFSA curve)
  const incomeRatio = Math.min(householdIncome / 60000, 3.0)
  const aid = aidBase * Math.max(0, 1 - sensitivity * (incomeRatio - 0.5) * 0.4)
  return Math.round(Math.max(0, aid))
}

/**
 * Compute the quartic Mincerian log-wage at experience year X.
 */
function mincerLogWage(coeffs, experienceYear) {
  const { y0, r, beta1, beta2, beta3, beta4 } = coeffs
  const S = SCHOOLING_YEARS
  const X = experienceYear
  return (
    Math.log(y0) +
    r * S +
    beta1 * X +
    beta2 * X ** 2 +
    beta3 * X ** 3 +
    beta4 * X ** 4
  )
}

/**
 * Build the full year-by-year trajectory for one school offer.
 * @param {string} schoolName
 * @param {string} major
 * @param {number} householdIncome
 * @param {boolean} isInState
 * @param {number} [startAge=18]
 * @param {number|null} [actualAid=null] - Actual aid from offer letter; if null, estimated from FAFSA curve
 * Returns an array of { year, age, wage, cumulativeWealth } objects.
 */
export function buildTrajectory(schoolName, major, householdIncome, isInState, startAge = 18, actualAid = null) {
  const coeffs = MAJOR_COEFFICIENTS[major] || MAJOR_COEFFICIENTS['Undecided']
  const tier = _tierMap[schoolName] || 'flagship'
  const prestige = UNIVERSITY_PRESTIGE[tier] || UNIVERSITY_PRESTIGE.flagship

  const annualTuition = estimateTuition(schoolName, isInState)
  const annualAid = (actualAid !== null && actualAid !== undefined)
    ? actualAid
    : estimateAid(householdIncome, schoolName)
  const netAnnualCost = Math.max(0, annualTuition - annualAid)

  const trajectory = []
  let cumulativeWealth = 0

  // Precompute the per-year discount factor to avoid repeated exponentiation
  const ANNUAL_DISCOUNT = 1 / (1 + DISCOUNT_RATE)
  let discountFactor = ANNUAL_DISCOUNT

  // Phase 1: College years (negative cash flow)
  for (let yr = 1; yr <= SCHOOLING_YEARS; yr++) {
    const yearCost = (netAnnualCost + FOREGONE_WAGE) * discountFactor
    cumulativeWealth -= yearCost
    trajectory.push({
      year: yr,
      phase: 'college',
      age: startAge + yr - 1,
      wage: 0,
      cost: Math.round(yearCost),
      cumulativeWealth: Math.round(cumulativeWealth),
    })
    discountFactor *= ANNUAL_DISCOUNT
  }

  // Phase 2: Career years (discountFactor is already at ANNUAL_DISCOUNT^(SCHOOLING_YEARS+1))
  for (let X = 1; X <= CAREER_YEARS; X++) {
    const calendarYear = SCHOOLING_YEARS + X

    const logWage = mincerLogWage(coeffs, X)
    const rawWage = Math.exp(logWage)
    // Apply prestige multiplier and employment-rate risk adjustment
    const adjustedWage = rawWage * prestige.multiplier * coeffs.employment_rate

    cumulativeWealth += adjustedWage * discountFactor
    trajectory.push({
      year: calendarYear,
      phase: 'career',
      age: startAge + calendarYear - 1,
      wage: Math.round(adjustedWage),
      cost: 0,
      cumulativeWealth: Math.round(cumulativeWealth),
    })
    discountFactor *= ANNUAL_DISCOUNT
  }

  return trajectory
}

/**
 * Calculate NPV for one school offer.
 * @param {string} schoolName
 * @param {string} major
 * @param {number} householdIncome
 * @param {boolean} isInState
 * @param {number|null} [actualAid=null] - Actual aid from offer letter; if null, uses FAFSA estimate
 */
export function calculateNPV(schoolName, major, householdIncome, isInState, actualAid = null) {
  const trajectory = buildTrajectory(schoolName, major, householdIncome, isInState, 18, actualAid)
  const finalEntry = trajectory[trajectory.length - 1]
  // estimateAid is already called inside buildTrajectory when actualAid is null;
  // compute it once here rather than calling it a second time.
  const estimatedAid = estimateAid(householdIncome, schoolName)
  return {
    npv: finalEntry.cumulativeWealth,
    trajectory,
    annualTuition: estimateTuition(schoolName, isInState),
    estimatedAid,
    actualAid,
    // 'actual' only when the student entered a specific positive amount
    aidSource: (actualAid !== null && actualAid > 0) ? 'actual' : 'estimated',
  }
}

/**
 * Compute a raw score for a single goal against a result object.
 */
function goalRawScore(result, goalValue) {
  switch (goalValue) {
    case 'minimize_cost':
      return -result.netCostTotal
    case 'maximize_roi':
      return result.npv
    case 'industry_fit':
      // Blend prestige importance (signalWeight) with employment rate
      return result.signalWeight * result.prestigeScore + (100 - result.signalWeight) * result.employmentRate
    case 'grad_school':
      return result.prestigeScore
    case 'prestige_optionality':
      return result.prestigeScore
    case 'program_strength':
      return result.employmentRate + result.prestigeScore * 0.5
    default:
      return result.npv
  }
}

/**
 * Compare school offers. Returns enriched comparison object.
 * @param {string[]} schools
 * @param {string} major
 * @param {number} householdIncome
 * @param {boolean} isInState
 * @param {string[]} goals - Array of PRIMARY_GOALS values; falls back to ['maximize_roi']
 * @param {Object} [financialAidOffers={}] - Map of { [schoolName]: number | null } from offer letters
 */
export function compareOffers(schools, major, householdIncome, isInState, goals = ['maximize_roi'], financialAidOffers = {}) {
  if (!Array.isArray(schools) || schools.length === 0) {
    throw new Error('compareOffers: schools must be a non-empty array')
  }
  if (typeof householdIncome !== 'number' || householdIncome < 0) {
    throw new Error('compareOffers: householdIncome must be a non-negative number')
  }

  const activeGoals = Array.isArray(goals) && goals.length > 0 ? goals : ['maximize_roi']
  const coeffs = MAJOR_COEFFICIENTS[major] || MAJOR_COEFFICIENTS['Undecided']

  const results = schools.slice(0, 4).map((school) => {
    // financialAidOffers always contains a number (0 = skipped/blank, >0 = student-entered).
    // Pass it directly so buildTrajectory uses 0 cost-of-aid when the student didn't specify.
    const actualAid = financialAidOffers[school] ?? 0
    const { npv, trajectory, annualTuition, estimatedAid, aidSource } = calculateNPV(
      school, major, householdIncome, isInState, actualAid
    )
    const tier = _tierMap[school] || 'flagship'
    const prestige = UNIVERSITY_PRESTIGE[tier] || UNIVERSITY_PRESTIGE.flagship

    const careerTrajectory = trajectory.filter((t) => t.phase === 'career')
    const entryWage = careerTrajectory[0]?.wage || 0
    const year10Wage = careerTrajectory[9]?.wage || 0

    // The aid amount actually used in the calculation.
    // Always the student's input: a positive entered amount or 0 (skip/blank).
    const aidUsed = actualAid

    // Signal vs Skill decomposition
    const skillROI = npv * (1 - coeffs.signal_weight * (1 - 1 / prestige.multiplier))
    const signalROI = npv - skillROI

    // Prestige score for goal weighting
    const tierScore = { elite: 95, research: 78, flagship: 62, local: 45 }[tier] ?? 55

    return {
      school,
      tier,
      npv: Math.round(npv),
      trajectory,
      annualTuition,
      estimatedAid,
      aidUsed,
      aidSource,
      netCostTotal: Math.round((annualTuition - aidUsed) * 4),
      entryWage,
      year10Wage,
      signalWeight: Math.round(coeffs.signal_weight * 100),
      skillWeight: Math.round((1 - coeffs.signal_weight) * 100),
      signalROI: Math.round(signalROI),
      skillROI: Math.round(skillROI),
      prestigeScore: tierScore,
      employmentRate: Math.round(coeffs.employment_rate * 100),
    }
  })

  // Compute composite score: normalize each goal's raw scores to 0–1, then average
  activeGoals.forEach((goalValue) => {
    const rawScores = results.map((r) => goalRawScore(r, goalValue))
    const minVal = Math.min(...rawScores)
    const maxVal = Math.max(...rawScores)
    const range = maxVal - minVal || 1
    results.forEach((r, i) => {
      r._compositeAccum = (r._compositeAccum || 0) + (rawScores[i] - minVal) / range
    })
  })
  results.forEach((r) => {
    r.compositeScore = parseFloat(((r._compositeAccum || 0) / activeGoals.length).toFixed(4))
    delete r._compositeAccum
  })

  results.sort((a, b) => b.compositeScore - a.compositeScore)

  const best = results[0]
  const second = results[1]
  const lifecycleDividend = second ? best.npv - second.npv : best.npv

  return { results, best, lifecycleDividend, major, coefficients: coeffs }
}

/**
 * Format currency for display.
 */
export function formatCurrency(value, compact = false) {
  if (compact) {
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}
