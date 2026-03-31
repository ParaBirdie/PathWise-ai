import { useState } from 'react'
import { GraduationCap, CircleDollarSign } from 'lucide-react'
import { useSurveyStore } from '../../store/surveyStore'
import { compareOffers, setUniversityMaps, setMajorCoefficients } from '../../lib/npvEngine'
import { fetchUniversityMaps, fetchCareerCoefficients } from '../../lib/universityService'
import { supabase } from '../../lib/supabase'
import QuestionCard from './QuestionCard'

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
    // Strip non-digits for internal storage, but keep raw for display
    const digits = raw.replace(/[^\d]/g, '')
    setInputs((prev) => ({ ...prev, [school]: digits }))
  }

  const handleSkip = (school) => {
    setSkipped((prev) => ({ ...prev, [school]: !prev[school] }))
    if (!skipped[school]) {
      setInputs((prev) => ({ ...prev, [school]: '' }))
    }
  }

  // Format digits as $XX,XXX for display
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
    // A positive integer means the student entered a specific aid amount.
    const parsedOffers = {}
    schools.forEach((s) => {
      if (skipped[s]) {
        parsedOffers[s] = 0
      } else {
        const digits = inputs[s]
        const num = digits ? parseInt(digits, 10) : NaN
        parsedOffers[s] = isNaN(num) ? 0 : num
      }
    })

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
        incomeBracket?.value || 80000,
        residency,
        goals,
        parsedOffers
      )
      setComparisonResult(result)
      setFinancialAidOffers(parsedOffers)

      // Persist to Supabase (non-blocking — failures are logged but don't stop navigation)
      try {
        const { data: authData } = await supabase.auth.signInAnonymously()
        const sessionToken = authData?.user?.id
        if (sessionToken) {
          supabase.from('survey_sessions').insert({
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
          }).then(({ error: dbErr }) => {
            if (dbErr) console.warn('[PathWise] Session save failed:', dbErr.message)
          })
        }
      } catch (supabaseErr) {
        // Supabase unavailable (e.g. env vars not set) — non-fatal
        console.warn('[PathWise] Supabase persistence skipped:', supabaseErr.message)
      }

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
      subtitle="Enter the annual grant or scholarship from each offer letter. Leave blank or click Skip to calculate with $0 aid."
      onNext={handleFinish}
      canProgress={true}
      nextLabel={loading ? 'Calculating…' : 'See My Results →'}
    >
      <div className="flex flex-col gap-3">
        {schools.map((school) => (
          <div
            key={school}
            className={`rounded-xl border transition-all ${
              skipped[school]
                ? 'bg-[#f7f7f5] border-[#e9e9e7] opacity-60'
                : 'bg-white border-[#e9e9e7]'
            }`}
          >
            <div className="flex items-center gap-4 px-4 py-3">
              {/* School icon + name */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#f1f1ef] flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-4 h-4 text-[#787774]" />
                </div>
                <span className="text-sm font-medium text-[#1d1d1f] truncate">{school}</span>
              </div>

              {/* Dollar input */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`flex items-center rounded-lg border transition-all ${
                  skipped[school]
                    ? 'bg-[#f7f7f5] border-[#e9e9e7]'
                    : 'bg-white border-[#e9e9e7] focus-within:ring-2 focus-within:ring-[#37352f]/10 focus-within:border-[#37352f]/40'
                }`}>
                  <span className="pl-3 text-sm text-[#aeaeb2]">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    disabled={skipped[school]}
                    value={displayValue(school)}
                    onChange={(e) => handleInput(school, e.target.value)}
                    placeholder="0"
                    className="w-24 px-2 py-2.5 text-sm text-right text-[#37352f] bg-transparent outline-none disabled:cursor-not-allowed"
                  />
                </div>

                {/* Skip toggle */}
                <button
                  type="button"
                  onClick={() => handleSkip(school)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                    skipped[school]
                      ? 'bg-[#37352f] text-white border-[#37352f]'
                      : 'bg-white text-[#787774] border-[#e9e9e7] hover:border-[#c7c7c5]'
                  }`}
                >
                  Skip
                </button>
              </div>
            </div>

            {/* Per-year helper text */}
            {!skipped[school] && inputs[school] && (
              <div className="px-4 pb-2.5 flex items-center gap-1.5">
                <CircleDollarSign className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                <p className="text-xs text-emerald-600">
                  ${Number(inputs[school]).toLocaleString('en-US')} / year · ${(Number(inputs[school]) * 4).toLocaleString('en-US')} total over 4 years
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <div className="mt-6 p-4 rounded-lg bg-[#f7f7f5] border border-[#e9e9e7]">
        <p className="text-xs text-[#787774] leading-relaxed">
          <strong className="text-[#37352f]">Where to find this:</strong> Check your official admissions offer letter or the financial aid portal for each school. Enter the annual grant/scholarship amount (not loans). Click <strong className="text-[#37352f]">Skip</strong> for any school where you don't have the figure — aid will be calculated as $0.
        </p>
      </div>
    </QuestionCard>
  )
}
