"use client"

import { NotificationCenter } from "@/components/notification-center"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { useUser } from "@clerk/nextjs"

interface SystemNotification {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  priority: "low" | "medium" | "high"
}

export function EnhancedNotificationSystem() {
  const { user, isLoaded } = useUser()

  const fetchNotifications = async () => {
    if (!user?.id) return []

    const supabase = createClientSupabaseClient()

    // Fetch notifications from Supabase using your schema
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

      console.log(data)

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

  const markAsRead = async (id: string) => {
    const supabase = createClientSupabaseClient()

    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)

    if (error) {
      console.error("Failed to mark notification as read:", error)
      throw error
    }
  }

  const markAllAsRead = async () => {
    if (!user?.id) return

    const supabase = createClientSupabaseClient()

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    if (error) {
      console.error("Failed to mark all notifications as read:", error)
      throw error
    }
  }

  const deleteNotification = async (id: string) => {
    const supabase = createClientSupabaseClient()

    const { error } = await supabase.from("notifications").delete().eq("id", id)

    if (error) {
      console.error("Failed to delete notification:", error)
      throw error
    }
  }

  const handleNotificationClick = (notification: any) => {
    console.log("Notification clicked:", notification)
    // Handle notification clicks here
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
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
      updateInterval={30000}
      showFilter={true}
      showMarkAllRead={true}
    />
  )
}
