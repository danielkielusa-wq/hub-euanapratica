# WhatsApp Integration — Documentação Técnica (Dev)

> **Audiência:** Desenvolvedores
> **Última atualização:** Fevereiro 2026

---

## Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│  ENVIO                                                      │
│  Admin UI → send-whatsapp (Edge Function) → Evolution API  │
│                                          → WhatsApp do lead │
├─────────────────────────────────────────────────────────────┤
│  RECEBIMENTO                                                │
│  WhatsApp → Evolution API → Webhook                        │
│           → receive-whatsapp-webhook (Edge Function)        │
│           → lead_interactions (inbound) + whatsapp_logs     │
├─────────────────────────────────────────────────────────────┤
│  STATUS DE ENTREGA                                          │
│  WhatsApp → Evolution API → Webhook (messages.update)       │
│           → receive-whatsapp-webhook                        │
│           → whatsapp_logs.status (sent/delivered/read)      │
├─────────────────────────────────────────────────────────────┤
│  SUGESTÃO POR IA                                            │
│  Admin UI → suggest-whatsapp-messages (Edge Function)       │
│           → LLM (OpenAI/Anthropic) → sugestões              │
└─────────────────────────────────────────────────────────────┘
```

---

## Infraestrutura VPS (Evolution API v2)

### Localização

- **Provider**: Hostinger
- **Compose file**: `/opt/evolution-api-src/docker-compose.yml`
- **URL pública**: `https://wa.euanapratica.com` (reverso via Caddy)
- **Instância**: `enp_hub`

### Serviços no Docker Compose

```yaml
services:
  evolution-api:   # API principal (porta 8080)
  postgres:        # Banco de dados do Evolution API
  caddy:           # Reverse proxy + TLS automático
```

### Variáveis de ambiente críticas

```
SERVER_URL=https://wa.euanapratica.com
AUTHENTICATION_API_KEY=<chave forte>
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_URL=https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/receive-whatsapp-webhook
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false   ← OBRIGATÓRIO false (ver gotcha abaixo)
WEBHOOK_EVENTS_MESSAGES_UPSERT=true
WEBHOOK_EVENTS_MESSAGES_UPDATE=true
WEBHOOK_EVENTS_CONNECTION_UPDATE=true
WEBHOOK_EVENTS_QRCODE_UPDATED=true
```

### Comandos de operação no VPS

```bash
ssh root@<IP_VPS>
cd /opt/evolution-api-src

# Ver status dos containers
docker compose ps

# Logs em tempo real
docker compose logs -f evolution-api

# Aplicar mudança no docker-compose.yml (restart NÃO funciona para env vars)
docker compose down && docker compose up -d

# Editar variável de ambiente
nano docker-compose.yml
# ou
sed -i 's/VARIAVEL=antiga/VARIAVEL=nova/g' docker-compose.yml
```

---

## Banco de Dados

### Tabelas

#### `whatsapp_logs`
Log completo de todas as mensagens, inbound e outbound:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `lead_id` | UUID | FK → `career_evaluations` (pode ser null para números desconhecidos) |
| `interaction_id` | UUID | FK → `lead_interactions` (pode ser null) |
| `direction` | TEXT | `outbound` ou `inbound` |
| `phone` | TEXT | Número normalizado |
| `message_text` | TEXT | Conteúdo da mensagem |
| `template_name` | TEXT | Nome do template usado (se aplicável) |
| `evolution_message_id` | TEXT | ID da mensagem no Evolution API (para tracking de status) |
| `status` | TEXT | `pending` / `sent` / `delivered` / `read` / `failed` / `received` |
| `error_message` | TEXT | Erro, se houver |
| `metadata` | JSONB | Dados extras (raw_event, used_fallback, etc.) |

Índices: `lead_id`, `phone`, `evolution_message_id`, `created_at DESC`

#### `whatsapp_templates`
Templates de mensagem gerenciados pelo admin:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `name` | TEXT UNIQUE | Slug interno (ex: `lead_welcome`) |
| `display_name` | TEXT | Nome exibido no UI |
| `body` | TEXT | Texto com variáveis `{{variavel}}` |
| `variables` | JSONB | Array de variáveis disponíveis |
| `category` | TEXT | Agrupamento (lead, followup, etc.) |
| `enabled` | BOOLEAN | Ativo/inativo |

