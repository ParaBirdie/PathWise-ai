import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useSurveyStore } from '../../store/surveyStore'

export default function QuestionCard({ question, subtitle, eyebrow, headingStyle, children, onNext, canProgress, nextLabel = 'Next' }) {
  const goBack = useSurveyStore((s) => s.goBack)

  return (
    <div className="w-full">
      {/* Question header */}
      <header style={{ marginBottom: '2.5rem' }}>
        {eyebrow && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ color: '#c4b5fd', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              {eyebrow}
            </span>
            <div style={{ height: 1, flexGrow: 1, backgroundColor: 'rgba(72,72,72,0.2)' }} />
          </div>
        )}
        <h1
          className="font-bold leading-tight"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', letterSpacing: '-0.02em', color: '#e7e5e4', marginBottom: '1rem', ...headingStyle }}
        >
          {question}
        </h1>
        {subtitle && (
          <p style={{ color: '#acabaa', fontSize: '1.0625rem', lineHeight: '1.65', maxWidth: '36rem' }}>
            {subtitle}
          </p>
        )}
      </header>

      {/* Slot for question-specific UI */}
      {children}

      {/* Fixed footer with Back / Next */}
      <div
        className="fixed bottom-0 left-0 w-full flex justify-between items-center z-50"
        style={{
          padding: '1.5rem 3rem',
          backgroundColor: 'rgba(14,14,14,0.75)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(72,72,72,0.15)',
          boxShadow: '0px -24px 48px rgba(0,0,0,0.5)',
        }}
      >
        <button
          onClick={goBack}
          className="flex items-center gap-2 font-medium uppercase transition-all active:scale-95"
          style={{
            color: '#acabaa',
            letterSpacing: '0.1em',
            fontSize: '0.6875rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.375rem',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#252626'; e.currentTarget.style.color = '#ffffff' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#acabaa' }}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {onNext && (
          <motion.button
            onClick={canProgress ? onNext : undefined}
            disabled={!canProgress}
            whileTap={canProgress ? { scale: 0.97 } : {}}
            className="flex items-center gap-2 font-bold uppercase transition-all"
            style={{
              letterSpacing: '0.1em',
              fontSize: '0.6875rem',
              padding: '0.75rem 2rem',
              borderRadius: '0.375rem',
              background: canProgress
                ? 'linear-gradient(135deg, #ccbeff 0%, #4a3d7c 100%)'
                : '#1f2020',
              color: canProgress ? '#433675' : '#484848',
              cursor: canProgress ? 'pointer' : 'not-allowed',
            }}
          >
            {nextLabel}
            <ArrowRight size={14} />
          </motion.button>
        )}
      </div>
    </div>
  )
}
