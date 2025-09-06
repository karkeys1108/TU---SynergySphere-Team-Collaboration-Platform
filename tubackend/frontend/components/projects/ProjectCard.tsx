"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Calendar, Users, MoreVertical, Edit, Trash2, ExternalLink } from "lucide-react"
import Link from "next/link"

interface Project {
  _id: string
  name: string
  description: string
  status: "planning" | "active" | "completed" | "on-hold"
  members: Array<{
    user: {
      _id: string
      name: string
      email: string
      avatar?: string
    }
    role: "admin" | "member"
  }>
  createdAt: string
  updatedAt: string
  progress?: number
}

interface ProjectCardProps {
  project: Project
  onEdit?: (project: Project) => void
  onDelete?: (projectId: string) => void
}

const statusColors = {
  planning: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  "on-hold": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
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
      year: "numeric",
    })
  }

  const progress = project.progress || Math.floor(Math.random() * 100) // Fallback for demo

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              <Link href={`/dashboard/projects/${project._id}`} className="hover:text-primary">
                {project.name}
              </Link>
            </CardTitle>
            <CardDescription className="line-clamp-2">{project.description}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/projects/${project._id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Project
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={() => onDelete(project._id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge className={statusColors[project.status]}>{project.status.replace("-", " ")}</Badge>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-1 h-4 w-4" />
            {formatDate(project.updatedAt)}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{project.members.length} members</span>
          </div>
          <div className="flex -space-x-2">
            {project.members.slice(0, 3).map((member) => (
              <Avatar key={member.user._id} className="h-8 w-8 border-2 border-background">
                <AvatarImage src={member.user.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xs">{getUserInitials(member.user.name)}</AvatarFallback>
              </Avatar>
            ))}
            {project.members.length > 3 && (
              <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <span className="text-xs font-medium">+{project.members.length - 3}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
