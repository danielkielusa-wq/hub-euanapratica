# 01 — Subscription Lifecycle (Alertas de Assinatura)

> Ultima atualizacao: 2026-02-24

---

## Objetivo e Valor

Enviar alertas instantaneos no Telegram para o time administrativo sempre que ocorrer um evento de assinatura: ativacao, cancelamento, falha de pagamento (dunning) ou renovacao. Isso permite acao rapida em cancelamentos e celebracao de novas vendas.

**Valor de negocio**:
- Visibilidade em tempo real sobre o ciclo de vida das assinaturas
- Reacao rapida a cancelamentos (tentativa de retencao)
- Monitoramento de dunning (falhas de pagamento) para intervencao proativa
- Registro automatizado para auditoria

---

## Evento Gatilho

| Campo | Valor |
|-------|-------|
| Trigger event | `subscription.*` (wildcard — captura todos os eventos de assinatura) |
| Origem | Edge Functions `ticto-webhook` e `cancel-subscription` |
| Metodo | POST (webhook) |
| Dispatcher | `dispatchN8NWebhook()` em `_shared/n8nService.ts` |

### Eventos especificos capturados

| Evento | Origem | Quando |
|--------|--------|--------|
| `subscription.activated` | `ticto-webhook` | Ticto confirma pagamento de nova assinatura |
| `subscription.cancelled` | `ticto-webhook` | Ticto cancela assinatura (por inadimplencia, etc.) |
| `subscription.cancelled` | `cancel-subscription` | Usuario solicita cancelamento via Hub |
| `subscription.dunning_updated` | `ticto-webhook` | Falha de cobranca recorrente |
| `subscription.renewed` | `ticto-webhook` | Renovacao automatica confirmada |

---

## Payload

### Payload de `ticto-webhook` (subscription.activated, subscription.dunning_updated)

```json
{
  "event": "subscription.activated",
  "timestamp": "2026-02-24T14:30:00.000Z",
  "source": "enp_hub_supabase",
  "action": "activated",
  "customer_email": "lead@example.com",
  "customer_name": "Maria Silva",
  "user_id": "uuid-do-usuario",
  "plan_id": "uuid-do-plano",
  "plan_name": "Pro Mensal",
  "offer_id": "12345",
  "ticto_status": "paid",
  "product_name": "Hub EUA na Pratica - Pro",
  "paid_amount": 19700
}
```

> **Nota**: `paid_amount` esta em centavos (19700 = R$ 197,00).

### Payload de `cancel-subscription` (subscription.cancelled pelo usuario)

```json
{
  "event": "subscription.cancelled",
  "timestamp": "2026-02-24T14:30:00.000Z",
  "source": "enp_hub_supabase",
  "user_id": "uuid-do-usuario",
  "email": "lead@example.com",
  "subscription_id": "uuid-da-assinatura",
  "plan_id": "uuid-do-plano",
  "reason": "Nao estou usando o suficiente",
  "feedback": "Gostaria de mais conteudo sobre vistos",
  "was_active": true,
  "expires_at": "2026-03-24T00:00:00.000Z"
}
```

### Schema dos campos

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `event` | string | Evento completo (ex: `subscription.activated`) |
| `timestamp` | ISO 8601 | Momento do disparo |
| `source` | string | Sempre `"enp_hub_supabase"` |
| `action` | string | Acao executada: `activated`, `cancelled`, `dunning_updated`, `renewed` |
| `customer_email` | string/null | Email do cliente |
| `customer_name` | string/null | Nome do cliente |
| `user_id` | UUID/null | ID do usuario no Supabase auth |
| `plan_id` | UUID/null | ID do plano em `plans` |
| `plan_name` | string/null | Nome do plano (presente em eventos do ticto) |
| `offer_id` | string | ID da oferta no Ticto |
| `ticto_status` | string | Status original do Ticto |
| `product_name` | string/null | Nome do produto no Ticto |
| `paid_amount` | number/null | Valor pago em centavos |
| `reason` | string | Motivo do cancelamento (apenas em cancel-subscription) |
| `feedback` | string/null | Feedback adicional do usuario |
| `was_active` | boolean | Se a assinatura estava ativa no momento do cancelamento |
| `expires_at` | ISO 8601/null | Data de expiracao (cancelamento no fim do periodo) |

