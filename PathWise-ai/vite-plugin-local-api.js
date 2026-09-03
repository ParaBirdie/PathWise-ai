import fs from 'node:fs'
import path from 'node:path'

/** Serves api/*.js as Vercel-style handlers during `vite dev`. */
export function localApi() {
  return {
    name: 'local-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()

        const name = req.url.split('?')[0].slice('/api/'.length)
        const file = path.resolve(process.cwd(), 'api', `${name}.js`)
        if (!name || name.startsWith('_') || !fs.existsSync(file)) return next()

        // Vercel parses the JSON body for you; Vite does not.
        const chunks = []
        for await (const c of req) chunks.push(c)
        try {
          req.body = chunks.length ? JSON.parse(Buffer.concat(chunks)) : {}
        } catch { req.body = {} }

        // Shim the two response helpers Vercel handlers use.
        res.status = (code) => { res.statusCode = code; return res }
        res.json = (obj) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(obj))
          return res
        }

        try {
          const mod = await server.ssrLoadModule(file)
          await mod.default(req, res)
        } catch (err) {
          server.config.logger.error(`[local-api] ${name}\n${err.stack}`)
          if (!res.writableEnded) res.status(500).json({ error: 'Local API error' })
        }
      })
    },
  }
}
