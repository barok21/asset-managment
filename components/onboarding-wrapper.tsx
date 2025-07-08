"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { checkUserProfileExists } from "@/lib/actions/user.action"
import { getDepartments } from "@/lib/actions/property.action"
import UserOnboardingForm from "./user-onboarding-form"
import { Loader2 } from "lucide-react"

interface OnboardingWrapperProps {
  children: React.ReactNode
}

export default function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { user, isLoaded } = useUser()
  const [profileExists, setProfileExists] = useState<boolean | null>(null)
  const [departments, setDepartments] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkProfile = async () => {
      if (!isLoaded || !user) return

      try {
        const [exists, depts] = await Promise.all([checkUserProfileExists(user.id), getDepartments()])

        setProfileExists(exists)
        setDepartments(depts)
      } catch (error) {
        console.error("Error checking profile:", error)
        setProfileExists(false)
      } finally {
        setLoading(false)
      }
    }

    checkProfile()
  }, [user, isLoaded])

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!profileExists) {
    return <UserOnboardingForm departments={departments} onComplete={() => setProfileExists(true)} />
  }

  return <>{children}</>
}
