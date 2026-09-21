import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  adjustStock,
  getProductCost,
  updateProductCost,
  getApiErrorMessage,
  fmtMoney,
  type PdvStockResponse,
  type PdvProductCostResponse,
} from '../../../services/pdvService'
import { listProducts } from '../../../services/productService'
import { useAuth } from '../../../context/AuthContext'
import type { Product } from '../../../types'

interface StockItem {
  product: Product
  stock: PdvStockResponse | null
}

type Tab = 'estoque' | 'custos'

// ProductResponse does not include trackStock/stockQuantity (backend limitation).
// This module-level cache survives component remounts (navigation away and back)
// and is the source of truth for stock state within the browser session.
const stockCache = new Map<number, PdvStockResponse>()
// Cost is private to the PDV and has no bulk endpoint, so it is fetched per product and kept for the session.
const costCache = new Map<number, PdvProductCostResponse>()

const COST_FETCH_CONCURRENCY = 6

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

function fmtPercent(n: number): string {
  return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

function marginTone(percent: number): string {
  if (percent < 0) return 'text-red-500'
  if (percent < 20) return 'text-amber-600 dark:text-amber-400'
  return 'text-emerald-600 dark:text-emerald-400'
}

export default function PdvEstoquePage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab = searchParams.get('aba') === 'custos' ? 'custos' : 'estoque'

  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [adjusting, setAdjusting] = useState<Product | null>(null)

  const [costs, setCosts] = useState<Map<number, PdvProductCostResponse>>(() => new Map(costCache))
  const [costErrors, setCostErrors] = useState(0)
  const [editingCost, setEditingCost] = useState<Product | null>(null)
  const [onlyMissing, setOnlyMissing] = useState(false)

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

  useEffect(() => {
    if (tab !== 'custos' || items.length === 0) return
    const pending = items.map((i) => i.product.id).filter((pid) => !costCache.has(pid))
    if (pending.length === 0) return

    let cancelled = false
    let failures = 0
    let cursor = 0

    async function worker() {
      while (!cancelled && cursor < pending.length) {
        const pid = pending[cursor++]
        try {
          const res = await getProductCost(pid)
          costCache.set(pid, res)
          if (!cancelled) setCosts((prev) => new Map(prev).set(pid, res))
        } catch {
          failures++
        }
      }
    }

    Promise.all(Array.from({ length: COST_FETCH_CONCURRENCY }, worker)).then(() => {
      if (!cancelled) setCostErrors(failures)
    })
    return () => { cancelled = true }
  }, [tab, items])

  function setTab(next: Tab) {
    setSearchParams(next === 'custos' ? { aba: 'custos' } : {}, { replace: true })
  }

  function handleAdjusted(updated: PdvStockResponse) {
    stockCache.set(updated.productId, updated)
    setItems((prev) => prev.map((i) =>
      i.product.id === updated.productId
        ? { ...i, stock: updated }
        : i,
    ))
    setAdjusting(null)
  }

  function handleCostSaved(updated: PdvProductCostResponse) {
    costCache.set(updated.productId, updated)
    setCosts((prev) => new Map(prev).set(updated.productId, updated))
    setEditingCost(null)
  }

  const bySearch = items.filter((i) =>
    i.product.name.toLowerCase().includes(search.toLowerCase()),
  )

  const loadedCosts = items.filter((i) => costs.has(i.product.id))
  const missingCount = loadedCosts.filter((i) => costs.get(i.product.id)!.costPrice == null).length
  const costsLoading = tab === 'custos' && loadedCosts.length < items.length && costErrors === 0

  const filtered = tab === 'custos' && onlyMissing
    ? bySearch.filter((i) => costs.get(i.product.id)?.costPrice == null)
    : bySearch

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-ink">Estoque</h1>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-surface border border-border">
        {([
          { key: 'estoque' as const, label: 'Quantidades' },
          { key: 'custos' as const, label: 'Custos e margem' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === key ? 'bg-cta text-cta-fg' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'custos' && (
        <div className="rounded-xl border border-border bg-surface px-4 py-3 space-y-2">
          <p className="text-xs text-ink-2 leading-relaxed">
            O custo fica visível apenas no PDV — nunca na vitrine. Ele é congelado em cada venda para calcular o lucro no Balanço.
          </p>
          {!loading && items.length > 0 && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-ink">
                {costsLoading ? (
                  <span className="text-ink-3">Carregando custos… {loadedCosts.length}/{items.length}</span>
                ) : missingCount > 0 ? (
                  <><span className="font-semibold text-amber-600 dark:text-amber-400">{missingCount}</span> de {items.length} sem custo cadastrado</>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Todos os produtos têm custo</span>
                )}
              </p>
              {missingCount > 0 && (
                <button
                  onClick={() => setOnlyMissing((v) => !v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    onlyMissing ? 'bg-cta text-cta-fg' : 'bg-canvas border border-border text-ink-2 hover:text-ink'
                  }`}
                >
                  Só sem custo
                </button>
              )}
            </div>
          )}
          {costErrors > 0 && (
            <p className="text-xs text-red-500">Não foi possível carregar o custo de {costErrors} produto(s).</p>
          )}
        </div>
      )}

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
          {search || onlyMissing ? 'Nenhum resultado.' : 'Nenhum produto cadastrado.'}
        </p>
      )}

      {!loading && !error && filtered.length > 0 && tab === 'estoque' && (
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

      {!loading && !error && filtered.length > 0 && tab === 'custos' && (
        <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
          {filtered.map(({ product }) => {
            const cost = costs.get(product.id)
            const hasCost = cost?.costPrice != null
            return (
              <div key={product.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{product.name}</p>
                  {cost ? (
                    <p className="text-xs text-ink-2 tabular-nums">
                      Venda {cost.price != null ? fmtMoney(cost.price) : '—'}
                      {' · '}
                      Custo {hasCost ? fmtMoney(cost.costPrice!) : <span className="text-amber-600 dark:text-amber-400">não definido</span>}
                    </p>
                  ) : (
                    <div className="h-3 w-32 mt-1 rounded bg-canvas animate-pulse" />
                  )}
                </div>
                <div className="text-right shrink-0 w-20">
                  {cost?.marginPercent != null ? (
                    <>
                      <p className={`text-sm font-bold tabular-nums ${marginTone(cost.marginPercent)}`}>
                        {fmtPercent(cost.marginPercent)}
                      </p>
                      <p className="text-[10px] text-ink-3 tabular-nums">{fmtMoney(cost.marginAmount ?? 0)}</p>
                    </>
                  ) : cost ? (
                    <p className="text-xs text-ink-3">—</p>
                  ) : null}
                </div>
                <button
                  onClick={() => setEditingCost(product)}
                  disabled={!cost}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${
                    cost && !hasCost
                      ? 'bg-cta text-cta-fg hover:opacity-90'
                      : 'border border-border text-ink hover:bg-canvas'
                  }`}
                >
                  {hasCost ? 'Editar' : 'Definir'}
                </button>
              </div>
            )
          })}
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

      {editingCost && costs.get(editingCost.id) && (
        <CostModal
          cost={costs.get(editingCost.id)!}
          onClose={() => setEditingCost(null)}
          onSaved={handleCostSaved}
        />
      )}
    </div>
  )
}

function CostModal({
  cost,
  onClose,
  onSaved,
}: {
  cost: PdvProductCostResponse
  onClose: () => void
  onSaved: (updated: PdvProductCostResponse) => void
}) {
  const [value, setValue] = useState(cost.costPrice != null ? String(cost.costPrice) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const parsed = parseFloat(value.replace(',', '.'))
  const valid = !isNaN(parsed) && parsed >= 0
  const price = cost.price
  const previewAmount = valid && price != null ? price - parsed : null
  const previewPercent = previewAmount != null && price ? (previewAmount / price) * 100 : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) { setError('Informe um custo válido.'); return }
    setSaving(true)
    setError('')
    try {
      onSaved(await updateProductCost(cost.productId, parsed))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erro ao salvar custo.'))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-ink">Custo do produto</h2>
          <p className="text-xs text-ink-2 mt-0.5">{cost.productName}</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-ink-2">Custo unitário (R$)</label>
          <input
            type="text" inputMode="decimal" value={value} autoFocus
            onChange={(e) => setValue(e.target.value)}
            placeholder="0,00"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-canvas text-ink text-lg font-semibold tabular-nums focus:outline-none focus:border-cta"
          />
          <p className="text-xs text-ink-3">Material, energia e tudo que é gasto para produzir uma unidade.</p>
        </div>

        <div className="rounded-xl bg-canvas border border-border px-3 py-2.5 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-2">Preço de venda</span>
            <span className="font-medium text-ink tabular-nums">{price != null ? fmtMoney(price) : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-2">Margem</span>
            {previewAmount != null && previewPercent != null ? (
              <span className={`font-semibold tabular-nums ${marginTone(previewPercent)}`}>
                {fmtMoney(previewAmount)} · {fmtPercent(previewPercent)}
              </span>
            ) : (
              <span className="text-ink-3">{price == null ? 'Produto sem preço' : '—'}</span>
            )}
          </div>
          {previewAmount != null && previewAmount < 0 && (
            <p className="text-xs text-red-500">O custo é maior que o preço de venda — cada venda dá prejuízo.</p>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-ink">Cancelar</button>
          <button type="submit" disabled={saving || !valid} className="flex-1 py-2.5 rounded-xl bg-cta text-cta-fg text-sm font-semibold disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
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
      setError(getApiErrorMessage(err, 'Erro ao ajustar.'))
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
