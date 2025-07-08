import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { checkUserProfileExists } from "@/lib/actions/user.action"

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
