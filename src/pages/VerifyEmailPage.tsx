import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { verifyEmail } from '../services/authService'
import Logo from '../components/Logo'

type Status = 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!token) { setStatus('error'); return }
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <Link to="/" className="inline-block mb-8">
          <Logo height={36} />
        </Link>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <span className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            <p className="text-ink-2 text-sm">Verificando seu e-mail…</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-canvas border border-border rounded-2xl px-6 py-8 shadow-sm flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-ink text-lg">E-mail verificado!</p>
              <p className="text-sm text-ink-3 mt-1">Sua conta está ativa. Você já pode entrar.</p>
            </div>
            <Link
              to="/admin/login"
              className="mt-2 w-full flex items-center justify-center rounded-lg bg-cta hover:bg-cta-2 text-cta-fg font-semibold py-2.5 text-sm transition-colors"
            >
              Ir para o login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-canvas border border-border rounded-2xl px-6 py-8 shadow-sm flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-ink text-lg">Link inválido ou expirado</p>
              <p className="text-sm text-ink-3 mt-1">
                {token
                  ? 'O link de verificação é inválido ou já expirou.'
                  : 'Nenhum token de verificação encontrado.'}
              </p>
            </div>
            <Link
              to="/admin/login"
              className="mt-2 w-full flex items-center justify-center rounded-lg bg-surface-2 hover:bg-surface-3 border border-border text-ink-2 font-medium py-2.5 text-sm transition-colors"
            >
              Voltar ao login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
