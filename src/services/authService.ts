import apiClient from './apiClient'
import type { User, SubscriptionInfo } from '../types'

// ── Login ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: Omit<User, 'password'>
}

// Backend login response — openapi uses `storeName`, real API may use `name`
interface LoginApiResponse {
  accessToken: string
  type: string
  role: string
  storeId: string | null
  email: string
  storeName?: string | null
  name?: string | null
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
  coverImageUrl?: string | null
  isActive: boolean
  slug: string
  role?: string | null
  emailVerified?: boolean | null
  profileType?: 'STANDARD' | 'AFFILIATE' | null
  subscription?: SubscriptionInfo | null
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

  // Admin login: no storeId, no refresh cookie — return minimal user object
  if (data.role === 'ADMIN' || !data.storeId) {
    const displayName = data.name ?? data.storeName ?? data.email
    return {
      token: data.accessToken,
      user: {
        id: data.storeId ?? '',
        email: data.email,
        userName: displayName ?? '',
        storeName: displayName ?? '',
        slug: '',
        whatsappNumber: '',
        storeDescription: '',
        logoUrl: '',
        createdAt: '',
        updatedAt: '',
        isActive: true,
        role: data.role,
        emailVerified: true,
        profileType: null,
        subscription: null,
      },
    }
  }

  // Store owner login: fetch full profile
  const { data: profile } = await apiClient.get<StoreApiResponse>(`/api/users/${data.storeId}`)

  return {
    token: data.accessToken,
    user: {
      id: data.storeId,
      email: data.email,
      userName: profile.userName,
      storeName: data.storeName ?? data.name ?? profile.storeName,
      slug: profile.slug,
      whatsappNumber: profile.whatsappNumber,
      storeDescription: profile.storeDescription,
      logoUrl: profile.logoUrl ?? '',
      coverImageUrl: profile.coverImageUrl ?? null,
      createdAt: profile.createdAt ?? '',
      updatedAt: profile.updatedAt ?? '',
      isActive: profile.isActive,
      role: data.role,
      emailVerified: profile.emailVerified ?? null,
      profileType: profile.profileType ?? null,
      subscription: profile.subscription ?? null,
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
  profileType?: 'STANDARD' | 'AFFILIATE'
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

// ── Google OAuth ──────────────────────────────────────────────────────────────
// Backend must implement POST /api/auth/google accepting { idToken } and
// returning the same LoginApiResponse shape as /api/auth/login.

export async function loginWithGoogle(accessToken: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginApiResponse>('/api/auth/google', { accessToken })

  if (data.role === 'ADMIN' || !data.storeId) {
    const displayName = data.name ?? data.storeName ?? data.email
    return {
      token: data.accessToken,
      user: {
        id: data.storeId ?? '',
        email: data.email,
        userName: displayName ?? '',
        storeName: displayName ?? '',
        slug: '',
        whatsappNumber: '',
        storeDescription: '',
        logoUrl: '',
        createdAt: '',
        updatedAt: '',
        isActive: true,
        role: data.role,
        emailVerified: true,
        profileType: null,
        subscription: null,
      },
    }
  }

  const { data: profile } = await apiClient.get<StoreApiResponse>(`/api/users/${data.storeId}`)
  return {
    token: data.accessToken,
    user: {
      id: data.storeId,
      email: data.email,
      userName: profile.userName,
      storeName: data.storeName ?? data.name ?? profile.storeName,
      slug: profile.slug,
      whatsappNumber: profile.whatsappNumber,
      storeDescription: profile.storeDescription,
      logoUrl: profile.logoUrl ?? '',
      coverImageUrl: profile.coverImageUrl ?? null,
      createdAt: profile.createdAt ?? '',
      updatedAt: profile.updatedAt ?? '',
      isActive: profile.isActive,
      role: data.role,
      emailVerified: profile.emailVerified ?? null,
      profileType: profile.profileType ?? null,
      subscription: profile.subscription ?? null,
      stateId: profile.stateId ?? null,
      stateName: profile.stateName ?? null,
      stateAbbreviation: profile.stateAbbreviation ?? null,
      cityId: profile.cityId ?? null,
      cityName: profile.cityName ?? null,
    },
  }
}

// ── Profile update ────────────────────────────────────────────────────────────

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

export async function uploadCoverImage(userId: string, file: File): Promise<StoreApiResponse> {
  const fd = new FormData()
  fd.append('coverImage', file)
  const { data } = await apiClient.post<StoreApiResponse>(`/api/users/${userId}/cover-image`, fd)
  return data
}

// ── Email verification ────────────────────────────────────────────────────────

export async function verifyEmail(token: string): Promise<void> {
  await apiClient.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
}

export async function resendVerification(): Promise<void> {
  await apiClient.post('/api/auth/resend-verification')
}

// ── Refresh / Logout ──────────────────────────────────────────────────────────

export async function refreshToken(): Promise<string> {
  const { data } = await apiClient.post<{ accessToken: string }>('/api/auth/refresh')
  return data.accessToken
}

export async function logoutUser(): Promise<void> {
  await apiClient.post('/api/auth/logout')
}
