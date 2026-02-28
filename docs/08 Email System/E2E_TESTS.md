# Sistema de Email — Manual de Testes E2E

> Cenarios para validar o envio, template, e entrega de todos os emails do sistema.
> Cada cenario pode ser executado via admin panel ou verificado via banco de dados.

---

## Infraestrutura

| Componente | Localizacao |
|------------|-------------|
| Tabela de templates | `email_templates` — 14 templates em 4 categorias |
| RPC | `get_email_template_by_name(p_template_name)` — SECURITY DEFINER |
| Servico compartilhado | `supabase/functions/_shared/emailTemplateService.ts` |
| Provedor | Resend API (config em `api_configs` key `resend_email`) |
| Logs | `email_logs` (template_name, recipient, subject, status, resend_id) |
| Admin UI | `/admin/email-templates` — CRUD + editor Unlayer + envio de teste |
| Attachments | Suportado via campo `attachments` no Resend API (ex: .ics calendar) |

---

## Pre-Requisitos

| Item | Detalhes |
|------|----------|
| Resend API | `api_configs` key `resend_email` com `credentials.api_key` configurado |
| Templates | Todos os 14 templates inseridos e `enabled = true` |
| Conta admin | Para acessar `/admin/email-templates` e enviar testes |
| Conta student | Para verificar recebimento de emails |
| Conta mentor | Para verificar emails de booking e live |
| Supabase Dashboard | Para consultar `email_logs` |

### Verificar Setup

```sql
-- Templates existentes
SELECT name, category, enabled FROM email_templates ORDER BY category, name;
-- Esperado: 14 rows, todos enabled=true

-- Resend configurado
SELECT name, is_active FROM api_configs WHERE api_key = 'resend_email';
-- Esperado: 1 row, is_active=true

-- Tabela de logs acessivel
SELECT COUNT(*) FROM email_logs;
```

---

## Catalogo de Templates

### Categoria: system

| Template | Trigger | Edge Function | Variaveis |
|----------|---------|---------------|-----------|
| `onboarding_welcome` | Usuario completa onboarding | `send-welcome-email` | `firstName`, `dashboardLink` |
| `espaco_invitation` | Admin convida para espaco | `send-espaco-invitation` | `invitedNameGreeting`, `mentorName`, `espacoName`, `inviteLink` |

### Categoria: booking

| Template | Trigger | Edge Function | Variaveis |
|----------|---------|---------------|-----------|
| `booking_confirmation` | Student cria booking | `send-booking-confirmation` | `studentName`, `serviceName`, `formattedDate`, `formattedStartTime`, `formattedEndTime`, `durationMinutes`, `mentorName` |
| `booking_reminder` | Cron 24h antes | `send-booking-reminder` | `studentName`, `serviceName`, `formattedDate`, `formattedTime`, `mentorName`, `meetingLinkSection` |
| `booking_reminder_1h` | Cron 1h antes | `send-booking-reminder` | (mesmas do reminder) |
| `booking_rescheduled` | Student reagenda | `send-booking-rescheduled` | `studentName`, `serviceName`, `oldDateSection`, `formattedDate`, `formattedTime`, `mentorName` |
| `booking_cancelled` | Student/admin cancela | `send-booking-cancelled` | `studentName`, `serviceName`, `formattedDate`, `formattedTime`, `mentorName`, `cancellationReasonSection` |
| `booking_no_show` | Mentor marca no-show | `send-booking-cancelled` | (mesmas do cancelled) |

### Categoria: subscription

| Template | Trigger | Edge Function | Variaveis |
|----------|---------|---------------|-----------|
| `subscription_confirmation` | Ticto webhook (activated) | `send-subscription-email` | `name`, `planName` |
| `subscription_renewal_reminder` | (manual/futuro) | `send-subscription-email` | `name`, `planName`, `expiresAt` |
| `subscription_payment_failure` | Ticto webhook (dunning) | `send-subscription-email` | `name`, `planName`, `changeCardUrl` |
| `subscription_cancellation` | Ticto webhook/cancel-subscription | `send-subscription-email` | `name`, `planName`, `expiresAt` |

