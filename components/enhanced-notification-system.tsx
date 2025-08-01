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

    const supabase = createClientSupabaseClient();

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch notifications:", error);
      return [];
    }

    return (
      data?.map((item: NotificationRow) => ({
        id: item.id.toString(),
        title: item.title,
        message: item.message,
        isRead: item.is_read,
        createdAt: item.created_at,
        priority: item.priority || "low",
      })) || []
    );
  };

  const markAsRead = async (id: string) => {
    console.log("Enhanced system marking as read:", id);
    const supabase = createClientSupabaseClient();

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", Number.parseInt(id));

    if (error) {
      console.error("Failed to mark notification as read:", error);
      throw error;
    }

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
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
      console.error("Failed to mark all notifications as read:", error);
      throw error;
    }

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const deleteNotification = async (id: string) => {
    console.log("Enhanced system deleting notification:", id);
    const supabase = createClientSupabaseClient();

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", Number.parseInt(id));

    if (error) {
      console.error("Failed to delete notification:", error);
      throw error;
    }

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const handleNotificationClick = (notification: Notification) => {
    console.log("Notification clicked:", notification);
    // Automatically mark as read when clicked
    if (!notification.isRead) {
      markAsRead(notification.id);
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
      onNotificationClick={handleNotificationClick}
      enableRealTimeUpdates={true}
      enableBrowserNotifications={true}
      updateInterval={15000} // Reduced interval for faster updates
      showFilter={true}
      showMarkAllRead={true}
    />
  );
}
