import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useSurveyStore } from '../../store/surveyStore'
import { findFlipThreshold } from '../../lib/flipCondition'

/**
 * DecisionNarrative — client half of Agent A2 (§4).
 *
 * One card that says, in plain English, what the analysis actually decided and
 * where it is a close call. Owns its own fetch, its own loading state and its
 * own failure handling: on ANY failure it renders nothing, so dropping it into
 * ResultsPage is a single unconditional line with no error plumbing.
 *
 * The flip threshold is bisected out of `compareOffers()` locally BEFORE the
 * request and passed in as a number. A2 only writes the sentence around it —
 * `npvEngine.js` remains the only thing in this product that produces a dollar
 * figure (§0 constraint 1).
 */

// A2 is ~1-3s. Past this the page is better off with no narrative than a
// spinner that never resolves.
const TIMEOUT_MS = 20000

// A2 waits for A1 to settle so the narrative is written ONCE, with fit in hand.
// The signal is the store's `fitStatus`, not a timer: A1's measured latency is a
// median ~12s and a worst case of 19.6s (see fitService.js), so any fixed grace
// window short enough to feel responsive would expire first — firing A2 without
// fit, then again when fit lands, and visibly rewriting the card mid-read.
//
// This ceiling exists only for a wedged A1 that never resolves either way.
// fitService aborts itself at 30s, so `fitStatus` should always beat this.
const MAX_FIT_WAIT_MS = 35000

// The card owns its own bottom spacing so the ResultsPage insert stays a single
// bare line. A wrapping <div style={{marginBottom}}> would leave 1.5rem of dead
// space on every failure path, which is exactly when nothing should be visible.
const CARD = {
  backgroundColor: '#131313',
  borderRadius: '0.75rem',
  padding: '1.5rem',
  border: '1px solid rgba(72,72,72,0.15)',
  marginBottom: '1.5rem',
}

const EYEBROW = {
  fontSize: '0.6875rem',
  fontWeight: 700,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: '#c4b5fd',
}

const SUBLABEL = {
  fontSize: '0.625rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#767575',
  marginBottom: '0.375rem',
}

/** A1's output is name-keyed in the store; the API accepts either shape. */
function toFitList(fitScores) {
  const list = Array.isArray(fitScores)
    ? fitScores
    : (fitScores && typeof fitScores === 'object' ? Object.values(fitScores) : [])
  return list
    .filter((f) => f && typeof f === 'object' && typeof f.school === 'string' && Number.isFinite(f.fitScore))
    .map((f) => ({ school: f.school, fitScore: f.fitScore, headline: f.headline ?? '' }))
}

export default function DecisionNarrative({ comparisonResult, fitScores, major, goals }) {
  // Read only what `findFlipThreshold` needs and `comparisonResult` does not
  // carry. Narrow selectors so slider drags and fit updates do not re-render.
  const residency = useSurveyStore((s) => s.residency)
  const incomeBracket = useSurveyStore((s) => s.incomeBracket)
  const storeOffers = useSurveyStore((s) => s.financialAidOffers)
  // 'idle' | 'loading' | 'ready' | 'error' — A1's lifecycle, which A2 waits on.
  const fitStatus = useSurveyStore((s) => s.fitStatus)

  // Three states, not a boolean: the skeleton must hold the slot from FIRST
  // PAINT, because this card sits above the wealth chart. Rendering nothing
  // until A1 and A2 both resolve (~15s) and then popping the card in would
  // shove the chart down the page while the user is reading it.
  const [narrative, setNarrative] = useState(null)
  const [failed, setFailed] = useState(false)

  const results = Array.isArray(comparisonResult?.results) ? comparisonResult.results : null
  const fitList = useMemo(() => toFitList(fitScores), [fitScores])

  // Everything the narrative depends on, flattened. The effect keys off this so
  // it fires when the analysis changes and NOT on every parent re-render.
  const signature = useMemo(() => {
    if (!results || results.length === 0) return null
    return JSON.stringify([
      results.map((r) => [r.school, r.npv]),
      fitList.map((f) => [f.school, f.fitScore]),
      major ?? '',
      goals ?? [],
    ])
  }, [results, fitList, major, goals])

  useEffect(() => {
    if (!signature || !results) return

    let cancelled = false
    const controller = new AbortController()

    const run = async () => {
      setFailed(false)
      try {
        // Prefer the offers the student actually entered; fall back to the aid
        // baked into each result so a restored snapshot still works.
        const offers = Object.fromEntries(results.map((r) => {
          const entered = Number(storeOffers?.[r.school])
          return [r.school, Number.isFinite(entered) ? entered : (Number(r.aidUsed) || 0)]
        }))

        const flip = findFlipThreshold({
          schools: results.map((r) => r.school),
          major,
          householdIncome: incomeBracket?.value,
          residencyState: residency,
          goals,
          financialAidOffers: offers,
        })

        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
        try {
          const res = await fetch('/api/narrative', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              // Send the summary fields only — `trajectory` is 44 rows per
              // school and the model has no use for it.
              comparisonResult: {
                results: results.map((r) => ({
                  school: r.school,
                  tier: r.tier,
                  npv: r.npv,
                  entryWage: r.entryWage,
                  year10Wage: r.year10Wage,
                  annualTuition: r.annualTuition,
                  aidUsed: r.aidUsed,
                  // Needed server-side to detect an exact composite tie, which
                  // compareOffers breaks by input order rather than by merit.
                  compositeScore: r.compositeScore,
                })),
                best: { school: comparisonResult?.best?.school ?? results[0].school },
                lifecycleDividend: comparisonResult?.lifecycleDividend ?? 0,
              },
              fitScores: fitList,
              major: major ?? '',
              goals: goals ?? [],
              flip,
            }),
            signal: controller.signal,
          })

          if (!res.ok) {
            const detail = await res.json().catch(() => ({}))
            console.warn(`[PathWise] narrative ${res.status}:`, detail.error ?? '(no body)')
            if (!cancelled) { setNarrative(null); setFailed(true) }
            return
          }

          const body = await res.json()
          // A narrative with no verdict and no brief is not worth a card.
          const ok = typeof body?.verdict === 'string' && typeof body?.brief === 'string'
            && (body.verdict.trim() || body.brief.trim())
          if (!cancelled) {
            setNarrative(ok ? body : null)
            if (!ok) setFailed(true)
          }
        } finally {
          clearTimeout(timer)
        }
      } catch (err) {
        const reason = err?.name === 'AbortError' ? 'timeout' : (err?.message ?? 'network error')
        console.warn('[PathWise] narrative unavailable:', reason)
        if (!cancelled) { setNarrative(null); setFailed(true) }
      }
    }

    // 'ready' and 'error' both mean A1 is done and the picture is final.
    // 'idle' means A1 never ran, so there is nothing to wait for. Only
    // 'loading' holds — and when it flips, this effect re-runs, clears the
    // ceiling below, and fires immediately with whatever A1 produced.
    const delay = setTimeout(run, fitStatus === 'loading' ? MAX_FIT_WAIT_MS : 0)
    return () => {
      cancelled = true
      clearTimeout(delay)
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, fitStatus])

  if (narrative) return <NarrativeCard narrative={narrative} />

  // Any failure at all — timeout, 500, 429, malformed JSON — renders nothing.
  // Nothing to analyse is the same: no card, no placeholder.
  if (failed || !signature) return null

  // Still waiting on A1 and/or A2. Hold the slot.
  return <NarrativeSkeleton />
}

