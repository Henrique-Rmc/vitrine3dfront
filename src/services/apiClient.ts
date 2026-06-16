import axios from 'axios'

const AUTH_TOKEN_KEY = 'auth_token'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  timeout: 10_000, // 10 s — prevents infinite loading when backend is unresponsive
})

// Attach JWT and fix multipart Content-Type on every request
apiClient.interceptors.request.use((config) => {
  // For FormData, remove any Content-Type so the browser XHR sets it
  // automatically with the correct multipart boundary
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401, clear session and redirect to login — except for the login endpoint itself
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = (error.config?.url as string | undefined)?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem('auth_user')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  },
)

export default apiClient
