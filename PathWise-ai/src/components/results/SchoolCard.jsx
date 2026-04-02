import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, BadgeCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '../../lib/npvEngine'
import { SCHOOL_COLORS } from '../../lib/economicData'

const TIER_LABELS = {
  elite:    { label: 'Elite' },
  research: { label: 'Research University' },
  flagship: { label: 'State Flagship' },
  local:    { label: 'Local / Community' },
}

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
    <div
      style={{
        backgroundColor: '#131313',
        borderRadius: '0.875rem',
        overflow: 'hidden',
        border: isTop
          ? '1px solid rgba(196,181,253,0.35)'
          : '1px solid rgba(72,72,72,0.15)',
        boxShadow: isTop ? '0 0 32px rgba(196,181,253,0.08)' : 'none',
      }}
    >
      {/* Top recommendation banner */}
      {isTop && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.625rem 1.5rem',
            background: 'linear-gradient(135deg, #ccbeff 0%, #4a3d7c 100%)',
            color: '#433675', fontSize: '0.6875rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}
        >
          <BadgeCheck size={14} />
          Top Recommendation
        </div>
      )}

      <div style={{ padding: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color, display: 'inline-block', flexShrink: 0 }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#e7e5e4' }}>
                {result.school}
              </h3>
            </div>
            <span
              style={{
                display: 'inline-block',
                padding: '0.2rem 0.625rem',
                borderRadius: '9999px',
                fontSize: '0.625rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                backgroundColor: 'rgba(196,181,253,0.12)',
                color: '#c4b5fd',
                border: '1px solid rgba(196,181,253,0.2)',
              }}
            >
              {tier.label}
            </span>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#e7e5e4', lineHeight: 1 }}>
              {formatCurrency(result.npv, true)}
            </p>
            <p style={{ fontSize: '0.6875rem', color: '#767575', marginTop: '0.25rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
              40-yr NPV
            </p>
          </div>
        </div>

        {/* Key metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.625rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Annual Tuition', value: formatCurrency(result.annualTuition, true), highlight: false },
            {
              label: result.aidUsed > 0 ? 'Your Aid / yr ✓' : 'Aid / yr',
              value: formatCurrency(result.aidUsed, true),
              highlight: result.aidUsed > 0,
            },
            { label: 'Entry Level Pay', value: formatCurrency(result.entryWage, true), highlight: false },
            { label: 'Year 10 Pay', value: formatCurrency(result.year10Wage, true), highlight: false },
          ].map(({ label, value, highlight }) => (
            <div
              key={label}
              style={{
                borderRadius: '0.5rem',
                padding: '0.875rem 1rem',
                backgroundColor: highlight ? 'rgba(74,222,128,0.08)' : '#1f2020',
                border: highlight ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(72,72,72,0.1)',
              }}
            >
              <p style={{ fontSize: '0.6875rem', marginBottom: '0.25rem', color: highlight ? '#4ade80' : '#767575', fontWeight: 600, letterSpacing: '0.04em' }}>
                {label}
              </p>
              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: highlight ? '#4ade80' : '#e7e5e4' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Signal vs Skill bar */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#767575', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '0.04em' }}>
            <span>Skill (Major)</span>
            <span>Signal (Brand)</span>
          </div>
          <div style={{ height: 6, borderRadius: '9999px', backgroundColor: '#1f2020', overflow: 'hidden', display: 'flex' }}>
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #4ade80, #22c55e)',
                transition: 'width 0.7s ease',
                width: `${result.skillWeight}%`,
              }}
            />
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #a78bfa, #c4b5fd)',
                transition: 'width 0.7s ease',
                width: `${result.signalWeight}%`,
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', fontWeight: 700, marginTop: '0.375rem' }}>
            <span style={{ color: '#4ade80' }}>{result.skillWeight}%</span>
            <span style={{ color: '#c4b5fd' }}>{result.signalWeight}%</span>
          </div>
        </div>

        {/* Employment rate */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: '0.6875rem', color: '#767575', marginBottom: '1.25rem',
            padding: '0.75rem 1rem', backgroundColor: '#1f2020', borderRadius: '0.375rem',
            letterSpacing: '0.04em', fontWeight: 600,
          }}
        >
          <span>Field Employment Rate</span>
          <span style={{ fontWeight: 700, color: '#e7e5e4', fontSize: '0.875rem' }}>{result.employmentRate}%</span>
        </div>

        {/* Expand to see full report toggle */}
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            padding: '0.875rem',
            borderRadius: '0.5rem',
            backgroundColor: showBreakdown ? 'rgba(196,181,253,0.1)' : 'transparent',
            border: '1px solid rgba(72,72,72,0.2)',
            color: showBreakdown ? '#c4b5fd' : '#acabaa',
            fontSize: '0.75rem', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease, color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!showBreakdown) { e.currentTarget.style.backgroundColor = '#1f2020'; e.currentTarget.style.color = '#e7e5e4' }
          }}
          onMouseLeave={(e) => {
            if (!showBreakdown) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#acabaa' }
          }}
        >
          {showBreakdown ? 'Collapse Report' : 'Expand to See Full Report'}
          {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Year-by-year breakdown */}
        <AnimatePresence>
          {showBreakdown && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden' }}
            >
              <div
                style={{
                  marginTop: '1rem',
                  borderRadius: '0.625rem',
                  overflow: 'hidden',
                  border: '1px solid rgba(72,72,72,0.15)',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1f2020' }}>
                      {['Career Year', 'Age', 'Annual Wage', 'Cum. Wealth'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '0.625rem 0.875rem',
                            textAlign: h === 'Annual Wage' || h === 'Cum. Wealth' ? 'right' : 'left',
                            color: '#767575', fontWeight: 600,
                            letterSpacing: '0.05em', textTransform: 'uppercase',
                            fontSize: '0.625rem',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyBreakdown.map((row, i) => (
                      <tr
                        key={row.year}
                        style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                      >
                        <td style={{ padding: '0.625rem 0.875rem', color: '#acabaa' }}>Yr {row.year - 4}</td>
                        <td style={{ padding: '0.625rem 0.875rem', color: '#acabaa' }}>{row.age}</td>
                        <td style={{ padding: '0.625rem 0.875rem', textAlign: 'right', fontWeight: 600, color: '#e7e5e4' }}>
                          {formatCurrency(row.wage, true)}
                        </td>
                        <td style={{ padding: '0.625rem 0.875rem', textAlign: 'right', fontWeight: 600, color: row.cumulativeWealth >= 0 ? '#4ade80' : '#ec7c8a' }}>
                          {formatCurrency(row.cumulativeWealth, true)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ textAlign: 'center', fontSize: '0.625rem', color: '#484848', padding: '0.625rem', borderTop: '1px solid rgba(72,72,72,0.1)' }}>
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
