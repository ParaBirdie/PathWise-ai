import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react'
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

      {/* Nav — positioned relative to the full wrapper */}
      <nav className="absolute top-12 left-12 z-50">
        <span
          className="font-black text-2xl text-[#c4b5fd]"
          style={{ letterSpacing: '-0.02em' }}
        >
          PathWise
        </span>
      </nav>

      {/* Main content — no px on main, sections handle their own padding */}
      <main className="relative flex-1 flex flex-col overflow-hidden">

        {/* Hero */}
        <section className="relative z-10 w-full max-w-5xl mx-auto text-center pt-32 px-6">
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
            Your Future.
          </h1>

          <p
            className="text-[#9d9e9e] max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}
          >
            Answer 10 questions. Get a personalized financial report for every school you're considering.
          </p>

          <div className="flex justify-center mb-20">
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

        {/* Bento grid — wider max-w, no double-padding from parent */}
        <section className="relative z-10 w-full max-w-7xl mx-auto px-12 grid grid-cols-12 gap-6 pb-20">
          {/* Left large card */}
          <div className="col-span-12 md:col-span-7 bg-[#131313] p-10 rounded-xl flex flex-col justify-end min-h-[300px]">
            <p className="text-[#ccbeff] text-xs font-bold tracking-[0.15em] uppercase mb-4">
              The Standard
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#e7e5e4] leading-tight mb-6">
              Unrivaled analysis for the next generation of institutional intelligence.
            </h2>
            <div className="w-20 h-1 bg-[#ccbeff]" />
          </div>

          {/* Right two cards */}
          <div className="col-span-12 md:col-span-5 flex flex-col gap-6">
            <div className="flex-1 bg-[#252626] p-6 rounded-xl">
              <Sparkles className="w-5 h-5 text-[#ccbeff] mb-3" />
              <h3 className="text-base font-bold text-[#e7e5e4] mb-1">Predictive Clarity</h3>
              <p className="text-[#acabaa] text-sm leading-relaxed">
                Deep learning models forecasting 4-year tuition cycles and debt ratios.
              </p>
            </div>
            <div className="flex-1 bg-[#252626] p-6 rounded-xl">
              <TrendingUp className="w-5 h-5 text-[#ccbeff] mb-3" />
              <h3 className="text-base font-bold text-[#e7e5e4] mb-1">ROI Mapping</h3>
              <p className="text-[#acabaa] text-sm leading-relaxed">
                Real-time outcome data mapped against regional economic shifts.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="w-full py-10 border-t"
        style={{ background: '#131313', borderColor: 'rgba(72, 72, 72, 0.15)' }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center px-12 max-w-screen-2xl mx-auto">
          <p className="text-[#acabaa] text-[0.625rem] uppercase tracking-[0.1em] mb-4 md:mb-0">
            © 2024 PathWise AI. The Monolith of Financial Clarity.
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
