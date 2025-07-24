import type React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { checkUserProfileExists } from "@/lib/actions/user.action"

// Create a client component wrapper for React Query
function QueryWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient()

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export default async function HomePage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const profileExists = await checkUserProfileExists(userId)

  if (!profileExists) {
    redirect("/onboarding")
  }

  redirect("/dashboard")
}
