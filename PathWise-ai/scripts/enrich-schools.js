#!/usr/bin/env node
/**
 * Agent A4 — Campus Fact Enricher (PRD §1, §2).
 *
 * Offline, run-by-hand enrichment. For each school it produces one
 * `university_profiles` row: 8–14 cited facts plus climate, setting,
 * student_body_size, greek_pct, notable_programs.
 *
 * Two separate commands by design — nothing touches the database until you
 * have read the JSON:
 *
 *   node scripts/enrich-schools.js --schools "Duke University"   → .tmp/enriched/*.json
 *   node scripts/enrich-schools.js --upsert                      → Supabase
 *
 * Model: claude-opus-5, not the Haiku 4.5 used by A1–A3. Per §1's note on A4,
 * this runs once offline and every runtime agent depends on its output, and
 * Opus 5 gets the current `web_search_20260209` server tool (Haiku 4.5 is
 * limited to the basic `web_search_20250305` variant). Opus 5 also *removes*
 * `temperature` — §1's `temperature: 0.2` applies to the Haiku agents only;
 * sending it here is a 400. Thinking is adaptive (on by default on Opus 5).
 *
 * Anti-hallucination is enforced in JS, not by asking nicely:
 *   1. The model must call the strict `submit_profile` tool — no free text.
 *   2. Every source_url is fetched. Dead links are dropped and handed back to
 *      the model as a tool error, which then searches for replacements.
 *   3. A profile is only written once it has 8–14 facts with resolving URLs.
 *
 * The JSON file carries two extra keys the DB does not have — `_provenance`
 * (source URLs for student_body_size / greek_pct, which `university_profiles`
 * has no column for) and `_validation` (URL check results). Both are for your
 * inspection; `--upsert` writes only the columns defined in §2 and strips the
 * validation metadata so `facts` matches the spec shape exactly.
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MODEL = 'claude-opus-5'

/** Demo scope. These strings are the primary keys in university_financials. */
const DEMO_SCHOOLS = [
  'Arizona State University',
  'Duke University',
  'UCLA',
  'University of Michigan',
  'Johns Hopkins University',
]

/**
 * Some primary keys are abbreviations. Give the model the official name so its
 * searches land — this is deterministic data, not something to ask an LLM for.
 */
const OFFICIAL_NAME = {
  UCLA: 'University of California, Los Angeles (UCLA)',
}

const OUT_DIR = path.resolve(process.cwd(), '.tmp/enriched')

const MIN_FACTS = 8
const MAX_FACTS = 14
const MIN_PROGRAMS = 4
const MAX_PROGRAMS = 8
const MAX_TURNS = 16        // hard stop on the agentic loop, per school
const MAX_REPAIR_ROUNDS = 3 // re-submissions after a validation rejection

// Claude Opus 5 pricing, $ per 1M tokens. Cache write is 1.25x input, cache
// read 0.1x. Web search is billed per search, not per token — confirm the
// current rate at anthropic.com/pricing before quoting the total anywhere.
const PRICE = {
  input: 5.0,
  output: 25.0,
  cacheWrite: 6.25,
  cacheRead: 0.5,
  webSearchPer1k: 10.0,
}

