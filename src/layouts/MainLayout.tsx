import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import MobileDrawer from '../components/MobileDrawer'

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  function toggleMobileMenu() {
    setMobileMenuOpen((prev) => !prev)
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header mobileMenuOpen={mobileMenuOpen} toggleMobileMenu={toggleMobileMenu} />
      <MobileDrawer isOpen={mobileMenuOpen} onClose={closeMobileMenu} />

      {/* md:ml-72 offsets the content on desktop to clear the persistent sidebar (w-72 = 18rem) */}
      <main className="md:ml-72">
        <Outlet />
      </main>

      <footer className="md:ml-72 mt-16 border-t border-zinc-800 py-6 text-center text-sm text-zinc-500">
        © 2026 Vitrine3D &mdash; Conectando ideias à realidade impressa
      </footer>
    </div>
  )
}
