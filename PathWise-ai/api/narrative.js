import Anthropic from '@anthropic-ai/sdk'
import { client, MODEL, handler } from './_anthropic.js'

// ── Agent A2: Decision Narrator (§4) ─────────────────────────────────────────
// Explains a finished analysis in plain English. It receives numbers; it never
// produces one. The flip threshold in particular is bisected out of
// compareOffers() client-side (src/lib/flipCondition.js) and passed in — this
// route only lets the model write the sentence around it, and verifies after
// the fact that the model reused the figure verbatim.

const SYSTEM = `You explain a college-choice analysis to a high school senior in plain
language. You are given finished numbers from a financial model and fit
scores from a separate analysis.

Rules:
- Never compute, adjust, or invent a number. Use only the figures given,
  and reuse them verbatim.
- Write for a 17-year-old, not an economist. No "NPV", no "discount rate",
  no "Mincerian". Say "lifetime earnings" and "money over 40 years".
- Name the tradeoff honestly. If the money winner is not the fit winner,
  say so directly — do not smooth it over.
- 2-3 sentences for the brief. No preamble, no restating the question.`

// Four required strings, nothing else. Deliberately free of `minLength` /
// `maxLength` / numeric bounds: Haiku 4.5 rejects constraint keywords on schema
// leaves with a 400 (same finding as api/fit-score.js). Length is capped in JS.
const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string' },
    brief: { type: 'string' },
    flipCondition: { type: 'string' },
    tension: { type: 'string' },
  },
  required: ['verdict', 'brief', 'flipCondition', 'tension'],
  additionalProperties: false,
}

// Input caps. The client is not trusted to be the app — these bound the request
// so a hand-rolled POST cannot turn one session into an unbounded token bill.
const MAX_SCHOOLS = 4
const MAX_NAME = 200
const MAX_GOALS = 8
const MAX_AID_DELTA = 200000

// Output caps.
const MAX_VERDICT = 200
const MAX_BRIEF = 800
const MAX_FLIP = 300
const MAX_TENSION = 400

const isStr = (v) => typeof v === 'string'
const trunc = (v, n) => (isStr(v) ? v.slice(0, n).trim() : '')
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null)

/** `$1,234,567` / `-$1,234` — the only dollar renderer on this route. */
function usd(v) {
  const n = Math.round(Number(v) || 0)
  const body = Math.abs(n).toLocaleString('en-US')
  return n < 0 ? `-$${body}` : `$${body}`
}

/** `$23k` — the compact form the flip sentence is written around. */
function usdK(v) {
  const k = Math.round(Number(v) / 1000)
  return `$${k.toLocaleString('en-US')}k`
}

/** Normalize A1's output, which may arrive as an array or a name-keyed object. */
function normalizeFit(fitScores) {
  const list = Array.isArray(fitScores)
    ? fitScores
    : (fitScores && typeof fitScores === 'object' ? Object.values(fitScores) : [])

  return list
    .filter((f) => f && typeof f === 'object' && isStr(f.school) && Number.isFinite(Number(f.fitScore)))
    .slice(0, MAX_SCHOOLS)
    .map((f) => ({
      school: trunc(f.school, MAX_NAME),
      fitScore: Math.max(0, Math.min(100, Math.round(Number(f.fitScore)))),
      headline: trunc(f.headline, 200),
    }))
}

/**
 * One money line per school. Only figures that appear here may be reused, so
 * every figure a sentence could plausibly want must be rendered here already —
 * including tuition NET of aid. Handing the model `tuition` and `aid` as a bare
 * pair invites it to subtract them, and a subtraction it performed is a number
 * `npvEngine` did not produce.
 */
function renderResult(r, i) {
  const netTuition = Math.max(0, r.annualTuition - r.aidUsed)
  const parts = [
    `lifetime earnings over 40 years: ${usd(r.npv)}`,
    r.entryWage ? `starting salary ${usd(r.entryWage)}` : null,
    r.year10Wage ? `salary at year 10 ${usd(r.year10Wage)}` : null,
    r.annualTuition ? `sticker tuition ${usd(r.annualTuition)}/yr` : null,
    r.annualTuition
      ? `aid entered ${usd(r.aidUsed)}/yr, leaving tuition after aid of ${usd(netTuition)}/yr`
      : null,
    r.tier ? `school tier: ${r.tier}` : null,
  ].filter(Boolean)
  return `${i + 1}. ${r.school} — ${parts.join('; ')}`
}

