# Race Condition: Auth State vs Navigate em Rotas Protegidas

## O que aconteceu

Após o cadastro, o usuário era redirecionado para a tela de **login** em vez
da tela de **onboarding**. O fluxo esperado era:

1. Usuário preenche o formulário de cadastro
2. `registerUser()` cria a conta no backend
3. `login()` autentica automaticamente
4. `navigate('/admin/onboarding')` redireciona para o onboarding
5. `ProtectedRoute` verifica se está autenticado e libera a rota

O que acontecia na prática: o passo 5 falhava e mandava para `/admin/login`.

---

## Por que aconteceu — a race condition

### Contexto: como o React gerencia estado

O React **não aplica mudanças de estado imediatamente** quando você chama
`setState`. Ele enfileira a atualização e a processa no próximo ciclo de
renderização (o "commit"). Isso é proposital — permite agrupar várias
mudanças em uma única renderização para melhorar performance.

### O problema com código assíncrono

A função `login()` no `AuthContext` faz:

```ts
async function login(email, password) {
  const { token, user } = await loginUser({ email, password }) // espera API
  setToken(token)   // enfileira atualização — ainda não commitado
  setUser(user)     // enfileira atualização — ainda não commitado
}
```

No `RegisterForm`, após aguardar o `login()`:

```ts
await login(form.email, form.password)
navigate('/admin/onboarding', { replace: true }) // chamado na linha seguinte
```

Quando `login()` retorna, as chamadas `setToken` e `setUser` foram **feitas**
mas ainda **não foram commitadas** no DOM. São apenas intenções enfileiradas.

### O que o React Router faz ao receber o navigate()

`navigate()` não é uma atualização de estado do React — ele aciona o sistema
de histórico do browser (`History API`) diretamente. O React Router tem uma
assinatura nesse histórico e, ao detectar a mudança de URL, dispara uma
**re-renderização da árvore de componentes**.

Essa re-renderização pode acontecer **antes** do React processar as
atualizações pendentes de `setToken` e `setUser`.

### A sequência exata do problema

```
1. setToken(newToken)       → enfileirado, não commitado
2. setUser(loggedUser)      → enfileirado, não commitado
3. navigate('/admin/onboarding') → History API atualiza a URL
4. React Router detecta mudança → dispara re-render
5. ProtectedRoute renderiza:
     isAuthenticated = !!token
     token = null  ← estado antigo, ainda não commitado!
6. isAuthenticated === false → <Navigate to="/admin/login" />
7. Usuário vai para login ❌
8. React processa setToken/setUser... mas já foi tarde demais
```

O passo 4 "correu na frente" do commit dos estados 1 e 2. Isso é a
**race condition**: duas operações assíncronas concorrendo pela ordem de
execução, onde a ordem importa para a corretude do resultado.

### Por que não era óbvio

O bug parecia inconsistente porque dependia de timing interno do React e
do React Router — dois sistemas independentes com seus próprios ciclos.
Em ambientes mais rápidos ou após otimizações do browser, poderia não
reproduzir sempre.

---

## Como foi resolvido — `flushSync`

O React expõe uma função chamada `flushSync` (do pacote `react-dom`) que
**força o commit síncrono** de todas as atualizações de estado dentro dela
antes de continuar a execução:

```ts
import { flushSync } from 'react-dom'

async function login(email, password) {
  const { token, user } = await loginUser({ email, password })

  flushSync(() => {
    setToken(token)  // commitado imediatamente
    setUser(user)    // commitado imediatamente
  })
  // flushSync retorna somente após o DOM ter sido atualizado

  localStorage.setItem(USER_KEY, JSON.stringify(user))
}
```

Com `flushSync`, a sequência passa a ser:

```
1. flushSync(() => { setToken; setUser }) → React renderiza AGORA, de forma síncrona
2. flushSync retorna — token e user já estão no DOM
3. navigate('/admin/onboarding') → History API atualiza a URL
4. React Router detecta mudança → dispara re-render
5. ProtectedRoute renderiza:
     isAuthenticated = !!token
     token = "eyJ..." ← estado correto, já commitado
6. isAuthenticated === true → <Outlet /> → OnboardingPage ✓
```

A race condition é eliminada porque não há mais competição: o estado de auth
é garantidamente commitado **antes** de qualquer navegação acontecer.

---

## Por que não usar flushSync em todo lugar

`flushSync` força uma renderização síncrona, o que pode ser custoso se usado
indiscriminadamente. Ele é adequado aqui porque:

- Acontece uma única vez por login (não em loop)
- O custo de uma renderização extra é imperceptível para o usuário
- A corretude do fluxo depende da ordem garantida

O React recomenda usar `flushSync` apenas quando necessário para coordenar
com sistemas externos ao ciclo de renderização — exatamente o caso do
React Router com sua History API.

---

## Lição geral

Sempre que você combina:
- **Atualização de estado React** (`setState`)
- **Ação imediata dependente desse estado** (navegar para rota protegida,
  disparar evento para sistema externo, etc.)

...existe risco de race condition. As soluções comuns são:

| Abordagem | Quando usar |
|---|---|
| `flushSync` | Quando a ação é imediata e síncrona (navigate após login) |
| `useEffect` com dependência | Quando a ação pode esperar o próximo render |
| Callback após commit | Quando a biblioteca oferece esse hook (ex: `setState(v, callback)` no React antigo) |
| Armazenar intenção no estado | Quando a ação deve sobreviver a re-renders intermediários |
