# Sistema de Lives — Documentacao Tecnica (DEV)

> Arquitetura, banco de dados, hooks, componentes e fluxo de dados do sistema de Lives.

---

## Visao Geral

O sistema de Lives e **independente de `hub_services`/`sessions`/`espacos`**. Usa tabelas proprias (`lives`, `live_registrations`) com RLS, RPC de acesso e integracao com Ticto webhook para lives pagas.

---

## Banco de Dados

### Migration: `20260227100000_lives_system.sql`

#### Enums

```sql
CREATE TYPE live_access_type AS ENUM ('free', 'paid', 'subscribers', 'pro', 'vip');
CREATE TYPE live_status AS ENUM ('draft', 'scheduled', 'live', 'completed', 'cancelled');
CREATE TYPE live_payment_status AS ENUM ('none', 'pending', 'paid', 'refunded');
```

#### Tabela `lives`

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| id | UUID PK | `gen_random_uuid()` |
| title | TEXT NOT NULL | |
| slug | TEXT UNIQUE NOT NULL | |
| description | TEXT | |
| long_description | TEXT | |
| thumbnail_url | TEXT | |
| scheduled_at | TIMESTAMPTZ NOT NULL | |
| duration_minutes | INT NOT NULL DEFAULT 60 | |
| meeting_link | TEXT | |
| access_type | live_access_type NOT NULL DEFAULT 'free' | |
| price | NUMERIC(10,2) | |
| ticto_product_id | TEXT | |
| ticto_checkout_url | TEXT | |
| max_attendees | INT | |
| mentor_id | UUID NOT NULL FK auth.users | |
| status | live_status NOT NULL DEFAULT 'draft' | |
| recording_url | TEXT | |
| og_image_url | TEXT | |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| updated_at | TIMESTAMPTZ DEFAULT now() | |

#### Tabela `live_registrations`

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| id | UUID PK | `gen_random_uuid()` |
| live_id | UUID NOT NULL FK lives CASCADE | |
| user_id | UUID NOT NULL FK auth.users CASCADE | |
| registered_at | TIMESTAMPTZ DEFAULT now() | |
| attended | BOOLEAN DEFAULT false | |
| payment_status | live_payment_status DEFAULT 'none' | |
| UNIQUE | | `(live_id, user_id)` |

#### Indexes

```sql
CREATE UNIQUE INDEX idx_lives_slug ON lives(slug);
CREATE INDEX idx_lives_mentor ON lives(mentor_id);
CREATE INDEX idx_lives_status_scheduled ON lives(status, scheduled_at);
CREATE INDEX idx_lives_ticto ON lives(ticto_product_id) WHERE ticto_product_id IS NOT NULL;
CREATE INDEX idx_live_reg_live ON live_registrations(live_id);
CREATE INDEX idx_live_reg_user ON live_registrations(user_id);
```

#### RPC: `check_live_access(p_user_id UUID, p_live_id UUID)`

SECURITY DEFINER. Logica:
1. Busca live (access_type, price, ticto_checkout_url, max_attendees, status)
2. Se `status` nao e `scheduled` ou `live` → `{ allowed: false, reason: 'not_available' }`
3. Se ja registrado → `{ allowed: true, reason: 'already_registered', registered: true }`
4. Se `max_attendees` atingido → `{ allowed: false, reason: 'full' }`
5. Switch por `access_type`:
   - `free` → `{ allowed: true, reason: 'free' }`
   - `paid` → `{ allowed: false, reason: 'payment_required', checkout_url, price }`
   - `subscribers` → verifica `user_subscriptions` ativa → allowed ou `no_subscription`
   - `pro` → verifica subscricao com plano slug `pro` ou `vip` → allowed ou `plan_too_low`
   - `vip` → verifica subscricao com plano slug `vip` → allowed ou `plan_too_low`

---

## Tipos — `src/types/live.ts`

```typescript
export interface Live {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  long_description: string | null;
  thumbnail_url: string | null;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string | null;
  access_type: LiveAccessType;
  price: number | null;
  ticto_product_id: string | null;
  ticto_checkout_url: string | null;
  max_attendees: number | null;
  mentor_id: string;
  status: LiveStatus;
  recording_url: string | null;
  og_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface LiveWithMentor extends Live {
  mentor: { full_name: string; profile_photo_url: string | null } | null;
  registration_count: number;
}

export interface LiveAccessCheck {
  allowed: boolean;
  reason: string;
  registered?: boolean;
  checkout_url?: string;
  price?: number;
  required?: string;
}
```

