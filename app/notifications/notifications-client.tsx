"use client"

import type React from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { NotificationCenter } from "@/components/notification-center"
import { SimpleNotificationBell } from "@/components/simple-notification-bell"

function QueryWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function NotificationsContent() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <SimpleNotificationBell />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">All Notifications</h1>
            <p className="text-muted-foreground">Manage all your notifications in one place</p>
          </div>

          <NotificationCenter
            variant="full"
            enableRealTimeUpdates={true}
            enableBrowserNotifications={true}
            showFilter={true}
            showMarkAllRead={true}
            onNotificationClick={(notification) => {
              console.log("Notification clicked:", notification)
              // Handle notification click - navigate to relevant page, etc.
            }}
          />
        </div>
      </div>
    </div>
  )
}

export function NotificationsPageClient() {
  return (
    <QueryWrapper>
      <NotificationsContent />
    </QueryWrapper>
  )
}
