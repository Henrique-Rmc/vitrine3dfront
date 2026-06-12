import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Location mock data ─────────────────────────────────────────────────────────

const BR_STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' },
]

const CITIES_BY_STATE: Record<string, string[]> = {
  AC: ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira'],
  AL: ['Maceió', 'Arapiraca', 'Palmeira dos Índios'],
  AP: ['Macapá', 'Santana', 'Laranjal do Jari'],
  AM: ['Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru'],
  BA: ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro'],
  CE: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral'],
  DF: ['Brasília', 'Ceilândia', 'Taguatinga', 'Planaltina'],
  ES: ['Vitória', 'Vila Velha', 'Serra', 'Cariacica', 'Cachoeiro de Itapemirim'],
  GO: ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia'],
  MA: ['São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon'],
  MT: ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop'],
  MS: ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá'],
  MG: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros', 'Uberaba'],
  PA: ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Castanhal'],
  PB: ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos'],
  PR: ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'Foz do Iguaçu'],
  PE: ['Recife', 'Olinda', 'Caruaru', 'Petrolina', 'Jaboatão dos Guararapes'],
  PI: ['Teresina', 'Parnaíba', 'Picos', 'Floriano'],
  RJ: ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói', 'Petrópolis'],
  RN: ['Natal', 'Mossoró', 'Parnamirim', 'Caicó'],
  RS: ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria', 'Gravataí'],
  RO: ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena'],
  RR: ['Boa Vista', 'Rorainópolis', 'Caracaraí'],
  SC: ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Chapecó', 'Itajaí'],
  SP: ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André', 'Osasco', 'Ribeirão Preto', 'Santos', 'Sorocaba', 'São José dos Campos'],
  SE: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana'],
  TO: ['Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional'],
}

const CUSTOM_CITY_VALUE = '__custom__'

// ── Types ──────────────────────────────────────────────────────────────────────

interface RegisterFormData {
  userName: string
  email: string
  password: string
  storeName: string
  slug: string        // auto-generated from storeName, not shown to the user
  whatsappNumber: string
  state: string
  city: string
}

const EMPTY_FORM: RegisterFormData = {
  userName: '',
  email: '',
  password: '',
  storeName: '',
  slug: '',
  whatsappNumber: '',
  state: '',
  city: '',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const inputClass =
  'w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 transition-colors'

const selectClass = `${inputClass} cursor-pointer`

function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // remove accent marks
    .replace(/[^a-z0-9\s-]/g, '')      // keep letters, numbers, spaces, hyphens
    .trim()
    .replace(/\s+/g, '-')              // spaces → hyphens
    .replace(/-+/g, '-')               // collapse consecutive hyphens
    .slice(0, 40)
}

