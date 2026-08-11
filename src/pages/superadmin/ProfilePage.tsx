import { useAuth } from '../../context/AuthContext'

export default function SuperadminProfilePage() {
  const { user } = useAuth()

  const rows: { label: string; value: string }[] = [
    { label: 'E-mail', value: user?.email ?? '—' },
    { label: 'Usuário', value: user?.userName ?? '—' },
    { label: 'Função', value: user?.role ?? '—' },
    {
      label: 'Conta desde',
      value: user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        : '—',
    },
    {
      label: 'E-mail verificado',
      value: user?.emailVerified ? 'Sim' : 'Não',
    },
  ]

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-ink mb-6">Meu Perfil</h1>

      <div className="bg-canvas border border-border rounded-xl overflow-hidden">
        {/* Avatar header */}
        <div className="px-6 py-6 border-b border-border flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-brand select-none">
              {user?.userName?.[0]?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <div>
            <p className="font-semibold text-ink text-base">{user?.userName ?? 'Admin'}</p>
            <p className="text-sm text-ink-3">{user?.email}</p>
            <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase border bg-brand/10 text-brand border-brand/20">
              {user?.role ?? 'ADMIN'}
            </span>
          </div>
        </div>

        {/* Info rows */}
        <dl className="divide-y divide-border">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-6 py-3.5">
              <dt className="text-sm text-ink-2">{label}</dt>
              <dd className="text-sm font-medium text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        {/* Note */}
        <div className="px-6 py-4 border-t border-border bg-surface-2">
          <p className="text-xs text-ink-3">
            Para alterar senha ou e-mail do administrador, use o painel do servidor.
          </p>
        </div>
      </div>
    </div>
  )
}
