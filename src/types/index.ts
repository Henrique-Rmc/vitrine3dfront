export interface SubscriptionInfo {
  plan: 'FREE' | 'BASIC' | 'PRO' | 'PREMIUM'
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED'
  startedAt?: string | null
  trialEndsAt?: string | null
  expiresAt?: string | null
  active: boolean
  paymentProvider?: 'STRIPE' | 'PAGSEGURO' | 'ASAAS' | 'MANUAL' | null
  externalId?: string | null
}

export interface User {
  id: string
  email: string
  userName: string
  storeName: string
  slug: string
  whatsappNumber: string
  storeDescription: string
  logoUrl: string
  coverImageUrl?: string | null
  coverColor?: string | null
  createdAt: string
  updatedAt: string
  isActive: boolean
  role?: string | null
  emailVerified?: boolean | null
  profileType?: 'STANDARD' | 'AFFILIATE' | null
  subscription?: SubscriptionInfo | null
  stateId?: number | null
  stateName?: string | null
  stateAbbreviation?: string | null
  cityId?: number | null
  cityName?: string | null
  storeNameFont?: string | null
  storeTheme?: string | null
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
  affiliateUrl?: string | null
  affiliateClickCount?: number | null
  attributes?: Record<string, unknown>
  productTypeId?: number | null
  productTypeLabel?: string | null
  trackStock?: boolean | null
  stockQuantity?: number | null
}
