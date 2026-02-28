# Hub Dashboard Redesign — Manual de Testes E2E

> Cenários passo a passo para validar o novo hub centrado no aluno.
> Cada cenário pode ser executado manualmente no ambiente de staging ou produção.

---

## Pré-Requisitos Gerais

| Item | Detalhes |
|------|----------|
| Ambiente | Staging ou produção com Supabase ativo |
| Acesso admin | Conta com role `admin` |
| Acesso DB | Supabase Dashboard (SQL Editor) para INSERT/UPDATE |
| `app_configs` | Row com `key = 'hub_dashboard_config'` existente |
| `hub_services` | Ao menos 1 serviço por `service_type`, com `report_dimension` preenchido em pelo menos 1 |
| `career_evaluations` | 1 lead com relatório completo (`processing_status = 'completed'`) convertido em usuário |
| `community_posts` | Ao menos 3 posts nos últimos 7 dias |
| Planos | `plans` com features (`resume_pass`, `title_translator`) |
| Dois usuários de teste | 1 COM relatório de carreira, 1 SEM relatório |

### Setup de Dados para Teste

```sql
-- 1. Verificar config do hub
SELECT key, LEFT(value, 200) FROM app_configs WHERE key = 'hub_dashboard_config';

-- 2. Verificar hub_services com report_dimension
SELECT id, name, service_type, report_dimension, is_visible_in_hub
FROM hub_services
ORDER BY service_type;

-- 3. Usuário COM relatório
SELECT
  ce.user_id, p.email, p.full_name,
  ce.readiness_score, ce.phase_name, ce.lead_temperature,
  ce.access_token
FROM career_evaluations ce
JOIN profiles p ON p.id = ce.user_id
WHERE ce.processing_status = 'completed'
ORDER BY ce.created_at DESC LIMIT 5;

-- 4. Usuário SEM relatório
SELECT p.id, p.email, p.full_name
FROM profiles p
LEFT JOIN career_evaluations ce ON ce.user_id = p.id AND ce.processing_status = 'completed'
WHERE ce.id IS NULL
LIMIT 5;

-- 5. Posts recentes
SELECT id, title, likes_count, user_id, created_at
FROM community_posts
ORDER BY created_at DESC LIMIT 5;
```

---

## PARTE A: CAREER HERO SECTION

### Cenário 1: Hero SEM Relatório de Carreira

**Objetivo:** Verificar que o hero exibe saudação genérica quando o aluno não tem relatório.

**Pré-condição:**
- Usuário sem rows em `career_evaluations` com `processing_status = 'completed'`
- Verificar o horário atual para validar template de saudação (manhã/tarde/noite)

**Passos:**
1. Login como usuário SEM relatório
2. Navegar para `/dashboard/hub`

**Resultado Esperado:**
- Título "Seu Hub" em negrito
- Badge "Plano {nome}" ao lado
- Saudação fallback: "Olá {nome}! Comece sua jornada com suas ferramentas gratuitas."
- **NÃO aparece**: score ring, fase, temperatura, diagnóstico
- Nenhum erro no console

---

### Cenário 2: Hero COM Relatório de Carreira

**Objetivo:** Verificar que o hero exibe score, fase, temperatura e diagnóstico personalizados.

**Pré-condição:**
- Usuário com `career_evaluations.processing_status = 'completed'` e `formatted_report` preenchido

**Passos:**
1. Login como usuário COM relatório
2. Navegar para `/dashboard/hub`

**Resultado Esperado:**
- Card branco com borda arredondada (rounded-[32px])
- **Score Ring**: anel circular SVG com score numérico no centro (ex: "72 / 100")
- Cor do anel corresponde à fase (`phase_color` do relatório)
- Saudação por horário: "Bom dia, {nome}!" / "Boa tarde" / "Boa noite"
- Badge "Plano {nome}"
- **Título**: "Prontidão: {score}/100"
- **Badge de fase**: emoji + nome (ex: "🚀 Aceleração")
- **Badge de temperatura**: ícone + label (ex: 🔥 "Quente", ❄ "Frio")
- **Diagnóstico curto**: 1-2 linhas de texto cinza
- **Link**: "Ver Relatório Completo →" (clicável, abre `/report/{token}`)
- Nenhum erro no console

### 2.1 Verificar Saudação por Horário

**Passos:**
1. Admin: ir para `/admin/hub-config` → aba "Saudações"
2. Alterar template da manhã para "GM {name}! Bora trabalhar?"
3. Salvar
4. Voltar como aluno → `/dashboard/hub` (antes das 12h)