Constantes: `ACCESS_TYPE_LABELS`, `ACCESS_TYPE_COLORS`, `STATUS_LABELS`, `STATUS_COLORS`

---

## Hooks

### `src/hooks/useLives.ts` (Discovery + Registro)

| Hook | Query Key | Descricao |
|------|-----------|-----------|
| `useLives()` | `['lives']` | Todas as lives upcoming (scheduled/live/completed) com mentor profile join + registration count |
| `useLiveBySlug(slug)` | `['live', slug]` | Live unica para landing page |
| `useLiveAccessCheck(liveId)` | `['live-access', liveId]` | Chama RPC `check_live_access` |
| `useMyLiveRegistration(liveId)` | `['my-live-reg', liveId]` | Verifica se usuario esta inscrito |
| `useRegisterForLive()` | Mutation | INSERT em `live_registrations` → invalida caches → fire-and-forget `send-live-notification` (type: `registration`) com email + ICS |
| `useUnregisterFromLive()` | Mutation | DELETE de `live_registrations` → mesmas invalidacoes |

### `src/hooks/useMentorLives.ts` (CRUD Mentor)

| Hook | Query Key | Descricao |
|------|-----------|-----------|
| `useMentorLives()` | `['mentor-lives']` | Lives do mentor logado |
| `useMentorLiveById(id)` | `['mentor-live', id]` | Live especifica com todos os campos |
| `useCreateLive()` | Mutation | INSERT + navega para `/mentor/lives` |
| `useUpdateLive()` | Mutation | UPDATE + invalida caches + se `status='live'` → fire-and-forget `send-live-notification` (type: `going_live`) |
| `useDeleteLive()` | Mutation | DELETE (apenas status='draft') |
| `useLiveRegistrations(liveId)` | `['live-registrations', liveId]` | Inscritos com profile join |
| `useToggleAttended()` | Mutation | UPDATE `attended` em `live_registrations` |

### `src/hooks/useMyLives.ts` (Hub Integration)

| Hook | Query Key | Descricao |
|------|-----------|-----------|
| `useMyLives()` | `['my-lives']` | Lives inscritas do usuario, ordenadas por `scheduled_at` |

Retorna `MyLive[]`:
```typescript
export interface MyLive {
  id: string;           // registration id
  registered_at: string;
  attended: boolean;
  live: Live;           // nested live data
}
```

---

## Componentes

### `src/components/lives/LiveCard.tsx`
Card reutilizavel para discovery e listagem. Mostra thumbnail, badges de access_type e status, data/hora, avatar do mentor, contagem de inscritos.

### `src/components/lives/LiveAccessCTA.tsx`
CTA dinamico baseado em `useLiveAccessCheck()`. Renderiza botoes diferentes conforme `reason`:
- `free` → "Inscreva-se Gratuitamente"
- `already_registered` → "Voce esta inscrito!" + link da reuniao
- `payment_required` → "Comprar Acesso (R$ X)" → redireciona para Ticto
- `no_subscription` → "Assine para Participar" → `/pricing`
- `plan_too_low` → "Faca Upgrade" → `/pricing`
- `full` → "Vagas Esgotadas" (disabled)

### `src/components/hub/LiveHubCard.tsx`
Card para secao "Minhas Lives" no Meu Hub. Status-based styling:
- `live` → borda vermelha, icone pulsante, "Entrar Agora"
- `scheduled` → borda azul, icone calendario, data/hora
- `completed` → borda cinza, opacidade reduzida, "Ver Gravacao" (se `recording_url`)

---

## Paginas

### Mentor

| Pagina | Path | Componente |
|--------|------|-----------|
| Lista | `/mentor/lives` | `MentorLives.tsx` |
| Criar | `/mentor/lives/nova` | `MentorCreateLive.tsx` |
| Editar | `/mentor/lives/:id/editar` | `MentorCreateLive.tsx` (reusa com prefill via `useParams`) |
| Detalhe | `/mentor/lives/:id` | `MentorLiveDetail.tsx` |

### Publico (requer login)

| Pagina | Path | Componente |
|--------|------|-----------|
| Discovery | `/lives` | `LivesDiscovery.tsx` |
| Landing Page | `/live/:slug` | `LiveLandingPage.tsx` |

---

## Routing — `src/App.tsx`

6 rotas adicionadas:

```tsx
// Mentor routes (allowedRoles: ['mentor', 'admin'])
/mentor/lives           → MentorLives
/mentor/lives/nova      → MentorCreateLive
/mentor/lives/:id       → MentorLiveDetail
/mentor/lives/:id/editar → MentorCreateLive

// Public routes (allowedRoles: ['student', 'mentor', 'admin'])
/lives                  → LivesDiscovery
/live/:slug             → LiveLandingPage
```

---

## Sidebar — `src/components/layouts/SidebarNav.tsx`

3 nav items adicionados:
- **Student DISCOVERY**: `{ label: 'Lives', href: '/lives', icon: Radio, menuKey: 'lives' }`
- **Mentor GESTAO**: `{ label: 'Lives', href: '/mentor/lives', icon: Radio, menuKey: 'lives' }`
- **Admin GESTAO DE CONTEUDO**: `{ label: 'Lives', href: '/mentor/lives', icon: Radio }` — reutiliza as mesmas paginas do mentor

Student e Mentor com badge `NOVO`.

---

## Hub Integration — `src/components/hub/MyJourneySection.tsx`

- Importa `useMyLives()` e `LiveHubCard`
- Adiciona secao "Minhas Lives" com icone `Radio` (vermelho) apos "Ferramentas do seu Plano"
- Condicional: so aparece se `myLives.length > 0`
- **Limite de 2 lives visíveis** — prioriza por status: `live` > `scheduled` > `completed`, depois por data
- Link "Ver todas (N)" → `/lives` quando ha mais de 2 lives inscritas

---

## Ticto Webhook — `supabase/functions/ticto-webhook/index.ts`

### Fluxo de Compra (Sale Path)

```
Ticto event → parse payload → validate token
→ match plans? → SUBSCRIPTION PATH
→ match hub_services? → ONE-TIME PURCHASE PATH (existente)
→ match lives? → LIVE PURCHASE PATH (NOVO)
  → UPSERT live_registrations (payment_status='paid')
  → INSERT orders
  → UPSERT payment_logs (status='processed_live')
  → return 200
```

### Fluxo de Reembolso (Refund Path)

```
→ match hub_services? → revoke access (existente)
→ match lives? → UPDATE payment_status='refunded' (NOVO)
  → UPDATE orders status='refunded'
```

---

## Arquivos Criados/Modificados

| Arquivo | Acao |
|---------|------|
| `supabase/migrations/20260227100000_lives_system.sql` | CRIADO |
| `src/types/live.ts` | CRIADO |
| `src/hooks/useLives.ts` | CRIADO |
| `src/hooks/useMentorLives.ts` | CRIADO |
| `src/hooks/useMyLives.ts` | CRIADO |
| `src/components/lives/LiveCard.tsx` | CRIADO |
| `src/components/lives/LiveAccessCTA.tsx` | CRIADO |
| `src/components/hub/LiveHubCard.tsx` | CRIADO |
| `src/pages/mentor/MentorLives.tsx` | CRIADO |
| `src/pages/mentor/MentorCreateLive.tsx` | CRIADO |
| `src/pages/mentor/MentorLiveDetail.tsx` | CRIADO |
| `src/pages/lives/LivesDiscovery.tsx` | CRIADO |
| `src/pages/lives/LiveLandingPage.tsx` | CRIADO |
| `src/App.tsx` | MODIFICADO — 6 rotas |
| `src/components/layouts/SidebarNav.tsx` | MODIFICADO — 2 nav items |
| `src/components/hub/MyJourneySection.tsx` | MODIFICADO — secao Lives |
| `supabase/functions/ticto-webhook/index.ts` | MODIFICADO — fallback lives |
| `supabase/functions/send-live-notification/index.ts` | CRIADO — email para registro e go-live |
| `supabase/functions/check-unfinished-lives/index.ts` | CRIADO — auto-close cron |
| `supabase/functions/_shared/emailTemplateService.ts` | MODIFICADO — suporte a attachments |
| `supabase/migrations/20260227400000_live_email_templates.sql` | CRIADO — templates de email |
| `supabase/migrations/20260227400001_live_cron_unfinished.sql` | CRIADO — cron job |
| `supabase/migrations/20260227500000_live_registration_email_template.sql` | CRIADO — template de registro |
| `src/components/lives/LiveShareButtons.tsx` | CRIADO — botoes de compartilhamento social |
| `src/lib/calendar-urls.ts` | EXISTENTE — usado como referencia para Google Calendar URL |
| `src/lib/ics-generator.ts` | EXISTENTE — usado como referencia para ICS no Edge Function |

