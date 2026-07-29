import { useState, useRef, useEffect } from 'react'
import { STORE_FONTS, loadGoogleFont, fontStyle } from '../constants/storeFonts'

interface StoreProfileHeaderProps {
  storeName: string
  storeDescription: string
  logoUrl: string
  coverImageUrl?: string | null
  coverColor?: string | null
  storeNameFont?: string | null
  cityName?: string | null
}

export default function StoreProfileHeader({
  storeName,
  storeDescription,
  logoUrl,
  coverImageUrl,
  coverColor,
  storeNameFont,
  cityName,
}: StoreProfileHeaderProps) {
  const hasPhoto = !!coverImageUrl
  const hasColor = !hasPhoto && !!coverColor
  const hasCover = hasPhoto || hasColor

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

  useEffect(() => {
    if (!storeNameFont) return
    const font = STORE_FONTS.find((f) => f.key === storeNameFont)
    if (font) loadGoogleFont(font)
  }, [storeNameFont])

  // Over any cover (photo or color) → always white + dark shadow for guaranteed legibility
  const nameColor     = hasCover ? 'text-white'          : 'text-ink'
  const descColor     = hasCover ? 'text-white'          : 'text-ink-2'
  const readMoreColor = hasCover ? 'text-white/75 hover:text-white' : 'text-brand hover:text-brand-dim'
  const cityColor     = hasCover ? 'text-white'          : 'text-ink-3'

  // Text shadow: short crisp shadow for edge definition + wide diffuse for separation from bg
  const textShadowStrong = hasCover ? '0 1px 3px rgba(0,0,0,0.9), 0 2px 12px rgba(0,0,0,0.6)' : undefined
  const textShadowSoft   = hasCover ? '0 1px 2px rgba(0,0,0,0.85), 0 2px 8px rgba(0,0,0,0.5)'  : undefined

  return (
    <div
      className="relative border-b border-border overflow-hidden"
      style={hasColor ? { backgroundColor: coverColor! } : undefined}
    >
      {/* Cover photo */}
      {hasPhoto && (
        <>
          <img
            src={coverImageUrl!}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/10 to-transparent" />
        </>
      )}
      {/* Subtle darkening over color covers so white text + shadow reads cleanly */}
      {hasColor && <div className="absolute inset-0 bg-black/20" />}
      {!hasPhoto && !hasColor && <div className="absolute inset-0 bg-canvas" />}

      {/* Banner zone — visible only on desktop when there's a cover */}
      {hasCover && <div className="hidden sm:block sm:h-44" />}

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-7 sm:pt-5 sm:pb-10">
        <div className="flex flex-row items-start gap-4 sm:gap-6">

          {/* Avatar */}
          <div className="shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={storeName}
                className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover shadow-md ${
                  hasCover ? 'ring-2 ring-white/40' : 'ring-2 ring-border'
                }`}
              />
            ) : (
              <div className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full shadow-md flex items-center justify-center ${
                hasCover ? 'bg-white/15 ring-2 ring-white/30' : 'bg-surface-2 ring-2 ring-border'
              }`}>
                <span className={`text-2xl sm:text-3xl font-bold select-none font-display ${
                  hasCover ? 'text-white/80' : 'text-ink-4'
                }`}>
                  {initials}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1
              className={`text-xl sm:text-2xl font-extrabold leading-tight tracking-tight ${nameColor}`}
              style={{ ...fontStyle(storeNameFont), textShadow: textShadowStrong }}
            >
              {storeName}
            </h1>

            {/* City row */}
            {cityName && (
              <div
                className={`flex items-center gap-1 mt-1 ${cityColor}`}
                style={{ textShadow: textShadowSoft }}
              >
                <svg className="w-3.5 h-3.5 shrink-0 text-red-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.218-4.402 3.218-7.327C19.5 6.257 16.086 3 12 3S4.5 6.257 4.5 10.5c0 2.925 1.274 5.248 3.218 7.327a19.58 19.58 0 002.683 2.282 16.974 16.974 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium">{cityName}</span>
              </div>
            )}

            {storeDescription && (
              <div className="mt-2 max-w-xl">
                <p
                  ref={descRef}
                  className={`text-sm leading-relaxed whitespace-pre-wrap ${descColor} ${descExpanded ? '' : 'line-clamp-2'}`}
                  style={{ textShadow: textShadowSoft }}
                >
                  {storeDescription}
                </p>
                {isLong && !descExpanded && (
                  <button
                    onClick={() => setDescExpanded(true)}
                    className={`text-sm transition-colors mt-0.5 ${readMoreColor}`}
                    style={{ textShadow: textShadowSoft }}
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
