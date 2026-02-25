# Sistema de Agendamentos — Documentação Técnica

## Visão Geral da Arquitetura

```
Banco de Dados (Supabase PostgreSQL)
  ├─ bookings                   — sessões agendadas
  ├─ booking_history            — log de mudanças de status
  ├─ booking_policies           — regras globais (max_concurrent, notice_hours, etc.)
  ├─ mentor_services            — vínculo mentor↔serviço + default_meeting_link
  ├─ mentor_availability        — horários semanais recorrentes
  └─ mentor_blocked_times       — bloqueios de agenda

RPCs (SECURITY DEFINER)
  ├─ create_booking             — cria sessão + auto-preenche meeting_link
  ├─ reschedule_booking         — reagenda com validações
  ├─ cancel_booking             — cancela com motivo + janela de cancelamento
  ├─ complete_booking           — marca como concluída + notas do mentor
  ├─ get_available_slots        — calcula horários disponíveis
  ├─ get_mentor_services        — retorna mentores para um serviço
  ├─ check_user_booking_limit   — verifica limite de agendamentos simultâneos
  └─ check_reschedule_limit     — verifica limite de reagendamentos

Edge Functions (Deno)
  ├─ send-booking-confirmation  — email de confirmação
  ├─ send-booking-reminder      — lembretes 24h/1h (cron via pg_cron)
  ├─ send-booking-cancelled     — email de cancelamento
  └─ send-booking-rescheduled   — email de reagendamento

Frontend (React + TanStack Query)
  ├─ Aluno: BookingFlow, MyBookings
  ├─ Mentor: MentorAgendamentos, MentorDisponibilidade
  └─ Admin: AdminAgendamentos (3 tabs)
```

---

## Banco de Dados

### Tabelas Principais

#### `bookings`
```sql
id, student_id, mentor_id, service_id, mentor_service_id,
scheduled_start TIMESTAMPTZ, scheduled_end TIMESTAMPTZ,
duration_minutes INT, status TEXT, -- confirmed|completed|cancelled|no_show|rescheduled
meeting_link TEXT, student_notes TEXT, mentor_notes TEXT,
cancellation_reason TEXT, reschedule_count INT DEFAULT 0,
created_at, updated_at
```

**RLS:** students veem as próprias, mentors veem as atribuídas, admins veem todas.

#### `mentor_services`
```sql
id, mentor_id, service_id, is_active, slot_duration_minutes,
buffer_minutes, max_daily_bookings, default_meeting_link TEXT,
created_at, updated_at
```

**`default_meeting_link`**: adicionado na migration `20260225300000`. O RPC `create_booking` auto-preenche o `meeting_link` da booking com esse valor.

#### `mentor_availability`
```sql
id, mentor_id, day_of_week TEXT, -- monday|tuesday|...|sunday
start_time TIME, end_time TIME, timezone TEXT, is_active BOOLEAN,
created_at, updated_at
```

#### `mentor_blocked_times`
```sql
id, mentor_id, start_datetime TIMESTAMPTZ, end_datetime TIMESTAMPTZ,
reason TEXT, created_at
```

#### `booking_policies`
```sql
id, max_concurrent_bookings INT, max_reschedules INT,
min_notice_hours INT, max_advance_days INT,
cancellation_window_hours INT, default_duration_minutes INT,
slot_interval_minutes INT, created_at, updated_at
```

#### `booking_history`
```sql
id, booking_id, old_status, new_status, changed_by, change_reason, created_at
```

### Grants

Todos os 6 tabelas têm:
```sql
GRANT ALL ON public.<table> TO authenticated, service_role;
```

Migration: `supabase/migrations/20260225300000_booking_enhancements.sql`

---

## RPCs Principais

### `create_booking(p_student_id, p_service_id, p_mentor_id, p_scheduled_start, p_duration_minutes, p_student_notes)`

1. Valida existência de `mentor_services` ativo
2. Verifica `check_user_booking_limit` (max_concurrent_bookings)
3. Verifica conflito de horário (mentor e aluno)
4. Calcula `scheduled_end`
5. Insere booking com `meeting_link = (SELECT default_meeting_link FROM mentor_services WHERE id = v_mentor_service_id)`
6. Insere em `booking_history`
7. Retorna booking criada

