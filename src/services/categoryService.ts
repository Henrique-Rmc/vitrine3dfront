import apiClient from './apiClient'
import type { Category } from '../types'

export async function listCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/api/categories')
  return data
}

export async function createCategory(
  name: string,
  storeId?: number,
  isGlobal = false,
): Promise<Category> {
  const { data } = await apiClient.post<Category>('/api/categories', {
    name,
    isGlobal,
    ...(storeId !== undefined && { storeId }),
  })
  return data
}

export async function updateCategory(id: number, name: string): Promise<Category> {
  const { data } = await apiClient.put<Category>(`/api/categories/${id}`, { name })
  return data
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/api/categories/${id}`)
}
