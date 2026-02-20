# 📚 Health Checks - Índice de Documentação

Sistema completo de monitoramento automático para ENP Hub com 9 health checks críticos rodando diariamente.

---

## 🚀 Por Onde Começar?

### 1️⃣ Primeira vez? Leia isto primeiro
📄 **[QUICK_START.md](./QUICK_START.md)**
- Validar setup local
- Entender o que é verificado
- Executar primeiro health check manual

### 2️⃣ Quer automatizar no n8n em 5 minutos?
⚡ **[N8N_QUICK_START.md](./N8N_QUICK_START.md)**
- Importar workflow pronto
- Configurar Slack em 2 minutos
- Ativar agendamento diário

### 3️⃣ Quer entender tudo em detalhes?
📖 **[N8N_AUTOMATION_GUIDE.md](./N8N_AUTOMATION_GUIDE.md)**
- Guia completo passo a passo
- Configurar Discord, Email, Telegram
- Cenários avançados (múltiplos ambientes, dashboard)
- Troubleshooting detalhado

### 4️⃣ Referência técnica
📘 **[README.md](./README.md)**
- Lista completa dos 9 health checks
- Comandos npm disponíveis
- Interpretação de resultados
- Como adicionar novos checks

---

## 📂 Estrutura de Arquivos

```
tests/health-checks/
├── 📄 INDEX.md                           ← Você está aqui
├── 📄 README.md                          ← Referência técnica
├── 📄 QUICK_START.md                     ← Guia inicial (5min)
├── 📄 N8N_QUICK_START.md                 ← n8n em 5min ⚡
├── 📄 N8N_AUTOMATION_GUIDE.md            ← Guia completo n8n 📖
│
├── 🔧 Configuração
│   ├── .env.example                      ← Template de variáveis
│   ├── test-setup.ts                     ← Validar pré-requisitos
│   └── n8n-workflow-example.json         ← Workflow n8n pronto
│
├── 🏥 Health Checks (9 checks)
│   ├── types.ts                          ← Tipos TypeScript
│   ├── index.ts                          ← Runner (executa todos)
│   ├── run-health-checks.ts              ← CLI com formatação
│   ├── auth.health.ts                    ← Login & Auth
│   ├── apis.health.ts                    ← APIs & Infraestrutura
│   ├── subscriptions.health.ts           ← Planos & Assinaturas
│   ├── resume-pass.health.ts             ← Currículo USA
│   ├── prime-jobs.health.ts              ← Prime Jobs
│   ├── job-title-translator.health.ts    ← Job Title Translator
│   ├── community.health.ts               ← Comunidade
│   ├── payments.health.ts                ← Pagamentos & TICTO
│   └── bookings.health.ts                ← Agendamentos
```

---

## 🎯 Fluxos de Uso Comum

### Cenário 1: "Nunca usei isso, quero começar"
1. Ler [QUICK_START.md](./QUICK_START.md) (5min)
2. Executar: `npm run health:setup` (validar)
3. Executar: `npm run health` (ver resultados)
4. Seguir [N8N_QUICK_START.md](./N8N_QUICK_START.md) (automação)

### Cenário 2: "Quero automação no n8n AGORA"
1. Abrir [N8N_QUICK_START.md](./N8N_QUICK_START.md)
2. Importar `n8n-workflow-example.json`
3. Configurar Slack
4. Ativar (5min total)

### Cenário 3: "Preciso configurar email/discord/múltiplos ambientes"
1. Abrir [N8N_AUTOMATION_GUIDE.md](./N8N_AUTOMATION_GUIDE.md)
2. Seção "Configurar Notificações" → Discord/Email
3. Seção "Cenários Avançados" → Múltiplos ambientes

### Cenário 4: "Health check está falhando, o que fazer?"
1. Executar: `npm run health` (ver detalhes)
2. Consultar [N8N_AUTOMATION_GUIDE.md](./N8N_AUTOMATION_GUIDE.md) → Troubleshooting
3. Verificar tabelas/RPCs/edge functions no Supabase

### Cenário 5: "Quero adicionar um novo health check"
1. Consultar [README.md](./README.md) → "Adicionar Novos Checks"
2. Copiar estrutura de `auth.health.ts`
3. Registrar em `index.ts`

---

## 🏥 O que é Verificado?

| # | Health Check | Crítico? | Validações |
|---|--------------|----------|------------|
| 1 | **Login & Auth** | ✅ | Auth API, profiles, roles, RLS, RPC get_full_plan_access |
| 2 | **APIs & Infra** | ✅ | Frontend online, latência Supabase, Storage, hub_services |
| 3 | **Planos & Assinaturas** | ✅ | 3 planos (Básico/Pro/VIP), preços, features, usage_logs |
| 4 | **Currículo USA** | ⚠️ | ResumePass: RPC get_user_quota, resumepass_reports, edge fn |
| 5 | **Prime Jobs** | ⚠️ | Feature flags, RPCs quota/stats, job_bookmarks |
| 6 | **Job Title Translator** | ⚠️ | Tabela, feature flags, edge function translate-title |
| 7 | **Comunidade** | ⚠️ | Posts, comments, categories, ranking, gamificação |
| 8 | **Pagamentos & TICTO** | ✅ | payment_logs, ticto-webhook fn, checkout URLs |
| 9 | **Agendamentos** | ⚠️ | Bookings, mentor_availability, email functions |

**Legenda:**
- ✅ **Crítico:** Se falhar, plataforma pode estar DOWN
- ⚠️ **Importante:** Feature específica pode estar offline, mas plataforma funciona

**Status Geral:**
- `healthy` → 9/9 passed
- `degraded` → 1-2 failed ou warnings
- `down` → 3+ failed OU auth failed

---

## ⚡ Comandos Rápidos

