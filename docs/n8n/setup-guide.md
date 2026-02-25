# Guia de Setup — N8N para ENP_HUB

> Ultima atualizacao: 2026-02-25

## Indice

1. [Visao Geral](#visao-geral)
2. [Pre-requisitos](#pre-requisitos)
3. [Instalacao via Docker](#instalacao-via-docker)
4. [Reverse Proxy com Caddy](#reverse-proxy-com-caddy)
5. [Variaveis de Ambiente](#variaveis-de-ambiente)
6. [Configuracao de Credenciais no N8N](#configuracao-de-credenciais-no-n8n)
7. [Configuracao do Telegram Bot](#configuracao-do-telegram-bot)
8. [Importacao de Workflows](#importacao-de-workflows)
9. [Seguranca](#seguranca)
10. [Monitoramento e Manutencao](#monitoramento-e-manutencao)

---

## Visao Geral

O N8N e a camada de automacao do ENP_HUB. Ele recebe webhooks disparados pelas Edge Functions do Supabase (via `dispatchN8NWebhook()`) e orquestra acoes multicanal: alertas no Telegram, envio de WhatsApp, envio de emails e criacao de tarefas no CRM.

```
+------------------+       +------------------+       +------------------+
|  Edge Functions  | ----> |  N8N (Docker)    | ----> |  Telegram Bot    |
|  (Supabase)      |  HTTP |  n8n.euanaprati  |       |  WhatsApp (EvoAPI|
|                  |  POST |  ca.com          |       |  Supabase REST   |
+------------------+       +------------------+       +------------------+
        |                         |
        |   dispatchN8NWebhook()  |   Webhook Trigger
        +-------------------------+
```

**Infraestrutura**: O N8N roda no mesmo VPS Hostinger que ja hospeda a Evolution API (WhatsApp). O docker-compose existente e estendido com o servico do N8N.

---

## Pre-requisitos

- VPS Hostinger com Docker e Docker Compose instalados
- Dominio `n8n.euanapratica.com` apontando para o IP do VPS (registro A no DNS)
- Caddy ou Nginx ja rodando como reverse proxy (para HTTPS automatico)
- Evolution API ja configurada e funcionando
- Acesso SSH ao VPS

---

## Instalacao via Docker

### 1. Conectar ao VPS

```bash
ssh root@<IP_DO_VPS>
```

### 2. Navegar ate o diretorio do docker-compose existente

```bash
cd /opt/enp-hub
# ou onde esta o docker-compose.yml da Evolution API
```

### 3. Adicionar servico N8N ao docker-compose.yml

Adicione o bloco abaixo ao `docker-compose.yml` existente:

```yaml
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=n8n.euanapratica.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.euanapratica.com/
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_BASIC_AUTH_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_BASIC_AUTH_PASSWORD}
      - GENERIC_TIMEZONE=America/Sao_Paulo
      - TZ=America/Sao_Paulo
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=n8n-db
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=${N8N_DB_USER}
      - DB_POSTGRESDB_PASSWORD=${N8N_DB_PASSWORD}
      - N8N_METRICS=true
      - N8N_DIAGNOSTICS_ENABLED=false
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - n8n-db
    networks:
      - enp-network

  n8n-db:
    image: postgres:16-alpine
    container_name: n8n-db
    restart: unless-stopped
    environment:
      - POSTGRES_DB=n8n
      - POSTGRES_USER=${N8N_DB_USER}
      - POSTGRES_PASSWORD=${N8N_DB_PASSWORD}
    volumes:
      - n8n_db_data:/var/lib/postgresql/data
    networks:
      - enp-network

volumes:
  n8n_data:
  n8n_db_data:
```

### 4. Criar arquivo .env (se ainda nao existe)

```bash
cat >> .env << 'EOF'
# N8N
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=<SENHA_FORTE_AQUI>
N8N_ENCRYPTION_KEY=<GERAR_COM_openssl_rand_-hex_32>
N8N_DB_USER=n8n
N8N_DB_PASSWORD=<SENHA_FORTE_AQUI>
EOF
```

Para gerar chaves seguras:

```bash
openssl rand -hex 32   # Para N8N_ENCRYPTION_KEY
openssl rand -base64 24  # Para senhas
```

### 5. Subir os containers

```bash
docker compose up -d n8n-db n8n
```

### 6. Verificar status

```bash
docker compose logs -f n8n --tail=50
```

Aguardar ver a mensagem:
```
Editor is now accessible via:
https://n8n.euanapratica.com/
```

---

## Reverse Proxy com Caddy

Se estiver usando **Caddy** (recomendado — HTTPS automatico):

### Adicionar ao Caddyfile

```
n8n.euanapratica.com {
    reverse_proxy n8n:5678 {
        flush_interval -1
    }
}
```

Se o Caddy roda fora do Docker, use `localhost:5678` ao inves de `n8n:5678`.

### Recarregar Caddy

```bash
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

### Alternativa: Nginx

Se estiver usando Nginx ao inves de Caddy:

```nginx
server {
    listen 443 ssl http2;
    server_name n8n.euanapratica.com;

    ssl_certificate /etc/letsencrypt/live/n8n.euanapratica.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n.euanapratica.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
    }
}
```

---

## Variaveis de Ambiente

### Variaveis do Docker (.env no VPS)

| Variavel | Descricao | Exemplo |
|----------|-----------|---------|
| `N8N_BASIC_AUTH_USER` | Usuario de login no editor | `admin` |
| `N8N_BASIC_AUTH_PASSWORD` | Senha de login no editor | `<senha-forte>` |
| `N8N_ENCRYPTION_KEY` | Chave para criptografar credenciais salvas | `<hex-64-chars>` |
| `N8N_DB_USER` | Usuario do PostgreSQL interno | `n8n` |
| `N8N_DB_PASSWORD` | Senha do PostgreSQL interno | `<senha-forte>` |

### Variaveis que o N8N precisa acessar (via Credentials, nao env)

| Credencial | Onde configurar | Uso |
|------------|----------------|-----|
| `SUPABASE_URL` | N8N Credential "Supabase" | REST API calls |
| `SUPABASE_SERVICE_ROLE_KEY` | N8N Credential "Supabase" | REST API calls (bypass RLS) |
| `INTERNAL_FUNCTION_SECRET` | N8N Credential "Header Auth" | Invocar Edge Functions |
| `TELEGRAM_BOT_TOKEN` | N8N Credential "Telegram" | Alertas admin |
| `TELEGRAM_CHAT_ID` | Variavel de workflow | Canal/grupo de alertas |

---

## Configuracao de Credenciais no N8N

### Credencial 1: Supabase REST API

Usada para consultas diretas ao banco (select, insert, update).

1. No editor N8N, va em **Settings > Credentials > Add Credential**
2. Tipo: **Header Auth**
3. Nome: `Supabase Service Role`
4. Configuracao:
   - Name: `apikey`
   - Value: `<SUPABASE_SERVICE_ROLE_KEY>`
5. Usar em nos HTTP Request com base URL:
   ```
   https://seqgnxynrcylxsdzbloa.supabase.co/rest/v1/
   ```
6. Adicionar header extra nos nos HTTP Request:
   ```
   Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
   ```

### Credencial 2: INTERNAL_FUNCTION_SECRET

Usada para invocar Edge Functions do Supabase (send-whatsapp, send-lead-email, etc.).

1. Tipo: **Header Auth**
2. Nome: `ENP Internal Secret`
3. Configuracao:
   - Name: `x-internal-secret`
   - Value: `<INTERNAL_FUNCTION_SECRET>`
4. Usar em nos HTTP Request que chamam:
   ```
   https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/<nome-da-funcao>
   ```

### Credencial 3: Telegram Bot

Usada para enviar alertas ao grupo de admins.

1. Tipo: **Telegram API**
2. Nome: `ENP Telegram Bot`
3. Bot Token: `<TELEGRAM_BOT_TOKEN>`
4. Chat ID do grupo: configurado diretamente nos nos Telegram

---

## Configuracao do Telegram Bot

### 1. Criar o bot

1. Abrir Telegram e conversar com `@BotFather`
2. Enviar `/newbot`
3. Nome: `ENP Hub Notificacoes`
4. Username: `enp_hub_notify_bot`
5. Copiar o token gerado (formato: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Criar grupo de alertas

1. Criar grupo no Telegram: "ENP Hub - Alertas"
2. Adicionar o bot ao grupo
3. Enviar uma mensagem qualquer no grupo
4. Obter o chat_id:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getUpdates" | jq '.result[-1].message.chat.id'
   ```
5. O chat_id sera negativo (ex: `-1001234567890`)

### 3. Testar envio

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "<CHAT_ID>",
    "text": "Teste de integracao N8N -> Telegram",
    "parse_mode": "HTML"
  }'
```

---

## Importacao de Workflows

### Metodo 1: Via UI do N8N

1. Acessar `https://n8n.euanapratica.com`
2. Clicar em **Workflows > Import from File**
3. Selecionar o arquivo `.json` do workflow
4. Revisar e ativar

### Metodo 2: Via API do N8N

```bash
# Importar workflow via API
curl -X POST "https://n8n.euanapratica.com/api/v1/workflows" \
  -u "admin:<SENHA>" \
  -H "Content-Type: application/json" \
  -d @workflow.json
```

### Metodo 3: Via CLI

```bash
docker exec n8n n8n import:workflow --input=/path/to/workflow.json
```

### Estrutura de arquivos de workflow

Os JSONs de workflow ficam em:

```
docs/n8n/n8n-workflows/
  01-subscription-lifecycle.json
  02-report-ready-notification.json
  02b-report-ready-reply-handler.json
  03-high-value-lead-alert.json
```

### Checklist pos-importacao

Para cada workflow importado:

- [ ] Verificar que as credenciais estao associadas corretamente
- [ ] Configurar as URLs dos webhooks na tabela `n8n_automations` (Supabase)
- [ ] Ativar o workflow (toggle ON no canto superior direito)
- [ ] Fazer um teste manual (disparar evento de teste)
- [ ] Verificar logs em `n8n_webhook_logs` no Supabase

---

## Seguranca

### Autenticacao

- **Editor N8N**: Protegido por Basic Auth (`N8N_BASIC_AUTH_USER` / `N8N_BASIC_AUTH_PASSWORD`)
- **Webhooks recebidos**: Os webhooks do Supabase incluem o campo `source: "enp_hub_supabase"` no payload — use isso para validacao no workflow
- **Chamadas para Edge Functions**: Sempre usar `x-internal-secret` header (nunca expor o `SUPABASE_SERVICE_ROLE_KEY` em webhooks)

### Rede

- A porta 5678 do N8N NAO deve ficar exposta publicamente. Apenas o reverse proxy (Caddy/Nginx) deve acessar
- Configurar firewall (ufw):
  ```bash
  ufw allow 443/tcp   # HTTPS (Caddy/Nginx)
  ufw allow 22/tcp    # SSH
  ufw deny 5678/tcp   # Bloquear acesso direto ao N8N
  ```

### Credenciais

- Todas as credenciais no N8N sao criptografadas com `N8N_ENCRYPTION_KEY`
- NUNCA commitar credenciais em JSONs de workflow exportados
- Ao exportar workflows, remover campos `credentials` antes de commitar

### Atualizacoes

- Manter N8N atualizado (imagem Docker):
  ```bash
  docker compose pull n8n
  docker compose up -d n8n
  ```
- Verificar changelog antes de atualizar: https://docs.n8n.io/release-notes/

---

## Monitoramento e Manutencao

### Health Check

O N8N expoe metricas em `/metrics` quando `N8N_METRICS=true`:

```bash
curl -u admin:<SENHA> https://n8n.euanapratica.com/metrics
```

### Logs

```bash
# Logs em tempo real
docker compose logs -f n8n --tail=100

# Logs do ultimo erro
docker compose logs n8n 2>&1 | grep -i error | tail -20
```

### Tabela de audit: n8n_webhook_logs

Todos os webhooks disparados pelo Supabase sao logados na tabela `n8n_webhook_logs`:

```sql
SELECT
  automation_name,
  trigger_event,
  status,
  duration_ms,
  error_message,
  created_at
FROM n8n_webhook_logs
ORDER BY created_at DESC
LIMIT 20;
```

Status possiveis: `success`, `error`, `timeout`, `skipped`.

### Tabela de automacoes: n8n_automations

Cada webhook registrado aparece em `n8n_automations`:

```sql
SELECT
  name,
  trigger_event,
  webhook_url,
  enabled,
  last_triggered_at,
  last_status
FROM n8n_automations
ORDER BY name;
```

### Backup

```bash
# Backup do volume de dados do N8N
docker run --rm -v n8n_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/n8n_data_backup_$(date +%Y%m%d).tar.gz -C /data .

# Backup do banco PostgreSQL do N8N
docker exec n8n-db pg_dump -U n8n n8n > n8n_db_backup_$(date +%Y%m%d).sql
```

### Restart

```bash
docker compose restart n8n
```

### Atualizacao de imagem

```bash
docker compose pull n8n
docker compose up -d n8n
docker image prune -f  # Limpar imagens antigas
```

---

## Referencia Rapida

### Arquitetura de Eventos

```
Origem                           Evento                    Workflow N8N
-------------------------------  ------------------------  --------------------------
ticto-webhook                 -> subscription.activated  -> 01-subscription-lifecycle
ticto-webhook                 -> subscription.cancelled  -> 01-subscription-lifecycle
ticto-webhook                 -> subscription.dunning    -> 01-subscription-lifecycle
cancel-subscription           -> subscription.cancelled  -> 01-subscription-lifecycle
trg_report_completed (trigger)-> report.generated        -> 02-report-ready-notification
trg_report_completed (trigger)-> report.generated        -> 03-high-value-lead-alert
trg_report_completed (trigger)-> report.generated        -> 04-drip-campaign
trg_report_completed (trigger)-> report.generated        -> 05-lead-scoring-routing
receive-whatsapp              -> whatsapp.inbound        -> 02b-reply-handler
```

**Nota sobre `report.generated`**: O evento eh disparado por um trigger PostgreSQL
(`trg_report_completed`) que detecta quando `career_evaluations.processing_status`
muda para `'completed'` (tanto INSERT quanto UPDATE). O trigger chama a Edge Function
`dispatch-report-webhook` via `pg_net`, que le o relatorio e dispara o webhook.
Isso garante que o webhook dispara independente de qual processo gerou o relatorio.

### URLs Importantes

| Recurso | URL |
|---------|-----|
| N8N Editor | `https://n8n.euanapratica.com` |
| Supabase Dashboard | `https://supabase.com/dashboard/project/seqgnxynrcylxsdzbloa` |
| Hub Producao | `https://hub.euanapratica.com` |
| Evolution API | `https://evo.euanapratica.com` (ou o dominio configurado) |

### Registro de Automacao no Supabase

Para que o `dispatchN8NWebhook()` envie eventos ao N8N, cada workflow precisa estar registrado na tabela `n8n_automations`:

```sql
INSERT INTO n8n_automations (name, trigger_event, webhook_url, enabled, webhook_method, timeout_ms, max_retries)
VALUES
  ('Subscription Lifecycle', 'subscription.*', 'https://n8n.euanapratica.com/webhook/sub-lifecycle', true, 'POST', 10000, 2),
  ('Report Ready Notification', 'report.generated', 'https://n8n.euanapratica.com/webhook/report-ready', true, 'POST', 10000, 2),
  ('Report Reply Handler', 'whatsapp.inbound', 'https://n8n.euanapratica.com/webhook/whatsapp-reply', true, 'POST', 10000, 2),
  ('High-Value Lead Alert', 'report.generated', 'https://n8n.euanapratica.com/webhook/hot-lead', true, 'POST', 10000, 2);
```
