import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { updateUserProfile, uploadLogo } from '../../services/authService'

const inputClass =
  'w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors'

export default function SettingsPage() {
  const { user, updateUser } = useAuth()

  const [form, setForm] = useState({
    userName:         user?.userName         ?? '',
    storeName:        user?.storeName        ?? '',
    whatsappNumber:   user?.whatsappNumber   ?? '',
    storeDescription: user?.storeDescription ?? '',
  })

  const [isSaving, setIsSaving]     = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [saveError, setSaveError]   = useState<string | null>(null)

  // Logo section
  const logoInputRef                = useRef<HTMLInputElement>(null)
  const [logoFile, setLogoFile]     = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(user?.logoUrl || null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [logoSuccess, setLogoSuccess] = useState(false)
  const [logoError, setLogoError]   = useState<string | null>(null)

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaveError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setIsSaving(true)
    setSaveError(null)
    try {
      await updateUserProfile(user.id, form)
      updateUser({ ...form })
      setIsSaving(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch {
      setSaveError('Erro ao salvar as configurações. Verifique sua conexão e tente novamente.')
      setIsSaving(false)
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setLogoError(null)
    setLogoSuccess(false)
  }

  async function handleLogoUpload() {
    if (!user || !logoFile) return
    setIsUploadingLogo(true)
    setLogoError(null)
    try {
      await uploadLogo(user.id, logoFile)
      setLogoFile(null)
      setLogoSuccess(true)
      setTimeout(() => setLogoSuccess(false), 3000)
    } catch {
      setLogoError('Erro ao enviar logo. Tente novamente.')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  return (
    <>
      <div className="max-w-2xl">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-zinc-100">Configurações</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Gerencie as informações da sua loja e perfil.
          </p>
        </div>

        {/* Profile form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Nome de usuário
            </label>
            <input
              type="text"
              required
              value={form.userName}
              onChange={(e) => setField('userName', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Nome da loja
            </label>
            <input
              type="text"
              required
              value={form.storeName}
              onChange={(e) => setField('storeName', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              WhatsApp
              <span className="ml-1.5 text-xs text-zinc-600 font-normal">(ex: 5511999990000)</span>
            </label>
            <input
              type="text"
              required
              value={form.whatsappNumber}
              onChange={(e) => setField('whatsappNumber', e.target.value)}
              placeholder="5511999990000"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Descrição da loja
            </label>
            <textarea
              rows={3}
              value={form.storeDescription}
              onChange={(e) => setField('storeDescription', e.target.value)}
              placeholder="Descreva sua loja para os clientes..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Read-only info */}
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-zinc-500 shrink-0">E-mail</span>
              <span className="text-xs text-zinc-300 truncate">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-zinc-500 shrink-0">URL da vitrine</span>
              <span className="text-xs text-zinc-300 font-mono">/{user?.slug}</span>
            </div>
          </div>

          {saveError && (
            <div className="rounded-lg bg-red-950/60 border border-red-800/60 px-4 py-3 text-sm text-red-300">
              {saveError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 transition-colors"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar alterações'
            )}
          </button>
        </form>

        {/* Logo section */}
        <div className="mt-8 pt-8 border-t border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-100 mb-1">Logo da loja</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Imagem exibida no topo da sua vitrine pública.
          </p>

          <div className="flex items-start gap-4">
            {/* Preview */}
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 shrink-0 flex items-center justify-center">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <svg
                  className="w-6 h-6 text-zinc-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-600 text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                {logoFile ? logoFile.name : 'Escolher imagem'}
              </button>

              {logoFile && (
                <button
                  type="button"
                  onClick={handleLogoUpload}
                  disabled={isUploadingLogo}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >
                  {isUploadingLogo ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar logo'
                  )}
                </button>
              )}

              {logoError && <p className="text-xs text-red-400">{logoError}</p>}
              {logoSuccess && <p className="text-xs text-green-400">Logo atualizada com sucesso!</p>}
              <p className="text-xs text-zinc-600">PNG, JPG ou WebP. Tamanho recomendado: 200×200 px.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900 border border-green-800/50 rounded-xl px-5 py-3.5 shadow-2xl">
          <div className="w-7 h-7 rounded-full bg-green-950/50 border border-green-700/60 flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-sm text-zinc-100 font-medium">Configurações salvas com sucesso!</p>
        </div>
      )}
    </>
  )
}
