import { Link } from 'react-router-dom'
import RegisterForm from './RegisterForm'
import Logo from '../../components/Logo'
export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <Logo height={40} />
          </Link>
          <h1 className="text-2xl font-bold text-ink">Criar minha vitrine</h1>
          <p className="text-sm text-ink-3 mt-1">
            Qualquer tipo de produto ou serviço.
          </p>
        </div>

        <div className="bg-canvas border border-border rounded-2xl px-6 py-8 sm:px-8 shadow-sm">
          <RegisterForm />
        </div>

        <p className="text-center text-sm text-ink-3 mt-6">
          Já tem uma conta?{' '}
          <Link
            to="/admin/login"
            className="text-brand hover:text-brand-dim font-medium transition-colors"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
