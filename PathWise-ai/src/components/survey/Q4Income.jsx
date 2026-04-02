import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSurveyStore } from '../../store/surveyStore'
import { INCOME_BRACKETS } from '../../lib/economicData'
import QuestionCard from './QuestionCard'

const LETTERS = 'ABCDE'

export default function Q4Income() {
  const { incomeBracket, setIncomeBracket, goNext } = useSurveyStore()

  return (
    <QuestionCard
      question="What's your household income bracket?"
      subtitle="Used to estimate your FAFSA aid eligibility and institutional grants."
      onNext={goNext}
      canProgress={!!incomeBracket}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {INCOME_BRACKETS.map((bracket, i) => {
          const selected = incomeBracket?.label === bracket.label
          return (
            <IncomeRow
              key={bracket.label}
              letter={LETTERS[i]}
              label={bracket.label}
              selected={selected}
              onClick={() => setIncomeBracket(bracket)}
            />
          )
        })}
      </div>

      {/* Decorative watermark */}
      <div
        style={{
          marginTop: '3.5rem',
          opacity: 0.07,
          textAlign: 'center',
          fontWeight: 900,
          fontSize: 'clamp(2rem, 8vw, 4rem)',
          letterSpacing: '-0.02em',
          color: '#c4b5fd',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        FINANCIAL SAFE WORK
      </div>
    </QuestionCard>
  )
}

function IncomeRow({ letter, label, selected, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.375rem 1.5rem',
        borderRadius: '0.375rem',
        backgroundColor: selected ? '#252626' : hovered ? '#1f2020' : '#131313',
        border: selected ? '1px solid rgba(196,181,253,0.2)' : '1px solid transparent',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        cursor: 'pointer',
      }}
    >
      {/* Left: letter + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: selected ? '#c4b5fd' : hovered ? '#c4b5fd' : '#acabaa',
            transition: 'color 0.15s ease',
            minWidth: '1rem',
          }}
        >
          {letter}
        </span>
        <span
          style={{
            fontSize: '1.1875rem',
            fontWeight: 500,
            color: selected ? '#ffffff' : '#e7e5e4',
          }}
        >
          {label}
        </span>
      </div>

      {/* Right: radio circle */}
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: selected
            ? '2px solid #c4b5fd'
            : hovered
              ? '2px solid rgba(196,181,253,0.5)'
              : '2px solid rgba(72,72,72,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'border-color 0.15s ease',
        }}
      >
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#c4b5fd',
            }}
          />
        )}
      </div>
    </motion.button>
  )
}
