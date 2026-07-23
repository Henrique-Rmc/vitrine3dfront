import { useMemo, useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import StoreProfileHeader from '../components/StoreProfileHeader'
import HeroSection from '../components/HeroSection'
import ProductCard from '../components/ProductCard'
import ProductModal from '../components/ProductModal'
import ProductSkeleton from '../components/ProductSkeleton'
import { useStoreInfo } from '../hooks/useStoreInfo'
import { listProductTypes, type ProductType } from '../services/productTypeService'
import { listEffectiveAttributes, type AttributeDefinition } from '../services/attributeService'
import { readActiveAttributes } from '../utils/attributeFilters'
import type { Product } from '../types'

const SKELETON_COUNT = 8

function typeTab(active: boolean) {
  return `px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border ${
    active
      ? 'bg-cta border-cta text-cta-fg shadow-sm'
      : 'border-border text-ink-2 bg-white hover:border-border-2 hover:text-ink'
  }`
}

function chip(active: boolean) {
  return `px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
    active
      ? 'bg-cta border-cta text-cta-fg shadow-sm'
      : 'border-border text-ink-2 bg-white hover:border-border-2 hover:text-ink'
  }`
}

export default function StorePage() {
  const { storeSlug = '' } = useParams<{ storeSlug: string }>()
  const { isAuthenticated } = useAuth()
  const {
    storeId,
    storeName,
    storeDescription,
    whatsappNumber,
    logoUrl,
    coverImageUrl,
    products,
    featuredProducts,
    loading,
    error,
    hasMore,
    isLoadingMore,
    loadMore,
  } = useStoreInfo(storeSlug)

  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedProduct, setSelectedProduct]     = useState<Product | null>(null)
  const [productTypes, setProductTypes]           = useState<ProductType[]>([])
  const [selectedTypeId, setSelectedTypeId]       = useState<number | null>(null)
  const [filterPanelOpen, setFilterPanelOpen]     = useState(false)
  const [attrDefinitions, setAttrDefinitions]     = useState<AttributeDefinition[]>([])

  useEffect(() => {
    if (!filterPanelOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFilterPanelOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filterPanelOpen])

  useEffect(() => {
    if (!storeId) return
    listProductTypes(storeId)
      .then(setProductTypes)
      .catch(() => {})
  }, [storeId])

  // Load attribute definitions (source of filter labels) whenever type changes
  useEffect(() => {
    if (!storeId) return
    listEffectiveAttributes(storeId, selectedTypeId ?? undefined)
      .then((defs) => setAttrDefinitions(defs.filter((d) => d.filterable !== false)))
      .catch(() => {})
  }, [storeId, selectedTypeId])

  const visibleProducts = useMemo(
    () => products.filter((p) => p.isVisible),
    [products],
  )

  const featuredProductIds = useMemo(
    () => new Set(featuredProducts.map((p) => p.id)),
    [featuredProducts],
  )

  const activeAttributes = useMemo(
    () => readActiveAttributes(searchParams),
    [searchParams],
  )

  const hasActiveFilter = Object.keys(activeAttributes).length > 0
  const activeCount = Object.keys(activeAttributes).length

  // Filter products by selected product type
  const typeFilteredProducts = useMemo(() => {
    if (selectedTypeId === null) return visibleProducts
    return visibleProducts.filter((p) => p.productTypeId === selectedTypeId)
  }, [visibleProducts, selectedTypeId])

  // Derive attribute filter options from definitions + actual product values.
  // Keys are attribute `key`s; values are unique sorted values from loaded products.
  // Only attributes that have at least one value in the current product set are shown.
  const attributeMap = useMemo(() => {
    const filterableKeys = new Set(attrDefinitions.map((d) => d.key))
    const map = new Map<string, { label: string; values: string[] }>()
    for (const p of typeFilteredProducts) {
      if (!p.attributes) continue
      for (const [key, rawValue] of Object.entries(p.attributes)) {
        if (!filterableKeys.has(key) || rawValue == null) continue
        const value = String(rawValue)
        if (!map.has(key)) {
          const def = attrDefinitions.find((d) => d.key === key)
          map.set(key, { label: def?.label ?? key, values: [] })
        }
        if (!map.get(key)!.values.includes(value)) map.get(key)!.values.push(value)
      }
    }
    for (const entry of map.values()) entry.values.sort()
    return map
  }, [typeFilteredProducts, attrDefinitions])

  const catalogProducts = useMemo(() => {
    return typeFilteredProducts.filter((p) => {
      // Hide featured products from catalog only on the "all" view with no filters
      if (selectedTypeId === null && !hasActiveFilter && featuredProductIds.has(p.id)) return false
      for (const [key, value] of Object.entries(activeAttributes)) {
        if (String(p.attributes?.[key] ?? '') !== value) return false
      }
      return true
    })
  }, [typeFilteredProducts, featuredProductIds, activeAttributes, hasActiveFilter, selectedTypeId])

  function getActive(key: string): string | null {
    return searchParams.get(`attr_${key}`) ?? null
  }

  function setFilter(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams)
    if (value === null) next.delete(`attr_${key}`)
    else next.set(`attr_${key}`, value)
    setSearchParams(next, { replace: true })
  }

  function handleTypeChange(typeId: number | null) {
    setSelectedTypeId(typeId)
    setSearchParams({}, { replace: true })
    setFilterPanelOpen(false)
  }

  function clearAllFilters() {
    setSearchParams({}, { replace: true })
  }

  function sectionTitle() {
    if (selectedTypeId !== null) {
      if (hasActiveFilter) return Object.values(activeAttributes).join(' · ')
      return productTypes.find((t) => t.id === selectedTypeId)?.label ?? 'Produtos'
    }
    if (!hasActiveFilter) return 'Todos os Produtos'
    return Object.values(activeAttributes).join(' · ')
  }

  const hasTypeTabs = productTypes.length > 0
  // Show attr chips only when there are filterable attributes with values in the current view
  const showAttrChips = attributeMap.size > 0 && (selectedTypeId !== null || !hasTypeTabs)
  const showFilterBar = !loading && (hasTypeTabs || showAttrChips)

  if (!loading && error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
        <p className="text-ink-2 text-sm mb-2">{error}</p>
        <p className="text-ink-4 text-xs">/{storeSlug}</p>
      </div>
    )
  }

  return (
    <>
      {/* Store Profile */}
      <StoreProfileHeader
        storeName={storeName || 'Carregando…'}
        storeDescription={storeDescription}
        logoUrl={logoUrl}
      />

      {/* Combined filter bar: type tabs + filter trigger */}
      {showFilterBar && (
        <div className="sticky top-16 md:top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* ProductType tabs */}
            {hasTypeTabs && (
              <div className={`flex items-center gap-2 overflow-x-auto scrollbar-none py-2.5 ${showAttrChips ? 'border-b border-border' : ''}`}>
                <button onClick={() => handleTypeChange(null)} className={typeTab(selectedTypeId === null)}>
                  Todos
                </button>
                {productTypes.map((pt) => (
                  <button key={pt.id} onClick={() => handleTypeChange(pt.id)} className={typeTab(selectedTypeId === pt.id)}>
                    {pt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Filter trigger row */}
            {showAttrChips && (
              <div className="flex items-center gap-2 py-2.5 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setFilterPanelOpen((o) => !o)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 shrink-0 ${
                    filterPanelOpen || activeCount > 0
                      ? 'bg-cta border-cta text-cta-fg shadow-sm'
                      : 'border-border text-ink-2 bg-white hover:border-border-2 hover:text-ink'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                  Filtros
                  {activeCount > 0 && (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/25 text-[10px] font-bold">
                      {activeCount}
                    </span>
                  )}
                </button>

                {/* Active filter summary chips */}
                {Object.entries(activeAttributes).map(([key, value]) => (
                  <span key={key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 border border-border text-xs font-medium text-ink-2 shrink-0">
                    <span className="text-ink-3">{key}:</span>
                    {value}
                    <button
                      onClick={() => setFilter(key, null)}
                      className="ml-0.5 hover:text-ink transition-colors"
                      aria-label={`Remover filtro ${key}`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop inline filter panel */}
      {showAttrChips && filterPanelOpen && (
        <div className="hidden md:block border-b border-border bg-surface">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
            <div className="space-y-4">
              {Array.from(attributeMap.entries()).map(([key, { label, values }]) => (
                <div key={key} className="flex items-start gap-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-3 pt-1.5 w-24 shrink-0">
                    {label}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setFilter(key, null)} className={chip(getActive(key) === null)}>
                      Todos
                    </button>
                    {values.map((value) => {
                      const isBool = values.length <= 2 && values.every((v) => v === 'true' || v === 'false')
                      const display = isBool ? (value === 'true' ? 'Sim' : 'Não') : value
                      return (
                        <button key={value} onClick={() => setFilter(key, value)} className={chip(getActive(key) === value)}>
                          {display}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              {activeCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-ink-3 hover:text-ink transition-colors mt-1"
                >
                  Limpar todos os filtros
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom sheet */}
      {showAttrChips && filterPanelOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
            onClick={() => setFilterPanelOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] flex flex-col shadow-2xl">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-8 h-1 rounded-full bg-border" />
            </div>
            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
              <p className="text-sm font-bold text-ink">Filtros</p>
              <div className="flex items-center gap-3">
                {activeCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-ink-3 hover:text-ink transition-colors"
                  >
                    Limpar todos
                  </button>
                )}
                <button
                  onClick={() => setFilterPanelOpen(false)}
                  aria-label="Fechar filtros"
                  className="p-1 rounded-md text-ink-3 hover:text-ink transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Attribute groups */}
            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-6">
              {Array.from(attributeMap.entries()).map(([key, { label, values }]) => (
                <div key={key}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-3">
                    {label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setFilter(key, null)} className={chip(getActive(key) === null)}>
                      Todos
                    </button>
                    {values.map((value) => {
                      const isBool = values.length <= 2 && values.every((v) => v === 'true' || v === 'false')
                      const display = isBool ? (value === 'true' ? 'Sim' : 'Não') : value
                      return (
                        <button key={value} onClick={() => setFilter(key, value)} className={chip(getActive(key) === value)}>
                          {display}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            {/* Footer CTA */}
            <div className="px-5 py-4 border-t border-border shrink-0">
              <button
                onClick={() => setFilterPanelOpen(false)}
                className="w-full py-3 rounded-xl bg-cta hover:bg-cta-2 text-cta-fg text-sm font-semibold transition-colors"
              >
                Ver {catalogProducts.length} produto{catalogProducts.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero — only on "all" view with no attribute filters */}
        {!loading && selectedTypeId === null && !hasActiveFilter && featuredProducts.length > 0 && (
          <HeroSection
            products={featuredProducts}
            whatsappNumber={whatsappNumber}
            onOpenModal={setSelectedProduct}
          />
        )}

        {/* Catalog */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-ink">{sectionTitle()}</h2>
            {!loading && (
              <span className="text-sm text-ink-3">
                {catalogProducts.length} produto{catalogProducts.length !== 1 ? 's' : ''}
                {hasMore ? '+' : ''}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {loading
              ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))
              : catalogProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    whatsappNumber={whatsappNumber}
                    onOpenModal={setSelectedProduct}
                  />
                ))}
          </div>

          {!loading && catalogProducts.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-ink-3 text-sm">
                {hasActiveFilter || selectedTypeId !== null
                  ? 'Nenhum produto encontrado com esses filtros.'
                  : 'Nenhum produto disponível.'}
              </p>
              {(hasActiveFilter || selectedTypeId !== null) && (
                <button
                  onClick={() => { clearAllFilters(); setSelectedTypeId(null) }}
                  className="mt-3 text-sm text-brand hover:text-brand-dim transition-colors font-medium"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}

          {!loading && hasMore && (
            <div className="flex justify-center mt-10">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-8 py-3 rounded-full border border-border text-ink-2 hover:text-ink hover:border-border-2 disabled:opacity-60 text-sm font-medium transition-colors bg-white shadow-sm"
              >
                {isLoadingMore ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-border-2 border-t-ink-3 animate-spin" />
                    Carregando…
                  </>
                ) : (
                  'Ver mais produtos'
                )}
              </button>
            </div>
          )}
        </section>
      </div>

      {/* WhatsApp floating button — mobile only, hidden for logged-in admins */}
      {!loading && whatsappNumber && !isAuthenticated && (
        <div className="fixed bottom-6 right-4 z-40 sm:hidden">
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold text-sm px-4 py-3 rounded-full shadow-lg transition-colors"
          >
            <WhatsAppIcon />
            Falar com o vendedor
          </a>
        </div>
      )}

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          whatsappNumber={whatsappNumber}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
