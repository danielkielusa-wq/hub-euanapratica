# Content Studio — Manual de Testes E2E

**Última atualização:** 2026-02-26
**Escopo:** Todos os fluxos do Content Studio — geração de insights, ideias, roteiros, calendário editorial e gerenciamento de prompts.

---

## Pré-requisitos

### Dados mínimos necessários na base

Para que os insights sejam gerados com qualidade, as seguintes tabelas precisam ter dados:

| Tabela | Mínimo | Verificação |
|--------|--------|-------------|
| `career_evaluations` (com `processing_status = 'completed'`) | 10+ leads | `SELECT COUNT(*) FROM career_evaluations WHERE processing_status = 'completed';` |
| `community_posts` | 5+ posts | `SELECT COUNT(*) FROM community_posts;` |
| `jobs` (ativas) | 5+ vagas | `SELECT COUNT(*) FROM jobs WHERE is_active = true;` |
| `subscription_cancellation_surveys` | 3+ surveys | `SELECT COUNT(*) FROM subscription_cancellation_surveys;` |
| `course_progress` | 10+ registros | `SELECT COUNT(*) FROM course_progress;` |
| `title_translations` | 5+ traduções | `SELECT COUNT(*) FROM title_translations;` |

### Configurações necessárias

| Config | Tabela | Verificação |
|--------|--------|-------------|
| API LLM ativa (OpenAI ou Anthropic) | `api_configs` | `SELECT api_key, is_active FROM api_configs WHERE api_key IN ('openai_api', 'anthropic_api');` |
| Prompts do Content Studio | `app_configs` | `SELECT key FROM app_configs WHERE key LIKE 'content_studio_%';` (deve retornar 3 rows) |

### Usuário de teste

- Usuário com role `admin` logado na plataforma.
- Acesso ao menu lateral: **GESTÃO DO NEGÓCIO > Content Studio**.

---

## Glossário de Status

### Content Insights

| Status | Significado |
|--------|-------------|
| `new` | Insight recém-gerado, ainda não utilizado |
| `used` | Insight já foi utilizado para gerar ideias |
| `archived` | Insight arquivado manualmente |

### Content Ideas

| Status | Significado |
|--------|-------------|
| `idea` | Ideia gerada, aguardando avaliação |
| `approved` | Ideia aprovada para produção |
| `in_production` | Conteúdo em processo de gravação/criação |
| `published` | Conteúdo publicado |
| `discarded` | Ideia descartada |

### Content Scripts

| Status | Significado |
|--------|-------------|
| `draft` | Rascunho gerado pela AI |
| `review` | Em revisão pelo criador |
| `approved` | Roteiro aprovado para gravação |
| `recorded` | Roteiro já gravado |

### Tipos de Insight

| Tipo | Descrição |
|------|-----------|
| `barrier_radar` | Padrões nas barreiras dos leads |
| `area_trend` | Tendências por área profissional |
| `question_hot` | Perguntas quentes da comunidade |
| `job_highlight` | Destaques do mercado de trabalho |
| `churn_pattern` | Padrões de cancelamento |
| `engagement_gap` | Gaps de cobertura de conteúdo |

### Tipos de Conteúdo

| Tipo | Formato | Duração |
|------|---------|---------|
| `vertical_short` | Reels / Shorts / TikTok | 30-60s |
| `long_youtube` | Vídeo YouTube | 8-15min |
| `stories` | Stories Instagram | 15-30s |
| `carousel` | Carrossel Instagram | N/A |

### Categorias de Ideia

| Categoria | Descrição |
|-----------|-----------|
| `instructional` | Conteúdo educativo/instrucional |
| `polemic` | Conteúdo provocativo/controverso |
| `data_story` | Narrativa baseada em dados |
| `myth_busting` | Desmistificação com dados |
| `roast` | Análise crítica (ex: roast de currículo) |
| `vaga_da_semana` | Destaque de vaga real |

---

## 1. Acesso e Navegação

