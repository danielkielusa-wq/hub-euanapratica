# Testes E2E — Documentação Técnica

**Última atualização:** 2026-02-26
**Stack:** Playwright 1.50 + Chromium
**Total de testes:** 76 (padrão) + 1 opt-in com IA real

---

## Visão Geral

Os testes E2E automatizam a navegação real no browser para detectar regressões após cada deploy. O pipeline roda diariamente às 7h BRT via GitHub Actions e envia resultado por Telegram (e opcionalmente por email).

```
GitHub Actions (daily 7h BRT)
  └─ npx playwright test
       ├─ auth-setup   → salva sessões admin + student
       ├─ public       → 9 testes: páginas públicas
       ├─ admin        → 39 testes (26 smoke + 3 login + 4 ResumePass mock + 6 Agendamentos)
       └─ student      → 26 testes (12 smoke + 7 BookingFlow + 7 StudentBookings)
            └─ notify-webhook.mjs → N8N → Telegram / Email
```

---

## Estrutura de Arquivos

```
e2e/
├── .env.e2e                      # Credenciais locais (não commitado)
├── .auth/                        # Sessões salvas (não commitado)
│   ├── admin.json
│   └── student.json
├── fixtures/
│   ├── test-resume.pdf           # PDF de teste para ResumePass
│   ├── mock-resume-result.json   # Resposta mock da IA (score 78)
│   └── mock-booking-data.ts      # Fixtures de mock para testes de booking
├── helpers.ts                    # Auth helpers + listas de rotas + booking helpers
├── auth.setup.ts                 # Autentica admin e student via Supabase
├── public.smoke.spec.ts          # 9 testes: páginas sem auth
├── admin.smoke.spec.ts           # 26 testes: todas as páginas admin
├── admin.login-flow.spec.ts      # 3 testes: login UI, erro, bloqueio
├── admin.resumepass.spec.ts      # 4 testes: ResumePass com IA mockada
├── admin.resumepass-real.spec.ts # 1 teste: ResumePass com IA real (opt-in)
├── admin.agendamentos.spec.ts    # 6 testes: AdminAgendamentos + mentor smoke
├── student.smoke.spec.ts         # 12 testes: páginas do aluno
├── student.booking-flow.spec.ts  # 7 testes: fluxo de agendamento (BookingFlow)
├── student.bookings.spec.ts      # 7 testes: página de agendamentos do aluno
├── notify-webhook.mjs            # Envia resultado para N8N
└── n8n-workflow-e2e.json         # Workflow N8N (importar no N8N)

playwright.config.ts              # Configuração principal
.github/workflows/e2e-daily.yml  # CI/CD GitHub Actions
```

---

## Setup Local

### 1. Pré-requisitos

```bash
# Instalar dependências (já deve estar instalado)
npm install

# Instalar Chromium do Playwright
npx playwright install chromium
```

### 2. Credenciais

Crie `e2e/.env.e2e` com usuários de teste reais:

