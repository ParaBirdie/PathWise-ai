import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, TrendingUp, Download } from 'lucide-react'
import { useSurveyStore } from '../../store/surveyStore'
import { formatCurrency } from '../../lib/npvEngine'
import { PRIMARY_GOALS, SCHOOL_COLORS } from '../../lib/economicData'
import { fetchLatestQuestionData } from '../../lib/questionDataService'
import WealthChart from './WealthChart'
import SchoolCard from './SchoolCard'
import DownloadShareMenu from './DownloadShareMenu'

const GOAL_LABEL = Object.fromEntries(PRIMARY_GOALS.map(({ value, label }) => [value, label]))

/**
 * Guard against a malformed or attacker-crafted result_snapshot retrieved
 * from the database. Verifies that the object has the minimum shape required
 * to render the results UI without runtime errors.
 */
function isValidResultSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return false
  if (typeof snapshot.lifecycleDividend !== 'number') return false
  if (!snapshot.best || typeof snapshot.best.school !== 'string') return false
  if (!Array.isArray(snapshot.results) || snapshot.results.length === 0) return false
  return snapshot.results.every(
    (r) =>
      r !== null &&
      typeof r === 'object' &&
      typeof r.school === 'string' &&
      typeof r.npv === 'number' &&
      typeof r.compositeScore === 'number' &&
      Array.isArray(r.trajectory) &&
      typeof r.annualTuition === 'number' &&
      typeof r.entryWage === 'number' &&
      typeof r.year10Wage === 'number' &&
      typeof r.skillWeight === 'number' &&
      typeof r.signalWeight === 'number' &&
      typeof r.employmentRate === 'number'
  )
}

