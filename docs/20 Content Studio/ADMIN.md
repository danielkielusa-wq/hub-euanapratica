# Content Studio — Guia do Administrador

> Ultima atualizacao: 2026-02-26
>
> Este documento cobre como acessar, monitorar, customizar e dar manutencao no Content Studio — o sistema de geracao de conteudo baseado em IA.

---

## O que e

O Content Studio minera dados reais da base Supabase (avaliacoes de carreira, posts da comunidade, vagas, cancelamentos, progresso de cursos) e usa LLM (OpenAI/Anthropic) para gerar:

1. **Insights** — padroes e tendencias detectados nos dados
2. **Ideias de conteudo** — com hooks polemicos em multiplos estilos
3. **Roteiros completos** — prontos para gravar (vertical 30-60s ou YouTube 8-15min)

Tudo editavel, agendavel e com prompts customizaveis sem deploy.

---

## Onde acessar

- **Admin UI**: Menu lateral → GESTAO DO NEGOCIO → **Content Studio** (`/admin/content-studio`)
- **Banco de dados**: Supabase Dashboard → tabelas `content_insights`, `content_ideas`, `content_scripts`, `content_generation_logs`
- **Custos LLM**: `/admin/custos-api` (filtre por `generate-content-*`)
- **Configs de API**: `/admin/configuracoes-apis` (OpenAI/Anthropic keys)
- **Edge Functions**: Supabase Dashboard → Edge Functions → `generate-content-insights`, `generate-content-ideas`, `generate-content-script`

---

## 1. Visao Geral das Tabelas

### `content_insights`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `insight_type` | TEXT | `barrier_radar`, `area_trend`, `question_hot`, `job_highlight`, `churn_pattern`, `engagement_gap` |
| `title` | TEXT | Titulo curto (max 80 chars) |
| `summary` | TEXT | Resumo com dados (2-3 frases) |
| `data_points` | JSONB | Dados agregados usados na geracao |
| `source_tables` | TEXT[] | Tabelas de origem (ex: `{career_evaluations,jobs}`) |
| `relevance_score` | INT 0-100 | Quao relevante e o insight |
| `controversy_score` | INT 0-100 | Potencial polemico (hooks fortes) |
| `period_start` / `period_end` | DATE | Periodo dos dados |
| `status` | TEXT | `new` → `used` → `archived` |
| `used_in_idea_id` | UUID FK | Ideia gerada a partir deste insight |

### `content_ideas`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `insight_id` | UUID FK | Insight de origem (null se topico livre) |
| `title` | TEXT | Titulo da ideia |
| `content_type` | TEXT | `vertical_short`, `long_youtube`, `stories`, `carousel` |
| `category` | TEXT | `instructional`, `polemic`, `data_story`, `myth_busting`, `roast`, `vaga_da_semana` |
| `hooks` | JSONB | Array de hooks: `[{text, style, score}]` (3-5 variacoes) |
| `estimated_virality_score` | INT 0-100 | Potencial de viralidade |
| `status` | TEXT | `idea` → `approved` → `in_production` → `published` / `discarded` |
| `priority` | TEXT | `low`, `medium`, `high`, `urgent` |
| `scheduled_date` | DATE | Data agendada no calendario |

### `content_scripts`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `idea_id` | UUID FK | Ideia de origem (ON DELETE CASCADE) |
| `title` | TEXT | Titulo do video |
| `hook` | TEXT | Texto exato dos primeiros 3-15 segundos |
| `body_sections` | JSONB | `[{heading, content, data_callout, camera_note}]` |
| `cta` | TEXT | Chamada para acao |
| `duration_estimate_seconds` | INT | 30-60 (vertical) ou 480-900 (youtube) |
| `platform` | TEXT | `youtube`, `instagram_reels`, `tiktok`, `stories` |
| `tone` | TEXT | `instructional`, `polemic`, `storytelling`, `data_journalism` |
| `status` | TEXT | `draft` → `review` → `approved` → `recorded` |

### `content_generation_logs`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `generation_type` | TEXT | `insights`, `ideas`, `script`, `hooks` |
| `model_used` | TEXT | Modelo LLM utilizado |
| `tokens_used` | INT | Total de tokens consumidos |
| `duration_ms` | INT | Tempo de processamento |
| `status` | TEXT | `success` ou `error` |
| `error_message` | TEXT | Mensagem de erro (se `status = error`) |

---

## 2. Workflow Diario Recomendado

### Segunda-feira (automatico via cron)

