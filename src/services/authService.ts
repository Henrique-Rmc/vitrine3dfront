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
  storeId: string
  email: string
  storeName: string
}

// Full user/store profile — matches backend StoreResponse
interface StoreApiResponse {
  id: string
  email: string
  userName: string
  storeName: string
  whatsappNumber: string
  storeDescription: string
  logoUrl: string | null
  isActive: boolean
  slug: string
  stateId?: number | null
  stateName?: string | null
  stateAbbreviation?: string | null
  cityId?: number | null
  cityName?: string | null
  createdAt?: string
  updatedAt?: string
}

export async function loginUser(credentials: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginApiResponse>('/api/auth/login', credentials)

  // Fetch full profile (public endpoint) to get userName, slug, location, etc.
  const { data: profile } = await apiClient.get<StoreApiResponse>(`/api/users/${data.storeId}`)

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
      stateId: profile.stateId ?? null,
      stateName: profile.stateName ?? null,
      stateAbbreviation: profile.stateAbbreviation ?? null,
      cityId: profile.cityId ?? null,
      cityName: profile.cityName ?? null,
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
  id: string
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
  userId: string,
  payload: UpdateProfileRequest,
): Promise<StoreApiResponse> {
  const { data } = await apiClient.put<StoreApiResponse>(`/api/users/${userId}`, payload)
  return data
}

export async function uploadLogo(userId: string, file: File): Promise<StoreApiResponse> {
  const fd = new FormData()
  fd.append('logo', file)
  const { data } = await apiClient.post<StoreApiResponse>(`/api/users/${userId}/logo`, fd)
  return data
}
