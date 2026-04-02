import { useState } from 'react'
import { EyeOff, Info, CircleDollarSign } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSurveyStore } from '../../store/surveyStore'
import { compareOffers, setUniversityMaps, setMajorCoefficients } from '../../lib/npvEngine'
import { fetchUniversityMaps, fetchCareerCoefficients } from '../../lib/universityService'
import { supabase } from '../../lib/supabase'
import QuestionCard from './QuestionCard'

// Maximum plausible annual grant/scholarship. Prevents arbitrarily large
// values from distorting NPV calculations and inflating result_snapshot JSONB.
const MAX_AID = 100000

export default function Q7FinancialAid() {
  const {
    schools, major, incomeBracket, residency, goals,
    setFinancialAidOffers, setComparisonResult, goNext,
  } = useSurveyStore()

  // Raw string inputs keyed by school name (e.g. "45000")
  const [inputs, setInputs] = useState({})
  // Which schools the user explicitly skipped
  const [skipped, setSkipped] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleInput = (school, raw) => {
    // Strip non-digits, then clamp to MAX_AID before storing
    const digits = raw.replace(/[^\d]/g, '')
    const clamped = digits ? String(Math.min(parseInt(digits, 10), MAX_AID)) : ''
    setInputs((prev) => ({ ...prev, [school]: clamped }))
  }

  const handleSkip = (school) => {
    setSkipped((prev) => ({ ...prev, [school]: !prev[school] }))
    if (!skipped[school]) {
      setInputs((prev) => ({ ...prev, [school]: '' }))
    }
  }

  // Format digits as XX,XXX for display
  const displayValue = (school) => {
    const digits = inputs[school]
    if (!digits) return ''
    const num = parseInt(digits, 10)
    return isNaN(num) ? '' : num.toLocaleString('en-US')
  }

  const handleFinish = async () => {
    setLoading(true)
    setError(null)

    // Build the parsed offers map: { school: number }
    // 0 means no aid (skipped, blank, or explicitly entered 0).
    const parsedOffers = {}
    schools.forEach((s) => {
      if (skipped[s]) {
        parsedOffers[s] = 0
      } else {
        const digits = inputs[s]
        const num = digits ? parseInt(digits, 10) : NaN
        parsedOffers[s] = isNaN(num) ? 0 : Math.min(num, MAX_AID)
      }
    })

    const householdIncome = incomeBracket?.value
    if (typeof householdIncome !== 'number' || householdIncome < 0) {
      setError('Please go back and select a household income range before continuing.')
      setLoading(false)
      return
    }

    try {
      // Load live data from Supabase in parallel (each falls back to static data on error)
      const [maps, coeffMap] = await Promise.all([fetchUniversityMaps(), fetchCareerCoefficients()])
      if (maps) setUniversityMaps(
        maps.tierMap,
        maps.tuitionMap,
        maps.inStateTuitionMap,
        maps.outStateTuitionMap,
        maps.locationStateMap,
      )
      if (coeffMap) setMajorCoefficients(coeffMap)

      // Run NPV comparison — per-school isInState is resolved inside compareOffers
      const result = compareOffers(
        schools,
        major,
        householdIncome,
        residency,
        goals,
        parsedOffers
      )
      setComparisonResult(result)
      setFinancialAidOffers(parsedOffers)

      // Persist to Supabase (non-blocking)
      ;(async () => {
        try {
          const { data: authData, error: authErr } = await supabase.auth.signInAnonymously()
          if (authErr) {
            console.error('[PathWise] Anonymous auth failed during session save:', authErr.message)
            return
          }
          const sessionToken = authData?.user?.id
          if (!sessionToken) return

          const { error: dbErr } = await supabase.from('survey_sessions').insert({
            session_token: sessionToken,
            schools,
            major,
            residency,
            income_bracket: incomeBracket?.label || '',
            goals,
            financial_aid_offers: parsedOffers,
            result_snapshot: {
              lifecycleDividend: result.lifecycleDividend,
              best_school: result.best.school,
              rankings: result.results.map((r) => ({
                school: r.school,
                npv: r.npv,
                tier: r.tier,
                annualTuition: r.annualTuition,
                aidUsed: r.aidUsed,
                aidSource: r.aidSource,
                netCostTotal: r.netCostTotal,
                entryWage: r.entryWage,
                year10Wage: r.year10Wage,
                compositeScore: r.compositeScore,
              })),
            },
          })
          if (dbErr) console.error('[PathWise] survey_sessions save failed:', dbErr.message, dbErr.code)
        } catch (err) {
          console.warn('[PathWise] Supabase persistence skipped:', err.message)
        }
      })()

      goNext()
    } catch (err) {
      setError('Calculation failed. Please check your inputs and try again.')
      console.error('compareOffers error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <QuestionCard
      question="How much financial aid did each school offer?"
      subtitle="Enter the annual grant from each offer letter. Leave blank for $0."
      onNext={handleFinish}
      canProgress={true}
      nextLabel={loading ? 'Calculating…' : 'See My Results'}
    >
      {/* School rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {schools.map((school) => (
          <AidRow
            key={school}
            school={school}
            skipped={!!skipped[school]}
            displayValue={displayValue(school)}
            onInput={(v) => handleInput(school, v)}
            onSkip={() => handleSkip(school)}
            yearTotal={inputs[school] ? Number(inputs[school]) : null}
          />
        ))}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: '1rem',
              padding: '0.875rem 1.25rem',
              backgroundColor: 'rgba(127,39,55,0.2)',
              border: '1px solid rgba(236,124,138,0.3)',
              borderRadius: '0.5rem',
            }}
          >
            <p style={{ fontSize: '0.8125rem', color: '#ec7c8a' }}>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-save hint */}
      <div
        style={{
          marginTop: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          opacity: 0.4,
        }}
      >
        <Info size={16} style={{ color: '#acabaa', flexShrink: 0 }} />
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#acabaa',
          }}
        >
          Values are automatically saved as you type
        </span>
      </div>
    </QuestionCard>
  )
}

