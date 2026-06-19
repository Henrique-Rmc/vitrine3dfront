import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import StoreProfileHeader from '../components/StoreProfileHeader'
import CategoryBar from '../components/CategoryBar'
import HeroSection from '../components/HeroSection'
import ProductCard from '../components/ProductCard'
import ProductModal from '../components/ProductModal'
import ProductSkeleton from '../components/ProductSkeleton'
import { useStoreInfo } from '../hooks/useStoreInfo'
import type { Product } from '../types'

const SKELETON_COUNT = 8

export default function StorePage() {
  const { storeSlug = '' } = useParams<{ storeSlug: string }>()
  const {
    storeName,
    storeDescription,
    whatsappNumber,
    logoUrl,
    categories,
    products,
    featuredProducts,
    loading,
    error,
    hasMore,
    isLoadingMore,
    loadMore,
  } = useStoreInfo(storeSlug)

  const [searchParams] = useSearchParams()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const activeCategoryId = searchParams.get('category')
    ? Number(searchParams.get('category'))
    : null

  const activeCategory = categories.find((c) => c.id === activeCategoryId)

  const visibleProducts = useMemo(
    () => products.filter((p) => p.isVisible),
    [products],
  )

  const catalogProducts = useMemo(() => {
    return activeCategoryId === null
      ? visibleProducts
      : visibleProducts.filter((p) => p.categoryId === activeCategoryId)
  }, [visibleProducts, activeCategoryId])

  const selectedCategoryName = selectedProduct
    ? (categories.find((c) => c.id === selectedProduct.categoryId)?.name ?? '')
    : ''

  if (!loading && error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
        <p className="text-[#6b5d52] text-sm mb-2">{error}</p>
        <p className="text-[#c4b8ae] text-xs">/{storeSlug}</p>
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
        productCount={visibleProducts.length}
        categories={categories}
      />

      {/* Category bar */}
      {!loading && <CategoryBar categories={categories} />}

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        {!loading && activeCategoryId === null && featuredProducts.length > 0 && (
          <HeroSection
            products={featuredProducts}
            whatsappNumber={whatsappNumber}
            onOpenModal={setSelectedProduct}
          />
        )}

        {/* Catalog */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-[#1c1813]">
              {activeCategory ? activeCategory.name : 'Todos os Produtos'}
            </h2>
            {!loading && (
              <span className="text-sm text-[#9c8e84]">
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
              <p className="text-[#9c8e84] text-sm">Nenhum produto nesta categoria.</p>
            </div>
          )}

          {/* Load more */}
          {!loading && hasMore && activeCategoryId === null && (
            <div className="flex justify-center mt-10">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-8 py-3 rounded-full border border-[#e8e2d8] text-[#6b5d52] hover:text-[#1c1813] hover:border-[#d4cec5] disabled:opacity-60 text-sm font-medium transition-colors bg-white shadow-sm"
              >
                {isLoadingMore ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-[#d4cec5] border-t-[#9c8e84] animate-spin" />
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

      {/* WhatsApp floating button — mobile only */}
      {!loading && whatsappNumber && (
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
          categoryName={selectedCategoryName}
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
