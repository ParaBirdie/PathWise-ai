import { useEffect, useState } from 'react'
import { PiggyBank, TrendingUp, Briefcase, GraduationCap, Star, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSurveyStore } from '../../store/surveyStore'
import { PRIMARY_GOALS } from '../../lib/economicData'
import QuestionCard from './QuestionCard'

const ICONS = {
  minimize_cost: PiggyBank,
  maximize_roi: TrendingUp,
  industry_fit: Briefcase,
  grad_school: GraduationCap,
  prestige_optionality: Star,
  program_strength: BookOpen,
}

export default function Q5Goal() {
  const { goals, toggleGoal, goNext } = useSurveyStore()

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Enter' && goals.length > 0) goNext() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goals, goNext])

  return (
    <QuestionCard
      eyebrow="Question 06 of 10"
      question="What are your goals?"
      subtitle="Select all that apply — this shapes how we rank your results."
      onNext={goNext}
      canProgress={goals.length > 0}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {PRIMARY_GOALS.map(({ value, label, desc }) => {
          const Icon = ICONS[value] ?? Star
          const selected = goals.includes(value)
          return (
            <GoalCard
              key={value}
              icon={Icon}
              label={label}
              desc={desc}
              selected={selected}
              onClick={() => toggleGoal(value)}
            />
          )
        })}
      </div>

      {/* Enter hint */}
      <div
        style={{
          marginTop: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          opacity: goals.length > 0 ? 0.5 : 0.2,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#acabaa' }}>
          Press
        </span>
        <kbd
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            padding: '0.2rem 0.5rem',
            backgroundColor: '#252626',
            border: '1px solid rgba(72,72,72,0.4)',
            borderRadius: '0.25rem',
            color: '#acabaa',
            letterSpacing: '0.05em',
          }}
        >
          ENTER
        </kbd>
        <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#acabaa' }}>
          to continue
        </span>
      </div>
    </QuestionCard>
  )
}

function GoalCard({ icon: Icon, label, desc, selected, onClick }) {
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
        gap: '1.25rem',
        padding: '1.25rem 1.5rem',
        borderRadius: '0.75rem',
        backgroundColor: selected
          ? 'rgba(74,61,124,0.55)'
          : hovered ? '#1f2020' : '#131313',
        border: selected
          ? '1px solid rgba(196,181,253,0.2)'
          : '1px solid rgba(72,72,72,0.12)',
        boxShadow: selected ? '0 0 24px rgba(204,190,255,0.08)' : 'none',
        transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
      }}
    >
      {/* Icon box */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '0.5rem',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? '#c4b5fd' : '#252626',
          transition: 'background-color 0.2s ease',
        }}
      >
        <Icon
          size={20}
          style={{ color: selected ? '#433675' : '#c4b5fd' }}
        />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: '1.0625rem',
            fontWeight: 700,
            color: selected ? '#e7deff' : '#e7e5e4',
            marginBottom: '0.25rem',
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: '0.8125rem',
            color: selected ? 'rgba(231,222,255,0.65)' : '#acabaa',
            lineHeight: 1.5,
          }}
        >
          {desc}
        </p>
      </div>

      {/* Radio circle */}
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: selected
            ? '2px solid #c4b5fd'
            : hovered
              ? '2px solid rgba(196,181,253,0.45)'
              : '2px solid rgba(72,72,72,0.4)',
          transition: 'border-color 0.2s ease',
        }}
      >
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#c4b5fd' }}
          />
        )}
      </div>
    </motion.button>
  )
}
