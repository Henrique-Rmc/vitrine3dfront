import { Link } from 'react-router-dom'

const DEMO_STORE_SLUG = 'printlab3d'

const ARTISAN_CATEGORIES = [
  { label: 'Impressão 3D', emoji: '🖨️' },
  { label: 'Joias', emoji: '💍' },
  { label: 'Quadros', emoji: '🖼️' },
  { label: 'Cerâmica', emoji: '🏺' },
  { label: 'Tecidos', emoji: '🧵' },
  { label: 'Madeira', emoji: '🪵' },
]

const FEATURES = [
  {
    title: 'Vitrine com sua identidade',
    description: 'URL própria, logo e descrição da sua loja. Compartilhe um link profissional com seus clientes.',
    iconPath: 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016 2.993 2.993 0 002.25-1.016 3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z',
  },
  {
    title: 'Catálogo por categorias',
    description: 'Organize seus produtos em categorias. Seus clientes navegam com facilidade e descobrem mais do que você faz.',
    iconPath: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z',
  },
  {
    title: 'Orçamentos via WhatsApp',
    description: 'Cada produto tem um botão direto para seu WhatsApp. Sem plataforma no meio, sem taxas.',
    iconPath: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
  },
  {
    title: 'Painel simples e intuitivo',
    description: 'Cadastre produtos, escolha destaques e gerencie tudo pelo celular ou computador.',
    iconPath: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 15V5.25m19.5 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 7.409a2.25 2.25 0 01-1.07-1.916V5.25',
  },
]

export default function PlatformLandingPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1813] flex flex-col">

      {/* Nav */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#e8e2d8]">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between gap-4">
          <span className="font-display text-xl font-bold text-[#1c1813] tracking-tight">
            Vitrine Artesã
          </span>
          <div className="flex items-center gap-3">
            <Link to="/admin/login"
              className="text-sm text-[#9c8e84] hover:text-[#1c1813] transition-colors font-medium">
              Entrar
            </Link>
            <Link to="/admin/register"
              className="text-sm bg-[#1c1813] hover:bg-[#2c2620] text-white font-semibold px-4 py-2 rounded-lg transition-colors">
              Criar vitrine
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-20 pb-16 text-center">
          {/* Pill */}
          <span className="inline-block mb-6 px-4 py-1.5 rounded-full bg-[#f4f1eb] border border-[#e8e2d8] text-xs font-semibold text-[#9c8e84] tracking-wide uppercase">
            Para artesãos, criadores e artistas
          </span>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1c1813] leading-tight tracking-tight mb-6">
            Sua arte merece{' '}
            <span className="text-[#c9922c]">uma vitrine à altura</span>
          </h1>

          <p className="text-lg sm:text-xl text-[#6b5d52] mb-10 max-w-2xl mx-auto leading-relaxed">
            Apresente seus produtos de forma organizada, elegante e profissional. Seus clientes descobrem, exploram e entram em contato diretamente pelo WhatsApp.
          </p>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {ARTISAN_CATEGORIES.map((c) => (
              <span key={c.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#e8e2d8] text-xs font-medium text-[#6b5d52] shadow-sm">
                {c.emoji} {c.label}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/admin/register"
              className="px-8 py-3.5 rounded-xl bg-[#1c1813] hover:bg-[#2c2620] text-white font-semibold transition-colors text-sm shadow-sm"
            >
              Criar minha vitrine grátis
            </Link>
            <Link
              to={`/${DEMO_STORE_SLUG}`}
              className="px-8 py-3.5 rounded-xl bg-white hover:bg-[#f4f1eb] text-[#1c1813] font-semibold transition-colors text-sm border border-[#e8e2d8] shadow-sm"
            >
              Ver exemplo de vitrine →
            </Link>
          </div>
        </section>

        {/* Visual separator */}
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="border-t border-[#e8e2d8]" />
        </div>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1c1813] mb-3">
              Tudo que você precisa, nada que atrapalha
            </h2>
            <p className="text-[#9c8e84] text-sm sm:text-base max-w-xl mx-auto">
              Simples de configurar, bonito de apresentar. Funciona no celular e no computador.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl bg-white border border-[#e8e2d8] shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-[#f4f1eb] flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-[#c9922c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={feature.iconPath} />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[#1c1813] mb-1.5">{feature.title}</p>
                <p className="text-xs text-[#9c8e84] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA bottom */}
        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-20 text-center">
          <div className="bg-white border border-[#e8e2d8] rounded-2xl px-8 py-12 shadow-sm">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1c1813] mb-3">
              Pronto para começar?
            </h2>
            <p className="text-[#9c8e84] text-sm mb-7 max-w-sm mx-auto">
              Crie sua vitrine em minutos, sem custo, sem cartão de crédito.
            </p>
            <Link
              to="/admin/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#1c1813] hover:bg-[#2c2620] text-white font-semibold text-sm transition-colors shadow-sm"
            >
              Criar minha vitrine grátis
            </Link>
            <p className="mt-4 text-xs text-[#c4b8ae]">
              Já tem conta?{' '}
              <Link to="/admin/login" className="text-[#9c8e84] hover:text-[#1c1813] transition-colors">
                Entrar
              </Link>
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e8e2d8] py-6 text-center text-xs text-[#c4b8ae]">
        Vitrine Artesã &mdash; {new Date().getFullYear()}
      </footer>
    </div>
  )
}
