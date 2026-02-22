# Saúde do Sistema — Guia para Developer

## Visão Geral

O painel `/admin/saude-sistema` agrega dados de 4 fontes existentes em uma única tela:

1. **Edge Function `health-check`** — 10 checks paralelos (DB, Auth, APIs, Ticto, community, etc.)
2. **Edge Function `test-api-connection`** — testa conectividade com cada API configurada
3. **Tabela `email_logs`** — criada neste feature, populada pelo `sendTemplatedEmail`
4. **Tabela `payment_logs`** — já existia, reusada para métricas de webhook

Nenhuma nova Edge Function foi criada. Todo o backend foi reaproveitado.

---

## Arquivos Criados / Modificados

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/20260221200000_create_email_logs.sql` | **CRIADO** | Tabela de log de emails |
| `supabase/functions/_shared/emailTemplateService.ts` | **MODIFICADO** | `logEmail()` adicionado |
| `src/hooks/useSystemHealth.ts` | **CRIADO** | Hook de dados do painel |
| `src/pages/admin/AdminSystemHealth.tsx` | **CRIADO** | Página do painel |
| `src/App.tsx` | **MODIFICADO** | Rota `/admin/saude-sistema` |
| `src/components/layouts/SidebarNav.tsx` | **MODIFICADO** | Item de nav "Saúde do Sistema" |

---

## Banco de Dados

### Tabela `email_logs`

```sql
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,       -- ex: 'booking_confirmation'
  recipient TEXT NOT NULL,           -- email do destinatário
  subject TEXT,                      -- assunto após substituição de variáveis
  status TEXT NOT NULL               -- 'sent' | 'failed' | 'skipped'
    CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message TEXT,                -- mensagem de erro (se failed/skipped)
  resend_id TEXT,                    -- ID retornado pela API do Resend
  edge_function TEXT,                -- qual função disparou (não usado ainda)
  metadata JSONB DEFAULT '{}',       -- contexto extra (não usado ainda)
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Índices**: `status`, `template_name`, `created_at DESC`

**RLS**:
- Admin lê via `has_role(auth.uid(), 'admin')`
- Insert aberto para `service_role` (Edge Functions com `SUPABASE_SERVICE_ROLE_KEY`)
- `GRANT ALL ON public.email_logs TO authenticated` — obrigatório para RLS funcionar

**Quem insere**: `sendTemplatedEmail()` em `_shared/emailTemplateService.ts` — toda falha, skip ou sucesso gera um registro.

---

## Hook `useSystemHealth`

**Caminho**: [src/hooks/useSystemHealth.ts](../../src/hooks/useSystemHealth.ts)

Quatro `useQuery` independentes rodando em paralelo:

```
healthQuery    → POST /functions/v1/health-check   (manual, enabled: false)
apisQuery      → supabase.from('api_configs')       (automático)
emailQuery     → supabase.from('email_logs')         (automático)
webhookQuery   → supabase.from('payment_logs')       (automático)
```

Mais um `useState` para o resultado dos testes de API (`testApiConnection`).

### Gotchas Importantes

#### 1. `supabase.functions.invoke` não funciona para health-check e test-api-connection

O `invoke` do Supabase JS trata qualquer resposta HTTP não-2xx como erro e descarta o body. O `health-check` retorna `207 Degraded` e `503 Down` intencionalmente, com JSON no body. Usar `invoke` faz o body sumir.

**Solução**: raw `fetch()` direto à URL da Edge Function.

```typescript
const res = await fetch(`${supabaseUrl}/functions/v1/health-check`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${anonKey}`,
    'apikey': anonKey,
    'Content-Type': 'application/json',
  },
});
const body = await res.json().catch(() => null);
```

#### 2. `health-check` usa anon key, não user token

A Edge Function `health-check` não verifica identidade do usuário. Usar um JWT de usuário expirado causava `401 Invalid JWT` do Supabase gateway.

**Solução**: sempre usar `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key) para autenticar essa chamada.

#### 3. `test-api-connection` precisa de token fresco

Esta Edge Function verifica se o usuário tem role `admin`. Usar `getSession()` pode retornar um token expirado (ainda truthy). Usar `refreshSession()` força renovação.

```typescript
const { data: { session } } = await supabase.auth.refreshSession();
const token = session?.access_token;
```

#### 4. Validar o shape do response antes de renderizar

Nunca confiar que o response é o tipo esperado. O `HealthBanner` crashava com "Cannot read properties of undefined (reading 'icon')" porque `report.status` era `undefined` (veio um JSON de erro `{ code: 401, message: "..." }` em vez do HealthReport).

**Solução dupla**:
- No hook: verificar `body.checks` antes de aceitar como HealthReport
- No componente: `statusConfig[report.status] ?? statusConfig.degraded` como fallback

---

## Componente `AdminSystemHealth`

**Caminho**: [src/pages/admin/AdminSystemHealth.tsx](../../src/pages/admin/AdminSystemHealth.tsx)

### Estrutura

```
AdminSystemHealth (export default)
  └─ HealthErrorBoundary (class component, catches render errors)
       └─ AdminSystemHealthContent
            ├─ HealthBanner            (Section 1: status geral)
            ├─ IntegrationCard × N     (Section 2: integrações)
            ├─ MetricCard × 4          (Section 3: emails)
            │   └─ ChartContainer > BarChart (recharts)
            ├─ MetricCard × 3          (Section 4: webhooks)
            └─ HealthCheckRow × N      (Section 5: detalhes)
```

