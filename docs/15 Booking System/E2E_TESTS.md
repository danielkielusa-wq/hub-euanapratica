# Booking System — Manual de Testes E2E

**Última atualização:** 2026-02-26
**Escopo:** Todos os fluxos do sistema de agendamentos (Aluno, Mentor, Admin)

---

## Pré-requisitos

### Dados de Teste

Antes de executar os testes, garanta que existem no banco:

| Entidade | Requisito |
|----------|-----------|
| **Mentor** | Usuário com role `mentor` e `mentor_services` ativo vinculado a um `hub_services` do tipo `consulting` ou `live_mentoring` |
| **Aluno** | Usuário com role `student`, `user_hub_services` ativo para o serviço, e sem bookings conflitantes |
| **Admin** | Usuário com role `admin` |
| **Serviço** | `hub_services` ativo com `service_type = 'consulting'` ou `'live_mentoring'`, visível no hub |
| **Disponibilidade** | `mentor_availability` com pelo menos 2 dias da semana ativos e horários futuros (dentro de 30 dias) |
| **Meeting link** | `mentor_services.default_meeting_link` preenchido para o mentor-serviço |
| **Política** | `booking_policies` com política global (service_id IS NULL). Valores padrão: `max_concurrent=3, max_reschedules=2, min_notice=48h, max_advance=30d, cancellation_window=24h` |
| **Templates de email** | `email_templates` com templates habilitados: `booking_confirmation`, `booking_reminder`, `booking_reminder_1h`, `booking_rescheduled`, `booking_cancelled`, `booking_no_show` |

### Verificação rápida via SQL

```sql
-- Mentor com serviço ativo
SELECT ms.*, p.full_name, hs.name as service_name
FROM mentor_services ms
JOIN profiles p ON p.id = ms.mentor_id
JOIN hub_services hs ON hs.id = ms.service_id
WHERE ms.is_active = true;

-- Disponibilidade do mentor
SELECT * FROM mentor_availability WHERE mentor_id = '<mentor_id>' AND is_active = true;

-- Aluno com acesso ao serviço
SELECT uhs.*, p.full_name
FROM user_hub_services uhs
JOIN profiles p ON p.id = uhs.user_id
WHERE uhs.service_id = '<service_id>' AND uhs.status = 'active';

-- Política global
SELECT * FROM booking_policies WHERE service_id IS NULL;

-- Templates de email
SELECT name, enabled FROM email_templates WHERE name LIKE 'booking_%';
```

---

## Glossário de Status

| Status | Descrição | Transições possíveis |
|--------|-----------|---------------------|
| `confirmed` | Sessão agendada e ativa | → `completed`, `cancelled`, `no_show` |
| `completed` | Sessão realizada pelo mentor | (estado final) |
| `cancelled` | Cancelada com mais de 24h de antecedência | (estado final) |
| `no_show` | Cancelada com menos de 24h OU marcada manualmente pelo admin | (estado final) |

---

## 1. Fluxo do Aluno — Criar Agendamento

**Rota:** `/dashboard/agendar/:serviceId`
**Componente:** `BookingFlow.tsx`

### TC-1.1: Access Gate — Aluno sem acesso ao serviço

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Logar como aluno SEM `user_hub_services` ativo para o serviço | — |
| 2 | Navegar para `/dashboard/agendar/<serviceId>` | Card âmbar exibido: "Você não tem acesso a este serviço" |
| 3 | Verificar links | Links para `/catalogo` e `/dashboard/hub` visíveis e funcionais |

### TC-1.2: Access Gate — Admin bypass

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Logar como admin | — |
| 2 | Navegar para `/dashboard/agendar/<serviceId>` | Booking flow carrega normalmente (sem gate de acesso) |

### TC-1.3: Booking Limit Gate — Limite atingido

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Criar bookings até atingir `max_concurrent_bookings` (padrão: 3) | — |
| 2 | Tentar acessar `/dashboard/agendar/<serviceId>` | Mensagem de limite atingido exibida. Botão de agendamento desabilitado |

