# 07 — Flow Session Notification (Sessao Individual WhatsApp)

> Ultima atualizacao: 2026-03-03

---

## Objetivo e Valor

Notificar o admin via Telegram (e opcionalmente email) quando uma sessao individual de fluxo WhatsApp for concluida com sucesso ou encerrada com erro. Principalmente util para disparos manuais onde o admin quer confirmacao imediata de entrega.

**Valor de negocio**:
- Confirmacao imediata apos "Disparar" no ManualTriggerDialog
- Alerta de erro se o numero nao existir ou a mensagem falhar
- Contexto completo: nome do lead, telefone, mensagens trocadas
- Rastreabilidade de cada disparo manual

---

## Evento Gatilho

| Campo | Valor |
|-------|-------|
| Trigger event | `flow_session.*` (wildcard — captura `flow_session.completed`) |
| Origem | `_shared/flowEngineService.ts` — funcoes `completeSession()` e `markSessionError()` |
| Metodo | POST (webhook) |
| Dispatcher | `dispatchSessionWebhook()` → `dispatchN8NWebhook()` em `_shared/n8nService.ts` |
| Condicao | Apenas se a sessao foi criada com `trigger_data.notify_on_complete = true` |

### Eventos especificos capturados

| Evento | Quando |
|--------|--------|
| `flow_session.completed` | Fluxo concluiu todas as etapas com sucesso |
| `flow_session.completed` (status=error) | Fluxo encerrado por erro (mensagem falhou, timeout, etc.) |

> **Nota**: o campo `status` dentro do payload diferencia sucesso (`completed`) de erro (`error`). O evento N8N e sempre `flow_session.completed`.

---

## Payload

### Sessao concluida com sucesso

```json
{
  "event": "flow_session.completed",
  "timestamp": "2026-03-03T14:30:00.000Z",
  "source": "enp_hub_supabase",
  "session_id": "uuid-da-sessao",
  "flow_id": "uuid-do-fluxo",
  "flow_name": "Relatório Pronto — Drip",
  "phone": "+5511999999999",
  "lead_id": "uuid-do-lead",
  "lead_name": "Maria Silva",
  "trigger_type": "manual",
  "status": "completed",
  "messages_sent": 3,
  "messages_received": 1,
  "error_message": null,
  "started_at": "2026-03-03T14:00:00.000Z",
  "completed_at": "2026-03-03T14:30:00.000Z"
}
```

### Sessao com erro

```json
{
  "event": "flow_session.completed",
  "status": "error",
  "error_message": "WhatsApp message failed: number not registered",
  "messages_sent": 0,
  "messages_received": 0,
  ...
}
```

### Schema dos campos

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `event` | string | Sempre `flow_session.completed` |
| `timestamp` | ISO 8601 | Momento do disparo |
| `source` | string | Sempre `"enp_hub_supabase"` |
| `session_id` | UUID | ID da sessao em `whatsapp_flow_sessions` |
| `flow_id` | UUID | ID do fluxo em `whatsapp_flows` |
| `flow_name` | string | Nome de exibicao do fluxo |
| `phone` | string | Numero do contato (formato `+5511...`) |
| `lead_id` | UUID / null | ID do lead (null se nao encontrado no CRM) |
| `lead_name` | string / null | Nome do lead (do `trigger_data`) |
| `trigger_type` | string | `manual`, `event`, `keyword`, `batch` |
| `status` | string | `completed` (sucesso) ou `error` |
| `messages_sent` | integer | Mensagens enviadas pelo fluxo |
| `messages_received` | integer | Respostas recebidas do lead |
| `error_message` | string / null | Descricao do erro (null se sucesso) |
| `started_at` | ISO 8601 | Inicio da sessao |
| `completed_at` | ISO 8601 | Fim da sessao |

---

## Fluxo N8N

```
Webhook (/webhook/flow-session)
    |
    v
Code Node (Preparar Notificacao)
    |--- telegram_text, email_subject, email_html, is_error
    |
    v
IF Node (is_error?)
    |--- false → Telegram (confirmacao de entrega)
    |--- true  → Telegram urgente + Email alerta
```

