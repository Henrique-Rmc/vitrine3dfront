import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ErrorBanner from '../../components/ErrorBanner'
import {
  listProductTypes,
  createProductType,
  deleteProductType,
  type ProductType,
} from '../../services/productTypeService'
import { labelToKey } from '../../services/attributeService'

const inputClass =
  'w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/60 transition-colors'

export default function ProductTypesPage() {
  const { user } = useAuth()
  const storeId = user?.id ?? ''

  const [types, setTypes]     = useState<ProductType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const [isCreating, setIsCreating] = useState(false)
  const [newLabel, setNewLabel]     = useState('')
  const [isSaving, setIsSaving]     = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [actingId, setActingId]       = useState<number | null>(null)
  const [actingError, setActingError] = useState<string | null>(null)

  async function load() {
    if (!storeId) return
    setIsLoading(true)
    setError(null)
    try {
      setTypes(await listProductTypes(storeId))
    } catch {
      setError('Não foi possível carregar os tipos de produto.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [storeId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const label = newLabel.trim()
    if (!label) return

    const key = labelToKey(label)
    if (!key) { setCreateError('O nome precisa conter pelo menos uma letra.'); return }
    if (types.some((t) => t.key === key)) {
      setCreateError('Já existe um tipo com esse nome. Tente um nome diferente.')
      return
    }

    setIsSaving(true)
    setCreateError(null)
    try {
      const created = await createProductType(storeId, { key, label, sortOrder: types.length })
      setTypes((prev) => [...prev, created])
      setNewLabel('')
      setIsCreating(false)
    } catch {
      setCreateError('Não foi possível criar o tipo. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(type: ProductType) {
    if (!window.confirm(`Excluir o tipo "${type.label}"? Essa ação não pode ser desfeita.`)) return
    setActingId(type.id)
    setActingError(null)
    try {
      await deleteProductType(storeId, type.id)
      setTypes((prev) => prev.filter((t) => t.id !== type.id))
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code
      setActingError(
        code === 'PRODUCT_TYPE_IN_USE'
          ? `"${type.label}" ainda está em uso em algum produto. Remova o tipo dos produtos antes de excluir.`
          : 'Erro ao excluir tipo.',
      )
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">Tipos de Produto</h1>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-cta hover:bg-cta-2 text-cta-fg text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Adicionar tipo
          </button>
        )}
      </div>

      {/* Info banner */}
      <div className="mb-6 flex items-start gap-3 rounded-xl bg-warning-bg border border-warning-border px-4 py-3 text-sm text-warning-text">
        <svg className="w-4 h-4 shrink-0 mt-0.5 text-warning-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <p>
          Os tipos de produtos são os produtos que você trabalha na sua loja. Se trabalha com roupas,
          pode ter os tipos Camisa, Calça, Shorts — cada produto cadastrado precisará ter um tipo.
        </p>
      </div>

      {/* Errors */}
      {(error || actingError) && (
        <ErrorBanner className="mb-4" action={error ? { label: 'Tentar novamente', onClick: load } : undefined}>
          {actingError ?? error}
        </ErrorBanner>
      )}

      {/* Create form */}
      {isCreating && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-border bg-canvas p-4 space-y-4 shadow-sm">
          <p className="text-sm font-semibold text-ink">Novo tipo de produto</p>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={newLabel}
              onChange={(e) => { setNewLabel(e.target.value); setCreateError(null) }}
              placeholder="ex: Camisa, Action Figure, Colar, Calça"
              className={inputClass}
            />
          </div>

          {createError && (
            <ErrorBanner compact>
              {createError}
            </ErrorBanner>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setIsCreating(false); setNewLabel(''); setCreateError(null) }}
              disabled={isSaving}
              className="flex-1 py-2 rounded-lg border border-border text-ink-2 hover:bg-surface-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !newLabel.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-cta hover:bg-cta-2 text-cta-fg text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {isSaving
                ? <span className="w-4 h-4 rounded-full border-2 border-cta-fg/40 border-t-cta-fg animate-spin" />
                : 'Adicionar'}
            </button>
          </div>
        </form>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <span className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        </div>
      ) : types.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-surface-2 border border-border flex items-center justify-center">
            <svg className="w-7 h-7 text-border-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
          </div>
          <div>
            <p className="text-ink font-semibold text-sm">Nenhum tipo criado</p>
            <p className="text-ink-3 text-xs mt-1 max-w-xs">
              Crie pelo menos um tipo de produto para poder cadastrar produtos na sua loja.
            </p>
          </div>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 rounded-lg bg-surface-2 border border-border hover:bg-surface-3 text-ink-2 text-sm font-medium transition-colors"
            >
              Adicionar primeiro tipo
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-canvas shadow-sm">
          {types.map((type, i) => {
            const isActing = actingId === type.id
            const isLast = i === types.length - 1
            return (
              <div
                key={type.id}
                className={`flex items-center gap-3 px-4 py-3.5 ${!isLast ? 'border-b border-border' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">{type.label}</p>
                </div>
                <Link
                  to={`/admin/products?typeId=${type.id}`}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-3 hover:text-ink-2 hover:bg-surface-2 border border-border transition-colors"
                >
                  Ver produtos
                </Link>
                <button
                  onClick={() => handleDelete(type)}
                  disabled={isActing}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                  {isActing
                    ? <span className="w-3 h-3 rounded-full border-2 border-current/30 border-t-current animate-spin inline-block" />
                    : 'Excluir'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
