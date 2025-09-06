"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FolderOpen } from "lucide-react"

interface Project {
  _id: string
  name: string
  status: string
  members: Array<{
    user: {
      _id: string
      name: string
    }
  }>
}

interface ProjectSelectorProps {
  projects: Project[]
  selectedProject: string
  onProjectChange: (projectId: string) => void
}

export function ProjectSelector({ projects, selectedProject, onProjectChange }: ProjectSelectorProps) {
  const selectedProjectData = projects.find((p) => p._id === selectedProject)

  return (
    <div className="space-y-3">
      <Select value={selectedProject} onValueChange={onProjectChange}>
        <SelectTrigger className="w-full">
          <div className="flex items-center space-x-2">
            <FolderOpen className="h-4 w-4" />
            <SelectValue placeholder="Select a project to chat" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project._id} value={project._id}>
              <div className="flex items-center justify-between w-full">
                <span>{project.name}</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {project.members.length} members
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedProjectData && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <h3 className="font-medium text-sm">{selectedProjectData.name}</h3>
            <p className="text-xs text-muted-foreground">{selectedProjectData.members.length} team members</p>
          </div>
          <Badge variant="secondary">{selectedProjectData.status}</Badge>
        </div>
      )}
    </div>
  )
}
