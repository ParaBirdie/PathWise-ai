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

// Maps each US state to the canonical prefixes that appear in its public university names.
// This replaces the broken 4-char substring heuristic that produced false positives
// (e.g. "Georgia" matching "Georgetown University", "Virginia" matching "West Virginia University").
const STATE_SCHOOL_PREFIXES = {
  Alabama: ['university of alabama', 'auburn university'],
  Alaska: ['university of alaska'],
  Arizona: ['arizona state university', 'university of arizona'],
  Arkansas: ['university of arkansas'],
  California: ['uc ', 'cal poly', 'san diego state', 'san jose state', 'california state'],
  Colorado: ['university of colorado', 'colorado state university'],
  Connecticut: ['university of connecticut'],
  Delaware: ['university of delaware'],
  Florida: ['university of florida', 'florida state university'],
  Georgia: ['georgia tech', 'university of georgia'],
  Hawaii: ['university of hawaii'],
  Idaho: ['university of idaho'],
  Illinois: ['university of illinois', 'illinois state'],
  Indiana: ['indiana university', 'purdue university'],
  Iowa: ['university of iowa', 'iowa state university'],
  Kansas: ['university of kansas', 'kansas state university'],
  Kentucky: ['university of kentucky'],
  Louisiana: ['louisiana state university'],
  Maine: ['university of maine'],
  Maryland: ['university of maryland'],
  Massachusetts: ['umass'],
  Michigan: ['university of michigan', 'michigan state university'],
  Minnesota: ['university of minnesota'],
  Mississippi: ['university of mississippi', 'mississippi state university'],
  Missouri: ['university of missouri'],
  Montana: ['university of montana'],
  Nebraska: ['university of nebraska'],
  Nevada: ['university of nevada'],
  'New Hampshire': ['university of new hampshire'],
  'New Jersey': ['rutgers university'],
  'New Mexico': ['university of new mexico'],
  'New York': ['suny', 'cuny'],
  'North Carolina': ['unc chapel hill', 'nc state'],
  'North Dakota': ['university of north dakota'],
  Ohio: ['ohio state university', 'miami university ohio'],
  Oklahoma: ['university of oklahoma', 'oklahoma state university'],
  Oregon: ['university of oregon', 'oregon state'],
  Pennsylvania: ['penn state university'],
  'Rhode Island': ['university of rhode island'],
  'South Carolina': ['university of south carolina', 'clemson university'],
  'South Dakota': ['university of south dakota'],
  Tennessee: ['university of tennessee'],
  Texas: ['ut austin', 'texas a&m'],
  Utah: ['university of utah', 'utah state university'],
  Vermont: ['university of vermont'],
  Virginia: ['university of virginia', 'virginia tech'],
  Washington: ['university of washington'],
  'West Virginia': ['west virginia university'],
  Wisconsin: ['university of wisconsin'],
  Wyoming: ['university of wyoming'],
}

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
    // Use an explicit per-state prefix list to avoid false positives from the old
    // substring heuristics (e.g. "Georgia" falsely matched "Georgetown University").
    const statePrefixes = STATE_SCHOOL_PREFIXES[location] || []
    const probablyInState = isUS && statePrefixes.length > 0 && schools.some((s) =>
      statePrefixes.some((prefix) => s.toLowerCase().startsWith(prefix))
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