### TC-1.1: Acesso via sidebar

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Logar como admin | Dashboard carrega |
| 2 | No menu lateral, localizar seção "GESTÃO DO NEGÓCIO" | Seção visível com "Idea Kanban" e "Content Studio" |
| 3 | Clicar em "Content Studio" | Badge "AI" (azul/indigo) visível ao lado do item |
| 4 | Observar a página carregada | URL = `/admin/content-studio`. Header "Content Studio" com ícone roxo. 5 tabs visíveis: Insights, Ideias, Roteiros, Calendário, Prompts |
| 5 | Tab "Insights" selecionada por padrão | Tab Insights ativa (fundo branco, shadow) |

### TC-1.2: Navegação entre tabs

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Clicar na tab "Ideias" | Conteúdo muda para lista de ideias. Tab Ideias fica ativa |
| 2 | Clicar na tab "Roteiros" | Conteúdo muda para lista de roteiros |
| 3 | Clicar na tab "Calendário" | Conteúdo muda para grade de calendário |
| 4 | Clicar na tab "Prompts" | Conteúdo muda para editor de prompts |
| 5 | Clicar na tab "Insights" novamente | Volta para a tab de insights |

### TC-1.3: Acesso não-admin bloqueado

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Logar como usuário student (sem role admin) | Dashboard carrega |
| 2 | Navegar manualmente para `/admin/content-studio` | Redirecionado para dashboard ou página de acesso negado |

---

## 2. Geração de Insights

### TC-2.1: Gerar insights com período padrão (7 dias)

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Na tab Insights, verificar seletor de período | Dropdown mostra "7 dias" selecionado por padrão |
| 2 | Clicar no botão "Gerar Novos Insights" | Botão mostra spinner (Loader2 animado). Botão fica disabled |
| 3 | Aguardar processamento (10-30 segundos) | Toast de sucesso: "X insights gerados com sucesso" (onde X = 5-10) |
| 4 | Observar grid de cards | Cards aparecem organizados em grid (2 cols md, 3 cols xl) |
| 5 | Verificar estrutura de um card | Card contém: badge de tipo (colorido com ícone), título, resumo (max 3 linhas), barra de Relevância (azul), barra de Polêmica (vermelha), período, botão "Gerar Ideias" |

### TC-2.2: Gerar insights com período 30 dias

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Alterar seletor de período para "30 dias" | Dropdown mostra "30 dias" |
| 2 | Clicar "Gerar Novos Insights" | Processamento inicia. Pode demorar mais (mais dados) |
| 3 | Aguardar resultado | Novos insights aparecem com `period_start` e `period_end` cobrindo 30 dias |

### TC-2.3: Filtrar insights por tipo

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | No dropdown de tipo, selecionar "Barreiras" | Lista filtra para mostrar apenas insights do tipo `barrier_radar` |
| 2 | Selecionar "Vaga" | Lista filtra para `job_highlight` |
| 3 | Selecionar "Todos os tipos" | Todos os insights voltam a aparecer |

### TC-2.4: Ver dados detalhados de um insight

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Em um card de insight, clicar "Ver dados" | Seção expande com JSON formatado dos data_points |
| 2 | Clicar "Ver dados" novamente | Seção colapsa |

### TC-2.5: Estado vazio

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Acessar Content Studio sem nenhum insight gerado | Mensagem "Nenhum insight gerado ainda." com ícone de Lightbulb e texto orientando a clicar "Gerar Novos Insights" |

### TC-2.6: Erro de API (sem chave LLM configurada)

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Desativar todas as API keys LLM em `/admin/configuracoes-apis` | Keys marcadas como inativas |
| 2 | Tentar gerar insights | Toast de erro vermelho com mensagem descritiva |
| 3 | Reativar API key | Key ativa novamente |

