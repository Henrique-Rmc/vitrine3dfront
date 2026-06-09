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

export function useStoreInfo(): StoreInfo {
  const [loading, setLoading] = useState(true)
  const [info, setInfo] = useState<Omit<StoreInfo, 'loading'>>({
    storeName: '',
    storeDescription: '',
    whatsappNumber: '',
    logoUrl: '',
    categories: [],
  })

  useEffect(() => {
    // TODO: replace with GET /api/store and GET /api/categories
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
  }, [])

  return { ...info, loading }
}
