import { Link } from 'react-router-dom'
import RegisterForm from './RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-block text-2xl font-bold text-zinc-100 hover:text-white transition-colors mb-6"
          >
            Vitrine3D
          </Link>
          <h1 className="text-2xl font-bold text-zinc-100">Criar conta</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Comece a vender em minutos. Sem taxas de adesão.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-8 sm:px-8">
          <RegisterForm />
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-zinc-500 mt-6">
          Já tem uma conta?{' '}
          <Link
            to="/admin/login"
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
