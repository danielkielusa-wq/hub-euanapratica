# 04 - Drip Campaigns (Sequencia de Nutrição)

## Objetivo e Valor

Automação de nutrição multi-etapa que é acionada após a geração do relatório de diagnóstico de carreira. O objetivo é converter leads em assinantes ou compradores através de uma sequência progressiva de mensagens que alterna entre WhatsApp e Email ao longo de 14 dias.

**Valor para o negócio:**
- Aumenta a taxa de conversão de leads que receberam o relatório mas não compraram imediatamente
- Mantém o lead engajado com conteúdo de valor antes de apresentar a oferta
- Automatiza o follow-up que antes dependia de ação manual do admin
- Combina dois canais (WhatsApp + Email) para maximizar o alcance

---

## Evento Gatilho

| Campo           | Valor                                                    |
|-----------------|----------------------------------------------------------|
| **Evento**      | `report.generated`                                       |
| **Origem**      | Edge Function `format-lead-report`                       |
| **Dispatcher**  | `dispatchN8NWebhook()` em `_shared/n8nService.ts`        |
| **Tabela N8N**  | `n8n_automations` (trigger_event = `report.generated`)   |

O evento é disparado ao final do processamento do relatório V2, após o enriquecimento de recomendações de produtos e a atualização do `career_evaluations.processing_status` para `completed`.

---

## Payload do Webhook

O payload enviado pelo `format-lead-report` contém todos os dados necessários para a campanha drip:

```json
{
  "event": "report.generated",
  "timestamp": "2026-02-24T15:30:00.000Z",
  "source": "enp_hub_supabase",
  "lead_id": "uuid-do-lead",
  "lead_name": "João Silva",
  "lead_email": "joao@example.com",
  "lead_phone": "+5511999998888",
  "access_token": "abc123token",
  "report_link": "https://hub.euanapratica.com/report/abc123token",
  "readiness_score": 65,
  "lead_temperature": "quente",
  "lead_priority_score": 72,
  "phase_id": 3,
  "phase_name": "Preparação Ativa",
  "is_tech_professional": true,
  "is_senior_level": false,
  "is_high_income": true,
  "primary_product": "Mentoria Individual 1:1",
  "barriers": ["has_english_barrier", "has_visa_barrier"]
}
```

**Campos relevantes para a campanha drip:**
- `lead_id` — Identificador do lead (usado em todas as chamadas)
- `lead_name` — Nome para personalização dos templates
- `lead_email` — Email do lead (usado pelo send-lead-email)
- `lead_phone` — Telefone (usado pelo send-whatsapp)
- `report_link` — Link público do relatório
- `primary_product` — Produto recomendado (usado no D14 para oferta personalizada)
- `lead_temperature` — Temperatura do lead (para filtrar quem já converteu)

---

## Fluxo da Sequência

```
                         report.generated
                              |
                              v
                   +---------------------+
                   |   Webhook (N8N)     |
                   |   Recebe payload    |
                   +---------------------+
                              |
                   [Verifica: lead já é assinante?]
                        |              |
                       SIM            NÃO
                        |              |
                     (FIM)             v
                              +------------------+
                         D0   | WhatsApp         |
                              | drip_d0_welcome  |
                              +------------------+
                                       |
                                 [Wait 3 dias]
                                       |
                                       v
                              +------------------+
                         D3   | Email            |
                              | drip_d3_value    |
                              +------------------+
                                       |
                                 [Wait 4 dias]
                                       |
                                       v
                              +------------------+
                         D7   | WhatsApp         |
                              | drip_d7_tips     |
                              +------------------+
                                       |
                                 [Wait 7 dias]
                                       |
                                       v
                   [Verifica: lead já é assinante?]
                        |              |
                       SIM            NÃO
                        |              |
                     (FIM)             v
                              +------------------+
                        D14   | Email            |
                              | drip_d14_offer   |
                              | (com oferta)     |
                              +------------------+
                                       |
                                     (FIM)
```

### Detalhamento de Cada Etapa

| Dia | Canal    | Template               | Objetivo                                    |
|-----|----------|------------------------|---------------------------------------------|
| D0  | WhatsApp | `drip_d0_welcome`      | Boas-vindas, confirmar entrega do relatório  |
| D3  | Email    | `drip_d3_value`        | Conteúdo de valor relacionado ao diagnóstico |
| D7  | WhatsApp | `drip_d7_tips`         | Dicas práticas baseadas nas barreiras do lead|
| D14 | Email    | `drip_d14_offer`       | Oferta personalizada do produto recomendado  |

---

## Configuração N8N

### Node 1: Webhook Trigger

- **Tipo**: Webhook
- **Método**: POST
- **Path**: `/drip-campaign` (ou o path configurado na URL do webhook)
- **Authentication**: Nenhuma (o N8N service já valida via `n8n_automations`)