### Categoria: live

| Template | Trigger | Edge Function | Variaveis | Extras |
|----------|---------|---------------|-----------|--------|
| `live_registration_confirmation` | Usuario se inscreve em live | `send-live-notification` (type: registration) | `participantName`, `liveTitle`, `formattedDate`, `formattedTime`, `duration`, `mentorName`, `googleCalendarLink`, `livePageLink` | Anexo `.ics` |
| `live_going_live` | Mentor clica "Go Live" | `send-live-notification` (type: going_live) | `participantName`, `liveTitle`, `meetingLink`, `livePageLink` | Enviado a todos inscritos |
| `live_unfinished_warning` | Cron (live excedeu duracao + 60min) | `check-unfinished-lives` | `mentorName`, `liveTitle`, `livePageLink`, `manageLiveLink` | Tambem envia WhatsApp |

---

## Cenario 1: Enviar Email de Teste (Admin)

**Objetivo:** Validar que o admin pode enviar email de teste de qualquer template.

### 1.1 Via Admin Panel

**Passos:**
1. Login como admin
2. Navegar para `/admin/email-templates`
3. Na lista, clicar menu (...) de qualquer template → "Enviar Teste"
4. Inserir email do destinatario
5. Clicar "Enviar"

**Resultado Esperado:**
- Toast "Email de teste enviado"
- Email recebido com subject prefixado `[TESTE]`
- Variaveis nao substituidas aparecem como `{{variableName}}` (esperado em teste)

### 1.2 Verificar Log

```sql
SELECT * FROM email_logs
WHERE template_name = '<template_name>'
ORDER BY created_at DESC LIMIT 1;
-- Esperado: status='sent', resend_id preenchido
```

---

## Cenario 2: Welcome Email (Onboarding)

**Objetivo:** Validar que email de boas-vindas e enviado apos onboarding.

### 2.1 Trigger

**Passos:**
1. Criar conta nova ou resetar onboarding de usuario existente
2. Completar todas as 6 etapas do onboarding

**Resultado Esperado:**
- Email recebido com subject "Bem-vindo(a) ao EUA na Pratica, [Nome]!"
- Botao "Explorar o Hub" aponta para dashboard
- Log em `email_logs`: `template_name='onboarding_welcome'`, `status='sent'`

---

## Cenario 3: Booking Emails

**Objetivo:** Validar todos os 5 emails do ciclo de booking.

### 3.1 Confirmacao

**Passos:**
1. Login como student
2. Criar um booking (agendar sessao)

**Resultado Esperado:**
- Email recebido: "Sessao Confirmada: [servico]"
- Detalhes corretos (data, hora, mentor, duracao)
- Log: `template_name='booking_confirmation'`, `status='sent'`

### 3.2 Lembrete 24h (Cron)

**Pre-condicao:** Booking agendado para as proximas 24h.

**Verificacao:**
```sql
SELECT * FROM email_logs
WHERE template_name = 'booking_reminder'
  AND recipient = '<student_email>'
ORDER BY created_at DESC LIMIT 1;
-- Esperado: status='sent' (apos cron rodar)
```

### 3.3 Reagendamento

**Passos:**
1. Login como student
2. Reagendar booking existente

**Resultado Esperado:**
- Email recebido com data antiga riscada e nova data
- Log: `template_name='booking_rescheduled'`

### 3.4 Cancelamento

**Passos:**
1. Cancelar booking

**Resultado Esperado:**
- Email recebido: "Sessao Cancelada"
- Log: `template_name='booking_cancelled'`

---

## Cenario 4: Subscription Emails

**Objetivo:** Validar emails do ciclo de assinatura.

### 4.1 Confirmacao de Assinatura

