import { useState, useEffect } from 'react'
import type { Product, Category } from '../../types'
import {
  listProducts,
  createProduct,
  deleteProduct,
  scrapeFromMakerWorld,
  type CreateProductRequest,
} from '../../services/productService'
import { listCategories } from '../../services/categoryService'

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
  'w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors'

// ── Sub-components ─────────────────────────────────────────────────────────────

function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-400 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 ${
          checked ? 'bg-blue-600' : 'bg-zinc-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="text-sm text-zinc-400">{label}</span>
    </label>
  )
}

function AdminProductCard({
  product,
  categories,
  isDeleting,
  onDelete,
}: {
  product: Product
  categories: Category[]
  isDeleting: boolean
  onDelete: () => void
}) {
  const category = categories.find((c) => c.id === product.categoryId)

  return (
    <div className="flex gap-3 rounded-xl bg-zinc-900 border border-zinc-800 p-3">
      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-100 truncate">{product.name}</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          {product.material}
          {product.dimensions ? ` · ${product.dimensions}` : ''}
          {category ? ` · ${category.name}` : ''}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          {product.multicolor && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-950/60 text-purple-400 border border-purple-800/40">
              Multicolorido
            </span>
          )}
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
              product.isVisible
                ? 'bg-green-950/60 text-green-400 border border-green-800/40'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
            }`}
          >
            {product.isVisible ? 'Visível' : 'Oculto'}
          </span>
        </div>
      </div>

      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="shrink-0 p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 disabled:opacity-50 transition-colors self-start"
        aria-label="Excluir produto"
      >
        {isDeleting ? (
          <span className="w-4 h-4 rounded-full border-2 border-red-400 border-t-transparent animate-spin block" />
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        )}
      </button>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [tab, setTab] = useState<'products' | 'add'>('products')

  // Data
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // MakerWorld import
  const [makerWorldUrl, setMakerWorldUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importFeedback, setImportFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  // Form
  const [form, setForm] = useState<CreateProductRequest>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  // Delete
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [prods, cats] = await Promise.all([listProducts(), listCategories()])
        setProducts(prods)
        setCategories(cats)
      } catch {
        setLoadError('Não foi possível carregar os dados. Verifique se o servidor está rodando.')
      } finally {
        setIsLoadingData(false)
      }
    }
    fetchData()
  }, [])

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

  function setField<K extends keyof CreateProductRequest>(
    key: K,
    value: CreateProductRequest[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaveFeedback(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.categoryId) {
      setSaveFeedback({ ok: false, msg: 'Selecione uma categoria.' })
      return
    }
    setIsSaving(true)
    setSaveFeedback(null)
    try {
      const newProduct = await createProduct(form)
      setProducts((prev) => [newProduct, ...prev])
      setForm(EMPTY_FORM)
      setMakerWorldUrl('')
      setImportFeedback(null)
      setSaveFeedback({ ok: true, msg: 'Produto adicionado com sucesso!' })
      setTab('products')
    } catch {
      setSaveFeedback({ ok: false, msg: 'Erro ao salvar produto. Tente novamente.' })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return
    setDeletingId(id)
    try {
      await deleteProduct(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-100 mb-6">Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-900 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('products')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'products'
              ? 'bg-zinc-700 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Meus Produtos
          {products.length > 0 && (
            <span className="ml-1.5 text-xs text-zinc-500">({products.length})</span>
          )}
        </button>
        <button
          onClick={() => {
            setTab('add')
            setSaveFeedback(null)
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'add'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          + Adicionar Produto
        </button>
      </div>

      {/* ── Products Tab ────────────────────────────────────────────────────── */}
      {tab === 'products' && (
        <>
          {isLoadingData && (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            </div>
          )}

          {!isLoadingData && loadError && (
            <div className="rounded-xl bg-red-950/40 border border-red-800/40 px-5 py-4 text-sm text-red-300">
              {loadError}
            </div>
          )}

          {!isLoadingData && !loadError && products.length === 0 && (
            <div className="text-center py-16">
              <p className="text-zinc-400 mb-4">Nenhum produto cadastrado ainda.</p>
              <button
                onClick={() => setTab('add')}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
              >
                Adicionar primeiro produto
              </button>
            </div>
          )}

          {!isLoadingData && !loadError && products.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <AdminProductCard
                  key={product.id}
                  product={product}
                  categories={categories}
                  isDeleting={deletingId === product.id}
                  onDelete={() => handleDelete(product.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Add Tab ─────────────────────────────────────────────────────────── */}
      {tab === 'add' && (
        <div className="max-w-2xl">
          {/* MakerWorld Import */}
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
              Cole a URL do modelo para preencher automaticamente o nome, descrição e imagem.
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={makerWorldUrl}
                onChange={(e) => {
                  setMakerWorldUrl(e.target.value)
                  setImportFeedback(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                placeholder="https://makerworld.com/en/models/..."
                className={`flex-1 min-w-0 ${inputClass}`}
              />
              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting || !makerWorldUrl.trim()}
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
              <p
                className={`mt-2 text-xs pl-7 ${
                  importFeedback.ok ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {importFeedback.ok ? '✓ ' : '✗ '}
                {importFeedback.msg}
              </p>
            )}
          </div>

          {/* Product Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Nome do produto" required>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="ex: Busto Darth Vader"
                className={inputClass}
              />
            </FormField>

            <FormField label="Descrição">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Detalhes sobre o produto, acabamento, escala, tempo de impressão..."
                className={`${inputClass} resize-none`}
              />
            </FormField>

            <FormField label="URL da imagem">
              <div className="flex gap-2 items-center">
                <input
                  type="url"
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

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Material" required>
                <select
                  required
                  value={form.material}
                  onChange={(e) => setField('material', e.target.value)}
                  className={`${inputClass} cursor-pointer`}
                >
                  {MATERIALS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Dimensões" required>
                <input
                  type="text"
                  required
                  value={form.dimensions}
                  onChange={(e) => setField('dimensions', e.target.value)}
                  placeholder="ex: 15 × 10 × 8 cm"
                  className={inputClass}
                />
              </FormField>
            </div>

            <FormField label="Categoria" required>
              <select
                value={form.categoryId || ''}
                onChange={(e) => setField('categoryId', Number(e.target.value))}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {!isLoadingData && categories.length === 0 && (
                <p className="mt-1 text-xs text-zinc-500">
                  Nenhuma categoria disponível. O servidor pode estar offline.
                </p>
              )}
            </FormField>

            <div className="flex gap-8 py-1">
              <Toggle
                label="Multicolorido"
                checked={form.multicolor}
                onChange={(v) => setField('multicolor', v)}
              />
              <Toggle
                label="Visível na loja"
                checked={form.isVisible}
                onChange={(v) => setField('isVisible', v)}
              />
            </div>

            {saveFeedback && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  saveFeedback.ok
                    ? 'bg-green-950/40 border border-green-800/40 text-green-300'
                    : 'bg-red-950/40 border border-red-800/40 text-red-300'
                }`}
              >
                {saveFeedback.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 transition-colors"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Salvando…
                </>
              ) : (
                'Salvar Produto'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
