# Lead Webhook - Notificação Automática de Novos Leads

## Visão Geral

Sistema de webhook automático que notifica o n8n sempre que um novo lead é inserido na tabela `career_evaluations`.

**✨ Configurável via Admin**: Todas as configurações do webhook podem ser gerenciadas pela interface administrativa em `/admin/settings` (aba "Relatórios de Carreira").

## Configuração via Admin

### Acessando as Configurações

1. Faça login como administrador
2. Acesse **Admin** → **Configurações**
3. Selecione a aba **"Relatórios de Carreira"**

### Configurações Disponíveis

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **URL do Webhook** | Endpoint n8n que receberá os dados | `https://n8n.sapunplugged.com/webhook/...` |
| **URL Base dos Relatórios** | URL base para gerar links de relatórios | `https://hub.euanapratica.com` |
| **Webhook Ativo** | Liga/desliga o envio automático de webhooks | ON/OFF |

### Armazenamento das Configurações

Todas as configurações são armazenadas na tabela `app_configs`:

```sql
SELECT key, value FROM app_configs WHERE key LIKE 'lead_%';
```

| key | value |
|-----|-------|
| `lead_webhook_url` | URL do webhook n8n |
| `lead_webhook_enabled` | `true` ou `false` |
| `lead_report_base_url` | URL base da aplicação |

## Como Funciona

### Fluxo Automático

```
Novo Lead Inserido (career_evaluations)
  ↓
Trigger PostgreSQL (trigger_notify_new_lead)
  ↓
Função notify_new_lead()
  ↓
POST via pg_net → n8n webhook
  ↓
https://n8n.sapunplugged.com/webhook/7df09015-3dc7-45f8-8390-54a7f3180191
```

### Disparos Cobertos

O webhook é disparado automaticamente em:
- ✅ Leads importados por planilha (AdminLeadsImport)
- ✅ Leads inseridos diretamente no Supabase (SQL, Dashboard, API)
- ✅ Qualquer INSERT na tabela career_evaluations

## Payload Enviado

O webhook envia um POST com todos os campos do lead + link do relatório:

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Nome do Lead",
  "email": "lead@email.com",
  "phone": "+5511999999999",
  "area": "Tecnologia",
  "atuacao": "Product Manager",
  "trabalha_internacional": false,
  "experiencia": "10+ anos",
  "english_level": "Intermediário",
  "objetivo": "Trabalhar remoto para os EUA",
  "visa_status": "Nenhum",
  "timeline": "6-12 meses",
  "family_status": "Casado, 2 filhos",
  "income_range": "R$10.000-R$15.000",
  "investment_range": "R$5.000-R$10.000",
  "impediment": "Nenhum",
  "impediment_other": null,
  "main_concern": "Conseguir visto",
  "report_content": "...",
  "access_token": "uuid",
  "report_link": "https://hub.euanapratica.com/report/uuid",
  "created_at": "2026-02-09T...",
  "updated_at": "2026-02-09T..."
}
```

### Link do Relatório

O campo `report_link` sempre começa com:
- **Produção**: `https://hub.euanapratica.com/report/{access_token}`

Este é o link que o lead deve receber para acessar seu relatório personalizado.

## Implementação Técnica

### Arquivos

**Migrations**:
- [20260209000000_lead_webhook_trigger.sql](../supabase/migrations/20260209000000_lead_webhook_trigger.sql) - Trigger inicial
- [20260209100000_lead_webhook_config.sql](../supabase/migrations/20260209100000_lead_webhook_config.sql) - Configurações dinâmicas

**Função PostgreSQL**: `notify_new_lead()` (lê configurações de `app_configs`)

**Trigger**: `trigger_notify_new_lead` (AFTER INSERT)

**Interface Admin**: [AdminSettings.tsx](../src/pages/admin/AdminSettings.tsx) - Aba "Relatórios de Carreira"

### Tecnologia Utilizada

- **pg_net**: Extensão do Supabase para requisições HTTP assíncronas
- **Trigger**: Disparo automático após INSERT
- **SECURITY DEFINER**: Permite que a função execute com privilégios elevados

### Características

