import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import StoreProfileHeader from '../components/StoreProfileHeader'
import CategoryBar from '../components/CategoryBar'
import HeroSection from '../components/HeroSection'
import ProductCard from '../components/ProductCard'
import ProductSkeleton from '../components/ProductSkeleton'
import { useStoreInfo } from '../hooks/useStoreInfo'
import { mockProducts, featuredProductIds } from '../data/mockProducts'

const SKELETON_COUNT = 8

export default function StorePage() {
  const { storeName, storeDescription, whatsappNumber, logoUrl, categories, loading } = useStoreInfo()
  const [searchParams] = useSearchParams()

  const activeCategoryId = searchParams.get('category')
    ? Number(searchParams.get('category'))
    : null

  const activeCategory = categories.find((c) => c.id === activeCategoryId)

  const featuredProducts = useMemo(
    () => mockProducts.filter((p) => featuredProductIds.includes(p.id) && p.isVisible),
    [],
  )

  const catalogProducts = useMemo(() => {
    const visible = mockProducts.filter((p) => p.isVisible)
    return activeCategoryId === null
      ? visible
      : visible.filter((p) => p.categoryId === activeCategoryId)
  }, [activeCategoryId])

  return (
    <>
      {/* ── 1. Store Profile ── */}
      <StoreProfileHeader
        storeName={storeName || 'Carregando…'}
        storeDescription={storeDescription}
        logoUrl={logoUrl}
        productCount={mockProducts.filter((p) => p.isVisible).length}
        categories={categories}
      />

      {/* ── 2. Category bar (sticky below the 64 px header) ── */}
      {!loading && <CategoryBar categories={categories} />}

      {/* ── 3. Content ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero — visible only on "Todos" */}
        {!loading && activeCategoryId === null && (
          <HeroSection products={featuredProducts} whatsappNumber={whatsappNumber} />
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
                  />
                ))}
          </div>

          {!loading && catalogProducts.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-zinc-500 text-sm">Nenhum produto nesta categoria.</p>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
