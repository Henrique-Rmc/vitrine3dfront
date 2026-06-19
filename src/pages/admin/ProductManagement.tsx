import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { listProducts, patchFeatured, deleteProduct } from '../../services/productService'
import type { Product } from '../../types'
import ProductList from '../../components/ProductList'

const orderKey = (id: string) => `order_${id}`
function readProductOrder(storeId: string): number[] {
  try { return JSON.parse(localStorage.getItem(orderKey(storeId)) ?? '[]') } catch { return [] }
}
function saveProductOrder(storeId: string, ids: number[]) {
  localStorage.setItem(orderKey(storeId), JSON.stringify(ids))
}
function applyOrder(products: Product[], order: number[]): Product[] {
  if (order.length === 0) return products
  return [...products].sort((a, b) => {
    const ai = order.indexOf(a.id), bi = order.indexOf(b.id)
    if (ai === -1 && bi === -1) return b.id - a.id
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

function LoadingSkeleton() {
  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="h-6 w-28 skeleton rounded" />
          <div className="h-4 w-20 skeleton rounded" />
        </div>
        <div className="h-10 w-40 skeleton rounded-lg" />
      </div>
      <div className="rounded-xl border border-[#e8e2d8] overflow-hidden bg-white shadow-sm">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex items-center gap-4 px-4 py-3 ${i < 4 ? 'border-b border-[#f0ece5]' : ''}`}>
            <div className="w-12 h-12 skeleton rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 skeleton rounded w-48 max-w-full" />
              <div className="h-3 skeleton rounded w-24" />
            </div>
            <div className="flex gap-1 shrink-0">
              <div className="w-8 h-8 skeleton rounded-lg" />
              <div className="w-8 h-8 skeleton rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
      <div className="w-16 h-16 rounded-2xl bg-[#f4f1eb] border border-[#e8e2d8] flex items-center justify-center">
        <svg className="w-8 h-8 text-[#d4cec5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      </div>
      <div>
        <h2 className="text-[#1c1813] font-semibold text-base mb-1">Nenhum produto cadastrado ainda</h2>
        <p className="text-sm text-[#9c8e84] max-w-xs">
          Adicione seu primeiro produto para que os clientes possam conhecer seu trabalho.
        </p>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1c1813] hover:bg-[#2c2620] text-white text-sm font-semibold transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Cadastrar primeiro produto
      </button>
    </div>
  )
}

export default function ProductManagement() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const storeId = user?.id ?? ''

  const [products, setProducts]           = useState<Product[]>([])
  const [isLoading, setIsLoading]         = useState(true)
  const [loadError, setLoadError]         = useState<string | null>(null)
  const [deletingId, setDeletingId]       = useState<number | null>(null)
  const [hasMore, setHasMore]             = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const nextPageRef = useRef(1)
  const featuredIds = products.filter((p) => p.featured).map((p) => p.id)

  const fetchProducts = useCallback(async () => {
    if (!storeId) { setIsLoading(false); return }
    setIsLoading(true)
    setLoadError(null)
    try {
      const page = await listProducts(storeId, 0, 50)
      nextPageRef.current = 1
      setProducts(applyOrder(page.content, readProductOrder(storeId)))
      setHasMore(!page.last)
    } catch {
      setLoadError('Não foi possível carregar os produtos. Verifique a conexão com o backend.')
    } finally {
      setIsLoading(false)
    }
  }, [storeId])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  async function loadMoreProducts() {
    if (isLoadingMore || !storeId) return
    setIsLoadingMore(true)
    try {
      const page = await listProducts(storeId, nextPageRef.current, 50)
      nextPageRef.current += 1
      setProducts((prev) => applyOrder([...prev, ...page.content], readProductOrder(storeId)))
      setHasMore(!page.last)
    } catch {
      setLoadError('Erro ao carregar mais produtos.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  async function handleToggleFeatured(productId: number) {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, featured: !p.featured } : p)))
    try {
      const updated = await patchFeatured(productId)
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, featured: updated.featured } : p)))
    } catch (err: unknown) {
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, featured: !p.featured } : p)))
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 400) {
        setLoadError('Máximo de 3 produtos em destaque atingido.')
        setTimeout(() => setLoadError(null), 4000)
      }
    }
  }

  function handleReorder(newProducts: Product[]) {
    setProducts(newProducts)
    saveProductOrder(storeId, newProducts.map((p) => p.id))
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Excluir este produto? Esta ação não pode ser desfeita.')) return
    setDeletingId(id)
    try {
      await deleteProduct(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch {
      setLoadError('Erro ao excluir o produto. Tente novamente.')
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) return <LoadingSkeleton />
  if (!loadError && products.length === 0) return <EmptyState onAdd={() => navigate('/admin/products/new')} />

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1c1813]">Meus Produtos</h1>
          <p className="text-sm text-[#9c8e84] mt-0.5">
            {products.length} produto{products.length !== 1 ? 's' : ''}{hasMore ? '+' : ''}
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/products/new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1c1813] hover:bg-[#2c2620] text-white text-sm font-semibold transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Adicionar Produto
        </button>
      </div>

      {loadError && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span>{loadError}</span>
          <button onClick={fetchProducts} className="shrink-0 text-xs text-red-600 hover:text-red-800 underline transition-colors">
            Tentar novamente
          </button>
        </div>
      )}

      {featuredIds.length > 0 && (
        <p className="mb-3 text-xs text-[#9c8e84]">
          <span className="text-[#c9922c]">★</span>{' '}
          {featuredIds.length}/3 produto{featuredIds.length !== 1 ? 's' : ''} em destaque
        </p>
      )}

      <ProductList
        products={products}
        onEdit={(product) => navigate(`/admin/products/edit/${product.id}`)}
        onDelete={handleDelete}
        deletingId={deletingId}
        featuredIds={featuredIds}
        onToggleFeatured={handleToggleFeatured}
        onReorder={handleReorder}
      />

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMoreProducts}
            disabled={isLoadingMore}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#e8e2d8] text-[#6b5d52] hover:text-[#1c1813] hover:border-[#d4cec5] disabled:opacity-60 text-sm font-medium transition-colors bg-white shadow-sm"
          >
            {isLoadingMore ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-[#d4cec5] border-t-[#9c8e84] animate-spin" />
                Carregando…
              </>
            ) : (
              'Carregar mais'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
