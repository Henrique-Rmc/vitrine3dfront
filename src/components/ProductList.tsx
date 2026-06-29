import { useState } from 'react'
import type { Product } from '../types'

export interface ProductListProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: number) => void
  deletingId?: number | null
  featuredIds?: number[]
  onToggleFeatured?: (id: number) => void
  onReorder?: (newProducts: Product[]) => void
  reorderMode?: boolean
  onMoveUp?: (id: number) => void
  onMoveDown?: (id: number) => void
}

const DragHandle = () => (
  <svg className="w-4 h-4 text-[#d4cec5] cursor-grab active:cursor-grabbing shrink-0" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="5.5" cy="4"  r="1.2" /><circle cx="10.5" cy="4"  r="1.2" />
    <circle cx="5.5" cy="8"  r="1.2" /><circle cx="10.5" cy="8"  r="1.2" />
    <circle cx="5.5" cy="12" r="1.2" /><circle cx="10.5" cy="12" r="1.2" />
  </svg>
)

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className={`w-4 h-4 transition-colors ${filled ? 'text-[#c9922c]' : 'text-[#d4cec5]'}`}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
)

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
)

const MATERIAL_BADGE: Record<string, string> = {
  PLA:      'bg-amber-50 text-amber-700 border-amber-200',
  ABS:      'bg-slate-100 text-slate-600 border-slate-200',
  Resina:   'bg-violet-50 text-violet-700 border-violet-200',
  PETG:     'bg-teal-50 text-teal-700 border-teal-200',
  Flexível: 'bg-green-50 text-green-700 border-green-200',
}

function Thumbnail({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#f4f1eb] shrink-0 flex items-center justify-center border border-[#e8e2d8]">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <svg className="w-5 h-5 text-[#d4cec5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      )}
    </div>
  )
}

function MaterialBadge({ material }: { material: string | null | undefined }) {
  if (!material) return null
  const colors = MATERIAL_BADGE[material] ?? 'bg-stone-100 text-stone-500 border-stone-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${colors}`}>
      {material}
    </span>
  )
}

