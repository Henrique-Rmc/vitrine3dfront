import { NavLink, Link } from 'react-router-dom'

export interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

interface AdminSidebarProps {
  navItems: NavItem[]
  userEmail: string | undefined
  onLogout: () => void
}

export default function AdminSidebar({ navItems, userEmail, onLogout }: AdminSidebarProps) {
  const initial = userEmail?.[0]?.toUpperCase() ?? '?'

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 z-40 flex-col bg-zinc-900 border-r border-zinc-800">
      {/* Brand */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-zinc-800 shrink-0">
        <Link
          to="/"
          className="text-base font-bold text-zinc-100 hover:text-white transition-colors"
        >
          Vitrine3D
        </Link>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`
            }
          >
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              {icon}
            </svg>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-200 shrink-0">
            {initial}
          </div>
          <p className="flex-1 min-w-0 text-xs text-zinc-400 truncate">{userEmail}</p>
          <button
            onClick={onLogout}
            title="Logout"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors shrink-0"
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
