import { useEffect, useState, useRef } from 'react'
import type { Product } from '../types'
import apiClient from '../services/apiClient'
import { listPublicProducts, listFeaturedProducts } from '../services/productService'

interface StoreUser {
  id: string
  storeName: string
  storeDescription: string
  whatsappNumber: string
  logoUrl: string
  coverImageUrl?: string | null
}

export interface StoreInfo {
  storeId: string | null
  storeName: string
  storeDescription: string
  whatsappNumber: string
  logoUrl: string
  coverImageUrl: string | null
  products: Product[]
  featuredProducts: Product[]
  loading: boolean
  error: string | null
  hasMore: boolean
  isLoadingMore: boolean
  loadMore: () => void
}

export function useStoreInfo(storeSlug: string): StoreInfo {
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState<string | null>(null)
  const [storeId, setStoreId]               = useState<string | null>(null)
  const [storeName, setStoreName]           = useState('')
  const [storeDescription, setStoreDescription] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [logoUrl, setLogoUrl]               = useState('')
  const [coverImageUrl, setCoverImageUrl]   = useState<string | null>(null)
  const [products, setProducts]             = useState<Product[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [hasMore, setHasMore]               = useState(false)
  const [isLoadingMore, setIsLoadingMore]   = useState(false)

  const storeIdRef  = useRef<string | null>(null)
  const nextPageRef = useRef(1)

  useEffect(() => {
    if (!storeSlug) return

    setLoading(true)
    setError(null)

    async function fetchStore() {
      const { data: storeUser } = await apiClient.get<StoreUser>(
        `/api/users/store/${storeSlug}`,
      )
      storeIdRef.current = storeUser.id

      const [featured, publicPage] = await Promise.all([
        listFeaturedProducts(storeUser.id),
        listPublicProducts(storeUser.id, 0, 15),
      ])

      nextPageRef.current = 1
      setStoreId(storeUser.id)
      setStoreName(storeUser.storeName)
      setStoreDescription(storeUser.storeDescription)
      setWhatsappNumber(storeUser.whatsappNumber)
      setLogoUrl(storeUser.logoUrl)
      setCoverImageUrl(storeUser.coverImageUrl ?? null)
      setProducts(publicPage.content)
      setFeaturedProducts(featured)
      setHasMore(!publicPage.last)
    }

    fetchStore()
      .catch((err) => {
        console.error('[useStoreInfo]', err)
        setError('Não foi possível carregar a loja. Verifique o endereço e tente novamente.')
      })
      .finally(() => setLoading(false))
  }, [storeSlug])

  function loadMore() {
    if (isLoadingMore || !storeIdRef.current) return
    setIsLoadingMore(true)
    listPublicProducts(storeIdRef.current, nextPageRef.current, 15)
      .then((page) => {
        setProducts((prev) => [...prev, ...page.content])
        setHasMore(!page.last)
        nextPageRef.current += 1
      })
      .catch(() => undefined)
      .finally(() => setIsLoadingMore(false))
  }

  return {
    storeId,
    storeName,
    storeDescription,
    whatsappNumber,
    logoUrl,
    coverImageUrl,
    products,
    featuredProducts,
    loading,
    error,
    hasMore,
    isLoadingMore,
    loadMore,
  }
}