**Resultado Esperado:**
- Saudação exibe "GM {nome}! Bora trabalhar?"
- Se após 12h, exibe template de tarde (não o editado)

---

## PARTE B: SMART NEXT STEP

### Cenário 3: Consultoria Não Agendada (Prioridade 1)

**Objetivo:** Verificar que o card "Próximo Passo" sugere agendar consultoria.

**Pré-condição:**
- Usuário com `user_hub_services` ativo para serviço tipo `consulting`
- Sem booking ativo para esse serviço (card em "Ação Necessária")

**Passos:**
1. Login como aluno com consultoria não agendada
2. Navegar para `/dashboard/hub`

**Resultado Esperado:**
- Card "Próximo Passo Inteligente" aparece (se seção visível)
- Título: "Agende sua consultoria"
- Descrição menciona o nome do serviço
- Botão: "Agendar"
- Borda ambar (urgencyLevel = 'high')
- Clique no botão → navega para `/dashboard/agendamentos`

---

### Cenário 4: Evento nas Próximas 24h (Prioridade 2)

**Objetivo:** Verificar alerta de evento iminente.

**Pré-condição:**
- Sem consultorias não agendadas (para que prioridade 2 apareça)
- Booking ou sessão agendada para as próximas 24 horas

**Passos (via DB):**
```sql
-- Criar sessão futura em <24h
INSERT INTO sessions (espaco_id, title, datetime, status, duration_minutes, created_by)
VALUES ('<espaco_uuid>', 'Sessão Teste 24h', now() + INTERVAL '6 hours', 'scheduled', 60, '<mentor_uuid>');
```

**Resultado Esperado:**
- Card "Próximo Passo" com título "{nome do serviço} em breve"
- Descrição: "Sua sessão começa hoje às {horário}. Prepare-se!"
- Borda ambar (high urgency)

---

### Cenário 5: Ação Recomendada do Relatório (Prioridade 3)

**Objetivo:** Verificar exibição da ação recomendada do relatório.

**Pré-condição:**
- Sem consultorias não agendadas nem eventos 24h
- Usuário COM relatório que possui `barriers_analysis.recommended_first_action`

**Passos:**
1. Login como aluno COM relatório
2. Navegar para `/dashboard/hub`

**Resultado Esperado:**
- Card "Próximo Passo" com título "Seu próximo passo recomendado"
- Descrição = texto da ação recomendada do relatório
- Botão "Ver Relatório" → navega para `/report/{token}`
- Borda índigo (medium urgency)

---

### Cenário 6: Checklist Incompleto (Prioridade 4)

**Objetivo:** Verificar sugestão de checklist pendente.

**Pré-condição:**
- Sem prioridades 1-3 ativas
- Checklist de primeiros passos com ao menos 1 item incompleto

**Resultado Esperado:**
- Card mostra próximo item incompleto do checklist
- Botão "Fazer Agora" → navega para href do item

---

### Cenário 7: Sugestão de Currículo (Prioridade 5)

**Objetivo:** Verificar sugestão de análise de currículo.

**Pré-condição:**
- Sem prioridades 1-4
- Relatório com dimensão mais fraca = "experience" OU criticalGaps contendo "currículo"

**Resultado Esperado:**
- Card "Analise seu currículo com IA"
- Botão "Analisar" → `/curriculo`
- Borda cinza (low urgency)

---

### Cenário 8: Prompt de Comunidade (Prioridade 6)

**Objetivo:** Verificar incentivo à participação na comunidade.

**Pré-condição:**
- Sem prioridades 1-5
- Usuário nunca postou na comunidade

**Resultado Esperado:**
- Card "Faça seu primeiro post"
- Botão "Conhecer Comunidade" → `/comunidade`

**Variação:** Último post > 7 dias atrás:
- Card "A comunidade sente sua falta!"
- Botão "Postar"

---

### Cenário 9: Smart Next Step Oculto

**Objetivo:** Verificar que o card não aparece quando nenhuma condição é atendida.

**Pré-condição:**
- Sem consultorias pendentes, sem eventos 24h, sem relatório, checklist completo, post recente

**Resultado Esperado:**
- Card "Próximo Passo Inteligente" **NÃO aparece**
- Sem espaço vazio, sem erro

---

### Cenário 10: Reordenação de Prioridades pelo Admin