O cron job `generate-content-insights-weekly` roda automaticamente as **8h UTC (5h BRT)** toda segunda-feira. Ele chama `generate-content-insights` com `period_days: 7`.

**Verificar se rodou:**
```sql
SELECT generation_type, status, output_summary, created_at
FROM content_generation_logs
WHERE generation_type = 'insights'
ORDER BY created_at DESC
LIMIT 1;
```

Se nao rodou, gere manualmente na UI: tab Insights → "Gerar Novos Insights".

### Diariamente

1. Abrir tab **Insights** → revisar novos insights (foco nos com `controversy_score > 70`)
2. Clicar **"Gerar Ideias"** nos insights mais promissores
3. Tab **Ideias** → revisar hooks, aprovar as melhores (`status = approved`)
4. Para ideias aprovadas → clicar **"Roteiro"** para gerar script
5. Tab **Calendario** → arrastar ideias aprovadas para os slots do dia
6. Tab **Roteiros** → copiar roteiro e gravar

### Cadencia sugerida

| Dia | Vertical (30-60s) | YouTube (8-15min) |
|-----|-------------------|-------------------|
| Seg | 1 vertical | — |
| Ter | 1 vertical | 1 YouTube |
| Qua | 1 vertical | — |
| Qui | 1 vertical | 1 YouTube |
| Sex | 1 vertical | — |
| Sab | Opcional | — |

---

## 3. Customizando os Prompts LLM

### Onde editar

**Via UI (recomendado):** Content Studio → tab **Prompts** → Editar

**Via Supabase Dashboard:**
```sql
SELECT key, LEFT(value, 200) AS preview, updated_at
FROM app_configs
WHERE key LIKE 'content_studio_%';
```

### Os 3 prompts

| Key no `app_configs` | Usado por | Descricao |
|---------------------|-----------|-----------|
| `content_studio_insights_prompt` | `generate-content-insights` | System prompt para analisar dados e gerar insights |
| `content_studio_ideas_prompt` | `generate-content-ideas` | System prompt para gerar ideias + hooks |
| `content_studio_script_prompt` | `generate-content-script` | System prompt para gerar roteiros completos |

### Como funciona

Cada Edge Function le o prompt de `app_configs` com fallback para um default hardcoded:

```
app_configs (prompt customizado)
        ↓ se existe
   Usa prompt do banco
        ↓ se vazio/null
   Usa DEFAULT_*_PROMPT (hardcoded no codigo)
```

### Dicas para editar prompts

1. **Mantenha o formato de saida JSON** — a Edge Function faz `JSON.parse()` no resultado. Se mudar o schema, a funcao vai quebrar
2. **Use variaveis de contexto** — o LLM recebe dados como variavel `userMessage`. O prompt so precisa descrever como interpretar esses dados
3. **Teste com um insight/ideia especifica** antes de aplicar amplamente
4. **Campos obrigatorios no JSON de saida:**
   - Insights: `title`, `summary`, `insight_type`, `relevance_score`, `controversy_score`
   - Ideias: `title`, `content_type`, `category`, `hooks[]` (cada com `text`, `style`, `score`)
   - Roteiros: `title`, `hook`, `body_sections[]`, `tone`, `duration_estimate_seconds`
5. **Para restaurar o padrao**: apague o valor no banco e a funcao usara o default hardcoded

### Restaurar prompt padrao via SQL

```sql
-- Restaurar prompt de insights (as funcoes usam o default se value = NULL ou vazio)
UPDATE app_configs SET value = '', updated_at = now()
WHERE key = 'content_studio_insights_prompt';
```

---

## 4. Monitoramento e Diagnostico

### Verificar saude do sistema

```sql
-- Resumo geral
SELECT 'insights' AS tipo, COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'new') AS novos
FROM content_insights
UNION ALL
SELECT 'ideas', COUNT(*), COUNT(*) FILTER (WHERE status = 'idea')
FROM content_ideas
UNION ALL
SELECT 'scripts', COUNT(*), COUNT(*) FILTER (WHERE status = 'draft')
FROM content_scripts;

-- Ultimas geracoes (sucesso vs erro)
SELECT generation_type, status, COUNT(*), MAX(created_at) AS ultima
FROM content_generation_logs
GROUP BY generation_type, status
ORDER BY generation_type;

-- Custo acumulado do Content Studio
SELECT edge_function, COUNT(*) AS chamadas, SUM(cost_usd) AS custo_total, AVG(cost_usd) AS custo_medio
FROM api_cost_logs
WHERE edge_function LIKE 'generate-content-%'
GROUP BY edge_function;
```

