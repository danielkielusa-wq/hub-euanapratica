# EUA Na Pratica Hub -- Guia de Testes E2E

> Mapa de cobertura, como executar e como adicionar testes.
> **Ultima atualizacao:** 2026-02-26

---

## Sumario

1. [Visao Geral](#visao-geral)
2. [Como Rodar — Painel Admin](#como-rodar--painel-admin)
3. [Como Rodar — Playwright (CI/CD)](#como-rodar--playwright-cicd)
4. [Mapa de Cobertura](#mapa-de-cobertura)
5. [Estrutura de Teste — Painel Admin](#estrutura-de-teste--painel-admin)
6. [Estrutura de Teste — Playwright](#estrutura-de-teste--playwright)
7. [Como Adicionar um Teste](#como-adicionar-um-teste)
8. [Health Checks](#health-checks)
9. [Dados de Teste](#dados-de-teste)
10. [CI/CD](#cicd)
11. [Troubleshooting](#troubleshooting)
12. [Referencias](#referencias)

---

## Visao Geral

O projeto possui **dois sistemas de testes E2E** complementares:

| Sistema | Onde roda | Proposito | Testes |
|---------|-----------|-----------|--------|
| **Painel Admin** (`/admin/testes-e2e`) | Dentro da aplicacao, browser | Verificacao deterministica de rotas, RBAC e fluxos declarados | 35 testes em 7 suites |
| **Playwright** (CLI / GitHub Actions) | Node.js + Chromium headless | Navegacao real no browser, smoke tests, ResumePass mock/real | 54 testes + 1 opt-in |

### O que cada sistema cobre

- **Painel Admin:** Verifica se rotas existem, se o RBAC bloqueia acessos nao autorizados (security tests), e se fluxos declarados estao corretos. Resultados sao salvos no banco (`e2e_test_runs`, `e2e_test_results`) e geram um prompt de correcao para falhas.
- **Playwright:** Navega paginas reais no Chromium, verifica renderizacao, simula upload de curriculo (ResumePass), e roda diariamente via GitHub Actions com notificacao via N8N/Telegram.

---

## Como Rodar -- Painel Admin

### Acesso

1. Logar como **admin**
2. Menu lateral > **GESTAO DE CONTEUDO** > **Testes E2E**
3. URL: `/admin/testes-e2e`

### Execucao

1. Clicar em **"Executar Testes"**
2. (Opcional) Selecionar suites especificas para rodar
3. Aguardar processamento (poucos segundos)
4. Resultado: cards com total, aprovados, reprovados, duracao

### Visualizacao de Resultados

- **Ultima execucao:** Card principal com status geral (passed/failed)
- **Historico:** Tabela com ultimas 10 execucoes, quem executou, data/hora
- **Detalhes:** Clique em uma execucao para ver resultado de cada teste
- **Prompt de correcao:** Gerado automaticamente para testes que falharam, incluindo prioridade de seguranca

### Suites disponiveis

| # | Suite | Testes | Tipo |
|---|-------|--------|------|
| 1 | Autenticacao e Controle de Acesso | 7 | Login, logout, RBAC |
| 2 | Perfil do Usuario | 2 | Visualizar, editar perfil |
| 3 | Area do Aluno | 5 | Dashboard, agenda, espacos, tarefas, biblioteca |
| 4 | Area do Mentor | 9 | Dashboard, espacos, sessoes, tarefas, agenda |
| 5 | Area do Admin | 7 | Dashboard, espacos, matriculas, usuarios, produtos, auditoria |
| 6 | Rotas Publicas e Recuperacao | 4 | Landing, cadastro, esqueci-senha, 404 |
| 7 | Fluxos E2E Completos | 2 | Tarefa mentor-aluno, matricula admin-aluno |

---

## Como Rodar -- Playwright (CI/CD)

### Setup local

```bash
# 1. Instalar dependencias
npm install

# 2. Instalar Chromium
npx playwright install chromium

# 3. Criar arquivo de credenciais
# Copiar para e2e/.env.e2e:
E2E_ADMIN_EMAIL=admin@exemplo.com
E2E_ADMIN_PASSWORD=senha-admin
E2E_STUDENT_EMAIL=aluno@exemplo.com
E2E_STUDENT_PASSWORD=senha-aluno
SUPABASE_URL=https://seqgnxynrcylxsdzbloa.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

### Comandos

| Comando | O que faz |
|---------|-----------|
| `npm run test:e2e` | Roda todos os 54 testes padrao |
| `npm run test:e2e:public` | So paginas publicas (9 testes, ~30s) |
| `npm run test:e2e:admin` | So testes admin (31 testes) |
| `npm run test:e2e:student` | So testes student (12 testes) |
| `npm run test:e2e:real` | ResumePass com IA real (**consome creditos**) |
| `npm run test:e2e:report` | Abre HTML report no browser |
| `npm run test:e2e:ui` | Abre Playwright UI (modo visual/debug) |

### Projetos Playwright

| Projeto | Auth | Arquivos |
|---------|------|----------|
| `auth-setup` | Nenhuma | `auth.setup.ts` |
| `public` | Nenhuma | `public.*.ts` |
| `admin` | `admin.json` | `admin.*.ts` (exceto `-real`) |
| `student` | `student.json` | `student.*.ts` |
| `admin-real` | `admin.json` | `admin.*-real.spec.ts` (opt-in) |

---

## Mapa de Cobertura

### Testes do Painel Admin (35 testes)

| Area | Testes | Status | Descricao |
|------|--------|--------|-----------|
| Auth & RBAC | TC-1.1 a TC-1.7 | Ativo | Login por role, logout, acesso negado |
| Perfil | TC-2.1, TC-2.2 | Ativo | Visualizar e editar perfil |
| Area do Aluno | TC-3.1 a TC-3.5 | Ativo | Dashboard, agenda, espacos, tarefas, biblioteca |
| Area do Mentor | TC-4.1 a TC-4.9 | Ativo | Dashboard, espacos, sessoes, tarefas, agenda |
| Area do Admin | TC-5.1 a TC-5.7 | Ativo | Dashboard, espacos, matriculas, usuarios, produtos, auditoria |
| Rotas Publicas | TC-6.1 a TC-6.4 | Ativo | Landing, cadastro, esqueci-senha, 404 |
| Fluxos E2E | TC-7.1, TC-7.2 | Ativo | Tarefa completa, matricula completa |

### Testes Playwright (54 + 1 testes)

| Area | Testes | Status | Descricao |
|------|--------|--------|-----------|
| Paginas publicas | 9 testes | Ativo | Smoke test de 9 rotas sem autenticacao |
| Admin smoke | 24 testes | Ativo | Smoke test de todas as paginas admin |
| Admin login flow | 3 testes | Ativo | Login via UI, erro, bloqueio |
| Admin ResumePass (mock) | 4 testes | Ativo | Upload, analise, resultado -- com IA mockada |
| Admin ResumePass (real) | 1 teste | Opt-in | Upload real -- **consome creditos** |
| Student smoke | 12 testes | Ativo | Smoke test de paginas autenticadas |

### Testes E2E manuais documentados por feature

| Feature | Documento | Casos de teste |
|---------|-----------|---------------|
| Booking System | `docs/15 Booking System/E2E_TESTS.md` | 55+ casos (aluno, mentor, admin, emails, timezone, concorrencia) |
| Content Studio | `docs/20 Content Studio/E2E_TESTS.md` | 30+ casos (insights, ideias, roteiros, calendario, prompts) |
| Meu Hub | `docs/18 Meu Hub/E2E-TESTE.md` | 13 cenarios (compra, agendamento, progresso, webhook) |
| Career Assessment Onboarding | `docs/19 Career Assessment Onboarding/E2E_TESTS.md` | 15 casos (fluxo novo, bridge, validacao) |
| Lives System | `docs/21 Lives System/E2E-TESTE.md` | Cenarios de lives e sessoes |

---

## Estrutura de Teste -- Painel Admin

### Arquivos principais

| Arquivo | Descricao |
|---------|-----------|
| `src/data/e2e-test-definitions.ts` | Definicao de todas as suites e testes |
| `src/hooks/useE2ETests.ts` | Hook com mutacao de execucao + queries de resultado |
| `src/types/e2e.ts` | Tipos TypeScript (E2ETestRun, E2ETestResult, etc.) |
| `src/pages/admin/AdminE2ETests.tsx` | Pagina admin com UI de execucao e resultados |

### Tabelas do banco

| Tabela | Descricao |
|--------|-----------|
| `e2e_test_runs` | Registro de cada execucao (status, total, passed, failed, prompt) |
| `e2e_test_results` | Resultado individual de cada teste (suite, code, status, log) |

### Como funciona a verificacao

O sistema do painel admin utiliza **verificacao deterministica de rotas**:

1. Um mapa de rotas validas (`VALID_ROUTES`) e extraido do `App.tsx`
2. Para cada teste, `verifyRoute()` verifica se a rota existe e avalia conforme o tipo:
   - **positive**: rota deve existir e carregar
   - **negative**: sistema deve rejeitar a acao com erro amigavel
   - **security**: sistema deve bloquear acesso nao autorizado (RBAC)
3. `evaluateTest()` compara o comportamento verificado com o esperado
4. Testes de seguranca que falham sao priorizados no prompt de correcao

### Tipos de teste

| Tipo | Expectativa | Exemplo |
|------|-------------|---------|
| `positive` | Acao funciona normalmente | Login com credenciais validas |
| `negative` | Sistema rejeita de forma amigavel | Login com credenciais invalidas |
| `security` | Acesso e negado (RBAC) | Student tenta acessar `/admin/dashboard` |

---

## Estrutura de Teste -- Playwright

### Arquivos

```
e2e/
  .env.e2e                       # Credenciais locais (nao commitado)
  .auth/                         # Sessoes salvas (nao commitado)
  fixtures/
    test-resume.pdf              # PDF de teste para ResumePass
    mock-resume-result.json      # Resposta mock da IA (score 78)
  helpers.ts                     # Auth helpers + listas de rotas
  auth.setup.ts                  # Autentica admin e student via Supabase
  public.smoke.spec.ts           # 9 testes: paginas sem auth
  admin.smoke.spec.ts            # 24 testes: todas as paginas admin
  admin.login-flow.spec.ts       # 3 testes: login UI, erro, bloqueio
  admin.resumepass.spec.ts       # 4 testes: ResumePass com IA mockada
  admin.resumepass-real.spec.ts  # 1 teste: ResumePass com IA real
  student.smoke.spec.ts          # 12 testes: paginas do aluno
  notify-webhook.mjs             # Envia resultado para N8N
  n8n-workflow-e2e.json          # Workflow N8N (importar no N8N)

playwright.config.ts             # Configuracao principal
.github/workflows/e2e-daily.yml  # CI/CD GitHub Actions
```

### Estrategias de espera (SPA + Supabase)

O Supabase mantem WebSocket (realtime) aberto permanentemente. `networkidle` nunca dispara.

**Solucao usada:** `waitUntil: 'domcontentloaded'` + `waitForFunction` verificando elementos DOM:

```typescript
await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => {
  const body = document.body;
  return body && (
    body.querySelectorAll('nav, aside, h1, h2, table, [data-testid]').length > 0 ||
    body.innerText.trim().length > 10
  );
}, { timeout: 20000 }).catch(() => {});
```

### ServiceGuard e acesso bloqueado

`ServiceGuard` nao redireciona -- renderiza spinner ou modal no mesmo URL. Detectar pela URL nao funciona.

**Solucao:** `Promise.race` entre o form aparecer ou o estado bloqueado:

```typescript
const result = await Promise.race([
  page.locator('input[type="file"]').waitFor({ state: 'attached', timeout: 15000 })
    .then(() => 'accessible' as const),
  page.locator('text=/upgrade|assinar|plano|limite/i').first().waitFor({ timeout: 15000 })
    .then(() => 'blocked' as const),
  new Promise<'timeout'>(resolve => setTimeout(() => resolve('timeout'), 15000)),
]);
if (result !== 'accessible') {
  test.skip(true, 'ServiceGuard blocked');
  return;
}
```

---

## Como Adicionar um Teste

### Adicionar ao Painel Admin

**1. Definir o teste em `src/data/e2e-test-definitions.ts`:**

```typescript
// Dentro da suite desejada (ou criar nova suite)
{
  code: 'TC-X.Y',
  name: 'Nome descritivo do teste',
  objective: 'O que este teste verifica',
  expectedResult: 'Resultado esperado se tudo funcionar',
  relatedUrl: '/rota-relevante',
  testType: 'positive', // ou 'negative' ou 'security'
  successCondition: 'Descricao da condicao de sucesso',
  steps: [
    'Passo 1',
    'Passo 2',
    'Passo 3'
  ]
}
```

**2. Se a rota for nova, adicionar ao mapa `VALID_ROUTES` em `src/hooks/useE2ETests.ts`:**

```typescript
const VALID_ROUTES = {
  // ... rotas existentes
  '/nova-rota': { exists: true, requiresAuth: true, allowedRoles: ['admin'] },
};
```

**3. Testar:** Rodar os testes no painel admin e verificar se o novo teste aparece e passa.

### Adicionar ao Playwright

**1. Para nova rota no smoke test, editar `e2e/helpers.ts`:**

```typescript
export const ADMIN_ROUTES = [
  // ... rotas existentes
  { path: '/admin/nova-pagina', name: 'Nova Pagina' },
];
```

Os smoke tests iteram sobre essa lista automaticamente.

**2. Para novo fluxo, criar arquivo de spec:**

```typescript
// e2e/admin.minha-feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Minha Feature', () => {
  test.setTimeout(30_000);

  test('fluxo principal funciona', async ({ page }) => {
    await page.goto('/admin/minha-feature', { waitUntil: 'domcontentloaded' });

    // Aguardar conteudo carregar
    await page.waitForFunction(() =>
      document.body.querySelectorAll('h1, h2, table').length > 0,
      { timeout: 15000 }
    ).catch(() => {});

    // Assertions
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

O arquivo sera automaticamente incluido no projeto `admin` (padrao `admin.*.ts`).

### Adicionar teste E2E manual documentado

Para features complexas (como Booking System ou Content Studio), crie um documento dedicado:

1. Criar `docs/XX Feature/E2E_TESTS.md`
2. Seguir o padrao: Pre-requisitos > Glossario > Cenarios com tabela (Passo/Resultado) > Checklist > Queries SQL de verificacao

---

## Health Checks

### Edge Function `health-check`

- **Endpoint:** `POST /functions/v1/health-check`
- **Auth:** Anon key (nao requer user token)
- **Retorna:** JSON com status `healthy`, `degraded`, ou `down` + 10 checks individuais

### Checks executados

| Check | O que verifica |
|-------|---------------|
| Database | Conectividade com PostgreSQL |
| Auth | Sistema de autenticacao Supabase |
| API Configs | Tabela `api_configs` acessivel |
| OpenAI / Anthropic | Chaves de API validas |
| Resend Email | API de email operacional |
| Ticto Webhook | Configuracao de webhook valida |
| Community | Tabela de posts acessivel |
| Subscriptions | Assinaturas + anomalias de dunning |
| Orders | Tabela de pedidos operacional |
| Unknown Events | Eventos Ticto nao mapeados nos ultimos 7 dias |

### Painel admin de saude

- **URL:** `/admin/saude-sistema`
- **Funcionalidades:**
  - Banner de status geral (verde/amarelo/vermelho)
  - Cards de integracao com botao "Testar" individual
  - Metricas de emails (enviados, falhas, por template)
  - Metricas de webhooks (processados, falhas)
  - Detalhamento de cada check

### Cron: Insights semanais

| Job | Schedule | O que faz |
|-----|----------|-----------|
| `generate-content-insights-weekly` | `0 8 * * 1` (Seg 8h UTC) | Gera insights automaticos para Content Studio |
| `send-booking-reminder-24h` | `*/15 * * * *` | Envia lembrete 24h antes da sessao |
| `send-booking-reminder-1h` | `*/15 * * * *` | Envia lembrete 1h antes da sessao |
| `send-session-reminder-24h` | `*/30 * * * *` | Notificacao de sessao em grupo 24h |
| `send-session-reminder-1h` | `*/15 * * * *` | Notificacao de sessao em grupo 1h |
| `send-prime-jobs-digest` | `0 12 * * 1` (Seg 12h UTC) | Digest de vagas Prime Jobs |

Para verificar cron jobs ativos:
```sql
SELECT jobid, jobname, schedule, command, active
FROM cron.job
ORDER BY jobname;
```

---

## Dados de Teste

### Usuarios de teste

Os testes requerem usuarios pre-cadastrados no Supabase com roles especificos:

| Role | Uso | Credenciais |
|------|-----|-------------|
| `admin` | Testes admin + E2E | Definido em `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` |
| `student` | Testes de aluno | Definido em `E2E_STUDENT_EMAIL` / `E2E_STUDENT_PASSWORD` |
| `mentor` | Testes manuais de mentor | Configurar no banco |

**Recomendacao:** Usar contas dedicadas para testes, nunca contas de producao reais.

### Dados minimos no banco

| Entidade | Requisito |
|----------|-----------|
| `plans` | 3 planos ativos (basic, pro, vip) com features configuradas |
| `hub_services` | Ao menos 1 servico de cada tipo (consulting, live_mentoring, recorded_course) |
| `mentor_services` | Mentor com servico ativo e `default_meeting_link` preenchido |
| `mentor_availability` | Ao menos 2 dias da semana com horarios futuros |
| `booking_policies` | Politica global (service_id IS NULL) |
| `email_templates` | Templates habilitados para booking, subscription, welcome |
| `api_configs` | API keys ativas (OpenAI ou Anthropic, Resend) |

### Fixtures do Playwright

| Arquivo | Uso |
|---------|-----|
| `e2e/fixtures/test-resume.pdf` | PDF de curriculo para teste de upload |
| `e2e/fixtures/mock-resume-result.json` | Resposta mock da IA (score 78) para testes sem custo |

---

## CI/CD

### GitHub Actions -- Execucao diaria

O workflow `.github/workflows/e2e-daily.yml` executa automaticamente todos os dias as **10:00 UTC (7:00 BRT)**.

### Secrets necessarios no repositorio

Configure em **GitHub > Settings > Secrets and variables > Actions**:

| Secret | Descricao |
|--------|-----------|
| `E2E_ADMIN_EMAIL` | Email do admin de teste |
| `E2E_ADMIN_PASSWORD` | Senha do admin de teste |
| `E2E_STUDENT_EMAIL` | Email do student de teste |
| `E2E_STUDENT_PASSWORD` | Senha do student de teste |
| `SUPABASE_URL` | `https://seqgnxynrcylxsdzbloa.supabase.co` |
| `SUPABASE_ANON_KEY` | Chave anon publica |
| `SUPABASE_PROJECT_ID` | `seqgnxynrcylxsdzbloa` |
| `N8N_WEBHOOK_URL` | URL do webhook N8N para notificacao |

### Artefatos gerados

Apos cada execucao, GitHub armazena por 7 dias:
- `playwright-report/` -- HTML report navegavel com screenshots e videos das falhas
- `test-results/` -- Assets de falha (capturas de tela, traces, videos)

Para baixar: **GitHub > Actions > selecionar run > Artifacts.**

### Execucao manual

No GitHub: **Actions > E2E Tests (Daily) > Run workflow.**

### Notificacoes via N8N

```
GitHub Actions
  > node e2e/notify-webhook.mjs
    > POST https://n8n.sapunplugged.com/webhook/e2e-results
      > N8N Workflow
        > (sucesso) Telegram: "54/54 passed"
        > (falha)   Telegram: "3 falharam: ..."
        > (ambos)   Email com detalhes (se configurado)
```

### Configuracao Playwright

| Parametro | Local | CI |
|-----------|-------|-----|
| `workers` | 3 (paralelo) | 1 (sequencial) |
| `retries` | 1 | 1 |
| `timeout` | 30s | 30s |
| Reporter | HTML + list | JSON + HTML + list |
| `webServer` | Auto-inicia porta 8080 | Auto-inicia porta 8080 |

---

## Troubleshooting

### Painel Admin

#### Testes nao rodam / botao nao funciona
- Verificar se esta logado como admin
- Verificar console do browser para erros
- Verificar se as tabelas `e2e_test_runs` e `e2e_test_results` existem

#### Todos os testes passam mas funcionalidade esta quebrada
- Os testes do painel admin sao deterministicos (baseados no mapa de rotas). Eles verificam se rotas existem, nao se o conteudo esta correto. Para validacao de conteudo, use Playwright ou testes manuais.

#### Prompt de correcao nao e gerado
- O prompt so e gerado se houver testes que falharam. Se todos passaram, o prompt mostra "Todos os testes passaram."

### Playwright

#### `Error: Auth failed for admin@...: Invalid login credentials`
- Credenciais erradas em `e2e/.env.e2e` ou usuario nao existe no Supabase.

#### `Error: locator.waitFor: Timeout 15000ms exceeded`
- Componente nao renderizou. Causas comuns:
  - RLS bloqueando: usuario de teste sem permissao
  - Edge Function com erro: verificar logs do Supabase
  - Nova rota nao adicionada ao router do React

#### `ServiceGuard blocked` em todos os testes de feature
- Usuario de teste nao tem assinatura ativa com a feature necessaria.
- Verificar: `user_subscriptions` (status ativo?) e `plans.features` (feature habilitada no plano?)

#### Testes lentos (> 5 min)
- Reduzir workers: `workers: process.env.CI ? 1 : 2` em `playwright.config.ts`

#### HTML Report em branco
```bash
npm run test:e2e:report
# ou: npx playwright show-report
```

#### Dados de teste ficaram stale (teste falha por dados antigos)
- Re-executar seeds de dados de teste via SQL
- Verificar se bookings de teste nao expiraram
- Limpar `e2e/.auth/` e re-rodar `auth.setup.ts`

### Health Check

#### `{ code: 401, message: "Invalid JWT" }` no health-check
- A chamada esta usando user token em vez de anon key. O health-check deve usar `VITE_SUPABASE_PUBLISHABLE_KEY`.

#### Metricas de email zeradas
- Edge Functions de email podem nao estar deployadas com a versao que inclui `logEmail()`.
- Redeploy: `npx supabase functions deploy send-welcome-email send-booking-confirmation send-booking-reminder send-booking-rescheduled send-booking-cancelled send-subscription-email`

#### `permission denied` na tabela `email_logs`
- Executar:
  ```sql
  GRANT ALL ON public.email_logs TO authenticated;
  GRANT ALL ON public.email_logs TO service_role;
  ```

---

## Referencias

### Documentacao tecnica de testes por feature

| Feature | Documento | Conteudo |
|---------|-----------|---------|
| E2E Developer (Playwright) | `docs/05 E2E Test/E2E_DEVELOPER.md` | Setup, estrutura, CI/CD, N8N |
| Booking System E2E | `docs/15 Booking System/E2E_TESTS.md` | 55+ casos de teste detalhados |
| Content Studio E2E | `docs/20 Content Studio/E2E_TESTS.md` | 30+ casos de teste detalhados |
| Meu Hub E2E | `docs/18 Meu Hub/E2E-TESTE.md` | 13 cenarios com SQL |
| Onboarding E2E | `docs/19 Career Assessment Onboarding/E2E_TESTS.md` | 15 casos com bridge automatico |
| Lives System E2E | `docs/21 Lives System/E2E-TESTE.md` | Cenarios de lives e sessoes |

### Arquivos-chave no codigo

| Arquivo | Descricao |
|---------|-----------|
| `src/data/e2e-test-definitions.ts` | Definicoes das 7 suites (35 testes) |
| `src/hooks/useE2ETests.ts` | Hook de execucao + queries + prompt |
| `src/types/e2e.ts` | Tipos TypeScript |
| `src/pages/admin/AdminE2ETests.tsx` | Pagina admin do painel |
| `e2e/helpers.ts` | Listas de rotas e auth helpers (Playwright) |
| `e2e/auth.setup.ts` | Setup de autenticacao (Playwright) |
| `e2e/notify-webhook.mjs` | Notificacao N8N (Playwright) |
| `playwright.config.ts` | Configuracao Playwright |
| `.github/workflows/e2e-daily.yml` | Workflow GitHub Actions |

### Painel admin de saude

| URL | O que mostra |
|-----|-------------|
| `/admin/testes-e2e` | Executar testes, ver resultados, prompt de correcao |
| `/admin/saude-sistema` | Health checks, status de APIs, emails, webhooks |
