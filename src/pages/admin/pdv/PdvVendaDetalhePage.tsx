import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getSale,
  cancelSale,
  fmtMoney,
  fmtDateTime,
  PAYMENT_LABELS,
  type PdvSaleResponse,
} from '../../../services/pdvService'

export default function PdvVendaDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [sale, setSale] = useState<PdvSaleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getSale(id)
      .then(setSale)
      .catch(() => setError('Venda não encontrada.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleCancel() {
    if (!id) return
    setCancelling(true)
    try {
      const updated = await cancelSale(id)
      setSale(updated)
      setConfirmCancel(false)
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Erro ao cancelar.'
      setError(msg)
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-surface animate-pulse" />)}</div>
  }

  if (error || !sale) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-ink-2 text-sm">{error || 'Venda não encontrada.'}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-cta">Voltar</button>
      </div>
    )
  }

  const isCancelled = sale.status === 'CANCELLED'

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Detalhes da Venda</h1>
        {isCancelled && (
          <span className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold">
            Cancelada
          </span>
        )}
      </div>

      {/* Header info */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-2 text-sm">
        <Row label="Data" value={fmtDateTime(sale.saleDate)} />
        <Row label="Pagamento" value={PAYMENT_LABELS[sale.paymentMethod]} />
        {sale.customerName && <Row label="Cliente" value={sale.customerName} />}
        {sale.operatorName && <Row label="Operador" value={sale.operatorName} />}
        {sale.note && <Row label="Obs." value={sale.note} />}
      </div>

      {/* Items */}
      <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
        {sale.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink">{item.productName}</p>
              <p className="text-xs text-ink-2">{item.quantity}× {fmtMoney(item.unitPrice)}</p>
            </div>
            <p className="text-sm font-semibold text-ink tabular-nums">{fmtMoney(item.subtotal)}</p>
          </div>
        ))}

        {/* Totals */}
        <div className="px-4 py-3 space-y-1.5 bg-canvas">
          <div className="flex justify-between text-sm">
            <span className="text-ink-2">Total</span>
            <span className="font-bold text-ink tabular-nums">{fmtMoney(sale.totalAmount)}</span>
          </div>
          {sale.paymentMethod !== 'CREDIT' && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-ink-2">Pago</span>
                <span className="font-medium text-ink tabular-nums">{fmtMoney(sale.amountPaid)}</span>
              </div>
              {sale.changeAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-ink-2">Troco</span>
                  <span className="font-medium text-ink tabular-nums">{fmtMoney(sale.changeAmount)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {/* Cancel action */}
      {!isCancelled && (
        <>
          {confirmCancel ? (
            <div className="rounded-2xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 space-y-3">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                Confirma o cancelamento? O estoque não será restaurado automaticamente.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="flex-1 py-2 rounded-xl border border-border text-sm text-ink"
                >
                  Não
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {cancelling ? 'Cancelando...' : 'Sim, cancelar'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmCancel(true)}
              className="w-full py-2.5 rounded-xl border border-red-300 dark:border-red-700 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Cancelar venda
            </button>
          )}
        </>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-ink-2 shrink-0">{label}</span>
      <span className="text-ink font-medium text-right">{value}</span>
    </div>
  )
}
