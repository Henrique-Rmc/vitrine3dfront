import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { isAuthenticated, logout, user } = useAuth()
  const location = useLocation()
  const isOnOwnStore = !!user?.slug && location.pathname === `/${user.slug}`

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-[#1c1813]/30 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-full w-72
          bg-white border-r border-[#e8e2d8] shadow-xl
          flex flex-col
          transition-transform duration-300 ease-in-out
          md:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-[#e8e2d8] shrink-0">
          <span className="text-xl font-bold text-[#1c1813] tracking-tight">Vitrine Artesã</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#9c8e84] hover:text-[#1c1813] hover:bg-[#f4f1eb] transition-colors"
            aria-label="Fechar menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!isAuthenticated ? (
            <>
              <NavItem to="/" onClose={onClose}>Início</NavItem>
              <NavItem to="/admin/register" onClose={onClose} highlight>
                Criar minha vitrine
              </NavItem>
              <NavItem to="/admin/login" onClose={onClose}>Entrar</NavItem>
            </>
          ) : (
            <>
              <NavItem to="/admin/products" onClose={onClose}>Meus Produtos</NavItem>
              {isOnOwnStore ? (
                <NavItem to="/admin/products" onClose={onClose}>Gerenciar produtos</NavItem>
              ) : user?.slug ? (
                <NavItem to={`/${user.slug}`} onClose={onClose}>Ver minha vitrine</NavItem>
              ) : null}
              <NavItem to="/admin/settings" onClose={onClose}>Configurações</NavItem>
              <button
                onClick={() => { logout(); onClose() }}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-2"
              >
                Sair
              </button>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#e8e2d8]">
          <p className="text-xs text-[#c4b8ae] text-center">Vitrine Artesã &copy; {new Date().getFullYear()}</p>
        </div>
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
          ? 'bg-[#1c1813] text-white hover:bg-[#2c2620]'
          : 'text-[#6b5d52] hover:text-[#1c1813] hover:bg-[#f4f1eb]'
      }`}
    >
      {children}
    </Link>
  )
}
