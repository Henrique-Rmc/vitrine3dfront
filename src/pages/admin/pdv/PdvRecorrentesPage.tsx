import { useEffect, useState } from 'react'
import {
  listRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  payRecurring,
  FREQUENCY_LABELS,
  type RecurringExpenseResponse,
  type RecurringExpenseRequest,
  type RecurringFrequency,
} from '../../../services/pdvExpenseService'
import { fmtMoney } from '../../../services/pdvService'

const FREQUENCIES: RecurringFrequency[] = ['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL']

function computeNextDueDate(dueDay: number): string {
  const today = new Date()
  const todayDay = today.getDate()
  const year = today.getFullYear()
  const month = today.getMonth()
  if (todayDay < dueDay) {
    const d = new Date(year, month, dueDay)
    return d.toISOString().slice(0, 10)
  }
  const d = new Date(year, month + 1, dueDay)
  return d.toISOString().slice(0, 10)
}

function makeEmptyForm(): RecurringExpenseRequest {
  return {
    name: '',
    description: '',
    amount: 0,
    frequency: 'MONTHLY',
    dueDay: 10,
    alertDaysBefore: 1,
    nextDueDate: computeNextDueDate(10),
  }
}

export default function PdvRecorrentesPage() {
  const [items, setItems] = useState<RecurringExpenseResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState<'new' | RecurringExpenseResponse | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    listRecurring()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handlePay(id: string) {
    setPayingId(id)
    try {
      const updated = await payRecurring(id)
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)))
    } catch {
      // silent
    } finally {
      setPayingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta conta recorrente?')) return
    setDeletingId(id)
    try {
      await deleteRecurring(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch {
      // silent
    } finally {
      setDeletingId(null)
    }
  }

  function handleSaved(item: RecurringExpenseResponse) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = item
        return next
      }
      return [item, ...prev]
    })
    setShowForm(null)
  }

  const alerts = items.filter((i) => i.daysUntilDue <= i.alertDaysBefore)
  const rest = items.filter((i) => i.daysUntilDue > i.alertDaysBefore)

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-ink flex-1">Contas Fixas</h1>
        <button
          onClick={() => setShowForm('new')}
          className="text-sm font-semibold text-cta hover:opacity-80 transition-opacity"
        >
          + Nova
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      )}

      {/* Alert section */}
      {!loading && alerts.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Atenção
          </p>
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 divide-y divide-amber-200 dark:divide-amber-800 overflow-hidden">
            {alerts.map((item) => (
              <RecurringRow
                key={item.id}
                item={item}
                payingId={payingId}
                deletingId={deletingId}
                onPay={handlePay}
                onEdit={() => setShowForm(item)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      )}

      {/* Main list */}
      {!loading && rest.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
          {rest.map((item) => (
            <RecurringRow
              key={item.id}
              item={item}
              payingId={payingId}
              deletingId={deletingId}
              onPay={handlePay}
              onEdit={() => setShowForm(item)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="text-ink-3 text-sm">Nenhuma conta recorrente cadastrada.</p>
          <button
            onClick={() => setShowForm('new')}
            className="mt-3 text-sm text-cta font-medium hover:opacity-80 transition-opacity"
          >
            Cadastrar primeira conta
          </button>
        </div>
      )}

      {/* Modal */}
      {showForm !== null && (
        <RecurringFormModal
          initial={showForm === 'new' ? null : showForm}
          onSaved={handleSaved}
          onClose={() => setShowForm(null)}
        />
      )}
    </div>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────────

function RecurringRow({
  item,
  payingId,
  deletingId,
  onPay,
  onEdit,
  onDelete,
}: {
  item: RecurringExpenseResponse
  payingId: string | null
  deletingId: string | null
  onPay: (id: string) => void
  onEdit: () => void
  onDelete: (id: string) => void
}) {
  const isOverdue = item.daysUntilDue < 0
  const isUrgent = item.daysUntilDue >= 0 && item.daysUntilDue <= item.alertDaysBefore
  const statusLabel = isOverdue
    ? `Vencida há ${Math.abs(item.daysUntilDue)} dias`
    : item.daysUntilDue === 0
    ? 'Vence hoje'
    : `Vence em ${item.daysUntilDue} dias`

  return (
    <div className="px-4 py-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-sm font-medium text-ink truncate">{item.name}</p>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-surface border border-border text-ink-3">
            {FREQUENCY_LABELS[item.frequency]}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold tabular-nums text-ink">{fmtMoney(item.amount)}</p>
          <span
            className={`text-xs font-medium ${
              isOverdue
                ? 'text-red-500 dark:text-red-400'
                : isUrgent
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {statusLabel}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onPay(item.id)}
          disabled={payingId === item.id}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-cta text-cta-fg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {payingId === item.id ? '...' : 'Pagar'}
        </button>
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-ink-2 hover:text-ink hover:bg-canvas transition-colors"
          title="Editar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(item.id)}
          disabled={deletingId === item.id}
          className="p-1.5 rounded-lg text-ink-3 hover:text-red-500 hover:bg-canvas transition-colors disabled:opacity-50"
          title="Remover"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Form modal ────────────────────────────────────────────────────────────────

function RecurringFormModal({
  initial,
  onSaved,
  onClose,
}: {
  initial: RecurringExpenseResponse | null
  onSaved: (item: RecurringExpenseResponse) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<RecurringExpenseRequest>(
    initial
      ? {
          name: initial.name,
          description: initial.description ?? '',
          amount: initial.amount,
          frequency: initial.frequency,
          dueDay: initial.dueDay,
          alertDaysBefore: initial.alertDaysBefore,
          nextDueDate: initial.nextDueDate,
        }
      : makeEmptyForm(),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof RecurringExpenseRequest>(k: K, v: RecurringExpenseRequest[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  useEffect(() => {
    if (!initial) {
      setForm((prev) => ({ ...prev, nextDueDate: computeNextDueDate(prev.dueDay) }))
    }
  }, [form.dueDay, initial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload: RecurringExpenseRequest = {
        ...form,
        amount: Number(form.amount),
        dueDay: Number(form.dueDay),
        alertDaysBefore: Number(form.alertDaysBefore),
      }
      const result = initial
        ? await updateRecurring(initial.id, payload)
        : await createRecurring(payload)
      onSaved(result)
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-2xl md:rounded-2xl bg-surface p-5 max-h-[90vh] overflow-y-auto z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-ink">
            {initial ? 'Editar conta' : 'Nova conta recorrente'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-canvas transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <line x1={18} y1={6} x2={6} y2={18} /><line x1={6} y1={6} x2={18} y2={18} />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome">
            <input
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ex: Aluguel"
              className="w-full rounded-xl border border-border bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cta/40"
            />
          </Field>

          <Field label="Descrição (opcional)">
            <input
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Observação"
              className="w-full rounded-xl border border-border bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cta/40"
            />
          </Field>

          <Field label="Valor (R$)">
            <input
              required
              type="number"
              min={0.01}
              step={0.01}
              value={form.amount || ''}
              onChange={(e) => set('amount', parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-border bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cta/40"
            />
          </Field>

          <Field label="Frequência">
            <div className="flex gap-2 flex-wrap">
              {FREQUENCIES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => set('frequency', f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    form.frequency === f
                      ? 'bg-cta text-cta-fg border-cta'
                      : 'border-border text-ink-2 hover:border-border-2'
                  }`}
                >
                  {FREQUENCY_LABELS[f]}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Dia de vencimento">
              <input
                required
                type="number"
                min={1}
                max={31}
                value={form.dueDay}
                onChange={(e) => set('dueDay', parseInt(e.target.value) || 1)}
                className="w-full rounded-xl border border-border bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cta/40"
              />
            </Field>
            <Field label="Alertar X dias antes">
              <input
                required
                type="number"
                min={0}
                max={30}
                value={form.alertDaysBefore}
                onChange={(e) => set('alertDaysBefore', parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-border bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cta/40"
              />
            </Field>
          </div>

          <Field label="Próximo vencimento">
            <input
              required
              type="date"
              value={form.nextDueDate}
              onChange={(e) => set('nextDueDate', e.target.value)}
              className="w-full rounded-xl border border-border bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cta/40"
            />
          </Field>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-2xl bg-cta text-cta-fg font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {saving ? 'Salvando...' : initial ? 'Salvar' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-3 mb-1">{label}</label>
      {children}
    </div>
  )
}
