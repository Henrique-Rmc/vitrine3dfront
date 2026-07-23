import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

const ADMIN_NAV = [
  {
    to: '/admin/products',
    label: 'Produtos',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    ),
  },
  {
    to: '/admin/product-types',
    label: 'Tipos',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3zM6 6h.008v.008H6V6z" />
    ),
  },
  {
    to: '/admin/attributes',
    label: 'Filtros',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    ),
  },
  {
    to: '/admin/settings',
    label: 'Configurações',
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </>
    ),
  },
]

export default function VitrineSidebar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const initial = (user?.userName ?? user?.email ?? '?')[0].toUpperCase()

  function handleLogout() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  /* ── Admin sidebar ────────────────────────────────────────────────────────── */
  if (isAuthenticated) {
    return (
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 z-40 flex-col bg-canvas border-r border-border">
        {/* Brand */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-border shrink-0">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <Logo height={26} />
          </Link>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-3 bg-surface-2 px-1.5 py-0.5 rounded">
            Admin
          </span>
        </div>

        {/* "Você está na sua vitrine" indicator */}
        <div className="px-4 py-3 bg-surface-2 border-b border-border shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-3">Visualizando</p>
          <p className="text-sm font-semibold text-brand truncate mt-0.5">
            {user?.storeName ?? 'Minha vitrine'}
          </p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {ADMIN_NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand/10 text-brand font-semibold'
                    : 'text-ink-3 hover:text-ink hover:bg-surface-2'
                }`
              }
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {icon}
              </svg>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center text-xs font-bold text-brand shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              {user?.storeName && (
                <p className="text-xs font-semibold text-ink truncate">{user.storeName}</p>
              )}
              <p className="text-xs text-ink-4 truncate">{user?.userName ?? user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sair"
              className="p-1.5 rounded-lg text-ink-4 hover:text-ink hover:bg-surface-2 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    )
  }

  /* ── Public / non-logged sidebar ──────────────────────────────────────────── */
  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 z-40 flex-col bg-canvas border-r border-border">
      {/* CTA section — no brand header at top; store owns the top of page */}
      <div className="flex-1 px-4 pt-6 pb-4 flex flex-col gap-3 overflow-y-auto">
        <p className="text-xs text-ink-3 leading-relaxed">
          Lojas, autônomos, imóveis, serviços — qualquer negócio pode ter sua vitrine digital profissional. Primeiro mês gratuito.
        </p>

        <Link
          to="/admin/register"
          className="flex items-center justify-center gap-2 rounded-lg bg-cta hover:bg-cta-2 text-cta-fg text-sm font-semibold px-4 py-2.5 transition-colors"
        >
          Criar minha vitrine
        </Link>

        <Link
          to="/admin/login"
          className="flex items-center justify-center rounded-lg border border-border hover:border-border-2 text-ink-2 hover:text-ink text-sm font-medium px-4 py-2.5 transition-colors"
        >
          Entrar
        </Link>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-4 mb-2">
            Para todo tipo de negócio
          </p>
          {['Lojas & Comércio', 'Autônomos', 'Imóveis', 'Veículos', 'Serviços', 'Arte & Artesanato'].map((c) => (
            <p key={c} className="text-xs text-ink-3 py-0.5">{c}</p>
          ))}
        </div>
      </div>

      {/* Footer — passive Vitrin credit */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <Link to="/" className="flex items-center gap-2 hover:opacity-60 transition-opacity w-fit">
          <Logo height={18} />
          <span className="text-[10px] text-ink-4">· Criar minha vitrine →</span>
        </Link>
      </div>
    </aside>
  )
}
