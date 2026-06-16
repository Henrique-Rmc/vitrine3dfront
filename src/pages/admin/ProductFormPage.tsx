import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Category } from '../../types'
import {
  createProduct,
  updateProduct,
  getProduct,
  type ProductFormData,
} from '../../services/productService'
import { listCategories, createCategory } from '../../services/categoryService'
import { useAuth } from '../../context/AuthContext'

// ── Constants ──────────────────────────────────────────────────────────────────

const MATERIALS = ['PLA', 'ABS', 'Resina', 'PETG', 'Flexível'] as const

const inputClass =
  'w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 transition-colors'

// ── Sub-components ─────────────────────────────────────────────────────────────

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-400 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}

function Toggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
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
        className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 ${
          checked ? 'bg-blue-600' : 'bg-zinc-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="flex flex-col">
        <span className="text-sm text-zinc-300">{label}</span>
        {description && <span className="text-xs text-zinc-500">{description}</span>}
      </span>
    </label>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProductFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEditMode = !!id
  const storeId = user?.id ?? 0

  const emptyForm = (): ProductFormData => ({
    name: '',
    description: '',
    imageUrl: '',
    material: 'PLA',
    multicolor: false,
    dimensions: '',
    isVisible: true,
    categoryId: 0,
    storeId,
  })

  // Form data
  const [form, setForm] = useState<ProductFormData>(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Remote data
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isLoadingProduct, setIsLoadingProduct] = useState(isEditMode)
  const [notFound, setNotFound] = useState(false)

  // Inline category creation
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [createCategoryError, setCreateCategoryError] = useState<string | null>(null)

  // Save
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const isDisabled = isSaving  || isLoadingProduct

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Load categories
    listCategories()
      .then(setCategories)
      .catch(() => undefined)
      .finally(() => setIsLoadingCategories(false))

    // Load product data for edit mode
    if (isEditMode) {
      getProduct(Number(id))
        .then((product) => {
          const { id: _id, userId: _uid, whatsappUrl: _wa, ...fields } = product
          setForm({ ...fields, storeId })
          if (product.imageUrl) setImagePreview(product.imageUrl)
        })
        .catch(() => setNotFound(true))
        .finally(() => setIsLoadingProduct(false))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Field handlers ───────────────────────────────────────────────────────────

  function setField<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaveError(null)
  }

  function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    if (file) {
      setImagePreview(URL.createObjectURL(file))
      setField('imageUrl', '') // file takes precedence over URL
    }
  }

  // ── Inline category creation ─────────────────────────────────────────────────

  async function handleCreateCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const name = newCategoryName.trim()
    if (!name) return
    setIsCreatingCategory(true)
    setCreateCategoryError(null)
    try {
      const created = await createCategory(name, storeId, false)
      setCategories((prev) => [...prev, created])
      setField('categoryId', created.id)
      setShowNewCategory(false)
      setNewCategoryName('')
    } catch {
      setCreateCategoryError('Erro ao criar categoria. Tente novamente.')
    } finally {
      setIsCreatingCategory(false)
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.categoryId) { setSaveError('Selecione uma categoria antes de salvar.'); return }
    setIsSaving(true)
    setSaveError(null)
    const startedAt = Date.now()
    try {
      if (isEditMode) {
        await updateProduct(Number(id), { ...form, storeId }, imageFile)
      } else {
        await createProduct({ ...form, storeId }, imageFile)
      }
      // Guarantee the loading screen is visible for at least 1 s
      const elapsed = Date.now() - startedAt
      if (elapsed < 1000) {
        await new Promise<void>((r) => setTimeout(r, 1000 - elapsed))
      }
      setIsSaving(false)
      setShowSuccess(true)
      // Guarantee the success popup is visible for at least 1.7 s
      setTimeout(() => navigate('/admin/products'), 1700)
    } catch {
      setSaveError('Erro ao salvar produto. Verifique sua conexão e tente novamente.')
      setIsSaving(false)
    }
  }

  // ── Loading / not-found states ────────────────────────────────────────────────

  if (isLoadingProduct) {
    return (
      <div className="flex justify-center py-24">
        <span className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-zinc-400 text-sm">Produto não encontrado.</p>
        <button
          onClick={() => navigate('/admin/products')}
          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-medium transition-colors"
        >
          ← Voltar para Products
        </button>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
    <div className="max-w-2xl">

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/products')}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          aria-label="Voltar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">
            {isEditMode ? 'Edit Product' : 'New Product'}
          </h1>
          {isEditMode && form.name && (
            <p className="text-sm text-zinc-500 mt-0.5 truncate">{form.name}</p>
          )}
        </div>
      </div>

      {/* Product form */}
      <form onSubmit={handleSubmit} className="space-y-4">

        <FormField label="Nome do produto" required>
          <input
            type="text"
            required
            disabled={isDisabled}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="ex: Busto Darth Vader"
            className={inputClass}
          />
        </FormField>

        <FormField label="Descrição">
          <textarea
            rows={3}
            disabled={isDisabled}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Detalhes sobre o produto, acabamento, escala, tempo de impressão..."
            className={`${inputClass} resize-none`}
          />
        </FormField>

        {/* Image — file upload OR URL (file takes precedence) */}
        <FormField
          label="Imagem do produto"
          hint={imageFile ? `Arquivo: ${imageFile.name}` : 'Faça upload de um arquivo ou cole uma URL abaixo'}
        >
          <div className="space-y-2">
            {/* File upload zone */}
            <button
              type="button"
              disabled={isDisabled}
              onClick={() => imageInputRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-800/40 hover:bg-zinc-800 transition-colors px-4 py-4 flex items-center gap-3 disabled:opacity-50"
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover border border-zinc-700 shrink-0"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span className="text-sm text-blue-400">Trocar imagem</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 text-zinc-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-sm text-zinc-400">Fazer upload de imagem</span>
                </>
              )}
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={handleImageFileChange}
            />

            {/* URL input (used when no file is selected) */}
            {!imageFile && (
              <input
                type="url"
                disabled={isDisabled}
                value={form.imageUrl}
                onChange={(e) => { setField('imageUrl', e.target.value); setImagePreview(e.target.value || null) }}
                placeholder="https://... (opcional se fizer upload acima)"
                className={inputClass}
              />
            )}
          </div>
        </FormField>

        {/* Material + Dimensions */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Material" required>
            <select
              required
              disabled={isDisabled}
              value={form.material}
              onChange={(e) => setField('material', e.target.value)}
              className={`${inputClass} cursor-pointer`}
              style={{ colorScheme: 'dark' }}
            >
              {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </FormField>

          <FormField label="Dimensões" required hint="ex: 15 × 10 × 8 cm">
            <input
              type="text"
              required
              disabled={isDisabled}
              value={form.dimensions}
              onChange={(e) => setField('dimensions', e.target.value)}
              placeholder="15 × 10 × 8 cm"
              className={inputClass}
            />
          </FormField>
        </div>

        {/* Category */}
        <FormField label="Categoria" required>
          {isLoadingCategories ? (
            <div className="flex items-center gap-2 h-10 px-3">
              <span className="w-4 h-4 rounded-full border-2 border-zinc-600 border-t-zinc-400 animate-spin" />
              <span className="text-sm text-zinc-500">Carregando categorias…</span>
            </div>
          ) : (
            <>
              <select
                disabled={isDisabled || categories.length === 0}
                value={form.categoryId || ''}
                onChange={(e) => setField('categoryId', Number(e.target.value))}
                className={`${inputClass} cursor-pointer`}
                style={{ colorScheme: 'dark' }}
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              {/* Inline new-category form */}
              {!showNewCategory ? (
                <button
                  type="button"
                  onClick={() => { setShowNewCategory(true); setCreateCategoryError(null) }}
                  className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-blue-400 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Nova categoria
                </button>
              ) : (
                <form onSubmit={handleCreateCategory} className="mt-2 flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => { setNewCategoryName(e.target.value); setCreateCategoryError(null) }}
                    placeholder="Nome da nova categoria"
                    className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingCategory || !newCategoryName.trim()}
                    className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-semibold transition-colors shrink-0"
                  >
                    {isCreatingCategory ? (
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin block" />
                    ) : 'Criar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNewCategory(false); setNewCategoryName(''); setCreateCategoryError(null) }}
                    className="px-3 py-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-xs transition-colors shrink-0"
                  >
                    Cancelar
                  </button>
                </form>
              )}
              {createCategoryError && (
                <p className="mt-1 text-xs text-red-400">{createCategoryError}</p>
              )}
            </>
          )}
        </FormField>

        {/* Toggles */}
        <div className="flex flex-col sm:flex-row gap-5 py-2">
          <Toggle
            label="Multicolorido"
            description="Produto impresso em mais de uma cor"
            checked={form.multicolor}
            disabled={isDisabled}
            onChange={(v) => setField('multicolor', v)}
          />
          <Toggle
            label="Visível na loja"
            description="Clientes podem ver este produto"
            checked={form.isVisible}
            disabled={isDisabled}
            onChange={(v) => setField('isVisible', v)}
          />
        </div>

        {/* Save error */}
        {saveError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-950/60 border border-red-800/60 px-4 py-3 text-sm text-red-300">
            <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {saveError}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            disabled={isDisabled}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-100 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isDisabled}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 transition-colors"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                {isEditMode ? 'Saving…' : 'Creating…'}
              </>
            ) : (
              isEditMode ? 'Save Changes' : 'Create Product'
            )}
          </button>
        </div>
      </form>
    </div>

    {/* ── Overlays (fixed, rendered outside the form container) ── */}

    {/* Loading overlay */}
    {isSaving && (
      <div className="fixed inset-0 z-50 bg-zinc-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-5">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-zinc-100 text-sm font-semibold">
            {isEditMode ? 'Salvando alterações...' : 'Cadastrando produto...'}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Por favor, aguarde</p>
        </div>
      </div>
    )}

    {/* ── Success popup ── */}
    {showSuccess && (
      <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-zinc-900 border border-green-800/50 rounded-2xl px-8 py-7 flex flex-col items-center gap-4 shadow-2xl mx-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-green-950/50 border-2 border-green-700/60 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-green-500/40 animate-ping" />
          </div>
          <div className="text-center">
            <p className="text-zinc-100 font-semibold text-base">
              {isEditMode ? 'Produto atualizado!' : 'Produto cadastrado!'}
            </p>
            <p className="text-zinc-500 text-sm mt-1">Redirecionando para seus produtos…</p>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
