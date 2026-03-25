import { AnimatePresence, motion } from 'framer-motion'
import { useSurveyStore } from '../../store/surveyStore'

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 24 : -24,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (direction) => ({
    x: direction > 0 ? -24 : 24,
    opacity: 0,
    transition: { duration: 0.18 },
  }),
}

export default function SurveyShell({ stepKey, children }) {
  const direction = useSurveyStore((s) => s.direction)
  const currentStep = useSurveyStore((s) => s.currentStep)
  const TOTAL_QUESTIONS = 9

  return (
    <div className="relative min-h-screen bg-[#f7f7f5] flex flex-col items-center justify-center px-6 py-20 overflow-hidden">
      {/* Progress bar */}
      {currentStep >= 1 && currentStep <= TOTAL_QUESTIONS && (
        <div className="fixed top-0 left-0 right-0 h-[2px] bg-[#e9e9e7] z-50">
          <motion.div
            className="h-full bg-[#37352f]"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / TOTAL_QUESTIONS) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      )}

      {/* Step counter */}
      {currentStep >= 1 && currentStep <= TOTAL_QUESTIONS && (
        <div className="fixed top-5 right-7 text-xs font-medium text-[#787774] z-50">
          {currentStep} / {TOTAL_QUESTIONS}
        </div>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={stepKey}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="w-full max-w-3xl"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
