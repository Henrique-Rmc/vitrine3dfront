import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  getApiErrorMessage,
  fmtMoney,
  type PdvCustomerResponse,
  type PdvCustomerRequest,
} from '../../../services/pdvService'

type DebtFilter = 'all' | 'debt' | 'paid'

export default function PdvClientesPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<PdvCustomerResponse[]>([])
  const [search, setSearch] = useState('')
  const [debtFilter, setDebtFilter] = useState<DebtFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  function load() {
    setLoading(true)
    listCustomers()
      .then(setCustomers)
      .catch(() => setError('Erro ao carregar clientes.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = customers
    .filter((c) => {
      const q = search.toLowerCase()
      const matchSearch =
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? '').includes(search) ||
        (c.email ?? '').toLowerCase().includes(q)
      if (!matchSearch) return false
      if (debtFilter === 'debt') return c.openCreditsCount > 0
      if (debtFilter === 'paid') return c.openCreditsCount === 0
      return true
    })
    .sort((a, b) => {
      if (b.totalBalance !== a.totalBalance) return b.totalBalance - a.totalBalance
      return a.name.localeCompare(b.name, 'pt-BR')
    })

  const debtorCount = customers.filter((c) => c.openCreditsCount > 0).length

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Clientes</h1>
          {debtorCount > 0 && (
            <p className="text-xs text-red-500 mt-0.5">{debtorCount} com dívida em aberto</p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-xl bg-cta text-cta-fg text-sm font-semibold"
        >
          + Novo
        </button>
      </div>

      <input
        type="search"
        placeholder="Buscar por nome, telefone ou e-mail..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-cta"
      />

      <div className="flex gap-2">
        {([
          { key: 'all' as const, label: 'Todos' },
          { key: 'debt' as const, label: 'Com dívida' },
          { key: 'paid' as const, label: 'Em dia' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setDebtFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              debtFilter === key
                ? 'bg-cta text-cta-fg'
                : 'bg-canvas border border-border text-ink-2 hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-surface animate-pulse" />)}
        </div>
      )}

      {!loading && error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-center text-ink-2 text-sm py-8">
          {search || debtFilter !== 'all' ? 'Nenhum resultado.' : 'Nenhum cliente cadastrado.'}
        </p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/admin/pdv/clientes/${c.id}`)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-canvas transition-colors text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{c.name}</p>
                <p className="text-xs text-ink-2 truncate">{c.phone ?? c.email ?? 'Sem contato'}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                {c.openCreditsCount > 0 ? (
                  <>
                    <p className="text-sm font-semibold text-red-500 tabular-nums">{fmtMoney(c.totalBalance)}</p>
                    <p className="text-xs text-ink-2">{c.openCreditsCount} fiado(s)</p>
                  </>
                ) : (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">Em dia</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <CustomerModal
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}

export function CustomerModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: PdvCustomerResponse
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<PdvCustomerRequest>(
    initial
      ? { name: initial.name, phone: initial.phone, email: initial.email ?? null, cpf: initial.cpf, address: initial.address }
      : { name: '' },
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError('')
    try {
      if (initial) await updateCustomer(initial.id, form)
      else await createCustomer(form)
      onSaved()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erro ao salvar cliente.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 space-y-4 max-h-[92vh] overflow-y-auto"
      >
        <h2 className="text-base font-bold text-ink">{initial ? 'Editar cliente' : 'Novo Cliente'}</h2>

        <Field label="Nome *" required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            maxLength={100}
            className={inputClass}
            autoFocus
          />
        </Field>
        <Field label="Telefone">
          <input
            type="tel"
            value={form.phone ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value || null }))}
            className={inputClass}
          />
        </Field>
        <Field label="E-mail">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.email ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value || null }))}
            placeholder="nome@exemplo.com"
            className={inputClass}
          />
        </Field>
        <Field label="CPF">
          <input
            type="text"
            value={form.cpf ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value || null }))}
            maxLength={14}
            className={inputClass}
          />
        </Field>
        <Field label="Endereço">
          <input
            type="text"
            value={form.address ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value || null }))}
            maxLength={200}
            className={inputClass}
          />
        </Field>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-ink">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-cta text-cta-fg text-sm font-semibold disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}

const inputClass = 'w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink focus:outline-none focus:border-cta'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-ink-2">{label}{required && ' *'}</label>
      {children}
    </div>
  )
}