```bash
# Validar configuração
npm run health:setup

# Executar health checks (console)
npm run health

# Executar health checks (JSON)
npm run health:json

# Com webhook (notificar diretamente)
npm run health -- --webhook=https://hooks.slack.com/services/...

# Watch mode (re-executa ao salvar arquivos)
npm run health:watch
```

---

## 🔔 Notificações Configuráveis

### Slack
- Mensagens formatadas com emojis
- Detalhes de falhas e warnings
- Configuração em 2 minutos

### Discord
- Embeds coloridos por severidade
- Webhooks simples

### Email
- HTML formatado
- SMTP ou SendGrid

### Telegram
- Bot personalizado
- Mensagens instantâneas

**Veja:** [N8N_AUTOMATION_GUIDE.md](./N8N_AUTOMATION_GUIDE.md) → "Configurar Notificações"

---

## 📊 Interpretação de Resultados

### Exit Codes
- `0` → Healthy (tudo OK)
- `1` → Degraded (warnings ou 1-2 falhas)
- `2` → Down (3+ falhas ou auth offline)
- `3` → Error (falha fatal na execução)

### Console Output
```
✅ ENP Hub Health Report — HEALTHY
═════════════════════════════════════════════════════════════════
  Timestamp:  2026-02-20T09:00:00.000Z
  Env:        production
  Duration:   2341ms
  Results:    9 passed, 0 warned, 0 failed / 9 total
─────────────────────────────────────────────────────────────────
  ✅ Login & Auth                    245ms
  ✅ APIs & Infraestrutura           312ms
  ✅ Planos & Assinaturas           189ms
  ✅ Currículo USA                   267ms
  ✅ Prime Jobs                      198ms
  ✅ Job Title Translator            156ms
  ✅ Comunidade                      234ms
  ✅ Pagamentos & TICTO              287ms
  ✅ Agendamentos (Bookings)         253ms
─────────────────────────────────────────────────────────────────
═════════════════════════════════════════════════════════════════
```

---

## 🆘 Precisa de Ajuda?

### Por Tipo de Problema

| Problema | Consultar |
|----------|-----------|
| Health check falhando | [N8N_AUTOMATION_GUIDE.md](./N8N_AUTOMATION_GUIDE.md) → Troubleshooting |
| Erro ao executar npm run health | [QUICK_START.md](./QUICK_START.md) → Pré-requisitos |
| n8n não roda no horário | [N8N_AUTOMATION_GUIDE.md](./N8N_AUTOMATION_GUIDE.md) → Troubleshooting |
| Slack não recebe mensagem | [N8N_AUTOMATION_GUIDE.md](./N8N_AUTOMATION_GUIDE.md) → Configurar Slack |
| Adicionar novo check | [README.md](./README.md) → Adicionar Novos Checks |

### Problemas Comuns

**"MODULE_NOT_FOUND"**
→ `npm install @supabase/supabase-js dotenv`

**"VITE_SUPABASE_URL not defined"**
→ Copiar `.env.example` para `.env` e preencher

**"Command not found: npm" (n8n)**
→ Usar caminho absoluto do Node.js

**"JSON parsing error"**
→ Já tratado automaticamente no Parse JSON node

---

## 🎓 Conceitos Importantes

### Health Check = Verificação Automatizada
- Testa se uma funcionalidade está online
- Retorna: `pass`, `warn`, ou `fail`
- Executa em ~200-500ms cada

### Status Geral
- **healthy:** Tudo funcionando (9/9 passed)
- **degraded:** Alguns warnings ou 1-2 falhas
- **down:** Sistema comprometido (3+ falhas OU auth offline)

### Notificação Inteligente
- **healthy:** Não notifica (silencioso)
- **degraded:** Notifica Slack/Email (atenção)
- **down:** Notifica urgente (crítico)

### Agendamento Cron
- `0 9 * * *` = Todo dia às 9h
- `0 */6 * * *` = A cada 6 horas
- `*/30 * * * *` = A cada 30 minutos

---

## 📅 Roadmap Sugerido

### Fase 1: Setup Inicial (Hoje)
- [ ] Executar `npm run health:setup`
- [ ] Executar `npm run health` (ver resultados)
- [ ] Validar que 9/9 checks passam

### Fase 2: Automação n8n (Amanhã)
- [ ] Importar workflow n8n
- [ ] Configurar Slack
- [ ] Ativar agendamento diário

### Fase 3: Monitoramento (Semana 1)
- [ ] Monitorar por 1 semana
- [ ] Ajustar thresholds se necessário
- [ ] Adicionar email (opcional)

### Fase 4: Expansão (Opcional)
- [ ] Múltiplos ambientes (staging + prod)
- [ ] Dashboard de histórico (Grafana)
- [ ] Alertas escalados (SMS, PagerDuty)

---

## ✅ Checklist de Produção

Antes de considerar "pronto para produção":

- [ ] Health checks executam manualmente com sucesso (9/9 passed)
- [ ] Workflow n8n importado e testado
- [ ] Notificação Slack/Email configurada e validada
- [ ] Teste de falha simulada (alerta funciona?)
- [ ] Workflow ativado (Active = ON)
- [ ] Agendamento configurado (cron correto)
- [ ] Monitorado por pelo menos 3 dias
- [ ] Documentado onde equipe pode ver status

---

**🎉 Sistema de Monitoramento Completo**

Com este sistema, você tem:
- ✅ 9 health checks cobrindo toda a plataforma
- ✅ Automação diária via n8n
- ✅ Notificações inteligentes (Slack/Email)
- ✅ Documentação completa e exemplos
- ✅ Exit codes para integração CI/CD
- ✅ Extensível para novos checks

**Durma tranquilo sabendo que será alertado se algo quebrar! 😴**
