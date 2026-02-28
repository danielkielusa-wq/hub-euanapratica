# Hub Dashboard — Guia do Administrador

> Como configurar, monitorar e personalizar o Hub Dashboard do aluno via painel de administração.

---

## Acesso Admin

| Painel | Rota | O que configura |
|--------|------|-----------------|
| Hub Dashboard Config | `/admin/hub-config` | Layout, seções, saudações, social proof, ferramentas |
| Produtos (Hub Services) | `/admin/produtos` | Serviços, preços, dimensão do relatório |
| Menu do App | `/admin/menu-config` | Visibilidade de itens no menu lateral |

---

## 1. Configuração do Hub — `/admin/hub-config`

O painel de configuração do hub tem **5 abas**:

### Aba 1: Layout

Controla **ordem** e **visibilidade** das 9 seções do hub.

| Seção | ID | O que exibe |
|-------|----|-------------|
| Hero com Score | `career_hero` | Score de prontidão, fase, temperatura, diagnóstico |
| Próximo Passo Inteligente | `smart_next_step` | Ação prioritária sugerida ao aluno |
| Itens Ativos (Minha Jornada) | `active_items` | Serviços comprados/ativos agrupados por status |
| Dimensões de Carreira | `career_dimensions` | Barras de score por dimensão + social proof |
| Pulso da Comunidade | `community_pulse` | Posts hoje, destaque da semana, engajamento |
| Upsell Inteligente | `smart_upsell` | Card de venda personalizado por dimensão fraca |
| Ferramentas Rápidas | `quick_tools` | Strip de atalhos (ResumePass, Translator, Prime Jobs) |
| Checklist Primeiros Passos | `getting_started` | Onboarding checklist para novos usuários |
| Serviços Secundários | `secondary_services` | Grid de serviços adicionais |

**Como reordenar:**
- Use as setas ↑ ↓ para mover seções para cima/baixo
- A ordem no painel = ordem exibida no hub do aluno
- Clique em "Salvar" para persistir

**Como ocultar/exibir:**
- Toggle (switch) ao lado de cada seção
- Seção desligada = não renderiza no hub, mesmo que tenha dados
- Útil para A/B testing ou lançamento gradual de features

---

### Aba 2: Saudações

Templates de texto exibidos no hero do hub. Use `{name}` para inserir o primeiro nome do aluno.

| Período | Horário | Default |
|---------|---------|---------|
| Manhã | Antes das 12h | "Bom dia, {name}! Veja como está sua jornada." |
| Tarde | 12h - 18h | "Boa tarde, {name}! Veja como está sua jornada." |
| Noite | Após 18h | "Boa noite, {name}! Veja como está sua jornada." |
| Sem relatório | Qualquer horário | "Olá {name}! Comece sua jornada com suas ferramentas gratuitas." |

**Regra de exibição:**
- Aluno COM relatório de carreira → usa template do período
- Aluno SEM relatório → sempre usa "Sem relatório" (independente do horário)

---

### Aba 3: Social Proof

Textos de prova social exibidos nas seções **Dimensões** e **Upsell**.

#### Por Dimensão

Para cada dimensão do relatório de carreira, defina um texto motivacional:

| Dimensão | ID | Default |
|----------|----|---------|
| Inglês | `english` | "Alunos que melhoraram Inglês conseguiram emprego 3x mais rápido" |
| Experiência | `experience` | "Profissionais que otimizaram experiência receberam 40% mais convites" |
| Objetivo | `objective` | "Definir objetivo claro acelera a transição em até 2 meses" |
| Cronograma | `timeline` | "Ter um cronograma claro dobra suas chances de sucesso" |
| Visto/Imigração | `visa_immigration` | "Entender o processo de visto evita 80% dos erros comuns" |
| Financeiro | `financial_context` | "Planejamento financeiro é o #1 fator de sucesso na mudança" |
| Prontidão Mental | `mental_readiness` | "Mentalidade preparada reduz o tempo de adaptação pela metade" |
| Família | `family_context` | "Alinhamento familiar aumenta em 70% a chance de permanecer" |

