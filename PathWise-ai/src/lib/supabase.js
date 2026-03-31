import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fail loudly at startup rather than silently falling back to placeholder
// credentials that would cause confusing runtime errors on every DB call.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[PathWise] Missing Supabase configuration. ' +
    'Copy .env.example to .env.local and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

// Use sessionStorage instead of localStorage so the anonymous session is
// scoped to the current browser tab. Closing the tab clears the identity,
// meaning every new visit starts with a fresh anonymous user and cannot
// access question_data rows written by a previous session.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
})
