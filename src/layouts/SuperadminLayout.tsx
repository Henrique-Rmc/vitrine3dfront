import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

export default function SuperadminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="sticky top-0 z-30 bg-white border-b border-border h-14 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Logo height={22} />
          <span className="text-xs font-semibold uppercase tracking-widest text-brand border border-brand/30 bg-brand/10 px-2 py-0.5 rounded">
            Superadmin
          </span>
        </div>

        <nav className="flex items-center gap-1">
          <NavLink
            to="/superadmin/lojas"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-surface-2 text-ink'
                  : 'text-ink-3 hover:text-ink hover:bg-surface-2'
              }`
            }
          >
            Lojas
          </NavLink>
          <NavLink
            to="/superadmin/stats"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-surface-2 text-ink'
                  : 'text-ink-3 hover:text-ink hover:bg-surface-2'
              }`
            }
          >
            Stats
          </NavLink>
          <button
            onClick={handleLogout}
            className="ml-4 px-3 py-1.5 rounded-lg text-sm font-medium text-ink-3 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            Sair
          </button>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
