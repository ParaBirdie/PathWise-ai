import { client, MODEL, handler } from './_anthropic.js'

// Batch 1 (§0) is plumbing only: this route exists to prove an end-to-end
// Anthropic call works through the serverless layer. The real A1 system prompt
// and the `output_config` JSON schema arrive in Batch 3 (§3); until then the
// system prompt is a placeholder, `output_config` is omitted entirely, and the
// model's raw text is returned as-is rather than parsed.
const SYSTEM = 'You are a placeholder. Reply with the single word: ok.'

export default handler(async (req, res) => {
  const { schools, major, interests = '', profiles = [], ...prefs } = req.body ?? {}

  if (!Array.isArray(schools) || schools.length === 0 || schools.length > 4) {
    return res.status(400).json({ error: 'schools must be 1-4 entries' })
  }

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    temperature: 0.2,
    system: SYSTEM,
    messages: [{
      role: 'user',
      content:
        `Student: major=${major}, ${JSON.stringify(prefs)}\n\n` +
        `<student_interests>\n${interests}\n</student_interests>\n\n` +
        `Schools and their verified facts:\n${JSON.stringify(profiles)}`,
    }],
  })

  const text = message.content.find((b) => b.type === 'text')?.text ?? ''
  return res.status(200).json({ text, model: message.model, usage: message.usage })
})
