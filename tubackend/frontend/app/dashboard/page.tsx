"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api"
import { FolderOpen, CheckCircle, Users, TrendingUp, MessageSquare, Bell } from "lucide-react"
import Link from "next/link"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedTasks: number
  pendingTasks: number
  teamMembers: number
  recentActivity: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedTasks: 0,
    pendingTasks: 0,
    teamMembers: 0,
    recentActivity: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [projectsResponse] = await Promise.all([
        apiClient.getProjects().catch(err => {
          console.error("Error loading projects:", err)
          return { success: false, error: "Failed to load projects" }
        })
      ])

      if (projectsResponse?.success) {
        const projectData = Array.isArray(projectsResponse.data) ? projectsResponse.data : []
        setProjects(projectData.slice(0, 6)) // Show only recent projects

        // Calculate stats from projects
        const activeProjects = projectData.filter((p: any) => p.status === "active").length
        const completedTasks = projectData.reduce(
          (sum: number, p: any) => sum + (p.completedTasks || 0),
          0
        )
        const pendingTasks = projectData.reduce(
          (sum: number, p: any) => sum + (p.pendingTasks || 0),
          0
        )
        const teamMembers = new Set(
          projectData.flatMap((p: any) => p.members?.map((m: any) => m._id) || [])
        ).size

        setStats({
          totalProjects: projectData.length,
          activeProjects,
          completedTasks,
          pendingTasks,
          teamMembers,
          recentActivity: projectData.length > 0 ? projectData[0].recentActivity || 0 : 0,
        })
      } else {
        setError(projectsResponse?.error || "Failed to load dashboard data")
      }
    } catch (err) {
      console.error("Error in loadDashboardData:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleProjectCreated = (newProject: any) => {
    setProjects(prev => [newProject, ...prev.slice(0, 5)]) // Add new project and keep only 6
    setStats(prev => ({
      ...prev,
      totalProjects: prev.totalProjects + 1,
      activeProjects: newProject.status === "active" ? prev.activeProjects + 1 : prev.activeProjects,
    }))
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
              <button
                onClick={loadDashboardData}
                className="mt-2 bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
              <p className="text-muted-foreground">Here's what's happening with your projects today.</p>
            </div>
            <CreateProjectDialog onProjectCreated={handleProjectCreated} />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProjects}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+2</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeProjects}</div>
                <p className="text-xs text-muted-foreground">Currently in progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedTasks}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+12%</span> from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.teamMembers}</div>
                <p className="text-xs text-muted-foreground">Across all projects</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Projects */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Recent Projects</h2>
              <Button variant="outline" asChild>
                <Link href="/dashboard/projects">View All</Link>
              </Button>
            </div>

            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <CardTitle className="mb-2">No projects yet</CardTitle>
                  <CardDescription className="mb-4">
                    Create your first project to get started with team collaboration.
                  </CardDescription>
                  <CreateProjectDialog onProjectCreated={handleProjectCreated} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" asChild>
              <Link href="/dashboard/projects">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    <span>Manage Projects</span>
                  </CardTitle>
                  <CardDescription>View and organize all your projects</CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" asChild>
              <Link href="/dashboard/messages">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <span>Team Messages</span>
                  </CardTitle>
                  <CardDescription>Communicate with your team</CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" asChild>
              <Link href="/dashboard/notifications">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-primary" />
                    <span>Notifications</span>
                  </CardTitle>
                  <CardDescription>Stay updated on project activity</CardDescription>
                </CardHeader>
              </Link>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
