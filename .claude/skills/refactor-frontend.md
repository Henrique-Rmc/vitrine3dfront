# Refatoração Front-End — React + TypeScript + Vite

Execute esta skill com `/refactor-frontend` (opcionalmente `/refactor-frontend <caminho>` para limitar o escopo, ex: `/refactor-frontend src/pages/admin`).

Objetivo: melhorar a qualidade do código (duplicação, organização, tipagem, performance, acessibilidade) **sem alterar nenhum comportamento visível ao usuário**. Refatoração ≠ nova feature ≠ correção de bug. Se encontrar um bug real durante a análise, reporte-o separadamente no relatório final — não o corrija silenciosamente misturado com o refactor, a menos que seja trivial e você avise explicitamente.

---

## Princípios inegociáveis

1. **Zero mudança de comportamento.** Mesma UI, mesmos dados, mesmos side effects, mesma UX. Se não tem certeza se uma mudança altera comportamento, não faça — ou pergunte.
2. **Preservar contratos públicos.** Props de componentes exportados, rotas, formatos de retorno de `src/services`, nomes exportados usados fora do escopo — só mude se atualizar **todos** os call sites e confirmar que compila.
3. **Respeitar o design system existente.** Este projeto usa um sistema de tokens CSS semânticos (`bg-surface`, `text-ink`, `bg-cta`, etc.) via `ThemeContext` para dark mode. Nunca introduza cores hardcoded (`bg-white`, `text-black`, hex direto) que quebrem o tema escuro — sempre reutilize os tokens já existentes.
4. **Incremental, não big-bang.** Uma preocupação por vez, verificando build/lint a cada passo, não uma reescrita monolítica.

---

## Fase 0 — Rede de segurança

Antes de tocar em qualquer arquivo:

1. `git status --short` — se houver mudanças não commitadas fora do escopo desta tarefa, avise o usuário e não misture.
2. Rode o baseline:
   ```
   npm run lint
   npm run build
   ```
   Registre o resultado. Erros pré-existentes não são culpa deste refactor, mas devem ser anotados e **não silenciosamente escondidos** por uma mudança que os mascare.
3. Para refactors amplos (múltiplos arquivos, mudança de assinatura usada em 3+ lugares), trabalhe em cima de um estado git limpo para facilitar comparação/rollback.

---

## Fase 1 — Inventário do projeto

Mapeie a área em escopo (todo `src/` ou o caminho passado como argumento):

- `src/components` — componentes reutilizáveis
- `src/pages`, `src/pages/admin`, `src/pages/superadmin` — telas
- `src/layouts` — shells de layout
- `src/hooks` — hooks customizados
- `src/context` — providers (ex: ThemeContext)
- `src/services` — chamadas de API (axios)
- `src/utils` — funções puras
- `src/types` — tipos compartilhados
- `src/data`, `src/svg` — estáticos

Para cada arquivo relevante, anote mentalmente: responsabilidade, props/params, hooks usados, tamanho aproximado. Use Grep/Glob em vez de ler tudo às cegas — priorize arquivos grandes (>200 linhas) e pastas com muitos arquivos parecidos (`pages/admin/*`, `pages/superadmin/*`) como suspeitos de duplicação.

---

## Fase 2 — Detecção de duplicação

Técnicas concretas (use Grep, não apenas leitura manual):

- **JSX repetido**: buscar strings de classe Tailwind longas e idênticas ou quase idênticas entre arquivos (cards, modais, formulários, badges, tabelas). Três ou mais ocorrências do mesmo bloco estrutural = candidato a componente.
- **Lógica de estado repetida**: padrão `loading/error/data` reimplementado em vários componentes que chamam `src/services` → candidato a hook customizado (`useFetch`, `useAsyncAction`, etc.).
- **Funções utilitárias duplicadas**: formatação de data/moeda, validação de email/senha/CPF, máscaras de input, helpers de upload de imagem → devem existir uma única vez em `src/utils`.
- **Chamadas de API repetidas**: mesmo endpoint/lógica de tratamento de erro reimplementado em componentes diferentes em vez de centralizado em `src/services`.
- **Componentes quase-idênticos**: duas telas ou dois componentes com 80%+ de estrutura igual e pequenas variações → candidato a um componente genérico parametrizado por props, não duas cópias.
- **Formas de tipo repetidas**: interfaces/types redefinidos em múltiplos arquivos em vez de importados de `src/types`.

---

## Fase 3 — Checklist de boas práticas

### Componentes
- Single responsibility: componente com mais de ~250-300 linhas é candidato a divisão.
- Separar componentes de apresentação (puros) de componentes com lógica/state/side-effects.
- Um componente por arquivo, nome em PascalCase, export nomeado consistente com o padrão já usado no projeto.
- Evitar prop drilling profundo (3+ níveis) — preferir composição ou Context (já há `ThemeContext` como referência de padrão).

