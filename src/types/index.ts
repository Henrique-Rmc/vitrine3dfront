export interface User {
  id: number
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
}

export interface Category {
  id: number
  name: string
  isGlobal: boolean
  userId: number
}

export interface Product {
  id: number
  name: string
  description: string
  imageUrl: string
  material: string
  multicolor: boolean
  dimensions: string
  isVisible: boolean
  categoryId: number
  userId: number
  whatsappUrl?: string
}
