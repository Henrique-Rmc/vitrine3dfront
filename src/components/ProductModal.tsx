import { useEffect } from 'react'
import type { Product } from '../types'
import { buildWhatsAppUrl } from '../utils/whatsapp'
import { registerWhatsAppClick } from '../services/productService'

const MATERIAL_BADGE: Record<string, string> = {
  PLA:    'bg-amber-50 text-amber-700 border-amber-200',
  ABS:    'bg-slate-100 text-slate-600 border-slate-200',
  Resina: 'bg-violet-50 text-violet-700 border-violet-200',
  PETG:   'bg-teal-50 text-teal-700 border-teal-200',
}
const defaultBadge = 'bg-stone-100 text-stone-500 border-stone-200'

interface ProductModalProps {
  product: Product
  whatsappNumber: string
  categoryName: string
  onClose: () => void
}

export default function ProductModal({ product, whatsappNumber, categoryName, onClose }: ProductModalProps) {
  const { name, imageUrl, material, multicolor, dimensions, description } = product
  const badgeStyle = MATERIAL_BADGE[material ?? ''] ?? defaultBadge
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, name)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={name}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-[#1c1813]/40 backdrop-blur-sm animate-[modal-backdrop-in_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[85vh] flex flex-col sm:flex-row overflow-hidden bg-white border border-[#e8e2d8] rounded-t-2xl sm:rounded-2xl shadow-2xl animate-[modal-panel-in_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image side */}
        <div className="relative w-full aspect-square sm:w-72 sm:aspect-auto shrink-0 bg-[#f4f1eb]">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-16 h-16 text-[#d4cec5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
          )}

          {multicolor && (
            <span className="absolute top-3 left-3 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-[#6b5d52] border border-[#e8e2d8]">
              Multicolor
            </span>
          )}

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur-sm p-1.5 text-[#9c8e84] hover:text-[#1c1813] border border-[#e8e2d8] transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Details side */}
        <div className="flex flex-col gap-5 p-5 sm:p-6 overflow-y-auto flex-1">
          <div>
            <h2 className="text-xl font-bold text-[#1c1813] leading-tight">{name}</h2>
            {categoryName && (
              <span className="text-xs text-[#9c8e84] mt-1 block">{categoryName}</span>
            )}
          </div>

          <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3 text-sm border-t border-[#f0ece5] pt-4">
            {material && (
              <>
                <dt className="text-[#9c8e84] self-center">Material</dt>
                <dd>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badgeStyle}`}>
                    {material}
                  </span>
                </dd>
              </>
            )}

            {dimensions && (
              <>
                <dt className="text-[#9c8e84] self-center">Dimensões</dt>
                <dd className="text-[#6b5d52] font-mono text-xs">{dimensions}</dd>
              </>
            )}

            <dt className="text-[#9c8e84] self-center">Multicolor</dt>
            <dd className={multicolor ? 'text-green-600 font-medium' : 'text-[#c4b8ae]'}>
              {multicolor ? '✓ Sim' : '— Não'}
            </dd>

            {product.price != null && (
              <>
                <dt className="text-[#9c8e84] self-center">Preço</dt>
                <dd className="text-[#c9922c] font-bold text-base">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                </dd>
              </>
            )}
          </dl>

          {description && (
            <div className="border-t border-[#f0ece5] pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9c8e84] mb-2">
                Descrição
              </p>
              <p className="text-sm text-[#6b5d52] leading-relaxed">{description}</p>
            </div>
          )}

          <div className="mt-auto pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => registerWhatsAppClick(product.id)}
              className="flex items-center justify-center gap-2.5 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-700 px-5 py-3.5 text-sm font-semibold text-white transition-colors"
            >
              <WhatsAppIcon />
              {product.price != null ? 'Fazer Pedido via WhatsApp' : 'Solicitar Orçamento via WhatsApp'}
            </a>
          </div>
        </div>
      </div>
    </div>
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
