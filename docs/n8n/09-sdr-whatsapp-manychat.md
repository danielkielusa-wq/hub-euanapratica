# 09 - SDR WhatsApp via ManyChat

## Visao Geral

O AI SDR envia mensagens de WhatsApp para prospects via N8N + ManyChat API.

```
Edge Function (sdr-execute-outreach)
    |
    v
dispatchN8NWebhook("sdr.send_whatsapp", payload)
    |
    v
N8N: Webhook → Normalize Phone → Find/Create Subscriber → Send Message
    |
    v
ManyChat API → WhatsApp Business → Prospect recebe mensagem
```

## Trigger Event

- **Event**: `sdr.send_whatsapp`
- **Source**: `sdr-execute-outreach` (modo cron ou manual)

## Payload Recebido

```json
{
  "event": "sdr.send_whatsapp",
  "timestamp": "2026-03-03T12:00:00Z",
  "source": "enp_hub_supabase",
  "phone": "+5511999887766",
  "message": "Oi Maria! Vi que voce trabalha com...",
  "prospect_id": "uuid-do-prospect",
  "prospect_name": "Maria Silva"
}
```

## Workflow N8N

**Arquivo**: `n8n-workflows/sdr-whatsapp-manychat.json`

### Nodes

1. **Webhook SDR WhatsApp** - Recebe o payload do Supabase
2. **Normalize Phone** - Garante formato `+5511...` para BR
3. **Find Subscriber by Phone** - `GET /fb/subscriber/findBySystemField?field_name=whatsapp_phone&field_value={phone}`
4. **Subscriber Found?** - IF/ELSE no status da resposta
5. **Create Subscriber** (se nao encontrado) - `POST /fb/subscriber/createSubscriber`
6. **Extract Subscriber ID** - Pega o `subscriber_id` de qualquer caminho
7. **Send WhatsApp Message** - `POST /fb/sending/sendContent`
8. **Telegram Notification** - Avisa admin que mensagem foi enviada

### Credenciais Necessarias

**ManyChat API** (HTTP Header Auth):
- Header Name: `Authorization`
- Header Value: `Bearer {SEU_MANYCHAT_API_TOKEN}`

Para obter o token:
1. ManyChat → Settings → API → Generate Token
2. No N8N: Credentials → HTTP Header Auth → Name: "ManyChat API"

## Setup no N8N

### 1. Importar Workflow

1. N8N → Workflows → Import from File
2. Selecionar `sdr-whatsapp-manychat.json`
3. Salvar

### 2. Configurar Credenciais

1. Abrir o node "Find Subscriber by Phone"
2. Em Credentials → HTTP Header Auth → Criar/selecionar "ManyChat API"
3. Header Name: `Authorization`
4. Header Value: `Bearer mc_api_XXXXX` (seu token ManyChat)
5. Repetir para nodes "Create Subscriber" e "Send WhatsApp Message"

### 3. Registrar Webhook no Supabase

Executar no SQL Editor do Supabase:

```sql
INSERT INTO n8n_automations (name, trigger_event, webhook_url, enabled)
VALUES (
  'sdr_whatsapp_manychat',
  'sdr.send_whatsapp',
  'https://n8n.euanapratica.com/webhook/sdr-send-whatsapp',
  true
);
```

### 4. Ativar Workflow

1. N8N → Toggle workflow para Active
2. Copiar a URL do webhook (produção)
3. Atualizar a URL no `n8n_automations` se diferente

## Teste

1. No admin `/admin/sdr`:
   - Criar prospect de teste com phone
   - Qualificar → Gerar Mensagem (template WhatsApp)
   - Clicar "Enviar"
2. Verificar no N8N → Executions se o workflow rodou
3. Verificar se mensagem chegou no WhatsApp do prospect

## Troubleshooting

| Problema | Causa | Solucao |
|----------|-------|---------|
| Subscriber nao encontrado | Phone em formato errado | Verificar node "Normalize Phone" |
| ManyChat retorna 403 | Token invalido ou expirado | Gerar novo token no ManyChat |
| Mensagem nao chega | Subscriber sem opt-in | Verificar `has_opt_in_whatsapp` |
| Webhook nao dispara | Automacao desabilitada | Verificar `n8n_automations.enabled` |
| Timeout | ManyChat lento | Aumentar `timeout_ms` na automacao |

## ManyChat API Reference

### Find Subscriber
```
GET https://api.manychat.com/fb/subscriber/findBySystemField
  ?field_name=whatsapp_phone
  &field_value=+5511999887766
```

### Create Subscriber
```
POST https://api.manychat.com/fb/subscriber/createSubscriber
{
  "phone": "+5511999887766",
  "first_name": "Maria",
  "last_name": "Silva",
  "whatsapp_phone": "+5511999887766",
  "has_opt_in_whatsapp": true
}
```

### Send Content
```
POST https://api.manychat.com/fb/sending/sendContent
{
  "subscriber_id": 12345,
  "data": {
    "version": "v2",
    "content": {
      "messages": [
        { "type": "text", "text": "Mensagem aqui" }
      ]
    }
  }
}
```
