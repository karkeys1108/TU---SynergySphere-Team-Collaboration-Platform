"use client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, Clock, MoreVertical, Edit, Trash2, User, Flag } from "lucide-react"

interface Task {
  _id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "completed"
  priority: "low" | "medium" | "high"
  assignedTo?: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  dueDate?: string
  createdAt: string
  updatedAt: string
  project: {
    _id: string
    name: string
  }
}

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onStatusChange?: (taskId: string, status: string) => void
}

const priorityColors = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

const priorityIcons = {
  low: "h-3 w-3 text-blue-600",
  medium: "h-3 w-3 text-yellow-600",
  high: "h-3 w-3 text-red-600",
}

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed"

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
            {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onStatusChange && (
                <>
                  <DropdownMenuItem onClick={() => onStatusChange(task._id, "todo")}>
                    <Clock className="mr-2 h-4 w-4" />
                    Move to Todo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(task._id, "in-progress")}>
                    <Clock className="mr-2 h-4 w-4" />
                    Move to In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(task._id, "completed")}>
                    <Clock className="mr-2 h-4 w-4" />
                    Move to Completed
                  </DropdownMenuItem>
                </>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={() => onDelete(task._id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center justify-between">
          <Badge className={priorityColors[task.priority]} variant="secondary">
            <Flag className={priorityIcons[task.priority]} />
            <span className="ml-1 text-xs">{task.priority}</span>
          </Badge>
          {task.dueDate && (
            <div className={`flex items-center text-xs ${isOverdue ? "text-red-600" : "text-muted-foreground"}`}>
              <Calendar className="mr-1 h-3 w-3" />
              {formatDate(task.dueDate)}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">{task.project.name}</div>
          {task.assignedTo ? (
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignedTo.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">{getUserInitials(task.assignedTo.name)}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
              <User className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
