"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { NotificationCard } from "@/components/notifications/NotificationCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import { Search, Filter, Bell, Check, Trash2, RefreshCw } from "lucide-react"

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    filterNotifications()
  }, [notifications, searchTerm, typeFilter, statusFilter])

  const loadNotifications = async () => {
    try {
      const response = await apiClient.getNotifications()
      if (response.success) {
        // Mock data for demonstration since backend might not have full notification data
        const mockNotifications: Notification[] = [
          {
            _id: "1",
            type: "task_assigned",
            title: "New task assigned",
            message: "You have been assigned to 'Update user interface' in Project Alpha",
            isRead: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            relatedUser: {
              _id: "user1",
              name: "John Doe",
              avatar: "/placeholder.svg",
            },
            relatedProject: {
              _id: "proj1",
              name: "Project Alpha",
            },
            relatedTask: {
              _id: "task1",
              title: "Update user interface",
            },
          },
          {
            _id: "2",
            type: "message_received",
            title: "New message",
            message: "Sarah commented on your task in Project Beta",
            isRead: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            relatedUser: {
              _id: "user2",
              name: "Sarah Wilson",
              avatar: "/placeholder.svg",
            },
            relatedProject: {
              _id: "proj2",
              name: "Project Beta",
            },
          },
          {
            _id: "3",
            type: "deadline_approaching",
            title: "Deadline approaching",
            message: "Task 'Design review' is due in 2 days",
            isRead: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
            relatedProject: {
              _id: "proj1",
              name: "Project Alpha",
            },
            relatedTask: {
              _id: "task2",
              title: "Design review",
            },
          },
          {
            _id: "4",
            type: "project_updated",
            title: "Project updated",
            message: "Project Gamma status changed to 'Active'",
            isRead: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            relatedProject: {
              _id: "proj3",
              name: "Project Gamma",
            },
          },
          {
            _id: "5",
            type: "task_completed",
            title: "Task completed",
            message: "Mike completed 'Database migration' in Project Alpha",
            isRead: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
            relatedUser: {
              _id: "user3",
              name: "Mike Johnson",
              avatar: "/placeholder.svg",
            },
            relatedProject: {
              _id: "proj1",
              name: "Project Alpha",
            },
            relatedTask: {
              _id: "task3",
              title: "Database migration",
            },
          },
        ]

        setNotifications(response.data?.length > 0 ? response.data : mockNotifications)
      }
    } catch (error) {
      console.error("Failed to load notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterNotifications = () => {
    let filtered = notifications

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (notification) =>
          notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.message.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((notification) => notification.type === typeFilter)
    }

    // Filter by status
    if (statusFilter === "unread") {
      filtered = filtered.filter((notification) => !notification.isRead)
    } else if (statusFilter === "read") {
      filtered = filtered.filter((notification) => notification.isRead)
    }

    setFilteredNotifications(filtered)
  }

  const handleMarkRead = async (notificationId: string) => {
    try {
      const response = await apiClient.markNotificationRead(notificationId)
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === notificationId ? { ...notification, isRead: !notification.isRead } : notification,
          ),
        )
      }
    } catch (error) {
      console.error("Failed to update notification:", error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      // This would need a bulk update API endpoint
      const unreadNotifications = notifications.filter((n) => !n.isRead)
      for (const notification of unreadNotifications) {
        await apiClient.markNotificationRead(notification._id)
      }
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })))
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  const handleDelete = async (notificationId: string) => {
    if (confirm("Are you sure you want to delete this notification?")) {
      // This would need a delete API endpoint
      setNotifications((prev) => prev.filter((notification) => notification._id !== notificationId))
    }
  }

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to clear all notifications?")) {
      setNotifications([])
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with your project activities and team communications.</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={loadNotifications}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button onClick={handleMarkAllRead}>
                <Check className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{notifications.length}</p>
                  <p className="text-sm text-muted-foreground">Total notifications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {unreadCount}
                </Badge>
                <div>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                  <p className="text-sm text-muted-foreground">Unread</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{notifications.length - unreadCount}</p>
                  <p className="text-sm text-muted-foreground">Read</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full lg:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="task_assigned">Task Assigned</SelectItem>
              <SelectItem value="task_completed">Task Completed</SelectItem>
              <SelectItem value="project_updated">Project Updated</SelectItem>
              <SelectItem value="message_received">Message Received</SelectItem>
              <SelectItem value="member_added">Member Added</SelectItem>
              <SelectItem value="deadline_approaching">Deadline Approaching</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification._id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">No notifications</CardTitle>
              <CardDescription>You're all caught up! New notifications will appear here.</CardDescription>
            </CardContent>
          </Card>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">No notifications found</CardTitle>
              <CardDescription>Try adjusting your search or filter criteria.</CardDescription>
            </CardContent>
          </Card>
        )}

        {/* Clear All Button */}
        {notifications.length > 0 && (
          <div className="flex justify-center pt-6">
            <Button variant="outline" onClick={handleClearAll}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all notifications
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
