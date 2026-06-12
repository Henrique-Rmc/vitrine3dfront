import type { Product } from '../types'

interface ProductListProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: number) => void
}

const MATERIAL_COLORS: Record<string, string> = {
  PLA:      'bg-blue-950/60 text-blue-400 border-blue-800/40',
  ABS:      'bg-orange-950/60 text-orange-400 border-orange-800/40',
  Resina:   'bg-purple-950/60 text-purple-400 border-purple-800/40',
  PETG:     'bg-teal-950/60 text-teal-400 border-teal-800/40',
  Flexível: 'bg-green-950/60 text-green-400 border-green-800/40',
}

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

const ImagePlaceholder = () => (
  <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
)

function Thumbnail({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <ImagePlaceholder />
      )}
    </div>
  )
}

function MaterialBadge({ material }: { material: string }) {
  const colors = MATERIAL_COLORS[material] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors}`}>
      {material}
    </span>
  )
}

function StatusBadge({ isVisible }: { isVisible: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${
        isVisible
          ? 'bg-green-950/60 text-green-400 border-green-800/40'
          : 'bg-zinc-800 text-zinc-500 border-zinc-700'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isVisible ? 'bg-green-400' : 'bg-zinc-500'}`} />
      {isVisible ? 'Visible' : 'Hidden'}
    </span>
  )
}

export default function ProductList({ products, onEdit, onDelete }: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 py-16 text-center">
        <p className="text-sm text-zinc-500">No products yet. Add your first one above.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden">
      {/* ── Desktop table (sm+) ───────────────────────────────────────────── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900/60 border-b border-zinc-800">
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide w-16">
                Image
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Name
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Material
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Status
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => (
              <tr
                key={product.id}
                className={`hover:bg-zinc-900/40 transition-colors ${
                  idx < products.length - 1 ? 'border-b border-zinc-800/60' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <Thumbnail src={product.imageUrl} alt={product.name} />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-100">{product.name}</p>
                  {product.dimensions && (
                    <p className="text-xs text-zinc-500 mt-0.5 font-mono">{product.dimensions}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <MaterialBadge material={product.material} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge isVisible={product.isVisible} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(product)}
                      title="Edit"
                      className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      title="Delete"
                      className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list (< sm) ───────────────────────────────────────── */}
      <div className="sm:hidden divide-y divide-zinc-800">
        {products.map((product) => (
          <div key={product.id} className="flex items-center gap-3 px-4 py-3">
            <Thumbnail src={product.imageUrl} alt={product.name} />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">{product.name}</p>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <MaterialBadge material={product.material} />
                <StatusBadge isVisible={product.isVisible} />
              </div>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => onEdit(product)}
                title="Edit"
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <EditIcon />
              </button>
              <button
                onClick={() => onDelete(product.id)}
                title="Delete"
                className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
