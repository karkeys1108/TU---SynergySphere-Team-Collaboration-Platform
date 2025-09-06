"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Bell,
  CheckCircle,
  MessageSquare,
  UserPlus,
  AlertTriangle,
  MoreVertical,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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

interface NotificationCardProps {
  notification: Notification
  onMarkRead?: (notificationId: string) => void
  onDelete?: (notificationId: string) => void
}

const notificationIcons = {
  task_assigned: CheckCircle,
  task_completed: CheckCircle,
  project_updated: Bell,
  message_received: MessageSquare,
  member_added: UserPlus,
  deadline_approaching: AlertTriangle,
}

const notificationColors = {
  task_assigned: "text-blue-600",
  task_completed: "text-green-600",
  project_updated: "text-purple-600",
  message_received: "text-orange-600",
  member_added: "text-indigo-600",
  deadline_approaching: "text-red-600",
}

export function NotificationCard({ notification, onMarkRead, onDelete }: NotificationCardProps) {
  const Icon = notificationIcons[notification.type]
  const iconColor = notificationColors[notification.type]

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <Card className={`transition-all hover:shadow-md ${!notification.isRead ? "border-primary/50 bg-primary/5" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-full bg-muted ${iconColor}`}>
            <Icon className="h-4 w-4" />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-sm">{notification.title}</h4>
                  {!notification.isRead && (
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      New
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onMarkRead && (
                    <DropdownMenuItem onClick={() => onMarkRead(notification._id)}>
                      {notification.isRead ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Mark as unread
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Mark as read
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onClick={() => onDelete(notification._id)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                {notification.relatedProject && (
                  <>
                    <span>•</span>
                    <span>{notification.relatedProject.name}</span>
                  </>
                )}
              </div>

              {notification.relatedUser && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={notification.relatedUser.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">{getUserInitials(notification.relatedUser.name)}</AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
