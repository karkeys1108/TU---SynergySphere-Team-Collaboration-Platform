"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TaskCard } from "./TaskCard"
import { Clock, CheckCircle, Play, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

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

interface TaskBoardProps {
  tasks: Task[]
  onEditTask?: (task: Task) => void
  onDeleteTask?: (taskId: string) => void
  onStatusChange?: (taskId: string, status: string) => void
  onCreateTask?: (status: string) => void
}

const columns = [
  {
    id: "todo",
    title: "To Do",
    icon: Clock,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  {
    id: "in-progress",
    title: "In Progress",
    icon: Play,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  },
  {
    id: "completed",
    title: "Completed",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
]

export function TaskBoard({ tasks, onEditTask, onDeleteTask, onStatusChange, onCreateTask }: TaskBoardProps) {
  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.id)
        const Icon = column.icon

        return (
          <Card key={column.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-sm font-medium">
                  <Icon className="h-4 w-4" />
                  <span>{column.title}</span>
                </CardTitle>
                <Badge className={column.color} variant="secondary">
                  {columnTasks.length}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onStatusChange={onStatusChange}
                />
              ))}

              {onCreateTask && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-foreground border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50"
                  onClick={() => onCreateTask(column.id)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add task
                </Button>
              )}

              {columnTasks.length === 0 && !onCreateTask && (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tasks</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