function StatusBadge({ isVisible }: { isVisible: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${
      isVisible
        ? 'bg-green-50 text-green-700 border-green-200'
        : 'bg-stone-100 text-stone-500 border-stone-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isVisible ? 'bg-green-500' : 'bg-stone-400'}`} />
      {isVisible ? 'Visível' : 'Oculto'}
    </span>
  )
}

export default function ProductList({
  products, onEdit, onDelete, deletingId,
  featuredIds = [], onToggleFeatured, onReorder,
  reorderMode = false, onMoveUp, onMoveDown,
}: ProductListProps) {
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)

  const sortable    = !!onReorder && !reorderMode
  const hasFeatured = !!onToggleFeatured && !reorderMode
  const MAX_FEATURED = 3

  function startDrag(e: React.DragEvent, id: number) {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e: React.DragEvent, id: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id !== draggedId) setDragOverId(id)
  }

  function onDrop(targetId: number) {
    if (!onReorder || draggedId === null || draggedId === targetId) { resetDrag(); return }
    const next = [...products]
    const from = next.findIndex((p) => p.id === draggedId)
    const to   = next.findIndex((p) => p.id === targetId)
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onReorder(next)
    resetDrag()
  }

  function resetDrag() { setDraggedId(null); setDragOverId(null) }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-[#e8e2d8] py-16 text-center bg-white shadow-sm">
        <p className="text-sm text-[#9c8e84]">Nenhum produto encontrado.</p>
      </div>
    )
  }

  const desktopRow = (product: Product, idx: number) => {
    const isFeatured = featuredIds.includes(product.id)
    const canStar    = featuredIds.length < MAX_FEATURED
    const isDragged  = draggedId === product.id
    const isOver     = dragOverId === product.id && !isDragged

    return (
      <tr
        key={product.id}
        draggable={sortable}
        onDragStart={sortable ? (e) => startDrag(e, product.id) : undefined}
        onDragOver={sortable  ? (e) => onDragOver(e, product.id) : undefined}
        onDrop={sortable      ? () => onDrop(product.id) : undefined}
        onDragEnd={sortable   ? resetDrag : undefined}
        className={[
          'hover:bg-[#faf8f5] transition-all',
          idx < products.length - 1 ? 'border-b border-[#f0ece5]' : '',
          deletingId === product.id ? 'opacity-50' : '',
          isDragged ? 'opacity-30 bg-[#f4f1eb]' : '',
          isOver    ? 'border-t-2 border-[#c9922c]' : '',
        ].join(' ')}
      >
        {sortable && (
          <td className="pl-3 pr-1 py-3 w-8"><DragHandle /></td>
        )}
        <td className="px-4 py-3 w-16">
          <Thumbnail src={product.imageUrl} alt={product.name} />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-[#1c1813]">{product.name}</p>
            {isFeatured && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#c9922c] bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                Destaque
              </span>
            )}
          </div>
          {product.dimensions && (
            <p className="text-xs text-[#9c8e84] mt-0.5 font-mono">{product.dimensions}</p>
          )}
        </td>
        <td className="px-4 py-3">
          <MaterialBadge material={product.materialName} />
        </td>
        <td className="px-4 py-3">
          <StatusBadge isVisible={product.isVisible} />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1">
            {reorderMode && (
              <>
                <button
                  onClick={() => onMoveUp?.(product.id)}
                  disabled={idx === 0}
                  title="Mover para cima"
                  className="p-2 rounded-lg text-[#9c8e84] hover:text-[#1c1813] hover:bg-[#f4f1eb] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                </button>
                <button
                  onClick={() => onMoveDown?.(product.id)}
                  disabled={idx === products.length - 1}
                  title="Mover para baixo"
                  className="p-2 rounded-lg text-[#9c8e84] hover:text-[#1c1813] hover:bg-[#f4f1eb] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </>
            )}
            {hasFeatured && (
              <button
                onClick={() => onToggleFeatured?.(product.id)}
                disabled={!isFeatured && !canStar}
                title={isFeatured ? 'Remover destaque' : canStar ? 'Adicionar ao destaque (máx. 3)' : 'Limite atingido'}
                className={`p-2 rounded-lg transition-colors ${
                  isFeatured ? 'text-[#c9922c] hover:bg-amber-50'
                    : canStar ? 'text-[#d4cec5] hover:text-[#c9922c] hover:bg-amber-50'
                    : 'text-[#e8e2d8] cursor-not-allowed'
                }`}
              >
                <StarIcon filled={isFeatured} />
              </button>
            )}
            <button
              onClick={() => onEdit(product)}
              disabled={!!deletingId}
              title="Editar"
              className="p-2 rounded-lg text-[#9c8e84] hover:text-[#1c1813] hover:bg-[#f4f1eb] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <EditIcon />
            </button>
            <button
              onClick={() => onDelete(product.id)}
              disabled={deletingId === product.id}
              title="Excluir"
              className="p-2 rounded-lg text-[#9c8e84] hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deletingId === product.id
                ? <span className="w-4 h-4 rounded-full border-2 border-red-300 border-t-red-600 animate-spin block" />
                : <TrashIcon />}
            </button>
          </div>
        </td>
      </tr>
    )
  }

  const mobileCard = (product: Product) => {
    const isFeatured = featuredIds.includes(product.id)
    const canStar    = featuredIds.length < MAX_FEATURED
    const isDragged  = draggedId === product.id
    const isOver     = dragOverId === product.id && !isDragged

    return (
      <div
        key={product.id}
        draggable={sortable}
        onDragStart={sortable ? (e) => startDrag(e, product.id) : undefined}
        onDragOver={sortable  ? (e) => onDragOver(e, product.id) : undefined}
        onDrop={sortable      ? () => onDrop(product.id) : undefined}
        onDragEnd={sortable   ? resetDrag : undefined}
        className={[
          'flex items-center gap-2.5 px-3 py-3 transition-all',
          deletingId === product.id ? 'opacity-50' : '',
          isDragged ? 'opacity-30 bg-[#f4f1eb]' : '',
          isOver    ? 'border-t-2 border-[#c9922c]' : '',
        ].join(' ')}
      >
        {sortable && <DragHandle />}
        <Thumbnail src={product.imageUrl} alt={product.name} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-[#1c1813] truncate">{product.name}</p>
            {isFeatured && <StarIcon filled />}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <MaterialBadge material={product.materialName} />
            <StatusBadge isVisible={product.isVisible} />
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {reorderMode && (
            <>
              <button
                onClick={() => onMoveUp?.(product.id)}
                disabled={products.indexOf(product) === 0}
                className="p-2 rounded-lg text-[#9c8e84] hover:text-[#1c1813] hover:bg-[#f4f1eb] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                </svg>
              </button>
              <button
                onClick={() => onMoveDown?.(product.id)}
                disabled={products.indexOf(product) === products.length - 1}
                className="p-2 rounded-lg text-[#9c8e84] hover:text-[#1c1813] hover:bg-[#f4f1eb] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </>
          )}
          {hasFeatured && (
            <button
              onClick={() => onToggleFeatured?.(product.id)}
              disabled={!isFeatured && !canStar}
              className={`p-2 rounded-lg transition-colors ${
                isFeatured ? 'text-[#c9922c] hover:bg-amber-50'
                  : canStar ? 'text-[#d4cec5] hover:text-[#c9922c]'
                  : 'text-[#e8e2d8] cursor-not-allowed'
              }`}
            >
              <StarIcon filled={isFeatured} />
            </button>
          )}
          <button onClick={() => onEdit(product)} disabled={!!deletingId}
            className="p-2 rounded-lg text-[#9c8e84] hover:text-[#1c1813] hover:bg-[#f4f1eb] disabled:opacity-50 transition-colors">
            <EditIcon />
          </button>
          <button onClick={() => onDelete(product.id)} disabled={deletingId === product.id}
            className="p-2 rounded-lg text-[#9c8e84] hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors">
            {deletingId === product.id
              ? <span className="w-4 h-4 rounded-full border-2 border-red-300 border-t-red-600 animate-spin block" />
              : <TrashIcon />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#e8e2d8] overflow-hidden bg-white shadow-sm">
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#faf8f5] border-b border-[#e8e2d8]">
              {sortable && <th className="w-8" />}
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#9c8e84] uppercase tracking-wide w-16">Imagem</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#9c8e84] uppercase tracking-wide">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#9c8e84] uppercase tracking-wide">Material</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#9c8e84] uppercase tracking-wide">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-[#9c8e84] uppercase tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => desktopRow(product, idx))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-[#f0ece5]">
        {products.map((product) => mobileCard(product))}
      </div>
    </div>
  )
}
