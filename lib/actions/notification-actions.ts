"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  priority?: "low" | "medium" | "high";
}

interface UserProfile {
  user_id: string;
}

export async function createNotification(data: CreateNotificationData) {
  try {
    const supabase = createServerSupabaseClient();

    const { error } = await supabase.from("notifications").insert({
      user_id: data.userId,
      title: data.title,
      message: data.message,
      priority: data.priority || "low",
      is_read: false,
    });

    if (error) {
      console.error("Supabase error:", error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    // Revalidate to refresh any server-side cached data
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
}

export async function notifyUserApproval(userId: string, approved: boolean) {
  return await createNotification({
    userId,
    title: approved ? "Account Approved" : "Account Rejected",
    message: approved
      ? "Your account has been approved and you now have access to the system."
      : "Your account application has been rejected. Please contact support for more information.",
    priority: "high",
  });
}

export async function notifyRoleChange(userId: string, newRole: string) {
  return await createNotification({
    userId,
    title: "Role Updated",
    message: `Your role has been updated to ${newRole.replace("_", " ")}.`,
    priority: "medium",
  });
}

export async function notifyAllManagers(
  title: string,
  message: string,
  priority: "low" | "medium" | "high" = "medium"
) {
  try {
    const supabase = createServerSupabaseClient();

    // Get all managers
    const { data: managers, error: fetchError } = await supabase
      .from("user_profiles")
      .select("user_id")
      .in("role", [
        "finance_manager",
        "property_manager",
        "higher_manager",
        "admin",
      ]);

    if (fetchError) {
      console.error("Error fetching managers:", fetchError);
      throw new Error(`Failed to fetch managers: ${fetchError.message}`);
    }

    if (managers && managers.length > 0) {
      const notifications = managers.map((manager: UserProfile) => ({
        user_id: manager.user_id,
        title,
        message,
        priority,
        is_read: false,
      }));

      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (insertError) {
        console.error("Error inserting notifications:", insertError);
        throw new Error(
          `Failed to create notifications: ${insertError.message}`
        );
      }
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to notify managers:", error);
    throw error;
  }
}

export async function notifyNewUserRegistration(
  newUserName: string,
  newUserEmail: string
) {
  return await notifyAllManagers(
    "New User Registration",
    `${newUserName} (${newUserEmail}) has registered and is pending approval.`,
    "medium"
  );
}

export async function createSystemAnnouncement(
  title: string,
  message: string,
  priority: "low" | "medium" | "high" = "low"
) {
  try {
    const supabase = createServerSupabaseClient();

    // Get all active users
    const { data: users, error: fetchError } = await supabase
      .from("user_profiles")
      .select("user_id")
      .eq("status", "approved");

    if (fetchError) {
      console.error("Error fetching users:", fetchError);
      throw new Error(`Failed to fetch users: ${fetchError.message}`);
    }

    if (users && users.length > 0) {
      const notifications = users.map((user: UserProfile) => ({
        user_id: user.user_id,
        title,
        message,
        priority,
        is_read: false,
      }));

      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (insertError) {
        console.error("Error inserting system notifications:", insertError);
        throw new Error(
          `Failed to create system announcement: ${insertError.message}`
        );
      }
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to create system announcement:", error);
    throw error;
  }
}

// Server action to get current user's notifications
export async function getCurrentUserNotifications() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch notifications:", error);
      return [];
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
    );
  } catch (error) {
    console.error("Error in getCurrentUserNotifications:", error);
    return [];
  }
}
