import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getExpenseBatchSummary,
  listExpenseBatches,
  listRecurringAlerts,
  payRecurring,
  type ExpenseBatchResponse,
  type RecurringExpenseResponse,
} from '../../../services/pdvExpenseService'
import { fmtMoney } from '../../../services/pdvService'

function startOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function PdvGastosPage() {
  const navigate = useNavigate()
  const [totalSpent, setTotalSpent] = useState<number | null>(null)
  const [recentBatches, setRecentBatches] = useState<ExpenseBatchResponse[]>([])
  const [alerts, setAlerts] = useState<RecurringExpenseResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState<string | null>(null)

  useEffect(() => {
    const from = startOfMonth()
    const to = today()
    Promise.all([
      getExpenseBatchSummary({ from, to }),
      listExpenseBatches({ from, to, size: 5 }),
      listRecurringAlerts(),
    ])
      .then(([summary, batches, alertList]) => {
        setTotalSpent(summary.totalSpent)
        setRecentBatches(batches.content)
        setAlerts(alertList)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handlePay(id: string) {
    setPayingId(id)
    try {
      await payRecurring(id)
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    } catch {
      // silently fail — user can retry
    } finally {
      setPayingId(null)
    }
  }

  const dateLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink capitalize">{dateLabel}</h1>
        <p className="text-sm text-ink-3">Gastos operacionais</p>
      </div>

      {/* Recurring alerts */}
      {alerts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Contas a vencer
          </p>
          {alerts.map((a) => (
            <div key={a.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{a.name}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {a.daysUntilDue < 0
                    ? `Vencida há ${Math.abs(a.daysUntilDue)} dias`
                    : a.daysUntilDue === 0
                    ? 'Vence hoje'
                    : `Vence em ${a.daysUntilDue} dias`}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums text-ink shrink-0">
                {fmtMoney(a.amount)}
              </p>
              <button
                onClick={() => handlePay(a.id)}
                disabled={payingId === a.id}
                className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {payingId === a.id ? '...' : 'Pagar'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Monthly spend summary */}
      {loading ? (
        <div className="h-24 rounded-2xl bg-surface animate-pulse" />
      ) : (
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-1">
            Gasto no mês
          </p>
          <p className="text-4xl font-bold tabular-nums text-red-600 dark:text-red-400">
            {fmtMoney(totalSpent ?? 0)}
          </p>
        </div>
      )}

      {/* Primary CTA */}
      <button
        onClick={() => navigate('/admin/pdv/gastos/nova-compra')}
        className="w-full py-5 rounded-2xl bg-cta text-cta-fg font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.99] transition-all shadow-sm"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Nova Compra
      </button>

      {/* Secondary actions */}
      <div className="grid grid-cols-2 gap-2">
        <SecondaryAction
          label="Histórico de Compras"
          onClick={() => navigate('/admin/pdv/gastos/compras')}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x={9} y={3} width={6} height={4} rx={1} />
              <line x1={9} y1={12} x2={15} y2={12} /><line x1={9} y1={16} x2={12} y2={16} />
            </svg>
          }
        />
        <SecondaryAction
          label="Contas Fixas"
          onClick={() => navigate('/admin/pdv/gastos/recorrentes')}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        />
      </div>

      {/* Recent purchases */}
      {recentBatches.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Últimas compras</h2>
            <button
              onClick={() => navigate('/admin/pdv/gastos/compras')}
              className="text-xs text-cta font-medium hover:opacity-80 transition-opacity"
            >
              Ver todas →
            </button>
          </div>
          <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
            {recentBatches.map((batch) => (
              <button
                key={batch.id}
                onClick={() => navigate(`/admin/pdv/gastos/compras/${batch.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-canvas transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">
                    {batch.note ?? 'Compra de insumos'}
                  </p>
                  <p className="text-xs text-ink-3">
                    {new Date(batch.batchDate).toLocaleDateString('pt-BR')}
                    {' · '}
                    {batch.items.length} {batch.items.length === 1 ? 'item' : 'itens'}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-red-500 dark:text-red-400 shrink-0">
                  {fmtMoney(batch.totalAmount)}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SecondaryAction({
  label,
  onClick,
  icon,
}: {
  label: string
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-border bg-surface py-3 px-2 flex flex-col items-center gap-1.5 text-ink-2 hover:text-ink hover:border-border-2 hover:bg-canvas transition-all active:scale-[0.97]"
    >
      {icon}
      <span className="text-xs font-semibold text-center">{label}</span>
    </button>
  )
}
