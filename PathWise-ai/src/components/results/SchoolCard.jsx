import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, BadgeCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '../../lib/npvEngine'

const TIER_LABELS = {
  elite: { label: 'Elite', color: 'text-violet-600 bg-violet-50' },
  research: { label: 'Research University', color: 'text-blue-600 bg-blue-50' },
  flagship: { label: 'State Flagship', color: 'text-emerald-600 bg-emerald-50' },
  local: { label: 'Local / Community', color: 'text-amber-600 bg-amber-50' },
}

const SCHOOL_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

export default function SchoolCard({ result, rank, color }) {
  const [showBreakdown, setShowBreakdown] = useState(false)
  const tier = TIER_LABELS[result.tier] || TIER_LABELS.flagship
  const isTop = rank === 0

  // Year-by-year breakdown (career years only, every 2 years)
  const yearlyBreakdown = useMemo(
    () => result.trajectory.filter((t) => t.phase === 'career' && t.year % 2 === 0).slice(0, 12),
    [result.trajectory]
  )

  return (
    <div className={`glass rounded-3xl overflow-hidden shadow-xl shadow-black/[0.04] ${
      isTop ? 'ring-2 ring-blue-400/40' : ''
    }`}>
      {isTop && (
        <div className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-violet-500 text-white text-xs font-medium">
          <BadgeCheck className="w-3.5 h-3.5" />
          Top Recommendation
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <h3 className="text-lg font-semibold text-[#1d1d1f]">{result.school}</h3>
            </div>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${tier.color}`}>
              {tier.label}
            </span>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-[#1d1d1f] tracking-tight">
              {formatCurrency(result.npv, true)}
            </p>
            <p className="text-xs text-[#6e6e73]">40-yr NPV</p>
          </div>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Annual Tuition', value: formatCurrency(result.annualTuition, true) },
            { label: 'Est. Aid / yr', value: formatCurrency(result.estimatedAid, true) },
            { label: 'Entry Level Pay', value: formatCurrency(result.entryWage, true) },
            { label: 'Year 10 Pay', value: formatCurrency(result.year10Wage, true) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-black/[0.03] rounded-xl px-3 py-2.5">
              <p className="text-xs text-[#6e6e73] mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-[#1d1d1f]">{value}</p>
            </div>
          ))}
        </div>

        {/* Signal vs Skill bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-[#6e6e73] mb-1.5">
            <span>Skill (Major)</span>
            <span>Signal (Brand)</span>
          </div>
          <div className="h-2 rounded-full bg-black/[0.06] overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
              style={{ width: `${result.skillWeight}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-violet-400 to-violet-500 transition-all duration-700"
              style={{ width: `${result.signalWeight}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-medium mt-1">
            <span className="text-emerald-600">{result.skillWeight}%</span>
            <span className="text-violet-600">{result.signalWeight}%</span>
          </div>
        </div>

        {/* Employment rate */}
        <div className="flex items-center justify-between text-xs text-[#6e6e73] mb-4">
          <span>Field Employment Rate</span>
          <span className="font-semibold text-[#1d1d1f]">{result.employmentRate}%</span>
        </div>

        {/* Year-by-year toggle */}
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
        >
          {showBreakdown ? 'Hide' : 'Show'} year-by-year breakdown
          {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <AnimatePresence>
          {showBreakdown && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-2xl overflow-hidden border border-black/[0.06]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-black/[0.03]">
                      <th className="text-left px-3 py-2 text-[#6e6e73] font-medium">Career Year</th>
                      <th className="text-left px-3 py-2 text-[#6e6e73] font-medium">Age</th>
                      <th className="text-right px-3 py-2 text-[#6e6e73] font-medium">Annual Wage</th>
                      <th className="text-right px-3 py-2 text-[#6e6e73] font-medium">Cum. Wealth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyBreakdown.map((row, i) => (
                      <tr key={row.year} className={i % 2 === 0 ? '' : 'bg-black/[0.02]'}>
                        <td className="px-3 py-2 text-[#3a3a3c]">Yr {row.year - 4}</td>
                        <td className="px-3 py-2 text-[#3a3a3c]">{row.age}</td>
                        <td className="px-3 py-2 text-right font-medium text-[#1d1d1f]">
                          {formatCurrency(row.wage, true)}
                        </td>
                        <td className={`px-3 py-2 text-right font-medium ${row.cumulativeWealth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {formatCurrency(row.cumulativeWealth, true)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-center text-[10px] text-black/25 py-2">
                  Simulated from BLS OES + Levels.fyi/Glassdoor salary benchmarks
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