#### `lead_interactions` (colunas relevantes)
| Coluna | Valor para WhatsApp |
|--------|-------------------|
| `type` | `whatsapp_sent` ou `whatsapp_received` |
| `channel` | `whatsapp` |
| `direction` | `outbound` ou `inbound` |
| `content` | Texto da mensagem |
| `metadata.delivery_status` | `sent` / `delivered` / `read` |
| `metadata.evolution_message_id` | ID do Evolution API |

#### `app_configs` (chaves WhatsApp)
| Chave | Descrição |
|-------|-----------|
| `whatsapp_enabled` | Feature flag (`true`/`false`) |
| `whatsapp_connection_state` | Estado atual (`open`, `connecting`, `close`) — atualizado pelo webhook |
| `whatsapp_qr_code` | QR code base64 quando desconectado |
| `whatsapp_default_country_code` | Código de país padrão (`55`) |

---

## Edge Functions

### `send-whatsapp`

**Auth**: `requireAdmin`
**Input**: `{ lead_id, message?, template_name?, variables? }`

Fluxo:
1. Busca o lead em `career_evaluations` → obtém telefone
2. Normaliza o telefone via `normalizePhone()`
3. Se `template_name`: busca template, substitui variáveis
4. Chama Evolution API: `POST /message/sendText/{instance}`
5. Insere em `lead_interactions` (type: `whatsapp_sent`, channel: `whatsapp`)
6. Loga em `whatsapp_logs`

### `receive-whatsapp-webhook`

**Auth**: nenhum (`verify_jwt = false`) — webhook externo
**Eventos tratados**:

| Evento | Ação |
|--------|------|
| `messages.upsert` (fromMe=false) | Extrai telefone do `remoteJid`, busca lead, insere `lead_interactions` (type: `whatsapp_received`) + `whatsapp_logs` |
| `messages.upsert` (fromMe=true) | Ignorado (já logado pelo `send-whatsapp`) |
| `messages.upsert` (grupo `@g.us`) | Ignorado |
| `messages.update` | Atualiza `whatsapp_logs.status` e `lead_interactions.metadata.delivery_status` pelo `evolution_message_id` |
| `connection.update` | Grava estado em `app_configs.whatsapp_connection_state` |
| `qrcode.updated` | Grava QR base64 em `app_configs.whatsapp_qr_code` |

### `check-whatsapp-status`

**Auth**: `requireAdmin`
**Output**: `{ connected: bool, state: string, qrCode?: string }`

### `suggest-whatsapp-messages`

**Auth**: `requireAdmin`
**Input**: `{ lead_id }`
**Output**: `{ suggestions: [{ message, intent, tone, reasoning }] }`

Fluxo:
1. Busca perfil completo do lead (`career_evaluations`)
2. Busca interações dos últimos 60 dias
3. Monta contexto JSON com perfil + histórico WhatsApp
4. Chama LLM via `callLLM()` com prompt do sistema
5. Parseia JSON da resposta → retorna 2–4 sugestões

O prompt é personalizável em `app_configs.suggest_whatsapp_prompt`.

---

## `_shared/whatsappService.ts`

Utilitários compartilhados entre as Edge Functions.

### `normalizePhone(raw, defaultCountryCode='55')`

Normaliza qualquer formato de telefone para dígitos puros:
- `"+5511999999999"` → `"5511999999999"`
- `"(11) 99999-9999"` → `"5511999999999"`
- `"11999999999"` → `"5511999999999"`

### `findLeadByPhone(supabase, phone)`

Busca lead em `career_evaluations` por telefone:
- Busca os últimos 1000 leads com telefone não-nulo
- Compara os últimos 10 dígitos de ambos os números (tolera variações de código de país)
- Retorna `{ id, name, email, phone }` ou `null`

### `sendWhatsAppMessage({ phone, text, leadId?, templateName? })`

Envia mensagem via Evolution API:
1. Lê config de `api_configs` (key: `evolution_api`)
2. `POST {base_url}/message/sendText/{instance_name}`
3. Header: `apikey: {api_key}`
4. Body: `{ number: phone, text }`
5. Retorna `{ success, messageId?, error? }`

### `logWhatsAppMessage(supabase, log)`

Insere em `whatsapp_logs`. Nunca lança exceção (best-effort).

---

## Configuração do Webhook no Evolution API

O webhook deve ser configurado via API — **não** via variável de ambiente do docker-compose (o env var configura o webhook global, mas a config por instância sobrescreve):

