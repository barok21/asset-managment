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

  return (
    <div>
      {/* Main content */}
      <main>
        <NotificationCenter
          variant="popover"
          fetchNotifications={async () => notifications}
          onMarkAsRead={async (id) => markAsRead(id)}
          onMarkAllAsRead={async () => markAllAsRead()}
          onDeleteNotification={async (id) => deleteNotification(id)}
          onClearAllNotifications={async () => clearAllNotifications()} // Pass onClearAllNotifications
          onNotificationClick={handleNotificationClick}
          enableRealTimeUpdates={true}
          enableBrowserNotifications={true}
          showFilter={true}
          showMarkAllRead={true}
          updateInterval={10000}
        />
      </main>
    </div>
  );
}

export function DashboardClientOne() {
  return (
    <QueryWrapper>
      <DashboardContent />
    </QueryWrapper>
  );
}
