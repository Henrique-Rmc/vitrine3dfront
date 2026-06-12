import { useRef, useState } from 'react'
import type { Product } from '../types'
import { buildWhatsAppUrl } from '../utils/whatsapp'

interface HeroSectionProps {
  products: Product[]
  whatsappNumber: string
  onOpenModal: (product: Product) => void
}

export default function HeroSection({ products, whatsappNumber, onOpenModal }: HeroSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  if (products.length === 0) return null

  const [main, ...rest] = products

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

  return (
    <section className="mb-10">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
        Em Destaque
      </p>

      {/* ── Mobile: snap carousel ── */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="lg:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none"
      >
        {products.map((p) => (
          <div key={p.id} className="snap-start shrink-0 w-[68%]">
            <HeroCard
              product={p}
              whatsappNumber={whatsappNumber}
              large
              onOpenModal={onOpenModal}
            />
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      {products.length > 1 && (
        <div className="lg:hidden flex justify-center items-center gap-1.5 mt-3">
          {products.map((_, i) => (
            <button
              key={i}
              aria-label={`Ir para destaque ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              className={`rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'w-5 h-1.5 bg-blue-500'
                  : 'w-1.5 h-1.5 bg-zinc-700 hover:bg-zinc-500'
              }`}
            />
          ))}
        </div>
      )}

      {/* ── Desktop: bento grid ── */}
      <div className="hidden lg:grid gap-3 grid-cols-2 grid-rows-2">
        <HeroCard
          product={main}
          whatsappNumber={whatsappNumber}
          large
          className="row-span-2"
          onOpenModal={onOpenModal}
        />
        {rest.slice(0, 2).map((p) => (
          <HeroCard
            key={p.id}
            product={p}
            whatsappNumber={whatsappNumber}
            onOpenModal={onOpenModal}
          />
        ))}
      </div>
    </section>
  )
}

interface HeroCardProps {
  product: Product
  whatsappNumber: string
  large?: boolean
  className?: string
  onOpenModal: (product: Product) => void
}

function HeroCard({ product, whatsappNumber, large = false, className = '', onOpenModal }: HeroCardProps) {
  const { name, imageUrl, material, description } = product
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, name)

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl hover:border-zinc-600 transition-colors cursor-pointer ${className}`}
      onClick={() => onOpenModal(product)}
    >
      <div className={`relative overflow-hidden ${large ? 'aspect-3/4 lg:aspect-auto lg:h-full min-h-72' : 'aspect-video'}`}>
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <span className="inline-block rounded-full bg-zinc-800/80 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-medium text-zinc-300 border border-zinc-700 mb-2">
          {material}
        </span>

        <h3 className={`font-bold text-zinc-100 leading-tight mb-1 ${large ? 'text-xl' : 'text-base'}`}>
          {name}
        </h3>

        {large && description && (
          <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{description}</p>
        )}

        {/* stopPropagation so clicking CTA opens WhatsApp, not the modal */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-500 active:bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Solicitar Orçamento
        </a>
      </div>
    </article>
  )
}
