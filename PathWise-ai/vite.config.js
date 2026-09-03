import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { localApi } from './vite-plugin-local-api.js'

const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
  "font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; " +
  "img-src 'self' data: https://*.supabase.co; frame-ancestors 'none'; " +
  "base-uri 'self'; form-action 'self';"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')   // '' → include non-VITE_ vars
  process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY

  return {
    plugins: [react(), tailwindcss(), localApi()],
    server: {
      port: process.env.PORT ? Number(process.env.PORT) : 5173,
      strictPort: true,
      headers: {
        // Same policy as netlify.toml / vercel.json so CSP violations surface
        // in local dev instead of at deploy time.
        'Content-Security-Policy': CSP,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      },
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
