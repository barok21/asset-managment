"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createNotification,
  createSystemAnnouncement,
} from "@/lib/actions/notification-actions";
import { useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function NotificationTestPanel() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateNotification = async () => {
    if (!user?.id || !title || !message) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await createNotification({
        userId: user.id,
        title,
        message,
        priority,
      });

      toast.success("Notification created successfully!");
      setTitle("");
      setMessage("");
      setPriority("medium");

      // Invalidate and refetch notifications immediately
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      // Also trigger a manual refetch after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }, 1000);
    } catch (error) {
      console.error("Error creating notification:", error);
      toast.error("Failed to create notification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSystemAnnouncement = async () => {
    if (!title || !message) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await createSystemAnnouncement(title, message, priority);

      toast.success("System announcement sent to all users!");
      setTitle("");
      setMessage("");
      setPriority("medium");

      // Invalidate and refetch notifications immediately
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      // Also trigger a manual refetch after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }, 1000);
    } catch (error) {
      console.error("Error creating system announcement:", error);
      toast.error("Failed to create system announcement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Test Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Notification title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Textarea
          placeholder="Notification message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <Select
          value={priority}
          onValueChange={(value: "low" | "medium" | "high") =>
            setPriority(value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            onClick={handleCreateNotification}
            disabled={isLoading || !title || !message}
            className="flex-1"
          >
            {isLoading ? "Creating..." : "Create Personal"}
          </Button>

          <Button
            onClick={handleCreateSystemAnnouncement}
            disabled={isLoading || !title || !message}
            variant="outline"
            className="flex-1 bg-transparent"
          >
            {isLoading ? "Sending..." : "System Wide"}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• Personal: Creates notification for you only</p>
          <p>• System Wide: Sends to all approved users</p>
        </div>
      </CardContent>
    </Card>
  );
}
