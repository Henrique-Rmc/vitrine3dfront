import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Product } from '../types'

interface AttributeFilterBarProps {
  products: Product[]
}

function chip(active: boolean) {
  return `px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
    active
      ? 'bg-[#1c1813] border-[#1c1813] text-white shadow-sm'
      : 'border-[#e8e2d8] text-[#6b5d52] bg-white hover:border-[#d4cec5] hover:text-[#1c1813]'
  }`
}

export default function AttributeFilterBar({ products }: AttributeFilterBarProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  // Build map of attribute key → sorted unique string values present in visible products
  const attributeMap = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const p of products) {
      if (!p.attributes) continue
      for (const [key, rawValue] of Object.entries(p.attributes)) {
        if (rawValue == null) continue
        const value = String(rawValue)
        if (!map.has(key)) map.set(key, [])
        if (!map.get(key)!.includes(value)) map.get(key)!.push(value)
      }
    }
    // Sort values within each key
    for (const values of map.values()) values.sort()
    return map
  }, [products])

  if (attributeMap.size === 0) return null

  function getActive(key: string): string | null {
    return searchParams.get(`attr_${key}`) ?? null
  }

  function setFilter(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams)
    if (value === null) next.delete(`attr_${key}`)
    else next.set(`attr_${key}`, value)
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="sticky top-14 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e2d8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {Array.from(attributeMap.entries()).map(([key, values]) => (
          <div key={key} className="flex items-center gap-2 overflow-x-auto scrollbar-none py-2.5 border-b border-[#f0ece5] last:border-b-0">
            <span className="text-[11px] font-semibold text-[#9c8e84] uppercase tracking-wide shrink-0 w-20 truncate">
              {key}
            </span>
            <button
              onClick={() => setFilter(key, null)}
              className={chip(getActive(key) === null)}
            >
              Todos
            </button>
            {values.map((value) => (
              <button
                key={value}
                onClick={() => setFilter(key, value)}
                className={chip(getActive(key) === value)}
              >
                {value}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Reads active attribute filters from URL search params (keys prefixed with attr_) */
export function readActiveAttributes(searchParams: URLSearchParams): Record<string, string> {
  const attrs: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (key.startsWith('attr_')) attrs[key.slice(5)] = value
  })
  return attrs
}