### TC-1.4: Seleção de horário (Step 1 — select-time)

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Logar como aluno com acesso | — |
| 2 | Navegar para `/dashboard/agendar/<serviceId>` | `WeekCalendar` renderiza com 7 dias. Header mostra nome do serviço e info do mentor |
| 3 | Verificar semana atual | Dias com slots disponíveis mostram badge verde com contagem (ex: "3") |
| 4 | Clicar em dia com disponibilidade | `TimeSlotPicker` aparece abaixo com botões de horário |
| 5 | Verificar horários passados | Slots no passado NÃO aparecem (mesmo que dentro da disponibilidade) |
| 6 | Verificar `min_notice_hours` | Slots com menos de 48h de antecedência NÃO aparecem |
| 7 | Clicar seta "próxima semana" | Navega para semana seguinte. Novos slots carregam |
| 8 | Clicar seta "semana anterior" | Retorna para semana atual. Seta desabilitada quando `weekOffset=0` |
| 9 | Navegar além de `max_advance_days` (30d) | Seta "próxima semana" desabilitada quando `endDate >= maxDate` |
| 10 | Clicar em um horário disponível | Avança para Step 2 (confirm) |

### TC-1.5: Confirmação do agendamento (Step 2 — confirm)

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | (continuação do TC-1.4) | Tela de confirmação exibe: data, horário, duração, nome do mentor, avatar |
| 2 | Verificar informações de política | Exibe aviso: "Cancelamento com menos de 24h será marcado como no-show" e "Máximo de 2 reagendamentos" |
| 3 | Preencher campo de notas (opcional) | Texto digitado persiste |
| 4 | Clicar "Voltar" | Retorna para Step 1 sem perder o horário selecionado |
| 5 | Clicar "Confirmar Agendamento" | Botão mostra spinner. Após sucesso, avança para Step 3 |

### TC-1.6: Sucesso (Step 3 — success)

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | (continuação do TC-1.5) | Tela de sucesso com ícone de check |
| 2 | Verificar links | "Ver meus agendamentos" → `/dashboard/agendamentos`. "Voltar ao Hub" → `/dashboard` |
| 3 | Verificar banco de dados | `bookings` tem nova row com `status='confirmed'`, `meeting_link` preenchido (do `mentor_services.default_meeting_link`) |
| 4 | Verificar `booking_history` | Entry com `action='created'` |
| 5 | Verificar email | Email de confirmação (`booking_confirmation`) enviado ao aluno com data, horário, mentor, link da reunião |

### TC-1.7: Conflito de horário (race condition)

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Abrir booking flow em 2 browsers (2 alunos diferentes) | — |
| 2 | Ambos selecionam o MESMO horário | — |
| 3 | Aluno A confirma primeiro | Booking criada com sucesso |
| 4 | Aluno B confirma logo em seguida | Erro amigável: slot já ocupado. Toast com mensagem de conflito |

### TC-1.8: Mentor sem disponibilidade

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Garantir que mentor não tem `mentor_availability` ativa | — |
| 2 | Aluno acessa booking flow | Calendário mostra todos os dias sem slots (badges zerados ou ausentes) |
| 3 | Clicar em qualquer dia | Mensagem de "nenhum horário disponível" ou lista vazia |

### TC-1.9: Mentor com bloqueio de agenda

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Criar `mentor_blocked_times` cobrindo um período com disponibilidade | — |
| 2 | Aluno verifica slots nesse período | Slots do período bloqueado NÃO aparecem. Slots fora do bloqueio aparecem normalmente |

---

## 2. Fluxo do Aluno — Meus Agendamentos

**Rota:** `/dashboard/agendamentos`
**Componente:** `StudentBookings.tsx`

### TC-2.1: Visualização — Tab "Próximos"

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Logar como aluno com bookings | — |
| 2 | Navegar para `/dashboard/agendamentos` | Tab "Próximos" ativa por padrão |
| 3 | Verificar cards | Cada booking mostra: date box (mês/dia/hora), nome do serviço, duração, mentor, status badge "Confirmado" (verde) |
| 4 | Verificar stats row | Contadores: upcoming, completed, cancelled, remaining slots |
| 5 | Verificar botão "Entrar na Reunião" | Visível apenas se `meeting_link` existe e booking é futura |
| 6 | Clicar "Entrar na Reunião" | Abre link em nova aba |

