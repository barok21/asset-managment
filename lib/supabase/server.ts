import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"

// Server-side Supabase client (with Clerk integration)
export const createServerSupabaseClient = () => {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: {
      // Add auth token for server-side requests
      fetch: async (url, options = {}) => {
        const clerkToken = await (await auth()).getToken()

        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: clerkToken ? `Bearer ${clerkToken}` : "",
          },
        })
      },
    },
  })
}