### Node 2: Verificação Inicial — Lead Já Assinou?

Antes de iniciar a sequência, verificar se o lead já tem assinatura ativa via Supabase REST API:

```
GET https://seqgnxynrcylxsdzbloa.supabase.co/rest/v1/subscriptions
  ?user_id=eq.{{ $json.lead_id }}
  &status=eq.active
  &select=id
  &limit=1
```

**Headers:**
```
apikey: SUPABASE_ANON_KEY
Authorization: Bearer SERVICE_ROLE_KEY
```

**Condição:** Se retornar resultado, encerrar o fluxo (lead já converteu).

### Node 3: D0 — WhatsApp Boas-Vindas

**Tipo**: HTTP Request

```
POST https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/send-whatsapp
```

**Headers:**
```
Content-Type: application/json
x-internal-secret: INTERNAL_FUNCTION_SECRET
```

**Body:**
```json
{
  "lead_id": "{{ $json.lead_id }}",
  "template_name": "drip_d0_welcome",
  "variables": {
    "{{leadName}}": "{{ $json.lead_name }}",
    "{{reportLink}}": "{{ $json.report_link }}"
  }
}
```

### Node 4: Wait 3 Dias

**Tipo**: Wait
**Resume**: After time interval = 3 days

### Node 5: D3 — Email de Valor

**Tipo**: HTTP Request

```
POST https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/send-lead-email
```

**Headers:**
```
Content-Type: application/json
x-internal-secret: INTERNAL_FUNCTION_SECRET
```

**Body:**
```json
{
  "lead_id": "{{ $json.lead_id }}",
  "template_name": "drip_d3_value",
  "variables": {
    "{{leadName}}": "{{ $json.lead_name }}",
    "{{reportLink}}": "{{ $json.report_link }}"
  }
}
```

### Node 6: Wait 4 Dias

**Tipo**: Wait
**Resume**: After time interval = 4 days

### Node 7: D7 — WhatsApp Dicas

**Tipo**: HTTP Request

```
POST https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/send-whatsapp
```

**Headers:**
```
Content-Type: application/json
x-internal-secret: INTERNAL_FUNCTION_SECRET
```

**Body:**
```json
{
  "lead_id": "{{ $json.lead_id }}",
  "template_name": "drip_d7_tips",
  "variables": {
    "{{leadName}}": "{{ $json.lead_name }}",
    "{{reportLink}}": "{{ $json.report_link }}"
  }
}
```

### Node 8: Wait 7 Dias

**Tipo**: Wait
**Resume**: After time interval = 7 days

### Node 9: Verificação Pré-Oferta — Lead Já Assinou?

Mesma query do Node 2. Se lead converteu durante a sequência, encerrar sem enviar a oferta.

### Node 10: D14 — Email de Oferta

**Tipo**: HTTP Request

```
POST https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/send-lead-email
```

**Headers:**
```
Content-Type: application/json
x-internal-secret: INTERNAL_FUNCTION_SECRET
```

**Body:**
```json
{
  "lead_id": "{{ $json.lead_id }}",
  "template_name": "drip_d14_offer",
  "variables": {
    "{{leadName}}": "{{ $json.lead_name }}",
    "{{reportLink}}": "{{ $json.report_link }}",
    "{{offerName}}": "{{ $json.primary_product }}",
    "{{offerDescription}}": "<descrição derivada do primary_product>",
    "{{offerUrl}}": "https://hub.euanapratica.com/assinar"
  }
}
```

**Variáveis do D14:**

| Variável               | Origem                                         | Exemplo                                   |
|------------------------|-------------------------------------------------|-------------------------------------------|
| `{{offerName}}`        | `payload.primary_product`                       | "Mentoria Individual 1:1"                 |
| `{{offerDescription}}` | Derivada do `primary_product` (mapeamento N8N)  | "Acompanhamento personalizado com mentor" |
| `{{offerUrl}}`         | URL de checkout do produto ou `/assinar`         | "https://hub.euanapratica.com/assinar"    |

Para mapear o `primary_product` para `offerDescription` e `offerUrl`, use um node **Switch** ou **Code** no N8N:

```javascript
// Node Code - Mapear oferta
const productMap = {
  "Mentoria Individual 1:1": {
    description: "Acompanhamento personalizado com mentor especializado em carreiras internacionais",
    url: "https://hub.euanapratica.com/servico/mentoria-individual"
  },
  "Plano Pro": {
    description: "Acesso completo ao Hub com todas as ferramentas e conteúdos exclusivos",
    url: "https://hub.euanapratica.com/assinar"
  },
  // ... outros produtos
};

const product = $json.primary_product || "Plano Pro";
const mapped = productMap[product] || productMap["Plano Pro"];

return {
  offerName: product,
  offerDescription: mapped.description,
  offerUrl: mapped.url,
};
```

