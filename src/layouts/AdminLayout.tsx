import { useNavigate, Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AdminSidebar from '../components/AdminSidebar'
import Logo from '../components/Logo'

const MOBILE_NAV = [
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
  {
    to: '/admin/pdv',
    label: 'PDV',
    icon: (
      <>
        <rect x={2} y={7} width={20} height={14} rx={2} />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        <line x1={12} y1={12} x2={12} y2={16} />
        <line x1={10} y1={14} x2={14} y2={14} />
      </>
    ),
  },
]

function accountLabel(user: ReturnType<typeof useAuth>['user']): string {
  if (user?.role === 'ADMIN') return 'Admin'
  if (user?.profileType === 'AFFILIATE') return 'Loja de Afiliado'
  return 'Loja'
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-surface text-ink flex">
      <AdminSidebar
        userName={user?.userName ?? user?.email}
        storeName={user?.storeName}
        storeSlug={user?.slug}
        accountLabel={accountLabel(user)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 md:ml-60">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 bg-canvas border-b border-border h-14 px-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <Logo height={22} />
            <span className="text-[9px] font-semibold uppercase tracking-widest text-ink-3 bg-surface-2 px-1.5 py-0.5 rounded shrink-0">
              {accountLabel(user)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-3 font-medium truncate max-w-32">{user?.storeName ?? user?.email}</span>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
              title="Sair"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 md:pb-6 max-w-5xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-canvas border-t border-border h-16 flex items-stretch shadow-[0_-1px_0_var(--color-border)]">
        {MOBILE_NAV.map(({ to, label, icon }) => (
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

        {user?.slug && (
          <a
            href={`/${user.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-ink-4 hover:text-ink-3 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Vitrine
          </a>
        )}
      </nav>
    </div>
  )
}
