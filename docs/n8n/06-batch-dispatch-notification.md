# 06 — Batch Dispatch Notification (Lote WhatsApp)

> Ultima atualizacao: 2026-03-03

---

## Objetivo e Valor

Notificar o admin via Telegram (e opcionalmente email) quando um lote de envio WhatsApp for concluido, pausado automaticamente por alta taxa de erro, ou cancelado.

**Valor de negocio**:
- Visibilidade em tempo real sobre o andamento de envios em massa
- Alerta imediato quando o sistema pausa um lote (taxa de erro >20%)
- Resumo automatico com contadores (enviados / falhas / pulados)
- Permite validar o resultado do lote antes de aumentar o volume

---

## Evento Gatilho

| Campo | Valor |
|-------|-------|
| Trigger event | `batch.*` (wildcard — captura `batch.completed` e `batch.paused`) |
| Origem | `_shared/batchDispatchService.ts` — funcoes `markJobCompleted()` e auto-pause |
| Metodo | POST (webhook) |
| Dispatcher | `dispatchBatchWebhook()` → `dispatchN8NWebhook()` em `_shared/n8nService.ts` |
| Condicao | Apenas se o job foi criado com `notifyOnComplete: true` (toggle na UI) |

### Eventos especificos capturados

| Evento | Quando |
|--------|--------|
| `batch.completed` | Todos os contatos do lote foram processados |
| `batch.paused` | Taxa de erro ultrapassou 20% — lote pausado automaticamente |

---

## Payload

```json
{
  "event": "batch.completed",
  "timestamp": "2026-03-03T14:30:00.000Z",
  "source": "enp_hub_supabase",
  "job_id": "uuid-do-job",
  "job_name": "Lote 03/03/2026",
  "flow_id": "uuid-do-fluxo",
  "flow_name": "Relatório Pronto — Drip",
  "status": "completed",
  "total_contacts": 30,
  "contacts_sent": 28,
  "contacts_failed": 1,
  "contacts_skipped": 1,
  "error_rate": 3.3,
  "started_at": "2026-03-03T09:00:00.000Z",
  "completed_at": "2026-03-03T11:23:00.000Z",
  "auto_paused_reason": null
}
```

### Payload de lote pausado (erro)

```json
{
  "event": "batch.paused",
  "status": "paused",
  "error_rate": 25.0,
  "contacts_sent": 15,
  "contacts_failed": 5,
  "auto_paused_reason": "Error rate 25.0% exceeds 20% threshold",
  ...
}
```

### Schema dos campos

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `event` | string | `batch.completed` ou `batch.paused` |
| `timestamp` | ISO 8601 | Momento do disparo |
| `source` | string | Sempre `"enp_hub_supabase"` |
| `job_id` | UUID | ID do lote em `whatsapp_batch_jobs` |
| `job_name` | string | Nome do lote (definido pelo admin) |
| `flow_id` | UUID | ID do fluxo WhatsApp associado |
| `flow_name` | string | Nome de exibicao do fluxo |
| `status` | string | `completed`, `paused` |
| `total_contacts` | integer | Total de contatos no lote |
| `contacts_sent` | integer | Enviados com sucesso |
| `contacts_failed` | integer | Falhas de envio |
| `contacts_skipped` | integer | Pulados (opt-out, sessao ativa, etc.) |
| `error_rate` | float | Taxa de erro em % |
| `started_at` | ISO 8601 / null | Quando o processamento iniciou |
| `completed_at` | ISO 8601 | Quando o lote finalizou |
| `auto_paused_reason` | string / null | Motivo da pausa automatica |

---

## Fluxo N8N

```
Webhook (/webhook/batch-dispatch)
    |
    v
Code Node (Preparar Notificacao)
    |--- telegram_text, email_subject, email_html, is_error
    |
    v
IF Node (is_error?)
    |--- false → Telegram (resumo normal)
    |--- true  → Telegram urgente + Email alerta
```

