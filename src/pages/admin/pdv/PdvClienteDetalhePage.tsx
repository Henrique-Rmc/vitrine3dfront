import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  listCustomers,
  listCredits,
  addCredit,
  addPayment,
  deleteCustomer,
  fmtMoney,
  fmtDate,
  PAYMENT_LABELS,
  CREDIT_STATUS_LABELS,
  type PdvCustomerResponse,
  type PdvCustomerCreditResponse,
  type PaymentMethod,
} from '../../../services/pdvService'

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'PIX', 'CARD']

export default function PdvClienteDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<PdvCustomerResponse | null>(null)
  const [credits, setCredits] = useState<PdvCustomerCreditResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreditForm, setShowCreditForm] = useState(false)
  const [expandedCredit, setExpandedCredit] = useState<string | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function load() {
    if (!id) return
    Promise.all([listCustomers(), listCredits(id)])
      .then(([all, creds]) => {
        const found = all.find((c) => c.id === id)
        if (!found) throw new Error('Cliente não encontrado.')
        setCustomer(found)
        setCredits(creds)
      })
      .catch((e) => setError(e.message ?? 'Erro ao carregar.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  async function handleDelete() {
    if (!id) return
    try {
      await deleteCustomer(id)
      navigate('/admin/pdv/clientes', { replace: true })
    } catch {
      setError('Erro ao remover cliente.')
    }
  }

  const totalBalance = credits
    .filter((c) => c.status === 'OPEN' || c.status === 'PARTIAL')
    .reduce((s, c) => s + c.balance, 0)

  if (loading) return <div className="p-6 space-y-3">{[1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-surface animate-pulse" />)}</div>

  if (error || !customer) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-sm text-ink-2">{error || 'Cliente não encontrado.'}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-cta">Voltar</button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-lg mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">{customer.name}</h1>
          {customer.phone && <p className="text-sm text-ink-2">{customer.phone}</p>}
          {customer.cpf && <p className="text-sm text-ink-2">CPF: {customer.cpf}</p>}
        </div>
        {totalBalance > 0 && (
          <div className="text-right">
            <p className="text-xs text-ink-2">Saldo em aberto</p>
            <p className="text-lg font-bold text-red-500 tabular-nums">{fmtMoney(totalBalance)}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShowCreditForm(true)}
          className="flex-1 py-2.5 rounded-xl bg-cta text-cta-fg text-sm font-semibold"
        >
          + Fiado
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-700 text-red-500 text-sm"
        >
          Remover
        </button>
      </div>

      {/* Credits list */}
      <h2 className="text-sm font-semibold text-ink">Histórico de fiado</h2>

      {credits.length === 0 && (
        <p className="text-sm text-ink-2 text-center py-4">Nenhum fiado registrado.</p>
      )}

      <div className="space-y-2">
        {credits.map((credit) => {
          const isExpanded = expandedCredit === credit.id
          const statusColor =
            credit.status === 'PAID' ? 'text-emerald-600 dark:text-emerald-400'
            : credit.status === 'OVERDUE' || (credit.dueDate && new Date(credit.dueDate) < new Date()) ? 'text-red-500'
            : 'text-amber-500'

          return (
            <div key={credit.id} className="rounded-2xl border border-border bg-surface overflow-hidden">
              <button
                onClick={() => setExpandedCredit(isExpanded ? null : credit.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{fmtMoney(credit.totalDue)}</p>
                  <p className="text-xs text-ink-2">
                    {fmtDate(credit.createdAt)}
                    {credit.dueDate ? ` · venc. ${fmtDate(credit.dueDate)}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-semibold ${statusColor}`}>
                    {CREDIT_STATUS_LABELS[credit.status]}
                  </p>
                  <p className="text-xs text-ink-2">{fmtMoney(credit.balance)} restante</p>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border px-4 py-3 space-y-3">
                  {credit.note && <p className="text-xs text-ink-2 italic">{credit.note}</p>}

                  {credit.payments.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-ink-2">Pagamentos</p>
                      {credit.payments.map((p) => (
                        <div key={p.id} className="flex justify-between text-xs text-ink-2">
                          <span>{fmtDate(p.paidAt)} · {PAYMENT_LABELS[p.paymentMethod]}</span>
                          <span className="font-medium text-ink">{fmtMoney(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {credit.status !== 'PAID' && (
                    showPaymentForm === credit.id ? (
                      <PaymentForm
                        credit={credit}
                        customerId={id!}
                        onCancel={() => setShowPaymentForm(null)}
                        onSaved={() => { setShowPaymentForm(null); load() }}
                      />
                    ) : (
                      <button
                        onClick={() => setShowPaymentForm(credit.id)}
                        className="w-full py-2 rounded-xl bg-cta text-cta-fg text-sm font-medium"
                      >
                        Registrar pagamento
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 space-y-4">
            <p className="text-sm text-ink font-medium">
              Remover {customer.name}? Todos os registros de fiado serão apagados.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-ink">Não</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold">Sim, remover</button>
            </div>
          </div>
        </div>
      )}

      {/* Add credit modal */}
      {showCreditForm && (
        <AddCreditModal
          customerId={id!}
          onClose={() => setShowCreditForm(false)}
          onSaved={() => { setShowCreditForm(false); load() }}
        />
      )}
    </div>
  )
}

function AddCreditModal({
  customerId,
  onClose,
  onSaved,
}: {
  customerId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [totalDue, setTotalDue] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(totalDue.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) { setError('Valor inválido.'); return }
    setSaving(true)
    try {
      await addCredit(customerId, {
        totalDue: amount,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        note: note.trim() || undefined,
      })
      onSaved()
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 space-y-4">
        <h2 className="text-base font-bold text-ink">Novo Fiado</h2>
        <div className="space-y-1">
          <label className="text-xs text-ink-2">Valor *</label>
          <input
            type="text" inputMode="decimal" autoFocus
            value={totalDue} onChange={(e) => setTotalDue(e.target.value)}
            placeholder="0,00"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-canvas text-ink text-lg font-semibold focus:outline-none focus:border-cta"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-ink-2">Vencimento</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink focus:outline-none focus:border-cta" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-ink-2">Observação</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500}
            className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink focus:outline-none focus:border-cta" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-ink">Cancelar</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-cta text-cta-fg text-sm font-semibold disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}

function PaymentForm({
  credit,
  customerId,
  onCancel,
  onSaved,
}: {
  credit: PdvCustomerCreditResponse
  customerId: string
  onCancel: () => void
  onSaved: () => void
}) {
  const [amount, setAmount] = useState(String(credit.balance).replace('.', ','))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = parseFloat(amount.replace(',', '.'))
    if (isNaN(val) || val <= 0) { setError('Valor inválido.'); return }
    setSaving(true)
    try {
      await addPayment(customerId, credit.id, { amount: val, paymentMethod })
      onSaved()
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-border pt-3">
      <div className="space-y-1">
        <label className="text-xs text-ink-2">Valor pago</label>
        <input
          type="text" inputMode="decimal" value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink focus:outline-none focus:border-cta"
        />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m} type="button"
            onClick={() => setPaymentMethod(m)}
            className={`py-2 rounded-xl border text-xs font-medium transition-all ${paymentMethod === m ? 'bg-cta border-cta text-cta-fg' : 'bg-surface border-border text-ink'}`}
          >
            {PAYMENT_LABELS[m]}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-xl border border-border text-xs text-ink">Cancelar</button>
        <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl bg-cta text-cta-fg text-xs font-semibold disabled:opacity-50">
          {saving ? 'Salvando...' : 'Confirmar'}
        </button>
      </div>
    </form>
  )
}
