import apiClient from './apiClient'
import type { SubscriptionInfo } from '../types'

// ── Shapes ────────────────────────────────────────────────────────────────────

export interface AdminStoreResponse {
  id: string
  email: string
  userName: string
  storeName: string
  slug: string
  role: string
  isActive: boolean
  emailVerified: boolean
  profileType: string
  createdAt: string
  subscription: SubscriptionInfo | null
}

export interface AdminStoreFilter {
  search?: string
  active?: boolean
  plan?: 'FREE' | 'BASIC' | 'PRO' | 'PREMIUM'
  status?: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED'
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface PlatformStats {
  totalStores: number
  activeStores: number
  totalProducts: number
  totalWhatsappClicks: number
  totalAffiliateClicks: number
}

export interface SubscriptionUpdateRequest {
  plan?: 'FREE' | 'BASIC' | 'PRO' | 'PREMIUM'
  status?: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED'
  trialEndsAt?: string | null
  expiresAt?: string | null
  cancelledAt?: string | null
  paymentProvider?: 'STRIPE' | 'PAGSEGURO' | 'ASAAS' | 'MANUAL'
  externalId?: string
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function listAdminStores(
  filter: AdminStoreFilter = {},
  page = 0,
  size = 20,
): Promise<PageResponse<AdminStoreResponse>> {
  const params = new URLSearchParams()
  if (filter.search)  params.set('filter.search', filter.search)
  if (filter.active != null) params.set('filter.active', String(filter.active))
  if (filter.plan)    params.set('filter.plan', filter.plan)
  if (filter.status)  params.set('filter.status', filter.status)
  params.set('page', String(page))
  params.set('size', String(size))
  const { data } = await apiClient.get<PageResponse<AdminStoreResponse>>(
    `/api/admin/stores?${params.toString()}`,
  )
  return data
}

export async function getAdminStore(id: string): Promise<AdminStoreResponse> {
  const { data } = await apiClient.get<AdminStoreResponse>(`/api/admin/stores/${id}`)
  return data
}

export async function toggleStoreActive(id: string): Promise<AdminStoreResponse> {
  const { data } = await apiClient.patch<AdminStoreResponse>(`/api/admin/stores/${id}/toggle-active`)
  return data
}

export async function deleteAdminStore(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/stores/${id}`)
}

export async function updateSubscription(
  id: string,
  payload: SubscriptionUpdateRequest,
): Promise<AdminStoreResponse> {
  const { data } = await apiClient.put<AdminStoreResponse>(
    `/api/admin/stores/${id}/subscription`,
    payload,
  )
  return data
}

export async function extendTrial(id: string, days: number): Promise<AdminStoreResponse> {
  const { data } = await apiClient.post<AdminStoreResponse>(
    `/api/admin/stores/${id}/subscription/extend`,
    { days },
  )
  return data
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const { data } = await apiClient.get<PlatformStats>('/api/admin/stats')
  return data
}
