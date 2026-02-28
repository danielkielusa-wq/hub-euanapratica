# Sistema de Lives — Guia do Administrador

> Este documento cobre como monitorar, configurar e gerenciar o sistema de Lives via painel de administracao e Supabase Dashboard.

---

## Acesso Admin

- **Sidebar**: Grupo GESTAO DE CONTEUDO → **Lives** → navega para `/mentor/lives`
- **Banco de dados**: Supabase Dashboard → tabelas `lives` e `live_registrations`
- **Email templates**: `/admin/email-templates` → 3 templates de live editaveis (Unlayer WYSIWYG)
- **Logs de email**: Supabase Dashboard → tabela `email_logs` (template_name, recipient, status)
- **Logs de pagamento**: `/admin/pedidos` (orders de lives pagas)
- **Webhook**: Supabase Dashboard → Edge Functions → `ticto-webhook` (logs)

---

## 1. Visao Geral das Tabelas

### Tabela `lives`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | UUID | PK |
| `title` | TEXT | Titulo da live |
| `slug` | TEXT UNIQUE | URL amigavel (`/live/:slug`) |
| `description` | TEXT | Descricao curta (card) |
| `long_description` | TEXT | Descricao longa (landing page) |
| `thumbnail_url` | TEXT | Imagem de capa |
| `scheduled_at` | TIMESTAMPTZ | Data/hora da live |
| `duration_minutes` | INT | Duracao em minutos |
| `meeting_link` | TEXT | Link do Zoom/Meet/etc |
| `access_type` | ENUM | `free`, `paid`, `subscribers`, `pro`, `vip` |
| `price` | NUMERIC | Preco (apenas para `paid`) |
| `ticto_product_id` | TEXT | ID do produto Ticto (para lives pagas) |
| `ticto_checkout_url` | TEXT | URL de checkout Ticto |
| `max_attendees` | INT | Limite de vagas (NULL = ilimitado) |
| `mentor_id` | UUID FK | Mentor que criou |
| `status` | ENUM | `draft`, `scheduled`, `live`, `completed`, `cancelled` |
| `recording_url` | TEXT | URL da gravacao (pos-live) |
| `og_image_url` | TEXT | Imagem para compartilhamento social |

### Tabela `live_registrations`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | UUID | PK |
| `live_id` | UUID FK | Live associada |
| `user_id` | UUID FK | Usuario inscrito |
| `registered_at` | TIMESTAMPTZ | Data da inscricao |
| `attended` | BOOLEAN | Presenca confirmada pelo mentor |
| `payment_status` | ENUM | `none`, `pending`, `paid`, `refunded` |
| UNIQUE | | `(live_id, user_id)` — um usuario nao se inscreve duas vezes |

---

## 2. RLS (Row Level Security)

### Lives
- **SELECT**: Usuarios autenticados veem lives com status `scheduled`, `live`, `completed`. Mentores tambem veem seus proprios drafts.
- **INSERT/UPDATE**: Apenas mentores/admins, e `mentor_id = auth.uid()`
- **ALL**: Admin tem acesso total
- **service_role**: Acesso total (Edge Functions)

### Live Registrations
- **SELECT**: Usuario ve suas proprias inscricoes, mentor ve inscricoes de suas lives, admin ve tudo
- **INSERT**: `user_id = auth.uid()` (usuario so inscreve a si mesmo)
- **DELETE**: `user_id = auth.uid()` (usuario pode cancelar propria inscricao)
- **UPDATE**: Mentor da live pode atualizar (ex: marcar presenca)

---

## 3. Monitorando Lives

### Queries uteis no SQL Editor

```sql
-- Lives agendadas para os proximos 7 dias
SELECT l.title, l.slug, l.scheduled_at, l.access_type, l.status,
       p.full_name AS mentor,
       (SELECT COUNT(*) FROM live_registrations WHERE live_id = l.id) AS inscritos
FROM lives l
JOIN profiles p ON p.id = l.mentor_id
WHERE l.status IN ('scheduled', 'live')
  AND l.scheduled_at > now()
  AND l.scheduled_at < now() + interval '7 days'
ORDER BY l.scheduled_at;

-- Lives com mais inscritos (top 10)
SELECT l.title, l.access_type, COUNT(lr.id) AS inscritos
FROM lives l
JOIN live_registrations lr ON lr.live_id = l.id
GROUP BY l.id
ORDER BY inscritos DESC
LIMIT 10;

-- Taxa de presenca por live
SELECT l.title,
       COUNT(lr.id) AS inscritos,
       COUNT(lr.id) FILTER (WHERE lr.attended) AS presentes,
       ROUND(100.0 * COUNT(lr.id) FILTER (WHERE lr.attended) / NULLIF(COUNT(lr.id), 0), 1) AS taxa_presenca
FROM lives l
JOIN live_registrations lr ON lr.live_id = l.id
WHERE l.status = 'completed'
GROUP BY l.id
ORDER BY l.scheduled_at DESC;

-- Lives pagas: receita gerada
SELECT l.title, l.price, COUNT(lr.id) AS pagos,
       l.price * COUNT(lr.id) AS receita_total
FROM lives l
JOIN live_registrations lr ON lr.live_id = l.id
WHERE l.access_type = 'paid' AND lr.payment_status = 'paid'
GROUP BY l.id
ORDER BY receita_total DESC;
```

---

## 4. Intervencoes Manuais

### Conceder acesso a uma live paga (sem pagamento)

