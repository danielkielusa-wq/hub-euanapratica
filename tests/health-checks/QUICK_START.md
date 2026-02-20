# ⚡ Quick Start - Health Checks

Guia rápido para configurar health checks automatizados em **5 minutos**.

## 🚀 Setup Rápido

### 1. Validar Configuração

```bash
npm run health:setup
```

**Resultado esperado:**
```
✅ PASS: Variáveis de ambiente configuradas
✅ PASS: Dependências instaladas
✅ PASS: Conexão Supabase funcionando
📊 RELATÓRIO FINAL: 3/3 checks passaram
🎉 Sistema de health checks configurado com sucesso!
```

Se falhar, configure `.env` com suas credenciais Supabase.

### 2. Executar Health Checks

```bash
npm run health
```

**Output:**
```
🏥 HEALTH CHECK REPORT
============================================================
Status: HEALTHY
Passed: 6/6
Failed: 0
Duration: 1234ms
============================================================
✅ Authentication              120ms
✅ APIs                        245ms
✅ ResumePass                  178ms
✅ Prime Jobs                  156ms
✅ Job Title Translator        134ms
✅ Community                   167ms
```

### 3. Configurar Notificações (Opcional)

#### Opção A: Slack

1. Criar webhook: https://api.slack.com/messaging/webhooks
2. Adicionar ao `.env`:
   ```env
   HEALTH_CHECK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   HEALTH_CHECK_NOTIFY_ON=failures
   ```

#### Opção B: Discord

1. Server Settings > Integrations > Webhooks > New Webhook
2. Adicionar ao `.env`:
   ```env
   HEALTH_CHECK_WEBHOOK=https://discord.com/api/webhooks/123456789/abcdefg
   ```

### 4. Automatizar com n8n

1. Importar workflow: `n8n-workflow-example.json`
2. Configurar webhook Slack/Discord no workflow
3. Ativar workflow
4. Pronto! 🎉

## 📅 Executar Diariamente

### Windows Task Scheduler

```
Nome: ENP Hub Health Checks
Trigger: Diário às 9h
Action:
  - Program: npm
  - Arguments: run health:json
  - Start in: c:\Users\I335869\ENP_HUB\hub-euanapratica
```

### Linux/Mac Cron

```bash
crontab -e

# Adicionar linha:
0 9 * * * cd /path/to/hub-euanapratica && npm run health:json >> /var/log/health-checks.log 2>&1
```

## 🔔 Testando Notificações

Execute com webhook para testar:

```bash
npm run health -- --webhook=https://hooks.slack.com/services/YOUR/WEBHOOK
```

Você deve receber uma mensagem no Slack/Discord.

## ❓ Troubleshooting

### Erro: "Cannot find module"
```bash
npm install @supabase/supabase-js dotenv
```

### Erro: "VITE_SUPABASE_URL not defined"
Configure o `.env` na raiz do projeto.

### n8n: "Command not found"
Use caminho absoluto do node no Execute Command node:
- Windows: `C:\Program Files\nodejs\node.exe`
- Linux: `/usr/bin/node`

## 📚 Documentação Completa

Para mais detalhes, consulte: [README.md](./README.md)

## ✅ Checklist

- [ ] Executar `npm run health:setup` - validar configuração
- [ ] Executar `npm run health` - validar que funciona
- [ ] Configurar webhook Slack/Discord (opcional)
- [ ] Importar workflow n8n
- [ ] Ativar schedule diário
- [ ] Monitorar por 1 semana

---

**Tempo estimado:** 5 minutos
**Próximo passo:** Importar workflow n8n e ativar schedule
