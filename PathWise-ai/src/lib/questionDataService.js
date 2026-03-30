/**
 * questionDataService.js
 *
 * Handles saving and loading the Question_Data table in Supabase.
 * Every time a student completes all Q1–Q9 questions, their full
 * survey inputs and NPV result snapshot are persisted here.
 * The ResultsPage reads this table to recover results on page reload.
 *
 * To add a new question: add its field(s) to the `row` object in
 * `logQuestionData` below, then add the matching column(s) to
 * supabase/question_data.sql and run the migration.
 */

import { supabase } from './supabase'

/**
 * Persist all Q1–Q9 answers + the NPV comparison result to question_data.
 *
 * @param {object} surveyState  — snapshot of useSurveyStore state
 * @param {object} comparisonResult — return value of compareOffers()
 * @returns {Promise<{sessionToken: string|null, error: Error|null}>}
 */
export async function logQuestionData(surveyState, comparisonResult) {
  try {
    // Ensure the user has an anonymous Supabase session
    const { data: authData, error: authErr } = await supabase.auth.signInAnonymously()
    if (authErr) throw authErr

    const sessionToken = authData?.user?.id
    if (!sessionToken) throw new Error('No session token returned from anonymous auth')

    const {
      // Q1
      schools,
      // Q2
      major,
      // Q3
      residency,
      isInState,
      // Q4
      incomeBracket,
      // Q5
      goals,
      // Q6
      alumniData,
      // Q7
      financialAidOffers,
      // Q8
      studentRatings,
      // Q9
      workHours,
      interests,
      greekLife,
      weatherPref,
    } = surveyState

    const row = {
      session_token:      sessionToken,

      // Q1
      q1_schools:         schools,

      // Q2
      q2_major:           major,

      // Q3
      q3_residency:       residency || null,
      q3_is_in_state:     isInState ?? false,

      // Q4
      q4_income_label:    incomeBracket?.label || null,
      q4_income_value:    incomeBracket?.value || null,

      // Q5
      q5_goals:           goals,

      // Q6
      q6_alumni_data:     Object.keys(alumniData || {}).length > 0 ? alumniData : null,

      // Q7
      q7_financial_aid:   Object.keys(financialAidOffers || {}).length > 0
                            ? financialAidOffers
                            : null,

      // Q8
      q8_student_ratings: Object.keys(studentRatings || {}).length > 0
                            ? studentRatings
                            : null,

      // Q9
      q9_work_hours:      workHours || null,
      q9_interests:       interests || null,
      q9_greek_life:      greekLife || null,
      q9_weather_pref:    weatherPref || null,

      // Full NPV result for result recovery on page reload
      result_snapshot:    comparisonResult || null,
    }

    const { error: dbErr } = await supabase
      .from('question_data')
      .insert(row)

    if (dbErr) throw dbErr

    return { sessionToken, error: null }
  } catch (err) {
    console.warn('[PathWise] question_data save failed:', err.message)
    return { sessionToken: null, error: err }
  }
}

/**
 * Fetch the most recent question_data row for the current anonymous user.
 * Used by ResultsPage to recover the result snapshot after a page reload.
 *
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function fetchLatestQuestionData() {
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return { data: null, error: authErr }

    const { data, error: dbErr } = await supabase
      .from('question_data')
      .select('result_snapshot')
      .eq('session_token', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (dbErr) {
      // PGRST116 = no rows found — not an error worth logging
      if (dbErr.code === 'PGRST116') return { data: null, error: null }
      throw dbErr
    }

    return { data, error: null }
  } catch (err) {
    console.warn('[PathWise] question_data fetch failed:', err.message)
    return { data: null, error: err }
  }
}
