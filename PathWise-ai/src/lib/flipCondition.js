/**
 * flipCondition — the deterministic half of Agent A2 (§4).
 *
 * The narrative card's most valuable sentence is "School B would win if your aid
 * offer there rose by about $X/yr." X is computed HERE, in JS, by bisecting
 * `compareOffers()` on the runner-up's aid until the ranking actually flips. The
 * model is handed the finished number and only writes the sentence around it.
 * Per the §0 constraint, `npvEngine.js` owns every dollar in this product; an
 * LLM-derived threshold would be unauditable.
 *
 * `npvEngine.js` is imported read-only and is not modified by this file.
 */

import { compareOffers } from './npvEngine.js'

/** Upper bound of the search, per year. Above this the sentence stops being advice. */
const MAX_AID_PER_YEAR = 80000

/** Bisection budget. 20 halvings of an $80k range resolve to well under a dollar. */
const MAX_ITERATIONS = 20

/** The answer is reported to the nearest $1k — false precision helps nobody here. */
const STEP = 1000

/**
 * Smallest extra annual aid at the runner-up school that makes it rank #1.
 *
 * `compareOffers` is monotone in a single school's aid: more aid → lower net
 * annual cost → higher NPV → higher raw goal score, while every other school's
 * min/max-normalized score can only stay flat or fall. So "does it flip?" is a
 * single false→true step over aid, which is what makes bisection valid.
 *
 * The one non-monotone edge is saturation: `buildTrajectory` clamps net cost at
 * `max(0, tuition - aid)`, so aid beyond tuition buys nothing. That shows up as
 * a plateau at the top of the range, which the `flipsAt(MAX_AID_PER_YEAR)` probe
 * already handles — a school that cannot win with tuition fully covered returns
 * `null` rather than a fabricated number.
 *
 * @param {object} surveyInputs
 * @param {string[]} surveyInputs.schools
 * @param {string}   surveyInputs.major
 * @param {number}   surveyInputs.householdIncome
 * @param {string}   surveyInputs.residencyState
 * @param {string[]} [surveyInputs.goals]
 * @param {Object<string, number>} [surveyInputs.financialAidOffers]
 * @returns {{ school: string, aidDelta: number } | null}
 *          `school` is the runner-up, `aidDelta` the extra aid per year it needs,
 *          rounded to the nearest $1k and re-verified to actually flip the
 *          ranking at that rounded value. `null` when no flip exists in range.
 */
export function findFlipThreshold(surveyInputs) {
  try {
    const {
      schools,
      major = '',
      householdIncome,
      residencyState = '',
      goals = ['maximize_roi'],
      financialAidOffers = {},
    } = surveyInputs ?? {}

    // Nothing to flip with fewer than two schools.
    if (!Array.isArray(schools) || schools.length < 2) return null
    if (!Number.isFinite(householdIncome) || householdIncome < 0) return null

    const rankWith = (school, aid) =>
      compareOffers(
        schools,
        major,
        householdIncome,
        residencyState,
        goals,
        { ...financialAidOffers, [school]: aid },
      ).results

    const base = compareOffers(schools, major, householdIncome, residencyState, goals, financialAidOffers)
    const leader = base.results[0]?.school
    const challenger = base.results[1]?.school
    if (!leader || !challenger || leader === challenger) return null

    const baseAid = Number(financialAidOffers?.[challenger]) || 0

    // A STRICT lead, not merely position #1. `compareOffers` sorts on
    // `compositeScore`, which is quantized to 1/goalCount steps across a small
    // school set — two schools and two goals can only ever score 0, 0.5 or 1.
    // At an exact tie the winner is decided by the order the schools were typed
    // in, which is not a flip anyone would recognize as one.
    const flipsAt = (aid) => {
      const ranked = rankWith(challenger, aid)
      const top = ranked[0]
      if (top?.school !== challenger) return false
      return ranked.length < 2 || top.compositeScore > ranked[1].compositeScore
    }

    // The challenger is #2 at `baseAid`, so `lo` is known-false by construction.
    if (baseAid >= MAX_AID_PER_YEAR) return null
    if (!flipsAt(MAX_AID_PER_YEAR)) return null   // no flip anywhere in range

    let lo = baseAid              // known NOT to flip
    let hi = MAX_AID_PER_YEAR     // known to flip
    for (let i = 0; i < MAX_ITERATIONS && hi - lo > 1; i++) {
      const mid = (lo + hi) / 2
      if (flipsAt(mid)) hi = mid
      else lo = mid
    }

    // Report the delta the student would have to negotiate, to the nearest $1k.
    // Rounding DOWN could land below the true threshold, so re-verify and bump —
    // the number we hand the model must be one that genuinely flips the ranking.
    let aidDelta = Math.round((hi - baseAid) / STEP) * STEP
    if (aidDelta < STEP) aidDelta = STEP
    if (!flipsAt(baseAid + aidDelta)) aidDelta += STEP
    if (!flipsAt(baseAid + aidDelta)) return null

    return { school: challenger, aidDelta }
  } catch (err) {
    // Missing university maps, a malformed store, anything — the narrative card
    // degrades to "no flip sentence" rather than taking the results page down.
    console.warn('[PathWise] flip threshold unavailable:', err?.message ?? err)
    return null
  }
}
