import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { createProductType } from '../../services/productTypeService'
import { createCustomAttribute, addOption, labelToKey } from '../../services/attributeService'
import Logo from '../../components/Logo'
import presetsData from '../../utils/businessPresets.json'

// ── Preset types ──────────────────────────────────────────────────────────────

interface PresetFilter {
  id: string
  nome: string
  opcoes: string[]
}

interface PresetType {
  id: string
  nome: string
  filtros_especificos: PresetFilter[]
}

interface Negocio {
  id: string
  nome: string
  descricao: string
  filtros_gerais: PresetFilter[]
  tipos_item: PresetType[]
}

const negocios = presetsData.negocios as Negocio[]

// ── Step type ─────────────────────────────────────────────────────────────────

type Step = 'preset' | 'preview' | 1 | 2 | 3

const inputClass =
  'w-full rounded-lg bg-surface-2 border border-border px-4 py-2.5 text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/60 disabled:opacity-50 transition-colors'

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconTag() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3zM6 6h.008v.008H6V6z" />
    </svg>
  )
}

function IconFilter() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

// ── Progress bar (manual path only) ──────────────────────────────────────────

function ProgressBar({ step }: { step: 1 | 2 }) {
  const pct = step === 1 ? 50 : 100
  return (
    <div className="px-8 pb-6">
      <div className="flex justify-between text-[11px] text-ink-4 mb-1.5">
        <span>Passo {step} de 2</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-[width] duration-500 ease-in-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Step preset: segment selector ─────────────────────────────────────────────

function PresetStepContent({
  onSelectNegocio,
  onSelectManual,
}: {
  onSelectNegocio: (negocio: Negocio) => void
  onSelectManual: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)

  function handleNext() {
    const negocio = negocios.find((n) => n.id === selected)
    if (negocio) onSelectNegocio(negocio)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-ink leading-snug">
          Qual é o seu segmento de negócio?
        </h2>
        <p className="text-sm text-ink-3 mt-1 leading-relaxed">
          Vamos sugerir tipos de produto e filtros prontos para o seu setor.
        </p>
      </div>

      <div className="space-y-2">
        {negocios.map((n) => (
          <button
            key={n.id}
            onClick={() => setSelected(n.id)}
            className={`w-full text-left rounded-xl border px-4 py-4 transition-all ${
              selected === n.id
                ? 'border-brand bg-brand/5 ring-1 ring-brand/20'
                : 'border-border bg-canvas hover:border-border-2 hover:bg-surface-2'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{n.nome}</p>
                <p className="text-xs text-ink-3 mt-0.5">{n.descricao}</p>
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {n.tipos_item.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-2 border border-border text-[11px] text-ink-3"
                    >
                      {t.nome}
                    </span>
                  ))}
                </div>
              </div>
              <div
                className={`shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selected === n.id ? 'border-brand bg-brand' : 'border-border'
                }`}
              >
                {selected === n.id && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        ))}

        <button
          onClick={onSelectManual}
          className="w-full text-left rounded-xl border border-dashed border-border hover:border-border-2 hover:bg-surface-2 px-4 py-3.5 transition-all"
        >
          <p className="text-sm font-semibold text-ink-2">Outro / Configurar manualmente</p>
          <p className="text-xs text-ink-4 mt-0.5">Criar tipos e filtros do zero</p>
        </button>
      </div>

      <button
        onClick={handleNext}
        disabled={!selected}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-cta hover:bg-cta-2 disabled:opacity-50 disabled:cursor-not-allowed text-cta-fg font-semibold py-2.5 transition-colors"
      >
        Ver configuração sugerida
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>
    </div>
  )
}

// ── Step preview: review & toggle selection ───────────────────────────────────

function PreviewStepContent({
  negocio,
  selectedTypeIds,
  onToggleType,
  selectedGlobalFilterIds,
  onToggleGlobalFilter,
  selectedSpecificFilterIds,
  onToggleSpecificFilter,
  onApply,
  onBack,
  isLoading,
  error,
}: {
  negocio: Negocio
  selectedTypeIds: Set<string>
  onToggleType: (id: string) => void
  selectedGlobalFilterIds: Set<string>
  onToggleGlobalFilter: (id: string) => void
  selectedSpecificFilterIds: Map<string, Set<string>>
  onToggleSpecificFilter: (typeId: string, filterId: string) => void
  onApply: () => void
  onBack: () => void
  isLoading: boolean
  error: string | null
}) {
  const totalTypes   = selectedTypeIds.size
  const hasSelection = totalTypes > 0 || selectedGlobalFilterIds.size > 0

  return (
    <div className="space-y-5">
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-ink-3 hover:text-ink transition-colors mb-3"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Voltar
        </button>
        <h2 className="text-base font-bold text-ink leading-snug">
          Revise a configuração
        </h2>
        <p className="text-sm text-ink-3 mt-1">
          Desmarque o que não se aplica à sua loja de <span className="font-medium text-ink-2">{negocio.nome}</span>.
        </p>
      </div>

      <div className="overflow-y-auto max-h-[52vh] space-y-4 pr-1">
        {/* Global filters */}
        {negocio.filtros_gerais.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-3 mb-2">
              Filtros gerais
            </p>
            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
              {negocio.filtros_gerais.map((f) => (
                <label
                  key={f.id}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer bg-canvas hover:bg-surface-2 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedGlobalFilterIds.has(f.id)}
                    onChange={() => onToggleGlobalFilter(f.id)}
                    className="mt-0.5 w-4 h-4 shrink-0 rounded border-border-2 accent-brand cursor-pointer"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{f.nome}</p>
                    <p className="text-xs text-ink-4 mt-0.5 truncate">{f.opcoes.join(' · ')}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Product types */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-3 mb-2">
            Tipos de produto
          </p>
          <div className="space-y-2">
            {negocio.tipos_item.map((tipo) => {
              const typeSelected = selectedTypeIds.has(tipo.id)
              const typeFilters  = selectedSpecificFilterIds.get(tipo.id) ?? new Set<string>()
              return (
                <div key={tipo.id} className="rounded-xl border border-border overflow-hidden">
                  <label className="flex items-center gap-3 px-4 py-3 cursor-pointer bg-canvas hover:bg-surface-2 transition-colors">
                    <input
                      type="checkbox"
                      checked={typeSelected}
                      onChange={() => onToggleType(tipo.id)}
                      className="w-4 h-4 shrink-0 rounded border-border-2 accent-brand cursor-pointer"
                    />
                    <p className="text-sm font-semibold text-ink">{tipo.nome}</p>
                  </label>

                  {typeSelected && tipo.filtros_especificos.length > 0 && (
                    <div className="border-t border-border bg-surface-2 divide-y divide-border">
                      {tipo.filtros_especificos.map((f) => (
                        <label
                          key={f.id}
                          className="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-surface-3 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={typeFilters.has(f.id)}
                            onChange={() => onToggleSpecificFilter(tipo.id, f.id)}
                            className="mt-0.5 w-4 h-4 shrink-0 rounded border-border-2 accent-brand cursor-pointer"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-ink-2">{f.nome}</p>
                            <p className="text-xs text-ink-4 mt-0.5 truncate">{f.opcoes.join(' · ')}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        onClick={onApply}
        disabled={!hasSelection || isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-cta hover:bg-cta-2 disabled:opacity-50 disabled:cursor-not-allowed text-cta-fg font-semibold py-2.5 transition-colors"
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-cta-fg/40 border-t-cta-fg animate-spin" />
            Criando…
          </>
        ) : (
          <>
            Criar {totalTypes} tipo{totalTypes !== 1 ? 's' : ''} e filtros
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </>
        )}
      </button>
    </div>
  )
}

// ── Step 1: product type (manual) ─────────────────────────────────────────────

function Step1Content({
  value,
  onChange,
  onNext,
  isLoading,
  error,
  inputRef,
}: {
  value: string
  onChange: (v: string) => void
  onNext: () => void
  isLoading: boolean
  error: string | null
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
          <IconTag />
        </div>
        <div>
          <h2 className="text-base font-bold text-ink leading-snug">
            Qual é o tipo de produto que você vende?
          </h2>
          <p className="text-sm text-ink-3 mt-1 leading-relaxed">
            Crie o primeiro tipo para organizar seu catálogo. Quem vende roupas pode criar{' '}
            <span className="font-medium text-ink-2">Camisa</span> ou{' '}
            <span className="font-medium text-ink-2">Short</span>, por exemplo.
          </p>
        </div>
      </div>

      <div>
        <input
          ref={inputRef}
          type="text"
          autoFocus
          disabled={isLoading}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onNext() } }}
          placeholder="ex: Camisa, Short, Vestido, Action Figure…"
          className={inputClass}
          maxLength={60}
        />
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>

      <button
        onClick={onNext}
        disabled={!value.trim() || isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-cta hover:bg-cta-2 disabled:opacity-50 disabled:cursor-not-allowed text-cta-fg font-semibold py-2.5 transition-colors"
      >
        {isLoading ? (
          <span className="w-4 h-4 rounded-full border-2 border-cta-fg/40 border-t-cta-fg animate-spin" />
        ) : (
          <>
            Avançar
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </>
        )}
      </button>
    </div>
  )
}

// ── Step 2: filter / attribute (manual) ──────────────────────────────────────

function Step2Content({
  productTypeName,
  value,
  onChange,
  onNext,
  isLoading,
  error,
  inputRef,
}: {
  productTypeName: string
  value: string
  onChange: (v: string) => void
  onNext: () => void
  isLoading: boolean
  error: string | null
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
          <IconFilter />
        </div>
        <div>
          <h2 className="text-base font-bold text-ink leading-snug">
            Crie um filtro para "{productTypeName}"
          </h2>
          <p className="text-sm text-ink-3 mt-1 leading-relaxed">
            Filtros ajudam clientes a encontrar o produto certo. Para{' '}
            <span className="font-medium text-ink-2">{productTypeName}</span> você pode criar{' '}
            <span className="font-medium text-ink-2">Gênero</span>,{' '}
            <span className="font-medium text-ink-2">Tamanho</span> ou{' '}
            <span className="font-medium text-ink-2">Cor</span>, por exemplo.
          </p>
        </div>
      </div>

      <div>
        <input
          ref={inputRef}
          type="text"
          autoFocus
          disabled={isLoading}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onNext() } }}
          placeholder="ex: Gênero, Tamanho, Cor, Material…"
          className={inputClass}
          maxLength={60}
        />
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>

      <button
        onClick={onNext}
        disabled={!value.trim() || isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-cta hover:bg-cta-2 disabled:opacity-50 disabled:cursor-not-allowed text-cta-fg font-semibold py-2.5 transition-colors"
      >
        {isLoading ? (
          <span className="w-4 h-4 rounded-full border-2 border-cta-fg/40 border-t-cta-fg animate-spin" />
        ) : (
          <>
            Avançar
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </>
        )}
      </button>
    </div>
  )
}

// ── Step 3: done ──────────────────────────────────────────────────────────────

function Step3Content({
  wasPreset,
  presetName,
  onYes,
  onNo,
}: {
  wasPreset: boolean
  presetName: string
  onYes: () => void
  onNo: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 text-green-600 flex items-center justify-center">
          <IconCheck />
        </div>
        <div>
          <h2 className="text-base font-bold text-ink">Tudo configurado!</h2>
          <p className="text-sm text-ink-3 mt-1.5 leading-relaxed">
            {wasPreset ? (
              <>
                Tipos e filtros de{' '}
                <span className="font-medium text-ink-2">{presetName}</span> foram criados.
                Você pode ajustar ou adicionar mais a qualquer momento.
              </>
            ) : (
              'Seu tipo de produto e filtro foram criados. Deseja cadastrar mais tipos de produto agora?'
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onYes}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-cta hover:bg-cta-2 text-cta-fg font-semibold py-2.5 transition-colors"
        >
          {wasPreset ? 'Ver tipos de produto' : 'Sim, criar mais tipos'}
        </button>
        <button
          onClick={onNo}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-border hover:border-border-2 bg-canvas hover:bg-surface-2 text-ink-2 font-medium py-2.5 transition-colors text-sm"
        >
          {wasPreset ? 'Cadastrar meu primeiro produto' : 'Não, ver meus produtos'}
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromTypes = searchParams.get('from') === 'product-types'
  const { user } = useAuth()
  const storeId = user?.id ?? ''

  const [step, setStep]                 = useState<Step>('preset')
  const [wasPreset, setWasPreset]       = useState(false)
  const [appliedPresetName, setAppliedPresetName] = useState('')

  // Preset selection state
  const [selectedNegocio, setSelectedNegocio]               = useState<Negocio | null>(null)
  const [selectedTypeIds, setSelectedTypeIds]               = useState<Set<string>>(new Set())
  const [selectedGlobalFilterIds, setSelectedGlobalFilterIds] = useState<Set<string>>(new Set())
  const [selectedSpecificFilterIds, setSelectedSpecificFilterIds] = useState<Map<string, Set<string>>>(new Map())

  // Manual path state
  const [productTypeName, setProductTypeName] = useState('')
  const [filterName, setFilterName]           = useState('')
  const [createdTypeId, setCreatedTypeId]     = useState<number | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const step1InputRef = useRef<HTMLInputElement>(null)
  const step2InputRef = useRef<HTMLInputElement>(null)

  // ── Preset path handlers ────────────────────────────────────────────────────

  function handleSelectNegocio(negocio: Negocio) {
    setSelectedNegocio(negocio)
    setSelectedTypeIds(new Set(negocio.tipos_item.map((t) => t.id)))
    setSelectedGlobalFilterIds(new Set(negocio.filtros_gerais.map((f) => f.id)))
    const specificMap = new Map<string, Set<string>>()
    for (const tipo of negocio.tipos_item) {
      specificMap.set(tipo.id, new Set(tipo.filtros_especificos.map((f) => f.id)))
    }
    setSelectedSpecificFilterIds(specificMap)
    setStep('preview')
  }

  function handleToggleType(id: string) {
    setSelectedTypeIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleToggleGlobalFilter(id: string) {
    setSelectedGlobalFilterIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleToggleSpecificFilter(typeId: string, filterId: string) {
    setSelectedSpecificFilterIds((prev) => {
      const next = new Map(prev)
      const current = new Set(next.get(typeId) ?? [])
      if (current.has(filterId)) current.delete(filterId)
      else current.add(filterId)
      next.set(typeId, current)
      return next
    })
  }

  async function handleApplyPreset() {
    if (!selectedNegocio) return
    setIsLoading(true)
    setError(null)
    try {
      for (const filtro of selectedNegocio.filtros_gerais) {
        if (!selectedGlobalFilterIds.has(filtro.id)) continue
        const attr = await createCustomAttribute(storeId, filtro.nome, labelToKey(filtro.nome), {
          filterable: true,
        })
        for (const opcao of filtro.opcoes) {
          await addOption(storeId, attr.id, opcao)
        }
      }
      for (const [i, tipo] of selectedNegocio.tipos_item.entries()) {
        if (!selectedTypeIds.has(tipo.id)) continue
        const createdType = await createProductType(storeId, {
          key: labelToKey(tipo.nome),
          label: tipo.nome,
          sortOrder: i,
        })
        const typeFilters = selectedSpecificFilterIds.get(tipo.id) ?? new Set<string>()
        for (const filtro of tipo.filtros_especificos) {
          if (!typeFilters.has(filtro.id)) continue
          const attr = await createCustomAttribute(storeId, filtro.nome, labelToKey(filtro.nome), {
            filterable: true,
            productTypeId: createdType.id,
          })
          for (const opcao of filtro.opcoes) {
            await addOption(storeId, attr.id, opcao)
          }
        }
      }
      if (fromTypes) {
        navigate('/admin/product-types')
        return
      }
      setWasPreset(true)
      setAppliedPresetName(selectedNegocio.nome)
      setStep(3)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: unknown } }
      console.error('[preset] backend error:', axiosErr.response?.data ?? err)
      const msg =
        (axiosErr.response?.data as { message?: string })?.message
        ?? 'Erro ao criar configuração. Tente novamente.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Manual path handlers ────────────────────────────────────────────────────

  async function handleStep1() {
    if (!productTypeName.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const type = await createProductType(storeId, {
        key: labelToKey(productTypeName),
        label: productTypeName.trim(),
        sortOrder: 0,
      })
      setCreatedTypeId(type.id)
      setStep(2)
    } catch {
      setError('Erro ao criar tipo de produto. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStep2() {
    if (!filterName.trim() || !createdTypeId) return
    setIsLoading(true)
    setError(null)
    try {
      await createCustomAttribute(
        storeId,
        filterName.trim(),
        labelToKey(filterName),
        { filterable: true, productTypeId: createdTypeId },
      )
      setStep(3)
    } catch {
      setError('Erro ao criar filtro. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const showProgressBar = step === 1 || step === 2

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-canvas border border-border rounded-2xl shadow-lg overflow-hidden">
        <div className="px-8 pt-7 pb-5 border-b border-border flex items-center justify-between">
          <Logo height={26} />
          <span className="text-xs text-ink-4 font-medium">Primeiros passos</span>
        </div>

        {showProgressBar && (
          <div className="pt-6">
            <ProgressBar step={step as 1 | 2} />
          </div>
        )}

        <div className="px-8 pb-8 pt-6">
          {step === 'preset' && (
            <PresetStepContent
              onSelectNegocio={handleSelectNegocio}
              onSelectManual={() => { setError(null); setStep(1) }}
            />
          )}
          {step === 'preview' && selectedNegocio && (
            <PreviewStepContent
              negocio={selectedNegocio}
              selectedTypeIds={selectedTypeIds}
              onToggleType={handleToggleType}
              selectedGlobalFilterIds={selectedGlobalFilterIds}
              onToggleGlobalFilter={handleToggleGlobalFilter}
              selectedSpecificFilterIds={selectedSpecificFilterIds}
              onToggleSpecificFilter={handleToggleSpecificFilter}
              onApply={handleApplyPreset}
              onBack={() => { setError(null); setStep('preset') }}
              isLoading={isLoading}
              error={error}
            />
          )}
          {step === 1 && (
            <Step1Content
              value={productTypeName}
              onChange={setProductTypeName}
              onNext={handleStep1}
              isLoading={isLoading}
              error={error}
              inputRef={step1InputRef}
            />
          )}
          {step === 2 && (
            <Step2Content
              productTypeName={productTypeName}
              value={filterName}
              onChange={setFilterName}
              onNext={handleStep2}
              isLoading={isLoading}
              error={error}
              inputRef={step2InputRef}
            />
          )}
          {step === 3 && (
            <Step3Content
              wasPreset={wasPreset}
              presetName={appliedPresetName}
              onYes={() => navigate('/admin/product-types')}
              onNo={() => navigate('/admin/products')}
            />
          )}
        </div>
      </div>

      {step !== 3 && !fromTypes && (
        <button
          onClick={() => navigate('/admin/products')}
          className="mt-4 text-xs text-ink-4 hover:text-ink-3 transition-colors"
        >
          Pular e configurar depois
        </button>
      )}
    </div>
  )
}
