# 27 - Sistema de Notificacoes In-App

**Implementado em:** 2026-03-01
**Status:** Producao

---

## Visao Geral

Sistema completo de notificacoes in-app com:
- Centro de notificacoes (popover no topbar)
- Badge com contagem de nao-lidas em tempo real (Supabase Realtime)
- Toast automatico na chegada de novas notificacoes
- 23 tipos de notificacao organizados por categoria
- Configuracao admin por tipo (habilitar/desabilitar in-app e email)
- Preferencias por usuario (opt-out granular)

---

## Arquitetura

```
[Edge Function / DB Trigger]
        │
        ▼
notificationService.ts (_shared)
  ├── checa notification_type_configs.in_app_enabled
  ├── checa user_notification_preferences
  └── INSERT INTO notifications
        │
        ▼ (Supabase Realtime)
useUnreadCount (hook)
  ├── invalidateQueries → badge atualiza
  └── toast sonner com titulo + link
        │
        ▼
NotificationCenter (Popover)
  ├── Tabs: Todas / Nao lidas
  ├── ScrollArea com NotificationItem
  └── "Marcar todas como lidas" → RPC mark_all_notifications_read()
```

---

## Banco de Dados

### Tabela `notifications` (estendida)

Colunas adicionadas a tabela existente:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `read_at` | TIMESTAMPTZ | NULL = nao lida |
| `action_url` | TEXT | URL de navegacao ao clicar |
| `icon` | TEXT | Nome do icone lucide-react |
| `category` | TEXT | system \| social \| business \| learning \| scheduling |
| `metadata` | JSONB | Dados extras (ex: post_id, live_id) |

### Tabela `notification_type_configs` (nova)

Configuracao admin por tipo de notificacao.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `type_key` | TEXT UNIQUE | Chave do tipo (ex: `post_commented`) |
| `display_name` | TEXT | Nome exibido no admin |
| `description` | TEXT | Descricao do gatilho |
| `icon` | TEXT | Icone lucide |
| `category` | TEXT | Categoria (5 opcoes) |
| `in_app_enabled` | BOOLEAN | Liga/desliga notificacao in-app |
| `email_enabled` | BOOLEAN | Liga/desliga email associado |

RLS: admin escrita; authenticated leitura.

### Tabela `user_notification_preferences` (nova)

Opt-out por usuario e por tipo.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `user_id` | UUID | FK auth.users |
| `type_key` | TEXT | Tipo da notificacao |
| `in_app_enabled` | BOOLEAN | Default: true |
| `email_enabled` | BOOLEAN | Default: true |

UNIQUE(user_id, type_key). RLS: usuario gerencia proprio.

### RPCs

| Funcao | Descricao |
|--------|-----------|
| `get_unread_notification_count()` | Retorna INTEGER com nao-lidas do usuario autenticado |
| `mark_notification_read(p_notification_id)` | Marca uma notificacao como lida |
| `mark_all_notifications_read()` | Marca todas como lidas |

---

## Tipos de Notificacao (23 total)

### Sistema
| type_key | Display | Email padrao |
|----------|---------|-------------|
| `welcome` | Boas-vindas | off |
| `credits_recharged` | Creditos Recarregados | off |
| `subscription_activated` | Assinatura Ativada | on |
| `subscription_cancelled` | Assinatura Cancelada | on |
| `payment_failed` | Falha no Pagamento | on |

### Social
| type_key | Display | Email padrao |
|----------|---------|-------------|
| `post_commented` | Comentario no Post | off |
| `post_liked` | Curtida no Post | off |

### Negocios
| type_key | Display | Email padrao |
|----------|---------|-------------|
| `product_launch` | Novo Produto/Servico | off |
| `live_scheduled` | Live Agendada | on |
| `live_starting` | Live Comecando | off |
| `live_reminder` | Lembrete de Live | off |

### Aprendizado
| type_key | Display | Email padrao |
|----------|---------|-------------|
| `new_course_content` | Novo Conteudo | off |
| `badge_earned` | Badge Conquistada | off |
| `course_completed` | Curso Concluido | off |

### Agendamento
| type_key | Display | Email padrao |
|----------|---------|-------------|
| `reminder_24h` | Lembrete 24h | on |
| `reminder_1h` | Lembrete 1h | on |
| `recording_available` | Gravacao Disponivel | on |
| `session_cancelled` | Sessao Cancelada | on |
| `new_session` | Nova Sessao | off |
| `booking_confirmed` | Agendamento Confirmado | on |
| `booking_cancelled` | Agendamento Cancelado | on |
| `booking_rescheduled` | Agendamento Reagendado | on |
| `espaco_invitation` | Convite para Espaco | on |

