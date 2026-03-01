# Guia de Validação Manual — EUA Na Prática

**Última atualização:** 2026-03-02
**Complementa:** `E2E_DEVELOPER.md` (testes Playwright automatizados)
**Objetivo:** Validar a aplicação manualmente — fluxos críticos, criação de dados de teste, pré-requisitos.

---

## Índice

1. [Pré-requisitos de Infraestrutura](#1-pré-requisitos-de-infraestrutura)
2. [Criação de Dados de Teste](#2-criação-de-dados-de-teste)
   - 2.1 Usuário Admin
   - 2.2 Usuário Student
   - 2.3 Usuário Mentor
   - 2.4 Lead de Teste
   - 2.5 Plano e Assinatura
   - 2.6 Serviço de Agendamento
   - 2.7 Fluxo WhatsApp de Teste
   - 2.8 Leads com Relatório Pronto (Backfill)
3. [Checklist por Módulo](#3-checklist-por-módulo)
4. [Fluxos Críticos (Ponta a Ponta)](#4-fluxos-críticos-ponta-a-ponta)
5. [Variáveis de Ambiente Necessárias](#5-variáveis-de-ambiente-necessárias)
6. [Troubleshooting de Dados](#6-troubleshooting-de-dados)

---

## 1. Pré-requisitos de Infraestrutura

Antes de iniciar qualquer validação, confirme que todos os serviços estão operacionais:

| Serviço | Como verificar | URL/Local |
|---------|----------------|-----------|
| Supabase (DB + Auth) | `/admin/system-health` | `seqgnxynrcylxsdzbloa.supabase.co` |
| Edge Functions | `/admin/system-health` → card "Funções" | Supabase Dashboard → Edge Functions |
| Evolution API (WhatsApp) | `/admin/system-health` → card "WhatsApp" | VPS Hostinger |
| N8N | Painel N8N | `n8n.sapunplugged.com` |
| Resend (Email) | `/admin/configuracoes-apis` | Verificar `resend_email` ativo |
| LLM (OpenAI/Anthropic/OpenRouter) | `/admin/configuracoes-apis` | Verificar chave ativa |

**Health check rápido:** `/admin/system-health` mostra o status de todos os serviços em uma tela.

---

## 2. Criação de Dados de Teste

> **Convenção:** Use o sufixo `_test` ou `+test` no email para identificar contas de teste.
> Nunca use dados reais de clientes para testar.

---

### 2.1 Usuário Admin

**Pré-requisito:** Já deve existir pelo menos um admin no sistema.

Criar via Supabase Dashboard → Table Editor → `user_roles`:
```sql
-- Verificar se o usuário existe
SELECT id, email FROM auth.users WHERE email = 'admin+test@euanapratica.com';

-- Atribuir role admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('<user_id>', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

Ou via `/admin/usuarios` → "Criar Usuário" → selecionar role Admin.

**Verificação:** Login em `/login` → deve redirecionar para `/admin/dashboard`.

---

### 2.2 Usuário Student

**Via UI (recomendado):**
1. Acesse `/cadastro`
2. Email: `student+test@euanapratica.com`
3. Preencher onboarding completo (nome, cargo, empresa, objetivo)
4. Verificar que chega em `/dashboard`

**Via Edge Function (para CI):**
```bash
curl -X POST https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/create-test-users \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"type": "student", "email": "student+test@euanapratica.com"}'
```

**Estado mínimo para testes:**
- `profiles` → `full_name`, `role = 'student'`, `onboarding_completed = true`
- `user_roles` → `role = 'student'`

---

### 2.3 Usuário Mentor

**Via UI:**
1. `/cadastro` → email `mentor+test@euanapratica.com`
2. Após cadastro, promover para mentor no SQL:

```sql
-- Promover para mentor
INSERT INTO public.user_roles (user_id, role)
VALUES ('<user_id>', 'mentor')
ON CONFLICT DO NOTHING;

-- Atualizar profile
UPDATE public.profiles
SET role = 'mentor', full_name = 'Mentor Teste'
WHERE id = '<user_id>';
```

**Pré-requisitos adicionais para testar agendamentos:**
```sql
-- Criar disponibilidade (segunda a sexta, 9h-17h BRT = 12h-20h UTC)
INSERT INTO public.mentor_availability (mentor_id, day_of_week, start_time, end_time, is_active)
VALUES
  ('<mentor_id>', 1, '12:00', '20:00', true),  -- Segunda
  ('<mentor_id>', 2, '12:00', '20:00', true),  -- Terça
  ('<mentor_id>', 3, '12:00', '20:00', true),  -- Quarta
  ('<mentor_id>', 4, '12:00', '20:00', true),  -- Quinta
  ('<mentor_id>', 5, '12:00', '20:00', true);  -- Sexta
```

---

### 2.4 Lead de Teste

**Via UI:** `/admin/leads` → "Importar Lead" ou "Novo Lead"

**Via SQL:**
```sql
INSERT INTO public.leads (
  name, email, phone, source, status, temperature
) VALUES (
  'Lead Teste', 'lead+test@gmail.com', '5511999999999',
  'manual', 'new', 'morno'
)
RETURNING id;
```

**Para testar relatório de diagnóstico (ResumePass):**
```sql
-- Criar career_evaluation vinculada ao lead
INSERT INTO public.career_evaluations (
  lead_id, lead_email, lead_name, lead_phone,
  current_role, current_company, target_role,
  processing_status
) VALUES (
  '<lead_id>', 'lead+test@gmail.com', 'Lead Teste', '5511999999999',
  'Analista', 'Empresa Teste', 'Gerente',
  'pending'
)
RETURNING id;
```

O relatório pode ser gerado via `/admin/relatorios` → selecionar a avaliação → "Gerar Relatório".

---

### 2.5 Plano e Assinatura

**Verificar planos existentes:**
```sql
SELECT id, name, display_name, features FROM public.plans ORDER BY created_at;
```

**Criar assinatura para student de teste:**
```sql
-- Associar plano Pro ao student de teste
INSERT INTO public.user_subscriptions (
  user_id, plan_id, status, started_at, expires_at
)
SELECT
  '<student_user_id>',
  p.id,
  'active',
  now(),
  now() + interval '30 days'
FROM public.plans p
WHERE p.name = 'pro'
RETURNING id;
```

**Para testar acesso a features específicas:**
- O plano `pro` deve ter `features.full_report_access = true`
- Verificar em `/admin/planos` → editar plano → aba Features

---

### 2.6 Serviço de Agendamento

**Pré-requisito para testar booking:**

```sql
-- 1. Criar serviço no hub
INSERT INTO public.hub_services (
  name, description, duration_minutes, price, max_bookings_per_student,
  is_active, service_type
) VALUES (
  'Sessão de Mentoria Teste', 'Sessão para testes E2E', 60,
  0.00, 3, true, 'session'
)
RETURNING id;

-- 2. Vincular mentor ao serviço
INSERT INTO public.mentor_services (mentor_id, service_id, is_active)
VALUES ('<mentor_id>', '<service_id>', true);

-- 3. Política de booking (se não existir)
INSERT INTO public.booking_policies (
  min_notice_hours, cancellation_window_hours,
  max_advance_booking_days, is_active
) VALUES (48, 24, 60, true)
ON CONFLICT DO NOTHING;
```

**Verificação:** Student logado → `/dashboard/agenda` → deve ver o serviço disponível.

---

### 2.7 Fluxo WhatsApp de Teste

**Criar um fluxo manual simples via UI:**

1. Acesse `/admin/whatsapp-flows`
2. Clique "Novo Fluxo":
   - Nome: `teste_manual`
   - Nome de exibição: `Fluxo de Teste`
   - Trigger: **Manual**
3. Clique "Criar" → entrar no editor
4. Adicionar etapas:
   - **Etapa 1** (Mensagem): `Ola {{leadName}}! Este eh um teste do fluxo WhatsApp.`
   - **Etapa 2** (Delay): 1 minuto
   - **Etapa 3** (Mensagem): `Segunda mensagem enviada apos o delay. Tudo certo!`
5. Não precisa ativar o fluxo para testar manualmente

**Disparar o teste:**
- No card do fluxo → menu "..." → **Disparar Teste**
- Telefone: `55` + DDD + número do celular de teste
- Nome: `Tester`

**Verificar:**
- A primeira mensagem chega imediatamente no WhatsApp
- Após ~1 minuto, a segunda mensagem chega (processada pelo cron)
- Em `/admin/whatsapp-flows` → Ver Sessões → sessão aparece como `completed`

---

### 2.8 Leads com Relatório Pronto (Backfill)

**Objetivo:** Criar leads elegíveis para o teste de Envio em Lote — i.e., com `processing_status = 'completed'`, telefone e `access_token` preenchidos.

**Verificar elegíveis atuais (para um fluxo específico):**
```sql
-- Quantos leads já têm relatório completo com telefone?
SELECT COUNT(*) AS total_com_relatorio
FROM public.career_evaluations
WHERE processing_status = 'completed'
  AND phone IS NOT NULL AND phone != ''
  AND access_token IS NOT NULL;

-- Destes, quantos JÁ têm sessão no fluxo alvo?
-- (substitua '<flow_id>' pelo UUID do fluxo)
SELECT COUNT(DISTINCT ce.id) AS ja_receberam
FROM public.career_evaluations ce
JOIN public.whatsapp_flow_sessions wfs
  ON wfs.phone = ce.phone AND wfs.flow_id = '<flow_id>'
WHERE ce.processing_status = 'completed';

-- Leads elegíveis (nunca receberam o fluxo, não opted-out, não em lote anterior)
SELECT ce.id, ce.name, ce.phone, ce.email
FROM public.career_evaluations ce
WHERE ce.processing_status = 'completed'
  AND ce.phone IS NOT NULL AND ce.phone != ''
  AND ce.access_token IS NOT NULL
  AND ce.phone NOT IN (
    SELECT phone FROM public.whatsapp_flow_sessions WHERE flow_id = '<flow_id>'
  )
  AND ce.phone NOT IN (SELECT phone FROM public.whatsapp_optouts)
ORDER BY ce.created_at DESC
LIMIT 10;
```

**Criar lead de teste com relatório completo (para testar sem dados reais):**
```sql
-- 1. Criar lead
INSERT INTO public.leads (name, email, phone, source, status, temperature)
VALUES ('Backfill Teste', 'backfill+test@gmail.com', '5511900000001', 'manual', 'new', 'quente')
RETURNING id;

-- 2. Criar career_evaluation já completa (substitua <lead_id>)
INSERT INTO public.career_evaluations (
  lead_id, lead_email, lead_name, lead_phone,
  current_role, current_company, target_role,
  processing_status, access_token,
  formatted_report
) VALUES (
  '<lead_id>',
  'backfill+test@gmail.com',
  'Backfill Teste',
  '5511900000001',
  'Analista Jr', 'Empresa Teste', 'Gerente',
  'completed',
  gen_random_uuid()::text,
  '{"score": 72, "summary": "Relatório de teste para backfill"}'::jsonb
)
RETURNING id, access_token;
```

**Verificação:** Ir em `/admin/whatsapp-flows` → selecionar fluxo → "Envio em Lote" → "Backfill Relatórios" → Próximo → Visualizar — o lead de teste deve aparecer na amostra.

---

## 3. Checklist por Módulo

Use `[x]` ao validar cada item. Marque `[!]` para falhas.

---

### Módulo 1 — Autenticação

| # | Cenário | Usuário | Resultado esperado |
|---|---------|---------|-------------------|
| 1.1 | Login com credenciais válidas (admin) | admin | Redireciona para `/admin/dashboard` |
| 1.2 | Login com credenciais válidas (student) | student | Redireciona para `/dashboard` |
| 1.3 | Login com senha errada | qualquer | Mensagem de erro amigável, sem redirect |
| 1.4 | Recuperação de senha | qualquer | Email de reset recebido |
| 1.5 | Acesso direto a `/admin/*` sem auth | anônimo | Redireciona para `/login` |
| 1.6 | Acesso de student a `/admin/*` | student | Redireciona para `/dashboard` |
| 1.7 | Logout | qualquer | Sessão encerrada, redireciona para `/login` |

---

### Módulo 2 — Onboarding

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| 2.1 | Novo cadastro completa onboarding | Tela de 4 etapas: nome → objetivo → empresa → foto |
| 2.2 | Skip de foto | Avança sem erro |
| 2.3 | Email de boas-vindas | Recebido após completar onboarding |
| 2.4 | Redirecionamento após onboarding | `/dashboard` (student) ou `/admin/dashboard` (admin) |

**Pré-requisito:** Conta nova sem `onboarding_completed = true`.

---

### Módulo 3 — Área do Aluno

| # | Cenário | Verificar |
|---|---------|-----------|
| 3.1 | Dashboard carrega | Cards de progresso, tarefas, espaços |
| 3.2 | Agenda → ver slots disponíveis | Lista de mentores e horários |
| 3.3 | Agendar sessão | Confirmação + email de confirmação recebido |
| 3.4 | Cancelar agendamento | Status atualizado + email de cancelamento |
| 3.5 | Biblioteca → buscar material | Resultados com preview |
| 3.6 | Relatório de diagnóstico (com link de acesso) | Abre `/report/:token` sem login |
| 3.7 | Relatório limitado (sem plano) | Seções bloqueadas visíveis, CTA de upgrade |
| 3.8 | Relatório completo (com plano Pro) | Todas as seções visíveis |

**Pré-requisito 3.3:** Mentor com disponibilidade configurada (seção 2.3).
**Pré-requisito 3.6:** Lead com `career_evaluation` e `processing_status = completed`.

---

### Módulo 4 — Área do Mentor

| # | Cenário | Verificar |
|---|---------|-----------|
| 4.1 | Dashboard do mentor carrega | Próximas sessões, tarefas, espaços |
| 4.2 | Criar Espaço | Formulário → publicado → visível para alunos |
| 4.3 | Gerenciar disponibilidade | Adicionar/remover slots de horário |
| 4.4 | Ver agendamentos | Lista de bookings futuros e passados |
| 4.5 | Criar tarefa para aluno | Tarefa aparece na área do aluno |
| 4.6 | Upload de material | PDF/video no espaço, visível para membros |

---

### Módulo 5 — Admin: Usuários

| # | Cenário | Verificar |
|---|---------|-----------|
| 5.1 | Listar usuários | Tabela com busca e filtros |
| 5.2 | Editar perfil de usuário | Salva sem erro |
| 5.3 | Alterar role | Usuário perde/ganha acesso imediatamente |
| 5.4 | Deletar usuário | Remove auth + profile + dados relacionados |
| 5.5 | Criar usuário admin | Via `/admin/usuarios` → "Criar" |

---

### Módulo 6 — Admin: Leads & Relatórios

| # | Cenário | Verificar |
|---|---------|-----------|
| 6.1 | Dashboard de leads carrega | Funil, temperatura, lista |
| 6.2 | Criar lead manualmente | Aparece na lista com status "new" |
| 6.3 | Importar leads via CSV | Validação de campos, deduplicação |
| 6.4 | Gerar relatório de diagnóstico | Edge Function `format-lead-report` executada |
| 6.5 | Relatório gerado dispara WhatsApp | Fluxo `report.generated` iniciado (se configurado) |
| 6.6 | Link do relatório enviado ao lead | URL `/report/:token` funciona sem login |
| 6.7 | Sugestão de tarefas para lead | Edge Function `suggest-lead-tasks` retorna tarefas |
| 6.8 | Sugestão de mensagens WhatsApp | Edge Function `suggest-whatsapp-messages` retorna sugestões |

**Pré-requisito 6.4:** API LLM configurada em `/admin/configuracoes-apis`.
**Pré-requisito 6.5:** Fluxo WhatsApp com trigger `event: report.generated` criado e ativo.

---

### Módulo 7 — Admin: Assinaturas & Pagamentos

| # | Cenário | Verificar |
|---|---------|-----------|
| 7.1 | Dashboard de assinaturas | Lista de assinantes, gráficos |
| 7.2 | Simular webhook Ticto (ativação) | `/admin/ticto-simulator` → evento `activated` |
| 7.3 | Assinatura ativada dá acesso ao plano | `user_subscriptions` criado, email enviado |
| 7.4 | Simular webhook Ticto (cancelamento) | Evento `cancelled` → assinatura encerrada |
| 7.5 | Email de cancelamento | Recebido após evento cancelled |
| 7.6 | Reconciliar assinaturas | `/admin/assinaturas` → "Reconciliar" sem erros |

**Pré-requisito 7.2:** Ticto configurado em `/admin/configuracoes-apis` (opcional para simulação).

---

### Módulo 8 — Admin: Agendamentos

| # | Cenário | Verificar |
|---|---------|-----------|
| 8.1 | Lista de agendamentos | Tabela com filtros de status e período |
| 8.2 | Detalhes de agendamento | Modal com dados do aluno, mentor e serviço |
| 8.3 | Cancelar agendamento pelo admin | Status → cancelled, notificações enviadas |
| 8.4 | Políticas de booking | Editar e salvar `min_notice_hours`, `cancellation_window_hours` |
| 8.5 | Lembrete automático (24h) | Cron `send-booking-reminder` dispara, email recebido |

**Pré-requisito 8.5:** Agendamento com `scheduled_at` = ~24h no futuro. Aguardar próxima execução do cron (a cada 15 min).

---

### Módulo 9 — Admin: Templates de Email

| # | Cenário | Verificar |
|---|---------|-----------|
| 9.1 | Listar templates | 12+ templates exibidos com categoria |
| 9.2 | Editar template no Unlayer | Editor WYSIWYG abre, salva sem erro |
| 9.3 | Enviar email de teste | `/admin/email-templates` → "Testar" → receber com prefixo `[TESTE]` |
| 9.4 | Variáveis substituídas | `{{leadName}}` substituído pelo valor real no email |
| 9.5 | Desativar template | Email não é enviado quando template `enabled = false` |

**Pré-requisito 9.3:** Resend configurado (`resend_email` em `/admin/configuracoes-apis`).

---

### Módulo 10 — Admin: Configurações de APIs

| # | Cenário | Verificar |
|---|---------|-----------|
| 10.1 | Listar configurações | Todas as APIs cadastradas |
| 10.2 | Testar conexão de API | Botão "Testar" → resposta 200 |
| 10.3 | Configurar fallback | API primária com fallback → se primária falha, fallback usado |
| 10.4 | Ver custos de IA | `/admin/custos-api` → gráficos atualizados após chamadas |
| 10.5 | Preços dos modelos | `app_configs` key `llm_model_pricing` com modelos usados |

---

### Módulo 11 — Admin: Automações N8N

| # | Cenário | Verificar |
|---|---------|-----------|
| 11.1 | Listar automações | Cards com toggle ativo/inativo |
| 11.2 | Testar webhook manualmente | Botão "Testar" → N8N recebe payload |
| 11.3 | Ver logs de webhook | Último log com status e payload |
| 11.4 | Documentação de evento | Sheet de docs com exemplos de payload |
| 11.5 | Evento `report.generated` | Gerado ao completar relatório → N8N recebe |

**Pré-requisito 11.2:** N8N acessível e workflow ativo.

---

### Módulo 12 — Admin: Fluxos WhatsApp

| # | Cenário | Verificar |
|---|---------|-----------|
| 12.1 | Listar fluxos | Cards com status, trigger, contagem de etapas e sessões |
| 12.2 | Criar fluxo (trigger Manual) | Formulário → criado como rascunho |
| 12.3 | Criar fluxo (trigger Evento) | Configurar `report.generated` como evento |
| 12.4 | Criar fluxo (trigger Keyword) | Configurar palavra-chave e tipo exact/contains |
| 12.5 | Adicionar etapa Mensagem | Inline ou template, variáveis disponíveis |
| 12.6 | Adicionar etapa Delay | Configurar duração e unidade |
| 12.7 | Adicionar etapa Aguardar Resposta | Grupos de palavras-chave com ações (próximo/encerrar/ir para) |
| 12.8 | Reordenar etapas | Drag-and-drop, ordem persistida |
| 12.9 | Ativar fluxo | Status → active |
| 12.10 | Disparar fluxo manualmente | Menu "..." → "Disparar Teste" → mensagem recebida |
| 12.11 | Ver sessões | Sheet de sessões com status e etapa atual |
| 12.12 | Cancelar sessão ativa | Status → cancelled |
| 12.13 | Duplicar fluxo | Cópia criada com todas as etapas |
| 12.14 | Fluxo com trigger evento dispara | Gerar relatório → mensagem recebida automaticamente |
| 12.15 | Fluxo com trigger keyword dispara | Enviar palavra-chave no WhatsApp → fluxo inicia |
| 12.16 | Auditoria de conformidade — abrir | Botão "Auditoria" → Sheet abre → clicar "Executar Auditoria" → score e findings |
| 12.17 | Auditoria detecta link na 1ª mensagem | Criar fluxo com `https://` na etapa 1 → auditar → finding CRÍTICO |
| 12.18 | Auditoria detecta falta de PARAR | Fluxo sem "PARAR" em nenhuma mensagem → auditar → finding CRÍTICO |
| 12.19 | Auditoria detecta timeout avançando | wait_reply com timeout_action=next → auditar → finding CRÍTICO |
| 12.20 | Auditoria mostra fluxo limpo | Fluxo com delay+wait_reply+PARAR+link após reply → auditar → score 100 |
| 12.21 | Opt-out: enviar PARAR | Enviar "PARAR" no WhatsApp → confirmação recebida, sessão cancelada |
| 12.22 | Opt-out: trigger bloqueado | Disparar fluxo manual para telefone opted-out → `reason: "opted_out"` |
| 12.23 | Opt-out: verificar na base | `whatsapp_optouts` → registro com phone e data |
| 12.24 | Delay entre mensagens | Fluxo com 2 msg consecutivas → logs mostram ~3-5s entre envios |

**Pré-requisito 12.10:** Evolution API configurada e conectada ao WhatsApp.
**Pré-requisito 12.14:** Fluxo com `trigger_type = event`, evento `report.generated`, status `active`.
**Pré-requisito 12.21:** Sessão ativa para o número de teste (disparar fluxo antes).
**Pré-requisito 12.22:** Número já em `whatsapp_optouts` (executar 12.21 antes).
**Validação de delay:** Após disparar, a cron `resume-flow-delayed-sessions` roda a cada 1 minuto. Aguardar o tempo configurado + 1 minuto para a próxima mensagem.

---

### Módulo 13 — Admin: Cursos

| # | Cenário | Verificar |
|---|---------|-----------|
| 13.1 | Listar cursos | Tabela com status e matrículas |
| 13.2 | Criar curso | Formulário básico → salvo |
| 13.3 | Adicionar módulo e aula | Editor de currículo funcional |
| 13.4 | Upload de vídeo (Bunny) | Upload → processing → playback |
| 13.5 | Matricular aluno | Admin → aluno vê curso no dashboard |
| 13.6 | Aluno completa aula | Progresso atualizado, gamification creditada |

---

### Módulo 14 — Admin: Content Studio

| # | Cenário | Verificar |
|---|---------|-----------|
| 14.1 | Criar ideia de conteúdo | Kanban → card criado |
| 14.2 | Gerar script com IA | Edge Function `generate-content-script` executada |
| 14.3 | Gerar posts sociais | Edge Function `generate-content-social-posts` |
| 14.4 | Mover ideia no kanban | Drag entre colunas persiste |
| 14.5 | Publicar conteúdo | Status → published |

---

### Módulo 15 — Admin: Sistema & Saúde

| # | Cenário | Verificar |
|---|---------|-----------|
| 15.1 | Health check geral | `/admin/system-health` → todos serviços verde |
| 15.2 | Logs de auditoria | `/admin/auditoria` → ações recentes listadas |
| 15.3 | Testes E2E (dashboard admin) | `/admin/testes-e2e` → rodar suite → resultado |
| 15.4 | Relatório semanal de IA | `/admin/relatorio-semanal` → gerado com dados |

---

### Módulo 16 — Admin: Envio em Lote (Batch Dispatch)

**Pré-requisito:** Pelo menos um fluxo WhatsApp existente + leads com `processing_status = 'completed'` e telefone preenchido (seção 2.8).

#### 16.1 — Abrir o wizard "Envio em Lote"

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| 16.1.1 | `/admin/whatsapp-flows` → card de qualquer fluxo → menu "..." → **"Envio em Lote"** | Dialog abre com título "Envio em Lote" e subtítulo com nome do fluxo |
| 16.1.2 | Campo "Nome do lote" pré-preenchido | `Lote DD/MM/AAAA` (data de hoje) |
| 16.1.3 | Botão "Próximo" desabilitado com nome vazio | Sim, campo obrigatório |
| 16.1.4 | Selecionar **"Backfill Relatórios"** | Card com borda primária e fundo destacado |
| 16.1.5 | Selecionar **"Lista Manual"** | Textarea para colar telefones aparece |
| 16.1.6 | Colar telefones válidos (≥10 chars) | Contador "N telefone(s) detectado(s)" atualiza |
| 16.1.7 | Telefones separados por vírgula, ponto-e-vírgula e nova linha | Todos parseados corretamente |
| 16.1.8 | Lista manual vazia → "Próximo" desabilitado | Sim |
| 16.1.9 | Fechar dialog pelo "Cancelar" | Dialog fecha sem criar nenhum lote |

#### 16.2 — Step de Configuração

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| 16.2.1 | Clicar "Próximo" na step source | Avança para step config |
| 16.2.2 | Campo "Contatos por ciclo" | Input numérico, min=1, max=3 |
| 16.2.3 | Digitar `5` no campo | Truncado para `3` (máximo) |
| 16.2.4 | Rótulo de throughput | "~N×12 contatos/hora" atualiza conforme valor |
| 16.2.5 | Toggle "Somente horário comercial" ativo por padrão | Sim (9h-20h BRT) |
| 16.2.6 | Caixa amarela de proteções anti-bloqueio | Visível com lista de 4 (ou 5 com horário) proteções |
| 16.2.7 | Com horário comercial ligado | Item "Apenas em horário comercial (BRT)" aparece na lista |
| 16.2.8 | Botão "Voltar" retorna ao step source | Sim, sem perder nome ou tipo de origem |

#### 16.3 — Step de Preview (Backfill)

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| 16.3.1 | Clicar "Visualizar" com Backfill Relatórios | Loading spinner + "Buscando contatos elegíveis..." |
| 16.3.2 | Preview carregado | Resumo: contatos, velocidade/hora, tempo estimado |
| 16.3.3 | Tempo estimado com horário comercial | Sufixo "(horário comercial)" aparece |
| 16.3.4 | Amostra de contatos | Lista com nome + telefone (primeiros 10) |
| 16.3.5 | Sem contatos elegíveis | Mensagem "Nenhum contato elegível encontrado..." + botão "Confirmar Envio" desabilitado |
| 16.3.6 | Botão "Voltar" | Retorna ao step config |
| 16.3.7 | Botão "Confirmar Envio" | Habilitado somente se `contactCount > 0` |

#### 16.4 — Step de Preview (Lista Manual)

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| 16.4.1 | Preview com Lista Manual | NÃO chama API de preview (sem loading), mostra contagem local |
| 16.4.2 | Contagem de contatos = número de linhas válidas | Sim |
| 16.4.3 | Sem amostra (manual não tem nome) | Seção de amostra ausente |
| 16.4.4 | Confirmar Envio | Lote criado com `source_type = 'manual_list'` |

#### 16.5 — Criação do Lote

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| 16.5.1 | Clicar "Confirmar Envio" | Loading spinner no botão, botão "Cancelar" desabilitado |
| 16.5.2 | Lote criado com sucesso | Toast "Lote criado com sucesso" com "N contatos na fila" |
| 16.5.3 | Dialog fecha após criação | Sim, automaticamente |
| 16.5.4 | Verificar banco de dados | `whatsapp_batch_jobs` tem 1 registro com `status = 'queued'` |
| 16.5.5 | Verificar contatos | `whatsapp_batch_contacts` tem N registros com `status = 'queued'` e `position` sequencial |
| 16.5.6 | Abrindo "Ver Lotes" imediatamente | Lote novo aparece no topo com status "Na Fila" |

**Verificação SQL:**
```sql
-- Verificar job criado
SELECT id, name, status, source_type, total_contacts,
       contacts_per_cycle, business_hours_only, created_at
FROM public.whatsapp_batch_jobs
ORDER BY created_at DESC LIMIT 3;

-- Verificar primeiros contatos do lote
SELECT position, phone, lead_name, status
FROM public.whatsapp_batch_contacts
WHERE batch_job_id = '<job_id>'
ORDER BY position
LIMIT 10;
```

#### 16.6 — Monitoramento via "Ver Lotes"

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| 16.6.1 | Dropdown → **"Ver Lotes"** | Sheet lateral (max-w-2xl) abre com lista de lotes do fluxo |
| 16.6.2 | Card de lote exibe | Nome, tipo de origem, data, badge de status |
| 16.6.3 | Barra de progresso | `processados/total` com porcentagem |
| 16.6.4 | Contadores detalhados | `X enviados` (verde), `Y falhas` (vermelho), `Z ignorados` (cinza) |
| 16.6.5 | Auto-refresh a cada 15s | Contadores e status atualizam sem recarregar a página |
| 16.6.6 | Expandir contatos → clicar "Contatos" | Tabela com #, telefone, nome, status e detalhe |
| 16.6.7 | Status de contato com ícone | Clock (na fila), pulse (enviando), check verde (enviado), alerta (falhou), ban (ignorado) |
| 16.6.8 | Coluna "Detalhe" | Mostra `error_message` ou `skip_reason` quando preenchido |
| 16.6.9 | Sheet com múltiplos lotes | Ordenados por `created_at DESC` — mais recente primeiro |
| 16.6.10 | Fluxo sem lotes | Ícone + "Nenhum lote criado para este fluxo" |

#### 16.7 — Ações de Controle (Pausar / Retomar / Cancelar)

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| 16.7.1 | Lote `queued` ou `processing` → botão **"Pausar"** visível | Sim |
| 16.7.2 | Clicar "Pausar" | Toast "Lote pausado", badge muda para "Pausado" |
| 16.7.3 | Lote `paused` → botão **"Retomar"** visível | Sim (botão Pausar desaparece) |
| 16.7.4 | Clicar "Retomar" | Toast "Lote retomado", badge volta para "Processando" |
| 16.7.5 | Retomar reseta contatos travados | Contatos com `status = 'processing'` voltam para `'queued'` |
| 16.7.6 | Lote `completed` ou `cancelled` → sem botões de ação | Sim, apenas badge informativo |
| 16.7.7 | Clicar **"Cancelar"** (lote ativo) | Toast "Lote cancelado", badge "Cancelado" |
| 16.7.8 | Cancelamento marca contatos pendentes | `whatsapp_batch_contacts` pendentes → `status = 'skipped'`, `skip_reason = 'batch_cancelled'` |

**Verificação SQL após cancelamento:**
```sql
SELECT status, skip_reason, COUNT(*)
FROM public.whatsapp_batch_contacts
WHERE batch_job_id = '<job_id>'
GROUP BY status, skip_reason;
-- Esperado: sent (alguns), skipped com reason 'batch_cancelled' (restantes)
```

#### 16.8 — Processamento pelo Cron (E2E com Evolution API)

> **Pré-requisito:** Evolution API conectada, lote criado com telefone de teste válido, dentro do horário comercial (9h-20h BRT) ou toggle desligado.

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| 16.8.1 | Lote criado com 1 contato (telefone de teste) | `status = 'queued'` |
| 16.8.2 | Aguardar até 5 minutos (cron interval) | Cron chama `process-whatsapp-batch` com `{ cron: true }` |
| 16.8.3 | Job muda para `processing` no 1º ciclo | `started_at` preenchido |
| 16.8.4 | Mensagem recebida no WhatsApp de teste | Primeira mensagem do fluxo entregue |
| 16.8.5 | Contato marcado como `sent` | `whatsapp_batch_contacts.status = 'sent'`, `session_id` preenchido |
| 16.8.6 | Job muda para `completed` após último contato | `completed_at` preenchido, `contacts_sent = total_contacts` |
| 16.8.7 | Sessão criada no flow engine | `whatsapp_flow_sessions` com `trigger_type = 'batch'` |

**Verificação de logs:**
```
Supabase Dashboard → Edge Functions → process-whatsapp-batch → Logs
Filtrar pelo horário esperado. Procurar por:
  "[process-batch] Cron cycle processed 1 job(s)"
  "[batchService] Batch job <id> created with N contacts"
  "[batchService] Job <id> completed"
```

#### 16.9 — Proteções Anti-Bloqueio

| # | Cenário | Como verificar |
|---|---------|----------------|
| 16.9.1 | Horário comercial desligado — criar lote às 21h BRT | Job criado, cron do ciclo seguinte mostra "outside business hours, skipping" nos logs |
| 16.9.2 | Horário comercial ligado — criar lote às 10h BRT | Job processado normalmente |
| 16.9.3 | Delay inter-contato (2+ contatos no lote) | Logs mostram ao menos 30s entre processamento dos contatos |
| 16.9.4 | Contato opted-out incluído na lista manual | Contato marcado `skipped` com `skip_reason = 'opted_out'` |
| 16.9.5 | Contato com sessão ativa (fluxo não-concorrente) | Contato marcado `skipped` com `skip_reason = 'active_session_exists'` |
| 16.9.6 | Forçar 5+ falhas (>20% de erro) | Job auto-pausado, badge mostra "Pausado", card exibe aviso "Pausado automaticamente: Error rate X% exceeds 20% threshold" |

**Simular auto-pause (forçar falhas):**
```sql
-- Forçar 5 contatos para status 'failed' manualmente
UPDATE public.whatsapp_batch_contacts
SET status = 'failed', error_message = 'simulated_failure', processed_at = now()
WHERE batch_job_id = '<job_id>'
  AND position IN (1,2,3,4,5);

-- Atualizar contadores do job
UPDATE public.whatsapp_batch_jobs
SET contacts_failed = 5, contacts_queued = total_contacts - 5,
    status = 'processing'
WHERE id = '<job_id>';
-- No próximo ciclo do cron, se total_processed >= 5 e error_rate > 20% → auto-pausa
```

#### 16.10 — Deduplicação e Idempotência

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| 16.10.1 | Criar segundo lote de backfill para o mesmo fluxo | Leads já no 1º lote NÃO aparecem na contagem/amostra do preview |
| 16.10.2 | Leads que já têm sessão no fluxo | NÃO aparecem no preview do backfill |
| 16.10.3 | Mesmo telefone duplicado na lista manual | Apenas 1 contato criado (normalização + dedup por phone) |
| 16.10.4 | Lead opted-out | NÃO aparece no preview do backfill |

**Verificação SQL (idempotência):**
```sql
-- Após 2 lotes de backfill criados: nenhum telefone deve aparecer nos dois
SELECT phone, COUNT(*) as aparicoes
FROM public.whatsapp_batch_contacts
WHERE batch_job_id IN ('<job1_id>', '<job2_id>')
GROUP BY phone
HAVING COUNT(*) > 1;
-- Deve retornar 0 linhas
```

**Pré-requisito 16.8:** Evolution API conectada + número de WhatsApp de teste ativo.
**Pré-requisito 16.9.4:** Número de teste em `whatsapp_optouts` (executar Fluxo F primeiro).

---

## 4. Fluxos Críticos (Ponta a Ponta)

Estes fluxos validam a integração entre múltiplos módulos. Execute-os na ordem listada.

---

### Fluxo A — Lead → Relatório → WhatsApp Drip

**Objetivo:** Validar o principal canal de aquisição da plataforma.

**Dados necessários:**
- Lead com telefone válido (WhatsApp ativo)
- Fluxo WhatsApp com trigger `event: report.generated` ativo
- API LLM configurada

**Passos:**
1. `/admin/leads` → criar lead com nome, email e **telefone** (formato: `5511999999999`)
2. `/admin/relatorios` → selecionar lead → "Gerar Relatório"
3. Aguardar `processing_status = completed` (~30–120s, depende do LLM)
4. Verificar que `dispatch-report-webhook` foi chamado (logs Supabase)
5. Verificar que WhatsApp flow engine foi acionado (sessão criada em `whatsapp_flow_sessions`)
6. **Celular de teste recebe** a primeira mensagem do fluxo
7. Responder "SIM" (ou palavra-chave configurada no step `wait_reply`)
8. **Celular recebe** a próxima mensagem (link do relatório)
9. Acessar link do relatório sem login → verificar versão limitada
10. `/admin/whatsapp-flows` → Ver Sessões → sessão marcada como `completed`

**Verificação alternativa (sem WhatsApp real):**
- Disparar manualmente: `/admin/whatsapp-flows` → "Disparar Teste" com telefone de teste
- Checar `whatsapp_flow_sessions` no Supabase para confirmar execução

---

### Fluxo B — Assinatura → Acesso a Features

**Objetivo:** Validar que a assinatura libera o acesso correto.

**Dados necessários:**
- Student de teste sem assinatura
- Ticto simulator ou SQL para criar assinatura

**Passos:**
1. Login com student sem assinatura → acessar `/dashboard`
2. Tentar acessar uma feature bloqueada (ex: relatório completo) → ver "Upgrade"
3. `/admin/ticto-simulator` → disparar evento `activated` com email do student
4. Verificar em `/admin/assinaturas` → assinatura criada
5. Verificar email de confirmação de assinatura recebido
6. Login novamente como student → feature agora acessível
7. Simular evento `cancelled` → assinatura encerrada → feature bloqueada novamente

---

### Fluxo C — Agendamento Completo (Student → Mentor)

**Objetivo:** Validar o sistema de booking de ponta a ponta.

**Dados necessários:**
- Student com assinatura ativa (ou plano que permite bookings)
- Mentor com disponibilidade configurada
- Serviço de mentoria criado e vinculado ao mentor

**Passos:**
1. Login como **student** → `/dashboard/agenda`
2. Selecionar serviço "Sessão de Mentoria Teste" → ver slots disponíveis
3. Selecionar um slot e confirmar agendamento
4. Verificar **email de confirmação** recebido (student + mentor)
5. Login como **admin** → `/admin/agendamentos` → agendamento visível
6. Login como **mentor** → verificar agenda atualizada
7. Aguardar/simular lembrete de 24h (verificar email)
8. Student cancela o agendamento → email de cancelamento
9. Slot volta a ficar disponível

---

### Fluxo D — Currículo (ResumePass) → Análise IA

**Objetivo:** Validar o pipeline de análise de currículo.

**Dados necessários:**
- Usuário com assinatura ativa
- PDF de currículo de teste (`e2e/fixtures/test-resume.pdf`)
- API LLM configurada

**Passos:**
1. Login como admin → `/admin/relatorios` → "Nova Análise"
2. Preencher dados do lead + upload do PDF
3. Clicar "Analisar" → aguardar processamento (~30–90s)
4. Verificar que `career_evaluations` foi atualizado com `processing_status = completed`
5. Verificar score, seções e recomendações no relatório
6. Acessar link público do relatório → versão limitada visível
7. `/admin/custos-api` → verificar que o custo foi registrado

---

### Fluxo E — WhatsApp: Keyword → Drip

**Objetivo:** Validar trigger por palavra-chave.

**Dados necessários:**
- Fluxo WhatsApp com `trigger_type = keyword`, keyword: `"oi"`, status `active`
- WhatsApp conectado via Evolution API

**Passos:**
1. Enviar `"oi"` pelo WhatsApp para o número da plataforma
2. Verificar que `receive-whatsapp-webhook` detectou a mensagem (logs Supabase)
3. Verificar que o fluxo foi iniciado (sessão em `whatsapp_flow_sessions`)
4. Primeira mensagem do fluxo recebida no WhatsApp
5. Se fluxo tem `wait_reply`, responder e verificar que continua

---

### Fluxo F — WhatsApp: Opt-Out (PARAR) & Conformidade

**Objetivo:** Validar que o sistema de opt-out funciona corretamente e que a auditoria de conformidade detecta problemas.

**Dados necessários:**
- Fluxo WhatsApp manual ativo com pelo menos 2 etapas de mensagem
- WhatsApp conectado via Evolution API
- Número de celular de teste

**Parte 1: Opt-Out por Keyword**

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 1 | Disparar fluxo manual para número de teste | Primeira mensagem recebida, sessão `active` ou `waiting_delay` |
| 2 | Enviar **"PARAR"** pelo WhatsApp para o número da plataforma | — |
| 3 | Verificar celular | Mensagem de confirmação recebida: "Você foi descadastrado..." |
| 4 | Verificar `whatsapp_flow_sessions` no Supabase | Sessão do passo 1 agora com `status = 'cancelled'` |
| 5 | Verificar `whatsapp_optouts` no Supabase | Registro com `phone`, `opted_out_at`, `source = 'keyword'` |
| 6 | Tentar disparar novo fluxo manual para o mesmo número | Retorna `{ reason: "opted_out" }`, nenhuma sessão criada |

**Verificação SQL:**
```sql
-- Verificar opt-out registrado
SELECT * FROM public.whatsapp_optouts WHERE phone = '5511999999999';

-- Verificar sessão cancelada
SELECT id, status, completed_at
FROM public.whatsapp_flow_sessions
WHERE phone = '5511999999999'
ORDER BY started_at DESC LIMIT 5;
```

**Parte 2: Keywords aceitas**

Testar cada keyword enviando pelo WhatsApp (uma por vez, remover opt-out entre testes):

| Keyword | Deve disparar opt-out? |
|---------|----------------------|
| `PARAR` | Sim |
| `parar` | Sim |
| `stop` | Sim |
| `STOP` | Sim |
| `pare` | Sim |
| `descadastrar` | Sim |
| `desinscrever` | Sim |
| `cancelar` | **Nao** (ambiguo, pode significar cancelar booking) |
| `sair` | **Nao** (ambiguo) |
| `nao` | **Nao** (muito generico) |
| `parar por favor` | **Nao** (match eh exato, nao parcial) |

**Reset entre testes:**
```sql
DELETE FROM public.whatsapp_optouts WHERE phone = '5511999999999';
```

**Parte 3: Auditoria de Conformidade**

| # | Acao | Resultado esperado |
|---|------|-------------------|
| 1 | `/admin/whatsapp-flows` → clicar **"Auditoria"** | Sheet abre com descricao e botao "Executar Auditoria" |
| 2 | Clicar **"Executar Auditoria"** | Loading → score geral + cards por fluxo |
| 3 | Criar fluxo de teste com `https://link.com/` na etapa 1, sem PARAR | Auditar → 2 findings CRITICOS (link + sem PARAR) |
| 4 | Criar fluxo de teste com wait_reply `timeout_action: next` | Auditar → finding CRITICO "Timeout avanca o fluxo" |
| 5 | Criar fluxo correto (delay → msg com PARAR → wait_reply → msg com link) | Auditar → score 100, badge "OK" |
| 6 | Clicar **"Executar novamente"** | Dados re-fetched, resultados atualizados |

**Fluxo de teste para score 100 (modelo ideal):**
```
Etapa 1: Delay 1 hora
Etapa 2: Mensagem "Ola {{leadName}}! Vi que voce completou sua avaliacao. Responda SIM para receber o resultado. Responda PARAR para cancelar."
Etapa 3: Aguardar Resposta (timeout 24h → encerrar fluxo)
  - SIM → proximo
  - PARAR → encerrar
Etapa 4: Mensagem "Aqui esta seu relatorio: {{reportLink}}"
```

**Parte 4: Delay entre mensagens (validacao via logs)**

| # | Acao | Resultado esperado |
|---|------|-------------------|
| 1 | Criar fluxo com 3 etapas de mensagem consecutivas (sem delay entre elas) | — |
| 2 | Disparar fluxo manualmente | — |
| 3 | Verificar logs da Edge Function `execute-whatsapp-flow` | Timestamps entre sends mostram ~3-5s de gap |
| 4 | Todas as 3 mensagens chegam no WhatsApp | Sim, com intervalo perceptivel entre elas |

**Verificacao de logs:**
```
Supabase Dashboard → Edge Functions → execute-whatsapp-flow → Logs
Filtrar pelo horario do disparo. Procurar por:
  "[flowEngine] Session XXX → step msg_1 (message)"
  "[flowEngine] Session XXX → step msg_2 (message)"  ← deve ter ~3-5s de diferenca
  "[flowEngine] Session XXX → step msg_3 (message)"  ← deve ter ~3-5s de diferenca
```

---

### Fluxo G — Backfill em Lote: Leads sem Relatório Enviado

**Objetivo:** Validar o ciclo completo de envio em lote para leads que completaram o relatório mas nunca receberam a mensagem WhatsApp — o caso de uso principal do Batch Dispatch.

**Dados necessários:**
- ≥1 lead com `career_evaluations.processing_status = 'completed'` + telefone de WhatsApp ativo
- Fluxo WhatsApp com trigger `event: report.generated` (ou qualquer fluxo ativo) sem sessão para esse lead
- Evolution API conectada

**Passos:**

| # | Ator | Ação | Verificação |
|---|------|------|-------------|
| 1 | Admin | Verificar elegíveis: SQL da seção 2.8 | ≥1 lead retornado sem sessão existente |
| 2 | Admin | `/admin/whatsapp-flows` → card do fluxo → "..." → **"Envio em Lote"** | Dialog abre |
| 3 | Admin | Selecionar **"Backfill Relatórios"**, nomear o lote (ex: `Backfill Março 2026`) | — |
| 4 | Admin | Clicar "Próximo" → configurar: `contacts_per_cycle = 1`, horário comercial **desligado** (para testar imediatamente) | Step config exibida |
| 5 | Admin | Clicar "Visualizar" | Loading → preview com contagem correta + amostra dos leads |
| 6 | Admin | Verificar que o lead de teste aparece na amostra | Nome e telefone visíveis |
| 7 | Admin | Clicar **"Confirmar Envio"** | Toast "Lote criado com sucesso — N contatos na fila", dialog fecha |
| 8 | Admin | Dropdown → **"Ver Lotes"** | Sheet abre, novo lote com status **"Na Fila"** |
| 9 | Sistema | Aguardar até 5 min (cron `process-whatsapp-batch` roda a cada 5 min) | — |
| 10 | Sistema | Cron processa 1º contato | Lote muda para **"Processando"**, progress bar avança |
| 11 | Teste | **WhatsApp recebe a primeira mensagem do fluxo** | Mensagem com `{{leadName}}` substituído pelo nome real |
| 12 | Admin | "Ver Lotes" → expandir card → tabela de contatos | Contato com status `enviado` (check verde) e `session_id` preenchido |
| 13 | Admin | Verificar sessão criada no flow engine | `whatsapp_flow_sessions` com `trigger_type = 'batch'` |
| 14 | Teste | Se fluxo tem `wait_reply`: responder a palavra-chave esperada | Fluxo continua normalmente (link do relatório enviado) |
| 15 | Sistema | Após todos os contatos processados | Lote muda para **"Concluído"**, barra 100% |

**Verificação de ponta a ponta via SQL:**
```sql
-- 1. Job completou?
SELECT name, status, total_contacts, contacts_sent,
       contacts_failed, contacts_skipped, started_at, completed_at
FROM public.whatsapp_batch_jobs
ORDER BY created_at DESC LIMIT 1;

-- 2. Sessão do flow engine criada pelo batch?
SELECT id, flow_id, phone, status, trigger_type, started_at
FROM public.whatsapp_flow_sessions
WHERE trigger_type = 'batch'
ORDER BY started_at DESC LIMIT 5;

-- 3. O mesmo lead NÃO aparece mais no preview de backfill
-- (reabrir wizard → Visualizar → contagem deve ter caído em 1)
```

**Validação do isolamento (lead não recebe duplicata):**
```sql
-- Criar um segundo lote para o mesmo fluxo
-- O lead que já foi enviado NÃO deve aparecer
-- Checar via preview no wizard (contagem = total - leads_já_enviados)
```

---

## 5. Variáveis de Ambiente Necessárias

### Edge Functions (via `npx supabase secrets set`)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `INTERNAL_FUNCTION_SECRET` | Sim | Segredo compartilhado para chamadas internas entre funções |
| `SUPABASE_URL` | Automática | Injetada automaticamente pelo Supabase |
| `SUPABASE_ANON_KEY` | Automática | Injetada automaticamente |
| `SUPABASE_SERVICE_ROLE_KEY` | Automática | Injetada automaticamente |

**Valores de API armazenados na tabela `api_configs`** (não como env vars):
- `resend_email` → Resend API key
- `openai` → OpenAI API key
- `anthropic` → Anthropic API key
- `evolution_api` → Evolution API URL + token
- `openrouter` → OpenRouter API key (opcional, fallback)

### Configurações em `app_configs` (tabela)

| Chave | Tipo | Descrição |
|-------|------|-----------|
| `llm_model_pricing` | JSONB | Preços por modelo (input/output per 1M tokens) |
| `internal_function_secret` | text | Deve coincidir com `INTERNAL_FUNCTION_SECRET` env var |
| `supabase_edge_url` | text | `https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1` |

### Verificar configurações via SQL:
```sql
-- Verificar api_configs
SELECT name, api_key IS NOT NULL as has_key, enabled
FROM public.api_configs
ORDER BY name;

-- Verificar app_configs críticos
SELECT key, value->>'enabled' as enabled
FROM public.app_configs
WHERE key IN ('llm_model_pricing', 'internal_function_secret', 'supabase_edge_url');
```

---

## 6. Troubleshooting de Dados

### Problema: Relatório não é gerado

```sql
-- Verificar estado da avaliação
SELECT id, processing_status, error_message, updated_at
FROM public.career_evaluations
WHERE lead_email = 'lead+test@gmail.com'
ORDER BY created_at DESC
LIMIT 1;
```

Causas comuns:
- `processing_status = failed` → verificar `error_message` e logs da Edge Function `format-lead-report`
- API LLM sem créditos → verificar `/admin/custos-api` e testar API em `/admin/configuracoes-apis`

---

### Problema: Email não recebido

```sql
-- Verificar template ativo
SELECT name, enabled FROM public.email_templates
WHERE name IN ('onboarding_welcome', 'booking_confirmation', 'subscription_confirmation');
```

Causas comuns:
- Template `enabled = false` → ativar em `/admin/email-templates`
- Resend sem chave → verificar `api_configs` com `name = 'resend_email'`
- Email em spam (verificar pasta de spam)
- Resend bloqueou domínio → verificar painel Resend

---

### Problema: WhatsApp não recebe mensagem

```sql
-- Verificar sessão criada
SELECT id, status, current_step_id, started_at, last_activity_at
FROM public.whatsapp_flow_sessions
WHERE phone LIKE '%<telefone>%'
ORDER BY started_at DESC
LIMIT 5;

-- Verificar passos executados
SELECT s.step_key, s.step_type, s.config->>'message_text' as msg
FROM public.whatsapp_flow_steps s
JOIN public.whatsapp_flow_sessions sess ON s.flow_id = sess.flow_id
WHERE sess.phone LIKE '%<telefone>%'
ORDER BY s.step_order;
```

Causas comuns:
- Evolution API desconectada → `/admin/system-health` → reconectar QR Code
- Telefone mal formatado (deve ser `5511999999999`, sem `+` ou espaços)
- Fluxo com status `draft` ou `paused` → ativar primeiro
- Sessão em `waiting_delay` → aguardar cron (roda a cada 1 minuto)
- Sessão em `waiting_reply` → enviar a palavra-chave esperada no WhatsApp

---

### Problema: Cron não retoma sessões com delay

```sql
-- Verificar sessões aguardando retomada
SELECT id, phone, status, resume_at, last_activity_at
FROM public.whatsapp_flow_sessions
WHERE status = 'waiting_delay'
ORDER BY resume_at;

-- A cron resume_at <= now() deve ser processada a cada minuto
SELECT now();
```

Se `resume_at` já passou mas a sessão não foi retomada:
1. Verificar que o cron job `resume-flow-delayed-sessions` está ativo no Supabase
2. Verificar logs da Edge Function `execute-whatsapp-flow` com `resume_type = cron_check`
3. Verificar `INTERNAL_FUNCTION_SECRET` configurado corretamente

---

### Problema: Contato fez opt-out sem querer

```sql
-- Verificar se está na lista de opt-out
SELECT * FROM public.whatsapp_optouts WHERE phone LIKE '%<telefone>%';

-- Remover opt-out (permite receber fluxos novamente)
DELETE FROM public.whatsapp_optouts WHERE phone = '<phone_normalizado>';
```

Nota: Após remover o opt-out, o contato pode receber fluxos novamente na próxima trigger.

---

### Problema: Opt-out não funciona (mensagem "PARAR" não é reconhecida)

Causas comuns:
- Mensagem com espaços extras ou pontuação → o match é **exato** (após trim + lowercase). "PARAR." ou "PARAR " não funcionam.
- Mensagem com acentos inesperados → verificar encoding nos logs do webhook
- Edge Function `receive-whatsapp-webhook` não está deployada com a versão mais recente
- Tabela `whatsapp_optouts` sem grant → verificar `GRANT ALL ON public.whatsapp_optouts TO service_role`

```sql
-- Verificar se a tabela existe e tem o grant correto
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'whatsapp_optouts';
```

---

### Problema: Fluxo continua enviando após opt-out

Cenário: O contato enviou "PARAR" mas ainda recebe mensagens de outro fluxo.

```sql
-- Verificar se há sessões ativas para o telefone
SELECT id, flow_id, status, phone
FROM public.whatsapp_flow_sessions
WHERE phone = '<phone_normalizado>'
  AND status IN ('active', 'waiting_delay', 'waiting_reply');
```

Causas:
- **Race condition com cron**: sessão foi retomada pelo cron no mesmo instante do opt-out. Improvável mas possível — o atomic claiming em `executeSession()` protege contra duplicação, mas a mensagem do step pode já ter sido enviada.
- **Formato de telefone inconsistente**: `triggerFlowReply()` normaliza o phone, mas se a sessão foi criada com formato diferente, o `UPDATE ... WHERE phone = X` não encontra a sessão. Verificar se os phones coincidem exatamente.

---

### Problema: Auditoria de conformidade não mostra templates

A auditoria resolve o conteúdo de templates WhatsApp (tabela `whatsapp_templates`) para verificar links e CTAs. Se os checks não funcionam para steps baseados em template:

```sql
-- Verificar que templates existem e estão habilitados
SELECT name, enabled, length(body) as body_length
FROM public.whatsapp_templates
ORDER BY name;
```

Causas:
- Template com `enabled = false` → o audit fetch filtra por `enabled = true`
- `content_type` no step config não é `"template"` → check `config->>'content_type'` no step
- Tabela `whatsapp_templates` sem RLS grant para `authenticated` → admin não consegue ler

---

### Problema: Preview de backfill mostra 0 contatos

```sql
-- 1. Há leads com relatório completo e telefone?
SELECT COUNT(*) FROM public.career_evaluations
WHERE processing_status = 'completed'
  AND phone IS NOT NULL AND phone != ''
  AND access_token IS NOT NULL;

-- 2. Todos já têm sessão no fluxo?
SELECT COUNT(DISTINCT wfs.phone)
FROM public.whatsapp_flow_sessions wfs
JOIN public.career_evaluations ce ON ce.phone = wfs.phone
WHERE wfs.flow_id = '<flow_id>'
  AND ce.processing_status = 'completed';

-- 3. Todos estão opted-out?
SELECT COUNT(*) FROM public.career_evaluations ce
JOIN public.whatsapp_optouts wo ON wo.phone = ce.phone
WHERE ce.processing_status = 'completed';

-- 4. Todos já estão em outro lote do mesmo fluxo?
SELECT COUNT(DISTINCT bc.phone)
FROM public.whatsapp_batch_contacts bc
JOIN public.whatsapp_batch_jobs bj ON bj.id = bc.batch_job_id
WHERE bj.flow_id = '<flow_id>';
```

Causas comuns:
- Todos os leads já têm sessão neste fluxo → escolher outro fluxo ou usar "Lista Manual"
- `access_token` nulo em alguns leads → relatórios incompletos, regenerar
- Todos opted-out → verificar `whatsapp_optouts`

---

### Problema: Lote criado mas cron não processa

```sql
-- 1. Verificar que o job está com status correto
SELECT id, status, last_cycle_at, business_hours_only
FROM public.whatsapp_batch_jobs
WHERE status IN ('queued', 'processing')
ORDER BY created_at DESC;

-- 2. Verificar se o cron está ativo
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname = 'process-whatsapp-batch';
```

Causas comuns:
- Horário comercial ativo e fora de 9h-20h BRT (UTC-3) → aguardar ou desligar toggle
- Cron `process-whatsapp-batch` desativado → reativar via SQL: `SELECT cron.alter_job((SELECT jobid FROM cron.job WHERE jobname='process-whatsapp-batch'), active := true)`
- Edge Function `process-whatsapp-batch` não deployada → `npx supabase functions deploy process-whatsapp-batch`
- `verify_jwt = false` faltando no `config.toml` → verificar configuração e re-deployar
- `INTERNAL_FUNCTION_SECRET` inconsistente → verificar `app_configs` e env var da função

---

### Problema: Contatos marcados como `failed` sem motivo claro

```sql
-- Ver mensagem de erro por contato
SELECT position, phone, status, error_message, processed_at
FROM public.whatsapp_batch_contacts
WHERE batch_job_id = '<job_id>' AND status = 'failed'
ORDER BY position;
```

Causas comuns:
- `Failed to create session` → verificar que o fluxo existe e está ativo (`whatsapp_flows.status = 'active'`)
- Evolution API desconectada → `/admin/system-health` → reconectar
- Telefone mal formatado na lista manual (sem código do país `55`) → corrigir no lote manual
- Timeout do Edge Function (>150s) com `contacts_per_cycle = 3` e delays longos → reduzir para `2`

---

### Problema: Lote auto-pausou inesperadamente

```sql
-- Ver motivo do auto-pause
SELECT status, error_rate, metadata->>'auto_paused_reason' AS reason, paused_at
FROM public.whatsapp_batch_jobs
WHERE id = '<job_id>';
```

Causas:
- Taxa de erro >20% com ≥5 contatos processados → verificar `error_message` dos contatos `failed`
- Evolution API retornando erros de rate-limit → aguardar e Retomar
- Fluxo desativado enquanto o lote rodava → reativar fluxo e Retomar o lote

**Para retomar após corrigir a causa raiz:**
- `/admin/whatsapp-flows` → "Ver Lotes" → botão **"Retomar"** no card do lote

---

### Problema: Mesmo contato aparece em dois lotes

```sql
-- Verificar duplicatas entre lotes do mesmo fluxo
SELECT bc.phone, COUNT(*) as lotes
FROM public.whatsapp_batch_contacts bc
JOIN public.whatsapp_batch_jobs bj ON bj.id = bc.batch_job_id
WHERE bj.flow_id = '<flow_id>'
GROUP BY bc.phone
HAVING COUNT(*) > 1;
```

Causa: Lote 1 foi **cancelado** antes de processar → contatos skipped não bloqueiam novo lote.
O filtro da função `findEligibleReportContacts` exclui telefones em qualquer lote (qualquer status), incluindo `skipped`. Se aparecerem duplicatas, investigar se o `flow_id` dos lotes é realmente o mesmo.

---

### Problema: Assinatura Ticto não ativa

```sql
-- Verificar log do webhook
SELECT event_type, payload->>'email' as email, status, error_message, created_at
FROM public.ticto_webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

Causas comuns:
- Email no payload Ticto não coincide com email do usuário no Supabase
- Plano não mapeado → verificar `plans.name` vs payload Ticto `product_name`
- Webhook URL inválida → URL deve ser `https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/ticto-webhook`

---

## Notas de Versionamento

| Data | Mudanças |
|------|----------|
| 2026-02-27 | Criação do documento — cobre todos os módulos até WhatsApp Flow Builder |
| 2026-02-28 | + Módulo 12.16-12.24: Auditoria de conformidade, opt-out PARAR, delay entre mensagens |
| 2026-02-28 | + Fluxo F: WhatsApp Opt-Out completo (keyword, guard, auditoria, delay) |
| 2026-02-28 | + Troubleshooting: opt-out acidental, opt-out não funciona, fluxo continua após opt-out, auditoria sem templates |
| 2026-03-02 | + Seção 2.8: setup de leads elegíveis para backfill (SQL de verificação + criação de dados de teste) |
| 2026-03-02 | + Módulo 16: Envio em Lote — wizard (16.1-16.4), criação (16.5), monitoramento (16.6), controles (16.7), processamento E2E (16.8), proteções anti-bloqueio (16.9), deduplicação (16.10) |
| 2026-03-02 | + Fluxo G: Backfill em Lote ponta a ponta com verificação SQL e validação de isolamento |
| 2026-03-02 | + Troubleshooting: preview 0 contatos, cron não processa, contatos failed, auto-pause, duplicatas entre lotes |
| — | Atualizar sempre que novos módulos forem adicionados |
