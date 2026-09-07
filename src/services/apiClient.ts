import axios from 'axios'
import { tokenStore } from './tokenStore'

const apiClient = axios.create({
  //baseURL: import.meta.env.VITE_API_STAGING_URL as string,
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  timeout: 10_000,
  withCredentials: true, // browser sends httpOnly refresh cookie automatically
})

// ── Request: attach access token + fix FormData Content-Type ──────────────────
apiClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  }
  const token = tokenStore.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response: silent token refresh on 401 ────────────────────────────────────
//
// Endpoints in SKIP_INTERCEPT must not trigger a refresh attempt:
//   /auth/login    — 401 here means wrong credentials, not expired session
//   /users/register — same
//   /auth/refresh  — if the refresh itself fails, the session is truly expired
//
const SKIP_INTERCEPT = ['/auth/login', '/users/register', '/auth/refresh']

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

function drainQueue(newToken: string) {
  refreshQueue.forEach((cb) => cb(newToken))
  refreshQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url = (error.config?.url as string | undefined) ?? ''
    const skip = SKIP_INTERCEPT.some((p) => url.includes(p))

    // Retry GET requests once on timeout — handles Render cold-start (~15-20s wake time).
    // Only GET is safe to retry (idempotent). One retry is enough: first attempt times out
    // while the server wakes up, then the retry succeeds immediately after.
    const isTimeout = error.code === 'ECONNABORTED' || !!error.message?.includes('timeout')
    const isGet = (error.config?.method ?? '').toLowerCase() === 'get'
    if (isTimeout && isGet && !error.config._retried) {
      error.config._retried = true
      return apiClient(error.config)
    }

    if (error.response?.status !== 401 || skip || error.config._retry) {
      return Promise.reject(error)
    }

    error.config._retry = true

    // Another refresh is already in flight — queue this request until it resolves
    if (isRefreshing) {
      return new Promise<unknown>((resolve) => {
        refreshQueue.push((newToken) => {
          error.config.headers.Authorization = `Bearer ${newToken}`
          resolve(apiClient(error.config))
        })
      })
    }

    isRefreshing = true
    try {
      const { data } = await apiClient.post<{ accessToken: string }>('/api/auth/refresh')
      tokenStore.set(data.accessToken)
      drainQueue(data.accessToken)
      error.config.headers.Authorization = `Bearer ${data.accessToken}`
      return apiClient(error.config)
    } catch {
      // Refresh token expired or revoked — force re-login
      tokenStore.set(null)
      localStorage.removeItem('auth_user')
      window.location.href = '/admin/login'
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)

export default apiClient
