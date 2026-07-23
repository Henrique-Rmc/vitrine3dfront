import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

const CONTACT_EMAIL = 'vitrin.app.store@gmail.com'

export default function BetaPage() {
  const subject = encodeURIComponent('Quero participar do beta do VitreIn')
  const body    = encodeURIComponent(
    'Olá,\n\nGostaria de criar minha vitrine no VitreIn. Seguem meus dados:\n\n' +
    'Nome: \nNome da loja: \nWhatsApp: \n\nAguardo o acesso. Obrigado!'
  )

  return (
    <div className="min-h-screen bg-surface flex flex-col">

      {/* Nav */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link to="/"><Logo height={26} /></Link>
          <Link to="/admin/login" className="text-sm text-ink-3 hover:text-ink transition-colors font-medium">
            Já tenho acesso →
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="max-w-md w-full text-center">

          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-xs font-semibold text-amber-800 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Versão Beta
          </span>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-bold text-ink leading-tight mb-3">
            O VitreIn está em fase beta
          </h1>
          <p className="text-ink-2 text-sm sm:text-base leading-relaxed mb-8">
            No momento, os cadastros são feitos por convite. Entre em contato e
            colocaremos sua vitrine no ar em breve.
          </p>

          {/* Card */}
          <div className="rounded-2xl border border-border bg-white shadow-sm p-6 sm:p-8 text-left mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-3 mb-4">
              Para solicitar acesso
            </p>

            <ol className="space-y-4 text-sm text-ink">
              <li className="flex gap-3">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-cta text-cta-fg text-xs flex items-center justify-center shrink-0 font-semibold">1</span>
                <span>Envie um e-mail para <strong className="text-ink">{CONTACT_EMAIL}</strong> com o nome da sua loja e seu WhatsApp.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-cta text-cta-fg text-xs flex items-center justify-center shrink-0 font-semibold">2</span>
                <span>Nossa equipe retorna em até <strong className="text-ink">24 horas</strong> com o link de acesso exclusivo.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-cta text-cta-fg text-xs flex items-center justify-center shrink-0 font-semibold">3</span>
                <span>Você cria sua vitrine e começa a compartilhar com seus clientes.</span>
              </li>
            </ol>
          </div>

          {/* CTA */}
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-cta hover:bg-cta-2 text-cta-fg font-semibold py-3 text-sm transition-colors mb-3"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Solicitar acesso ao beta
          </a>

          <p className="text-xs text-ink-3">
            Já tem acesso?{' '}
            <Link to="/admin/login" className="text-brand hover:underline font-medium">
              Entrar na minha conta
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-5 text-center text-xs text-ink-3">
        <Link to="/termos-de-uso" className="hover:text-ink transition-colors">Termos de Uso</Link>
        <span className="mx-2">·</span>
        <Link to="/privacidade" className="hover:text-ink transition-colors">Privacidade</Link>
      </footer>
    </div>
  )
}