---

## Fluxo

```
+-------------------+      +-------------------+      +-------------------+
| ticto-webhook     |      | cancel-subscription|     |                   |
| (Ticto envia      | ---> | (usuario solicita  | --> |  dispatchN8NWebhook()
|  callback HTTP)   |      |  cancelamento)     |     |  n8nService.ts    |
+-------------------+      +-------------------+      +--------+----------+
                                                               |
                                                               | POST webhook_url
                                                               v
                                                     +---------+-----------+
                                                     |  N8N: Webhook Node  |
                                                     |  /webhook/sub-      |
                                                     |  lifecycle           |
                                                     +---------+-----------+
                                                               |
                                                               v
                                                     +---------+-----------+
                                                     |  Switch Node        |
                                                     |  by event           |
                                                     +-+------+------+----+
                                                       |      |      |
                                            activated  | cancelled   | dunning
                                                       |      |      |
                                                       v      v      v
                                                  +----+  +---+  +--+-----+
                                                  | TG |  | TG |  |  TG   |
                                                  |Nova|  |Can |  | Falha |
                                                  |Ass.|  |cel.|  | Pgto  |
                                                  +----+  +----+  +-------+
```

### Detalhamento dos nos N8N

1. **Webhook Node** (`/webhook/sub-lifecycle`)
   - Metodo: POST
   - Recebe o payload enriquecido com `event`, `timestamp`, `source`

2. **Switch Node** (roteamento por evento)
   - Condicao 1: `{{ $json.event }}` contains `activated` -> Fluxo "Nova Assinatura"
   - Condicao 2: `{{ $json.event }}` contains `cancelled` -> Fluxo "Cancelamento"
   - Condicao 3: `{{ $json.event }}` contains `dunning` -> Fluxo "Falha de Pagamento"
   - Default: Fluxo "Outro Evento" (log generico)

3. **Telegram Node — Nova Assinatura**
   ```
   Nova assinatura! 🎉

   👤 {{ $json.customer_name || "Desconhecido" }}
   📧 {{ $json.customer_email }}
   📋 Plano: {{ $json.plan_name || $json.product_name }}
   💰 Valor: R$ {{ ($json.paid_amount / 100).toFixed(2) }}
   🔗 Oferta: {{ $json.offer_id }}
   ```

4. **Telegram Node — Cancelamento**
   ```
   Cancelamento de assinatura ⚠️

   👤 {{ $json.customer_name || $json.email }}
   📋 Plano: {{ $json.plan_id }}
   📝 Motivo: {{ $json.reason || "Via Ticto" }}
   💬 Feedback: {{ $json.feedback || "Nenhum" }}
   ⏰ Expira em: {{ $json.expires_at || "Imediato" }}
   🔄 Estava ativa: {{ $json.was_active ? "Sim" : "Nao" }}
   ```

5. **Telegram Node — Falha de Pagamento**
   ```
   Falha de pagamento (dunning) 🔴

   👤 {{ $json.customer_name }}
   📧 {{ $json.customer_email }}
   📋 Plano: {{ $json.plan_name }}
   🏷️ Status Ticto: {{ $json.ticto_status }}
   ```

---

## Configuracao N8N

### Registro na tabela n8n_automations

```sql
INSERT INTO n8n_automations (name, trigger_event, webhook_url, enabled, webhook_method, timeout_ms, max_retries)
VALUES (
  'Subscription Lifecycle',
  'subscription.*',
  'https://n8n.euanapratica.com/webhook/sub-lifecycle',
  true,
  'POST',
  10000,
  2
);
```

