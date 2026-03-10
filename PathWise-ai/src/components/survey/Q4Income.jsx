import { useSurveyStore } from '../../store/surveyStore'
import { INCOME_BRACKETS } from '../../lib/economicData'
import QuestionCard from './QuestionCard'
import { motion } from 'framer-motion'

export default function Q4Income() {
  const { incomeBracket, setIncomeBracket, goNext } = useSurveyStore()

  return (
    <QuestionCard
      question="What's your household income bracket?"
      subtitle="Used to estimate your FAFSA aid eligibility and institutional grants."
      onNext={goNext}
      canProgress={!!incomeBracket}
    >
      <div className="flex flex-col gap-3">
        {INCOME_BRACKETS.map((bracket) => {
          const selected = incomeBracket?.label === bracket.label
          return (
            <motion.button
              key={bracket.label}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIncomeBracket(bracket)}
              className={`flex items-center justify-between px-5 py-3.5 rounded-lg text-sm font-medium border transition-colors duration-150
                ${selected
                  ? 'bg-[#37352f] text-white border-[#37352f]'
                  : 'bg-white text-[#37352f] border-[#e9e9e7] hover:bg-[#f1f1ef]'
                }`}
            >
              <span>{bracket.label}</span>
              {selected && (
                <span className="text-white/50 text-xs tracking-wide">Selected</span>
              )}
            </motion.button>
          )
        })}
      </div>

      <p className="mt-5 text-xs text-[#787774] leading-relaxed">
        Your income is never stored. It's used only to calculate estimated financial aid on-device.
      </p>
    </QuestionCard>
  )
}