### Verificar erros recentes

```sql
SELECT generation_type, error_message, metadata, created_at
FROM content_generation_logs
WHERE status = 'error'
ORDER BY created_at DESC
LIMIT 10;
```

### Verificar cron job

```sql
-- Job existe e esta ativo?
SELECT jobname, schedule, active, command
FROM cron.job
WHERE jobname = 'generate-content-insights-weekly';

-- Ultimas execucoes do cron
SELECT jobid, runid, job_pid, status, return_message, start_time, end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'generate-content-insights-weekly')
ORDER BY start_time DESC
LIMIT 5;
```

### Logs das Edge Functions

No Supabase Dashboard → Edge Functions → selecionar funcao → Logs:
- Procure por `[generate-content-insights]`, `[generate-content-ideas]`, `[generate-content-script]`
- Cada funcao loga: inicio, dados coletados, resposta do LLM (tamanho), resultado do insert

---

## 5. Intervencoes Manuais

### Arquivar insights antigos

```sql
UPDATE content_insights
SET status = 'archived', updated_at = now()
WHERE status = 'new'
  AND created_at < now() - interval '30 days';
```

### Mudar status de uma ideia (ex: marcar como publicada)

```sql
UPDATE content_ideas
SET status = 'published', updated_at = now()
WHERE id = '<idea_uuid>';
```

### Descartar ideias antigas nao aprovadas

```sql
UPDATE content_ideas
SET status = 'discarded', updated_at = now()
WHERE status = 'idea'
  AND created_at < now() - interval '14 days';
```

### Deletar uma ideia e seus roteiros (cascade)

```sql
-- Scripts sao deletados automaticamente via ON DELETE CASCADE
DELETE FROM content_ideas WHERE id = '<idea_uuid>';
```

### Reagendar uma ideia via SQL

```sql
UPDATE content_ideas
SET scheduled_date = '2026-03-01', updated_at = now()
WHERE id = '<idea_uuid>';
```

### Forcar re-geracao de insights (limpar e gerar novamente)

```sql
-- 1. Arquivar insights antigos
UPDATE content_insights SET status = 'archived', updated_at = now()
WHERE status = 'new';

-- 2. Gerar novamente via UI ou chamando a funcao diretamente
-- Na UI: Content Studio → tab Insights → "Gerar Novos Insights"
```

---

## 6. Troubleshooting

### Problema: "Erro ao gerar insights" (toast vermelho)

**Causa provavel:** API LLM inativa ou sem credito.

1. Verificar `/admin/configuracoes-apis` — OpenAI e/ou Anthropic devem estar ativas
2. Verificar erro especifico:
   ```sql
   SELECT error_message, metadata FROM content_generation_logs
   WHERE status = 'error' ORDER BY created_at DESC LIMIT 1;
   ```
3. Se `insufficient_quota` ou `insufficient_credits`: recarregar creditos no provider
4. Se timeout: os dados podem ser muito grandes — tente periodo menor (7 dias em vez de 30)

### Problema: Insights gerados mas com baixa qualidade

1. Verificar se as tabelas-fonte tem dados suficientes:
   ```sql
   SELECT 'career_evaluations' AS tabela, COUNT(*) FROM career_evaluations WHERE processing_status = 'completed'
   UNION ALL SELECT 'community_posts', COUNT(*) FROM community_posts
   UNION ALL SELECT 'jobs', COUNT(*) FROM jobs WHERE is_active = true
   UNION ALL SELECT 'cancellation_surveys', COUNT(*) FROM subscription_cancellation_surveys
   UNION ALL SELECT 'course_progress', COUNT(*) FROM course_progress;
   ```
2. Se tabelas vazias: os insights serao genericos. Popule a base com mais dados
3. Edite o prompt (tab Prompts) para ser mais especifico sobre o que voce quer

### Problema: Hooks fracos / pouco polemicos

1. Editar o prompt de ideias (`content_studio_ideas_prompt`) — enfatizar provocacao
2. Exemplo de instrucao a adicionar:
   ```
   IMPORTANTE: Pelo menos 2 dos 5 hooks DEVEM ser provocativos.
   Use dados reais para criar afirmacoes contra-intuitivas.
   Ex: "87% dos brasileiros erram isso no curriculo americano"
   ```

### Problema: Roteiro muito curto / muito longo