**Objetivo:** Verificar que o admin pode mudar a ordem de prioridade.

**Passos:**
1. Admin: `/admin/hub-config` → aba "Próximo Passo"
2. Mover `community_prompt` para posição 1 (topo)
3. Salvar
4. Login como aluno que:
   - Tem consultoria não agendada (prioridade 1 original)
   - Também qualifica para community_prompt
5. Navegar para `/dashboard/hub`

**Resultado Esperado:**
- Card mostra "Faça seu primeiro post" (community_prompt agora prioridade 1)
- **NÃO** mostra "Agende sua consultoria" (que seria prioridade 1 no default)

---

## PARTE C: ACTIVE ITEMS (MINHA JORNADA)

### Cenário 11: Minha Jornada sem Histórico

**Objetivo:** Verificar que seção "Histórico" é filtrada no hub redesenhado.

**Pré-condição:**
- Usuário com serviços em múltiplas seções incluindo itens concluídos (histórico)

**Passos:**
1. Login como aluno com serviços ativos + concluídos
2. Navegar para `/dashboard/hub`

**Resultado Esperado:**
- Seções "Ação Necessária", "Em Andamento", "Próximos Eventos" aparecem normalmente
- Seção **"Histórico" NÃO aparece** (filtrada pelo prop `excludeHistory`)
- Nenhum card com opacidade reduzida (estilo de histórico)

> **Nota:** O histórico completo continua acessível em outras telas. O hub mostra apenas itens ativos.

---

### Cenário 12: Lives na Minha Jornada

**Objetivo:** Verificar que lives registradas aparecem na seção com prioridade correta.

**Pré-condição:**
- Usuário registrado em 3+ lives (1 ao vivo, 1 agendada, 1 concluída)

**Resultado Esperado:**
- Seção "Minhas Lives" com ícone rádio vermelho
- Máximo 2 cards exibidos, priorizados: live > scheduled > completed
- Se total > 2: link "Ver todas (N)" → `/lives`

---

## PARTE D: CAREER DIMENSIONS

### Cenário 13: Dimensões COM Relatório

**Objetivo:** Verificar barras de progresso das dimensões.

**Pré-condição:**
- Usuário COM relatório V2 completo

**Passos:**
1. Login como aluno COM relatório
2. Navegar para `/dashboard/hub`

**Resultado Esperado:**
- Título "Suas Dimensões" + subtítulo "— do seu diagnóstico de carreira"
- Card branco com até 6 barras de progresso horizontais
- Cada barra: nome da dimensão, score "X/Y", barra colorida (cor varia por percentual)
- **Dimensão mais fraca**: badge vermelho "Maior Gap" + ícone ⚠
- **Dimensão mais forte**: check verde ✓
- Barras ordenadas da mais fraca para a mais forte

### 13.1 Social Proof na Dimensão Mais Fraca

**Resultado Esperado:**
- Abaixo das barras, texto itálico cinza com social proof configurado
- Ex: "Alunos que melhoraram Inglês conseguiram emprego 3x mais rápido"
- Texto vem de `config.social_proof.dimension_cta[weakest.key]`

### 13.2 CTA de Melhoria

**Pré-condição:**
- `hub_services` tem serviço com `report_dimension` correspondente à dimensão mais fraca

**Resultado Esperado:**
- Link "Melhorar {dimensão} →" abaixo do social proof
- Clique → navega para landing page ou checkout do serviço vinculado

### 13.3 Sem Serviço Vinculado

**Pré-condição:**
- `hub_services` NÃO tem serviço com `report_dimension` = dimensão mais fraca

**Resultado Esperado:**
- Social proof text aparece normalmente (se configurado)
- Link "Melhorar {dimensão}" **NÃO aparece** (sem serviço para direcionar)

---

### Cenário 14: Dimensões SEM Relatório

**Objetivo:** Verificar que seção não aparece sem relatório.

**Pré-condição:**
- Usuário SEM relatório

**Resultado Esperado:**
- Seção "Suas Dimensões" **NÃO aparece**
- Sem espaço vazio

---

## PARTE E: COMMUNITY PULSE

### Cenário 15: Comunidade com Atividade

**Objetivo:** Verificar resumo da comunidade no hub.

**Pré-condição:**
- `community_posts` tem posts nos últimos 7 dias
- Usuário de teste já postou pelo menos 1 vez

**Passos:**
1. Login como aluno
2. Navegar para `/dashboard/hub`