### TC-2.2: Visualização — Tab "Anteriores"

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Clicar tab "Anteriores" | Lista de bookings passadas e/ou com status != confirmed |
| 2 | Verificar badges de status | Corretos: "Concluído" (verde), "Cancelado" (vermelho), "Não compareceu" (amarelo) |
| 3 | Verificar ações | Dropdown de reagendar/cancelar NÃO aparece em bookings passadas |

### TC-2.3: Toggle de visualização (Lista/Calendário)

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Clicar ícone de calendário | Muda para visualização calendário mensal |
| 2 | Verificar eventos | Bookings aparecem nos dias corretos |
| 3 | Clicar ícone de lista | Retorna para visualização em cards |

### TC-2.4: Estado vazio

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Logar como aluno SEM bookings | — |
| 2 | Navegar para `/dashboard/agendamentos` | Componente `EmptyBookings` exibido com mensagem amigável e CTA |

---

## 3. Fluxo do Aluno — Reagendar

**Componente:** `RescheduleModal.tsx`

### TC-3.1: Reagendamento bem-sucedido

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Na lista de agendamentos, clicar dropdown de uma booking confirmada | Opção "Reagendar" visível |
| 2 | Clicar "Reagendar" | `RescheduleModal` abre com info da booking atual (read-only) e contador de reagendamentos |
| 3 | Selecionar novo horário no `WeekCalendar` embutido | Horário selecionado destacado |
| 4 | Clicar "Confirmar Reagendamento" | Modal fecha, toast de sucesso, lista atualiza com novo horário |
| 5 | Verificar banco | `reschedule_count` incrementou, `last_rescheduled_at` atualizado, `scheduled_start/end` atualizados |
| 6 | Verificar `booking_history` | Entry com `action='rescheduled'`, `old_datetime` e `new_datetime` preenchidos |
| 7 | Verificar email | Email `booking_rescheduled` enviado com data antiga (riscada, em vermelho) e nova data |

### TC-3.2: Limite de reagendamentos atingido

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Reagendar uma booking até atingir `max_reschedules_per_booking` (padrão: 2) | — |
| 2 | Verificar dropdown da booking | Opção "Reagendar" desabilitada ou ausente |
| 3 | Verificar mensagem | Texto em itálico: "Já reagendou 2/2 vezes" (ou similar) |

### TC-3.3: Reagendamento dentro da janela de cancelamento (< 24h)

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Ter booking confirmada com `scheduled_start` em menos de 24h | — |
| 2 | Verificar dropdown | Opção "Reagendar" desabilitada |
| 3 | Verificar mensagem | Texto explicativo: "Não é possível reagendar com menos de 24h de antecedência" |

---

## 4. Fluxo do Aluno — Cancelar

**Componente:** `CancelModal.tsx`

### TC-4.1: Cancelamento normal (> 24h de antecedência)

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Clicar "Cancelar" no dropdown de uma booking com > 24h de antecedência | `CancelModal` abre |
| 2 | Verificar modal | SEM aviso de cancelamento tardio |
| 3 | Preencher motivo (opcional) | Texto persiste |
| 4 | Confirmar cancelamento | Modal fecha, toast de sucesso, booking desaparece de "Próximos" e aparece em "Anteriores" |
| 5 | Verificar banco | `status = 'cancelled'`, `cancelled_at` preenchido, `cancellation_reason` salvo |
| 6 | Verificar `booking_history` | Entry com `action='cancelled'` |
| 7 | Verificar email | Email `booking_cancelled` enviado. Se motivo foi preenchido, seção `{{cancellationReasonSection}}` renderizada |

### TC-4.2: Cancelamento tardio (< 24h de antecedência)

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Clicar "Cancelar" no dropdown de uma booking com < 24h | `CancelModal` abre |
| 2 | Verificar modal | **Aviso de cancelamento tardio** visível em destaque: "Esta sessão será marcada como não comparecimento" |
| 3 | Confirmar cancelamento | Modal fecha, toast, booking marcada como `no_show` (não `cancelled`) |
| 4 | Verificar banco | `status = 'no_show'` |
| 5 | Verificar email | Email `booking_no_show` enviado (template diferente do cancelled) |

