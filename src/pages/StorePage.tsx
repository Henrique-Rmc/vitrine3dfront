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
        <p className="text-zinc-400 text-sm mb-2">{error}</p>
        <p className="text-zinc-600 text-xs">vitrine3d.com/{storeSlug}</p>
      </div>
    )
  }

  return (
    <>
      {/* ── Store Profile ── */}
      <StoreProfileHeader
        storeName={storeName || 'Carregando…'}
        storeDescription={storeDescription}
        logoUrl={logoUrl}
        productCount={visibleProducts.length}
        categories={categories}
      />

      {/* ── Category bar ── */}
      {!loading && <CategoryBar categories={categories} />}

      {/* ── Content ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero — only on the "all products" view, only when featured exist */}
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
            <h2 className="text-base font-bold text-zinc-100">
              {activeCategory ? activeCategory.name : 'Todos os Produtos'}
            </h2>
            {!loading && (
              <span className="text-sm text-zinc-500">
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
              <p className="text-zinc-500 text-sm">Nenhum produto nesta categoria.</p>
            </div>
          )}

          {/* Load more */}
          {!loading && hasMore && activeCategoryId === null && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-500 disabled:opacity-60 text-sm font-medium transition-colors"
              >
                {isLoadingMore ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
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

      {/* ── Product Modal ── */}
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