**Validação SQL:**
```sql
-- Verificar insights gerados
SELECT id, insight_type, title, relevance_score, controversy_score, status, created_at
FROM content_insights
ORDER BY created_at DESC
LIMIT 10;

-- Verificar log de geração
SELECT generation_type, output_summary, model_used, tokens_used, duration_ms, status
FROM content_generation_logs
WHERE generation_type = 'insights'
ORDER BY created_at DESC
LIMIT 5;

-- Verificar custo da chamada LLM
SELECT edge_function, provider, model, cost_usd, created_at
FROM api_cost_logs
WHERE edge_function = 'generate-content-insights'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 3. Geração de Ideias

### TC-3.1: Gerar ideias a partir de um insight

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Na tab Insights, localizar um insight com status "new" | Botão "Gerar Ideias" habilitado |
| 2 | Clicar "Gerar Ideias" | Spinner no botão. Botão disabled |
| 3 | Aguardar processamento (10-20 segundos) | Toast: "X ideias geradas" |
| 4 | Observar que o insight mudou para status "used" | Badge "Usado" (verde) aparece no card. Botão "Gerar Ideias" fica disabled |
| 5 | Navegar para tab "Ideias" | Novas ideias aparecem na lista |

### TC-3.2: Gerar ideias de tópico livre

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Na tab Ideias, clicar "Gerar de Tópico Livre" | Dialog abre com textarea |
| 2 | Digitar "diferenças culturais no trabalho entre Brasil e EUA" | Texto aparece na textarea |
| 3 | Clicar "Gerar" | Dialog fecha. Processamento inicia |
| 4 | Aguardar resultado | Toast: "X ideias geradas". Ideias aparecem na lista |

### TC-3.3: Tópico livre vazio

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Abrir dialog de tópico livre | Textarea vazia |
| 2 | Observar botão "Gerar" | Botão disabled (textarea vazia) |
| 3 | Digitar algo e apagar | Botão volta a disabled |

### TC-3.4: Verificar estrutura de uma ideia

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Na tab Ideias, observar um card de ideia | Card contém: score de viralidade (círculo), título clicável, badges (tipo de conteúdo, categoria, prioridade), descrição, link "X hooks" colapsável |
| 2 | Clicar no link "X hooks" | Lista de hooks expande: cada hook tem badge de estilo (question/claim/data/provocation), texto do hook, score numérico |
| 3 | Clicar novamente | Hooks colapsam |

### TC-3.5: Filtrar ideias

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | No dropdown de status, selecionar "Aprovada" | Lista filtra para ideias com status "approved" |
| 2 | No dropdown de categoria, selecionar "Polêmica" | Lista filtra para categoria "polemic" |
| 3 | Selecionar "Todos" em ambos | Lista completa volta |

### TC-3.6: Ver detalhe de uma ideia

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Clicar no título de uma ideia | Sheet (painel lateral) abre à direita |
| 2 | Observar conteúdo do painel | Mostra: descrição, público-alvo, todos os hooks com badges, dados utilizados (JSON), notas |
| 3 | Clicar fora ou no X | Painel fecha |

### TC-3.7: Alterar status de uma ideia

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | No card de uma ideia, localizar dropdown de status | Dropdown mostra status atual (ex: "Ideia") |
| 2 | Alterar para "Aprovada" | Status muda imediatamente. Card reflete novo status |
| 3 | Verificar no banco | `SELECT status FROM content_ideas WHERE id = '<id>';` retorna `approved` |

### TC-3.8: Deletar uma ideia

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Clicar no ícone de lixeira (vermelho) em uma ideia | Ideia removida da lista |
| 2 | Toast de confirmação | "Ideia removida" |

**Validação SQL:**
```sql
-- Verificar ideias geradas
SELECT id, title, content_type, category, estimated_virality_score, status,
       jsonb_array_length(hooks) AS hook_count
FROM content_ideas
ORDER BY created_at DESC
LIMIT 10;

