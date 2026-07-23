import { useState, useRef, useEffect, useId } from 'react'

export interface SelectOption {
  value: string
  label: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  hasError?: boolean
  required?: boolean
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecione…',
  searchPlaceholder = 'Buscar…',
  disabled = false,
  hasError = false,
  required = false,
}: Props) {
  const [isOpen, setIsOpen]       = useState(false)
  const [query, setQuery]         = useState('')
  const containerRef              = useRef<HTMLDivElement>(null)
  const searchRef                 = useRef<HTMLInputElement>(null)
  const listRef                   = useRef<HTMLUListElement>(null)
  const id                        = useId()

  const selectedLabel = options.find((o) => o.value === value)?.label ?? ''

  const filtered = query.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(
          query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        )
      )
    : options

  function open() {
    if (disabled) return
    setIsOpen(true)
    setQuery('')
    setTimeout(() => searchRef.current?.focus(), 0)
  }

  function close() {
    setIsOpen(false)
    setQuery('')
  }

  function select(val: string) {
    onChange(val)
    close()
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    if (isOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { close(); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const items = listRef.current?.querySelectorAll('[role="option"]')
      if (items?.length) (items[0] as HTMLElement).focus()
    }
  }

  function handleOptionKeyDown(e: React.KeyboardEvent<HTMLLIElement>, val: string, idx: number) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(val); return }
    if (e.key === 'Escape') { close(); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const items = listRef.current?.querySelectorAll('[role="option"]')
      if (items && idx + 1 < items.length) (items[idx + 1] as HTMLElement).focus()
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (idx === 0) { searchRef.current?.focus(); return }
      const items = listRef.current?.querySelectorAll('[role="option"]')
      if (items) (items[idx - 1] as HTMLElement).focus()
    }
  }

  const triggerClass = [
    'w-full flex items-center justify-between rounded-lg px-4 py-2.5 text-sm transition-colors',
    'focus:outline-none focus:ring-2',
    disabled ? 'opacity-50 cursor-not-allowed bg-surface-2 border border-border' :
      isOpen ? 'bg-surface-2 border border-brand/60 ring-2 ring-brand/40 cursor-pointer' :
        'bg-surface-2 border cursor-pointer hover:border-border-2',
    hasError
      ? 'border-red-400 focus:ring-red-400/30'
      : isOpen ? '' : 'border-border focus:ring-brand/40',
  ].join(' ')

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden native select for form validation */}
      <select
        aria-hidden="true"
        tabIndex={-1}
        required={required}
        value={value}
        onChange={() => {}}
        className="sr-only"
      >
        <option value="" />
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Trigger */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={isOpen ? close : open}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={triggerClass}
      >
        <span className={selectedLabel ? 'text-ink' : 'text-ink-4'}>
          {selectedLabel || placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-ink-3 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-canvas border border-border rounded-xl shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-2 border border-border rounded-lg text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/60"
              />
            </div>
          </div>

          {/* Options */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-52 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-ink-4 text-center">Nenhum resultado</li>
            ) : (
              filtered.map((opt, idx) => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={opt.value === value}
                  tabIndex={0}
                  onMouseDown={(e) => { e.preventDefault(); select(opt.value) }}
                  onKeyDown={(e) => handleOptionKeyDown(e, opt.value, idx)}
                  className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer outline-none transition-colors ${
                    opt.value === value
                      ? 'bg-brand/10 text-brand font-medium'
                      : 'text-ink hover:bg-surface-2 focus:bg-surface-2'
                  }`}
                >
                  {opt.label}
                  {opt.value === value && (
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