const FACT_CATEGORIES = ['academics', 'campus_life', 'location', 'outcomes', 'cost']
const CLIMATE_VALUES = ['warm', 'cold', 'mild', 'wet']
const SETTING_VALUES = ['urban', 'suburban', 'rural']

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const SYSTEM = `You research verifiable facts about one university and submit them
as a structured profile. A downstream system uses these facts to explain to a
specific student why a school does or does not fit them, and cites your
source_url on screen. A fact you cannot source is worse than no fact at all.

Method:
- Use web_search to find each fact. Never submit a claim you did not read in a
  page returned by a search this turn.
- Prefer primary sources: the university's own .edu pages, its Common Data Set,
  IPEDS / NCES College Navigator, the registrar or institutional-research
  office. Reputable secondary sources are acceptable when no primary one exists.
- source_url must be the specific page you actually read. Not a search results
  page, not a site's homepage standing in for a deep page, not a URL you
  assembled from a pattern you assume exists.

What counts as a fact:
- Concrete and falsifiable. Names, numbers, requirements, structures, policies.
  "Requires all undergraduates to complete a two-semester writing sequence" is a
  fact. "Strong academics" and "vibrant campus life" are brochure copy — never
  submit them.
- Each fact should be something that could plausibly matter to some student and
  not to another. Differentiating, not generic.
- Spread them across the categories: academics, campus_life, location,
  outcomes, cost. Do not submit eight academics facts.
- Avoid tuition, salary, and other dollar figures. A separate deterministic
  financial model owns all money in this product, and facts here must not
  compete with it. Cost-category facts should describe policy and structure
  ("meets full demonstrated need without loans for families under a published
  threshold"), not amounts.

Field definitions — read these, they are not what you would assume:
- climate describes THE SCHOOL'S LOCATION, not any student's preference:
    warm = hot or hot-and-humid most of the academic year, mild winters
    cold = sustained freezing winters, meaningful snowfall
    mild = temperate, no extreme season in either direction
    wet  = defined by high precipitation / overcast days, e.g. the Pacific
           Northwest, regardless of temperature
  Pick the single value that best describes the campus. Nothing about a
  student's preferences enters this choice.
- setting: urban | suburban | rural, describing the campus's immediate
  surroundings.
- student_body_size: TOTAL enrolled students, undergraduate + graduate. Say so
  in the source you cite.
- greek_pct: the share of undergraduates in social fraternities or sororities,
  as a DECIMAL FRACTION between 0 and 1. 16% is 0.16, not 16.
- notable_programs: 4–8 specific programs, schools, institutes, or majors this
  university is actually distinguished for. Named entities, not adjectives.

If you genuinely cannot source student_body_size or greek_pct, list the field
name in unavailable_fields rather than estimating. An estimate presented as a
sourced number is the worst possible outcome.

Submit exactly once, when you have ${MIN_FACTS}–${MAX_FACTS} sourced facts, by calling
submit_profile. If the tool returns an error, fix precisely what it names and
call it again.`

/**
 * Strict tool. `strict: true` + `additionalProperties: false` + full `required`
 * means the model's arguments are schema-validated server-side before they ever
 * reach us. Every field is required — optionality is expressed through
 * `unavailable_fields` instead of nullable types, which keeps the schema inside
 * the subset strict mode reliably accepts.
 */
const SUBMIT_TOOL = {
  name: 'submit_profile',
  description:
    'Submit the finished, fully sourced profile for this university. Call this exactly once, ' +
    'after your research is complete.',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'facts',
      'climate',
      'setting',
      'student_body_size',
      'student_body_size_source_url',
      'greek_pct',
      'greek_pct_source_url',
      'notable_programs',
      'unavailable_fields',
    ],
    properties: {
      facts: {
        type: 'array',
        // Strict mode rejects array-length constraints ("For 'array' type,
        // 'minItems' values other than 0 or 1 are not supported"), so the
        // counts live in the description and are enforced in
        // validateSubmission(), which hands a short submission back to the
        // model as a tool error.
        description:
          `Exactly ${MIN_FACTS}-${MAX_FACTS} specific, sourced, differentiating claims. ` +
          `Fewer than ${MIN_FACTS} will be rejected.`,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['claim', 'category', 'source_url'],
          properties: {
            claim: {
              type: 'string',
              description:
                'One concrete, falsifiable sentence. No brochure adjectives, no dollar figures.',
            },
            category: { type: 'string', enum: FACT_CATEGORIES },
            source_url: {
              type: 'string',
              description: 'The exact page you read this claim on.',
            },
          },
        },
      },
      climate: {
        type: 'string',
        enum: CLIMATE_VALUES,
        description: "The campus's climate. Not a student preference. See the definitions.",
      },
      setting: { type: 'string', enum: SETTING_VALUES },
      student_body_size: {
        type: 'integer',
        description: 'Total enrollment, undergraduate + graduate. 0 if listed in unavailable_fields.',
      },
      student_body_size_source_url: {
        type: 'string',
        description: 'Source for the enrollment figure. Empty string if unavailable.',
      },
      greek_pct: {
        type: 'number',
        description:
          'Share of undergraduates in Greek life as a decimal fraction 0-1. 0 if listed in unavailable_fields.',
      },
      greek_pct_source_url: {
        type: 'string',
        description: 'Source for the Greek life figure. Empty string if unavailable.',
      },
      notable_programs: {
        type: 'array',
        // Length enforced in validateSubmission(), not here — see facts above.
        items: { type: 'string' },
        description:
          `Exactly ${MIN_PROGRAMS}-${MAX_PROGRAMS} named programs, schools, or institutes this ` +
          `university is distinguished for. Fewer than ${MIN_PROGRAMS} will be rejected.`,
      },
      unavailable_fields: {
        type: 'array',
        items: { type: 'string', enum: ['student_body_size', 'greek_pct'] },
        description:
          'Fields you could not source. Empty array if you sourced both. Never estimate instead of listing here.',
      },
    },
  },
}

