# ⚡ n8n Quick Start - 5 Minutos para Automação

> **Meta:** Health checks rodando diariamente com notificações Slack em menos de 5 minutos.

---

## 📥 Passo 1: Importar Workflow (30s)

1. Abra n8n → **Workflows** → **Import from File**
2. Selecione: `n8n-workflow-example.json`
3. **Save**

✅ Workflow importado!

---

## 🔧 Passo 2: Configurar Comando (1min)

### Clique no nó "Execute Health Checks"

**Se Windows (seu caso):**
```bash
cd c:\Users\I335869\ENP_HUB\hub-euanapratica && npx tsx tests/health-checks/run-health-checks.ts --format=json
```

**Se Linux/Mac:**
```bash
cd /path/to/hub-euanapratica && npm run health:json
```

**Ajuste o caminho** para o seu diretório real.

✅ Comando configurado!

---

## 💬 Passo 3: Configurar Slack (2min)

### 3.1. Criar Webhook Slack

1. Acesse: https://api.slack.com/apps
2. **Create New App** → **From scratch**
3. Nome: `ENP Hub Alerts`
4. **Incoming Webhooks** → Toggle ON
5. **Add New Webhook** → Escolha canal `#health-checks`
6. **Copie a URL:**
   ```
   https://hooks.slack.com/services/T.../B.../xxx
   ```

### 3.2. Adicionar no n8n

1. Clique no nó **"Send Slack Alert"**
2. Cole a URL em **Webhook URL**
3. **Save**

✅ Slack configurado!

---

## ⏰ Passo 4: Ativar Agendamento (30s)

1. Clique no nó **"Schedule (9h diariamente)"**
2. Verifique cron: `0 9 * * *` (9h todo dia)
3. **Ajuste se quiser:**
   - `0 9,18 * * *` → 9h e 18h
   - `0 */6 * * *` → A cada 6 horas

✅ Horário definido!

---

## ✅ Passo 5: Testar e Ativar (1min)

### Teste Manual

1. **Execute Workflow** (botão superior direito)
2. Acompanhe os nós acendendo em verde
3. Verifique se mensagem chegou no Slack

### Ativar Automação

1. Toggle **Active** → ON (canto superior direito)
2. ✅ Pronto! Agora roda automaticamente às 9h

---

## 📊 O que Acontece Agora?

### Todos os dias às 9h:

```
1. n8n dispara workflow
2. Executa 9 health checks (30s~2s)
3. Verifica status:
   - ✅ Healthy (9/9 passed) → Apenas log
   - ⚠️ Degraded (warnings) → Alerta Slack
   - 🚨 Down (3+ falhas) → Alerta Slack + Email
```

### Você recebe no Slack:

```
⚠️ ENP Hub Health Check - DEGRADED

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

🕐 2026-02-20T09:00:00.000Z
🌍 Ambiente: production
```

---

## 🎯 Próximos Passos (Opcional)

### Adicionar Email (2min)

1. Clique no nó **"Send Email"**
2. **Account:** Gmail OAuth ou SMTP
3. **To:** seu email
4. **Save**

### Ajustar Notificações

**Notificar APENAS em falhas críticas:**
1. Clique no nó **"Has Issues?"**
2. Mude condição para: `{{ $json.isCritical }}`

**Notificar SEMPRE (incluindo sucessos):**
1. Delete o nó **"Has Issues?"**
2. Conecte **Parse Result** direto ao **Send Slack Alert**

### Múltiplos Ambientes

Duplique o workflow:
- **Workflow 1:** Produção (9h)
- **Workflow 2:** Staging (a cada 6h)

---

## 🐛 Troubleshooting Rápido

### ❌ "Command not found: npm"

Use caminho absoluto:
```bash
C:\Program Files\nodejs\node.exe c:\Users\...\run-health-checks.ts --format=json
```

### ❌ "JSON parsing error"

O nó Parse JSON já trata isso automaticamente. Se der erro, verifique o Output do Execute Command.

### ❌ Workflow não roda no horário

- Verifique se **Active** está ON
- Verifique timezone do n8n (Settings → Timezone)
- Ajuste cron para UTC se necessário

### ❌ Slack não recebe mensagem

- Teste webhook com curl:
  ```bash
  curl -X POST https://hooks.slack.com/services/... \
    -H 'Content-Type: application/json' \
    -d '{"text":"Teste"}'
  ```
- Recrie webhook se expirou

---

## 📚 Quer Saber Mais?

- **Guia Completo:** [N8N_AUTOMATION_GUIDE.md](./N8N_AUTOMATION_GUIDE.md)
  - Cenários avançados
  - Discord, Telegram, Email
  - Dashboard de histórico
  - Troubleshooting detalhado

- **Documentação dos Checks:** [README.md](./README.md)

---

## ✅ Checklist de Validação

Antes de considerar pronto:

- [ ] Workflow importado
- [ ] Comando ajustado para meu caminho
- [ ] Webhook Slack criado e configurado
- [ ] Teste manual executado (recebeu mensagem?)
- [ ] Workflow ativado (toggle ON)
- [ ] Horário ajustado (cron configurado)
- [ ] Testado com falha simulada (alerta funciona?)

---

**🎉 Parabéns! Automação configurada em 5 minutos.**

Agora você pode dormir tranquilo sabendo que será alertado imediatamente se algo quebrar na plataforma ENP Hub.
