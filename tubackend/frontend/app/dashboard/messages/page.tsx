"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { MessageCard } from "@/components/messages/MessageCard"
import { MessageInput } from "@/components/messages/MessageInput"
import { ProjectSelector } from "@/components/messages/ProjectSelector"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api"
import { Search, MessageSquare, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Message {
  _id: string
  content: string
  sender: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  project: {
    _id: string
    name: string
  }
  parentMessage?: string
  attachments?: Array<{
    filename: string
    url: string
    type: string
  }>
  likes: string[]
  isPinned: boolean
  createdAt: string
  updatedAt: string
  replies?: Message[]
}

export default function MessagesPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      loadMessages()
    }
  }, [selectedProject])

  useEffect(() => {
    filterMessages()
  }, [messages, searchTerm, filterType])

  const loadProjects = async () => {
    try {
      const response = await apiClient.getProjects()
      if (response.success) {
        const projectData = response.data || []
        setProjects(projectData)
        if (projectData.length > 0) {
          setSelectedProject(projectData[0]._id)
        }
      }
    } catch (error) {
      console.error("Failed to load projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    if (!selectedProject) return

    try {
      const response = await apiClient.getMessages(selectedProject)
      if (response.success) {
        // Group messages with their replies
        const messageData = response.data || []
        const groupedMessages = messageData
          .filter((msg: Message) => !msg.parentMessage)
          .map((msg: Message) => ({
            ...msg,
            replies: messageData.filter((reply: Message) => reply.parentMessage === msg._id),
          }))
        setMessages(groupedMessages)
      }
    } catch (error) {
      console.error("Failed to load messages:", error)
    }
  }

  const filterMessages = () => {
    let filtered = messages

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (message) =>
          message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          message.sender.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by type
    if (filterType === "pinned") {
      filtered = filtered.filter((message) => message.isPinned)
    } else if (filterType === "my-messages") {
      filtered = filtered.filter((message) => message.sender._id === user?._id)
    }

    setFilteredMessages(filtered)
  }

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!selectedProject || !content.trim()) return

    try {
      const messageData = {
        content,
        project: selectedProject,
        // Note: File upload would need additional implementation
      }

      const response = await apiClient.sendMessage(messageData)
      if (response.success) {
        loadMessages()
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  const handleReply = async (parentMessageId: string) => {
    // This would be implemented with a reply form
    console.log("Reply to message:", parentMessageId)
  }

  const handleLike = async (messageId: string) => {
    // This would call an API endpoint to toggle like
    console.log("Toggle like for message:", messageId)
  }

  const handlePin = async (messageId: string) => {
    // This would call an API endpoint to toggle pin
    console.log("Toggle pin for message:", messageId)
  }

  const handleEdit = async (message: Message) => {
    // This would call an API endpoint to update the message
    console.log("Edit message:", message)
  }

  const handleDelete = async (messageId: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      console.log("Delete message:", messageId)
    }
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
      <div className="h-full flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">Communicate with your team in real-time.</p>
          </div>
        </div>

        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">No projects available</CardTitle>
              <CardDescription>Create a project first to start messaging with your team.</CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <ProjectSelector
                projects={projects}
                selectedProject={selectedProject}
                onProjectChange={setSelectedProject}
              />

              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter messages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Messages</SelectItem>
                    <SelectItem value="pinned">Pinned Messages</SelectItem>
                    <SelectItem value="my-messages">My Messages</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="lg:col-span-3 flex flex-col min-h-0">
              {selectedProject ? (
                <>
                  {/* Messages */}
                  <div className="flex-1 min-h-0">
                    <ScrollArea className="h-full pr-4">
                      {filteredMessages.length > 0 ? (
                        <div className="space-y-4 pb-4">
                          {filteredMessages.map((message) => (
                            <MessageCard
                              key={message._id}
                              message={message}
                              currentUserId={user?._id || ""}
                              onReply={handleReply}
                              onLike={handleLike}
                              onPin={handlePin}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-medium mb-2">No messages yet</h3>
                            <p className="text-sm text-muted-foreground">
                              Start the conversation by sending the first message.
                            </p>
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  {/* Message Input */}
                  <div className="mt-4">
                    <MessageInput onSendMessage={handleSendMessage} />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Select a project</h3>
                    <p className="text-sm text-muted-foreground">Choose a project to start messaging with your team.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