**Trigger:** Ticto webhook com `status='activated'`

**Verificacao:**
```sql
SELECT * FROM email_logs
WHERE template_name = 'subscription_confirmation'
ORDER BY created_at DESC LIMIT 5;
```

### 4.2 Falha de Pagamento

**Trigger:** Ticto webhook com `status='dunning_updated'`

**Verificacao:**
```sql
SELECT * FROM email_logs
WHERE template_name = 'subscription_payment_failure'
ORDER BY created_at DESC LIMIT 5;
```

### 4.3 Cancelamento de Assinatura

**Trigger:** Admin cancela via `/admin/assinaturas` ou Ticto webhook `status='cancelled'`

**Verificacao:**
```sql
SELECT * FROM email_logs
WHERE template_name = 'subscription_cancellation'
ORDER BY created_at DESC LIMIT 5;
```

---

## Cenario 5: Live Registration Confirmation (com Calendar)

**Objetivo:** Validar que inscricao em live envia email com convite de calendario.

### 5.1 Inscricao

**Passos:**
1. Login como student
2. Navegar para `/live/<slug>` de uma live agendada
3. Clicar "Inscreva-se Gratuitamente"

**Resultado Esperado:**
- Email recebido: "Inscricao confirmada: [titulo]"
- Detalhes: data, horario, duracao, nome do mentor
- Botao "Adicionar ao Google Calendar" funcional (abre Google Calendar com evento pre-preenchido)
- Arquivo `.ics` anexo ao email
- Gmail/Outlook mostra opcao "Adicionar ao Calendario" automaticamente

### 5.2 Verificar ICS

- Abrir arquivo .ics anexo
- Evento deve ter: titulo da live, data/hora corretos, descricao com link da live

### 5.3 Verificar Log

```sql
SELECT * FROM email_logs
WHERE template_name = 'live_registration_confirmation'
  AND recipient = '<student_email>'
ORDER BY created_at DESC LIMIT 1;
-- Esperado: status='sent'
```

---

## Cenario 6: Live Going Live Notification

**Objetivo:** Validar que todos os inscritos recebem email quando mentor inicia live.

### 6.1 Go Live

**Pre-condicao:** Live com 2+ inscritos.

**Passos:**
1. Login como mentor
2. Clicar "Go Live" na live agendada

**Resultado Esperado:**
- Todos os inscritos recebem email "Estamos ao vivo! [titulo]"
- Email contem botao "Entrar na Live" com link da reuniao
- Link alternativo para pagina da live

### 6.2 Verificar Logs

```sql
SELECT recipient, status, created_at FROM email_logs
WHERE template_name = 'live_going_live'
ORDER BY created_at DESC LIMIT 20;
-- Esperado: 1 row por inscrito, todos status='sent'
```

---

## Cenario 7: Live Unfinished Warning (Cron)

**Objetivo:** Validar que mentor e notificado quando live excede duracao.

### 7.1 Setup

```sql
-- Criar live "ao vivo" que excedeu duracao ha mais de 60 min
UPDATE lives SET
  status = 'live',
  scheduled_at = now() - interval '3 hours',
  duration_minutes = 60
WHERE id = '<live_uuid>';
```

### 7.2 Aguardar Cron

O cron `check-unfinished-lives` roda a cada 15 minutos.

### 7.3 Verificar

```sql
-- Email enviado ao mentor
SELECT * FROM email_logs
WHERE template_name = 'live_unfinished_warning'
ORDER BY created_at DESC LIMIT 5;
-- Esperado: 1 row para o mentor da live

-- Live auto-encerrada
SELECT status FROM lives WHERE id = '<live_uuid>';
-- Esperado: 'completed'
```

---

## Cenario 8: Template Desabilitado

**Objetivo:** Validar que email nao e enviado quando template esta desabilitado.

### 8.1 Desabilitar Template

