# 🔄 Diagrama Visual do Workflow n8n

> Visualização completa do fluxo de health checks automatizado no n8n

---

## 📊 Visão Geral do Fluxo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ENP Hub - Health Checks Diários                     │
│                   Workflow n8n - Monitoramento Automático               │
└─────────────────────────────────────────────────────────────────────────┘

     🕐 TRIGGER                    🖥️ EXECUTE                   📦 PARSE
┌────────────────┐         ┌─────────────────────┐      ┌──────────────────┐
│                │         │                     │      │                  │
│   Schedule     │────────▶│  Execute Command    │─────▶│   Parse JSON     │
│   Trigger      │         │  (Bash)             │      │   (Code)         │
│                │         │                     │      │                  │
│ Cron: 0 9 * * *│         │ npm run health:json │      │ Extract fields:  │
│ (9h diariamente│         │                     │      │ • status         │
│                │         │ Output: JSON stdout │      │ • passed/failed  │
└────────────────┘         └─────────────────────┘      │ • checks[]       │
                                                         │ • hasFailures    │
                                                         └──────────────────┘
                                                                  │
                                                                  ▼
                                       🔀 CONDITIONAL
                                  ┌─────────────────────┐
                                  │                     │
                                  │     IF Node         │
                                  │  "Has Issues?"      │
                                  │                     │
                                  │  Condition:         │
                                  │  hasFailures ||     │
                                  │  hasWarnings        │
                                  └──────────┬──────────┘
                                             │
                        ┌────────────────────┴──────────────────┐
                        │                                       │
                    TRUE│(tem problemas)              FALSE     │(tudo OK)
                        │                                       │
                        ▼                                       ▼
        ┌───────────────────────────┐              ┌──────────────────┐
        │  NOTIFICATIONS (Paralelo) │              │   Log Success    │
        └───────────────────────────┘              │   (No Op)        │
                    │                               │                  │
         ┌──────────┴──────────┐                   │  ✅ All checks   │
         │                     │                    │     passed at    │
         ▼                     ▼                    │     09:00:00     │
  ┌─────────────┐    ┌──────────────┐              └──────────────────┘
  │             │    │              │
  │   Slack     │    │    Email     │
  │   Alert     │    │    Alert     │
  │             │    │              │
  │ 💬 Envia    │    │ 📧 Envia     │
  │ mensagem    │    │ email HTML   │
  │ formatada   │    │ formatado    │
  │ para canal  │    │ para admin   │
  └─────────────┘    └──────────────┘
```

---

## 🔍 Detalhamento de Cada Nó

### 1️⃣ Schedule Trigger (Cron)

```
┌─────────────────────────────────────┐
│  📅 Schedule Trigger                │
├─────────────────────────────────────┤
│  Tipo: n8n-nodes-base.scheduleTrigger
│  Função: Disparar workflow no horário
│
│  Configuração:
│  ├─ Mode: Cron
│  ├─ Expression: 0 9 * * *
│  │   └─ 0 min, 9h, todo dia
│  └─ Timezone: Local (ou UTC)
│
│  Frequências comuns:
│  ├─ 0 9 * * *     → Diariamente às 9h
│  ├─ 0 9,18 * * *  → 9h e 18h
│  ├─ 0 */6 * * *   → A cada 6 horas
│  └─ */30 * * * *  → A cada 30 min
└─────────────────────────────────────┘
         │
         │ Dispara a cada execução
         ▼
```

---

### 2️⃣ Execute Command (Bash)

```
┌─────────────────────────────────────────────────────────┐
│  🖥️ Execute Health Checks                               │
├─────────────────────────────────────────────────────────┤
│  Tipo: n8n-nodes-base.executeCommand
│  Função: Rodar script de health checks
│
│  Comando (Windows):
│  cd c:\Users\I335869\ENP_HUB\hub-euanapratica &&
│  npx tsx tests/health-checks/run-health-checks.ts
│  --format=json
│
│  Comando (Linux/Mac):
│  cd /path/to/hub-euanapratica &&
│  npm run health:json
│
│  Timeout: 30000ms (30 segundos)
│
│  Output (stdout):
│  {
│    "timestamp": "2026-02-20T09:00:00.000Z",
│    "environment": "production",
│    "total_checks": 9,
│    "passed": 9,
│    "warned": 0,
│    "failed": 0,
│    "total_duration_ms": 2341,
│    "status": "healthy",
│    "checks": [
│      {
│        "name": "Login & Auth",
│        "status": "pass",
│        "duration": 245,
│        "details": { ... }
│      },
│      { ... mais 8 checks }
│    ]
│  }
└─────────────────────────────────────────────────────────┘
         │
         │ JSON string no stdout
         ▼
```

---

### 3️⃣ Parse JSON (Code)

```
┌─────────────────────────────────────────────────────────┐
│  📦 Parse Result                                         │
├─────────────────────────────────────────────────────────┤
│  Tipo: n8n-nodes-base.code
│  Função: Extrair campos do JSON para uso posterior
│
│  JavaScript Code:
│  ┌─────────────────────────────────────────────────┐
│  │ try {                                           │
│  │   const stdout = $input.first().json.stdout;    │
│  │                                                  │
│  │   // Extrai JSON (pode ter logs misturados)     │
│  │   const jsonMatch = stdout.match(/\{[\s\S]*\}/);│
│  │   const report = JSON.parse(jsonMatch[0]);      │
│  │                                                  │
│  │   return [{                                      │
│  │     json: {                                      │
│  │       status: report.status,                    │
│  │       environment: report.environment,          │
│  │       passed: report.passed,                    │
│  │       warned: report.warned,                    │
│  │       failed: report.failed,                    │
│  │       total: report.total_checks,               │
│  │       duration_ms: report.total_duration_ms,    │
│  │       timestamp: report.timestamp,              │
│  │       checks: report.checks,                    │
│  │                                                  │
│  │       // Flags úteis                            │
│  │       hasFailures: report.failed > 0,           │
│  │       hasWarnings: report.warned > 0,           │
│  │       isCritical: report.status === 'down',     │
│  │       isHealthy: report.status === 'healthy',   │
│  │       isDegraded: report.status === 'degraded'  │
│  │     }                                            │
│  │   }];                                            │
│  │ } catch (err) {                                  │
│  │   return [{ json: { error: err.message }}];     │
│  │ }                                                │
│  └─────────────────────────────────────────────────┘
│
│  Output para próximo nó:
│  {
│    "status": "healthy",
│    "passed": 9,
│    "failed": 0,
│    "warned": 0,
│    "total": 9,
│    "hasFailures": false,
│    "hasWarnings": false,
│    "isCritical": false,
│    "isHealthy": true,
│    "checks": [ ... ]
│  }
└─────────────────────────────────────────────────────────┘
         │
         │ Objeto estruturado
         ▼
```

---

### 4️⃣ IF Node (Decisão)

```
┌─────────────────────────────────────────────────────────┐
│  🔀 Has Issues?                                          │
├─────────────────────────────────────────────────────────┤
│  Tipo: n8n-nodes-base.if
│  Função: Decidir se notifica ou não
│
│  Condição:
│  {{ $json.hasFailures || $json.hasWarnings }} == true
│
│  Comportamento:
│  ├─ TRUE (branch esquerdo)
│  │   └─ Há falhas ou warnings → NOTIFICAR
│  │
│  └─ FALSE (branch direito)
│      └─ Tudo OK → Apenas log
│
│  Exemplos:
│  ┌──────────────────────┬─────────┬────────┐
│  │ Cenário              │ Branch  │ Ação   │
│  ├──────────────────────┼─────────┼────────┤
│  │ 9/9 passed           │ FALSE   │ Log    │
│  │ 8/9 passed, 1 warned │ TRUE    │ Alerta │
│  │ 7/9 passed, 2 failed │ TRUE    │ Alerta │
│  │ 5/9 passed (down)    │ TRUE    │ Alerta │
│  └──────────────────────┴─────────┴────────┘
│
│  Variações possíveis:
│  ├─ Apenas crítico:  {{ $json.isCritical }}
│  ├─ Apenas falhas:   {{ $json.hasFailures }}
│  └─ Sempre notificar: (remover IF)
└─────────────────────────────────────────────────────────┘
         │
    ┌────┴─────┐
    │          │
  TRUE      FALSE
    │          │
    ▼          ▼
```

---

### 5️⃣ Slack Alert (Notificação)

```
┌─────────────────────────────────────────────────────────┐
│  💬 Send Slack Alert                                     │
├─────────────────────────────────────────────────────────┤
│  Tipo: n8n-nodes-base.slack
│  Função: Enviar alerta formatado para Slack
│
│  Configuração:
│  ├─ Authentication: Webhook URL
│  ├─ URL: https://hooks.slack.com/services/T.../B.../xxx
│  └─ Channel: #health-checks (opcional)
│
│  Template da Mensagem:
│  ┌─────────────────────────────────────────────────┐
│  │ 🚨 ENP Hub Health Check - DEGRADED              │
│  │                                                  │
│  │ 📊 Resumo:                                       │
│  │ • Status: degraded                               │
│  │ • Passed: 7/9                                    │
│  │ • Failed: 1                                      │
│  │ • Warned: 1                                      │
│  │ • Duration: 2341ms                               │
│  │                                                  │
│  │ ❌ FALHAS DETECTADAS:                            │
│  │ • Pagamentos & TICTO: Edge function ticto-      │
│  │   webhook NÃO deployed                           │
│  │                                                  │
│  │ ⚠️ WARNINGS:                                     │
│  │ • Prime Jobs: RPC check_prime_jobs_quota não    │
│  │   existe                                         │
│  │                                                  │
│  │ 🕐 2026-02-20T09:00:00.000Z                     │
│  │ 🌍 Ambiente: production                          │
│  └─────────────────────────────────────────────────┘
│
│  Ícones dinâmicos:
│  ├─ status === 'down'     → 🚨 (crítico)
│  ├─ status === 'degraded' → ⚠️ (warning)
│  └─ status === 'healthy'  → ✅ (sucesso)
└─────────────────────────────────────────────────────────┘
```

---

### 6️⃣ Email Alert (Notificação)

```
┌─────────────────────────────────────────────────────────┐
│  📧 Send Email                                           │
├─────────────────────────────────────────────────────────┤
│  Tipo: n8n-nodes-base.emailSend
│  Função: Enviar email HTML formatado
│
│  Configuração:
│  ├─ Account: Gmail OAuth / SMTP
│  ├─ From: noreply@yourdomain.com
│  ├─ To: admin@yourdomain.com
│  ├─ Subject: 🚨 CRÍTICO - ENP Hub DOWN
│  └─ Type: HTML
│
│  Email HTML (Preview):
│  ┌─────────────────────────────────────────────────┐
│  │ ╔═════════════════════════════════════════════╗ │
│  │ ║ 🏥 ENP Hub Health Check                     ║ │
│  │ ║ Status: DEGRADED                            ║ │
│  │ ╚═════════════════════════════════════════════╝ │
│  │                                                  │
│  │ 📊 Resumo:                                       │
│  │ • Passed: 7/9                                    │
│  │ • Failed: 1                                      │
│  │ • Warned: 1                                      │
│  │ • Duration: 2341ms                               │
│  │ • Environment: production                        │
│  │ • Timestamp: 2026-02-20T09:00:00.000Z           │
│  │                                                  │
│  │ 📋 Detalhes dos Checks:                          │
│  │                                                  │
│  │ ┌───────────────────────────────────────┐       │
│  │ │ ✅ Login & Auth (245ms)               │       │
│  │ └───────────────────────────────────────┘       │
│  │                                                  │
│  │ ┌───────────────────────────────────────┐       │
│  │ │ ❌ Pagamentos & TICTO (287ms)         │       │
│  │ │ Edge function ticto-webhook NÃO       │       │
│  │ │ deployed                               │       │
│  │ └───────────────────────────────────────┘       │
│  │                                                  │
│  │ [... mais 7 checks ...]                         │
│  │                                                  │
│  │ ─────────────────────────────────────────────── │
│  │ Alerta automático - ENP Hub Health Checks       │
│  │ Sistema de monitoramento diário via n8n         │
│  └─────────────────────────────────────────────────┘
│
│  Cores por status:
│  ├─ down     → Header vermelho (#f44336)
│  ├─ degraded → Header laranja (#ff9800)
│  └─ healthy  → Header verde (#4caf50)
└─────────────────────────────────────────────────────────┘
```

---

### 7️⃣ Log Success (Silencioso)

```
┌─────────────────────────────────────────────────────────┐
│  ✅ Log Success                                          │
├─────────────────────────────────────────────────────────┤
│  Tipo: n8n-nodes-base.noOp
│  Função: Registrar que tudo está OK (silencioso)
│
│  Mensagem (apenas no log do n8n):
│  "✅ All health checks passed at 2026-02-20T09:00:00Z"
│
│  Alternativas:
│  ├─ No Operation (atual - não faz nada)
│  ├─ HTTP Request → Webhook para dashboard
│  ├─ Database → Salvar histórico
│  └─ Slack (opcional) → Notificar sucesso também
│
│  Por padrão: SILENCIOSO quando healthy
│  └─ Evita spam de "tudo OK" diariamente
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Diagrama de Estados

```
           ┌──────────────────────────────────────┐
           │    Workflow INACTIVE (pausado)       │
           └────────────────┬─────────────────────┘
                            │
                            │ Toggle Active ON
                            ▼
           ┌──────────────────────────────────────┐
           │    Workflow ACTIVE (aguardando)      │
           └────────────────┬─────────────────────┘
                            │
                            │ Cron dispara (9h)
                            ▼
           ┌──────────────────────────────────────┐
           │        Executando health checks      │
           │        (2-3 segundos)                │
           └────────────────┬─────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │  9/9 HEALTHY    │         │  <9 DEGRADED    │
    │                 │         │  ou DOWN        │
    └────────┬────────┘         └────────┬────────┘
             │                           │
             │                           │
             ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │  Log Success    │         │  Send Alerts    │
    │  (silencioso)   │         │  (Slack+Email)  │
    └─────────────────┘         └─────────────────┘
```

---

## 📈 Timeline de Execução

```
Tempo    Ação                              Node
────────────────────────────────────────────────────────────
00:00    Cron dispara                      Schedule Trigger
         │
00:01    Inicia comando bash               Execute Command
         │
00:01    npm run health:json
         │
00:03    └─ Executa 9 checks em paralelo
         │   ├─ Login & Auth (245ms)
         │   ├─ APIs & Infra (312ms)
         │   ├─ Subscriptions (189ms)
         │   ├─ ResumePass (267ms)
         │   ├─ Prime Jobs (198ms)
         │   ├─ Job Title Translator (156ms)
         │   ├─ Community (234ms)
         │   ├─ Payments (287ms)
         │   └─ Bookings (253ms)
         │
02:34    Retorna JSON (2341ms total)
         │
02:34    Parse JSON                        Parse Result
         │
02:35    Avalia condição                   IF Node
         │
         ├─ TRUE (tem problemas)
         │   │
         │   ├─ Envia Slack (500ms)        Slack Alert
         │   └─ Envia Email (1200ms)       Email Alert
         │
         └─ FALSE (tudo OK)
             │
             └─ Log Success (0ms)           Log Success
         │
04:30    Workflow completo ✅
         │
         └─ Aguarda próxima execução (9h amanhã)
```

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLUXO DE DADOS                           │
└─────────────────────────────────────────────────────────────────┘

Schedule Trigger
   │
   └─▶ {} (vazio, apenas trigger)
       │
       ▼
Execute Command
   │
   └─▶ {
         "stdout": "{\"timestamp\":\"...\", \"status\":\"healthy\", ...}",
         "stderr": "",
         "exitCode": 0
       }
       │
       ▼
Parse JSON
   │
   └─▶ {
         "status": "healthy",
         "environment": "production",
         "passed": 9,
         "warned": 0,
         "failed": 0,
         "total": 9,
         "duration_ms": 2341,
         "timestamp": "2026-02-20T09:00:00.000Z",
         "checks": [
           {
             "name": "Login & Auth",
             "status": "pass",
             "duration": 245,
             "details": { ... }
           },
           { ... }
         ],
         "hasFailures": false,
         "hasWarnings": false,
         "isCritical": false,
         "isHealthy": true,
         "isDegraded": false
       }
       │
       ▼
IF Node (Has Issues?)
   │
   ├─ TRUE → {
   │            "status": "degraded",
   │            "failed": 1,
   │            "checks": [ ... ]
   │          }
   │          │
   │          ├─▶ Slack Alert
   │          └─▶ Email Alert
   │
   └─ FALSE → {
                "status": "healthy",
                "timestamp": "..."
              }
              │
              └─▶ Log Success
```

---

## 🎯 Cenários de Execução

### Cenário A: Tudo Funcionando (Healthy)

```
9h00:00 → Cron dispara
9h00:01 → Executa health checks
9h00:03 → Resultado: 9/9 passed ✅
9h00:03 → IF: hasFailures = false
9h00:03 → Branch FALSE → Log Success
9h00:04 → Fim (sem notificação)
```

**Resultado:** Silencioso, apenas log interno do n8n.

---

### Cenário B: Warning Detectado (Degraded)

```
9h00:00 → Cron dispara
9h00:01 → Executa health checks
9h00:03 → Resultado: 8 passed, 1 warned ⚠️
9h00:03 → IF: hasWarnings = true
9h00:03 → Branch TRUE → Send Slack Alert
9h00:04 → Slack: "⚠️ ENP Hub - DEGRADED"
9h00:05 → Send Email Alert (paralelo)
9h00:06 → Fim (notificado)
```

**Resultado:** Alerta no Slack e Email com detalhes do warning.

---

### Cenário C: Falha Crítica (Down)

```
9h00:00 → Cron dispara
9h00:01 → Executa health checks
9h00:03 → Resultado: 5 passed, 4 failed 🚨
            └─ Login & Auth: FAILED (crítico!)
9h00:03 → IF: hasFailures = true, isCritical = true
9h00:03 → Branch TRUE → Send Slack Alert
9h00:04 → Slack: "🚨 ENP Hub - DOWN"
9h00:05 → Send Email Alert (urgente)
9h00:06 → Fim (alertado crítico)
```

**Resultado:** Alerta URGENTE com status DOWN.

---

## 🛠️ Customizações Comuns

### 1. Notificar Apenas Crítico

Modificar IF Node:
```javascript
{{ $json.isCritical }} == true
```

### 2. Notificar SEMPRE (incluindo sucesso)

Remover IF Node, conectar diretamente:
```
Parse JSON → Slack Alert
```

### 3. Múltiplos Canais (Escalação)

```
IF Node 1: isCritical?
  ├─ TRUE → Slack #urgent + Email + SMS
  └─ FALSE → IF Node 2: hasFailures?
               ├─ TRUE → Slack #alerts
               └─ FALSE → Log Success
```

### 4. Diferentes Horários por Ambiente

Workflow 1 (Produção):
- Cron: `0 9 * * *` (9h)
- Notifica: #prod-alerts

Workflow 2 (Staging):
- Cron: `0 */6 * * *` (a cada 6h)
- Notifica: #dev-team

---

## 📚 Referências Rápidas

### Exit Codes do Script
- `0` → Healthy
- `1` → Degraded
- `2` → Down
- `3` → Error

### Status do Relatório
- `healthy` → 9/9 passed, 0 warned
- `degraded` → 1-2 failed OU warnings
- `down` → 3+ failed OU auth failed

### Cron Expressions
- `0 9 * * *` → Diariamente 9h
- `0 9,18 * * *` → 9h e 18h
- `0 */6 * * *` → A cada 6 horas
- `*/30 * * * *` → A cada 30 minutos
- `0 9 * * 1-5` → Dias úteis 9h

---

**✅ Diagrama completo do workflow n8n para health checks ENP Hub**

Use este diagrama como referência ao configurar ou troubleshoot o workflow!