-- Verificar hooks de uma ideia específica
SELECT id, title, hooks
FROM content_ideas
WHERE id = '<idea_id>';
```

---

## 4. Geração de Roteiros

### TC-4.1: Gerar roteiro a partir de uma ideia

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Na tab Ideias, localizar uma ideia e clicar botão "Roteiro" | Spinner no botão. Botão disabled |
| 2 | Aguardar processamento (15-30 segundos) | Toast: "Roteiro gerado com sucesso" |
| 3 | Navegar para tab "Roteiros" | Novo roteiro aparece na lista |

### TC-4.2: Verificar estrutura de um roteiro

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Na tab Roteiros, observar um card de roteiro | Card contém: título, badges (plataforma, tom, duração), dropdown de status, botão "Copiar Tudo" |
| 2 | Verificar seção HOOK | Fundo gradiente roxo/rosa. Texto do hook destacado. Ícone de copiar |
| 3 | Clicar "X seções" para expandir | Body sections aparecem como cards individuais: heading, conteúdo, dado destacado (azul), nota de câmera (amarelo) |
| 4 | Verificar seção CTA (se existir) | Card verde com texto do CTA |

### TC-4.3: Copiar conteúdo do roteiro

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Clicar no ícone de copiar ao lado do HOOK | Ícone muda para check (2 segundos). Hook copiado para clipboard |
| 2 | Colar em editor de texto | Texto do hook colado corretamente |
| 3 | Clicar "Copiar Tudo" | Ícone muda para check. Roteiro completo formatado copiado |
| 4 | Colar em editor de texto | Roteiro com headers Markdown, seções, dados e CTA |

### TC-4.4: Copiar seção individual

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Expandir seções do roteiro | Seções visíveis |
| 2 | Clicar no ícone de copiar de uma seção | Ícone muda para check. Conteúdo da seção copiado |

### TC-4.5: Alterar status do roteiro

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | No dropdown de status, selecionar "Review" | Status muda |
| 2 | Selecionar "Aprovado" | Status muda |
| 3 | Selecionar "Gravado" | Status muda |

### TC-4.6: Roteiro para vídeo longo vs. curto

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Gerar roteiro de uma ideia tipo `vertical_short` | Roteiro com ~4-5 seções. Duração estimada 30-60s. Plataforma: instagram_reels |
| 2 | Gerar roteiro de uma ideia tipo `long_youtube` | Roteiro com ~6-8 seções. Duração estimada 480-900s. Plataforma: youtube. Camera_notes mais detalhados |

**Validação SQL:**
```sql
-- Verificar roteiros gerados
SELECT id, title, platform, tone, duration_estimate_seconds, status,
       jsonb_array_length(body_sections) AS section_count
FROM content_scripts
ORDER BY created_at DESC
LIMIT 10;