> O trigger_event `subscription.*` captura todos os eventos que comecam com `subscription.` graas a logica de wildcard no `n8nService.ts`.

### Credenciais necessarias

| Credencial | Tipo | Uso neste workflow |
|------------|------|-------------------|
| Telegram Bot | Telegram API | Envio de alertas |

### Variaveis de workflow

| Variavel | Valor | Descricao |
|----------|-------|-----------|
| `TELEGRAM_CHAT_ID` | `-100xxxxxxxxxx` | ID do grupo de alertas admin |

---

## Edge Functions Envolvidas

### 1. `ticto-webhook` (`supabase/functions/ticto-webhook/index.ts`)

- **Responsabilidade**: Receber callbacks do Ticto (plataforma de pagamento)
- **Dispatch**: Linhas 136-148 — apos `handleSubscriptionEvent()` retornar sucesso
- **Evento**: `subscription.${result.action}` (action = activated, cancelled, dunning_updated, renewed)
- **Payload montado com dados**: customer email/name do Ticto, user_id resolvido via profiles, plan_id via match com `plans.ticto_offer_id_*`

### 2. `cancel-subscription` (`supabase/functions/cancel-subscription/index.ts`)

- **Responsabilidade**: Processar cancelamento solicitado pelo usuario
- **Dispatch**: Linhas 197-206 — apos update da assinatura e gravacao do survey
- **Evento**: `subscription.cancelled`
- **Payload montado com dados**: user_id, email do JWT, subscription_id, plan_id, reason, feedback, was_active, expires_at

---

## Registro no CRM

Este workflow NAO registra no CRM (tabela `lead_interactions`). Os eventos de assinatura sao alertas administrativos, nao comunicacao com leads.

**Registros existentes**:
- `n8n_webhook_logs`: Log automatico de cada dispatch (feito pelo `n8nService.ts`)
- `payment_logs`: Log de transacoes (feito pelo `ticto-webhook`)
- `subscription_cancellation_surveys`: Motivos de cancelamento (feito pelo `cancel-subscription`)

---

## Troubleshooting

### Problema: Webhook nao chega ao N8N

1. **Verificar se a automacao esta habilitada**:
   ```sql
   SELECT name, enabled, webhook_url, last_triggered_at, last_status
   FROM n8n_automations
   WHERE trigger_event LIKE 'subscription%';
   ```

2. **Verificar logs de dispatch**:
   ```sql
   SELECT * FROM n8n_webhook_logs
   WHERE trigger_event LIKE 'subscription%'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. **Status posssiveis no log**:
   - `success`: Webhook entregue com sucesso (HTTP 2xx)
   - `error`: N8N retornou erro (HTTP 4xx/5xx) — ver `error_message`
   - `timeout`: N8N nao respondeu em `timeout_ms` (default 10s)
   - `skipped`: Automacao sem `webhook_url` configurada

### Problema: Telegram nao envia mensagem

1. Verificar se o bot esta no grupo:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getChat?chat_id=<CHAT_ID>"
   ```

2. Verificar se o bot tem permissao de enviar mensagens no grupo

3. Verificar credencial Telegram no N8N (Settings > Credentials)

### Problema: Evento de cancelamento nao dispara

1. Verificar se o `cancel-subscription` esta no `config.toml` com `verify_jwt = false`:
   ```toml
   [functions.cancel-subscription]
   verify_jwt = false
   ```

2. Verificar logs da Edge Function:
   ```bash
   npx supabase functions logs cancel-subscription --project-ref seqgnxynrcylxsdzbloa
   ```

### Problema: paid_amount sempre null

- O `paid_amount` vem de `payload.order?.paid_amount` no Ticto
- Verificar se a oferta no Ticto esta configurada como assinatura (nao como venda unica)
- Verificar payload bruto nos logs:
  ```sql
  SELECT payload FROM payment_logs
  WHERE event_type IN ('paid', 'activated')
  ORDER BY created_at DESC LIMIT 5;
  ```
