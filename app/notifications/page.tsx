import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { checkUserProfileExists } from "@/lib/actions/user.action"
import { NotificationsPageClient } from "./notifications-client"

export default async function NotificationsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const profileExists = await checkUserProfileExists(userId)

  if (!profileExists) {
    redirect("/onboarding")
  }

  return <NotificationsPageClient />
}