---

## Arquivos do Sistema

### Backend (Edge Functions / Shared)

| Arquivo | Funcao |
|---------|--------|
| `supabase/functions/_shared/notificationService.ts` | Servico principal fire-and-forget |
| `supabase/migrations/20260302700000_notification_system.sql` | Migracao completa |

### Frontend

| Arquivo | Funcao |
|---------|--------|
| `src/hooks/useNotifications.ts` | useUnreadCount, useNotificationsList, useMarkAsRead, useMarkAllAsRead |
| `src/components/notifications/NotificationCenter.tsx` | Popover principal (Bell icon + dropdown) |
| `src/components/notifications/NotificationItem.tsx` | Item individual de notificacao |
| `src/hooks/useAdminNotifications.ts` | Hook admin: CRUD configs + stats |
| `src/pages/admin/AdminNotifications.tsx` | Pagina admin `/admin/notificacoes` |

### Modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/layouts/DashboardTopbar.tsx` | Bell hardcoded → `<NotificationCenter />` |
| `src/App.tsx` | Rota `/admin/notificacoes` |
| `src/components/layouts/SidebarNav.tsx` | Item "Notificacoes" no menu admin |

---

## Como Criar uma Notificacao (Edge Function)

```typescript
import { createNotification, notifyAllActiveUsers } from "../_shared/notificationService.ts";

// Para um usuario especifico
await createNotification({
  userId: "uuid-do-usuario",
  type: "post_commented",
  title: "Alguem comentou no seu post",
  message: "João: 'Otimo conteudo!'",
  actionUrl: "/comunidade/posts/abc",
  // icon e category sao preenchidos automaticamente da notification_type_configs
});

// Para todos os usuarios ativos (broadcast)
await notifyAllActiveUsers({
  type: "product_launch",
  title: "Novo servico disponivel: Mentoria VIP",
  message: "Confira nosso novo servico!",
  actionUrl: "/catalogo",
});

// Para uma lista especifica de usuarios
await createBulkNotifications({
  userIds: ["uuid-1", "uuid-2", "uuid-3"],
  type: "live_scheduled",
  title: "Nova live: Estrategia de Carreira",
  actionUrl: "/lives/xyz",
});
```

**Importante:** O servico e fire-and-forget (nunca lanca excecao). Respeita automaticamente:
1. `notification_type_configs.in_app_enabled` (toggle admin)
2. `user_notification_preferences.in_app_enabled` (opt-out do usuario)

---

## Pontos de Integracao Pendentes (Fase 2)

| Evento | Onde Adicionar | type_key |
|--------|----------------|----------|
| Comentario em post | Hook `useCommunityComments` ou trigger DB | `post_commented` |
| Like em post | Hook `useCommunityPosts` | `post_liked` |
| Novo produto/servico | Hook `useAdminHubServices` no create | `product_launch` |
| Live agendada | Admin ao criar live | `live_scheduled` |
| Creditos recarregados | Edge Function `unified-credit-pool` | `credits_recharged` |
| Assinatura ativada | `ticto-webhook` → subscription activated | `subscription_activated` |
| Assinatura cancelada | `cancel-subscription` | `subscription_cancelled` |
| Badge conquistada | Hook de gamification | `badge_earned` |
| Nova aula publicada | Admin ao publicar aula | `new_course_content` |
| Booking confirmado | `useCreateBooking` | `booking_confirmed` |
| Convite espaco | `send-espaco-invitation` | `espaco_invitation` |

---

## Realtime

A tabela `notifications` esta na publicacao `supabase_realtime`.
O hook `useUnreadCount` cria um canal por usuario:

```
canal: `notifications_${userId}`
evento: INSERT
filtro: user_id=eq.{userId}
```

Na chegada de INSERT:
1. Invalida queries de contagem e lista
2. Exibe toast (sonner) com titulo + botao "Ver" se tiver `action_url`

---

## Pagina Admin

**URL:** `/admin/notificacoes`
**Sidebar:** Configuracoes → Notificacoes

Funcionalidades:
- Cards por categoria com switches in-app e email
- Hover no card → botao de edicao (lapiz)
- Dialog de edicao: display_name, descricao, nome do icone
- Contagem de notificacoes enviadas por tipo (ultimas 5000)

---

## Validacao E2E

Ver arquivo `VALIDACAO_E2E.md` nesta pasta.
