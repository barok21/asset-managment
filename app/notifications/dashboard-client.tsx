"use client";

import { Button } from "@/components/ui/button";
import type React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { EnhancedNotificationSystem } from "@/components/enhanced-notification-system";
import { NotificationTestPanel } from "@/components/notification-test-panel";
// import { NotificationDebugPanel } from "@/components/notification-debug-panel";
import { useNotifications } from "@/hooks/use-notifications";
import type { Notification } from "@/types/notification";
import { NotificationCenter } from "@/components/notification-center";
import Link from "next/link";

function QueryWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
          },
        },
      })
  );
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function DashboardContent() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications, // Destructure clearAllNotifications here
  } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    console.log("Dashboard notification clicked:", notification);
    // Automatically mark as read when clicked
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const isMobileDevice =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent);
  const enableBrowserNotify =
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification?.permission === "granted" &&
    !isMobileDevice;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with notification bell */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard">Dashboard</Link>
          <h1 className="text-2xl font-bold"></h1>
          {/* <EnhancedNotificationSystem /> */}
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          {/* Welcome section */}
          <div className="bg-card rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  Welcome to your Dashboard
                </h2>
                <p className="text-muted-foreground">
                  You have {unreadCount} unread notifications. The system
                  automatically checks for new notifications every 10 seconds.
                </p>
                {error && (
                  <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                    Error loading notifications. Check the debug panel below.
                  </div>
                )}
              </div>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                Refresh
              </Button>
            </div>
          </div>

          {/* Dashboard grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Full notification center */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">
                Recent Notifications
              </h3>
              <NotificationCenter
                variant="full"
                fetchNotifications={async () => notifications}
                onMarkAsRead={async (id) => markAsRead(id)}
                onMarkAllAsRead={async () => markAllAsRead()}
                onDeleteNotification={async (id) => deleteNotification(id)}
                onClearAllNotifications={async () => clearAllNotifications()} // Pass onClearAllNotifications
                onNotificationClick={handleNotificationClick}
                enableRealTimeUpdates={true}
                enableBrowserNotifications={enableBrowserNotify}
                showFilter={true}
                showMarkAllRead={true}
                updateInterval={10000}
              />
            </div>

            {/* Sidebar with test panel */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                <div className="bg-card rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total Notifications
                    </span>
                    <span className="font-semibold">
                      {notifications.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unread</span>
                    <span className="font-semibold text-blue-600">
                      {unreadCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Read</span>
                    <span className="font-semibold text-green-600">
                      {notifications.length - unreadCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Debug panel */}
              <div>
                {/* <h3 className="text-lg font-semibold mb-4">Debug</h3> */}
                {/* <NotificationDebugPanel /> */}
              </div>

              {/* Test panel for creating notifications */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Send a message</h3>
                <NotificationTestPanel />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Toaster position="top-right" />
    </div>
  );
}

export function DashboardClient() {
  return (
    <QueryWrapper>
      <DashboardContent />
    </QueryWrapper>
  );
}
