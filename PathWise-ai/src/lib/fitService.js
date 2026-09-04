/**
 * fitService — client half of Agent A1 (§3).
 *
 * Fetches `university_profiles` from Supabase and passes the rows into
 * POST /api/fit-score, so the serverless function stays stateless and never
 * needs Supabase credentials.
 *
 * Nothing here is allowed to break the results page. Every failure path —
 * timeout, 429, 500, malformed JSON, a school with no profile — resolves to
 * `{ scores: {}, profiles: [...] }` and the page renders NPV alone.
 */

import { fetchUniversityProfiles } from './universityService.js'
import { sanitizeFitScores, attachDerivedNotes } from './fitEngine.js'

// Measured A1 latency across nine real 4-school runs: median ~12s, worst 19.6s.
// A 20s budget clipped the tail, and a cold function start sits on top of that.
// 30s leaves real headroom while still giving up long before the function's own
// 60s ceiling (vercel.json), so the client always aborts first and cleanly.
// Past this the results page is better off with no Fit section than with a
// spinner that never resolves.
const TIMEOUT_MS = 30000

/**
 * @param {object} answers survey answers (see the §3 request contract)
 * @returns {Promise<{ scores: Record<string,object>, profiles: Array, error: string|null }>}
 */
export async function requestFitScores(answers) {
  const {
    schools = [], major = '', careerIndustry = '', careerRole = '',
    interests = '', workHours = '', greekLife = '', weatherPref = '',
    studentRatings = {}, alumniData = {}, goals = [],
  } = answers ?? {}

  if (!Array.isArray(schools) || schools.length === 0) {
    return { scores: {}, profiles: [], error: null }
  }

  const profiles = await fetchUniversityProfiles(schools)

  // No enriched school in this comparison — nothing citable, so no Fit scores.
  // This is the graceful-degradation path, not an error.
  if (profiles.length === 0) {
    return { scores: {}, profiles: [], error: null }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch('/api/fit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schools, major, careerIndustry, careerRole, interests,
        workHours, greekLife, weatherPref, studentRatings, alumniData, goals,
        profiles,
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const detail = await res.json().catch(() => ({}))
      console.warn(`[PathWise] fit-score ${res.status}:`, detail.error ?? '(no body)')
      return { scores: {}, profiles, error: detail.error ?? `HTTP ${res.status}` }
    }

    const body = await res.json()
    // Anti-hallucination guard: reasons whose factIndex does not resolve to a
    // real fact are dropped here, before anything reaches the UI. Only then are
    // the derived climate/network notes appended — they carry no factIndex by
    // design, so they must never pass through the citation filter.
    const scores = attachDerivedNotes(
      sanitizeFitScores(body.scores, profiles),
      { profiles, weatherPref, alumniData }
    )
    return { scores, profiles, error: null }
  } catch (err) {
    const reason = err?.name === 'AbortError' ? 'timeout' : (err?.message ?? 'network error')
    console.warn('[PathWise] fit-score unavailable:', reason)
    return { scores: {}, profiles, error: reason }
  } finally {
    clearTimeout(timer)
  }
}
