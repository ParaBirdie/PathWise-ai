import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, BadgeCheck, Check, AlertTriangle, Link2, Sparkles, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '../../lib/npvEngine'
import { SCHOOL_COLORS } from '../../lib/economicData'

const TIER_LABELS = {
  elite:    { label: 'Elite' },
  research: { label: 'Research University' },
  flagship: { label: 'State Flagship' },
  local:    { label: 'Local / Community' },
}

export default function SchoolCard({ result, rank, color, fit = null, fitStatus = 'idle' }) {
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
          {/* Two independent axes, side by side: money (NPV) and fit (A1). */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#e7e5e4', lineHeight: 1 }}>
                {formatCurrency(result.npv, true)}
              </p>
              <p style={{ fontSize: '0.6875rem', color: '#767575', marginTop: '0.25rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
                40-yr NPV
              </p>
            </div>

            {fit && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#c4b5fd', lineHeight: 1 }}>
                  {fit.fitScore}
                </p>
                <p style={{ fontSize: '0.6875rem', color: '#767575', marginTop: '0.25rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
                  Fit / 100
                </p>
              </div>
            )}

            {!fit && fitStatus === 'loading' && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#484848', lineHeight: 1 }}>
                  —
                </p>
                <p style={{ fontSize: '0.6875rem', color: '#767575', marginTop: '0.25rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
                  Scoring fit…
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Fit rationale (Agent A1) ── */}
        <FitSection fit={fit} />

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

/**
 * Fit rationale from Agent A1.
 *
 * Every line here is already guaranteed to cite a real fact — `sanitizeFitScores`
 * dropped anything whose `factIndex` did not resolve before this component ever
 * saw it. The source link is that fact's own `source_url`, so a claim on screen
 * is always one click from the page it came from.
 */
function FitSection({ fit }) {
  if (!fit) return null

  // Cited reasons first, then the derived climate note, then cited concerns,
  // then the derived network note — so each derived line closes out its group.
  const split = (list, kindOf) => {
    const cited = list.filter((i) => !i.derived).map((i) => ({ ...i, kind: kindOf(i) }))
    const derived = list.filter((i) => i.derived).map((i) => ({ ...i, kind: kindOf(i) }))
    return [...cited, ...derived]
  }
  const items = [
    ...split(fit.reasons, (r) => (r.polarity === 'con' ? 'con' : 'pro')),
    ...split(fit.concerns, () => 'concern'),
  ]

  if (!fit.headline && items.length === 0) return null

  const STYLE = {
    pro:     { color: '#4ade80', Icon: Check },
    con:     { color: '#f0b132', Icon: AlertTriangle },
    concern: { color: '#f0b132', Icon: AlertTriangle },
  }

  return (
    <div
      style={{
        marginBottom: '1.25rem',
        padding: '1.25rem 1.375rem',
        borderRadius: '0.625rem',
        backgroundColor: 'rgba(196,181,253,0.05)',
        border: '1px solid rgba(196,181,253,0.15)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: fit.headline ? '0.625rem' : '0.875rem' }}>
        <Sparkles size={13} style={{ color: '#c4b5fd', flexShrink: 0 }} />
        <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c4b5fd' }}>
          Why this fits you
        </span>
      </div>

      {fit.headline && (
        <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#e7e5e4', lineHeight: 1.5, marginBottom: items.length ? '0.875rem' : 0 }}>
          {fit.headline}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {items.map((item, i) => {
          const { color: iconColor, Icon } = STYLE[item.kind]
          return (
            <div key={`${item.kind}-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
              <Icon size={14} style={{ color: iconColor, flexShrink: 0, marginTop: '0.1875rem' }} />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.8125rem', color: '#e7e5e4', lineHeight: 1.55 }}>
                  {item.text}
                </p>
                {item.derived ? (
                  // No source link: this line comes from the student's own Q6/Q9
                  // answers, not from a school fact. Labelling it keeps the
                  // "every cited reason traces to a fact" claim honest.
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      fontSize: '0.6875rem', color: '#767575', marginTop: '0.25rem',
                    }}
                  >
                    <User size={10} />
                    From your answers
                  </span>
                ) : item.fact?.source_url && (
                  <a
                    href={item.fact.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={item.fact.claim}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      fontSize: '0.6875rem', color: '#767575', textDecoration: 'none',
                      marginTop: '0.25rem',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#c4b5fd' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#767575' }}
                  >
                    <Link2 size={10} />
                    Source
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
