import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { checkUserProfileExists } from "@/lib/actions/user.action"
import { getDepartments } from "@/lib/actions/property.action"
import ClientOnboardingForm from "@/components/user-onboarding-form/client-onboarding-form"

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

  return <ClientOnboardingForm departments={departments} /> // ✅ No function props passed
}