/** Placeholder while A2 is in flight, sized like the real card to avoid a jump. */
export function NarrativeSkeleton() {
  return (
    <div style={CARD} aria-busy="true">
      <p style={{ ...EYEBROW, marginBottom: '1rem' }}>The Decision</p>
      {['70%', '100%', '84%'].map((w, i) => (
        <motion.div
          key={w}
          animate={{ opacity: [0.25, 0.6, 0.25] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.15 }}
          style={{
            height: i === 0 ? '1.25rem' : '0.75rem',
            width: w,
            borderRadius: '0.25rem',
            backgroundColor: 'rgba(72,72,72,0.35)',
            marginBottom: '0.75rem',
          }}
        />
      ))}
    </div>
  )
}

/**
 * Pure presentation. Split out from the container so the card can be rendered
 * and asserted on without a network, a store, or a DOM — every field is
 * independently optional, and an empty one drops its row rather than printing a
 * bare label.
 */
export function NarrativeCard({ narrative }) {
  const { verdict, brief, flipCondition, tension } = narrative ?? {}
  const footnotes = [
    tension?.trim() && { label: 'The Tradeoff', text: tension.trim() },
    flipCondition?.trim() && { label: 'What Would Flip It', text: flipCondition.trim() },
  ].filter(Boolean)

  if (!verdict?.trim() && !brief?.trim() && footnotes.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={CARD}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Sparkles size={13} color="#c4b5fd" strokeWidth={2.5} />
        <p style={EYEBROW}>The Decision</p>
      </div>

      {verdict?.trim() && (
        <p
          style={{
            fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em',
            lineHeight: 1.3, color: '#e7e5e4', marginBottom: '0.75rem',
          }}
        >
          {verdict.trim()}
        </p>
      )}

      {brief?.trim() && (
        <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: '#acabaa' }}>
          {brief.trim()}
        </p>
      )}

      {footnotes.length > 0 && (
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(72,72,72,0.15)',
            display: 'grid',
            gridTemplateColumns: footnotes.length > 1 ? 'repeat(auto-fit, minmax(15rem, 1fr))' : '1fr',
            gap: '1.25rem',
          }}
        >
          {footnotes.map(({ label, text }) => (
            <div key={label}>
              <p style={SUBLABEL}>{label}</p>
              <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: '#acabaa' }}>{text}</p>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: '0.6875rem', color: '#767575', marginTop: '1.25rem', lineHeight: 1.6 }}>
        Written by Claude from the financial model&rsquo;s finished figures. Every dollar
        amount above, including the flip threshold, is computed in code — not by the model.
      </p>
    </motion.div>
  )
}