const WEB_SEARCH_TOOL = {
  type: 'web_search_20260209',
  name: 'web_search',
  max_uses: 20,
}

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

/**
 * Load .env.local into process.env without adding a dependency. Existing
 * environment variables win, so an exported key overrides the file.
 */
function loadEnvLocal() {
  const file = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(file)) return
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

const slug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const usd = (n) => `$${n.toFixed(4)}`

/** Running token/cost ledger, printed as the run goes. */
class Ledger {
  constructor() {
    this.input = 0
    this.output = 0
    this.cacheWrite = 0
    this.cacheRead = 0
    this.searches = 0
    this.calls = 0
  }

  add(usage) {
    if (!usage) return 0
    const before = this.total()
    this.calls += 1
    this.input += usage.input_tokens ?? 0
    this.output += usage.output_tokens ?? 0
    this.cacheWrite += usage.cache_creation_input_tokens ?? 0
    this.cacheRead += usage.cache_read_input_tokens ?? 0
    this.searches += usage.server_tool_use?.web_search_requests ?? 0
    return this.total() - before
  }

  total() {
    return (
      (this.input / 1e6) * PRICE.input +
      (this.output / 1e6) * PRICE.output +
      (this.cacheWrite / 1e6) * PRICE.cacheWrite +
      (this.cacheRead / 1e6) * PRICE.cacheRead +
      (this.searches / 1000) * PRICE.webSearchPer1k
    )
  }

  summary() {
    return (
      `${this.calls} calls · in ${this.input.toLocaleString()} · out ${this.output.toLocaleString()} · ` +
      `cache r/w ${this.cacheRead.toLocaleString()}/${this.cacheWrite.toLocaleString()} · ` +
      `${this.searches} searches · ${usd(this.total())}`
    )
  }
}

// ---------------------------------------------------------------------------
// URL verification
// ---------------------------------------------------------------------------

/**
 * Check that a source_url actually resolves.
 *
 * Returns 'ok' | 'blocked' | 'dead'. 'blocked' is a 401/403/429 — plenty of
 * .edu sites refuse non-browser clients, so that is not evidence the page is
 * missing. Blocked URLs are kept but flagged in the JSON for you to eyeball.
 * Only 'dead' facts are dropped and sent back to the model for replacement.
 */
