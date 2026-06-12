import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '../types'
import { loginUser } from '../services/authService'

// ── Storage keys ──────────────────────────────────────────────────────────────
const TOKEN_KEY = 'auth_token'
const USER_KEY  = 'auth_user'

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: Omit<User, 'password'> | null
  token: string | null
  isAuthenticated: boolean
  /** true while rehydrating from localStorage on first render */
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<Omit<User, 'password'> | null>(null)
  const [token, setToken]     = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Rehydrate session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    const savedUser  = localStorage.getItem(USER_KEY)
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser) as Omit<User, 'password'>)
    }
    setIsLoading(false)
  }, [])

  async function login(email: string, password: string) {
    const { token: newToken, user: loggedUser } = await loginUser({ email, password })
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(loggedUser))
    setToken(newToken)
    setUser(loggedUser)
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
