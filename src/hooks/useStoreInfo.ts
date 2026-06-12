import { useEffect, useState } from 'react'
import type { Category } from '../types'

interface StoreInfo {
  storeName: string
  storeDescription: string
  whatsappNumber: string
  logoUrl: string
  categories: Category[]
  loading: boolean
}

// storeSlug is passed by the caller (from URL params) so future API calls can
// fetch the correct store: GET /api/stores/:storeSlug
export function useStoreInfo(storeSlug: string): StoreInfo {
  const [loading, setLoading] = useState(true)
  const [info, setInfo] = useState<Omit<StoreInfo, 'loading'>>({
    storeName: '',
    storeDescription: '',
    whatsappNumber: '',
    logoUrl: '',
    categories: [],
  })

  useEffect(() => {
    if (!storeSlug) return
    // TODO: replace with GET /api/stores/${storeSlug} and GET /api/categories?storeSlug=${storeSlug}
    setInfo({
      storeName: 'PrintLab 3D',
      storeDescription: 'Impressão 3D de alta qualidade em PLA, ABS e Resina. Action figures, props e peças técnicas sob encomenda.',
      whatsappNumber: '5511999998877',
      logoUrl: '',
      categories: [
        { id: 1, name: 'Action Figures', isGlobal: true, userId: 1 },
        { id: 2, name: 'Props', isGlobal: true, userId: 1 },
        { id: 3, name: 'Peças Técnicas', isGlobal: true, userId: 1 },
        { id: 4, name: 'Miniaturas', isGlobal: true, userId: 1 },
      ],
    })
    setLoading(false)
  }, [storeSlug])

  return { ...info, loading }
}
