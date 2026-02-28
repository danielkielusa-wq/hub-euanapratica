# Meu Hub — Documentação Técnica (DEV)

> Arquitetura, banco de dados, hooks, componentes e fluxo de dados da seção "Minha Jornada" no dashboard do usuário.

---

## Visão Geral

"Meu Hub" é uma camada de visualização no frontend que unifica dados de `user_hub_services`, `hub_services`, `bookings` e `sessions` para mostrar ao usuário tudo que ele possui em um único painel organizado por status computado.

**Não há backend novo** — o status é calculado no frontend (query-time) a partir dos dados existentes.

---

## Banco de Dados

### Migration: `20260225620000_meu_hub_expansion.sql`

**Colunas adicionadas em `user_hub_services`:**

| Coluna | Tipo | Default | Descrição |
|--------|------|---------|-----------|
| `access_source` | `TEXT NOT NULL` | `'purchase'` | Origem do acesso: `purchase`, `plan`, `admin_grant`, `free` |
| `sessions_total` | `INT` | `NULL` | Sessões compradas (consulting/live_mentoring). NULL = ilimitado/não aplicável |
| `sessions_used` | `INT NOT NULL` | `0` | Sessões já utilizadas |
| `metadata` | `JSONB NOT NULL` | `'{}'` | Dados extras por tipo de serviço |

**Coluna adicionada em `hub_services`:**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `plan_feature_key` | `TEXT` | Vincula serviço a feature de plano (ex: `'resume_pass'`, `'title_translator'`) |

### Metadata por `service_type`

| service_type | metadata padrão | Campos extras |
|-------------|-----------------|---------------|
| `consulting` | `{ "booking_id": null }` | `booking_id` atualizado quando booking é criado |
| `live_mentoring` | `{ "espaco_id": "<uuid>" }` | — |
| `live_event` | `{}` | `session_datetime`, `meeting_link` |
| `recorded_course` | `{}` | `progress_percent` (0-100) |
| `ai_tool` | `{}` | — |

### RLS

Sem mudança — `user_hub_services` já tem RLS:
- SELECT: `auth.uid() = user_id`
- INSERT/UPDATE/DELETE: via service_role (Edge Functions)

---

## Types — `src/types/hub.ts`

```typescript
export type AccessSource = 'purchase' | 'plan' | 'admin_grant' | 'free';

export type ComputedStatus =
  | 'needs_action'   // consulting: comprado mas não agendado
  | 'scheduled'      // consulting: sessão confirmada
  | 'active'         // live_mentoring / ai_tool / recorded_course em andamento
  | 'upcoming'       // live_event: evento futuro
  | 'not_started'    // recorded_course: sem progresso
  | 'completed';     // qualquer tipo: concluído

export interface UserHubService {
  id: string;
  user_id: string;
  service_id: string;
  status: 'active' | 'expired' | 'cancelled';
  access_source: AccessSource;
  sessions_total: number | null;
  sessions_used: number;
  metadata: Record<string, unknown>;
  started_at: string | null;
  expires_at: string | null;
}

export interface MyHubItem {
  user_service_id: string;
  service: HubService;
  access_source: AccessSource;
  sessions_total: number | null;
  sessions_used: number;
  computed_status: ComputedStatus;
  booking?: BookingWithDetails;           // consulting: booking mais recente
  next_session_datetime?: string;         // live_mentoring: próxima sessão
  metadata: Record<string, unknown>;
}

export type HubSectionId = 'needs_action' | 'active' | 'upcoming' | 'history';

export interface HubSection {
  id: HubSectionId;
  label: string;
  items: MyHubItem[];
}
```

---

## Hooks

### `useMyHub()` — `src/hooks/useMyHub.ts`

**QueryKey:** `['my-hub', user.id]`

**Fluxo:**
1. Fetch `user_hub_services` com JOIN `hub_services(*)` para o user ativo
2. Fetch `bookings` (último não-cancelado por `service_id`) para serviços `consulting`
3. Fetch `sessions` (próxima futura por `espaco_id`) para serviços `live_mentoring`
4. Computa `ComputedStatus` via `computeStatus(row, booking, nextSession)`
5. Agrupa em `HubSection[]` via `assignSection(status)`
6. Retorna apenas seções não-vazias

**Status Computation (`computeStatus`):**

| service_type | Condição | Status |
|-------------|----------|--------|
| `consulting` | sessions_total esgotadas | `completed` |
| `consulting` | sem booking ou booking cancelado | `needs_action` |
| `consulting` | booking status = `completed` | `completed` |
| `consulting` | booking status = `confirmed` | `scheduled` |
| `consulting` | default | `needs_action` |
| `live_mentoring` | — | `active` (sempre) |
| `live_event` | sem data em metadata | `upcoming` |
| `live_event` | data futura | `upcoming` |
| `live_event` | data passada | `completed` |
| `recorded_course` | progress >= 100 | `completed` |
| `recorded_course` | progress > 0 | `active` |
| `recorded_course` | progress = 0 | `not_started` |
| `ai_tool` | — | `active` (sempre) |

**Section Assignment (`assignSection`):**