### TC-4.3: Cancelamento indisponível para bookings passadas

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Verificar booking com `scheduled_start` no passado | — |
| 2 | Verificar dropdown | Opção "Cancelar" ausente (booking já na tab "Anteriores") |

---

## 5. Fluxo do Mentor — Agendamentos

**Rota:** `/mentor/agendamentos`
**Componente:** `MentorAgendamentos.tsx`

### TC-5.1: Visualização de agendamentos

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Logar como mentor | — |
| 2 | Navegar para `/mentor/agendamentos` | Stats cards: upcoming, completed, no-show |
| 3 | Tab "Próximos" | Cards com: date box, nome do aluno, serviço, botão "Entrar" (meeting link) |
| 4 | Tab "Anteriores" | Bookings passadas com status badge correto |

### TC-5.2: Entrar na reunião

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Clicar "Entrar" em booking com `meeting_link` | Link abre em nova aba |
| 2 | Verificar booking SEM `meeting_link` | Botão "Entrar" ausente ou desabilitado |

### TC-5.3: Concluir sessão

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Clicar "Concluir" em booking confirmada | Dialog abre com campo de notas (opcional) |
| 2 | Preencher notas do mentor | — |
| 3 | Confirmar | Dialog fecha, booking move para "Anteriores" com badge "Concluído" |
| 4 | Verificar banco | `status = 'completed'`, `completed_at` preenchido, `mentor_notes` salvo |
| 5 | Verificar `booking_history` | Entry com `action='completed'` |

---

## 6. Fluxo do Mentor — Disponibilidade

**Rota:** `/mentor/disponibilidade`
**Componente:** `MentorDisponibilidade.tsx`

### TC-6.1: Configurar meeting link

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Logar como mentor | — |
| 2 | Navegar para `/mentor/disponibilidade` | Meeting link input visível por mentor_service |
| 3 | Inserir URL do Google Meet / Zoom | — |
| 4 | Salvar | Toast de sucesso. `mentor_services.default_meeting_link` atualizado |
| 5 | Criar nova booking como aluno | `bookings.meeting_link` automaticamente preenchido com o link salvo |

### TC-6.2: Adicionar disponibilidade semanal

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Clicar "Adicionar horário" | Form/row aparece: dia da semana, horário início, horário fim |
| 2 | Selecionar "Segunda-feira", 09:00-12:00 | — |
| 3 | Salvar | Row aparece na tabela. Toggle "ativo" ligado |
| 4 | Verificar como aluno | Slots de segunda 09:00-12:00 aparecem no `WeekCalendar` (respeitando `slot_interval_minutes`) |

### TC-6.3: Desativar disponibilidade

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Toggle "ativo" para OFF em um horário | — |
| 2 | Verificar como aluno | Slots desse período NÃO aparecem mais |

### TC-6.4: Deletar disponibilidade

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Clicar botão de deletar em um horário | Row removida da tabela |
| 2 | Verificar banco | Row deletada de `mentor_availability` |

### TC-6.5: Adicionar bloqueio de agenda

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Na seção "Bloqueios", clicar adicionar | Form: data/hora início, data/hora fim, motivo (opcional) |
| 2 | Selecionar período futuro dentro de um horário com disponibilidade | — |
| 3 | Salvar | Bloqueio aparece na lista |
| 4 | Verificar como aluno | Slots dentro do período bloqueado NÃO aparecem |

### TC-6.6: Deletar bloqueio de agenda

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Clicar deletar em um bloqueio | Bloqueio removido da lista |
| 2 | Verificar como aluno | Slots do período voltam a aparecer |

### TC-6.7: Validação — horário inválido

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Tentar criar disponibilidade com `start_time >= end_time` | Erro de validação. Row não criada |

---

## 7. Fluxo do Mentor — Agenda Unificada

**Rota:** `/mentor/agenda`
**Componente:** `MentorAgenda.tsx`

### TC-7.1: Visualização do calendário mensal

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Logar como mentor | — |
| 2 | Navegar para `/mentor/agenda` | Calendário mensal com sessões e bookings |
| 3 | Verificar dias com eventos | Bookings 1:1 mostram badge "1:1". Sessões de grupo mostram badge diferente |
| 4 | Filtrar por tipo | Filtro "Booking" → só bookings. Filtro "Sessão" → só sessões |

