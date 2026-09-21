import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listExpenseBatches,
  getExpenseBatchSummary,
  type ExpenseBatchResponse,
} from '../../../services/pdvExpenseService'
import { fmtMoney } from '../../../services/pdvService'

function startOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function PdvComprasPage() {
  const navigate = useNavigate()
  const [from, setFrom] = useState(startOfMonth())
  const [to, setTo] = useState(today())
  const [batches, setBatches] = useState<ExpenseBatchResponse[]>([])
  const [totalSpent, setTotalSpent] = useState(0)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      listExpenseBatches({ from, to, page, size: 20 }),
      getExpenseBatchSummary({ from, to }),
    ])
      .then(([data, summary]) => {
        setBatches(data.content)
        setTotalPages(data.totalPages)
        setTotalSpent(summary.totalSpent)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [from, to, page])

  function applyFilter() {
    setPage(0)
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-ink flex-1">Compras</h1>
        <button
          onClick={() => navigate('/admin/pdv/gastos/nova-compra')}
          className="text-sm font-semibold text-cta hover:opacity-80 transition-opacity"
        >
          + Nova
        </button>
      </div>

      {/* Date filter */}
      <div className="flex gap-2 items-end flex-wrap">
        <div className="flex-1 min-w-[130px]">
          <label className="block text-xs text-ink-3 mb-1">De</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cta/40"
          />
        </div>
        <div className="flex-1 min-w-[130px]">
          <label className="block text-xs text-ink-3 mb-1">Até</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cta/40"
          />
        </div>
        <button
          onClick={applyFilter}
          className="px-4 py-2 rounded-xl bg-cta text-cta-fg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Filtrar
        </button>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-border bg-surface px-4 py-3 flex items-center justify-between">
        <p className="text-sm text-ink-3">Total no período</p>
        <p className="text-lg font-bold tabular-nums text-red-500 dark:text-red-400">
          {fmtMoney(totalSpent)}
        </p>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="text-ink-3 text-sm">Nenhuma compra no período.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
          {batches.map((batch) => (
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
              <p className="text-sm font-semibold tabular-nums text-ink shrink-0">
                {fmtMoney(batch.totalAmount)}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-ink disabled:opacity-40 hover:bg-canvas transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-sm text-ink-3">
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-ink disabled:opacity-40 hover:bg-canvas transition-colors"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}
