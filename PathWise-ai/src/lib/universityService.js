/**
 * universityService — Live university data from Supabase.
 *
 * Fetches tier, all tuition columns, and location_state from `university_financials`
 * and returns them as lookup maps compatible with npvEngine's setUniversityMaps().
 *
 * The result is cached for the session so the DB is only queried once per page load.
 * If Supabase is unreachable or returns an error, callers receive null and fall back
 * to the static maps in economicData.js — this means the app always works offline too.
 *
 * Adding new schools to the database is sufficient to make them appear correctly;
 * no code changes are needed.
 */

import { supabase } from './supabase.js'

let _cache = null

/**
 * Fetch tier, tuition (private + in/out-of-state), location, and per-school
 * prestige_multiplier from `university_financials`.
 * @returns {{
 *   tierMap: Record<string,string>,
 *   tuitionMap: Record<string,number>,
 *   inStateTuitionMap: Record<string,number>,
 *   outStateTuitionMap: Record<string,number>,
 *   locationStateMap: Record<string,string>,
 *   prestigeMultiplierMap: Record<string,number>
 * } | null}
 */
export async function fetchUniversityMaps() {
  if (_cache) return _cache

  try {
    const { data, error } = await supabase
      .from('university_financials')
      .select('school_name, tier, tuition_private, tuition_in_state, tuition_out_state, location_state, prestige_multiplier')

    if (error || !data?.length) return null

    const tierMap = {}
    const tuitionMap = {}           // private tuition (for private schools)
    const inStateTuitionMap = {}    // public in-state tuition
    const outStateTuitionMap = {}   // public out-of-state tuition
    const locationStateMap = {}     // school → 2-letter state abbr
    const prestigeMultiplierMap = {} // per-school earnings premium multiplier

    data.forEach(({ school_name, tier, tuition_private, tuition_in_state, tuition_out_state, location_state, prestige_multiplier }) => {
      if (!school_name) return
      if (tier) tierMap[school_name] = tier
      if (tuition_private)   tuitionMap[school_name] = tuition_private
      if (tuition_in_state)  inStateTuitionMap[school_name] = tuition_in_state
      if (tuition_out_state) outStateTuitionMap[school_name] = tuition_out_state
      if (location_state)    locationStateMap[school_name] = location_state
      if (prestige_multiplier != null) prestigeMultiplierMap[school_name] = Number(prestige_multiplier)
    })

    _cache = { tierMap, tuitionMap, inStateTuitionMap, outStateTuitionMap, locationStateMap, prestigeMultiplierMap }
    return _cache
  } catch {
    // Network error or Supabase misconfiguration — graceful fallback to static maps
    return null
  }
}

/** Clear the session cache (useful in tests or after a DB update). */
export function clearUniversityCache() {
  _cache = null
}

let _coeffCache = null

/**
 * Fetch Mincerian coefficients from `career_trajectories`.
 * Returns a nested map { [major]: { [tier]: coefficients } } or null on failure.
 * The DB stores log_y0 (natural log of baseline wage); we convert to raw y0
 * so the engine can call Math.log(y0) consistently.
 */
export async function fetchCareerCoefficients() {
  if (_coeffCache) return _coeffCache

  try {
    const { data, error } = await supabase
      .from('career_trajectories')
      .select('major, university_tier, log_y0, r_schooling, beta1, beta2, beta3, beta4, employment_rate, signal_weight')

    if (error || !data?.length) return null

    const coeffMap = {}
    data.forEach(({ major, university_tier, log_y0, r_schooling, beta1, beta2, beta3, beta4, employment_rate, signal_weight }) => {
      if (!major || !university_tier) return
      if (!coeffMap[major]) coeffMap[major] = {}
      coeffMap[major][university_tier] = {
        y0: Math.exp(log_y0),   // convert log_y0 → raw dollar baseline wage
        r: r_schooling,
        beta1, beta2, beta3, beta4,
        employment_rate,
        signal_weight,
      }
    })

    _coeffCache = coeffMap
    return _coeffCache
  } catch {
    return null
  }
}

/** Clear the coefficients cache (useful in tests or after a DB update). */
export function clearCoefficientsCache() {
  _coeffCache = null
}
