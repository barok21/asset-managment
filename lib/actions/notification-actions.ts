"use server"

import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export interface CreateNotificationData {
  userId: string
  title: string
  message: string
  priority?: "low" | "medium" | "high"
}

export async function createNotification(data: CreateNotificationData) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from("notifications").insert({
    user_id: data.userId,
    title: data.title,
    message: data.message,
    priority: data.priority || "low",
    is_read: false,
  })

  if (error) {
    console.error("Failed to create notification:", error)
    throw error
  }
}

export async function notifyUserApproval(userId: string, approved: boolean) {
  await createNotification({
    userId,
    title: approved ? "Account Approved" : "Account Rejected",
    message: approved
      ? "Your account has been approved and you now have access to the system."
      : "Your account application has been rejected. Please contact support for more information.",
    priority: "high",
  })
}

export async function notifyRoleChange(userId: string, newRole: string) {
  await createNotification({
    userId,
    title: "Role Updated",
    message: `Your role has been updated to ${newRole.replace("_", " ")}.`,
    priority: "medium",
  })
}

export async function notifyAllManagers(
  title: string,
  message: string,
  priority: "low" | "medium" | "high" = "medium",
) {
  const supabase = createServerSupabaseClient()

  // Get all managers
  const { data: managers } = await supabase
    .from("user_profiles")
    .select("user_id")
    .in("role", ["finance_manager", "property_manager", "higher_manager", "admin"])

  if (managers) {
    const notifications = managers.map((manager) => ({
      user_id: manager.user_id,
      title,
      message,
      priority,
      is_read: false,
    }))

    await supabase.from("notifications").insert(notifications)
  }
}

export async function notifyNewUserRegistration(newUserName: string, newUserEmail: string) {
  await notifyAllManagers(
    "New User Registration",
    `${newUserName} (${newUserEmail}) has registered and is pending approval.`,
    "medium",
  )
}

export async function createSystemAnnouncement(
  title: string,
  message: string,
  priority: "low" | "medium" | "high" = "low",
) {
  const supabase = createServerSupabaseClient()

  // Get all active users
  const { data: users } = await supabase.from("user_profiles").select("user_id").eq("status", "approved")

  if (users) {
    const notifications = users.map((user) => ({
      user_id: user.user_id,
      title,
      message,
      priority,
      is_read: false,
    }))

    await supabase.from("notifications").insert(notifications)
  }
}

// Server action to get current user's notifications
export async function getCurrentUserNotifications() {
  const { userId } = await auth()
  if (!userId) return []

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch notifications:", error)
    return []
  }

  return (
    data?.map((item: any) => ({
      id: item.id.toString(),
      title: item.title,
      message: item.message,
      isRead: item.is_read,
      createdAt: item.created_at,
      priority: item.priority as "low" | "medium" | "high",
    })) || []
  )
}