---

## Edge Functions Envolvidas

### send-whatsapp

| Campo             | Valor                                                    |
|-------------------|----------------------------------------------------------|
| **Endpoint**      | `POST /functions/v1/send-whatsapp`                       |
| **Autenticação**  | `x-internal-secret` (header) OU JWT admin                |
| **verify_jwt**    | `false` em `config.toml`                                 |
| **Input**         | `{ lead_id, template_name, variables? }`                 |
| **Output**        | `{ success, messageId, interactionId }`                  |
| **Efeito CRM**    | Insere `lead_interactions` (type: `whatsapp_sent`)       |
| **Canal**         | Evolution API (WhatsApp Business)                        |

**Variáveis auto-preenchidas** (não precisa enviar se o template usar):
- `{{leadName}}` — Nome do lead (da tabela `career_evaluations`)
- `{{reportLink}}` — Link do relatório (montado com `access_token`)
- `{{leadEmail}}` — Email do lead

### send-lead-email

| Campo             | Valor                                                    |
|-------------------|----------------------------------------------------------|
| **Endpoint**      | `POST /functions/v1/send-lead-email`                     |
| **Autenticação**  | `x-internal-secret` (header) OU JWT admin                |
| **verify_jwt**    | `false` em `config.toml`                                 |
| **Input**         | `{ lead_id, template_name, variables? }`                 |
| **Output**        | `{ success, emailSent, message }`                        |
| **Efeito CRM**    | Insere `lead_interactions` (type: `email_sent`)          |
| **Canal**         | Resend API (via `emailTemplateService`)                  |

**Variáveis auto-preenchidas:**
- `{{leadName}}` — Nome do lead
- `{{reportLink}}` — Link do relatório
- `{{leadEmail}}` — Email do lead

---

## Registro no CRM

Cada chamada às Edge Functions `send-whatsapp` e `send-lead-email` **automaticamente** insere um registro na tabela `lead_interactions`. Não é necessário nenhum insert manual pelo N8N.

### lead_interactions — Registro Automático

```
+------------------------------------------------------------+
| lead_interactions                                          |
+------------------------------------------------------------+
| id          | UUID (auto)                                  |
| lead_id     | UUID do lead                                 |
| type        | 'whatsapp_sent' ou 'email_sent'              |
| content     | Texto da mensagem ou "Email template: ..."   |
| direction   | 'outbound'                                   |
| channel     | 'whatsapp' ou 'email'                        |
| created_by  | NULL (chamada interna, sem JWT de admin)      |
| metadata    | { template_name, delivery_status/email_sent } |
| created_at  | Timestamp automático                         |
+------------------------------------------------------------+
```

**Nota:** Quando a chamada usa `x-internal-secret` (sem JWT de admin), o campo `created_by` será `NULL`. Isso é esperado para envios automatizados.

### Timeline do Lead no CRM

Após a execução da campanha completa, a timeline do lead mostrará:

```
D0  [WhatsApp] drip_d0_welcome  — Boas-vindas
D3  [Email]    drip_d3_value    — Conteúdo de valor
D7  [WhatsApp] drip_d7_tips     — Dicas práticas
D14 [Email]    drip_d14_offer   — Oferta personalizada
```

---

## Templates Necessários

Antes de ativar a automação, criar os seguintes templates:

### WhatsApp Templates (tabela `whatsapp_templates`)

| name               | category    | body (exemplo)                                                   |
|--------------------|-------------|------------------------------------------------------------------|
| `drip_d0_welcome`  | `drip`      | "Olá {{leadName}}! Seu relatório de carreira está pronto: {{reportLink}}" |
| `drip_d7_tips`     | `drip`      | "{{leadName}}, separei dicas práticas baseadas no seu diagnóstico..." |

Criar via Admin UI em `/admin/whatsapp-templates`.

### Email Templates (tabela `email_templates`)

| name               | category    | subject (exemplo)                                                |
|--------------------|-------------|------------------------------------------------------------------|
| `drip_d3_value`    | `drip`      | "{{leadName}}, 3 insights do seu diagnóstico de carreira"        |
| `drip_d14_offer`   | `drip`      | "{{leadName}}, uma oportunidade pensada para você"               |

Criar via Admin UI em `/admin/email-templates` (editor Unlayer WYSIWYG).

---

## Considerações Importantes

### Opt-Out / Unsubscribe

- **Email**: O template de email deve incluir link de unsubscribe (Resend gerencia automaticamente)
- **WhatsApp**: Se o lead responder "SAIR" ou "PARAR", o webhook de recebimento (`receive-whatsapp-webhook`) deve marcar o lead como opted-out
- **Verificação**: Adicionar um check no início de cada envio (ou antes do Wait) para consultar se o lead optou por sair

### Leads que Já Converteram