**Onde aparece:**
- Na seção **Dimensões**: abaixo das barras de progresso, relacionado à dimensão mais fraca do aluno
- Na seção **Upsell**: como texto itálico ao lado do serviço recomendado

#### Texto Geral (Fallback)

Usado quando o upsell **não** é personalizado por dimensão:
- Default: "Mais de 200 alunos já transformaram suas carreiras"

---

### Aba 4: Próximo Passo

#### Prioridade do Próximo Passo Inteligente

Define a **ordem de prioridade** dos tipos de sugestão. O primeiro tipo com dados disponíveis é exibido ao aluno.

| Posição | Tipo | O que detecta |
|---------|------|---------------|
| 1 (default) | Consultoria não agendada | `user_hub_services` consulting com status needs_action |
| 2 | Evento nas próximas 24h | Booking/sessão com datetime < agora + 24h |
| 3 | Ação recomendada do relatório | `barriers_analysis.recommended_first_action` |
| 4 | Item pendente do checklist | Primeiro item incompleto do Getting Started |
| 5 | Sugestão de currículo | Dimensão fraca = experience OU gap com "currículo" |
| 6 | Incentivo à comunidade | Sem post ou último post > 7 dias |

**Como reordenar:**
- Setas ↑ ↓ para mover tipos
- Ex: Mover "Incentivo à comunidade" para posição 1 faz o aluno ver sempre o CTA de comunidade primeiro (se qualificar)

#### Pulso da Comunidade

| Configuração | Default | Descrição |
|-------------|---------|-----------|
| Período de trending (dias) | 7 | Quantos dias considerar para "post destaque" |
| Mostrar post destaque | ✅ Ativado | Toggle para exibir/ocultar o card do top post |
| CTA sem atividade | "Seja o primeiro a postar hoje!" | Texto exibido quando o aluno não tem posts |

---

### Aba 5: Ferramentas

Controla quais ferramentas aparecem no strip de atalhos rápidos:

| Ferramenta | ID | Rota |
|------------|----|------|
| ResumePass AI | `resume_pass` | `/curriculo` |
| Title Translator | `title_translator` | `/title-translator` |
| Prime Jobs | `prime_jobs` | `/prime-jobs` |

Toggle cada ferramenta on/off. Novas ferramentas requerem alteração no código (`TOOL_DEFS` em `QuickToolsStrip.tsx`).

---

## 2. Vinculando Serviço a Dimensão do Relatório

Para ativar o **upsell personalizado**, vincule serviços a dimensões do relatório de carreira.

### Como Configurar

1. Ir para `/admin/produtos`
2. Editar o serviço desejado
3. No campo **"Dimensão do Relatório"**, selecionar a dimensão correspondente
4. Salvar

| Dimensão | Valor no banco | Serviço sugerido (exemplo) |
|----------|----------------|---------------------------|
| Inglês | `english` | Consultoria de Inglês |
| Experiência | `experience` | ResumePass / Consultoria de Carreira |
| Objetivo | `objective` | Sessão de Mentoria |
| Cronograma | `timeline` | Planejamento de Carreira |
| Visto/Imigração | `visa_immigration` | Consultoria de Imigração |
| Financeiro | `financial_context` | Planejamento Financeiro |
| Prontidão Mental | `mental_readiness` | Coaching de Mentalidade |
| Família | `family_context` | Sessão Familiar |

### Como Funciona

1. Aluno acessa o hub
2. `useCareerInsights` identifica a dimensão mais fraca (ex: `english`, score 8/20)
3. `useDimensionService` busca `hub_services` com `report_dimension = 'english'` e `is_visible_in_hub = true`
4. Se encontrar → seção **Dimensões** mostra "Melhorar Inglês →" e seção **Upsell** exibe esse serviço
5. Se NÃO encontrar → Dimensões mostra apenas social proof (sem CTA), Upsell usa highlighted service

**Regras:**
- Apenas 1 serviço por dimensão (query retorna `limit 1`)
- O serviço precisa ter `is_visible_in_hub = true`
- Se um serviço tem `report_dimension` mas não é visible no hub → não é considerado
- Múltiplos serviços com a mesma dimensão → o primeiro retornado pelo banco é usado

