import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useSurveyStore } from '../../store/surveyStore'

export default function Landing() {
  const goNext = useSurveyStore((s) => s.goNext)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative h-screen flex flex-col bg-[#0e0e0e] text-[#e7e5e4] overflow-hidden"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Radial gradient orb */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, rgba(196, 181, 253, 0.08) 0%, rgba(14, 14, 14, 0) 70%)',
        }}
      />

      {/* Main content */}
      <main className="relative flex-1 flex flex-col items-center px-6 overflow-hidden">
        {/* Hero */}
        <section className="relative z-10 w-full max-w-5xl mx-auto text-center flex-1 flex flex-col items-center pt-24 md:pt-28">
          <h1
            className="font-black text-[#e7e5e4] mb-8 leading-[1.05]"
            style={{
              fontSize: 'clamp(3.5rem, 8vw, 6rem)',
              letterSpacing: '-0.05em',
              textShadow: '0 0 40px rgba(196, 181, 253, 0.15)',
            }}
          >
            Your College.<br />
            Your Money.<br />
            <span className="text-[#ccbeff]">Your Future.</span>
          </h1>

          <p
            className="text-[#9d9e9e] max-w-2xl mx-auto leading-relaxed"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}
          >
            Answer 10 questions to find your optimal college and career path. Get a personalized report based on your goals and long-term financial return.
          </p>

          <div className="flex-1" />

          <div className="flex justify-center mb-12">
            <button
              onClick={goNext}
              className="group flex items-center gap-3 bg-[#ccbeff] text-[#433675] px-10 py-5 rounded-full font-bold text-lg active:scale-95 transition-all duration-200"
              style={{ boxShadow: '0 0 20px rgba(204, 190, 255, 0.3)' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = '0 0 30px rgba(204, 190, 255, 0.5)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow = '0 0 20px rgba(204, 190, 255, 0.3)')
              }
            >
              Get Started
              <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="w-full py-6 border-t"
        style={{ background: '#131313', borderColor: 'rgba(72, 72, 72, 0.15)' }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center px-10 max-w-screen-2xl mx-auto">
          <p className="text-[#acabaa] text-[0.625rem] uppercase tracking-[0.1em] mb-4 md:mb-0">
            © 2026 PathWise AI. The Monolith of Financial Clarity.
          </p>
          <div className="flex gap-8">
            {['Privacy', 'Terms', 'Institutional', 'Contact'].map((label) => (
              <a
                key={label}
                href="#"
                className="text-[#acabaa] text-[0.625rem] uppercase tracking-[0.1em] transition-colors duration-150 hover:text-[#c4b5fd]"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </motion.div>
  )
}
