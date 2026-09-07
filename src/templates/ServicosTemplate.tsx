import { useState, useEffect, useMemo, useRef } from 'react'
import { themeToStyle } from '../constants/storeThemes'
import type { StoreTemplateProps } from './types'
import type { Product } from '../types'

// ── Helpers ────────────────────────────────────────────────────────────────

function useScrollPast(threshold: number) {
  const [past, setPast] = useState(false)
  useEffect(() => {
    const fn = () => setPast(window.scrollY > threshold)
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => window.removeEventListener('scroll', fn)
  }, [threshold])
  return past
}

function RevealDiv({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect() } },
      { threshold: 0.05 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'none' : 'translateY(20px)',
        transition: `opacity 0.6s cubic-bezier(0.4,0,0.2,1) ${delay}ms, transform 0.6s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ── Service card ───────────────────────────────────────────────────────────

function ServiceCard({
  product,
  whatsappNumber,
  featured,
}: {
  product: Product
  whatsappNumber: string | null
  featured: boolean
}) {
  const waLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Olá! Gostaria de agendar: ${product.name}`)}`
    : null
  const hasPrice = product.price != null && product.price > 0
  const priceStr = hasPrice
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price!)
    : null

  return (
    <article className="group flex flex-col bg-surface rounded-2xl overflow-hidden border border-border hover:border-border-2 transition-all duration-300 hover:shadow-md">
      {product.imageUrl && (
        <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          {featured && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-cta text-cta-fg text-[10px] font-bold tracking-widest uppercase shadow-sm">
              Destaque
            </span>
          )}
        </div>
      )}
      <div className="flex flex-col flex-1 p-5">
        {featured && !product.imageUrl && (
          <span className="self-start mb-3 px-2.5 py-0.5 rounded-full bg-cta/10 text-cta text-[10px] font-bold tracking-widest uppercase border border-cta/20">
            Destaque
          </span>
        )}
        <h3 className="font-semibold text-ink text-[15px] leading-snug">{product.name}</h3>
        {product.description && (
          <p className="mt-2 text-sm text-ink-3 leading-relaxed line-clamp-2 flex-1">
            {product.description}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className={`text-sm font-bold ${hasPrice ? 'text-cta' : 'text-ink-4'}`}>
            {priceStr ?? 'Consulte o valor'}
          </span>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-[13px] font-semibold text-cta-fg bg-cta hover:bg-cta-2 px-4 py-2 rounded-xl transition-colors duration-200"
            >
              Agendar
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function ServiceSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-surface animate-pulse">
      <div className="bg-surface-2" style={{ aspectRatio: '4/3' }} />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-surface-2 rounded-md w-3/4" />
        <div className="h-3 bg-surface-2 rounded-md w-full" />
        <div className="h-3 bg-surface-2 rounded-md w-2/3" />
        <div className="flex justify-between items-center mt-4">
          <div className="h-4 bg-surface-2 rounded-md w-20" />
          <div className="h-8 bg-surface-2 rounded-xl w-24" />
        </div>
      </div>
    </div>
  )
}

// ── WhatsApp icon ──────────────────────────────────────────────────────────

function WAIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function ServicosTemplate({
  storeName,
  storeDescription,
  whatsappNumber,
  logoUrl,
  cityName,
  coverImageUrl,
  coverColor,
  storeNameFont,
  storeTheme,
  products,
  featuredProducts,
  loading,
  hasMore,
  isLoadingMore,
  loadMore,
  isAuthenticated,
}: StoreTemplateProps) {
  // Hero entrance
  const [heroIn, setHeroIn] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setHeroIn(true), 80)
    return () => clearTimeout(id)
  }, [])

  // Sticky header / bottom CTA trigger (60% of viewport height)
  const [heroHeight, setHeroHeight] = useState(600)
  const heroRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    setHeroHeight(el.offsetHeight * 0.6)
  }, [])
  const pastHero = useScrollPast(heroHeight)

  const visibleProducts = useMemo(() => products.filter((p) => p.isVisible), [products])
  const featuredIds = useMemo(
    () => new Set(featuredProducts.map((p) => p.id)),
    [featuredProducts],
  )

  const waMain = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Olá, vim pelo site e gostaria de mais informações!')}`
    : null

  // Hero background
  const heroBg: React.CSSProperties = coverImageUrl
    ? { backgroundImage: `url(${coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center top' }
    : coverColor
      ? { backgroundColor: coverColor }
      : { background: 'linear-gradient(135deg, var(--c-cta) 0%, var(--c-cta-2, var(--c-cta)) 100%)' }

  // Overlay opacity: lighter for solid color, stronger for image (photo variety requires it)
  const overlayStyle: React.CSSProperties = {
    background: coverImageUrl
      ? 'linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.75) 100%)'
      : 'linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.35) 100%)',
  }

  return (
    <div style={themeToStyle(storeTheme)} className="min-h-screen bg-canvas">

      {/* ── Sticky mini-header ──────────────────────────────────────────── */}
      <header
        aria-hidden={!pastHero}
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 h-14"
        style={{
          opacity: pastHero ? 1 : 0,
          pointerEvents: pastHero ? 'auto' : 'none',
          backdropFilter: 'blur(14px) saturate(160%)',
          WebkitBackdropFilter: 'blur(14px) saturate(160%)',
          backgroundColor: 'color-mix(in srgb, var(--c-canvas) 85%, transparent)',
          borderBottom: '1px solid var(--c-border)',
          transition: 'opacity 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={storeName}
              className="w-7 h-7 rounded-full object-cover shrink-0 border border-border"
            />
          )}
          <span
            className="text-sm font-bold text-ink truncate"
            style={{ fontFamily: storeNameFont ?? undefined }}
          >
            {storeName}
          </span>
        </div>
        {waMain && (
          <a
            href={waMain}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cta text-cta-fg text-[12px] font-bold transition-colors duration-200 hover:bg-cta-2"
          >
            <WAIcon className="w-3.5 h-3.5" />
            Agendar
          </a>
        )}
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative flex flex-col justify-end"
        style={{ minHeight: '100svh', ...heroBg }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={overlayStyle} />

        {/* Hero content */}
        <div
          className="relative z-10 px-6 pb-14 sm:pb-16 pt-20 flex flex-col items-center text-center"
          style={{
            opacity: heroIn ? 1 : 0,
            transform: heroIn ? 'none' : 'translateY(20px)',
            transition: 'opacity 0.75s cubic-bezier(0.4,0,0.2,1), transform 0.75s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {logoUrl && (
            <div
              className="mb-5 rounded-full overflow-hidden border-2 border-white/25 shadow-xl"
              style={{
                width: 88,
                height: 88,
                opacity: heroIn ? 1 : 0,
                transform: heroIn ? 'scale(1)' : 'scale(0.82)',
                transition: 'opacity 0.6s 0.08s ease-out, transform 0.6s 0.08s ease-out',
              }}
            >
              <img src={logoUrl} alt={storeName} className="w-full h-full object-cover" />
            </div>
          )}

          <h1
            className="text-4xl sm:text-5xl font-bold text-white leading-tight"
            style={{
              fontFamily: storeNameFont ?? undefined,
              textShadow: '0 2px 24px rgba(0,0,0,0.25)',
            }}
          >
            {storeName || 'Carregando…'}
          </h1>

          {storeDescription && (
            <p className="mt-3 text-white/80 text-base sm:text-lg max-w-sm leading-relaxed">
              {storeDescription}
            </p>
          )}

          {cityName && (
            <div className="mt-3 flex items-center gap-1.5 text-white/55 text-sm">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {cityName}
            </div>
          )}

          {waMain && (
            <a
              href={waMain}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 w-full max-w-xs flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-cta text-cta-fg font-bold text-base shadow-lg hover:bg-cta-2 active:scale-[0.97] transition-all duration-200"
            >
              <WAIcon />
              Agendar pelo WhatsApp
            </a>
          )}
        </div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
          aria-hidden="true"
          style={{
            opacity: heroIn && !pastHero ? 0.45 : 0,
            transition: 'opacity 0.5s ease',
            transitionDelay: heroIn ? '1.2s' : '0s',
          }}
        >
          <span className="text-white text-[10px] font-bold tracking-[0.2em] uppercase">
            Serviços
          </span>
          <svg
            className="w-4 h-4 text-white animate-bounce"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Services ────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-12 pb-28 sm:pb-12">

        {/* Section label */}
        <RevealDiv className="mb-8 flex items-center gap-4">
          <span className="text-xs font-bold text-ink-4 tracking-[0.18em] uppercase shrink-0">
            Serviços
          </span>
          <div className="flex-1 h-px bg-border" />
        </RevealDiv>

        {/* Featured services */}
        {!loading && featuredProducts.filter((p) => p.isVisible).length > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            {featuredProducts
              .filter((p) => p.isVisible)
              .map((product, i) => (
                <RevealDiv key={product.id} delay={i * 60}>
                  <ServiceCard
                    product={product}
                    whatsappNumber={whatsappNumber}
                    featured
                  />
                </RevealDiv>
              ))}
          </div>
        )}

        {/* Divider when both sections coexist */}
        {!loading &&
          featuredProducts.some((p) => p.isVisible) &&
          visibleProducts.some((p) => !featuredIds.has(p.id)) && (
            <RevealDiv className="mb-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-ink-4 tracking-[0.16em] uppercase font-medium shrink-0">
                Todos os serviços
              </span>
              <div className="flex-1 h-px bg-border" />
            </RevealDiv>
          )}

        {/* All services */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <ServiceSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {visibleProducts
              .filter((p) => featuredProducts.length === 0 || !featuredIds.has(p.id))
              .map((product, i) => (
                <RevealDiv key={product.id} delay={Math.min(i * 55, 330)}>
                  <ServiceCard
                    product={product}
                    whatsappNumber={whatsappNumber}
                    featured={false}
                  />
                </RevealDiv>
              ))}
          </div>
        )}

        {!loading && visibleProducts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-ink-4 text-sm">Nenhum serviço disponível no momento.</p>
          </div>
        )}

        {!loading && hasMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="flex items-center gap-2 px-8 py-3 rounded-full border border-border text-ink-2 hover:text-ink hover:border-border-2 disabled:opacity-50 text-sm font-medium transition-colors bg-canvas shadow-sm"
            >
              {isLoadingMore ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-border-2 border-t-ink-3 animate-spin" />
                  Carregando…
                </>
              ) : (
                'Ver mais serviços'
              )}
            </button>
          </div>
        )}
      </main>

      {/* ── Sticky WhatsApp footer — mobile, visible after hero ──────────── */}
      {waMain && !isAuthenticated && (
        <div
          className="sm:hidden fixed bottom-0 inset-x-0 z-40 px-4 pb-5 pt-4"
          style={{
            opacity: pastHero ? 1 : 0,
            transform: pastHero ? 'none' : 'translateY(10px)',
            pointerEvents: pastHero ? 'auto' : 'none',
            background: 'linear-gradient(to top, var(--c-canvas) 65%, transparent)',
            transition: 'opacity 0.35s cubic-bezier(0.4,0,0.2,1), transform 0.35s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <a
            href={waMain}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl bg-cta text-cta-fg font-bold text-[15px] shadow-lg hover:bg-cta-2 active:scale-[0.98] transition-all duration-150"
          >
            <WAIcon />
            Agendar pelo WhatsApp
          </a>
        </div>
      )}
    </div>
  )
}
