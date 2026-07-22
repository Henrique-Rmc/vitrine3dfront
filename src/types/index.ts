export interface User {
  id: string
  email: string
  userName: string
  storeName: string
  slug: string
  whatsappNumber: string
  storeDescription: string
  logoUrl: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  stateId?: number | null
  stateName?: string | null
  stateAbbreviation?: string | null
  cityId?: number | null
  cityName?: string | null
}

export interface Category {
  id: number
  name: string
  isGlobal: boolean
  storeId: string
}

export interface Material {
  id: number
  name: string
  isGlobal: boolean
  storeId: string
}

export interface Product {
  id: number
  name: string
  description: string | null
  imageUrl: string | null
  imageUrls?: string[] | null
  isVisible: boolean
  featured?: boolean
  price?: number | null
  storeId: string
  whatsappUrl?: string
  clickCount?: number
  attributes?: Record<string, unknown>
  productTypeId?: number | null
  productTypeLabel?: string | null
}