### TC-7.2: Botão "Entrar na Reunião" no calendário

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Clicar em booking no calendário | `BookingDayCard` exibe detalhes |
| 2 | Se horário atual está entre (início - 15min) e (início + 2h) | Botão "Acessar Reunião" visível e funcional |
| 3 | Se fora dessa janela | Botão ausente ou desabilitado |

---

## 8. Fluxo do Admin — Agendamentos (Tab 1)

**Rota:** `/admin/agendamentos`
**Componente:** `AdminAgendamentos.tsx`

### TC-8.1: Listagem e filtros

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Logar como admin | — |
| 2 | Navegar para `/admin/agendamentos` | Tabela com todas as bookings (todos os mentors/alunos) |
| 3 | Filtrar por status "Confirmado" | Apenas bookings confirmadas visíveis |
| 4 | Filtrar por mentor | Apenas bookings do mentor selecionado |
| 5 | Limpar filtros | Todas as bookings visíveis novamente |

### TC-8.2: Marcar como concluída (Admin)

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Clicar dropdown de booking confirmada → "Marcar Concluída" | Dialog com campo de notas do mentor |
| 2 | Preencher notas e confirmar | Status muda para "Concluído". Toast de sucesso |
| 3 | Verificar banco | `status='completed'`, `mentor_notes` preenchido |

### TC-8.3: Cancelar booking (Admin)

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Dropdown → "Cancelar" | Dialog com campo de motivo |
| 2 | Preencher motivo e confirmar | Status muda para "Cancelado" ou "No-show" (conforme janela de cancelamento) |
| 3 | Verificar email | Email `booking_cancelled` ou `booking_no_show` enviado |

### TC-8.4: Marcar no-show (Admin)

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Dropdown → "Marcar No-show" | Dialog com campo de motivo |
| 2 | Confirmar | Status muda para "No-show" (independente da janela — admin bypassa a regra) |
| 3 | Verificar banco | `status='no_show'` via UPDATE direto (sem RPC de cancel) |
| 4 | Verificar `booking_history` | Entry com `action='no_show_marked'` |

---

## 9. Fluxo do Admin — Disponibilidade (Tab 2)

### TC-9.1: Gerenciar mentor-service assignments

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Na tab "Disponibilidade", selecionar um mentor | Cards de `mentor_services` do mentor exibidos |
| 2 | Clicar "Adicionar" | Dialog com: mentor (pre-selected), serviço, duração, buffer, meeting link |
| 3 | Preencher e salvar | Card do serviço aparece na lista |
| 4 | Editar duração | Dialog abre com valores atuais. Alterar e salvar → valores atualizados |
| 5 | Deletar assignment | Card removido. Confirmação antes de deletar |

### TC-9.2: Gerenciar disponibilidade semanal (Admin)

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Selecionar mentor | Tabela de disponibilidade semanal carrega |
| 2 | Adicionar row (ex: "Terça, 14:00-18:00") | Row adicionada |
| 3 | Toggle ativo/inativo | Status alternado |
| 4 | Deletar row | Row removida |
| 5 | Verificar como aluno | Slots refletem as mudanças feitas pelo admin |

### TC-9.3: Gerenciar bloqueios (Admin)

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Selecionar mentor | Lista de bloqueios carrega |
| 2 | Adicionar bloqueio com período e motivo | Bloqueio aparece na lista |
| 3 | Deletar bloqueio | Bloqueio removido |

---

## 10. Fluxo do Admin — Políticas (Tab 3)

### TC-10.1: Editar política global

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Na tab "Políticas" | Form com 7 campos preenchidos com valores atuais |
| 2 | Alterar `max_concurrent_bookings` de 3 para 1 | — |
| 3 | Clicar "Salvar" | Toast de sucesso |
| 4 | Verificar como aluno com 1 booking ativa | Gate de limite impede criação de nova booking |
| 5 | Reverter para valor original (3) | — |

