import Anthropic from '@anthropic-ai/sdk'

export const client = new Anthropic()   // reads ANTHROPIC_API_KEY from env
export const MODEL = 'claude-haiku-4-5'

/** Wrap a handler with method guard, body guard, and typed error mapping. */
export function handler(fn) {
  return async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }
    try {
      return await fn(req, res)
    } catch (err) {
      // Typed SDK errors, most specific first.
      if (err instanceof Anthropic.AuthenticationError) {
        console.error('[api] bad ANTHROPIC_API_KEY')
        return res.status(500).json({ error: 'Server misconfigured' })
      }
      if (err instanceof Anthropic.RateLimitError) {
        return res.status(429).json({ error: 'Rate limited, retry shortly' })
      }
      if (err instanceof Anthropic.APIError) {
        console.error(`[api] Anthropic ${err.status}: ${err.message}`)
        return res.status(502).json({ error: 'Upstream model error' })
      }
      console.error('[api]', err)
      return res.status(500).json({ error: 'Internal error' })
    }
  }
}
