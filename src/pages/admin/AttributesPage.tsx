import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  listEffectiveAttributes,
  listGlobalAttributes,
  createCustomAttribute,
  hideGlobalAttribute,
  unhideGlobalAttribute,
  deleteCustomAttribute,
  labelToKey,
  type AttributeDefinition,
} from '../../services/attributeService'

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: AttributeDefinition['type']; label: string }[] = [
  { value: 'TEXT',    label: 'Texto livre' },
  { value: 'NUMBER',  label: 'Número' },
  { value: 'ENUM',    label: 'Lista de opções' },
  { value: 'BOOLEAN', label: 'Sim / Não' },
  { value: 'DATE',    label: 'Data' },
]

const TYPE_LABEL: Record<AttributeDefinition['type'], string> = {
  TEXT:    'Texto',
  NUMBER:  'Número',
  ENUM:    'Lista',
  BOOLEAN: 'Sim/Não',
  DATE:    'Data',
}

const inputClass =
  'w-full rounded-lg bg-[#f4f1eb] border border-[#e8e2d8] px-3 py-2 text-sm text-[#1c1813] placeholder-[#c4b8ae] focus:outline-none focus:ring-2 focus:ring-[#c9922c]/40 focus:border-[#c9922c]/60 transition-colors'

// ── Small components ───────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: AttributeDefinition['type'] }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-[#f4f1eb] text-[#9c8e84] border border-[#e8e2d8]">
      {TYPE_LABEL[type]}
    </span>
  )
}

function OnboardingModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-[#faf8f5]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#e8e2d8] rounded-2xl max-w-md w-full p-7 shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-5">
          <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-[#1c1813] mb-4">Sobre atributos</h2>

        <div className="space-y-3 text-sm text-[#6b5d52] leading-relaxed">
          <p>
            Atributos são as características que descrevem seus produtos e funcionam como filtros para quem visita sua loja.
          </p>
          <p>
            Cada atributo é reutilizado em todos os produtos da sua loja — por exemplo, "Material" aparece no cadastro de todo produto, mas cada um tem seu próprio valor (Ouro, Prata, etc.). Alguns atributos são obrigatórios (não deixam o produto ser salvo sem um valor), outros são opcionais.
          </p>
          <p className="font-medium text-[#1c1813]">
            Cadastre seus atributos com cuidado — eles são muito importantes para a organização da sua loja e para os clientes conseguirem filtrar seus produtos.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-lg bg-[#1c1813] hover:bg-[#2c2620] text-white text-sm font-semibold transition-colors"
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
  type: AttributeDefinition['type']
  unit: string
}

const emptyNewAttrForm = (): NewAttrForm => ({
  label: '',
  type: 'TEXT',
  unit: '',
})

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AttributesPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const storeId = user?.id ?? ''
  const businessTypeId = user?.businessTypeId ?? null

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(searchParams.get('onboarding') === '1')

  function closeOnboarding() {
    setShowOnboarding(false)
    const next = new URLSearchParams(searchParams)
    next.delete('onboarding')
    setSearchParams(next, { replace: true })
  }

  // Data
  const [globalAttributes, setGlobalAttributes] = useState<AttributeDefinition[]>([])
  const [effectiveKeys, setEffectiveKeys]         = useState<Set<string>>(new Set())
  const [customAttributes, setCustomAttributes]   = useState<AttributeDefinition[]>([])
  const [isLoading, setIsLoading]                 = useState(true)
  const [error, setError]                         = useState<string | null>(null)

  // Per-item action state
  const [actingId, setActingId]     = useState<number | null>(null)
  const [actingError, setActingError] = useState<string | null>(null)

  // Create form
  const [isCreating, setIsCreating] = useState(false)
  const [newAttr, setNewAttr]       = useState<NewAttrForm>(emptyNewAttrForm)
  const [isSaving, setIsSaving]     = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  async function loadAll() {
    if (!storeId) return
    setIsLoading(true)
    setError(null)
    try {
      const [effective, globals] = await Promise.all([
        listEffectiveAttributes(storeId),
        businessTypeId ? listGlobalAttributes(businessTypeId) : Promise.resolve([]),
      ])

      const keys = new Set(
        effective.filter((a) => !a.custom).map((a) => a.key),
      )
      setEffectiveKeys(keys)
      setCustomAttributes(effective.filter((a) => a.custom))
      setGlobalAttributes(globals)
    } catch {
      setError('Não foi possível carregar os atributos.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [storeId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Global attribute actions ────────────────────────────────────────────────

  async function handleHide(attr: AttributeDefinition) {
    setActingId(attr.id)
    setActingError(null)
    try {
      await hideGlobalAttribute(storeId, attr.id)
      setEffectiveKeys((prev) => { const next = new Set(prev); next.delete(attr.key); return next })
    } catch {
      setActingError('Erro ao ocultar atributo.')
    } finally {
      setActingId(null)
    }
  }

  async function handleUnhide(attr: AttributeDefinition) {
    setActingId(attr.id)
    setActingError(null)
    try {
      await unhideGlobalAttribute(storeId, attr.id)
      setEffectiveKeys((prev) => new Set([...prev, attr.key]))
    } catch {
      setActingError('Erro ao reexibir atributo.')
    } finally {
      setActingId(null)
    }
  }

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

    // Key is auto-generated — invisible to the user
    const key = labelToKey(label)
    if (!key) {
      setCreateError('O nome precisa conter pelo menos uma letra.')
      return
    }

    const allKeys = [
      ...globalAttributes.map((a) => a.key),
      ...customAttributes.map((a) => a.key),
    ]
    if (allKeys.includes(key)) {
      setCreateError('Já existe uma característica com esse nome. Tente um nome diferente.')
      return
    }

    setIsSaving(true)
    setCreateError(null)
    try {
      const created = await createCustomAttribute(storeId, label, key, {
        type: newAttr.type,
        unit: newAttr.unit.trim() || undefined,
        required: false,
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

  const hiddenGlobals   = globalAttributes.filter((a) => !effectiveKeys.has(a.key))
  const visibleGlobals  = globalAttributes.filter((a) => effectiveKeys.has(a.key))
  const hasAnyAttribute = visibleGlobals.length > 0 || customAttributes.length > 0 || hiddenGlobals.length > 0

  return (
    <>
      {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}

      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#1c1813]">Meus Atributos</h1>
            <p className="text-sm text-[#9c8e84] mt-0.5">Características que descrevem seus produtos</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowOnboarding(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e8e2d8] text-[#9c8e84] hover:text-[#6b5d52] hover:bg-[#f4f1eb] text-xs font-medium transition-colors"
              title="Sobre atributos"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              Sobre atributos
            </button>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#1c1813] hover:bg-[#2c2620] text-white text-sm font-semibold transition-colors"
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
          <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-[#e8e2d8] bg-white p-4 space-y-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-[#1c1813]">Nova característica</p>
              <p className="text-xs text-[#9c8e84] mt-0.5">
                Use com cuidado —{' '}
                <span className="font-medium text-amber-700">características demais podem deixar o cadastro confuso para você e sua equipe.</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6b5d52] mb-1">
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
              <p className="mt-1 text-[11px] text-[#9c8e84]">
                Como essa informação vai aparecer no formulário de cada produto.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6b5d52] mb-1">
                Tipo de resposta <span className="text-red-500">*</span>
              </label>
              <select
                value={newAttr.type}
                onChange={(e) => setNewField('type', e.target.value as AttributeDefinition['type'])}
                className={inputClass}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[#9c8e84]">
                {newAttr.type === 'TEXT'    && 'Campo de texto livre. Ex: "Dourado fosco", "Artesanal".'}
                {newAttr.type === 'NUMBER'  && 'Campo numérico. Ideal para medidas, pesos ou quantidades.'}
                {newAttr.type === 'ENUM'    && 'Você cria uma lista de opções e escolhe uma ao cadastrar cada produto.'}
                {newAttr.type === 'BOOLEAN' && 'Resposta de Sim ou Não. Ex: "Tem embalagem para presente?".'}
                {newAttr.type === 'DATE'    && 'Campo de data. Ex: data de fabricação ou validade.'}
              </p>
            </div>

            {newAttr.type === 'NUMBER' && (
              <div>
                <label className="block text-xs font-medium text-[#6b5d52] mb-1">
                  Unidade de medida
                  <span className="ml-1 font-normal text-[#c4b8ae]">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={newAttr.unit}
                  onChange={(e) => setNewField('unit', e.target.value)}
                  placeholder="ex: cm, kg, litros, metros"
                  className={inputClass}
                />
                <p className="mt-1 text-[11px] text-[#9c8e84]">
                  Aparece ao lado do número no formulário do produto.
                </p>
              </div>
            )}


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
                className="flex-1 py-2 rounded-lg border border-[#e8e2d8] text-[#6b5d52] hover:bg-[#f4f1eb] text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving || !newAttr.label.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#1c1813] hover:bg-[#2c2620] text-white text-sm font-semibold transition-colors disabled:opacity-60"
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
            <span className="w-6 h-6 rounded-full border-2 border-[#c9922c] border-t-transparent animate-spin" />
          </div>
        ) : !hasAnyAttribute ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#f4f1eb] border border-[#e8e2d8] flex items-center justify-center">
              <svg className="w-7 h-7 text-[#d4cec5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              </svg>
            </div>
            <div>
              <p className="text-[#1c1813] font-semibold text-sm">Nenhum atributo configurado</p>
              <p className="text-[#9c8e84] text-xs mt-1 max-w-xs">
                Adicione atributos para descrever as características dos seus produtos.
              </p>
            </div>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 rounded-lg bg-[#f4f1eb] border border-[#e8e2d8] hover:bg-[#ede8df] text-[#6b5d52] text-sm font-medium transition-colors"
              >
                Adicionar primeiro atributo
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Global attributes from business type */}
            {globalAttributes.length > 0 && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9c8e84] mb-3">
                  Atributos do seu negócio
                </p>
                <div className="rounded-xl border border-[#e8e2d8] overflow-hidden bg-white shadow-sm">
                  {/* Visible globals */}
                  {visibleGlobals.map((attr, i) => (
                    <AttributeRow
                      key={attr.id}
                      attr={attr}
                      isHidden={false}
                      isLast={i === visibleGlobals.length - 1 && hiddenGlobals.length === 0}
                      isActing={actingId === attr.id}
                      onHide={() => handleHide(attr)}
                    />
                  ))}

                  {/* Divider + hidden globals */}
                  {hiddenGlobals.length > 0 && (
                    <>
                      {visibleGlobals.length > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#faf8f5] border-t border-b border-[#f0ece5]">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#c4b8ae]">
                            Ocultos ({hiddenGlobals.length})
                          </span>
                        </div>
                      )}
                      {hiddenGlobals.map((attr, i) => (
                        <AttributeRow
                          key={attr.id}
                          attr={attr}
                          isHidden={true}
                          isLast={i === hiddenGlobals.length - 1}
                          isActing={actingId === attr.id}
                          onUnhide={() => handleUnhide(attr)}
                        />
                      ))}
                    </>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-[#c4b8ae]">
                  Atributos ocultos não aparecem no formulário de cadastro de produtos.
                </p>
              </section>
            )}

            {/* Custom attributes */}
            {customAttributes.length > 0 && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9c8e84] mb-3">
                  Atributos personalizados
                </p>
                <div className="rounded-xl border border-[#e8e2d8] overflow-hidden bg-white shadow-sm">
                  {customAttributes.map((attr, i) => (
                    <AttributeRow
                      key={attr.id}
                      attr={attr}
                      isHidden={false}
                      isLast={i === customAttributes.length - 1}
                      isActing={actingId === attr.id}
                      onDelete={() => handleDelete(attr)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ── AttributeRow ───────────────────────────────────────────────────────────────

function AttributeRow({
  attr,
  isHidden,
  isLast,
  isActing,
  onHide,
  onUnhide,
  onDelete,
}: {
  attr: AttributeDefinition
  isHidden: boolean
  isLast: boolean
  isActing: boolean
  onHide?: () => void
  onUnhide?: () => void
  onDelete?: () => void
}) {
  const spinner = (
    <span className="w-3 h-3 rounded-full border-2 border-current/30 border-t-current animate-spin inline-block" />
  )

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-[#f0ece5]' : ''} ${
        isHidden ? 'opacity-50' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${isHidden ? 'line-through text-[#9c8e84]' : 'text-[#1c1813]'}`}>
            {attr.label}
          </span>
          <TypeBadge type={attr.type} />
          {attr.required && (
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
              Obrigatório
            </span>
          )}
          {attr.unit && (
            <span className="text-[10px] text-[#9c8e84]">({attr.unit})</span>
          )}
        </div>
      </div>

      {onHide && (
        <button
          onClick={onHide}
          disabled={isActing}
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-[#9c8e84] hover:text-[#6b5d52] hover:bg-[#f4f1eb] border border-[#e8e2d8] transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          {isActing ? spinner : 'Ocultar'}
        </button>
      )}

      {onUnhide && (
        <button
          onClick={onUnhide}
          disabled={isActing}
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-[#c9922c] hover:text-[#a87820] hover:bg-amber-50 border border-amber-200 transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          {isActing ? spinner : 'Reexibir'}
        </button>
      )}

      {onDelete && (
        <button
          onClick={onDelete}
          disabled={isActing}
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          {isActing ? spinner : 'Excluir'}
        </button>
      )}
    </div>
  )
}
