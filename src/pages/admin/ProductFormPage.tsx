import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Category } from '../../types'
import {
  createProduct,
  updateProduct,
  scrapeFromMakerWorld,
  type CreateProductRequest,
} from '../../services/productService'
import { listCategories } from '../../services/categoryService'
import { mockProducts } from '../../data/mockProducts'

// ── Constants ──────────────────────────────────────────────────────────────────

const MATERIALS = ['PLA', 'ABS', 'Resina', 'PETG', 'Flexível'] as const

const EMPTY_FORM: CreateProductRequest = {
  name: '',
  description: '',
  imageUrl: '',
  material: 'PLA',
  multicolor: false,
  dimensions: '',
  isVisible: true,
  categoryId: 0,
}

const inputClass =
  'w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 transition-colors'

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitialForm(productId: string | undefined): CreateProductRequest {
  if (!productId) return EMPTY_FORM
  const found = mockProducts.find((p) => p.id === Number(productId))
  if (!found) return EMPTY_FORM
  // TODO: replace with GET /api/products/:id once API is ready
  const { id: _id, userId: _uid, ...fields } = found
  return fields
}

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
  const isEditMode = !!id

  // Form data
  const [form, setForm] = useState<CreateProductRequest>(() => getInitialForm(id))

  // Remote data
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // MakerWorld import
  const [makerWorldUrl, setMakerWorldUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importFeedback, setImportFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  // Save
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const isDisabled = isSaving || isImporting

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Validate the product exists in edit mode
    if (isEditMode) {
      const found = mockProducts.find((p) => p.id === Number(id))
      if (!found) { setNotFound(true); return }
    }

    listCategories()
      .then(setCategories)
      .catch(() => { /* categories optional — API may not be running yet */ })
      .finally(() => setIsLoadingCategories(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Field handlers ───────────────────────────────────────────────────────────

  function setField<K extends keyof CreateProductRequest>(
    key: K,
    value: CreateProductRequest[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaveError(null)
  }

  // ── MakerWorld ───────────────────────────────────────────────────────────────

  async function handleImport() {
    if (!makerWorldUrl.trim()) return
    setIsImporting(true)
    setImportFeedback(null)
    try {
      const scraped = await scrapeFromMakerWorld(makerWorldUrl.trim())
      setForm((prev) => ({
        ...prev,
        name: scraped.name,
        description: scraped.description,
        imageUrl: scraped.imageUrl,
      }))
      setImportFeedback({ ok: true, msg: 'Nome, descrição e imagem preenchidos automaticamente.' })
    } catch {
      setImportFeedback({ ok: false, msg: 'Falha ao importar. Verifique a URL e tente novamente.' })
    } finally {
      setIsImporting(false)
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.categoryId) {
      setSaveError('Selecione uma categoria antes de salvar.')
      return
    }
    setIsSaving(true)
    setSaveError(null)
    try {
      if (isEditMode) {
        await updateProduct(Number(id), form)
      } else {
        await createProduct(form)
      }
      navigate('/admin/products')
    } catch {
      setSaveError('Erro ao salvar produto. Verifique sua conexão e tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Not-found state ──────────────────────────────────────────────────────────

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

      {/* MakerWorld import */}
      <div className="mb-6 rounded-xl border border-blue-800/40 bg-blue-950/20 px-5 py-4">
        <div className="flex items-center gap-2 mb-1">
          <svg
            className="w-5 h-5 text-blue-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          <p className="text-sm font-semibold text-blue-300">Importar do MakerWorld</p>
        </div>
        <p className="text-xs text-zinc-500 mb-3 pl-7">
          Cole a URL do modelo para preencher nome, descrição e imagem automaticamente.
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={makerWorldUrl}
            disabled={isDisabled}
            onChange={(e) => {
              setMakerWorldUrl(e.target.value)
              setImportFeedback(null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleImport())}
            placeholder="https://makerworld.com/en/models/..."
            className={`flex-1 min-w-0 ${inputClass}`}
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={isDisabled || !makerWorldUrl.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shrink-0"
          >
            {isImporting ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              'Importar'
            )}
          </button>
        </div>
        {importFeedback && (
          <p className={`mt-2 text-xs pl-7 ${importFeedback.ok ? 'text-green-400' : 'text-red-400'}`}>
            {importFeedback.ok ? '✓ ' : '✗ '}
            {importFeedback.msg}
          </p>
        )}
      </div>

      {/* Product form */}
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Name */}
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

        {/* Description */}
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

        {/* Image URL with inline preview */}
        <FormField label="URL da imagem">
          <div className="flex gap-2 items-center">
            <input
              type="url"
              disabled={isDisabled}
              value={form.imageUrl}
              onChange={(e) => setField('imageUrl', e.target.value)}
              placeholder="https://..."
              className={`flex-1 min-w-0 ${inputClass}`}
            />
            {form.imageUrl && (
              <img
                src={form.imageUrl}
                alt=""
                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-zinc-700"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
                onLoad={(e) => { e.currentTarget.style.display = 'block' }}
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
              {MATERIALS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
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
              {categories.length === 0 && (
                <p className="mt-1 text-xs text-zinc-500">
                  Nenhuma categoria disponível. O servidor pode estar offline.
                </p>
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
  )
}
