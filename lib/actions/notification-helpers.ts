import { createSupaseClient } from "../supabase"


export interface CreateNotificationData {
  userId: string
  title: string
  message: string
  priority?: "low" | "medium" | "high"
}

export async function createNotification(data: CreateNotificationData) {
  const supabase = createSupaseClient()

  const { error } = await supabase.from("notifications").insert({
    user_id: data.userId,
    title: data.title,
    message: data.message,
    priority: data.priority || "low", // Default matches your schema
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
  const supabase = createSupaseClient()

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

// Helper to create notification when new user registers
export async function notifyNewUserRegistration(newUserName: string, newUserEmail: string) {
  await notifyAllManagers(
    "New User Registration",
    `${newUserName} (${newUserEmail}) has registered and is pending approval.`,
    "medium",
  )
}

// Helper to create system-wide announcements
export async function createSystemAnnouncement(
  title: string,
  message: string,
  priority: "low" | "medium" | "high" = "low",
) {
  const supabase = createSupaseClient()

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
