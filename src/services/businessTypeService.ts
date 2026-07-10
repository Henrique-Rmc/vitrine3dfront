import apiClient from './apiClient'

export interface BusinessType {
  id: number
  name: string
  slug: string
}

export async function listBusinessTypes(): Promise<BusinessType[]> {
  const { data } = await apiClient.get<BusinessType[]>('/api/business-types')
  return data
}
