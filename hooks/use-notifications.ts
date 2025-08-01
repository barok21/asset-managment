"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";
import type { Notification, NotificationRow } from "@/types/notification";

export function useNotifications() {
  const { user, isLoaded } = useUser();
  const queryClient = useQueryClient();

  const fetchNotifications = async (): Promise<Notification[]> => {
    if (!user?.id) {
      console.log("No user ID available");
      return [];
    }

    console.log("Fetching notifications for user:", user.id);

    try {
      const supabase = createClientSupabaseClient();

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch notifications:", {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        return [];
      }

      console.log("Raw notification data:", data);

      const notifications =
        data?.map((item: NotificationRow) => ({
          id: item.id.toString(),
          title: item.title,
          message: item.message,
          isRead: item.is_read,
          createdAt: item.created_at,
          priority: item.priority || "low",
        })) || [];

      console.log("Processed notifications:", notifications);
      return notifications;
    } catch (err) {
      console.error("Unexpected error fetching notifications:", err);
      return [];
    }
  };

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Marking notification as read:", id);
      const supabase = createClientSupabaseClient();
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", Number.parseInt(id));

      if (error) {
        console.error("Error marking as read:", error);
        throw error;
      }
    },
    onSuccess: (_, id) => {
      console.log("Successfully marked as read:", id);
      // Update the cache immediately
      queryClient.setQueryData(
        ["notifications", user?.id],
        (old: Notification[] = []) =>
          old.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      // Also invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
    onError: (error) => {
      console.error("Failed to mark as read:", error);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      console.log("Marking all notifications as read for user:", user.id);
      const supabase = createClientSupabaseClient();
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error("Error marking all as read:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Successfully marked all as read");
      // Update the cache immediately
      queryClient.setQueryData(
        ["notifications", user?.id],
        (old: Notification[] = []) => old.map((n) => ({ ...n, isRead: true }))
      );
      // Also invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
    onError: (error) => {
      console.error("Failed to mark all as read:", error);
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Deleting notification:", id);
      const supabase = createClientSupabaseClient();
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", Number.parseInt(id));

      if (error) {
        console.error("Error deleting notification:", error);
        throw error;
      }
    },
    onSuccess: (_, id) => {
      console.log("Successfully deleted notification:", id);
      // Update the cache immediately
      queryClient.setQueryData(
        ["notifications", user?.id],
        (old: Notification[] = []) => old.filter((n) => n.id !== id)
      );
      // Also invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
    onError: (error) => {
      console.error("Failed to delete notification:", error);
    },
  });

  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: fetchNotifications,
    enabled: isLoaded && !!user?.id,
    refetchInterval: 30000,
    retry: 3,
    retryDelay: 1000,
    staleTime: 5000, // Consider data fresh for 5 seconds
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
  };
}

// Re-export the type for convenience
export type { Notification } from "@/types/notification";