**Passos:**
1. Admin: `/admin/email-templates` → desabilitar `booking_confirmation`
2. Student: criar um booking

**Resultado Esperado:**
- Nenhum email recebido
- Log: `template_name='booking_confirmation'`, `status='skipped'`, `error_message='Template disabled'`

### 8.2 Reabilitar

1. Admin: reabilitar o template
2. Verificar que emails futuros sao enviados normalmente

---

## Cenario 9: Template Editado via Admin

**Objetivo:** Validar que edicoes no admin se refletem nos emails enviados.

### 9.1 Editar Subject

**Passos:**
1. Admin: editar subject de `onboarding_welcome` para "Bem-vindo, {{firstName}}! Personalizado"
2. Completar onboarding de um novo usuario

**Resultado Esperado:**
- Email recebido com subject personalizado
- Variaveis substituidas corretamente

### 9.2 Reverter

1. Restaurar subject original

---

## Queries de Diagnostico

```sql
-- Emails enviados nas ultimas 24h por template
SELECT template_name, status, COUNT(*) as total
FROM email_logs
WHERE created_at > now() - interval '24 hours'
GROUP BY template_name, status
ORDER BY template_name;

-- Emails com erro
SELECT template_name, recipient, error_message, created_at
FROM email_logs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 20;

-- Emails por dia (ultimos 7 dias)
SELECT created_at::date AS dia, COUNT(*) AS total,
       COUNT(*) FILTER (WHERE status='sent') AS enviados,
       COUNT(*) FILTER (WHERE status='failed') AS falhas,
       COUNT(*) FILTER (WHERE status='skipped') AS pulados
FROM email_logs
WHERE created_at > now() - interval '7 days'
GROUP BY dia ORDER BY dia;

-- Verificar se Resend API esta funcional
SELECT * FROM email_logs
WHERE status = 'sent' AND resend_id IS NOT NULL
ORDER BY created_at DESC LIMIT 1;
```

---

## Checklist Rapido

| # | Cenario | Status |
|---|---------|--------|
| 1 | Admin envia email de teste | [ ] |
| 2 | Welcome email apos onboarding | [ ] |
| 3 | Booking confirmation | [ ] |
| 4 | Booking reminder (cron 24h) | [ ] |
| 5 | Booking rescheduled | [ ] |
| 6 | Booking cancelled | [ ] |
| 7 | Subscription confirmation (Ticto activated) | [ ] |
| 8 | Subscription payment failure (Ticto dunning) | [ ] |
| 9 | Subscription cancellation | [ ] |
| 10 | Live registration confirmation (com .ics) | [ ] |
| 11 | Live going_live notification (todos inscritos) | [ ] |
| 12 | Live unfinished warning (cron auto-close) | [ ] |
| 13 | Template desabilitado nao envia | [ ] |
| 14 | Template editado reflete no email | [ ] |
| 15 | Google Calendar link funcional | [ ] |
| 16 | ICS attachment abre no calendario | [ ] |

---

## Troubleshooting

| Problema | Causa Provavel | Solucao |
|----------|---------------|---------|
| Email nao enviado, sem log | Edge Function nao invocada | Verificar `verify_jwt=false` em `config.toml` |
| Log `status='skipped'` | Template desabilitado ou nao encontrado | Verificar `enabled=true` e nome correto |
| Log `status='failed'` com `Resend HTTP 401` | API key invalida | Verificar `api_configs` key `resend_email` |
| Log `status='failed'` com `Resend HTTP 422` | Endereco invalido ou dominio nao verificado | Verificar remetente no Resend dashboard |
| Email enviado mas nao recebido | Spam ou bounce | Verificar pasta spam, Resend dashboard |
| Variaveis nao substituidas `{{...}}` | Nome da variavel nao coincide | Verificar que o Edge Function passa exatamente `{{variableName}}` |
| ICS nao anexo | Resend nao recebeu attachments | Verificar logs do Edge Function para erros |
