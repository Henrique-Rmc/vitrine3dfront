import { useRef, useState, useCallback } from 'react'
import type { Product } from '../types'
import { buildWhatsAppUrl } from '../utils/whatsapp'
import { formatCurrency } from '../utils/formatCurrency'
import { registerWhatsAppClick } from '../services/productService'


interface HeroSectionProps {
  products: Product[]
  whatsappNumber: string
  onOpenModal: (product: Product) => void
}

export default function HeroSection({ products, whatsappNumber, onOpenModal }: HeroSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const trackRef    = useRef<HTMLDivElement>(null)
  const isDragging  = useRef(false)
  const startX      = useRef(0)
  const scrollStart = useRef(0)
  const wasDragged  = useRef(false)

  // ── Mouse drag (desktop) ────────────────────────────────────────────────────

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const el = trackRef.current
    if (!el) return
    const dist = e.pageX - el.getBoundingClientRect().left - startX.current
    if (Math.abs(dist) > 4) wasDragged.current = true
    el.scrollLeft = scrollStart.current - dist
  }, [])

  if (products.length === 0) return null

  // ── Scroll helpers ──────────────────────────────────────────────────────────

  function onScroll() {
    const el = trackRef.current
    if (!el) return
    let closest = 0
    let minDist = Infinity
    Array.from(el.children).forEach((child, i) => {
      const dist = Math.abs((child as HTMLElement).offsetLeft - el.scrollLeft)
      if (dist < minDist) { minDist = dist; closest = i }
    })
    setActiveIndex(closest)
  }

  function scrollToIndex(index: number) {
    const el = trackRef.current
    const card = el?.children[index] as HTMLElement | undefined
    if (!el || !card) return
    el.scrollTo({ left: card.offsetLeft, behavior: 'smooth' })
  }

  function scrollBy(direction: 'prev' | 'next') {
    const el = trackRef.current
    const card = el?.children[0] as HTMLElement | undefined
    if (!el || !card) return
    const step = card.offsetWidth + 16
    el.scrollBy({ left: direction === 'next' ? step : -step, behavior: 'smooth' })
  }

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const el = trackRef.current
    if (!el) return
    isDragging.current  = true
    wasDragged.current  = false
    startX.current      = e.pageX - el.getBoundingClientRect().left
    scrollStart.current = el.scrollLeft
    el.style.cursor     = 'grabbing'
  }

  function stopDrag() {
    const el = trackRef.current
    if (!el) return
    isDragging.current = false
    el.style.cursor    = ''
  }

  function handleCardClick(product: Product) {
    if (wasDragged.current) return
    onOpenModal(product)
  }

  const canPrev = activeIndex > 0
  const canNext = activeIndex < products.length - 1

  return (
    <section className="mb-8">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-3 mb-3">
        <svg className="w-3 h-3 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        Em Destaque
      </p>

      {/* Carousel wrapper — arrows positioned absolute on left/right, centered vertically */}
      <div className="relative">

        {/* Left arrow — desktop only */}
        {products.length > 1 && (
          <button
            onClick={() => scrollBy('prev')}
            disabled={!canPrev}
            aria-label="Anterior"
            className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-canvas border border-border shadow-md text-ink-2 hover:text-ink hover:border-border-2 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}

        {/* Track */}
        <div
          ref={trackRef}
          onScroll={onScroll}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none select-none cursor-grab active:cursor-grabbing"
        >
          {products.map((p) => (
            <div
              key={p.id}
              className="snap-start shrink-0 w-[60%] lg:w-[calc((100%-48px)/3.5)] self-stretch"
            >
              <HeroCard
                product={p}
                whatsappNumber={whatsappNumber}
                onOpenModal={handleCardClick}
              />
            </div>
          ))}
        </div>

        {/* Right arrow — desktop only */}
        {products.length > 1 && (
          <button
            onClick={() => scrollBy('next')}
            disabled={!canNext}
            aria-label="Próximo"
            className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-canvas border border-border shadow-md text-ink-2 hover:text-ink hover:border-border-2 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
      </div>

      {/* Dots */}
      {products.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-3">
          {products.map((_, i) => (
            <button
              key={i}
              aria-label={`Ir para destaque ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              className={`rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'w-5 h-1.5 bg-cta'
                  : 'w-1.5 h-1.5 bg-border-2 hover:bg-[#9c8e84]'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

interface HeroCardProps {
  product: Product
  whatsappNumber: string
  onOpenModal: (product: Product) => void
}

function HeroCard({ product, whatsappNumber, onOpenModal }: HeroCardProps) {
  const { name, imageUrl, description } = product
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, name)

  return (
    <article
      className="h-full group bg-canvas border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col"
      onClick={() => onOpenModal(product)}
    >
      {/* Imagem — altura fixa para todos os cards, independente do conteúdo */}
      <div className="shrink-0 aspect-square overflow-hidden bg-surface-2">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-border-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        )}
      </div>

      {/* Conteúdo — ocupa o restante da altura do card */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <h3 className="text-base font-semibold text-ink leading-snug line-clamp-2 flex-1">{name}</h3>

        {description && (
          <p className="text-xs text-ink-2 line-clamp-2">{description}</p>
        )}

        {product.price != null && (
          <p className="text-base font-bold text-brand">
            {formatCurrency(product.price)}
          </p>
        )}

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          draggable={false}
          onClick={(e) => { e.stopPropagation(); registerWhatsAppClick(product.id) }}
          className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-500 active:bg-green-700 px-3 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          <WhatsAppIcon />
          {product.price != null ? 'Fazer Pedido' : 'Solicitar Orçamento'}
        </a>
      </div>
    </article>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
