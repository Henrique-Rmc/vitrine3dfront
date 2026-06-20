import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  listMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from '../../services/materialService'
import type { Material } from '../../types'

function LoadingSkeleton() {
  return (
    <div className="max-w-2xl">
      <div className="space-y-2 mb-6">
        <div className="h-6 w-32 skeleton rounded" />
        <div className="h-4 w-72 skeleton rounded" />
      </div>
      <div className="flex gap-2 mb-6">
        <div className="flex-1 h-10 skeleton rounded-lg" />
        <div className="w-28 h-10 skeleton rounded-lg" />
      </div>
      <div className="bg-white border border-[#e8e2d8] rounded-xl overflow-hidden shadow-sm">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < 3 ? 'border-b border-[#f0ece5]' : ''}`}>
            <div className="w-8 h-8 skeleton rounded-lg" />
            <div className="flex-1 h-4 skeleton rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MaterialsPage() {
  const { user } = useAuth()
  const storeId = user?.id ?? ''

  const [materials, setMaterials] = useState<Material[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [newName, setNewName]   = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const [editingId, setEditingId]       = useState<number | null>(null)
  const [editName, setEditName]         = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setMaterials(await listMaterials(storeId))
      } catch {
        setLoadError('Não foi possível carregar os materiais.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setIsAdding(true)
    setAddError(null)
    try {
      const created = await createMaterial(name)
      setMaterials((prev) => [...prev, created])
      setNewName('')
    } catch {
      setAddError('Erro ao criar material. Tente novamente.')
    } finally {
      setIsAdding(false)
    }
  }

  async function handleSaveEdit(id: number) {
    const name = editName.trim()
    if (!name) { setEditingId(null); return }
    setIsSavingEdit(true)
    try {
      const updated = await updateMaterial(id, name)
      setMaterials((prev) => prev.map((m) => (m.id === id ? updated : m)))
      setEditingId(null)
    } catch {
      // keep editing mode open on error
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Excluir este material? Produtos vinculados podem ficar sem material.')) return
    setDeletingId(id)
    try {
      await deleteMaterial(id)
      setMaterials((prev) => prev.filter((m) => m.id !== id))
    } catch {
      // silently ignore
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) return <LoadingSkeleton />

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1c1813]">Materiais</h1>
        <p className="text-sm text-[#9c8e84] mt-0.5">
          Defina os materiais dos seus produtos para que os clientes possam filtrar a vitrine.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => { setNewName(e.target.value); setAddError(null) }}
          placeholder="Nome do novo material (ex: PLA, Resina, Madeira)"
          className="flex-1 rounded-lg bg-[#f4f1eb] border border-[#e8e2d8] px-3 py-2.5 text-sm text-[#1c1813] placeholder-[#c4b8ae] focus:outline-none focus:ring-2 focus:ring-[#c9922c]/40 focus:border-[#c9922c]/60 transition-colors"
        />
        <button
          type="submit"
          disabled={isAdding || !newName.trim()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1c1813] hover:bg-[#2c2620] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shrink-0"
        >
          {isAdding ? (
            <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
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

      {addError  && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{addError}</div>}
      {loadError && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{loadError}</div>}

      {!loadError && materials.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#9c8e84] text-sm">Nenhum material cadastrado ainda.</p>
        </div>
      )}

      {materials.length > 0 && (
        <div className="bg-white border border-[#e8e2d8] rounded-xl overflow-hidden shadow-sm">
          {materials.map((mat, i) => (
            <div
              key={mat.id}
              className={`flex items-center gap-3 px-4 py-3 ${i < materials.length - 1 ? 'border-b border-[#f0ece5]' : ''}`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#f4f1eb] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[#9c8e84]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.698-1.572 2.205A15.75 15.75 0 0112 18.75a15.75 15.75 0 01-8.23-2.342C2.23 15.898 1.8 14.2 2.8 13.198L5 14.5" />
                </svg>
              </div>

              {editingId === mat.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(mat.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="flex-1 rounded-md bg-[#f4f1eb] border border-[#e8e2d8] px-2 py-1 text-sm text-[#1c1813] focus:outline-none focus:ring-2 focus:ring-[#c9922c]/40"
                />
              ) : (
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-sm text-[#1c1813] truncate">{mat.name}</span>
                  {mat.isGlobal && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9c8e84] bg-[#f4f1eb] px-1.5 py-0.5 rounded shrink-0">
                      Global
                    </span>
                  )}
                </div>
              )}

              {editingId === mat.id ? (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleSaveEdit(mat.id)}
                    disabled={isSavingEdit}
                    className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                    title="Salvar"
                  >
                    {isSavingEdit ? (
                      <span className="w-4 h-4 rounded-full border-2 border-green-300 border-t-green-600 animate-spin block" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1.5 rounded-lg text-[#9c8e84] hover:text-[#1c1813] hover:bg-[#f4f1eb] transition-colors"
                    title="Cancelar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : !mat.isGlobal && mat.storeId === storeId ? (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => { setEditingId(mat.id); setEditName(mat.name) }}
                    className="p-1.5 rounded-lg text-[#9c8e84] hover:text-[#1c1813] hover:bg-[#f4f1eb] transition-colors"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(mat.id)}
                    disabled={deletingId === mat.id}
                    className="p-1.5 rounded-lg text-[#9c8e84] hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    title="Excluir"
                  >
                    {deletingId === mat.id ? (
                      <span className="w-4 h-4 rounded-full border-2 border-red-200 border-t-red-500 animate-spin block" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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
