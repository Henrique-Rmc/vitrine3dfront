import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Category, Material, Product } from '../types'

interface CategoryBarProps {
  categories: Category[]
  materials: Material[]
  products: Product[]
}

export default function CategoryBar({ categories, materials, products }: CategoryBarProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  const activeCategoryId = searchParams.get('category')
    ? Number(searchParams.get('category'))
    : null

  const activeMaterialId = searchParams.get('material')
    ? Number(searchParams.get('material'))
    : null

  function selectCategory(id: number | null) {
    const next = new URLSearchParams(searchParams)
    if (id === null) next.delete('category')
    else next.set('category', String(id))
    setSearchParams(next, { replace: true })
  }

  function selectMaterial(id: number | null) {
    const next = new URLSearchParams(searchParams)
    if (id === null) next.delete('material')
    else next.set('material', String(id))
    setSearchParams(next, { replace: true })
  }

  // When a category is selected, only show materials present in that category's products.
  const visibleMaterials = useMemo(() => {
    if (activeCategoryId === null) return materials
    const idsInCategory = new Set(
      products
        .filter((p) => p.isVisible && p.categoryId === activeCategoryId && p.materialId != null)
        .map((p) => p.materialId!),
    )
    return materials.filter((m) => idsInCategory.has(m.id))
  }, [materials, products, activeCategoryId])

  const chip = (active: boolean) =>
    `px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
      active
        ? 'bg-[#1c1813] border-[#1c1813] text-white shadow-sm'
        : 'border-[#e8e2d8] text-[#6b5d52] bg-white hover:border-[#d4cec5] hover:text-[#1c1813]'
    }`

  const hasMaterials = visibleMaterials.length > 0

  return (
    <div className="sticky top-14 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e2d8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Category row */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none py-3">
          <button onClick={() => selectCategory(null)} className={chip(activeCategoryId === null && activeMaterialId === null)}>
            Todos
          </button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => selectCategory(cat.id)} className={chip(activeCategoryId === cat.id)}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Material row — only when there are materials to show */}
        {hasMaterials && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-3">
            <button
              onClick={() => selectMaterial(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                activeMaterialId === null
                  ? 'bg-[#f4f1eb] border-[#d4cec5] text-[#6b5d52]'
                  : 'border-[#e8e2d8] text-[#9c8e84] bg-white hover:border-[#d4cec5] hover:text-[#6b5d52]'
              }`}
            >
              Todos materiais
            </button>
            {visibleMaterials.map((mat) => (
              <button
                key={mat.id}
                onClick={() => selectMaterial(mat.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                  activeMaterialId === mat.id
                    ? 'bg-[#1c1813] border-[#1c1813] text-white'
                    : 'border-[#e8e2d8] text-[#9c8e84] bg-white hover:border-[#d4cec5] hover:text-[#6b5d52]'
                }`}
              >
                {mat.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
