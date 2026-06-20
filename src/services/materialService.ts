import apiClient from './apiClient'
import type { Material } from '../types'

export async function listMaterials(storeId?: string): Promise<Material[]> {
  if (storeId) {
    const { data } = await apiClient.get<Material[]>(`/api/materials/store/${storeId}`)
    return data
  }
  const { data } = await apiClient.get<Material[]>('/api/materials')
  return data
}

export async function createMaterial(name: string): Promise<Material> {
  const { data } = await apiClient.post<Material>('/api/materials', { name })
  return data
}

export async function updateMaterial(id: number, name: string): Promise<Material> {
  const { data } = await apiClient.put<Material>(`/api/materials/${id}`, { name })
  return data
}

export async function deleteMaterial(id: number): Promise<void> {
  await apiClient.delete(`/api/materials/${id}`)
}
