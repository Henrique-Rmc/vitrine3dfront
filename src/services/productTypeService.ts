import apiClient from './apiClient'

export interface ProductType {
  id: number
  key: string
  label: string
  sortOrder?: number
}

export async function listProductTypes(storeId: string): Promise<ProductType[]> {
  const { data } = await apiClient.get<ProductType[]>(
    `/api/products/store/${storeId}/product-types`,
  )
  return data
}

export async function createProductType(
  storeId: string,
  payload: { key: string; label: string; sortOrder?: number },
): Promise<ProductType> {
  const { data } = await apiClient.post<ProductType>(
    `/api/products/store/${storeId}/product-types`,
    payload,
  )
  return data
}

export async function deleteProductType(storeId: string, productTypeId: number): Promise<void> {
  await apiClient.delete(`/api/products/store/${storeId}/product-types/${productTypeId}`)
}
