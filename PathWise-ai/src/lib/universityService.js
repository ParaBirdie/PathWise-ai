/**
 * universityService — Live university data from Supabase.
 *
 * Fetches tier and private tuition values from the `university_financials` table
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
 * Fetch tier and tuition maps from `university_financials`.
 * @returns {{ tierMap: Record<string,string>, tuitionMap: Record<string,number> } | null}
 */
export async function fetchUniversityMaps() {
  if (_cache) return _cache

  try {
    const { data, error } = await supabase
      .from('university_financials')
      .select('school_name, tier, tuition_private')

    if (error || !data?.length) return null

    const tierMap = {}
    const tuitionMap = {}

    data.forEach(({ school_name, tier, tuition_private }) => {
      if (school_name && tier) tierMap[school_name] = tier
      // Only store private tuition — public schools use the isInState tier fallback
      if (school_name && tuition_private) tuitionMap[school_name] = tuition_private
    })

    _cache = { tierMap, tuitionMap }
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
