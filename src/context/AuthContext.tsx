import { createContext, useContext, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import type { User } from '../types'
import { loginUser, loginWithGoogle, logoutUser, refreshToken } from '../services/authService'
import { tokenStore } from '../services/tokenStore'

const USER_KEY = 'auth_user'

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: Omit<User, 'password'> | null
  token: string | null
  isAuthenticated: boolean
  /** true while the silent refresh attempt on mount is in flight */
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginGoogle: (accessToken: string) => Promise<{ isNewUser: boolean }>
  logout: () => void
  updateUser: (updates: Partial<Omit<User, 'password'>>) => void
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<Omit<User, 'password'> | null>(null)
  const [token, setToken]         = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Remove any JWT left in localStorage by the previous implementation
    localStorage.removeItem('auth_token')

    // Attempt a silent refresh on every page load.
    // The browser sends the httpOnly refresh cookie automatically (withCredentials).
    // If the cookie is absent or expired, the catch is a no-op and the user
    // will be redirected to login by ProtectedRoute.
    refreshToken()
      .then((newToken) => {
        tokenStore.set(newToken)
        setToken(newToken)
        const savedUser = localStorage.getItem(USER_KEY)
        if (savedUser) {
          try { setUser(JSON.parse(savedUser) as Omit<User, 'password'>) } catch { /* ignore */ }
        }
      })
      .catch(() => { /* no valid cookie — stay unauthenticated */ })
      .finally(() => setIsLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const { token: newToken, user: loggedUser } = await loginUser({ email, password })
    tokenStore.set(newToken)
    // flushSync garante que o estado de auth é commitado no DOM antes de retornar,
    // evitando race condition com navigate() em rotas protegidas.
    flushSync(() => {
      setToken(newToken)
      setUser(loggedUser)
    })
    localStorage.setItem(USER_KEY, JSON.stringify(loggedUser))
  }

  async function loginGoogle(accessToken: string): Promise<{ isNewUser: boolean }> {
    const { token: newToken, user: loggedUser } = await loginWithGoogle(accessToken)
    const isNew = !loggedUser.slug
    tokenStore.set(newToken)
    flushSync(() => {
      setToken(newToken)
      setUser(loggedUser)
    })
    localStorage.setItem(USER_KEY, JSON.stringify(loggedUser))
    return { isNewUser: isNew }
  }

  function logout() {
    // Fire-and-forget: revokes the refresh cookie on the server.
    // Local state is cleared immediately regardless of network outcome.
    logoutUser().catch(() => undefined)
    tokenStore.set(null)
    setToken(null)
    setUser(null)
    localStorage.removeItem(USER_KEY)
  }

  function updateUser(updates: Partial<Omit<User, 'password'>>) {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      return updated
    })
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, loginGoogle, logout, updateUser }}>
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