```env
E2E_ADMIN_EMAIL=admin@exemplo.com
E2E_ADMIN_PASSWORD=senha-admin

E2E_STUDENT_EMAIL=aluno@exemplo.com
E2E_STUDENT_PASSWORD=senha-aluno

SUPABASE_URL=https://seqgnxynrcylxsdzbloa.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

> O admin deve ter role `admin`. O student deve ter role `student`.
> Prefira usar contas dedicadas para testes (não contas de produção reais).

### 3. Servidor de desenvolvimento

O Playwright inicia o servidor automaticamente. Mas se já estiver rodando:

```bash
npm run dev  # porta 8080
```

---

## Comandos

| Comando | O que faz |
|---------|-----------|
| `npm run test:e2e` | Roda todos os 76 testes padrão |
| `npm run test:e2e:public` | Só páginas públicas (9 testes, ~30s) |
| `npm run test:e2e:admin` | Só testes admin (39 testes) |
| `npm run test:e2e:student` | Só testes student (26 testes) |
| `npm run test:e2e:booking` | Só BookingFlow + StudentBookings (14 testes) |
| `npm run test:e2e:admin-booking` | Só AdminAgendamentos + mentor smoke (6 testes) |
| `npm run test:e2e:real` | ResumePass com IA real — **consome créditos** |
| `npm run test:e2e:report` | Abre HTML report no browser |
| `npm run test:e2e:ui` | Abre Playwright UI (modo visual/debug) |

---

## Projetos Playwright

Cada "project" no `playwright.config.ts` representa um grupo de testes com configuração própria:

| Projeto | Dependência | Auth | Padrão de arquivos |
|---------|-------------|------|--------------------|
| `auth-setup` | — | Nenhuma | `auth.setup.ts` |
| `public` | — | Nenhuma | `public.*.ts` |
| `admin` | auth-setup | `admin.json` | `admin.*.ts` (exceto `-real`) |
| `student` | auth-setup | `student.json` | `student.*.ts` |
| `admin-real` | auth-setup | `admin.json` | `admin.*-real.spec.ts` |

O projeto `admin-real` está excluído do `npm run test:e2e` padrão. Use `npm run test:e2e:real` apenas quando quiser testar o fluxo real de IA.

---

## Autenticação nos Testes

Os testes autenticados não passam pelo formulário de login a cada suite. Em vez disso:

1. **`auth.setup.ts`** chama `supabase.auth.signInWithPassword()` diretamente via API
2. Salva o JWT + refresh token no localStorage do browser (chave `sb-seqgnxynrcylxsdzbloa-auth-token`)
3. Os projetos `admin` e `student` carregam esse estado salvo (`storageState`)

Isso é ~10x mais rápido do que logar pela UI a cada teste.

---

## Estratégias de Espera (SPA + Supabase)

### Problema: `networkidle` nunca dispara

Supabase mantém conexões de WebSocket (realtime) abertas permanentemente. Usar `waitUntil: 'networkidle'` causaria timeout em todos os testes.

**Solução:** `waitUntil: 'domcontentloaded'` + `waitForFunction` verificando elementos DOM:

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

### Problema: ServiceGuard bloqueia ao mesmo URL

`ServiceGuard` não redireciona — renderiza spinner ou modal de upgrade no mesmo URL. Detectar pela URL não funciona.

**Solução:** `Promise.race` entre o form aparecer ou o estado bloqueado aparecer:

```typescript
const result = await Promise.race([
  page.locator('input[type="file"]').waitFor({ state: 'attached', timeout: 15000 })
    .then(() => 'accessible' as const),
  page.locator('text=/upgrade|assinar|plano|limite/i').first().waitFor({ timeout: 15000 })
    .then(() => 'blocked' as const),
  new Promise<'timeout'>(resolve => setTimeout(() => resolve('timeout'), 15000)),
]);

if (result !== 'accessible') {
  test.skip(true, 'ServiceGuard blocked — usuário não tem acesso');
  return;
}
```

---

## Testes de ResumePass

### Mock (padrão — sem custo de IA)

Os 4 testes em `admin.resumepass.spec.ts` interceptam as chamadas para a Edge Function e Storage usando `page.route()`:

```typescript
await page.route('**/functions/v1/analyze-resume', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(MOCK_RESULT),  // fixtures/mock-resume-result.json
  });
});
```

Isso testa todo o fluxo UI (upload → preencher → clicar → ver resultado) sem gastar tokens de IA.

### Real (opt-in)

`admin.resumepass-real.spec.ts` chama a Edge Function de verdade. Use apenas para:
- Validar que a integração IA → frontend ainda funciona após mudanças no Edge Function
- Testes manuais de homologação

```bash
npm run test:e2e:real
```

> **Custo:** ~$0.05 por execução (análise de currículo com LLM). Consome 1 crédito mensal do usuário de teste.

---

## CI/CD — GitHub Actions

O workflow `.github/workflows/e2e-daily.yml` executa automaticamente todo dia às **10:00 UTC (7:00 BRT)**.

### Secrets necessários no repositório

Configure em **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Descrição |
|--------|-----------|
| `E2E_ADMIN_EMAIL` | Email do usuário admin de teste |
| `E2E_ADMIN_PASSWORD` | Senha do admin de teste |
| `E2E_STUDENT_EMAIL` | Email do usuário student de teste |
| `E2E_STUDENT_PASSWORD` | Senha do student de teste |
| `SUPABASE_URL` | `https://seqgnxynrcylxsdzbloa.supabase.co` |
| `SUPABASE_ANON_KEY` | Chave anon pública do Supabase |
| `SUPABASE_PROJECT_ID` | `seqgnxynrcylxsdzbloa` |
| `N8N_WEBHOOK_URL` | URL do webhook N8N (ex: `https://n8n.sapunplugged.com/webhook/e2e-results`) |

### Artefatos gerados

