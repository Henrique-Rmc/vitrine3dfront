import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const from = (location.state as { from?: { pathname: string } } | null)
    ?.from?.pathname ?? '/admin/products'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch {
      setError('E-mail ou senha incorretos. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-lg bg-[#f4f1eb] border border-[#e8e2d8] px-4 py-2.5 text-sm text-[#1c1813] placeholder-[#c4b8ae] focus:outline-none focus:ring-2 focus:ring-[#c9922c]/40 focus:border-[#c9922c]/60 disabled:opacity-50 transition-colors'

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <span className="font-display text-2xl font-bold text-[#1c1813]">Vitrine Artesã</span>
          </Link>
          <h1 className="text-xl font-bold text-[#1c1813]">Entrar no painel</h1>
          <p className="text-sm text-[#9c8e84] mt-1">Acesso restrito ao proprietário da loja</p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#6b5d52] mb-1.5" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6b5d52] mb-1.5" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#1c1813] hover:bg-[#2c2620] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 transition-colors"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Entrando…
              </>
            ) : (
              'Entrar'
            )}
          </button>

          <Link
            to="/admin/register"
            className="w-full flex items-center justify-center rounded-lg border border-[#e8e2d8] hover:border-[#d4cec5] text-[#6b5d52] hover:text-[#1c1813] font-medium py-2.5 transition-colors text-sm bg-white"
          >
            Criar minha vitrine
          </Link>
        </form>

        <p className="mt-6 text-center text-sm text-[#c4b8ae]">
          <Link to="/" className="hover:text-[#9c8e84] transition-colors">
            ← Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  )
}
