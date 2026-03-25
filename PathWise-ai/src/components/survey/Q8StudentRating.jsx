import { useState } from 'react'
import { GraduationCap } from 'lucide-react'
import { useSurveyStore } from '../../store/surveyStore'
import QuestionCard from './QuestionCard'

const RATING_LABELS = {
  1: 'Not a fit',
  2: 'Not a fit',
  3: 'Unlikely',
  4: 'Unlikely',
  5: 'Maybe',
  6: 'Considering',
  7: 'Strong interest',
  8: 'Strong interest',
  9: 'Dream school',
  10: 'Dream school',
}

export default function Q8StudentRating() {
  const { schools, setStudentRatings, goNext } = useSurveyStore()
  const [ratings, setRatings] = useState({})

  const handleRate = (school, value) => {
    setRatings((prev) => ({ ...prev, [school]: value }))
  }

  const handleFinish = () => {
    setStudentRatings(ratings)
    goNext()
  }

  const allRated = schools.every((s) => ratings[s] !== undefined)

  return (
    <QuestionCard
      question="How would you personally rate each school?"
      subtitle="Based on your own research — campus tours, visits, online research, conversations with current students, and gut feeling. 10 is the best."
      onNext={handleFinish}
      canProgress={allRated}
      nextLabel="See My Results →"
    >
      <div className="flex flex-col gap-4">
        {schools.map((school) => {
          const rating = ratings[school]
          return (
            <div key={school} className="p-4 rounded-xl bg-white border border-[#e9e9e7]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#f1f1ef] flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-3.5 h-3.5 text-[#787774]" />
                </div>
                <span className="text-sm font-medium text-[#1d1d1f] truncate">{school}</span>
                {rating && (
                  <span className="ml-auto text-xs text-[#787774] shrink-0">
                    {RATING_LABELS[rating]}
                  </span>
                )}
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                  const selected = rating === n
                  return (
                    <button
                      key={n}
                      onClick={() => handleRate(school, n)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all duration-100
                        ${selected
                          ? 'bg-[#37352f] text-white'
                          : 'bg-[#f1f1ef] text-[#787774] hover:bg-[#e9e9e7] hover:text-[#37352f]'
                        }`}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-[#f7f7f5] border border-[#e9e9e7]">
        <p className="text-xs text-[#787774] leading-relaxed">
          <strong className="text-[#37352f]">What to consider:</strong> Campus culture, location, program quality, student life, career services, distance from home, and your overall impression from tours or research.
        </p>
      </div>
    </QuestionCard>
  )
}
