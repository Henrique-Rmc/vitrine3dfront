import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
import { useAuth } from '../../context/AuthContext'
import { compressImage } from '../../services/imageOptimizationService'

const inputClass =
  'w-full rounded-lg bg-[#f4f1eb] border border-[#e8e2d8] px-3 py-2.5 text-sm text-[#1c1813] placeholder-[#c4b8ae] focus:outline-none focus:ring-2 focus:ring-[#c9922c]/40 focus:border-[#c9922c]/60 disabled:opacity-50 transition-colors'

function FormField({ label, required, hint, children }: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#6b5d52] mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-[#9c8e84]">{hint}</p>}
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
        className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#c9922c]/40 disabled:opacity-50 ${
          checked ? 'bg-[#c9922c]' : 'bg-[#e8e2d8]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="flex flex-col">
        <span className="text-sm text-[#1c1813]">{label}</span>
        {description && <span className="text-xs text-[#9c8e84]">{description}</span>}
      </span>
    </label>
  )
}

// ── Normalizes a free-text option to Title Case to prevent duplicate variations ─
function normalizeOptionValue(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase())
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
  const forceNew = options.length === 0 && (attr.required ?? false)

  const [isAddingNew, setIsAddingNew] = useState(forceNew)
  const [rawInput, setRawInput]       = useState('')
  const [isSaving, setIsSaving]       = useState(false)
  const [addError, setAddError]       = useState<string | null>(null)

  useEffect(() => { if (forceNew) setIsAddingNew(true) }, [forceNew])

  const normalized  = normalizeOptionValue(rawInput)
  const showPreview = rawInput.trim() !== '' && normalized !== rawInput.trim()
  const isDuplicate = rawInput.trim() !== '' &&
    options.some((opt) => normalizeOptionValue(opt) === normalized)

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
              placeholder="Ex: Para alugar, Residencial..."
              className={inputClass}
            />
            {showPreview && !isDuplicate && (
              <p className="mt-1 text-[11px] text-[#9c8e84]">
                Será salvo como: <span className="font-semibold text-[#1c1813]">{normalized}</span>
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
              className="shrink-0 px-3 py-2.5 rounded-lg border border-[#e8e2d8] text-[#6b5d52] hover:bg-[#f4f1eb] text-sm transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!normalized || isDuplicate || isSaving}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#1c1813] hover:bg-[#2c2620] text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSaving
              ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
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
          className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#c9922c]/40 disabled:opacity-50 ${
            checked ? 'bg-[#c9922c]' : 'bg-[#e8e2d8]'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              checked ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-sm text-[#6b5d52]">{checked ? 'Sim' : 'Não'}</span>
      </label>
    )
  }

  if (attr.type === 'DATE') {
    return (
      <input
        type="date"
        disabled={disabled}
        value={value}
        onChange={(e) => onValueChange(attr.key, e.target.value)}
        className={inputClass}
      />
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
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9c8e84] pointer-events-none">
            {attr.unit}
          </span>
        )}
      </div>
    )
  }

  // TEXT (default)
  return (
    <input
      type="text"
      disabled={disabled}
      value={value}
      onChange={(e) => onValueChange(attr.key, e.target.value)}
      placeholder={`Informe ${attr.label.toLowerCase()}`}
      className={inputClass}
    />
  )
}

