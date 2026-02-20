# 🏥 Health Checks - Sistema de Monitoramento Automatizado

Sistema completo de health checks para monitorar a plataforma ENP Hub diariamente.

## 📋 O que é monitorado

| Check | Descrição | Validações |
|-------|-----------|------------|
| **Authentication** | Sistema de login e auth | RLS, profiles, session API |
| **APIs** | Saúde das APIs (Supabase) | Latência, RPC functions, Storage |
| **ResumePass** | Análise de currículos | Tabelas, quota RPC, feature flags |
| **Prime Jobs** | Vagas premium | Feature flags, bookmarks, searches |
| **Job Title Translator** | Tradutor de títulos | Tabelas, quota, feature config |
| **Community** | Sistema de comunidade | Feature flags, posts, members |

## 🚀 Como Usar

### 1. Executar Manualmente

```bash
cd c:\Users\I335869\ENP_HUB\hub-euanapratica

# Console output com cores
npm run health

# JSON output (para parsing)
npm run health:json

# Validar configuração primeiro
npm run health:setup

# Com webhook (use -- para passar argumentos)
npm run health -- --webhook=https://hooks.slack.com/services/YOUR/WEBHOOK
```

### 2. Configurar Variáveis de Ambiente

Adicione ao seu `.env`:

```env
# Obrigatório
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Opcional - Notificações
HEALTH_CHECK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK
HEALTH_CHECK_NOTIFY_ON=failures  # 'all' | 'failures' | 'critical'
```

### 3. Integrar com n8n (Recomendado)

> **⚡ Quick Start:** Siga o [N8N_QUICK_START.md](./N8N_QUICK_START.md) (5 minutos)
> **📖 Guia Completo:** [N8N_AUTOMATION_GUIDE.md](./N8N_AUTOMATION_GUIDE.md) (cenários avançados)

#### Resumo Rápido:

1. **Importar workflow:**
   - n8n → Workflows → Import from File
   - Selecione: `n8n-workflow-example.json`

2. **Configurar comando:**
   - Ajuste caminho no nó "Execute Health Checks"
   - Windows: `cd c:\Users\...\hub-euanapratica && npx tsx tests/health-checks/run-health-checks.ts --format=json`
   - Linux/Mac: `cd /path && npm run health:json`

3. **Configurar Slack:**
   - Crie webhook: https://api.slack.com/apps
   - Cole URL no nó "Send Slack Alert"

4. **Ativar:**
   - Save → Toggle Active ON
   - Teste: Execute Workflow

**Workflow executa:**
- 9 health checks em paralelo
- Parsing automático do resultado
- Notificação apenas se houver falhas/warnings
- Slack + Email configuráveis

### 4. Integrar com Cron (Linux/Mac)

```bash
# Editar crontab
crontab -e

# Adicionar linha (executa diariamente às 9h)
0 9 * * * cd /path/to/hub-euanapratica && npm run health:json >> /var/log/health-checks.log 2>&1
```

### 5. Windows Task Scheduler

1. Abra **Task Scheduler**
2. **Create Basic Task**
3. Trigger: **Daily** às 9h
4. Action: **Start a program**
   - Program: `npm`
   - Arguments: `run health:json`
   - Start in: `c:\Users\I335869\ENP_HUB\hub-euanapratica`

## 📊 Interpretando Resultados

### Exit Codes

| Code | Status | Significado |
|------|--------|-------------|
| 0 | Healthy | Todos os checks passaram ✅ |
| 1 | Degraded | 1-2 checks falharam ⚠️ |
| 2 | Critical | 3+ checks falharam 🚨 |
| 3 | Error | Erro fatal na execução ❌ |

### Status Levels

- **Healthy**: Sistema 100% funcional
- **Degraded**: Algumas features com problema, mas plataforma operacional
- **Critical**: Múltiplos sistemas críticos falhando

### Exemplo de Output (Console)

```
🏥 HEALTH CHECK REPORT
============================================================
Timestamp: 2026-02-20T09:00:00.000Z
Status: HEALTHY
Passed: 6/6
Failed: 0
Duration: 1234ms
============================================================

✅ Authentication              120ms
   profiles_accessible: true
   rls_active: true
   session_api_works: true

✅ APIs                        245ms
   supabase_api: true
   latency_ms: 89

✅ ResumePass                  178ms
   table_accessible: true
   rpc_functional: true

✅ Prime Jobs                  156ms
   feature_configured: true
   pro_enabled: true
   vip_enabled: true

✅ Job Title Translator        134ms
   table_accessible: true
   feature_configured: true

✅ Community                   167ms
   feature_configured: true
   all_plans_have_access: true

============================================================
```