### `get_available_slots(p_service_id, p_mentor_id, p_date, p_duration_minutes)`

1. Busca `mentor_availability` para o `day_of_week` da data
2. Gera slots no intervalo de `slot_interval_minutes`
3. Remove slots em `mentor_blocked_times`
4. Remove slots com bookings existentes (+ buffer)
5. Remove slots no passado e além de `max_advance_days`
6. Retorna array de `{start_time, end_time}`

### `cancel_booking(p_booking_id, p_cancelled_by, p_reason)`
### `reschedule_booking(p_booking_id, p_new_start, p_rescheduled_by)`
### `complete_booking(p_booking_id, p_mentor_notes)`

Todas seguem o padrão: validar status atual → atualizar status → inserir `booking_history`.

---

## Migrations Relevantes

| Timestamp | Arquivo | Conteúdo |
|-----------|---------|----------|
| `20260203100000` | `booking_system.sql` | Tabelas, RLS, índices, types |
| `20260206140000` | `booking_functions_after_system.sql` | RPCs: create, cancel, reschedule, complete, get_available_slots |
| `20260224500000` | `schedule_email_cron_jobs.sql` | pg_cron para lembretes 24h e 1h |
| `20260225300000` | `booking_enhancements.sql` | `default_meeting_link`, grants, RPC update |

---

## Frontend — Hooks

### Admin (`src/hooks/useAdminBookings.ts`)

| Hook | Query/Mutation | queryKey |
|------|---------------|----------|
| `useAdminBookings(filters)` | Query — all bookings + profiles + services | `['admin-bookings', filters]` |
| `useAdminMentorServices()` | Query — mentor↔service com joins | `['admin-mentor-services']` |
| `useAdminMentorAvailability(mentorId)` | Query — availability por mentor | `['admin-mentor-availability', mentorId]` |
| `useAdminMentorBlockedTimes(mentorId)` | Query — blocked times por mentor | `['admin-mentor-blocked-times', mentorId]` |
| `useAdminBookingPolicy()` | Query — policy global (single row) | `['admin-booking-policy']` |
| `useUpsertMentorService()` | Mutation → mentor_services upsert | invalidates `admin-mentor-services` |
| `useDeleteMentorService()` | Mutation → delete | invalidates `admin-mentor-services` |
| `useUpsertAvailability()` | Mutation → mentor_availability upsert | invalidates `admin-mentor-availability` |
| `useDeleteAvailability()` | Mutation → delete | invalidates `admin-mentor-availability` |
| `useCreateBlockedTime()` | Mutation → mentor_blocked_times insert | invalidates `admin-mentor-blocked-times` |
| `useDeleteBlockedTime()` | Mutation → delete | invalidates `admin-mentor-blocked-times` |
| `useUpdateBookingPolicy()` | Mutation → booking_policies update | invalidates `admin-booking-policy` |
| `useAdminCancelBooking()` | Mutation → `cancel_booking` RPC | invalidates `admin-bookings` |
| `useAdminCompleteBooking()` | Mutation → `complete_booking` RPC | invalidates `admin-bookings` |
| `useAdminMarkNoShow()` | Mutation → direct update `status='no_show'` | invalidates `admin-bookings` |

### Mentor (`src/hooks/useMentorAvailability.ts` + `useMentorBookings.ts`)

| Hook | Descrição |
|------|-----------|
| `useMyMentorServices()` | Serviços atribuídos ao mentor logado |
| `useMyAvailability()` | Horários semanais do mentor |
| `useMyBlockedTimes()` | Bloqueios futuros do mentor |
| `useUpsertMyAvailability()` | Criar/editar horário semanal |
| `useDeleteMyAvailability()` | Remover horário |
| `useCreateMyBlockedTime()` | Criar bloqueio |
| `useDeleteMyBlockedTime()` | Remover bloqueio |
| `useUpdateMyMeetingLink()` | Atualizar `default_meeting_link` |
| `useMentorBookings(filter)` | Bookings do mentor com profiles e services |
| `useUpcomingMentorBookings()` | Wrapper: filter='upcoming' |
| `usePastMentorBookings()` | Wrapper: filter='past' |

