import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

interface HeaderProps {
  storeName: string
  logoUrl?: string
}

export default function Header({ storeName, logoUrl }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Store name */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            {logoUrl && (
              <img
                src={logoUrl}
                alt={storeName}
                className="h-8 w-8 rounded-full object-cover"
              />
            )}
            <span className="text-lg font-semibold text-zinc-100 tracking-tight">
              {storeName}
            </span>
          </Link>

          {/* Mobile: hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
