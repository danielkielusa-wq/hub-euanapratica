# Sistema de Campanhas de Email — Documentacao de Testes E2E

> **Escopo:** Campanhas manuais (bulk), 10 automacoes trigger-based, unsubscribe, tracking
> **Migracoes:** `20260315100000` a `20260315400000`
> **Edge Functions:** `process-email-campaign`, `process-email-automations`, `handle-email-unsubscribe`, `track-email-event`
> **Ultima atualizacao:** 2026-03-05

---

## Indice

1. [Pre-requisitos e Setup](#1-pre-requisitos-e-setup)
2. [TC-01 — Admin UI: Pagina carrega com tabs](#tc-01--admin-ui-pagina-carrega-com-tabs)
3. [TC-02 — Campanhas: Wizard completo (criar + lancar)](#tc-02--campanhas-wizard-completo-criar--lancar)
4. [TC-03 — Campanhas: Preview de audiencia](#tc-03--campanhas-preview-de-audiencia)
5. [TC-04 — Campanhas: Processamento batch (cron)](#tc-04--campanhas-processamento-batch-cron)
6. [TC-05 — Campanhas: Pause / Resume / Cancel](#tc-05--campanhas-pause--resume--cancel)
7. [TC-06 — Campanhas: Auto-pause por error rate](#tc-06--campanhas-auto-pause-por-error-rate)
8. [TC-07 — Campanhas: Sheet de contatos](#tc-07--campanhas-sheet-de-contatos)
9. [TC-08 — Unsubscribe: Link funcional](#tc-08--unsubscribe-link-funcional)
10. [TC-09 — Unsubscribe: Skip em envios futuros](#tc-09--unsubscribe-skip-em-envios-futuros)
11. [TC-10 — Unsubscribe: Gestao manual via Admin UI](#tc-10--unsubscribe-gestao-manual-via-admin-ui)
12. [TC-11 — Tracking: Open pixel](#tc-11--tracking-open-pixel)
13. [TC-12 — Tracking: Click redirect](#tc-12--tracking-click-redirect)
14. [TC-13 — Automacoes: Cards e toggle na UI](#tc-13--automacoes-cards-e-toggle-na-ui)
15. [TC-14 — Automacao event: report.completed (drip)](#tc-14--automacao-event-reportcompleted-drip)
16. [TC-15 — Automacao event: subscription.activated (drip)](#tc-15--automacao-event-subscriptionactivated-drip)
17. [TC-16 — Automacao inline: credits.exhausted](#tc-16--automacao-inline-creditsexhausted)
18. [TC-17 — Automacao inline: usage.milestone](#tc-17--automacao-inline-usagemilestone)
19. [TC-18 — Automacao cron daily: Leads quentes sem conversao](#tc-18--automacao-cron-daily-leads-quentes-sem-conversao)
20. [TC-19 — Automacao cron weekly: Assinante inativo](#tc-19--automacao-cron-weekly-assinante-inativo)
21. [TC-20 — Drip processor: Avanco de steps](#tc-20--drip-processor-avanco-de-steps)
22. [TC-21 — Drip: Cancelamento de enrollment](#tc-21--drip-cancelamento-de-enrollment)
23. [TC-22 — Automacao: Config dialog (template + drip steps)](#tc-22--automacao-config-dialog-template--drip-steps)
24. [TC-23 — Campanha com lista manual de emails](#tc-23--campanha-com-lista-manual-de-emails)
25. [TC-24 — Campanha agendada (scheduled_at)](#tc-24--campanha-agendada-scheduled_at)
26. [Matriz de Cobertura](#matriz-de-cobertura)

---

## 1. Pre-requisitos e Setup

### Acesso
- Conta **admin** no hub (`has_role(uid, 'admin')`)
- Acesso ao **Supabase Dashboard** (SQL Editor) para verificacoes

### Emails de teste
Use emails reais que voce possa verificar (inbox). Sugestao: crie aliases ou use `+tag`:
- `seuemail+teste1@gmail.com`
- `seuemail+teste2@gmail.com`
- `seuemail+teste3@gmail.com`

### Verificar tabelas existem
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'email_campaigns', 'email_campaign_contacts', 'email_automations',
  'email_drip_enrollments', 'email_unsubscribes', 'email_campaign_events'
);
-- Esperado: 6 linhas
```

### Verificar automacoes seedadas
```sql
SELECT id, name, trigger_type, trigger_event, is_drip, enabled
FROM email_automations ORDER BY id;
-- Esperado: 10 linhas, todas enabled = false
```

### Verificar templates seedados
```sql
SELECT name, display_name, category FROM email_templates
WHERE category = 'campaign' ORDER BY name;
-- Esperado: 14 templates
```

### Verificar cron jobs
```sql
SELECT jobname, schedule FROM cron.job
WHERE jobname LIKE '%email%' ORDER BY jobname;
-- Esperado: 4 jobs (campaign 5min, drips 15min, daily 10h, weekly Mon)
```

### Limpar dados de testes anteriores (executar antes de cada sessao)
```sql
DELETE FROM email_campaign_events;
DELETE FROM email_campaign_contacts;
DELETE FROM email_campaigns;
DELETE FROM email_drip_enrollments;
DELETE FROM email_unsubscribes;
UPDATE email_automations SET total_sent = 0, total_skipped = 0, last_triggered_at = NULL;
```

---

## TC-01 — Admin UI: Pagina carrega com tabs

**Objetivo:** Verificar que a pagina `/admin/campanhas-email` carrega e exibe as duas tabs.

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Navegar para `/admin/campanhas-email` | Pagina carrega sem erros |
| 2 | Verificar header | Titulo "Campanhas de Email" com descricao |
| 3 | Verificar tabs | Duas tabs: "Campanhas" e "Automacoes" |
| 4 | Tab Campanhas (default) | Mensagem "Nenhuma campanha" ou lista de campanhas + botao "Nova Campanha" |
| 5 | Clicar tab "Automacoes" | 10 cards de automacoes aparecem, todas desativadas (switch off) |
| 6 | Verificar sidebar | Item "Campanhas Email" aparece no menu lateral (grupo Configuracoes) |

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-02 — Campanhas: Wizard completo (criar + lancar)

**Objetivo:** Criar uma campanha com lista manual e lancar.

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Clicar "Nova Campanha" | Dialog wizard abre no Passo 1/4 |
| 2 | Preencher nome: "Teste E2E" | Input aceita texto |
| 3 | Selecionar template (qualquer um disponivel) | Dropdown mostra templates existentes |
| 4 | Clicar "Proximo" | Avanca para Passo 2/4 (Audiencia) |
| 5 | Selecionar "Lista manual de emails" | Textarea aparece para digitar emails |
| 6 | Digitar 2-3 emails de teste (um por linha) | Textarea aceita input |
| 7 | Manter "Emails por ciclo" = 10 | Default ok |
| 8 | Clicar "Preview" | Avanca para Passo 3/4, mostra contagem + amostra |
| 9 | Verificar contagem | Numero de contatos = numero de emails digitados |
| 10 | Clicar "Proximo" | Avanca para Passo 4/4 (Confirmar) |
| 11 | Verificar resumo | Nome, template, audiencia, velocidade corretos |
| 12 | Deixar agendamento vazio (= enviar agora) | Botao mostra "Enviar Agora" |
| 13 | Clicar "Enviar Agora" | Dialog fecha, campanha aparece na lista com status "processing" |

**Verificacao no banco:**
```sql
SELECT id, name, status, total_contacts, contacts_queued, contacts_sent
FROM email_campaigns WHERE name = 'Teste E2E';
-- status = 'queued' ou 'processing', total_contacts = N
```

```sql
SELECT email, status, position FROM email_campaign_contacts
WHERE campaign_id = '<id>' ORDER BY position;
-- N linhas, status = 'queued'
```

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-03 — Campanhas: Preview de audiencia

**Objetivo:** Testar cada tipo de audiencia no preview.

| # | Tipo | Acao | Resultado esperado |
|---|------|------|--------------------|
| 1 | `all_leads_with_report` | Selecionar no wizard step 2, clicar Preview | Contagem de leads com `processing_status = 'completed'` |
| 2 | `all_active_subscribers` | Idem | Contagem de users com `user_subscriptions.status = 'active'` |
| 3 | `filter` (quente + muito-quente) | Selecionar filtro, marcar temperaturas | Contagem de leads com essas temperaturas |
| 4 | `manual_list` | Digitar 3 emails | Contagem = 3, amostra mostra os 3 emails |

**Verificacao:** Comparar contagens do preview com queries manuais:
```sql
-- all_leads_with_report
SELECT COUNT(*) FROM career_evaluations
WHERE processing_status = 'completed' AND email IS NOT NULL;

-- all_active_subscribers
SELECT COUNT(*) FROM user_subscriptions us
JOIN profiles p ON p.id = us.user_id
WHERE us.status = 'active' AND p.email IS NOT NULL;

-- filter por temperatura
SELECT COUNT(*) FROM career_evaluations
WHERE processing_status = 'completed'
AND email IS NOT NULL
AND lead_temperature IN ('quente', 'muito-quente');
```

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-04 — Campanhas: Processamento batch (cron)

**Objetivo:** Verificar que o cron processa contatos em fila.

**Pre-requisito:** Campanha do TC-02 criada e lancada com status `processing`.

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Aguardar 5 minutos (proximo ciclo do cron) | Cron `process-email-campaign` executa |
| 2 | Verificar contatos processados | Status muda de `queued` para `sent` ou `failed` |
| 3 | Verificar inbox dos emails de teste | Emails recebidos com conteudo do template |
| 4 | Verificar contadores | `contacts_sent` incrementou na campanha |
| 5 | Se todos processados, verificar status | Campanha muda para `completed` |

**Verificacao no banco:**
```sql
SELECT status, contacts_sent, contacts_failed, contacts_skipped, contacts_queued
FROM email_campaigns WHERE name = 'Teste E2E';

SELECT email, status, processed_at, error_message
FROM email_campaign_contacts WHERE campaign_id = '<id>';
```

**Alternativa (forcar cron manualmente):**
```bash
curl -X POST "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/process-email-campaign" \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: <INTERNAL_FUNCTION_SECRET>" \
  -d '{"cron": true}'
```

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-05 — Campanhas: Pause / Resume / Cancel

**Objetivo:** Testar controles de fluxo da campanha.

**Pre-requisito:** Criar campanha com lista grande (10+ emails) para ter tempo de pausar.

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Criar campanha com 10+ emails, lancar | Status = `processing` |
| 2 | Clicar botao "Pausar" no card | Status muda para `paused`, botao muda para "Retomar" |
| 3 | Verificar que cron nao processa enquanto pausada | Contadores nao mudam no proximo ciclo |
| 4 | Clicar "Retomar" | Status volta para `processing` |
| 5 | Verificar proximo ciclo processa | Contatos continuam sendo enviados |
| 6 | Criar outra campanha, clicar "Cancelar" | Status = `cancelled` |
| 7 | Contatos restantes em `queued` | Permanecem `queued` (nao sao processados) |

**Verificacao:**
```sql
SELECT id, status FROM email_campaigns ORDER BY created_at DESC LIMIT 3;
```

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-06 — Campanhas: Auto-pause por error rate

**Objetivo:** Verificar que campanha pausa automaticamente quando >20% dos envios falham.

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Criar campanha com 10 emails (incluir emails invalidos propositalmente, ex: `aaa@invalido.xyz`) | Campanha criada |
| 2 | Lancar campanha | Status = `processing` |
| 3 | Aguardar processamento | Contatos com email invalido falham |
| 4 | Se >20% falhar (com minimo 5 processados) | Campanha muda para `paused` automaticamente |
| 5 | Verificar no banco | `error_rate` calculado, `status = 'paused'` |

**Verificacao:**
```sql
SELECT status, contacts_sent, contacts_failed, error_rate
FROM email_campaigns WHERE name LIKE '%error%';
```

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-07 — Campanhas: Sheet de contatos

**Objetivo:** Verificar que o sheet lateral exibe contatos corretamente.

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Na lista de campanhas, clicar "Ver contatos" | Sheet abre com titulo da campanha |
| 2 | Verificar cards de resumo no topo | 4 cards: Enviados, Falharam, Pulados, Na fila |
| 3 | Verificar tabela de contatos | Colunas: Email, Nome, Status, Detalhe |
| 4 | Verificar badges de status | Cores corretas: verde=Enviado, vermelho=Falhou, cinza=Na fila, amarelo=Pulado |
| 5 | Verificar detalhe | Mostra data de processamento ou mensagem de erro |

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-08 — Unsubscribe: Link funcional

**Objetivo:** Verificar que o link de unsubscribe no email funciona.

**Pre-requisito:** Email recebido do TC-04.

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Abrir email recebido | Email contem link "Cancelar inscricao" no rodape |
| 2 | Clicar no link | Abre pagina de confirmacao |
| 3 | Verificar pagina | Mensagem de sucesso: "Voce foi removido com sucesso" |
| 4 | Verificar no banco | Registro em `email_unsubscribes` |

**Verificacao:**
```sql
SELECT * FROM email_unsubscribes WHERE email = 'seuemail+teste1@gmail.com';
-- Esperado: 1 linha, source = 'link'
```

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-09 — Unsubscribe: Skip em envios futuros

**Objetivo:** Verificar que emails para unsubscribed sao pulados.

**Pre-requisito:** TC-08 completado (email esta em `email_unsubscribes`).

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Criar nova campanha incluindo o email que fez unsubscribe | Campanha criada normalmente |
| 2 | Lancar campanha | Processing |
| 3 | Aguardar processamento | |
| 4 | Verificar status do contato unsub | Status = `skipped`, skip_reason = "unsubscribed" |
| 5 | Verificar inbox | Email NAO recebido |
| 6 | Verificar outros contatos | Processados normalmente |

**Verificacao:**
```sql
SELECT email, status, skip_reason FROM email_campaign_contacts
WHERE campaign_id = '<id>' AND email = 'seuemail+teste1@gmail.com';
-- status = 'skipped', skip_reason contem 'unsubscribed'
```

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-10 — Unsubscribe: Gestao manual via Admin UI

**Objetivo:** Testar adicionar e remover unsubscribes pelo admin.

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Na tab Campanhas, clicar "Unsubscribes" | Sheet abre com lista (possivelmente vazia ou com o do TC-08) |
| 2 | Digitar email no input + clicar "Adicionar" | Email aparece na lista com source = "admin" |
| 3 | Verificar no banco | Registro em `email_unsubscribes` com source = 'admin' |
| 4 | Clicar botao de remover (X) no email | Email some da lista |
| 5 | Verificar no banco | Registro removido de `email_unsubscribes` |

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-11 — Tracking: Open pixel

**Objetivo:** Verificar que abertura de email registra evento.

**Pre-requisito:** Email recebido do TC-04.

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Abrir email no client (Gmail, Outlook) | Email carrega normalmente |
| 2 | Inspecionar HTML do email | Contem `<img>` com URL para `track-email-event?t=open&...` |
| 3 | Verificar no banco apos abrir | Evento `open` registrado |

**Verificacao:**
```sql
SELECT * FROM email_campaign_events
WHERE event_type = 'open'
ORDER BY created_at DESC LIMIT 5;
-- Esperado: pelo menos 1 evento com email correto
```

**Nota:** Alguns clients bloqueiam pixels. Gmail web geralmente carrega. Teste com client que carrega imagens automaticamente.

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-12 — Tracking: Click redirect

**Objetivo:** Verificar que cliques em links sao rastreados e redirecionam.

**Pre-requisito:** Email recebido com links (template deve ter links clicaveis).

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Inspecionar HTML do email | Links apontam para `track-email-event?t=click&...&url=<original>` |
| 2 | Clicar em um link | Redireciona (302) para a URL original |
| 3 | Verificar no banco | Evento `click` registrado com `link_url` |

**Verificacao:**
```sql
SELECT * FROM email_campaign_events
WHERE event_type = 'click'
ORDER BY created_at DESC LIMIT 5;
-- Esperado: evento com link_url = URL original do template
```

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-13 — Automacoes: Cards e toggle na UI

**Objetivo:** Verificar exibicao e toggle das automacoes.

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Na tab "Automacoes", verificar 10 cards | Cada card mostra: nome, trigger, tipo (drip/single), stats |
| 2 | Cards iniciais | Todos desativados (switch off), total_sent = 0 |
| 3 | Clicar toggle em uma automacao | Switch ativa, toast de confirmacao |
| 4 | Verificar no banco | `enabled = true` para essa automacao |
| 5 | Clicar toggle novamente | Desativa, `enabled = false` |
| 6 | Verificar stats exibidos | "Enviados: 0 / Pulados: 0" |

**Verificacao:**
```sql
SELECT name, enabled FROM email_automations;
```

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-14 — Automacao event: report.completed (drip)

**Objetivo:** Verificar que completar um relatorio de diagnostico inicia o drip pos-diagnostico.

**Pre-requisito:** Automacao "Drip Pos-Diagnostico" ativada (`enabled = true`).

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Ativar automacao "Drip Pos-Diagnostico" via toggle | `enabled = true` |
| 2 | Completar um diagnostico de carreira com email de teste | Relatorio gerado |
| 3 | Verificar trigger disparou | `dispatch-report-webhook` chamou `triggerEmailAutomation('report.completed', ...)` |
| 4 | Verificar enrollment criado | Registro em `email_drip_enrollments` |
| 5 | Verificar step 0 enviado | `email_logs` contem envio do template `drip_report_d0` |
| 6 | Verificar enrollment atualizado | `current_step = 0`, `next_send_at` = now + 3 dias (step 1) |

**Verificacao:**
```sql
SELECT * FROM email_drip_enrollments
WHERE automation_id = (SELECT id FROM email_automations WHERE name = 'Drip Pós-Diagnóstico')
ORDER BY created_at DESC LIMIT 5;
-- status = 'active', current_step = 0, next_send_at definido

SELECT * FROM email_automations WHERE name = 'Drip Pós-Diagnóstico';
-- total_sent incrementou, last_triggered_at atualizado
```

**Alternativa (forcar trigger manualmente):**
```bash
curl -X POST "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/process-email-automations" \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: <INTERNAL_FUNCTION_SECRET>" \
  -d '{"mode": "trigger", "trigger_event": "report.completed", "payload": {"lead_id": "<uuid>", "email": "teste@email.com", "name": "Teste", "access_token": "abc123"}}'
```

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-15 — Automacao event: subscription.activated (drip)

**Objetivo:** Verificar que ativacao de assinatura inicia drip de onboarding.

**Pre-requisito:** Automacao "Onboarding Assinante" ativada.

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Ativar automacao "Onboarding Assinante" | `enabled = true` |
| 2 | Simular ativacao de assinatura (via Ticto webhook ou manualmente) | Webhook processado |
| 3 | Verificar enrollment criado | `email_drip_enrollments` com automation "Onboarding Assinante" |
| 4 | Verificar step 0 enviado | Template `onboarding_sub_d1` enviado |
| 5 | Verificar next_send_at | Proximo step em 2 dias |

**Alternativa (forcar trigger):**
```bash
curl -X POST "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/process-email-automations" \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: <INTERNAL_FUNCTION_SECRET>" \
  -d '{"mode": "trigger", "trigger_event": "subscription.activated", "payload": {"user_id": "<uuid>", "email": "teste@email.com", "name": "Teste", "plan_name": "Pro"}}'
```

**Verificacao:**
```sql
SELECT * FROM email_drip_enrollments
WHERE automation_id = (SELECT id FROM email_automations WHERE name = 'Onboarding Assinante')
ORDER BY created_at DESC LIMIT 5;
```

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-16 — Automacao inline: credits.exhausted

**Objetivo:** Verificar que esgotar creditos dispara email de upgrade nudge.

**Pre-requisito:** Automacao "Upgrade Nudge" ativada. Usuario com plano Basic (5 creditos).

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Ativar automacao "Upgrade Nudge (Creditos Esgotados)" | `enabled = true` |
| 2 | Usar todos os creditos do usuario Basic (ex: ResumePass AI consome 3 + Title Translator 1 + Prime Jobs 1 = 5) | Creditos esgotados |
| 3 | Tentar usar mais um credito | `checkUnifiedCredits()` retorna `allowed: false` |
| 4 | Verificar trigger disparou | `triggerEmailAutomation('credits.exhausted', ...)` chamado |
| 5 | Verificar email enviado | Template `upgrade_nudge_credits` no inbox |
| 6 | Verificar no banco | `email_automations` total_sent incrementou |

**Verificacao:**
```sql
-- Verificar que creditos estao esgotados
SELECT * FROM get_unified_credits('<user_id>');

-- Verificar automacao disparou
SELECT total_sent, last_triggered_at FROM email_automations
WHERE name = 'Upgrade Nudge (Créditos Esgotados)';

-- Verificar email_logs
SELECT * FROM email_logs WHERE recipient_email = '<email>'
AND template_name = 'upgrade_nudge_credits'
ORDER BY created_at DESC LIMIT 1;
```

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-17 — Automacao inline: usage.milestone

**Objetivo:** Verificar que atingir milestones de uso (5, 10, 25) dispara email.

**Pre-requisito:** Automacao "Milestone de Uso" ativada. Usuario com algum uso.

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Ativar automacao "Milestone de Uso" | `enabled = true` |
| 2 | Usar o sistema ate atingir 5 usos totais | Milestone 5 atingido |
| 3 | Verificar trigger | `triggerEmailAutomation('usage.milestone', {milestone: 5, ...})` chamado |
| 4 | Verificar email | Template `usage_milestone` enviado |
| 5 | Usar ate 10 usos | Outro email de milestone |

**Verificacao:**
```sql
-- Contar usos totais
SELECT COUNT(*) FROM usage_logs WHERE user_id = '<user_id>';

-- Verificar automacao
SELECT total_sent, last_triggered_at FROM email_automations
WHERE name = 'Milestone de Uso';
```

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-18 — Automacao cron daily: Leads quentes sem conversao

**Objetivo:** Verificar que o cron diario identifica e envia email para leads quentes.

**Pre-requisito:** Automacao "Leads Quentes sem Conversao" ativada. Existir leads com `lead_temperature IN ('quente', 'muito-quente')` sem assinatura.

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Ativar automacao "Leads Quentes sem Conversão" | `enabled = true` |
| 2 | Forcar cron daily manualmente | Funcao executa |
| 3 | Verificar leads identificados | Leads quentes sem user_subscriptions ativa |
| 4 | Verificar emails enviados | Template `lead_hot_no_conversion` enviado |
| 5 | Verificar anti-duplicata | Se rodar cron novamente, nao envia para mesmos leads (ja tem email_logs) |

**Forcar cron:**
```bash
curl -X POST "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/process-email-automations" \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: <INTERNAL_FUNCTION_SECRET>" \
  -d '{"mode": "cron_daily"}'
```

**Verificacao:**
```sql
-- Leads quentes sem assinatura
SELECT ce.email, ce.name, ce.lead_temperature
FROM career_evaluations ce
WHERE ce.processing_status = 'completed'
AND ce.lead_temperature IN ('quente', 'muito-quente')
AND ce.email IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM profiles p
  JOIN user_subscriptions us ON us.user_id = p.id
  WHERE p.email = ce.email AND us.status = 'active'
);

-- Emails enviados
SELECT * FROM email_logs WHERE template_name = 'lead_hot_no_conversion'
ORDER BY created_at DESC LIMIT 10;
```

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-19 — Automacao cron weekly: Assinante inativo

**Objetivo:** Verificar que assinantes sem login recente recebem email.

**Pre-requisito:** Automacao "Assinante Inativo" ativada.

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Ativar automacao "Assinante Inativo" | `enabled = true` |
| 2 | Forcar cron weekly | Funcao executa |
| 3 | Verificar criterio | Assinantes ativos com `last_sign_in_at` > 14 dias atras |
| 4 | Verificar emails | Template `subscriber_inactive` enviado |

**Forcar cron:**
```bash
curl -X POST "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/process-email-automations" \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: <INTERNAL_FUNCTION_SECRET>" \
  -d '{"mode": "cron_weekly"}'
```

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-20 — Drip processor: Avanco de steps

**Objetivo:** Verificar que o drip processor avanca steps quando `next_send_at` chega.

**Pre-requisito:** Enrollment ativo do TC-14 (drip pos-diagnostico).

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Verificar enrollment com `next_send_at` no futuro | Enrollment existe |
| 2 | Forcar `next_send_at` para o passado (simular passagem de tempo) | SQL update |
| 3 | Forcar drip processor | Step seguinte processado |
| 4 | Verificar email enviado | Template do step correto (ex: `drip_report_d3`) |
| 5 | Verificar enrollment atualizado | `current_step` incrementou, `next_send_at` atualizado |
| 6 | Repetir ate ultimo step | Status muda para `completed` |

**Forcar next_send_at:**
```sql
UPDATE email_drip_enrollments
SET next_send_at = NOW() - INTERVAL '1 minute'
WHERE email = 'teste@email.com' AND status = 'active';
```

**Forcar drip processor:**
```bash
curl -X POST "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/process-email-automations" \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: <INTERNAL_FUNCTION_SECRET>" \
  -d '{"mode": "drip_processor"}'
```

**Verificacao:**
```sql
SELECT current_step, next_send_at, status, steps_completed
FROM email_drip_enrollments WHERE email = 'teste@email.com';
```

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-21 — Drip: Cancelamento de enrollment

**Objetivo:** Verificar cancelamento manual de enrollment via Admin UI.

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Na tab Automacoes, clicar "Enrollments" em automacao drip | Sheet abre com lista |
| 2 | Verificar cards no topo | Active, Completed, Cancelled com contagens |
| 3 | Verificar tabela | Email, Step, Proximo envio, Status |
| 4 | Clicar "Cancelar" em enrollment ativo | Status muda para `cancelled` |
| 5 | Verificar no banco | `status = 'cancelled'` |
| 6 | Drip processor nao processa cancelados | Rodar cron, nenhum email enviado |

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-22 — Automacao: Config dialog (template + drip steps)

**Objetivo:** Verificar edicao de automacoes pelo admin.

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Clicar "Configurar" em automacao single-step | Dialog abre com toggle, descricao, template selector |
| 2 | Alterar template | Dropdown mostra templates disponiveis |
| 3 | Alterar descricao | Textarea editavel |
| 4 | Clicar "Salvar" | Dialog fecha, toast de sucesso |
| 5 | Verificar no banco | Campos atualizados |
| 6 | Clicar "Configurar" em automacao drip | Dialog mostra editor JSON de drip steps |
| 7 | Verificar JSON | Array de objetos com `step`, `delay_days`, `template_name` |
| 8 | Editar delay de um step | JSON aceita edicao |
| 9 | Salvar | Drip steps atualizados no banco |
| 10 | Inserir JSON invalido + salvar | Nao salva (silently fails na validacao) |

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-23 — Campanha com lista manual de emails

**Objetivo:** Testar cenario completo de campanha manual end-to-end com recebimento real.

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Criar campanha "E2E Manual" | Wizard step 1 |
| 2 | Selecionar template com conteudo visivel | Template com texto/links |
| 3 | Tipo audiencia: "Lista manual de emails" | Textarea aparece |
| 4 | Digitar 2 emails reais + 1 email unsub (se existir) | 3 emails |
| 5 | Preview: mostra 3 contatos | Contagem correta |
| 6 | Lancar | Campanha criada |
| 7 | Aguardar processamento | Cron processa |
| 8 | Verificar resultados | 2 sent, 1 skipped (unsub) |
| 9 | Abrir email no inbox | Conteudo do template renderizado |
| 10 | Verificar tracking pixel no HTML source | `<img>` com URL do pixel |
| 11 | Verificar link de unsubscribe | Link presente no rodape |
| 12 | Clicar em link do email | Redirect funciona, evento `click` registrado |

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## TC-24 — Campanha agendada (scheduled_at)

**Objetivo:** Verificar que campanha agendada so comeca no horario definido.

| # | Acao | Resultado esperado |
|---|------|--------------------|
| 1 | Criar campanha no wizard | Steps 1-3 normais |
| 2 | No step 4, definir agendamento para 30 min no futuro | Botao mostra "Agendar Campanha" |
| 3 | Clicar "Agendar Campanha" | Campanha criada com status `scheduled` |
| 4 | Verificar que cron NAO processa | Status permanece `scheduled` antes do horario |
| 5 | Aguardar horario agendado | Cron transiciona para `queued` → `processing` |
| 6 | Verificar emails enviados | Contatos processados apos o horario |

**Verificacao:**
```sql
SELECT name, status, scheduled_at FROM email_campaigns
WHERE name LIKE '%agendada%' ORDER BY created_at DESC;
```

**Status:** [ ] Pass  [ ] Fail
**Notas:**

---

## Matriz de Cobertura

| Area | Test Cases | Cobertura |
|------|-----------|-----------|
| **Admin UI** | TC-01, TC-07, TC-10, TC-13, TC-21, TC-22 | Pagina, tabs, sheets, dialogs, toggles |
| **Campanha Manual (Bulk)** | TC-02, TC-03, TC-04, TC-05, TC-06, TC-23, TC-24 | Wizard, preview, batch, pause/resume, auto-pause, agendamento |
| **Unsubscribe** | TC-08, TC-09, TC-10 | Link, skip, gestao admin |
| **Tracking** | TC-11, TC-12 | Open pixel, click redirect |
| **Automacao Event** | TC-14, TC-15 | report.completed (drip), subscription.activated (drip) |
| **Automacao Inline** | TC-16, TC-17 | credits.exhausted, usage.milestone |
| **Automacao Cron** | TC-18, TC-19 | Daily (leads quentes), weekly (inativo) |
| **Drip Sequence** | TC-14, TC-15, TC-20, TC-21 | Enrollment, step advance, completion, cancel |

### Automacoes NAO cobertas por TC dedicado (testar via cron_daily/weekly):

| Automacao | Como testar |
|-----------|-------------|
| Lembrete de Renovacao | Forcar `cron_daily`, ter assinante com expiracao em 7 dias |
| Win-back 30d | Forcar `cron_daily`, ter assinante cancelado ha 30 dias |
| Reengajamento Lead Frio | Forcar `cron_weekly`, ter leads frios com report ha 14+ dias |
| Follow-up Pos-Consultoria | Forcar `cron_daily`, ter booking completado ontem |

---

## Ordem Recomendada de Execucao

1. **TC-01** — Verificar UI carrega
2. **TC-13** — Verificar automacoes aparecem
3. **TC-03** — Testar previews de audiencia
4. **TC-02** → **TC-04** → **TC-07** — Criar, processar, verificar contatos
5. **TC-08** → **TC-09** — Unsubscribe flow
6. **TC-11** → **TC-12** — Tracking
7. **TC-23** — E2E completo com email real
8. **TC-14** → **TC-20** — Drip pos-diagnostico completo
9. **TC-16** → **TC-17** — Inline triggers
10. **TC-18** → **TC-19** — Cron automations
11. **TC-05** — Pause/Resume
12. **TC-06** — Auto-pause
13. **TC-24** — Agendamento
