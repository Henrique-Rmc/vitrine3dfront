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
  materialId: number | null
  materialName: string | null
  dimensions: string | null
  isVisible: boolean
  categoryId: number
  categoryName?: string | null
  storeId: string
  price?: number | null
  whatsappUrl?: string
  featured?: boolean
  clickCount?: number
}