function AidRow({ school, skipped, displayValue, onInput, onSkip, yearTotal }) {
  const [focused, setFocused] = useState(false)

  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        backgroundColor: '#131313',
        borderRadius: '0.5rem',
        border: focused
          ? '1px solid rgba(196,181,253,0.25)'
          : '1px solid rgba(72,72,72,0.12)',
        opacity: skipped ? 0.45 : 1,
        transition: 'border-color 0.15s ease, opacity 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Label + input */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#c4b5fd',
              marginBottom: '0.5rem',
            }}
          >
            {school}
          </label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '1.75rem',
                fontWeight: 300,
                color: '#acabaa',
                marginRight: '0.375rem',
                lineHeight: 1,
              }}
            >
              $
            </span>
            <input
              type="text"
              inputMode="numeric"
              disabled={skipped}
              value={displayValue}
              onChange={(e) => onInput(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="0.00"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '1.75rem',
                fontWeight: 500,
                color: displayValue ? '#e7e5e4' : '#252626',
                width: '100%',
                cursor: skipped ? 'not-allowed' : 'text',
              }}
            />
          </div>
        </div>

        {/* Skip button */}
        <button
          type="button"
          onClick={onSkip}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 0.875rem',
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: skipped ? '#c4b5fd' : '#9d9e9e',
            backgroundColor: skipped ? 'rgba(196,181,253,0.1)' : 'transparent',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'color 0.15s ease, background-color 0.15s ease',
          }}
          onMouseEnter={(e) => { if (!skipped) e.currentTarget.style.color = '#e7e5e4' }}
          onMouseLeave={(e) => { if (!skipped) e.currentTarget.style.color = '#9d9e9e' }}
        >
          <EyeOff size={13} />
          Skip
        </button>
      </div>

      {/* Per-year helper */}
      <AnimatePresence>
        {!skipped && yearTotal > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <CircleDollarSign size={12} style={{ color: '#4ade80', flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>
              ${yearTotal.toLocaleString('en-US')} / year
              {' · '}
              ${(yearTotal * 4).toLocaleString('en-US')} total over 4 years
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
