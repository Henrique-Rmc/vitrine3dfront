import { useSearchParams } from 'react-router-dom'
import type { Category } from '../types'

interface CategoryBarProps {
  categories: Category[]
}

export default function CategoryBar({ categories }: CategoryBarProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategoryId = searchParams.get('category')
    ? Number(searchParams.get('category'))
    : null

  function select(id: number | null) {
    setSearchParams(id === null ? {} : { category: String(id) }, { replace: true })
  }

  const chip = (active: boolean) =>
    `px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
      active
        ? 'bg-[#1c1813] border-[#1c1813] text-white shadow-sm'
        : 'border-[#e8e2d8] text-[#6b5d52] bg-white hover:border-[#d4cec5] hover:text-[#1c1813]'
    }`

  return (
    <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e2d8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 overflow-x-auto scrollbar-none py-3.5">
          <button onClick={() => select(null)} className={chip(activeCategoryId === null)}>
            Todos
          </button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => select(cat.id)} className={chip(activeCategoryId === cat.id)}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
