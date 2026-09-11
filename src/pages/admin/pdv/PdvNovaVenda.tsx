import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createSale,
  listCustomers,
  addCredit,
  generateOfflineId,
  fmtMoney,
  PAYMENT_LABELS,
  type PdvCustomerResponse,
  type PdvSaleItemRequest,
  type PaymentMethod,
} from '../../../services/pdvService'
import { listProducts } from '../../../services/productService'
import { listProductTypes, type ProductType } from '../../../services/productTypeService'
import { useAuth } from '../../../context/AuthContext'
import { useNetworkStatus } from '../../../hooks/useNetworkStatus'
import {
  queueSale,
  cacheProducts,
  getCachedProducts,
  cacheCustomers,
  getCachedCustomers,
} from '../../../services/pdvOfflineStore'

type Step = 'items' | 'payment' | 'confirm'

interface CartItem extends PdvSaleItemRequest {
  _key: string
}

interface CachedProduct {
  id: number
  name: string
  price: number | null
  productTypeId?: number | null
}

// PIX first — matches Brazilian payment reality
const PAYMENT_METHODS: PaymentMethod[] = ['PIX', 'CASH', 'CARD', 'CREDIT']

// ── Sub-components ────────────────────────────────────────────────────────────

function StepBreadcrumb({
  step,
  onGoToItems,
  onGoToPayment,
}: {
  step: Step
  onGoToItems?: () => void
  onGoToPayment?: () => void
}) {
  const STEPS: { key: Step; label: string }[] = [
    { key: 'items', label: 'Itens' },
    { key: 'payment', label: 'Pagamento' },
    { key: 'confirm', label: 'Confirmar' },
  ]
  const currentIdx = STEPS.findIndex((s) => s.key === step)

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((s, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        const handler = done ? (i === 0 ? onGoToItems : onGoToPayment) : undefined
        return (
          <div key={s.key} className="flex items-center gap-1">
            {i > 0 && <span className="text-ink-4 text-xs">›</span>}
            <button
              type="button"
              disabled={!handler}
              onClick={handler}
              className={`text-xs font-medium transition-colors ${
                active
                  ? 'text-cta font-bold'
                  : done && handler
                  ? 'text-ink-2 hover:text-ink underline underline-offset-2 cursor-pointer'
                  : done
                  ? 'text-ink-3'
                  : 'text-ink-4'
              }`}
            >
              {done && <span className="mr-0.5">✓</span>}
              {s.label}
            </button>
          </div>
        )
      })}
    </div>
  )
}

// Controlled numeric keypad for cash entry — digits enter as cents (e.g. pressing 1,2,3 → R$1,23)
function NumericKeypad({
  valueCents,
  totalCents,
  onChange,
}: {
  valueCents: number
  totalCents: number
  onChange: (cents: number) => void
}) {
  const displayValue = (valueCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '←']

  function press(key: string) {
    if (key === '←') {
      onChange(Math.floor(valueCents / 10))
    } else if (key === '00') {
      onChange(valueCents * 100)
    } else {
      onChange(valueCents * 10 + parseInt(key))
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-canvas px-4 py-4 text-center">
        <p className="text-xs text-ink-3 mb-1">Valor recebido</p>
        <p className="text-4xl font-bold tabular-nums text-ink tracking-tight">{displayValue}</p>
      </div>

      <button
        type="button"
        onClick={() => onChange(totalCents)}
        className="w-full py-2.5 rounded-xl border border-cta text-cta text-sm font-semibold hover:bg-cta/5 transition-colors"
      >
        Valor exato — {fmtMoney(totalCents / 100)}
      </button>

      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            className="min-h-14 rounded-xl bg-surface border border-border text-xl font-bold text-ink flex items-center justify-center active:bg-cta/10 transition-colors select-none"
          >
            {k === '←' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 6H8l-6 6 6 6h14V6z" />
                <line x1={17} y1={10} x2={13} y2={14} />
                <line x1={13} y1={10} x2={17} y2={14} />
              </svg>
            ) : k}
          </button>
        ))}
      </div>
    </div>
  )
}

