"use client";

import React, { useEffect, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { NotificationCenter } from "@/components/notification-center";

// --- Type Definitions ---
type Priority = "low" | "medium" | "high";

type Notification = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  priority: Priority;
};

// --- Simulated Backend ---
let masterNotifications: Notification[] = [
  {
    id: "1",
    title: "Welcome!",
    message: "Thanks for joining.",
    isRead: false,
    createdAt: new Date().toISOString(),
    priority: "low",
  },
];

let nextId = masterNotifications.length + 1;

const fetchNotifications = async (): Promise<Notification[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500)); // simulate delay
  return [...masterNotifications];
};

const markAsRead = async (id: string) => {
  masterNotifications = masterNotifications.map((n) =>
    n.id === id ? { ...n, isRead: true } : n
  );
};

const markAllAsRead = async () => {
  masterNotifications = masterNotifications.map((n) => ({
    ...n,
    isRead: true,
  }));
};

const deleteNotification = async (id: string) => {
  masterNotifications = masterNotifications.filter((n) => n.id !== id);
};

// --- Internal Component ---
function NotificationContainer() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(() => {
      const newNotification: Notification = {
        id: String(nextId++),
        title: "New Real-time Update!",
        message: "This notification was added automatically.",
        isRead: false,
        createdAt: new Date().toISOString(),
        priority: "medium",
      };
      masterNotifications.unshift(newNotification);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }, 10000);

    return () => clearInterval(interval);
  }, [queryClient]);

  return (
    <NotificationCenter
      variant="popover"
      fetchNotifications={fetchNotifications}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
      onDeleteNotification={deleteNotification}
      enableRealTimeUpdates={true}
      updateInterval={15000}
      enableBrowserNotifications={true}
    />
  );
}

// --- Exported Provider ---
export default function NotificationProvider() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationContainer />
    </QueryClientProvider>
  );
}