const stagger = {
  container: { transition: { staggerChildren: 0.08 } },
  item: {
    hidden: { y: 24, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  },
}

export default function ResultsPage() {
  const { comparisonResult, major, goals, reset, setComparisonResult } = useSurveyStore()
  const [loading, setLoading] = useState(!comparisonResult)

  // If comparisonResult is missing (e.g. page was reloaded), recover it
  // from the most recent question_data row saved for this anonymous user.
  useEffect(() => {
    if (comparisonResult) { setLoading(false); return }

    fetchLatestQuestionData().then(({ data }) => {
      if (data?.result_snapshot && isValidResultSnapshot(data.result_snapshot)) {
        setComparisonResult(data.result_snapshot)
      } else if (data?.result_snapshot) {
        console.warn('[PathWise] Discarded result_snapshot with unexpected shape')
      }
      setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0e0e0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: '#acabaa' }}>Loading your results…</p>
      </div>
    )
  }

  if (!comparisonResult) return null

  const { results, best } = comparisonResult
  const second = results[1] ?? null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0e0e0e', color: '#e7e5e4', position: 'relative' }}>
      {/* Print stylesheet */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: #1d1d1f !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>

      {/* Ambient glow */}
      <div style={{ position: 'fixed', top: 0, right: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.2, padding: '2rem' }}>
        <div style={{ width: '600px', height: '600px', backgroundColor: 'rgba(196,181,253,0.1)', filter: 'blur(140px)', borderRadius: '9999px' }} />
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.1 }}>
        <div style={{ width: '400px', height: '400px', backgroundColor: 'rgba(196,181,253,0.1)', filter: 'blur(100px)', borderRadius: '9999px' }} />
      </div>

      {/* Top nav */}
      <nav
        className="no-print"
        style={{
          position: 'fixed', top: 0, width: '100%', height: '4rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 2rem', backgroundColor: 'rgba(14,14,14,0.9)',
          backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(72,72,72,0.15)',
          zIndex: 50,
        }}
      >
        <div style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.03em', textTransform: 'uppercase', color: '#c4b5fd' }}>
          MONOLITH
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#acabaa' }}>
            YOUR ANALYSIS
          </span>
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#c4b5fd' }} />
        </div>
      </nav>

      {/* Floating download/share button */}
      <DownloadShareMenu
        comparisonResult={comparisonResult}
        major={major}
        goals={goals}
      />

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '64rem', margin: '0 auto', padding: '7rem 1.5rem 8rem' }}>
        <motion.div initial="hidden" animate="visible" variants={stagger.container}>

          {/* ── Header ── */}
          <motion.div variants={stagger.item} style={{ marginBottom: '3rem', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '3.5rem', height: '3.5rem', borderRadius: '1rem',
                background: 'linear-gradient(135deg, #ccbeff 0%, #4a3d7c 100%)',
                marginBottom: '1.25rem',
                boxShadow: '0 8px 32px rgba(196,181,253,0.25)',
              }}
            >
              <TrendingUp size={24} style={{ color: '#433675' }} />
            </div>
            <h1
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900,
                letterSpacing: '-0.04em', color: '#e7e5e4', marginBottom: '0.75rem',
                textTransform: 'uppercase', lineHeight: 0.95,
              }}
            >
              Your PathWise{' '}
              <span style={{ color: '#c4b5fd' }}>Analysis</span>
            </h1>
            <p style={{ color: '#acabaa', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
              {major}
              {goals.length > 0 && (
                <> · {goals.map((g) => GOAL_LABEL[g] ?? g).join(' · ')}</>
              )}
              {' · 40-year projection'}
            </p>
          </motion.div>

          {/* ── Life-Cycle Dividend Hero ── */}
          <motion.div variants={stagger.item} style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                backgroundColor: '#131313',
                borderRadius: '1rem',
                padding: '2.5rem',
                textAlign: 'center',
                border: '1px solid rgba(72,72,72,0.15)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Subtle gradient overlay */}
              <div
                style={{
                  position: 'absolute', inset: 0, borderRadius: '1rem',
                  background: 'radial-gradient(ellipse at 50% 0%, rgba(196,181,253,0.06) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
              <p
                style={{
                  fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.15em',
                  textTransform: 'uppercase', color: '#c4b5fd', marginBottom: '1.5rem',
                }}
              >
                Life-Cycle Dividend
              </p>

              {/* Two-number comparison: best vs runner-up */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                {/* Best option */}
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c4b5fd', marginBottom: '0.375rem' }}>
                    Best Option
                  </p>
                  <p style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: '#e7e5e4', marginBottom: '0.375rem' }}>
                    {formatCurrency(best.npv, true)}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#acabaa' }}>
                    {best.school}
                  </p>
                </div>

                {/* VS divider */}
                <div style={{ textAlign: 'center', padding: '0 0.5rem' }}>
                  <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#484848', letterSpacing: '0.05em' }}>
                    vs
                  </span>
                </div>

                {/* Runner-up */}
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#767575', marginBottom: '0.375rem' }}>
                    Runner-Up
                  </p>
                  <p style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: '#acabaa', marginBottom: '0.375rem' }}>
                    {second ? formatCurrency(second.npv, true) : '—'}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#767575' }}>
                    {second?.school ?? '—'}
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '0.8125rem', color: '#767575', maxWidth: '32rem', margin: '0 auto' }}>
                NPV-discounted 40-year wealth projection
              </p>

              {/* Mini stats */}
              <div
                style={{
                  marginTop: '2rem',
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  paddingTop: '1.75rem',
                  borderTop: '1px solid rgba(72,72,72,0.15)',
                }}
              >
                {[
                  { label: 'Best NPV', value: formatCurrency(best.npv, true) },
                  { label: 'Entry Wage', value: formatCurrency(best.entryWage, true) },
                  { label: 'Yr 10 Wage', value: formatCurrency(best.year10Wage, true) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ fontSize: '0.6875rem', color: '#767575', marginBottom: '0.25rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
                      {label}
                    </p>
                    <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#e7e5e4', letterSpacing: '-0.02em' }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Wealth Trajectory Chart ── */}
          <motion.div variants={stagger.item} style={{ marginBottom: '1.5rem' }}>
            <WealthChart results={results} />
          </motion.div>

          {/* ── School Cards ── */}
          <motion.div variants={stagger.item} style={{ marginBottom: '0.75rem' }}>
            <p
              style={{
                fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.15em',
                textTransform: 'uppercase', color: '#c4b5fd', marginBottom: '1rem',
              }}
            >
              School Rankings
            </p>
          </motion.div>

          {results.map((result, i) => (
            <motion.div key={result.school} variants={stagger.item} style={{ marginBottom: '1rem' }}>
              <SchoolCard result={result} rank={i} color={SCHOOL_COLORS[i % SCHOOL_COLORS.length]} />
            </motion.div>
          ))}

          {/* ── Methodology ── */}
          <motion.div
            variants={stagger.item}
            style={{
              backgroundColor: '#131313',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              border: '1px solid rgba(72,72,72,0.12)',
              marginTop: '0.5rem',
            }}
          >
            <p style={{ fontSize: '0.75rem', color: '#767575', lineHeight: 1.7 }}>
              <strong style={{ color: '#acabaa' }}>Methodology:</strong>{' '}
              Earnings modeled via the Quartic Mincerian equation (Murphy &amp; Welch, 1990).
              NPV uses a 5% annual discount rate, 40-year career horizon, and includes
              $35k/yr opportunity cost during college. Aid figures reflect actual offer letter amounts where provided;
              otherwise estimated from published FAFSA EFC curves by income bracket and school tier.
              Results are educational simulations — consult a financial advisor for personalized guidance.
            </p>
          </motion.div>

          {/* ── Download / Share (inline, bottom of page) ── */}
          <motion.div
            variants={stagger.item}
            className="no-print"
            style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}
          >
            <button
              onClick={() => window.print()}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.875rem 2rem', borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #ccbeff 0%, #4a3d7c 100%)',
                color: '#433675', fontWeight: 700, fontSize: '0.75rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(196,181,253,0.2)',
              }}
            >
              <Download size={15} />
              Download as PDF
            </button>

            <button
              onClick={reset}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.875rem 2rem', borderRadius: '0.5rem',
                backgroundColor: 'transparent',
                border: '1px solid rgba(72,72,72,0.3)',
                color: '#acabaa', fontWeight: 600, fontSize: '0.75rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(196,181,253,0.3)'; e.currentTarget.style.color = '#e7e5e4' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(72,72,72,0.3)'; e.currentTarget.style.color = '#acabaa' }}
            >
              <RefreshCw size={13} />
              Start Over
            </button>
          </motion.div>

        </motion.div>
      </div>
    </div>
  )
}