function buildUserMessage({ results, fit, major, goals, flip }) {
  const top = results[0]
  const second = results[1] ?? null

  // Derived here, from the results, rather than trusting a client-supplied
  // summary field. Note the gap can be NEGATIVE: `compareOffers` ranks on a
  // composite of the student's stated goals, so with `minimize_cost` or
  // `grad_school` in play the #1 school can be the one that earns less. Left
  // unsaid, the model reliably narrates that backwards.
  const gap = second ? top.npv - second.npv : 0

  // `compositeScore` is the mean of each goal's min/max-normalized rank, so with
  // N schools and N goals it quantizes hard: two schools each winning one of two
  // goals both score exactly 0.5. `compareOffers` then breaks that tie by array
  // order — i.e. by the order the student happened to type the schools in.
  // Calling the first one the "money leader" would dress up a coin flip as a
  // finding, so a tie is stated as a tie.
  const tied =
    second &&
    Number.isFinite(top.compositeScore) &&
    Number.isFinite(second.compositeScore) &&
    Math.abs(top.compositeScore - second.compositeScore) < 1e-6

  const rankBlock = !second
    ? `Only one school was analysed: ${top.school}.`
    : tied
      ? [
          `${top.school} and ${second.school} are TIED on the financial model's composite`,
          `score (${top.compositeScore} each). Each wins on some of the goals the student`,
          'chose and loses on the others, and the order they are listed in is arbitrary.',
          'Do NOT say either school "leads", "wins", "is ahead" or "is #1" on money.',
          'Say the money case is genuinely too close to call, and that the decision',
          'therefore comes down to fit and personal preference.',
          gap !== 0
            ? `On lifetime earnings alone ${gap > 0 ? top.school : second.school} is ahead by ${usd(Math.abs(gap))} over 40 years — you may state that, but it does not break the overall tie, because the student also asked to weigh other goals.`
            : null,
        ].filter(Boolean).join(' ')
      : [
        `Top of the financial model's ranking: ${top.school}.`,
        "That ranking weighs the student's stated goals, not lifetime earnings alone.",
        // The results page ranks schools on a money+fit BLEND the student drives
        // with a slider, so the card at the top of their screen may not be this
        // school. A flat "#1" claim here would visibly contradict the page.
        'This is the MONEY side only. The results page shows fit as a separate',
        'ranking the student re-weights with a slider, so the school listed first',
        'on their screen may not be this one. Say this school leads on money —',
        'never call it "#1" or "your top choice" outright.',
        gap > 0
          ? `${top.school} also earns the most: ${usd(gap)} more than ${second.school} over 40 years.`
          : gap < 0
            ? `IMPORTANT: ${top.school} leads on money even though it earns LESS than ${second.school} — ${usd(Math.abs(gap))} less over 40 years. Say that plainly. Do not describe ${top.school} as earning more.`
            : `${top.school} and ${second.school} earn the same over 40 years.`,
      ].join(' ')

  // The two figures a narrative always reaches for when comparing the top two,
  // and the two it will otherwise compute itself: the earnings gap (above) and
  // the annual cost difference. Supplying it is what keeps `brief`/`tension`
  // free of model arithmetic — an earlier version produced "$31,318/yr" by
  // subtracting two supplied tuitions, which is exactly what npvEngine owns.
  const netOf = (r) => Math.max(0, r.annualTuition - r.aidUsed)
  const costDiff = second ? netOf(top) - netOf(second) : 0
  const costLine = second && costDiff !== 0
    ? `Difference in tuition after aid between the two: ${usd(Math.abs(costDiff))}/yr (${costDiff > 0 ? second.school : top.school} is the cheaper one).`
    : null

  const moneyBlock = [
    'Money ranking, best first. These come from the financial model and are final:',
    ...results.map(renderResult),
    costLine,
    rankBlock,
  ].filter(Boolean).join('\n')

  const bestSchool = top.school

  const fitWinner = fit.length ? [...fit].sort((a, b) => b.fitScore - a.fitScore)[0] : null
  const fitBlock = fit.length
    ? [
        'Fit scores (0-100) from a separate analysis of what this student said they want:',
        ...fit.map((f) => `- ${f.school}: ${f.fitScore}${f.headline ? ` — ${f.headline}` : ''}`),
        `The fit winner is ${fitWinner.school}.`,
        fitWinner.school === bestSchool
          ? (tied
              ? 'The fit winner is also the school listed first on money, but the money side is a tie — lean on fit, and do not claim it wins both.'
              : 'The money leader and the fit winner are the SAME school. Say so, and say that it is unusual and makes the decision easy.')
          : (tied
              ? `The money side is tied, and ${fitWinner.school} is the clear fit winner. That makes fit the tiebreaker — say so directly in "tension".`
              : `The money leader (${bestSchool}) and the fit winner (${fitWinner.school}) DISAGREE. Name that conflict directly in "tension" — do not smooth it over.`),
      ].join('\n')
    : [
        'No fit scores are available for this student.',
        'Do not mention fit, do not invent a fit score, and write "tension" about the money picture alone',
        '(for example, what the runner-up gives up, or how close the two schools are).',
      ].join('\n')

  const flipBlock = flip
    ? [
        'Flip threshold, already computed by the financial model:',
        `${flip.school} becomes the top-ranked school once its aid offer rises by ${usdK(flip.aidDelta)} per year.`,
        `Write "flipCondition" as ONE sentence built around exactly the figure ${usdK(flip.aidDelta)}.`,
        'Write that figure exactly as shown. Put no other number in that sentence.',
      ].join('\n')
    : [
        tied
          ? 'Flip threshold: none. No realistic increase in aid breaks the tie — say that plainly.'
          : 'Flip threshold: none. No realistic increase in aid changes this ranking. Say that plainly.',
        'Put NO dollar figure in "flipCondition".',
      ].join('\n')

  return [
    `Student: intended major is ${major || 'undecided'}.`,
    `What they said matters most: ${goals.length ? goals.join(', ') : 'unspecified'}.`,
    '',
    moneyBlock,
    '',
    fitBlock,
    '',
    flipBlock,
    '',
    'The dollar amounts written above are the only dollar amounts that exist.',
    'Reuse them exactly as written. Do not add, subtract, average, or otherwise',
    'combine them, and do not introduce a figure that does not appear above.',
  ].join('\n')
}

