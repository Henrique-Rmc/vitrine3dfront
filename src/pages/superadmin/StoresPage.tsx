import { useEffect, useState, useCallback } from 'react'
import {
  listAdminStores,
  toggleStoreActive,
  deleteAdminStore,
  updateSubscription,
  type AdminStoreResponse,
  type AdminStoreFilter,
} from '../../services/adminService'

// ── Badge helpers ─────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    FREE: 'bg-surface-2 text-ink-2 border-border',
    BASIC: 'bg-blue-50 text-blue-700 border-blue-200',
    PRO: 'bg-amber-50 text-amber-700 border-amber-200',
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
      <div className="bg-white border border-border rounded-2xl px-6 py-6 max-w-sm w-full shadow-xl">
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

  const PAGE_SIZE = 20

  const load = useCallback(
    (f: AdminStoreFilter, p: number) => {
      setLoading(true)
      setError(false)
      listAdminStores(f, p, PAGE_SIZE)
        .then((res) => {
          setStores(res.content)
          setTotal(res.totalElements)
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false))
    },
    [],
  )

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

  async function handlePlanChange(id: string, plan: 'FREE' | 'BASIC' | 'PRO') {
    setActionLoading(id)
    try {
      const updated = await updateSubscription(id, { plan })
      setStores((prev) => prev.map((s) => (s.id === id ? updated : s)))
    } finally {
      setActionLoading(null)
    }
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-ink">
          Lojas
          {total > 0 && <span className="ml-2 text-sm font-normal text-ink-3">({total})</span>}
        </h1>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border rounded-xl px-4 py-4 mb-4 flex flex-wrap gap-3 items-end">
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
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wide">Loja</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wide">E-mail</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wide">Plano</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-2">
                {stores.map((store) => {
                  const isActing = actionLoading === store.id
                  return (
                    <tr key={store.id} className={`transition-colors ${store.isActive ? '' : 'opacity-60'}`}>
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
                          <select
                            value={store.subscription?.plan ?? 'FREE'}
                            onChange={(e) => handlePlanChange(store.id, e.target.value as 'FREE' | 'BASIC' | 'PRO')}
                            disabled={isActing}
                            className="mt-1 rounded border border-border bg-surface-2 px-1 py-0.5 text-xs text-ink-2 focus:outline-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="FREE">FREE</option>
                            <option value="BASIC">BASIC</option>
                            <option value="PRO">PRO</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={store.subscription?.status ?? 'TRIAL'} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {isActing ? (
                            <span className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                          ) : (
                            <>
                              <button
                                onClick={() => handleToggle(store.id)}
                                title={store.isActive ? 'Desativar' : 'Ativar'}
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
                                title="Excluir"
                                className="p-1.5 rounded-lg text-ink-4 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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
