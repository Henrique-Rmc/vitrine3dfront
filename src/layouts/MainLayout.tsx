import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import { useStoreInfo } from '../hooks/useStoreInfo'

export default function MainLayout() {
  const { storeName, logoUrl, categories, loading } = useStoreInfo()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {!loading && (
        <Header storeName={storeName} logoUrl={logoUrl} categories={categories} />
      )}

      {/* No padding/max-width here — each page owns its layout */}
      <main>
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-zinc-800 py-6 text-center text-sm text-zinc-500">
        {storeName} &mdash; Impressão 3D profissional
      </footer>
    </div>
  )
}
