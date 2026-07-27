export default function Toggle({ label, description, checked, disabled, onChange }: {
  label: string
  description?: string
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50 ${
          checked ? 'bg-brand' : 'bg-border'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="flex flex-col">
        <span className="text-sm text-ink">{label}</span>
        {description && <span className="text-xs text-ink-3">{description}</span>}
      </span>
    </label>
  )
}
