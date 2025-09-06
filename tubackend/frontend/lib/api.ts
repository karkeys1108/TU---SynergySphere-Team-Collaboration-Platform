const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.initializeToken()
  }

  private initializeToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem("token")
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem("token", token)
    }
  }

  removeToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem("token")
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Ensure token is up to date
    this.initializeToken()
    
    const url = `${this.baseURL}${endpoint}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Add auth header if token exists
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Important for cookies if using them
      })

      // Handle 401 Unauthorized
      if (response.status === 401) {
        this.removeToken()
        window.location.href = '/auth/login'
        return {
          success: false,
          error: 'Session expired. Please log in again.'
        }
      }

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'An error occurred',
          ...data
        }
      }

      return {
        success: true,
        data,
        ...data
      }
    } catch (error) {
      console.error('API Request Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (response.success && response.data?.token) {
      this.setToken(response.data.token)
    }

    return response
  }

  async register(userData: {
    name: string
    email: string
    password: string
    role?: string
  }) {
    const response = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })

    if (response.success && response.data?.token) {
      this.setToken(response.data.token)
    }

    return response
  }

  async getProfile() {
    return this.request<any>('/auth/profile')
  }

  async updateProfile(userData: any) {
    return this.request<any>('/auth/profile', {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  }

  // Project endpoints
  async getProjects() {
    return this.request<any[]>("/projects")
  }

  async createProject(projectData: any) {
    if (!projectData || typeof projectData !== 'object') {
      throw new Error('Invalid project data')
    }
    return this.request<any>("/projects", {
      method: "POST",
      body: JSON.stringify(projectData),
    })
  }

  async getProject(id: string) {
    if (!id) {
      throw new Error('Project ID is required')
    }
    return this.request<any>(`/projects/${id}`)
  }

  async updateProject(id: string, projectData: any) {
    if (!id) {
      throw new Error('Project ID is required')
    }
    if (!projectData || typeof projectData !== 'object') {
      throw new Error('Invalid project data')
    }
    return this.request<any>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(projectData),
    })
  }

  async deleteProject(id: string) {
    if (!id) {
      throw new Error('Project ID is required')
    }
    return this.request<any>(`/projects/${id}`, {
      method: "DELETE",
    })
  }

  // Task endpoints
  async getTasks(projectId?: string) {
    const endpoint = projectId ? `/tasks?project=${projectId}` : "/tasks"
    return this.request<any[]>(endpoint)
  }

  async createTask(taskData: any) {
    return this.request<any>("/tasks", {
      method: "POST",
      body: JSON.stringify(taskData),
    })
  }

  async updateTask(id: string, taskData: any) {
    return this.request<any>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(taskData),
    })
  }

  async deleteTask(id: string) {
    return this.request<any>(`/tasks/${id}`, {
      method: "DELETE",
    })
  }

  // Message endpoints
  async getMessages(projectId: string) {
    return this.request<any[]>(`/messages?project=${projectId}`)
  }

  async sendMessage(messageData: any) {
    return this.request<any>("/messages", {
      method: "POST",
      body: JSON.stringify(messageData),
    })
  }

  async updateMessage(id: string, messageData: any) {
    return this.request<any>(`/messages/${id}`, {
      method: "PUT",
      body: JSON.stringify(messageData),
    })
  }

  async deleteMessage(id: string) {
    return this.request<any>(`/messages/${id}`, {
      method: "DELETE",
    })
  }

  async likeMessage(id: string) {
    return this.request<any>(`/messages/${id}/like`, {
      method: "POST",
    })
  }

  async pinMessage(id: string) {
    return this.request<any>(`/messages/${id}/pin`, {
      method: "POST",
    })
  }

  // Notification endpoints
  async getNotifications() {
    return this.request<any[]>("/notifications")
  }

  async markNotificationRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, {
      method: "PUT",
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
export type { ApiResponse }
