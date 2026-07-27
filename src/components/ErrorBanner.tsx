interface ErrorBannerAction {
  label: string
  onClick: () => void
}

interface ErrorBannerProps {
  children: React.ReactNode
  icon?: boolean
  compact?: boolean
  action?: ErrorBannerAction
  className?: string
}

const WARNING_ICON_PATH =
  'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'

export default function ErrorBanner({ children, icon = false, compact = false, action, className = '' }: ErrorBannerProps) {
  if (compact) {
    return (
      <p className={`text-xs text-danger-text bg-danger-bg border border-danger-border rounded-lg px-3 py-2 ${className}`}>
        {children}
      </p>
    )
  }

  if (!icon && !action) {
    return (
      <div className={`rounded-lg bg-danger-bg border border-danger-border px-4 py-3 text-sm text-danger-text ${className}`}>
        {children}
      </div>
    )
  }

  return (
    <div
      className={`flex items-start ${action ? 'justify-between gap-3' : 'gap-2'} rounded-lg bg-danger-bg border border-danger-border px-4 py-3 text-sm text-danger-text ${className}`}
    >
      {icon && (
        <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={WARNING_ICON_PATH} />
        </svg>
      )}
      <span>{children}</span>
      {action && (
        <button onClick={action.onClick} className="shrink-0 text-xs underline hover:text-danger-text/80">
          {action.label}
        </button>
      )}
    </div>
  )
}