// Fuzzy customer search — replaces the native <select>
function CustomerSearch({
  customers,
  selectedId,
  onSelect,
}: {
  customers: PdvCustomerResponse[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = customers.find((c) => c.id === selectedId)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = query.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          (c.phone ?? '').includes(query),
      )
    : customers.slice(0, 8)

  return (
    <div ref={ref} className="relative">
      {selected ? (
        <div className="flex items-center justify-between rounded-xl border border-border bg-canvas px-3 py-2.5">
          <div>
            <p className="text-sm font-medium text-ink">{selected.name}</p>
            {selected.phone && <p className="text-xs text-ink-3">{selected.phone}</p>}
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="ml-2 text-xs text-ink-3 hover:text-ink p-1"
          >
            ✕
          </button>
        </div>
      ) : (
        <input
          type="text"
          placeholder="Buscar cliente por nome ou telefone..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-canvas text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-cta"
        />
      )}

      {!selected && open && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 rounded-xl border border-border bg-surface shadow-lg max-h-48 overflow-y-auto divide-y divide-border">
          <button
            type="button"
            onClick={() => { onSelect(null); setOpen(false) }}
            className="w-full px-3 py-2.5 text-left text-sm text-ink-3 hover:bg-canvas transition-colors"
          >
            — Venda avulsa —
          </button>
          {filtered.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-ink-4">Nenhum cliente encontrado</p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onSelect(c.id); setQuery(''); setOpen(false) }}
                className="w-full px-3 py-2.5 text-left hover:bg-canvas transition-colors"
              >
                <p className="text-sm font-medium text-ink">{c.name}</p>
                {c.phone && <p className="text-xs text-ink-3">{c.phone}</p>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function PaymentMethodIcon({ method }: { method: PaymentMethod }) {
  if (method === 'PIX') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
    </svg>
  )
  if (method === 'CASH') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <rect x={2} y={6} width={20} height={12} rx={2} />
      <circle cx={12} cy={12} r={3} />
    </svg>
  )
  if (method === 'CARD') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <rect x={2} y={5} width={20} height={14} rx={2} />
      <line x1={2} y1={10} x2={22} y2={10} />
    </svg>
  )
  // CREDIT / Fiado
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PdvNovaVenda() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isOnline = useNetworkStatus()

  // Data
  const [step, setStep] = useState<Step>('items')
  const [cart, setCart] = useState<CartItem[]>([])
  const [customers, setCustomers] = useState<PdvCustomerResponse[]>([])
  const [products, setProducts] = useState<CachedProduct[]>([])
  const [productTypes, setProductTypes] = useState<ProductType[]>([])

  // Items step state
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customPrice, setCustomPrice] = useState('')

  // Payment step state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX')
  const [amountPaidCents, setAmountPaidCents] = useState(0)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [creditNote, setCreditNote] = useState('')
  const [creditDueDate, setCreditDueDate] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Derived
  const total = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const totalCents = Math.round(total * 100)
  const paid = paymentMethod === 'CASH' ? amountPaidCents / 100 : total
  const change = Math.max((amountPaidCents / 100) - total, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  // Load data
  useEffect(() => {
    if (!user?.id) return
    const storeId = user.id

    listProducts(storeId, 0, 200)
      .then(async (r) => {
        const mapped: CachedProduct[] = r.content.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price ?? null,
          productTypeId: (p as { productTypeId?: number | null }).productTypeId ?? null,
        }))
        setProducts(mapped)
        await cacheProducts(storeId, mapped).catch(() => {})
      })
      .catch(async () => {
        const cached = await getCachedProducts(storeId).catch(() => null)
        if (cached) setProducts(cached as CachedProduct[])
      })

    listCustomers()
      .then(async (cs) => {
        setCustomers(cs)
        await cacheCustomers(cs).catch(() => {})
      })
      .catch(async () => {
        const cached = await getCachedCustomers().catch(() => null)
        if (cached) setCustomers(cached)
      })

    listProductTypes(storeId)
      .then(setProductTypes)
      .catch(() => {})
  }, [user?.id])

  // Filtered product list
  const filteredProducts = products.filter((p) => {
    if (search) return p.name.toLowerCase().includes(search.toLowerCase())
    if (selectedTypeId != null) return p.productTypeId === selectedTypeId
    return true
  })

  // Cart operations
  function addProduct(p: CachedProduct) {
    const existing = cart.find((c) => c.productId === p.id)
    if (existing) {
      setCart((prev) => prev.map((c) => c._key === existing._key ? { ...c, quantity: c.quantity + 1 } : c))
    } else {
      setCart((prev) => [
        ...prev,
        { _key: generateOfflineId(), productId: p.id, productName: p.name, unitPrice: p.price ?? 0, quantity: 1 },
      ])
    }
  }

  function addCustomItem() {
    const price = parseFloat(customPrice.replace(',', '.'))
    if (!customName.trim() || isNaN(price) || price < 0) return
    setCart((prev) => [
      ...prev,
      { _key: generateOfflineId(), productId: null, productName: customName.trim(), unitPrice: price, quantity: 1 },
    ])
    setCustomName('')
    setCustomPrice('')
    setShowCustomForm(false)
  }

  function changeQty(key: string, delta: number) {
    setCart((prev) =>
      prev.map((c) => c._key === key ? { ...c, quantity: c.quantity + delta } : c).filter((c) => c.quantity > 0),
    )
  }

  const handleSubmit = useCallback(async () => {
    if (cart.length === 0) return
    setError('')
    setSaving(true)

    if (!isOnline) {
      if (paymentMethod === 'CREDIT') {
        setError('Vendas a prazo requerem conexão. Escolha outro método.')
        setSaving(false)
        return
      }
      try {
        await queueSale({
          offlineId: generateOfflineId(),
          paymentMethod,
          amountPaid: paid,
          saleDate: new Date().toISOString(),
          items: cart.map(({ _key: _, ...item }) => item),
          customerId: selectedCustomerId ?? undefined,
          note: note.trim() || undefined,
        })
        navigate('/admin/pdv', { replace: true })
      } catch {
        setError('Erro ao salvar venda localmente.')
        setSaving(false)
      }
      return
    }

    try {
      const sale = await createSale({
        offlineId: generateOfflineId(),
        paymentMethod,
        amountPaid: paymentMethod === 'CREDIT' ? 0 : paid,
        saleDate: new Date().toISOString(),
        items: cart.map(({ _key: _, ...item }) => item),
        customerId: selectedCustomerId ?? undefined,
        note: note.trim() || undefined,
      })

      if (paymentMethod === 'CREDIT' && selectedCustomerId) {
        await addCredit(selectedCustomerId, {
          originSaleId: sale.id,
          totalDue: sale.totalAmount,
          dueDate: creditDueDate ? new Date(creditDueDate).toISOString() : undefined,
          note: creditNote.trim() || undefined,
        })
      }

      navigate(`/admin/pdv/vendas/${sale.id}`, { replace: true })
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao registrar venda.'
      setError(msg)
      setSaving(false)
    }
  }, [cart, paymentMethod, paid, selectedCustomerId, note, creditNote, creditDueDate, navigate, isOnline])

  // ── Step: items ───────────────────────────────────────────────────────────
  if (step === 'items') {
    return (
      <div className="flex flex-col md:flex-row h-full">

        {/* Product panel */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* Category pills + search toggle */}
          <div className="border-b border-border bg-surface shrink-0">
            <div className="flex items-center gap-2 px-3 pt-3">
              <div className="flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                <div className="flex gap-1.5 pb-3">
                  <button
                    onClick={() => { setSelectedTypeId(null); setSearch('') }}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      selectedTypeId === null && !search ? 'bg-cta text-cta-fg' : 'bg-canvas border border-border text-ink-2 hover:text-ink'
                    }`}
                  >
                    Todos
                  </button>
                  {productTypes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setSelectedTypeId(t.id); setSearch('') }}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        selectedTypeId === t.id ? 'bg-cta text-cta-fg' : 'bg-canvas border border-border text-ink-2 hover:text-ink'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => { setSearchOpen((o) => !o); if (searchOpen) setSearch('') }}
                className={`shrink-0 mb-3 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  searchOpen ? 'bg-cta text-cta-fg' : 'text-ink-2 hover:bg-canvas border border-border'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <circle cx={11} cy={11} r={8} />
                  <line x1={21} y1={21} x2={16.65} y2={16.65} />
                </svg>
              </button>
            </div>

            {searchOpen && (
              <div className="px-3 pb-3">
                <input
                  autoFocus
                  type="search"
                  placeholder="Buscar produto..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelectedTypeId(null) }}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-cta"
                />
              </div>
            )}
          </div>

          {/* Product tile grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-1">
                <p className="text-sm text-ink-3">Nenhum produto</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredProducts.map((p) => {
                  const qty = cart.find((c) => c.productId === p.id)?.quantity ?? 0
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProduct(p)}
                      className={`relative rounded-xl border p-3 text-left flex flex-col gap-1 transition-all active:scale-[0.96] hover:border-cta/50 select-none ${
                        qty > 0 ? 'border-cta bg-cta/5' : 'border-border bg-surface'
                      }`}
                    >
                      {qty > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-cta text-cta-fg text-[10px] font-bold flex items-center justify-center">
                          {qty}
                        </span>
                      )}
                      <p className="text-sm font-semibold text-ink line-clamp-2 leading-snug">{p.name}</p>
                      <p className="text-xs font-bold text-ink-2">{p.price != null ? fmtMoney(p.price) : '—'}</p>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Custom item */}
            {!showCustomForm ? (
              <button
                type="button"
                onClick={() => setShowCustomForm(true)}
                className="mt-3 w-full py-2.5 rounded-xl border border-dashed border-border text-xs font-medium text-ink-3 hover:text-ink hover:border-border-2 transition-colors"
              >
                + Item avulso
              </button>
            ) : (
              <div className="mt-3 rounded-xl border border-border bg-surface p-3 space-y-2">
                <p className="text-xs font-semibold text-ink-2">Item avulso</p>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Nome do item"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-cta"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="R$"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-20 px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-cta"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowCustomForm(false); setCustomName(''); setCustomPrice('') }}
                    className="flex-1 py-2 rounded-xl border border-border text-sm text-ink-2 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={addCustomItem}
                    className="flex-1 py-2 rounded-xl bg-cta text-cta-fg text-sm font-semibold"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop cart panel — always visible */}
        <div className="hidden md:flex flex-col w-72 shrink-0 border-l border-border bg-surface">
          <div className="px-4 py-4 border-b border-border shrink-0 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Carrinho</h2>
            {cartCount > 0 && (
              <span className="text-xs text-ink-3">{cartCount} {cartCount === 1 ? 'item' : 'itens'}</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-1">
                <p className="text-sm text-ink-3 text-center">Toque nos produtos para adicionar</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item._key} className="flex items-center gap-2 rounded-xl border border-border bg-canvas px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink truncate">{item.productName}</p>
                    <p className="text-[10px] text-ink-3">{fmtMoney(item.unitPrice)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => changeQty(item._key, -1)}
                      className="w-6 h-6 rounded-full border border-border text-ink flex items-center justify-center text-sm leading-none hover:bg-surface transition-colors"
                    >
                      −
                    </button>
                    <span className="text-xs font-bold text-ink w-4 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => changeQty(item._key, 1)}
                      className="w-6 h-6 rounded-full border border-border text-ink flex items-center justify-center text-sm leading-none hover:bg-surface transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs font-bold text-ink tabular-nums w-16 text-right">
                    {fmtMoney(item.unitPrice * item.quantity)}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border p-4 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-2 font-medium">Total</span>
              <span className="text-2xl font-bold text-ink tabular-nums">{fmtMoney(total)}</span>
            </div>
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => setStep('payment')}
              className="w-full py-4 rounded-xl bg-cta text-cta-fg font-bold text-base disabled:opacity-40 transition-opacity"
            >
              Ir para pagamento
            </button>
          </div>
        </div>

        {/* Mobile sticky cart bar */}
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-20 bg-surface/95 backdrop-blur-sm border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={() => cart.length > 0 && setCartDrawerOpen(true)}
            disabled={cart.length === 0}
            className="w-full flex items-center justify-between rounded-xl bg-canvas border border-border px-4 py-3 disabled:opacity-40 active:bg-surface transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${cartCount > 0 ? 'bg-cta text-cta-fg' : 'bg-surface-2 text-ink-3'}`}>
                {cartCount}
              </span>
              <span className="text-sm text-ink-2 font-medium">{cartCount === 0 ? 'Carrinho vazio' : 'Ver carrinho'}</span>
            </div>
            <span className="text-lg font-bold text-ink tabular-nums">{fmtMoney(total)}</span>
          </button>
        </div>

        {/* Mobile cart drawer */}
        {cartDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setCartDrawerOpen(false)} />
            <div className="relative bg-surface rounded-t-2xl border-t border-border max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
                <h2 className="font-bold text-ink">Carrinho</h2>
                <button
                  type="button"
                  onClick={() => setCartDrawerOpen(false)}
                  className="text-ink-3 hover:text-ink text-xl leading-none p-1"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {cart.map((item) => (
                  <div key={item._key} className="flex items-center gap-3 rounded-xl border border-border bg-canvas px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{item.productName}</p>
                      <p className="text-xs text-ink-3">{fmtMoney(item.unitPrice)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => changeQty(item._key, -1)} className="w-8 h-8 rounded-full border border-border text-ink flex items-center justify-center">−</button>
                      <span className="text-sm font-bold text-ink w-5 text-center">{item.quantity}</span>
                      <button type="button" onClick={() => changeQty(item._key, 1)} className="w-8 h-8 rounded-full border border-border text-ink flex items-center justify-center">+</button>
                    </div>
                    <p className="text-sm font-bold text-ink tabular-nums w-20 text-right">{fmtMoney(item.unitPrice * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border p-4 shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-2">Total</span>
                  <span className="text-2xl font-bold text-ink tabular-nums">{fmtMoney(total)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setCartDrawerOpen(false); setStep('payment') }}
                  className="w-full py-4 rounded-xl bg-cta text-cta-fg font-bold text-base"
                >
                  Ir para pagamento
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Step: payment ─────────────────────────────────────────────────────────
  if (step === 'payment') {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border bg-surface flex items-center justify-between">
          <StepBreadcrumb step="payment" onGoToItems={() => setStep('items')} />
          <button type="button" onClick={() => setStep('items')} className="text-xs text-ink-3 hover:text-ink">
            ← Voltar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 max-w-md mx-auto w-full">
          {/* Total display */}
          <div className="text-center pt-2">
            <p className="text-xs text-ink-3 mb-1">Total da venda</p>
            <p className="text-5xl font-bold tabular-nums text-ink tracking-tight">{fmtMoney(total)}</p>
          </div>

          {/* Payment method buttons */}
          <div className="grid grid-cols-4 gap-2">
            {PAYMENT_METHODS.map((m) => {
              const isFiado = m === 'CREDIT'
              const disabled = isFiado && !selectedCustomerId
              return (
                <button
                  key={m}
                  type="button"
                  disabled={disabled}
                  onClick={() => setPaymentMethod(m)}
                  title={disabled ? 'Selecione um cliente primeiro' : undefined}
                  className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border text-xs font-semibold transition-all ${
                    paymentMethod === m
                      ? 'bg-cta border-cta text-cta-fg shadow-sm'
                      : disabled
                      ? 'bg-surface border-border text-ink-4 opacity-40 cursor-not-allowed'
                      : 'bg-surface border-border text-ink-2 hover:border-border-2 hover:text-ink'
                  }`}
                >
                  <PaymentMethodIcon method={m} />
                  {PAYMENT_LABELS[m]}
                </button>
              )
            })}
          </div>

          {/* Customer search — shown for all methods */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-ink-2 uppercase tracking-wide">
              Cliente{' '}
              {paymentMethod === 'CREDIT'
                ? <span className="text-red-500 font-bold">*</span>
                : <span className="font-normal normal-case text-ink-3">(opcional)</span>}
            </p>
            <CustomerSearch
              customers={customers}
              selectedId={selectedCustomerId}
              onSelect={setSelectedCustomerId}
            />
          </div>

          {/* Numeric keypad — only for cash */}
          {paymentMethod === 'CASH' && (
            <NumericKeypad
              valueCents={amountPaidCents}
              totalCents={totalCents}
              onChange={setAmountPaidCents}
            />
          )}

          {/* Troco */}
          {paymentMethod === 'CASH' && amountPaidCents > 0 && amountPaidCents >= totalCents && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-1">Troco</p>
              <p className="text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{fmtMoney(change)}</p>
            </div>
          )}

          {/* Offline + credit warning */}
          {!isOnline && paymentMethod === 'CREDIT' && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 rounded-xl px-3 py-2.5">
              Fiado requer conexão. Escolha outro método ou conecte-se primeiro.
            </p>
          )}

          {/* Fiado details */}
          {paymentMethod === 'CREDIT' && (
            <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold text-ink-2">Detalhes do fiado</p>
              <div className="space-y-1">
                <label className="text-xs text-ink-3">Vencimento (opcional)</label>
                <input
                  type="date"
                  value={creditDueDate}
                  onChange={(e) => setCreditDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink focus:outline-none focus:border-cta"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-ink-3">Observação</label>
                <input
                  type="text"
                  value={creditNote}
                  onChange={(e) => setCreditNote(e.target.value)}
                  placeholder="Ex.: combinado para pagar na sexta"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink focus:outline-none focus:border-cta"
                />
              </div>
            </div>
          )}

          {/* Sale note */}
          <div className="space-y-1">
            <label className="text-xs text-ink-3">Observação (opcional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="Anotação sobre a venda"
              className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink focus:outline-none focus:border-cta"
            />
          </div>

          <button
            type="button"
            onClick={() => setStep('confirm')}
            disabled={paymentMethod === 'CREDIT' && !selectedCustomerId}
            className="w-full py-4 rounded-xl bg-cta text-cta-fg font-bold text-base disabled:opacity-40 transition-opacity"
          >
            Revisar venda
          </button>
        </div>
      </div>
    )
  }

  // ── Step: confirm ─────────────────────────────────────────────────────────
  const customer = customers.find((c) => c.id === selectedCustomerId)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border bg-surface flex items-center justify-between">
        <StepBreadcrumb
          step="confirm"
          onGoToItems={() => setStep('items')}
          onGoToPayment={() => setStep('payment')}
        />
        <button type="button" onClick={() => setStep('payment')} className="text-xs text-ink-3 hover:text-ink">
          ← Voltar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-md mx-auto w-full">
        {/* Items */}
        <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
          {cart.map((item) => (
            <div key={item._key} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">{item.productName}</p>
                <p className="text-xs text-ink-3">{item.quantity}× {fmtMoney(item.unitPrice)}</p>
              </div>
              <p className="text-sm font-semibold text-ink tabular-nums">{fmtMoney(item.unitPrice * item.quantity)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-4 bg-canvas">
            <span className="text-base font-bold text-ink">Total</span>
            <span className="text-2xl font-bold text-ink tabular-nums">{fmtMoney(total)}</span>
          </div>
        </div>

        {/* Payment summary */}
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-2 text-sm">
          <Row label="Pagamento" value={PAYMENT_LABELS[paymentMethod]} />
          {paymentMethod === 'CASH' && amountPaidCents > 0 && (
            <>
              <Row label="Recebido" value={fmtMoney(amountPaidCents / 100)} />
              <Row label="Troco" value={fmtMoney(change)} />
            </>
          )}
          {customer && <Row label="Cliente" value={customer.name} />}
          {note && <Row label="Obs." value={note} />}
        </div>

        {/* Edit shortcuts */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep('items')}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm text-ink-2 font-medium hover:text-ink transition-colors"
          >
            Editar itens
          </button>
          <button
            type="button"
            onClick={() => setStep('payment')}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm text-ink-2 font-medium hover:text-ink transition-colors"
          >
            Editar pagamento
          </button>
        </div>

        {error && <p className="text-sm text-red-500 text-center rounded-xl bg-red-50 dark:bg-red-950 px-3 py-2">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-4 rounded-xl bg-cta text-cta-fg font-bold text-lg disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Registrando...' : 'Finalizar venda'}
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-3">{label}</span>
      <span className="text-ink font-medium">{value}</span>
    </div>
  )
}
