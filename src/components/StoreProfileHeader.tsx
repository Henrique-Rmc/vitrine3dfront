import type { Category } from '../types'

interface StoreProfileHeaderProps {
  storeName: string
  storeDescription: string
  logoUrl: string
  productCount: number
  categories: Category[]
}

export default function StoreProfileHeader({
  storeName,
  storeDescription,
  logoUrl,
  productCount,
  categories,
}: StoreProfileHeaderProps) {
  const initials = storeName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-6">
      <div className="mx-auto max-w-7xl flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        {/* Avatar */}
        <div className="shrink-0 relative">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={storeName}
              className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-full border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center">
              <span className="text-xl font-bold text-zinc-300 select-none">{initials}</span>
            </div>
          )}
          {/* Online indicator */}
          <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-zinc-950" />
        </div>

        {/* Info */}
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-xl font-bold text-zinc-100">{storeName}</h1>

          {storeDescription && (
            <p className="text-sm text-zinc-400 mt-0.5 max-w-lg leading-relaxed">
              {storeDescription}
            </p>
          )}

          <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 text-sm text-zinc-500">
            <span>
              <strong className="text-zinc-300 font-semibold">{productCount}</strong> produtos
            </span>
            <span className="text-zinc-700">·</span>
            <span>
              <strong className="text-zinc-300 font-semibold">{categories.length}</strong> categorias
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-auto max-w-7xl mt-6 border-t border-zinc-800/60" />
    </div>
  )
}