### Detalhamento dos nos

1. **Webhook Node** (`/webhook/flow-session`)
   - Metodo: POST
   - Os dados ficam em `$json.body`

2. **Code Node — Preparar Notificacao**
   - Diferencia `status === 'error'` de `status === 'completed'`
   - Formata datas em pt-BR (America/Sao_Paulo)
   - Retorna `telegram_text`, `email_*`, `is_error`

3. **IF Node — E erro?**
   - Condicao: `{{ $json.is_error }}` equals `true`

4. **Telegram Node — Confirmacao** _(saida false)_
   - Mensagem simples confirmando entrega bem-sucedida

5. **Telegram Node + Email** _(saida true)_
   - Alerta urgente com `error_message`

---

## Code Node — JS

```javascript
const payload = $input.first().json.body;

const status   = payload.status;
const isError  = status === 'error';
const emoji    = isError ? '❌' : '✅';
const phone    = payload.phone    || '—';
const leadName = payload.lead_name || '(sem nome)';

const fmt = (iso) => iso
  ? new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  : '—';

const tgText = [
  `${emoji} *Sessao de Fluxo ${isError ? 'com Erro' : 'Concluida'}*`,
  ``,
  `📋 Fluxo: ${payload.flow_name || '—'}`,
  `👤 Lead: ${leadName}`,
  `📱 Telefone: \`${phone}\``,
  `🔄 Tipo: ${payload.trigger_type || '—'}`,
  ``,
  `📤 Msgs enviadas: ${payload.messages_sent ?? 0}`,
  `📥 Msgs recebidas: ${payload.messages_received ?? 0}`,
  ``,
  `🕐 Início: ${fmt(payload.started_at)}`,
  `🏁 Fim: ${fmt(payload.completed_at)}`,
  payload.error_message
    ? `\n❌ Erro: ${payload.error_message}`
    : '',
].filter(Boolean).join('\n');

const statusColor   = isError ? '#dc2626' : '#16a34a';
const statusLabel   = isError ? 'ERRO' : 'CONCLUIDA';
const emailSubject  = `${emoji} Sessao WhatsApp — ${leadName} — ${statusLabel}`;
const emailHtml = `
<div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto">
  <h2 style="color:${statusColor}">${emoji} Sessao ${statusLabel}</h2>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr style="background:#f3f4f6"><td style="padding:8px;border:1px solid #e5e7eb">Fluxo</td><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold">${payload.flow_name || '—'}</td></tr>
    <tr><td style="padding:8px;border:1px solid #e5e7eb">Lead</td><td style="padding:8px;border:1px solid #e5e7eb">${leadName}</td></tr>
    <tr><td style="padding:8px;border:1px solid #e5e7eb">Telefone</td><td style="padding:8px;border:1px solid #e5e7eb;font-family:monospace">${phone}</td></tr>
    <tr style="background:#f3f4f6"><td style="padding:8px;border:1px solid #e5e7eb">Tipo de disparo</td><td style="padding:8px;border:1px solid #e5e7eb">${payload.trigger_type || '—'}</td></tr>
    <tr><td style="padding:8px;border:1px solid #e5e7eb">Msgs enviadas</td><td style="padding:8px;border:1px solid #e5e7eb">${payload.messages_sent ?? 0}</td></tr>
    <tr><td style="padding:8px;border:1px solid #e5e7eb">Msgs recebidas</td><td style="padding:8px;border:1px solid #e5e7eb">${payload.messages_received ?? 0}</td></tr>
  </table>
  <p style="font-size:13px;color:#6b7280">Início: ${fmt(payload.started_at)} · Fim: ${fmt(payload.completed_at)}</p>
  ${payload.error_message ? `<p style="background:#fee2e2;padding:8px 12px;border-radius:8px;font-size:13px;color:#991b1b">❌ ${payload.error_message}</p>` : ''}
</div>`;

