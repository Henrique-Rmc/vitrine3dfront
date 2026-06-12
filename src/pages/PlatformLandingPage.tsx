import { Link } from 'react-router-dom'

const DEMO_STORE_SLUG = 'printlab3d'

const FEATURES = [
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016 2.993 2.993 0 002.25-1.016 3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
      />
    ),
    title: 'Vitrine personalizada',
    description: 'Seu catálogo online com URL própria, pronto para compartilhar com clientes.',
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
      />
    ),
    title: 'Orçamentos via WhatsApp',
    description: 'Clientes solicitam cotações diretamente pelo WhatsApp, sem intermediários.',
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    ),
    title: 'Importação do MakerWorld',
    description: 'Adicione produtos com um clique colando a URL do modelo — nome, descrição e imagem preenchidos automaticamente.',
  },
]

export default function PlatformLandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Nav */}
      <header className="w-full px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <span className="text-lg font-bold tracking-tight">Vitrine3D</span>
        <Link
          to="/admin/register"
          className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          Entrar
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-2xl mx-auto w-full">
        <span className="inline-block mb-4 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/40 text-xs font-medium text-blue-400 tracking-wide">
          Plataforma para impressores 3D
        </span>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-100 leading-tight mb-4">
          Sua vitrine de{' '}
          <span className="text-blue-500">impressão 3D</span>{' '}
          online
        </h1>

        <p className="text-lg text-zinc-400 mb-8 max-w-lg">
          Crie seu catálogo de produtos, receba pedidos de orçamento pelo WhatsApp e gerencie tudo em um painel simples.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* TODO: change to /admin/register when the registration page is created */}
          <Link
            to="/admin/register"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors text-sm"
          >
            Seja um Vendedor
          </Link>
          <Link
            to={`/${DEMO_STORE_SLUG}`}
            className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold transition-colors text-sm border border-zinc-700"
          >
            Ver exemplo de vitrine →
          </Link>
        </div>
      </main>

      {/* Features */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-20 grid gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl bg-zinc-900 border border-zinc-800 p-5"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                {feature.icon}
              </svg>
            </div>
            <p className="text-sm font-semibold text-zinc-100 mb-1">{feature.title}</p>
            <p className="text-xs text-zinc-500 leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-zinc-800 py-6 text-center text-xs text-zinc-600">
        Vitrine3D &mdash; {new Date().getFullYear()}
      </footer>
    </div>
  )
}
