# ⚡ n8n Quick Start - Hostinger Edition (5 Minutos)

> **Para n8n hospedado no Hostinger (ou qualquer hosting remoto)**
> Usa Supabase Edge Function em vez de comandos locais

---

## 🎯 Visão Geral

Como seu n8n está no **Hostinger** (não local), ele **não pode acessar** seu computador (`c:\Users\...`).

**Solução:** Usar a **Supabase Edge Function** que já existe no projeto!

```
┌─────────────────┐
│  n8n (Hostinger)│
└────────┬────────┘
         │ HTTP GET
         ▼
┌─────────────────────────────────────────┐
│  Supabase Edge Function                 │
│  /functions/v1/health-check             │
│  ✅ Já existe no projeto!                │
└────────┬────────────────────────────────┘
         │ Retorna JSON
         ▼
┌─────────────────┐
│  n8n processa   │
│  Envia Slack    │
└─────────────────┘
```

---

## 📥 Passo 1: Deploy da Edge Function (2min)

### 1.1. Verificar se já está deployed

```bash
cd c:\Users\I335869\ENP_HUB\hub-euanapratica

# Verificar funções deployed
npx supabase functions list
```

### 1.2. Se NÃO estiver deployed, fazer deploy:

```bash
# Deploy da função health-check
npx supabase functions deploy health-check

# Saída esperada:
# ✅ Deployed Function health-check
# URL: https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/health-check
```

### 1.3. Testar a função

```bash
# Obter URL e chave (do .env)
# VITE_SUPABASE_URL=https://seqgnxynrcylxsdzbloa.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbG...

# Testar via curl (Windows PowerShell)
curl.exe -X GET "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/health-check" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcWdueHlucmN5bHhzZHpibG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTI1NTksImV4cCI6MjA4NTUyODU1OX0.YJGbf2Ja79mshCRG5I6lEhOvmstaeuZqJQVrTi9jdmg" -H "Content-Type: application/json"
```

**Resposta esperada:**
```json
{
  "timestamp": "2026-02-20T10:00:00.000Z",
  "environment": "production",
  "total_checks": 9,
  "passed": 9,
  "warned": 0,
  "failed": 0,
  "total_duration_ms": 1234,
  "status": "healthy",
  "checks": [...]
}
```

✅ Edge Function funcionando!

---

## 🔧 Passo 2: Configurar n8n Workflow (3min)

### 2.1. Criar Novo Workflow

1. Acesse seu n8n no Hostinger
2. **Workflows** → **Add workflow**
3. Nome: `ENP Hub - Health Checks Diários`

### 2.2. Adicionar Nós (6 nós no total)

#### **Nó 1: Schedule Trigger**

- **Node Type:** `Schedule Trigger`
- **Trigger Interval:** `Days` → `Every 1 days`
- **Trigger at Hour:** `9` (9h da manhã)
- **Trigger at Minute:** `0`

**OU use Cron:**
- **Mode:** `Cron`
- **Cron Expression:** `0 9 * * *`

---

#### **Nó 2: HTTP Request** (Substituí o Execute Command)

**⭐ IMPORTANTE: Este é o nó que chama a Edge Function**

- **Node Type:** `HTTP Request`
- **Method:** `GET`
- **URL:**
  ```
  https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/health-check
  ```
  *(Substitua pela sua URL do Supabase)*

- **Authentication:** `Generic Credential Type` → `Header Auth`
  - **Name:** `Authorization`
  - **Value:** `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
    *(Sua SUPABASE_ANON_KEY do .env)*

**OU sem autenticação (se a função for pública):**
- **Authentication:** `None`
- **Headers:**
  - Add `Authorization`: `Bearer YOUR_ANON_KEY`
  - Add `apikey`: `YOUR_ANON_KEY`

**Opções:**
- **Response Format:** `JSON`
- **Timeout:** `30000` (30 segundos)

**Teste rápido:**
- Clique **Execute Node**
- Deve retornar JSON com `status`, `passed`, `failed`, `checks`

---

#### **Nó 3: IF Node** (Decisão: Notificar?)

- **Node Type:** `IF`
- **Conditions:**
  - **Condition 1:**
    - `{{ $json.failed }}` **is greater than** `0`
  - **OR Condition 2:**
    - `{{ $json.warned }}` **is greater than** `0`

**Branch:**
- **True:** Conectar ao Slack Alert
- **False:** Conectar ao Log Success (opcional)

---

#### **Nó 4a: Slack Alert** (Notificação)

- **Node Type:** `Slack`
- **Resource:** `Message`
- **Operation:** `Post`
- **Authentication:** `Webhook`
- **Webhook URL:**
  ```
  https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
  ```
  *(Criar em https://api.slack.com/apps)*

- **Channel:** `#health-checks` (ou deixe em branco)
- **Text:**

