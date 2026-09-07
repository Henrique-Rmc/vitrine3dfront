import type { Product } from '../types'

export type StoreTemplateType = 'loja' | 'servicos'

export interface StoreTemplateProps {
  // Identidade da loja
  storeId: string | null
  storeName: string
  storeDescription: string | null
  whatsappNumber: string | null
  logoUrl: string | null
  cityName: string | null

  // Valores visuais já resolvidos (draft aplicado)
  coverImageUrl: string | null
  coverColor: string | null
  storeNameFont: string | null
  storeTheme: string | null

  // Produtos (usados pelo template Loja; ignorados pelo Serviços)
  products: Product[]
  featuredProducts: Product[]
  loading: boolean
  error: string | null
  hasMore: boolean
  isLoadingMore: boolean
  loadMore: () => void

  // Contexto de auth
  isOwner: boolean
  isAuthenticated: boolean
}
