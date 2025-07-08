import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { checkUserProfileExists } from "@/lib/actions/user.action"
import { getDepartments } from "@/lib/actions/property.action"
import UserOnboardingForm from "@/components/user-onboarding-form"

export default async function OnboardingPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const profileExists = await checkUserProfileExists(userId)
  if (profileExists) {
    redirect("/dashboard")
  }

  const departments = await getDepartments()

  return (
    <UserOnboardingForm
      departments={departments}
      onComplete={() => {
        window.location.href = "/dashboard"
      }}
    />
  )
}
