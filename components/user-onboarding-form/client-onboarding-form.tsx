"use client"

import { useRouter } from "next/navigation"
import UserOnboardingForm from "./user-onboarding-form"

interface ClientOnboardingFormProps {
  departments: string[]
}

export default function ClientOnboardingForm({ departments }: ClientOnboardingFormProps) {
  const router = useRouter()

  return (
    <UserOnboardingForm
      departments={departments}
      onComplete={() => router.push("/dashboard")} // ✅ function only in client file
    />
  )
}
