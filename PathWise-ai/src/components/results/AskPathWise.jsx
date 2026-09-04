import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, X, Send, Loader2, Calculator } from 'lucide-react'
import { SCHOOL_COLORS } from '../../lib/economicData'
import { buildRecomputeScenarioTool, runScenario } from '../../lib/scenarioTool'

/**
 * AskPathWise — Agent A3, the School Advisor chat (§5).
 *
 * Self-contained by design: one mount on the results page and nothing else
 * changes. It owns the launch control, the drawer, the school tabs, the
 * conversation, and the whole tool loop.
 *
 * The tool loop runs HERE, not on the server. `/api/chat` is a stateless proxy
 * that only injects the API key and streams tokens back; when the model asks for
 * `recompute_scenario` we run the real `compareOffers()` in this tab — the same
 * engine, the same Supabase-loaded module state that produced the page — and
 * send the result back. That is why no dollar figure in this chat can be
 * something the model made up.
 *
 * Fit context (`fitScores`) is OPTIONAL. With it, "why does this rank higher for
 * me" is answered from a cited fact. Without it, the model is told to say it
 * doesn't have that breakdown. The chat is fully functional on NPV alone.
 *
 * Nothing in here is allowed to break the results page: every failure path ends
 * as an inline message inside the drawer.
 */

const MAX_TOOL_ROUNDTRIPS = 4

// Module-level so the default prop is referentially stable — a fresh `[]` each
// render would retrigger the seed effect forever.
const NO_PROFILES = []

const SUGGESTED = [
  'What if I switch to CS sophomore year?',
  'What if I got $10k more in aid here?',
  "What's the biggest downside of this school for me?",
]

const systemPrompt = (school) => `You are advising one high school senior about ONE school: ${school}. You have
their full analysis, this school's verified facts, and — if supplied — a
separate fit analysis with specific cited reasons and concerns for this
student at this school.

Rules:
- For any question about money, cost, salary, or "what if" — call
  recompute_scenario. Never estimate a dollar figure yourself. If the tool
  cannot answer it, say the model does not cover that.
- Do not ask a clarifying question before calling recompute_scenario. If a
  "what if" names anything the model takes as an input — a different major, a
  different aid amount, a different home state, different priorities — call the
  tool with your best reading of it and state the assumption afterwards. The
  model has no notion of timing, so "switch to X sophomore year" is simply
  majoring in X.
- For "why" questions about fit or ranking, answer using the supplied fit
  reasons and concerns if you have them, and name the underlying fact. Do
  not invent a reason beyond what was supplied. If no fit analysis was
  supplied, say you don't have that breakdown for this school.
- Answer only from the supplied facts and tool results. If you do not know,
  say so and say what would answer it (call admissions, ask a current student).
- 2-4 sentences. This is a chat, not an essay.
- You are not a financial advisor. Do not tell them what to do with loans,
  savings, or debt. Describe tradeoffs; the decision is theirs.
- If asked about a school other than ${school}, briefly compare using the data
  you have, then steer back.`

/* ------------------------------------------------------------------ *
 * resolveFitContext
 *
 * TEMPORARY HOME. This turns each reason/concern's `factIndex` into the actual
 * fact claim + source_url so the model can cite a specific, real sentence
 * without a second tool round-trip. Batch 3 (§3) may end up owning this in
 * `fitEngine.js` — it is deliberately kept pure and dependency-free right here
 * so lifting it out is a cut-and-paste plus an import, with no other edits to
 * this file.
 *
 * Accepts either shape A1 can arrive in: the raw `{ scores: [...] }` response,
 * a bare array, or the name-keyed map `fitEngine.sanitizeFitScores` produces
 * (whose entries already carry a resolved `.fact`, in which case `profiles` is
 * not needed at all).
 * ------------------------------------------------------------------ */