-- Verificar seções de um roteiro
SELECT id, title, hook, body_sections, cta
FROM content_scripts
WHERE id = '<script_id>';
```

---

## 5. Calendário Editorial

### TC-5.1: Visualizar calendário

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Navegar para tab "Calendário" | Grid de 14 dias visível. 7 colunas (Dom-Sáb). Dia atual destacado (borda roxa) |
| 2 | Verificar indicador YouTube | Ter e Qui mostram "YT" em vermelho no canto |
| 3 | Verificar contagem no topo | Texto "X agendada(s) · Y sem data" |

### TC-5.2: Agendar uma ideia

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Na seção "Sem data", clicar em uma ideia | Dialog "Agendar Conteúdo" abre com título da ideia e input de data |
| 2 | Selecionar uma data | Input preenchido |
| 3 | Clicar "Salvar" | Dialog fecha. Ideia aparece no calendário na data selecionada como pill colorido |

### TC-5.3: Reagendar uma ideia

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | No calendário, clicar em uma ideia agendada | Dialog abre com data atual preenchida |
| 2 | Alterar para outra data | Input atualizado |
| 3 | Clicar "Salvar" | Ideia move para nova data no grid |

### TC-5.4: Remover data de uma ideia

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Clicar em uma ideia agendada no calendário | Dialog abre |
| 2 | Clicar "Remover Data" | Dialog fecha. Ideia sai do grid e volta para lista "Sem data" |

### TC-5.5: Cores por tipo de conteúdo

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Agendar ideias de diferentes tipos | Vertical: pill azul/indigo. YouTube: pill vermelho. Stories: pill rosa. Carrossel: pill amarelo |

---

## 6. Gerenciamento de Prompts

### TC-6.1: Visualizar prompts

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Navegar para tab "Prompts" | 3 cards visíveis: Prompt de Insights, Prompt de Ideias, Prompt de Roteiros |
| 2 | Cada card mostra | Título, descrição, preview do prompt (max 500 chars), botão "Editar" |

### TC-6.2: Editar um prompt

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Clicar "Editar" no card "Prompt de Insights" | Dialog abre com textarea monospace preenchida com o prompt atual |
| 2 | Verificar contador de caracteres | Número de caracteres visível abaixo da textarea |
| 3 | Modificar o texto (ex: adicionar uma instrução) | Texto alterado. Contador atualiza |
| 4 | Clicar "Salvar" | Dialog fecha. Toast: "Prompt salvo com sucesso" |
| 5 | Verificar preview no card | Preview atualizado com novo texto |

### TC-6.3: Cancelar edição

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Abrir editor de um prompt | Dialog com textarea |
| 2 | Modificar texto | Texto alterado |
| 3 | Clicar "Cancelar" | Dialog fecha. Prompt NÃO foi alterado (preview mantém original) |

### TC-6.4: Prompt editado afeta geração

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Editar o prompt de Insights, adicionando: "Sempre inclua exatamente 3 insights, não mais." | Prompt salvo |
| 2 | Gerar novos insights | Resultado contém exatamente 3 insights (ou próximo de 3) |
| 3 | Reverter o prompt para o original | Prompt restaurado |

**Validação SQL:**
```sql
-- Verificar prompts salvos
SELECT key, LENGTH(value) AS chars, updated_at
FROM app_configs
WHERE key LIKE 'content_studio_%';
```

---

## 7. Fluxo Completo E2E (Happy Path)

### TC-7.1: Fluxo de ponta a ponta

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Acessar `/admin/content-studio` | Página carrega na tab Insights |
| 2 | Clicar "Gerar Novos Insights" (7 dias) | 5-10 insights gerados com scores |
| 3 | Identificar o insight com maior `controversy_score` | Card com barra vermelha mais cheia |
| 4 | Clicar "Gerar Ideias" nesse insight | 5-10 ideias geradas |
| 5 | Ir para tab Ideias | Ideias listadas com hooks |
| 6 | Abrir hooks de uma ideia "polemic" | Pelo menos 1 hook com estilo "provocation" |
| 7 | Alterar status para "Aprovada" | Status muda |
| 8 | Clicar "Roteiro" | Roteiro gerado |
| 9 | Ir para tab Roteiros | Roteiro listado com hook destacado, seções, CTA |
| 10 | Copiar roteiro completo | Texto formatado no clipboard |
| 11 | Ir para tab Calendário | Calendário visível |
| 12 | Agendar a ideia aprovada para amanhã | Pill colorido aparece na data |
| 13 | Ir para tab Prompts | 3 prompts editáveis |
| 14 | Verificar que prompts não estão vazios | Preview mostra texto dos prompts |

---

## 8. Testes de Integração

### TC-8.1: Custo da API registrado

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Gerar insights | Insights criados |
| 2 | Acessar `/admin/custos-api` | Nova entrada para `generate-content-insights` com custo > $0 |

### TC-8.2: Log de geração registrado

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Gerar insights, ideias e roteiro | Operações concluídas |
| 2 | Verificar SQL | 3 registros em `content_generation_logs` com `status = 'success'`, `model_used` preenchido, `tokens_used > 0`, `duration_ms > 0` |

### TC-8.3: Cron job configurado

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Verificar SQL | `SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'generate-content-insights-weekly';` retorna 1 row com schedule `0 8 * * 1` |

---

## 9. Casos de Borda

### TC-9.1: Gerar ideias sem insights (tópico livre)

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Sem nenhum insight gerado, ir para tab Ideias | Estado vazio com orientação |
| 2 | Clicar "Gerar de Tópico Livre" e digitar "visto EB-2 NIW" | Ideias geradas sem `insight_id` associado |

### TC-9.2: Gerar roteiro para ideia sem insight

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Gerar ideias via tópico livre (sem insight associado) | Ideias criadas com `insight_id = null` |
| 2 | Gerar roteiro para uma dessas ideias | Roteiro gerado normalmente. Campo `data_sources_summary` pode ser genérico |

### TC-9.3: Múltiplas gerações simultâneas

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Clicar "Gerar Novos Insights" | Botão fica disabled com spinner |
| 2 | Tentar clicar novamente durante processamento | Botão permanece disabled. Não duplica a chamada |

### TC-9.4: Base de dados vazia

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Com `career_evaluations` vazia, gerar insights | LLM recebe dados zerados. Insights gerados podem ter qualidade menor mas não devem dar erro. Alternativamente, toast de erro se a função tratar dados insuficientes |

---

## Checklist de Regressão Rápida (Smoke)

- [ ] Acesso `/admin/content-studio` como admin carrega corretamente
- [ ] 5 tabs navegáveis (Insights, Ideias, Roteiros, Calendário, Prompts)
- [ ] "Gerar Novos Insights" funciona e mostra toast de sucesso
- [ ] Cards de insight mostram tipo, título, resumo, scores
- [ ] "Gerar Ideias" a partir de insight funciona
- [ ] Insight muda para status "used" após gerar ideias
- [ ] Ideias mostram hooks collapsíveis
- [ ] "Gerar de Tópico Livre" abre dialog e funciona
- [ ] Alterar status de ideia funciona (dropdown inline)
- [ ] "Roteiro" a partir de ideia gera script
- [ ] Roteiro mostra hook destacado + seções expansíveis
- [ ] "Copiar Tudo" copia roteiro formatado
- [ ] Calendário mostra 14 dias com indicadores YT (ter/qui)
- [ ] Agendar/reagendar/remover data funciona
- [ ] Tab Prompts mostra 3 prompts editáveis
- [ ] Editar e salvar prompt funciona
- [ ] `api_cost_logs` registra custos das chamadas LLM
- [ ] `content_generation_logs` registra todas as gerações

---

## Queries Úteis para Validação

```sql
-- Contar todos os registros por tabela
SELECT 'insights' AS tipo, COUNT(*) FROM content_insights
UNION ALL
SELECT 'ideas', COUNT(*) FROM content_ideas
UNION ALL
SELECT 'scripts', COUNT(*) FROM content_scripts
UNION ALL
SELECT 'gen_logs', COUNT(*) FROM content_generation_logs;

