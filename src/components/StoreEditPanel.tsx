import { useRef, useState } from 'react'
import { STORE_FONTS, fontStyle } from '../constants/storeFonts'
import { COVER_COLORS } from '../constants/storeCoverColors'
import { compressImage } from '../services/imageOptimizationService'

// ── Draft shape — extend here as new editable fields are added ────────────────
export interface StoreDraft {
  storeNameFont?: string | null
  coverFile?: File | null
  coverPreviewUrl?: string | null
  coverColor?: string | null
}

interface StoreEditPanelProps {
  storeName: string
  draft: StoreDraft
  currentFont: string | null
  currentCoverUrl: string | null
  currentCoverColor: string | null
  onDraftChange: (patch: Partial<StoreDraft>) => void
  onSave: () => Promise<void>
  onDiscard: () => void
  isDirty: boolean
  isSaving: boolean
  onQRCode?: () => void
}

export default function StoreEditPanel({
  storeName,
  draft,
  currentFont,
  currentCoverUrl,
  currentCoverColor,
  onDraftChange,
  onSave,
  onDiscard,
  isDirty,
  isSaving,
  onQRCode,
}: StoreEditPanelProps) {
  const [open, setOpen] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Cover section mode: 'photo' or 'color'
  const [coverMode, setCoverMode] = useState<'photo' | 'color'>(() =>
    ('coverColor' in draft && draft.coverColor !== null) || !!currentCoverColor ? 'color' : 'photo'
  )

  const activeFont     = draft.storeNameFont !== undefined ? draft.storeNameFont : currentFont
  const activeCoverUrl = draft.coverPreviewUrl !== undefined ? draft.coverPreviewUrl : currentCoverUrl
  const activeCoverColor = 'coverColor' in draft ? draft.coverColor : currentCoverColor

  async function handleCoverPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    onDraftChange({ coverPreviewUrl: preview, coverFile: file, coverColor: undefined })
    setIsCompressing(true)
    try {
      const compressed = await compressImage(file)
      onDraftChange({ coverPreviewUrl: URL.createObjectURL(compressed), coverFile: compressed, coverColor: undefined })
    } finally {
      setIsCompressing(false)
    }
    e.target.value = ''
  }

  function handleColorPick(hex: string) {
    onDraftChange({ coverColor: hex, coverPreviewUrl: null, coverFile: undefined })
  }

  function handleClearCover() {
    onDraftChange({ coverColor: undefined, coverPreviewUrl: undefined, coverFile: undefined })
  }

  async function handleSave() {
    await onSave()
    setOpen(false)
  }

  function handleDiscard() {
    onDiscard()
    setOpen(false)
  }

  return (
    <>
      {/* Personalizar vitrine — centralizado */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 md:bottom-6">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-ink text-canvas text-sm font-semibold shadow-lg hover:bg-ink-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
          </svg>
          Personalizar vitrine
          {isDirty && <span className="w-2 h-2 rounded-full bg-brand shrink-0" />}
        </button>
      </div>

      {/* QR Code — fixo à direita */}
      {onQRCode && (
        <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
          <button
            onClick={onQRCode}
            aria-label="Gerar QR Code"
            className="flex flex-col items-center gap-1 group"
          >
            <span className="w-14 h-14 rounded-full bg-ink text-canvas flex items-center justify-center shadow-lg group-hover:bg-ink-2 transition-colors">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 18.75h.75v.75h-.75v-.75zM18.75 13.5h.75v.75h-.75v-.75zM18.75 18.75h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
              </svg>
            </span>
            <span className="text-[10px] font-semibold text-ink leading-tight text-center max-w-15" style={{ textShadow: '0 0 6px rgba(255,255,255,0.9), 0 0 12px rgba(255,255,255,0.6)' }}>Gerar Seu QR Code</span>
          </button>
        </div>
      )}

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] md:bg-transparent md:backdrop-blur-none"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed z-50 flex flex-col bg-canvas border-border shadow-2xl transition-transform duration-300
          bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl border-t
          md:bottom-0 md:top-0 md:left-auto md:right-0 md:w-80 md:max-h-none md:rounded-none md:border-t-0 md:border-l
          ${open ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}`}
      >
        {/* Handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
          <div className="w-8 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <p className="text-sm font-bold text-ink">Personalizar vitrine</p>
            <p className="text-xs text-ink-3 mt-0.5">Mudanças em tempo real</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">

          {/* ── Capa ─────────────────────────────────────────────────────── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-3">Capa</p>

            {/* Mode tabs */}
            <div className="flex gap-1 bg-surface-2 p-1 rounded-lg border border-border mb-4">
              {(['photo', 'color'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCoverMode(mode)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    coverMode === mode
                      ? 'bg-canvas text-ink shadow-sm'
                      : 'text-ink-3 hover:text-ink-2'
                  }`}
                >
                  {mode === 'photo' ? 'Foto' : 'Cor de fundo'}
                </button>
              ))}
            </div>

            {/* Photo mode */}
            {coverMode === 'photo' && (
              <>
                <div
                  className="relative w-full aspect-video rounded-xl overflow-hidden bg-surface-2 border border-border cursor-pointer group mb-2"
                  onClick={() => !isCompressing && coverInputRef.current?.click()}
                >
                  {activeCoverUrl ? (
                    <>
                      <img src={activeCoverUrl} alt="Capa" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-semibold bg-black/50 px-3 py-1.5 rounded-full">Trocar foto</span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-border-2 group-hover:text-ink-4 transition-colors">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      <span className="text-xs font-medium">Adicionar foto de capa</span>
                    </div>
                  )}
                  {isCompressing && (
                    <div className="absolute inset-0 bg-canvas/70 flex items-center justify-center">
                      <span className="w-5 h-5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>
                {draft.coverPreviewUrl !== undefined && (
                  <button type="button" onClick={handleClearCover} className="text-xs text-ink-3 hover:text-red-500 transition-colors">
                    Cancelar seleção
                  </button>
                )}
                <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverPick} className="hidden" />
              </>
            )}

            {/* Color mode */}
            {coverMode === 'color' && (
              <>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {/* "Sem cor" swatch */}
                  <button
                    type="button"
                    onClick={handleClearCover}
                    title="Sem cor"
                    className={`aspect-square rounded-lg border-2 flex items-center justify-center transition-all ${
                      !activeCoverColor
                        ? 'border-brand shadow-sm scale-105'
                        : 'border-border hover:border-border-2'
                    }`}
                    style={{ background: 'repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 0 / 10px 10px' }}
                  >
                    {!activeCoverColor && (
                      <svg className="w-4 h-4 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>

                  {COVER_COLORS.map(({ key, label }) => {
                    const active = activeCoverColor === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleColorPick(key)}
                        title={label}
                        className={`aspect-square rounded-lg border-2 transition-all ${
                          active
                            ? 'border-ink scale-105 shadow-sm'
                            : 'border-transparent hover:border-border-2 hover:scale-[1.03]'
                        }`}
                        style={{ backgroundColor: key }}
                      />
                    )
                  })}
                </div>

                {/* Color name label */}
                {activeCoverColor && (
                  <p className="text-xs text-ink-3 text-center">
                    {COVER_COLORS.find((c) => c.key === activeCoverColor)?.label ?? activeCoverColor}
                  </p>
                )}
              </>
            )}
          </section>

          {/* ── Fonte do nome ─────────────────────────────────────────────── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-2">Fonte do nome</p>

            {/* Live name preview */}
            <div className="rounded-lg bg-surface-2 border border-border px-3 py-2.5 mb-3 overflow-hidden">
              <p
                className="text-xl font-extrabold text-ink leading-tight tracking-tight truncate"
                style={fontStyle(activeFont)}
              >
                {storeName || 'Nome da Loja'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {STORE_FONTS.map((font) => {
                const active = (activeFont ?? 'Inter') === font.key
                return (
                  <button
                    key={font.key}
                    type="button"
                    onClick={() => onDraftChange({ storeNameFont: font.key })}
                    style={{ fontFamily: `'${font.key}', sans-serif` }}
                    className={`relative flex flex-col items-start px-2.5 py-2 rounded-lg border-2 transition-all text-left ${
                      active
                        ? 'border-brand bg-brand/8 text-ink'
                        : 'border-border bg-surface-2 text-ink-2 hover:border-border-2 hover:text-ink'
                    }`}
                  >
                    <span className="text-sm font-semibold leading-snug truncate w-full">{font.label}</span>
                    <span className="text-[10px] mt-0.5 text-ink-4 truncate w-full" style={{ fontFamily: 'inherit', fontWeight: 'normal' }}>
                      {font.category}
                    </span>
                    {active && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand" />}
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border shrink-0 flex gap-2">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={!isDirty || isSaving}
            className="flex-1 py-2.5 rounded-lg border border-border text-ink-2 hover:bg-surface-2 text-sm font-medium transition-colors disabled:opacity-40"
          >
            Descartar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cta hover:bg-cta-2 text-cta-fg text-sm font-semibold transition-colors disabled:opacity-40"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-cta-fg/40 border-t-cta-fg animate-spin" />
                Salvando…
              </>
            ) : 'Salvar'}
          </button>
        </div>
      </div>
    </>
  )
}
