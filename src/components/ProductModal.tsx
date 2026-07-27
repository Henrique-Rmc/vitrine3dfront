import { useEffect, useRef, useState } from 'react'
import type { Product } from '../types'
import { buildWhatsAppUrl } from '../utils/whatsapp'
import { formatCurrency } from '../utils/formatCurrency'
import { registerWhatsAppClick, registerAffiliateClick } from '../services/productService'

interface ProductModalProps {
  product: Product
  whatsappNumber: string
  onClose: () => void
}

export default function ProductModal({ product, whatsappNumber, onClose }: ProductModalProps) {
  const { name, description } = product
  const isAffiliate = Boolean(product.affiliateUrl)
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, name)

  // Resolve image list: prefer imageUrls array, fall back to singular imageUrl
  const images: string[] = product.imageUrls?.length
    ? product.imageUrls
    : product.imageUrl
    ? [product.imageUrl]
    : []

  const [currentIndex, setCurrentIndex] = useState(0)
  const [showWhatsAppWarning, setShowWhatsAppWarning] = useState(false)
  const [copied, setCopied] = useState(false)

  function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}?produto=${product.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }).catch(() => undefined)
  }
  const touchStartX = useRef<number>(0)

  const currentImage = images[currentIndex] ?? null
  const hasMultiple  = images.length > 1

  function prev() {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length)
  }

  function next() {
    setCurrentIndex((i) => (i + 1) % images.length)
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (showWhatsAppWarning) setShowWhatsAppWarning(false)
        else onClose()
      }
      if (!showWhatsAppWarning && hasMultiple) {
        if (e.key === 'ArrowRight') next()
        if (e.key === 'ArrowLeft')  prev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, showWhatsAppWarning, hasMultiple]) // eslint-disable-line react-hooks/exhaustive-deps

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (!hasMultiple) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 48) {
      if (delta > 0) next()
      else prev()
    }
  }

  function handleWhatsAppClick() {
    setShowWhatsAppWarning(true)
  }

  function confirmWhatsApp() {
    registerWhatsAppClick(product.id)
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    setShowWhatsAppWarning(false)
  }

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={name}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-cta/40 backdrop-blur-sm animate-[modal-backdrop-in_0.2s_ease-out]"
        onClick={onClose}
      >
        <div
          className="relative w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[85vh] flex flex-col sm:flex-row overflow-hidden bg-canvas border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl animate-[modal-panel-in_0.2s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Image gallery panel ─────────────────────────────────────── */}
          <div className="w-full sm:w-72 shrink-0 flex flex-col">

            {/* Main image */}
            <div
              className="relative aspect-square sm:aspect-auto sm:flex-1 bg-surface-2 overflow-hidden select-none"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {currentImage ? (
                <img
                  key={currentIndex}
                  src={currentImage}
                  alt={`${name} — foto ${currentIndex + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-16 h-16 text-border-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
              )}

              {/* Prev arrow */}
              {hasMultiple && (
                <button
                  onClick={prev}
                  aria-label="Foto anterior"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-canvas/85 backdrop-blur-sm border border-border flex items-center justify-center text-ink-2 hover:bg-canvas hover:text-ink transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              )}

              {/* Next arrow */}
              {hasMultiple && (
                <button
                  onClick={next}
                  aria-label="Próxima foto"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-canvas/85 backdrop-blur-sm border border-border flex items-center justify-center text-ink-2 hover:bg-canvas hover:text-ink transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              )}

              {/* Counter badge */}
              {hasMultiple && (
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[11px] font-medium px-2 py-0.5 rounded-full pointer-events-none">
                  {currentIndex + 1} / {images.length}
                </span>
              )}

              {/* Close button */}
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="absolute top-3 right-3 rounded-full bg-canvas/90 backdrop-blur-sm p-1.5 text-ink-3 hover:text-ink border border-border transition-colors"
              >
                <XIcon />
              </button>
            </div>

            {/* Thumbnail strip — only when multiple images */}
            {hasMultiple && (
              <div className="flex gap-1.5 px-2 py-2 bg-surface-2 border-t border-border overflow-x-auto scrollbar-none">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    aria-label={`Ver foto ${i + 1}`}
                    className={`shrink-0 w-11 h-11 rounded-lg overflow-hidden transition-all ${
                      i === currentIndex
                        ? 'ring-2 ring-brand ring-offset-1 ring-offset-surface-2'
                        : 'opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details panel ───────────────────────────────────────────── */}
          <div className="flex flex-col gap-5 p-5 sm:p-6 overflow-y-auto flex-1">
            <h2 className="text-xl font-bold text-ink leading-tight">{name}</h2>

            {product.price != null && (
              <p className="text-brand font-bold text-base border-t border-border pt-4">
                {formatCurrency(product.price)}
              </p>
            )}

            {description && (
              <div className="border-t border-border pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-3 mb-2">
                  Descrição
                </p>
                <p className="text-sm text-ink-2 leading-relaxed">{description}</p>
              </div>
            )}

            <div className="mt-auto pt-2 flex flex-col gap-2">
              {isAffiliate ? (
                <button
                  onClick={() => {
                    registerAffiliateClick(product.id).catch(() => {})
                    window.open(product.affiliateUrl!, '_blank', 'noopener,noreferrer')
                  }}
                  className="flex items-center justify-center gap-2.5 rounded-xl bg-cta hover:bg-cta-2 active:bg-cta-3 px-5 py-3.5 text-sm font-semibold text-cta-fg transition-colors"
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Comprar no Site
                </button>
              ) : (
                <button
                  onClick={handleWhatsAppClick}
                  className="flex items-center justify-center gap-2.5 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-700 px-5 py-3.5 text-sm font-semibold text-white transition-colors"
                >
                  <WhatsAppIcon />
                  {product.price != null ? 'Fazer Pedido via WhatsApp' : 'Solicitar Orçamento via WhatsApp'}
                </button>
              )}
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 rounded-xl border border-border hover:border-border-2 text-ink-2 hover:text-ink px-5 py-2.5 text-sm font-medium transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Link copiado!
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                    Compartilhar produto
                  </>
                )}
              </button>
              <a
                href={`/denunciar?url=${encodeURIComponent(window.location.href)}`}
                className="text-center text-xs text-ink-4 hover:text-ink-3 transition-colors"
              >
                Reportar este produto
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── WhatsApp redirect warning ──────────────────────────────────── */}
      {showWhatsAppWarning && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-cta/50 backdrop-blur-sm"
          onClick={() => setShowWhatsAppWarning(false)}
        >
          <div
            className="w-full max-w-sm bg-canvas rounded-2xl shadow-2xl border border-border p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-warning-bg border border-warning-border flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-warning-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Você está saindo do VitreIn</h3>
                <p className="text-xs text-ink-2 mt-1 leading-relaxed">
                  Lembre-se que o VitreIn <strong>não gerencia pagamentos, envios ou entregas</strong>.
                  Toda negociação é diretamente com o vendedor e de responsabilidade exclusiva das partes.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowWhatsAppWarning(false)}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-ink-2 hover:bg-surface-2 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors"
              >
                <WhatsAppIcon />
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function XIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
