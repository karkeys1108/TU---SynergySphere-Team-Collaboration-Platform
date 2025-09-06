"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"

interface User {
  _id: string
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await apiClient.getProfile()
        if (response.success && response.data) {
          setUser(response.data)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error("Auth init error:", error)
        apiClient.removeToken()
      } finally {
        setLoading(false)
      }
    }
    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await apiClient.login(email, password)
    if (response.success) {
      setUser(response.data.user)
      setIsAuthenticated(true)
      router.push('/dashboard')
      return true
    }
    return false
  }

  const logout = () => {
    apiClient.removeToken()
    setUser(null)
    setIsAuthenticated(false)
    router.push('/auth/login')
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