---

## 3. Como os Dados Chegam ao Hub

### Career Hero & Dimensões

| Dado | Fonte | Tabela |
|------|-------|--------|
| Score de prontidão | Relatório de carreira | `career_evaluations.readiness_score` |
| Fase | Relatório V2 | `formatted_report → phase_classification` |
| Temperatura | Qualificação do lead | `career_evaluations.lead_temperature` |
| Diagnóstico curto | Relatório V2 | `formatted_report → phase_classification.short_diagnosis` |
| Dimensões (barras) | Relatório V2 | `formatted_report → scoring.score_breakdown` + `detailed_analysis` |
| Ação recomendada | Relatório V2 | `formatted_report → barriers_analysis.recommended_first_action` |
| Gaps críticos | Relatório V2 | `formatted_report → web_report_data.key_metrics.critical_gaps` |
| Pontos fortes | Relatório V2 | `formatted_report → web_report_data.key_metrics.strengths` |

> **Importante:** Apenas relatórios no formato V2 (`report_version: 2`) fornecem dimensões detalhadas. Relatórios V1 mostram apenas o score genérico.

### Community Pulse

| Dado | Query |
|------|-------|
| Posts hoje | `community_posts` WHERE `created_at >= hoje` (count) |
| Top post | `community_posts` últimos N dias, ORDER BY `likes_count` DESC |
| Último post do aluno | `community_posts` WHERE `user_id = aluno`, mais recente |

### Smart Next Step

Não faz queries adicionais. Combina dados de:
- `useMyHub()` → seções/itens ativos
- `useChecklistStatus()` → checklist de onboarding
- `useCareerInsights()` → ação recomendada do relatório
- `useCommunityPulse()` → atividade de comunidade

---

## 4. Armazenamento Técnico

Toda a configuração fica em uma **única row** na tabela `app_configs`:

```sql
SELECT key, value FROM app_configs WHERE key = 'hub_dashboard_config';
```

O valor é um JSON com a estrutura `HubDashboardConfig`. O admin UI (`/admin/hub-config`) edita esse JSON via `useAppConfigs().updateConfig()`.

**Defaults:** Se a config não existir ou estiver corrompida, o hook `useHubDashboardConfig` retorna `DEFAULT_CONFIG` hardcoded (todas as seções visíveis, ordem padrão, textos padrão). O hub **nunca** quebra por config ausente.

**Cache:** TanStack Query com `staleTime: 5min`. Após editar pelo admin, o aluno verá as mudanças em até 5 minutos (ou ao recarregar a página).

---

## 5. Monitoramento

### Quantos alunos têm relatório V2?

```sql
SELECT
  COUNT(*) FILTER (WHERE ce.processing_status = 'completed') AS total_reports,
  COUNT(*) FILTER (
    WHERE ce.processing_status = 'completed'
    AND ce.formatted_report::jsonb->>'report_version' = '2'
  ) AS v2_reports
FROM career_evaluations ce
WHERE ce.user_id IN (SELECT id FROM auth.users);
```

### Dimensão mais fraca mais comum

```sql
-- Requer análise no frontend ou via script; não há coluna direta no banco.
-- Use a lógica de BREAKDOWN_DIMENSIONS do scoring.ts para calcular.
```

### Serviços com report_dimension configurados

```sql
SELECT name, service_type, report_dimension, is_visible_in_hub
FROM hub_services
WHERE report_dimension IS NOT NULL
ORDER BY report_dimension;
```

### Config atual do hub

```sql
SELECT
  value::jsonb->'sections_order' AS sections_order,
  value::jsonb->'sections_visibility' AS visibility,
  value::jsonb->'greetings' AS greetings,
  value::jsonb->'quick_tools' AS quick_tools
FROM app_configs
WHERE key = 'hub_dashboard_config';
```

---

## 6. Troubleshooting

### Seção não aparece no hub do aluno

1. Verificar se está **visível** em `/admin/hub-config` → aba "Layout"
2. Verificar se tem **dados**: ex: "Dimensões" requer relatório V2, "Comunidade" requer posts
3. Verificar se a seção está na lista `sections_order` (pode ter sido removida do JSON manualmente)

