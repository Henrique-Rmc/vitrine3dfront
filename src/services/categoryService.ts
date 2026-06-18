import apiClient from './apiClient'
import type { Category } from '../types'

/**
 * When storeId is provided, calls the store-scoped endpoint which returns
 * global categories + this store's own categories (server-side filtering).
 * When omitted, calls the public endpoint which returns only global categories.
 */
export async function listCategories(storeId?: string): Promise<Category[]> {
  if (storeId) {
    const { data } = await apiClient.get<Category[]>(`/api/categories/store/${storeId}`)
    return data
  }
  const { data } = await apiClient.get<Category[]>('/api/categories')
  return data
}

export async function createCategory(name: string): Promise<Category> {
  const { data } = await apiClient.post<Category>('/api/categories', { name })
  return data
}

export async function updateCategory(id: number, name: string): Promise<Category> {
  const { data } = await apiClient.put<Category>(`/api/categories/${id}`, { name })
  return data
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/api/categories/${id}`)
}
