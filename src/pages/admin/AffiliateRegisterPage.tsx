import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { registerUser, uploadLogo } from '../../services/authService'
import { listStates, listCitiesByState, type BrazilState, type BrazilCity } from '../../services/locationService'
import { compressImage } from '../../services/imageOptimizationService'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/Logo'

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  userName: string
  email: string
  password: string
  storeName: string
  whatsappNumber: string
  storeDescription: string
  stateId: number | null
  cityId: number | null
}

type FormErrorKey = keyof FormData | 'global'
type FormErrors = Partial<Record<FormErrorKey, string>>

const EMPTY_FORM: FormData = {
  userName: '',
  email: '',
  password: '',
  storeName: '',
  whatsappNumber: '',
  storeDescription: '',
  stateId: null,
  cityId: null,
}

const CUSTOM_CITY_VALUE = '__custom__'
const MIN_PASSWORD_LENGTH = 8

function extractFormErrors(err: unknown): FormErrors {
  if (!axios.isAxiosError(err)) return { global: 'Erro inesperado. Tente novamente.' }
  if (!err.response) return { global: 'Sem resposta do servidor. Verifique sua conexão.' }
  const data = err.response.data as Record<string, unknown> | undefined | null
  if (!data || typeof data !== 'object') return { global: `Erro ${err.response.status}.` }
  if (Array.isArray(data.errors)) {
    const errors: FormErrors = {}
    for (const e of data.errors as { field?: string; message?: string; defaultMessage?: string }[]) {
      const msg = e.message ?? e.defaultMessage ?? ''
      if (e.field) errors[e.field as FormErrorKey] = msg
      else if (msg) errors.global = msg
    }
    if (Object.keys(errors).length) return errors
  }
  if (typeof data.message === 'string') return { global: data.message }
  return { global: 'Erro ao criar conta parceira. Verifique os dados e tente novamente.' }
}

function inputClass(hasError: boolean) {
  return `w-full rounded-lg bg-surface-2 border px-4 py-2.5 text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors ${
    hasError
      ? 'border-red-400 focus:ring-red-400/30'
      : 'border-border focus:ring-brand/40 focus:border-brand/60'
  }`
}

function selectClass(hasError: boolean) {
  return `w-full rounded-lg bg-surface-2 border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 disabled:opacity-50 cursor-pointer transition-colors ${
    hasError
      ? 'border-red-400 focus:ring-red-400/30'
      : 'border-border focus:ring-brand/40 focus:border-brand/60'
  }`
}