**Resultado Esperado:**
- Título "Comunidade" + badge "{N} hoje" (ambar)
- Botão "Abrir →" no canto superior direito
- **Destaque da Semana**: card com título do post com mais likes, autor, likes e comments count
- Clique no post → navega para `/comunidade/post/{id}`
- **Linha de engajamento**: "Seu último post recebeu X curtida(s)."
- Botão "Postar →"

---

### Cenário 16: Comunidade sem Post do Usuário

**Pré-condição:**
- Usuário nunca postou

**Resultado Esperado:**
- Linha: texto CTA configurado (ex: "Seja o primeiro a postar hoje!")
- Botão "Participar →"

---

### Cenário 17: Comunidade sem Atividade

**Pré-condição:**
- 0 posts nos últimos 7 dias

**Resultado Esperado:**
- Badge "{N} hoje" **NÃO aparece** (0 posts)
- Se `show_top_post = true` mas sem posts → destaque não aparece
- CTA de "no activity" aparece

---

### Cenário 18: Admin Desliga Top Post

**Passos:**
1. Admin: `/admin/hub-config` → aba "Próximo Passo" → card "Pulso da Comunidade"
2. Desligar toggle "Mostrar post destaque"
3. Salvar
4. Login como aluno → `/dashboard/hub`

**Resultado Esperado:**
- Card da comunidade **SEM** o destaque da semana
- Apenas linha de engajamento + CTA

---

## PARTE F: SMART UPSELL

### Cenário 19: Upsell Personalizado (com Dimensão Fraca)

**Objetivo:** Verificar upsell personalizado pela dimensão mais fraca.

**Pré-condição:**
- Usuário COM relatório, dimensão mais fraca = ex: "english"
- `hub_services` tem serviço com `report_dimension = 'english'` e `is_visible_in_hub = true`

**Passos:**
1. Login como aluno
2. Navegar para `/dashboard/hub`

