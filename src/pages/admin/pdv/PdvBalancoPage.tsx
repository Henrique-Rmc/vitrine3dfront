import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getBalance,
  getApiErrorMessage,
  fmtMoney,
  type PdvBalanceResponse,
} from '../../../services/pdvService'

type Preset = 'mes' | 'mesAnterior' | '30d' | 'ano' | 'tudo' | 'custom'

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'mes', label: 'Este mês' },
  { key: 'mesAnterior', label: 'Mês anterior' },
  { key: '30d', label: '30 dias' },
  { key: 'ano', label: 'Este ano' },
  { key: 'tudo', label: 'Tudo' },
  { key: 'custom', label: 'Período' },
]

function ymd(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function presetRange(preset: Exclude<Preset, 'custom'>): { from?: string; to?: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (preset) {
    case 'mes': return { from: ymd(new Date(y, m, 1)), to: ymd(now) }
    case 'mesAnterior': return { from: ymd(new Date(y, m - 1, 1)), to: ymd(new Date(y, m, 0)) }
    case '30d': return { from: ymd(new Date(y, m, now.getDate() - 29)), to: ymd(now) }
    case 'ano': return { from: ymd(new Date(y, 0, 1)), to: ymd(now) }
    case 'tudo': return {}
  }
}

function fmtDay(s: string): string {
  const [y, m, d] = s.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function fmtPercent(n: number): string {
  return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

export default function PdvBalancoPage() {
  const navigate = useNavigate()
  const [preset, setPreset] = useState<Preset>('mes')
  const [customFrom, setCustomFrom] = useState(() => presetRange('mes').from!)
  const [customTo, setCustomTo] = useState(() => ymd(new Date()))
  const [data, setData] = useState<PdvBalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const range = preset === 'custom' ? { from: customFrom || undefined, to: customTo || undefined } : presetRange(preset)
  const { from, to } = range
  const invalidRange = preset === 'custom' && !!customFrom && !!customTo && customFrom > customTo

  useEffect(() => {
    if (invalidRange) return
    let cancelled = false
    setLoading(true)
    setError('')
    getBalance({ from, to })
      .then((res) => { if (!cancelled) setData(res) })
      .catch((err) => { if (!cancelled) setError(getApiErrorMessage(err, 'Erro ao carregar o balanço.')) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [from, to, invalidRange])

  const periodLabel = range.from && range.to
    ? `${fmtDay(range.from)} a ${fmtDay(range.to)}`
    : range.from ? `Desde ${fmtDay(range.from)}` : range.to ? `Até ${fmtDay(range.to)}` : 'Todo o histórico'

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-ink">Balanço</h1>
        <p className="text-xs text-ink-3 mt-0.5">{periodLabel}</p>
      </div>

      {/* Period */}
      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {PRESETS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPreset(key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                preset === key ? 'bg-cta text-cta-fg' : 'bg-canvas border border-border text-ink-2 hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-ink-2">De</label>
              <input type="date" value={customFrom} max={customTo || undefined} onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink focus:outline-none focus:border-cta" />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs text-ink-2">Até</label>
              <input type="date" value={customTo} min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-sm text-ink focus:outline-none focus:border-cta" />
            </div>
          </div>
        )}
        {invalidRange && <p className="text-xs text-red-500">A data inicial deve ser anterior à final.</p>}
      </div>

      {loading && !data && (
        <div className="space-y-3">
          <div className="h-80 rounded-2xl bg-surface animate-pulse" />
          <div className="h-24 rounded-2xl bg-surface animate-pulse" />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-700 dark:text-red-300 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-3 py-2.5">
          {error}
        </p>
      )}

      {data && !error && (
        <div className={`space-y-5 transition-opacity ${loading ? 'opacity-50' : ''}`}>
          <Statement data={data} onFixCosts={() => navigate('/admin/pdv/estoque?aba=custos')} />
          <Indicators data={data} />
          <Position data={data} onReceivables={() => navigate('/admin/pdv/clientes')} />
        </div>
      )}
    </div>
  )
}

// ── DRE cascade ────────────────────────────────────────────────────────────────

type Op = '+' | '−' | '='

function Statement({ data, onFixCosts }: { data: PdvBalanceResponse; onFixCosts: () => void }) {
  const { dre, qualidade, indicadores } = data
  const uncoveredPct = Math.round((1 - qualidade.cmvCoverage) * 100)
  const noSales = indicadores.numeroVendas === 0

  return (
    <section className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">Resultado do período</h2>
        <span className="text-[10px] text-ink-3">Regime de competência</span>
      </div>

      <div className="px-4 pb-2">
        <Line op="+" label="Receita bruta" hint="Soma dos preços de tabela" value={dre.receitaBruta} />
        <Line op="−" label="Descontos concedidos" value={dre.descontos} />
        <Line op="=" label="Receita reconhecida" hint="Inclui vendas a prazo ainda não recebidas" value={dre.receitaLiquida} subtotal />

        {qualidade.estimado && !noSales ? (
          <div className="my-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-3">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Margem indisponível</p>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5 leading-relaxed">
              {uncoveredPct}% da receita do período é de itens sem custo cadastrado. Sem o custo completo, o lucro calculado
              ficaria inflado — por isso CMV, lucro bruto e lucro líquido não são exibidos.
            </p>
            <button
              onClick={onFixCosts}
              className="mt-2 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Cadastrar custos dos produtos
            </button>
          </div>
        ) : null}

        <Line op="−" label="Custo da mercadoria vendida" hint="CMV" value={dre.cmv} />
        <Line op="=" label="Lucro bruto" value={dre.lucroBruto} subtotal signed />
        <Line op="−" label="Despesas com insumos" hint="Compras de material" value={dre.despesasInsumos} />
        <Line op="−" label="Despesas fixas" hint="Aluguel, luz, internet" value={dre.despesasFixas} />
        <Line op="−" label="Retiradas" value={dre.retiradas} />
      </div>

      <FinalLine value={dre.lucroLiquido} />
    </section>
  )
}

function Line({
  op,
  label,
  hint,
  value,
  subtotal,
  signed,
}: {
  op: Op
  label: string
  hint?: string
  value: number | null
  subtotal?: boolean
  signed?: boolean
}) {
  const unavailable = value == null
  const tone = unavailable
    ? 'text-ink-4'
    : signed && value < 0
    ? 'text-red-500'
    : op === '−'
    ? 'text-ink-2'
    : 'text-ink'

  return (
    <div className={`flex items-baseline gap-3 py-2 ${subtotal ? 'border-t border-border mt-1 pt-2.5' : ''}`}>
      <span className={`w-3 shrink-0 text-center text-sm tabular-nums ${subtotal ? 'text-ink font-bold' : 'text-ink-3'}`}>{op}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${subtotal ? 'font-semibold text-ink' : 'text-ink-2'}`}>{label}</p>
        {hint && <p className="text-[11px] text-ink-3 leading-tight">{hint}</p>}
      </div>
      <span className={`text-sm tabular-nums shrink-0 ${subtotal ? 'font-bold' : 'font-medium'} ${tone}`}>
        {unavailable ? '—' : `${op === '−' && value > 0 ? '−' : ''}${fmtMoney(Math.abs(value))}`}
      </span>
    </div>
  )
}

function FinalLine({ value }: { value: number | null }) {
  const unavailable = value == null
  const negative = !unavailable && value < 0
  return (
    <div className="flex items-baseline gap-3 px-4 py-4 bg-canvas border-t border-border">
      <span className="w-3 shrink-0 text-center text-base font-bold text-ink">=</span>
      <div className="flex-1">
        <p className="text-base font-bold text-ink">Lucro líquido</p>
        {unavailable && <p className="text-[11px] text-ink-3">Indisponível até todos os custos estarem cadastrados</p>}
      </div>
      <span className={`text-2xl font-bold tabular-nums tracking-tight ${
        unavailable ? 'text-ink-4' : negative ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'
      }`}>
        {unavailable ? '—' : `${negative ? '−' : ''}${fmtMoney(Math.abs(value))}`}
      </span>
    </div>
  )
}

// ── Indicators ─────────────────────────────────────────────────────────────────

function Indicators({ data }: { data: PdvBalanceResponse }) {
  const { indicadores } = data
  const items: { label: string; value: string; muted?: boolean; negative?: boolean }[] = [
    {
      label: 'Margem bruta',
      value: indicadores.margemBruta != null ? fmtPercent(indicadores.margemBruta) : 'Indisponível',
      muted: indicadores.margemBruta == null,
      negative: (indicadores.margemBruta ?? 0) < 0,
    },
    {
      label: 'Margem líquida',
      value: indicadores.margemLiquida != null ? fmtPercent(indicadores.margemLiquida) : 'Indisponível',
      muted: indicadores.margemLiquida == null,
      negative: (indicadores.margemLiquida ?? 0) < 0,
    },
    {
      label: 'Ticket médio',
      value: indicadores.ticketMedio != null ? fmtMoney(indicadores.ticketMedio) : '—',
      muted: indicadores.ticketMedio == null,
    },
    { label: 'Vendas', value: String(indicadores.numeroVendas) },
  ]

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-ink">Indicadores</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 rounded-2xl border border-border bg-surface overflow-hidden">
        {items.map((it, i) => (
          <div
            key={it.label}
            className={`px-4 py-3 border-border ${i % 2 === 1 ? 'border-l' : ''} ${i >= 2 ? 'border-t md:border-t-0' : ''} ${i === 2 ? 'md:border-l' : ''}`}
          >
            <p className="text-xs text-ink-3">{it.label}</p>
            <p className={`text-base font-bold tabular-nums mt-0.5 ${
              it.muted ? 'text-ink-4 text-sm font-medium' : it.negative ? 'text-red-500' : 'text-ink'
            }`}>
              {it.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Position ───────────────────────────────────────────────────────────────────

function Position({ data, onReceivables }: { data: PdvBalanceResponse; onReceivables: () => void }) {
  const { posicao, dre } = data
  const differs = Math.abs(dre.receitaLiquida - posicao.saldoEmCaixa) > 0.005

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-ink">Posição</h2>
      <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
        <PositionRow label="Saldo em caixa" hint="Dinheiro que efetivamente entrou" value={posicao.saldoEmCaixa} />
        <PositionRow
          label="Contas a receber"
          hint="Débitos de clientes em aberto"
          value={posicao.contasAReceber}
          tone={posicao.contasAReceber > 0 ? 'text-amber-600 dark:text-amber-400' : undefined}
          onClick={posicao.contasAReceber > 0 ? onReceivables : undefined}
        />
        <PositionRow label="Estoque a custo" hint="Valor do estoque pelo custo dos produtos" value={posicao.estoqueACusto} />
      </div>

      {differs && dre.receitaLiquida > 0 && (
        <p className="text-xs text-ink-3 leading-relaxed px-1">
          A receita reconhecida ({fmtMoney(dre.receitaLiquida)}) é diferente do saldo em caixa ({fmtMoney(posicao.saldoEmCaixa)}):
          cada venda conta inteira na data em que aconteceu, mesmo que o cliente ainda esteja devendo, e o caixa também
          reflete despesas e retiradas. Isso mantém o custo e a receita no mesmo período.
        </p>
      )}
    </section>
  )
}

function PositionRow({
  label,
  hint,
  value,
  tone,
  onClick,
}: {
  label: string
  hint: string
  value: number | null
  tone?: string
  onClick?: () => void
}) {
  const content = (
    <>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-sm text-ink">{label}</p>
        <p className="text-[11px] text-ink-3">{hint}</p>
      </div>
      <span className={`text-sm font-bold tabular-nums shrink-0 ${value == null ? 'text-ink-4' : tone ?? (value < 0 ? 'text-red-500' : 'text-ink')}`}>
        {value == null ? '—' : `${value < 0 ? '−' : ''}${fmtMoney(Math.abs(value))}`}
      </span>
      {onClick && <span className="text-ink-3 text-sm shrink-0">›</span>}
    </>
  )

  return onClick ? (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-canvas transition-colors">
      {content}
    </button>
  ) : (
    <div className="flex items-center gap-3 px-4 py-3">{content}</div>
  )
}
