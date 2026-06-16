import apiClient from './apiClient'
import type { User } from '../types'

// ── Login ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: Omit<User, 'password'>
}

// Actual backend login response — uses storeId (not id), omits userName/slug
interface LoginApiResponse {
  token: string
  type: string
  storeId: number
  email: string
  storeName: string
}

// Full user profile returned by GET /api/users/{id}
interface UserProfileResponse {
  id: number
  email: string
  userName: string
  storeName: string
  whatsappNumber: string
  storeDescription: string
  logoUrl: string | null
  isActive: boolean
  slug: string
  createdAt?: string
  updatedAt?: string
}

export async function loginUser(credentials: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginApiResponse>('/api/auth/login', credentials)

  // Fetch full profile (public endpoint) to get userName, slug, whatsappNumber, etc.
  const { data: profile } = await apiClient.get<UserProfileResponse>(`/api/users/${data.storeId}`)

  return {
    token: data.token,
    user: {
      id: data.storeId,
      email: data.email,
      userName: profile.userName,
      storeName: data.storeName,
      slug: profile.slug,
      whatsappNumber: profile.whatsappNumber,
      storeDescription: profile.storeDescription,
      logoUrl: profile.logoUrl ?? '',
      createdAt: profile.createdAt ?? '',
      updatedAt: profile.updatedAt ?? '',
      isActive: profile.isActive,
    },
  }
}

// ── Register ──────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string
  password: string
  userName: string
  storeName: string
  whatsappNumber: string
  storeDescription: string
  stateId: number
  cityId?: number
}

export interface RegisterApiResponse {
  id: number
  email: string
  userName: string
  storeName: string
  slug: string
}

export async function registerUser(payload: RegisterRequest): Promise<RegisterApiResponse> {
  const { data } = await apiClient.post<RegisterApiResponse>('/api/users/register', payload)
  return data
}

export interface UpdateProfileRequest {
  userName: string
  storeName: string
  whatsappNumber: string
  storeDescription: string
}

export async function updateUserProfile(
  userId: number,
  payload: UpdateProfileRequest,
): Promise<void> {
  await apiClient.put(`/api/users/${userId}`, payload)
}

export async function uploadLogo(userId: number, file: File): Promise<void> {
  const fd = new FormData()
  fd.append('logo', file)
  await apiClient.post(`/api/users/${userId}/logo`, fd)
}