### TC-10.2: Alterar janela de cancelamento

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Alterar `cancellation_window_hours` de 24 para 12 | — |
| 2 | Booking com 18h de antecedência (antes era no-show) | Aluno agora CONSEGUE cancelar normalmente (> 12h) |
| 3 | Reverter para 24h | — |

### TC-10.3: Alterar min_notice_hours

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Alterar `min_notice_hours` de 48 para 24 | — |
| 2 | Verificar slots | Slots com 30h de antecedência agora aparecem (antes estavam ocultos) |
| 3 | Reverter para 48h | — |

---

## 11. Emails de Booking

### TC-11.1: Email de confirmação

| Campo | Valor |
|-------|-------|
| **Trigger** | `useCreateBooking` → `send-booking-confirmation` |
| **Destinatário** | Email do aluno |
| **Template** | `booking_confirmation` |
| **Variáveis** | `studentName`, `serviceName`, `formattedDate`, `formattedStartTime`, `formattedEndTime`, `durationMinutes`, `mentorName`, `meetingLink` |
| **Timezone** | Usa `profiles.timezone` do aluno (default: `America/Sao_Paulo`) |

### TC-11.2: Email de reagendamento

| Campo | Valor |
|-------|-------|
| **Trigger** | `useRescheduleBooking` → `send-booking-rescheduled` |
| **Destinatário** | Email do aluno |
| **Template** | `booking_rescheduled` |
| **Verificar** | Data antiga aparece riscada em vermelho (`oldDateSection`), nova data em destaque |

### TC-11.3: Email de cancelamento

| Campo | Valor |
|-------|-------|
| **Trigger** | `useCancelBooking` → `send-booking-cancelled` |
| **Template** | `booking_cancelled` se cancelamento normal, `booking_no_show` se tardio |
| **Verificar** | `cancellationReasonSection` renderiza se motivo foi preenchido |

### TC-11.4: Email de lembrete 24h

| Campo | Valor |
|-------|-------|
| **Trigger** | pg_cron a cada 15min → `send-booking-reminder` com `hours_before=24` |
| **Template** | `booking_reminder` |
| **Verificar** | `meetingLinkSection` mostra botão "Entrar" se link existe, ou texto "disponível em breve" |

### TC-11.5: Email de lembrete 1h

| Campo | Valor |
|-------|-------|
| **Trigger** | pg_cron a cada 15min → `send-booking-reminder` com `hours_before=1` |
| **Template** | `booking_reminder_1h` |
| **Verificar** | `meetingLinkSection` sempre mostra botão (1h antes o link já deve existir) |

### Como testar emails

1. **Via admin**: `/admin/email-templates` → selecionar template → "Enviar Teste" (prefixo `[TESTE]` no subject)
2. **Via Edge Function direta**: `send-test-email` aceita `{ template_name, to }` com header `x-internal-secret`
3. **Via Supabase logs**: Dashboard → Edge Functions → Logs → filtrar por `send-booking-*`
4. **Via Resend dashboard**: Verificar logs de envio em `app.resend.com`

---

## 12. Testes de Timezone

### TC-12.1: Aluno em timezone diferente

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Mentor configura disponibilidade em `America/Sao_Paulo` (UTC-3) | — |
| 2 | Aluno com `profiles.timezone = 'America/New_York'` (UTC-5) | — |
| 3 | Aluno visualiza slots | Horários exibidos no timezone do browser/perfil do aluno |
| 4 | Aluno agenda sessão | `scheduled_start` salvo em UTC no banco |
| 5 | Email de confirmação | Horários formatados no timezone do aluno (`America/New_York`) |

---

## 13. Testes de Concorrência e Edge Cases

### TC-13.1: Double-click no botão de confirmar

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Clicar "Confirmar Agendamento" rapidamente 2 vezes | Apenas 1 booking criada. Botão desabilitado após primeiro clique (spinner) |

### TC-13.2: Slot fica indisponível durante confirmação

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Aluno A seleciona slot e fica na tela de confirmação | — |
| 2 | Aluno B agenda o mesmo slot enquanto isso | — |
| 3 | Aluno A confirma | Erro amigável de conflito. Unique index `(mentor_id, scheduled_start) WHERE status='confirmed'` impede duplicata |

