import { useEffect } from 'react'
import { Link } from 'react-router-dom'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

// TODO: replace with useAuth() once wired to this component
const isAuthenticated = false

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  // Close on Escape key (mobile)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Body scroll lock — only meaningful on mobile (hamburger is md:hidden on desktop)
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Backdrop — mobile overlay only, invisible on desktop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/*
        Sidebar panel
        ─ Mobile  : slides in from left, overlays content (top-0, full height)
        ─ Desktop : always visible, sits below the 64px header (top-16)
      */}
      <aside
        className={`
          fixed left-0 z-60 w-50
          bg-zinc-900 border-r border-zinc-800
          flex flex-col
          transition-transform duration-300 ease-in-out
          top-0 h-full
          md:top-16 md:h-[calc(100vh-4rem)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Close row — only needed on mobile (desktop has no close action) */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-zinc-800 shrink-0 md:hidden">
          <span className="text-xl font-bold text-zinc-100 tracking-tight">Vitrine3D</span>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            aria-label="Fechar menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!isAuthenticated ? (
            <>
              <NavItem to="/" onClose={onClose}>Home</NavItem>
              <NavItem to="/about" onClose={onClose}>About Vitrine3D</NavItem>
              <NavItem to="/admin/register" onClose={onClose} highlight>
                Become a Seller
              </NavItem>
              <NavItem to="/admin/login" onClose={onClose}>Login</NavItem>
            </>
          ) : (
            <>
              <NavItem to="/admin/dashboard" onClose={onClose}>My Dashboard</NavItem>
              <NavItem to="/my-store" onClose={onClose}>View My Store</NavItem>
              <NavItem to="/admin/settings" onClose={onClose}>Settings</NavItem>
              <button
                onClick={() => {
                  // TODO: call logout() from useAuth()
                  onClose()
                }}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/40 transition-colors"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </aside>
    </>
  )
}

function NavItem({
  to,
  onClose,
  highlight = false,
  children,
}: {
  to: string
  onClose: () => void
  highlight?: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      onClick={onClose}
      className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        highlight
          ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-950/40'
          : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800'
      }`}
    >
      {children}
    </Link>
  )
}
