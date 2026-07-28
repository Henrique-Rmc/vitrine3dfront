import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import MobileDrawer from '../components/MobileDrawer'
import VitrineSidebar from '../components/VitrineSidebar'

const ADMIN_MOBILE_NAV = [
  {
    to: '/admin/products',
    label: 'Produtos',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />,
  },
  {
    to: '/admin/attributes',
    label: 'Filtros',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />,
  },
  {
    to: '/admin/settings',
    label: 'Config.',
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </>
    ),
  },
]

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-surface text-ink">
      {/* Desktop sidebar (both admin and non-admin) */}
      <VitrineSidebar />

      {/* All content is offset from the sidebar on desktop */}
      <div className="md:ml-60">
        <Header
          mobileMenuOpen={mobileMenuOpen}
          toggleMobileMenu={() => setMobileMenuOpen(p => !p)}
          showHamburger={!isAuthenticated}
        />

        {/* Mobile drawer — only for non-authenticated visitors */}
        {!isAuthenticated && (
          <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        )}

        <main className={isAuthenticated ? 'pb-20 md:pb-0' : undefined}>
          <Outlet />
        </main>

        <footer className="mt-16 border-t border-border">
          {/* Legal disclaimer */}
          <div className="bg-surface-2 border-b border-border px-4 py-3 text-center text-xs text-ink-3">
            O VitreIn é uma vitrine digital. As negociações ocorrem diretamente entre comprador e vendedor via WhatsApp,
            fora do ambiente do site, sendo de <strong className="font-medium text-ink-2">inteira responsabilidade do vendedor</strong>.
            O VitreIn não gerencia pagamentos, envios ou qualquer etapa da venda.
          </div>
          {/* Links + copyright */}
          <div className="px-4 py-6 text-center space-y-3">
            <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-ink-3">
              <a href="/termos-de-uso" className="hover:text-brand transition-colors">Termos de Uso</a>
              <a href="/privacidade" className="hover:text-brand transition-colors">Política de Privacidade</a>
              <a href="/denunciar" className="hover:text-brand transition-colors">Reportar Conteúdo</a>
            </nav>
            <p className="text-xs text-ink-4">
              © {new Date().getFullYear()} Vitrin &mdash; Sua vitrine digital para qualquer tipo de venda
            </p>
          </div>
        </footer>
      </div>

      {/* Mobile bottom nav — admin only, mirrors AdminLayout nav */}
      {isAuthenticated && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-canvas border-t border-border h-16 flex items-stretch shadow-[0_-1px_0_var(--color-border)]">
          {ADMIN_MOBILE_NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-brand' : 'text-ink-4 hover:text-ink-3'
                }`
              }
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {icon}
              </svg>
              {label}
            </NavLink>
          ))}

          {/* "Vitrine" tab — always active since we're on the vitrine */}
          <div className="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-semibold text-brand">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016 2.993 2.993 0 002.25-1.016 3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
            </svg>
            Vitrine
          </div>
        </nav>
      )}
    </div>
  )
}
