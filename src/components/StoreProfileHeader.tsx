import { useState, useRef, useEffect } from 'react'

interface StoreProfileHeaderProps {
  storeName: string
  storeDescription: string
  logoUrl: string
}

export default function StoreProfileHeader({
  storeName,
  storeDescription,
  logoUrl,
}: StoreProfileHeaderProps) {
  const initials = storeName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const [descExpanded, setDescExpanded] = useState(false)
  const descRef = useRef<HTMLParagraphElement>(null)
  const [isLong, setIsLong] = useState(false)

  useEffect(() => {
    const el = descRef.current
    if (el) setIsLong(el.scrollHeight > el.clientHeight + 1)
  }, [storeDescription])

  return (
    <div className="bg-white border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-5 pb-6 sm:pt-6 sm:pb-8">
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
          {/* Avatar — 30% larger than previous size */}
          <div className="shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={storeName}
                className="w-36 h-36 sm:w-40 sm:h-40 rounded-full object-cover ring-4 ring-border shadow-sm"
              />
            ) : (
              <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full ring-4 ring-border shadow-sm bg-surface-2 flex items-center justify-center">
                <span className="text-4xl sm:text-5xl font-bold text-ink-4 select-none font-display">
                  {initials}
                </span>
              </div>
            )}
          </div>

          {/* Info — vertically centered alongside the avatar */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink leading-tight tracking-tight">
              {storeName}
            </h1>

            {storeDescription && (
              <div className="mt-2 max-w-xl">
                <p
                  ref={descRef}
                  className={`text-sm text-ink-2 leading-relaxed ${descExpanded ? '' : 'line-clamp-2'}`}
                >
                  {storeDescription}
                </p>
                {isLong && !descExpanded && (
                  <button
                    onClick={() => setDescExpanded(true)}
                    className="text-sm text-brand hover:text-brand-dim transition-colors mt-0.5"
                  >
                    ler mais
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
