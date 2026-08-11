import { useEffect, useState } from 'react'
import {
  listEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  verifyPin,
  ROLE_LABELS,
  type PdvEmployeeResponse,
  type PdvEmployeeRequest,
  type EmployeeRole,
} from '../../../services/pdvService'

const ROLES: EmployeeRole[] = ['OWNER', 'MANAGER', 'CASHIER']

export default function PdvFuncionariosPage() {
  const [employees, setEmployees] = useState<PdvEmployeeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState<'new' | PdvEmployeeResponse | null>(null)
  const [showPin, setShowPin] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState<PdvEmployeeResponse | null>(null)

  function load() {
    setLoading(true)
    listEmployees()
      .then(setEmployees)
      .catch(() => setError('Erro ao carregar equipe.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleDeactivate(emp: PdvEmployeeResponse) {
    try {
      await deactivateEmployee(emp.id)
      setConfirmDeactivate(null)
      load()
    } catch {
      setError('Erro ao desativar.')
    }
  }

  const active = employees.filter((e) => e.isActive)
  const inactive = employees.filter((e) => !e.isActive)

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Equipe</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPin(true)}
            className="px-3 py-2 rounded-xl border border-border text-sm text-ink hover:bg-canvas"
          >
            Verificar PIN
          </button>
          <button
            onClick={() => setShowForm('new')}
            className="px-4 py-2 rounded-xl bg-cta text-cta-fg text-sm font-semibold"
          >
            + Novo
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-surface animate-pulse" />)}
        </div>
      )}

      {!loading && error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {!loading && !error && active.length === 0 && (
        <p className="text-center text-ink-2 text-sm py-8">Nenhum funcionário ativo.</p>
      )}

      {!loading && !error && active.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
          {active.map((emp) => (
            <div key={emp.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">{emp.name}</p>
                <p className="text-xs text-ink-2">{ROLE_LABELS[emp.role]}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(emp)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs text-ink hover:bg-canvas"
                >
                  Editar
                </button>
                <button
                  onClick={() => setConfirmDeactivate(emp)}
                  className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-700 text-xs text-red-500"
                >
                  Desativar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {inactive.length > 0 && (
        <details className="text-sm">
          <summary className="text-ink-2 cursor-pointer select-none">
            {inactive.length} funcionário(s) inativo(s)
          </summary>
          <div className="mt-2 rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden opacity-60">
            {inactive.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between px-4 py-3">
                <p className="text-sm text-ink">{emp.name}</p>
                <p className="text-xs text-ink-2">{ROLE_LABELS[emp.role]}</p>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Confirm deactivate */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 space-y-4">
            <p className="text-sm font-medium text-ink">
              Desativar {confirmDeactivate.name}?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeactivate(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-ink">Não</button>
              <button onClick={() => handleDeactivate(confirmDeactivate)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold">Desativar</button>
            </div>
          </div>
        </div>
      )}

      {/* Employee form */}
      {showForm && (
        <EmployeeModal
          initial={showForm === 'new' ? null : showForm}
          onClose={() => setShowForm(null)}
          onSaved={() => { setShowForm(null); load() }}
        />
      )}

      {/* PIN verify */}
      {showPin && <PinModal onClose={() => setShowPin(false)} />}
    </div>
  )
}

function EmployeeModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: PdvEmployeeResponse | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<PdvEmployeeRequest>({
    name: initial?.name ?? '',
    pin: '',
    role: initial?.role ?? 'CASHIER',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError('')
    try {
      const payload: PdvEmployeeRequest = {
        name: form.name,
        role: form.role,
        pin: form.pin?.trim() || undefined,
      }
      if (initial) {
        await updateEmployee(initial.id, payload)
      } else {
        await createEmployee(payload)
      }
      onSaved()
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Erro ao salvar.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 space-y-4">
        <h2 className="text-base font-bold text-ink">{initial ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>

        <div className="space-y-1">
          <label className="text-xs text-ink-2">Nome *</label>
          <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            maxLength={100} autoFocus
            className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink focus:outline-none focus:border-cta" />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-ink-2">
            PIN (4–6 dígitos){initial ? ' — deixe vazio para manter' : ' *'}
          </label>
          <input
            type="password" inputMode="numeric" value={form.pin ?? ''} onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))}
            minLength={initial ? 0 : 4} maxLength={6} pattern="\d*"
            className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink focus:outline-none focus:border-cta" />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-ink-2">Função</label>
          <div className="grid grid-cols-3 gap-1.5">
            {ROLES.map((r) => (
              <button
                key={r} type="button"
                onClick={() => setForm((f) => ({ ...f, role: r }))}
                className={`py-2 rounded-xl border text-xs font-medium transition-all ${form.role === r ? 'bg-cta border-cta text-cta-fg' : 'bg-surface border-border text-ink'}`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
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

function PinModal({ onClose }: { onClose: () => void }) {
  const [pin, setPin] = useState('')
  const [result, setResult] = useState<PdvEmployeeResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pin.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const emp = await verifyPin({ pin })
      setResult(emp)
    } catch (err) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code
      setError(code === 'INVALID_PIN' ? 'PIN incorreto.' : code === 'EMPLOYEE_INACTIVE' ? 'Funcionário inativo.' : 'Erro ao verificar PIN.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 space-y-4">
        <h2 className="text-base font-bold text-ink">Verificar PIN</h2>

        {result ? (
          <div className="text-center space-y-2 py-2">
            <p className="text-2xl">✓</p>
            <p className="text-base font-semibold text-ink">{result.name}</p>
            <p className="text-sm text-ink-2">{ROLE_LABELS[result.role]}</p>
            <button onClick={onClose} className="mt-2 w-full py-2.5 rounded-xl bg-cta text-cta-fg text-sm font-semibold">Fechar</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password" inputMode="numeric"
              value={pin} onChange={(e) => setPin(e.target.value)}
              placeholder="Digite o PIN" maxLength={6} pattern="\d*" autoFocus
              className="w-full px-3 py-3 rounded-xl border border-border bg-canvas text-ink text-center text-2xl tracking-widest font-bold focus:outline-none focus:border-cta"
            />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-ink">Cancelar</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-cta text-cta-fg text-sm font-semibold disabled:opacity-50">
                {loading ? '...' : 'Verificar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
