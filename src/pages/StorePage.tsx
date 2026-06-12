import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import StoreProfileHeader from '../components/StoreProfileHeader'
import CategoryBar from '../components/CategoryBar'
import HeroSection from '../components/HeroSection'
import ProductCard from '../components/ProductCard'
import ProductModal from '../components/ProductModal'
import ProductSkeleton from '../components/ProductSkeleton'
import { useStoreInfo } from '../hooks/useStoreInfo'
import { mockProducts, featuredProductIds } from '../data/mockProducts'
import type { Product } from '../types'

const SKELETON_COUNT = 8

export default function StorePage() {
  const { storeSlug = '' } = useParams<{ storeSlug: string }>()
  const { storeName, storeDescription, whatsappNumber, logoUrl, categories, loading } = useStoreInfo(storeSlug)
  const [searchParams] = useSearchParams()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

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

  const selectedCategoryName = selectedProduct
    ? (categories.find((c) => c.id === selectedProduct.categoryId)?.name ?? '')
    : ''

  return (
    <>
      {/* ── Store Profile ── */}
      <StoreProfileHeader
        storeName={storeName || 'Carregando…'}
        storeDescription={storeDescription}
        logoUrl={logoUrl}
        productCount={mockProducts.filter((p) => p.isVisible).length}
        categories={categories}
      />

      {/* ── Category bar ── */}
      {!loading && <CategoryBar categories={categories} />}

      {/* ── Content ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        {!loading && activeCategoryId === null && (
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
