"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { checkUserProfileExists } from "@/lib/actions/user.action"

export function useOnboarding() {
  const { user, isLoaded } = useUser()
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isLoaded || !user) return

      try {
        const profileExists = await checkUserProfileExists(user.id)
        setNeedsOnboarding(!profileExists)
      } catch (error) {
        console.error("Error checking onboarding status:", error)
        setNeedsOnboarding(true)
      } finally {
        setLoading(false)
      }
    }

    checkOnboarding()
  }, [user, isLoaded])

  return { needsOnboarding, loading, isLoaded }
}
