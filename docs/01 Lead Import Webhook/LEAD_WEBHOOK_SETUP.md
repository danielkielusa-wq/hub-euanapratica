# Lead Webhook - Guia de Configuração Rápida

## ✅ Checklist de Configuração

### 1. Acessar Configurações de Admin
- [ ] Login como administrador
- [ ] Acessar **Admin** → **Configurações**
- [ ] Clicar na aba **"Relatórios de Carreira"**

### 2. Configurar URL do Webhook
- [ ] Inserir a URL do webhook n8n:
  ```
  https://n8n.sapunplugged.com/webhook/7df09015-3dc7-45f8-8390-54a7f3180191
  ```
- [ ] Ou substituir por sua própria URL de webhook

### 3. Configurar URL Base dos Relatórios
- [ ] Produção: `https://hub.euanapratica.com`
- [ ] Desenvolvimento: `http://localhost:5173`

### 4. Ativar o Webhook
- [ ] Ligar o switch **"Webhook Ativo"**
- [ ] Clicar em **"Salvar Configurações"**

### 5. Testar o Webhook
- [ ] Executar o script de teste no Supabase SQL Editor:
  ```sql
  -- Ver test_webhook.sql na raiz do projeto
  ```
- [ ] Verificar se o webhook chegou no n8n
- [ ] Confirmar que o payload contém o `report_link`

---

## 🔧 Configuração do n8n

### Webhook Endpoint
```
POST https://n8n.sapunplugged.com/webhook/7df09015-3dc7-45f8-8390-54a7f3180191
```

### Payload Recebido

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
  "access_token": "uuid-do-token",
  "report_link": "https://hub.euanapratica.com/report/uuid-do-token",
  "created_at": "2026-02-09T12:34:56.789Z",
  "updated_at": "2026-02-09T12:34:56.789Z"
}
```

### Campos Importantes

| Campo | Descrição | Uso Sugerido |
|-------|-----------|--------------|
| `email` | Email do lead | Enviar email de boas-vindas |
| `name` | Nome completo | Personalizar mensagens |
| `report_link` | Link do relatório | Incluir no email/SMS |
| `phone` | Telefone | Enviar WhatsApp/SMS |
| `area` | Área profissional | Segmentação |
| `english_level` | Nível de inglês | Recomendar cursos |

---

## 📊 Fluxo Sugerido no n8n

```
Webhook Recebe Lead
    ↓
Valida Dados (email, nome)
    ↓
Envia Email de Boas-Vindas
    ├─ Assunto: "Seu Diagnóstico de Carreira está pronto!"
    ├─ Corpo: Texto personalizado com link do relatório
    └─ Link CTA: {report_link}
    ↓
[Opcional] Adiciona no CRM/Planilha
    ↓
[Opcional] Notifica no Slack
    └─ Canal: #novos-leads
```

### Exemplo de Email

```html
Olá {{name}},

Seu diagnóstico de carreira internacional está pronto! 🎉

Analisamos seu perfil e preparamos um relatório personalizado
com recomendações específicas para sua jornada.

👉 Acesse seu relatório: {{report_link}}

O relatório inclui:
✅ Análise da sua prontidão atual
✅ Método ROTA EUA™ - onde você está
✅ Plano de ação personalizado
✅ Recursos recomendados

Qualquer dúvida, responda este email!

Abraços,
Equipe EUA na Prática
```

---

## 🧪 Testando a Integração

### Passo 1: Teste Manual via SQL

Execute no Supabase SQL Editor:

```sql
-- Inserir lead de teste
INSERT INTO career_evaluations (
  user_id,
  name,
  email,
  phone,
  report_content
)
SELECT
  (SELECT id FROM profiles WHERE has_role(id, 'admin') LIMIT 1),
  'Lead Teste',
  'teste@exemplo.com',
  '+5511999999999',
  'Relatório de teste'
RETURNING
  id,
  name,
  email,
  'https://hub.euanapratica.com/report/' || access_token AS report_link;
```

### Passo 2: Verificar Webhook Enviado

No Supabase SQL Editor:

```sql
SELECT
  id as request_id,
  status_code,
  content::text as response,
  created
FROM net._http_response
WHERE created > NOW() - INTERVAL '5 minutes'
ORDER BY created DESC
LIMIT 5;
```

**Status esperado**: `status_code = 200`

### Passo 3: Verificar no n8n

1. Acesse o workflow no n8n
2. Verifique os **Executions**
3. Confirme que o payload foi recebido
4. Verifique se o email foi enviado (se configurado)

---

## 🚨 Troubleshooting

### Webhook não está disparando

**Verificar se está ativo:**
```sql
SELECT value FROM app_configs WHERE key = 'lead_webhook_enabled';
-- Deve retornar: 'true'
```

**Verificar URL:**
```sql
SELECT value FROM app_configs WHERE key = 'lead_webhook_url';
-- Deve retornar a URL do n8n
```

**Verificar trigger:**
```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'trigger_notify_new_lead';
-- tgenabled deve ser 'O' (enabled)
```

### Webhook retorna erro

**Ver erros recentes:**
```sql
SELECT
  status_code,
  error_msg,
  created
FROM net._http_response
WHERE status_code != 200
ORDER BY created DESC
LIMIT 5;
```

**Erros comuns:**
- `status_code = 404`: URL do webhook incorreta
- `status_code = 500`: Erro no n8n ao processar
- `error_msg não vazio`: Problema de rede/conexão

### Report link está errado

**Verificar URL base:**
```sql
SELECT value FROM app_configs WHERE key = 'lead_report_base_url';
-- Deve ser: 'https://hub.euanapratica.com' (sem / no final)
```

**Atualizar via admin ou SQL:**
```sql
UPDATE app_configs
SET value = 'https://hub.euanapratica.com'
WHERE key = 'lead_report_base_url';
```

---

## 📝 Checklist de Produção

Antes de ir para produção, confirme:

- [ ] Webhook URL está configurada corretamente
- [ ] URL base dos relatórios é `https://hub.euanapratica.com`
- [ ] Webhook está ATIVO
- [ ] Teste enviado e recebido com sucesso no n8n
- [ ] Email de boas-vindas está configurado no n8n
- [ ] Template do email foi testado e aprovado
- [ ] Notificações internas (Slack/Discord) configuradas
- [ ] Monitoramento de erros configurado

---

## 📚 Documentação Adicional

- [LEAD_WEBHOOK.md](./LEAD_WEBHOOK.md) - Documentação técnica completa
- [REPORT_SYSTEM.md](./REPORT_SYSTEM.md) - Sistema de relatórios de carreira
- [test_webhook.sql](../test_webhook.sql) - Script de teste

---

**Versão**: 1.0
**Data**: 2026-02-09
**Status**: ✅ Pronto para produção
