import { motion } from 'framer-motion'
import { RefreshCw, TrendingUp } from 'lucide-react'
import { useSurveyStore } from '../../store/surveyStore'
import { formatCurrency } from '../../lib/npvEngine'
import WealthChart from './WealthChart'
import SchoolCard from './SchoolCard'

const SCHOOL_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

const stagger = {
  container: { transition: { staggerChildren: 0.08 } },
  item: {
    hidden: { y: 24, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  },
}

export default function ResultsPage() {
  const { comparisonResult, major, goal, reset } = useSurveyStore()

  if (!comparisonResult) return null

  const { results, best, lifecycleDividend } = comparisonResult
  const dividendPositive = lifecycleDividend >= 0

  return (
    <div className="relative min-h-screen bg-[#f5f5f7]">
      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-purple-100/30 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-16 pb-24">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger.container}
        >
          {/* Header */}
          <motion.div variants={stagger.item} className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-xl shadow-blue-500/25 mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight mb-2">
              Your PathWise Analysis
            </h1>
            <p className="text-[#6e6e73] text-sm">
              {major} · {goal === 'roi' ? 'Maximizing ROI' : 'Prestige & Connections'} · 40-year projection
            </p>
          </motion.div>

          {/* Hero: Life-Cycle Dividend */}
          <motion.div variants={stagger.item} className="mb-6">
            <div className="glass rounded-3xl p-8 text-center shadow-xl shadow-black/[0.04]">
              <p className="text-xs font-medium text-[#aeaeb2] uppercase tracking-widest mb-2">
                Life-Cycle Dividend
              </p>
              <p className={`text-5xl sm:text-6xl font-bold tracking-tight mb-2 ${
                dividendPositive ? 'text-[#1d1d1f]' : 'text-red-500'
              }`}>
                {dividendPositive ? '+' : ''}{formatCurrency(lifecycleDividend, true)}
              </p>
              <p className="text-sm text-[#6e6e73]">
                Net wealth advantage of{' '}
                <span className="font-semibold text-[#1d1d1f]">{best.school}</span>{' '}
                over your next-best option (NPV-discounted, 40 years)
              </p>

              {/* Mini stats row */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                {[
                  { label: 'Best NPV', value: formatCurrency(best.npv, true) },
                  { label: 'Entry Wage', value: formatCurrency(best.entryWage, true) },
                  { label: 'Yr 10 Wage', value: formatCurrency(best.year10Wage, true) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-[#aeaeb2] mb-0.5">{label}</p>
                    <p className="text-base font-semibold text-[#1d1d1f]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Chart */}
          <motion.div variants={stagger.item} className="mb-6">
            <WealthChart results={results} />
          </motion.div>

          {/* School cards */}
          {results.map((result, i) => (
            <motion.div key={result.school} variants={stagger.item} className="mb-4">
              <SchoolCard result={result} rank={i} color={SCHOOL_COLORS[i % SCHOOL_COLORS.length]} />
            </motion.div>
          ))}

          {/* Methodology note */}
          <motion.div variants={stagger.item} className="glass-dark rounded-2xl p-5 mt-4">
            <p className="text-xs text-[#6e6e73] leading-relaxed">
              <strong className="text-[#1d1d1f]">Methodology:</strong> Earnings modeled via the Quartic Mincerian equation
              (Murphy & Welch, 1990). NPV uses a 5% annual discount rate, 40-year career horizon, and includes
              $35k/yr opportunity cost during college. Aid estimates are based on published FAFSA EFC curves.
              Results are educational simulations — consult a financial advisor for personalized guidance.
            </p>
          </motion.div>

          {/* Reset */}
          <motion.div variants={stagger.item} className="mt-8 text-center">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-black/10 text-sm text-[#6e6e73] hover:text-[#1d1d1f] hover:border-black/20 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Start over
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