```
🚨 *ENP Hub Health Check - {{ $json.status.toUpperCase() }}*

📊 *Resumo:*
• Status: {{ $json.status }}
• Passed: {{ $json.passed }}/{{ $json.total_checks }}
• Failed: {{ $json.failed }}
• Warned: {{ $json.warned }}
• Duration: {{ $json.total_duration_ms }}ms

{{ $json.failed > 0 ? '❌ *FALHAS:*' : '' }}
{{ $json.checks.filter(c => c.status === 'fail').map(c => '• ' + c.name + ': ' + (c.error || 'Unknown')).join('\n') }}

{{ $json.warned > 0 ? '⚠️ *WARNINGS:*' : '' }}
{{ $json.checks.filter(c => c.status === 'warn').map(c => '• ' + c.name + ': ' + (c.error || 'Warning')).join('\n') }}

🕐 {{ $json.timestamp }}
🌍 {{ $json.environment }}
```

---

#### **Nó 4b: Email Alert** (Opcional)

- **Node Type:** `Email Send` (ou `Gmail`)
- **To:** `admin@seudominio.com`
- **Subject:** `ENP Hub Health - {{ $json.status }}`
- **Message:**

```html
<h2>Health Check Report</h2>
<p><strong>Status:</strong> {{ $json.status }}</p>
<p><strong>Passed:</strong> {{ $json.passed }}/{{ $json.total_checks }}</p>
<p><strong>Failed:</strong> {{ $json.failed }}</p>

<h3>Checks:</h3>
<ul>
{{ $json.checks.map(c => '<li>' + (c.status === 'pass' ? '✅' : '❌') + ' ' + c.name + ' (' + c.duration + 'ms)</li>').join('') }}
</ul>
```

---

#### **Nó 5: Log Success** (Branch False - Opcional)

- **Node Type:** `No Operation, do nothing`
- **OU** adicione outro Slack node para confirmar sucesso (menos spam)

---

### 2.3. Conectar os Nós

```
Schedule → HTTP Request → IF Node
                            ├─ TRUE → Slack Alert
                            │         Email Alert (opcional)
                            └─ FALSE → Log Success
```

---

## 💬 Passo 3: Configurar Slack Webhook (2min)

### 3.1. Criar Webhook

1. Acesse: https://api.slack.com/apps
2. **Create New App** → **From scratch**
3. Nome: `ENP Hub Health`
4. Workspace: Selecione seu workspace
5. **Incoming Webhooks** → Toggle **ON**
6. **Add New Webhook to Workspace**
7. Escolha canal: `#health-checks`
8. **Copie a URL:**
   ```
   https://hooks.slack.com/services/T.../B.../xxx
   ```

### 3.2. Adicionar no n8n

1. No nó Slack, cole a URL
2. **Save**

---

## ✅ Passo 4: Testar e Ativar (1min)

### Teste Manual

1. Clique em **Execute Workflow** (botão superior direito)
2. Acompanhe os nós executando
3. Verifique se mensagem apareceu no Slack

### Ativar Automação

1. **Save** workflow
2. Toggle **Active** → **ON**
3. ✅ Pronto! Roda automaticamente às 9h diariamente

---

## 🎯 Diferenças da Versão Local

| Item | Versão Local | Versão Hostinger (Esta) |
|------|--------------|-------------------------|
| **n8n localização** | `localhost:5678` | Hostinger (remoto) |
| **Nó para executar checks** | Execute Command (bash) | HTTP Request (API call) |
| **Acesso ao filesystem** | ✅ Sim | ❌ Não |
| **Endpoint usado** | `npm run health:json` | Supabase Edge Function |
| **Deploy necessário** | ❌ Não | ✅ Sim (supabase functions deploy) |
| **Latência** | ~500ms | ~1500ms (rede) |
| **Complexidade** | Média | **Simples** ⭐ |

