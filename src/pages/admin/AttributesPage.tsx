import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  listEffectiveAttributes,
  createCustomAttribute,
  deleteCustomAttribute,
  labelToKey,
  type AttributeDefinition,
} from '../../services/attributeService'
import { listProductTypes, type ProductType } from '../../services/productTypeService'

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<AttributeDefinition['type'], string> = {
  NUMBER:  'Número',
  ENUM:    'Lista',
  BOOLEAN: 'Sim/Não',
}

const inputClass =
  'w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/60 transition-colors'

// ── Small components ───────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: AttributeDefinition['type'] }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-surface-2 text-ink-3 border border-border">
      {TYPE_LABEL[type]}
    </span>
  )
}

function OnboardingModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-surface/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-border rounded-2xl max-w-md w-full p-7 shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-5">
          <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-ink mb-4">Sobre filtros</h2>

        <div className="space-y-3 text-sm text-ink-2 leading-relaxed">
          <p>
            Filtros são as características que descrevem seus produtos e permitem que os clientes encontrem exatamente o que procuram na sua loja.
          </p>
          <p>
            Cada filtro é reutilizado em todos os produtos da sua loja — por exemplo, "Material" aparece no cadastro de todo produto, mas cada um tem seu próprio valor (Ouro, Prata, etc.). Alguns filtros são obrigatórios (não deixam o produto ser salvo sem um valor), outros são opcionais.
          </p>
          <p className="font-medium text-ink">
            Configure seus filtros com cuidado — eles são muito importantes para a organização da sua loja e para os clientes conseguirem filtrar seus produtos.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-lg bg-cta hover:bg-cta-2 text-cta-fg text-sm font-semibold transition-colors"
        >
          Entendido
        </button>
      </div>
    </div>
  )
}

// ── Create form ────────────────────────────────────────────────────────────────

interface NewAttrForm {
  label: string
  productTypeId?: number
}

