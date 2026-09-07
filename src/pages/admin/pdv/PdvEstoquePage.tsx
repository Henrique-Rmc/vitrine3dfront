import { useEffect, useState } from 'react'
import { adjustStock, fmtMoney, type PdvStockResponse } from '../../../services/pdvService'
import { listProducts } from '../../../services/productService'
import { useAuth } from '../../../context/AuthContext'
import type { Product } from '../../../types'

interface StockItem {
  product: Product
  stock: PdvStockResponse | null
}

// ProductResponse does not include trackStock/stockQuantity (backend limitation).
// This module-level cache survives component remounts (navigation away and back)
// and is the source of truth for stock state within the browser session.
const stockCache = new Map<number, PdvStockResponse>()

function resolveStock(p: Product): PdvStockResponse | null {
  if (stockCache.has(p.id)) return stockCache.get(p.id)!
  if (p.trackStock != null) {
    return {
      productId: p.id,
      productName: p.name,
      trackStock: p.trackStock ?? false,
      stockQuantity: p.stockQuantity ?? 0,
    }
  }
  return null
}

export default function PdvEstoquePage() {
  const { user } = useAuth()
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [adjusting, setAdjusting] = useState<Product | null>(null)

  useEffect(() => {
    if (!user?.id) return
    listProducts(user.id, 0, 200)
      .then((r) => {
        setItems(r.content.map((p) => ({
          product: p,
          stock: resolveStock(p),
        })))
      })
      .catch(() => setError('Erro ao carregar produtos.'))
      .finally(() => setLoading(false))
  }, [user?.id])

  function handleAdjusted(updated: PdvStockResponse) {
    stockCache.set(updated.productId, updated)
    setItems((prev) => prev.map((i) =>
      i.product.id === updated.productId
        ? { ...i, stock: updated }
        : i,
    ))
    setAdjusting(null)
  }

  const filtered = items.filter((i) =>
    i.product.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-ink">Estoque</h1>

      <input
        type="search" placeholder="Buscar produto..." value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-cta"
      />

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-surface animate-pulse" />)}
        </div>
      )}

      {!loading && error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-center text-ink-2 text-sm py-8">
          {search ? 'Nenhum resultado.' : 'Nenhum produto cadastrado.'}
        </p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
          {filtered.map(({ product, stock }) => (
            <div key={product.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{product.name}</p>
                <p className="text-xs text-ink-2">{product.price != null ? fmtMoney(product.price) : '—'}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                {stock?.trackStock ? (
                  <span className={`text-sm font-semibold tabular-nums ${
                    (stock.stockQuantity ?? 0) <= 0 ? 'text-red-500' : 'text-ink'
                  }`}>
                    {stock.stockQuantity ?? 0} un.
                  </span>
                ) : (
                  <span className="text-xs text-ink-3">Sem controle</span>
                )}
                <button
                  onClick={() => setAdjusting(product)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs text-ink hover:bg-canvas transition-colors"
                >
                  Ajustar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adjusting && (
        <StockAdjustModal
          product={adjusting}
          current={items.find((i) => i.product.id === adjusting.id)?.stock ?? null}
          onClose={() => setAdjusting(null)}
          onSaved={handleAdjusted}
        />
      )}
    </div>
  )
}

function StockAdjustModal({
  product,
  current,
  onClose,
  onSaved,
}: {
  product: Product
  current: PdvStockResponse | null
  onClose: () => void
  onSaved: (updated: PdvStockResponse) => void
}) {
  const [delta, setDelta] = useState('')
  const [trackStock, setTrackStock] = useState(current?.trackStock ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const d = parseInt(delta, 10)
    if (isNaN(d)) { setError('Delta inválido.'); return }
    setSaving(true)
    setError('')
    try {
      const res = await adjustStock(product.id, { quantityDelta: d, trackStock })
      onSaved(res)
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao ajustar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-ink">Ajustar Estoque</h2>
          <p className="text-xs text-ink-2 mt-0.5">{product.name}</p>
        </div>

        {current?.trackStock && (
          <p className="text-sm text-ink-2">Atual: <span className="font-semibold text-ink">{current.stockQuantity} un.</span></p>
        )}

        <div className="space-y-1">
          <label className="text-xs text-ink-2">Delta (ex.: +10, -5)</label>
          <input
            type="number" value={delta} onChange={(e) => setDelta(e.target.value)} autoFocus
            placeholder="0"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-canvas text-ink text-lg font-semibold focus:outline-none focus:border-cta"
          />
          <p className="text-xs text-ink-3">Use positivo para entrada, negativo para retirada</p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox" checked={trackStock}
            onChange={(e) => setTrackStock(e.target.checked)}
            className="w-4 h-4 rounded accent-cta"
          />
          <span className="text-sm text-ink">Controlar estoque deste produto</span>
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-ink">Cancelar</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-cta text-cta-fg text-sm font-semibold disabled:opacity-50">
            {saving ? 'Salvando...' : 'Aplicar'}
          </button>
        </div>
      </form>
    </div>
  )
}
