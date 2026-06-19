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
    <div className="bg-white border-b border-[#e8e2d8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="shrink-0 relative">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={storeName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-[#e8e2d8]"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full ring-4 ring-[#e8e2d8] bg-[#f4f1eb] flex items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold text-[#c4b8ae] select-none font-display">
                  {initials}
                </span>
              </div>
            )}
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
          </div>

          {/* Info */}
          <div className="text-center sm:text-left flex-1">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1c1813] leading-tight">
              {storeName}
            </h1>

            {storeDescription && (
              <p className="text-base text-[#6b5d52] mt-2 max-w-xl leading-relaxed">
                {storeDescription}
              </p>
            )}

            <div className="flex items-center justify-center sm:justify-start gap-5 mt-4">
              <div className="text-center sm:text-left">
                <p className="text-lg font-bold text-[#1c1813]">{productCount}</p>
                <p className="text-xs text-[#9c8e84] uppercase tracking-wide">Produtos</p>
              </div>
              <div className="w-px h-8 bg-[#e8e2d8]" />
              <div className="text-center sm:text-left">
                <p className="text-lg font-bold text-[#1c1813]">{categories.length}</p>
                <p className="text-xs text-[#9c8e84] uppercase tracking-wide">Categorias</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