export default function ProductFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEditMode = !!id
  const storeId = user?.id ?? ''

  const emptyForm = (): ProductFormData => ({
    name: '', description: '', imageUrls: [], isVisible: true, storeId, price: null, attributes: {},
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

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const isDisabled = isSaving || isLoadingProduct

  useEffect(() => {
    if (!storeId) return
    setIsLoadingAttributes(true)
    listEffectiveAttributes(storeId)
      .then(setAttributeDefinitions)
      .catch(() => {})
      .finally(() => setIsLoadingAttributes(false))
  }, [storeId])

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
    const capped = selected.slice(0, MAX)
    if (selected.length > MAX) setSaveError(`Máximo de ${MAX} fotos. As primeiras ${MAX} foram selecionadas.`)

    setIsOptimizingImage(true)
    setField('imageUrls', [])
    try {
      const compressed = await Promise.all(capped.map(compressImage))
      setImageFiles(compressed)
      setImagePreviews(compressed.map((f) => URL.createObjectURL(f)))
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
        <span className="w-6 h-6 rounded-full border-2 border-[#c9922c] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-[#9c8e84] text-sm">Produto não encontrado.</p>
        <button
          onClick={() => navigate('/admin/products')}
          className="px-4 py-2 rounded-lg bg-[#f4f1eb] border border-[#e8e2d8] hover:bg-[#ede8df] text-[#6b5d52] text-sm font-medium transition-colors"
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
            className="p-2 rounded-lg text-[#9c8e84] hover:text-[#1c1813] hover:bg-[#f4f1eb] transition-colors"
            aria-label="Voltar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1c1813]">
              {isEditMode ? 'Editar Produto' : 'Novo Produto'}
            </h1>
            {isEditMode && form.name && (
              <p className="text-sm text-[#9c8e84] mt-0.5 truncate">{form.name}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <FormField
            label="Fotos do produto"
            hint={isOptimizingImage ? undefined : imageFiles.length > 0 ? `${imageFiles.length} foto${imageFiles.length > 1 ? 's' : ''} selecionada${imageFiles.length > 1 ? 's' : ''}` : 'PNG, JPG ou WebP · até 5 fotos · máx. 2 MB cada'}
          >
            <div className="space-y-2">
              {/* Upload button */}
              <button
                type="button"
                disabled={isDisabled || isOptimizingImage}
                onClick={() => imageInputRef.current?.click()}
                className="w-full rounded-lg border-2 border-dashed border-[#e8e2d8] hover:border-[#d4cec5] bg-[#f4f1eb]/60 hover:bg-[#f4f1eb] transition-colors px-4 py-4 flex items-center gap-3 disabled:opacity-50"
              >
                {isOptimizingImage ? (
                  <>
                    <span className="w-6 h-6 rounded-full border-2 border-[#e8e2d8] border-t-[#c9922c] animate-spin shrink-0" />
                    <span className="text-sm text-[#9c8e84]">Comprimindo imagens…</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 text-[#d4cec5] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-sm text-[#9c8e84]">
                      {imageFiles.length > 0 ? 'Trocar seleção de fotos' : 'Fazer upload de fotos (até 5)'}
                    </span>
                  </>
                )}
              </button>

              <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp"
                multiple className="sr-only" onChange={handleImageFilesChange} />

              {/* Preview grid — new files take priority over saved URLs */}
              {(imageFiles.length > 0 || form.imageUrls.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {(imageFiles.length > 0 ? imagePreviews : form.imageUrls).map((src, i) => (
                    <div key={src + i} className="relative">
                      <img src={src} alt="" className="w-16 h-16 rounded-lg object-cover border border-[#e8e2d8]"
                        onError={(e) => { e.currentTarget.style.display = 'none' }} />
                      <button
                        type="button"
                        onClick={() => imageFiles.length > 0
                          ? removeImageFile(i)
                          : setField('imageUrls', form.imageUrls.filter((_, idx) => idx !== i))
                        }
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center leading-none"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* URL input — only when no files are queued */}
              {imageFiles.length === 0 && (
                <input type="url" disabled={isDisabled}
                  value={form.imageUrls[0] ?? ''}
                  onChange={(e) => {
                    const url = e.target.value.trim()
                    setField('imageUrls', url ? [url] : [])
                    setImagePreviews(url ? [url] : [])
                  }}
                  placeholder="Ou cole uma URL de imagem"
                  className={inputClass} />
              )}
            </div>
          </FormField>

          <FormField label="Preço">
            <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
              <input type="checkbox" checked={omitPrice}
                onChange={(e) => { setOmitPrice(e.target.checked); if (e.target.checked) setField('price', null) }}
                className="w-3.5 h-3.5 rounded accent-[#c9922c]" />
              <span className="text-sm text-[#9c8e84]">Não informar preço (orçamento sob consulta)</span>
            </label>
            {!omitPrice && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9c8e84] pointer-events-none">R$</span>
                <input type="number" min="0.01" step="0.01" disabled={isDisabled}
                  value={form.price ?? ''}
                  onChange={(e) => setField('price', e.target.value ? Number(e.target.value) : null)}
                  placeholder="0,00" className={`${inputClass} pl-9`} />
              </div>
            )}
          </FormField>

          {/* Dynamic attribute inputs */}
          {(isLoadingAttributes || attributeDefinitions.length > 0) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#6b5d52]">Características do produto</p>
                {isLoadingAttributes && (
                  <span className="w-4 h-4 rounded-full border-2 border-[#e8e2d8] border-t-[#9c8e84] animate-spin" />
                )}
              </div>
              {!isLoadingAttributes && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attributeDefinitions.map((attr) => (
                    <FormField key={attr.key} label={attr.label} required={attr.required}>
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
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-[#f4f1eb] hover:bg-[#ede8df] border border-[#e8e2d8] disabled:opacity-50 text-[#6b5d52] text-sm font-medium transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isDisabled}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#1c1813] hover:bg-[#2c2620] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 transition-colors">
              {isSaving ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
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
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-5">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-[#e8e2d8]" />
            <div className="absolute inset-0 rounded-full border-4 border-t-[#c9922c] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-[#1c1813] text-sm font-semibold">
              {isEditMode ? 'Salvando alterações…' : 'Cadastrando produto…'}
            </p>
            <p className="text-xs text-[#9c8e84] mt-1">Por favor, aguarde</p>
          </div>
        </div>
      )}

      {/* Success popup */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-[#faf8f5]/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white border border-[#e8e2d8] rounded-2xl px-8 py-7 flex flex-col items-center gap-4 shadow-2xl mx-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-green-300/60 animate-ping" />
            </div>
            <div className="text-center">
              <p className="text-[#1c1813] font-semibold text-base">
                {isEditMode ? 'Produto atualizado!' : 'Produto cadastrado!'}
              </p>
              <p className="text-[#9c8e84] text-sm mt-1">Redirecionando para seus produtos…</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
