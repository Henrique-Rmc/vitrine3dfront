import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getCashFlowSummary,
  listSales,
  fmtMoney,
  PAYMENT_LABELS,
  type PdvCashFlowSummaryResponse,
  type PdvSaleResponse,
} from '../../../services/pdvService'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function PdvHomePage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<PdvCashFlowSummaryResponse | null>(null)
  const [recentSales, setRecentSales] = useState<PdvSaleResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const date = today()
    Promise.all([
      getCashFlowSummary({ from: date, to: date }),
      listSales({ from: date, to: date, size: 5 }),
    ])
      .then(([sum, sales]) => {
        setSummary(sum)
        setRecentSales(sales.content)
      })
      .catch((err) => {
        const data = (err as { response?: { data?: { message?: string; code?: string } } })?.response?.data
        if (data?.code === 'PDV_NOT_AVAILABLE' || data?.message?.includes('PDV_NOT_AVAILABLE')) {
          setError('O PDV está disponível apenas no plano Premium.')
        } else {
          setError(data?.message ?? 'Erro ao carregar dados.')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const dateLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink capitalize">{dateLabel}</h1>
        <p className="text-sm text-ink-3">Resumo do dia</p>
      </div>

      {loading && (
        <div className="space-y-3">
          <div className="h-28 rounded-2xl bg-surface animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 rounded-2xl bg-surface animate-pulse" />
            <div className="h-20 rounded-2xl bg-surface animate-pulse" />
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="text-ink-2 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && summary && (
        <>
          {/* ── Balance hero card ── */}
          <div className={`rounded-2xl border p-5 ${summary.balance >= 0 ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950'}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-1">Saldo</p>
                <p className={`text-4xl font-bold tabular-nums ${summary.balance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {fmtMoney(summary.balance)}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${summary.balance >= 0 ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-red-100 dark:bg-red-900'}`}>
                {summary.balance >= 0 ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 text-emerald-700 dark:text-emerald-400">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 text-red-600 dark:text-red-400">
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                    <polyline points="17 18 23 18 23 12" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* ── Entradas / Saídas ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-surface p-4 border-l-2 border-l-emerald-500">
              <p className="text-xs text-ink-3 mb-1">Entradas</p>
              <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{fmtMoney(summary.totalIn)}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4 border-l-2 border-l-red-400">
              <p className="text-xs text-ink-3 mb-1">Saídas</p>
              <p className="text-xl font-bold tabular-nums text-red-500 dark:text-red-400">{fmtMoney(summary.totalOut)}</p>
            </div>
          </div>

          {/* ── Primary CTA ── */}
          <button
            onClick={() => navigate('/admin/pdv/nova-venda')}
            className="w-full py-5 rounded-2xl bg-cta text-cta-fg font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.99] transition-all shadow-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Nova Venda
          </button>

          {/* ── Secondary actions ── */}
          <div className="grid grid-cols-3 gap-2">
            <SecondaryAction
              label="Caixa"
              onClick={() => navigate('/admin/pdv/caixa')}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <rect x={2} y={6} width={20} height={12} rx={2} />
                  <circle cx={12} cy={12} r={3} />
                </svg>
              }
            />
            <SecondaryAction
              label="Clientes"
              onClick={() => navigate('/admin/pdv/clientes')}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx={9} cy={7} r={4} />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              }
            />
            <SecondaryAction
              label="Estoque"
              onClick={() => navigate('/admin/pdv/estoque')}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1={12} y1={22.08} x2={12} y2={12} />
                </svg>
              }
            />
          </div>

          {/* ── Recent sales ── */}
          {recentSales.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink">Últimas vendas</h2>
                <button
                  onClick={() => navigate('/admin/pdv/vendas')}
                  className="text-xs text-cta font-medium hover:opacity-80 transition-opacity"
                >
                  Ver todas →
                </button>
              </div>
              <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
                {recentSales.map((sale) => {
                  const cancelled = sale.status === 'CANCELLED'
                  return (
                    <button
                      key={sale.id}
                      onClick={() => navigate(`/admin/pdv/vendas/${sale.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-canvas transition-colors text-left"
                    >
                      {/* Payment method badge */}
                      <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        sale.paymentMethod === 'PIX' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' :
                        sale.paymentMethod === 'CASH' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                        sale.paymentMethod === 'CARD' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                      }`}>
                        {PAYMENT_LABELS[sale.paymentMethod]}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${cancelled ? 'text-ink-3' : 'text-ink'}`}>
                          {sale.customerName ?? 'Venda avulsa'}
                        </p>
                        <p className="text-xs text-ink-3">
                          {new Date(sale.saleDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {' · '}
                          {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`text-sm font-semibold tabular-nums ${cancelled ? 'line-through text-ink-4' : 'text-ink'}`}>
                          {fmtMoney(sale.totalAmount)}
                        </p>
                        {cancelled && <span className="text-[10px] font-semibold text-red-500">Cancelada</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          )}
        </>
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
      <span className="text-xs font-semibold">{label}</span>
    </button>
  )
}