**Resultado Esperado:**
- Card escuro (bg-[#0F172A]) com efeito blur
- Badge "Recomendado para você" + ícone sparkles
- **Headline personalizada**: "Seu Inglês pontuou {score}/{maxScore}"
- **Nome do serviço** em destaque (texto grande branco)
- **Descrição** do serviço
- **Social proof**: texto itálico com borda lateral índigo
  - Ex: "Alunos que melhoraram Inglês conseguiram emprego 3x mais rápido"
- **Card de preço**: "R$ {preço}", desconto se `anchor_price`, badge "X% OFF"
- **Botão CTA**: texto do serviço ou "Agendar Sessão"
- **Trust badge**: "Risco Zero (Cashback)" com ícone escudo

---

### Cenário 20: Upsell Genérico (sem Dimensão)

**Pré-condição:**
- Usuário SEM relatório OU sem serviço vinculado à dimensão mais fraca
- `hub_services` tem serviço marcado como highlighted

**Resultado Esperado:**
- Mesmo card visual escuro
- **SEM headline personalizada** (linha vazia)
- Social proof usa `config.social_proof.general_upsell` ("Mais de 200 alunos já transformaram suas carreiras")
- Serviço exibido = highlighted service

---

### Cenário 21: Sem Upsell

**Pré-condição:**
- Sem serviço vinculado à dimensão mais fraca
- Sem highlighted service

**Resultado Esperado:**
- Seção upsell **NÃO aparece**

---

## PARTE G: QUICK TOOLS

### Cenário 22: Ferramentas Rápidas Visíveis

**Objetivo:** Verificar strip de ferramentas rápidas.

**Pré-condição:**
- `config.quick_tools` contém `['resume_pass', 'title_translator', 'prime_jobs']`

**Passos:**
1. Login como aluno
2. Navegar para `/dashboard/hub`

**Resultado Esperado:**
- Título "Ferramentas"
- Grid com 3 cards compactos:
  - **ResumePass AI**: ícone FileSearch (índigo), stat "X crédito(s)"
  - **Title Translator**: ícone Languages (violeta), stat "Ilimitado"
  - **Prime Jobs**: ícone Briefcase (verde), stat "Y nova(s)" ou "Explorar"
- Clique em cada card → navega para rota respectiva
- Desktop: 3 colunas; Mobile: 2 colunas

---

### Cenário 23: Admin Remove Ferramenta

**Passos:**
1. Admin: `/admin/hub-config` → aba "Ferramentas"
2. Desligar toggle do "Prime Jobs"
3. Salvar
4. Login como aluno → `/dashboard/hub`

**Resultado Esperado:**
- Strip mostra apenas 2 ferramentas (ResumePass + Title Translator)
- Prime Jobs **NÃO aparece**

---

## PARTE H: GETTING STARTED (CHECKLIST)

### Cenário 24: Checklist de Primeiros Passos

**Objetivo:** Verificar que o checklist aparece para novos usuários.

**Pré-condição:**
- Usuário novo, checklist não dismissado

**Resultado Esperado:**
- Componente `GettingStartedChecklist` renderiza na posição configurada
- Itens com checkbox, descrição e link
- Itens completados ficam marcados

---

### Cenário 25: Checklist Oculto via Config

**Passos:**
1. Admin: `/admin/hub-config` → aba "Layout"
2. Desligar toggle de "Checklist Primeiros Passos"
3. Salvar

**Resultado Esperado:**
- Seção **NÃO aparece** no hub (mesmo que checklist não esteja completo)

---

## PARTE I: SECONDARY SERVICES

### Cenário 26: Serviços Secundários

**Objetivo:** Verificar exibição dos serviços secundários.

**Pré-condição:**
- `useSecondaryServices` retorna ao menos 1 serviço

**Resultado Esperado:**
- Título "Outros Serviços" com link "Ver todos ..."
- Grid de cards (3 colunas desktop):
  - Ícone dinâmico, nome, descrição, preço/grátis
  - Botão CTA (texto do `cta_text` ou "CONTRATAR")
- Hover: borda e sombra mudam

---

## PARTE J: ADMIN CONFIG

### Cenário 27: Reordenação de Seções

**Objetivo:** Verificar que o admin pode mudar a ordem das seções do hub.

**Passos:**
1. Login como admin
2. Navegar para `/admin/hub-config`
3. Na aba "Layout", mover "Ferramentas Rápidas" para posição 2 (logo após Career Hero)
4. Salvar
5. Login como aluno → `/dashboard/hub`

**Resultado Esperado:**
- Seção "Ferramentas" aparece logo após o hero, antes de "Próximo Passo Inteligente"
- Todas as outras seções mantêm suas posições relativas

---

### Cenário 28: Ocultar Seção

**Passos:**
1. Admin: `/admin/hub-config` → aba "Layout"
2. Desligar toggle de "Dimensões de Carreira"
3. Salvar
4. Login como aluno COM relatório → `/dashboard/hub`

**Resultado Esperado:**
- Seção "Suas Dimensões" **NÃO aparece** (mesmo com relatório disponível)
- Nenhum espaço vazio no lugar

---

### Cenário 29: Editar Social Proof

**Passos:**
1. Admin: `/admin/hub-config` → aba "Social Proof"
2. Alterar texto de "Inglês" para "Teste: inglês é fundamental"
3. Salvar
4. Login como aluno com dimensão fraca = english → `/dashboard/hub`

**Resultado Esperado:**
- Na seção Dimensões: social proof exibe "Teste: inglês é fundamental"
- Na seção Upsell (se personalizado): mesmo texto

---

### Cenário 30: Configurar Report Dimension em Serviço

**Passos:**
1. Admin: `/admin/produtos`
2. Editar um serviço → selecionar "Dimensão do Relatório" = "Inglês"
3. Salvar
4. Login como aluno cuja dimensão mais fraca = english → `/dashboard/hub`

**Resultado Esperado:**
- Seção Dimensões mostra "Melhorar Inglês →" apontando para esse serviço
- Seção Upsell mostra esse serviço como recomendado

---

## PARTE K: EDGE CASES

### Cenário 31: Relatório V1 (Formato Antigo)

**Pré-condição:**
- Usuário com `career_evaluations` mas `formatted_report` no formato V1 (sem `report_version: 2`)

**Resultado Esperado:**
- `useCareerInsights` retorna `hasReport: true` mas sem dimensões detalhadas
- Hero mostra score genérico (se `readiness_score` existir)
- Seção Dimensões **NÃO aparece** (array de dimensões vazio)
- Smart Next Step pode usar `report_first_action` se disponível

---

### Cenário 32: Loading States

**Passos:**
1. DevTools → Network → Slow 3G
2. Navegar para `/dashboard/hub`

**Resultado Esperado:**
- Skeleton loading para "Minha Jornada" (retângulos cinza pulsando)
- Após carregamento: todas as seções renderizam normalmente
- Sem flash de conteúdo vazio

---

### Cenário 33: Responsividade

**Objetivo:** Validar layout em diferentes telas.

| Viewport | Score Ring | Dimensões | Ferramentas | Upsell |
|----------|-----------|-----------|-------------|--------|
| Desktop (1440px) | Ao lado do texto | Barras full-width | Grid 3 colunas | Layout 5 colunas (3+2) |
| Tablet (768px) | Ao lado do texto | Barras full-width | Grid 3 colunas | Stack vertical |
| Mobile (375px) | Acima do texto (stacked) | Barras full-width | Grid 2 colunas | Stack vertical |

---

### Cenário 34: Config Inexistente/Corrompida

**Passos (via DB):**
```sql
-- Simular config corrompida
UPDATE app_configs SET value = '{invalid json' WHERE key = 'hub_dashboard_config';
```

**Resultado Esperado:**
- Hub renderiza normalmente com **todos os defaults**
- Todas as seções visíveis na ordem padrão
- Saudações padrão em português
- Nenhum crash/tela branca

**Restaurar:**
```sql
-- Re-setar para config original (executar a migration novamente ou copiar JSON)
UPDATE app_configs SET value = '<json válido>' WHERE key = 'hub_dashboard_config';
```

---

## Checklist Rápido de Validação

| # | Cenário | Status |
|---|---------|--------|
| **CAREER HERO** | |
| 1 | Hero SEM relatório: saudação genérica + badge plano | [ ] |
| 2 | Hero COM relatório: score ring + fase + temperatura + diagnóstico | [ ] |
| 2.1 | Saudação varia por horário e é editável pelo admin | [ ] |
| **SMART NEXT STEP** | |
| 3 | Consultoria não agendada → card urgente ambar | [ ] |
| 4 | Evento <24h → card "em breve" ambar | [ ] |
| 5 | Ação recomendada do relatório → card médio índigo | [ ] |
| 6 | Checklist incompleto → card baixa urgência | [ ] |
| 7 | Sugestão currículo → card "Analise com IA" | [ ] |
| 8 | Prompt comunidade → "Faça seu primeiro post" | [ ] |
| 9 | Nenhuma condição → card NÃO aparece | [ ] |
| 10 | Admin reordena prioridades → prioridade muda | [ ] |
| **ACTIVE ITEMS** | |
| 11 | Minha Jornada sem seção "Histórico" | [ ] |
| 12 | Lives priorizadas e limitadas a 2 | [ ] |
| **CAREER DIMENSIONS** | |
| 13 | Barras + "Maior Gap" + social proof + CTA | [ ] |
| 13.2 | CTA "Melhorar X" com serviço vinculado | [ ] |
| 13.3 | Sem serviço vinculado → sem CTA | [ ] |
| 14 | Sem relatório → seção oculta | [ ] |
| **COMMUNITY PULSE** | |
| 15 | Posts hoje + destaque + engajamento | [ ] |
| 16 | Sem post do usuário → CTA "Participar" | [ ] |
| 17 | Sem atividade → CTA configurable | [ ] |
| 18 | Admin desliga top post → destaque oculto | [ ] |
| **SMART UPSELL** | |
| 19 | Personalizado: headline dimensão + serviço vinculado | [ ] |
| 20 | Genérico: highlighted service + social proof geral | [ ] |
| 21 | Sem serviço → seção oculta | [ ] |
| **QUICK TOOLS** | |
| 22 | 3 ferramentas com ícones + stats corretos | [ ] |
| 23 | Admin remove ferramenta → desaparece | [ ] |
| **GETTING STARTED** | |
| 24 | Checklist aparece para novos usuários | [ ] |
| 25 | Admin oculta → seção some | [ ] |
| **SECONDARY SERVICES** | |
| 26 | Grid de cards com ícone + preço + CTA | [ ] |
| **ADMIN CONFIG** | |
| 27 | Reordenação refletida no hub do aluno | [ ] |
| 28 | Seção ocultada não renderiza | [ ] |
| 29 | Social proof editado aparece no hub | [ ] |
| 30 | Report dimension vinculada ao serviço → upsell personalizado | [ ] |
| **EDGE CASES** | |
| 31 | Relatório V1 → graceful fallback | [ ] |
| 32 | Loading → skeletons; sem crash em erro | [ ] |
| 33 | Responsivo: desktop/tablet/mobile | [ ] |
| 34 | Config corrompida → usa defaults | [ ] |
