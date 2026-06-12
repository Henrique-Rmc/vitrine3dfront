import apiClient from './apiClient'
import type { Product } from '../types'

export type CreateProductRequest = Omit<Product, 'id' | 'userId'>

export interface ScrapeResponse {
  name: string
  description: string
  imageUrl: string
}

export async function listProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<Product[]>('/api/products')
  return data
}

export async function createProduct(payload: CreateProductRequest): Promise<Product> {
  const { data } = await apiClient.post<Product>('/api/products', payload)
  return data
}

export async function deleteProduct(id: number): Promise<void> {
  await apiClient.delete(`/api/products/${id}`)
}

export async function updateProduct(id: number, payload: CreateProductRequest): Promise<Product> {
  const { data } = await apiClient.put<Product>(`/api/products/${id}`, payload)
  return data
}

export async function scrapeFromMakerWorld(url: string): Promise<ScrapeResponse> {
  const { data } = await apiClient.post<ScrapeResponse>('/api/products/scrape', { url })
  return data
}