const emptyNewAttrForm = (): NewAttrForm => ({
  label: '',
})

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AttributesPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const storeId = user?.id ?? ''

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(searchParams.get('onboarding') === '1')

  function closeOnboarding() {
    setShowOnboarding(false)
    const next = new URLSearchParams(searchParams)
    next.delete('onboarding')
    setSearchParams(next, { replace: true })
  }

  // Data
  const [customAttributes, setCustomAttributes] = useState<AttributeDefinition[]>([])
  const [productTypes, setProductTypes]         = useState<ProductType[]>([])
  const [isLoading, setIsLoading]               = useState(true)
  const [error, setError]                       = useState<string | null>(null)

  // Per-item action state
  const [actingId, setActingId]       = useState<number | null>(null)
  const [actingError, setActingError] = useState<string | null>(null)

  // Create form
  const [isCreating, setIsCreating]     = useState(false)
  const [newAttr, setNewAttr]           = useState<NewAttrForm>(emptyNewAttrForm)
  const [isSaving, setIsSaving]         = useState(false)
  const [createError, setCreateError]   = useState<string | null>(null)

  async function loadAll() {
    if (!storeId) return
    setIsLoading(true)
    setError(null)
    try {
      const [global, types] = await Promise.all([
        listEffectiveAttributes(storeId),
        listProductTypes(storeId),
      ])
      setProductTypes(types)

      // The endpoint without productTypeId returns only global attributes.
      // Fetch per-type lists to also capture type-scoped attributes.
      const perType = await Promise.all(types.map((t) => listEffectiveAttributes(storeId, t.id)))

      const seen = new Set<number>()
      const all = [...global, ...perType.flat()].filter((a) => {
        if (seen.has(a.id)) return false
        seen.add(a.id)
        return true
      })

      setCustomAttributes(all.filter((a) => a.custom))
    } catch {
      setError('Não foi possível carregar os filtros.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [storeId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(attr: AttributeDefinition) {
    if (!window.confirm(`Excluir o atributo "${attr.label}"? Essa ação não pode ser desfeita.`)) return
    setActingId(attr.id)
    setActingError(null)
    try {
      await deleteCustomAttribute(storeId, attr.id)
      setCustomAttributes((prev) => prev.filter((a) => a.id !== attr.id))
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code
      if (code === 'ATTRIBUTE_IN_USE') {
        setActingError(`"${attr.label}" está em uso em algum produto. Remova o valor dos produtos antes de excluir.`)
      } else {
        setActingError('Erro ao excluir atributo.')
      }
    } finally {
      setActingId(null)
    }
  }

  // ── Create form handlers ────────────────────────────────────────────────────

  function setNewField<K extends keyof NewAttrForm>(k: K, value: NewAttrForm[K]) {
    setNewAttr((prev) => ({ ...prev, [k]: value }))
    setCreateError(null)
  }

  function cancelCreate() {
    setIsCreating(false)
    setNewAttr(emptyNewAttrForm())
    setCreateError(null)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const label = newAttr.label.trim()
    if (!label) return

    const key = labelToKey(label)
    if (!key) {
      setCreateError('O nome precisa conter pelo menos uma letra.')
      return
    }

    if (customAttributes.some((a) => a.key === key)) {
      setCreateError('Já existe uma característica com esse nome. Tente um nome diferente.')
      return
    }

    setIsSaving(true)
    setCreateError(null)
    try {
      const created = await createCustomAttribute(storeId, label, key, {
        required: false,
        ...(newAttr.productTypeId != null ? { productTypeId: newAttr.productTypeId } : {}),
      })
      setCustomAttributes((prev) => [...prev, created])
      cancelCreate()
    } catch {
      setCreateError('Não foi possível criar a característica. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}

      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-ink">Meus Filtros</h1>
            <p className="text-sm text-ink-3 mt-0.5">Características que descrevem seus produtos</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowOnboarding(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-ink-3 hover:text-ink-2 hover:bg-surface-2 text-xs font-medium transition-colors"
              title="Sobre filtros"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              Sobre filtros
            </button>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-cta hover:bg-cta-2 text-cta-fg text-sm font-semibold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Adicionar atributo
              </button>
            )}
          </div>
        </div>

        {/* Errors */}
        {(error || actingError) && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <span>{actingError ?? error}</span>
            {error && (
              <button onClick={loadAll} className="shrink-0 text-xs underline hover:text-red-800">
                Tentar novamente
              </button>
            )}
          </div>
        )}

        {/* Create form */}
        {isCreating && (
          <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-border bg-white p-4 space-y-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-ink">Nova característica</p>
              <p className="text-xs text-ink-3 mt-0.5">
                Use com cuidado —{' '}
                <span className="font-medium text-amber-700">características demais podem deixar o cadastro confuso para você e sua equipe.</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={newAttr.label}
                onChange={(e) => setNewField('label', e.target.value)}
                placeholder="ex: Cor, Tamanho, Material, Acabamento"
                className={inputClass}
              />
              <p className="mt-1 text-[11px] text-ink-3">
                Como essa informação vai aparecer no formulário de cada produto.
              </p>
            </div>

            {productTypes.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  Tipo de produto (opcional)
                </label>
                <select
                  value={newAttr.productTypeId ?? ''}
                  onChange={(e) => setNewField('productTypeId', e.target.value ? Number(e.target.value) : undefined)}
                  className={inputClass}
                >
                  <option value="">Geral — aparece em todos os tipos</option>
                  {productTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>{pt.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-ink-3">
                  Deixe em branco para o filtro aparecer em todos os tipos de produto.
                </p>
              </div>
            )}

            <p className="text-[11px] text-ink-3 bg-surface-2 border border-border rounded-lg px-3 py-2">
              Filtros personalizados são listas de opções — você adiciona os valores disponíveis ao cadastrar produtos.
            </p>

            {createError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {createError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelCreate}
                disabled={isSaving}
                className="flex-1 py-2 rounded-lg border border-border text-ink-2 hover:bg-surface-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving || !newAttr.label.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-cta hover:bg-cta-2 text-cta-fg text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {isSaving
                  ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
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
        ) : customAttributes.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-surface-2 border border-border flex items-center justify-center">
              <svg className="w-7 h-7 text-border-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </div>
            <div>
              <p className="text-ink font-semibold text-sm">Nenhum filtro configurado</p>
              <p className="text-ink-3 text-xs mt-1 max-w-xs">
                Adicione filtros para descrever as características dos seus produtos.
              </p>
            </div>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 rounded-lg bg-surface-2 border border-border hover:bg-surface-3 text-ink-2 text-sm font-medium transition-colors"
              >
                Adicionar primeiro filtro
              </button>
            )}
          </div>
        ) : (
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-3">
              Filtros personalizados
            </p>
            <div className="rounded-xl border border-border overflow-hidden bg-white shadow-sm">
              {customAttributes.map((attr, i) => (
                <AttributeRow
                  key={attr.id}
                  attr={attr}
                  productTypes={productTypes}
                  isLast={i === customAttributes.length - 1}
                  isActing={actingId === attr.id}
                  onDelete={() => handleDelete(attr)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}

// ── AttributeRow ───────────────────────────────────────────────────────────────

function AttributeRow({
  attr,
  productTypes,
  isLast,
  isActing,
  onDelete,
}: {
  attr: AttributeDefinition
  productTypes: ProductType[]
  isLast: boolean
  isActing: boolean
  onDelete: () => void
}) {
  const spinner = (
    <span className="w-3 h-3 rounded-full border-2 border-current/30 border-t-current animate-spin inline-block" />
  )

  const typeName = attr.productTypeId
    ? productTypes.find((t) => t.id === attr.productTypeId)?.label
    : null

  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-border' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-ink">{attr.label}</span>
          <TypeBadge type={attr.type} />
          {attr.required && (
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
              Obrigatório
            </span>
          )}
          {attr.unit && (
            <span className="text-[10px] text-ink-3">({attr.unit})</span>
          )}
          {typeName && (
            <span className="text-[10px] text-ink-3 bg-surface-2 border border-border px-1.5 py-0.5 rounded">
              Tipo: {typeName}
            </span>
          )}
        </div>
        {attr.type === 'ENUM' && (
          <p className="text-[11px] mt-0.5">
            {(attr.enumOptions?.length ?? 0) > 0
              ? <span className="text-ink-3">{attr.enumOptions!.length} opç{attr.enumOptions!.length === 1 ? 'ão' : 'ões'}: {attr.enumOptions!.join(', ')}</span>
              : <span className="text-amber-600">Sem opções — adicione ao preencher um produto</span>
            }
          </p>
        )}
      </div>

      <button
        onClick={onDelete}
        disabled={isActing}
        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-wait"
      >
        {isActing ? spinner : 'Excluir'}
      </button>
    </div>
  )
}
