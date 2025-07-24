"use client"

import type React from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { EnhancedNotificationSystem } from "@/components/enhanced-notification-system"
import { NotificationTestPanel } from "@/components/notification-test-panel"
import { NotificationCenter } from "@/components/notification-center"
import { useNotifications } from "@/hooks/use-notifications"

function QueryWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function DashboardContent() {
  const { notifications, unreadCount, isLoading } = useNotifications()

  return (
    <div className="min-h-screen bg-background">
      {/* Header with notification bell */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>

          {/* Notification Bell */}
          <EnhancedNotificationSystem />
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          {/* Welcome section */}
          <div className="bg-card rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Welcome to your Dashboard</h2>
            <p className="text-muted-foreground">
              You have {unreadCount} unread notifications. The system automatically checks for new notifications every
              30 seconds.
            </p>
          </div>

          {/* Dashboard grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Full notification center */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Recent Notifications</h3>
              <NotificationCenter
                variant="full"
                enableRealTimeUpdates={true}
                enableBrowserNotifications={true}
                showFilter={true}
                showMarkAllRead={true}
                onNotificationClick={(notification) => {
                  console.log("Notification clicked:", notification)
                  // Handle notification clicks here
                }}
              />
            </div>

            {/* Sidebar with test panel */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                <div className="bg-card rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Notifications</span>
                    <span className="font-semibold">{notifications.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unread</span>
                    <span className="font-semibold text-blue-600">{unreadCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Read</span>
                    <span className="font-semibold text-green-600">{notifications.length - unreadCount}</span>
                  </div>
                </div>
              </div>

              {/* Test panel for creating notifications */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Test Notifications</h3>
                <NotificationTestPanel />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export function DashboardClient() {
  return (
    <QueryWrapper>
      <DashboardContent />
    </QueryWrapper>
  )
}
