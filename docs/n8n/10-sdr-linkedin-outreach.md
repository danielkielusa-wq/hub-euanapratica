# 10 - SDR LinkedIn Outreach

## Visao Geral

O AI SDR dispara mensagens de LinkedIn via N8N. Como LinkedIn nao tem API pública para DMs, este workflow notifica o admin via Telegram com a mensagem pronta para copiar e enviar manualmente.

Futuramente pode integrar com Phantombuster ou Linked Helper para automacao completa.

```
Edge Function (sdr-execute-outreach)
    |
    v
dispatchN8NWebhook("sdr.send_linkedin", payload)
    |
    v
N8N: Webhook → Format Data → Telegram (acao manual)
```

## Trigger Event

- **Event**: `sdr.send_linkedin`
- **Source**: `sdr-execute-outreach` (modo cron ou manual)

## Payload Recebido

```json
{
  "event": "sdr.send_linkedin",
  "timestamp": "2026-03-03T12:00:00Z",
  "source": "enp_hub_supabase",
  "linkedin_url": "https://linkedin.com/in/maria-silva",
  "message": "Oi Maria! Vi que voce...",
  "prospect_id": "uuid-do-prospect",
  "prospect_name": "Maria Silva"
}
```

## Workflow N8N

**Arquivo**: `n8n-workflows/sdr-linkedin-outreach.json`

### Nodes

1. **Webhook SDR LinkedIn** - Recebe payload
2. **Format LinkedIn Data** - Extrai slug do perfil, trunca mensagem (300 chars max)
3. **Has LinkedIn Profile?** - Valida se URL eh valida
4. **Telegram - Manual Action Required** - Envia mensagem formatada pro admin copiar
5. **Telegram - Invalid URL** - Avisa se URL invalida

### Fluxo de Uso (Manual)

1. SDR gera mensagem personalizada via AI
2. N8N notifica no Telegram:
   ```
   🔗 SDR LinkedIn - Acao Manual Necessaria

   👤 Maria Silva
   🔗 https://linkedin.com/in/maria-silva

   💬 Mensagem sugerida:
   Oi Maria! Vi que voce trabalha com...

   ⚡ Copie a mensagem e envie manualmente no LinkedIn
   ```
3. Admin abre LinkedIn, envia connection request com a mensagem

## Setup no N8N

### 1. Importar Workflow

1. N8N → Workflows → Import from File
2. Selecionar `sdr-linkedin-outreach.json`

### 2. Configurar Telegram

Os nodes de Telegram usam variaveis de ambiente:
- `TELEGRAM_BOT_TOKEN` - Token do bot
- `TELEGRAM_CHAT_ID` - Chat ID do admin

### 3. Registrar Webhook

```sql
INSERT INTO n8n_automations (name, trigger_event, webhook_url, enabled)
VALUES (
  'sdr_linkedin_outreach',
  'sdr.send_linkedin',
  'https://n8n.euanapratica.com/webhook/sdr-send-linkedin',
  true
);
```

## Futura Automacao com Phantombuster

Se quiser automatizar LinkedIn completamente:

1. Criar conta Phantombuster (~$56/mes)
2. Configurar Phantom: "LinkedIn Profile Connector"
3. Substituir node "Telegram" por HTTP Request:

```
POST https://api.phantombuster.com/api/v2/agents/launch
{
  "id": "SEU_PHANTOM_ID",
  "argument": {
    "sessionCookie": "SEU_LI_SESSION_COOKIE",
    "profileUrl": "{{ $json.linkedin_url }}",
    "message": "{{ $json.message }}"
  }
}
```

**Riscos**: LinkedIn pode bloquear a conta se enviar muitas connection requests. Limitar a 20-30/dia.
