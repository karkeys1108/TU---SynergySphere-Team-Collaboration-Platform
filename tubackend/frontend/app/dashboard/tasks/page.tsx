"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { TaskBoard } from "@/components/tasks/TaskBoard"
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog"
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api"
import { Search, Filter, Plus, CheckSquare } from "lucide-react"

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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [projectFilter, setProjectFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [createTaskStatus, setCreateTaskStatus] = useState("todo")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterTasks()
  }, [tasks, searchTerm, projectFilter, priorityFilter])

  const loadData = async () => {
    try {
      const [tasksResponse, projectsResponse] = await Promise.all([apiClient.getTasks(), apiClient.getProjects()])

      if (tasksResponse.success) {
        setTasks(tasksResponse.data || [])
      }

      if (projectsResponse.success) {
        setProjects(projectsResponse.data || [])
      }
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterTasks = () => {
    let filtered = tasks

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by project
    if (projectFilter !== "all") {
      filtered = filtered.filter((task) => task.project._id === projectFilter)
    }

    // Filter by priority
    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter)
    }

    setFilteredTasks(filtered)
  }

  const handleCreateTask = (status: string) => {
    setCreateTaskStatus(status)
    setCreateDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setEditDialogOpen(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        const response = await apiClient.deleteTask(taskId)
        if (response.success) {
          loadData()
        }
      } catch (error) {
        console.error("Failed to delete task:", error)
      }
    }
  }

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      const response = await apiClient.updateTask(taskId, { status })
      if (response.success) {
        loadData()
      }
    } catch (error) {
      console.error("Failed to update task status:", error)
    }
  }

  const handleTaskCreated = () => {
    loadData()
  }

  const handleTaskUpdated = () => {
    loadData()
  }

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
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">Manage and track all your project tasks.</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full lg:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project: any) => (
                <SelectItem key={project._id} value={project._id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full lg:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Task Board */}
        {filteredTasks.length > 0 ? (
          <TaskBoard
            tasks={filteredTasks}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onStatusChange={handleStatusChange}
            onCreateTask={handleCreateTask}
          />
        ) : tasks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">No tasks yet</CardTitle>
              <CardDescription className="mb-4">Create your first task to start organizing your work.</CardDescription>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">No tasks found</CardTitle>
              <CardDescription>Try adjusting your search or filter criteria.</CardDescription>
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        <CreateTaskDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onTaskCreated={handleTaskCreated}
          initialStatus={createTaskStatus}
        />

        <EditTaskDialog
          task={editingTask}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onTaskUpdated={handleTaskUpdated}
        />
      </div>
    </DashboardLayout>
  )
}
