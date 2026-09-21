import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getExpenseBatch, type ExpenseBatchResponse } from '../../../services/pdvExpenseService'
import { fmtMoney } from '../../../services/pdvService'

export default function PdvCompraDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [batch, setBatch] = useState<ExpenseBatchResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getExpenseBatch(id)
      .then(setBatch)
      .catch(() => setError('Compra não encontrada.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-3 animate-pulse">
        <div className="h-6 w-32 rounded bg-surface" />
        <div className="h-32 rounded-2xl bg-surface" />
        <div className="h-48 rounded-2xl bg-surface" />
      </div>
    )
  }

  if (error || !batch) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="text-ink-2 text-sm">{error || 'Erro ao carregar compra.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-3 text-sm text-cta font-medium hover:opacity-80 transition-opacity"
          >
            ← Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-ink-3 hover:text-ink mb-2 transition-colors"
        >
          ← Voltar
        </button>
        <h1 className="text-xl font-bold text-ink">
          {batch.note ?? 'Compra de insumos'}
        </h1>
        <p className="text-sm text-ink-3">
          {new Date(batch.batchDate).toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Items */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-ink">Itens</p>
        </div>
        <div className="divide-y divide-border">
          {batch.items.map((item) => (
            <div key={item.id} className="px-4 py-3 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink">{item.productName}</p>
                <p className="text-xs text-ink-3">
                  {item.quantity} {item.unit} × {fmtMoney(item.unitPrice)}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums text-ink shrink-0">
                {fmtMoney(item.subtotal)}
              </p>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-canvas/50">
          <p className="text-sm font-semibold text-ink">Total</p>
          <p className="text-lg font-bold tabular-nums text-red-500 dark:text-red-400">
            {fmtMoney(batch.totalAmount)}
          </p>
        </div>
      </div>
    </div>
  )
}