export async function checkUrl(url) {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    return { url, status: 'dead', detail: 'not an http(s) URL' }
  }

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,*/*',
  }

  const attempt = async (method) => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 20_000)
    try {
      const res = await fetch(url, {
        method,
        headers,
        redirect: 'follow',
        signal: ctrl.signal,
      })
      return { httpStatus: res.status }
    } finally {
      clearTimeout(timer)
    }
  }

  try {
    let { httpStatus } = await attempt('HEAD')
    // Many servers mishandle HEAD; retry anything non-2xx with a real GET.
    if (httpStatus < 200 || httpStatus >= 300) {
      ;({ httpStatus } = await attempt('GET'))
    }
    if (httpStatus >= 200 && httpStatus < 300) {
      return { url, status: 'ok', httpStatus }
    }
    if ([401, 403, 429].includes(httpStatus)) {
      return { url, status: 'blocked', httpStatus }
    }
    return { url, status: 'dead', httpStatus }
  } catch (err) {
    return { url, status: 'dead', detail: err.name === 'AbortError' ? 'timeout' : err.message }
  }
}

/** Verify a batch of URLs concurrently, deduplicated. */
async function checkUrls(urls) {
  const unique = [...new Set(urls.filter(Boolean))]
  const results = await Promise.all(unique.map(checkUrl))
  return new Map(results.map((r) => [r.url, r]))
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const BROCHURE_PATTERNS = [
  /\bstrong academics\b/i,
  /\bvibrant campus\b/i,
  /\bworld[- ]class\b/i,
  /\brich (?:history|tradition)\b/i,
  /\bsomething for everyone\b/i,
  /\bwell[- ]rounded\b/i,
]

/**
 * Validate one submission. Returns { profile, checks, problems }.
 * `problems` non-empty means the submission goes back to the model.
 */
export async function validateSubmission(schoolName, input) {
  const problems = []
  const unavailable = new Set(input.unavailable_fields ?? [])

  const factUrls = (input.facts ?? []).map((f) => f.source_url)
  const scalarUrls = [
    unavailable.has('student_body_size') ? null : input.student_body_size_source_url,
    unavailable.has('greek_pct') ? null : input.greek_pct_source_url,
  ]
  const checks = await checkUrls([...factUrls, ...scalarUrls])

  const kept = []
  const dropped = []
  for (const fact of input.facts ?? []) {
    const check = checks.get(fact.source_url)
    if (check?.status === 'dead') {
      dropped.push({ ...fact, reason: check.detail ?? `HTTP ${check.httpStatus}` })
      continue
    }
    if (BROCHURE_PATTERNS.some((re) => re.test(fact.claim))) {
      dropped.push({ ...fact, reason: 'generic brochure phrasing' })
      continue
    }
    kept.push(fact)
  }

  if (dropped.length) {
    problems.push(
      `${dropped.length} fact(s) were rejected and must be replaced with different, ` +
        `working sources:\n` +
        dropped.map((d) => `  - "${d.claim}" (${d.source_url}) → ${d.reason}`).join('\n')
    )
  }
  const programs = input.notable_programs ?? []
  if (programs.length < MIN_PROGRAMS) {
    problems.push(
      `notable_programs has ${programs.length} entries; ${MIN_PROGRAMS} is the minimum.`
    )
  }
  if (kept.length < MIN_FACTS) {
    problems.push(
      `Only ${kept.length} valid facts remain; ${MIN_FACTS} is the minimum. ` +
        `Search for additional sourced facts and resubmit the complete profile.`
    )
  }

  for (const field of ['student_body_size', 'greek_pct']) {
    if (unavailable.has(field)) continue
    const url = field === 'greek_pct' ? input.greek_pct_source_url : input.student_body_size_source_url
    const check = checks.get(url)
    if (!check || check.status === 'dead') {
      problems.push(
        `${field}_source_url (${url || 'empty'}) does not resolve. Provide a working source ` +
          `or list "${field}" in unavailable_fields.`
      )
    }
  }

  if (!unavailable.has('greek_pct') && (input.greek_pct < 0 || input.greek_pct > 1)) {
    problems.push(
      `greek_pct is ${input.greek_pct}. It must be a decimal fraction between 0 and 1 ` +
        `(16% is 0.16, not 16).`
    )
  }
  if (!CLIMATE_VALUES.includes(input.climate)) {
    problems.push(`climate must be one of ${CLIMATE_VALUES.join(' | ')}.`)
  }
  if (!SETTING_VALUES.includes(input.setting)) {
    problems.push(`setting must be one of ${SETTING_VALUES.join(' | ')}.`)
  }

  const profile = {
    school_name: schoolName,
    facts: kept.slice(0, MAX_FACTS).map((f) => ({
      claim: f.claim,
      category: f.category,
      source_url: f.source_url,
    })),
    climate: input.climate,
    setting: input.setting,
    student_body_size: unavailable.has('student_body_size') ? null : input.student_body_size,
    greek_pct: unavailable.has('greek_pct') ? null : input.greek_pct,
    notable_programs: programs.slice(0, MAX_PROGRAMS),
    generated_at: new Date().toISOString(),
    model_used: MODEL,
  }

  return { profile, checks: [...checks.values()], dropped, problems }
}

// ---------------------------------------------------------------------------
// Enrichment
// ---------------------------------------------------------------------------

async function enrichSchool(client, schoolName, ledger) {
  const displayName = OFFICIAL_NAME[schoolName] ?? schoolName

  const messages = [
    {
      role: 'user',
      content:
        `Research ${displayName} and submit its profile.\n\n` +
        `The primary key for this school in our database is exactly "${schoolName}" — ` +
        `do not alter that string.\n\n` +
        `Find ${MIN_FACTS}-${MAX_FACTS} specific, sourced, differentiating facts spread across ` +
        `academics, campus_life, location, outcomes, and cost, then call submit_profile.`,
    },
  ]

  let repairRounds = 0
  let lastValidation = null
  // web_search_20260209 runs code execution under the hood for its dynamic
  // filtering, which provisions a container. Every follow-up request in the
  // same conversation must name that container, or the API rejects it with
  // "container_id is required when there are pending tool uses generated by
  // code execution with tools". This only bites on a repair round, which is
  // why the first school through (zero repairs) never saw it.
  let containerId = null

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      ...(containerId ? { container: containerId } : {}),
      // No `temperature`: removed on Opus 5 (§1's 0.2 is for the Haiku agents).
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      system: SYSTEM,
      tools: [WEB_SEARCH_TOOL, SUBMIT_TOOL],
      messages,
    })
    const response = await stream.finalMessage()

    if (response.container?.id) containerId = response.container.id

    const delta = ledger.add(response.usage)
    console.log(
      `    turn ${turn + 1}: ${response.stop_reason} · +${usd(delta)} · running ${usd(ledger.total())} ` +
        `(${ledger.searches} searches)`
    )

    if (response.stop_reason === 'refusal') {
      throw new Error(
        `Model refused: ${response.stop_details?.category ?? 'unknown'} — ` +
          `${response.stop_details?.explanation ?? ''}`
      )
    }

    // Echo the assistant turn back verbatim — thinking blocks included.
    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'pause_turn') {
      // Long server-tool turn paused mid-flight; resume by resending as-is.
      continue
    }

    const submission = response.content.find(
      (b) => b.type === 'tool_use' && b.name === 'submit_profile'
    )

    if (!submission) {
      if (response.stop_reason === 'max_tokens') {
        throw new Error('Hit max_tokens without a submission. Raise max_tokens and retry.')
      }
      messages.push({
        role: 'user',
        content:
          'You have not submitted a profile yet. Continue researching if you need to, then ' +
          'call submit_profile with the complete result.',
      })
      continue
    }

    console.log(`    validating ${submission.input.facts?.length ?? 0} facts and their sources…`)
    const validation = await validateSubmission(schoolName, submission.input)
    lastValidation = validation

    if (validation.problems.length === 0) {
      const blocked = validation.checks.filter((c) => c.status === 'blocked')
      if (blocked.length) {
        console.log(
          `    note: ${blocked.length} source(s) returned 401/403/429 to this script. ` +
            `Kept and flagged in the JSON — open them yourself:`
        )
        for (const b of blocked) console.log(`      ${b.httpStatus} ${b.url}`)
      }
      return {
        ...validation.profile,
        _provenance: {
          student_body_size_source_url: validation.profile.student_body_size === null
            ? null
            : submission.input.student_body_size_source_url,
          greek_pct_source_url: validation.profile.greek_pct === null
            ? null
            : submission.input.greek_pct_source_url,
        },
        _validation: {
          repair_rounds: repairRounds,
          url_checks: validation.checks,
          facts_dropped: validation.dropped,
        },
      }
    }

    repairRounds += 1
    if (repairRounds > MAX_REPAIR_ROUNDS) {
      throw new Error(
        `Still invalid after ${MAX_REPAIR_ROUNDS} repair rounds:\n${validation.problems.join('\n')}`
      )
    }

    console.log(`    rejected (round ${repairRounds}/${MAX_REPAIR_ROUNDS}):`)
    for (const p of validation.problems) console.log(`      ${p.split('\n')[0]}`)

    messages.push({
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: submission.id,
          is_error: true,
          content:
            `The profile was rejected. Every source_url was fetched; the problems below are ` +
            `mechanical, not stylistic.\n\n${validation.problems.join('\n\n')}\n\n` +
            `Search for replacements and call submit_profile again with the COMPLETE profile ` +
            `(keep the facts that were not rejected).`,
        },
      ],
    })
  }

  throw new Error(
    `Gave up after ${MAX_TURNS} turns.` +
      (lastValidation ? ` Last problems:\n${lastValidation.problems.join('\n')}` : '')
  )
}

