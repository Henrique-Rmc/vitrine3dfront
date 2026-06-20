import { useEffect, useState, useRef, useMemo } from 'react'
import type { Category, Material, Product } from '../types'
import apiClient from '../services/apiClient'
import { listPublicProducts, listFeaturedProducts } from '../services/productService'
import { listCategories } from '../services/categoryService'
import { listMaterials } from '../services/materialService'

interface StoreUser {
  id: string
  storeName: string
  storeDescription: string
  whatsappNumber: string
  logoUrl: string
}

export interface StoreInfo {
  storeId: string | null
  storeName: string
  storeDescription: string
  whatsappNumber: string
  logoUrl: string
  /** Only categories that have at least one visible product — updates as more pages load */
  categories: Category[]
  /** Only materials that have at least one visible product — updates as more pages load */
  materials: Material[]
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
  const [rawCategories, setRawCategories]   = useState<Category[]>([])
  const [rawMaterials, setRawMaterials]     = useState<Material[]>([])
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

      const [featured, publicPage, cats, mats] = await Promise.all([
        listFeaturedProducts(storeUser.id),
        listPublicProducts(storeUser.id, 0, 15),
        listCategories(storeUser.id),
        listMaterials(storeUser.id),
      ])

      nextPageRef.current = 1
      setStoreId(storeUser.id)
      setStoreName(storeUser.storeName)
      setStoreDescription(storeUser.storeDescription)
      setWhatsappNumber(storeUser.whatsappNumber)
      setLogoUrl(storeUser.logoUrl)
      setRawCategories(cats)
      setRawMaterials(mats)
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

  // Reactive filters: show only categories/materials that have ≥1 visible product
  // among all products loaded so far (grows as the user loads more pages).
  const allLoadedProducts = useMemo(
    () => [...products, ...featuredProducts],
    [products, featuredProducts],
  )

  const usedCategoryIds = useMemo(
    () => new Set(allLoadedProducts.filter((p) => p.isVisible).map((p) => p.categoryId)),
    [allLoadedProducts],
  )

  const usedMaterialIds = useMemo(
    () => new Set(allLoadedProducts.filter((p) => p.isVisible && p.materialId != null).map((p) => p.materialId!)),
    [allLoadedProducts],
  )

  const categories = useMemo(
    () => rawCategories.filter((c) => usedCategoryIds.has(c.id)),
    [rawCategories, usedCategoryIds],
  )

  const materials = useMemo(
    () => rawMaterials.filter((m) => usedMaterialIds.has(m.id)),
    [rawMaterials, usedMaterialIds],
  )

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
    categories,
    materials,
    products,
    featuredProducts,
    loading,
    error,
    hasMore,
    isLoadingMore,
    loadMore,
  }
}
