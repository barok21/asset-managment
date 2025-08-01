// Shared notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  priority: "low" | "medium" | "high";
}

export interface NotificationRow {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  priority: "low" | "medium" | "high";
}
