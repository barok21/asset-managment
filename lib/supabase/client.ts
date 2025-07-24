import { createClient } from "@supabase/supabase-js"

// Client-side Supabase client (no Clerk integration)
export const createClientSupabaseClient = () => {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