function FormField({ label, hint, error, required, children }: {
  label: string
  hint?: React.ReactNode
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-2 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error  && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AffiliateRegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const [states, setStates]               = useState<BrazilState[]>([])
  const [cities, setCities]               = useState<BrazilCity[]>([])
  const [loadingStates, setLoadingStates] = useState(true)
  const [loadingCities, setLoadingCities] = useState(false)

  const [logoFile, setLogoFile]               = useState<File | null>(null)
  const [logoPreview, setLogoPreview]         = useState<string | null>(null)
  const [isOptimizingLogo, setIsOptimizingLogo] = useState(false)
  const [showPassword, setShowPassword]       = useState(false)
  const [isCustomCity, setIsCustomCity]       = useState(false)
  const [customCityName, setCustomCityName]   = useState('')
  const [isLoading, setIsLoading]             = useState(false)
  const [acceptedTerms, setAcceptedTerms]     = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listStates()
      .then(setStates)
      .catch(() => undefined)
      .finally(() => setLoadingStates(false))
  }, [])

  useEffect(() => {
    if (!form.stateId) { setCities([]); return }
    setLoadingCities(true)
    listCitiesByState(form.stateId)
      .then(setCities)
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false))
  }, [form.stateId])

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFormErrors((prev) => { const next = { ...prev }; delete next[key]; return next })
  }

  function handleStateChange(rawId: string) {
    const stateId = rawId ? Number(rawId) : null
    setForm((prev) => ({ ...prev, stateId, cityId: null }))
    setIsCustomCity(false)
    setCustomCityName('')
  }

  function handleCityChange(value: string) {
    if (value === CUSTOM_CITY_VALUE) {
      setIsCustomCity(true)
      setField('cityId', null)
    } else {
      setIsCustomCity(false)
      setField('cityId', value ? Number(value) : null)
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    setIsOptimizingLogo(true)
    setLogoPreview(URL.createObjectURL(file))
    try {
      const compressed = await compressImage(file)
      setLogoFile(compressed)
      setLogoPreview(URL.createObjectURL(compressed))
    } finally {
      setIsOptimizingLogo(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clientErrors: FormErrors = {}
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      clientErrors.password = `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
    }
    if (!form.stateId) clientErrors.stateId = 'Selecione o estado.'
    if (!form.cityId && !customCityName.trim()) clientErrors.cityId = 'Selecione ou informe a cidade.'
    if (!acceptedTerms) clientErrors.global = 'Você precisa aceitar os Termos de Uso para criar uma conta.'
    if (Object.keys(clientErrors).length) { setFormErrors(clientErrors); return }

    setFormErrors({})
    setIsLoading(true)
    try {
      const created = await registerUser({
        email: form.email,
        password: form.password,
        userName: form.userName,
        storeName: form.storeName,
        whatsappNumber: `55${form.whatsappNumber.replace(/\D/g, '')}`,
        storeDescription: form.storeDescription,
        stateId: form.stateId!,
        ...(form.cityId !== null && { cityId: form.cityId }),
        profileType: 'AFFILIATE',
      })
      if (logoFile) await uploadLogo(created.id, logoFile).catch(() => undefined)
      await login(form.email, form.password)
      navigate('/admin/products')
    } catch (err) {
      setFormErrors(extractFormErrors(err))
    } finally {
      setIsLoading(false)
    }
  }

  const citySelectValue = isCustomCity
    ? CUSTOM_CITY_VALUE
    : form.cityId !== null ? String(form.cityId) : ''

  const passwordTooShort = form.password.length > 0 && form.password.length < MIN_PASSWORD_LENGTH

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <Logo height={40} />
          </Link>
          <div className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/30 text-brand text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-3">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            Conta Parceiro
          </div>
          <h1 className="text-2xl font-bold text-ink">Cadastro de Afiliado</h1>
          <p className="text-sm text-ink-3 mt-1">
            Crie sua vitrine de parceiro com links de indicação.
          </p>
        </div>

        <div className="bg-white border border-border rounded-2xl px-6 py-8 sm:px-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {formErrors.global && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                {formErrors.global}
              </div>
            )}

            <FormField label="Seu nome" required error={formErrors.userName}>
              <input type="text" required autoComplete="name" disabled={isLoading}
                value={form.userName} onChange={(e) => setField('userName', e.target.value)}
                placeholder="João Silva" className={inputClass(!!formErrors.userName)} />
            </FormField>

            <FormField label="E-mail" required error={formErrors.email}>
              <input type="email" required autoComplete="email" disabled={isLoading}
                value={form.email} onChange={(e) => setField('email', e.target.value)}
                placeholder="joao@exemplo.com" className={inputClass(!!formErrors.email)} />
            </FormField>

            <FormField
              label="Senha"
              required
              error={formErrors.password}
              hint={
                <span className={passwordTooShort ? 'text-red-500' : ''}>
                  Mínimo {MIN_PASSWORD_LENGTH} caracteres
                  {passwordTooShort && ` — ${form.password.length}/${MIN_PASSWORD_LENGTH}`}
                </span>
              }
            >
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  disabled={isLoading}
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                  className={`${inputClass(!!formErrors.password)} pr-11`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink-3 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </FormField>

            <FormField label="Nome da vitrine" required error={formErrors.storeName}>
              <input type="text" required disabled={isLoading}
                value={form.storeName} onChange={(e) => setField('storeName', e.target.value)}
                placeholder="Loja do Parceiro" className={inputClass(!!formErrors.storeName)} />
            </FormField>

            <FormField label="Descrição" required error={formErrors.storeDescription}
              hint="Descreva sua vitrine de afiliado.">
              <textarea required rows={3} disabled={isLoading}
                value={form.storeDescription}
                onChange={(e) => setField('storeDescription', e.target.value)}
                placeholder="Curadoria de produtos com os melhores links de indicação."
                className={`${inputClass(!!formErrors.storeDescription)} resize-none`} />
            </FormField>

            <FormField label="WhatsApp" required error={formErrors.whatsappNumber}
              hint={!formErrors.whatsappNumber ? 'DDD + número. O +55 é adicionado automaticamente.' : undefined}>
              <div className={`flex rounded-lg overflow-hidden border bg-surface-2 focus-within:ring-2 transition-colors ${
                formErrors.whatsappNumber ? 'border-red-400 focus-within:ring-red-400/30' : 'border-border focus-within:ring-brand/40'
              } ${isLoading ? 'opacity-50' : ''}`}>
                <span className="flex items-center px-3 text-sm font-medium text-ink-3 bg-surface-3 border-r border-border shrink-0 select-none">
                  +55
                </span>
                <input
                  type="tel" required disabled={isLoading}
                  value={form.whatsappNumber}
                  onChange={(e) => setField('whatsappNumber', e.target.value)}
                  placeholder="11 99999-8877"
                  className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm text-ink placeholder-ink-4 focus:outline-none"
                />
              </div>
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Estado" required error={formErrors.stateId}>
                <select required disabled={isLoading || loadingStates}
                  value={form.stateId !== null ? String(form.stateId) : ''}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className={selectClass(!!formErrors.stateId)}>
                  <option value="">{loadingStates ? 'Carregando…' : 'Selecione'}</option>
                  {states.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.abbreviation})</option>)}
                </select>
              </FormField>

              <FormField label="Cidade" required error={formErrors.cityId}>
                <select
                  required={!isCustomCity}
                  disabled={isLoading || !form.stateId || loadingCities}
                  value={citySelectValue}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className={selectClass(!!formErrors.cityId)}>
                  <option value="">
                    {loadingCities ? 'Carregando…' : form.stateId ? 'Selecione' : 'Selecione o estado'}
                  </option>
                  {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  <option value={CUSTOM_CITY_VALUE}>Outra cidade</option>
                </select>
              </FormField>
            </div>

            {isCustomCity && (
              <FormField label="Nome da cidade" required>
                <input type="text" required autoFocus disabled={isLoading}
                  value={customCityName}
                  onChange={(e) => setCustomCityName(e.target.value)}
                  placeholder="Ex: São Sebastião do Passé"
                  className={inputClass(false)} />
              </FormField>
            )}

            <FormField label="Logo da vitrine" hint="Pode ser adicionado depois nas Configurações">
              <button
                type="button"
                disabled={isLoading || isOptimizingLogo}
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-lg border-2 border-dashed border-border hover:border-border-2 bg-surface-2/60 hover:bg-surface-2 transition-colors px-4 py-5 flex flex-col items-center gap-2 disabled:opacity-50"
              >
                {isOptimizingLogo ? (
                  <>
                    <span className="w-6 h-6 rounded-full border-2 border-border border-t-brand animate-spin" />
                    <span className="text-xs text-ink-3">Processando…</span>
                  </>
                ) : logoPreview ? (
                  <>
                    <img src={logoPreview} alt="Logo" className="w-14 h-14 rounded-full object-cover border-2 border-border" />
                    <span className="text-xs text-brand">Trocar imagem</span>
                  </>
                ) : (
                  <>
                    <svg className="w-7 h-7 text-border-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-sm text-ink-3">Clique para selecionar</span>
                  </>
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleLogoChange} />
            </FormField>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked)
                  if (e.target.checked) setFormErrors((prev) => { const next = { ...prev }; delete next.global; return next })
                }}
                className="mt-0.5 w-4 h-4 shrink-0 rounded border-border-2 accent-brand cursor-pointer"
              />
              <span className="text-xs text-ink-2 leading-relaxed">
                Li e concordo com os{' '}
                <a href="/termos-de-uso" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline font-medium">
                  Termos de Uso
                </a>{' '}
                e a{' '}
                <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline font-medium">
                  Política de Privacidade
                </a>.
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading || !acceptedTerms}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-cta hover:bg-cta-2 disabled:opacity-60 disabled:cursor-not-allowed text-cta-fg font-semibold py-2.5 transition-colors mt-2"
            >
              {isLoading ? (
                <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Criando conta…</>
              ) : (
                'Criar conta parceira'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-3 mt-6">
          Já tem uma conta?{' '}
          <Link to="/admin/login" className="text-brand hover:text-brand-dim font-medium transition-colors">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
