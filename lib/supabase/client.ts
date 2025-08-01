import { createClient } from "@supabase/supabase-js";

// Client-side Supabase client with proper headers and debugging
export const createClientSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("Supabase URL:", supabaseUrl);
  console.log("Supabase Anon Key exists:", !!supabaseAnonKey);

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables");
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // We're using Clerk for auth
    },
    global: {
      headers: {
        apikey: supabaseAnonKey,
      },
    },
  });
};
