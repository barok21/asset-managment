"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { useUser } from "@clerk/nextjs"

export interface Notification {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  priority: "low" | "medium" | "high"
}

export function useNotifications() {
  const { user, isLoaded } = useUser()
  const queryClient = useQueryClient()

  const fetchNotifications = async (): Promise<Notification[]> => {
    if (!user?.id) return []

    const supabase = createClientSupabaseClient()

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
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

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClientSupabaseClient()
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", Number.parseInt(id))

      if (error) throw error
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(["notifications"], (old: Notification[] = []) =>
        old.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      )
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return

      const supabase = createClientSupabaseClient()
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.setQueryData(["notifications"], (old: Notification[] = []) =>
        old.map((n) => ({ ...n, isRead: true })),
      )
    },
  })

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClientSupabaseClient()
      const { error } = await supabase.from("notifications").delete().eq("id", Number.parseInt(id))

      if (error) throw error
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(["notifications"], (old: Notification[] = []) => old.filter((n) => n.id !== id))
    },
  })

  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: fetchNotifications,
    enabled: isLoaded && !!user?.id,
    refetchInterval: 30000,
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
  }
}
