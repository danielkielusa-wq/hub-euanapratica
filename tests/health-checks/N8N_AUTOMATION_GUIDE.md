# 🤖 Guia Completo: Automação de Health Checks no n8n

> **Objetivo:** Configurar verificação diária automática da plataforma ENP Hub com notificações inteligentes via n8n.

---

## 📋 Índice

1. [Pré-requisitos](#-pré-requisitos)
2. [Visão Geral do Sistema](#-visão-geral-do-sistema)
3. [Passo a Passo: Configuração n8n](#-passo-a-passo-configuração-n8n)
4. [Configurar Notificações](#-configurar-notificações)
5. [Testar e Validar](#-testar-e-validar)
6. [Cenários Avançados](#-cenários-avançados)
7. [Troubleshooting](#-troubleshooting)
8. [FAQ](#-faq)

---

## ✅ Pré-requisitos

Antes de começar, certifique-se de que você tem:

### 1. n8n Instalado e Rodando
- **Cloud:** [n8n.io](https://n8n.io) (recomendado para iniciantes)
- **Self-hosted:** Docker, npm, ou servidor próprio
- Acesso admin ao n8n

### 2. Projeto ENP Hub Configurado
```bash
cd c:\Users\I335869\ENP_HUB\hub-euanapratica

# Verificar se health checks funcionam
npm run health:setup
npm run health

# Deve mostrar: ✅ 9 passed
```

### 3. Variáveis de Ambiente no .env
```env
VITE_SUPABASE_URL=https://seqgnxynrcylxsdzbloa.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here

# Opcional (pode configurar depois)
HEALTH_CHECK_WEBHOOK=https://hooks.slack.com/services/...
HEALTH_CHECK_NOTIFY_ON=failures
```

### 4. Canal de Notificação (escolha 1+)
- ✉️ **Email** (SMTP ou SendGrid)
- 💬 **Slack** (Incoming Webhook)
- 🎮 **Discord** (Webhook)
- 📱 **Telegram** (Bot)
- 🔔 **Outro** (qualquer webhook HTTP)

---

## 🎯 Visão Geral do Sistema

### Fluxo de Execução

```
┌─────────────────────┐
│  Cron Trigger       │  Dispara às 9h diariamente
│  (Schedule Node)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Execute Command    │  Roda: npm run health:json
│  (Bash Node)        │  Output: JSON com 9 health checks
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Parse JSON         │  Extrai: status, passed, failed, checks[]
│  (Code Node)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  IF: Has Failures?  │  Verifica se failed > 0 ou warned > 0
│  (Conditional)      │
└──────┬──────────┬───┘
       │          │
  SIM  │          │ NÃO
       │          │
       ▼          ▼
┌─────────┐  ┌────────┐
│ Alertar │  │  Log   │
│ Slack/  │  │ Sucesso│
│ Email   │  │        │
└─────────┘  └────────┘
```

### O que é Verificado (9 checks)

| # | Check | Crítico? | O que valida |
|---|-------|----------|--------------|
| 1 | **Login & Auth** | ✅ Sim | Auth API, profiles, roles, RLS, RPC get_full_plan_access |
| 2 | **APIs & Infra** | ✅ Sim | Frontend online (hub.euanapratica.com), latência Supabase, Storage |
| 3 | **Planos & Assinaturas** | ✅ Sim | 3 planos (Básico/Pro/VIP), preços (0/47/97), features, usage_logs |
| 4 | **Currículo USA** | ⚠️ Não | ResumePass: RPC get_user_quota, resumepass_reports, edge fn |
| 5 | **Prime Jobs** | ⚠️ Não | Feature flags, RPCs de quota/stats, job_bookmarks |
| 6 | **Job Title Translator** | ⚠️ Não | Tabela, feature flags, edge function translate-title |
| 7 | **Comunidade** | ⚠️ Não | Posts, comments, categories, ranking, gamificação |
| 8 | **Pagamentos & TICTO** | ✅ Sim | payment_logs, ticto-webhook fn, checkout URLs |
| 9 | **Agendamentos** | ⚠️ Não | Bookings, mentor_availability, email functions |

**Status Geral:**
- **`healthy`** → 9/9 passed, 0 warned
- **`degraded`** → 1-2 failed OU warnings detectados
- **`down`** → 3+ failed OU auth falhou (crítico)

---

## 🚀 Passo a Passo: Configuração n8n

### Etapa 1: Importar Workflow Base

#### Opção A: Importar arquivo JSON (Recomendado)

1. Acesse n8n: `http://localhost:5678` ou `https://app.n8n.io`
2. Clique em **Workflows** (menu lateral)
3. Clique em **Import from File**
4. Selecione: `tests/health-checks/n8n-workflow-example.json`
5. Clique em **Save**

#### Opção B: Criar do zero

Se preferir criar manualmente, veja [Criar Workflow do Zero](#criar-workflow-do-zero).

---

### Etapa 2: Configurar Cada Nó (Node)

Após importar, você verá 7 nós conectados. Vamos configurar cada um:

---

#### 📅 **Nó 1: Schedule Trigger** (Agendamento)

**Objetivo:** Disparar o workflow diariamente às 9h.

**Configuração:**

1. Clique no nó **"Schedule (9h diariamente)"**
2. Em **Trigger Times**, selecione:
   - **Mode:** `Cron`
   - **Cron Expression:** `0 9 * * *`
     - `0` = minuto 0
     - `9` = hora 9 (9h da manhã)
     - `* * *` = todo dia, todo mês, todo ano

**Outras opções úteis:**

| Cron | Descrição |
|------|-----------|
| `0 9 * * *` | Diariamente às 9h |
| `0 9,18 * * *` | 9h e 18h |
| `*/30 * * * *` | A cada 30 minutos |
| `0 */6 * * *` | A cada 6 horas (0h, 6h, 12h, 18h) |
| `0 9 * * 1-5` | Apenas dias úteis (seg-sex) às 9h |

3. Clique **Save**

---

#### 💻 **Nó 2: Execute Command** (Executar Health Checks)

**Objetivo:** Rodar o script de health checks e retornar JSON.

**Configuração:**

1. Clique no nó **"Execute Health Checks"**
2. **Command:**
   ```bash
   cd c:\Users\I335869\ENP_HUB\hub-euanapratica && npx tsx tests/health-checks/run-health-checks.ts --format=json
   ```

**⚠️ IMPORTANTE: Ajustar para seu ambiente**

| Ambiente | Command |
|----------|---------|
| **Windows (seu caso)** | `cd c:\Users\I335869\ENP_HUB\hub-euanapratica && npx tsx tests/health-checks/run-health-checks.ts --format=json` |
| **Linux/Mac** | `cd /home/user/ENP_HUB/hub-euanapratica && npm run health:json` |
| **Docker** | `docker exec enp-hub npm run health:json` |
| **n8n Cloud** | Configure um webhook externo (veja [Cenários Avançados](#cenário-3-n8n-cloud-sem-acesso-local)) |

**Opções alternativas:**
```bash
# Usar npm script (se PATH configurado)
cd c:\Users\I335869\ENP_HUB\hub-euanapratica && npm run health:json

# Com webhook direto (notificação no próprio script)
cd c:\Users\I335869\ENP_HUB\hub-euanapratica && npm run health -- --webhook=https://hooks.slack.com/...
```

3. **Timeout:** `30000` (30 segundos)
4. Clique **Save**

**Teste rápido:**
- Clique em **Execute Node**
- Deve retornar JSON com `stdout` contendo o relatório

---

#### 🧩 **Nó 3: Parse JSON** (Processar Resultado)

**Objetivo:** Extrair campos do JSON para usar nos próximos nós.

**Configuração:**

1. Clique no nó **"Parse Result"**
2. **Mode:** `Run Once for All Items`
3. **JavaScript Code:**

```javascript
const report = JSON.parse($input.first().json.stdout);

return [
  {
    json: {
      status: report.status,              // "healthy" | "degraded" | "down"
      environment: report.environment,    // "production" | "local"
      passed: report.passed,              // ex: 9
      warned: report.warned,              // ex: 0
      failed: report.failed,              // ex: 0
      total: report.total_checks,         // ex: 9
      duration_ms: report.total_duration_ms,
      timestamp: report.timestamp,
      checks: report.checks,              // array com detalhes de cada check

      // Flags úteis para condicionais
      hasFailures: report.failed > 0,
      hasWarnings: report.warned > 0,
      isCritical: report.status === 'down',
      isHealthy: report.status === 'healthy',
    }
  }
];
```

4. Clique **Save**

**Teste:**
- Execute o nó
- Veja o Output → deve mostrar objeto com campos extraídos

---

#### 🔀 **Nó 4: IF Node** (Decisão: Notificar?)

**Objetivo:** Decidir se envia notificação (só quando há falhas/warnings).

**Configuração:**

1. Clique no nó **"Has Failures?"**
2. **Conditions:**
   - **Condition 1:**
     - `{{ $json.hasFailures }}` **equals** `true`
   - **OU Condition 2:**
     - `{{ $json.hasWarnings }}` **equals** `true`

**Lógica:**
- **True (branch esquerdo):** Envia Slack/Email (há problemas)
- **False (branch direito):** Log de sucesso (tudo OK)

**Personalizar gatilho de notificação:**

| Cenário | Condição |
|---------|----------|
| Notificar APENAS em falhas críticas | `{{ $json.isCritical }}` equals `true` |
| Notificar em falhas OU warnings | `{{ $json.hasFailures || $json.hasWarnings }}` equals `true` |
| Notificar SEMPRE (até sucessos) | Remover IF, conectar direto |
| Notificar se > 2 falhas | `{{ $json.failed }}` **greater than** `2` |

3. Clique **Save**

---

#### 💬 **Nó 5a: Slack Alert** (Notificação Slack)

**Objetivo:** Enviar alerta formatado para Slack quando houver falhas.

**Pré-requisito:** [Criar Webhook Slack](#1-slack) (veja abaixo).

**Configuração:**

1. Clique no nó **"Send Slack Alert"**
2. **Authentication:** `Webhook URL` (ou OAuth se preferir)
3. **Webhook URL:**
   ```
   https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
   ```
   *(obtenha em [Criar Webhook Slack](#1-slack))*

4. **Message:**

```plaintext
🚨 *ENP Hub Health Check - {{ $json.status.toUpperCase() }}*

📊 *Resumo:*
• Status: {{ $json.status }}
• Passed: {{ $json.passed }}/{{ $json.total }}
• Failed: {{ $json.failed }}
• Warned: {{ $json.warned }}
• Duration: {{ $json.duration_ms }}ms

{{ $json.failed > 0 ? '❌ *FALHAS DETECTADAS:*' : '' }}
{{ $json.checks.filter(c => c.status === 'fail').map(c => `• *${c.name}*: ${c.error || 'Unknown error'}`).join('\n') }}

{{ $json.warned > 0 ? '⚠️ *WARNINGS:*' : '' }}
{{ $json.checks.filter(c => c.status === 'warn').map(c => `• *${c.name}*: ${c.error || 'Warning'}`).join('\n') }}

🕐 Timestamp: {{ $json.timestamp }}
🌍 Ambiente: {{ $json.environment }}
```

**Exemplo de mensagem enviada:**
```
🚨 ENP Hub Health Check - DEGRADED

📊 Resumo:
• Status: degraded
• Passed: 7/9
• Failed: 1
• Warned: 1
• Duration: 2341ms

❌ FALHAS DETECTADAS:
• Pagamentos & TICTO: Edge function ticto-webhook NÃO deployed

⚠️ WARNINGS:
• Prime Jobs: RPC check_prime_jobs_quota não existe

🕐 Timestamp: 2026-02-20T09:00:00.000Z
🌍 Ambiente: production
```

5. **Channel (opcional):** `#health-checks` ou `@you`
6. Clique **Save**

---

#### 📧 **Nó 5b: Email Alert** (Notificação Email)

**Objetivo:** Enviar email detalhado em caso de falhas.

**Configuração:**

1. Clique no nó **"Send Email"**
2. **Account:**
   - Escolha **SMTP** ou **SendGrid** ou **Gmail**
   - Configure credenciais (veja [Configurar Email](#2-email))

3. **From Email:** `noreply@yourdomain.com`
4. **To Email:** `admin@yourdomain.com` (seu email)
5. **Subject:**
   ```
   ENP Hub Health Check - {{ $json.status.toUpperCase() }}
   ```

6. **Email Type:** `HTML`
7. **Message (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #f44336; color: white; padding: 20px; text-align: center; }
    .healthy .header { background: #4caf50; }
    .degraded .header { background: #ff9800; }
    .content { padding: 20px; }
    .check { margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; }
    .check.fail { border-color: #f44336; background: #ffebee; }
    .check.warn { border-color: #ff9800; background: #fff3e0; }
    .check.pass { border-color: #4caf50; background: #e8f5e9; }
  </style>
</head>
<body class="{{ $json.status }}">
  <div class="header">
    <h1>🏥 ENP Hub Health Check</h1>
    <h2>Status: {{ $json.status.toUpperCase() }}</h2>
  </div>

  <div class="content">
    <p><strong>📊 Resumo:</strong></p>
    <ul>
      <li>Passed: {{ $json.passed }}/{{ $json.total }}</li>
      <li>Failed: {{ $json.failed }}</li>
      <li>Warned: {{ $json.warned }}</li>
      <li>Duration: {{ $json.duration_ms }}ms</li>
      <li>Timestamp: {{ $json.timestamp }}</li>
    </ul>

    <h3>📋 Detalhes dos Checks:</h3>
    {{ $json.checks.map(c => `
      <div class="check ${c.status}">
        <strong>${c.status === 'fail' ? '❌' : c.status === 'warn' ? '⚠️' : '✅'} ${c.name}</strong> (${c.duration}ms)
        ${c.error ? '<br><span style="color: #d32f2f;">' + c.error + '</span>' : ''}
      </div>
    `).join('') }}

    <hr>
    <p style="color: #666; font-size: 12px;">
      Este é um alerta automático gerado pelo sistema de health checks ENP Hub.<br>
      Para mais informações, acesse o dashboard ou contate o administrador.
    </p>
  </div>
</body>
</html>
```

8. Clique **Save**

---

#### ✅ **Nó 6: Log Success** (Registrar Sucesso)

**Objetivo:** Registrar quando tudo está OK (opcional).

**Configuração:**

1. Clique no nó **"Log Success"**
2. **Type:** `No Operation` (ou `HTTP Request` para webhook)
3. **Message (para log):**
   ```
   ✅ All health checks passed at {{ $json.timestamp }}
   ```

**Alternativas:**
- Enviar notificação de sucesso para Slack (menos spam)
- Salvar em banco de dados (histórico)
- Webhook para dashboard externo

4. Clique **Save**

---

### Etapa 3: Conectar os Nós

Verifique se as conexões estão corretas:

```
Schedule → Execute Command → Parse JSON → IF Node
                                            ├─ TRUE → Slack Alert
                                            │         Email Alert
                                            └─ FALSE → Log Success
```

**Como conectar:**
1. Arraste do ponto de saída (direita) de um nó
2. Solte no ponto de entrada (esquerda) do próximo nó

---

### Etapa 4: Salvar e Ativar

1. Clique em **Save** (canto superior direito)
2. **Nome do workflow:** `ENP Hub - Health Checks Diários`
3. Toggle **Active** para ON (canto superior direito)
4. ✅ Workflow agora roda automaticamente às 9h diariamente!

---

## 🔔 Configurar Notificações

### 1. Slack

#### Criar Incoming Webhook:

1. Acesse https://api.slack.com/apps
2. Clique **Create New App** → **From scratch**
3. Nome: `ENP Hub Health Checks`
4. Workspace: Selecione seu workspace
5. Clique **Create App**
6. Menu lateral: **Incoming Webhooks** → Toggle **ON**
7. Clique **Add New Webhook to Workspace**
8. Escolha canal: `#health-checks` (crie se não existir)
9. Clique **Allow**
10. **Copie a Webhook URL:**
    ```
    https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
    ```

#### Adicionar no n8n:

1. No nó Slack, cole a URL em **Webhook URL**
2. Teste: Execute o nó manualmente
3. Verifique se mensagem apareceu no Slack

---

### 2. Email

#### Opção A: Gmail (Simples)

1. No nó Email, escolha **Account:** `Gmail OAuth2`
2. Clique **Connect my account**
3. Autorize acesso via Google
4. Preencha **To Email:** seu email
5. Pronto!

#### Opção B: SMTP (Recomendado para produção)

1. Use serviço como:
   - **SendGrid** (100 emails/dia grátis): https://sendgrid.com
   - **Mailgun** (bom para desenvolvedores)
   - **SMTP próprio**

2. No n8n, configure:
   - **Host:** `smtp.sendgrid.net`
   - **Port:** `587`
   - **User:** `apikey`
   - **Password:** `SG.xxxx` (API key do SendGrid)
   - **Secure:** `TLS`

---

### 3. Discord

1. No servidor Discord, vá em **Server Settings** → **Integrations** → **Webhooks**
2. Clique **New Webhook**
3. Nome: `ENP Hub Health`
4. Canal: `#health-checks`
5. **Copie Webhook URL**
6. No n8n, use nó **HTTP Request**:
   - **Method:** `POST`
   - **URL:** `https://discord.com/api/webhooks/...`
   - **Body:**
     ```json
     {
       "content": "🚨 ENP Hub Health Check Failed",
       "embeds": [{
         "title": "{{ $json.status }}",
         "description": "{{ $json.failed }} checks failed",
         "color": 15158332
       }]
     }
     ```

---

### 4. Telegram (Bônus)

1. Crie um bot: fale com @BotFather no Telegram
2. Comando: `/newbot`
3. Copie o **Token:** `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
4. Pegue seu **Chat ID:** fale com @userinfobot
5. No n8n, use nó **Telegram**:
   - **Bot Token:** cole o token
   - **Chat ID:** seu chat ID
   - **Message:**
     ```
     🚨 ENP Hub Health Check
     Status: {{ $json.status }}
     Failed: {{ $json.failed }}
     ```

---

## ✅ Testar e Validar

### Teste Manual Completo

1. **Desative o Schedule** (clique no Toggle Active → OFF)
2. Clique em **Execute Workflow** (canto superior direito)
3. Acompanhe a execução:
   - ✅ Schedule → ✅ Execute → ✅ Parse → ✅ IF → ✅ Slack/Email
4. Verifique se recebeu notificação (Slack ou Email)

### Teste com Falha Simulada

Para testar se alertas funcionam quando há problemas:

1. **Simular falha:**
   - Edite temporariamente o nó Parse JSON
   - Adicione: `json.failed = 1; json.hasFailures = true;`

2. Execute workflow
3. Deve enviar alerta para Slack/Email
4. **Desfaça a mudança** após teste

### Validar Agendamento

1. Ative o workflow: Toggle **Active** → ON
2. **Aguarde até 9h do próximo dia** (ou ajuste cron para testar logo)
3. Após execução, verifique:
   - **n8n:** Executions (menu lateral) → veja último run
   - **Slack/Email:** recebeu notificação?

**Testar agendamento rápido:**
- Mude cron para: `*/5 * * * *` (a cada 5 minutos)
- Aguarde 5 min
- Verifique se executou
- **Volte para `0 9 * * *`**

---

## 🎓 Cenários Avançados

### Cenário 1: Notificar Apenas em Falhas Críticas

Modificar nó IF:

```javascript
// Só alerta se status === 'down' (3+ checks falharam OU auth falhou)
{{ $json.status === 'down' }}
```

### Cenário 2: Múltiplos Ambientes (Staging + Prod)

Duplicar workflow:

1. **Workflow 1:** ENP Hub - Health Checks (PRODUCTION)
   - Cron: `0 9 * * *`
   - Command: aponta para produção
   - Webhook: `#alerts-prod`

2. **Workflow 2:** ENP Hub - Health Checks (STAGING)
   - Cron: `0 */6 * * *` (a cada 6h)
   - Command: aponta para staging
   - Webhook: `#alerts-staging`

### Cenário 3: n8n Cloud (sem acesso ao filesystem local)

Se seu n8n está na nuvem e não acessa sua máquina:

**Solução A: Expor via Webhook**

1. Crie um endpoint no seu servidor:
   ```javascript
   // api/health-check.js (Next.js)
   import { runAllHealthChecks } from '@/tests/health-checks/index';

   export default async function handler(req, res) {
     if (req.headers['authorization'] !== `Bearer ${process.env.HEALTH_CHECK_SECRET}`) {
       return res.status(401).json({ error: 'Unauthorized' });
     }

     const report = await runAllHealthChecks(
       process.env.VITE_SUPABASE_URL,
       process.env.VITE_SUPABASE_PUBLISHABLE_KEY
     );

     res.json(report);
   }
   ```

2. No n8n, use **HTTP Request** em vez de Execute Command:
   - **Method:** `GET`
   - **URL:** `https://hub.euanapratica.com/api/health-check`
   - **Headers:**
     ```json
     {
       "Authorization": "Bearer SEU_SECRET_AQUI"
     }
     ```

**Solução B: GitHub Actions + Webhook**

1. Crie `.github/workflows/health-check.yml`
2. GitHub Actions roda health check
3. Envia resultado para webhook do n8n
4. n8n processa e notifica

### Cenário 4: Dashboard de Status (Uptime Monitor)

Salvar histórico de health checks:

1. Adicionar nó **Postgres** ou **Airtable** ou **Google Sheets**
2. Após Parse JSON, salvar em tabela:
   ```sql
   INSERT INTO health_check_history (timestamp, status, passed, failed, checks)
   VALUES ($timestamp, $status, $passed, $failed, $checks::jsonb)
   ```
3. Criar dashboard (Grafana, Metabase, Retool) consultando essa tabela

### Cenário 5: Escalação de Alertas

Notificar pessoas diferentes por gravidade:

1. **Warning (degraded):** Slack `#dev-team`
2. **Critical (down):** Slack `#dev-team` + Email para founder + SMS (Twilio)

Adicionar nós condicionais:

```
IF Node 1: status === 'down'
  └─ TRUE → Slack #alerts + Email founder + SMS
  └─ FALSE → IF Node 2: status === 'degraded'
               └─ TRUE → Slack #dev-team
               └─ FALSE → No Op
```

---

## 🐛 Troubleshooting

### Problema: "Command not found: npm"

**Causa:** n8n não encontra `npm` no PATH.

**Solução:**

1. Use caminho absoluto do Node:
   ```bash
   C:\Program Files\nodejs\node.exe C:\Users\I335869\ENP_HUB\hub-euanapratica\node_modules\.bin\tsx tests/health-checks/run-health-checks.ts --format=json
   ```

2. Ou configure PATH no n8n:
   - Adicione antes do comando: `export PATH=$PATH:/usr/local/bin &&`

---

### Problema: "VITE_SUPABASE_URL not defined"

**Causa:** .env não está sendo lido.

**Solução:**

1. Verificar se `.env` está no diretório correto
2. No nó Execute Command, adicionar:
   ```bash
   cd c:\Users\I335869\ENP_HUB\hub-euanapratica && set -a && source .env && npx tsx tests/health-checks/run-health-checks.ts --format=json
   ```

---

### Problema: Workflow não executa no horário

**Causa:** Timezone incorreto ou n8n parado.

**Solução:**

1. Verificar timezone do n8n:
   - Settings → General → Timezone
2. Ajustar cron para UTC (se n8n em UTC):
   - 9h BRT = 12h UTC → `0 12 * * *`
3. Verificar se n8n está rodando:
   ```bash
   docker ps | grep n8n
   # ou
   pm2 status n8n
   ```

---

### Problema: JSON parsing error

**Causa:** stdout não é JSON válido (pode ter logs/warnings misturados).

**Solução:**

1. No nó Parse JSON, adicionar tratamento de erro:
   ```javascript
   try {
     const stdout = $input.first().json.stdout;

     // Extrair apenas JSON (remove logs antes/depois)
     const jsonMatch = stdout.match(/\{[\s\S]*\}/);
     if (!jsonMatch) throw new Error('No JSON found in output');

     const report = JSON.parse(jsonMatch[0]);
     return [{ json: report }];
   } catch (err) {
     return [{
       json: {
         error: err.message,
         raw_output: $input.first().json.stdout
       }
     }];
   }
   ```

---

### Problema: Slack diz "Invalid Webhook URL"

**Causa:** URL do webhook incorreta ou expirada.

**Solução:**

1. Recriar webhook no Slack (veja [Criar Webhook](#1-slack))
2. Verificar se copiou URL completa (incluindo `/services/...`)
3. Testar webhook com curl:
   ```bash
   curl -X POST https://hooks.slack.com/services/... \
     -H 'Content-Type: application/json' \
     -d '{"text": "Teste"}'
   ```

---

### Problema: Email não envia

**Causa:** SMTP mal configurado ou bloqueado.

**Solução:**

1. Verificar credenciais SMTP
2. Testar com serviço conhecido (Gmail, SendGrid)
3. Verificar logs do n8n:
   ```bash
   docker logs n8n
   ```
4. Se Gmail, habilitar "Less secure apps" ou usar App Password

---

## ❓ FAQ

### Posso rodar health checks mais de 1x por dia?

Sim! Edite o cron:
- **A cada 6h:** `0 */6 * * *`
- **A cada 1h:** `0 * * * *`
- **A cada 30min:** `*/30 * * * *`

**Atenção:** Health checks fazem chamadas ao Supabase. Evite rodar a cada minuto (pode atingir limites de rate).

---

### Como adicionar um novo health check?

1. Crie arquivo: `tests/health-checks/meu-check.health.ts`
2. Siga estrutura de `auth.health.ts`
3. Registre em `tests/health-checks/index.ts`:
   ```typescript
   import { checkMeuCheck } from './meu-check.health';

   const checks = await Promise.all([
     // ... outros
     checkMeuCheck(supabaseUrl, supabaseKey),
   ]);
   ```
4. Workflow n8n automaticamente incluirá o novo check

---

### Posso notificar em múltiplos canais?

Sim! Conecte múltiplos nós ao branch TRUE do IF:

```
IF → Slack Alert
  ├─ Email Alert
  ├─ Discord Alert
  └─ Telegram Alert
```

---

### Como ver histórico de execuções?

No n8n:
1. Menu lateral: **Executions**
2. Veja todas as execuções passadas
3. Clique em uma para ver detalhes (input/output de cada nó)

---

### Posso rodar health checks sob demanda?

Sim!

**Opção 1: Executar no n8n**
- Abra workflow → **Execute Workflow**

**Opção 2: Via terminal**
```bash
cd c:\Users\I335869\ENP_HUB\hub-euanapratica
npm run health
```

**Opção 3: Adicionar Webhook Trigger**
- Adicione nó **Webhook** antes do Execute Command
- Gera URL: `https://n8n.yourdomain.com/webhook/health-check`
- Acesse URL para disparar

---

### Como desativar temporariamente?

1. No workflow, toggle **Active** → OFF
2. Ou pause o nó Schedule (clique → Disable)

---

## 🎯 Checklist Final

Antes de considerar pronto:

- [ ] Workflow importado no n8n
- [ ] Todos os 7 nós configurados
- [ ] Caminho correto no Execute Command
- [ ] Webhook Slack/Email configurado
- [ ] Teste manual executado com sucesso
- [ ] Notificação recebida (Slack/Email)
- [ ] Workflow ativado (Active = ON)
- [ ] Cron configurado para horário desejado
- [ ] Testado com falha simulada (alerta funciona)
- [ ] Documentado em algum lugar (wiki, notion) que health checks rodam diariamente às 9h

---

## 📚 Recursos Adicionais

- **Documentação n8n:** https://docs.n8n.io
- **Supabase Status:** https://status.supabase.com
- **Slack API:** https://api.slack.com/messaging/webhooks
- **Cron Expression Generator:** https://crontab.guru

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas não cobertos neste guia:

1. Verifique logs do n8n: `docker logs n8n`
2. Execute health check manualmente: `npm run health`
3. Teste componentes isoladamente (apenas Slack, apenas Email)
4. Revise as configurações de cada nó
5. Consulte documentação oficial do n8n

---

**✅ Parabéns!** Seu sistema de monitoramento automático está configurado. A plataforma ENP Hub agora é verificada diariamente, e você receberá alertas imediatos caso algo quebre.

**Próximo passo recomendado:** Configure um dashboard de uptime para visualizar histórico de health checks ao longo do tempo (veja [Cenário 4](#cenário-4-dashboard-de-status-uptime-monitor)).