---

## Email Notifications

### Templates (`email_templates` table)

3 templates na categoria `live`:

| Template | Trigger | Edge Function | Variaveis |
|----------|---------|---------------|-----------|
| `live_registration_confirmation` | Usuario se inscreve em live | `send-live-notification` (type: `registration`) | `participantName`, `liveTitle`, `formattedDate`, `formattedTime`, `duration`, `mentorName`, `googleCalendarLink`, `livePageLink` |
| `live_going_live` | Mentor clica "Go Live" | `send-live-notification` (type: `going_live`) | `participantName`, `liveTitle`, `meetingLink`, `livePageLink` |
| `live_unfinished_warning` | Cron (live excedeu duracao + 60min) | `check-unfinished-lives` | `mentorName`, `liveTitle`, `livePageLink`, `manageLiveLink` |

### Edge Function: `send-live-notification`

Auth: `requireAuthOrInternal()`. Discriminated union via `notification_type`:

**`registration`** (single user):
1. Input: `{ live_id, notification_type: 'registration', user_id }`
2. Busca live + mentor profile + user profile
3. Gera ICS (calendario) no formato iCalendar, base64 encoded
4. Gera Google Calendar URL
5. Envia email com template `live_registration_confirmation` + arquivo `.ics` anexo

**`going_live`** (broadcast):
1. Input: `{ live_id, notification_type: 'going_live' }`
2. Busca live + todas as registrations + profiles dos inscritos
3. Loop: `sendTemplatedEmail()` para cada inscrito com template `live_going_live`

**Trigger frontend** (fire-and-forget):
```typescript
// Em useRegisterForLive() onSuccess:
supabase.functions.invoke('send-live-notification', {
  body: { live_id: liveId, notification_type: 'registration', user_id: user!.id },
}).then(({ error }) => { if (error) console.error(...); });

// Em useUpdateLive() onSuccess (quando status='live'):
supabase.functions.invoke('send-live-notification', {
  body: { live_id: data.id, notification_type: 'going_live' },
}).then(({ error }) => { if (error) console.error(...); });
```

### ICS Calendar Attachment

O Edge Function gera ICS inline (sem dependencia de `date-fns`):
- `formatICSDate(date)` → `YYYYMMDDTHHMMSSZ` (UTC)
- UID: `{timestamp}-{random}@euanapratica.com`
- Campos: `DTSTART`, `DTEND`, `SUMMARY`, `DESCRIPTION` (com link), `URL`
- Anexado via Resend API: `{ filename: 'live.ics', content: btoa(ics), content_type: 'text/calendar' }`

### Attachments no `emailTemplateService.ts`

Adicionado suporte a attachments no `sendTemplatedEmail()`:

```typescript
interface EmailAttachment {
  filename: string;
  content: string; // Base64-encoded
  content_type?: string;
}

// Em SendTemplatedEmailOptions:
attachments?: EmailAttachment[];
```

O payload do Resend API inclui `attachments` condicionalmente quando presente.

---

## Auto-Close (Cron) — `check-unfinished-lives`

Edge Function executada a cada 15 minutos via pg_cron:

1. Busca lives com `status = 'live'`
2. Filtra: `scheduled_at + duration_minutes + 60min < NOW()`
3. Para cada live overdue:
   - Envia email ao mentor via template `live_unfinished_warning`
   - Envia WhatsApp ao mentor (se `profiles.phone` disponivel)
   - Atualiza `status = 'completed'`

Migration: `20260227400001_live_cron_unfinished.sql`
```sql
SELECT cron.schedule('check-unfinished-lives', '*/15 * * * *',
  $$SELECT invoke_edge_function('check-unfinished-lives');$$);
```

---

## Social Share — `src/components/lives/LiveShareButtons.tsx`

Componente de compartilhamento exibido em `MentorLiveDetail.tsx` quando `live.status === 'live'`:

| Botao | URL | Cor |
|-------|-----|-----|
| WhatsApp | `wa.me/?text=...` | Verde |
| LinkedIn | `linkedin.com/sharing/share-offsite/` | Azul |
| Twitter/X | `twitter.com/intent/tweet` | Preto |
| Copiar Texto | `navigator.clipboard` | Outline (check apos copiar) |

Mensagem: `"Estamos ao vivo! Participe agora: {title} → {url}"`

Props: `liveTitle: string`, `slug: string`