async function runPreflight(schools) {
  loadEnvLocal()
  if (!process.env.ANTHROPIC_API_KEY) {
    fail('ANTHROPIC_API_KEY is not set. Put it in .env.local (never VITE_-prefixed).')
  }
  const client = new Anthropic()

  console.log(`\nPreflight: validating the request shape with count_tokens (free, no generation).`)
  const { input_tokens } = await client.messages.countTokens({
    model: MODEL,
    thinking: { type: 'adaptive' },
    system: SYSTEM,
    // Server tools are rejected by count_tokens ("Use the /v1/messages endpoint
    // instead"), so only the custom tool is checked here — that is the schema
    // that can actually be malformed. The web_search tool is a fixed constant.
    tools: [SUBMIT_TOOL],
    messages: [{ role: 'user', content: `Research ${schools[0]} and submit its profile.` }],
  })
  console.log(
    `✓ Accepted. System prompt + submit_profile schema = ${input_tokens.toLocaleString()} input ` +
      `tokens (${usd((input_tokens / 1e6) * PRICE.input)} on turn one, before search results).`
  )
  console.log(`\nStrict schema is valid. Safe to run the paid enrichment.`)
}

async function runEnrich(schools) {
  loadEnvLocal()
  if (!process.env.ANTHROPIC_API_KEY) {
    fail('ANTHROPIC_API_KEY is not set. Put it in .env.local (never VITE_-prefixed).')
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const client = new Anthropic()
  const ledger = new Ledger()

  console.log(`\nEnriching ${schools.length} school(s) with ${MODEL}.`)
  console.log(`Output → ${path.relative(process.cwd(), OUT_DIR)}/\n`)

  const failures = []
  for (const [i, school] of schools.entries()) {
    const outFile = path.join(OUT_DIR, `${slug(school)}.json`)
    console.log(`[${i + 1}/${schools.length}] ${school}`)

    if (fs.existsSync(outFile) && !flagSet('force')) {
      console.log(`    already enriched — skipping (--force to redo)\n`)
      continue
    }

    try {
      const profile = await enrichSchool(client, school, ledger)
      fs.writeFileSync(outFile, `${JSON.stringify(profile, null, 2)}\n`)
      console.log(
        `    ✓ ${profile.facts.length} facts · climate=${profile.climate} · ` +
          `setting=${profile.setting} → ${path.relative(process.cwd(), outFile)}\n`
      )
    } catch (err) {
      failures.push({ school, message: err.message })
      console.error(`    ✗ ${err.message}\n`)
    }
  }

  console.log(`Total: ${ledger.summary()}`)
  if (failures.length) {
    console.error(`\n${failures.length} school(s) failed:`)
    for (const f of failures) console.error(`  ${f.school}: ${f.message}`)
    console.error(`\nNothing was written to Supabase. Inspect the JSON, then run --upsert.`)
    process.exitCode = 1
    return
  }
  console.log(`\nInspect the JSON, then upsert:\n  node scripts/enrich-schools.js --upsert`)
}

// ---------------------------------------------------------------------------
// Upsert (no model calls — reads only what is already on disk)
// ---------------------------------------------------------------------------

/** Strip inspection-only keys; write exactly the columns §2 defines. */
export function toRow(profile) {
  return {
    school_name: profile.school_name,
    facts: profile.facts,
    climate: profile.climate,
    setting: profile.setting,
    student_body_size: profile.student_body_size,
    greek_pct: profile.greek_pct,
    notable_programs: profile.notable_programs,
    generated_at: profile.generated_at,
    model_used: profile.model_used,
  }
}

async function runUpsert(schools) {
  loadEnvLocal()

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  // Writes need the service role: university_profiles' RLS policy grants
  // public SELECT only. This key is server-side only, like ANTHROPIC_API_KEY.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  if (!url) fail('SUPABASE_URL (or VITE_SUPABASE_URL) is not set in .env.local.')
  if (!key) {
    fail(
      'SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) is not set in .env.local. Inserts ' +
        'into university_profiles need it — the table\'s RLS policy grants public read only. ' +
        'Supabase dashboard → Project Settings → API keys. Never VITE_-prefix it.'
    )
  }

  const rows = []
  for (const school of schools) {
    const file = path.join(OUT_DIR, `${slug(school)}.json`)
    if (!fs.existsSync(file)) {
      fail(`No JSON for "${school}" at ${path.relative(process.cwd(), file)}. Enrich it first.`)
    }
    const profile = JSON.parse(fs.readFileSync(file, 'utf8'))

    if (profile.school_name !== school) {
      fail(`${file} has school_name "${profile.school_name}", expected "${school}".`)
    }
    if (!Array.isArray(profile.facts) || profile.facts.length < MIN_FACTS) {
      fail(`${file} has ${profile.facts?.length ?? 0} facts; ${MIN_FACTS} is the minimum.`)
    }
    if (!CLIMATE_VALUES.includes(profile.climate)) {
      fail(`${file} has climate "${profile.climate}"; expected ${CLIMATE_VALUES.join('|')}.`)
    }
    if (!SETTING_VALUES.includes(profile.setting)) {
      fail(`${file} has setting "${profile.setting}"; expected ${SETTING_VALUES.join('|')}.`)
    }
    rows.push(toRow(profile))
  }

  console.log(`\nUpserting ${rows.length} row(s) into university_profiles:`)
  for (const r of rows) console.log(`  ${r.school_name} — ${r.facts.length} facts`)

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const { data, error } = await supabase
    .from('university_profiles')
    .upsert(rows, { onConflict: 'school_name' })
    .select('school_name')

  if (error) {
    console.error(`\nUpsert failed: ${error.message}`)
    if (/does not exist/i.test(error.message)) {
      console.error(
        'The university_profiles table may not exist yet — it ships in the §2 migration, ' +
          'which a separate agent owns. Apply that migration first.'
      )
    }
    process.exitCode = 1
    return
  }

  console.log(`\n✓ Upserted ${data?.length ?? rows.length} row(s).`)
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2)

function flagSet(name) {
  return argv.includes(`--${name}`)
}

function flagValue(name) {
  const i = argv.indexOf(`--${name}`)
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1]
  const inline = argv.find((a) => a.startsWith(`--${name}=`))
  return inline ? inline.slice(name.length + 3) : null
}

