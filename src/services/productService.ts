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
  storeId: number
}

// Keep the old alias so DashboardPage still compiles without changes
export type CreateProductRequest = ProductFormData

// ── Private helper ─────────────────────────────────────────────────────────────

// Builds a multipart/form-data body.
// imageUrl is included in the JSON `data` field unless a file is provided
// (the file takes precedence and the backend sets imageUrl from MinIO).
function buildFormData(payload: ProductFormData, imageFile?: File | null): FormData {
  const fd = new FormData()
  const { imageUrl, ...rest } = payload
  const dataJson = imageFile ? rest : { ...rest, imageUrl }
  fd.append('data', JSON.stringify(dataJson))
  if (imageFile) fd.append('image', imageFile)
  return fd
}

// ── Public storefront (no auth) ───────────────────────────────────────────────

export async function listPublicProducts(storeId: number): Promise<Product[]> {
  const { data } = await apiClient.get<Product[]>(`/api/products/store/${storeId}/public`)
  return data
}

// ── Admin (JWT required) ──────────────────────────────────────────────────────

export async function listProducts(storeId: number): Promise<Product[]> {
  const { data } = await apiClient.get<Product[]>(`/api/products/store/${storeId}`)
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

export async function toggleProductVisibility(id: number): Promise<Product> {
  const { data } = await apiClient.patch<Product>(`/api/products/${id}/visibility`)
  return data
}

export async function deleteProduct(id: number): Promise<void> {
  await apiClient.delete(`/api/products/${id}`)
}