Após cada execução o GitHub armazena por 7 dias:
- `playwright-report/` → HTML report navegável com screenshots e vídeos das falhas
- `test-results/` → Assets de falha (capturas de tela, traces, vídeos)

Para baixar: GitHub → Actions → selecionar run → Artifacts.

### Execução manual

No GitHub: Actions → **E2E Tests (Daily)** → **Run workflow**.

---

## Notificações via N8N

### Arquitetura

```
GitHub Actions
  └─ node e2e/notify-webhook.mjs
       └─ POST https://n8n.sapunplugged.com/webhook/e2e-results
            └─ N8N Workflow
                 ├─ (sucesso) → Telegram "✅ N/N passed"
                 ├─ (falha)   → Telegram "❌ 3 falharam: ..."
                 └─ (ambos)   → Email com detalhes (se configurado)
```

### Payload enviado ao N8N

```json
{
  "status": "passed",
  "summary": {
    "total": 76,
    "passed": 76,
    "failed": 0,
    "skipped": 0,
    "duration_seconds": 144
  },
  "failures": [],
  "metadata": {
    "timestamp": "2026-02-25T10:15:30.000Z",
    "commit": "abc1234",
    "branch": "main",
    "run_url": "https://github.com/org/repo/actions/runs/123"
  }
}
```

### Workflow N8N

O arquivo `e2e/n8n-workflow-e2e.json` contém o workflow pronto para importar.

No N8N:
1. **New Workflow → Import from file** → selecionar `n8n-workflow-e2e.json`
2. Configurar o nó de **Email** com suas credenciais SMTP (ou deletar se não usar email)
3. Configurar o nó de **Telegram** com seu bot token e chat ID
4. Ativar o workflow

> **Importante:** Todas as expressões do N8N usam `$json.body.*` (não `$json.*`) porque o N8N envolve o body do POST em `$json.body`.

---

## Testes de Booking (Mocked)

Os 20 testes de booking usam `page.route()` para interceptar todas as chamadas ao Supabase, sem dependência de dados reais. Isso é necessário porque os agendamentos têm datas dinâmicas que quebrariam testes hard-coded.

### Cobertura (20 testes)

| Spec File | Test Cases | Descrição |
|-----------|-----------|-----------|
| `student.booking-flow.spec.ts` | TC-1.1, TC-1.3, TC-1.4, TC-1.4b, TC-1.5, TC-1.6, TC-1.8 | Fluxo completo: acesso → slot → confirmação → sucesso |
| `student.bookings.spec.ts` | TC-2.1-2.4, TC-3.1, TC-4.1-4.2 | Página de agendamentos: estrutura, modais cancel/reschedule |
| `admin.agendamentos.spec.ts` | TC-8.1, TC-8.3, TC-8.5 + 3 mentor smoke | AdminAgendamentos: tabela, dropdown de ações, aba Políticas |

### Fixtures e helpers

```
e2e/fixtures/mock-booking-data.ts   # Dados estáticos de mock
e2e/helpers.ts                      # generateMockSlots() + buildFutureBooking()
```

**Dados exportados de `mock-booking-data.ts`:**

| Export | Tipo | Uso |
|--------|------|-----|
| `MOCK_SERVICE_ID` | UUID | ID fixo do serviço "Sessão de Mentoria" |
| `MOCK_MENTOR_ID` | UUID | ID fixo da mentora "Ana Mentora" |
| `MOCK_STUDENT_ID` | UUID | ID fixo do aluno "Carlos Aluno" |
| `mockMentorService` | Object | Resposta de `mentor_services` com joins embutidos (`service`, `mentor`) |
| `mockBookingPolicy` | Object | Política global (min_notice=48h, cancellation_window=24h) |
| `mockBookingStats` | Object | Stats do aluno: `remaining_slots=2`, `upcoming=1` |
| `mockBookingStatsLimitReached` | Object | Stats com `remaining_slots=0` para testar gate de limite |
| `mockUpcomingBookingTemplate` | Object | Template de booking sem datas (preencher com `buildFutureBooking`) |
| `mockPastBooking` | Object | Booking `status=completed` com data no passado |

### Datas dinâmicas

Os slots e bookings usam datas relativas a `Date.now()` para nunca ficarem desatualizados:

```typescript
// e2e/helpers.ts

// Gera 2 slots 3 dias no futuro (14:00 e 16:00 UTC) — passa validação de 48h
generateMockSlots(mentorId: string)

// Cria booking N horas no futuro (default 72h)
// hoursFromNow=12 → dentro da janela de 24h → dispara aviso de cancelamento tardio
buildFutureBooking(template, hoursFromNow = 72)
```

