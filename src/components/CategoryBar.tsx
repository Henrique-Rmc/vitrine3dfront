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
    `px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
      active
        ? 'bg-blue-600 border-blue-600 text-white'
        : 'border-zinc-700 text-zinc-400 bg-transparent hover:border-zinc-500 hover:text-zinc-100'
    }`

  return (
    /* top-16 = 64px sticky Header height */
    <div className="sticky top-16 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 overflow-x-auto scrollbar-none py-3">
          <button
            onClick={() => select(null)}
            className={chip(activeCategoryId === null)}
          >
            Todos
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => select(cat.id)}
              className={chip(activeCategoryId === cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