function resolveFitContext(fitScores, profiles, school) {
  if (!fitScores || !school) return null

  const raw = Array.isArray(fitScores) ? fitScores : (fitScores.scores ?? fitScores)
  const entry = Array.isArray(raw)
    ? raw.find((s) => s?.school === school)
    : raw[school]
  if (!entry) return null

  const profileList = Array.isArray(profiles) ? profiles : (profiles?.profiles ?? [])
  const facts = profileList.find((p) => p?.school_name === school)?.facts ?? []

  const resolve = (item) => {
    if (!item || typeof item.text !== 'string') return null
    // Already-resolved (fitEngine) wins; otherwise index into the facts array.
    const fact = item.fact ?? (Number.isInteger(item.factIndex) ? facts[item.factIndex] : null)
    if (!fact || typeof fact.claim !== 'string') return null
    return { point: item.text, supportingFact: fact.claim, source: fact.source_url ?? null }
  }

  const reasons = (entry.reasons ?? []).map(resolve).filter(Boolean)
  const concerns = (entry.concerns ?? []).map(resolve).filter(Boolean)
  const fitScore = Number(entry.fitScore)

  // A score with no citable reason left is not fit context worth sending.
  if (!Number.isFinite(fitScore) && !reasons.length && !concerns.length) return null

  return {
    fitScore: Number.isFinite(fitScore) ? fitScore : null,
    headline: typeof entry.headline === 'string' ? entry.headline : null,
    reasons,
    concerns,
  }
}

/** The one seeded turn: everything the model knows before the student types. */
function buildContextMessage(school, comparisonResult, fitContext) {
  const results = comparisonResult?.results ?? []
  const me = results.find((r) => r.school === school)

  const money = me
    ? {
        school: me.school,
        tier: me.tier,
        lifetimeValue: me.npv,
        entryWage: me.entryWage,
        year10Wage: me.year10Wage,
        annualTuition: me.annualTuition,
        aidUsed: me.aidUsed,
        inState: me.isInState,
        rankAmongCompared: results.indexOf(me) + 1,
      }
    : null

  const others = results
    .filter((r) => r.school !== school)
    .map((r) => ({ school: r.school, lifetimeValue: r.npv, entryWage: r.entryWage, year10Wage: r.year10Wage }))

  return [
    `The student is asking about ${school}.`,
    '',
    'Finished figures from the financial model for this school (all dollars, 40-year present value):',
    JSON.stringify(money),
    '',
    'The other schools they are comparing:',
    JSON.stringify(others),
    '',
    fitContext
      ? 'Fit analysis for this student at this school. Every reason and concern is backed by a verified fact — cite the fact, not just the point:\n' +
        JSON.stringify(fitContext)
      : 'No fit analysis is available for this school. If they ask why it ranks higher or lower for them personally, say you do not have that breakdown rather than guessing at a reason.',
  ].join('\n')
}

/** Parse one SSE frame body; returns null for keepalives and [DONE]. */
function parseFrame(frame) {
  const line = frame.split('\n').find((l) => l.startsWith('data:'))
  if (!line) return null
  const body = line.slice(5).trim()
  if (!body || body === '[DONE]') return null
  try { return JSON.parse(body) } catch { return null }
}