### Exemplo de Output (JSON)

```json
{
  "timestamp": "2026-02-20T09:00:00.000Z",
  "total_checks": 6,
  "passed": 6,
  "failed": 0,
  "total_duration_ms": 1234,
  "status": "healthy",
  "checks": [
    {
      "name": "Authentication",
      "status": "pass",
      "duration": 120,
      "details": {
        "profiles_accessible": true,
        "rls_active": true
      }
    }
  ]
}
```

## 🔔 Notificações

### Slack

1. Criar Incoming Webhook:
   - Vá em https://api.slack.com/apps
   - **Create New App** > **Incoming Webhooks**
   - Ative e crie um webhook para o canal desejado

2. Configurar:
   ```env
   HEALTH_CHECK_WEBHOOK=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
   HEALTH_CHECK_NOTIFY_ON=failures
   ```

### Discord

1. Criar Webhook no servidor Discord:
   - Server Settings > Integrations > Webhooks
   - **New Webhook** > Copiar URL

2. Usar URL do Discord:
   ```env
   HEALTH_CHECK_WEBHOOK=https://discord.com/api/webhooks/123456789/abcdefghijklmnop
   ```

### Email

Use o Email Node no n8n ou configure SMTP diretamente.

## 🛠️ Adicionar Novos Checks

### 1. Criar arquivo de health check

```typescript
// tests/health-checks/new-feature.health.ts
import { createClient } from '@supabase/supabase-js';
import type { HealthCheckResult } from './resume-pass.health';

export async function checkNewFeature(
  supabaseUrl: string,
  supabaseKey: string
): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Seus testes aqui
    // ...

    return {
      name: 'New Feature',
      status: 'pass',
      duration: Date.now() - startTime,
      details: {
        // Detalhes opcionais
      },
    };
  } catch (error) {
    return {
      name: 'New Feature',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

### 2. Registrar no runner

Edite `tests/health-checks/index.ts`:

```typescript
import { checkNewFeature } from './new-feature.health';

// Adicione ao Promise.all
const checks = await Promise.all([
  // ... checks existentes
  checkNewFeature(supabaseUrl, supabaseKey),
]);
```

## 📈 Boas Práticas

### O que Validar

✅ **Tabelas críticas estão acessíveis**
✅ **RPC functions respondem**
✅ **Feature flags estão configurados**
✅ **RLS está ativo**
✅ **APIs têm latência aceitável**

### O que NÃO Validar

❌ **Dados de usuários reais** (use usuários de teste)
❌ **Operações destrutivas** (DELETE, UPDATE)
❌ **Chamadas externas caras** (evite APIs pagas)

### Tempo de Execução

- Cada check deve completar em **< 500ms**
- Total do suite: **< 2000ms**
- Timeout após **10s** indica problema crítico

## 🐛 Troubleshooting

### Erro: "Cannot find module"

```bash
# Instalar dependências
npm install @supabase/supabase-js dotenv
```

### Erro: "VITE_SUPABASE_URL not defined"

Verifique se `.env` está no diretório raiz e contém as variáveis corretas.

### Erro: "RPC function does not exist"

Algumas validações são permissivas - se a RPC não existir, o check passa. Ajuste conforme sua necessidade.

### n8n: "Command not found"

No nó Execute Command, use caminho absoluto do Node:
- Windows: `C:\Program Files\nodejs\node.exe`
- Linux/Mac: `/usr/bin/node` ou `/usr/local/bin/node`

## 🔐 Segurança

- ✅ Health checks usam **anon key** (não service role)
- ✅ Não acessam dados sensíveis
- ✅ Respeitam RLS policies
- ✅ Não fazem mutações no banco
- ⚠️ Webhook URLs contêm secrets - não commitar no git

## 📚 Referências

- [n8n Documentation](https://docs.n8n.io/)
- [Supabase Health Checks](https://supabase.com/docs/guides/platform/health-checks)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Discord Webhooks](https://discord.com/developers/docs/resources/webhook)

---

**Próximos Passos Recomendados:**

1. ✅ Executar health checks manualmente para validar
2. ✅ Configurar webhook Slack/Discord
3. ✅ Importar workflow n8n
4. ✅ Ativar schedule diário
5. ✅ Monitorar por 1 semana
6. ✅ Ajustar thresholds conforme necessário