```bash
curl -X PUT https://wa.euanapratica.com/webhook/set/enp_hub \
  -H "apikey: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "enabled": true,
      "url": "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/receive-whatsapp-webhook",
      "webhookByEvents": false,
      "webhookBase64": false,
      "events": ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE", "QRCODE_UPDATED"]
    }
  }'

# Verificar configuração atual
curl https://wa.euanapratica.com/webhook/find/enp_hub \
  -H "apikey: <API_KEY>"
```

---

## `supabase/config.toml`

```toml
[functions.receive-whatsapp-webhook]
verify_jwt = false   # webhook externo — sem JWT

[functions.check-whatsapp-status]
verify_jwt = false   # usa requireAdmin internamente

[functions.send-whatsapp]
verify_jwt = false   # usa requireAdmin internamente

[functions.suggest-whatsapp-messages]
verify_jwt = false   # usa requireAdmin internamente
```

---

## Deploy

```bash
cd "c:\Users\I335869\ENP_HUB\hub-euanapratica"

npx supabase functions deploy \
  send-whatsapp \
  receive-whatsapp-webhook \
  check-whatsapp-status \
  suggest-whatsapp-messages \
  --no-verify-jwt
```

---

## Gotchas Críticos

### `WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true` quebra tudo
Quando `true`, o Evolution API **adiciona o nome do evento ao final da URL**:
```
/receive-whatsapp-webhook/messages-upsert   ← 401
/receive-whatsapp-webhook/messages-update   ← 401
```
O `verify_jwt = false` do Supabase só se aplica ao path exato da função, não a sub-paths. Resultado: **todos os webhooks retornam 401**.

**Solução**: manter `WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false` (ou `webhookByEvents: false` na config da instância).

### `docker compose restart` não aplica mudanças de env vars
Apenas reinicia o container sem reler o `docker-compose.yml`. Para aplicar mudanças de variáveis de ambiente:
```bash
docker compose down && docker compose up -d
```

### Webhook secret não funciona com Evolution API global
O Evolution API v2 global webhook **não suporta headers customizados**. O header `x-webhook-secret` nunca é enviado. A validação foi removida da função — segurança fica a cargo do `verify_jwt=false` + infraestrutura Supabase.

### Gateway 401 vs função 401
- `{"code": 401}` em ~50ms → gateway do Supabase bloqueou (falta `verify_jwt = false`)
- `{"error": "Unauthorized"}` em ~200ms → função rodou e rejeitou (auth da função)

---

## Diagrama de Fluxo Detalhado: Mensagem Recebida

```
Lead envia mensagem no WhatsApp
          ↓
Evolution API detecta (evento MESSAGES_UPSERT)
          ↓
POST para receive-whatsapp-webhook
  payload: { event: "messages.upsert", data: { key: { remoteJid, fromMe, id }, message: {...}, messageTimestamp } }
          ↓
Extrai senderPhone de remoteJid ("5511999999999@s.whatsapp.net" → "5511999999999")
          ↓
findLeadByPhone() — busca lead por últimos 10 dígitos
          ↓
  ┌─────────────────────────┬─────────────────────────────┐
  │ Lead encontrado          │ Lead não encontrado          │
  │                         │                             │
  │ INSERT lead_interactions │ INSERT whatsapp_logs        │
  │  type: whatsapp_received │  lead_id: null              │
  │  channel: whatsapp       │  metadata: {unmatched:true} │
  │  direction: inbound      │                             │
  │                         │                             │
  │ INSERT whatsapp_logs     │                             │
  │  interaction_id: <id>    │                             │
  └─────────────────────────┴─────────────────────────────┘
          ↓
Return 200 { received: true }
```

---

## Reconexão do WhatsApp

Se o estado em `app_configs.whatsapp_connection_state` for diferente de `open`:

1. Chamar `check-whatsapp-status` → retorna `qrCode` (base64)
2. Exibir QR no admin UI
3. Usuário escaneia com celular: WhatsApp → Dispositivos → Conectar

Ou diretamente via Evolution API:
```bash
# Ver estado da instância
curl https://wa.euanapratica.com/instance/connectionState/enp_hub \
  -H "apikey: <API_KEY>"

# Gerar novo QR
curl https://wa.euanapratica.com/instance/connect/enp_hub \
  -H "apikey: <API_KEY>"
```