-- Insights por tipo
SELECT insight_type, COUNT(*), AVG(relevance_score) AS avg_relevance, AVG(controversy_score) AS avg_controversy
FROM content_insights
GROUP BY insight_type
ORDER BY COUNT(*) DESC;

-- Ideias por status
SELECT status, COUNT(*)
FROM content_ideas
GROUP BY status;

-- Ideias agendadas (calendário)
SELECT scheduled_date, title, content_type, category
FROM content_ideas
WHERE scheduled_date IS NOT NULL
ORDER BY scheduled_date;

-- Custos do Content Studio
SELECT edge_function, COUNT(*), SUM(cost_usd) AS total_cost, AVG(cost_usd) AS avg_cost
FROM api_cost_logs
WHERE edge_function LIKE 'generate-content-%'
GROUP BY edge_function;

-- Logs de geração com erro
SELECT generation_type, error_message, created_at
FROM content_generation_logs
WHERE status = 'error'
ORDER BY created_at DESC;

-- Limpar dados para re-testar (CUIDADO - DESTRUTIVO)
-- DELETE FROM content_scripts;
-- DELETE FROM content_ideas;
-- DELETE FROM content_insights;
-- DELETE FROM content_generation_logs;
```

---

## Referência de Arquivos

| Componente | Arquivo |
|-----------|---------|
| Página admin | `src/pages/admin/AdminContentStudio.tsx` |
| Hook (queries + mutations) | `src/hooks/useAdminContentStudio.ts` |
| Edge Function: Insights | `supabase/functions/generate-content-insights/index.ts` |
| Edge Function: Ideias | `supabase/functions/generate-content-ideas/index.ts` |
| Edge Function: Roteiros | `supabase/functions/generate-content-script/index.ts` |
| Migration: Tabelas | `supabase/migrations/20260227100000_content_studio.sql` |
| Migration: Cron | `supabase/migrations/20260227200000_content_studio_cron.sql` |
| Config TOML | `supabase/config.toml` (3 entries: verify_jwt = false) |
| Rota | `src/App.tsx` (rota `/admin/content-studio`) |
| Sidebar | `src/components/layouts/SidebarNav.tsx` (item Content Studio) |
| Shared: LLM service | `supabase/functions/_shared/llmService.ts` |
| Shared: Auth guard | `supabase/functions/_shared/authGuard.ts` |
