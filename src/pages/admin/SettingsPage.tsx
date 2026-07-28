import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import ErrorBanner from '../../components/ErrorBanner'
import {
  updateUserProfile,
  uploadLogo,
  uploadCoverImage,
  fetchMyProfile,
} from '../../services/authService'
import { compressImage } from '../../services/imageOptimizationService'
import { STORE_FONTS, loadGoogleFont, fontStyle } from '../../constants/storeFonts'

const inputClass =
  'w-full rounded-lg bg-surface-2 border border-border px-3 py-2.5 text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/60 transition-colors'

// ── Main component ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<'info' | 'fotos'>('info')

  // ── Info tab state ────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    userName:         user?.userName         ?? '',
    storeName:        user?.storeName        ?? '',
    whatsappNumber:   user?.whatsappNumber   ?? '',
    storeDescription: user?.storeDescription ?? '',
    storeNameFont:    user?.storeNameFont    ?? '',
  })

  useEffect(() => {
    STORE_FONTS.forEach(loadGoogleFont)
  }, [])

  useEffect(() => {
    fetchMyProfile()
      .then((profile) => {
        setForm({
          userName:         profile.userName         ?? '',
          storeName:        profile.storeName        ?? '',
          whatsappNumber:   profile.whatsappNumber   ?? '',
          storeDescription: profile.storeDescription ?? '',
          storeNameFont:    profile.storeNameFont    ?? '',
        })
        updateUser(profile)
      })
      .catch(() => {})
  }, [])
  const [isSaving, setIsSaving]       = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [saveError, setSaveError]     = useState<string | null>(null)

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    setSaveError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setIsSaving(true)
    setSaveError(null)
    try {
      const updated = await updateUserProfile(user.id, form)
      updateUser({
        userName: updated.userName,
        storeName: updated.storeName,
        whatsappNumber: updated.whatsappNumber,
        storeDescription: updated.storeDescription,
        logoUrl: updated.logoUrl ?? '',
        storeNameFont: updated.storeNameFont ?? null,
      })
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch {
      setSaveError('Erro ao salvar. Verifique sua conexão e tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Logo state ────────────────────────────────────────────────────────────
  const logoInputRef                            = useRef<HTMLInputElement>(null)
  const [logoFile, setLogoFile]                 = useState<File | null>(null)
  const [logoPreview, setLogoPreview]           = useState<string | null>(user?.logoUrl || null)
  const [isOptimizingLogo, setIsOptimizingLogo] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo]   = useState(false)
  const [logoSuccess, setLogoSuccess]           = useState(false)
  const [logoError, setLogoError]               = useState<string | null>(null)

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsOptimizingLogo(true)
    setLogoError(null)
    setLogoSuccess(false)
    setLogoPreview(URL.createObjectURL(file))
    try {
      const compressed = await compressImage(file)
      setLogoFile(compressed)
      setLogoPreview(URL.createObjectURL(compressed))
    } finally {
      setIsOptimizingLogo(false)
    }
  }

  async function handleLogoUpload() {
    if (!user || !logoFile) return
    setIsUploadingLogo(true)
    setLogoError(null)
    try {
      const updated = await uploadLogo(user.id, logoFile)
      updateUser({ logoUrl: updated.logoUrl ?? '' })
      setLogoFile(null)
      setLogoSuccess(true)
      setTimeout(() => setLogoSuccess(false), 3000)
    } catch {
      setLogoError('Erro ao enviar logo. Tente novamente.')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  // ── Cover state ───────────────────────────────────────────────────────────
  const coverInputRef                               = useRef<HTMLInputElement>(null)
  const [coverFile, setCoverFile]                   = useState<File | null>(null)
  const [coverPreview, setCoverPreview]             = useState<string | null>(user?.coverImageUrl || null)
  const [isOptimizingCover, setIsOptimizingCover]   = useState(false)
  const [isUploadingCover, setIsUploadingCover]     = useState(false)
  const [coverSuccess, setCoverSuccess]             = useState(false)
  const [coverError, setCoverError]                 = useState<string | null>(null)

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsOptimizingCover(true)
    setCoverError(null)
    setCoverSuccess(false)
    setCoverPreview(URL.createObjectURL(file))
    try {
      const compressed = await compressImage(file)
      setCoverFile(compressed)
      setCoverPreview(URL.createObjectURL(compressed))
    } finally {
      setIsOptimizingCover(false)
    }
  }

  async function handleCoverUpload() {
    if (!user || !coverFile) return
    setIsUploadingCover(true)
    setCoverError(null)
    try {
      const updated = await uploadCoverImage(user.id, coverFile)
      updateUser({ coverImageUrl: updated.coverImageUrl ?? null })
      setCoverFile(null)
      setCoverSuccess(true)
      setTimeout(() => setCoverSuccess(false), 3000)
    } catch {
      setCoverError('Erro ao enviar foto de capa. Tente novamente.')
    } finally {
      setIsUploadingCover(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-ink">Configurações</h1>
          <p className="text-sm text-ink-3 mt-0.5">Gerencie as informações e fotos da sua loja.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-surface-2 p-1 rounded-xl mb-6 border border-border">
          {(['info', 'fotos'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-canvas text-ink shadow-sm'
                  : 'text-ink-3 hover:text-ink-2'
              }`}
            >
              {tab === 'info' ? 'Informações' : 'Fotos'}
            </button>
          ))}
        </div>

        {/* ── Informações tab ────────────────────────────────────────────── */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink-2 mb-1.5">Nome de usuário</label>
                <input type="text" required value={form.userName}
                  onChange={e => setField('userName', e.target.value)} className={inputClass} />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-2 mb-1.5">Nome da loja</label>
                <input type="text" required value={form.storeName}
                  onChange={e => setField('storeName', e.target.value)} className={inputClass} />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-2 mb-1.5">
                  WhatsApp
                  <span className="ml-1.5 text-xs text-ink-4 font-normal">(ex: 5511999990000)</span>
                </label>
                <input type="text" required value={form.whatsappNumber}
                  onChange={e => setField('whatsappNumber', e.target.value)}
                  placeholder="5511999990000" className={inputClass} />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-2 mb-1.5">Descrição da loja</label>
                <textarea rows={3} value={form.storeDescription}
                  onChange={e => setField('storeDescription', e.target.value)}
                  placeholder="Descreva sua loja para os clientes…"
                  className={`${inputClass} resize-none`} />
              </div>

              <div className="rounded-lg bg-surface-2 border border-border px-4 py-3 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-ink-3 shrink-0">E-mail</span>
                  <span className="text-xs text-ink-2 truncate">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-ink-3 shrink-0">URL da vitrine</span>
                  <span className="text-xs text-brand font-mono">/{user?.slug}</span>
                </div>
              </div>

              {/* Font picker */}
              <div>
                <label className="block text-sm font-medium text-ink-2 mb-1">Fonte do nome da loja</label>
                <p className="text-xs text-ink-3 mb-3">Como o nome aparece na sua vitrine pública.</p>

                {/* Live preview */}
                <div className="rounded-lg bg-surface-2 border border-border px-4 py-3 mb-3 overflow-hidden">
                  <p
                    className="text-2xl font-extrabold text-ink leading-tight tracking-tight truncate"
                    style={fontStyle(form.storeNameFont || null)}
                  >
                    {form.storeName || 'Nome da Loja'}
                  </p>
                </div>

                {/* Grid of 20 fonts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STORE_FONTS.map((font) => {
                    const active = (form.storeNameFont || 'Inter') === font.key
                    return (
                      <button
                        key={font.key}
                        type="button"
                        onClick={() => setField('storeNameFont', font.key)}
                        style={{ fontFamily: `'${font.key}', sans-serif` }}
                        className={`relative flex flex-col items-start px-3 py-2.5 rounded-lg border-2 transition-all text-left ${
                          active
                            ? 'border-brand bg-brand/8 text-ink'
                            : 'border-border bg-surface-2 text-ink-2 hover:border-border-2 hover:text-ink'
                        }`}
                      >
                        <span className="text-sm font-semibold leading-snug truncate w-full">{font.label}</span>
                        <span
                          className="text-[10px] mt-0.5 text-ink-4 truncate w-full"
                          style={{ fontFamily: 'inherit', fontWeight: 'normal' }}
                        >
                          {font.category}
                        </span>
                        {active && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {saveError && <ErrorBanner>{saveError}</ErrorBanner>}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-cta hover:bg-cta-2 disabled:opacity-60 disabled:cursor-not-allowed text-cta-fg font-semibold py-2.5 transition-colors"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-cta-fg/40 border-t-cta-fg animate-spin" />
                    Salvando…
                  </>
                ) : 'Salvar alterações'}
              </button>
            </form>

            {/* ── Aparência ─────────────────────────────────────────────── */}
            <div className="border-t border-border pt-6">
              <h2 className="text-base font-semibold text-ink mb-0.5">Aparência</h2>
              <p className="text-sm text-ink-3 mb-4">Escolha o tema da interface do painel.</p>

              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { value: 'system', label: 'Sistema', icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                      </svg>
                    )},
                    { value: 'light', label: 'Claro', icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                      </svg>
                    )},
                    { value: 'dark', label: 'Escuro', icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                      </svg>
                    )},
                  ] as const
                ).map(({ value, label, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      theme === value
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-border bg-surface-2 text-ink-3 hover:border-border-2 hover:text-ink-2'
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>

              {theme === 'system' && (
                <p className="mt-3 text-xs text-ink-4">
                  Segue automaticamente a preferência do seu sistema operacional.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Fotos tab ──────────────────────────────────────────────────── */}
        {activeTab === 'fotos' && (
          <div className="space-y-10">

            {/* Logo */}
            <section>
              <h2 className="text-base font-semibold text-ink mb-0.5">Logo da loja</h2>
              <p className="text-sm text-ink-3 mb-4">Exibida no topo da vitrine. PNG, JPG ou WebP · 200×200 px.</p>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-2 border border-border shrink-0 flex items-center justify-center">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-border-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  <button
                    type="button"
                    disabled={isOptimizingLogo || isUploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-ink-2 hover:text-ink hover:border-border-2 text-sm transition-colors bg-canvas disabled:opacity-50"
                  >
                    {isOptimizingLogo ? (
                      <><span className="w-4 h-4 rounded-full border-2 border-border border-t-brand animate-spin shrink-0" /> Otimizando…</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                      {logoFile ? logoFile.name : 'Escolher imagem'}</>
                    )}
                  </button>
                  {logoFile && (
                    <button type="button" onClick={handleLogoUpload} disabled={isUploadingLogo}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cta hover:bg-cta-2 disabled:opacity-60 text-cta-fg text-sm font-semibold transition-colors">
                      {isUploadingLogo ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-cta-fg/40 border-t-cta-fg animate-spin" /> Enviando…</> : 'Salvar logo'}
                    </button>
                  )}
                  {logoError   && <p className="text-xs text-red-600">{logoError}</p>}
                  {logoSuccess && <p className="text-xs text-green-600">Logo atualizada!</p>}
                </div>
              </div>
            </section>

            {/* Capa */}
            <section>
              <h2 className="text-base font-semibold text-ink mb-0.5">Foto de capa</h2>
              <p className="text-sm text-ink-3 mb-4">Banner exibido no topo da vitrine, atrás do perfil. Recomendado: 1200×400 px.</p>
              <div
                className="w-full aspect-3/1 rounded-xl overflow-hidden bg-surface-2 border border-border flex items-center justify-center mb-3 cursor-pointer relative group"
                onClick={() => !isUploadingCover && coverInputRef.current?.click()}
              >
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Capa" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-semibold bg-black/50 px-3 py-1.5 rounded-full">Trocar foto</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-border-2">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <span className="text-xs font-medium">Clique para adicionar foto de capa</span>
                  </div>
                )}
                {isOptimizingCover && (
                  <div className="absolute inset-0 bg-canvas/70 flex items-center justify-center">
                    <span className="w-5 h-5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                  </div>
                )}
              </div>
              <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
              <div className="flex items-center gap-3">
                {coverFile && (
                  <button type="button" onClick={handleCoverUpload} disabled={isUploadingCover}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cta hover:bg-cta-2 disabled:opacity-60 text-cta-fg text-sm font-semibold transition-colors">
                    {isUploadingCover ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-cta-fg/40 border-t-cta-fg animate-spin" /> Enviando…</> : 'Salvar capa'}
                  </button>
                )}
                {coverError   && <p className="text-xs text-red-600">{coverError}</p>}
                {coverSuccess && <p className="text-xs text-green-600">Foto de capa atualizada!</p>}
              </div>
            </section>

          </div>
        )}
      </div>

      {/* Info tab success toast */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-canvas border border-border rounded-xl px-5 py-3.5 shadow-xl">
          <div className="w-7 h-7 rounded-full bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-sm text-ink font-medium">Configurações salvas!</p>
        </div>
      )}
    </>
  )
}