### TC-13.3: Reagendar para slot ocupado

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Abrir modal de reagendamento | — |
| 2 | Selecionar slot que foi ocupado entre o carregamento e a confirmação | Erro de conflito. Booking mantém horário original |

### TC-13.4: Booking no passado — ações desabilitadas

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Booking com `scheduled_start` já passado e `status='confirmed'` | — |
| 2 | Verificar UI do aluno | Booking aparece em "Anteriores", sem opções de reagendar/cancelar |
| 3 | Verificar UI do mentor | Botão "Concluir" disponível para bookings passadas não concluídas |

### TC-13.5: Mentor removido do sistema

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Mentor é removido | `bookings.mentor_id` vira NULL (ON DELETE SET NULL) |
| 2 | Aluno visualiza booking | Card exibe info sem crash (mentor name fallback para placeholder) |

---

## 14. Testes de Navegação e Permissão

### TC-14.1: Aluno tenta acessar rotas de mentor

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Logar como aluno | — |
| 2 | Navegar para `/mentor/agendamentos` | Redirecionado (ProtectedRoute bloqueia) |
| 3 | Navegar para `/mentor/disponibilidade` | Redirecionado (ProtectedRoute bloqueia) |

### TC-14.2: Mentor tenta acessar rotas de admin

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Logar como mentor | — |
| 2 | Navegar para `/admin/agendamentos` | Redirecionado (ProtectedRoute `allowedRoles={['admin']}` bloqueia) |

### TC-14.3: Admin acessa todas as rotas

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Logar como admin | — |
| 2 | `/admin/agendamentos` | Acesso OK |
| 3 | `/mentor/agendamentos` | Acesso OK (`allowedRoles={['mentor', 'admin']}`) |
| 4 | `/dashboard/agendamentos` | Acesso OK |

### TC-14.4: Sidebar navigation por role

| Role | Links visíveis |
|------|---------------|
| **Aluno** | "Agendamentos" → `/dashboard/agendamentos` (grupo DISCOVERY) |
| **Mentor** | "Agendamentos" → `/mentor/agendamentos` + "Disponibilidade" → `/mentor/disponibilidade` (grupo GESTÃO) |
| **Admin** | "Agendamentos" → `/admin/agendamentos` (grupo GESTÃO DE CONTEÚDO) |

---

## 15. Testes de Cron Jobs (Lembretes)

### TC-15.1: Verificar cron jobs ativos

```sql
SELECT jobid, schedule, command, active
FROM cron.job
WHERE jobname LIKE 'send-booking-reminder%';
```

**Esperado:** 2 jobs ativos (`24h` e `1h`), ambos com schedule `*/15 * * * *`.

### TC-15.2: Verificar execução do cron

```sql
SELECT job_id, status, return_message, start_time, end_time
FROM cron.job_run_details
WHERE job_id IN (SELECT jobid FROM cron.job WHERE jobname LIKE 'send-booking-reminder%')
ORDER BY start_time DESC
LIMIT 10;
```

**Esperado:** Execuções recentes com `status = 'succeeded'`.

### TC-15.3: Testar lembrete manualmente

```bash
curl -X POST https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/send-booking-reminder \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: <secret>" \
  -d '{"hours_before": 24}'
```

**Esperado:** Response 200. Emails enviados para bookings confirmadas ~24h no futuro.

### TC-15.4: Lembrete — risco de duplicata

> **Nota:** O sistema atual NÃO tem deduplicação nativa. O intervalo ±30min e a frequência de 15min podem causar emails duplicados. Registrar como known issue se observado.

---

## 16. Checklist de Regressão Rápida (Smoke)

Mínimo para validar após cada deploy:

- [ ] Aluno acessa `/dashboard/agendar/<serviceId>` e vê slots
- [ ] Aluno cria booking → status `confirmed`, `meeting_link` preenchido
- [ ] Email de confirmação recebido
- [ ] Aluno reagenda booking → novo horário, `reschedule_count` incrementa
- [ ] Aluno cancela booking → status correto (`cancelled` ou `no_show`)
- [ ] Mentor vê bookings em `/mentor/agendamentos`
- [ ] Mentor conclui sessão → status `completed`
- [ ] Mentor configura disponibilidade e meeting link
- [ ] Admin vê todas as bookings em `/admin/agendamentos`
- [ ] Admin cancela booking e marca no-show
- [ ] Admin edita política global
- [ ] Cron jobs de lembrete ativos: `SELECT * FROM cron.job WHERE jobname LIKE 'booking%'`

