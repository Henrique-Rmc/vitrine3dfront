import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listSales,
  fmtMoney,
  fmtDateTime,
  PAYMENT_LABELS,
  type PdvSaleResponse,
  type Page,
} from '../../../services/pdvService'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function PdvVendasPage() {
  const navigate = useNavigate()
  const [sales, setSales] = useState<PdvSaleResponse[]>([])
  const [page, setPage] = useState<Page<PdvSaleResponse> | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [from, setFrom] = useState(todayStr())
  const [to, setTo] = useState(todayStr())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (p: number) => {
    setLoading(true)
    setError('')
    try {
      const result = await listSales({ from, to, page: p, size: 20 })
      setSales(result.content)
      setPage(result)
      setCurrentPage(p)
    } catch {
      setError('Erro ao carregar vendas.')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => { load(0) }, [load])

  const totalAmount = sales.filter((s) => s.status !== 'CANCELLED').reduce((s, v) => s + v.totalAmount, 0)

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-ink">Vendas</h1>

      {/* Date filter */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[120px] space-y-1">
          <label className="text-xs text-ink-2">De</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink focus:outline-none focus:border-cta"
          />
        </div>
        <div className="flex-1 min-w-[120px] space-y-1">
          <label className="text-xs text-ink-2">Até</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink focus:outline-none focus:border-cta"
          />
        </div>
      </div>

      {/* Summary row */}
      {sales.length > 0 && (
        <div className="rounded-xl border border-border bg-surface px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-ink-2">
            {sales.filter((s) => s.status !== 'CANCELLED').length} venda(s)
          </span>
          <span className="text-base font-bold text-ink tabular-nums">{fmtMoney(totalAmount)}</span>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-surface animate-pulse" />)}
        </div>
      )}

      {!loading && error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {!loading && !error && sales.length === 0 && (
        <p className="text-center text-ink-2 text-sm py-8">Nenhuma venda neste período.</p>
      )}

      {!loading && !error && sales.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
          {sales.map((sale) => (
            <button
              key={sale.id}
              onClick={() => navigate(`/admin/pdv/vendas/${sale.id}`)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-canvas transition-colors text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">
                  {sale.customerName ?? 'Venda avulsa'}
                </p>
                <p className="text-xs text-ink-2">
                  {fmtDateTime(sale.saleDate)} · {PAYMENT_LABELS[sale.paymentMethod]}
                </p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className={`text-sm font-semibold tabular-nums ${sale.status === 'CANCELLED' ? 'text-ink-3 line-through' : 'text-ink'}`}>
                  {fmtMoney(sale.totalAmount)}
                </p>
                {sale.status === 'CANCELLED' && (
                  <span className="text-xs text-red-500">Cancelada</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {page && page.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={currentPage === 0}
            onClick={() => load(currentPage - 1)}
            className="px-4 py-2 rounded-xl border border-border text-sm text-ink disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-sm text-ink-2">
            {currentPage + 1} / {page.totalPages}
          </span>
          <button
            disabled={page.last}
            onClick={() => load(currentPage + 1)}
            className="px-4 py-2 rounded-xl border border-border text-sm text-ink disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  )
}
