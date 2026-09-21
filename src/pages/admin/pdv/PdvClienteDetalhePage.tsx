import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  listCustomers,
  listCredits,
  addPayment,
  deleteCustomer,
  listRelationships,
  createRelationship,
  deleteRelationship,
  getApiErrorCode,
  getApiErrorMessage,
  fmtMoney,
  fmtDate,
  PAYMENT_LABELS,
  RELATIONSHIP_LABELS,
  type PdvCustomerResponse,
  type PdvCustomerCreditResponse,
  type PdvRelationshipResponse,
  type RelationshipType,
  type PaymentMethod,
} from '../../../services/pdvService'
import { CustomerModal } from './PdvClientesPage'

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'PIX', 'CARD']
const RELATIONSHIP_TYPES = Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]

export default function PdvClienteDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<PdvCustomerResponse | null>(null)
  const [allCustomers, setAllCustomers] = useState<PdvCustomerResponse[]>([])
  const [credits, setCredits] = useState<PdvCustomerCreditResponse[]>([])
  const [relationships, setRelationships] = useState<PdvRelationshipResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedCredit, setExpandedCredit] = useState<string | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [showRelModal, setShowRelModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmUnlinkId, setConfirmUnlinkId] = useState<number | null>(null)

  function load() {
    if (!id) return
    Promise.all([listCustomers(), listCredits(id), listRelationships(id).catch(() => [] as PdvRelationshipResponse[])])
      .then(([all, creds, rels]) => {
        const found = all.find((c) => c.id === id)
        if (!found) throw new Error('Cliente não encontrado.')
        setCustomer(found)
        setAllCustomers(all)
        setCredits(creds)
        setRelationships(rels)
      })
      .catch((e) => setError(e.message ?? 'Erro ao carregar.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true)
    setError('')
    setExpandedCredit(null)
    setShowPaymentForm(null)
    load()
  }, [id])

  async function handleDelete() {
    if (!id) return
    try {
      await deleteCustomer(id)
      navigate('/admin/pdv/clientes', { replace: true })
    } catch (err) {
      setConfirmDelete(false)
      setError(
        getApiErrorCode(err) === 'CUSTOMER_HAS_OPEN_DEBTS'
          ? 'Não é possível remover este cliente pois ele possui débitos em aberto.'
          : getApiErrorMessage(err, 'Erro ao remover cliente.'),
      )
    }
  }

  async function handleUnlink(relId: number) {
    if (!id) return
    try {
      await deleteRelationship(id, relId)
      setRelationships((prev) => prev.filter((r) => r.id !== relId))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erro ao remover vínculo.'))
    } finally {
      setConfirmUnlinkId(null)
    }
  }

  const openCredits = credits.filter((c) => c.status === 'OPEN' || c.status === 'PARTIAL')
  const closedCredits = credits.filter((c) => c.status !== 'OPEN' && c.status !== 'PARTIAL')
  const totalBalance = openCredits.reduce((s, c) => s + c.balance, 0)
  const hasOpenDebts = totalBalance > 0

  const relativeBalance = (relativeId: string) =>
    allCustomers.find((c) => c.id === relativeId)?.totalBalance ?? 0
  const uniqueRelativeIds = Array.from(new Set(relationships.map((r) => r.relativeId)))
  const familyBalance = totalBalance + uniqueRelativeIds.reduce((s, rid) => s + relativeBalance(rid), 0)

  if (loading) return <div className="p-6 space-y-3">{[1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-surface animate-pulse" />)}</div>

  if (!customer) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-sm text-ink-2">{error || 'Cliente não encontrado.'}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-cta">Voltar</button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-ink">{customer.name}</h1>
          {customer.phone && <p className="text-sm text-ink-2">{customer.phone}</p>}
          {customer.email && (
            <a href={`mailto:${customer.email}`} className="text-sm text-cta hover:opacity-80 truncate block">
              {customer.email}
            </a>
          )}
          {customer.cpf && <p className="text-sm text-ink-2">CPF: {customer.cpf}</p>}
        </div>
        {hasOpenDebts && (
          <div className="text-right shrink-0">
            <p className="text-xs text-ink-2">Saldo em aberto</p>
            <p className="text-lg font-bold text-red-500 tabular-nums">{fmtMoney(totalBalance)}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowEdit(true)}
          className="px-4 py-2 rounded-xl border border-border text-sm text-ink font-medium hover:bg-canvas transition-colors"
        >
          Editar
        </button>
        <div className="flex-1" />
        <div className="text-right">
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={hasOpenDebts}
            title={hasOpenDebts ? 'Quite os débitos antes de remover' : undefined}
            className="px-4 py-2 rounded-xl border border-red-300 dark:border-red-700 text-red-500 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Remover
          </button>
          {hasOpenDebts && <p className="text-[10px] text-ink-3 mt-1">Quite os débitos antes de remover.</p>}
        </div>
      </div>

      {error && <p className="text-sm text-red-500 text-center rounded-xl bg-red-50 dark:bg-red-950 px-3 py-2">{error}</p>}

      {/* Open debts — prominent, with direct payment */}
      {openCredits.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-ink">
            Dívidas em aberto
            <span className="ml-2 text-xs font-normal text-ink-3">
              {openCredits.length} {openCredits.length === 1 ? 'dívida' : 'dívidas'}
            </span>
          </h2>
          {openCredits.map((credit) => (
            <div key={credit.id} className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-surface overflow-hidden">
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{credit.productName}</p>
                    <div className="flex flex-wrap gap-x-3 mt-0.5">
                      <p className="text-xs text-ink-2">Total: {fmtMoney(credit.totalDue)}</p>
                      {credit.amountPaid > 0 && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          Pago: {fmtMoney(credit.amountPaid)}
                        </p>
                      )}
                    </div>
                    {credit.originSaleId ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/pdv/vendas/${credit.originSaleId}`)}
                        className="text-xs text-cta hover:opacity-80 mt-0.5"
                      >
                        Da venda de {fmtDate(credit.createdAt)} · Ver venda →
                      </button>
                    ) : (
                      credit.discountAmount != null && credit.discountAmount > 0 && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Desconto: −{fmtMoney(credit.discountAmount)}
                        </p>
                      )
                    )}
                    {credit.dueDate && (
                      <p className="text-xs text-ink-3 mt-0.5">Venc.: {fmtDate(credit.dueDate)}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-red-500 tabular-nums">{fmtMoney(credit.balance)}</p>
                    <p className="text-xs text-ink-3">
                      {credit.status === 'PARTIAL' ? 'restante' : 'em aberto'}
                    </p>
                  </div>
                </div>

                {credit.payments.length > 0 && (
                  <div className="mb-3 pt-2 border-t border-border space-y-1">
                    <p className="text-xs font-medium text-ink-3">Pagamentos anteriores</p>
                    {credit.payments.map((p) => (
                      <div key={p.id} className="flex justify-between text-xs text-ink-2">
                        <span>{fmtDate(p.paidAt)} · {PAYMENT_LABELS[p.paymentMethod]}</span>
                        <span className="font-medium text-ink">{fmtMoney(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {showPaymentForm === credit.id ? (
                  <PaymentForm
                    credit={credit}
                    customerId={id!}
                    onCancel={() => setShowPaymentForm(null)}
                    onSaved={() => { setShowPaymentForm(null); load() }}
                  />
                ) : (
                  <button
                    onClick={() => setShowPaymentForm(credit.id)}
                    className="w-full py-2.5 rounded-xl bg-cta text-cta-fg text-sm font-semibold"
                  >
                    Registrar pagamento
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {openCredits.length === 0 && credits.length > 0 && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
          <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Em dia — nenhuma dívida em aberto</p>
        </div>
      )}

      {/* Relationships */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Parentesco</h2>
          <button
            onClick={() => setShowRelModal(true)}
            className="text-xs font-semibold text-cta hover:opacity-80 transition-opacity"
          >
            + Vincular
          </button>
        </div>

        {relationships.length === 0 ? (
          <p className="text-xs text-ink-3 rounded-xl border border-dashed border-border px-4 py-3 text-center">
            Nenhum parente vinculado.
          </p>
        ) : (
          <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
            {relationships.map((rel) => {
              const bal = relativeBalance(rel.relativeId)
              const label = rel.fromMe
                ? RELATIONSHIP_LABELS[rel.relationship]
                : `${RELATIONSHIP_LABELS[rel.relationship]} de ${rel.relativeName.split(' ')[0]}`
              return (
                <div key={rel.id} className="flex items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/pdv/clientes/${rel.relativeId}`)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="text-sm font-medium text-ink truncate">{rel.relativeName}</p>
                    <p className="text-xs text-ink-2">
                      {label}
                      {rel.relativePhone ? ` · ${rel.relativePhone}` : ''}
                    </p>
                    {rel.note && <p className="text-xs text-ink-3 italic truncate">{rel.note}</p>}
                  </button>
                  <div className="text-right shrink-0">
                    {bal > 0 ? (
                      <p className="text-sm font-semibold text-red-500 tabular-nums">{fmtMoney(bal)}</p>
                    ) : (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">Em dia</p>
                    )}
                  </div>
                  {confirmUnlinkId === rel.id ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleUnlink(rel.id)} className="text-xs font-semibold text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950">
                        Remover
                      </button>
                      <button onClick={() => setConfirmUnlinkId(null)} className="text-xs text-ink-3 px-2 py-1 rounded-lg hover:bg-canvas">
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmUnlinkId(rel.id)}
                      title="Remover vínculo"
                      className="shrink-0 p-1.5 rounded-lg text-ink-3 hover:text-red-500 hover:bg-canvas transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                        <line x1={18} y1={6} x2={6} y2={18} /><line x1={6} y1={6} x2={18} y2={18} />
                      </svg>
                    </button>
                  )}
                </div>
              )
            })}
            {familyBalance > totalBalance && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-canvas">
                <span className="text-xs text-ink-2">Dívida da família</span>
                <span className="text-sm font-bold text-red-500 tabular-nums">{fmtMoney(familyBalance)}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Paid history */}
      {closedCredits.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-ink">
            {openCredits.length > 0 ? 'Histórico (pago)' : 'Histórico de fiado'}
          </h2>
          {closedCredits.map((credit) => {
            const isExpanded = expandedCredit === credit.id
            return (
              <div key={credit.id} className="rounded-2xl border border-border bg-surface overflow-hidden">
                <button
                  onClick={() => setExpandedCredit(isExpanded ? null : credit.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">{credit.productName}</p>
                    <p className="text-xs tabular-nums text-ink-2">{fmtMoney(credit.totalDue)}</p>
                    <p className="text-xs text-ink-3">{fmtDate(credit.createdAt)}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 ml-3 shrink-0">Pago</span>
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 space-y-1">
                    {credit.originSaleId && (
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/pdv/vendas/${credit.originSaleId}`)}
                        className="text-xs text-cta hover:opacity-80 mb-1"
                      >
                        Ver venda de origem →
                      </button>
                    )}
                    {credit.payments.map((p) => (
                      <div key={p.id} className="flex justify-between text-xs text-ink-2">
                        <span>{fmtDate(p.paidAt)} · {PAYMENT_LABELS[p.paymentMethod]}</span>
                        <span className="font-medium text-ink">{fmtMoney(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </section>
      )}

      {credits.length === 0 && (
        <p className="text-sm text-ink-2 text-center py-6">
          Nenhum fiado registrado para este cliente.
          <br />
          <span className="text-ink-3 text-xs">Débitos surgem automaticamente em vendas com pagamento parcial.</span>
        </p>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 space-y-4">
            <p className="text-sm text-ink font-medium">
              Remover {customer.name}? Todos os registros de fiado e vínculos serão apagados.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-ink">Não</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold">Sim, remover</button>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <CustomerModal
          initial={customer}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); load() }}
        />
      )}

      {showRelModal && (
        <RelationshipModal
          customer={customer}
          candidates={allCustomers.filter(
            (c) => c.id !== customer.id && !relationships.some((r) => r.relativeId === c.id),
          )}
          onClose={() => setShowRelModal(false)}
          onSaved={(rel) => { setRelationships((prev) => [...prev, rel]); setShowRelModal(false) }}
        />
      )}
    </div>
  )
}

// ── Relationship modal ─────────────────────────────────────────────────────────

function RelationshipModal({
  customer,
  candidates,
  onClose,
  onSaved,
}: {
  customer: PdvCustomerResponse
  candidates: PdvCustomerResponse[]
  onClose: () => void
  onSaved: (rel: PdvRelationshipResponse) => void
}) {
  const [search, setSearch] = useState('')
  const [relative, setRelative] = useState<PdvCustomerResponse | null>(null)
  const [relationship, setRelationship] = useState<RelationshipType | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const q = search.toLowerCase()
  const filtered = candidates.filter(
    (c) => c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(search),
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!relative || !relationship) return
    setSaving(true)
    setError('')
    try {
      const rel = await createRelationship(customer.id, {
        relativeId: relative.id,
        relationship,
        note: note.trim() || undefined,
      })
      onSaved(rel)
    } catch (err) {
      const code = getApiErrorCode(err)
      setError(
        code === 'SELF_RELATIONSHIP'
          ? 'Não é possível vincular o cliente a ele mesmo.'
          : code === 'DUPLICATE_RELATIONSHIP'
          ? 'Este vínculo já existe.'
          : getApiErrorMessage(err, 'Erro ao vincular parente.'),
      )
    } finally {
      setSaving(false)
    }
  }

  const firstName = customer.name.split(' ')[0]

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 space-y-4 max-h-[92vh] overflow-y-auto"
      >
        <h2 className="text-base font-bold text-ink">Vincular parente</h2>

        {/* Relative picker */}
        <div className="space-y-2">
          <label className="text-xs text-ink-2">Parente *</label>
          {relative ? (
            <div className="flex items-center gap-2 rounded-xl bg-cta/10 border border-cta/30 px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{relative.name}</p>
                {relative.phone && <p className="text-xs text-ink-3">{relative.phone}</p>}
              </div>
              <button type="button" onClick={() => setRelative(null)} className="text-xs text-cta font-medium hover:opacity-70 shrink-0">
                Trocar
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <input
                autoFocus
                type="search"
                placeholder="Buscar cliente por nome ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-cta"
              />
              <div className="rounded-xl border border-border bg-canvas overflow-hidden divide-y divide-border max-h-44 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-ink-3 text-center">
                    {candidates.length === 0 ? 'Todos os clientes já estão vinculados.' : 'Nenhum cliente encontrado.'}
                  </p>
                ) : (
                  filtered.slice(0, 30).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setRelative(c)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface transition-colors text-left"
                    >
                      <span className="text-sm text-ink font-medium truncate">{c.name}</span>
                      {c.phone && <span className="text-xs text-ink-3 ml-2 shrink-0">{c.phone}</span>}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Relationship type */}
        <div className="space-y-2">
          <label className="text-xs text-ink-2">
            {relative ? (
              <><span className="font-semibold text-ink">{relative.name.split(' ')[0]}</span> é ___ de <span className="font-semibold text-ink">{firstName}</span> *</>
            ) : (
              'Tipo de vínculo *'
            )}
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {RELATIONSHIP_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setRelationship(t)}
                className={`py-2 rounded-xl border text-xs font-medium transition-colors ${
                  relationship === t ? 'bg-cta border-cta text-cta-fg' : 'bg-surface border-border text-ink-2 hover:border-border-2'
                }`}
              >
                {RELATIONSHIP_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-ink-2">Observação</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="Ex.: responsável pelas compras"
            className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink focus:outline-none focus:border-cta"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-ink">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !relative || !relationship}
            className="flex-1 py-2.5 rounded-xl bg-cta text-cta-fg text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Vincular'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Payment form ───────────────────────────────────────────────────────────────

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
      setError(getApiErrorMessage(err, 'Erro ao registrar pagamento.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-border pt-3">
      <div className="space-y-1">
        <label className="text-xs text-ink-2">Valor pago</label>
        <input
          autoFocus
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-lg font-semibold text-ink tabular-nums focus:outline-none focus:border-cta"
        />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setPaymentMethod(m)}
            className={`py-2 rounded-xl border text-xs font-medium transition-all ${paymentMethod === m ? 'bg-cta border-cta text-cta-fg' : 'bg-surface border-border text-ink'}`}
          >
            {PAYMENT_LABELS[m]}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-xl border border-border text-xs text-ink">
          Cancelar
        </button>
        <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl bg-cta text-cta-fg text-xs font-semibold disabled:opacity-50">
          {saving ? 'Salvando...' : 'Confirmar'}
        </button>
      </div>
    </form>
  )
}
