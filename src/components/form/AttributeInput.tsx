import { useState, useEffect } from 'react'
import { addOption, type AttributeDefinition } from '../../services/attributeService'
import { inputClass } from './inputClass'

// ── Normalizes an option value to prevent duplicate variations.
// TEXT/ENUM → Title Case. NUMBER → trim only (numbers/units must stay as typed).
function normalizeOptionValue(raw: string, type?: AttributeDefinition['type']): string {
  const cleaned = raw.trim().replace(/\s+/g, ' ')
  if (type === 'NUMBER') return cleaned
  return cleaned.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())
}

// ── ENUM attribute field — dropdown + inline "add new option" ──────────────────
function EnumAttributeField({
  attr,
  value,
  disabled,
  storeId,
  onValueChange,
  onDefinitionUpdate,
}: {
  attr: AttributeDefinition
  value: string
  disabled: boolean
  storeId: string
  onValueChange: (key: string, value: string) => void
  onDefinitionUpdate: (updated: AttributeDefinition) => void
}) {
  const options  = attr.enumOptions ?? []
  const forceNew = options.length === 0

  const [isAddingNew, setIsAddingNew] = useState(forceNew)
  const [rawInput, setRawInput]       = useState('')
  const [isSaving, setIsSaving]       = useState(false)
  const [addError, setAddError]       = useState<string | null>(null)

  useEffect(() => { if (forceNew) setIsAddingNew(true) }, [forceNew])

  const normalized  = normalizeOptionValue(rawInput, attr.type)
  const showPreview = rawInput.trim() !== '' && normalized !== rawInput.trim()
  const isDuplicate = rawInput.trim() !== '' &&
    options.some((opt) => normalizeOptionValue(opt, attr.type) === normalized)

  function cancelAdd() {
    setIsAddingNew(false)
    setRawInput('')
    setAddError(null)
  }

  async function handleSave() {
    if (!normalized || isDuplicate || isSaving) return
    setIsSaving(true)
    setAddError(null)
    try {
      const updated = await addOption(storeId, attr.id, normalized)
      // Backend may not include the new value in enumOptions — merge it in
      const base = updated.enumOptions ?? attr.enumOptions ?? []
      const patchedDef: AttributeDefinition = {
        ...updated,
        enumOptions: base.includes(normalized) ? base : [...base, normalized],
      }
      onDefinitionUpdate(patchedDef)
      onValueChange(attr.key, normalized)
      setRawInput('')
      setIsAddingNew(false)
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code
      setAddError(
        code === 'OPTION_ALREADY_EXISTS'
          ? 'Esse valor já existe na lista.'
          : 'Erro ao adicionar. Tente novamente.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isAddingNew) {
    return (
      <div className="space-y-1.5">
        {/* Intentionally a <div>, not a <form> — avoids nested-form HTML invalidity
            since this renders inside the product <form>. Enter is handled via onKeyDown. */}
        <div className="flex gap-2 items-start">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              autoFocus
              value={rawInput}
              disabled={isSaving}
              onChange={(e) => { setRawInput(e.target.value); setAddError(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave() } }}
              placeholder={`Ex: valores de ${attr.label.toLowerCase()}`}
              className={inputClass}
            />
            {showPreview && !isDuplicate && (
              <p className="mt-1 text-[11px] text-ink-3">
                Será salvo como: <span className="font-semibold text-ink">{normalized}</span>
              </p>
            )}
            {isDuplicate && (
              <p className="mt-1 text-[11px] text-amber-700 font-medium">
                "{normalized}" já existe — selecione-o na lista.
              </p>
            )}
            {addError && <p className="mt-1 text-[11px] text-red-600">{addError}</p>}
          </div>

          {!forceNew && (
            <button
              type="button"
              onClick={cancelAdd}
              disabled={isSaving}
              className="shrink-0 px-3 py-2.5 rounded-lg border border-border text-ink-2 hover:bg-surface-2 text-sm transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!normalized || isDuplicate || isSaving}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-cta hover:bg-cta-2 text-cta-fg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSaving
              ? <span className="w-3.5 h-3.5 rounded-full border-2 border-cta-fg/40 border-t-cta-fg animate-spin" />
              : 'Adicionar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => {
        if (e.target.value === '__add_new__') {
          setIsAddingNew(true)
        } else {
          onValueChange(attr.key, e.target.value)
        }
      }}
      className={inputClass}
    >
      <option value="" disabled={!!attr.required}>
        {attr.required ? 'Selecionar…' : '— Não informado —'}
      </option>
      <option value="__add_new__">+ Adicionar novo valor</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  )
}

// ── Per-type attribute input ───────────────────────────────────────────────────
// ENUM and TEXT use EnumAttributeField (dropdown + add-new via /options API).
// NUMBER and DATE use native inputs — the /options endpoint only accepts ENUM types.
// BOOLEAN keeps a fixed Sim/Não toggle.
export default function AttributeInput({
  attr,
  value,
  disabled,
  storeId,
  onValueChange,
  onDefinitionUpdate,
}: {
  attr: AttributeDefinition
  value: string
  disabled: boolean
  storeId: string
  onValueChange: (key: string, value: string) => void
  onDefinitionUpdate: (updated: AttributeDefinition) => void
}) {
  if (attr.type === 'BOOLEAN') {
    const checked = value === 'true'
    return (
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onValueChange(attr.key, checked ? 'false' : 'true')}
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
        <span className="text-sm text-ink-2">{checked ? 'Sim' : 'Não'}</span>
      </label>
    )
  }

  if (attr.type === 'NUMBER') {
    return (
      <div className="relative">
        <input
          type="number"
          disabled={disabled}
          value={value}
          onChange={(e) => onValueChange(attr.key, e.target.value)}
          placeholder="0"
          className={`${inputClass} ${attr.unit ? 'pr-12' : ''}`}
        />
        {attr.unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-3 pointer-events-none">
            {attr.unit}
          </span>
        )}
      </div>
    )
  }

  if (attr.type === 'ENUM') {
    return (
      <EnumAttributeField
        attr={attr}
        value={value}
        disabled={disabled}
        storeId={storeId}
        onValueChange={onValueChange}
        onDefinitionUpdate={onDefinitionUpdate}
      />
    )
  }

  // TEXT and DATE: removed from product form (types are deprecated)
  return null
}
