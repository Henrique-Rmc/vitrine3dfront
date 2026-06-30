import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

const REPORT_REASONS = [
  'Violação de Direitos Autorais / Cópia Não Autorizada',
  'Fraude ou Golpe',
  'Produto Proibido ou Ilegal',
  'Conteúdo Ofensivo ou Inadequado',
  'Outro',
]

const ADMIN_EMAIL = 'henriqueribcruz@gmail.com'

export default function ReportPage() {
  const [searchParams] = useSearchParams()

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [productUrl, setProductUrl] = useState(searchParams.get('url') ?? '')
  const [reason, setReason]     = useState('')
  const [details, setDetails]   = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]       = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !productUrl.trim() || !reason) {
      setError('Por favor, preencha todos os campos obrigatórios.')
      return
    }
    setError('')

    const subject = encodeURIComponent(`[VitreIn — Denúncia] ${reason}`)
    const body = encodeURIComponent(
      `Nome do denunciante: ${name}\n` +
      `E-mail: ${email}\n\n` +
      `Link do produto/loja: ${productUrl}\n\n` +
      `Motivo: ${reason}\n\n` +
      `Detalhes:\n${details || '(não informado)'}\n\n` +
      `---\nEnviado via formulário de denúncias do VitreIn`,
    )

    window.open(`mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`)
    setSubmitted(true)
  }

  const inputCls = 'w-full rounded-lg bg-[#f4f1eb] border border-[#e8e2d8] px-4 py-2.5 text-sm text-[#1c1813] placeholder-[#c4b8ae] focus:outline-none focus:ring-2 focus:ring-[#c9922c]/40 focus:border-[#c9922c]/60 transition-colors'

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 sm:px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[#1c1813] mb-2">Denúncia enviada</h2>
        <p className="text-sm text-[#6b5d52] mb-6">
          Seu cliente de e-mail foi aberto com a denúncia pronta. Confirme o envio. Nossa equipe irá analisar
          o caso e tomar as medidas necessárias em breve.
        </p>
        <Link to="/" className="text-sm text-[#c9922c] hover:underline">← Voltar para a página inicial</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link to="/" className="text-sm text-[#c9922c] hover:underline">← Voltar</Link>
        <h1 className="mt-4 text-2xl font-bold text-[#1c1813]">Reportar Conteúdo</h1>
        <p className="text-sm text-[#9c8e84] mt-1">
          Use este formulário para reportar produtos ou lojas que violem nossos{' '}
          <Link to="/termos-de-uso" className="text-[#c9922c] hover:underline">Termos de Uso</Link>.
          Nossa equipe analisará sua denúncia e tomará as medidas cabíveis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#6b5d52] mb-1.5">
            Seu nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo" className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6b5d52] mb-1.5">
            Seu e-mail <span className="text-red-500">*</span>
          </label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com" className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6b5d52] mb-1.5">
            Link do produto ou loja <span className="text-red-500">*</span>
          </label>
          <input
            type="url" required value={productUrl} onChange={(e) => setProductUrl(e.target.value)}
            placeholder="https://vitrein.com.br/nome-da-loja" className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6b5d52] mb-1.5">
            Motivo da denúncia <span className="text-red-500">*</span>
          </label>
          <select
            required value={reason} onChange={(e) => setReason(e.target.value)}
            className={`${inputCls} cursor-pointer`}
          >
            <option value="">Selecione o motivo</option>
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6b5d52] mb-1.5">
            Detalhes adicionais
          </label>
          <textarea
            rows={4} value={details} onChange={(e) => setDetails(e.target.value)}
            placeholder="Descreva com mais detalhes o problema encontrado (opcional)."
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
          Ao enviar este formulário, seu cliente de e-mail será aberto com a denúncia pronta para confirmar o
          envio. Sua denúncia é tratada com sigilo.
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#1c1813] hover:bg-[#2c2620] text-white font-semibold py-2.5 text-sm transition-colors"
        >
          Enviar Denúncia
        </button>
      </form>
    </div>
  )
}
