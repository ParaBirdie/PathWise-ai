import { client, MODEL, handler } from './_anthropic.js'

/**
 * POST /api/chat — Agent A3, the School Advisor (§5).
 *
 * A STATELESS PROXY, deliberately. It injects the API key, forwards `system`,
 * `messages` and `tools` to the model, and streams the reply back as SSE. It
 * holds no session state and knows nothing about colleges: the system prompt is
 * built client-side (it names one school), the tool loop runs client-side, and
 * the full history is re-sent every turn. That is what keeps `compareOffers()` —
 * browser-side JS with Supabase-loaded module state — from having to be
 * duplicated on the server.
 *
 * No `thinking` and no `output_config.effort`: both are hard 400s on
 * claude-haiku-4-5. `temperature` is allowed on it.
 */

const MAX_TOKENS = 1200
const TEMPERATURE = 0.6

// The key is injected here, so this route is an open door to the account if it
// forwards anything at all. These caps are not a security model — they are the
// cheap ceiling that stops a trivially large or long-running request.
const LIMITS = {
  systemChars: 20000,
  messages: 40,
  tools: 4,
  bodyChars: 200000,
}

const sse = (res, payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`)

export default handler(async (req, res) => {
  const { system, messages, tools } = req.body ?? {}

  if (typeof system !== 'string' || system.length > LIMITS.systemChars) {
    return res.status(400).json({ error: 'system must be a string' })
  }
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > LIMITS.messages) {
    return res.status(400).json({ error: `messages must be 1-${LIMITS.messages} entries` })
  }
  if (tools !== undefined && (!Array.isArray(tools) || tools.length > LIMITS.tools)) {
    return res.status(400).json({ error: `tools must be at most ${LIMITS.tools} entries` })
  }
  if (JSON.stringify(req.body).length > LIMITS.bodyChars) {
    return res.status(413).json({ error: 'Payload too large' })
  }

  // Headers before the first token. `no-transform` and `X-Accel-Buffering: no`
  // keep proxies from coalescing the stream into one response.
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.statusCode = 200

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system,
    messages,
    ...(tools?.length ? { tools } : {}),
  })

  // Abandoned drawer / closed tab — stop paying for tokens nobody will read.
  //
  // This listens on `res`, not `req`. Both this dev middleware and Vercel read
  // the request body to completion before the handler runs, so by the time we
  // get here `req` is already destroyed and its 'close' has long since fired —
  // a listener on it never runs. `res` emits 'close' when the client actually
  // goes away (and again after a normal end, which `writableEnded` filters out).
  let clientGone = false
  res.on('close', () => {
    if (res.writableEnded) return          // normal end, not a disconnect
    clientGone = true
    stream.abort()
  })

  try {
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        sse(res, { type: 'text', text: event.delta.text })
      } else if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
        // Lets the drawer show "running the model…" before the args finish.
        sse(res, { type: 'tool_start', name: event.content_block.name })
      }
    }

    // The assembled message. The client appends this to its history verbatim and
    // reads `tool_use` blocks off it — the tool loop is relayed, not resolved here.
    const message = await stream.finalMessage()
    sse(res, {
      type: 'final',
      message: {
        role: message.role,
        content: message.content,
        stop_reason: message.stop_reason,
      },
    })
    res.write('data: [DONE]\n\n')
    return res.end()
  } catch (err) {
    // Past the first byte the status line is already sent, so handler()'s JSON
    // error mapping cannot apply. Report in-band and close cleanly instead of
    // leaving the client on a hung stream.
    // An abort we caused because the client hung up is expected, not a failure,
    // and there is no socket left to report it on.
    if (clientGone) return res
    console.error('[api] chat stream failed:', err?.message ?? err)
    if (res.writableEnded || res.destroyed) return res
    sse(res, { type: 'error', error: 'The model stopped responding.' })
    res.write('data: [DONE]\n\n')
    return res.end()
  }
})
