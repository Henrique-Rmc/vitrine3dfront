import apiClient from './apiClient'
import type { Product } from '../types'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProductFormData {
  name: string
  description: string
  imageUrl: string
  material: string
  multicolor: boolean
  dimensions: string
  isVisible: boolean
  categoryId: number
  storeId: string
  price?: number | null
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

// Keep the old alias so any remaining references still compile
export type CreateProductRequest = ProductFormData

// ── Private helper ────────────────────────────────────────────────────────────

function buildFormData(payload: ProductFormData, imageFile?: File | null): FormData {
  const fd = new FormData()
  const { imageUrl, price, ...rest } = payload
  const dataJson: Record<string, unknown> = imageFile ? { ...rest } : { ...rest, imageUrl }
  if (price != null) dataJson.price = price
  fd.append('data', JSON.stringify(dataJson))
  if (imageFile) fd.append('image', imageFile)
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
  imageFile?: File | null,
): Promise<Product> {
  const { data } = await apiClient.post<Product>('/api/products', buildFormData(payload, imageFile))
  return data
}

export async function updateProduct(
  id: number,
  payload: ProductFormData,
  imageFile?: File | null,
): Promise<Product> {
  const { data } = await apiClient.put<Product>(`/api/products/${id}`, buildFormData(payload, imageFile))
  return data
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