### ErrorBoundary

Classe React adicionada para capturar crashes de render. Sem ela, qualquer erro de renderização desmonta toda a árvore React e deixa a tela em branco. Com ela, aparece uma caixa vermelha com o stack trace.

Mantenha o ErrorBoundary enquanto o componente for novo/instável. Pode remover quando estiver estável.

### Ícones por API slug

```typescript
const API_ICONS: Record<string, React.ElementType> = {
  openai_api: Brain,
  anthropic_api: Sparkles,
  resend_email: Mail,
  ticto_webhook: CreditCard,
};
```

Slugs vêm da coluna `api_key` da tabela `api_configs`. Se adicionar uma nova API, adicione o ícone aqui.

---

## Como Adicionar um Novo Check ao Health-Check

Edite `supabase/functions/health-check/index.ts`:

```typescript
// 1. Crie a função de check
async function checkMinhaIntegracao() {
  const res = await fetch('https://api.minha-integracao.com/health');
  if (!res.ok) return { status: 'fail' as const, error: `HTTP ${res.status}` };
  return { status: 'pass' as const, details: { latency: '...' } };
}

// 2. Adicione ao Promise.all no handler principal
const checks = await Promise.all([
  ...existingChecks,
  runCheck("Minha Integração", checkMinhaIntegracao),
]);
```

Depois redeploy:
```bash
npx supabase functions deploy health-check
```

---

## Como Adicionar uma Nova API à Lista de Integrações

1. Insira na tabela `api_configs` via admin (`/admin/apis`) ou SQL
2. Adicione o ícone e a cor em `AdminSystemHealth.tsx`:

```typescript
const API_ICONS: Record<string, React.ElementType> = {
  minha_nova_api: MinhaIcon,
};
const API_COLORS: Record<string, string> = {
  minha_nova_api: 'text-blue-600 bg-blue-50',
};
```

3. O `test-api-connection` detecta o tipo pela `base_url`. Se for OpenAI/Anthropic/Resend, reutiliza o teste existente. Caso contrário, faz um teste genérico GET na base_url. Para teste customizado, adicione um `case` no `switch` de `routeTest()` em `supabase/functions/test-api-connection/index.ts`.

---

## Logging de Emails

Todo email enviado via `sendTemplatedEmail()` é registrado automaticamente em `email_logs`:

| Cenário | Status |
|---------|--------|
| Email enviado com sucesso | `sent` + `resend_id` |
| Erro na API do Resend | `failed` + `error_message` |
| Template não encontrado / desabilitado | `skipped` + `error_message` |
| API key do Resend não configurada | `skipped` + `error_message` |
| Qualquer exceção no catch | `failed` + `error_message` |

O logging é **best-effort** — nunca bloqueia o fluxo principal e tem seu próprio try/catch.

Para ver logs recentes:
```sql
SELECT template_name, recipient, status, error_message, created_at
FROM email_logs
ORDER BY created_at DESC
LIMIT 50;
```

---

## Deploy

Após qualquer mudança:

```bash
# 1. Migrations (se houver)
npx supabase db push --include-all

# 2. Regenerar tipos (se mudou schema)
npx supabase gen types typescript --project-id seqgnxynrcylxsdzbloa > src/integrations/supabase/types.ts

# 3. Build frontend
npm run build

# 4. Redeploy Edge Functions afetadas
npx supabase functions deploy health-check test-api-connection

# Para mudanças em emailTemplateService.ts:
npx supabase functions deploy send-welcome-email send-booking-confirmation send-booking-reminder send-booking-rescheduled send-booking-cancelled send-subscription-email send-espaco-invitation
```

---

## Troubleshooting

### "Invalid JWT" no health-check
→ A chamada está usando user token em vez de anon key. Verifique que o `healthQuery` usa `anonKey` no header `Authorization`.

### Tela em branco ao clicar "Testar"
→ Erro de render capturado pelo ErrorBoundary (ou não capturado se o boundary não estiver lá). Abra DevTools → Console para ver o stack. Verifique que `apiTests[api.api_key] ?? null` está sendo usado (não `apiTests[api.api_key]` sem fallback).

### Métricas de email todas zeradas
→ A tabela `email_logs` provavelmente está vazia. As Edge Functions de email precisam estar deployadas **com a versão atual** do `emailTemplateService.ts` (que inclui `logEmail()`). Redeploy das funções de email resolve.

### "permission denied" na tabela email_logs
→ Falta o `GRANT ALL ON public.email_logs TO authenticated`. O RLS bloqueia antes mesmo de avaliar as policies sem o grant. Execute:
```sql
GRANT ALL ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;
```

### Health check retorna `{ code: 401, message: "Invalid JWT" }` em vez do relatório
→ O token enviado é inválido ou expirado. Para health-check, sempre usar anon key. Para test-api-connection, usar `refreshSession()`.

---

## Variáveis de Ambiente Relevantes

| Variável | Uso |
|----------|-----|
| `VITE_SUPABASE_URL` | URL base do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key — usada para chamar health-check |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — usada pelas Edge Functions para inserir em email_logs |

---

**Versão**: 1.0
**Data**: 2026-02-21
