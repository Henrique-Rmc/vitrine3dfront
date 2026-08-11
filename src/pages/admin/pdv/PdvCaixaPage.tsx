import { useEffect, useState, useCallback } from 'react'
import {
  listCashFlow,
  getCashFlowSummary,
  addCashFlow,
  generateOfflineId,
  fmtMoney,
  fmtDateTime,
  FLOW_CATEGORY_LABELS,
  type PdvCashFlowResponse,
  type PdvCashFlowSummaryResponse,
  type FlowType,
  type FlowCategory,
  type Page,
} from '../../../services/pdvService'

function todayStr() { return new Date().toISOString().slice(0, 10) }

const IN_CATEGORIES: FlowCategory[] = ['OPENING', 'CREDIT_PAYMENT', 'OTHER']
const OUT_CATEGORIES: FlowCategory[] = ['EXPENSE', 'WITHDRAWAL', 'OTHER']

export default function PdvCaixaPage() {
  const [entries, setEntries] = useState<PdvCashFlowResponse[]>([])
  const [page, setPage] = useState<Page<PdvCashFlowResponse> | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [summary, setSummary] = useState<PdvCashFlowSummaryResponse | null>(null)
  const [from, setFrom] = useState(todayStr())
  const [to, setTo] = useState(todayStr())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState<FlowType | null>(null)

  const load = useCallback(async (p: number) => {
    setLoading(true)
    setError('')
    try {
      const [result, sum] = await Promise.all([
        listCashFlow({ from, to, page: p, size: 20 }),
        getCashFlowSummary({ from, to }),
      ])
      setEntries(result.content)
      setPage(result)
      setSummary(sum)
      setCurrentPage(p)
    } catch {
      setError('Erro ao carregar caixa.')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => { load(0) }, [load])

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-ink">Caixa</h1>

      {/* Date filter */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-ink-2">De</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink focus:outline-none focus:border-cta" />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs text-ink-2">Até</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink focus:outline-none focus:border-cta" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowForm('IN')}
          className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          + Entrada
        </button>
        <button
          onClick={() => setShowForm('OUT')}
          className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          − Saída
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border bg-surface p-3">
            <p className="text-xs text-ink-2">Entradas</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{fmtMoney(summary.totalIn)}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3">
            <p className="text-xs text-ink-2">Saídas</p>
            <p className="text-base font-bold text-red-500 tabular-nums">{fmtMoney(summary.totalOut)}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3">
            <p className="text-xs text-ink-2">Saldo</p>
            <p className={`text-base font-bold tabular-nums ${summary.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {fmtMoney(summary.balance)}
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-surface animate-pulse" />)}
        </div>
      )}

      {!loading && error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {!loading && !error && entries.length === 0 && (
        <p className="text-center text-ink-2 text-sm py-8">Nenhum lançamento neste período.</p>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">
                  {FLOW_CATEGORY_LABELS[entry.category]}
                  {entry.description ? ` · ${entry.description}` : ''}
                </p>
                <p className="text-xs text-ink-2 truncate">{fmtDateTime(entry.flowDate)}</p>
              </div>
              <p className={`text-sm font-semibold tabular-nums shrink-0 ml-3 ${entry.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {entry.type === 'IN' ? '+' : '−'}{fmtMoney(entry.amount)}
              </p>
            </div>
          ))}
        </div>
      )}

      {page && page.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={currentPage === 0} onClick={() => load(currentPage - 1)}
            className="px-4 py-2 rounded-xl border border-border text-sm text-ink disabled:opacity-40">Anterior</button>
          <span className="px-4 py-2 text-sm text-ink-2">{currentPage + 1} / {page.totalPages}</span>
          <button disabled={page.last} onClick={() => load(currentPage + 1)}
            className="px-4 py-2 rounded-xl border border-border text-sm text-ink disabled:opacity-40">Próxima</button>
        </div>
      )}

      {showForm && (
        <CashFlowModal
          type={showForm}
          categories={showForm === 'IN' ? IN_CATEGORIES : OUT_CATEGORIES}
          onClose={() => setShowForm(null)}
          onSaved={() => { setShowForm(null); load(0) }}
        />
      )}
    </div>
  )
}

function CashFlowModal({
  type,
  categories,
  onClose,
  onSaved,
}: {
  type: FlowType
  categories: FlowCategory[]
  onClose: () => void
  onSaved: () => void
}) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<FlowCategory>(categories[0])
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = parseFloat(amount.replace(',', '.'))
    if (isNaN(val) || val <= 0) { setError('Valor inválido.'); return }
    setSaving(true)
    setError('')
    try {
      await addCashFlow({
        offlineId: generateOfflineId(),
        type,
        category,
        amount: val,
        description: description.trim() || undefined,
        flowDate: new Date().toISOString(),
      })
      onSaved()
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao lançar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 space-y-4">
        <h2 className="text-base font-bold text-ink">
          {type === 'IN' ? 'Lançar Entrada' : 'Lançar Saída'}
        </h2>

        <div className="space-y-1">
          <label className="text-xs text-ink-2">Valor *</label>
          <input
            type="text" inputMode="decimal" value={amount} autoFocus
            onChange={(e) => setAmount(e.target.value)} placeholder="0,00"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-canvas text-ink text-lg font-semibold focus:outline-none focus:border-cta"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-ink-2">Categoria</label>
          <div className="grid grid-cols-2 gap-1.5">
            {categories.map((c) => (
              <button key={c} type="button" onClick={() => setCategory(c)}
                className={`py-2 rounded-xl border text-xs font-medium transition-all ${category === c ? 'bg-cta border-cta text-cta-fg' : 'bg-surface border-border text-ink'}`}>
                {FLOW_CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-ink-2">Descrição (opcional)</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500}
            className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink focus:outline-none focus:border-cta" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-ink">Cancelar</button>
          <button type="submit" disabled={saving}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 ${type === 'IN' ? 'bg-emerald-600' : 'bg-red-500'}`}>
            {saving ? 'Lançando...' : 'Confirmar'}
          </button>
        </div>
      </form>
    </div>
  )
}