### Hooks
- Extrair lógica de efeito/estado repetida para hooks customizados em `src/hooks`.
- Respeitar as regras dos hooks; arrays de dependência de `useEffect`/`useMemo`/`useCallback` corretos e completos.
- Preferir derivar estado a partir de props/estado existente em vez de `useEffect` + `setState` quando possível.

### TypeScript
- Eliminar `any` explícito; tipar props, retornos de `services` e estados.
- Usar union types/discriminated unions para estados tipo `loading | error | success` em vez de múltiplos booleanos soltos.
- Tipos compartilhados entre 2+ arquivos devem morar em `src/types`, não redefinidos localmente.

### Performance
- `React.memo` para componentes puros custosos renderizados em listas; `useMemo`/`useCallback` para cálculos ou callbacks caros passados a filhos memoizados — não aplicar indiscriminadamente onde não há ganho medível.
- Lazy loading de rotas pesadas com `React.lazy` + `Suspense` (compatível com `react-router-dom` v7 já usado no projeto).
- Chaves estáveis (`key`) em listas — nunca índice do array quando a lista pode reordenar/filtrar.
- Evitar criar objetos/arrays/funções inline em cada render quando passados como dependência ou prop para componente memoizado.

### Organização de arquivos
- Componentes genéricos reutilizáveis → `src/components` (subpasta dedicada se já for o padrão do projeto).
- Hooks reutilizáveis → `src/hooks`.
- Funções puras → `src/utils`.
- Tipos compartilhados → `src/types`.
- Siga a convenção de nomenclatura e barrel files (se houver) já existente — não introduza um padrão novo isolado.

### Estilo / Tailwind / Dark mode
- Sempre reutilizar os tokens semânticos existentes (`bg-surface`, `text-ink`, `bg-cta`, etc.) — nunca hardcode cor que quebre o tema escuro do `ThemeContext`.
- Strings de classe Tailwind repetidas em 3+ lugares → extrair para componente ou constante, não duplicar.

### Acessibilidade
- Elemento semântico correto (`button` para ação, não `div onClick`), `label` em inputs, `alt` em imagens.
- Componentes interativos customizados (modais, dropdowns, menus) devem suportar navegação por teclado e fechar com `Esc` quando fizer sentido.

### Tratamento de erros
- Centralizar tratamento de erro de API através de `src/services`, evitar `try/catch` reimplementado de forma diferente em cada componente.

---

## Fase 4 — Plano de extração

Antes de executar mudanças que tocam múltiplos arquivos:

- Liste os componentes/hooks/utils a extrair, o novo caminho de arquivo, e quais arquivos vão importar deles.
- Mudanças pequenas e locais (um arquivo, sem mudar API pública): pode prosseguir direto.
- Reestruturações amplas (mover vários arquivos, mudar assinatura de props usada em 3+ lugares, renomear algo exportado usado fora do escopo): apresente o plano resumido ao usuário antes de executar.

---

## Fase 5 — Execução incremental

- Uma extração/mudança por vez. Não misture "extrair hook X" com "renomear componente Y" no mesmo passo.
- Após cada mudança relevante: rode `npm run lint` e `npm run build`. Se falhar, corrija antes de seguir para a próxima mudança — nunca acumule erros.
- Se existirem testes Playwright cobrindo a área alterada, rode-os.
- Nunca altere lógica de negócio, validações, textos exibidos ao usuário ou nomes de rotas como parte do refactor — apenas estrutura, duplicação, tipagem e organização.

---

## Fase 6 — Verificação final

1. Rode `npm run lint` e `npm run build` novamente e compare com o baseline da Fase 0.
2. Rode os testes Playwright existentes, se aplicável à área alterada.
3. Revise o diff (`git diff`) garantindo que nenhuma prop, comportamento, texto ou classe visual mudou de forma não intencional.
4. Recomende (sem executar sozinho, a menos que peçam) testar visualmente no navegador as telas alteradas.

---

## Relatório final

Apresente um resumo:

```
REFATORAÇÃO — RELATÓRIO
────────────────────────
Escopo: <pasta/arquivos analisados>

Duplicações encontradas:
  - <descrição> (arquivos: ...)

Componentes/hooks/utils extraídos:
  - <novo arquivo> ← usado agora por: <arquivos>

Arquivos modificados:
  - <lista>

Build/Lint:
  - Baseline: <resultado>
  - Final:    <resultado>

Bugs encontrados (não corrigidos, fora de escopo):
  - <descrição, se houver>

Pendências que exigem confirmação do usuário:
  - <item, se houver>
```

Termine com `REFATORAÇÃO CONCLUÍDA — comportamento preservado` ou, se algo ficou pendente de confirmação, `REFATORAÇÃO PARCIAL — aguardando confirmação do usuário para: <itens>`.
