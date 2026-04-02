import { useState } from 'react'
import { ChevronDown, Lightbulb } from 'lucide-react'
import { motion } from 'framer-motion'
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
      question={
        <>
          LinkedIn check: alumni at your{' '}
          <span style={{ color: '#c4b5fd' }}>dream company?</span>
        </>
      }
      eyebrow="Networking Analysis"
      subtitle="Search LinkedIn for each school + dream company. Enter the count. Optional but improves accuracy."
      onNext={handleFinish}
      canProgress={true}
      nextLabel="Next"
    >
      {/* School rows */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(72,72,72,0.1)',
          borderRadius: '0.5rem',
          overflow: 'hidden',
        }}
      >
        {schools.map((school, i) => (
          <SchoolRow
            key={school}
            index={i + 1}
            school={school}
            value={counts[school] ?? ''}
            onChange={(v) => handleChange(school, v)}
            last={i === schools.length - 1}
          />
        ))}
      </div>

      {/* Tip card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          marginTop: '1.5rem',
          padding: '1.5rem',
          backgroundColor: '#000000',
          borderRadius: '0.75rem',
          border: '1px solid rgba(72,72,72,0.1)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1.25rem',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: '#1f2020',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Lightbulb size={18} style={{ color: '#c4b5fd' }} />
        </div>
        <div>
          <h4 style={{ fontWeight: 700, color: '#e7e5e4', marginBottom: '0.375rem' }}>
            Quick Search Hack
          </h4>
          <p style={{ fontSize: '0.8125rem', color: '#acabaa', lineHeight: 1.65 }}>
            Navigate to the company page on LinkedIn, click &ldquo;People,&rdquo; and filter by your school name in the search bar. This takes exactly 30 seconds per entry.
          </p>
        </div>
      </motion.div>
    </QuestionCard>
  )
}

function SchoolRow({ index, school, value, onChange, last }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
        padding: '1.5rem 2rem',
        backgroundColor: hovered ? '#1f2020' : '#131313',
        borderBottom: last ? 'none' : '1px solid rgba(72,72,72,0.1)',
        transition: 'background-color 0.15s ease',
      }}
    >
      {/* Index + school name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', minWidth: 0 }}>
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#484848',
            flexShrink: 0,
          }}
        >
          {String(index).padStart(2, '0')}
        </span>
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#e7e5e4',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {school}
        </h3>
      </div>

      {/* Select dropdown */}
      <div style={{ position: 'relative', flexShrink: 0, width: '11rem' }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#000000',
            border: 'none',
            color: value ? '#e7e5e4' : '#767575',
            fontSize: '0.875rem',
            padding: '1rem 2.75rem 1rem 1.25rem',
            borderRadius: '0.375rem',
            appearance: 'none',
            cursor: 'pointer',
            outline: 'none',
          }}
          onFocus={(e) => { e.target.style.boxShadow = '0 0 0 1px rgba(196,181,253,0.4)' }}
          onBlur={(e) => { e.target.style.boxShadow = 'none' }}
        >
          <option value="" disabled>Select range</option>
          {ALUMNI_RANGES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <ChevronDown
          size={15}
          style={{
            position: 'absolute',
            right: '0.875rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#767575',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  )
}
