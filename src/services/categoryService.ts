import apiClient from './apiClient'
import type { Category } from '../types'

export async function listCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/api/categories')
  return data
}

export async function createCategory(name: string): Promise<Category> {
  const { data } = await apiClient.post<Category>('/api/categories', { name })
  return data
}