### Aluno (pré-existentes)

| Hook | Arquivo |
|------|---------|
| `useBookingFlow()` | `src/hooks/useBookingFlow.ts` |
| `useMyBookings()` | `src/hooks/useMyBookings.ts` |
| `useCancelBooking()` | `src/hooks/useCancelBooking.ts` |
| `useRescheduleBooking()` | `src/hooks/useRescheduleBooking.ts` |
| `useCompleteBooking()` | `src/hooks/useCancelBooking.ts` |

---

## Frontend — Páginas

### Admin: `src/pages/admin/AdminAgendamentos.tsx`

3 tabs:
1. **Agendamentos**: Table + filters (status, mentor) + DropdownMenu actions (complete, cancel, no-show) com Dialogs
2. **Disponibilidade**: Mentor selector → cards de mentor_services → weekly availability table → blocked times list
3. **Políticas**: Form com 7 campos editáveis + Save

Rota: `/admin/agendamentos` — `allowedRoles={['admin']}`

### Mentor: `src/pages/mentor/MentorAgendamentos.tsx`

- Stats cards (upcoming, completed, no-shows)
- Tabs: Próximos / Anteriores
- `BookingCardMentor` — card com date box, student info, meeting link, complete button
- Complete Dialog com notas opcionais

Rota: `/mentor/agendamentos` — `allowedRoles={['mentor', 'admin']}`

### Mentor: `src/pages/mentor/MentorDisponibilidade.tsx`

- Meeting link input por serviço
- Weekly availability table (add/toggle/delete)
- Blocked times list (add/delete)

Rota: `/mentor/disponibilidade` — `allowedRoles={['mentor', 'admin']}`

### Aluno: `src/pages/booking/BookingFlow.tsx` (pré-existente, modificado)

- **Access gate** adicionado: `useUserHubAccess()` verifica se o aluno tem `user_hub_services` para o serviço
- Admin bypass: `user?.role === 'admin'` → acesso direto
- Sem acesso: card amber com links para `/catalogo` e `/dashboard/hub`

### Aluno: `src/pages/booking/MyBookings.tsx` (pré-existente)

- Lista de bookings do aluno com modais de reagendamento e cancelamento

---

## Service Cards → Booking Flow

### `src/components/hub/ServiceCard.tsx`

Quando `service.service_type === 'live_mentoring'` e `canAccess`:
- Navega para `/dashboard/agendar/${service.id}`
- CTA: "Agendar Sessão"

### `src/components/hub/HubServiceCard.tsx`

Mesma lógica: `live_mentoring` + `hasAccess` → booking flow.

---

## Sidebar Navigation

Alterações em `src/components/layouts/SidebarNav.tsx`:

```typescript
// Student — grupo DISCOVERY
{ label: 'Agendamentos', href: '/dashboard/agendamentos', icon: CalendarCheck }

// Mentor — grupo GESTÃO
{ label: 'Agendamentos', href: '/mentor/agendamentos', icon: CalendarCheck }
{ label: 'Disponibilidade', href: '/mentor/disponibilidade', icon: Calendar }

// Admin — grupo GESTÃO DE CONTEÚDO
{ label: 'Agendamentos', href: '/admin/agendamentos', icon: CalendarCheck }
```

---

## Rotas (`src/App.tsx`)

```tsx
<Route path="/admin/agendamentos" element={
  <ProtectedRoute allowedRoles={['admin']}><AdminAgendamentos /></ProtectedRoute>
} />
<Route path="/mentor/agendamentos" element={
  <ProtectedRoute allowedRoles={['mentor', 'admin']}><MentorAgendamentos /></ProtectedRoute>
} />
<Route path="/mentor/disponibilidade" element={
  <ProtectedRoute allowedRoles={['mentor', 'admin']}><MentorDisponibilidade /></ProtectedRoute>
} />
```

---

## Cron Jobs (pg_cron)

Configurados na migration `20260224500000`:

