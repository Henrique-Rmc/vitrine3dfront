import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { registerUser, uploadLogo } from '../../services/authService'
import { listStates, listCitiesByState, type BrazilState, type BrazilCity } from '../../services/locationService'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RegisterFormData {
  userName: string
  email: string
  password: string
  storeName: string
  slug: string          // auto-generated from storeName, never shown to the user
  whatsappNumber: string // stores only the local part — "+55" is prefixed on submit
  storeDescription: string
  stateId: number | null
  cityId: number | null
}

// Keys used to map backend field errors onto the form
type FormErrorKey = keyof RegisterFormData | 'global'
type FormErrors = Partial<Record<FormErrorKey, string>>

const EMPTY_FORM: RegisterFormData = {
  userName: '',
  email: '',
  password: '',
  storeName: '',
  slug: '',
  whatsappNumber: '',
  storeDescription: '',
  stateId: null,
  cityId: null,
}

const CUSTOM_CITY_VALUE = '__custom__'
const MIN_PASSWORD_LENGTH = 8

// ── Error extraction ──────────────────────────────────────────────────────────
// Tries multiple Spring Boot error shapes:
//   1. { errors: [{ field, message }] }        ← MethodArgumentNotValidException
//   2. { fieldErrors: { fieldName: "msg" } }   ← custom DTO
//   3. flat { email: "msg", ... }              ← simplified response
//   4. { message: "msg" }                      ← global message

