import { NavLink, Link } from 'react-router-dom'

export interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

interface AdminSidebarProps {
  navItems: NavItem[]
  userName: string | undefined
  storeName: string | undefined
  storeSlug: string | undefined
  onLogout: () => void
}

export default function AdminSidebar({
  navItems,
  userName,
  storeName,
  storeSlug,
  onLogout,
}: AdminSidebarProps) {
  const initial = (userName ?? '?')[0].toUpperCase()

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 z-40 flex-col bg-white border-r border-[#e8e2d8]">
      {/* Brand */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-[#e8e2d8] shrink-0">
        <Link
          to="/"
          className="text-base font-bold text-[#1c1813] hover:text-[#2c2620] transition-colors tracking-tight"
        >
          Vitrine Artesã
        </Link>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9c8e84] bg-[#f4f1eb] px-1.5 py-0.5 rounded">
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
                  ? 'bg-[#c9922c]/10 text-[#c9922c] font-semibold'
                  : 'text-[#9c8e84] hover:text-[#1c1813] hover:bg-[#f4f1eb]'
              }`
            }
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {icon}
            </svg>
            {label}
          </NavLink>
        ))}

        {storeSlug && (
          <Link
            to={`/${storeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#c4b8ae] hover:text-[#1c1813] hover:bg-[#f4f1eb] transition-colors mt-2 border-t border-[#f0ece5] pt-4"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Ver minha vitrine
          </Link>
        )}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-[#e8e2d8] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#c9922c]/15 border border-[#c9922c]/30 flex items-center justify-center text-xs font-bold text-[#c9922c] shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            {storeName && (
              <p className="text-xs font-semibold text-[#1c1813] truncate">{storeName}</p>
            )}
            <p className="text-xs text-[#c4b8ae] truncate">{userName}</p>
          </div>
          <button
            onClick={onLogout}
            title="Sair"
            className="p-1.5 rounded-lg text-[#c4b8ae] hover:text-[#1c1813] hover:bg-[#f4f1eb] transition-colors shrink-0"
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
