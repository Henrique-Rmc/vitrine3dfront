import type { ComponentType } from 'react'
import type { StoreTemplateProps, StoreTemplateType } from './types'
import LojaTemplate from './LojaTemplate'
import ServicosTemplate from './ServicosTemplate'

const TEMPLATE_MAP: Record<StoreTemplateType, ComponentType<StoreTemplateProps>> = {
  loja:     LojaTemplate,
  servicos: ServicosTemplate,
}

export function resolveTemplate(type: string | null | undefined): ComponentType<StoreTemplateProps> {
  return TEMPLATE_MAP[(type as StoreTemplateType)] ?? TEMPLATE_MAP.loja
}