### Padrão de mock para PostgREST

Algumas queries usam `.single()` e esperam um **objeto** (não array):

```typescript
// useMentorForService usa .single() → retornar objeto, não array
await page.route('**/rest/v1/mentor_services*', async (route) => {
  await route.fulfill({
    body: JSON.stringify(mockMentorService),  // ← objeto, não [mockMentorService]
  });
});

// useAdminBookings faz 3 fetches sequenciais — todos devem ser mockados
await page.route('**/rest/v1/bookings*', ...);    // → [adminBooking]
await page.route('**/rest/v1/profiles*', ...);    // → [studentProfile, mentorProfile]
await page.route('**/rest/v1/hub_services*', ...); // → [hubService]
```

---

## Adicionando Novos Testes

### Adicionar nova rota ao smoke test

Para adicionar uma nova página admin, edite `e2e/helpers.ts`:

```typescript
export const ADMIN_ROUTES = [
  // ... rotas existentes
  { path: '/admin/nova-pagina', name: 'Nova Página' },  // ← adicionar aqui
];
```

Os smoke tests iteram sobre essa lista automaticamente — não precisa escrever nada em `admin.smoke.spec.ts`.

### Criar testes de fluxo novo

```typescript
// e2e/admin.minha-feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Minha Feature', () => {
  test.setTimeout(30_000);

  test('fluxo principal funciona', async ({ page }) => {
    await page.goto('/admin/minha-feature', { waitUntil: 'domcontentloaded' });

    // aguardar conteúdo carregar
    await page.waitForFunction(() =>
      document.body.querySelectorAll('h1, h2, table').length > 0,
      { timeout: 15000 }
    ).catch(() => {});

    // suas assertions
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

O arquivo será automaticamente incluído no projeto `admin` (padrão `admin.*.ts`).

### Criar testes com mocks (para features com Supabase)

Para páginas que fazem queries ao Supabase, use `page.route()`:

```typescript
// e2e/student.minha-feature.spec.ts
import { test, expect } from '@playwright/test';

async function setupMocks(page) {
  await page.route('**/rest/v1/minha_tabela*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: '...', name: 'Test' }]),
      });
    } else {
      await route.continue();
    }
  });

  // Edge Functions — sempre 200
  await page.route('**/functions/v1/minha-funcao*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

test.describe('Minha Feature', () => {
  test.setTimeout(45_000);

  test('fluxo principal funciona', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/dashboard/minha-feature', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
  });
});
```

> **Datas:** Se a feature usa datas dinâmicas, importe e use `buildFutureBooking()` de `helpers.ts` para não quebrar com o tempo.

---

## Configuração (playwright.config.ts)

| Parâmetro | Local | CI |
|-----------|-------|-----|
| `workers` | 3 (paralelo controlado) | 1 (sequencial) |
| `retries` | 1 (captura hiccups de rede) | 1 |
| `timeout` padrão | 30s | 30s |
| Reporter | HTML + list | JSON + HTML + list |
| `webServer` | Auto-inicia na porta 8080 | Auto-inicia na porta 8080 |

O reporter JSON (`e2e-results.json`) só é gerado no CI e é consumido pelo `notify-webhook.mjs`.

---

## Troubleshooting

### `Error: Auth failed for admin@...: Invalid login credentials`

O arquivo `e2e/.env.e2e` tem credenciais erradas ou o usuário não existe no Supabase.

### `Error: locator.waitFor: Timeout 15000ms exceeded`

O componente não renderizou. Causas comuns:
- **RLS bloqueando** → o usuário de teste não tem permissão para acessar os dados
- **Edge Function com erro** → verificar logs do Supabase
- **Nova rota não adicionada** ao router do React

### `ServiceGuard blocked` em todos os testes de feature

O usuário de teste não tem assinatura ativa com a feature necessária. Verificar no Supabase:
- `user_subscriptions` → status ativo?
- `plans.features` → a feature está habilitada no plano?

### Testes lentos (>5 min)

Reduzir ainda mais os workers se o servidor estiver sobrecarregado:
```typescript
// playwright.config.ts
workers: process.env.CI ? 1 : 2,
```

### HTML Report em branco

```bash
npm run test:e2e:report
# ou diretamente:
npx playwright show-report
```

O report é gerado em `playwright-report/index.html`.
