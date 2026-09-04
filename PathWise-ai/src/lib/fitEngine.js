/**
 * fitEngine — composition of the two independent axes (§3).
 *
 * `npvEngine.js` owns money and is deliberately untouched by this file. Agent A1
 * (`/api/fit-score`) owns fit. Nothing here calls an API: blending is pure,
 * deterministic JS so the Money ←→ Fit slider re-ranks instantly on every drag.
 *
 * The anti-hallucination guard also lives here. A1 is required to cite a
 * `factIndex` for every reason and concern; `sanitizeFitScores` drops any that
 * does not resolve to a real fact in that school's `university_profiles.facts`
 * array. A claim the model invented has no index to point at, so it never
 * reaches the screen.
 */

const clamp01 = (n) => Math.max(0, Math.min(1, n))

// Fit-axis stand-in for a school A1 could not score. Midpoint of the 0-1 scale.
const NEUTRAL_FIT = 0.5

/** Index profile rows by school name for O(1) fact lookups. */
export function indexProfiles(profiles) {
  const byName = {}
  ;(profiles ?? []).forEach((p) => {
    if (p?.school_name) byName[p.school_name] = p
  })
  return byName
}

/**
 * Drop every reason/concern whose `factIndex` does not resolve to a real fact,
 * and attach the resolved fact so the UI can render its `source_url`.
 *
 * A school whose reasons are ALL unresolvable keeps its score but shows no
 * reasons — the score stays visible, the uncitable prose does not.
 *
 * @param {Array} scores    raw `scores` array from /api/fit-score
 * @param {Object} profiles university_profiles rows (array or name-keyed object)
 * @returns {Record<string, object>} name-keyed, cleaned fit entries
 */
export function sanitizeFitScores(scores, profiles) {
  const byName = Array.isArray(profiles) ? indexProfiles(profiles) : (profiles ?? {})
  const out = {}

  ;(scores ?? []).forEach((entry) => {
    if (!entry || typeof entry.school !== 'string') return
    const facts = byName[entry.school]?.facts
    if (!Array.isArray(facts)) return

    const resolve = (item) => {
      if (!item || typeof item.text !== 'string' || !item.text.trim()) return null
      if (!Number.isInteger(item.factIndex)) return null
      const fact = facts[item.factIndex]
      if (!fact || typeof fact.claim !== 'string') return null
      return { ...item, fact }
    }

    const fitScore = Math.max(0, Math.min(100, Math.round(Number(entry.fitScore))))
    if (!Number.isFinite(fitScore)) return

    out[entry.school] = {
      school: entry.school,
      fitScore,
      headline: typeof entry.headline === 'string' ? entry.headline : '',
      reasons: (entry.reasons ?? []).map(resolve).filter(Boolean),
      concerns: (entry.concerns ?? []).map(resolve).filter(Boolean),
    }
  })

  return out
}

/**
 * Blend of the normalized 0–1 NPV composite and the 0–1 Fit score.
 * Default 50/50. Both axes stay independently visible in the UI.
 *
 * `w` is the Money ←→ Fit slider position: 0 ranks on money alone, 1 on fit
 * alone, 0.5 weights them equally.
 *
 * A school with no fit score (not in the enriched data set, or A1 skipped it)
 * sits at the midpoint of the fit scale. A zero would bury it for missing data,
 * and dropping the fit term entirely is worse still — at w=1 that lets an
 * unscored school beat a school scored 95, because its money score would be the
 * only thing left driving it. The midpoint is the neutral prior: absence of
 * evidence moves a school neither up nor down.
 *
 * @param {Array}  results    npvEngine results, each with `school` + `compositeScore`
 * @param {Object|Array} fitScores  sanitized fit entries, name-keyed or an array
 * @param {number} w          0 = all money, 1 = all fit
 * @returns {Array} new array, sorted best-first, each result carrying
 *                  `moneyScore`, `fitScore` (0–100 or null) and `blendedScore`
 */
export function blendScores(results, fitScores, w = 0.5) {
  const list = Array.isArray(results) ? results : []
  const byName = Array.isArray(fitScores) ? sanitizeFitScores(fitScores, []) : (fitScores ?? {})
  const weight = clamp01(Number.isFinite(w) ? w : 0.5)

  return list
    .map((result, i) => {
      const moneyScore = clamp01(Number(result.compositeScore) || 0)
      const entry = byName[result.school] ?? null
      const hasFit = entry && Number.isFinite(entry.fitScore)
      const fitNorm = hasFit ? clamp01(entry.fitScore / 100) : NEUTRAL_FIT

      return {
        ...result,
        moneyScore,
        fit: entry,
        fitScore: hasFit ? entry.fitScore : null,
        blendedScore: (1 - weight) * moneyScore + weight * fitNorm,
        _order: i,
      }
    })
    .sort((a, b) => (b.blendedScore - a.blendedScore) || (a._order - b._order))
    .map(({ _order, ...rest }) => rest) // eslint-disable-line no-unused-vars
}