A sequência inclui **dois pontos de verificação**:
1. **Antes de iniciar** (Node 2): Não inicia se já é assinante
2. **Antes da oferta D14** (Node 9): Não envia oferta se converteu durante a nutrição

A verificação consulta `subscriptions.status = 'active'` e opcionalmente `user_hub_services` para compras avulsas.

### Deduplicação

- O N8N deve garantir que o mesmo `lead_id` não receba a campanha drip mais de uma vez
- Usar o recurso de deduplicação do N8N (ou manter um log de leads que já entraram na sequência)
- Alternativa: consultar `lead_interactions` para verificar se `drip_d0_welcome` já foi enviado para esse lead

### Horários de Envio

- Configurar os Wait nodes para que os envios caiam em horários comerciais (9h-18h BRT)
- O N8N pode usar o node **Schedule Trigger** combinado com o Wait para garantir o horário
- Evitar envios em finais de semana (especialmente WhatsApp)

---

## Troubleshooting

### Mensagem não foi enviada

1. **Verificar logs do N8N**: O node de HTTP Request falhou?
2. **Verificar `n8n_webhook_logs`**: O webhook inicial chegou?
   ```sql
   SELECT * FROM n8n_webhook_logs
   WHERE trigger_event = 'report.generated'
   ORDER BY created_at DESC LIMIT 10;
   ```
3. **Verificar resposta da Edge Function**: O campo `success` retornou `false`?
   - `"Lead não encontrado"` — `lead_id` inválido
   - `"Lead não possui telefone cadastrado"` — campo `phone` vazio em `career_evaluations`
   - `"Lead não possui email cadastrado"` — campo `email` vazio em `career_evaluations`
   - `"Template '...' não encontrado ou desativado"` — template não existe ou `enabled = false`

### Template não encontrado

1. Verificar se o template existe e está habilitado:
   ```sql
   -- WhatsApp
   SELECT name, enabled FROM whatsapp_templates
   WHERE name IN ('drip_d0_welcome', 'drip_d7_tips');

   -- Email
   SELECT name, enabled FROM email_templates
   WHERE name IN ('drip_d3_value', 'drip_d14_offer');
   ```
2. Templates são buscados via RPC `get_whatsapp_template_by_name` (WhatsApp) e `get_email_template_by_name` (Email), que filtram por `enabled = true`.

### Variáveis não substituídas no template

1. As variáveis usam o formato `{{variableName}}` (com chaves duplas)
2. O `send-whatsapp` faz merge de variáveis padrão (leadName, reportLink, leadEmail) com as variáveis enviadas no payload
3. O `send-lead-email` faz o mesmo merge
4. Se uma variável não for fornecida E não tiver valor padrão, aparecerá como `{{variableName}}` literal no texto

### Erro de autenticação (401/403)

1. **Gateway 401** (`{"code":401}`): Falta `verify_jwt = false` em `config.toml` para a função
2. **Function 401** (`{"error":"Unauthorized"}`): O header `x-internal-secret` está incorreto ou ausente
3. Verificar se o `INTERNAL_FUNCTION_SECRET` no N8N coincide com o valor no Supabase:
   ```bash
   npx supabase secrets list
   ```

### Wait node não resume

1. O N8N precisa estar rodando continuamente (não pode ser reiniciado durante a execução)
2. Se o N8N for reiniciado, execuções com Wait em andamento serão perdidas
3. **Alternativa robusta**: Em vez de Wait nodes longos, usar Cron triggers separados que consultam uma tabela de controle
4. Verificar se o N8N tem armazenamento persistente configurado para a fila de execuções

### Lead recebendo campanha duplicada

1. Verificar se o `format-lead-report` está disparando múltiplos webhooks (cache vs refresh)
2. O `dispatchN8NWebhook` é chamado tanto no fluxo normal quanto no `forceRefresh` — se o admin forçar refresh, pode gerar duplicata
3. **Solução**: No Node 2 (verificação inicial), além de checar assinatura, verificar se já existe `lead_interactions` com `metadata->template_name = 'drip_d0_welcome'` para esse lead

---

## Registro na Tabela n8n_automations

Para que esta automação funcione, deve existir um registro na tabela `n8n_automations`:

```sql
INSERT INTO n8n_automations (
  name,
  description,
  trigger_event,
  webhook_url,
  webhook_method,
  headers,
  timeout_ms,
  max_retries,
  enabled
) VALUES (
  'Drip Campaign - Nutrição Pós-Relatório',
  'Sequência de 4 mensagens (WhatsApp + Email) ao longo de 14 dias após geração do relatório',
  'report.generated',
  'https://SEU_N8N_HOST/webhook/drip-campaign',
  'POST',
  '{}',
  10000,
  2,
  true
);
```

**Importante:** Substituir `SEU_N8N_HOST` pela URL real da instância N8N.