return [{
  json: {
    telegram_text: tgText,
    telegram_parse_mode: 'Markdown',
    email_subject: emailSubject,
    email_html: emailHtml,
    email_to: 'admin@euanapratica.com',
    is_error: isError,
    event: payload.event,
    session_id: payload.session_id,
    phone,
    lead_name: leadName,
  }
}];
```

---

## Configuracao N8N

### Automacao registrada na tabela `n8n_automations`

```sql
-- Ja inserida via migration 20260303400000
SELECT name, trigger_event, enabled, webhook_url
FROM n8n_automations
WHERE name = 'flow_session_notification';
```

Para ativar via UI: `/admin/automacoes` → card "Notificacao de Sessao de Fluxo" → configurar webhook URL → ativar toggle.

### Webhook URL sugerida

```
https://n8n.euanapratica.com/webhook/flow-session
```

### Credenciais necessarias

| Credencial | Tipo | Uso |
|------------|------|-----|
| Telegram Bot | Telegram API | Confirmacao de entrega |
| SMTP ou Resend | Email | Alertas de erro (opcional) |

---

## Onde o webhook e disparado no codigo

### `supabase/functions/_shared/flowEngineService.ts`

- **`completeSession()`** (linha ~693): chama `dispatchSessionWebhook(supabase, sessionId, "completed")`
- **`markSessionError()`** (linha ~711): chama `dispatchSessionWebhook(supabase, sessionId, "error")`
- **`dispatchSessionWebhook()`** (linha ~761): verifica `trigger_data.notify_on_complete` antes de disparar

### Como habilitar por sessao

O toggle "Notificar ao concluir" no `ManualTriggerDialog.tsx` define `notifyOnComplete: true`.
Isso e armazenado em `whatsapp_flow_sessions.trigger_data.notify_on_complete = true`.

Disparos automaticos (trigger `event`, `keyword`, `batch`) **nao** disparam este webhook por padrao — apenas disparos manuais com o toggle ativado.

---

## Diferenca entre disparos manuais e em lote

| Cenario | Webhook usado | Evento |
|---------|--------------|--------|
| Disparo manual (ManualTriggerDialog) | `flow_session_notification` | `flow_session.*` |
| Lote (BatchDispatchDialog) | `batch_dispatch_notification` | `batch.*` |
| Disparo por evento automatico | Nenhum (sem toggle) | — |
| Disparo por palavra-chave | Nenhum (sem toggle) | — |

Lotes disparam o webhook de sessao POR CONTATO (pode ser muitos). Por isso, para lotes e preferivel usar o webhook `batch.*` que da um resumo agregado ao final.

---

## Troubleshooting

### Webhook nao chega ao N8N apos disparo manual

1. Verificar se a automacao esta habilitada:
   ```sql
   SELECT name, enabled, webhook_url, last_triggered_at, last_status
   FROM n8n_automations
   WHERE name = 'flow_session_notification';
   ```

2. Verificar logs do dispatch:
   ```sql
   SELECT trigger_event, status, response_status, error_message, created_at
   FROM n8n_webhook_logs
   WHERE trigger_event LIKE 'flow_session%'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. Verificar se a sessao tem `notify_on_complete`:
   ```sql
   SELECT id, phone, status, trigger_data, completed_at
   FROM whatsapp_flow_sessions
   ORDER BY created_at DESC
   LIMIT 5;
   -- trigger_data deve conter {"notify_on_complete": true}
   ```

### Webhook disparado para sessoes de lote (nao desejado)

- Isso acontece se a sessao de lote for criada manualmente com `trigger_data.notify_on_complete = true`
- O `batchDispatchService.ts` nao passa `notify_on_complete` no `trigger_data` de sessoes criadas via lote — apenas o `dispatchBatchWebhook()` e chamado no nivel do job
- Se ocorrer, verificar `createSession()` em `flowEngineService.ts`

### Telegram recebe mensagem duplicada

- Verificar se ha mais de uma automacao habilitada com `trigger_event = 'flow_session.*'` ou `trigger_event = 'flow_session.completed'`
- O `n8nService.ts` despacha para TODAS as automacoes que casam com o evento
