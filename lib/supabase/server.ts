import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client (with Clerk integration)
export const createServerSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      },
    }
  );
};

// Alternative with Clerk token (if you have Clerk Supabase integration set up)
export const createServerSupabaseClientWithAuth = async () => {
  const { getToken } = await auth();
  const token = await getToken({ template: "supabase" });

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: token
            ? `Bearer ${token}`
            : `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      },
    }
  );
};
