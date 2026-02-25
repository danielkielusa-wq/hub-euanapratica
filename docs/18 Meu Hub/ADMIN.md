# Meu Hub — Guia do Administrador

> Este documento cobre como configurar, monitorar e gerenciar o "Meu Hub" via painel de administração.

---

## Acesso Admin

- **Painel de serviços**: `/admin/hub-services`
- **Usuários e acessos**: `/admin/usuarios` → aba de serviços do usuário
- **Logs de pagamento**: `/admin/pedidos`

---

## 1. Configurando um Serviço para Aparecer no Meu Hub

Cada serviço em `hub_services` precisa das seguintes configurações para funcionar corretamente no Meu Hub:

### Campos Obrigatórios

| Campo | Onde Preencher | O que Controla |
|-------|----------------|----------------|
| `name` | Nome do serviço | Título exibido no card |
| `service_type` | Tipo de serviço | Comportamento do card e CTA |
| `is_visible_in_hub` | Visível no Hub | Se aparece no catálogo |
| `route` | Rota interna | Destino do CTA do card |
| `ticto_product_id` | ID do produto Ticto | Vincula pagamento → acesso automático |

### Campo para Ferramentas de Plano (Opcional)

| Campo | Quando Usar |
|-------|-------------|
| `plan_feature_key` | Quando o serviço é uma ferramenta incluída no plano (ex: `resume_pass`, `title_translator`). Deixe vazio para serviços avulsos. |

**Valores válidos para `plan_feature_key`:**
- `resume_pass` — Análise de currículo (ResumePass AI)
- `title_translator` — Tradutor de títulos
- (futuro) Qualquer nova feature que seja feature-flag de plano

### Tipos de Serviço e Comportamento

| `service_type` | Card mostra | CTA |
|----------------|-------------|-----|
| `consulting` | Status de agendamento, data da sessão | "Agendar Sessão" → `/dashboard/agendar/:serviceId` |
| `live_mentoring` | Próxima sessão do Espaço | "Acessar Espaço" → `/espaco/:espacoId` |
| `recorded_course` | Barra de progresso | "Começar Curso" ou "Continuar" |
| `live_event` | Data do evento | "Entrar no Evento" |
| `ai_tool` | Créditos disponíveis | "Usar Ferramenta" → rota configurada |

### Vinculando ao Espaço (`espaco_id`)

Para serviços do tipo `live_mentoring` e `recorded_course`, vincule ao Espaço correspondente. O webhook Ticto usa esse campo para auto-matricular o aluno no Espaço na hora da compra.

---

## 2. Concedendo Acesso Manual

Para dar acesso a um usuário sem que ele passe pelo checkout (cortesia, acordos, testing):

**Via Supabase Dashboard:**
```sql
INSERT INTO public.user_hub_services
  (user_id, service_id, status, access_source, sessions_total, sessions_used, metadata, started_at)
VALUES
  ('<user_uuid>', '<service_uuid>', 'active', 'admin_grant', 1, 0, '{}', now());
```

**Campos importantes:**
- `access_source`: use `'admin_grant'` para concessões manuais
- `sessions_total`: número de sessões liberadas (`null` = ilimitado para ferramentas)
- `sessions_used`: sempre iniciar em `0`

**Via painel admin** (quando implementado em `/admin/usuarios`):
1. Abrir perfil do usuário
2. Aba "Serviços"
3. Botão "Conceder Acesso"
4. Selecionar serviço + número de sessões

---

## 3. Revogar Acesso

```sql
UPDATE public.user_hub_services
SET status = 'cancelled'
WHERE user_id = '<user_uuid>'
  AND service_id = '<service_uuid>';
```

O card desaparece imediatamente do Meu Hub do usuário (query filtra por `status = 'active'`).

---

## 4. Monitoramento

### Verificar Usuários com "Ação Necessária" há muito tempo

```sql
SELECT
  p.email,
  p.full_name,
  hs.name AS service_name,
  uhs.started_at,
  EXTRACT(DAY FROM now() - uhs.started_at) AS dias_sem_agendar
FROM user_hub_services uhs
JOIN profiles p ON p.id = uhs.user_id
JOIN hub_services hs ON hs.id = uhs.service_id
LEFT JOIN bookings b ON b.student_id = uhs.user_id
  AND b.service_id = uhs.service_id
  AND b.status != 'cancelled'
WHERE uhs.status = 'active'
  AND hs.service_type = 'consulting'
  AND b.id IS NULL
  AND uhs.started_at < now() - INTERVAL '7 days'
ORDER BY dias_sem_agendar DESC;
```

### Verificar Uso de Sessões por Serviço

```sql
SELECT
  hs.name AS service_name,
  COUNT(*) AS total_usuarios,
  AVG(uhs.sessions_used::float / NULLIF(uhs.sessions_total, 0)) AS taxa_uso
FROM user_hub_services uhs
JOIN hub_services hs ON hs.id = uhs.service_id
WHERE uhs.status = 'active'
  AND uhs.sessions_total IS NOT NULL
GROUP BY hs.name
ORDER BY taxa_uso;
```

---

## 5. Campos no `metadata`

O campo `metadata` armazena contexto por tipo de serviço, populado automaticamente pelo webhook Ticto:

| `service_type` | `metadata` default | Campos extras possíveis |
|----------------|-------------------|------------------------|
| `consulting` | `{ "booking_id": null }` | `booking_id` atualizado quando sessão é agendada |
| `live_mentoring` | `{ "espaco_id": "<uuid>" }` | — |
| `live_event` | `{}` | `session_datetime`, `meeting_link` (populados manualmente ou via admin) |
| `recorded_course` | `{}` | `progress_percent` (0-100, atualizado pelo player) |
| `ai_tool` | `{}` | — |

---

## 6. Troubleshooting Comum

### Usuário comprou mas não aparece no Meu Hub

1. Verificar `payment_logs` pelo email do cliente
2. Confirmar que `hub_services.ticto_product_id` bate com o `product_id` no payload Ticto
3. Verificar `user_hub_services` — row existe mas `status = 'cancelled'`? → UPDATE para `'active'`
4. Se row não existe → inserir manualmente com `access_source = 'admin_grant'`

### Card aparece em seção errada

Status é computado dinamicamente pelo frontend. Causas comuns:
- `sessions_total` não populado para `consulting` → use `UPDATE user_hub_services SET sessions_total = 1 WHERE ...`
- Booking cancelado → status volta para `needs_action` automaticamente (correto por design)

### Ferramenta de plano não aparece

1. Verificar se `hub_services.plan_feature_key` está preenchido
2. Verificar se o plano do usuário tem a feature habilitada em `plans.features`
3. Confirmar `hub_services.is_visible_in_hub = true`
