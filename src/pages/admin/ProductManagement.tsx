import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { listProducts, deleteProduct } from '../../services/productService'
import type { Product } from '../../types'
import ProductList from '../../components/ProductList'

// ── localStorage helpers ──────────────────────────────────────────────────────

const featuredKey = (id: number) => `featured_${id}`
const orderKey    = (id: number) => `order_${id}`

function readFeaturedIds(storeId: number): number[] {
  try { return JSON.parse(localStorage.getItem(featuredKey(storeId)) ?? '[]') } catch { return [] }
}
function saveFeaturedIds(storeId: number, ids: number[]) {
  localStorage.setItem(featuredKey(storeId), JSON.stringify(ids))
}
function readProductOrder(storeId: number): number[] {
  try { return JSON.parse(localStorage.getItem(orderKey(storeId)) ?? '[]') } catch { return [] }
}
function saveProductOrder(storeId: number, ids: number[]) {
  localStorage.setItem(orderKey(storeId), JSON.stringify(ids))
}
function applyOrder(products: Product[], order: number[]): Product[] {
  if (order.length === 0) return products
  return [...products].sort((a, b) => {
    const ai = order.indexOf(a.id)
    const bi = order.indexOf(b.id)
    if (ai === -1 && bi === -1) return b.id - a.id   // new products go to end
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="h-6 w-28 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="h-10 w-38 bg-zinc-800 rounded-lg animate-pulse" />
      </div>
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 px-4 py-3 ${i < 4 ? 'border-b border-zinc-800/60' : ''}`}
          >
            <div className="w-12 h-12 rounded-lg bg-zinc-800 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-800 rounded animate-pulse w-48 max-w-full" />
              <div className="h-3 bg-zinc-800 rounded animate-pulse w-24" />
            </div>
            <div className="flex gap-1 shrink-0">
              <div className="w-8 h-8 bg-zinc-800 rounded-lg animate-pulse" />
              <div className="w-8 h-8 bg-zinc-800 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
        <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      </div>
      <div>
        <h2 className="text-zinc-100 font-semibold text-base mb-1">Você ainda não tem produtos cadastrados</h2>
        <p className="text-sm text-zinc-500 max-w-xs">
          Adicione seu primeiro produto para começar a receber pedidos de orçamento pelos clientes.
        </p>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Cadastrar primeiro produto
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductManagement() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const storeId = user?.id ?? 0

  const [products, setProducts]     = useState<Product[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [loadError, setLoadError]   = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [featuredIds, setFeaturedIds] = useState<number[]>(() =>
    storeId ? readFeaturedIds(storeId) : [],
  )

  // ── Load products ─────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    if (!storeId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setLoadError(null)
    try {
      const data = await listProducts(storeId)
      setProducts(applyOrder(data, readProductOrder(storeId)))
    } catch {
      setLoadError('Não foi possível carregar os produtos. Verifique a conexão com o backend.')
    } finally {
      setIsLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // ── Featured toggle ───────────────────────────────────────────────────────

  function handleToggleFeatured(productId: number) {
    setFeaturedIds((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : prev.length < 3 ? [...prev, productId] : prev
      saveFeaturedIds(storeId, next)
      return next
    })
  }

  // ── Reorder ───────────────────────────────────────────────────────────────

  function handleReorder(newProducts: Product[]) {
    setProducts(newProducts)
    saveProductOrder(storeId, newProducts.map((p) => p.id))
  }

  // ── Delete ────────────────────────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) return <LoadingSkeleton />

  if (!loadError && products.length === 0) {
    return <EmptyState onAdd={() => navigate('/admin/products/new')} />
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Meus Produtos</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {products.length} produto{products.length !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/products/new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Adicionar Produto
        </button>
      </div>

      {/* Error / retry */}
      {loadError && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-red-950/60 border border-red-800/60 px-4 py-3 text-sm text-red-300">
          <span>{loadError}</span>
          <button
            onClick={fetchProducts}
            className="shrink-0 text-xs text-red-400 hover:text-red-200 underline transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {featuredIds.length > 0 && (
        <p className="mb-3 text-xs text-zinc-500">
          <span className="text-yellow-500">★</span> {featuredIds.length}/3 produto{featuredIds.length !== 1 ? 's' : ''} em destaque
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
    </div>
  )
}