```sql
INSERT INTO live_registrations (live_id, user_id, payment_status, registered_at)
VALUES ('<live_uuid>', '<user_uuid>', 'paid', now())
ON CONFLICT (live_id, user_id) DO UPDATE SET payment_status = 'paid';
```

### Cancelar inscricao de um usuario

```sql
DELETE FROM live_registrations
WHERE live_id = '<live_uuid>' AND user_id = '<user_uuid>';
```

### Mudar status de uma live (ex: mentor esqueceu de encerrar)

```sql
UPDATE lives SET status = 'completed', updated_at = now()
WHERE id = '<live_uuid>';
```

### Adicionar URL de gravacao

```sql
UPDATE lives SET recording_url = 'https://...', updated_at = now()
WHERE id = '<live_uuid>';
```

---

## 5. Ticto Webhook — Lives Pagas

O webhook `ticto-webhook` foi atualizado com fallback para lives:

1. Recebe evento de compra do Ticto
2. Busca `hub_services` por `ticto_product_id` — se encontra, segue fluxo normal
3. **Se nao encontra**: busca `lives` por `ticto_product_id`
4. Se encontra live: UPSERT em `live_registrations` com `payment_status='paid'` + cria order
5. Para reembolso: atualiza `payment_status='refunded'`

### Configurando uma Live Paga

O mentor precisa:
1. Criar o produto no Ticto
2. Copiar o `product_id` do Ticto
3. Preencher `ticto_product_id` e `ticto_checkout_url` no formulario de criacao da live

### Verificando se o Webhook Funciona

```sql
-- Verificar logs de pagamento de lives
SELECT * FROM payment_logs
WHERE status = 'processed_live'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 6. RPC `check_live_access`

A funcao `check_live_access(p_user_id, p_live_id)` e chamada pela landing page para determinar o CTA. Retorna JSONB:

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `allowed` | boolean | Se o usuario pode se inscrever |
| `reason` | text | `already_registered`, `free`, `payment_required`, `no_subscription`, `plan_too_low`, `full` |
| `registered` | boolean | Se ja esta inscrito |
| `checkout_url` | text | URL de checkout Ticto (para `paid`) |
| `price` | numeric | Preco (para `paid`) |
| `required` | text | Plano necessario (`subscribers`, `pro`, `vip`) |

Testar via SQL:
```sql
SELECT check_live_access('<user_uuid>', '<live_uuid>');
```

---

## 7. Email Notifications

### Templates de Live

3 templates na categoria `live`, editaveis em `/admin/email-templates`:

| Template | Quando e Enviado | Destinatario |
|----------|-----------------|--------------|
| `live_registration_confirmation` | Usuario se inscreve em live | Inscrito |
| `live_going_live` | Mentor clica "Go Live" | Todos os inscritos |
| `live_unfinished_warning` | Cron: live excedeu duracao + 60min | Mentor |

### Monitorando Emails de Live

```sql
-- Emails de live enviados nas ultimas 24h
SELECT template_name, status, COUNT(*) AS total
FROM email_logs
WHERE template_name LIKE 'live_%'
  AND created_at > now() - interval '24 hours'
GROUP BY template_name, status
ORDER BY template_name;

-- Falhas de email em lives
SELECT template_name, recipient, error_message, created_at
FROM email_logs
WHERE template_name LIKE 'live_%'
  AND status = 'failed'
ORDER BY created_at DESC
LIMIT 20;

-- Verificar se confirmacao de inscricao foi enviada
SELECT * FROM email_logs
WHERE template_name = 'live_registration_confirmation'
  AND recipient = '<email>'
ORDER BY created_at DESC LIMIT 1;
```

---

## 8. Auto-Encerramento de Lives (Cron)

O cron job `check-unfinished-lives` roda a cada 15 minutos e auto-encerra lives esquecidas:

- **Condicao**: `status = 'live'` E `scheduled_at + duration_minutes + 60min < NOW()`
- **Acoes**: envia email + WhatsApp ao mentor, muda status para `completed`

### Monitorando o Cron

```sql
-- Verificar cron job ativo
SELECT jobname, schedule, command FROM cron.job
WHERE jobname = 'check-unfinished-lives';

-- Verificar emails de auto-close
SELECT * FROM email_logs
WHERE template_name = 'live_unfinished_warning'
ORDER BY created_at DESC LIMIT 10;

-- Lives auto-encerradas (sem encerramento manual)
SELECT l.title, l.scheduled_at, l.duration_minutes, l.updated_at,
       el.created_at AS email_sent_at
FROM lives l
LEFT JOIN email_logs el ON el.template_name = 'live_unfinished_warning'
  AND el.recipient = (SELECT email FROM auth.users WHERE id = l.mentor_id)
WHERE l.status = 'completed'
ORDER BY l.updated_at DESC LIMIT 10;
```

### Intervencao Manual (se cron nao funcionou)

```sql
-- Verificar lives que deveriam ter sido encerradas
SELECT id, title, scheduled_at, duration_minutes,
       scheduled_at + (duration_minutes || ' minutes')::interval + interval '60 minutes' AS deveria_encerrar
FROM lives
WHERE status = 'live'
  AND scheduled_at + (duration_minutes || ' minutes')::interval + interval '60 minutes' < now();

-- Encerrar manualmente
UPDATE lives SET status = 'completed', updated_at = now()
WHERE id = '<live_uuid>';
```
