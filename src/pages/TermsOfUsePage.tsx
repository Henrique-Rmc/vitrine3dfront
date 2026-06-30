import { Link } from 'react-router-dom'

export default function TermsOfUsePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link to="/" className="text-sm text-[#c9922c] hover:underline">← Voltar</Link>
        <h1 className="mt-4 text-2xl font-bold text-[#1c1813]">Termos de Uso</h1>
        <p className="text-sm text-[#9c8e84] mt-1">Última atualização: junho de 2025</p>
      </div>

      <div className="prose prose-stone max-w-none text-sm text-[#4a3f38] leading-relaxed space-y-6">

        <section>
          <h2 className="text-base font-bold text-[#1c1813] mb-2">1. Natureza da Plataforma</h2>
          <p>
            O <strong>VitreIn</strong> é uma plataforma de vitrine digital que permite a lojistas exibirem seus produtos
            e redirecionarem clientes para negociações via WhatsApp. O VitreIn atua exclusivamente como um canal de
            apresentação e divulgação, <strong>não intermediando, processando nem garantindo quaisquer transações
            comerciais</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#1c1813] mb-2">2. Isenção de Responsabilidade pelo Vendedor</h2>
          <p>
            O VitreIn não se responsabiliza por:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Pagamentos, cobranças, reembolsos ou estornos;</li>
            <li>Envio, entrega, extravios ou danos a produtos;</li>
            <li>Qualidade, autenticidade ou adequação dos produtos anunciados;</li>
            <li>Suporte pós-venda, trocas ou devoluções;</li>
            <li>Acordos, conflitos ou disputas entre compradores e vendedores.</li>
          </ul>
          <p className="mt-2">
            Todas as negociações ocorrem diretamente entre comprador e vendedor, fora do ambiente da plataforma,
            sendo de inteira responsabilidade das partes envolvidas.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#1c1813] mb-2">3. Responsabilidades do Lojista</h2>
          <p>Ao criar uma conta no VitreIn, o lojista declara e se compromete a:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Possuir todos os direitos necessários para comercializar os produtos expostos, incluindo direitos autorais, de propriedade intelectual e de fabricação;</li>
            <li>Não anunciar produtos proibidos, falsificados, que violem direitos de terceiros ou cuja comercialização seja ilegal;</li>
            <li>Manter informações de contato atualizadas e verídicas;</li>
            <li>Responder pelos seus anúncios e pelas negociações deles decorrentes;</li>
            <li>Cumprir todas as obrigações fiscais e legais aplicáveis à sua atividade comercial.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#1c1813] mb-2">4. Conteúdo e Propriedade Intelectual</h2>
          <p>
            O lojista é o único responsável pelo conteúdo publicado em sua vitrine (textos, fotos, descrições e
            preços). O VitreIn se reserva o direito de remover, sem aviso prévio, qualquer conteúdo que viole
            estes Termos, direitos de terceiros ou a legislação vigente.
          </p>
          <p className="mt-2">
            Ao publicar conteúdo na plataforma, o lojista concede ao VitreIn uma licença não exclusiva e gratuita
            para exibir esse conteúdo exclusivamente para fins de operação da vitrine.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#1c1813] mb-2">5. Canal de Denúncias</h2>
          <p>
            Qualquer pessoa pode reportar conteúdo suspeito ou que viole direitos por meio do formulário de
            denúncia disponível em cada produto e no rodapé da plataforma. O VitreIn analisará as denúncias e
            tomará as medidas cabíveis, incluindo a remoção do conteúdo e suspensão da conta do infrator.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#1c1813] mb-2">6. Suspensão e Encerramento de Contas</h2>
          <p>
            O VitreIn pode suspender ou encerrar contas que violem estes Termos, sem necessidade de aviso prévio
            e sem direito a reembolso de qualquer valor eventualmente pago pelo lojista.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#1c1813] mb-2">7. Limitação de Responsabilidade</h2>
          <p>
            Em nenhuma circunstância o VitreIn será responsável por danos diretos, indiretos, incidentais,
            especiais ou consequenciais decorrentes do uso ou incapacidade de uso da plataforma, mesmo que
            tenha sido alertado sobre a possibilidade de tais danos.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#1c1813] mb-2">8. Alterações nos Termos</h2>
          <p>
            O VitreIn poderá atualizar estes Termos a qualquer momento. O uso continuado da plataforma após
            a publicação de alterações implica concordância com os novos termos.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#1c1813] mb-2">9. Foro e Legislação</h2>
          <p>
            Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca de domicílio do
            lojista para dirimir quaisquer controvérsias decorrentes deste instrumento.
          </p>
        </section>

        <div className="pt-6 border-t border-[#e8e2d8] text-xs text-[#9c8e84]">
          Dúvidas? Entre em contato:{' '}
          <a href="mailto:henriqueribcruz@gmail.com" className="text-[#c9922c] hover:underline">
            henriqueribcruz@gmail.com
          </a>
        </div>
      </div>
    </div>
  )
}
