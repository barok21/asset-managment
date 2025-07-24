"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { createNotification, createSystemAnnouncement } from "@/lib/actions/notification-actions"

export function NotificationTestPanel() {
  const { user } = useUser()
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateNotification = async () => {
    if (!user?.id || !title || !message) return

    setIsLoading(true)
    try {
      await createNotification({
        userId: user.id,
        title,
        message,
        priority,
      })

      toast.success("Notification created successfully!")
      setTitle("")
      setMessage("")
      setPriority("medium")
    } catch (error) {
      toast.error("Failed to create notification")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSystemAnnouncement = async () => {
    if (!title || !message) return

    setIsLoading(true)
    try {
      await createSystemAnnouncement(title, message, priority)

      toast.success("System announcement sent to all users!")
      setTitle("")
      setMessage("")
      setPriority("medium")
    } catch (error) {
      toast.error("Failed to create system announcement")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Test Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Notification title" value={title} onChange={(e) => setTitle(e.target.value)} />

        <Textarea placeholder="Notification message" value={message} onChange={(e) => setMessage(e.target.value)} />

        <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
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
          <Button onClick={handleCreateNotification} disabled={isLoading || !title || !message} className="flex-1">
            Create Personal
          </Button>

          <Button
            onClick={handleCreateSystemAnnouncement}
            disabled={isLoading || !title || !message}
            variant="outline"
            className="flex-1 bg-transparent"
          >
            System Wide
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

