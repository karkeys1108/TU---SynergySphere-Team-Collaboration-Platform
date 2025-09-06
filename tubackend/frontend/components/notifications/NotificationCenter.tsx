"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { NotificationCard } from "./NotificationCard"
import { Bell, Check, Trash2 } from "lucide-react"

interface Notification {
  _id: string
  type:
    | "task_assigned"
    | "task_completed"
    | "project_updated"
    | "message_received"
    | "member_added"
    | "deadline_approaching"
  title: string
  message: string
  isRead: boolean
  createdAt: string
  relatedUser?: {
    _id: string
    name: string
    avatar?: string
  }
  relatedProject?: {
    _id: string
    name: string
  }
  relatedTask?: {
    _id: string
    title: string
  }
}

interface NotificationCenterProps {
  notifications: Notification[]
  onMarkRead?: (notificationId: string) => void
  onMarkAllRead?: () => void
  onDelete?: (notificationId: string) => void
  onClearAll?: () => void
}

export function NotificationCenter({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onClearAll,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const recentNotifications = notifications.slice(0, 10) // Show only recent 10

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && onMarkAllRead && (
                <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
                  <Check className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && onClearAll && (
                <Button variant="ghost" size="sm" onClick={onClearAll}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
          </div>
          {unreadCount > 0 && <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread notifications</p>}
        </div>

        <ScrollArea className="max-h-96">
          {recentNotifications.length > 0 ? (
            <div className="p-2 space-y-2">
              {recentNotifications.map((notification) => (
                <NotificationCard
                  key={notification._id}
                  notification={notification}
                  onMarkRead={onMarkRead}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium mb-2">No notifications</h4>
              <p className="text-sm text-muted-foreground">You're all caught up!</p>
            </div>
          )}
        </ScrollArea>

        {notifications.length > 10 && (
          <div className="border-t p-4">
            <Button variant="ghost" className="w-full" onClick={() => setOpen(false)}>
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
