import apiClient from './apiClient'

export interface BrazilState {
  id: number
  name: string
  code: string
}

export interface BrazilCity {
  id: number
  name: string
  stateId: number
}

export async function listStates(): Promise<BrazilState[]> {
  const { data } = await apiClient.get<BrazilState[]>('/api/locations/states')
  return data
}

export async function listCitiesByState(stateId: number): Promise<BrazilCity[]> {
  const { data } = await apiClient.get<BrazilCity[]>(`/api/locations/states/${stateId}/cities`)
  return data
}