### Detalhamento dos nos

1. **Webhook Node** (`/webhook/batch-dispatch`)
   - Metodo: POST
   - Recebe payload enriquecido com `event`, `timestamp`, `source`
   - Os dados ficam em `$json.body`

2. **Code Node — Preparar Notificacao**
   - Extrai `$json.body` e calcula emoji, status labels, formatacao pt-BR
   - Retorna `telegram_text`, `email_subject`, `email_html`, `is_error`

3. **IF Node — E erro?**
   - Condicao: `{{ $json.is_error }}` equals `true`
   - true → Telegram urgente + Email
   - false → Telegram normal (resumo simples)

4. **Telegram Node — Resumo Normal**
   - Chat ID: grupo de operacoes do admin
   - Texto: `{{ $json.telegram_text }}`
   - Parse mode: Markdown

5. **Telegram Node — Urgente** _(saida true do IF)_
   - Chat ID: canal de alertas criticos (pode ser o mesmo)
   - Prefixo `🚨 ACAO NECESSARIA`

6. **Email Node** _(saida true do IF)_
   - Para: email do admin
   - Assunto: `{{ $json.email_subject }}`
   - HTML: `{{ $json.email_html }}`

---

## Code Node — JS

```javascript
const payload = $input.first().json.body;

const status = payload.status;
const isError = status === 'paused' || (payload.error_rate ?? 0) > 10;
const emoji = status === 'completed' ? '✅' : status === 'paused' ? '⚠️' : '❌';

const sent    = payload.contacts_sent     ?? 0;
const failed  = payload.contacts_failed   ?? 0;
const skipped = payload.contacts_skipped  ?? 0;
const total   = payload.total_contacts    ?? 0;
const errorRate = payload.error_rate != null
  ? `${Number(payload.error_rate).toFixed(1)}%`
  : '0%';

const fmt = (iso) => iso
  ? new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  : '—';

const tgText = [
  `${emoji} *Lote WhatsApp: ${payload.job_name || 'Sem nome'}*`,
  ``,
  `📋 Fluxo: ${payload.flow_name || '—'}`,
  `📊 Status: *${(status || '').toUpperCase()}*`,
  ``,
  `👥 Total: ${total}`,
  `✅ Enviados: ${sent}`,
  `❌ Falhas: ${failed}`,
  `⏭️ Pulados: ${skipped}`,
  `📉 Taxa de erro: ${errorRate}`,
  ``,
  `🕐 Início: ${fmt(payload.started_at)}`,
  `🏁 Fim: ${fmt(payload.completed_at)}`,
  payload.auto_paused_reason
    ? `\n⚠️ Motivo da pausa: ${payload.auto_paused_reason}`
    : '',
].filter(Boolean).join('\n');

const statusColor = isError ? '#d97706' : '#16a34a';
const emailSubject = `${emoji} Lote WhatsApp "${payload.job_name}" — ${status}`;
const emailHtml = `
<div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto">
  <h2 style="color:${statusColor}">${emoji} ${payload.job_name || 'Lote WhatsApp'}</h2>
  <p><strong>Fluxo:</strong> ${payload.flow_name || '—'}</p>
  <p><strong>Status:</strong> <span style="color:${statusColor};font-weight:bold">${(status || '').toUpperCase()}</span></p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr style="background:#f3f4f6"><td style="padding:8px;border:1px solid #e5e7eb">Total</td><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold">${total}</td></tr>
    <tr><td style="padding:8px;border:1px solid #e5e7eb">✅ Enviados</td><td style="padding:8px;border:1px solid #e5e7eb;color:#16a34a">${sent}</td></tr>
    <tr><td style="padding:8px;border:1px solid #e5e7eb">❌ Falhas</td><td style="padding:8px;border:1px solid #e5e7eb;color:#dc2626">${failed}</td></tr>
    <tr><td style="padding:8px;border:1px solid #e5e7eb">⏭️ Pulados</td><td style="padding:8px;border:1px solid #e5e7eb">${skipped}</td></tr>
    <tr style="background:#f3f4f6"><td style="padding:8px;border:1px solid #e5e7eb">Taxa de erro</td><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold">${errorRate}</td></tr>
  </table>
  <p style="font-size:13px;color:#6b7280">Início: ${fmt(payload.started_at)} · Fim: ${fmt(payload.completed_at)}</p>
  ${payload.auto_paused_reason ? `<p style="background:#fef3c7;padding:8px 12px;border-radius:8px;font-size:13px">⚠️ ${payload.auto_paused_reason}</p>` : ''}
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
    job_id: payload.job_id,
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
WHERE name = 'batch_dispatch_notification';
```

Para ativar via UI: `/admin/automacoes` → card "Notificacao de Lote WhatsApp" → configurar webhook URL → ativar toggle.

### Webhook URL sugerida

```
https://n8n.euanapratica.com/webhook/batch-dispatch
```

### Credenciais necessarias

| Credencial | Tipo | Uso |
|------------|------|-----|
| Telegram Bot | Telegram API | Alertas de lote |
| SMTP ou Resend | Email | Alertas de erro (opcional) |

### Variaveis de workflow sugeridas

| Variavel | Valor | Descricao |
|----------|-------|-----------|
| `TELEGRAM_CHAT_ID` | `-100xxxxxxxxxx` | Grupo de operacoes do admin |
| `ADMIN_EMAIL` | `admin@euanapratica.com` | Email para alertas de erro |

---

## Onde o webhook e disparado no codigo

### `supabase/functions/_shared/batchDispatchService.ts`

- **`markJobCompleted()`** (linha ~586): chama `dispatchBatchWebhook(supabase, jobId, "batch.completed")`
- **Auto-pause** (linha ~504): quando `errorRate > 20`, chama `dispatchBatchWebhook(supabase, job.id, "batch.paused")`
- **`dispatchBatchWebhook()`** (linha ~615): verifica `job.metadata.notify_on_complete` antes de disparar

### Como habilitar por lote

O toggle "Notificar ao concluir" no `BatchDispatchDialog.tsx` (Passo 2) define `notifyOnComplete: true`.
Isso e armazenado em `whatsapp_batch_jobs.metadata.notify_on_complete = true`.

---

## Troubleshooting

### Webhook nao chega ao N8N

1. Verificar se a automacao esta habilitada e com URL configurada:
   ```sql
   SELECT name, enabled, webhook_url, last_triggered_at, last_status
   FROM n8n_automations
   WHERE name = 'batch_dispatch_notification';
   ```

2. Verificar logs de dispatch:
   ```sql
   SELECT trigger_event, status, response_status, error_message, created_at
   FROM n8n_webhook_logs
   WHERE trigger_event LIKE 'batch%'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. Verificar se o lote foi criado com `notify_on_complete`:
   ```sql
   SELECT id, name, status, metadata
   FROM whatsapp_batch_jobs
   ORDER BY created_at DESC
   LIMIT 5;
   -- metadata deve conter {"notify_on_complete": true}
   ```

### Nenhum webhook disparado mesmo com toggle ativado

- Confirmar que a Edge Function `process-whatsapp-batch` foi redeploy apos implementacao do `dispatchBatchWebhook()`
- Verificar logs da Edge Function:
  ```bash
  npx supabase functions logs process-whatsapp-batch --project-ref seqgnxynrcylxsdzbloa
  ```

### Taxa de erro calculada incorretamente

- `error_rate` e calculado como `(contacts_failed / contacts_sent_or_failed) * 100`
- Contatos `skipped` nao entram no calculo (sao esperados — opt-out, sessao ativa)
- O limiar de auto-pause e 20% — configuravel no codigo em `batchDispatchService.ts`
