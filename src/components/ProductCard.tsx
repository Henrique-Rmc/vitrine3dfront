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

interface ProductCardProps {
  product: Product
  whatsappNumber: string
  onOpenModal: (product: Product) => void
}

export default function ProductCard({ product, whatsappNumber, onOpenModal }: ProductCardProps) {
  const { name, imageUrl, materialName } = product
  const badgeStyle = MATERIAL_BADGE[materialName ?? ''] ?? defaultBadge
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, name)

  return (
    <article
      className="group bg-white border border-[#e8e2d8] rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col"
      onClick={() => onOpenModal(product)}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[#f4f1eb]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-[#d4cec5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        )}

      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {materialName && (
          <span className={`self-start rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeStyle}`}>
            {materialName}
          </span>
        )}

        <h3 className="text-sm font-semibold text-[#1c1813] leading-snug line-clamp-2 flex-1">{name}</h3>

        {product.price != null && (
          <p className="text-sm font-bold text-[#c9922c]">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
          </p>
        )}

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => { e.stopPropagation(); registerWhatsAppClick(product.id) }}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-500 active:bg-green-700 px-2.5 py-2 text-[11px] font-semibold text-white transition-colors"
          aria-label={`${product.price != null ? 'Fazer pedido' : 'Solicitar orçamento'} para ${name} via WhatsApp`}
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
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
