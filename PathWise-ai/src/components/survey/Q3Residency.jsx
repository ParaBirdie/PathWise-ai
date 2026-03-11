import { useState } from 'react'
import { useSurveyStore } from '../../store/surveyStore'
import QuestionCard from './QuestionCard'

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming','Washington D.C.',
]

const COUNTRIES = [
  'Canada','United Kingdom','Australia','Germany','France','India',
  'China','Japan','South Korea','Brazil','Mexico','Other International',
]

export default function Q3Residency() {
  const { residency, setResidency, schools, goNext } = useSurveyStore()
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const allOptions = [...US_STATES, ...COUNTRIES]
  const filtered = query
    ? allOptions.filter((o) => o.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : []

  const select = (location) => {
    const isUS = US_STATES.includes(location)
    // Check if any school name contains the full state name (e.g. "University of Texas" contains "Texas")
    const probablyInState = isUS && schools.some((s) =>
      s.toLowerCase().includes(location.toLowerCase())
    )
    setResidency(location, probablyInState)
    setQuery(location)
    setShowDropdown(false)
  }

  return (
    <QuestionCard
      question="Where are you from?"
      subtitle="We use this to determine in-state tuition eligibility and FAFSA context."
      onNext={goNext}
      canProgress={!!residency}
    >
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowDropdown(true)
            if (!e.target.value) setResidency('', false)
          }}
          placeholder="Search state or country..."
          className="w-full px-4 py-2.5 rounded-lg bg-white border border-[#e9e9e7] text-sm text-[#37352f] placeholder:text-[#c4c4c0] outline-none focus:ring-2 focus:ring-[#37352f]/10 focus:border-[#37352f]/40 transition-all"
        />

        {showDropdown && filtered.length > 0 && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-[#e9e9e7] rounded-lg shadow-sm z-10 overflow-hidden">
            {filtered.map((opt) => (
              <button
                key={opt}
                onMouseDown={() => select(opt)}
                className="w-full text-left px-4 py-2.5 text-sm text-[#37352f] hover:bg-[#f1f1ef] transition-colors border-b border-[#e9e9e7] last:border-0"
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>


    </QuestionCard>
  )
}