/**
 * Ask A2 for the narrative. Primary path is structured output; if this
 * deployment's model rejects `output_config` with a 400, fall back to strict
 * tool use and read the args off the tool_use block (§1).
 */
async function narrate(userMessage) {
  const base = {
    model: MODEL,
    max_tokens: 700,
    temperature: 0.6,
    system: SYSTEM,
    messages: [{ role: 'user', content: userMessage }],
  }

  try {
    const message = await client.messages.create({
      ...base,
      output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
    })
    const text = message.content.find((b) => b.type === 'text')?.text ?? ''
    return { parsed: JSON.parse(text), usage: message.usage }
  } catch (err) {
    const isOutputConfig400 =
      err instanceof Anthropic.BadRequestError &&
      /output_config|json_schema|format/i.test(err.message ?? '')
    if (!(isOutputConfig400 || err instanceof SyntaxError)) throw err

    console.warn('[api/narrative] structured output unavailable, falling back to strict tool use')
    const message = await client.messages.create({
      ...base,
      tools: [{
        name: 'report_narrative',
        description: 'Report the plain-language explanation of this analysis.',
        strict: true,
        input_schema: OUTPUT_SCHEMA,
      }],
      tool_choice: { type: 'tool', name: 'report_narrative' },
    })
    const block = message.content.find((b) => b.type === 'tool_use')
    if (!block) throw new Error('A2 returned neither structured output nor a tool_use block')
    return { parsed: block.input, usage: message.usage }
  }
}

// A `k`/`M` suffix counts only when it is glued to the digits and ends a word.
// Allowing a space before it made "$213,651 more" tokenize as "$213,651m",
// which fails the guard on a figure that was in fact supplied.
// The digit run must END in a digit: `[\d,]*` alone swallows a trailing comma,
// so "$1,296,173, and its fit score" tokenized as "$1,296,173," and failed to
// match the supplied "$1,296,173". Same class of bug as the "k" suffix below.
const MONEY_TOKEN = /\$\s?\d(?:[\d,]*\d)?(?:\.\d+)?(?:[kKmM]\b)?/g

/**
 * The anti-derivation guard. `flipCondition` is the one sentence on the page
 * whose number carries advice, so the model is not trusted with it: every dollar
 * token it wrote must be a rendering of the threshold WE bisected. Anything else
 * — a rounded variant, a second figure, a number invented out of nothing when no
 * threshold exists — and the whole sentence is replaced with a deterministic one.
 */
export function guardFlipCondition(written, flip) {
  const tokens = (written.match(MONEY_TOKEN) ?? []).map((t) => t.replace(/\s/g, '').toLowerCase())

  if (!flip) {
    if (tokens.length === 0) return written
    console.warn('[api/narrative] flipCondition invented a figure with no threshold; replaced')
    return 'No realistic increase in aid changes this ranking.'
  }

  const k = Math.round(flip.aidDelta / 1000)
  const allowed = new Set([
    `$${k}k`,
    `$${k.toLocaleString('en-US')}k`,
    `$${flip.aidDelta}`,
    `$${flip.aidDelta.toLocaleString('en-US')}`,
  ].map((s) => s.toLowerCase()))

  if (tokens.length > 0 && tokens.every((t) => allowed.has(t))) return written

  console.warn(`[api/narrative] flipCondition figure did not match ${usdK(flip.aidDelta)}; replaced`)
  return `${flip.school} would come out ahead if your aid offer there rose by about ${usdK(flip.aidDelta)} per year.`
}

