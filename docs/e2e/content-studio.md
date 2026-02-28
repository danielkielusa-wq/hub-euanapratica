# Content Studio — Documentação de Testes E2E

> **Escopo:** Pipeline completo de geração de conteúdo com IA
> **Rota:** `/admin/content-studio`
> **Perfil requerido:** `admin`
> **Última atualização:** 2026-02-28

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [TC-01 — Aba Insights: Gerar novos insights](#tc-01--aba-insights-gerar-novos-insights)
3. [TC-02 — Aba Ideias: Gerar ideias a partir de insights](#tc-02--aba-ideias-gerar-ideias-a-partir-de-insights)
4. [TC-03 — Aba Ideias: Gerar ideia de tópico livre](#tc-03--aba-ideias-gerar-ideia-de-tópico-livre)
5. [TC-04 — Aba Roteiros: Gerar roteiro a partir de ideia](#tc-04--aba-roteiros-gerar-roteiro-a-partir-de-ideia)
6. [TC-05 — Aba Posts: Gerar posts sociais a partir de roteiro](#tc-05--aba-posts-gerar-posts-sociais-a-partir-de-roteiro)
7. [TC-06 — Aba Posts: Validar conteúdo gerado (LinkedIn + X)](#tc-06--aba-posts-validar-conteúdo-gerado-linkedin--x)
8. [TC-07 — Aba Posts: Copiar e gerenciar status](#tc-07--aba-posts-copiar-e-gerenciar-status)
9. [TC-08 — Calendário: Agendar roteiro via drag & drop](#tc-08--calendário-agendar-roteiro-via-drag--drop)
10. [TC-09 — Calendário: Agendar post social via drag & drop](#tc-09--calendário-agendar-post-social-via-drag--drop)
11. [TC-10 — Calendário: Desagendar item](#tc-10--calendário-desagendar-item)
12. [TC-11 — Pipeline Wizard: Execução completa (Steps 1–4)](#tc-11--pipeline-wizard-execução-completa-steps-14)
13. [TC-12 — Aba Prompts: Configurar prompt de posts sociais](#tc-12--aba-prompts-configurar-prompt-de-posts-sociais)
14. [TC-13 — Aba Prompts: Trocar API/LLM por etapa](#tc-13--aba-prompts-trocar-apillm-por-etapa)
15. [TC-14 — Botão de Ajuda: Verificar conteúdo de cada aba](#tc-14--botão-de-ajuda-verificar-conteúdo-de-cada-aba)
16. [TC-15 — Banco de dados: Validar registros inseridos](#tc-15--banco-de-dados-validar-registros-inseridos)
17. [TC-16 — Segurança: Acesso não-admin bloqueado](#tc-16--segurança-acesso-não-admin-bloqueado)
18. [Matriz de cobertura](#matriz-de-cobertura)

---

## 1. Pré-requisitos

### Ambiente
- Usuário admin logado em `/admin/content-studio`
- API key configurada em `/admin/configuracoes-apis` (OpenAI, Anthropic ou OpenRouter)
- `content_studio_api_key` salvo no dropdown da aba Prompts (ou fallback configurado)
- Banco com dados suficientes para mineração (pelo menos 5 leads com `career_evaluations` preenchidas)

### Dados de seed mínimos para TC-01
```sql
-- Verificar dados disponíveis para insights
SELECT COUNT(*) FROM career_evaluations WHERE processing_status = 'completed';
SELECT COUNT(*) FROM community_posts;
SELECT COUNT(*) FROM jobs WHERE is_active = true;
```
Se `career_evaluations < 3`, os insights ainda serão gerados mas com dados escassos — aceitável para teste.

### Nomenclatura de resultados esperados
- `✅ PASS` — Comportamento correto confirmado
- `❌ FAIL` — Bug encontrado, registrar com screenshot
- `⚠️ WARN` — Funcional mas com ressalva (ex: LLM retornou JSON mal formatado que foi parsed mesmo assim)

---

## TC-01 — Aba Insights: Gerar novos insights

**Objetivo:** Verificar que a Edge Function `generate-content-insights` é invocada, retorna dados válidos e os persiste no banco.

### Passos

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Navegar para `/admin/content-studio` | Aba **Insights** ativa por padrão |
| 2 | Selecionar período **7 dias** no dropdown | Dropdown atualiza para "7 dias" |
| 3 | Clicar em **"Gerar Novos Insights"** | Botão mostra spinner `Loader2`. Toast não aparece ainda. |
| 4 | Aguardar resposta (15-60s dependendo da LLM) | Spinner desaparece. Cards de insight aparecem na lista. |
| 5 | Verificar que pelo menos 1 insight foi gerado | Cards exibem: tipo com badge colorido, título, summary, relevance_score + controversy_score |
| 6 | Verificar score badges | Badge verde/laranja/vermelho de acordo com priority_score |
| 7 | Repetir com período **30 dias** e gerar novamente | Novos insights aparecem adicionados à lista (não substituem os anteriores) |

### Validação no banco
```sql
SELECT insight_type, title, relevance_score, controversy_score, priority_score
FROM content_insights
ORDER BY created_at DESC
LIMIT 10;
```
**Esperado:** Registros com `priority_score > 0`, sem campos `null` obrigatórios.

### Critérios de falha
- `❌` Botão não reage ao clique (verificar console por `FunctionsFetchError`)
- `❌` Toast de erro aparecer com "Unauthorized" → `verify_jwt = false` ausente no `config.toml`
- `❌` Lista permanece vazia após 60s → verificar logs da Edge Function no Dashboard Supabase
- `❌` Score badges não aparecem ou ficam todos cinza

---

## TC-02 — Aba Ideias: Gerar ideias a partir de insights

**Objetivo:** Verificar o fluxo Insight → Ideia e a qualidade do output da LLM.

### Pré-condição
- Pelo menos 2 insights gerados (TC-01 executado)

### Passos

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Na aba **Insights**, selecionar 2-3 insights com score > 60 clicando nas checkboxes | Checkbox marca, contador "X selecionados" aparece |
| 2 | Clicar em **"Gerar Ideias"** (botão que aparece com insights selecionados) | Spinner. Toast de loading. |
| 3 | Aguardar (20-45s) | Cards de ideia aparecem na aba Ideias |
| 4 | Navegar para aba **Ideias** | Lista exibe ideias geradas |
| 5 | Verificar campos de cada card | Título, categoria badge, virality_score (0-100), público-alvo |
| 6 | Expandir seção "hooks" de uma ideia | 3-5 hooks listados com estilo (question/claim/data/provocation) e score individual |
| 7 | Clicar em uma ideia para abrir o painel lateral | Sheet abre com: descrição, target_audience, hooks completos, breakdown de viralidade |

### Validação no banco
```sql
SELECT title, category, estimated_virality_score,
       jsonb_array_length(hooks) AS hook_count
FROM content_ideas
ORDER BY created_at DESC
LIMIT 5;
```
**Esperado:** `hook_count >= 3`, `estimated_virality_score` entre 0-100.

### Critérios de falha
- `❌` Ideias geradas sem hooks (array vazio)
- `❌` `estimated_virality_score = null`
- `❌` Título duplicado idêntico ao insight (a LLM deve ter criado um ângulo novo)

---

## TC-03 — Aba Ideias: Gerar ideia de tópico livre

**Objetivo:** Verificar geração sem insights como base.

### Passos

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Na aba **Ideias**, clicar em **"Gerar de Tópico Livre"** | Dialog abre com textarea |
| 2 | Digitar um tópico: `"Por que brasileiros com inglês intermediário conseguem emprego nos EUA"` | Texto inserido |
| 3 | Clicar **"Gerar"** | Dialog fecha, spinner aparece |
| 4 | Aguardar | Nova ideia aparece na lista |
| 5 | Verificar que a ideia reflete o tópico digitado | Título e description relacionados ao tema |

### Critério de falha
- `❌` Dialog fecha mas nenhuma ideia aparece após 60s

---

## TC-04 — Aba Roteiros: Gerar roteiro a partir de ideia

**Objetivo:** Verificar o fluxo Ideia → Roteiro e a estrutura do script gerado.

### Pré-condição
- Pelo menos 1 ideia disponível na aba Ideias

### Passos

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Na aba **Ideias**, localizar uma ideia com `virality_score >= 70` | Card visível |
| 2 | Clicar em **"Roteiro"** no card da ideia | Botão mostra spinner. Toast "Gerando roteiro..." |
| 3 | Aguardar (30-90s — roteiros são longos) | Navegação automática ou manual para aba **Roteiros** |
| 4 | Verificar estrutura do card do roteiro | Título, badges de plataforma e tom, score de viralidade, duração estimada |
| 5 | Expandir seção **Hook** | Texto do hook (primeiros 3-15s do vídeo) exibido |
| 6 | Expandir seções de **Corpo** | 2+ seções com: heading, conteúdo, data_callout (se houver), camera_note |
| 7 | Expandir **Publicação** | youtube_title, description, hashtags (array), thumbnail_ideas (2-3 itens) |
| 8 | Clicar **"Copiar Tudo"** | Toast "Copiado!". Colar em editor de texto e verificar formatação Markdown |

### Validação no banco
```sql
SELECT title, hook, platform, tone, virality_score,
       jsonb_array_length(body_sections) AS sections,
       (metadata->'publishing'->>'youtube_title') AS yt_title
FROM content_scripts
ORDER BY created_at DESC
LIMIT 3;
```
**Esperado:** `sections >= 2`, `hook` não nulo, `yt_title` preenchido.

### Critérios de falha
- `❌` Seções de corpo vazias (`body_sections = []`)
- `❌` `publishing.hashtags` vazio
- `❌` `virality_score = null` ou `= 0`
- `❌` "Copiar Tudo" copia string vazia

---

## TC-05 — Aba Posts: Gerar posts sociais a partir de roteiro

**Objetivo:** Verificar a geração de posts LinkedIn + X via botão "Gerar Posts" na aba Roteiros.

### Pré-condição
- Pelo menos 1 roteiro disponível na aba Roteiros

### Passos

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Na aba **Roteiros**, localizar qualquer roteiro | Card visível |
| 2 | Identificar o botão **"Gerar Posts"** no header do card (ao lado do dropdown de status e "Copiar Tudo") | Botão com ícone `Share2` visível |
| 3 | Clicar em **"Gerar Posts"** | Botão mostra spinner + texto "Gerando..." |
| 4 | Aguardar (15-40s) | Spinner desaparece. Toast de sucesso. |
| 5 | Navegar para aba **Posts** | 2 novos cards aparecem: 1 LinkedIn + 1 X |
| 6 | Verificar que os posts são do roteiro correto | Link "do roteiro: {título}" no footer de cada card |

### Critérios de falha
- `❌` Botão "Gerar Posts" não aparece no card → verificar que `onGeneratePosts` está sendo passado como prop em `ScriptsTab`
- `❌` Toast de erro: "script_id is required" → problema no payload da mutation
- `❌` Apenas 1 post gerado em vez de 2 → verificar log da Edge Function (parse da LLM falhou para uma plataforma)
- `❌` Posts gerados sem `script_id` vinculado → bug na Edge Function (não estava retornando `script_id` no INSERT)

---

## TC-06 — Aba Posts: Validar conteúdo gerado (LinkedIn + X)

**Objetivo:** Verificar a qualidade e conformidade do conteúdo gerado para cada plataforma.

### Pré-condição
- TC-05 executado com sucesso (2 posts disponíveis)

### Passos — LinkedIn

| # | Verificação | Critério de Aceite |
|---|-------------|-------------------|
| 1 | Badge de plataforma | Badge azul "LinkedIn" visível no topo do card |
| 2 | Conteúdo do post | Texto exibido com quebras de linha preservadas (`whitespace-pre-line`) |
| 3 | Tamanho do conteúdo | Contador de caracteres visível. Valor entre 800-2500 chars. Badge **não** em vermelho. |
| 4 | Hashtags | Lista de badges compactos com `#`. Pelo menos 3, máximo 5. |
| 5 | Tom | Badge de tom (professional/provocative/storytelling/data_driven/casual) |
| 6 | Hooks alternativos | Seção colapsável com 2+ hooks alternativos |
| 7 | Engagement tip | Texto específico para este post (não genérico) |

### Passos — X (Twitter)

| # | Verificação | Critério de Aceite |
|---|-------------|-------------------|
| 1 | Badge de plataforma | Badge preto "X" com texto branco |
| 2 | Conteúdo do tweet | Texto de até 280 caracteres |
| 3 | Contador de caracteres | **≤ 280**. Se > 280, badge **vermelho** de aviso aparece — isso é um bug a registrar |
| 4 | Tom | Geralmente `provocative` ou `data_driven` |
| 5 | Hooks alternativos | 2 tweets alternativos, cada um ≤ 280 chars |

### Critérios de falha
- `❌` Tweet X com mais de 280 caracteres **sem** badge de aviso vermelho → bug no SocialPostCard
- `❌` Tweet X com mais de 280 caracteres **com** aviso → registrar como `⚠️ WARN` (a LLM não respeitou a regra — ajustar prompt)
- `❌` LinkedIn sem hashtags
- `❌` Conteúdo em inglês (o prompt instrui pt-BR)
- `❌` Posts idênticos entre LinkedIn e X (devem ser abordagens distintas)

---

## TC-07 — Aba Posts: Copiar e gerenciar status

**Objetivo:** Verificar as ações disponíveis em cada post (copiar, alterar status, excluir).

### Passos

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Clicar **"Copiar"** em um post LinkedIn | Toast "Copiado!". Clipboard contém: conteúdo + hashtags concatenados |
| 2 | Alterar status de **Draft** → **Review** no dropdown | Dropdown atualiza. Banco atualiza (verificar sem reload) |
| 3 | Alterar status para **Aprovado** | Badge de status muda de cor (azul → verde) |
| 4 | Alterar status para **Publicado** | Badge muda para verde escuro |
| 5 | Clicar **"Excluir"** em um post | Dialog de confirmação. Confirmar. Post desaparece da lista. |

### Validação no banco
```sql
SELECT platform, status, content, array_length(hashtags, 1) AS hashtag_count
FROM content_social_posts
ORDER BY created_at DESC
LIMIT 5;
```

### Critérios de falha
- `❌` Status não persiste após reload da página
- `❌` Copiar inclui formatação JSON/markdown inesperada
- `❌` Post excluído ainda aparece após refresh

---

## TC-08 — Calendário: Agendar roteiro via drag & drop

**Objetivo:** Verificar que roteiros sem data podem ser arrastados para o calendário.

### Pré-condição
- Pelo menos 1 roteiro **sem** `scheduled_for` (aparece na zona "Sem data programada")

### Passos

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Navegar para aba **Calendário** | Grid mensal exibido. Zona "Sem data programada" abaixo. |
| 2 | Localizar um roteiro (pill roxo) na zona inferior | Pill visível com título truncado |
| 3 | Arrastar o pill para uma célula de data futura | Célula destino fica destacada (drop target visual) |
| 4 | Soltar o item | Pill desaparece da zona inferior e aparece na célula de destino |
| 5 | Verificar que o pill está na data correta | Borda roxa + título truncado na célula |
| 6 | Clicar no pill para abrir detalhes | Sheet lateral abre com: título, hook, tom, data agendada |
| 7 | Verificar data agendada no sheet | Deve corresponder à célula onde foi solto |

### Validação no banco
```sql
SELECT id, title, scheduled_for
FROM content_scripts
WHERE scheduled_for IS NOT NULL
ORDER BY scheduled_for DESC
LIMIT 3;
```

### Critérios de falha
- `❌` Pill não é arrastável (cursor não muda para `grab`)
- `❌` Drop na célula não move o item visualmente
- `❌` `scheduled_for` não atualiza no banco após soltar
- `❌` Item aparece na data errada (timezone mismatch)

---

## TC-09 — Calendário: Agendar post social via drag & drop

**Objetivo:** Verificar DnD para social posts — distinção visual e mutação correta.

### Pré-condição
- Pelo menos 1 social post sem `scheduled_for`

### Passos

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Localizar post social (pill com badge "LI" azul ou "X" preto) na zona inferior | Badge correto para a plataforma |
| 2 | Arrastar para uma célula de data | Drop target visual aparece |
| 3 | Soltar | Pill aparece na célula com badge de plataforma |
| 4 | Verificar distinção visual entre roteiro e post social na mesma célula | Roteiro: borda roxa. LinkedIn: borda azul. X: borda preta/cinza. |
| 5 | Clicar no post social no calendário | Sheet de detalhes do post abre (conteúdo, hashtags, platform, status) |
| 6 | Remover a data no sheet | Post volta para zona "Sem data programada" |

### Validação no banco
```sql
SELECT id, platform, scheduled_for
FROM content_social_posts
WHERE scheduled_for IS NOT NULL
ORDER BY scheduled_for DESC
LIMIT 3;
```

### Critérios de falha
- `❌` DnD de social post chama mutação de script (bug de tipo — verificar prefixo `social-` no `handleDragEnd`)
- `❌` Badge de plataforma ausente nas pills do calendário
- `❌` Mais de 3 itens visíveis em uma célula sem badge "+N mais"

---

## TC-10 — Calendário: Desagendar item

**Objetivo:** Verificar que arrastar um item de volta para a zona "Sem data" limpa o `scheduled_for`.

### Passos

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Localizar um item agendado no calendário | Pill visível em célula de data |
| 2 | Arrastar de volta para a zona **"Sem data programada"** | Zona fica destacada como drop target |
| 3 | Soltar | Item desaparece da célula e reaparece na zona inferior |

### Validação no banco
```sql
SELECT id, scheduled_for FROM content_scripts WHERE id = '<id_do_item>';
-- Deve retornar NULL
```

---

## TC-11 — Pipeline Wizard: Execução completa (Steps 1–4)

**Objetivo:** Verificar o fluxo completo do wizard: Insights → Ideias → Roteiros → Posts Sociais.

### Passos

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Na aba **Prompts**, clicar em **"Executar Pipeline"** | Wizard abre no Step 1 (Insights) |
| 2 | Verificar Step 1 em execução | Barra de progresso. Loading spinner. "Gerando insights..." |
| 3 | Aguardar Step 1 concluir | "X insights gerados." Step avança automaticamente para Step 2. |
| 4 | Aguardar Step 2 (Ideias) concluir | "X ideias geradas." Step avança para Step 3. |
| 5 | Aguardar Step 3 (Roteiros) concluir | Cards de roteiro gerados com título e score. Step 3 done. |
| 6 | Verificar footer do Step 3 | Dois botões: **"Pular Posts"** e **"Gerar Posts"** |
| 7 | Clicar **"Gerar Posts"** | Step 4 inicia. Loading com barra de progresso por roteiro. |
| 8 | Aguardar Step 4 concluir | Cards de posts com badge LinkedIn/X. Summary: "X posts gerados" |
| 9 | Clicar **"Pular Posts"** no Step 3 (em nova execução) | Wizard fecha sem gerar posts. |
| 10 | Verificar summary final no Step 4 | "X insights, Y ideias, Z roteiros, W posts sociais" |

### Validação no banco
```sql
-- Verificar que pipeline foi logado
SELECT generation_type, output_summary, status, duration_ms
FROM content_generation_logs
WHERE generation_type = 'pipeline'
ORDER BY created_at DESC
LIMIT 1;
```
**Esperado:** `output_summary` contém `insights=X, ideas=Y, scripts=Z, social_posts=W`.

### Critérios de falha
- `❌` Wizard trava no Step 1 sem avançar → Edge Function retornou erro
- `❌` Step 4 não aparece (WizardStep não foi atualizado para `1 | 2 | 3 | 4`)
- `❌` "Pular Posts" não fecha o wizard
- `❌` Summary final mostra `social_posts=0` mesmo com posts gerados

---

## TC-12 — Aba Prompts: Configurar prompt de posts sociais

**Objetivo:** Verificar que o prompt salvo em `app_configs` é usado na geração (não o DEFAULT da Edge Function).

### Passos

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Navegar para aba **Prompts** | Lista de cards de prompt visível |
| 2 | Localizar card **"Prompt de Posts Sociais"** | Card com label e description corretos |
| 3 | Clicar **"Editar Prompt"** | Textarea abre pré-populada com o prompt atual |
| 4 | Verificar que o prompt não está vazio | O prompt completo do Daniel deve estar presente (migração `20260228996000` aplicada) |
| 5 | Modificar uma linha do prompt (ex: adicionar `TESTE:` no início) | Edição reflete no textarea |
| 6 | Clicar **"Salvar Prompt"** | Toast "Prompt salvo". |
| 7 | Gerar posts para um roteiro (TC-05) | Nova geração usa o prompt modificado |
| 8 | Verificar no post gerado que a modificação teve efeito | (Difícil de validar diretamente — verificar custo logado no `/admin/custos-api` para confirmar que a geração rodou) |
| 9 | Restaurar o prompt original | Desfazer a modificação e salvar |

### Validação no banco
```sql
SELECT key, length(value) AS prompt_length
FROM app_configs
WHERE key IN ('content_studio_social_prompt', 'content_studio_social_api_key');
```
**Esperado:** `prompt_length > 3000` (prompt completo inserido).

### Critério de falha
- `❌` Campo de prompt vazio após migração → `20260228996000_seed_social_post_prompt.sql` não foi aplicado

---

## TC-13 — Aba Prompts: Trocar API/LLM por etapa

**Objetivo:** Verificar que o seletor de API por etapa funciona e persiste.

### Passos

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | No card **"Prompt de Posts Sociais"**, verificar dropdown de API | Dropdown mostra APIs disponíveis de `/admin/configuracoes-apis` |
| 2 | Selecionar uma API diferente da padrão | Dropdown atualiza |
| 3 | Reload da página | API selecionada persiste (lida do `app_configs`) |
| 4 | Selecionar **"API padrão (content_studio_api_key)"** | Reverte para a API padrão do Content Studio |

### Critério de falha
- `❌` Dropdown vazio → `useAvailableApis()` retornando array vazio → verificar query em `api_configs`

---

## TC-14 — Botão de Ajuda: Verificar conteúdo de cada aba

**Objetivo:** Confirmar que o `?` aparece em todas as abas e abre conteúdo relevante.

### Passos

| # | Aba | Verificação |
|---|-----|------------|
| 1 | **Insights** | Botão `?` visível ao lado de "Atualizar". Abre sheet com "O que são Insights?" |
| 2 | **Ideias** | Botão `?` visível. Sheet contém seção "Como gerar" com passos de checagem |
| 3 | **Roteiros** | Botão `?` visível. Sheet menciona "Gerar Posts Sociais" como próximo passo |
| 4 | **Posts** | Botão `?` visível. Sheet menciona limite de 280 chars para X |
| 5 | **Calendário** | Botão `?` visível no canto superior direito. Sheet explica legenda visual (borda roxa/azul/preta) |
| 6 | **Prompts** | Botão `?` visível ao lado de "Documentação". Sheet explica pipeline automático |
| 7 | Fechar sheet com `Esc` ou clicando fora | Sheet fecha. Estado da aba não é afetado. |

### Critérios de falha
- `❌` Botão `?` ausente em qualquer aba
- `❌` Sheet abre vazio ou sem título
- `❌` Fechar o sheet navega para outra aba inesperadamente

---

## TC-15 — Banco de dados: Validar registros inseridos

**Objetivo:** Verificar a integridade dos dados após execução de todos os TCs anteriores.

### Queries de validação

```sql
-- 1. Estrutura da tabela content_social_posts
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'content_social_posts'
ORDER BY ordinal_position;

-- 2. Posts gerados com metadados completos
SELECT
    platform,
    status,
    tone,
    length(content) AS content_length,
    array_length(hashtags, 1) AS hashtag_count,
    (metadata->>'character_count')::int AS char_count,
    metadata->>'best_posting_time' AS best_time,
    scheduled_for
FROM content_social_posts
ORDER BY created_at DESC
LIMIT 10;

-- 3. FK integra: todos os posts têm script válido
SELECT sp.id, sp.platform, cs.title AS script_title
FROM content_social_posts sp
JOIN content_scripts cs ON cs.id = sp.script_id
ORDER BY sp.created_at DESC
LIMIT 10;

-- 4. Nenhum post órfão (sem script)
SELECT COUNT(*) FROM content_social_posts sp
LEFT JOIN content_scripts cs ON cs.id = sp.script_id
WHERE cs.id IS NULL;
-- Esperado: 0

-- 5. Log de geração registrado
SELECT generation_type, input_summary, output_summary, status, cost_usd
FROM content_generation_logs
WHERE generation_type = 'social_post'
ORDER BY created_at DESC
LIMIT 5;

-- 6. Custo registrado para posts sociais
SELECT edge_function, model, input_tokens, output_tokens, cost_usd
FROM api_cost_logs
WHERE edge_function = 'generate-content-social-posts'
ORDER BY created_at DESC
LIMIT 5;
```

### Resultados esperados

| Validação | Esperado |
|-----------|----------|
| Posts LinkedIn | `content_length` entre 800-2500 |
| Posts X | `char_count` ≤ 280 |
| Posts órfãos | 0 |
| Log de geração | `status = 'success'`, `output_summary` preenchido |
| Custo | `cost_usd > 0` (se pricing configurado) |

---

## TC-16 — Segurança: Acesso não-admin bloqueado

**Objetivo:** Verificar que a RLS e a Edge Function bloqueiam usuários sem role admin.

### Passos

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Fazer login com usuário **sem** role admin | Autenticado normalmente |
| 2 | Tentar acessar `/admin/content-studio` diretamente via URL | Redirecionado para `/` ou tela de acesso negado |
| 3 | Tentar invocar a Edge Function diretamente com JWT do não-admin via curl | Resposta `401 {"error":"Unauthorized"}` |
| 4 | Tentar SELECT direto na tabela `content_social_posts` com anon key | `0 rows` retornado (RLS bloqueia) |

### Curl de validação (substituir `<USER_JWT>` e `<SUPABASE_URL>`)
```bash
curl -X POST "<SUPABASE_URL>/functions/v1/generate-content-social-posts" \
  -H "Authorization: Bearer <USER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"script_id":"00000000-0000-0000-0000-000000000000"}'
# Esperado: {"error":"Unauthorized"}
```

---

## Matriz de cobertura

| Componente | TC | Cobertura |
|------------|-----|-----------|
| Edge Function `generate-content-insights` | TC-01 | ✅ |
| Edge Function `generate-content-ideas` | TC-02, TC-03 | ✅ |
| Edge Function `generate-content-script` | TC-04 | ✅ |
| Edge Function `generate-content-social-posts` | TC-05, TC-06 | ✅ |
| Edge Function `run-content-pipeline` | TC-11 | ✅ |
| Aba Insights (UI) | TC-01 | ✅ |
| Aba Ideias (UI) | TC-02, TC-03 | ✅ |
| Aba Roteiros (UI + botão Gerar Posts) | TC-04, TC-05 | ✅ |
| Aba Posts (UI + copiar + status) | TC-06, TC-07 | ✅ |
| Calendário (DnD roteiros) | TC-08 | ✅ |
| Calendário (DnD social posts) | TC-09 | ✅ |
| Calendário (desagendar) | TC-10 | ✅ |
| Pipeline Wizard Step 4 | TC-11 | ✅ |
| Configuração de prompts | TC-12, TC-13 | ✅ |
| Botão de Ajuda (6 abas) | TC-14 | ✅ |
| Integridade de banco | TC-15 | ✅ |
| Segurança (RLS + Auth) | TC-16 | ✅ |
| Tabela `content_social_posts` | TC-15 | ✅ |
| `content_generation_logs` (social_post) | TC-15 | ✅ |
| `api_cost_logs` (social posts) | TC-15 | ✅ |

---

## Bugs conhecidos / limitações

| ID | Descrição | Severidade | Status |
|----|-----------|------------|--------|
| B-01 | LLM pode gerar tweet X com > 280 chars ignorando a instrução do prompt | Médio | Mitigado (badge vermelho de aviso na UI) |
| B-02 | Se a API key não está configurada, o erro retornado é genérico (sem indicar qual config está faltando) | Baixo | Open |
| B-03 | Arrastar muitos itens para o mesmo dia pode fazer a célula overflow sem scroll | Baixo | Open (usa "+N mais" como workaround) |

---

## Execução rápida (smoke test)

Para validar rapidamente que tudo está funcionando após um deploy:

```
1. Login como admin
2. /admin/content-studio → aba Insights → "Gerar Novos Insights" → aguardar cards
3. Aba Roteiros → "Gerar Posts" num roteiro existente → aguardar
4. Aba Posts → confirmar 2 cards (LinkedIn + X)
5. Aba Calendário → arrastar 1 post → confirmar posição na célula
6. Clicar ? em qualquer aba → confirmar que o sheet abre
```

Tempo estimado: **8-12 minutos** (limitado pelo tempo de resposta da LLM).
