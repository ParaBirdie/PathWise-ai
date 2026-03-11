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

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
