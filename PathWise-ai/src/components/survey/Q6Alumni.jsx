import { useState } from 'react'
import { Linkedin } from 'lucide-react'
import { useSurveyStore } from '../../store/surveyStore'
import { compareOffers } from '../../lib/npvEngine'
import QuestionCard from './QuestionCard'

export default function Q6Alumni() {
  const { schools, major, incomeBracket, isInState, goals, setAlumniData, setComparisonResult, goNext } = useSurveyStore()
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (school, value) => {
    if (value === '') {
      setCounts((prev) => ({ ...prev, [school]: '' }))
      return
    }
    const parsed = parseInt(value, 10)
    if (isNaN(parsed) || parsed < 0) return
    // Clamp to a sane maximum to prevent numeric overflow in future calculations
    setCounts((prev) => ({ ...prev, [school]: Math.min(parsed, 1_000_000) }))
  }

  const handleFinish = async () => {
    setLoading(true)
    setError(null)
    setAlumniData(counts)

    try {
      // Run the NPV comparison
      const result = compareOffers(
        schools,
        major,
        incomeBracket?.value || 80000,
        isInState,
        goals
      )
      setComparisonResult(result)
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
      question="LinkedIn check: alumni at your dream company?"
      subtitle="Open LinkedIn and search '[School] + [Dream Company]'. Enter the count for each school. This is optional but improves the signal score."
      onNext={handleFinish}
      canProgress={true}
      nextLabel={loading ? 'Calculating…' : 'See My Results →'}
    >
      <div className="flex flex-col gap-3">
        {schools.map((school) => (
          <div key={school} className="flex items-center gap-4 px-4 py-3 rounded-lg bg-white border border-[#e9e9e7]">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 rounded-lg bg-[#f1f1ef] flex items-center justify-center flex-shrink-0">
                <Linkedin className="w-4 h-4 text-[#787774]" />
              </div>
              <span className="text-sm font-medium text-[#1d1d1f] truncate">{school}</span>
            </div>
            <input
              type="number"
              min="0"
              max="1000000"
              placeholder="0"
              value={counts[school] ?? ''}
              onChange={(e) => handleChange(school, e.target.value)}
              className="w-20 px-3 py-2.5 rounded-lg bg-white border border-[#e9e9e7] text-sm text-center text-[#37352f] outline-none focus:ring-2 focus:ring-[#37352f]/10 focus:border-[#37352f]/40 transition-all"
            />
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
          <strong className="text-[#37352f]">How to check:</strong> Go to LinkedIn → search your dream company → click "People" → filter by alma mater.
        </p>
      </div>
    </QuestionCard>
  )
}
