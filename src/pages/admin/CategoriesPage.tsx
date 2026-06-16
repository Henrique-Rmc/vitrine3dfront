import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../services/categoryService'
import type { Category } from '../../types'

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="max-w-2xl">
      <div className="space-y-2 mb-6">
        <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
        <div className="h-4 w-72 bg-zinc-800 rounded animate-pulse" />
      </div>
      <div className="flex gap-2 mb-6">
        <div className="flex-1 h-10 bg-zinc-800 rounded-lg animate-pulse" />
        <div className="w-28 h-10 bg-zinc-800 rounded-lg animate-pulse" />
      </div>
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-4 py-3 ${i < 3 ? 'border-b border-zinc-800/60' : ''}`}
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-800 animate-pulse" />
            <div className="flex-1 h-4 bg-zinc-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const { user } = useAuth()
  const storeId = user?.id ?? 0

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [loadError, setLoadError]   = useState<string | null>(null)

  const [newName, setNewName]   = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const [editingId, setEditingId]     = useState<number | null>(null)
  const [editName, setEditName]       = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await listCategories()
        setCategories(data)
      } catch {
        setLoadError('Não foi possível carregar as categorias. Verifique a conexão com o backend.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setIsAdding(true)
    setAddError(null)
    try {
      const created = await createCategory(name, storeId)
      setCategories((prev) => [...prev, created])
      setNewName('')
    } catch {
      setAddError('Erro ao criar categoria. Tente novamente.')
    } finally {
      setIsAdding(false)
    }
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setEditName(cat.name)
  }

  async function handleSaveEdit(id: number) {
    const name = editName.trim()
    if (!name) { setEditingId(null); return }
    setIsSavingEdit(true)
    try {
      const updated = await updateCategory(id, name)
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)))
      setEditingId(null)
    } catch {
      // keep editing mode open on error
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Excluir esta categoria? Produtos vinculados a ela podem ficar sem categoria.')) return
    setDeletingId(id)
    try {
      await deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch {
      // silently ignore — a toast would be better but keeps scope minimal
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) return <LoadingSkeleton />

  return (
    <div className="max-w-2xl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-100">Categorias</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Organize seus produtos em categorias para facilitar a navegação dos clientes.
        </p>
      </div>

      {/* Add category */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => { setNewName(e.target.value); setAddError(null) }}
          placeholder="Nome da nova categoria"
          className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
        />
        <button
          type="submit"
          disabled={isAdding || !newName.trim()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shrink-0"
        >
          {isAdding ? (
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Adicionar
            </>
          )}
        </button>
      </form>

      {addError && (
        <div className="mb-4 rounded-lg bg-red-950/60 border border-red-800/60 px-4 py-3 text-sm text-red-300">
          {addError}
        </div>
      )}

      {loadError && (
        <div className="rounded-lg bg-red-950/60 border border-red-800/60 px-4 py-3 text-sm text-red-300">
          {loadError}
        </div>
      )}

      {!loadError && categories.length === 0 && (
        <div className="text-center py-16">
          <p className="text-zinc-500 text-sm">Nenhuma categoria cadastrada ainda.</p>
        </div>
      )}

      {/* Category list */}
      {categories.length > 0 && (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          {categories.map((cat, i) => (
            <div
              key={cat.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                i < categories.length - 1 ? 'border-b border-zinc-800/60' : ''
              }`}
            >
              {/* Icon */}
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                <svg
                  className="w-4 h-4 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                  />
                </svg>
              </div>

              {/* Name or edit input */}
              {editingId === cat.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(cat.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="flex-1 rounded-md bg-zinc-700 border border-zinc-600 px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              ) : (
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-sm text-zinc-100 truncate">{cat.name}</span>
                  {cat.isGlobal && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
                      Global
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              {editingId === cat.id ? (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleSaveEdit(cat.id)}
                    disabled={isSavingEdit}
                    className="p-1.5 rounded-lg text-green-400 hover:bg-green-950/40 transition-colors"
                    title="Salvar"
                  >
                    {isSavingEdit ? (
                      <span className="w-4 h-4 rounded-full border-2 border-green-400 border-t-transparent animate-spin block" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                    title="Cancelar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : !cat.isGlobal ? (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(cat)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    disabled={deletingId === cat.id}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 disabled:opacity-50 transition-colors"
                    title="Excluir"
                  >
                    {deletingId === cat.id ? (
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
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