/**
 * Observability, not enforcement. `flipCondition` carries advice and is hard-
 * guarded above; the prose fields are allowed to breathe, so a figure we did
 * not supply is logged rather than censored. A warning here means the prompt
 * needs another supplied figure — that is how the "tuition minus aid" case was
 * caught.
 */
function auditFigures(field, text, supplied) {
  const stray = (text.match(MONEY_TOKEN) ?? [])
    .map((t) => t.replace(/\s/g, ''))
    .filter((t) => !supplied.has(t.toLowerCase()))
  if (stray.length) {
    console.warn(`[api/narrative] ${field} used unsupplied figure(s): ${stray.join(', ')}`)
  }
}

export default handler(async (req, res) => {
  const body = req.body ?? {}
  const { comparisonResult, fitScores = null, major = '', goals = [], flip = null } = body

  // ── Request validation ────────────────────────────────────────────────────
  if (!comparisonResult || typeof comparisonResult !== 'object' || Array.isArray(comparisonResult)) {
    return res.status(400).json({ error: 'comparisonResult must be an object' })
  }
  const rawResults = comparisonResult.results
  if (!Array.isArray(rawResults) || rawResults.length === 0 || rawResults.length > MAX_SCHOOLS) {
    return res.status(400).json({ error: `comparisonResult.results must be 1-${MAX_SCHOOLS} entries` })
  }
  if (!rawResults.every((r) => r && typeof r === 'object' && isStr(r.school) && r.school.length > 0
    && r.school.length <= MAX_NAME && Number.isFinite(Number(r.npv)))) {
    return res.status(400).json({ error: 'each result needs a school name and a numeric npv' })
  }
  if (!isStr(major)) {
    return res.status(400).json({ error: 'major must be a string' })
  }
  if (!Array.isArray(goals) || !goals.every(isStr)) {
    return res.status(400).json({ error: 'goals must be an array of strings' })
  }
  if (fitScores !== null && typeof fitScores !== 'object') {
    return res.status(400).json({ error: 'fitScores must be an array, an object, or null' })
  }
  if (flip !== null) {
    if (typeof flip !== 'object' || Array.isArray(flip) || !isStr(flip.school)) {
      return res.status(400).json({ error: 'flip must be null or { school, aidDelta }' })
    }
    const delta = num(flip.aidDelta)
    if (delta === null || delta <= 0 || delta > MAX_AID_DELTA) {
      return res.status(400).json({ error: `flip.aidDelta must be a number between 0 and ${MAX_AID_DELTA}` })
    }
  }

  // ── Normalize ─────────────────────────────────────────────────────────────
  const results = rawResults.map((r) => ({
    school: trunc(r.school, MAX_NAME),
    tier: trunc(r.tier, 40),
    npv: Math.round(Number(r.npv)),
    entryWage: num(r.entryWage) ?? 0,
    year10Wage: num(r.year10Wage) ?? 0,
    annualTuition: num(r.annualTuition) ?? 0,
    aidUsed: num(r.aidUsed) ?? 0,
    compositeScore: num(r.compositeScore),
  }))

  const safeFlip = flip
    ? { school: trunc(flip.school, MAX_NAME), aidDelta: Math.round(num(flip.aidDelta)) }
    : null

  // `comparisonResult.results` is `compareOffers` output and is already sorted.
  // `best` and `lifecycleDividend` are accepted but deliberately not trusted —
  // every claim in the prompt is derived from `results` itself.
  const claimedBest = trunc(comparisonResult.best?.school, MAX_NAME)
  if (claimedBest && claimedBest !== results[0].school) {
    console.warn(`[api/narrative] best.school (${claimedBest}) disagrees with results[0] (${results[0].school}); using results[0]`)
  }

  const userMessage = buildUserMessage({
    results,
    fit: normalizeFit(fitScores),
    major: trunc(major, 120),
    goals: goals.slice(0, MAX_GOALS).map((g) => trunc(g, 60)).filter(Boolean),
    flip: safeFlip,
  })

  const { parsed, usage } = await narrate(userMessage)

  // Every dollar token the prompt actually handed the model. Extracted from the
  // rendered message so this set can never drift from what was supplied.
  const supplied = new Set(
    (userMessage.match(MONEY_TOKEN) ?? []).map((t) => t.replace(/\s/g, '').toLowerCase()),
  )

  const verdict = trunc(parsed?.verdict, MAX_VERDICT)
  const brief = trunc(parsed?.brief, MAX_BRIEF)
  const tension = trunc(parsed?.tension, MAX_TENSION)
  auditFigures('verdict', verdict, supplied)
  auditFigures('brief', brief, supplied)
  auditFigures('tension', tension, supplied)

  return res.status(200).json({
    verdict,
    brief,
    flipCondition: guardFlipCondition(trunc(parsed?.flipCondition, MAX_FLIP), safeFlip),
    tension,
    model: MODEL,
    usage,
  })
})
