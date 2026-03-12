import { useState } from 'react'
import { Linkedin } from 'lucide-react'
import { useSurveyStore } from '../../store/surveyStore'
import QuestionCard from './QuestionCard'

const ALUMNI_RANGES = [
  { label: '0 – 5',    value: '0-5' },
  { label: '5 – 10',   value: '5-10' },
  { label: '10 – 20',  value: '10-20' },
  { label: '20 – 50',  value: '20-50' },
  { label: 'Above 50', value: '50+' },
]

export default function Q6Alumni() {
  const { schools, setAlumniData, goNext } = useSurveyStore()
  const [counts, setCounts] = useState({})

  const handleChange = (school, value) => {
    setCounts((prev) => ({ ...prev, [school]: value }))
  }

  const handleFinish = () => {
    setAlumniData(counts)
    goNext()
  }

  return (
    <QuestionCard
      question="LinkedIn check: alumni at your dream company?"
      subtitle="Open LinkedIn and search '[School] + [Dream Company]'. Enter the count for each school. This is optional but improves the signal score."
      onNext={handleFinish}
      canProgress={true}
      nextLabel="Continue →"
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
            <select
              value={counts[school] ?? ''}
              onChange={(e) => handleChange(school, e.target.value)}
              className="w-28 px-3 py-2.5 rounded-lg bg-white border border-[#e9e9e7] text-sm text-center text-[#37352f] outline-none focus:ring-2 focus:ring-[#37352f]/10 focus:border-[#37352f]/40 transition-all appearance-none cursor-pointer"
            >
              <option value="" disabled>Select</option>
              {ALUMNI_RANGES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-[#f7f7f5] border border-[#e9e9e7]">
        <p className="text-xs text-[#787774] leading-relaxed">
          <strong className="text-[#37352f]">How to check:</strong> Go to LinkedIn → search your dream company → click "People" → filter by alma mater.
        </p>
      </div>
    </QuestionCard>
  )
}
