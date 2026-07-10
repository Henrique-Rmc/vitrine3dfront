import apiClient from './apiClient'

export interface AttributeDefinition {
  id: number
  key: string
  label: string
  type: 'NUMBER' | 'TEXT' | 'ENUM' | 'BOOLEAN' | 'DATE'
  unit?: string | null
  required?: boolean
  filterable?: boolean
  sortOrder?: number | null
  enumOptions?: string[] | null
  custom: boolean
}

export async function listEffectiveAttributes(storeId: string): Promise<AttributeDefinition[]> {
  const { data } = await apiClient.get<AttributeDefinition[]>(
    `/api/products/store/${storeId}/attributes`,
  )
  return [...data].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

export interface CustomAttributePayload {
  type?: AttributeDefinition['type']
  unit?: string
  required?: boolean
  sortOrder?: number
  filterable?: boolean
}

export async function createCustomAttribute(
  storeId: string,
  label: string,
  key: string,
  options?: CustomAttributePayload,
): Promise<AttributeDefinition> {
  const { data } = await apiClient.post<AttributeDefinition>(
    `/api/products/store/${storeId}/attributes`,
    { key, label, type: 'TEXT', filterable: true, ...options },
  )
  return data
}

export async function hideGlobalAttribute(storeId: string, attributeId: number): Promise<void> {
  await apiClient.patch(`/api/products/store/${storeId}/attributes/${attributeId}/hide`)
}

export async function unhideGlobalAttribute(storeId: string, attributeId: number): Promise<void> {
  await apiClient.patch(`/api/products/store/${storeId}/attributes/${attributeId}/unhide`)
}

export async function deleteCustomAttribute(storeId: string, attributeId: number): Promise<void> {
  await apiClient.delete(`/api/products/store/${storeId}/attributes/${attributeId}`)
}

export async function listGlobalAttributes(businessTypeId: number): Promise<AttributeDefinition[]> {
  const { data } = await apiClient.get<AttributeDefinition[]>(
    `/api/business-types/${businessTypeId}/attributes`,
  )
  return [...data].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

export async function addOption(
  storeId: string,
  attributeDefinitionId: number,
  value: string,
): Promise<AttributeDefinition> {
  const { data } = await apiClient.post<AttributeDefinition>(
    `/api/products/store/${storeId}/attributes/${attributeDefinitionId}/options`,
    { value },
  )
  return data
}

/** Converts a human label to a valid attribute key: camelCase, letters+digits only */
export function labelToKey(label: string): string {
  const words = label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return ''
  return words
    .map((word, i) => (i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('')
    .slice(0, 50)
}
