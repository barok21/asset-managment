"use client"

import { useOnboarding } from "@/hooks/use-onboarding"
import { getDepartments } from "@/lib/actions/property.action"
import { useEffect, useState } from "react"
import { Loader2, Loader2Icon, LoaderIcon } from "lucide-react"
import RequestedPropertyAdminCards from "./RequestedPropertiesTable"
import UserOnboardingForm from "./user-onboarding-form/user-onboarding-form"

export default function DashboardWithOnboarding() {
  const { needsOnboarding, loading } = useOnboarding()
  const [departments, setDepartments] = useState<string[]>([])

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const depts = await getDepartments()
        setDepartments(depts)
      } catch (error) {
        console.error("Error loading departments:", error)
      }
    }
    loadDepartments()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <LoaderIcon className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (needsOnboarding) {
    return <UserOnboardingForm departments={departments} onComplete={() => window.location.reload()} />
  }

  return <RequestedPropertyAdminCards />
}
