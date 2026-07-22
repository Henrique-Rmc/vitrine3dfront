import apiClient from './apiClient'

export interface AttributeDefinition {
  id: number
  key: string
  label: string
  type: 'NUMBER' | 'ENUM' | 'BOOLEAN'
  unit?: string | null
  required?: boolean
  filterable?: boolean
  sortOrder?: number | null
  enumOptions?: string[] | null
  custom: boolean
  productTypeId?: number | null
}

export async function listEffectiveAttributes(storeId: string, productTypeId?: number): Promise<AttributeDefinition[]> {
  const url = productTypeId != null
    ? `/api/products/store/${storeId}/attributes?productTypeId=${productTypeId}`
    : `/api/products/store/${storeId}/attributes`
  const { data } = await apiClient.get<AttributeDefinition[]>(url)
  return [...data].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

export interface CustomAttributePayload {
  required?: boolean
  sortOrder?: number
  filterable?: boolean
  enumOptions?: string[]
  productTypeId?: number
}

export async function createCustomAttribute(
  storeId: string,
  label: string,
  key: string,
  options?: CustomAttributePayload,
): Promise<AttributeDefinition> {
  const { data } = await apiClient.post<AttributeDefinition>(
    `/api/products/store/${storeId}/attributes`,
    { key, label, filterable: true, ...options },
  )
  return data
}

export async function deleteCustomAttribute(storeId: string, attributeId: number): Promise<void> {
  await apiClient.delete(`/api/products/store/${storeId}/attributes/${attributeId}`)
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
