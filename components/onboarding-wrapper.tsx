"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { checkUserProfileExists } from "@/lib/actions/user.action"
import { getDepartments } from "@/lib/actions/property.action"
import { Loader2 } from "lucide-react"
import UserOnboardingForm from "./user-onboarding-form/user-onboarding-form"

interface OnboardingWrapperProps {
  children: React.ReactNode
}

export default function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { user, isLoaded, isSignedIn } = useUser()
  const [profileExists, setProfileExists] = useState<boolean | null>(null)
  const [departments, setDepartments] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      router.replace("/sign-in")
      return
    }

    const fetchData = async () => {
      try {
        const [exists, depts] = await Promise.all([
          checkUserProfileExists(user.id),
          getDepartments(),
        ])
        setProfileExists(exists)
        setDepartments(depts)
      } catch (err) {
        console.error(err)
      }
    }

    fetchData()
  }, [user, isLoaded, isSignedIn, router])

  if (!isLoaded || profileExists === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span>Loading...</span>
      </div>
    )
  }

  if (!profileExists) {
    return (
      <UserOnboardingForm
        departments={departments}
        onComplete={() => {
          setProfileExists(true)
          router.push("/dashboard")
        }}
      />
    )
  }

  return <>{children}</>
}
