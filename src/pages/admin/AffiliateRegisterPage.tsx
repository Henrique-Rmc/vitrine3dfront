import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/Logo'
import RegistrationForm from '../../components/form/RegistrationForm'

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AffiliateRegisterPage() {
  const { registerAffiliate } = useAuth()

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <Logo height={40} />
          </Link>
          <div className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/30 text-brand text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-3">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            Conta Parceiro
          </div>
          <h1 className="text-2xl font-bold text-ink">Cadastro de Afiliado</h1>
          <p className="text-sm text-ink-3 mt-1">
            Crie sua vitrine de parceiro com links de indicação.
          </p>
        </div>

        <div className="bg-canvas border border-border rounded-2xl px-6 py-8 sm:px-8 shadow-sm">
          <RegistrationForm
            onSubmit={registerAffiliate}
            fallbackErrorMessage="Erro ao criar conta parceira. Verifique os dados e tente novamente."
            storeNameLabel="Nome da vitrine"
            storeNamePlaceholder="Loja do Parceiro"
            descriptionLabel="Descrição"
            descriptionPlaceholder="Curadoria de produtos com os melhores links de indicação."
            descriptionHint="Descreva sua vitrine de afiliado."
            whatsappHint="DDD + número. O +55 é adicionado automaticamente."
            logoLabel="Logo da vitrine"
            logoHint="Pode ser adicionado depois nas Configurações"
            logoProcessingLabel="Processando…"
            submitLabel="Criar conta parceira"
            submitLoadingLabel="Criando conta…"
          />
        </div>

        <p className="text-center text-sm text-ink-3 mt-6">
          Já tem uma conta?{' '}
          <Link to="/admin/login" className="text-brand hover:text-brand-dim font-medium transition-colors">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