export default function AskPathWise({
  comparisonResult,
  fitScores = null,
  surveyInputs = null,
  // Optional, and the live mount in ResultsPage does pass it. It is only load-
  // bearing when `fitScores` is raw A1 output whose reasons still carry a bare
  // `factIndex`; the store's entries come back through `fitEngine.sanitizeFitScores`
  // with the fact already embedded, so resolveFitContext works either way.
  // Passed anyway so the component does not silently lose citations if that
  // sanitising step ever moves.
  fitProfiles = NO_PROFILES,
}) {
  const results = useMemo(() => comparisonResult?.results ?? [], [comparisonResult])

  const [open, setOpen] = useState(false)
  const [school, setSchool] = useState(null)
  const [turns, setTurns] = useState([])          // rendered conversation
  const [streaming, setStreaming] = useState('')  // live assistant text
  const [status, setStatus] = useState('idle')    // idle | thinking | tool | error
  const [notice, setNotice] = useState(null)      // inline failure / cap message
  const [draft, setDraft] = useState('')

  const historyRef = useRef([])       // Anthropic MessageParam[] — the real history
  const abortRef = useRef(null)
  const scrollRef = useRef(null)

  // Tabs follow `comparisonResult.results` order, which is also the order
  // ResultsPage builds its colour map from — so tab colours match the cards.
  const colorFor = useCallback(
    (name) => SCHOOL_COLORS[Math.max(0, results.findIndex((r) => r.school === name)) % SCHOOL_COLORS.length],
    [results]
  )

  const active = school ?? results[0]?.school ?? null

  const baselineInputs = useMemo(() => {
    const s = surveyInputs ?? {}
    return {
      schools: s.schools ?? results.map((r) => r.school),
      major: s.major ?? comparisonResult?.major ?? '',
      householdIncome: typeof s.householdIncome === 'number'
        ? s.householdIncome
        : (s.incomeBracket?.value ?? 0),
      residencyState: s.residencyState ?? s.residency ?? '',
      goals: s.goals ?? [],
      financialAidOffers: s.financialAidOffers ?? {},
    }
  }, [surveyInputs, results, comparisonResult])

  // A1 lands ~12s (worst ~20s) after the results page renders, and the store
  // assigns brand-new `fitScores` / `fitProfiles` objects when it does. Those
  // identities must never reach the seed effect's dependency array: they used to
  // give `resetConversation` a new identity, which re-fired the effect and wiped
  // a live conversation mid-stream. Read them through a ref instead, so the seed
  // depends only on `open` and `active`.
  const latestRef = useRef({ fitScores, fitProfiles, comparisonResult })
  useEffect(() => {
    latestRef.current = { fitScores, fitProfiles, comparisonResult }
  })   // no dep array on purpose — and declared ABOVE the seed effect so it syncs first

  // Whether the seeded context already carried fit analysis for this school.
  const seededFitRef = useRef(false)

  /** Drop everything and re-seed. Called on open and on every tab switch. */
  const resetConversation = useCallback((name) => {
    abortRef.current?.abort()
    abortRef.current = null
    const { fitScores: fs, fitProfiles: fp, comparisonResult: cr } = latestRef.current
    const fitContext = resolveFitContext(fs, fp, name)
    seededFitRef.current = !!fitContext
    // Seeded as a COMPLETED turn, not a dangling user message: the Messages API
    // merges consecutive user messages, and the student's first question was
    // getting glued onto the end of the context dump and answered as one.
    historyRef.current = [
      { role: 'user', content: buildContextMessage(name, cr, fitContext) },
      { role: 'assistant', content: 'Ready.' },
    ]
    setTurns([])
    setStreaming('')
    setStatus('idle')
    setNotice(null)
    setDraft('')
  }, [])   // stable: everything it reads comes from a ref

  useEffect(() => {
    if (open && active) resetConversation(active)
    // Re-seeding on `active` is the tab-switch reset.
  }, [open, active, resetConversation])

  useEffect(() => () => abortRef.current?.abort(), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [turns, streaming, notice])

  /**
   * One model turn. Streams text into the UI as it arrives and resolves with the
   * assembled assistant message so the caller can read `tool_use` blocks off it.
   */
  // Enumerates the compared schools into the aid schema, so the model cannot
  // name a school the student never entered.
  const tool = useMemo(
    () => buildRecomputeScenarioTool(baselineInputs.schools),
    [baselineInputs.schools]
  )

  const streamTurn = useCallback(async (messages, withTools, onText) => {
    const controller = new AbortController()
    abortRef.current = controller

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        system: systemPrompt(active),
        messages,
        ...(withTools ? { tools: [tool] } : {}),
      }),
    })

    if (!res.ok) {
      const detail = await res.json().catch(() => ({}))
      throw new Error(detail.error ?? `Request failed (${res.status})`)
    }
    if (!res.body) throw new Error('Streaming is not supported in this browser.')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let finalMessage = null

    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      let split
      while ((split = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, split)
        buffer = buffer.slice(split + 2)
        const evt = parseFrame(frame)
        if (!evt) continue
        if (evt.type === 'text') onText(evt.text)
        else if (evt.type === 'tool_start') setStatus('tool')
        else if (evt.type === 'final') finalMessage = evt.message
        else if (evt.type === 'error') throw new Error(evt.error)
      }
    }

    if (!finalMessage) throw new Error('The response ended before it finished.')
    return finalMessage
  }, [active, tool])

  const send = useCallback(async (text) => {
    const question = text.trim()
    if (!question || status === 'thinking' || status === 'tool' || !active) return

    setDraft('')
    setNotice(null)
    setTurns((t) => [...t, { role: 'user', text: question }])
    setStatus('thinking')

    // Fit analysis that arrived after this conversation was seeded is folded in
    // as an extra turn rather than triggering a re-seed. Re-seeding is what used
    // to destroy history; ignoring it entirely would leave the whole conversation
    // fit-blind, and "why does this rank higher for me" is the question §5 exists
    // to answer. Only applied from the next question onward — nothing already
    // said is rewritten.
    let foldedFit = false
    let messages = [...historyRef.current]
    if (!seededFitRef.current) {
      const late = resolveFitContext(latestRef.current.fitScores, latestRef.current.fitProfiles, active)
      if (late) {
        messages.push(
          {
            role: 'user',
            content:
              'The fit analysis for this school has just finished. Use it from here on, ' +
              'and name the underlying fact when you cite it:\n' + JSON.stringify(late),
          },
          { role: 'assistant', content: 'Noted.' },
        )
        foldedFit = true
      }
    }
    messages.push({ role: 'user', content: question })
    let assembled = ''
    const onText = (chunk) => {
      assembled += chunk
      setStatus('thinking')
      setStreaming(assembled)
    }

    try {
      let rounds = 0
      let withTools = true

      for (;;) {
        assembled = ''
        setStreaming('')
        const message = await streamTurn(messages, withTools, onText)
        messages = [...messages, { role: 'assistant', content: message.content }]

        const toolUses = withTools ? message.content.filter((b) => b.type === 'tool_use') : []
        if (toolUses.length === 0) {
          const said = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim()
          setStreaming('')
          setTurns((t) => [...t, { role: 'assistant', text: said || '(no answer returned)' }])
          break
        }

        // Cap reached. Close the loop honestly instead of leaving a dangling
        // tool_use in history: hand back errored results, then take one final
        // turn with no tools so the model has to answer in prose.
        if (rounds >= MAX_TOOL_ROUNDTRIPS) {
          messages = [...messages, {
            role: 'user',
            content: toolUses.map((tu) => ({
              type: 'tool_result',
              tool_use_id: tu.id,
              is_error: true,
              content: `Scenario limit of ${MAX_TOOL_ROUNDTRIPS} runs reached for this question. Answer with the figures you already have and suggest a narrower follow-up question.`,
            })),
          }]
          setNotice(`That took more than ${MAX_TOOL_ROUNDTRIPS} model runs — try asking about one change at a time.`)
          withTools = false
          continue
        }

        // Any partial text before a tool call is preamble; keep it visible.
        const preamble = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim()
        if (preamble) setTurns((t) => [...t, { role: 'assistant', text: preamble }])
        setStreaming('')
        setStatus('tool')
        rounds += 1

        // All results for one assistant turn go back in a SINGLE user message.
        messages = [...messages, {
          role: 'user',
          content: toolUses.map((tu) => {
            const result = runScenario(tu.input?.changes, baselineInputs)
            return {
              type: 'tool_result',
              tool_use_id: tu.id,
              content: result.content,
              ...(result.is_error ? { is_error: true } : {}),
            }
          }),
        }]
        setTurns((t) => [...t, { role: 'tool', text: 'Re-ran the financial model' }])
      }

      historyRef.current = messages
      if (foldedFit) seededFitRef.current = true
      setStatus('idle')
    } catch (err) {
      if (err?.name === 'AbortError') return   // tab switch / unmount, not a failure
      console.warn('[PathWise] Ask PathWise:', err?.message ?? err)
      setStreaming('')
      setStatus('error')
      setNotice(
        err?.message?.includes('Rate limited')
          ? 'The advisor is rate limited right now. Give it a few seconds and try again.'
          : "The advisor couldn't answer that one. Your results above are unaffected — try again in a moment."
      )
    }
  }, [active, status, streamTurn, baselineInputs])

  if (results.length === 0) return null

  const busy = status === 'thinking' || status === 'tool'
  const accent = active ? colorFor(active) : SCHOOL_COLORS[0]

  return (
    <>
      <style>{`
        /* Stacked ABOVE DownloadShareMenu, which is also fixed bottom-right on
           the results page (~39px tall, 1.5rem from the bottom). Sharing that
           corner hides it behind this button. */
        .apw-launch { position: fixed; right: 1.5rem; bottom: 5rem; z-index: 60; }
        .apw-backdrop { position: fixed; inset: 0; z-index: 70; background: rgba(0,0,0,0.55); }
        .apw-drawer {
          position: fixed; z-index: 71; top: 0; right: 0; bottom: 0; width: 420px;
          display: flex; flex-direction: column;
          background: #0e0e0e; border-left: 1px solid rgba(72,72,72,0.35);
          box-shadow: -18px 0 48px rgba(0,0,0,0.55);
        }
        @media (max-width: 640px) {
          .apw-launch { right: 1rem; bottom: 4.5rem; }
          .apw-drawer { width: 100%; border-left: none; }
        }
        .apw-tab { border: 1px solid rgba(72,72,72,0.35); background: transparent; cursor: pointer; }
        .apw-tab:disabled { cursor: not-allowed; }
        .apw-chip:hover:not(:disabled) { border-color: rgba(196,181,253,0.55); }
        .apw-send:disabled { opacity: 0.4; cursor: not-allowed; }
        @keyframes apw-spin { to { transform: rotate(360deg); } }
      `}</style>

      {!open && (
        <div className="apw-launch no-print">
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.8125rem 1.25rem', borderRadius: '9999px', border: 'none',
              backgroundColor: '#c4b5fd', color: '#0e0e0e', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.01em',
              boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
            }}
          >
            <MessageCircle size={17} strokeWidth={2.4} />
            Ask PathWise
          </button>
        </div>
      )}

      {open && (
        <>
          <div className="apw-backdrop no-print" onClick={() => setOpen(false)} />
          <aside className="apw-drawer no-print" role="dialog" aria-label="Ask PathWise">
            {/* Header */}
            <div style={{ padding: '1.125rem 1.25rem 0.875rem', borderBottom: '1px solid rgba(72,72,72,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c4b5fd' }}>
                    Ask PathWise
                  </div>
                  <div style={{ marginTop: '0.3125rem', fontSize: '0.8125rem', color: '#767575' }}>
                    Answering about <span style={{ color: accent, fontWeight: 600 }}>{active}</span> only
                  </div>
                </div>
                <button
                  type="button" onClick={() => setOpen(false)} aria-label="Close"
                  style={{ background: 'transparent', border: 'none', color: '#767575', cursor: 'pointer', padding: '0.25rem' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* School tabs — switching resets the conversation. */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.875rem' }}>
                {results.map((r) => {
                  const on = r.school === active
                  const c = colorFor(r.school)
                  return (
                    <button
                      key={r.school} type="button" className="apw-tab" disabled={busy}
                      onClick={() => setSchool(r.school)}
                      style={{
                        padding: '0.375rem 0.6875rem', borderRadius: '9999px',
                        fontSize: '0.75rem', fontWeight: 600,
                        color: on ? '#0e0e0e' : '#a3a3a3',
                        backgroundColor: on ? c : 'transparent',
                        borderColor: on ? c : 'rgba(72,72,72,0.35)',
                        opacity: busy && !on ? 0.45 : 1,
                      }}
                    >
                      {r.school}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Transcript */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1.125rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {turns.length === 0 && !streaming && (
                <div style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: '#767575' }}>
                  Ask about the numbers, the tradeoffs, or why this school scores the way it does.
                  Money questions re-run the actual model — nothing here is estimated.
                </div>
              )}

              {turns.map((t, i) => {
                if (t.role === 'tool') {
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4375rem', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#4ade80' }}>
                      <Calculator size={13} /> {t.text}
                    </div>
                  )
                }
                const mine = t.role === 'user'
                return (
                  <div key={i} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '92%' }}>
                    <div style={{
                      padding: mine ? '0.625rem 0.875rem' : 0,
                      borderRadius: '0.875rem',
                      backgroundColor: mine ? '#1c1c1c' : 'transparent',
                      color: mine ? '#e7e5e4' : '#d6d3d1',
                      fontSize: '0.8438rem', lineHeight: 1.65, whiteSpace: 'pre-wrap',
                    }}>
                      {t.text}
                    </div>
                  </div>
                )
              })}

              {streaming && (
                <div style={{ maxWidth: '92%', fontSize: '0.8438rem', lineHeight: 1.65, color: '#d6d3d1', whiteSpace: 'pre-wrap' }}>
                  {streaming}
                </div>
              )}

              {busy && !streaming && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#767575' }}>
                  <Loader2 size={13} style={{ animation: 'apw-spin 1s linear infinite' }} />
                  {status === 'tool' ? 'Re-running the financial model…' : 'Thinking…'}
                </div>
              )}

              {notice && (
                <div style={{
                  padding: '0.625rem 0.75rem', borderRadius: '0.625rem',
                  border: '1px solid rgba(251,146,60,0.3)', backgroundColor: 'rgba(251,146,60,0.08)',
                  fontSize: '0.75rem', lineHeight: 1.6, color: '#fdba74',
                }}>
                  {notice}
                </div>
              )}
            </div>

            {/* Chips + composer */}
            <div style={{ borderTop: '1px solid rgba(72,72,72,0.25)', padding: '0.875rem 1.25rem 1.125rem' }}>
              {turns.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.75rem' }}>
                  {SUGGESTED.map((q) => (
                    <button
                      key={q} type="button" className="apw-chip" disabled={busy}
                      onClick={() => send(q)}
                      style={{
                        textAlign: 'left', padding: '0.5rem 0.75rem', borderRadius: '0.625rem',
                        border: '1px solid rgba(72,72,72,0.35)', backgroundColor: '#131313',
                        color: '#a3a3a3', fontSize: '0.75rem', cursor: busy ? 'not-allowed' : 'pointer',
                        transition: 'border-color 0.15s ease',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => { e.preventDefault(); send(draft) }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Ask about ${active}…`}
                  disabled={busy}
                  style={{
                    flex: 1, padding: '0.625rem 0.8125rem', borderRadius: '0.625rem',
                    border: '1px solid rgba(72,72,72,0.35)', backgroundColor: '#131313',
                    color: '#e7e5e4', fontSize: '0.8125rem', outline: 'none',
                  }}
                />
                <button
                  type="submit" className="apw-send" disabled={busy || !draft.trim()} aria-label="Send"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', border: 'none',
                    backgroundColor: '#c4b5fd', color: '#0e0e0e', cursor: 'pointer',
                  }}
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
