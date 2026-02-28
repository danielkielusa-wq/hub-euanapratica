# EUA Na Pratica Hub -- Guia do Desenvolvedor

> Arquitetura, stack, padroes de codigo e como adicionar features

**Versao**: 1.0
**Data**: 2026-02-26

---

## Sumario

1. [Arquitetura Geral](#arquitetura-geral)
2. [Tech Stack](#tech-stack)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Setup Local](#setup-local)
5. [Padroes de Codigo -- Frontend](#padroes-de-codigo----frontend)
6. [Padroes de Codigo -- Edge Functions](#padroes-de-codigo----edge-functions)
7. [Banco de Dados](#banco-de-dados)
8. [Edge Functions -- Servicos Compartilhados](#edge-functions----servicos-compartilhados)
9. [Integracoes Externas](#integracoes-externas)
10. [Sistema de Autenticacao e Roles](#sistema-de-autenticacao-e-roles)
11. [Rotas e Navegacao](#rotas-e-navegacao)
12. [Como Adicionar Features](#como-adicionar-features)
13. [Deploy](#deploy)
14. [Troubleshooting](#troubleshooting)
15. [Referencias](#referencias)

---

## Arquitetura Geral

```
Browser (React SPA)
  |
  |-- TanStack Query --> Supabase PostgREST (tabelas)
  |-- TanStack Query --> Supabase RPCs (funcoes SQL)
  |-- fetch/invoke  --> Supabase Edge Functions (Deno)
  |
  v
Supabase (PostgreSQL + Auth + Storage + Edge Functions)
  |
  |-- Edge Functions --> OpenAI / Anthropic / OpenRouter (LLM)
  |-- Edge Functions --> Resend API (email)
  |-- Edge Functions --> Evolution API (WhatsApp)
  |-- Edge Functions --> Bunny.net (video upload/streaming)
  |-- Edge Functions --> N8N webhooks (automacoes)
  |
  |-- pg_cron + pg_net --> Edge Functions (cron jobs)
  |-- PG Triggers --> Edge Functions (report webhook)
  |
  v
Ticto (webhooks de pagamento --> ticto-webhook Edge Function)
```

### Fluxos Principais

**Lead -> Relatorio -> Conversao:**
1. Lead preenche formulario (`/avaliar`) -> `career_evaluations`
2. `create-lead-user` cria usuario + `format-lead-report` gera relatorio
3. PG trigger `trg_report_completed` -> `dispatch-report-webhook` -> N8N
4. Lead acessa relatorio publico (`/report/:token`) com versao limitada
5. Conversao: assina plano ou compra servico -> desbloqueia relatorio completo

**Assinatura:**
1. Usuario vai a `/pricing` -> redirecionado para Ticto checkout
2. Ticto envia webhook -> `ticto-webhook` -> `subscriptionHandlers.ts`
3. Subscription ativada/atualizada -> email de confirmacao

**Agendamento:**
1. Aluno acessa `/dashboard/agendar/:serviceId` -> `BookingFlow`
2. RPC `get_available_slots` calcula horarios
3. RPC `create_booking` cria sessao + email de confirmacao
4. Cron jobs enviam reminders (24h e 1h antes)

---

## Tech Stack

| Tecnologia | Versao | Uso |
|-----------|--------|-----|
| React | 18 | UI framework |
| Vite | 5+ | Build tool e dev server |
| TypeScript | 5+ | Tipagem estatica |
| shadcn/ui | latest | Componentes UI (Radix + Tailwind) |
| TanStack Query | v5 | Data fetching, caching, mutations |
| React Router | v6 | Roteamento SPA |
| Recharts | latest | Graficos nos dashboards admin |
| Lucide React | latest | Icones |
| Supabase JS | v2 | Cliente PostgreSQL, Auth, Edge Functions |
| Tailwind CSS | v3 | Estilizacao utility-first |
| Zod | latest | Validacao de schemas (formularios) |
| React Email Editor | latest | Editor Unlayer para templates de email |

### Backend

| Tecnologia | Uso |
|-----------|-----|
| Supabase PostgreSQL | Banco de dados principal |
| Supabase Auth | Autenticacao JWT |
| Supabase Edge Functions | Deno runtime, logica server-side |
| Supabase RPC | Funcoes SQL SECURITY DEFINER |
| pg_cron + pg_net | Cron jobs internos |

---

## Estrutura de Pastas

```
hub-euanapratica/
├── src/
│   ├── App.tsx                    # Rotas e providers
│   ├── main.tsx                   # Entry point
│   ├── pages/                     # Paginas por dominio
│   │   ├── admin/                 # 32 paginas admin (Admin*.tsx)
│   │   ├── dashboards/            # Dashboards por role
│   │   ├── student/               # Paginas do aluno
│   │   ├── mentor/                # Paginas do mentor
│   │   ├── booking/               # Fluxo de agendamento
│   │   ├── community/             # Comunidade
│   │   ├── curriculo/             # ResumePass
│   │   ├── hub/                   # Meu Hub, Catalogo
│   │   ├── jobs/                  # Prime Jobs
│   │   ├── lead-form/             # Formulario de avaliacao (publico)
│   │   ├── lives/                 # Sistema de lives
│   │   ├── pricing/               # Planos e checkout
│   │   ├── report/                # Relatorio publico
│   │   └── ...
│   ├── components/                # Componentes reutilizaveis
│   │   ├── ui/                    # shadcn/ui primitives
│   │   ├── admin/                 # Componentes admin especificos
│   │   ├── booking/               # Componentes de agendamento
│   │   ├── course/                # Player de curso, quiz
│   │   ├── guards/                # ServiceGuard (acesso por plano)
│   │   ├── layouts/               # SidebarNav, headers
│   │   ├── report/                # Componentes de relatorio (v2)
│   │   └── ...
│   ├── hooks/                     # 93 hooks customizados
│   │   ├── useAdmin*.ts           # Hooks admin (CRUD + PostgREST)
│   │   ├── useBookings.ts         # Agendamentos
│   │   ├── useCourse*.ts          # Cursos
│   │   ├── useCommunity*.ts       # Comunidade
│   │   └── ...
│   ├── contexts/                  # AuthContext (unico context global)
│   ├── types/                     # 22 arquivos de tipos por dominio
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Cliente Supabase configurado
│   │       └── types.ts           # Tipos gerados automaticamente
│   ├── lib/                       # Utilitarios (utils.ts, etc.)
│   └── data/                      # Dados estaticos
├── supabase/
│   ├── config.toml                # Configuracao do projeto + verify_jwt
│   ├── migrations/                # 100+ migracoes SQL
│   └── functions/
│       ├── _shared/               # 8 servicos compartilhados
│       │   ├── authGuard.ts       # Auth + CORS
│       │   ├── llmService.ts      # callLLM() com fallback
│       │   ├── apiCostService.ts  # logApiCost() + extractTokenUsage()
│       │   ├── apiConfigService.ts# getApiConfig()
│       │   ├── emailTemplateService.ts # sendTemplatedEmail()
│       │   ├── n8nService.ts      # dispatchN8NWebhook()
│       │   ├── whatsappService.ts # sendWhatsAppMessage()
│       │   └── subscriptionHandlers.ts # handleSubscriptionEvent()
│       ├── analyze-resume/        # 1 index.ts por funcao
│       ├── format-lead-report/
│       └── ... (44 funcoes total)
└── docs/                          # 21 features documentadas
```

---

## Setup Local

```bash
# 1. Clonar e instalar
cd "c:\Users\I335869\ENP_HUB\hub-euanapratica"
npm install

# 2. Variavel de ambiente (ja configurado no .env)
# VITE_SUPABASE_URL=https://seqgnxynrcylxsdzbloa.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>

# 3. Dev server
npm run dev
# Frontend em http://localhost:8080

# 4. Build de producao
npm run build
```

### Supabase CLI

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
npx supabase login

# Linkar ao projeto
npx supabase link --project-ref seqgnxynrcylxsdzbloa

# Regenerar tipos apos mudanca no schema
npx supabase gen types typescript --project-id seqgnxynrcylxsdzbloa > src/integrations/supabase/types.ts
```

---

## Padroes de Codigo -- Frontend

### Paginas Admin (Padrao Card + Dialog)

Todas as paginas admin seguem o mesmo padrao:

```tsx
// src/pages/admin/AdminXxx.tsx
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAdminXxx } from "@/hooks/useAdminXxx";

export default function AdminXxx() {
  const {
    items,
    isLoading,
    selectedItem,
    setSelectedItem,
    isSaving,
    handleSave,
    handleDelete,
  } = useAdminXxx();

  return (
    <AdminLayout title="Titulo">
      {/* Lista de cards */}
      {items?.map((item) => (
        <Card key={item.id} onClick={() => setSelectedItem(item)}>
          <CardHeader><CardTitle>{item.name}</CardTitle></CardHeader>
          <CardContent>...</CardContent>
        </Card>
      ))}

      {/* Dialog de edicao */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar</DialogTitle></DialogHeader>
          {/* Formulario */}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
```

### Hooks Admin (Padrao CRUD)

```tsx
// src/hooks/useAdminXxx.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useAdminXxx() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch
  const { data: items, isLoading } = useQuery({
    queryKey: ["admin-xxx"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("xxx_table")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Save (useCallback para estabilidade de referencia)
  const handleSave = useCallback(async (formData: FormData) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("xxx_table")
        .upsert(formData);
      if (error) throw error;
      toast({ title: "Salvo com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["admin-xxx"] });
    } catch (err) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [queryClient, toast]);

  return { items, isLoading, isSaving, handleSave };
}
```

**Padroes-chave:**
- `useCallback` para funcoes passadas a componentes filhos
- `toast()` para feedback de sucesso/erro
- `isSaving` state para desabilitar botoes durante operacao
- `queryClient.invalidateQueries()` para refresh automatico apos mutacao
- Acesso direto via PostgREST (`supabase.from(...)`) -- nao usa REST API manual

### Protecao de Rotas

```tsx
// src/App.tsx
<Route path="/admin/xxx" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminXxx />
  </ProtectedRoute>
} />
```

Roles disponiveis: `student`, `mentor`, `admin`

### ServiceGuard (Acesso por Plano)

```tsx
<Route path="/biblioteca" element={
  <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
    <ServiceGuard serviceRoute="/biblioteca">
      <StudentLibrary />
    </ServiceGuard>
  </ProtectedRoute>
} />
```

`ServiceGuard` verifica se o plano do usuario tem acesso ao servico antes de renderizar.

### Tipos do Supabase

Tipos gerados automaticamente em `src/integrations/supabase/types.ts`:

```bash
npx supabase gen types typescript --project-id seqgnxynrcylxsdzbloa > src/integrations/supabase/types.ts
```

> **Sempre regenerar** apos migracoes que alteram schema. Build falhara se tipos estiverem desatualizados.

### Toast Notifications

```tsx
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

// Sucesso
toast({ title: "Salvo com sucesso" });

// Erro
toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
```

---

## Padroes de Codigo -- Edge Functions

### Estrutura Basica

```typescript
// supabase/functions/minha-funcao/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, requireAdmin } from "../_shared/authGuard.ts";

Deno.serve(async (req: Request) => {
  // 1. CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  // 2. Auth check
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    // 3. Parse body
    const body = await req.json();

    // 4. Business logic com Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ... logica ...

    // 5. Response
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[minha-funcao] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
```

### config.toml

Toda funcao que usa `requireAdmin` ou `requireAuthOrInternal` PRECISA:

```toml
[functions.minha-funcao]
verify_jwt = false
```

> Sem isso, o gateway do Supabase bloqueia a request antes da funcao executar, causando erro CORS no browser.

### Chamando Edge Functions do Frontend

**Opcao 1: supabase.functions.invoke() (preferido)**

```typescript
const { data, error } = await supabase.functions.invoke("minha-funcao", {
  body: { param1: "valor" },
});

// ATENCAO: invoke() NUNCA rejeita. Sempre verificar { error }
if (error) {
  console.error("Erro:", error);
}
```

**Opcao 2: fetch() direto (quando precisa acessar body em status nao-200)**

```typescript
const res = await fetch(`${supabaseUrl}/functions/v1/minha-funcao`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    "apikey": anonKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});
const body = await res.json();
```

> `supabase.functions.invoke()` descarta o body para respostas nao-200. Usar `fetch()` direto quando precisar do body de erro (ex: health-check retorna 207/503 com dados uteis).

### Chamando Edge Function de Outra Edge Function

```typescript
// Usar fetch() com x-internal-secret
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");

const response = await fetch(`${supabaseUrl}/functions/v1/outra-funcao`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-internal-secret": internalSecret,
  },
  body: JSON.stringify(payload),
});
```

---

## Banco de Dados

### Tabelas Principais (por dominio)

**Usuarios e Auth:**
- `profiles` -- Perfil do usuario (nome, email, avatar, telefone)
- `user_roles` -- Role do usuario (student, mentor, admin)
- `user_subscriptions` -- Assinatura ativa do usuario
- `user_hub_services` -- Servicos avulsos comprados

**Espacos e Cursos:**
- `espacos` -- Espacos de aprendizagem (grupos/turmas)
- `espaco_members` -- Membros do espaco (enrollment)
- `sessions` -- Sessoes/aulas do espaco
- `assignments` -- Tarefas do espaco
- `submissions` -- Entregas de tarefas
- `course_lessons` -- Aulas de curso (com video)
- `course_progress` -- Progresso do aluno no curso

**Agendamentos:**
- `bookings` -- Sessoes agendadas
- `booking_history` -- Log de mudancas de status
- `booking_policies` -- Regras globais
- `mentor_services` -- Vinculo mentor-servico
- `mentor_availability` -- Horarios recorrentes
- `mentor_blocked_times` -- Bloqueios de agenda

**Leads e Relatorios:**
- `career_evaluations` -- Avaliacao de carreira (leads)
- `formatted_report` -- Relatorio formatado (JSONB)

**Comercial:**
- `plans` -- Planos de assinatura (basic, pro, vip)
- `hub_services` -- Servicos/produtos do hub
- `orders` -- Pedidos de compra
- `payment_logs` -- Logs de webhook Ticto

**Comunidade:**
- `community_posts` -- Posts da comunidade
- `community_comments` -- Comentarios
- `community_reactions` -- Reacoes/likes

**Jobs:**
- `prime_jobs` -- Vagas de emprego
- `job_bookmarks` -- Vagas favoritadas
- `job_applications` -- Candidaturas

**Lives:**
- `lives` -- Lives agendadas
- `live_registrations` -- Inscricoes em lives
- `live_attendances` -- Presenca em lives

**Configuracao:**
- `api_configs` -- Configuracao de APIs externas (chaves, URLs)
- `app_configs` -- Configuracoes da aplicacao (key-value)
- `email_templates` -- Templates de email

**Automacoes:**
- `n8n_automations` -- Configuracao de webhooks N8N
- `n8n_webhook_logs` -- Log de dispatches

**Logs:**
- `email_logs` -- Emails enviados/falhados
- `api_cost_logs` -- Custos de chamadas LLM
- `whatsapp_logs` -- Mensagens WhatsApp
- `subscription_events` -- Eventos de assinatura (idempotente)
- `admin_audit_logs` -- Acoes administrativas

### RLS (Row Level Security)

Todas as tabelas tem RLS habilitado. Padroes de policy:

```sql
-- Admin-only
CREATE POLICY "admin_access" ON tabela
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Proprio usuario
CREATE POLICY "user_own_data" ON tabela
  FOR SELECT USING (auth.uid() = user_id);

-- Insert aberto para service_role
CREATE POLICY "service_insert" ON tabela
  FOR INSERT WITH CHECK (true);
```

### Grants -- OBRIGATORIOS

Toda nova tabela precisa:

```sql
GRANT ALL ON public.<tabela> TO authenticated;
GRANT ALL ON public.<tabela> TO service_role;
```

> Sem grant, a query falha com "permission denied" ANTES de avaliar as policies RLS. Isso afeta tanto o frontend (authenticated) quanto as Edge Functions (service_role).

### Migracoes

**Convencao de nomes:** `<timestamp>_descricao.sql`

```bash
# Criar nova migracao
# Usar timestamp unico (YYYYMMDDHHMMSS ou similar)

# Aplicar migracoes
npx supabase db push --include-all

# Marcar migracao como ja aplicada (repair)
npx supabase migration repair <version> --status applied
```

**Gotchas de migracoes:**
1. Timestamps duplicados causam falha no `db push` -- renomear
2. `CREATE OR REPLACE FUNCTION` nao pode alterar `RETURNS TABLE` -- usar `DROP FUNCTION IF EXISTS` + `CREATE`
3. `TIMESTAMPTZ::date` nao e IMMUTABLE -- nao pode ser usado em expression indexes
4. Orphaned FKs (ex: user_id referenciando user deletado) quebram constraints

### RPCs Importantes

| RPC | Proposito | Auth |
|-----|-----------|------|
| `get_email_template_by_name` | Busca template de email | SECURITY DEFINER |
| `get_api_config_by_key` | Busca config de API | SECURITY DEFINER |
| `create_booking` | Cria agendamento | SECURITY DEFINER |
| `reschedule_booking` | Reagenda sessao | SECURITY DEFINER |
| `cancel_booking` | Cancela sessao | SECURITY DEFINER |
| `get_available_slots` | Horarios disponiveis | SECURITY DEFINER |
| `check_user_booking_limit` | Limite de agendamentos | SECURITY DEFINER |
| `has_role` | Verifica role do usuario | SECURITY DEFINER |

---

## Edge Functions -- Servicos Compartilhados

Os 8 arquivos em `supabase/functions/_shared/` sao importados pelas Edge Functions:

### authGuard.ts -- Autenticacao e CORS

```typescript
import { getCorsHeaders, requireAdmin, requireAuthOrInternal, validateUserAuth, validateInternalCall } from "../_shared/authGuard.ts";

// CORS preflight (OBRIGATORIO em toda funcao)
if (req.method === "OPTIONS") {
  return new Response(null, { headers: getCorsHeaders(req) });
}

// Auth -- escolher um:
const authError = await requireAdmin(req);          // Admin ou x-internal-secret
const authError = await requireAuthOrInternal(req); // Qualquer JWT ou x-internal-secret
```

### llmService.ts -- Chamadas LLM com Fallback

```typescript
import { callLLM } from "../_shared/llmService.ts";

const result = await callLLM({
  apiKey: "openai_api",         // ou "anthropic_api", "openrouter_api"
  systemPrompt: "Voce e um assistente...",
  userMessage: "Analise este texto...",
  maxTokens: 4000,
  responseFormat: {             // Opcional: structured output (OpenAI only)
    name: "analysis",
    strict: true,
    schema: { /* JSON Schema */ },
  },
  userId: userId || null,
  edgeFunction: "minha-funcao",
  metadata: { context_id: "123" },
});

// result.content      -- texto da resposta
// result.provider     -- "openai" | "anthropic" | "openrouter"
// result.model        -- nome do modelo usado
// result.usedFallback -- true se o fallback foi acionado
// result.durationMs   -- tempo total
```

**Comportamento de fallback:**
1. Tenta provedor primario (ex: OpenAI)
2. Se falhar com erro retentavel (402, 429, 500+, timeout) E tiver fallback configurado
3. Automaticamente tenta o provedor fallback (ex: Anthropic)
4. Loga custo para ambas as tentativas
5. Se ambos falharem, lanca `LLMError`

**Erros retentaveis:** HTTP 402, 429, 500, 502, 503, 529, timeout, `insufficient_quota`, `insufficient_credits`, `rate_limit_exceeded`, `overloaded_error`

### apiCostService.ts -- Tracking de Custos

```typescript
import { logApiCost, extractTokenUsage, detectProviderFromUrl } from "../_shared/apiCostService.ts";

// Apos chamada LLM direta (sem callLLM):
const aiData = await aiResponse.json();
const { inputTokens, outputTokens } = extractTokenUsage(aiData, "anthropic");

// Fire-and-forget (nao await, nao bloqueia resposta):
logApiCost({
  userId,
  edgeFunction: "minha-funcao",
  provider: "anthropic",
  model: "claude-haiku-4-5-20251001",
  inputTokens,
  outputTokens,
  durationMs: Date.now() - startTime,
  metadata: { context: "algum contexto" },
});

// Detectar provider pela URL:
const provider = detectProviderFromUrl("https://api.anthropic.com/v1"); // "anthropic"
```

> `callLLM()` ja faz tracking automatico. So usar `logApiCost()` diretamente se fizer chamada LLM manual (sem callLLM).

### emailTemplateService.ts -- Emails com Template

```typescript
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";

const result = await sendTemplatedEmail({
  templateName: "booking_confirmation",  // Deve existir em email_templates
  to: "usuario@email.com",
  variables: {
    "{{studentName}}": "Joao Silva",
    "{{serviceName}}": "Mentoria de Carreira",
    "{{formattedDate}}": "15 de marco de 2026",
    "{{meetingLinkSection}}": "<p><a href='...'>Link da reuniao</a></p>",
  },
});

// result.success   -- true se nao houve erro
// result.emailSent -- true se email foi efetivamente enviado
// result.message   -- descricao (template disabled, not found, etc.)
```

**Variaveis:** Usar sintaxe `{{nome}}` com chaves duplas. A substituicao e feita via regex no subject e body_html.

**Blocos condicionais:** Pre-renderizar no Edge Function e passar como variavel:

```typescript
const meetingLink = booking.meeting_link
  ? `<p><strong>Link:</strong> <a href="${booking.meeting_link}">${booking.meeting_link}</a></p>`
  : "";

await sendTemplatedEmail({
  templateName: "booking_confirmation",
  to: email,
  variables: {
    "{{meetingLinkSection}}": meetingLink,  // HTML ou string vazia
  },
});
```

### n8nService.ts -- Webhook N8N

```typescript
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";

// DEVE ser await (Deno mata Promises nao-awaited ao retornar Response)
await dispatchN8NWebhook("report.generated", {
  lead_id: leadId,
  report_data: { score, temperature },
}, supabase);
```

**Eventos disponiveis:**
- `report.generated` -- Relatorio gerado
- `subscription.activated`, `subscription.cancelled`, `subscription.*` -- Lifecycle de assinatura
- `whatsapp.inbound` -- Mensagem WhatsApp recebida

### whatsappService.ts -- WhatsApp

```typescript
import { sendWhatsAppMessage, normalizePhone, findLeadByPhone } from "../_shared/whatsappService.ts";

const result = await sendWhatsAppMessage({
  phone: normalizePhone("+5511999999999"),
  text: "Ola! Seu relatorio esta pronto.",
  leadId: leadId,           // Opcional: para logging
  templateName: "report_ready",  // Opcional: para logging
});
```

### apiConfigService.ts -- Configuracao de APIs

```typescript
import { getApiConfig } from "../_shared/apiConfigService.ts";

const config = await getApiConfig("resend_email");
// config.credentials.api_key -- chave da API
// config.base_url             -- URL base
// config.parameters           -- parametros (model, from, etc.)
// config.fallback_api_key     -- fallback configurado (ou null)
```

### subscriptionHandlers.ts -- Eventos Ticto

Usado internamente pelo `ticto-webhook`. Mapeia eventos Ticto para handlers:

| Evento Ticto | Handler | Acao |
|-------------|---------|------|
| paid, completed, approved | `activateSubscription` | Ativa/renova assinatura |
| subscription_delayed | `handleSubscriptionDelayed` | Incrementa dunning stage |
| subscription_canceled | `handleSubscriptionCancelled` | Cancela no fim do periodo |
| refunded, chargeback | `handleSubscriptionRefund` | Revoga acesso imediato |
| uncanceled | `handleSubscriptionResumed` | Reativa assinatura |
| all_charges_paid | `handleSubscriptionEnded` | Finaliza naturalmente |

---

## Integracoes Externas

### Bunny.net (Video)

**Fluxo de upload:**
1. Frontend chama `create-video-upload` -> retorna URL assinada
2. Frontend faz PUT do arquivo na URL assinada
3. Bunny processa/transcodifica o video
4. Bunny chama webhook `bunny-webhook` -> atualiza status no banco
5. Para visualizar: `get-video-token` gera token temporario

### Ticto (Pagamentos)

**Webhook URL:** `https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/ticto-webhook`

**Fluxo:**
1. Ticto envia POST com evento (paid, canceled, etc.)
2. `ticto-webhook` valida secret, identifica se e subscription ou produto avulso
3. Para subscriptions: `handleSubscriptionEvent()` roteia para o handler correto
4. Para produtos: cria registro em `orders` + `user_hub_services`
5. Emails de confirmacao/falha sao disparados

**Idempotencia:** `subscription_events` tem constraint UNIQUE em `(ticto_transaction_id, event_type)`.

### Evolution API (WhatsApp)

**Endpoints usados:**
- `POST /message/sendText/{instance}` -- Enviar mensagem
- `GET /instance/connectionState/{instance}` -- Status da conexao

**Webhook de entrada:** `receive-whatsapp-webhook` recebe mensagens inbound, faz lookup de lead por telefone, registra em `whatsapp_logs`, e dispara `whatsapp.inbound` para N8N.

### N8N (Automacoes)

**Dispatch:** `dispatchN8NWebhook(event, payload)` -- consulta `n8n_automations` por event matching (exato ou wildcard `prefix.*`), faz POST para cada webhook_url ativo, loga resultado em `n8n_webhook_logs`.

**Matching de eventos:**
- Exato: `report.generated` match apenas `report.generated`
- Wildcard: `subscription.*` match `subscription.activated`, `subscription.cancelled`, etc.

---

## Sistema de Autenticacao e Roles

### AuthContext

`src/contexts/AuthContext.tsx` -- Provider global que:
1. Escuta `onAuthStateChange` do Supabase
2. Carrega profile + role do usuario
3. Expoe: `isAuthenticated`, `isLoading`, `user`, `signIn`, `signOut`

### Roles

| Role | Acesso |
|------|--------|
| `student` | Dashboard aluno, cursos, agendamentos, comunidade, jobs |
| `mentor` | Dashboard mentor, espacos, disponibilidade, lives |
| `admin` | Tudo acima + todas as paginas admin |

Roles sao armazenadas em `user_roles` (1 role por usuario). A funcao SQL `has_role(user_id, role)` e usada em RLS policies.

### Onboarding

Usuarios novos sao redirecionados para `/onboarding` ate completar. O flag `has_completed_onboarding` no profile controla isso.

---

## Rotas e Navegacao

### Publicas (sem auth)

| Rota | Pagina | Proposito |
|------|--------|-----------|
| `/` | Index | Landing page |
| `/login` | Login | Autenticacao |
| `/cadastro` | Register | Registro |
| `/avaliar` | LeadFormPage | Formulario de avaliacao (lead) |
| `/report/:token` | PublicReport | Relatorio publico (limitado/completo) |
| `/termos-assinatura` | LegalPage | Termos legais |

### Student

| Rota | Pagina |
|------|--------|
| `/dashboard/hub` | Meu Hub (principal) |
| `/dashboard` | Dashboard de atividades |
| `/dashboard/cursos` | Meus cursos |
| `/dashboard/agendamentos` | Meus agendamentos |
| `/dashboard/agendar/:serviceId` | Fluxo de agendamento |
| `/biblioteca` | Biblioteca de materiais |
| `/comunidade` | Comunidade |
| `/prime-jobs` | Vagas de emprego |
| `/curriculo` | ResumePass |
| `/lives` | Lives disponiveis |

### Mentor

| Rota | Pagina |
|------|--------|
| `/mentor/dashboard` | Dashboard mentor |
| `/mentor/espacos` | Meus espacos |
| `/mentor/agendamentos` | Agendamentos |
| `/mentor/disponibilidade` | Horarios |
| `/mentor/lives` | Minhas lives |

### Admin

32 paginas admin sob `/admin/*`. Ver lista completa em `src/App.tsx`.

---

## Como Adicionar Features

### Checklist: Nova Pagina Admin

1. **Criar migracao** (se precisar de tabela nova):
   ```sql
   -- supabase/migrations/<timestamp>_create_xxx.sql
   CREATE TABLE public.xxx (...);
   ALTER TABLE public.xxx ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "admin_access" ON xxx FOR ALL USING (has_role(auth.uid(), 'admin'));
   GRANT ALL ON public.xxx TO authenticated;
   GRANT ALL ON public.xxx TO service_role;
   ```

2. **Aplicar migracao e regenerar tipos:**
   ```bash
   npx supabase db push --include-all
   npx supabase gen types typescript --project-id seqgnxynrcylxsdzbloa > src/integrations/supabase/types.ts
   ```

3. **Criar hook** `src/hooks/useAdminXxx.ts` seguindo o padrao CRUD

4. **Criar pagina** `src/pages/admin/AdminXxx.tsx` seguindo padrao Card + Dialog

5. **Adicionar rota** em `src/App.tsx`:
   ```tsx
   <Route path="/admin/xxx" element={
     <ProtectedRoute allowedRoles={['admin']}>
       <AdminXxx />
     </ProtectedRoute>
   } />
   ```

6. **Adicionar ao menu** em `src/components/layouts/SidebarNav.tsx`

7. **Build e testar:**
   ```bash
   npm run build
   ```

### Checklist: Nova Edge Function

1. **Criar pasta** `supabase/functions/minha-funcao/index.ts`

2. **Adicionar ao config.toml:**
   ```toml
   [functions.minha-funcao]
   verify_jwt = false
   ```

3. **Implementar** seguindo o padrao basico (CORS + auth + try/catch)

4. **Se usar LLM:** Usar `callLLM()` (logging e fallback automaticos)

5. **Se enviar email:** Usar `sendTemplatedEmail()`

6. **Se disparar N8N:** `await dispatchN8NWebhook("event.name", payload)`

7. **Deploy:**
   ```bash
   npx supabase functions deploy minha-funcao
   ```

### Checklist: Novo Template de Email

1. Inserir em `email_templates` via admin UI (`/admin/email-templates`)
2. Definir `name` (machine identifier), `subject`, `body_html`, `variables`
3. Editar design visual no editor Unlayer
4. Na Edge Function: chamar `sendTemplatedEmail({ templateName: "nome", to, variables })`

### Checklist: Nova Integracao LLM

1. Configurar API em `api_configs` via `/admin/configuracoes-apis`
2. Adicionar pricing em `app_configs` -> `llm_model_pricing`:
   ```json
   { "modelo-nome": { "input_per_1m": X, "output_per_1m": Y } }
   ```
3. Usar `callLLM({ apiKey: "config_key", ... })` na Edge Function
4. Configurar fallback se desejado

---

## Deploy

### Checklist Completo

```bash
# 1. Migracoes (se houver mudancas no banco)
npx supabase db push --include-all

# 2. Tipos (se schema mudou)
npx supabase gen types typescript --project-id seqgnxynrcylxsdzbloa > src/integrations/supabase/types.ts

# 3. Build frontend (DEVE ter 0 erros)
npm run build

# 4. Deploy Edge Functions (apenas as modificadas)
npx supabase functions deploy funcao1 funcao2 funcao3

# 5. Secrets (se necessario)
npx supabase secrets set CHAVE=VALOR
```

### Deploy de _shared

Modificar um arquivo em `_shared/` requer redeploy de todas as funcoes que o importam. Ver tabela de dependencias no guia do System Admin.

---

## Troubleshooting

### Frontend

**Build falha com "Type X is not assignable":**
Tipos desatualizados. Regenerar:
```bash
npx supabase gen types typescript --project-id seqgnxynrcylxsdzbloa > src/integrations/supabase/types.ts
```

**Query retorna array vazio quando deveria ter dados:**
Verificar RLS policies e grants. O frontend usa `authenticated` role.

**supabase.functions.invoke() parece nao retornar erro:**
`invoke()` nunca rejeita. Verificar `{ error }` no retorno, nao usar `.catch()`.

### Edge Functions

**Erro CORS no browser ao chamar funcao:**
1. Verificar `verify_jwt = false` no `config.toml`
2. Verificar que o handler de OPTIONS retorna `getCorsHeaders(req)`
3. Redeployar a funcao

**Gateway retorna `{"code":401}`:**
O Supabase gateway esta bloqueando. `verify_jwt` provavelmente esta `true` ou ausente.

**Funcao retorna `{"error":"Unauthorized"}`:**
A funcao esta rodando e verificando auth. O token JWT pode estar expirado ou o usuario nao e admin.

**"permission denied for table X" no log da funcao:**
Falta `GRANT ALL ON public.X TO service_role`.

**callLLM() falha com ambos provedores:**
Verificar credenciais em `api_configs`. Verificar saldo/cota dos provedores. Checar `api_cost_logs` para historico de erros.

### Banco de Dados

**Migration falha com "relation already exists":**
A migracao ja foi parcialmente aplicada. Verificar estado e usar `migration repair` se necessario.

**Migration falha com "duplicate key":**
Timestamps duplicados entre arquivos de migracao. Renomear.

**RPC nao pode ser alterada:**
`CREATE OR REPLACE` nao altera `RETURNS TABLE`. Usar `DROP FUNCTION IF EXISTS` + `CREATE FUNCTION`.

**Index expression nao e IMMUTABLE:**
`TIMESTAMPTZ::date` nao e IMMUTABLE. Usar composite index em vez de expression index.

---

## Referencias

### Documentacao por Feature

21 features documentadas em `docs/`. Cada pasta contem guias por role (CEO, DEV, ADMIN, etc.):

| # | Feature | Pasta |
|---|---------|-------|
| 01 | Lead Import Webhook | `docs/01 Lead Import Webhook/` |
| 02 | Report Import/Output | `docs/02 Report Import and Output/` |
| 03 | Resume Pass | `docs/03 Resume Pass/` |
| 03 | System Health Dashboard | `docs/03 System Health Dashboard/` |
| 04 | Title Translator | `docs/04 Title Translator/` |
| 05 | E2E Test | `docs/05 E2E Test/` |
| 06 | Subscription/Ticto | `docs/06 Subscription and Ticto/` |
| 07 | Meus Pedidos | `docs/07 Meus Pedidos/` |
| 08 | Email System | `docs/08 Email System/` |
| 09 | Leads Dashboard | `docs/09 Leads Dashboard/` |
| 10 | API Cost Tracking | `docs/10 API Cost Tracking/` |
| 11 | WhatsApp VPS Config | `docs/11 WhatsApp Evolutio API VPS Config/` |
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

### Links Uteis

- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query v5](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com)
- [Deno Manual](https://deno.land/manual)
- [Resend API](https://resend.com/docs)