function FormField({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: React.ReactNode
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
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function RegisterForm() {
  const navigate = useNavigate()

  // Form data (sent to API on submit)
  const [form, setForm] = useState<RegisterFormData>(EMPTY_FORM)

  // UI-only state
  const [logoFile, setLogoFile]         = useState<File | null>(null)
  const [logoPreview, setLogoPreview]   = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isCustomCity, setIsCustomCity] = useState(false)
  const [customCityName, setCustomCityName] = useState('')
  const [isLoading, setIsLoading]       = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Field handlers ───────────────────────────────────────────────────────────

  function setField<K extends keyof RegisterFormData>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleStoreNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      storeName: value,
      slug: generateSlug(value), // always derived — never user-editable
    }))
  }

  function handleStateChange(stateCode: string) {
    setForm((prev) => ({ ...prev, state: stateCode, city: '' }))
    setIsCustomCity(false)
    setCustomCityName('')
  }

  function handleCityChange(value: string) {
    if (value === CUSTOM_CITY_VALUE) {
      setIsCustomCity(true)
      setForm((prev) => ({ ...prev, city: '' }))
    } else {
      setIsCustomCity(false)
      setForm((prev) => ({ ...prev, city: value }))
    }
  }

  function handleCustomCityNameChange(value: string) {
    setCustomCityName(value)
    setForm((prev) => ({ ...prev, city: value }))
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setLogoFile(file)
    setLogoPreview(file ? URL.createObjectURL(file) : null)
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      // TODO: call authService.registerUser(form, logoFile)
      //       then call useAuth().setSession(token, user)
      //       then navigate('/admin/products')
      console.log('Register payload', { ...form, logoFile })
      navigate('/admin/login')
    } catch {
      setError('Erro ao criar conta. Verifique os dados e tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Derived values ───────────────────────────────────────────────────────────

  const availableCities = form.state ? (CITIES_BY_STATE[form.state] ?? []) : []
  const citySelectValue = isCustomCity ? CUSTOM_CITY_VALUE : form.city

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-950/60 border border-red-800/60 px-4 py-3 text-sm text-red-300">
          <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* userName */}
      <FormField label="Seu nome" required>
        <input
          type="text"
          required
          autoComplete="name"
          disabled={isLoading}
          value={form.userName}
          onChange={(e) => setField('userName', e.target.value)}
          placeholder="João Silva"
          className={inputClass}
        />
      </FormField>

      {/* email */}
      <FormField label="E-mail" required>
        <input
          type="email"
          required
          autoComplete="email"
          disabled={isLoading}
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
          placeholder="joao@exemplo.com"
          className={inputClass}
        />
      </FormField>

      {/* password */}
      <FormField label="Senha" required>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete="new-password"
            disabled={isLoading}
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
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

      {/* storeName — slug is auto-generated and shown as a preview hint */}
      <FormField
        label="Nome da loja"
        required
        hint={
          form.slug ? (
            <>
              Sua loja ficará em:{' '}
              <span className="text-blue-400 font-mono">vitrine3d.com/{form.slug}</span>
            </>
          ) : undefined
        }
      >
        <input
          type="text"
          required
          disabled={isLoading}
          value={form.storeName}
          onChange={(e) => handleStoreNameChange(e.target.value)}
          placeholder="PrintLab 3D"
          className={inputClass}
        />
      </FormField>

      {/* whatsappNumber */}
      <FormField
        label="WhatsApp"
        required
        hint="Número que receberá os pedidos de orçamento dos clientes."
      >
        <input
          type="tel"
          required
          disabled={isLoading}
          value={form.whatsappNumber}
          onChange={(e) => setField('whatsappNumber', e.target.value)}
          placeholder="+55 11 99999-8877"
          className={inputClass}
        />
      </FormField>

      {/* state + city — side by side on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* State select */}
        <FormField label="Estado" required>
          <select
            required
            disabled={isLoading}
            value={form.state}
            onChange={(e) => handleStateChange(e.target.value)}
            className={selectClass}
            style={{ colorScheme: 'dark' }}
          >
            <option value="">Selecione o estado</option>
            {BR_STATES.map(({ code, name }) => (
              <option key={code} value={code}>
                {name} ({code})
              </option>
            ))}
          </select>
        </FormField>

        {/* City select */}
        <FormField label="Cidade" required>
          <select
            required
            disabled={isLoading || !form.state}
            value={citySelectValue}
            onChange={(e) => handleCityChange(e.target.value)}
            className={selectClass}
            style={{ colorScheme: 'dark' }}
          >
            <option value="">
              {form.state ? 'Selecione a cidade' : 'Selecione o estado primeiro'}
            </option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
            <option value={CUSTOM_CITY_VALUE}>Other / Add new city</option>
          </select>
        </FormField>
      </div>

      {/* customCityName — shown only when "Other / Add new city" is selected */}
      {isCustomCity && (
        <FormField label="Nome da cidade" required hint="Digite o nome da sua cidade.">
          <input
            type="text"
            required
            autoFocus
            disabled={isLoading}
            value={customCityName}
            onChange={(e) => handleCustomCityNameChange(e.target.value)}
            placeholder="Ex: São Sebastião do Passé"
            className={inputClass}
          />
        </FormField>
      )}

      {/* Logo file upload */}
      <FormField label="Logo da loja" hint="PNG, JPG ou WEBP · máximo 2 MB">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-lg border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-800/40 hover:bg-zinc-800 transition-colors px-4 py-5 flex flex-col items-center gap-2 disabled:opacity-50"
        >
          {logoPreview ? (
            <>
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-zinc-600"
              />
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={handleLogoChange}
        />
      </FormField>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 transition-colors mt-2"
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Criando conta…
          </>
        ) : (
          'Criar conta grátis'
        )}
      </button>
    </form>
  )
}
