import { useSurveyStore } from '../../store/surveyStore'
import { FIELDS_OF_STUDY } from '../../lib/economicData'
import QuestionCard from './QuestionCard'
import { motion } from 'framer-motion'

export default function Q2Major() {
  const { major, setMajor, goNext } = useSurveyStore()

  return (
    <QuestionCard
      question="What's your intended field of study?"
      subtitle="This determines the Mincerian wage coefficients for your trajectory."
      onNext={goNext}
      canProgress={!!major}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELDS_OF_STUDY.map((field) => (
          <motion.button
            key={field}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMajor(field)}
            className={`w-full text-left px-6 py-4 rounded-xl text-sm font-medium border transition-colors duration-150
              ${major === field
                ? 'bg-[#37352f] text-white border-[#37352f]'
                : 'bg-white text-[#37352f] border-[#e9e9e7] hover:bg-[#f1f1ef]'
              }`}
          >
            {field}
          </motion.button>
        ))}
      </div>
    </QuestionCard>
  )
}
