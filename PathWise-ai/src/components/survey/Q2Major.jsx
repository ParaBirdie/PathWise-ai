import { useEffect } from 'react'
import {
  Code2, Cpu, TrendingUp, Stethoscope, BookOpen,
  Heart, GraduationCap, Brain, Database, HelpCircle, CheckCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useSurveyStore } from '../../store/surveyStore'
import { FIELDS_OF_STUDY } from '../../lib/economicData'
import QuestionCard from './QuestionCard'

const FIELD_META = {
  'Computer Science':        { icon: Code2 },
  'Electrical Engineering':  { icon: Cpu },
  'Business / Finance':      { icon: TrendingUp },
  'Pre-Medicine / Biology':  { icon: Stethoscope },
  'Liberal Arts / Humanities': { icon: BookOpen },
  'Nursing':                 { icon: Heart },
  'Education':               { icon: GraduationCap },
  'Psychology':              { icon: Brain },
  'Data Science / Statistics': { icon: Database },
  'Undecided':               { icon: HelpCircle },
}

const LETTERS = 'ABCDEFGHIJ'

export default function Q2Major() {
  const { major, setMajor, goNext } = useSurveyStore()

  // Enter key submits when a major is selected
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Enter' && major) goNext() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [major, goNext])

  return (
    <QuestionCard
      question={
        <>
          What&apos;s your intended <br />
          <span style={{ color: '#c4b5fd', fontStyle: 'italic' }}>field of study?</span>
        </>
      }
      subtitle="This affects your projected salary trajectory. We use this data to model your future liquidity and credit capacity."
      onNext={goNext}
      canProgress={!!major}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FIELDS_OF_STUDY.map((field, i) => {
          const Icon = FIELD_META[field]?.icon ?? HelpCircle
          const selected = major === field

          return (
            <motion.button
              key={field}
              whileTap={{ scale: 0.96 }}
              onClick={() => setMajor(field)}
              className="group flex items-center justify-between text-left transition-all duration-200"
              style={{
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: selected
                  ? '1px solid rgba(196,181,253,0.5)'
                  : '1px solid rgba(72,72,72,0.15)',
                backgroundColor: selected ? 'rgba(74,61,124,0.2)' : '#131313',
                boxShadow: selected ? '0 0 20px rgba(196,181,253,0.1)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!selected) e.currentTarget.style.backgroundColor = '#1f2020'
              }}
              onMouseLeave={(e) => {
                if (!selected) e.currentTarget.style.backgroundColor = '#131313'
              }}
            >
              <div>
                <span
                  className="block font-bold uppercase mb-1"
                  style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', color: '#c4b5fd' }}
                >
                  {LETTERS[i]}
                </span>
                <span
                  className="font-medium"
                  style={{ fontSize: '1.0625rem', color: selected ? '#c4b5fd' : '#e7e5e4' }}
                >
                  {field}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {selected && (
                  <CheckCircle
                    size={17}
                    style={{ color: '#c4b5fd' }}
                    fill="rgba(196,181,253,0.25)"
                  />
                )}
                <Icon
                  size={17}
                  style={{ color: selected ? '#c4b5fd' : '#484848', transition: 'color 0.2s' }}
                />
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Keyboard hint */}
      <div className="flex items-center gap-3" style={{ marginTop: '2.5rem', color: '#acabaa' }}>
        <span
          className="font-bold border rounded"
          style={{
            fontSize: '0.6rem',
            letterSpacing: '0.05em',
            padding: '0.25rem 0.5rem',
            backgroundColor: '#252626',
            borderColor: 'rgba(72,72,72,0.3)',
            color: '#acabaa',
          }}
        >
          ENTER
        </span>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>to submit and continue</span>
      </div>
    </QuestionCard>
  )
}
