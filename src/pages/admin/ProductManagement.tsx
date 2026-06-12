import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockProducts } from '../../data/mockProducts'
import type { Product } from '../../types'
import ProductList from '../../components/ProductList'

export default function ProductManagement() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>(mockProducts)

  function handleAddNew() {
    // TODO: navigate to /admin/products/new when the form page is created
    navigate('/admin/products/new')
  }

  function handleEdit(product: Product) {
    // TODO: navigate to /admin/products/edit/:id when the edit page is created
    navigate(`/admin/products/edit/${product.id}`)
  }

  function handleDelete(id: number) {
    if (!window.confirm('Delete this product? This action cannot be undone.')) return
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Products</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {products.length} product{products.length !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New Product
        </button>
      </div>

      <ProductList
        products={products}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
