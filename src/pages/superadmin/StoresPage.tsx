import { useEffect, useState, useCallback } from 'react'
import {
  listAdminStores,
  toggleStoreActive,
  deleteAdminStore,
  updateSubscription,
  extendTrial,
  type AdminStoreResponse,
  type AdminStoreFilter,
  type SubscriptionUpdateRequest,
} from '../../services/adminService'
import { listPublicProducts } from '../../services/productService'
import type { Product } from '../../types'

// ── Badge helpers ─────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    FREE: 'bg-surface-2 text-ink-2 border-border',
    BASIC: 'bg-blue-50 text-blue-700 border-blue-200',
    PRO: 'bg-amber-50 text-amber-700 border-amber-200',
    PREMIUM: 'bg-purple-50 text-purple-700 border-purple-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${styles[plan] ?? styles.FREE}`}>
      {plan}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    TRIAL: 'bg-purple-50 text-purple-700 border-purple-200',
    ACTIVE: 'bg-green-50 text-green-700 border-green-200',
    PAST_DUE: 'bg-red-50 text-red-700 border-red-200',
    CANCELLED: 'bg-surface-2 text-ink-3 border-border',
    EXPIRED: 'bg-red-50 text-red-700 border-red-200',
  }
  const labels: Record<string, string> = {
    TRIAL: 'Trial',
    ACTIVE: 'Ativo',
    PAST_DUE: 'Pendente',
    CANCELLED: 'Cancelado',
    EXPIRED: 'Expirado',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${styles[status] ?? styles.CANCELLED}`}>
      {labels[status] ?? status}
    </span>
  )
}

// ── Store management modal ────────────────────────────────────────────────────

function StoreManagementModal({
  store,
  onClose,
  onUpdated,
}: {
  store: AdminStoreResponse
  onClose: () => void
  onUpdated: (updated: AdminStoreResponse) => void
}) {
  const sub = store.subscription
  const [plan, setPlan] = useState<'FREE' | 'BASIC' | 'PRO' | 'PREMIUM'>(sub?.plan ?? 'FREE')
  const [status, setStatus] = useState(sub?.status ?? 'TRIAL')
  const [trialEndsAt, setTrialEndsAt] = useState(
    sub?.trialEndsAt ? sub.trialEndsAt.slice(0, 10) : '',
  )
  const [expiresAt, setExpiresAt] = useState(
    sub?.expiresAt ? sub.expiresAt.slice(0, 10) : '',
  )
  const [paymentProvider, setPaymentProvider] = useState(sub?.paymentProvider ?? '')
  const [externalId, setExternalId] = useState(sub?.externalId ?? '')

  const [saving, setSaving] = useState(false)
  const [extendDays, setExtendDays] = useState('')
  const [extending, setExtending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  async function handleSave() {
    setSaving(true)
    setFeedback(null)
    try {
      const payload: SubscriptionUpdateRequest = {
        plan,
        status: status as SubscriptionUpdateRequest['status'],
        trialEndsAt: trialEndsAt ? trialEndsAt + 'T00:00:00Z' : null,
        expiresAt: expiresAt ? expiresAt + 'T00:00:00Z' : null,
        paymentProvider: paymentProvider
          ? (paymentProvider as SubscriptionUpdateRequest['paymentProvider'])
          : undefined,
        externalId: externalId || undefined,
      }
      const updated = await updateSubscription(store.id, payload)
      onUpdated(updated)
      setFeedback({ type: 'success', msg: 'Assinatura atualizada com sucesso.' })
    } catch {
      setFeedback({ type: 'error', msg: 'Erro ao atualizar. Tente novamente.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleExtend() {
    const days = parseInt(extendDays, 10)
    if (!days || days < 1) return
    setExtending(true)
    setFeedback(null)
    try {
      const updated = await extendTrial(store.id, days)
      onUpdated(updated)
      setExtendDays('')
      const newTrialEnd = updated.subscription?.trialEndsAt
      if (newTrialEnd) setTrialEndsAt(newTrialEnd.slice(0, 10))
      setFeedback({ type: 'success', msg: `Trial estendido em ${days} dias.` })
    } catch {
      setFeedback({ type: 'error', msg: 'Erro ao estender trial.' })
    } finally {
      setExtending(false)
    }
  }

  const inputCls =
    'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-brand/40'

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-canvas border border-border rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-ink">{store.storeName}</h2>
            <p className="text-xs text-ink-3">
              @{store.slug} · {store.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-4 hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Current state */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-2 border border-border">
            <PlanBadge plan={sub?.plan ?? 'FREE'} />
            <StatusBadge status={sub?.status ?? 'TRIAL'} />
            {sub?.trialEndsAt && (
              <span className="text-xs text-ink-3 ml-auto">
                Trial até {new Date(sub.trialEndsAt).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>

          {/* Subscription fields */}
          <div>
            <p className="text-xs font-semibold text-ink-2 uppercase tracking-wide mb-3">Assinatura</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">Plano</label>
                <select value={plan} onChange={(e) => setPlan(e.target.value as typeof plan)} className={inputCls}>
                  <option value="FREE">FREE</option>
                  <option value="BASIC">BASIC</option>
                  <option value="PRO">PRO</option>
                  <option value="PREMIUM">PREMIUM</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                  <option value="TRIAL">Trial</option>
                  <option value="ACTIVE">Ativo</option>
                  <option value="PAST_DUE">Pendente</option>
                  <option value="CANCELLED">Cancelado</option>
                  <option value="EXPIRED">Expirado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">Fim do Trial</label>
                <input
                  type="date"
                  value={trialEndsAt}
                  onChange={(e) => setTrialEndsAt(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">Expiração</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">Provedor de Pagamento</label>
                <select value={paymentProvider} onChange={(e) => setPaymentProvider(e.target.value)} className={inputCls}>
                  <option value="">— Nenhum —</option>
                  <option value="STRIPE">Stripe</option>
                  <option value="PAGSEGURO">PagSeguro</option>
                  <option value="ASAAS">Asaas</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">ID Externo</label>
                <input
                  type="text"
                  value={externalId}
                  onChange={(e) => setExternalId(e.target.value)}
                  placeholder="sub_xxx…"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Extend trial */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-ink-2 uppercase tracking-wide mb-3">Estender Trial</p>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                placeholder="Quantidade de dias"
                className={`flex-1 ${inputCls}`}
              />
              <button
                onClick={handleExtend}
                disabled={extending || !extendDays || parseInt(extendDays, 10) < 1}
                className="px-4 py-2 rounded-lg border border-border bg-surface-2 hover:bg-surface-3 text-sm font-semibold text-ink-2 disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                {extending ? '…' : '+ Estender'}
              </button>
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <p className={`text-xs font-medium ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {feedback.type === 'success' ? '✓ ' : '✕ '}{feedback.msg}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border bg-surface-2 hover:bg-surface-3 text-sm font-medium text-ink-2 transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-cta hover:bg-cta-2 text-cta-fg text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Store products modal ──────────────────────────────────────────────────────

function StoreProductsModal({
  store,
  onClose,
}: {
  store: AdminStoreResponse
  onClose: () => void
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(
    (p: number) => {
      setLoading(true)
      listPublicProducts(store.id, p, 15)
        .then((res) => {
          setProducts(res.content)
          setTotalPages(res.totalPages)
          setTotal(res.totalElements)
          setPage(p)
        })
        .catch(() => setError('Erro ao carregar produtos.'))
        .finally(() => setLoading(false))
    },
    [store.id],
  )

  useEffect(() => {
    load(0)
  }, [load])

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-canvas border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-ink">{store.storeName}</h2>
            <p className="text-xs text-ink-3">
              @{store.slug} · {total} produto{total !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-4 hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-12">
              <span className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            </div>
          )}

          {!loading && error && (
            <p className="text-center text-ink-3 text-sm py-12">{error}</p>
          )}

          {!loading && !error && products.length === 0 && (
            <p className="text-center text-ink-3 text-sm py-12">Nenhum produto visível.</p>
          )}

          {!loading && !error && products.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-2 uppercase tracking-wide">
                    Produto
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-ink-2 uppercase tracking-wide">
                    Preço
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-ink-2 uppercase tracking-wide">
                    Visível
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-2">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-surface transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-8 h-8 rounded object-cover shrink-0 bg-surface-2"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-surface-2 shrink-0" />
                        )}
                        <span className="font-medium text-ink truncate max-w-xs">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-ink-2 tabular-nums">
                      {p.price != null
                        ? p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {p.isVisible ? (
                        <span className="text-green-600 text-xs font-semibold">Sim</span>
                      ) : (
                        <span className="text-ink-3 text-xs">Não</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between shrink-0">
            <p className="text-xs text-ink-3">
              Página {page + 1} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => load(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-border bg-surface-2 text-xs font-medium text-ink-2 disabled:opacity-40 transition-colors"
              >
                ← Anterior
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => load(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-border bg-surface-2 text-xs font-medium text-ink-2 disabled:opacity-40 transition-colors"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Confirm dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-canvas border border-border rounded-2xl px-6 py-6 max-w-sm w-full shadow-xl">
        <p className="text-sm text-ink mb-4">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border bg-surface-2 hover:bg-surface-3 text-ink-2 text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SuperadminStoresPage() {
  const [stores, setStores] = useState<AdminStoreResponse[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [filter, setFilter] = useState<AdminStoreFilter>({})
  const [searchInput, setSearchInput] = useState('')

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [productsModal, setProductsModal] = useState<AdminStoreResponse | null>(null)
  const [managementModal, setManagementModal] = useState<AdminStoreResponse | null>(null)

  const PAGE_SIZE = 20

  const load = useCallback((f: AdminStoreFilter, p: number) => {
    setLoading(true)
    setError(false)
    listAdminStores(f, p, PAGE_SIZE)
      .then((res) => {
        setStores(res.content)
        setTotal(res.totalElements)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load(filter, page)
  }, [filter, page, load])

  function applySearch() {
    const f = { ...filter, search: searchInput.trim() || undefined }
    setFilter(f)
    setPage(0)
  }

  function setFilterKey<K extends keyof AdminStoreFilter>(key: K, value: AdminStoreFilter[K]) {
    setFilter((prev) => ({ ...prev, [key]: value || undefined }))
    setPage(0)
  }

  async function handleToggle(id: string) {
    setActionLoading(id)
    try {
      const updated = await toggleStoreActive(id)
      setStores((prev) => prev.map((s) => (s.id === id ? updated : s)))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(id: string) {
    setConfirmDelete(null)
    setActionLoading(id)
    try {
      await deleteAdminStore(id)
      setStores((prev) => prev.filter((s) => s.id !== id))
      setTotal((t) => t - 1)
    } finally {
      setActionLoading(null)
    }
  }

  function handleSubscriptionUpdated(updated: AdminStoreResponse) {
    setStores((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    // Sync the open modal's store reference so badges update live
    setManagementModal((current) => (current?.id === updated.id ? updated : current))
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      {confirmDelete && (
        <ConfirmDialog
          message="Tem certeza que deseja excluir esta loja? Esta ação não pode ser desfeita."
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {productsModal && (
        <StoreProductsModal store={productsModal} onClose={() => setProductsModal(null)} />
      )}

      {managementModal && (
        <StoreManagementModal
          store={managementModal}
          onClose={() => setManagementModal(null)}
          onUpdated={handleSubscriptionUpdated}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-ink">
          Lojas
          {total > 0 && <span className="ml-2 text-sm font-normal text-ink-3">({total})</span>}
        </h1>
      </div>

      {/* Filters */}
      <div className="bg-canvas border border-border rounded-xl px-4 py-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="block text-xs font-medium text-ink-2 mb-1">Busca</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              placeholder="Nome, e-mail, slug…"
              className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
            <button
              onClick={applySearch}
              className="px-3 py-2 rounded-lg bg-cta hover:bg-cta-2 text-cta-fg text-sm transition-colors"
            >
              Buscar
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-2 mb-1">Status</label>
          <select
            value={filter.active == null ? '' : String(filter.active)}
            onChange={(e) => {
              const v = e.target.value
              setFilterKey('active', v === '' ? undefined : v === 'true')
            }}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40 cursor-pointer"
          >
            <option value="">Todos</option>
            <option value="true">Ativas</option>
            <option value="false">Inativas</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-2 mb-1">Plano</label>
          <select
            value={filter.plan ?? ''}
            onChange={(e) => setFilterKey('plan', e.target.value as AdminStoreFilter['plan'])}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40 cursor-pointer"
          >
            <option value="">Todos</option>
            <option value="FREE">FREE</option>
            <option value="BASIC">BASIC</option>
            <option value="PRO">PRO</option>
            <option value="PREMIUM">PREMIUM</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-2 mb-1">Assinatura</label>
          <select
            value={filter.status ?? ''}
            onChange={(e) => setFilterKey('status', e.target.value as AdminStoreFilter['status'])}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40 cursor-pointer"
          >
            <option value="">Todos</option>
            <option value="TRIAL">Trial</option>
            <option value="ACTIVE">Ativo</option>
            <option value="PAST_DUE">Pendente</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="EXPIRED">Expirado</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <span className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-ink-3 text-sm">
          Erro ao carregar lojas.{' '}
          <button onClick={() => load(filter, page)} className="text-brand hover:underline">
            Tentar novamente
          </button>
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-16 text-ink-3 text-sm">Nenhuma loja encontrada.</div>
      ) : (
        <div className="bg-canvas border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wide">
                    Loja
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wide">
                    E-mail
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wide">
                    Tipo
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wide">
                    Plano / Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wide">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-2">
                {stores.map((store) => {
                  const isActing = actionLoading === store.id
                  return (
                    <tr
                      key={store.id}
                      className={`transition-colors ${store.isActive ? '' : 'opacity-60'}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink truncate max-w-40">{store.storeName}</p>
                        <p className="text-xs text-ink-3">@{store.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-2 truncate max-w-48">
                        {store.email}
                        {!store.emailVerified && (
                          <span className="ml-1.5 text-[10px] text-amber-600 font-semibold border border-amber-300 bg-amber-50 rounded px-1 py-0.5">
                            pendente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-ink-3">
                          {store.profileType === 'AFFILIATE' ? 'Afiliado' : 'Padrão'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <PlanBadge plan={store.subscription?.plan ?? 'FREE'} />
                          <StatusBadge status={store.subscription?.status ?? 'TRIAL'} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {isActing ? (
                            <span className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                          ) : (
                            <>
                              <button
                                onClick={() => setManagementModal(store)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border bg-brand/10 hover:bg-brand/20 text-brand border-brand/20"
                              >
                                Gerenciar
                              </button>
                              <button
                                onClick={() => setProductsModal(store)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border bg-surface-2 hover:bg-surface-3 text-ink-2 border-border"
                              >
                                Produtos
                              </button>
                              <button
                                onClick={() => handleToggle(store.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                                  store.isActive
                                    ? 'bg-surface-2 hover:bg-red-50 text-ink-2 hover:text-red-600 border-border hover:border-red-200'
                                    : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                                }`}
                              >
                                {store.isActive ? 'Desativar' : 'Ativar'}
                              </button>
                              <button
                                onClick={() => setConfirmDelete(store.id)}
                                className="p-1.5 rounded-lg text-ink-4 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                  />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-border px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-ink-3">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
