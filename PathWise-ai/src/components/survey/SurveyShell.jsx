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
  const TOTAL_QUESTIONS = 10
  const progress = (currentStep / TOTAL_QUESTIONS) * 100

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#0e0e0e', color: '#e7e5e4' }}>
      {/* Top nav */}
      <nav className="fixed top-0 w-full h-16 flex items-center justify-between px-8 z-50" style={{ backgroundColor: '#0e0e0e' }}>
        <div className="text-xl font-bold tracking-tighter uppercase" style={{ color: '#c4b5fd' }}>
          MONOLITH
        </div>
        {currentStep >= 1 && currentStep <= TOTAL_QUESTIONS && (
          <div className="flex items-center gap-4">
            <span className="uppercase font-medium" style={{ color: '#acabaa', letterSpacing: '0.1em', fontSize: '0.6875rem' }}>
              Step {currentStep} of {TOTAL_QUESTIONS}
            </span>
            <div className="w-32 h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#252626' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: '#c4b5fd' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        )}
      </nav>

      {/* Main content area */}
      <main className="flex-grow flex items-center justify-center px-6" style={{ paddingTop: '5rem', paddingBottom: '6rem' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={stepKey}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full max-w-5xl"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Ambient glow */}
      <div className="fixed top-0 right-0 pointer-events-none -z-10" style={{ opacity: 0.25, padding: '2rem' }}>
        <div style={{ width: '500px', height: '500px', backgroundColor: 'rgba(196,181,253,0.08)', filter: 'blur(120px)', borderRadius: '9999px' }} />
      </div>
    </div>
  )
}
