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
 * Fetch tier, tuition (private + in/out-of-state), and location maps from
 * `university_financials`.
 * @returns {{
 *   tierMap: Record<string,string>,
 *   tuitionMap: Record<string,number>,
 *   inStateTuitionMap: Record<string,number>,
 *   outStateTuitionMap: Record<string,number>,
 *   locationStateMap: Record<string,string>
 * } | null}
 */
export async function fetchUniversityMaps() {
  if (_cache) return _cache

  try {
    const { data, error } = await supabase
      .from('university_financials')
      .select('school_name, tier, tuition_private, tuition_in_state, tuition_out_state, location_state')

    if (error || !data?.length) return null

    const tierMap = {}
    const tuitionMap = {}          // private tuition (for private schools)
    const inStateTuitionMap = {}   // public in-state tuition
    const outStateTuitionMap = {}  // public out-of-state tuition
    const locationStateMap = {}    // school → 2-letter state abbr

    data.forEach(({ school_name, tier, tuition_private, tuition_in_state, tuition_out_state, location_state }) => {
      if (!school_name) return
      if (tier) tierMap[school_name] = tier
      if (tuition_private)  tuitionMap[school_name] = tuition_private
      if (tuition_in_state) inStateTuitionMap[school_name] = tuition_in_state
      if (tuition_out_state) outStateTuitionMap[school_name] = tuition_out_state
      if (location_state)   locationStateMap[school_name] = location_state
    })

    _cache = { tierMap, tuitionMap, inStateTuitionMap, outStateTuitionMap, locationStateMap }
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