| Job | Schedule | Ação |
|-----|----------|------|
| `booking_reminder_24h` | A cada 15min | Busca bookings confirmados ~24h antes → chama `send-booking-reminder` |
| `booking_reminder_1h` | A cada 15min | Busca bookings confirmados ~1h antes → chama `send-booking-reminder` |

---

## Types (`src/types/booking.ts`)

Interfaces principais:
- `BookingWithDetails` — booking + `student: Profile` + `service: HubService`
- `MentorService` — inclui `default_meeting_link: string | null`
- `MentorAvailability` — `day_of_week`, `start_time`, `end_time`, `is_active`
- `MentorBlockedTime` — `start_datetime`, `end_datetime`, `reason`
- `BookingPolicy` — 7 campos de configuração
- `DayOfWeek` — union type `'monday' | 'tuesday' | ... | 'sunday'`
- `BOOKING_STATUS_CONFIG` — cores e labels PT-BR por status
- `DAY_OF_WEEK_LABELS` — labels PT-BR por dia da semana

---

## Diagnóstico de Problemas

### Aluno não consegue agendar

1. Verificar `user_hub_services`: aluno tem entry ativa para o `service_id`?
2. Verificar `mentor_services`: existe mentor ativo atribuído ao serviço?
3. Verificar `mentor_availability`: mentor tem horários configurados para o dia?
4. Verificar `mentor_blocked_times`: não há bloqueio no período?
5. Verificar `booking_policies`: `max_concurrent_bookings` atingido?

### Meeting link não aparece no email

1. Verificar `mentor_services.default_meeting_link` — campo está preenchido?
2. O RPC `create_booking` auto-preenche `bookings.meeting_link` a partir de `mentor_services.default_meeting_link`
3. Se a booking já existia antes da migration, o `meeting_link` pode estar null — verificar diretamente na tabela

### Lembretes não estão sendo enviados

1. Verificar se o cron está ativo: `SELECT * FROM cron.job WHERE jobname LIKE 'booking_reminder%';`
2. Verificar logs do cron: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;`
3. Verificar `config.toml`: `send-booking-reminder` tem `verify_jwt = false`?
4. Verificar template habilitado: `booking_reminder` e `booking_reminder_1h` em `email_templates`

### Erros de permissão (permission denied)

1. Verificar GRANTs: todos os 6 tabelas devem ter `GRANT ALL ... TO authenticated, service_role`
2. Verificar RLS: policies existem para o papel correto
3. Migration `20260225300000` garante os grants — se falhou, re-rodar

---

## Deployment

```bash
# Migrations
npx supabase db push --include-all

# Regenerar tipos
npx supabase gen types typescript --project-id seqgnxynrcylxsdzbloa > src/integrations/supabase/types.ts

# Build
npm run build

# Edge Functions (se alteradas)
npx supabase functions deploy send-booking-confirmation send-booking-reminder send-booking-cancelled send-booking-rescheduled
```

---

## Arquivos

### Criados
| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/20260225300000_booking_enhancements.sql` | `default_meeting_link`, grants, RPC update |
| `src/hooks/useAdminBookings.ts` | 14 hooks admin |
| `src/pages/admin/AdminAgendamentos.tsx` | Página admin (3 tabs) |
| `src/hooks/useMentorAvailability.ts` | 8 hooks mentor |
| `src/hooks/useMentorBookings.ts` | 3 hooks mentor bookings |
| `src/pages/mentor/MentorDisponibilidade.tsx` | Página disponibilidade |
| `src/pages/mentor/MentorAgendamentos.tsx` | Página agendamentos mentor |

### Modificados
| Arquivo | Alteração |
|---------|-----------|
| `src/types/booking.ts` | `default_meeting_link` em `MentorService` |
| `src/components/hub/ServiceCard.tsx` | Redirect `live_mentoring` → booking flow |
| `src/components/hub/HubServiceCard.tsx` | Mesmo redirect |
| `src/pages/booking/BookingFlow.tsx` | Access gate com `useUserHubAccess()` |
| `src/components/layouts/SidebarNav.tsx` | Nav items (student, admin, mentor) |
| `src/App.tsx` | 3 novas rotas |