### Upsell não mostra serviço personalizado

1. Verificar se o serviço tem `report_dimension` preenchido em `/admin/produtos`
2. Verificar se `is_visible_in_hub = true`
3. Verificar qual é a dimensão mais fraca do aluno:
```sql
SELECT formatted_report::jsonb->'scoring'->'score_breakdown'
FROM career_evaluations
WHERE user_id = '<user_uuid>' AND processing_status = 'completed'
ORDER BY created_at DESC LIMIT 1;
```
4. Conferir que existe serviço com `report_dimension` = dimensão mais fraca

### Saudação não mudou após editar

- TanStack Query tem cache de 5 min → aguardar ou pedir para o aluno recarregar a página
- Verificar se o "Salvar" do admin UI exibiu toast de sucesso
- Verificar no banco: `SELECT value::jsonb->'greetings' FROM app_configs WHERE key = 'hub_dashboard_config'`

### Score ring mostra 0

- Aluno pode não ter `readiness_score` preenchido (relatório V1 ou campo nulo)
- Verificar: `SELECT readiness_score FROM career_evaluations WHERE user_id = '<user_uuid>'`
- Se null → score vem do `formatted_report → scoring.readiness_score`

### Social proof não aparece na dimensão

- Verificar se o texto está preenchido para a dimensão correta em `/admin/hub-config` → aba "Social Proof"
- Verificar qual é a dimensão mais fraca: o social proof é exibido apenas para a **mais fraca**
- Campo vazio no admin = não mostra (comportamento esperado)

### Smart Next Step mostra sugestão errada

- Verificar a ordem de prioridades em `/admin/hub-config` → aba "Próximo Passo"
- O primeiro tipo com dados disponíveis ganha. Se "Consultoria não agendada" está em posição 1 e o aluno tem consultoria pendente, ela sempre ganha.
- Para forçar outro tipo: reordene as prioridades no admin

### Ferramentas Rápidas: ferramenta sumiu

1. Verificar em `/admin/hub-config` → aba "Ferramentas": toggle está ligado?
2. O strip mostra apenas ferramentas presentes no array `config.quick_tools`

---

## 7. Arquitetura de Componentes

| Componente | Arquivo | Props principais |
|-----------|---------|-----------------|
| CareerHeroSection | `src/components/hub/CareerHeroSection.tsx` | config, insights, planName, userName |
| SmartNextStepCard | `src/components/hub/SmartNextStepCard.tsx` | step (SmartNextStep \| null) |
| MyJourneySection | `src/components/hub/MyJourneySection.tsx` | excludeHistory? |
| CareerDimensionsSection | `src/components/hub/CareerDimensionsSection.tsx` | insights, config |
| CommunityPulseSection | `src/components/hub/CommunityPulseSection.tsx` | pulse, config |
| SmartUpsellSection | `src/components/hub/SmartUpsellSection.tsx` | insights, highlightedService, config |
| QuickToolsStrip | `src/components/hub/QuickToolsStrip.tsx` | config, remainingCredits |
| GettingStartedChecklist | `src/components/guided-tour/GettingStartedChecklist.tsx` | — |

### Hooks

| Hook | Arquivo | O que retorna |
|------|---------|---------------|
| useHubDashboardConfig | `src/hooks/useHubDashboardConfig.ts` | HubDashboardConfig (da app_configs) |
| useCareerInsights | `src/hooks/useCareerInsights.ts` | CareerInsights (score, dimensões, fase) |
| useCommunityPulse | `src/hooks/useCommunityPulse.ts` | CommunityPulse (posts hoje, top post) |
| useSmartNextStep | `src/hooks/useSmartNextStep.ts` | SmartNextStep \| null |
| useDimensionService | `src/hooks/useDimensionService.ts` | HubService \| null (serviço por dimensão) |

### Config Admin

| Arquivo | Rota |
|---------|------|
| AdminHubConfig.tsx | `/admin/hub-config` |
| HubServiceForm.tsx | (dialog dentro de `/admin/produtos`) |
