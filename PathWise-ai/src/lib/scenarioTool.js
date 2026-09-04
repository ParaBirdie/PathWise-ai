/**
 * scenarioTool — the one tool Agent A3 can call (§5).
 *
 * The model is never allowed to produce a dollar figure. When a student asks a
 * "what if", the model calls `recompute_scenario`, this file re-runs the real
 * `compareOffers()` with the changed inputs, and the model writes prose around
 * numbers it did not invent. Money stays in `npvEngine.js`; language stays in
 * the model.
 *
 * SECURITY: `changes` is model-authored input flowing into the financial engine.
 * Every field is validated against the real enums — `MAJOR_COEFFICIENTS` keys,
 * `US_STATE_ABBR`, `PRIMARY_GOALS` values — before it reaches `compareOffers`.
 * Anything outside them is refused with `is_error: true` rather than coerced,
 * so a hallucinated major surfaces as a correctable mistake in the conversation
 * instead of silently becoming a fallback coefficient set.
 */

import { compareOffers } from './npvEngine.js'
import { MAJOR_COEFFICIENTS, US_STATE_ABBR, PRIMARY_GOALS } from './economicData.js'

/**
 * §5 gives this tool definition verbatim, but its `financialAidOffers` node —
 * `{ type: 'object', additionalProperties: { type: 'number' } }` — is an
 * open-keyed map, and the API rejects that under `strict: true`:
 *
 *   400 tools.0.custom: For 'object' type, 'additionalProperties: object' is
 *       not supported. Please set 'additionalProperties' to false
 *
 * Strict mode needs enumerated properties. That is fine here and strictly
 * better: the schools are known when the drawer opens, so they are enumerated
 * as explicit number properties and the model cannot name a school the student
 * never entered — the schema enforces it before `runScenario` even has to.
 * Everything else is §5 unchanged.
 *
 * @param {string[]} schools the schools being compared
 */
export function buildRecomputeScenarioTool(schools = []) {
  const aidProps = Object.fromEntries(
    (schools ?? []).slice(0, 4).map((s) => [s, { type: 'number' }])
  )

  return {
    name: 'recompute_scenario',
    description:
      "Re-run the financial model with one or more inputs changed, to answer " +
      "'what if' questions. Returns NPV, entry wage, and year-10 wage for every " +
      "school under the new assumptions. Call this instead of estimating.\n\n" +
      // Not in §5. The model otherwise burns a round-trip guessing "CS" before
      // the validator sends it back with the real key. `major` stays a plain
      // string rather than a schema enum on purpose: the runtime guard in
      // runScenario is the enforcement point, and it has to stay reachable.
      `major must be exactly one of: ${Object.keys(MAJOR_COEFFICIENTS).join(', ')}.`,
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['changes'],
      properties: {
        changes: {
          type: 'object',
          additionalProperties: false,
          required: [],
          properties: {
            major: { type: 'string' },
            householdIncome: { type: 'number' },
            residencyState: { type: 'string' },
            goals: { type: 'array', items: { type: 'string' } },
            financialAidOffers: {
              type: 'object',
              additionalProperties: false,
              required: [],
              properties: aidProps,
            },
          },
        },
      },
    },
  }
}

/**
 * School-agnostic base definition. Aid changes are unreachable through it
 * (no enumerated schools) — call `buildRecomputeScenarioTool(schools)` for the
 * definition actually sent to the model.
 */
export const RECOMPUTE_SCENARIO_TOOL = buildRecomputeScenarioTool()

const ALLOWED_CHANGE_KEYS = ['major', 'householdIncome', 'residencyState', 'goals', 'financialAidOffers']
const GOAL_VALUES = PRIMARY_GOALS.map((g) => g.value)
const MAX_AID = 100000        // matches the Q7 input clamp
const MAX_INCOME = 1000000

/** Thrown by the validators; caught in runScenario and returned as is_error. */
class RejectedChange extends Error {}
const reject = (msg) => { throw new RejectedChange(msg) }

/** Exact enum key first, then a case-insensitive match onto a real key. */
function resolveEnumKey(value, keys, label) {
  if (typeof value !== 'string') reject(`${label} must be a string.`)
  if (keys.includes(value)) return value
  const lower = value.trim().toLowerCase()
  const hit = keys.find((k) => k.toLowerCase() === lower)
  if (hit) return hit
  reject(
    `"${value}" is not a ${label} this model covers. Valid options are: ${keys.join(', ')}.`
  )
}

const MAJOR_KEYS = Object.keys(MAJOR_COEFFICIENTS)
const STATE_NAMES = Object.keys(US_STATE_ABBR)

/**
 * `compareOffers` takes the full state NAME (it looks it up in US_STATE_ABBR),
 * but the model is at least as likely to say "CA". Both are accepted; both
 * resolve to a real key of the same enum, so nothing unbounded gets through.
 */
function validateResidencyState(value) {
  if (typeof value !== 'string') reject('residencyState must be a string.')
  const trimmed = value.trim()
  const byName = STATE_NAMES.find((n) => n.toLowerCase() === trimmed.toLowerCase())
  if (byName) return byName
  const byAbbr = STATE_NAMES.find((n) => US_STATE_ABBR[n].toLowerCase() === trimmed.toLowerCase())
  if (byAbbr) return byAbbr
  reject(`"${value}" is not a US state this model covers.`)
}

