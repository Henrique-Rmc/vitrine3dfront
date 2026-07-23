import { Link } from 'react-router-dom'
import Logo from './Logo'

interface HeaderProps {
  mobileMenuOpen: boolean
  toggleMobileMenu: () => void
  showHamburger?: boolean
  onQRCode?: () => void
}

export default function Header({ mobileMenuOpen, toggleMobileMenu, showHamburger = true, onQRCode }: HeaderProps) {
  return (
    <header className="md:hidden sticky top-0 z-50 bg-canvas/95 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="shrink-0 hover:opacity-80 transition-opacity">
            <Logo height={30} />
          </Link>

          <div className="flex items-center gap-1">
            {/* QR Code button — shown when seller views own storefront on mobile */}
            {onQRCode && (
              <button
                onClick={onQRCode}
                className="md:hidden p-2 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
                aria-label="Gerar QR Code"
                title="Gerar QR Code"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 18.75h.75v.75h-.75v-.75zM18.75 13.5h.75v.75h-.75v-.75zM18.75 18.75h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                </svg>
              </button>
            )}

            {/* Hamburger — visitors only */}
            <button
              className={`md:hidden p-2 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors ${!showHamburger ? 'invisible pointer-events-none' : ''}`}
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
      </div>
    </header>
  )
}
