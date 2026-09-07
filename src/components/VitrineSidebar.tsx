import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function VitrineSidebar() {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 z-40 flex-col bg-canvas border-r border-border">
      <div className="flex-1 px-4 pt-6 pb-4 flex flex-col gap-3 overflow-y-auto">
        <p className="text-xs text-ink-3 leading-relaxed">
          Lojas, autônomos, imóveis, serviços — qualquer negócio pode ter sua vitrine digital profissional. Primeiro mês gratuito.
        </p>

        <Link
          to="/admin/register"
          className="flex items-center justify-center gap-2 rounded-lg bg-cta hover:bg-cta-2 text-cta-fg text-sm font-semibold px-4 py-2.5 transition-colors"
        >
          Criar minha vitrine
        </Link>

        <Link
          to="/admin/login"
          className="flex items-center justify-center rounded-lg border border-border hover:border-border-2 text-ink-2 hover:text-ink text-sm font-medium px-4 py-2.5 transition-colors"
        >
          Entrar
        </Link>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-4 mb-2">
            Para todo tipo de negócio
          </p>
          {['Lojas & Comércio', 'Autônomos', 'Imóveis', 'Veículos', 'Serviços', 'Arte & Artesanato'].map((c) => (
            <p key={c} className="text-xs text-ink-3 py-0.5">{c}</p>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-border shrink-0">
        <Link to="/" className="flex items-center gap-2 hover:opacity-60 transition-opacity w-fit">
          <Logo height={18} />
          <span className="text-[10px] text-ink-4">· Criar minha vitrine →</span>
        </Link>
      </div>
    </aside>
  )
}