function extractFormErrors(err: unknown): FormErrors {
  if (!axios.isAxiosError(err)) {
    return { global: 'Erro inesperado. Tente novamente.' }
  }

  if (!err.response) {
    return { global: 'Sem resposta do servidor. Verifique sua conexão e tente novamente.' }
  }

  // 502 = Vite proxy can't reach the Spring Boot backend
  if (err.response.status === 502 || err.response.status === 503) {
    return { global: 'Backend indisponível (502). Verifique se o servidor Spring Boot está rodando em localhost:8080.' }
  }

  const data = err.response.data as Record<string, unknown> | undefined | null
  if (!data || typeof data !== 'object') {
    return { global: `Erro ${err.response.status}. Tente novamente.` }
  }

  const errors: FormErrors = {}

  // Pattern 1 — Spring Boot MethodArgumentNotValidException
  if (Array.isArray(data.errors)) {
    for (const e of data.errors as { field?: string; message?: string; defaultMessage?: string }[]) {
      const msg = e.message ?? e.defaultMessage ?? ''
      if (e.field) errors[e.field as FormErrorKey] = msg
      else if (msg) errors.global = msg
    }
    if (Object.keys(errors).length) return errors
  }

  // Pattern 2 — custom { fieldErrors: { key: "msg" } }
  if (data.fieldErrors && typeof data.fieldErrors === 'object' && !Array.isArray(data.fieldErrors)) {
    for (const [field, msg] of Object.entries(data.fieldErrors as Record<string, string>)) {
      errors[field as FormErrorKey] = msg
    }
    if (Object.keys(errors).length) return errors
  }

  // Pattern 3 — flat field keys in root object
  const knownFields: FormErrorKey[] = ['userName', 'email', 'password', 'storeName', 'whatsappNumber', 'storeDescription']
  let foundFieldError = false
  for (const field of knownFields) {
    if (typeof data[field] === 'string') {
      errors[field] = data[field] as string
      foundFieldError = true
    }
  }
  if (foundFieldError) return errors

  // Pattern 4 — global message
  if (typeof data.message === 'string') return { global: data.message }
  if (typeof data.error === 'string') return { global: data.error }

  return { global: 'Erro ao criar conta. Verifique os dados e tente novamente.' }
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const inputBase =
  'w-full rounded-lg bg-zinc-800 border px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors'

function inputClass(hasError: boolean) {
  return `${inputBase} ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:ring-blue-600'}`
}

const selectBase =
  'w-full rounded-lg bg-zinc-800 border px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors cursor-pointer'

function selectClass(hasError: boolean) {
  return `${selectBase} ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:ring-blue-600'}`
}

function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FormField({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string
  hint?: React.ReactNode
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-400 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error  && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RegisterForm() {
  const navigate = useNavigate()

  const [form, setForm] = useState<RegisterFormData>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  // Location data from API
  const [states, setStates]               = useState<BrazilState[]>([])
  const [cities, setCities]               = useState<BrazilCity[]>([])
  const [loadingStates, setLoadingStates] = useState(true)
  const [loadingCities, setLoadingCities] = useState(false)

  // UI-only state
  const [logoFile, setLogoFile]             = useState<File | null>(null)
  const [logoPreview, setLogoPreview]       = useState<string | null>(null)
  const [showPassword, setShowPassword]     = useState(false)
  const [isCustomCity, setIsCustomCity]     = useState(false)
  const [customCityName, setCustomCityName] = useState('')
  const [isLoading, setIsLoading]           = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Load states on mount ─────────────────────────────────────────────────────

  useEffect(() => {
    listStates()
      .then(setStates)
      .catch(() => undefined)
      .finally(() => setLoadingStates(false))
  }, [])

  // ── Load cities when state changes ───────────────────────────────────────────

  useEffect(() => {
    if (!form.stateId) { setCities([]); return }
    setLoadingCities(true)
    listCitiesByState(form.stateId)
      .then(setCities)
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false))
  }, [form.stateId])

  // ── Field handlers ───────────────────────────────────────────────────────────

  function setField<K extends keyof RegisterFormData>(key: K, value: RegisterFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    clearFieldError(key)
  }

  function clearFieldError(field: FormErrorKey) {
    setFormErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function handleStoreNameChange(value: string) {
    setForm((prev) => ({ ...prev, storeName: value, slug: generateSlug(value) }))
    clearFieldError('storeName')
    clearFieldError('slug')
  }

  function handleStateChange(rawId: string) {
    const stateId = rawId ? Number(rawId) : null
    setForm((prev) => ({ ...prev, stateId, cityId: null }))
    setIsCustomCity(false)
    setCustomCityName('')
    clearFieldError('stateId')
    clearFieldError('cityId')
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

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setLogoFile(file)
    setLogoPreview(file ? URL.createObjectURL(file) : null)
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Frontend validation
    const clientErrors: FormErrors = {}
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      clientErrors.password = `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
    }
    if (!form.stateId) clientErrors.stateId = 'Selecione o estado.'
    if (!form.cityId && !customCityName.trim()) clientErrors.cityId = 'Selecione ou informe a cidade.'

    if (Object.keys(clientErrors).length) {
      setFormErrors(clientErrors)
      return
    }

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
      })

      // Logo upload is non-critical — account is created regardless
      if (logoFile) {
        await uploadLogo(created.id, logoFile).catch(() => undefined)
      }

      navigate('/admin/login')
    } catch (err) {
      setFormErrors(extractFormErrors(err))
    } finally {
      setIsLoading(false)
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const citySelectValue = isCustomCity
    ? CUSTOM_CITY_VALUE
    : form.cityId !== null
      ? String(form.cityId)
      : ''

  const passwordTooShort = form.password.length > 0 && form.password.length < MIN_PASSWORD_LENGTH

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Global error banner */}
      {formErrors.global && (
        <div className="flex items-start gap-2 rounded-lg bg-red-950/60 border border-red-800/60 px-4 py-3 text-sm text-red-300">
          <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {formErrors.global}
        </div>
      )}

      {/* userName */}
      <FormField label="Seu nome" required error={formErrors.userName}>
        <input
          type="text"
          required
          autoComplete="name"
          disabled={isLoading}
          value={form.userName}
          onChange={(e) => setField('userName', e.target.value)}
          placeholder="João Silva"
          className={inputClass(!!formErrors.userName)}
        />
      </FormField>

      {/* email */}
      <FormField label="E-mail" required error={formErrors.email}>
        <input
          type="email"
          required
          autoComplete="email"
          disabled={isLoading}
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
          placeholder="joao@exemplo.com"
          className={inputClass(!!formErrors.email)}
        />
      </FormField>

      {/* password */}
      <FormField
        label="Senha"
        required
        error={formErrors.password}
        hint={
          <span className={passwordTooShort ? 'text-red-500' : 'text-zinc-500'}>
            Minimum {MIN_PASSWORD_LENGTH} characters
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
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

      {/* storeName */}
      <FormField
        label="Nome da loja"
        required
        error={formErrors.storeName}
        hint={
          form.slug
            ? <>Sua loja ficará em: <span className="text-blue-400 font-mono">vitrine3d.com/{form.slug}</span></>
            : undefined
        }
      >
        <input
          type="text"
          required
          disabled={isLoading}
          value={form.storeName}
          onChange={(e) => handleStoreNameChange(e.target.value)}
          placeholder="PrintLab 3D"
          className={inputClass(!!formErrors.storeName)}
        />
      </FormField>

      {/* storeDescription */}
      <FormField label="Descrição da loja" required error={formErrors.storeDescription} hint="Apresente seus serviços para os clientes.">
        <textarea
          required
          rows={3}
          disabled={isLoading}
          value={form.storeDescription}
          onChange={(e) => setField('storeDescription', e.target.value)}
          placeholder="Impressão 3D de alta qualidade em PLA, ABS e Resina. Action figures, props e peças técnicas sob encomenda."
          className={`${inputClass(!!formErrors.storeDescription)} resize-none`}
        />
      </FormField>

      {/* whatsappNumber — fixed +55 prefix */}
      <FormField
        label="WhatsApp"
        required
        error={formErrors.whatsappNumber}
        hint={!formErrors.whatsappNumber ? 'Digite o DDD e o número. O +55 é adicionado automaticamente.' : undefined}
      >
        <div
          className={`flex rounded-lg overflow-hidden border bg-zinc-800 focus-within:ring-2 transition-colors ${
            formErrors.whatsappNumber
              ? 'border-red-500 focus-within:ring-red-500'
              : 'border-zinc-700 focus-within:ring-blue-600'
          } ${isLoading ? 'opacity-50' : ''}`}
        >
          <span className="flex items-center px-3 text-sm font-medium text-zinc-300 bg-zinc-700/60 border-r border-zinc-700 shrink-0 select-none">
            +55
          </span>
          <input
            type="tel"
            required
            disabled={isLoading}
            value={form.whatsappNumber}
            onChange={(e) => setField('whatsappNumber', e.target.value)}
            placeholder="11 99999-8877"
            className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
        </div>
      </FormField>

      {/* State + City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Estado" required error={formErrors.stateId}>
          <select
            required
            disabled={isLoading || loadingStates}
            value={form.stateId !== null ? String(form.stateId) : ''}
            onChange={(e) => handleStateChange(e.target.value)}
            className={selectClass(!!formErrors.stateId)}
            style={{ colorScheme: 'dark' }}
          >
            <option value="">
              {loadingStates ? 'Carregando…' : 'Selecione o estado'}
            </option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.abbreviation})
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Cidade" required error={formErrors.cityId}>
          <select
            required={!isCustomCity}
            disabled={isLoading || !form.stateId || loadingCities}
            value={citySelectValue}
            onChange={(e) => handleCityChange(e.target.value)}
            className={selectClass(!!formErrors.cityId)}
            style={{ colorScheme: 'dark' }}
          >
            <option value="">
              {loadingCities
                ? 'Carregando…'
                : form.stateId
                  ? 'Selecione a cidade'
                  : 'Selecione o estado primeiro'}
            </option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            <option value={CUSTOM_CITY_VALUE}>Other / Add new city</option>
          </select>
        </FormField>
      </div>

      {/* Custom city name */}
      {isCustomCity && (
        <FormField label="Nome da cidade" required hint="Digite o nome exato da sua cidade.">
          <input
            type="text"
            required
            autoFocus
            disabled={isLoading}
            value={customCityName}
            onChange={(e) => setCustomCityName(e.target.value)}
            placeholder="Ex: São Sebastião do Passé"
            className={inputClass(false)}
          />
        </FormField>
      )}

      {/* Logo file upload */}
      <FormField label="Logo da loja" hint="PNG, JPG ou WEBP · pode ser adicionado depois nas configurações">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-lg border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-800/40 hover:bg-zinc-800 transition-colors px-4 py-5 flex flex-col items-center gap-2 disabled:opacity-50"
        >
          {logoPreview ? (
            <>
              <img src={logoPreview} alt="Logo preview" className="w-16 h-16 rounded-full object-cover border-2 border-zinc-600" />
              <span className="text-xs text-zinc-400">{logoFile?.name}</span>
              <span className="text-xs text-blue-400">Trocar imagem</span>
            </>
          ) : (
            <>
              <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm text-zinc-400">Clique para selecionar</span>
            </>
          )}
        </button>
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleLogoChange} />
      </FormField>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 transition-colors mt-2"
      >
        {isLoading ? (
          <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Criando conta…</>
        ) : (
          'Criar conta grátis'
        )}
      </button>
    </form>
  )
}
