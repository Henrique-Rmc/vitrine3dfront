import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  createProduct,
  updateProduct,
  getProduct,
  type ProductFormData,
} from '../../services/productService'
import {
  listEffectiveAttributes,
  addOption,
  type AttributeDefinition,
} from '../../services/attributeService'
import {
  listProductTypes,
  type ProductType,
} from '../../services/productTypeService'
import { useAuth } from '../../context/AuthContext'
import { compressImage } from '../../services/imageOptimizationService'

const inputClass =
  'w-full rounded-lg bg-surface-2 border border-border px-3 py-2.5 text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/60 disabled:opacity-50 transition-colors'

function FormField({ label, required, hint, children }: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-2 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  )
}

function Toggle({ label, description, checked, disabled, onChange }: {
  label: string
  description?: string
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50 ${
          checked ? 'bg-brand' : 'bg-border'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="flex flex-col">
        <span className="text-sm text-ink">{label}</span>
        {description && <span className="text-xs text-ink-3">{description}</span>}
      </span>
    </label>
  )
}

// ── Normalizes an option value to prevent duplicate variations.
// TEXT/ENUM → Title Case. NUMBER → trim only (numbers/units must stay as typed).
function normalizeOptionValue(raw: string, type?: AttributeDefinition['type']): string {
  const cleaned = raw.trim().replace(/\s+/g, ' ')
  if (type === 'NUMBER') return cleaned
  return cleaned.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())
}

