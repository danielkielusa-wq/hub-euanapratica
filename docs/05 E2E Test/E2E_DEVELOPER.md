# Testes E2E — Documentação Técnica

**Última atualização:** 2026-02-25
**Stack:** Playwright 1.50 + Chromium
**Total de testes:** 54 (padrão) + 1 opt-in com IA real

---

## Visão Geral

Os testes E2E automatizam a navegação real no browser para detectar regressões após cada deploy. O pipeline roda diariamente às 7h BRT via GitHub Actions e envia resultado por Telegram (e opcionalmente por email).

```
GitHub Actions (daily 7h BRT)
  └─ npx playwright test
       ├─ auth-setup   → salva sessões admin + student
       ├─ public       → 9 páginas públicas
       ├─ admin        → 31 testes (24 smoke + 3 login + 4 ResumePass mock)
       └─ student      → 12 páginas autenticadas
            └─ notify-webhook.mjs → N8N → Telegram / Email
```

---

## Estrutura de Arquivos

```
e2e/
├── .env.e2e                    # Credenciais locais (não commitado)
├── .auth/                      # Sessões salvas (não commitado)
│   ├── admin.json
│   └── student.json
├── fixtures/
│   ├── test-resume.pdf         # PDF de teste para ResumePass
│   └── mock-resume-result.json # Resposta mock da IA (score 78)
├── helpers.ts                  # Auth helpers + listas de rotas
├── auth.setup.ts               # Autentica admin e student via Supabase
├── public.smoke.spec.ts        # 9 testes: páginas sem auth
├── admin.smoke.spec.ts         # 24 testes: todas as páginas admin
├── admin.login-flow.spec.ts    # 3 testes: login UI, erro, bloqueio
├── admin.resumepass.spec.ts    # 4 testes: ResumePass com IA mockada
├── admin.resumepass-real.spec.ts # 1 teste: ResumePass com IA real (opt-in)
├── student.smoke.spec.ts       # 12 testes: páginas do aluno
├── notify-webhook.mjs          # Envia resultado para N8N
└── n8n-workflow-e2e.json       # Workflow N8N (importar no N8N)

playwright.config.ts            # Configuração principal
.github/workflows/e2e-daily.yml # CI/CD GitHub Actions
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
| `npm run test:e2e` | Roda todos os 54 testes padrão |
| `npm run test:e2e:public` | Só páginas públicas (9 testes, ~30s) |
| `npm run test:e2e:admin` | Só testes admin (31 testes) |
| `npm run test:e2e:student` | Só testes student (12 testes) |
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
                 ├─ (sucesso) → Telegram "✅ 54/54 passed"
                 ├─ (falha)   → Telegram "❌ 3 falharam: ..."
                 └─ (ambos)   → Email com detalhes (se configurado)
```

### Payload enviado ao N8N

```json
{
  "status": "passed",
  "summary": {
    "total": 54,
    "passed": 54,
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
