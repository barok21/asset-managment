"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserRole } from "@/lib/actions/user.action";

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
    const role = await getUserRole();
    if (role === "department_user") {
      throw new Error(
        "System-wide announcements are restricted to managers and admins."
      );
    }

    const supabase = createServerSupabaseClient();

    const { data: users, error: fetchError } = await supabase
      .from("user_profiles")
      .select("user_id")
      .eq("status", "approved");

    if (fetchError) {
      console.error("Error fetching users:", fetchError);
      throw new Error(`Failed to fetch users: ${fetchError.message}`);
    }

    if (users && users.length > 0) {
      const notifications = users.map((user: { user_id: string }) => ({
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

// Helper: summarize a request batch (request_property)
async function getRequestBatchSummary(batchId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("request_property")
    .select(
      "username, requestor_full_name, department, start_date, return_date, created_at"
    )
    .eq("request_batch_id", batchId);

  if (error) {
    console.error("Failed to load request batch:", error);
    throw new Error(`Failed to load request batch: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("No request found for the provided batchId");
  }

  const first = data[0];
  const requesterUserId: string = first.username;
  const requesterName: string = first.requestor_full_name;
  const department: string = first.department;
  const startDate: string | null = first.start_date;
  const returnDate: string | null = first.return_date;
  const itemCount = data.length;

  return {
    requesterUserId,
    requesterName,
    department,
    itemCount,
    startDate: startDate ? new Date(startDate).toLocaleDateString() : undefined,
    returnDate: returnDate
      ? new Date(returnDate).toLocaleDateString()
      : undefined,
  };
}

// Notify managers and requester when a new property request is submitted
export async function notifyPropertyRequestSubmitted(batchId: string) {
  const summary = await getRequestBatchSummary(batchId);

  await notifyAllManagers(
    "New Property Request",
    `Dept: ${summary.department}
    Requester: ${summary.requesterName}
    Items: ${summary.itemCount}
    Batch: ${batchId}
    ${summary.startDate ? `Start: ${summary.startDate}` : ""}${
      summary.returnDate ? ` | Return: ${summary.returnDate}` : ""
    }`,
    "medium"
  );

  await createNotification({
    userId: summary.requesterUserId,
    title: "Request Submitted",
    message: `Your property request (Batch ${batchId}) has been submitted for review.`,
    priority: "low",
  });
}

// Notify managers and requester when a property request is approved or rejected
export async function notifyPropertyRequestDecision(
  batchId: string,
  status: "approved" | "rejected",
  rejectionReason?: string
) {
  const summary = await getRequestBatchSummary(batchId);

  const titleForManagers =
    status === "approved"
      ? "Property Request Approved"
      : "Property Request Rejected";
  const messageForManagers =
    status === "approved"
      ? `Dept: ${summary.department}
Requester: ${summary.requesterName}
Items: ${summary.itemCount}
Batch: ${batchId}`
      : `Dept: ${summary.department}
Requester: ${summary.requesterName}
Items: ${summary.itemCount}
Batch: ${batchId}
Reason: ${rejectionReason || "No reason provided"}`;

  await notifyAllManagers(titleForManagers, messageForManagers, "high");

  const titleForRequester =
    status === "approved"
      ? "Your Request Was Approved"
      : "Your Request Was Rejected";
  const messageForRequester =
    status === "approved"
      ? `Your property request (Batch ${batchId}) has been approved.`
      : `Your property request (Batch ${batchId}) was rejected.${
          rejectionReason ? ` Reason: ${rejectionReason}` : ""
        }`;

  await createNotification({
    userId: summary.requesterUserId,
    title: titleForRequester,
    message: messageForRequester,
    priority: "high",
  });
}

/**
 * Partial Approval Notifications
 * - Sent when a batch has some items approved and some rejected, and none pending.
 */
export async function notifyPropertyRequestPartial(batchId: string) {
  const supabase = createServerSupabaseClient();

  // Count statuses
  const { data: items, error: itemsError } = await supabase
    .from("request_property")
    .select("status")
    .eq("request_batch_id", batchId);

  if (itemsError || !items) {
    throw new Error(
      itemsError?.message ||
        "Failed to load request items for partial notification"
    );
  }

  const approvedCount = items.filter(
    (i: any) => i.status === "approved"
  ).length;
  const rejectedCount = items.filter(
    (i: any) => i.status === "rejected"
  ).length;
  const pendingCount = items.filter(
    (i: any) => !i.status || i.status === "pending"
  ).length;

  // Only meaningful if mixture and no pending
  if (!(pendingCount === 0 && approvedCount > 0 && rejectedCount > 0)) {
    return;
  }

  const summary = await getRequestBatchSummary(batchId);

  // Managers
  await notifyAllManagers(
    "Property Request Partially Approved",
    `Dept: ${summary.department}
Requester: ${summary.requesterName}
Batch: ${batchId}
Approved: ${approvedCount}
Rejected: ${rejectedCount}`,
    "high"
  );

  // Requester
  await createNotification({
    userId: summary.requesterUserId,
    title: "Your Request Partially Approved",
    message: `Your property request (Batch ${batchId}) was partially approved. Approved: ${approvedCount}, Rejected: ${rejectedCount}.`,
    priority: "high",
  });
}

/**
 * Check and notify partial approval exactly once per batch.
 * Prevents duplicate "partial" notifications by looking for an existing notification referencing the batch.
 */
export async function checkAndNotifyPartialApproval(batchId: string) {
  const supabase = createServerSupabaseClient();

  // Determine if batch is in partial state
  const { data: items, error: itemsError } = await supabase
    .from("request_property")
    .select("status")
    .eq("request_batch_id", batchId);

  if (itemsError || !items) {
    console.error(
      "Failed to compute batch statuses for partial notify:",
      itemsError
    );
    return;
  }

  const approvedCount = items.filter(
    (i: any) => i.status === "approved"
  ).length;
  const rejectedCount = items.filter(
    (i: any) => i.status === "rejected"
  ).length;
  const pendingCount = items.filter(
    (i: any) => !i.status || i.status === "pending"
  ).length;

  const isPartial =
    pendingCount === 0 && approvedCount > 0 && rejectedCount > 0;
  if (!isPartial) return;

  // Prevent duplicate partial notifications (search by title and batchId in message)
  const { data: existing, error: existingErr } = await supabase
    .from("notifications")
    .select("id")
    .or(
      "title.eq.Property Request Partially Approved,title.eq.Your Request Partially Approved"
    )
    .ilike("message", `%Batch ${batchId}%`)
    .limit(1);

  if (existingErr) {
    console.warn(
      "Partial notification duplicate-check failed, proceeding cautiously:",
      existingErr
    );
  }
  if (existing && existing.length > 0) {
    // Already notified
    return;
  }

  // Send partial notifications
  await notifyPropertyRequestPartial(batchId);
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
