# Rastreamento de Custos de API — Documentação Técnica

## Visão Geral da Arquitetura

```
Edge Function (Deno)
  └─ faz chamada LLM (OpenAI / Anthropic)
  └─ extrai tokens da resposta
  └─ logApiCost() [fire-and-forget]
        └─ lê preços de app_configs → llm_model_pricing
        └─ calcula cost_usd
        └─ insere em api_cost_logs (service_role)

Frontend (React)
  └─ useAdminCosts() → 5 queries em paralelo → api_cost_logs
  └─ AdminCustosApi.tsx → dashboard + PricingEditor
  └─ useAppConfigs() → lê/escreve app_configs → llm_model_pricing
```

---

## Banco de Dados

### Tabela `api_cost_logs`

```sql
CREATE TABLE public.api_cost_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id),   -- nullable (chamadas internas/cron)
  edge_function TEXT NOT NULL,                     -- 'analyze-resume', etc.
  provider      TEXT NOT NULL CHECK (provider IN ('openai','anthropic','resend')),
  model         TEXT,                              -- nome exato do modelo
  input_tokens  INTEGER,
  output_tokens INTEGER,
  total_tokens  INTEGER GENERATED ALWAYS AS (COALESCE(input_tokens,0)+COALESCE(output_tokens,0)) STORED,
  cost_usd      NUMERIC(10,6),                    -- null se pricing indisponível
  status        TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success','error')),
  duration_ms   INTEGER,
  error_message TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

**RLS:**
- `SELECT`: apenas `has_role(auth.uid(), 'admin')`
- `INSERT`: aberto (`WITH CHECK (true)`) — service_role escreve diretamente

**Grants:** `GRANT ALL ON api_cost_logs TO authenticated, service_role`

**Migration:** `supabase/migrations/20260222993000_create_api_cost_logs.sql`

---

### Configuração de Preços em `app_configs`

| key | value (TEXT / JSON) |
|---|---|
| `llm_model_pricing` | `{"gpt-4.1-mini":{"input_per_1m":0.40,"output_per_1m":1.60}, ...}` |

Estrutura do JSON:
```json
{
  "gpt-4o-mini":             { "input_per_1m": 0.15, "output_per_1m": 0.60 },
  "gpt-4.1-mini":            { "input_per_1m": 0.40, "output_per_1m": 1.60 },
  "claude-haiku-4-5-20251001": { "input_per_1m": 1.00, "output_per_1m": 5.00 },
  "resend_email":            { "per_email": 0.00 }
}
```

> A chave deve ser o nome **exato** do modelo retornado por `apiConfig.parameters?.model`. Um mismatch resulta em `cost_usd = null`.

**Migration de seed (idempotente):** `supabase/migrations/20260222994000_ensure_llm_pricing_config.sql`
Usa `ON CONFLICT (key) DO UPDATE` para garantir que a linha sempre existe.

---

## Shared Service: `_shared/apiCostService.ts`

Caminho: `supabase/functions/_shared/apiCostService.ts`

### Exports

```typescript
// Extrai inputTokens/outputTokens do response da API
extractTokenUsage(
  aiData: Record<string, unknown> | null | undefined,
  provider: 'openai' | 'anthropic'
): { inputTokens: number | null; outputTokens: number | null }

// Registra custo. NUNCA lança exceção.
logApiCost(options: LogApiCostOptions): Promise<void>
```

### Interface `LogApiCostOptions`

```typescript
{
  userId?:       string | null;
  edgeFunction:  string;             // nome da Edge Function
  provider:      'openai' | 'anthropic' | 'resend';
  model?:        string | null;      // deve corresponder à chave em llm_model_pricing
  inputTokens?:  number | null;
  outputTokens?: number | null;
  status?:       'success' | 'error';
  durationMs?:   number | null;
  errorMessage?: string | null;
  metadata?:     Record<string, unknown>;
}
```

### Comportamento interno

1. Cria cliente Supabase com `SUPABASE_SERVICE_ROLE_KEY`
2. Busca `llm_model_pricing` de `app_configs` (cacheado por cold start)
3. Calcula `cost_usd`:
   - LLM: `(inputTokens / 1_000_000 * input_per_1m) + (outputTokens / 1_000_000 * output_per_1m)`
   - Email: `per_email` diretamente
   - Se pricing não encontrado ou model ausente: `null`
4. Insere em `api_cost_logs`
5. Qualquer erro é `console.warn` — nunca propaga

### Formatos de response suportados

| Provider | Campo input | Campo output |
|---|---|---|
| Anthropic | `usage.input_tokens` | `usage.output_tokens` |
| OpenAI Chat Completions | `usage.prompt_tokens` | `usage.completion_tokens` |
| OpenAI Responses API | `usage.input_tokens` | `usage.output_tokens` |

---

## Como adicionar tracking a uma nova Edge Function

Padrão mínimo (~5 linhas):

```typescript
import { logApiCost, extractTokenUsage } from '../_shared/apiCostService.ts';

// Antes do fetch:
const llmStartTime = Date.now();

// Após o fetch e parse do JSON:
const aiData = await aiResponse.json();
const { inputTokens, outputTokens } = extractTokenUsage(aiData, 'anthropic'); // ou 'openai'

