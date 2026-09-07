'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_WATCH_PARTY_URL || 'http://localhost:3001'
const TOKEN_KEY = 'boredflix_token'
const USER_KEY = 'boredflix_user'

export interface BoredFlixUser {
  id: string
  email: string
  displayName: string
  createdAt?: string
}

interface AuthError {
  message: string
}

interface AuthContextType {
  user: BoredFlixUser | null
  loading: boolean
  token: string | null
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BoredFlixUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)

    if (!storedToken) {
      setLoading(false)
      return
    }

    // Restore session instantly from cache — no loading flash
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
        setToken(storedToken)
      } catch { /* ignore bad cache */ }
    }
    setLoading(false)

    // Verify token in background — only clear on explicit 401
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USER_KEY)
          setUser(null)
          setToken(null)
          return
        }
        if (res.ok) {
          const data = await res.json()
          if (data?.user) {
            setUser(data.user)
            setToken(storedToken)
            localStorage.setItem(USER_KEY, JSON.stringify(data.user))
          }
        }
        // Any other error (network, 500) — keep existing session
      })
      .catch(() => { /* network error — keep session, try again next load */ })
  }, [])

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { error: { message: data.error || 'Invalid email or password.' } }
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
      return { error: null }
    } catch {
      return { error: { message: 'Could not connect to the auth server. Make sure it is running.' } }
    }
  }

  const signUp = async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      const displayName = fullName?.trim() || email.split('@')[0]
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      })
      const data = await res.json()
      if (!res.ok) return { error: { message: data.error || 'Registration failed.' } }
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
      return { error: null }
    } catch {
      return { error: { message: 'Could not connect to the auth server. Make sure it is running.' } }
    }
  }

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
    setToken(null)
    return { error: null }
  }

  const resetPassword = async (_email: string): Promise<{ error: AuthError | null }> => {
    return { error: { message: 'Password reset is not available yet. Please contact support.' } }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