function validateChanges(changes, baselineSchools) {
  if (changes === null || typeof changes !== 'object' || Array.isArray(changes)) {
    reject('changes must be an object.')
  }

  const unknown = Object.keys(changes).filter((k) => !ALLOWED_CHANGE_KEYS.includes(k))
  if (unknown.length) reject(`Unsupported field(s): ${unknown.join(', ')}.`)

  const out = {}

  if ('major' in changes) {
    out.major = resolveEnumKey(changes.major, MAJOR_KEYS, 'major')
  }

  if ('householdIncome' in changes) {
    const n = changes.householdIncome
    if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > MAX_INCOME) {
      reject(`householdIncome must be a number between 0 and ${MAX_INCOME}.`)
    }
    out.householdIncome = n
  }

  if ('residencyState' in changes) {
    out.residencyState = validateResidencyState(changes.residencyState)
  }

  if ('goals' in changes) {
    const g = changes.goals
    if (!Array.isArray(g) || g.length === 0 || g.length > GOAL_VALUES.length) {
      reject(`goals must be an array of 1-${GOAL_VALUES.length} values.`)
    }
    const bad = g.filter((v) => !GOAL_VALUES.includes(v))
    if (bad.length) {
      reject(`Unknown goal(s): ${bad.join(', ')}. Valid goals are: ${GOAL_VALUES.join(', ')}.`)
    }
    out.goals = [...new Set(g)]
  }

  if ('financialAidOffers' in changes) {
    const offers = changes.financialAidOffers
    if (offers === null || typeof offers !== 'object' || Array.isArray(offers)) {
      reject('financialAidOffers must be an object keyed by school name.')
    }
    const merged = {}
    for (const [school, amount] of Object.entries(offers)) {
      // The model may not introduce schools the student never entered.
      if (!baselineSchools.includes(school)) {
        reject(
          `"${school}" is not one of the schools being compared (${baselineSchools.join(', ')}).`
        )
      }
      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || amount > MAX_AID) {
        reject(`Aid for ${school} must be a number between 0 and ${MAX_AID}.`)
      }
      merged[school] = amount
    }
    out.financialAidOffers = merged
  }

  if (Object.keys(out).length === 0) reject('changes was empty — nothing to recompute.')
  return out
}

const byName = (result) => Object.fromEntries(result.results.map((r) => [r.school, r]))

/**
 * Merge validated `changes` over the student's current answers, re-run
 * `compareOffers()`, and return the deltas vs. baseline as a tool_result payload.
 *
 * Baseline is recomputed here rather than read off `comparisonResult` so both
 * sides come from the same code path — a delta is only meaningful if the two
 * runs differ by exactly the requested change.
 *
 * @param {object} changes model-authored, untrusted
 * @param {object} baselineInputs { schools, major, householdIncome, residencyState, goals, financialAidOffers }
 * @returns {{ is_error: boolean, content: string }} tool_result payload
 */
export function runScenario(changes, baselineInputs) {
  const base = baselineInputs ?? {}
  const schools = Array.isArray(base.schools) ? base.schools.slice(0, 4) : []

  if (schools.length === 0) {
    return { is_error: true, content: 'No schools are loaded, so the model cannot be re-run.' }
  }

  let safe
  try {
    safe = validateChanges(changes, schools)
  } catch (err) {
    if (err instanceof RejectedChange) return { is_error: true, content: err.message }
    throw err
  }

  const merged = {
    major: base.major,
    householdIncome: base.householdIncome,
    residencyState: base.residencyState,
    goals: Array.isArray(base.goals) && base.goals.length ? base.goals : ['maximize_roi'],
    financialAidOffers: base.financialAidOffers ?? {},
    ...safe,
    // Aid is merged per school, not replaced: "what if I got $10k more at Duke"
    // must not zero out the offers at the other three.
    ...(safe.financialAidOffers
      ? { financialAidOffers: { ...(base.financialAidOffers ?? {}), ...safe.financialAidOffers } }
      : {}),
  }

  let baseline, scenario
  try {
    baseline = compareOffers(
      schools, base.major, base.householdIncome, base.residencyState,
      base.goals, base.financialAidOffers ?? {}
    )
    scenario = compareOffers(
      schools, merged.major, merged.householdIncome, merged.residencyState,
      merged.goals, merged.financialAidOffers
    )
  } catch (err) {
    return { is_error: true, content: `The financial model could not run that scenario: ${err.message}` }
  }

  const baseByName = byName(baseline)
  const baseRank = Object.fromEntries(baseline.results.map((r, i) => [r.school, i + 1]))

  const payload = {
    changesApplied: safe,
    baselineWinner: baseline.best.school,
    scenarioWinner: scenario.best.school,
    rankingChanged: baseline.best.school !== scenario.best.school,
    schools: scenario.results.map((r, i) => {
      const b = baseByName[r.school]
      return {
        school: r.school,
        rank: i + 1,
        rankBefore: baseRank[r.school] ?? null,
        lifetimeValue: r.npv,
        lifetimeValueBefore: b?.npv ?? null,
        lifetimeValueChange: b ? r.npv - b.npv : null,
        entryWage: r.entryWage,
        entryWageBefore: b?.entryWage ?? null,
        entryWageChange: b ? r.entryWage - b.entryWage : null,
        year10Wage: r.year10Wage,
        year10WageBefore: b?.year10Wage ?? null,
        year10WageChange: b ? r.year10Wage - b.year10Wage : null,
      }
    }),
    note: 'All figures are 40-year present values in US dollars from the deterministic model. Quote them as given; do not adjust or round beyond thousands.',
  }

  return { is_error: false, content: JSON.stringify(payload) }
}
