import { useEffect, useState } from 'react'
import type { Category, Product } from '../types'
import apiClient from '../services/apiClient'
import { listPublicProducts } from '../services/productService'
import { listCategories } from '../services/categoryService'

interface StoreUser {
  id: number
  storeName: string
  storeDescription: string
  whatsappNumber: string
  logoUrl: string
}

export interface StoreInfo {
  storeId: number | null
  storeName: string
  storeDescription: string
  whatsappNumber: string
  logoUrl: string
  categories: Category[]
  products: Product[]
  loading: boolean
  error: string | null
}

export function useStoreInfo(storeSlug: string): StoreInfo {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<Omit<StoreInfo, 'loading' | 'error'>>({
    storeId: null,
    storeName: '',
    storeDescription: '',
    whatsappNumber: '',
    logoUrl: '',
    categories: [],
    products: [],
  })

  useEffect(() => {
    if (!storeSlug) return

    setLoading(true)
    setError(null)

    async function fetchStore() {
      // 1 – Resolve store by slug
      const { data: storeUser } = await apiClient.get<StoreUser>(
        `/api/users/store/${storeSlug}`,
      )

      // 2 – Fetch products and categories in parallel
      const [products, categories] = await Promise.all([
        listPublicProducts(storeUser.id),
        listCategories(),
      ])

      // Only show categories that have at least one visible product in this store
      const usedCategoryIds = new Set(
        products.filter((p) => p.isVisible).map((p) => p.categoryId),
      )
      const filteredCategories = categories.filter((c) => usedCategoryIds.has(c.id))

      setInfo({
        storeId: storeUser.id,
        storeName: storeUser.storeName,
        storeDescription: storeUser.storeDescription,
        whatsappNumber: storeUser.whatsappNumber,
        logoUrl: storeUser.logoUrl,
        categories: filteredCategories,
        products,
      })
    }

    fetchStore()
      .catch((err) => {
        console.error('[useStoreInfo]', err)
        setError('Não foi possível carregar a loja. Verifique o endereço e tente novamente.')
      })
      .finally(() => setLoading(false))
  }, [storeSlug])

  return { ...info, loading, error }
}