1. Verificar `content_type` da ideia — `vertical_short` gera ~45s, `long_youtube` gera ~600s
2. Se a duracao nao bate, editar o prompt de roteiros com instrucao de duracao mais explicita
3. O campo `duration_estimate_seconds` e gerado pelo LLM — nao e enforcement real

### Problema: Cron nao esta rodando

1. Verificar se o job existe:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'generate-content-insights-weekly';
   ```
2. Se nao existe: rodar a migration `20260227200000_content_studio_cron.sql` novamente
3. Se existe mas `active = false`: reativar:
   ```sql
   UPDATE cron.job SET active = true WHERE jobname = 'generate-content-insights-weekly';
   ```
4. Verificar se `invoke_edge_function` funciona:
   ```sql
   SELECT * FROM app_configs WHERE key IN ('supabase_edge_url', 'internal_function_secret');
   ```
   Ambos devem ter valores preenchidos.

### Problema: Custos muito altos

1. Verificar custo por chamada:
   ```sql
   SELECT edge_function, model, cost_usd, created_at
   FROM api_cost_logs
   WHERE edge_function LIKE 'generate-content-%'
   ORDER BY cost_usd DESC
   LIMIT 10;
   ```
2. Roteiros YouTube (`long_youtube`) usam `maxTokens: 6000` — custam ~2x mais que verticais
3. Para reduzir custo: usar modelo mais barato no fallback (ex: `gpt-4o-mini`), ou reduzir a frequencia do cron
4. Insights usam 6 queries paralelas — o custo principal e o LLM, nao o banco

---

## 7. Seguranca e Permissoes

### RLS (Row Level Security)

Todas as 4 tabelas tem RLS ativo com politica `admin-only`:

```sql
-- Verificar RLS
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('content_insights', 'content_ideas', 'content_scripts', 'content_generation_logs');
-- Todos devem ter rowsecurity = true
```

Apenas usuarios com `has_role(auth.uid(), 'admin')` podem SELECT/INSERT/UPDATE/DELETE.

### Grants

```sql
-- Verificar grants (deve ter authenticated + service_role)
SELECT grantee, privilege_type FROM information_schema.table_privileges
WHERE table_name = 'content_insights' AND table_schema = 'public';
```

### Edge Functions

- `verify_jwt = false` no `config.toml` — o JWT NAO e verificado pelo gateway
- A autenticacao e feita pela funcao via `requireAdmin(req)` — aceita admin JWT OU `x-internal-secret` (para cron)
- Nunca remover `requireAdmin` — sem ele qualquer pessoa pode gerar conteudo

---

## 8. Manutencao Periodica

### Semanal

- [ ] Verificar se o cron de insights rodou (query da secao 4)
- [ ] Revisar insights da semana na UI
- [ ] Arquivar insights antigos nao usados

### Mensal

- [ ] Verificar custos acumulados em `/admin/custos-api`
- [ ] Limpar `content_generation_logs` antigos (opcional):
  ```sql
  DELETE FROM content_generation_logs WHERE created_at < now() - interval '90 days';
  ```
- [ ] Revisar e ajustar prompts baseado na qualidade dos outputs
- [ ] Descartar ideias antigas nao aprovadas

### Trimestral

- [ ] Avaliar se os tipos de insight estao cobrindo as necessidades
- [ ] Verificar se novas tabelas da base podem ser adicionadas como fonte de dados
- [ ] Avaliar custo-beneficio do modelo LLM em uso

---

## 9. Referencia de Arquivos

| Componente | Arquivo |
|-----------|---------|
| Pagina admin | `src/pages/admin/AdminContentStudio.tsx` |
| Hook (queries + mutations) | `src/hooks/useAdminContentStudio.ts` |
| Edge Function: Insights | `supabase/functions/generate-content-insights/index.ts` |
| Edge Function: Ideias | `supabase/functions/generate-content-ideas/index.ts` |
| Edge Function: Roteiros | `supabase/functions/generate-content-script/index.ts` |
| Migration: Tabelas | `supabase/migrations/20260227100000_content_studio.sql` |
| Migration: Cron | `supabase/migrations/20260227200000_content_studio_cron.sql` |
| Config TOML | `supabase/config.toml` |
| Rota | `src/App.tsx` (rota `/admin/content-studio`) |
| Sidebar | `src/components/layouts/SidebarNav.tsx` |
| LLM service | `supabase/functions/_shared/llmService.ts` |
| Auth guard | `supabase/functions/_shared/authGuard.ts` |
| Guia de testes E2E | `docs/20 Content Studio/E2E_TESTS.md` |