// Fire-and-forget (não aguarde):
logApiCost({
  userId,                          // string | null
  edgeFunction: 'nome-da-funcao',
  provider: 'anthropic',           // ou 'openai'
  model: selectedModel,            // string do modelo (ex: 'claude-haiku-4-5-20251001')
  inputTokens,
  outputTokens,
  durationMs: Date.now() - llmStartTime,
  metadata: { algum_id: id },      // contexto opcional
});
```

Para registrar erros de API:
```typescript
logApiCost({
  ...,
  status: 'error',
  errorMessage: 'Descrição do erro',
});
```

---

## Edge Functions com tracking ativo

| Edge Function | Provider | `model` vem de |
|---|---|---|
| `analyze-resume` | Anthropic / OpenAI | `apiConfig.parameters?.model` |
| `format-lead-report` | Anthropic / OpenAI | `apiConfig.parameters?.model` |
| `translate-title` | Anthropic / OpenAI | `apiConfig.parameters?.model` |
| `analyze-post-for-upsell` | Anthropic / OpenAI | `apiConfig.parameters?.model` |
| `recommend-product` | Anthropic / OpenAI | `providerConfig.parameters?.model` |
| `generate-daily-priorities` | Anthropic / OpenAI | `apiConfigData.parameters?.model` |

---

## Frontend

### Hook: `src/hooks/useAdminCosts.ts`

5 queries TanStack Query em paralelo:

| Query | queryKey | Dados |
|---|---|---|
| Summary | `['admin-costs-summary']` | today, thisWeek, thisMonth, lastMonth, totalRequests |
| Daily trend | `['admin-costs-daily', period]` | `DailyCostPoint[]` — agrupado por dia no cliente |
| By function | `['admin-costs-by-function', period]` | `CostByFunction[]` |
| By provider | `['admin-costs-by-provider', period]` | `CostByProvider[]` |
| Top users | `['admin-costs-top-users', period]` | `TopUserCost[]` — join com `profiles` |

Período: `'today' | '7d' | '30d'` (estado local, sem URL param).

### Página: `src/pages/admin/AdminCustosApi.tsx`

Seções:
1. Header + seletor de período
2. 5 `SummaryCard`s
3. `LineChart` — tendência diária (recharts + `ChartContainer`)
4. `BarChart` horizontal — custo por função
5. Progress bars — custo por provedor (com tokens)
6. Tabela — custo médio por requisição
7. Tabela — top 10 usuários
8. `PricingEditor` — edição de preços via `useAppConfigs`

### Rota

```tsx
// src/App.tsx
<Route path="/admin/custos-api" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminCustosApi />
  </ProtectedRoute>
} />
```

---

## Como adicionar um novo modelo ao pricing

1. **Via UI (recomendado):** acessar `/admin/custos-api` → rolar até **Tabela de Preços por Modelo** → os modelos são carregados do JSON salvo em `app_configs`. Para adicionar um novo modelo, editar a migration ou usar SQL direto.

2. **Via migration:**
```sql
UPDATE public.app_configs
SET value = value::jsonb || '{"novo-modelo": {"input_per_1m": X, "output_per_1m": Y}}'::jsonb
WHERE key = 'llm_model_pricing';
```
   > `app_configs.value` é TEXT, então use cast `::jsonb` para o merge e depois converta de volta implicitamente (PostgREST retorna TEXT, a UI faz JSON.parse).
   > Alternativamente, faça UPDATE com o JSON completo.

3. **Adicionar label no frontend:**
   Em `src/pages/admin/AdminCustosApi.tsx`, adicione à constante `MODEL_LABELS`:
   ```typescript
   const MODEL_LABELS: Record<string, string> = {
     'novo-modelo': 'Nome Legível',
     // ...
   };
   ```

---

## Diagnóstico de problemas

### `cost_usd` é null / dashboard mostra $0

1. **Pricing config ausente:** verificar se existe `llm_model_pricing` em `app_configs`
   ```sql
   SELECT key, value FROM app_configs WHERE key = 'llm_model_pricing';
   ```
   Se vazio → re-rodar migration `20260222994000`.

2. **Model name mismatch:** o nome do modelo configurado em `api_configs` não bate com a chave em `llm_model_pricing`
   ```sql
   SELECT DISTINCT model FROM api_cost_logs WHERE cost_usd IS NULL LIMIT 20;
   ```
   Comparar com as chaves em `llm_model_pricing` e ajustar.

3. **Tokens não extraídos:** `input_tokens` e `output_tokens` são `null` na tabela → `extractTokenUsage` não encontrou o campo esperado. Verificar estrutura da resposta da API.

### `logApiCost` não está inserindo

- Verificar logs da Edge Function no dashboard Supabase → Functions
- Possível causa: `SUPABASE_SERVICE_ROLE_KEY` ausente no ambiente (não deve ocorrer em produção)
- O serviço usa `console.warn` em caso de erro — não bloqueia a resposta ao usuário

### Pricing cacheado (mudança não reflete imediatamente)

O pricing é cacheado por cold start da Edge Function (variável `cachedPricing` em módulo). Após salvar novos preços, aguardar uma nova instância da função (geralmente alguns minutos de inatividade) ou aguardar o próximo deploy.

---

## Deployment

```bash
# Após modificar apiCostService.ts ou qualquer Edge Function com tracking:
npx supabase functions deploy analyze-resume format-lead-report translate-title analyze-post-for-upsell recommend-product generate-daily-priorities

# Após modificar migrations:
npx supabase db push --include-all

# Após modificar tipos:
npx supabase gen types typescript --project-id seqgnxynrcylxsdzbloa > src/integrations/supabase/types.ts
```
