import { useState } from 'react'
import { Search, Info, CornerDownLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSurveyStore } from '../../store/surveyStore'
import QuestionCard from './QuestionCard'

const US_STATES = [
  ['Alabama', 'US-AL'], ['Alaska', 'US-AK'], ['Arizona', 'US-AZ'], ['Arkansas', 'US-AR'],
  ['California', 'US-CA'], ['Colorado', 'US-CO'], ['Connecticut', 'US-CT'],
  ['Delaware', 'US-DE'], ['Florida', 'US-FL'], ['Georgia', 'US-GA'],
  ['Hawaii', 'US-HI'], ['Idaho', 'US-ID'], ['Illinois', 'US-IL'], ['Indiana', 'US-IN'],
  ['Iowa', 'US-IA'], ['Kansas', 'US-KS'], ['Kentucky', 'US-KY'], ['Louisiana', 'US-LA'],
  ['Maine', 'US-ME'], ['Maryland', 'US-MD'], ['Massachusetts', 'US-MA'],
  ['Michigan', 'US-MI'], ['Minnesota', 'US-MN'], ['Mississippi', 'US-MS'],
  ['Missouri', 'US-MO'], ['Montana', 'US-MT'], ['Nebraska', 'US-NE'],
  ['Nevada', 'US-NV'], ['New Hampshire', 'US-NH'], ['New Jersey', 'US-NJ'],
  ['New Mexico', 'US-NM'], ['New York', 'US-NY'], ['North Carolina', 'US-NC'],
  ['North Dakota', 'US-ND'], ['Ohio', 'US-OH'], ['Oklahoma', 'US-OK'],
  ['Oregon', 'US-OR'], ['Pennsylvania', 'US-PA'], ['Rhode Island', 'US-RI'],
  ['South Carolina', 'US-SC'], ['South Dakota', 'US-SD'], ['Tennessee', 'US-TN'],
  ['Texas', 'US-TX'], ['Utah', 'US-UT'], ['Vermont', 'US-VT'],
  ['Virginia', 'US-VA'], ['Washington', 'US-WA'], ['West Virginia', 'US-WV'],
  ['Wisconsin', 'US-WI'], ['Wyoming', 'US-WY'], ['Washington D.C.', 'US-DC'],
]

const COUNTRIES = [
  ['Canada', 'CA'], ['United Kingdom', 'UK'], ['Australia', 'AU'],
  ['Germany', 'DE'], ['France', 'FR'], ['India', 'IN'],
  ['China', 'CN'], ['Japan', 'JP'], ['South Korea', 'KR'],
  ['Brazil', 'BR'], ['Mexico', 'MX'], ['Other International', 'INTL'],
]

const ALL_OPTIONS = [...US_STATES, ...COUNTRIES]

export default function Q3Residency() {
  const { residency, setResidency, goNext } = useSurveyStore()
  const [query, setQuery] = useState(residency || '')
  const [open, setOpen] = useState(false)

  const filtered = query.trim().length > 0
    ? ALL_OPTIONS.filter(([name]) => name.toLowerCase().includes(query.toLowerCase())).slice(0, 4)
    : []

  const showResults = open && filtered.length > 0

  const select = ([name]) => {
    setResidency(name)
    setQuery(name)
    setOpen(false)
  }

  return (
    <QuestionCard
      eyebrow="Location Inquiry"
      question="Where are you from?"
      subtitle="Used to determine in-state tuition eligibility for each school."
      onNext={goNext}
      canProgress={!!residency}
    >
      {/* Search input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          backgroundColor: '#131313',
          border: '1px solid rgba(72,72,72,0.2)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1rem',
        }}
      >
        <Search size={22} style={{ color: '#c4b5fd', flexShrink: 0 }} />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (!e.target.value) setResidency('')
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Type your state or country..."
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            width: '100%',
            fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
            fontWeight: 300,
            color: '#e7e5e4',
          }}
        />
      </div>

      {/* Results + Info panel */}
      <AnimatePresence>
        {(showResults || true) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}
          >
            {/* Left: results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <AnimatePresence mode="wait">
                {showResults ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                  >
                    {filtered.map(([name, code], i) => {
                      const isFirst = i === 0
                      return (
                        <ResultRow
                          key={name}
                          name={name}
                          code={code}
                          isFirst={isFirst}
                          onClick={() => select([name, code])}
                        />
                      )
                    })}
                  </motion.div>
                ) : residency ? (
                  <motion.div
                    key="selected"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                  >
                    {(() => {
                      const match = ALL_OPTIONS.find(([n]) => n === residency)
                      return match ? (
                        <ResultRow
                          name={match[0]}
                          code={match[1]}
                          isFirst
                          onClick={() => {}}
                        />
                      ) : null
                    })()}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Right: info panel */}
            <div
              style={{
                backgroundColor: '#131313',
                padding: '1.5rem',
                borderLeft: '1px solid rgba(72,72,72,0.15)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                gap: '0.75rem',
              }}
            >
              <Info size={18} style={{ color: '#b6a7ee' }} fill="rgba(182,167,238,0.15)" />
              <p
                style={{
                  fontSize: '0.6875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#acabaa',
                  lineHeight: 1.8,
                }}
              >
                Residency requirements vary by institution. Providing accurate location data ensures your financial aid estimates are precise.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </QuestionCard>
  )
}

function ResultRow({ name, code, isFirst, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onMouseDown={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        backgroundColor: isFirst ? '#252626' : hovered ? '#252626' : '#131313',
        border: '1px solid rgba(72,72,72,0.05)',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: isFirst ? '#c4b5fd' : '#767575',
          }}
        >
          {code}
        </span>
        <span
          style={{
            fontSize: '1.0625rem',
            fontWeight: 500,
            color: isFirst ? '#e7e5e4' : 'rgba(231,229,228,0.8)',
          }}
        >
          {name}
        </span>
      </div>
      {isFirst && <CornerDownLeft size={14} style={{ color: '#c4b5fd' }} />}
    </button>
  )
}
