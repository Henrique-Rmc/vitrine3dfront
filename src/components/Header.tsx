import { Link } from 'react-router-dom'
import Logo from './Logo'

interface HeaderProps {
  mobileMenuOpen: boolean
  toggleMobileMenu: () => void
  showHamburger?: boolean
}

export default function Header({ mobileMenuOpen, toggleMobileMenu, showHamburger = true }: HeaderProps) {
  return (
    <header className="md:hidden sticky top-0 z-50 bg-canvas/95 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <Link to="/" className="shrink-0 hover:opacity-70 transition-opacity">
            <Logo height={20} />
          </Link>

          <button
            className={`p-2 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors ${!showHamburger ? 'invisible pointer-events-none' : ''}`}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileMenuOpen}
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
