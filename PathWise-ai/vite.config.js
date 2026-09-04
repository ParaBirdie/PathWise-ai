import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { localApi } from './vite-plugin-local-api.js'

// Production policy. Keep byte-identical to netlify.toml and vercel.json.
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
  "font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; " +
  "img-src 'self' data: https://*.supabase.co; frame-ancestors 'none'; " +
  "base-uri 'self'; form-action 'self';"

// Dev only. @vitejs/plugin-react injects the React Refresh preamble as an
// inline <script>, which `script-src 'self'` blocks — the whole app then fails
// to mount. Nothing else is relaxed and this never reaches a build: `vite
// preview` and both host configs serve CSP unchanged.
const DEV_NONCE = 'pathwise-dev'
const DEV_CSP = CSP.replace("script-src 'self'", `script-src 'self' 'nonce-${DEV_NONCE}'`)

const securityHeaders = (csp) => ({
  'Content-Security-Policy': csp,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
})

export default defineConfig(({ mode, command }) => {
  const isDev = command === 'serve'
  const env = loadEnv(mode, process.cwd(), '')   // '' → include non-VITE_ vars
  process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY

  return {
    plugins: [react(), tailwindcss(), localApi()],
    // Dev only. cspNonce stamps nonce="..." on the script tags Vite injects,
    // including the refresh preamble, so DEV_CSP can allow them by nonce rather
    // than by 'unsafe-inline'. It is NOT dev-scoped by Vite — leaving it on
    // would ship the attribute in dist/index.html, so gate it on `command`.
    ...(isDev ? { html: { cspNonce: DEV_NONCE } } : {}),
    server: {
      port: process.env.PORT ? Number(process.env.PORT) : 5173,
      strictPort: true,
      headers: securityHeaders(DEV_CSP),
    },
    // `server.headers` does not apply to `vite preview`. The built bundle has
    // no refresh preamble, so preview gets the strict production policy — it is
    // the closest local check of what actually deploys.
    preview: {
      headers: securityHeaders(CSP),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            motion: ['framer-motion'],
            charts: ['recharts'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    },
  }
})
