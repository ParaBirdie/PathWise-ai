import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useSurveyStore } from '../../store/surveyStore'

export default function QuestionCard({ question, subtitle, children, onNext, canProgress, nextLabel = 'Continue' }) {
  const goBack = useSurveyStore((s) => s.goBack)
  const currentStep = useSurveyStore((s) => s.currentStep)

  return (
    <div className="w-full">
      {/* Back button */}
      {currentStep > 1 && (
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={goBack}
          className="flex items-center gap-1.5 text-sm text-[#787774] hover:text-[#37352f] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </motion.button>
      )}
      {currentStep === 1 && <div className="mb-6 h-6" />}

      {/* Card */}
      <div className="notion-card p-10 sm:p-12">
        <h2
          className="text-3xl sm:text-4xl font-bold text-[#37352f] leading-tight mb-3"
          style={{ letterSpacing: '-0.02em' }}
        >
          {question}
        </h2>
        {subtitle && (
          <p className="text-sm text-[#787774] leading-relaxed mb-8">{subtitle}</p>
        )}
        {!subtitle && <div className="mb-8" />}

        {children}

        {onNext && (
          <button
            onClick={onNext}
            disabled={!canProgress}
            className={`mt-8 w-full py-3.5 rounded-lg text-sm font-medium transition-colors duration-150
              ${canProgress
                ? 'bg-[#37352f] text-white hover:bg-[#2f2c26] cursor-pointer'
                : 'bg-[#f1f1ef] text-[#c4c4c0] cursor-not-allowed'
              }`}
          >
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  )
}
