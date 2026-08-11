import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getCashFlowSummary,
  listSales,
  fmtMoney,
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
        const msg =
          (err as { response?: { data?: { message?: string; code?: string } } })?.response?.data?.message
          ?? 'Erro ao carregar dados.'
        if (msg.includes('PDV_NOT_AVAILABLE') || (err as { response?: { data?: { code?: string } } })?.response?.data?.code === 'PDV_NOT_AVAILABLE') {
          setError('O PDV está disponível apenas no plano Premium.')
        } else {
          setError(msg)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const dateLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink capitalize">{dateLabel}</h1>
        <p className="text-sm text-ink-2">Resumo do dia</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-surface animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center space-y-2">
          <p className="text-ink-2 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && summary && (
        <>
          {/* ── Summary cards ── */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Entradas" value={fmtMoney(summary.totalIn)} positive />
            <StatCard label="Saídas" value={fmtMoney(summary.totalOut)} />
            <StatCard label="Saldo" value={fmtMoney(summary.balance)} span positive={summary.balance >= 0} />
          </div>

          {/* ── Quick actions ── */}
          <div className="grid grid-cols-2 gap-3">
            <ActionButton
              label="Nova Venda"
              description="Registrar venda"
              color="bg-cta text-cta-fg"
              onClick={() => navigate('/admin/pdv/nova-venda')}
              icon={<PlusCircleIcon />}
            />
            <ActionButton
              label="Caixa"
              description="Lançar entrada/saída"
              color="bg-surface text-ink border border-border"
              onClick={() => navigate('/admin/pdv/caixa')}
              icon={<CashIcon />}
            />
            <ActionButton
              label="Clientes"
              description="Fiado e histórico"
              color="bg-surface text-ink border border-border"
              onClick={() => navigate('/admin/pdv/clientes')}
              icon={<UsersIcon />}
            />
            <ActionButton
              label="Estoque"
              description="Ajustar quantidades"
              color="bg-surface text-ink border border-border"
              onClick={() => navigate('/admin/pdv/estoque')}
              icon={<BoxIcon />}
            />
          </div>

          {/* ── Recent sales ── */}
          {recentSales.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink">Últimas vendas</h2>
                <button
                  onClick={() => navigate('/admin/pdv/vendas')}
                  className="text-xs text-cta font-medium"
                >
                  Ver todas
                </button>
              </div>
              <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
                {recentSales.map((sale) => (
                  <button
                    key={sale.id}
                    onClick={() => navigate(`/admin/pdv/vendas/${sale.id}`)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-canvas transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {sale.customerName ?? 'Venda avulsa'}
                      </p>
                      <p className="text-xs text-ink-2">
                        {new Date(sale.saleDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${sale.status === 'CANCELLED' ? 'text-ink-3 line-through' : 'text-ink'}`}>
                        {fmtMoney(sale.totalAmount)}
                      </p>
                      {sale.status === 'CANCELLED' && (
                        <span className="text-xs text-red-500">Cancelada</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  positive = false,
  span = false,
}: {
  label: string
  value: string
  positive?: boolean
  span?: boolean
}) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-4 ${span ? 'col-span-2' : ''}`}>
      <p className="text-xs text-ink-2 mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
        {value}
      </p>
    </div>
  )
}

function ActionButton({
  label,
  description,
  color,
  onClick,
  icon,
}: {
  label: string
  description: string
  color: string
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} rounded-2xl p-4 text-left flex flex-col gap-2 transition-opacity hover:opacity-90 active:scale-[0.98]`}
    >
      <span className="w-5 h-5">{icon}</span>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs opacity-70">{description}</p>
      </div>
    </button>
  )
}

function PlusCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <circle cx={12} cy={12} r={10} /><line x1={12} y1={8} x2={12} y2={16} /><line x1={8} y1={12} x2={16} y2={12} />
    </svg>
  )
}

function CashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <rect x={2} y={6} width={20} height={12} rx={2} />
      <circle cx={12} cy={12} r={3} />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx={9} cy={7} r={4} />
      <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1={12} y1={22.08} x2={12} y2={12} />
    </svg>
  )
}
