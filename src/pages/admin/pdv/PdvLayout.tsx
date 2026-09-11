import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { usePdvSync } from '../../../hooks/usePdvSync'
import type { SyncResult } from '../../../services/pdvSyncManager'

const NAV = [
  { to: '/admin/pdv', label: 'Início', icon: HomeIcon, end: true },
  { to: '/admin/pdv/nova-venda', label: 'Venda', icon: PlusIcon, end: false },
  { to: '/admin/pdv/vendas', label: 'Vendas', icon: ReceiptIcon, end: false },
  { to: '/admin/pdv/clientes', label: 'Clientes', icon: UsersIcon, end: false },
  { to: '/admin/pdv/caixa', label: 'Caixa', icon: CashIcon, end: false },
  { to: '/admin/pdv/funcionarios', label: 'Equipe', icon: BadgeIcon, end: false },
  { to: '/admin/pdv/estoque', label: 'Estoque', icon: BoxIcon, end: false },
]

export default function PdvLayout() {
  const navigate = useNavigate()
  const { isOnline, isSyncing, pendingCount, lastSyncResult, syncNow } = usePdvSync()

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-ink">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-border bg-surface">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-canvas transition-colors text-ink-2 hover:text-ink"
            title="Voltar"
          >
            <ChevronLeftIcon />
          </button>
          <span className="font-bold text-base text-ink flex-1">PDV</span>
          <OfflineDot
            isOnline={isOnline}
            isSyncing={isSyncing}
            pendingCount={pendingCount}
            lastSyncResult={lastSyncResult}
            onRetry={syncNow}
          />
        </div>

        <nav className="flex flex-col gap-1 px-2 py-3 flex-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-cta text-cta-fg'
                    : 'text-ink-2 hover:bg-canvas hover:text-ink'
                }`
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ── Main content area ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-surface shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-canvas transition-colors text-ink-2"
          >
            <ChevronLeftIcon />
          </button>
          <span className="font-bold text-base text-ink flex-1">PDV</span>
          <OfflineDot
            isOnline={isOnline}
            isSyncing={isSyncing}
            pendingCount={pendingCount}
            lastSyncResult={lastSyncResult}
            onRetry={syncNow}
          />
        </header>

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>

        {/* ── Mobile bottom nav ── */}
        <nav className="md:hidden flex items-stretch border-t border-border bg-surface shrink-0">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-cta' : 'text-ink-3 hover:text-ink-2'
                }`
              }
            >
              <span className="w-5 h-5">
                <Icon />
              </span>
              {label}
            </NavLink>
          ))}
        </nav>
      </main>
    </div>
  )
}

// ── Compact offline dot indicator ────────────────────────────────────────────

function OfflineDot({
  isOnline,
  isSyncing,
  pendingCount,
  lastSyncResult,
  onRetry,
}: {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  lastSyncResult: SyncResult | null
  onRetry: () => void
}) {
  if (isSyncing) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
        <span className="w-2 h-2 rounded-full border border-blue-400 border-t-transparent animate-spin" />
        Sincronizando
      </span>
    )
  }

  if (lastSyncResult && lastSyncResult.errors.length > 0) {
    return (
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 text-xs text-amber-500 font-medium hover:text-amber-600 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        Erro · Tentar
      </button>
    )
  }

  if (!isOnline) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        {pendingCount > 0 ? `Offline · ${pendingCount}` : 'Offline'}
      </span>
    )
  }

  return null
}

// ── Inline SVG icons (no dep) ─────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-4 md:h-4 w-full h-full">
      <path d="M3 12L12 3l9 9" /><path d="M9 21V12h6v9" /><path d="M3 12v9h18V12" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-4 md:h-4 w-full h-full">
      <circle cx={12} cy={12} r={10} /><line x1={12} y1={8} x2={12} y2={16} /><line x1={8} y1={12} x2={16} y2={12} />
    </svg>
  )
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-4 md:h-4 w-full h-full">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x={9} y={3} width={6} height={4} rx={1} />
      <line x1={9} y1={12} x2={15} y2={12} /><line x1={9} y1={16} x2={12} y2={16} />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-4 md:h-4 w-full h-full">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx={9} cy={7} r={4} />
      <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

function CashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-4 md:h-4 w-full h-full">
      <rect x={2} y={6} width={20} height={12} rx={2} />
      <circle cx={12} cy={12} r={3} />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  )
}

function BadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-4 md:h-4 w-full h-full">
      <rect x={2} y={7} width={20} height={14} rx={2} /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <line x1={12} y1={12} x2={12} y2={16} /><line x1={10} y1={14} x2={14} y2={14} />
    </svg>
  )
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-4 md:h-4 w-full h-full">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1={12} y1={22.08} x2={12} y2={12} />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