| ComputedStatus | HubSectionId |
|---------------|--------------|
| `needs_action`, `not_started` | `needs_action` |
| `scheduled`, `active` | `active` |
| `upcoming` | `upcoming` |
| `completed` | `history` |

### `usePlanTools()` — `src/hooks/useMyHub.ts`

**QueryKey:** `['plan-tools', user.id, planId]`

**Fluxo:**
1. Fetch `hub_services` onde `plan_feature_key IS NOT NULL` e `is_visible_in_hub = true`
2. Filtra somente serviços com feature habilitada no plano do user (`planAccess.hasFeature()`)
3. Para `resume_pass`: extrai `getLimit/getUsage/getRemaining` de `usePlanAccess()`
4. Para `title_translator`: marca `is_unlimited: true`
5. Retorna `PlanTool[]`

### `useUserHubServices()` — `src/hooks/useHubServices.ts`

**QueryKey:** `['user-hub-services', user.id]`

Hook utilitário que retorna `UserHubService[]` completos (todos os campos) para o usuário autenticado. Usado em componentes que precisam de dados brutos sem computação de status.

---

## Componentes

### `MyJourneySection` — `src/components/hub/MyJourneySection.tsx`

Container principal. Renderizado em `StudentHub.tsx` acima do Getting Started Checklist.

- Se `useMyHub()` e `usePlanTools()` retornam vazio → `return null` (seção invisível)
- Loading → skeleton
- Itera `sections[]` → cada uma com ícone, label, contagem, grid de `JourneyCard`
- Seção extra "Ferramentas do seu Plano" com `PlanToolCard`

### `JourneyCard` — `src/components/hub/JourneyCard.tsx`

Card individual por `MyHubItem`:
- Borda esquerda colorida por `ComputedStatus` (âmbar/índigo/verde/azul/cinza)
- `StatusIcon` — ícone por status
- `AccessBadge` — "Comprado" (roxo) ou "Incluso no plano" (azul)
- `SubInfo` — informação contextual por tipo (data, progresso, mensagem)
- `JourneyCTA` — botão de ação por `service_type + computed_status`
- Contador de sessões `X/Y` (se `sessions_total > 1` para consulting)

### `PlanToolCard` — `src/components/hub/JourneyCard.tsx`

Card para ferramentas de plano (`PlanTool`):
- Borda esquerda azul
- Badge "Incluso no plano"
- Créditos: barra de progresso + contagem, ou "Uso ilimitado este mês"
- CTA → rota do serviço

---

## Edge Function: `ticto-webhook/index.ts`

### Mudanças no path de compra avulsa (ONE-TIME):

**1. Service lookup expandido:**
```typescript
.select("id, name, service_type, espaco_id")  // antes: "id, name"
```

**2. Lógica de acesso substituída:**

Antes: `upsert` simples com `onConflict: "user_id,service_id"`

Agora: check-then-insert-or-update:
- Se row NÃO existe → `INSERT` com `access_source: 'purchase'`, `sessions_total`, `metadata`
- Se row JÁ existe (re-compra) → `UPDATE` incrementando `sessions_total + 1`

**3. Auto-enrollment simplificado:**
Usa `service.espaco_id` direto (sem query extra) pois já vem no select.

---

## Página: `StudentHub.tsx`

```tsx
<DashboardTour />
<MyJourneySection />          {/* ← adicionado */}
<GettingStartedChecklist />
{/* ... rest of hub */}
```

`MyJourneySection` é self-contained — carrega dados via seus próprios hooks, oculta-se quando vazio.

---

## Como Adicionar um Novo Tipo de Serviço

1. **`src/types/hub.ts`**: adicionar ao type `ServiceType`
2. **`src/types/hub.ts`**: adicionar label em `SERVICE_TYPE_LABELS`
3. **`src/hooks/useMyHub.ts`**: adicionar case em `computeStatus()` e enriquecimento se necessário
4. **`src/components/hub/JourneyCard.tsx`**: adicionar case em `SubInfo` e `JourneyCTA`
5. **Migration**: se necessário, adicionar CHECK constraint para `service_type` no DB
6. **`ticto-webhook/index.ts`**: adicionar lógica de `metadata` e `sessions_total` para o novo tipo

---

## Debug

### Card não aparece para usuário:
```sql
SELECT * FROM user_hub_services WHERE user_id = '<uuid>' AND status = 'active';
SELECT * FROM hub_services WHERE id = '<service_id>' AND is_visible_in_hub = true;
```

### Status computado incorreto:
O status é calculado no frontend — debug via React DevTools:
1. Abrir DevTools → Components → buscar `MyJourneySection`
2. Verificar `sections` no state do `useMyHub`
3. Cada `item` tem `computed_status` — verificar `booking` e `next_session_datetime`

### Webhook Ticto não criou row:
```sql
SELECT * FROM payment_logs WHERE event_type IN ('paid','completed','approved') ORDER BY created_at DESC LIMIT 10;
```
Verificar:
- `status = 'partial'` → serviço ou perfil não encontrado
- `hub_services.ticto_product_id` bate com o `product_id` do payload?