---

## 17. Queries Úteis para Validação

```sql
-- Todas as bookings de um aluno
SELECT b.*, hs.name as service, p.full_name as mentor
FROM bookings b
LEFT JOIN hub_services hs ON hs.id = b.service_id
LEFT JOIN profiles p ON p.id = b.mentor_id
WHERE b.student_id = '<student_id>'
ORDER BY b.scheduled_start DESC;

-- Histórico de uma booking
SELECT * FROM booking_history
WHERE booking_id = '<booking_id>'
ORDER BY created_at;

-- Slots disponíveis (via RPC)
SELECT * FROM get_available_slots(
  '<service_id>', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'
);

-- Stats do aluno (via RPC)
SELECT * FROM get_student_booking_stats('<student_id>');

-- Verificar meeting link auto-preenchido
SELECT b.meeting_link, ms.default_meeting_link
FROM bookings b
JOIN mentor_services ms ON ms.id = b.mentor_service_id
WHERE b.id = '<booking_id>';
```

---

## Referência de Arquivos

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/pages/booking/BookingFlow.tsx` | Página | Fluxo de agendamento (3 steps) |
| `src/pages/booking/StudentBookings.tsx` | Página | Meus agendamentos (aluno) |
| `src/pages/mentor/MentorAgendamentos.tsx` | Página | Agendamentos do mentor |
| `src/pages/mentor/MentorDisponibilidade.tsx` | Página | Configurar disponibilidade |
| `src/pages/mentor/MentorAgenda.tsx` | Página | Calendário unificado |
| `src/pages/admin/AdminAgendamentos.tsx` | Página | Gestão de agendamentos (3 tabs) |
| `src/hooks/useCreateBooking.ts` | Hook | Criar booking + email |
| `src/hooks/useCancelBooking.ts` | Hook | Cancelar + completar booking |
| `src/hooks/useRescheduleBooking.ts` | Hook | Reagendar booking + email |
| `src/hooks/useBookings.ts` | Hook | Queries do aluno |
| `src/hooks/useBookingPolicies.ts` | Hook | Políticas e limites |
| `src/hooks/useAvailableSlots.ts` | Hook | Consulta de slots |
| `src/hooks/useAdminBookings.ts` | Hook | 14 hooks admin |
| `src/hooks/useMentorAvailability.ts` | Hook | 8 hooks mentor |
| `src/hooks/useMentorBookings.ts` | Hook | 3 hooks mentor bookings |
| `src/components/booking/WeekCalendar.tsx` | Componente | Seletor de semana/dia |
| `src/components/booking/TimeSlotPicker.tsx` | Componente | Grid de horários |
| `src/components/booking/BookingConfirmation.tsx` | Componente | Tela de confirmação |
| `src/components/booking/BookingCard.tsx` | Componente | Card de booking (aluno) |
| `src/components/booking/RescheduleModal.tsx` | Componente | Modal de reagendamento |
| `src/components/booking/CancelModal.tsx` | Componente | Modal de cancelamento |
| `src/components/calendar/BookingDayCard.tsx` | Componente | Card no calendário mensal |
| `supabase/functions/send-booking-confirmation/` | Edge Function | Email confirmação |
| `supabase/functions/send-booking-reminder/` | Edge Function | Lembretes 24h/1h |
| `supabase/functions/send-booking-cancelled/` | Edge Function | Email cancelamento/no-show |
| `supabase/functions/send-booking-rescheduled/` | Edge Function | Email reagendamento |
| `supabase/migrations/20260203100000_booking_system.sql` | Migration | Schema principal |
| `supabase/migrations/20260206140000_booking_functions_after_system.sql` | Migration | RPCs |
| `supabase/migrations/20260224500000_schedule_email_cron_jobs.sql` | Migration | Cron jobs |
| `supabase/migrations/20260225300000_booking_enhancements.sql` | Migration | Meeting link + grants |
