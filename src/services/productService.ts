import apiClient from './apiClient'
import type { Product } from '../types'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProductFormData {
  name: string
  description: string
  imageUrls: string[]
  isVisible: boolean
  storeId: string
  price?: number | null
  attributes?: Record<string, unknown>
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

// Keep old alias so any remaining references compile
export type CreateProductRequest = ProductFormData

// ── Private helper ────────────────────────────────────────────────────────────

function buildFormData(payload: ProductFormData, imageFiles: File[]): FormData {
  const fd = new FormData()
  const { imageUrls, price, attributes, ...rest } = payload
  const dataJson: Record<string, unknown> = imageFiles.length > 0
    ? { ...rest }
    : { ...rest, imageUrls }
  if (price != null) dataJson.price = price
  if (attributes && Object.keys(attributes).length > 0) dataJson.attributes = attributes
  fd.append('data', JSON.stringify(dataJson))
  imageFiles.forEach((file) => fd.append('images', file))
  return fd
}

// ── Public storefront (no auth required) ─────────────────────────────────────

export async function listPublicProducts(
  storeId: string,
  page = 0,
  size = 15,
): Promise<PageResponse<Product>> {
  const { data } = await apiClient.get<PageResponse<Product>>(
    `/api/products/store/${storeId}/public?page=${page}&size=${size}`,
  )
  return data
}

export async function listFeaturedProducts(storeId: string): Promise<Product[]> {
  const { data } = await apiClient.get<Product[]>(`/api/products/store/${storeId}/featured`)
  return data
}

export async function registerWhatsAppClick(productId: number): Promise<void> {
  await apiClient.post(`/api/products/${productId}/whatsapp-click`)
}

// ── Admin (JWT required) ──────────────────────────────────────────────────────

export async function listProducts(
  storeId: string,
  page = 0,
  size = 50,
): Promise<PageResponse<Product>> {
  const { data } = await apiClient.get<PageResponse<Product>>(
    `/api/products/store/${storeId}?page=${page}&size=${size}`,
  )
  return data
}

export async function getProduct(id: number): Promise<Product> {
  const { data } = await apiClient.get<Product>(`/api/products/${id}`)
  return data
}

export async function createProduct(
  payload: ProductFormData,
  imageFiles: File[] = [],
): Promise<Product> {
  const { data } = await apiClient.post<Product>('/api/products', buildFormData(payload, imageFiles))
  return data
}

export async function updateProduct(
  id: number,
  payload: ProductFormData,
  imageFiles: File[] = [],
): Promise<Product> {
  const { data } = await apiClient.put<Product>(`/api/products/${id}`, buildFormData(payload, imageFiles))
  return data
}

export async function reorderProducts(orderedIds: number[]): Promise<void> {
  await apiClient.put('/api/products/reorder', orderedIds)
}

export async function patchFeatured(productId: number): Promise<Product> {
  const { data } = await apiClient.patch<Product>(`/api/products/${productId}/featured`)
  return data
}

export async function toggleProductVisibility(id: number): Promise<Product> {
  const { data } = await apiClient.patch<Product>(`/api/products/${id}/visibility`)
  return data
}

export async function deleteProduct(id: number): Promise<void> {
  await apiClient.delete(`/api/products/${id}`)
}
