import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { createProductType } from '../../services/productTypeService'
import { createCustomAttribute, labelToKey } from '../../services/attributeService'
import Logo from '../../components/Logo'

type Step = 1 | 2 | 3

const inputClass =
  'w-full rounded-lg bg-surface-2 border border-border px-4 py-2.5 text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/60 disabled:opacity-50 transition-colors'

// ── Step icons ────────────────────────────────────────────────────────────────

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

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: Step }) {
  const pct = step === 1 ? 33 : step === 2 ? 67 : 100
  return (
    <div className="px-8 pb-6">
      <div className="flex justify-between text-[11px] text-ink-4 mb-1.5">
        <span>Passo {step} de 3</span>
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

// ── Step 1: product type ──────────────────────────────────────────────────────

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

// ── Step 2: filter / attribute ────────────────────────────────────────────────

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
  onYes,
  onNo,
}: {
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
            Seu tipo de produto e filtro foram criados. Deseja cadastrar mais tipos de produto agora?
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onYes}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-cta hover:bg-cta-2 text-cta-fg font-semibold py-2.5 transition-colors"
        >
          Sim, criar mais tipos
        </button>
        <button
          onClick={onNo}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-border hover:border-border-2 bg-canvas hover:bg-surface-2 text-ink-2 font-medium py-2.5 transition-colors text-sm"
        >
          Não, ver meus produtos
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const storeId = user?.id ?? ''

  const [step, setStep]                       = useState<Step>(1)
  const [productTypeName, setProductTypeName] = useState('')
  const [filterName, setFilterName]           = useState('')
  const [createdTypeId, setCreatedTypeId]     = useState<number | null>(null)
  const [isLoading, setIsLoading]             = useState(false)
  const [error, setError]                     = useState<string | null>(null)

  const step1InputRef = useRef<HTMLInputElement>(null)
  const step2InputRef = useRef<HTMLInputElement>(null)

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

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-canvas border border-border rounded-2xl shadow-lg overflow-hidden">
        {/* Logo */}
        <div className="px-8 pt-7 pb-5 border-b border-border flex items-center justify-between">
          <Logo height={26} />
          <span className="text-xs text-ink-4 font-medium">Primeiros passos</span>
        </div>

        {step < 3 && (
          <div className="pt-6">
            <ProgressBar step={step} />
          </div>
        )}

        <div className="px-8 pb-8 pt-2">
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
              onYes={() => navigate('/admin/product-types')}
              onNo={() => navigate('/admin/products')}
            />
          )}
        </div>
      </div>

      {/* Skip */}
      {step < 3 && (
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
