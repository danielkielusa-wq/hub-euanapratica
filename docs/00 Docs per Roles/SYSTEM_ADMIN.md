# EUA Na Pratica Hub -- Guia do Administrador de Sistema

> Infraestrutura, deploy, monitoramento e configuracao tecnica

**Versao**: 1.0
**Data**: 2026-02-26

---

## Sumario

1. [Stack Tecnico](#stack-tecnico)
2. [Ambientes](#ambientes)
3. [Deploy](#deploy)
4. [Edge Functions](#edge-functions)
5. [Configuracao de APIs](#configuracao-de-apis)
6. [Cron Jobs](#cron-jobs)
7. [N8N (VPS Hostinger)](#n8n-vps-hostinger)
8. [WhatsApp (Evolution API)](#whatsapp-evolution-api)
9. [Bunny.net (Video)](#bunnynet-video)
10. [Email (Resend)](#email-resend)
11. [Monitoramento](#monitoramento)
12. [Banco de Dados](#banco-de-dados)
13. [Backup e Recovery](#backup-e-recovery)
14. [Troubleshooting Comum](#troubleshooting-comum)
15. [Gotchas Conhecidos](#gotchas-conhecidos)
16. [Referencias](#referencias)

---

## Stack Tecnico

| Camada | Tecnologia | Detalhes |
|--------|-----------|----------|
| Frontend | React 18 + Vite + TypeScript | shadcn/ui, TanStack Query v5 |
| Backend | Supabase (PostgreSQL + Edge Functions + Auth) | Deno runtime para Edge Functions |
| Video | Bunny.net | Stream library, upload direto, webhook de transcoding |
| Email | Resend API | Templates HTML no banco, substituicao de variaveis |
| WhatsApp | Evolution API v2 | Docker em VPS Hostinger |
| Automacoes | N8N | Docker em VPS Hostinger (mesmo servidor Evolution) |
| Pagamentos | Ticto | Webhooks para subscriptions e produtos avulsos |
| LLM | OpenAI, Anthropic, OpenRouter | callLLM() com fallback automatico |

---

## Ambientes

### Producao

| Recurso | Valor |
|---------|-------|
| Supabase Project ID | `seqgnxynrcylxsdzbloa` |
| Regiao | East US Ohio (ENP_HUB_PRD) |
| URL | `https://seqgnxynrcylxsdzbloa.supabase.co` |
| Frontend | `https://hub.euanapratica.com` |
| Origens CORS permitidas | `hub.euanapratica.com`, `www.euanapratica.com`, `euanapratica.com`, `localhost:*` |

### Desenvolvimento Local

```bash
cd "c:\Users\I335869\ENP_HUB\hub-euanapratica"
npm install
npm run dev
```

O frontend roda em `http://localhost:8080` (ou porta disponivel). CORS no authGuard.ts aceita qualquer `localhost:*`.

---

## Deploy

### Checklist Completo de Deploy

```bash
# 1. Migracoes de banco de dados
npx supabase db push --include-all
# Confirmar com Y quando solicitado

# 2. Regenerar tipos TypeScript (se schema mudou)
npx supabase gen types typescript --project-id seqgnxynrcylxsdzbloa > src/integrations/supabase/types.ts

# 3. Build do frontend (verificar 0 erros)
npm run build

# 4. Deploy de Edge Functions (listar apenas as modificadas)
npx supabase functions deploy <nome1> <nome2> ...

# 5. Secrets (se necessario)
npx supabase secrets set CHAVE=VALOR
```

### Deploy de Edge Functions -- Lista Completa

Todas as 44 Edge Functions disponiveis:

**LLM / IA:**
- `analyze-resume`, `format-lead-report`, `translate-title`
- `analyze-post-for-upsell`, `recommend-product`, `generate-daily-priorities`
- `suggest-lead-tasks`, `suggest-whatsapp-messages`

**Email:**
- `send-welcome-email`, `send-booking-confirmation`, `send-booking-reminder`
- `send-booking-cancelled`, `send-booking-rescheduled`, `send-subscription-email`
- `send-espaco-invitation`, `send-course-milestone`, `send-test-email`
- `send-lead-email`, `send-session-reminder`, `send-prime-jobs-digest`

**WhatsApp:**
- `send-whatsapp`, `receive-whatsapp-webhook`, `check-whatsapp-status`

**Booking:**
- `send-booking-confirmation`, `send-booking-reminder`
- `send-booking-cancelled`, `send-booking-rescheduled`

**Subscriptions:**
- `ticto-webhook`, `simulate-ticto-callback`, `cancel-subscription`
- `reconcile-subscriptions`, `check-abandoned-carts`

**Leads:**
- `create-lead-user`, `dispatch-report-webhook`

**Video:**
- `create-video-upload`, `get-video-token`, `bunny-webhook`

**Content Studio:**
- `generate-content-insights`, `generate-content-ideas`, `generate-content-script`

**Outros:**
- `health-check`, `test-api-connection`, `verify-report-access`
- `delete-user`, `create-test-users`, `manage-ideas`, `process-invitation`

### Deploy de Funcao Compartilhada (_shared)

Arquivos em `supabase/functions/_shared/` sao bundled automaticamente em cada funcao que os importa. Ao modificar um arquivo _shared, e necessario redeployar **todas** as funcoes que o importam.

| Arquivo _shared | Funcoes que precisam redeploy |
|----------------|-------------------------------|
| `authGuard.ts` | Todas (44 funcoes) |
| `llmService.ts` | translate-title, suggest-lead-tasks, suggest-whatsapp-messages, recommend-product |
| `apiCostService.ts` | Todas que fazem chamadas LLM (8+ funcoes) |
| `emailTemplateService.ts` | Todas as send-* de email (10 funcoes) |
| `apiConfigService.ts` | Todas que usam getApiConfig (maioria) |
| `n8nService.ts` | format-lead-report, ticto-webhook, cancel-subscription, receive-whatsapp-webhook, dispatch-report-webhook |
| `whatsappService.ts` | send-whatsapp, receive-whatsapp-webhook, suggest-whatsapp-messages |
| `subscriptionHandlers.ts` | ticto-webhook |

### Secrets de Ambiente

```bash
# Ver secrets atuais
npx supabase secrets list

# Definir secret
npx supabase secrets set INTERNAL_FUNCTION_SECRET=<valor>
npx supabase secrets set OPENAI_API_KEY=<valor>        # fallback (credenciais primarias no banco)
npx supabase secrets set ANTHROPIC_API_KEY=<valor>      # fallback
npx supabase secrets set RESEND_API_KEY=<valor>         # fallback
npx supabase secrets set TICTO_SECRET_KEY=<valor>       # fallback
```

> **Nota:** Credenciais de API sao armazenadas primariamente na tabela `api_configs` (gerenciada via `/admin/configuracoes-apis`). Os env vars servem como fallback legacy.

---

## Edge Functions

### Configuracao em config.toml

Todas as funcoes que usam `requireAdmin` ou `requireAuthOrInternal` precisam de `verify_jwt = false` no `supabase/config.toml`. A funcao faz sua propria verificacao de auth internamente.

Formato:
```toml
[functions.nome-da-funcao]
verify_jwt = false
```

**Excecao:** `health-check` usa `verify_jwt = true` pois aceita anon key diretamente.

### Auth Guard

Tres modos de autenticacao disponíveis em `_shared/authGuard.ts`:

| Funcao | Uso | Quem passa |
|--------|-----|-----------|
| `requireAdmin(req)` | Apenas admins ou chamadas internas | Admin (JWT) ou `x-internal-secret` |
| `requireAuthOrInternal(req)` | Qualquer usuario autenticado ou chamadas internas | Qualquer JWT valido ou `x-internal-secret` |
| `validateUserAuth(req)` | Apenas verifica JWT, nao bloqueia | Retorna `AuthResult` |
| `validateInternalCall(req)` | Verifica header `x-internal-secret` | Cron jobs, triggers, funcoes internas |

### CORS

Usar **sempre** `getCorsHeaders(req)` (dinamico). A funcao detecta a origem da requisicao e retorna o header correto para producao ou localhost.

```typescript
import { getCorsHeaders } from "../_shared/authGuard.ts";

// No handler OPTIONS:
if (req.method === "OPTIONS") {
  return new Response(null, { headers: getCorsHeaders(req) });
}
```

> **NAO usar** o export `corsHeaders` (estatico) -- sempre retorna a origem de producao, quebrando desenvolvimento local.

---

## Configuracao de APIs

### Pagina Admin: `/admin/configuracoes-apis`

Gerencia todas as APIs externas via tabela `api_configs`:

| API Key | Servico | Campos Principais |
|---------|---------|-------------------|
| `openai_api` | OpenAI | api_key, base_url, model, max_tokens |
| `anthropic_api` | Anthropic | api_key, base_url, model, max_tokens |
| `openrouter_api` | OpenRouter | api_key, base_url, model |
| `resend_email` | Resend | api_key, base_url, from |
| `ticto_webhook` | Ticto | secret_key |
| `evolution_api` | Evolution API | api_key, base_url, instance_name |
| `bunny_api` | Bunny.net | api_key, library_id, cdn_hostname |

### Fallback entre Provedores

Cada API pode ter um `fallback_api_key` configurado (dropdown na UI). Quando uma chamada LLM falha com erro retentavel (402, 429, 500+, timeout), o `callLLM()` automaticamente tenta o provedor fallback.

Configuracao padrao:
- OpenAI -> fallback para Anthropic
- Anthropic -> fallback para OpenAI

> **Restricao:** Nao e possivel configurar self-fallback (constraint `api_configs_no_self_fallback`).

---

## Cron Jobs

### Configuracao via pg_cron + pg_net

Migration: `20260224500000_schedule_email_cron_jobs.sql`

| Job | Frequencia | Edge Function | Descricao |
|-----|-----------|---------------|-----------|
| Booking reminder 24h | `*/15 * * * *` | `send-booking-reminder` | Lembrete 24h antes da sessao |
| Booking reminder 1h | `*/15 * * * *` | `send-booking-reminder` | Lembrete 1h antes da sessao |
| Session reminder 24h | `*/30 * * * *` | `send-session-reminder` | Lembrete de sessao 24h (cria notificacao) |
| Session reminder 1h | `*/15 * * * *` | `send-session-reminder` | Lembrete de sessao 1h (cria notificacao) |
| Prime Jobs digest | `0 12 * * 1` (seg 12:00 UTC) | `send-prime-jobs-digest` | Resumo semanal de vagas |

### Funcao Helper: `invoke_edge_function()`

Funcao PostgreSQL `SECURITY DEFINER` que usa `pg_net` para chamar Edge Functions:

1. Le `supabase_edge_url` de `app_configs`
2. Le `internal_function_secret` de `app_configs`
3. Faz `net.http_post` com header `x-internal-secret`

### Configuracao Necessaria

Em `app_configs`:
- `supabase_edge_url` = `https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1`
- `internal_function_secret` = valor do secret

Em Supabase secrets:
- `INTERNAL_FUNCTION_SECRET` = mesmo valor acima

> **Importante:** O valor em `app_configs.internal_function_secret` DEVE ser identico ao valor em `INTERNAL_FUNCTION_SECRET` dos secrets do Supabase.

---

## N8N (VPS Hostinger)

### Infraestrutura

- **Servidor:** VPS Hostinger (mesmo da Evolution API)
- **Runtime:** Docker container
- **5 automacoes configuradas:**

| Automacao | Trigger Event | Descricao |
|-----------|--------------|-----------|
| `subscription_lifecycle` | `subscription.*` | Lifecycle completo de assinaturas |
| `report_ready_notification` | `report.generated` | Notificacao quando relatorio esta pronto |
| `high_value_lead_alert` | `report.generated` | Alerta para leads de alto valor |
| `drip_campaign` | `subscription.*` | Campanha de nurturing |
| `lead_scoring_routing` | `report.generated` | Score e roteamento de leads |

### Tabelas do Banco

- `n8n_automations`: Configuracao de webhooks por flow
- `n8n_webhook_logs`: Audit trail de todas as chamadas

### Admin UI: `/admin/automacoes`

- Cards com toggle on/off por automacao
- Configuracao de webhook URL
- Botao de teste
- Sheet de logs
- Documentacao inline

### Dispatch de Eventos

Edge Functions disparam webhooks via `dispatchN8NWebhook(triggerEvent, payload)`:

```
format-lead-report     → "report.generated"
ticto-webhook          → "subscription.*"
cancel-subscription    → "subscription.cancelled"
receive-whatsapp-webhook → "whatsapp.inbound"
dispatch-report-webhook → "report.generated" (via PG trigger)
```

### Autenticacao N8N -> Hub

N8N chama Edge Functions com header `x-internal-secret`. Para acesso REST direto ao banco, usa `service_role` key.

---

## WhatsApp (Evolution API)

### Infraestrutura

- **Servidor:** VPS Hostinger (Docker)
- **API:** Evolution API v2
- **Instance:** Configurada em `api_configs` como `evolution_api`

### Configuracao no Banco

```
api_key:     evolution_api
base_url:    https://<vps-host>/
credentials: { "api_key": "<evolution-api-key>" }
parameters:  { "instance_name": "enp_hub" }
```

### Verificacao de Status

Edge Function `check-whatsapp-status` verifica se a instancia esta conectada e o numero esta ativo.

### Troubleshooting

1. **Instancia desconectada:** Acessar painel da Evolution API e reconectar via QR code
2. **Mensagens nao enviadas:** Verificar `whatsapp_logs` para erros
3. **Webhook nao recebido:** Verificar URL do webhook configurada na Evolution API apontando para `receive-whatsapp-webhook`

---

## Bunny.net (Video)

### Componentes

- **Stream Library:** Armazena e transcodifica videos
- **CDN:** Entrega videos via player embarcado
- **Webhook:** Notifica quando transcoding termina

### Configuracao no Banco

```
api_key:     bunny_api
credentials: { "api_key": "<bunny-api-key>" }
parameters:  { "library_id": "<id>", "cdn_hostname": "<hostname>" }
```

### Edge Functions

| Funcao | Proposito |
|--------|-----------|
| `create-video-upload` | Gera URL de upload assinada |
| `get-video-token` | Gera token de visualizacao |
| `bunny-webhook` | Processa notificacao de transcoding completo |

### Configuracao do Webhook no Bunny.net

URL do webhook: `https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/bunny-webhook`

---

## Email (Resend)

### Infraestrutura

- **Provedor:** Resend API
- **Configuracao:** Tabela `api_configs`, key `resend_email`
- **Templates:** Tabela `email_templates`, editaveis via `/admin/email-templates` (Unlayer WYSIWYG)

### 12 Templates Seed

| Categoria | Template | Trigger |
|-----------|----------|---------|
| System | `onboarding_welcome` | useCompleteOnboarding |
| Subscription | `subscription_confirmation` | ticto-webhook (activated) |
| Subscription | `subscription_payment_failure` | ticto-webhook (dunning_updated) |
| Subscription | `subscription_cancellation` | cancel-subscription |
| Subscription | `subscription_renewal` | ticto-webhook (renewal) |
| Booking | `booking_confirmation` | useCreateBooking |
| Booking | `booking_reminder` | cron (24h) |
| Booking | `booking_reminder_1h` | cron (1h) |
| Booking | `booking_rescheduled` | useRescheduleBooking |
| Booking | `booking_cancelled` | useCancelBooking |
| Booking | `booking_no_show` | manual |
| Espaco | `espaco_invitation` | process-invitation |

### Email de Teste

Edge Function `send-test-email` -- admin-only, prefixo `[TESTE]` no assunto. Ignora flag `enabled` do template.

### Logs

Todos os emails sao logados em `email_logs` (status: sent/failed/skipped). Visivel em `/admin/saude-sistema`.

---

## Monitoramento

### `/admin/saude-sistema` -- Saude do Sistema

Dashboard unificado com 5 secoes:

1. **Banner de Status:** Resultado do health-check (10 checks paralelos)
2. **Integracoes:** Status de cada API configurada com teste de conectividade
3. **Metricas de Email:** Enviados, falhas, skipped (ultimos 7/30 dias)
4. **Metricas de Webhook:** Ticto webhooks processados, falhas
5. **Detalhes do Health Check:** Resultado individual de cada check

### `/admin/custos-api` -- Custos de API

Dashboard de custos de chamadas LLM:

- **5 cards de resumo:** Custo hoje, semana, mes, mes anterior, total de requisicoes
- **Grafico de tendencia diaria** (LineChart)
- **Custo por funcao** (BarChart horizontal)
- **Custo por provedor** (Progress bars com tokens)
- **Top 10 usuarios** por custo
- **Editor de precos** por modelo (app_configs -> llm_model_pricing)

### `/admin/auditoria` -- Logs de Auditoria

Tabela `admin_audit_logs` com acoes administrativas registradas.

### Tabelas de Log

| Tabela | Conteudo | Quem insere |
|--------|----------|-------------|
| `email_logs` | Todos os emails enviados/falhados | emailTemplateService.ts |
| `api_cost_logs` | Chamadas LLM com tokens e custo | apiCostService.ts |
| `payment_logs` | Webhooks Ticto recebidos | ticto-webhook |
| `whatsapp_logs` | Mensagens WhatsApp enviadas/recebidas | whatsappService.ts |
| `n8n_webhook_logs` | Dispatches para N8N | n8nService.ts |
| `subscription_events` | Eventos de assinatura (idempotente) | subscriptionHandlers.ts |
| `booking_history` | Mudancas de status de agendamentos | RPCs de booking |
| `admin_audit_logs` | Acoes administrativas | Frontend hooks |

---

## Banco de Dados

### Migracoes

- **Localizacao:** `supabase/migrations/<timestamp>_name.sql`
- **100+ migracoes** existentes
- **Push:** `npx supabase db push --include-all` (confirmar com Y)
- **Repair:** `npx supabase migration repair <version> --status applied` para marcar migracoes ja aplicadas

### RLS (Row Level Security)

Todas as tabelas tem RLS habilitado. Padrao de policies:

- **Admin:** `has_role(auth.uid(), 'admin')`
- **Proprio usuario:** `auth.uid() = user_id`
- **Insert por service_role:** `WITH CHECK (true)` + necessita GRANT

### Grants Obrigatorios

Toda nova tabela precisa de grants explicitos:

```sql
GRANT ALL ON public.<tabela> TO authenticated;
GRANT ALL ON public.<tabela> TO service_role;
```

> **Sem grant, RLS nao funciona** -- a query falha com "permission denied" antes mesmo de avaliar as policies.

---

## Backup e Recovery

### Backups Automaticos do Supabase

- **Point-in-Time Recovery (PITR):** Disponivel no plano Pro
- **Backups diarios:** Retencao de 7 dias (padrao)
- **Acesso:** Supabase Dashboard > Database > Backups

### Recomendacoes

1. Antes de migracoes destrutivas, verificar backup mais recente
2. Para dados criticos (api_configs, email_templates), manter exports regulares
3. Tabelas de log (email_logs, api_cost_logs) crescem rapidamente -- considerar politica de retencao

---

## Troubleshooting Comum

### 1. CORS -- "FunctionsFetchError" no browser

**Sintoma:** Browser mostra erro de CORS ao chamar Edge Function.
**Causa provavel:** `verify_jwt` nao esta `false` no `config.toml` para essa funcao.
**Solucao:**
1. Adicionar `[functions.nome-da-funcao]` e `verify_jwt = false` ao `config.toml`
2. `npx supabase functions deploy nome-da-funcao`

**Diagnostico:** Se o erro retorna `{"code":401}` -- e o gateway do Supabase bloqueando. Se retorna `{"error":"Unauthorized"}` -- a funcao esta rodando e fazendo sua propria auth (comportamento correto).

### 2. "Permission denied" em tabela

**Sintoma:** Query retorna erro "permission denied for table X".
**Causa:** Falta GRANT para `authenticated` ou `service_role`.
**Solucao:**
```sql
GRANT ALL ON public.<tabela> TO authenticated;
GRANT ALL ON public.<tabela> TO service_role;
```

### 3. RPC nao pode alterar tipo de retorno

**Sintoma:** `CREATE OR REPLACE FUNCTION` falha ao mudar `RETURNS TABLE` columns.
**Solucao:** Primeiro `DROP FUNCTION IF EXISTS nome(params)`, depois `CREATE FUNCTION`.

### 4. Migration com timestamp duplicado

**Sintoma:** `db push` falha com erro de migration duplicada.
**Solucao:** Renomear arquivo para timestamp unico.

### 5. Custo de API mostra $0

**Possiveis causas:**
1. `app_configs` sem GRANT para `service_role` -> `getPricing()` falha silenciosamente
2. Nome do modelo em `api_configs` nao bate com chave em `llm_model_pricing`
3. OpenRouter usa nomes com prefixo do vendor (ex: `openai/gpt-4o-mini`) -- pricing precisa de AMBOS os nomes

**Diagnostico:**
```sql
-- Verificar se pricing existe
SELECT key, value FROM app_configs WHERE key = 'llm_model_pricing';

-- Verificar modelos sem custo
SELECT DISTINCT model, metadata->>'cost_warning' FROM api_cost_logs WHERE cost_usd IS NULL LIMIT 20;
```

### 6. Cron job nao dispara

**Possiveis causas:**
1. `pg_cron` nao habilitado no projeto Supabase
2. `internal_function_secret` em `app_configs` diferente de `INTERNAL_FUNCTION_SECRET` nos secrets
3. `supabase_edge_url` incorreta em `app_configs`

**Diagnostico:**
```sql
SELECT * FROM cron.job;  -- Listar jobs
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;  -- Historico
```

### 7. Email nao enviado

**Checklist:**
1. Template existe em `email_templates`? Esta `enabled = true`?
2. Resend API key configurada em `api_configs`?
3. Edge Function deployada com versao atual do `emailTemplateService.ts`?
4. Trigger (hook frontend ou cron) esta chamando a Edge Function?
5. Verificar `email_logs` para status e mensagem de erro

### 8. WhatsApp nao envia

**Checklist:**
1. `evolution_api` configurada e ativa em `api_configs`?
2. Instancia conectada? Verificar via `check-whatsapp-status`
3. Numero normalizado corretamente? (E.164 sem +)
4. Verificar `whatsapp_logs` para erros

---

## Gotchas Conhecidos

### Edge Functions

1. **`verify_jwt = false` obrigatorio** para funcoes que usam `requireAdmin`/`requireAuthOrInternal`. Sem isso, o gateway bloqueia com CORS ruim
2. **CORS dinamico:** Sempre usar `getCorsHeaders(req)`, nunca o export estatico `corsHeaders`
3. **`supabase.functions.invoke()` nunca rejeita** -- usar `const { error } = await invoke(...)` e checar `error`, nao `.catch()`
4. **Deno mata Promises nao-awaited** -- `dispatchN8NWebhook()` DEVE ser `await`ed antes de retornar Response
5. **Pricing cacheado por cold start** -- mudancas no `llm_model_pricing` so refletem em novas instancias

### Banco de Dados

1. **TIMESTAMPTZ::date nao e IMMUTABLE** -- nao pode criar expression index em `(created_at::date)`. Usar composite index em `(created_at, edge_function)`
2. **Orphaned user_ids** em `payment_logs` quebram FK -- filtrar com `AND pl.user_id IN (SELECT id FROM auth.users)`
3. **RPC com RETURNS TABLE** nao pode ser alterada via `CREATE OR REPLACE` -- precisa DROP + CREATE
4. **Grants sao obrigatorios** para AMBOS `authenticated` e `service_role` em toda nova tabela
5. **LLM ignora JSON schema enums** -- temperatura do relatorio pode vir como `SUPER_QUENTE` em vez de `muito-quente`. Normalizar no codigo

### Integracoes

1. **OpenRouter usa nomes prefixados** (ex: `openai/gpt-4o-mini`). Pricing config precisa de AMBOS: nome plain e prefixado
2. **Ticto envia eventos em PT e EN** -- subscription handlers mapeiam ambos
3. **Evolution API v2** -- endpoint de envio e `POST /message/sendText/{instanceName}`

---

## Referencias

### URLs Importantes

| Recurso | URL |
|---------|-----|
| Supabase Dashboard | `https://supabase.com/dashboard/project/seqgnxynrcylxsdzbloa` |
| Frontend (Producao) | `https://hub.euanapratica.com` |
| Edge Functions Logs | Supabase Dashboard > Edge Functions > Logs |
| Bunny.net Dashboard | `https://panel.bunny.net` |
| Resend Dashboard | `https://resend.com/overview` |

### Documentacao por Feature

Cada feature tem documentacao detalhada em `docs/`:

| # | Feature | Docs |
|---|---------|------|
| 01 | Lead Import Webhook | `docs/01 Lead Import Webhook/` |
| 02 | Report Import and Output | `docs/02 Report Import and Output/` |
| 03 | Resume Pass | `docs/03 Resume Pass/` |
| 03 | System Health Dashboard | `docs/03 System Health Dashboard/` |
| 04 | Title Translator | `docs/04 Title Translator/` |
| 05 | E2E Test | `docs/05 E2E Test/` |
| 06 | Subscription and Ticto | `docs/06 Subscription and Ticto/` |
| 07 | Meus Pedidos | `docs/07 Meus Pedidos/` |
| 08 | Email System | `docs/08 Email System/` |
| 09 | Leads Dashboard | `docs/09 Leads Dashboard/` |
| 10 | API Cost Tracking | `docs/10 API Cost Tracking/` |
| 11 | WhatsApp Evolution API | `docs/11 WhatsApp Evolutio API VPS Config/` |
| 12 | Leads e WhatsApp | `docs/12 Leads e WhatsApp/` |
| 13 | Partner Ecosystem | `docs/13 Partner Ecosystem/` |
| 14 | Guided Tour | `docs/14 Guided Tour/` |
| 15 | Booking System | `docs/15 Booking System/` |
| 16 | Menu Visibility | `docs/16 Menu Visibility/` |
| 17 | Report CTA e Checklist | `docs/17 Report CTA e Checklist/` |
| 18 | Meu Hub | `docs/18 Meu Hub/` |
| 19 | Career Assessment Onboarding | `docs/19 Career Assessment Onboarding/` |
| 20 | Content Studio | `docs/20 Content Studio/` |
| 21 | Lives System | `docs/21 Lives System/` |

### Documentacao N8N

- `docs/n8n/setup-guide.md`
- `docs/n8n/01-subscription-lifecycle.md`
- `docs/n8n/02-report-ready-notification.md`
- `docs/n8n/03-high-value-lead-alert.md`
- `docs/n8n/04-drip-campaigns.md`
- `docs/n8n/05-lead-scoring-routing.md`

### Paginas Admin

| Rota | Funcionalidade |
|------|---------------|
| `/admin/dashboard` | Dashboard principal |
| `/admin/usuarios` | Gestao de usuarios |
| `/admin/matriculas` | Matriculas em espacos |
| `/admin/espacos` | Espacos de aprendizagem |
| `/admin/cursos` | Cursos com video |
| `/admin/agendamentos` | Agendamentos (3 tabs) |
| `/admin/produtos` | Hub Services (produtos) |
| `/admin/planos` | Planos de assinatura |
| `/admin/assinaturas` | Assinaturas ativas |
| `/admin/pedidos` | Pedidos/Orders |
| `/admin/relatorios` | Relatorios de leads |
| `/admin/leads` | Importacao de leads |
| `/admin/leads-dashboard` | Dashboard de leads |
| `/admin/leads/:id` | Detalhe de lead |
| `/admin/atividades` | Atividades/Timeline |
| `/admin/configuracoes` | Configuracoes gerais |
| `/admin/configuracoes-apis` | APIs externas |
| `/admin/email-templates` | Templates de email |
| `/admin/whatsapp-templates` | Templates WhatsApp |
| `/admin/automacoes` | Automacoes N8N |
| `/admin/custos-api` | Custos de API |
| `/admin/saude-sistema` | Saude do sistema |
| `/admin/subscription-health` | Saude de assinaturas |
| `/admin/auditoria` | Logs de auditoria |
| `/admin/feedback` | Feedback de usuarios |
| `/admin/testes-e2e` | Testes E2E |
| `/admin/ticto-simulator` | Simulador Ticto |
| `/admin/idea-kanban` | Kanban de ideias |
| `/admin/content-studio` | Estudio de conteudo |
| `/admin/menu-config` | Visibilidade de menus |
| `/admin/paginas-legais` | Paginas legais |
| `/admin/biblioteca/upload` | Upload de materiais |
