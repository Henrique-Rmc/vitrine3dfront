import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listExpenseProducts,
  createExpenseProduct,
  createExpenseBatch,
  type ExpenseProduct,
  type ExpenseBatchItemRequest,
} from '../../../services/pdvExpenseService'
import { generateOfflineId, fmtMoney } from '../../../services/pdvService'
import { queueExpenseBatch } from '../../../services/pdvOfflineStore'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CartItem {
  productId: number
  productName: string
  unit: string
  unitPrice: number
  quantity: number
}

type Step = 'items' | 'confirm'

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PdvNovaCompra() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('items')
  const [products, setProducts] = useState<ExpenseProduct[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [note, setNote] = useState('')
  const [batchDate, setBatchDate] = useState(new Date().toISOString().slice(0, 10))
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const [priceModal, setPriceModal] = useState<ExpenseProduct | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [creatingProduct, setCreatingProduct] = useState(false)
  const [createProductModal, setCreateProductModal] = useState(false)

  useEffect(() => {
    listExpenseProducts().then(setProducts).catch(() => {})
  }, [])

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  )

  const cartTotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  function addToCart(product: ExpenseProduct, unitPrice: number, quantity: number) {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === product.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], unitPrice, quantity: next[idx].quantity + quantity }
        return next
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          unitPrice,
          quantity,
        },
      ]
    })
    setPriceModal(null)
  }

  function updateCartItem(productId: number, field: 'unitPrice' | 'quantity', value: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, [field]: value } : i))
        .filter((i) => i.quantity > 0),
    )
  }

  function removeCartItem(productId: number) {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  function handleCreateProduct() {
    if (!search.trim()) return
    setCreateProductModal(true)
  }

  async function handleConfirmCreateProduct(name: string, unit: string) {
    setCreateProductModal(false)
    setCreatingProduct(true)
    try {
      const product = await createExpenseProduct({ name, unit })
      setProducts((prev) => [...prev, product])
      setPriceModal(product)
      setSearch('')
    } catch {
      // silent
    } finally {
      setCreatingProduct(false)
    }
  }

  async function handleSubmit() {
    if (cart.length === 0) return
    setSubmitting(true)
    setSubmitError('')

    const offlineId = generateOfflineId()
    const items: ExpenseBatchItemRequest[] = cart.map((i) => ({
      productName: i.productName,
      unit: i.unit,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
    }))
    const payload = {
      offlineId,
      batchDate: new Date(batchDate).toISOString(),
      note: note.trim() || undefined,
      items,
    }

    try {
      await createExpenseBatch(payload)
      navigate('/admin/pdv/gastos', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      if (msg?.includes('DUPLICATE_EXPENSE_BATCH')) {
        navigate('/admin/pdv/gastos', { replace: true })
        return
      }
      try {
        await queueExpenseBatch(payload)
        navigate('/admin/pdv/gastos', { replace: true })
      } catch {
        setSubmitError('Erro ao registrar. Tente novamente.')
        setSubmitting(false)
      }
    }
  }

  if (step === 'items') {
    return (
      <div className="flex flex-col md:flex-row h-full overflow-hidden">
        {/* Product panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
            <button
              onClick={() => navigate(-1)}
              className="text-ink-3 hover:text-ink transition-colors text-sm font-medium"
            >
              ← Cancelar
            </button>
            <span className="flex-1 text-center text-sm font-semibold text-ink">Nova Compra</span>
            <div className="w-16" />
          </div>

          {/* Search */}
          <div className="px-4 py-2 border-b border-border shrink-0">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full rounded-xl border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-cta/40"
            />
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
              {filtered.map((p) => {
                const inCart = cart.find((i) => i.productId === p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => setPriceModal(p)}
                    className="relative rounded-xl border border-border bg-surface p-3 text-left hover:border-cta/40 hover:bg-canvas active:scale-[0.97] transition-all"
                  >
                    {inCart && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-cta text-cta-fg text-[10px] font-bold flex items-center justify-center">
                        {inCart.quantity}
                      </span>
                    )}
                    <p className="text-sm font-medium text-ink leading-tight line-clamp-2">{p.name}</p>
                    <p className="text-xs text-ink-3 mt-1">{p.unit}</p>
                    {p.lowStock && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        Estoque baixo
                      </span>
                    )}
                  </button>
                )
              })}

              {/* Create product button */}
              {search.trim() && filtered.length === 0 && (
                <button
                  onClick={handleCreateProduct}
                  disabled={creatingProduct}
                  className="col-span-3 lg:col-span-4 rounded-xl border border-dashed border-cta/50 bg-cta/5 p-3 text-sm font-medium text-cta hover:bg-cta/10 transition-colors disabled:opacity-50"
                >
                  {creatingProduct ? 'Criando...' : `+ Criar produto "${search.trim()}"`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop cart */}
        <div className="hidden md:flex flex-col w-72 border-l border-border bg-surface">
          <CartPanel
            cart={cart}
            total={cartTotal}
            onUpdateItem={updateCartItem}
            onRemoveItem={removeCartItem}
            onNext={() => setStep('confirm')}
          />
        </div>

        {/* Mobile sticky footer */}
        <div className="md:hidden border-t border-border bg-surface px-4 py-3 shrink-0">
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="w-full flex items-center justify-between bg-cta text-cta-fg rounded-xl px-4 py-3"
          >
            <span className="text-sm font-semibold">
              {cartCount > 0 ? `${cartCount} ${cartCount === 1 ? 'item' : 'itens'}` : 'Carrinho vazio'}
            </span>
            <span className="text-sm font-bold">{fmtMoney(cartTotal)}</span>
          </button>
        </div>

        {/* Mobile drawer */}
        {cartDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setCartDrawerOpen(false)} />
            <div className="relative bg-surface rounded-t-2xl flex flex-col max-h-[85vh] overflow-hidden z-10">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <p className="font-semibold text-ink">Carrinho</p>
                <button onClick={() => setCartDrawerOpen(false)} className="text-ink-3 hover:text-ink">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <line x1={18} y1={6} x2={6} y2={18} /><line x1={6} y1={6} x2={18} y2={18} />
                  </svg>
                </button>
              </div>
              <CartPanel
                cart={cart}
                total={cartTotal}
                onUpdateItem={updateCartItem}
                onRemoveItem={removeCartItem}
                onNext={() => { setCartDrawerOpen(false); setStep('confirm') }}
              />
            </div>
          </div>
        )}

        {/* Price modal */}
        {priceModal && (
          <PriceEntryModal
            product={priceModal}
            onConfirm={(unitPrice, quantity) => addToCart(priceModal, unitPrice, quantity)}
            onClose={() => setPriceModal(null)}
          />
        )}

        {/* Create product modal */}
        {createProductModal && (
          <CreateProductModal
            initialName={search.trim()}
            onConfirm={handleConfirmCreateProduct}
            onClose={() => setCreateProductModal(false)}
          />
        )}
      </div>
    )
  }

  // ── Step: confirm ──────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setStep('items')}
          className="text-sm text-ink-3 hover:text-ink transition-colors"
        >
          ← Editar itens
        </button>
        <h1 className="text-xl font-bold text-ink flex-1">Confirmar compra</h1>
      </div>

      {/* Items summary */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="divide-y divide-border">
          {cart.map((item) => (
            <div key={item.productId} className="px-4 py-3 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink">{item.productName}</p>
                <p className="text-xs text-ink-3">
                  {item.quantity} {item.unit} × {fmtMoney(item.unitPrice)}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums text-ink shrink-0">
                {fmtMoney(item.unitPrice * item.quantity)}
              </p>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-canvas/50">
          <p className="text-sm font-semibold text-ink">Total</p>
          <p className="text-xl font-bold tabular-nums text-ink">{fmtMoney(cartTotal)}</p>
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs font-medium text-ink-3 mb-1">Data da compra</label>
        <input
          type="date"
          value={batchDate}
          onChange={(e) => setBatchDate(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cta/40"
        />
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-medium text-ink-3 mb-1">Observação (opcional)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex: Compra mensal de materiais"
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-cta/40"
        />
      </div>

      {submitError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3">
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || cart.length === 0}
        className="w-full py-4 rounded-2xl bg-cta text-cta-fg font-bold text-lg hover:opacity-90 disabled:opacity-50 active:scale-[0.99] transition-all"
      >
        {submitting ? 'Registrando...' : 'Registrar compra'}
      </button>
    </div>
  )
}

// ── Cart panel ────────────────────────────────────────────────────────────────

function CartPanel({
  cart,
  total,
  onUpdateItem,
  onRemoveItem,
  onNext,
}: {
  cart: CartItem[]
  total: number
  onUpdateItem: (id: number, field: 'unitPrice' | 'quantity', value: number) => void
  onRemoveItem: (id: number) => void
  onNext: () => void
}) {
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex items-center justify-center h-full p-6">
            <p className="text-sm text-ink-3 text-center">
              Selecione produtos para adicionar ao carrinho
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {cart.map((item) => (
              <div key={item.productId} className="px-3 py-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-ink leading-tight flex-1">{item.productName}</p>
                  <button
                    onClick={() => onRemoveItem(item.productId)}
                    className="text-ink-3 hover:text-red-500 transition-colors shrink-0 p-0.5"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                      <line x1={18} y1={6} x2={6} y2={18} /><line x1={6} y1={6} x2={18} y2={18} />
                    </svg>
                  </button>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="text-[10px] text-ink-3">Preço/un</label>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={item.unitPrice || ''}
                      onChange={(e) => onUpdateItem(item.productId, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-border bg-canvas px-2 py-1 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-cta/40"
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-[10px] text-ink-3">Qtd</label>
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => onUpdateItem(item.productId, 'quantity', item.quantity - 1)}
                        className="px-1.5 py-1 text-ink-2 hover:bg-canvas transition-colors text-sm font-bold"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center text-sm font-medium text-ink">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateItem(item.productId, 'quantity', item.quantity + 1)}
                        className="px-1.5 py-1 text-ink-2 hover:bg-canvas transition-colors text-sm font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-right text-ink-2 mt-1 tabular-nums">
                  = {fmtMoney(item.unitPrice * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border px-3 py-3 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-ink-3">Total</p>
          <p className="text-lg font-bold tabular-nums text-ink">{fmtMoney(total)}</p>
        </div>
        <button
          onClick={onNext}
          disabled={cart.length === 0}
          className="w-full py-3 rounded-xl bg-cta text-cta-fg font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
        >
          Confirmar →
        </button>
      </div>
    </>
  )
}

// ── Create product modal ──────────────────────────────────────────────────────

function CreateProductModal({
  initialName,
  onConfirm,
  onClose,
}: {
  initialName: string
  onConfirm: (name: string, unit: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initialName)
  const [unit, setUnit] = useState('un')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onConfirm(name.trim(), unit.trim() || 'un')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-2xl md:rounded-2xl bg-surface p-5 z-10">
        <h3 className="text-base font-bold text-ink mb-1">Novo produto de gasto</h3>
        <p className="text-xs text-ink-3 mb-4">Preencha os dados para cadastrar</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink-3 mb-1">Nome do produto</label>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Resina PLA, Papel A4..."
              className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cta/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-3 mb-1">Unidade</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {['un', 'kg', 'cx', 'lt', 'rolo', 'pct'].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                    unit === u ? 'bg-cta text-cta-fg border-cta' : 'border-border text-ink-2 hover:border-border-2'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Ou escreva a unidade..."
              className="w-full rounded-xl border border-border bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cta/40"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-ink-2 hover:bg-canvas transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-cta text-cta-fg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Criar produto
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Price entry modal ─────────────────────────────────────────────────────────

function PriceEntryModal({
  product,
  onConfirm,
  onClose,
}: {
  product: ExpenseProduct
  onConfirm: (unitPrice: number, quantity: number) => void
  onClose: () => void
}) {
  const [unitPrice, setUnitPrice] = useState('')
  const [quantity, setQuantity] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    const price = parseFloat(unitPrice)
    if (!price || price <= 0 || quantity <= 0) return
    onConfirm(price, quantity)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-2xl md:rounded-2xl bg-surface p-5 z-10">
        <h3 className="text-base font-bold text-ink mb-1">{product.name}</h3>
        <p className="text-xs text-ink-3 mb-4">Informe o preço desta compra</p>

        <form onSubmit={handleConfirm} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink-3 mb-1">
              Preço por {product.unit} (R$)
            </label>
            <input
              ref={inputRef}
              required
              type="number"
              min={0.01}
              step={0.01}
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cta/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-3 mb-1">
              Quantidade ({product.unit})
            </label>
            <div className="flex items-center border border-border rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-2.5 text-ink-2 hover:bg-canvas transition-colors text-base font-bold"
              >
                −
              </button>
              <span className="flex-1 text-center text-sm font-semibold text-ink">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="px-4 py-2.5 text-ink-2 hover:bg-canvas transition-colors text-base font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-ink-2 hover:bg-canvas transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-cta text-cta-fg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
