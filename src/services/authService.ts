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
  id: string   // presente em /api/users/{id} e /api/users/me; ausente em respostas de PUT (ignorado via fallbackId)
  email: string
  userName: string
  storeName: string
  whatsappNumber: string
  storeDescription: string
  logoUrl: string | null
  coverImageUrl?: string | null
  coverColor?: string | null
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
  storeNameFont?: string | null
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
      storeNameFont: profile.storeNameFont ?? null,
      coverColor: profile.coverColor ?? null,
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

export async function registerUser(payload: RegisterRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginApiResponse>('/api/users/register', payload)

  // Construct user from registration payload + auth response.
  // Avoids a second GET /api/users/:id before the token is stored,
  // which would fail with 401. Slug and location labels are empty
  // initially and get populated on the next profile fetch.
  return {
    token: data.accessToken,
    user: {
      id: data.storeId!,
      email: data.email,
      userName: payload.userName,
      storeName: payload.storeName,
      slug: '',
      whatsappNumber: payload.whatsappNumber,
      storeDescription: payload.storeDescription,
      logoUrl: '',
      coverImageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      role: data.role,
      emailVerified: null,
      profileType: 'STANDARD',
      subscription: null,
      stateId: payload.stateId,
      stateName: null,
      stateAbbreviation: null,
      cityId: payload.cityId ?? null,
      cityName: null,
    },
  }
}

export type AffiliateRegisterRequest = Omit<RegisterRequest, 'profileType'>

export async function registerAffiliate(payload: AffiliateRegisterRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginApiResponse>('/api/users/register/affiliate', payload)
  return {
    token: data.accessToken,
    user: {
      id: data.storeId!,
      email: data.email,
      userName: payload.userName,
      storeName: payload.storeName,
      slug: '',
      whatsappNumber: payload.whatsappNumber,
      storeDescription: payload.storeDescription,
      logoUrl: '',
      coverImageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      role: data.role,
      emailVerified: null,
      profileType: 'AFFILIATE',
      subscription: null,
      stateId: payload.stateId,
      stateName: null,
      stateAbbreviation: null,
      cityId: payload.cityId ?? null,
      cityName: null,
    },
  }
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
      storeNameFont: profile.storeNameFont ?? null,
      coverColor: profile.coverColor ?? null,
    },
  }
}

// ── Fetch store profile ───────────────────────────────────────────────────────

function mapStoreResponse(data: StoreApiResponse, fallbackId?: string): Omit<User, 'password'> {
  return {
    id: data.id ?? fallbackId ?? '',
    email: data.email,
    userName: data.userName,
    storeName: data.storeName,
    slug: data.slug,
    whatsappNumber: data.whatsappNumber,
    storeDescription: data.storeDescription,
    logoUrl: data.logoUrl ?? '',
    coverImageUrl: data.coverImageUrl ?? null,
    createdAt: data.createdAt ?? '',
    updatedAt: data.updatedAt ?? '',
    isActive: data.isActive,
    role: data.role ?? null,
    emailVerified: data.emailVerified ?? null,
    profileType: data.profileType ?? null,
    subscription: data.subscription ?? null,
    stateId: data.stateId ?? null,
    stateName: data.stateName ?? null,
    stateAbbreviation: data.stateAbbreviation ?? null,
    cityId: data.cityId ?? null,
    cityName: data.cityName ?? null,
    storeNameFont: data.storeNameFont ?? null,
    coverColor: data.coverColor ?? null,
  }
}

export async function fetchUserProfile(storeId: string): Promise<Omit<User, 'password'>> {
  const { data } = await apiClient.get<StoreApiResponse>(`/api/users/${storeId}`)
  return mapStoreResponse(data, storeId)
}

export async function fetchMyProfile(): Promise<Omit<User, 'password'>> {
  const { data } = await apiClient.get<StoreApiResponse>('/api/users/me')
  return mapStoreResponse(data)
}

// ── Profile update ────────────────────────────────────────────────────────────

export interface UpdateProfileRequest {
  userName: string
  storeName: string
  whatsappNumber: string
  storeDescription: string
  storeNameFont?: string | null
  coverColor?: string | null
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

export async function deleteCoverImage(userId: string): Promise<StoreApiResponse> {
  const { data } = await apiClient.delete<StoreApiResponse>(`/api/users/${userId}/cover-image`)
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
