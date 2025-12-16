## Objetivo

Fornecer ao agente instruções curtas e acionáveis para ser produtivo imediatamente neste repositório React + Vite + TypeScript.

## Visão geral do projeto (big picture)

- Projeto: SPA React + TypeScript empacotado com Vite. Código organizado em `src/` com páginas em `src/pages`, componentes em `src/components`, serviços em `src/services` e integrações em `src/integrations`.
- Roteamento: `react-router` definido em `src/App.tsx`. A rota principal utiliza `Layout` (proteção de rota via `AuthContext`) e páginas como `AccountsPayablePage`, `AccountsReceivablePage` e `AppointmentsPage`.
- Estado/Cache remoto: `@tanstack/react-query` (QueryClientProvider em `src/App.tsx`) para cache de requisições.

## Fluxos críticos e integrações

- Autenticação: fluxo centralizado em `src/contexts/AuthContext.tsx`.
  - `login` chama `loginAPI` (`src/utils/api.ts`) e, em caso de sucesso, chama `setAuthTokens` e persiste `user` em `localStorage`.
  - Tokens armazenados em `localStorage` sob `authTokens` e `user` (ver `src/utils/api.ts`). Para depurar, inspecione `localStorage` no browser.
  - Proteção de rotas: `src/components/Layout.tsx` redireciona para `/login` se `isAuthenticated` for falso.

- Chamadas de API:
  - Função utilitária única: `callAPI(endpoint, data, method)` em `src/utils/api.ts` monta a URL como `https://{empresa}.alboomcrm.com/api/{endpoint}` usando `getCompanyFromUrl()` (mapeamento em `src/utils/company.ts`).
  - Há variações: `callAPIN8N` (via webhook n8n) e `callAPIProxy` (usa proxies Vite `/proxy-titulos` e `/proxy-agendamentos` configurados em `vite.config.ts`).
  - Exemplo de serviço: `src/services/titleService.ts` chama `callAPI('account_trans/paginate_apr', ...)` e combina com `getProcessedTitles` para filtrar já processados.

- Supabase: cliente em `src/integrations/supabase/client.ts` (gerado). Importar com `import { supabase } from '@/integrations/supabase/client'`.

## Convenções e padrões do projeto

- Aliases: `@/*` aponta para `src/*` (ver `tsconfig.json` e `vite.config.ts`) — use `@/` para imports absolutos.
- Organização:
  - UI primitives/shadcn: `src/components/ui/*` (botões, inputs, toasts, etc.). Prefira reutilizar esses componentes.
  - Serviços: `src/services/*` para lógica de chamadas à API.
  - Integrações externas: `src/integrations/*` (ex.: `supabase`).
- Erros de API: `callAPI` lança exceções em respostas não-ok; os serviços geralmente fazem `try/catch` e re-lançam após log.
- Respostas do servidor: `loginAPI` às vezes retorna um array; o código trata isso com `if (Array.isArray(result)) result = result[0];` — considere esse comportamento ao adaptar chamadas.

## Comandos de desenvolvimento e debugging

- Instalação: o `package.json` contém `packageManager: "yarn@..."` mas scripts funcionam com `npm` e `yarn`. Recomendo usar o gerenciador de pacotes do projeto (yarn) se possível.

  Exemplo (PowerShell):

```powershell
yarn install
yarn dev   # inicia Vite em http://localhost:8080
```

- Scripts úteis (em `package.json`): `dev`, `build`, `build:dev`, `lint`, `preview`.
- Vite dev server: porta 8080, `host: '::'`. Proxies úteis para integrar com APIs remotas locais no dev (veja `vite.config.ts`):
  - `/proxy-titulos/*` => `https://produtora7.alboomcrm.com/api/*`
  - `/proxy-agendamentos/*` => `https://produtora7.alboomcrm.com/api/*`

## Exemplos práticos para o agente

- Para adicionar uma nova chamada de API server-driven, crie função em `src/services/*.ts` que use `callAPI`.
  - Exemplo: `await callAPI('account_trans/paginate_apr', data, 'POST')` (ver `src/services/titleService.ts`).

- Para alterar comportamento de autenticação:
  - Atualize `loginAPI` em `src/utils/api.ts` e garanta que `setAuthTokens` em `src/utils/api.ts` persista o formato `{ token, tokenAlboom }`.

- Para testes rápidos de UI/estado durante dev:
  - Inspecione `localStorage.authTokens` e `localStorage.user` no DevTools para simular sessão.

## Arquivos-chave (referências rápidas)

- `src/contexts/AuthContext.tsx` — login/logout, restauração de sessão.
- `src/utils/api.ts` — cliente HTTP central, `loginAPI`, `callAPI`, `callAPIProxy`.
- `src/utils/company.ts` — como o app resolve `empresa` a partir do hostname/rota.
- `vite.config.ts` — proxies e alias `@`.
- `src/App.tsx` — rotas principais e onde o `QueryClient` e `AuthProvider` são montados.
- `src/components/ui/*` — primitives de UI (use esses componentes em vez de criar markup cru).

## O que evitar / observações

- Não altere diretamente o `src/integrations/supabase/client.ts` se não souber o impacto: ele foi gerado com chaves publicáveis e configuração de sessão (é seguro usar como cliente frontend).
- Muitas chamadas dependem do formato de resposta da API externa (Alboom). Antes de alterar parsing, inspecione respostas reais (usar `fetch`/DevTools ou adicionar logs temporários).

Se algo aqui estiver incompleto ou se você quiser instruções em outro formato (checklist de revisão de PR, templates de commits, ou exemplos de testes), diga o que quer que eu acrescente.
