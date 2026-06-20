import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Category, Material } from '../../types'
import {
  createProduct,
  updateProduct,
  getProduct,
  type ProductFormData,
} from '../../services/productService'
import { listCategories, createCategory } from '../../services/categoryService'
import { listMaterials, createMaterial } from '../../services/materialService'
import { useAuth } from '../../context/AuthContext'

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

export default function ProductFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEditMode = !!id
  const storeId = user?.id ?? ''

  const emptyForm = (): ProductFormData => ({
    name: '', description: '', imageUrl: '',
    materialId: null, dimensions: '', isVisible: true, categoryId: 0, storeId, price: null,
  })

  const [form, setForm] = useState<ProductFormData>(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [materials, setMaterials]   = useState<Material[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isLoadingMaterials, setIsLoadingMaterials]   = useState(true)
  const [isLoadingProduct, setIsLoadingProduct] = useState(isEditMode)
  const [notFound, setNotFound] = useState(false)

  const [omitPrice, setOmitPrice] = useState(true)

  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [createCategoryError, setCreateCategoryError] = useState<string | null>(null)

  const [showNewMaterial, setShowNewMaterial] = useState(false)
  const [newMaterialName, setNewMaterialName] = useState('')
  const [isCreatingMaterial, setIsCreatingMaterial] = useState(false)
  const [createMaterialError, setCreateMaterialError] = useState<string | null>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const isDisabled = isSaving || isLoadingProduct

  useEffect(() => {
    listCategories(storeId)
      .then(setCategories)
      .catch(() => undefined)
      .finally(() => setIsLoadingCategories(false))

    listMaterials(storeId)
      .then(setMaterials)
      .catch(() => undefined)
      .finally(() => setIsLoadingMaterials(false))

    if (isEditMode) {
      getProduct(Number(id))
        .then((product) => {
          setForm({
            name: product.name,
            description: product.description ?? '',
            imageUrl: product.imageUrl ?? '',
            materialId: product.materialId ?? null,
            dimensions: product.dimensions ?? '',
            isVisible: product.isVisible,
            categoryId: product.categoryId,
            storeId,
            price: product.price ?? null,
          })
          setOmitPrice(product.price == null)
          if (product.imageUrl) setImagePreview(product.imageUrl)
        })
        .catch(() => setNotFound(true))
        .finally(() => setIsLoadingProduct(false))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function setField<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaveError(null)
  }

  function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    if (file) { setImagePreview(URL.createObjectURL(file)); setField('imageUrl', '') }
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim()
    if (!name) return
    setIsCreatingCategory(true)
    setCreateCategoryError(null)
    try {
      const created = await createCategory(name)
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

  async function handleCreateMaterial() {
    const name = newMaterialName.trim()
    if (!name) return
    setIsCreatingMaterial(true)
    setCreateMaterialError(null)
    try {
      const created = await createMaterial(name)
      setMaterials((prev) => [...prev, created])
      setField('materialId', created.id)
      setShowNewMaterial(false)
      setNewMaterialName('')
    } catch {
      setCreateMaterialError('Erro ao criar material. Tente novamente.')
    } finally {
      setIsCreatingMaterial(false)
    }
  }

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
            label="Imagem do produto"
            hint={imageFile ? `Arquivo: ${imageFile.name}` : 'Faça upload de um arquivo ou cole uma URL abaixo'}
          >
            <div className="space-y-2">
              <button
                type="button"
                disabled={isDisabled}
                onClick={() => imageInputRef.current?.click()}
                className="w-full rounded-lg border-2 border-dashed border-[#e8e2d8] hover:border-[#d4cec5] bg-[#f4f1eb]/60 hover:bg-[#f4f1eb] transition-colors px-4 py-4 flex items-center gap-3 disabled:opacity-50"
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="" className="w-12 h-12 rounded-lg object-cover border border-[#e8e2d8] shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    <span className="text-sm text-[#c9922c]">Trocar imagem</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 text-[#d4cec5] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-sm text-[#9c8e84]">Fazer upload de imagem</span>
                  </>
                )}
              </button>
              <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp"
                className="sr-only" onChange={handleImageFileChange} />

              {!imageFile && (
                <input type="url" disabled={isDisabled}
                  value={form.imageUrl}
                  onChange={(e) => { setField('imageUrl', e.target.value); setImagePreview(e.target.value || null) }}
                  placeholder="https://... (opcional se fizer upload acima)"
                  className={inputClass} />
              )}
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            {/* Categoria */}
            <FormField label="Categoria" required>
              {isLoadingCategories ? (
                <div className="flex items-center gap-2 h-10 px-3">
                  <span className="w-4 h-4 rounded-full border-2 border-[#e8e2d8] border-t-[#9c8e84] animate-spin" />
                  <span className="text-sm text-[#9c8e84]">Carregando…</span>
                </div>
              ) : (
                <>
                  <select
                    disabled={isDisabled || categories.length === 0 || showNewCategory}
                    value={form.categoryId || ''}
                    onChange={(e) => setField('categoryId', Number(e.target.value))}
                    className={`${inputClass} cursor-pointer`}>
                    <option value="">{showNewCategory ? 'Definida abaixo…' : 'Selecione'}</option>
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                  {!showNewCategory ? (
                    <button type="button"
                      onClick={() => { setShowNewCategory(true); setCreateCategoryError(null) }}
                      className="mt-2 flex items-center gap-1.5 text-xs text-[#9c8e84] hover:text-[#c9922c] transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Nova categoria
                    </button>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <input autoFocus type="text" value={newCategoryName}
                        onChange={(e) => { setNewCategoryName(e.target.value); setCreateCategoryError(null) }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory() } }}
                        placeholder="Nome da categoria"
                        className="flex-1 rounded-lg bg-[#f4f1eb] border border-[#e8e2d8] px-3 py-2 text-sm text-[#1c1813] placeholder-[#c4b8ae] focus:outline-none focus:ring-2 focus:ring-[#c9922c]/40 transition-colors" />
                      <button type="button" disabled={isCreatingCategory || !newCategoryName.trim()}
                        onClick={handleCreateCategory}
                        className="px-3 py-2 rounded-lg bg-[#1c1813] hover:bg-[#2c2620] disabled:opacity-60 text-white text-xs font-semibold transition-colors shrink-0">
                        {isCreatingCategory ? (
                          <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin block" />
                        ) : 'Criar'}
                      </button>
                      <button type="button"
                        onClick={() => { setShowNewCategory(false); setNewCategoryName(''); setCreateCategoryError(null) }}
                        className="px-3 py-2 rounded-lg text-[#9c8e84] hover:text-[#1c1813] hover:bg-[#f4f1eb] text-xs transition-colors shrink-0">
                        ✕
                      </button>
                    </div>
                  )}
                  {createCategoryError && <p className="mt-1 text-xs text-red-600">{createCategoryError}</p>}
                </>
              )}
            </FormField>

            {/* Material */}
            <FormField label="Material">
              {isLoadingMaterials ? (
                <div className="flex items-center gap-2 h-10 px-3">
                  <span className="w-4 h-4 rounded-full border-2 border-[#e8e2d8] border-t-[#9c8e84] animate-spin" />
                  <span className="text-sm text-[#9c8e84]">Carregando…</span>
                </div>
              ) : (
                <>
                  <select
                    disabled={isDisabled || showNewMaterial}
                    value={form.materialId ?? ''}
                    onChange={(e) => setField('materialId', e.target.value ? Number(e.target.value) : null)}
                    className={`${inputClass} cursor-pointer`}>
                    <option value="">{showNewMaterial ? 'Definido abaixo…' : 'Sem material'}</option>
                    {materials.map((mat) => <option key={mat.id} value={mat.id}>{mat.name}</option>)}
                  </select>
                  {!showNewMaterial ? (
                    <button type="button"
                      onClick={() => { setShowNewMaterial(true); setCreateMaterialError(null) }}
                      className="mt-2 flex items-center gap-1.5 text-xs text-[#9c8e84] hover:text-[#c9922c] transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Novo material
                    </button>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <input autoFocus type="text" value={newMaterialName}
                        onChange={(e) => { setNewMaterialName(e.target.value); setCreateMaterialError(null) }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateMaterial() } }}
                        placeholder="Nome do material"
                        className="flex-1 rounded-lg bg-[#f4f1eb] border border-[#e8e2d8] px-3 py-2 text-sm text-[#1c1813] placeholder-[#c4b8ae] focus:outline-none focus:ring-2 focus:ring-[#c9922c]/40 transition-colors" />
                      <button type="button" disabled={isCreatingMaterial || !newMaterialName.trim()}
                        onClick={handleCreateMaterial}
                        className="px-3 py-2 rounded-lg bg-[#1c1813] hover:bg-[#2c2620] disabled:opacity-60 text-white text-xs font-semibold transition-colors shrink-0">
                        {isCreatingMaterial ? (
                          <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin block" />
                        ) : 'Criar'}
                      </button>
                      <button type="button"
                        onClick={() => { setShowNewMaterial(false); setNewMaterialName(''); setCreateMaterialError(null) }}
                        className="px-3 py-2 rounded-lg text-[#9c8e84] hover:text-[#1c1813] hover:bg-[#f4f1eb] text-xs transition-colors shrink-0">
                        ✕
                      </button>
                    </div>
                  )}
                  {createMaterialError && <p className="mt-1 text-xs text-red-600">{createMaterialError}</p>}
                </>
              )}
            </FormField>
          </div>

          <FormField label="Dimensões" hint="ex: 15 × 10 × 8 cm">
            <input type="text" disabled={isDisabled}
              value={form.dimensions}
              onChange={(e) => setField('dimensions', e.target.value)}
              placeholder="15 × 10 × 8 cm"
              className={inputClass} />
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
