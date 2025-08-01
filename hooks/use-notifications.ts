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
      console.log("Hook: No user ID available");
      return [];
    }

    console.log("Hook: Fetching notifications for user:", user.id);

    try {
      const supabase = createClientSupabaseClient();

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Hook: Failed to fetch notifications:", {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        return [];
      }

      console.log("Hook: Raw notification data:", data);

      const notifications =
        data?.map((item: NotificationRow) => ({
          id: item.id.toString(),
          title: item.title,
          message: item.message,
          isRead: item.is_read,
          createdAt: item.created_at,
          priority: item.priority || "low",
        })) || [];

      console.log("Hook: Processed notifications:", notifications);
      return notifications;
    } catch (err) {
      console.error("Hook: Unexpected error fetching notifications:", err);
      return [];
    }
  };

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Hook: Marking notification as read:", id);
      const supabase = createClientSupabaseClient();
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", Number.parseInt(id));

      if (error) {
        console.error("Hook: Error marking as read:", error);
        throw error;
      }
      console.log("Hook: Successfully marked as read:", id);
    },
    onSuccess: (_, id) => {
      console.log("Hook: Mark as read success callback for:", id);
      // Update cache optimistically
      queryClient.setQueryData(
        ["notifications", user?.id],
        (old: Notification[] = []) => {
          const updated = old.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          );
          console.log("Hook: Updated cache data:", updated);
          return updated;
        }
      );
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      console.error("Hook: Failed to mark as read:", error);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      console.log("Hook: Marking all notifications as read for user:", user.id);
      const supabase = createClientSupabaseClient();
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error("Hook: Error marking all as read:", error);
        throw error;
      }
      console.log("Hook: Successfully marked all as read");
    },
    onSuccess: () => {
      console.log("Hook: Mark all as read success callback");
      // Update cache optimistically
      queryClient.setQueryData(
        ["notifications", user?.id],
        (old: Notification[] = []) => {
          const updated = old.map((n) => ({ ...n, isRead: true }));
          console.log("Hook: Updated all cache data:", updated);
          return updated;
        }
      );
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      console.error("Hook: Failed to mark all as read:", error);
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Hook: Deleting notification:", id);
      const supabase = createClientSupabaseClient();
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", Number.parseInt(id));

      if (error) {
        console.error("Hook: Error deleting notification:", error);
        throw error;
      }
      console.log("Hook: Successfully deleted notification:", id);
    },
    onSuccess: (_, id) => {
      console.log("Hook: Delete success callback for:", id);
      // Update cache optimistically
      queryClient.setQueryData(
        ["notifications", user?.id],
        (old: Notification[] = []) => {
          const updated = old.filter((n) => n.id !== id);
          console.log("Hook: Updated cache after delete:", updated);
          return updated;
        }
      );
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      console.error("Hook: Failed to delete notification:", error);
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
    refetchInterval: 10000, // Refetch every 10 seconds
    retry: 3,
    retryDelay: 1000,
    staleTime: 2000, // Consider data stale after 2 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  console.log("Hook: Current state:", {
    notificationCount: notifications.length,
    unreadCount,
    isLoading,
    hasError: !!error,
  });

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
