import { useState, useEffect, useCallback } from 'react'
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
import { useAuth } from '../../../context/AuthContext'

type Step = 'items' | 'payment' | 'confirm'

interface CartItem extends PdvSaleItemRequest {
  _key: string
}

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'PIX', 'CARD', 'CREDIT']

export default function PdvNovaVenda() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [step, setStep] = useState<Step>('items')
  const [cart, setCart] = useState<CartItem[]>([])
  const [customers, setCustomers] = useState<PdvCustomerResponse[]>([])
  const [products, setProducts] = useState<{ id: number; name: string; price: number | null }[]>([])
  const [search, setSearch] = useState('')
  const [customName, setCustomName] = useState('')
  const [customPrice, setCustomPrice] = useState('')

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [amountPaid, setAmountPaid] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [creditNote, setCreditNote] = useState('')
  const [creditDueDate, setCreditDueDate] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const total = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const paid = parseFloat(amountPaid.replace(',', '.')) || 0
  const change = Math.max(paid - total, 0)

  useEffect(() => {
    if (user?.id) {
      listProducts(user.id, 0, 100)
        .then((r) => setProducts(r.content.map((p) => ({ id: p.id, name: p.name, price: p.price }))))
        .catch(() => {})
      listCustomers().then(setCustomers).catch(() => {})
    }
  }, [user?.id])

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  )

  function addProduct(p: { id: number; name: string; price: number | null }) {
    const existing = cart.find((c) => c.productId === p.id)
    if (existing) {
      setCart((prev) =>
        prev.map((c) => (c._key === existing._key ? { ...c, quantity: c.quantity + 1 } : c)),
      )
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
  }

  function changeQty(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => (c._key === key ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0),
    )
  }

  const handleSubmit = useCallback(async () => {
    if (cart.length === 0) return
    setError('')
    setSaving(true)
    try {
      const offlineId = generateOfflineId()
      const sale = await createSale({
        offlineId,
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
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Erro ao registrar venda.'
      setError(msg)
      setSaving(false)
    }
  }, [cart, paymentMethod, paid, selectedCustomerId, note, creditNote, creditDueDate, navigate])

  if (step === 'items') {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold text-ink mb-3">Nova Venda</h1>

          {/* Product search */}
          <input
            type="search"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-cta"
          />

          {search && filteredProducts.length > 0 && (
            <div className="mt-2 rounded-xl border border-border bg-surface max-h-48 overflow-y-auto divide-y divide-border">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { addProduct(p); setSearch('') }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-canvas transition-colors"
                >
                  <span className="text-sm text-ink">{p.name}</span>
                  <span className="text-sm font-medium text-ink-2">{p.price != null ? fmtMoney(p.price) : '—'}</span>
                </button>
              ))}
            </div>
          )}

          {/* Custom item */}
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              placeholder="Item avulso"
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
              className="w-24 px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-cta"
            />
            <button
              onClick={addCustomItem}
              className="px-3 py-2 rounded-xl bg-cta text-cta-fg text-sm font-medium"
            >
              +
            </button>
          </div>
        </div>

        {/* Cart */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <p className="text-center text-ink-2 text-sm py-8">Adicione itens acima</p>
          ) : (
            cart.map((item) => (
              <div key={item._key} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{item.productName}</p>
                  <p className="text-xs text-ink-2">{fmtMoney(item.unitPrice)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => changeQty(item._key, -1)} className="w-7 h-7 rounded-full border border-border text-ink flex items-center justify-center text-base leading-none">−</button>
                  <span className="text-sm font-semibold text-ink w-5 text-center">{item.quantity}</span>
                  <button onClick={() => changeQty(item._key, 1)} className="w-7 h-7 rounded-full border border-border text-ink flex items-center justify-center text-base leading-none">+</button>
                </div>
                <p className="text-sm font-semibold text-ink w-20 text-right tabular-nums">
                  {fmtMoney(item.unitPrice * item.quantity)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 bg-surface">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-ink-2">Total</span>
            <span className="text-xl font-bold text-ink tabular-nums">{fmtMoney(total)}</span>
          </div>
          <button
            disabled={cart.length === 0}
            onClick={() => setStep('payment')}
            className="w-full py-3 rounded-xl bg-cta text-cta-fg font-semibold text-sm disabled:opacity-40 transition-opacity"
          >
            Ir para pagamento
          </button>
        </div>
      </div>
    )
  }

  if (step === 'payment') {
    return (
      <div className="p-4 space-y-5 max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-ink">Pagamento</h1>
          <button onClick={() => setStep('items')} className="text-sm text-ink-2 hover:text-ink">← Voltar</button>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 flex justify-between items-center">
          <span className="text-sm text-ink-2">Total</span>
          <span className="text-2xl font-bold text-ink tabular-nums">{fmtMoney(total)}</span>
        </div>

        {/* Payment method */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-ink-2 uppercase tracking-wide">Forma de pagamento</p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                  paymentMethod === m
                    ? 'bg-cta border-cta text-cta-fg'
                    : 'bg-surface border-border text-ink hover:border-border-2'
                }`}
              >
                {PAYMENT_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        {/* Amount paid (not for CREDIT) */}
        {paymentMethod !== 'CREDIT' && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink-2 uppercase tracking-wide">Valor recebido</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder={total.toFixed(2).replace('.', ',')}
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-border bg-canvas text-ink text-lg font-semibold focus:outline-none focus:border-cta"
            />
            {paid > 0 && paid >= total && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                Troco: {fmtMoney(change)}
              </p>
            )}
          </div>
        )}

        {/* Customer (required for CREDIT) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-ink-2 uppercase tracking-wide">
            Cliente {paymentMethod === 'CREDIT' ? '(obrigatório)' : '(opcional)'}
          </label>
          <select
            value={selectedCustomerId ?? ''}
            onChange={(e) => setSelectedCustomerId(e.target.value || null)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-canvas text-sm text-ink focus:outline-none focus:border-cta"
          >
            <option value="">— Venda avulsa —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Fiado extra fields */}
        {paymentMethod === 'CREDIT' && (
          <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold text-ink-2 uppercase tracking-wide">Detalhes do fiado</p>
            <div className="space-y-1">
              <label className="text-xs text-ink-2">Vencimento (opcional)</label>
              <input
                type="date"
                value={creditDueDate}
                onChange={(e) => setCreditDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink focus:outline-none focus:border-cta"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-ink-2">Observação</label>
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

        {/* Note */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-ink-2 uppercase tracking-wide">Observação (opcional)</label>
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
          onClick={() => setStep('confirm')}
          disabled={paymentMethod === 'CREDIT' && !selectedCustomerId}
          className="w-full py-3 rounded-xl bg-cta text-cta-fg font-semibold text-sm disabled:opacity-40 transition-opacity"
        >
          Revisar venda
        </button>
      </div>
    )
  }

  // Step: confirm
  const customer = customers.find((c) => c.id === selectedCustomerId)
  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-ink">Confirmar</h1>
        <button onClick={() => setStep('payment')} className="text-sm text-ink-2 hover:text-ink">← Voltar</button>
      </div>

      <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
        {cart.map((item) => (
          <div key={item._key} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink">{item.productName}</p>
              <p className="text-xs text-ink-2">{item.quantity}× {fmtMoney(item.unitPrice)}</p>
            </div>
            <p className="text-sm font-semibold text-ink tabular-nums">{fmtMoney(item.unitPrice * item.quantity)}</p>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3 bg-canvas">
          <span className="text-sm font-bold text-ink">Total</span>
          <span className="text-lg font-bold text-ink tabular-nums">{fmtMoney(total)}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 space-y-2 text-sm">
        <Row label="Forma" value={PAYMENT_LABELS[paymentMethod]} />
        {paymentMethod !== 'CREDIT' && paid > 0 && (
          <>
            <Row label="Recebido" value={fmtMoney(paid)} />
            <Row label="Troco" value={fmtMoney(change)} />
          </>
        )}
        {customer && <Row label="Cliente" value={customer.name} />}
        {note && <Row label="Obs." value={note} />}
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-cta text-cta-fg font-bold text-base disabled:opacity-50 transition-opacity"
      >
        {saving ? 'Registrando...' : 'Finalizar venda'}
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-2">{label}</span>
      <span className="text-ink font-medium">{value}</span>
    </div>
  )
}