function fail(message) {
  console.error(`\nError: ${message}\n`)
  process.exit(1)
}

function resolveSchools() {
  const raw = flagValue('schools')
  if (!raw) return DEMO_SCHOOLS

  const requested = raw.split(',').map((s) => s.trim()).filter(Boolean)
  const resolved = requested.map((r) => {
    const match = DEMO_SCHOOLS.find((s) => s.toLowerCase() === r.toLowerCase())
    if (!match) {
      fail(
        `Unknown school "${r}". In scope for this demo:\n` +
          DEMO_SCHOOLS.map((s) => `  ${s}`).join('\n')
      )
    }
    return match
  })
  return [...new Set(resolved)]
}

const USAGE = `
Agent A4 — Campus Fact Enricher

  node scripts/enrich-schools.js [--schools "A,B"] [--force]
      Research each school with ${MODEL} and write .tmp/enriched/<slug>.json.
      Costs real money. Skips schools whose JSON already exists unless --force.

  node scripts/enrich-schools.js --preflight
      Validate the model, tools, and strict schema with count_tokens. Free.

  node scripts/enrich-schools.js --upsert [--schools "A,B"]
      Upsert the JSON already on disk into university_profiles. No model calls.

Schools in scope:
${DEMO_SCHOOLS.map((s) => `  ${s}`).join('\n')}
`

async function main() {
  if (flagSet('help') || flagSet('h')) {
    console.log(USAGE)
    return
  }
  const schools = resolveSchools()
  if (flagSet('upsert')) await runUpsert(schools)
  else if (flagSet('preflight')) await runPreflight(schools)
  else await runEnrich(schools)
}

// Only run when invoked directly, so the validation helpers above can be
// imported and exercised without firing off a paid run.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err) => {
    console.error(`\nFatal: ${err.stack ?? err.message}\n`)
    process.exit(1)
  })
}
