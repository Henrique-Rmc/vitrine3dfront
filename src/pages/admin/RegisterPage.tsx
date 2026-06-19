import { Link } from 'react-router-dom'
import RegisterForm from './RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-block mb-4"
          >
            <span className="font-display text-2xl font-bold text-[#1c1813]">Vitrine Artesã</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#1c1813]">Criar minha vitrine</h1>
          <p className="text-sm text-[#9c8e84] mt-1">
            Comece a apresentar seus produtos em minutos. Gratuito.
          </p>
        </div>

        <div className="bg-white border border-[#e8e2d8] rounded-2xl px-6 py-8 sm:px-8 shadow-sm">
          <RegisterForm />
        </div>

        <p className="text-center text-sm text-[#9c8e84] mt-6">
          Já tem uma conta?{' '}
          <Link
            to="/admin/login"
            className="text-[#c9922c] hover:text-[#b07d1e] font-medium transition-colors"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