---

## 🔐 Segurança

### Proteger Edge Function (Opcional)

Se quiser que APENAS n8n acesse a função:

1. Criar secret no Supabase:
   ```bash
   npx supabase secrets set HEALTH_CHECK_SECRET=seu_token_aleatorio_aqui
   ```

2. Modificar `supabase/functions/health-check/index.ts`:
   ```typescript
   // Após Deno.serve, adicionar:
   const authHeader = req.headers.get("x-health-secret");
   const expectedSecret = Deno.env.get("HEALTH_CHECK_SECRET");

   if (authHeader !== expectedSecret) {
     return new Response("Unauthorized", { status: 401 });
   }
   ```

3. No n8n HTTP Request, adicionar header:
   - **Name:** `x-health-secret`
   - **Value:** `seu_token_aleatorio_aqui`

---

## 🐛 Troubleshooting

### ❌ "404 Not Found" ao chamar edge function

**Causa:** Função não deployed ou URL incorreta

**Solução:**
```bash
# Re-deploy
npx supabase functions deploy health-check

# Verificar URL
npx supabase functions list
```

---

### ❌ "Unauthorized" ou 401

**Causa:** Authorization header incorreto

**Solução:**
- Verificar se SUPABASE_ANON_KEY está correto
- Formato: `Bearer eyJhbG...` (com espaço após Bearer)
- Adicionar também header `apikey` com o mesmo valor

---

### ❌ n8n não executa no horário

**Causa:** Timezone diferente

**Solução:**
- No Schedule node, ajustar timezone
- Ou usar cron UTC: 9h BRT = 12h UTC → `0 12 * * *`

---

### ❌ Slack "invalid_payload"

**Causa:** Expressões {{ }} com erro

**Solução:**
- Simplificar mensagem primeiro (testar com texto fixo)
- Adicionar filtros um por um
- Usar `{{ JSON.stringify($json) }}` para debug

---

## 📊 Monitoramento

### Ver Histórico de Execuções

1. No n8n: **Executions** (menu lateral)
2. Veja todas as execuções passadas
3. Clique para ver detalhes (input/output)

### Ver Logs da Edge Function

```bash
# Logs em tempo real
npx supabase functions logs health-check

# Ou no Dashboard Supabase
# https://app.supabase.com/project/seqgnxynrcylxsdzbloa/functions
```

---

## 🎓 Próximos Passos

### Múltiplos Ambientes

Duplicar workflow:
- **Workflow 1:** Produção (9h, URL prod)
- **Workflow 2:** Staging (6h, URL staging)

### Dashboard de Status

Salvar histórico em Google Sheets ou Airtable:
1. Adicionar nó **Google Sheets** após HTTP Request
2. Inserir linha: `timestamp`, `status`, `passed`, `failed`
3. Criar gráfico de uptime

### Escalação de Alertas

Adicionar nó **Twilio** para SMS quando `status === 'down'`

---

## ✅ Checklist Final

Antes de considerar pronto:

- [ ] Edge function deployed (`npx supabase functions deploy health-check`)
- [ ] Edge function testada via curl (retorna JSON)
- [ ] Workflow criado no n8n
- [ ] HTTP Request configurado com URL e auth corretos
- [ ] Webhook Slack criado e testado
- [ ] Teste manual executado (mensagem recebida?)
- [ ] Workflow ativado (Active = ON)
- [ ] Cron configurado (9h)
- [ ] Testado com falha simulada

---

## 📚 URLs Importantes

- **Supabase Dashboard:** https://app.supabase.com/project/seqgnxynrcylxsdzbloa
- **Edge Function URL:** https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/health-check
- **Slack Webhooks:** https://api.slack.com/apps
- **n8n Docs (HTTP Request):** https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/

---

**🎉 Pronto! Versão simplificada para Hostinger configurada.**

Seu n8n agora chama a Edge Function do Supabase (que já está na nuvem) em vez de tentar acessar seu computador local.

**Vantagens:**
- ✅ Funciona de qualquer lugar (Hostinger, n8n.cloud, etc)
- ✅ Não depende de máquina local ligada
- ✅ Mais simples (apenas HTTP request)
- ✅ Edge function pode ser reutilizada por outros serviços
