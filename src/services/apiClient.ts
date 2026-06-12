import axios from 'axios'

const AUTH_TOKEN_KEY = 'auth_token'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT to every request when present
apiClient.interceptors.request.use((config) => {
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
