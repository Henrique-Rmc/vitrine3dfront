import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { listProducts, patchFeatured, deleteProduct, reorderProducts } from '../../services/productService'
import type { Product } from '../../types'
import ProductList from '../../components/ProductList'

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

  // Reorder mode state
  const [reorderMode, setReorderMode]         = useState(false)
  const [pendingOrder, setPendingOrder]       = useState<Product[]>([])
  const [isSavingOrder, setIsSavingOrder]     = useState(false)
  const [reorderError, setReorderError]       = useState<string | null>(null)

  const nextPageRef = useRef(1)
  const featuredIds = products.filter((p) => p.featured).map((p) => p.id)

  const fetchProducts = useCallback(async () => {
    if (!storeId) { setIsLoading(false); return }
    setIsLoading(true)
    setLoadError(null)
    try {
      const page = await listProducts(storeId, 0, 50)
      nextPageRef.current = 1
      setProducts(page.content)
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
      setProducts((prev) => [...prev, ...page.content])
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
    setPendingOrder(newProducts)
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

  function enterReorderMode() {
    setPendingOrder([...products])
    setReorderMode(true)
    setReorderError(null)
  }

  function cancelReorder() {
    setReorderMode(false)
    setPendingOrder([])
    setReorderError(null)
  }

  async function saveReorder() {
    setIsSavingOrder(true)
    setReorderError(null)
    try {
      await reorderProducts(pendingOrder.map((p) => p.id))
      setProducts(pendingOrder)
      setReorderMode(false)
      setPendingOrder([])
    } catch {
      setReorderError('Erro ao salvar a ordem. Tente novamente.')
    } finally {
      setIsSavingOrder(false)
    }
  }

  function moveProduct(id: number, direction: 'up' | 'down') {
    setPendingOrder((prev) => {
      const idx = prev.findIndex((p) => p.id === id)
      if (idx < 0) return prev
      const next = [...prev]
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= next.length) return prev
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next
    })
  }

  const displayProducts = reorderMode ? pendingOrder : products

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

        <div className="flex items-center gap-2 shrink-0">
          {reorderMode ? (
            <>
              <button
                onClick={cancelReorder}
                disabled={isSavingOrder}
                className="px-4 py-2.5 rounded-lg border border-[#e8e2d8] text-[#6b5d52] hover:bg-[#f4f1eb] text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveReorder}
                disabled={isSavingOrder}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#c9922c] hover:bg-[#b8821e] text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {isSavingOrder ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Salvando…
                  </>
                ) : (
                  'Salvar Ordem'
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={enterReorderMode}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#e8e2d8] text-[#6b5d52] hover:text-[#1c1813] hover:border-[#d4cec5] hover:bg-[#f4f1eb] text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                </svg>
                Ordenar
              </button>
              <button
                onClick={() => navigate('/admin/products/new')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1c1813] hover:bg-[#2c2620] text-white text-sm font-semibold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Adicionar Produto
              </button>
            </>
          )}
        </div>
      </div>

      {reorderMode && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <svg className="w-4 h-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
          </svg>
          Use as setas ↑↓ para reposicionar os produtos. Clique em <strong className="ml-1">Salvar Ordem</strong> para confirmar.
        </div>
      )}

      {loadError && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span>{loadError}</span>
          <button onClick={fetchProducts} className="shrink-0 text-xs text-red-600 hover:text-red-800 underline transition-colors">
            Tentar novamente
          </button>
        </div>
      )}

      {reorderError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {reorderError}
        </div>
      )}

      {!reorderMode && (
        <p className="mb-3 text-[1.2rem] text-[#9c8e84]">
          <span className="text-[#c9922c]">★</span>{' '}
          {featuredIds.length}/3 produto{featuredIds.length !== 1 ? 's' : ''} em destaque
        </p>
      )}

      <ProductList
        products={displayProducts}
        onEdit={(product) => navigate(`/admin/products/edit/${product.id}`)}
        onDelete={handleDelete}
        deletingId={deletingId}
        featuredIds={featuredIds}
        onToggleFeatured={handleToggleFeatured}
        onReorder={handleReorder}
        reorderMode={reorderMode}
        onMoveUp={(id) => moveProduct(id, 'up')}
        onMoveDown={(id) => moveProduct(id, 'down')}
      />

      {hasMore && !reorderMode && (
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
