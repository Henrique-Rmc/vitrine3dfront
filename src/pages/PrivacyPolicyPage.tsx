import { Link } from 'react-router-dom'

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link to="/" className="text-sm text-brand hover:underline">← Voltar</Link>
        <h1 className="mt-4 text-2xl font-bold text-ink">Política de Privacidade</h1>
        <p className="text-sm text-ink-3 mt-1">Última atualização: junho de 2025 · Em conformidade com a LGPD (Lei 13.709/2018)</p>
      </div>

      <div className="prose prose-stone max-w-none text-sm text-ink leading-relaxed space-y-6">

        <section>
          <h2 className="text-base font-bold text-ink mb-2">1. Quem Somos</h2>
          <p>
            O <strong>VitreIn</strong> é uma plataforma de vitrine digital para lojistas. Nós atuamos como
            controladores dos dados pessoais que coletamos no funcionamento da plataforma e tratamos essas
            informações em conformidade com a Lei Geral de Proteção de Dados (LGPD).
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink mb-2">2. Dados que Coletamos</h2>

          <p className="font-medium text-ink mb-1">2.1 Dados dos Lojistas (cadastro)</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Nome completo e nome da loja;</li>
            <li>Endereço de e-mail e senha (armazenada com hash criptográfico);</li>
            <li>Número de WhatsApp;</li>
            <li>Estado e cidade;</li>
            <li>Imagem de logotipo da loja (quando fornecida).</li>
          </ul>

          <p className="font-medium text-ink mb-1 mt-4">2.2 Dados dos Produtos</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Fotos, títulos, descrições e preços cadastrados pelo lojista;</li>
            <li>Categorias e tipos associados a cada produto.</li>
          </ul>

          <p className="font-medium text-ink mb-1 mt-4">2.3 Dados dos Visitantes</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Cookies de sessão necessários para o funcionamento da plataforma;</li>
            <li>Contagem de cliques no botão de WhatsApp (dado anônimo e agregado).</li>
          </ul>
          <p className="mt-2">
            <strong>Não coletamos</strong> dados pessoais de visitantes (compradores). Eles navegam de forma anônima.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink mb-2">3. Finalidade do Tratamento</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Criar e gerenciar a conta e vitrine do lojista;</li>
            <li>Exibir os produtos cadastrados para visitantes;</li>
            <li>Permitir que visitantes entrem em contato com o lojista via WhatsApp;</li>
            <li>Melhorar e monitorar o desempenho da plataforma;</li>
            <li>Cumprir obrigações legais.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink mb-2">4. Base Legal</h2>
          <p>O tratamento dos dados é realizado com base em:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Execução de contrato</strong> — para operar a conta e a vitrine do lojista (art. 7º, V, LGPD);</li>
            <li><strong>Consentimento</strong> — para cookies não essenciais (art. 7º, I, LGPD);</li>
            <li><strong>Legítimo interesse</strong> — para estatísticas de uso da plataforma (art. 7º, IX, LGPD).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink mb-2">5. Armazenamento e Segurança</h2>
          <p>
            Os dados são armazenados em servidores seguros. As imagens são armazenadas em serviço de
            armazenamento em nuvem (MinIO/S3-compatible). Adotamos medidas técnicas e organizacionais para
            proteger os dados contra acesso não autorizado, perda ou destruição.
          </p>
          <p className="mt-2">
            Senhas são armazenadas usando algoritmos de hash seguros (bcrypt) e nunca em texto puro.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink mb-2">6. Compartilhamento de Dados</h2>
          <p>
            Não vendemos nem compartilhamos dados pessoais com terceiros para fins comerciais. Os dados
            podem ser compartilhados com:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Provedores de infraestrutura técnica necessários para operar a plataforma;</li>
            <li>Autoridades competentes, quando exigido por lei.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink mb-2">7. Seus Direitos (LGPD)</h2>
          <p>Como titular de dados, você tem direito a:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Confirmar a existência de tratamento dos seus dados;</li>
            <li>Acessar os seus dados;</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação dos dados;</li>
            <li>Revogar o consentimento, quando o tratamento for baseado nele;</li>
            <li>Solicitar a exclusão da sua conta e dados associados.</li>
          </ul>
          <p className="mt-2">
            Para exercer esses direitos, entre em contato pelo e-mail abaixo.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink mb-2">8. Retenção de Dados</h2>
          <p>
            Os dados de lojistas são mantidos enquanto a conta estiver ativa. Após o encerramento da conta,
            os dados são excluídos em até 90 dias, salvo quando a retenção for exigida por lei.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink mb-2">9. Cookies</h2>
          <p>
            Utilizamos cookies estritamente necessários para autenticação e funcionamento da sessão do lojista.
            Não utilizamos cookies de rastreamento publicitário ou de terceiros.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink mb-2">10. Contato e Encarregado (DPO)</h2>
          <p>
            Para questões sobre privacidade ou para exercer seus direitos, entre em contato com nosso
            Encarregado de Proteção de Dados:
          </p>
          <p className="mt-2">
            <strong>E-mail:</strong>{' '}
            <a href="mailto:vitrin.app.store@gmail.com" className="text-brand hover:underline">
              vitrin.app.store@gmail.com
            </a>
          </p>
        </section>

        <div className="pt-6 border-t border-border text-xs text-ink-3">
          Esta política pode ser atualizada periodicamente. Recomendamos que você a revise regularmente.
        </div>
      </div>
    </div>
  )
}
