"use client";

import { NotificationCenter } from "@/components/notification-center";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import type { Notification, NotificationRow } from "@/types/notification";

export function EnhancedNotificationSystem() {
  const { user, isLoaded } = useUser();
  const queryClient = useQueryClient();

  const fetchNotifications = async (): Promise<Notification[]> => {
    if (!user?.id) return [];

    console.log("Enhanced system fetching notifications for:", user.id);
    const supabase = createClientSupabaseClient();

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Enhanced system fetch error:", error);
      return [];
    }

    console.log("Enhanced system raw data:", data);

    const notifications =
      data?.map((item: NotificationRow) => ({
        id: item.id.toString(),
        title: item.title,
        message: item.message,
        isRead: item.is_read,
        createdAt: item.created_at,
        priority: item.priority || "low",
      })) || [];

    console.log("Enhanced system processed notifications:", notifications);
    return notifications;
  };

  const markAsRead = async (id: string) => {
    console.log("Enhanced system marking as read:", id);
    const supabase = createClientSupabaseClient();

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", Number.parseInt(id));

    if (error) {
      console.error("Enhanced system mark as read error:", error);
      throw error;
    }

    console.log("Enhanced system successfully marked as read:", id);
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    console.log("Enhanced system marking all as read for user:", user.id);
    const supabase = createClientSupabaseClient();

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.error("Enhanced system mark all as read error:", error);
      throw error;
    }

    console.log("Enhanced system successfully marked all as read");
  };

  const deleteNotification = async (id: string) => {
    console.log("Enhanced system deleting notification:", id);
    const supabase = createClientSupabaseClient();

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", Number.parseInt(id));

    if (error) {
      console.error("Enhanced system delete error:", error);
      throw error;
    }

    console.log("Enhanced system successfully deleted:", id);
  };

  const clearAllNotifications = async () => {
    if (!user?.id) return;

    console.log(
      "Enhanced system clearing all notifications for user:",
      user.id
    );
    const supabase = createClientSupabaseClient();

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Enhanced system clear all error:", error);
      throw error;
    }

    console.log("Enhanced system successfully cleared all notifications");
  };

  const handleNotificationClick = (notification: Notification) => {
    console.log("Enhanced system notification clicked:", notification);
    // Automatically mark as read when clicked
    if (!notification.isRead) {
      markAsRead(notification.id).catch(console.error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <NotificationCenter
      variant="popover"
      fetchNotifications={fetchNotifications}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
      onDeleteNotification={deleteNotification}
      onClearAllNotifications={clearAllNotifications} // Add this line
      onNotificationClick={handleNotificationClick}
      enableRealTimeUpdates={true}
      enableBrowserNotifications={true}
      updateInterval={10000}
      showFilter={true}
      showMarkAllRead={true}
    />
  );
}
