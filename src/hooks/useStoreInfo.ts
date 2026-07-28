import { useEffect, useState, useRef } from 'react'
import type { Product } from '../types'
import apiClient from '../services/apiClient'
import { listPublicProducts, listFeaturedProducts } from '../services/productService'

// ── Dev mock — set to true to bypass the API and use fake data ───────────────
const DEV_MOCK = false

const MOCK_DATA: StoreInfo = {
  storeId: 'mock-store',
  storeName: 'Ateliê das Artes',
  storeDescription: 'Peças únicas feitas à mão com amor e dedicação. Encontre presentes especiais e decorações exclusivas para a sua casa.',
  whatsappNumber: '5511999990000',
  logoUrl: '',
  coverImageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
  coverColor: null,
  storeNameFont: null,
  cityName: 'São Paulo',
  products: [
    { id: 1, name: 'Vaso Artesanal Azul',   description: 'Cerâmica pintada à mão', imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80', isVisible: true, featured: true,  price: 8900,  storeId: 'mock-store', productTypeId: 1, productTypeLabel: 'Vasos' },
    { id: 2, name: 'Cesta de Palha Natural', description: 'Trançada manualmente',   imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=400&q=80', isVisible: true, featured: true,  price: 6500,  storeId: 'mock-store', productTypeId: 2, productTypeLabel: 'Cestas' },
    { id: 3, name: 'Quadro Abstrato',         description: 'Acrílico sobre tela',   imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&q=80', isVisible: true, featured: false, price: 19900, storeId: 'mock-store', productTypeId: 3, productTypeLabel: 'Quadros' },
    { id: 4, name: 'Luminária de Bambu',      description: 'Feita com bambu nativo', imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80', isVisible: true, featured: false, price: 12500, storeId: 'mock-store', productTypeId: 1, productTypeLabel: 'Vasos' },
    { id: 5, name: 'Porta-retratos Rústico',  description: 'Madeira reaproveitada', imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80', isVisible: true, featured: false, price: 4500,  storeId: 'mock-store', productTypeId: 3, productTypeLabel: 'Quadros' },
    { id: 6, name: 'Prato Decorativo',        description: 'Cerâmica rústica',       imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&q=80', isVisible: true, featured: false, price: 7800,  storeId: 'mock-store', productTypeId: 1, productTypeLabel: 'Vasos' },
  ],
  featuredProducts: [],
  loading: false,
  error: null,
  hasMore: false,
  isLoadingMore: false,
  loadMore: () => {},
}

interface StoreUser {
  id: string
  storeName: string
  storeDescription: string
  whatsappNumber: string
  logoUrl: string
  coverImageUrl?: string | null
  coverColor?: string | null
  storeNameFont?: string | null
  cityName?: string | null
}

export interface ThemePatch {
  storeNameFont?: string | null
  coverColor?: string | null
  coverImageUrl?: string | null
}

export interface StoreInfo {
  storeId: string | null
  storeName: string
  storeDescription: string
  whatsappNumber: string
  logoUrl: string
  coverImageUrl: string | null
  coverColor: string | null
  storeNameFont: string | null
  cityName: string | null
  products: Product[]
  featuredProducts: Product[]
  loading: boolean
  error: string | null
  hasMore: boolean
  isLoadingMore: boolean
  loadMore: () => void
  applyTheme: (patch: ThemePatch) => void
}

export function useStoreInfo(storeSlug: string): StoreInfo {
  if (DEV_MOCK) {
    MOCK_DATA.featuredProducts = MOCK_DATA.products.filter((p) => p.featured)
    return { ...MOCK_DATA, applyTheme: () => {} }
  }
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState<string | null>(null)
  const [storeId, setStoreId]               = useState<string | null>(null)
  const [storeName, setStoreName]           = useState('')
  const [storeDescription, setStoreDescription] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [logoUrl, setLogoUrl]               = useState('')
  const [coverImageUrl, setCoverImageUrl]   = useState<string | null>(null)
  const [coverColor, setCoverColor]         = useState<string | null>(null)
  const [storeNameFont, setStoreNameFont]   = useState<string | null>(null)
  const [cityName, setCityName]             = useState<string | null>(null)
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
      setCoverColor(storeUser.coverColor ?? null)
      setStoreNameFont(storeUser.storeNameFont ?? null)
      setCityName(storeUser.cityName ?? null)
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

  function applyTheme(patch: ThemePatch) {
    if ('storeNameFont' in patch) setStoreNameFont(patch.storeNameFont ?? null)
    if ('coverColor'    in patch) setCoverColor(patch.coverColor ?? null)
    if ('coverImageUrl' in patch) setCoverImageUrl(patch.coverImageUrl ?? null)
  }

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
    coverColor,
    storeNameFont,
    cityName,
    products,
    featuredProducts,
    loading,
    error,
    hasMore,
    isLoadingMore,
    loadMore,
    applyTheme,
  }
}
