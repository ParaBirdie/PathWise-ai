import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp } from 'lucide-react'
import { useSurveyStore } from '../../store/surveyStore'

export default function Landing() {
  const goNext = useSurveyStore((s) => s.goNext)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center min-h-screen text-center px-8"
    >
      {/* Logo mark */}
      <div className="mb-8 flex items-center justify-center w-16 h-16 rounded-xl bg-white border border-[#e9e9e7] shadow-sm">
        <TrendingUp className="w-7 h-7 text-[#37352f]" />
      </div>

      <h1
        className="text-5xl font-bold text-[#37352f] leading-none mb-4"
        style={{ letterSpacing: '-0.02em' }}
      >
        PathWise AI
      </h1>

      <p className="text-base text-[#787774] max-w-sm leading-relaxed mb-10">
        I'll ask you a few questions, then show you the 10-year financial reality of every offer on your table.
      </p>

      <button
        onClick={goNext}
        className="group inline-flex items-center gap-2.5 px-8 py-3 rounded-lg bg-[#37352f] text-white text-sm font-medium hover:bg-[#2f2c26] transition-colors duration-150 active:scale-[0.98]"
      >
        Get Started
        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </button>

      <p className="mt-12 text-xs text-[#c4c4c0]">
        Powered by the Mincerian Earnings Model · NPV-based analysis
      </p>
    </motion.div>
  )
}