- ✅ **Assíncrono**: Não bloqueia a inserção do lead
- ✅ **Automático**: Zero configuração após deploy
- ✅ **Confiável**: Integrado ao banco de dados
- ✅ **Transparente**: Funciona independente da origem do INSERT

## Testando o Webhook

### Teste Manual via SQL

```sql
-- Inserir lead de teste
INSERT INTO career_evaluations (
  user_id,
  name,
  email,
  phone,
  report_content
) VALUES (
  (SELECT id FROM profiles WHERE email = 'admin@example.com' LIMIT 1),
  'Lead Teste',
  'teste@teste.com',
  '+5511999999999',
  'Relatório de teste'
);

-- O webhook será disparado automaticamente
```

### Teste via Importação

1. Acesse `/admin/leads/import`
2. Faça upload de uma planilha com leads
3. Os webhooks serão disparados para cada lead importado

### Verificando o Disparo

Para verificar se o webhook foi disparado:

```sql
-- Ver últimos requests do pg_net
SELECT * FROM net._http_response
ORDER BY created DESC
LIMIT 10;
```

## Monitoramento

### Logs PostgreSQL

O trigger gera logs com NOTICE:
```
NOTICE: Webhook triggered for lead teste@teste.com (request_id: 123)
```

### Status dos Requests

Verifique o status das requisições HTTP:

```sql
SELECT
  id as request_id,
  status_code,
  content::text as response,
  created
FROM net._http_response
WHERE url LIKE '%n8n.sapunplugged.com%'
ORDER BY created DESC;
```

### Troubleshooting

**Webhook não está disparando?**

1. Verifique se a extensão pg_net está ativa:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

2. Verifique se o trigger existe:
```sql
SELECT * FROM pg_trigger
WHERE tgname = 'trigger_notify_new_lead';
```

3. Teste manualmente a função:
```sql
SELECT notify_new_lead();
```

**Webhook retorna erro?**

Verifique a resposta do n8n:
```sql
SELECT
  status_code,
  content,
  error_msg
FROM net._http_response
ORDER BY created DESC
LIMIT 5;
```

## Configuração do n8n

### URL do Webhook
```
https://n8n.sapunplugged.com/webhook/7df09015-3dc7-45f8-8390-54a7f3180191
```

### Headers Esperados
```json
{
  "Content-Type": "application/json"
}
```

### Método
```
POST
```

### Autenticação
Nenhuma (webhook público com ID único)

## Alterando o Webhook URL

### Via Interface Admin (Recomendado)

1. Acesse **Admin** → **Configurações** → **Relatórios de Carreira**
2. Altere o campo **"URL do Webhook"**
3. Clique em **"Salvar Configurações"**

As mudanças são aplicadas imediatamente para os próximos leads inseridos.

### Via SQL (Alternativo)

```sql
UPDATE app_configs
SET value = 'https://nova-url.com/webhook'
WHERE key = 'lead_webhook_url';
```

### Desativar Webhook Temporariamente

Via Admin:
- Desative o switch **"Webhook Ativo"**

Via SQL:
```sql
UPDATE app_configs
SET value = 'false'
WHERE key = 'lead_webhook_enabled';
```

## Segurança

### Considerações

- ✅ O webhook inclui dados sensíveis (email, phone, etc.)
- ✅ A URL do webhook tem um UUID único para evitar abuso
- ✅ O n8n deve validar e processar os dados com segurança
- ⚠️ Não adicione autenticação básica (não suportado pelo pg_net)

### Recomendações

1. Use HTTPS (já configurado)
2. Valide o payload no n8n
3. Monitore requests suspeitos
4. Rotacione o webhook ID periodicamente se necessário

## Integrações Futuras

### Possíveis Extensões

- Webhook para atualização de leads (AFTER UPDATE)
- Webhook para acesso ao relatório (first_accessed_at)
- Notificação via email/SMS ao lead
- Log de webhooks em tabela dedicada
- Retry automático em caso de falha

### Exemplo: Log de Webhooks

```sql
CREATE TABLE webhook_logs (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT,
  payload JSONB,
  status_code INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Referências

- [Supabase pg_net Extension](https://supabase.com/docs/guides/database/extensions/pg_net)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [n8n Webhooks](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)

---

**Versão**: 1.0
**Data**: 2026-02-09
**Autor**: Development Team