// ── ENUM attribute field — dropdown + inline "add new option" ──────────────────
function EnumAttributeField({
  attr,
  value,
  disabled,
  storeId,
  onValueChange,
  onDefinitionUpdate,
}: {
  attr: AttributeDefinition
  value: string
  disabled: boolean
  storeId: string
  onValueChange: (key: string, value: string) => void
  onDefinitionUpdate: (updated: AttributeDefinition) => void
}) {
  const options  = attr.enumOptions ?? []
  const forceNew = options.length === 0

  const [isAddingNew, setIsAddingNew] = useState(forceNew)
  const [rawInput, setRawInput]       = useState('')
  const [isSaving, setIsSaving]       = useState(false)
  const [addError, setAddError]       = useState<string | null>(null)

  useEffect(() => { if (forceNew) setIsAddingNew(true) }, [forceNew])

  const normalized  = normalizeOptionValue(rawInput, attr.type)
  const showPreview = rawInput.trim() !== '' && normalized !== rawInput.trim()
  const isDuplicate = rawInput.trim() !== '' &&
    options.some((opt) => normalizeOptionValue(opt, attr.type) === normalized)

  function cancelAdd() {
    setIsAddingNew(false)
    setRawInput('')
    setAddError(null)
  }

  async function handleSave() {
    if (!normalized || isDuplicate || isSaving) return
    setIsSaving(true)
    setAddError(null)
    try {
      const updated = await addOption(storeId, attr.id, normalized)
      // Backend may not include the new value in enumOptions — merge it in
      const base = updated.enumOptions ?? attr.enumOptions ?? []
      const patchedDef: AttributeDefinition = {
        ...updated,
        enumOptions: base.includes(normalized) ? base : [...base, normalized],
      }
      onDefinitionUpdate(patchedDef)
      onValueChange(attr.key, normalized)
      setRawInput('')
      setIsAddingNew(false)
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code
      setAddError(
        code === 'OPTION_ALREADY_EXISTS'
          ? 'Esse valor já existe na lista.'
          : 'Erro ao adicionar. Tente novamente.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isAddingNew) {
    return (
      <div className="space-y-1.5">
        {/* Intentionally a <div>, not a <form> — avoids nested-form HTML invalidity
            since this renders inside the product <form>. Enter is handled via onKeyDown. */}
        <div className="flex gap-2 items-start">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              autoFocus
              value={rawInput}
              disabled={isSaving}
              onChange={(e) => { setRawInput(e.target.value); setAddError(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave() } }}
              placeholder={`Ex: valores de ${attr.label.toLowerCase()}`}
              className={inputClass}
            />
            {showPreview && !isDuplicate && (
              <p className="mt-1 text-[11px] text-ink-3">
                Será salvo como: <span className="font-semibold text-ink">{normalized}</span>
              </p>
            )}
            {isDuplicate && (
              <p className="mt-1 text-[11px] text-amber-700 font-medium">
                "{normalized}" já existe — selecione-o na lista.
              </p>
            )}
            {addError && <p className="mt-1 text-[11px] text-red-600">{addError}</p>}
          </div>

          {!forceNew && (
            <button
              type="button"
              onClick={cancelAdd}
              disabled={isSaving}
              className="shrink-0 px-3 py-2.5 rounded-lg border border-border text-ink-2 hover:bg-surface-2 text-sm transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!normalized || isDuplicate || isSaving}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-cta hover:bg-cta-2 text-cta-fg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSaving
              ? <span className="w-3.5 h-3.5 rounded-full border-2 border-cta-fg/40 border-t-cta-fg animate-spin" />
              : 'Adicionar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => {
        if (e.target.value === '__add_new__') {
          setIsAddingNew(true)
        } else {
          onValueChange(attr.key, e.target.value)
        }
      }}
      className={inputClass}
    >
      <option value="" disabled={!!attr.required}>
        {attr.required ? 'Selecionar…' : '— Não informado —'}
      </option>
      <option value="__add_new__">+ Adicionar novo valor</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  )
}

// ── Per-type attribute input ───────────────────────────────────────────────────
// ENUM and TEXT use EnumAttributeField (dropdown + add-new via /options API).
// NUMBER and DATE use native inputs — the /options endpoint only accepts ENUM types.
// BOOLEAN keeps a fixed Sim/Não toggle.
function AttributeInput({
  attr,
  value,
  disabled,
  storeId,
  onValueChange,
  onDefinitionUpdate,
}: {
  attr: AttributeDefinition
  value: string
  disabled: boolean
  storeId: string
  onValueChange: (key: string, value: string) => void
  onDefinitionUpdate: (updated: AttributeDefinition) => void
}) {
  if (attr.type === 'BOOLEAN') {
    const checked = value === 'true'
    return (
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onValueChange(attr.key, checked ? 'false' : 'true')}
          className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50 ${
            checked ? 'bg-brand' : 'bg-border'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              checked ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-sm text-ink-2">{checked ? 'Sim' : 'Não'}</span>
      </label>
    )
  }

  if (attr.type === 'NUMBER') {
    return (
      <div className="relative">
        <input
          type="number"
          disabled={disabled}
          value={value}
          onChange={(e) => onValueChange(attr.key, e.target.value)}
          placeholder="0"
          className={`${inputClass} ${attr.unit ? 'pr-12' : ''}`}
        />
        {attr.unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-3 pointer-events-none">
            {attr.unit}
          </span>
        )}
      </div>
    )
  }

  if (attr.type === 'ENUM') {
    return (
      <EnumAttributeField
        attr={attr}
        value={value}
        disabled={disabled}
        storeId={storeId}
        onValueChange={onValueChange}
        onDefinitionUpdate={onDefinitionUpdate}
      />
    )
  }

  // TEXT and DATE: removed from product form (types are deprecated)
  return null
}

export default function ProductFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEditMode = !!id
  const storeId = user?.id ?? ''

  const isAffiliate = user?.profileType === 'AFFILIATE'

  const emptyForm = (): ProductFormData => ({
    name: '', description: '', imageUrls: [], isVisible: true, storeId, price: null, attributes: {}, productTypeId: null, affiliateUrl: null,
  })

  const [form, setForm] = useState<ProductFormData>(emptyForm)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isOptimizingImage, setIsOptimizingImage] = useState(false)

  const [isLoadingProduct, setIsLoadingProduct] = useState(isEditMode)
  const [notFound, setNotFound] = useState(false)

  const [omitPrice, setOmitPrice] = useState(false)

  const [attributeDefinitions, setAttributeDefinitions] = useState<AttributeDefinition[]>([])
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false)

  const [productTypes, setProductTypes]   = useState<ProductType[]>([])
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const isDisabled = isSaving || isLoadingProduct

  // Load product types once
  useEffect(() => {
    if (!storeId) return
    listProductTypes(storeId)
      .then(setProductTypes)
      .catch(() => {})
      .finally(() => setIsLoadingTypes(false))
  }, [storeId])

  // Re-load attributes whenever the selected product type changes
  useEffect(() => {
    if (!storeId || form.productTypeId == null) {
      setAttributeDefinitions([])
      return
    }
    setIsLoadingAttributes(true)
    listEffectiveAttributes(storeId, form.productTypeId)
      .then(setAttributeDefinitions)
      .catch(() => {})
      .finally(() => setIsLoadingAttributes(false))
  }, [storeId, form.productTypeId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isEditMode) {
      getProduct(Number(id))
        .then((product) => {
          const existingUrls =
            product.imageUrls?.length ? product.imageUrls
            : product.imageUrl        ? [product.imageUrl]
            : []
          setForm({
            name: product.name,
            description: product.description ?? '',
            imageUrls: existingUrls,
            isVisible: product.isVisible,
            storeId,
            price: product.price ?? null,
            attributes: (product.attributes ?? {}) as Record<string, unknown>,
            productTypeId: product.productTypeId ?? null,
            affiliateUrl: product.affiliateUrl ?? null,
          })
          setOmitPrice(product.price == null)
          setImagePreviews(existingUrls)
        })
        .catch(() => setNotFound(true))
        .finally(() => setIsLoadingProduct(false))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function setField<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaveError(null)
  }

  function setAttributeValue(key: string, value: string) {
    setForm((prev) => {
      const attrs = { ...(prev.attributes ?? {}) }
      if (value !== '') attrs[key] = value
      else delete attrs[key]
      return { ...prev, attributes: attrs }
    })
    setSaveError(null)
  }

  function updateDefinition(updated: AttributeDefinition) {
    setAttributeDefinitions((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
  }

  function handleProductTypeChange(typeId: number | null) {
    setForm((prev) => ({ ...prev, productTypeId: typeId, attributes: {} }))
    setSaveError(null)
  }

  async function handleImageFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (selected.length === 0) return

    const MAX = 5
    const MAX_BYTES = 2 * 1024 * 1024
    const ALLOWED = ['image/png', 'image/jpeg', 'image/webp']

    const badType = selected.find((f) => !ALLOWED.includes(f.type))
    if (badType) { setSaveError(`Formato não suportado: ${badType.name}. Use PNG, JPG ou WebP.`); return }
    const tooBig = selected.find((f) => f.size > MAX_BYTES)
    if (tooBig) { setSaveError(`${tooBig.name} excede 2 MB.`); return }

    setSaveError(null)

    const currentCount = imageFiles.length
    const available = MAX - currentCount
    if (available <= 0) { setSaveError(`Limite de ${MAX} fotos já atingido.`); return }

    const capped = selected.slice(0, available)
    if (selected.length > available) {
      setSaveError(`Apenas ${capped.length} foto${capped.length > 1 ? 's' : ''} adicionada${capped.length > 1 ? 's' : ''} — limite de ${MAX} atingido.`)
    }

    setIsOptimizingImage(true)
    if (imageFiles.length === 0) setField('imageUrls', []) // switching from URL to file mode
    try {
      const compressed = await Promise.all(capped.map(compressImage))
      setImageFiles((prev) => [...prev, ...compressed])
      setImagePreviews((prev) => [...prev, ...compressed.map((f) => URL.createObjectURL(f))])
    } finally {
      setIsOptimizingImage(false)
    }
  }

  function removeImageFile(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setSaveError(null)
    const startedAt = Date.now()
    try {
      if (isEditMode) {
        await updateProduct(Number(id), { ...form, storeId }, imageFiles)
      } else {
        await createProduct({ ...form, storeId }, imageFiles)
      }
      const elapsed = Date.now() - startedAt
      if (elapsed < 1000) await new Promise<void>((r) => setTimeout(r, 1000 - elapsed))
      setIsSaving(false)
      setShowSuccess(true)
      setTimeout(() => navigate('/admin/products'), 1700)
    } catch {
      setSaveError('Erro ao salvar produto. Verifique sua conexão e tente novamente.')
      setIsSaving(false)
    }
  }

  if (isLoadingProduct) {
    return (
      <div className="flex justify-center py-24">
        <span className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-ink-3 text-sm">Produto não encontrado.</p>
        <button
          onClick={() => navigate('/admin/products')}
          className="px-4 py-2 rounded-lg bg-surface-2 border border-border hover:bg-surface-3 text-ink-2 text-sm font-medium transition-colors"
        >
          ← Voltar para Produtos
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/admin/products')}
            className="p-2 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
            aria-label="Voltar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-ink">
              {isEditMode ? 'Editar Produto' : 'Novo Produto'}
            </h1>
            {isEditMode && form.name && (
              <p className="text-sm text-ink-3 mt-0.5 truncate">{form.name}</p>
            )}
          </div>
        </div>

        {/* No product types — block the form */}
        {!isLoadingTypes && productTypes.length === 0 && (
          <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-4 text-sm text-amber-800 mb-6">
            <svg className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="font-semibold">Você precisa criar um tipo de produto primeiro</p>
              <p className="mt-1 text-amber-700">
                Cada produto pertence a um tipo (ex.: Camisa, Action Figure). Crie pelo menos um tipo antes de cadastrar produtos.
              </p>
              <Link
                to="/admin/product-types"
                className="mt-2 inline-block text-sm font-semibold text-amber-700 hover:text-amber-800 underline"
              >
                Gerenciar tipos de produto →
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product type selector — required */}
          <FormField label="Tipo do produto" required>
            {isLoadingTypes ? (
              <div className="flex items-center gap-2 py-2.5">
                <span className="w-4 h-4 rounded-full border-2 border-border border-t-brand animate-spin" />
                <span className="text-sm text-ink-3">Carregando tipos…</span>
              </div>
            ) : (
              <select
                required
                disabled={isDisabled || productTypes.length === 0}
                value={form.productTypeId ?? ''}
                onChange={(e) => handleProductTypeChange(e.target.value ? Number(e.target.value) : null)}
                className={inputClass}
              >
                <option value="" disabled>Selecionar tipo…</option>
                {productTypes.map((pt) => (
                  <option key={pt.id} value={pt.id}>{pt.label}</option>
                ))}
              </select>
            )}
          </FormField>

          <FormField label="Nome do produto" required>
            <input type="text" required disabled={isDisabled}
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="ex: Colar em prata com ametista"
              className={inputClass} />
          </FormField>

          <FormField label="Descrição">
            <textarea rows={3} disabled={isDisabled}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Detalhes sobre o produto, materiais, técnica, tamanho..."
              className={`${inputClass} resize-none`} />
          </FormField>

          <FormField label="Fotos do produto">
            <div className="space-y-3">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="sr-only"
                onChange={handleImageFilesChange}
              />

              {/* 5-slot image grid */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {Array.from({ length: 5 }).map((_, i) => {
                  const src = imageFiles.length > 0 ? imagePreviews[i] : form.imageUrls[i]
                  const isFilled = !!src
                  const isThisProcessing = isOptimizingImage && !isFilled && i === (imageFiles.length > 0 ? imageFiles.length : form.imageUrls.length)

                  return (
                    <div key={i} className="relative aspect-square">
                      {isFilled ? (
                        <>
                          <img
                            src={src}
                            alt={`Foto ${i + 1}`}
                            className="w-full h-full object-cover rounded-xl border border-border"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                          <button
                            type="button"
                            disabled={isDisabled}
                            onClick={() => imageFiles.length > 0
                              ? removeImageFile(i)
                              : setField('imageUrls', form.imageUrls.filter((_, idx) => idx !== i))
                            }
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-cta hover:bg-red-500 text-cta-fg flex items-center justify-center shadow transition-colors disabled:opacity-50"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          {i === 0 && (
                            <span className="absolute bottom-1 left-1 text-[9px] font-semibold uppercase tracking-wide text-white bg-black/50 px-1 py-0.5 rounded">
                              Capa
                            </span>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={isDisabled || isOptimizingImage}
                          onClick={() => imageInputRef.current?.click()}
                          className={`w-full h-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            i === 0
                              ? 'border-border-2 hover:border-brand/50 bg-surface-2 hover:bg-surface-3'
                              : 'border-border hover:border-border-2 bg-surface hover:bg-surface-2'
                          }`}
                        >
                          {isThisProcessing ? (
                            <span className="w-4 h-4 rounded-full border-2 border-border border-t-brand animate-spin" />
                          ) : (
                            <>
                              <svg className={`text-border-2 ${i === 0 ? 'w-6 h-6' : 'w-4 h-4'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                              {i === 0 && (
                                <span className="text-[10px] text-ink-4 font-medium leading-tight text-center px-1">
                                  Foto principal
                                </span>
                              )}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {isOptimizingImage && (
                <div className="flex items-center gap-2 text-xs text-ink-3">
                  <span className="w-3 h-3 rounded-full border-2 border-border border-t-brand animate-spin" />
                  Comprimindo imagens…
                </div>
              )}

              <p className="text-xs text-ink-4">
                PNG, JPG ou WebP · até 5 fotos · máx. 2 MB cada · toque em um bloco para adicionar
              </p>
            </div>
          </FormField>

          <FormField label="Preço">
            <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
              <input type="checkbox" checked={omitPrice}
                onChange={(e) => { setOmitPrice(e.target.checked); if (e.target.checked) setField('price', null) }}
                className="w-3.5 h-3.5 rounded accent-brand" />
              <span className="text-sm text-ink-3">Não informar preço (orçamento sob consulta)</span>
            </label>
            {!omitPrice && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-3 pointer-events-none">R$</span>
                <input type="number" min="0.01" step="0.01" disabled={isDisabled}
                  value={form.price ?? ''}
                  onChange={(e) => setField('price', e.target.value ? Number(e.target.value) : null)}
                  placeholder="0,00" className={`${inputClass} pl-9`} />
              </div>
            )}
          </FormField>

          {/* Affiliate URL — visible only for AFFILIATE accounts */}
          {isAffiliate && (
            <FormField label="Link de afiliado" required>
              <input
                type="url"
                required={isAffiliate}
                disabled={isDisabled}
                value={form.affiliateUrl ?? ''}
                onChange={(e) => setField('affiliateUrl', e.target.value || null)}
                placeholder="https://loja.exemplo.com/produto?ref=seu-codigo"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-ink-3">
                Link externo para o qual o cliente será redirecionado ao clicar em "Ver".
              </p>
            </FormField>
          )}

          {/* Dynamic attribute inputs */}
          {(isLoadingAttributes || attributeDefinitions.length > 0) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink-2">Características do produto</p>
                {isLoadingAttributes && (
                  <span className="w-4 h-4 rounded-full border-2 border-border border-t-ink-3 animate-spin" />
                )}
              </div>
              {!isLoadingAttributes && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attributeDefinitions.map((attr) => (
                    <FormField key={attr.key} label={attr.type === 'NUMBER' && attr.unit ? `${attr.label} (${attr.unit})` : attr.label} required={attr.required}>
                      <AttributeInput
                        attr={attr}
                        value={String(form.attributes?.[attr.key] ?? '')}
                        disabled={isDisabled}
                        storeId={storeId}
                        onValueChange={setAttributeValue}
                        onDefinitionUpdate={updateDefinition}
                      />
                    </FormField>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="py-2">
            <Toggle label="Visível na loja" description="Clientes podem ver este produto"
              checked={form.isVisible} disabled={isDisabled} onChange={(v) => setField('isVisible', v)} />
          </div>

          {saveError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {saveError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate('/admin/products')} disabled={isDisabled}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border disabled:opacity-50 text-ink-2 text-sm font-medium transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isDisabled}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-cta hover:bg-cta-2 disabled:opacity-60 disabled:cursor-not-allowed text-cta-fg font-semibold py-2.5 px-6 transition-colors">
              {isSaving ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-cta-fg/40 border-t-cta-fg animate-spin" />
                  {isEditMode ? 'Salvando…' : 'Cadastrando…'}
                </>
              ) : (
                isEditMode ? 'Salvar Alterações' : 'Cadastrar Produto'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Loading overlay */}
      {isSaving && (
        <div className="fixed inset-0 z-50 bg-canvas/80 backdrop-blur-sm flex flex-col items-center justify-center gap-5">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-border" />
            <div className="absolute inset-0 rounded-full border-4 border-t-brand border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-ink text-sm font-semibold">
              {isEditMode ? 'Salvando alterações…' : 'Cadastrando produto…'}
            </p>
            <p className="text-xs text-ink-3 mt-1">Por favor, aguarde</p>
          </div>
        </div>
      )}

      {/* Success popup */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-surface/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-canvas border border-border rounded-2xl px-8 py-7 flex flex-col items-center gap-4 shadow-2xl mx-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-green-300/60 animate-ping" />
            </div>
            <div className="text-center">
              <p className="text-ink font-semibold text-base">
                {isEditMode ? 'Produto atualizado!' : 'Produto cadastrado!'}
              </p>
              <p className="text-ink-3 text-sm mt-1">Redirecionando para seus produtos…</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
