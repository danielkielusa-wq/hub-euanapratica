# Validação E2E — Integração ManyChat + CRM

> Guia passo a passo para validar toda a integração ManyChat no sistema.
> Siga cada seção na ordem. Cada etapa indica o que fazer, onde verificar e o resultado esperado.

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Etapa 1 — Banco de Dados](#2-etapa-1--banco-de-dados)
3. [Etapa 2 — Página Admin de Flows](#3-etapa-2--página-admin-de-flows)
4. [Etapa 3 — Configurar o ManyChat](#4-etapa-3--configurar-o-manychat)
5. [Etapa 4 — Configurar o N8N](#5-etapa-4--configurar-o-n8n)
6. [Etapa 5 — Disparo Manual (Outbound)](#6-etapa-5--disparo-manual-outbound)
7. [Etapa 6 — Fallback por Email](#7-etapa-6--fallback-por-email)
8. [Etapa 7 — Retorno do ManyChat (Inbound)](#8-etapa-7--retorno-do-manychat-inbound)
9. [Etapa 8 — Timeline do CRM](#9-etapa-8--timeline-do-crm)
10. [Etapa 9 — Cenários de Erro](#10-etapa-9--cenários-de-erro)
11. [Etapa 10 — Checklist Final](#11-etapa-10--checklist-final)
12. [Referência: Payloads e Endpoints](#12-referência-payloads-e-endpoints)

---

## 1. Pré-requisitos

Antes de começar, confirme que você tem:

- [ ] Acesso de **admin** ao sistema (hub.euanapratica.com)
- [ ] Acesso ao painel do **ManyChat** (app.manychat.com)
- [ ] Acesso ao **N8N** (n8n.euanapratica.com)
- [ ] Acesso ao **Supabase Dashboard** (supabase.com/dashboard/project/seqgnxynrcylxsdzbloa)
- [ ] Um **lead de teste** no CRM com:
  - Telefone válido (com WhatsApp ativo)
  - Email válido
- [ ] Um **segundo lead de teste** sem telefone (para testar fallback por email)

---

## 2. Etapa 1 — Banco de Dados

**Objetivo:** Confirmar que as tabelas e seeds foram criados corretamente.

### 2.1 Verificar tabela `manychat_flows`

1. Abra o Supabase Dashboard → **Table Editor** → `manychat_flows`
2. Confirme que existem **8 registros** (flows):

| # | `name` | `display_name` | `use_case` | `trigger_type` |
|---|--------|-----------------|------------|----------------|
| 1 | `report_delivery` | Envio do Relatório | report | both |
| 2 | `report_feedback` | Feedback do Relatório | feedback | both |
| 3 | `mentoring_individual` | Mentoria Individual | mentoring | manual |
| 4 | `mentoring_group` | Mentoria em Grupo | mentoring | manual |
| 5 | `platform_invite` | Convite para Plataforma | invite | both |
| 6 | `live_invite` | Convite para Live | live | manual |
| 7 | `post_consultation_followup` | Follow-up Pós-Consultoria | followup | both |
| 8 | `cold_lead_reengagement` | Reengajamento de Leads Frios | reengagement | both |

3. Confirme que todos os flows têm:
   - `enabled = true`
   - `hsm_template_preview` preenchido (texto com `{{variáveis}}`)
   - `hsm_template_params` como array JSON (ex: `[{"position":1,"variable":"leadName"}]`)
   - `variables` como array JSON (ex: `[{"key":"leadName","auto":true}]`)
   - `mc_flow_ns` = `null` (será preenchido depois de criar os flows no ManyChat)

4. Confirme que o campo `email_fallback_template` tem valor para estes flows:
   - `report_delivery` → `report_ready`
   - `report_feedback` → `report_feedback_request`
   - `mentoring_individual` → `mentoring_interest_individual`
   - `mentoring_group` → `mentoring_interest_group`
   - `platform_invite` → `espaco_invitation`
   - `live_invite` → `live_promotion`
   - `post_consultation_followup` → `null` (sem fallback)
   - `cold_lead_reengagement` → `null` (sem fallback)

### 2.2 Verificar tabela `manychat_flow_logs`

1. No Table Editor → `manychat_flow_logs`
2. A tabela deve existir e estar **vazia** (será populada durante os testes)
3. Confirme as colunas: `id`, `lead_id`, `flow_id`, `flow_name`, `channel`, `trigger_source`, `triggered_by`, `status`, `metadata`, `created_at`

### 2.3 Verificar automação N8N

1. Table Editor → `n8n_automations`
2. Procure o registro com `name = 'manychat_trigger_flow'`
3. Confirme:
   - `trigger_event` = `manychat.trigger_flow`
   - `webhook_url` = `https://n8n.euanapratica.com/webhook/manychat-trigger-flow`
   - `enabled` = `true`
   - `category` = `lead`

### 2.4 Verificar webhook secret

1. Table Editor → `app_configs`
2. Procure `config_key = 'manychat_webhook_secret'`
3. O `config_value` estará vazio — **você precisa definir uma senha forte aqui**
4. Clique para editar, coloque um valor seguro (ex: gere com `openssl rand -hex 32`)
5. **Anote esse valor** — você vai precisar dele para configurar o ManyChat (Etapa 3)

### 2.5 Verificar constraint de `lead_interactions`

1. No SQL Editor do Supabase, execute:
   ```sql
   SELECT conname, pg_get_constraintdef(oid)
   FROM pg_constraint
   WHERE conrelid = 'public.lead_interactions'::regclass
     AND conname = 'lead_interactions_type_check';
   ```
2. O resultado deve incluir `'manychat_flow_sent'` e `'manychat_reply'` na lista de tipos permitidos

**Resultado esperado:** Todas as tabelas existem, 8 flows seedados, automação N8N registrada, secret configurado.

---

## 3. Etapa 2 — Página Admin de Flows

**Objetivo:** Validar a interface de gestão de flows no sistema.

### 3.1 Acessar a página

1. Faça login como admin em hub.euanapratica.com
2. No menu lateral, procure **"Flows ManyChat"** (ícone de balão de chat)
3. Clique para abrir

**Resultado esperado:** A página carrega e mostra 8 cards, um para cada flow.

### 3.2 Verificar os cards

Para cada card, confirme que mostra:

- **Nome grande** (display_name) — ex: "Envio do Relatório"
- **Nome técnico** (fonte mono, cinza) — ex: `report_delivery`
- **Badge de caso de uso** (colorido) — ex: "Relatório" em indigo
- **Badge de trigger** — ex: "Auto + Manual", "Manual", etc.
- **Badge de HSM** — "Sem HSM" (em cinza, porque `hsm_template_name` ainda está vazio)
- **Alerta amarelo**: "mc_flow_ns não configurado — edite para preencher"
- **Toggle** de ativado/desativado (todos devem estar ativados)
- **Botão de edição** (ícone de lápis)

### 3.3 Testar toggle (ativar/desativar)

1. Escolha o flow "Reengajamento de Leads Frios"
2. Clique no **toggle** para desativar
3. **Resultado:** Toast "Flow desativado", toggle fica cinza
4. Clique novamente para reativar
5. **Resultado:** Toast "Flow ativado", toggle fica verde

### 3.4 Testar edição de flow

1. No card "Envio do Relatório", clique no **ícone de lápis** (editar)
2. O dialog deve abrir com título "Editar Flow: Envio do Relatório"
3. Preencha os campos:
   - **ManyChat Flow NS (ID):** deixe vazio por enquanto (será preenchido na Etapa 3)
   - **HSM Template Name:** `report_ready_v1` (ou o nome real do template aprovado pela Meta)
   - **Preview do Template:** `Olá {{leadName}}, seu relatório está pronto! Acesse: {{reportLink}}`
   - **Email Fallback Template:** `report_ready` (já deve estar preenchido)
   - **Descrição:** `Notifica o lead que o relatório de diagnóstico está pronto`
4. Clique em **Salvar**
5. **Resultado:** Toast "Flow atualizado", dialog fecha, card atualiza com os novos valores
6. O card agora deve mostrar badge verde "HSM: report_ready_v1" em vez de "Sem HSM"

### 3.5 Verificar preview do template

1. Após salvar o HSM template name no flow "Envio do Relatório"
2. O card deve mostrar a preview: "Olá {{leadName}}, seu relatório está pronto!..." em fundo cinza claro

**Resultado esperado:** Todos os cards renderizam corretamente, toggle funciona, edição salva e atualiza a UI.

---

## 4. Etapa 3 — Configurar o ManyChat

**Objetivo:** Criar os flows no ManyChat e configurar os webhooks de retorno.

### 4.1 Criar um flow de teste no ManyChat

> Recomendamos começar com o flow **"Envio do Relatório"** por ser o mais completo.

1. Abra o ManyChat → **Automation** → **+ New Flow**
2. Nomeie o flow: `Envio do Relatório — CRM`
3. Monte o flow com a seguinte estrutura:

```
[Starting Step]
    ↓
[Send Message] — "Olá {{leadName}}, seu relatório de diagnóstico está pronto!"
    ↓
[Buttons]
    → "Ver Relatório" (URL: {{reportLink}})
    → "Quero saber mais" (→ próximo step)
    ↓
[External Request — botão clicado] ← webhook de retorno
    ↓
[Send Message] — "Ótimo! Posso te ajudar com..."
    ↓
[External Request — flow concluído] ← webhook de retorno
```

4. Após criar, vá em **Settings** do flow
5. Copie o **Flow Namespace (NS)** — é o ID que o ManyChat usa para envio via API
   - Geralmente no formato: `content20260301000000_abcdef`

### 4.2 Anotar o mc_flow_ns

1. Com o Flow NS copiado, volte ao sistema → `/admin/manychat-flows`
2. Edite o flow "Envio do Relatório"
3. Cole o valor no campo **"ManyChat Flow NS (ID)"**
4. Salve

**Resultado esperado:** O card agora mostra "Flow NS: content20260301..." em fonte mono, sem o alerta amarelo.

### 4.3 Configurar os External Request (webhooks de retorno)

Cada ponto de interação do lead no flow ManyChat deve ter um **External Request** action que envia dados de volta para o CRM.

Para cada External Request no flow:

1. No editor do ManyChat, adicione um node **"External Request"** (aba Actions)
2. Configure:
   - **Method:** POST
   - **URL:** `https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/receive-manychat-webhook`
   - **Headers:**
     ```
     Content-Type: application/json
     x-webhook-secret: <valor que você definiu na Etapa 1.4>
     ```
   - **Body (JSON):**
     ```json
     {
       "phone": "{{wa_id}}",
       "flow_name": "report_delivery",
       "step_name": "button_click_ver_relatorio",
       "action_type": "button_click",
       "subscriber_id": "{{id}}"
     }
     ```

3. Ajuste o `step_name` e `action_type` conforme o ponto do flow:

| Ponto no flow | `step_name` | `action_type` |
|---------------|-------------|---------------|
| Início do flow | `flow_started` | `flow_started` |
| Lead clicou botão | `button_click_ver_relatorio` | `button_click` |
| Lead respondeu texto | `text_reply` | `text_reply` |
| Fim do flow | `flow_completed` | `flow_completed` |

4. Para respostas de texto, adicione o campo `user_input`:
   ```json
   {
     "phone": "{{wa_id}}",
     "flow_name": "report_delivery",
     "step_name": "text_reply",
     "action_type": "text_reply",
     "user_input": "{{last_input_text}}",
     "subscriber_id": "{{id}}"
   }
   ```

> **Dica ManyChat:** `{{wa_id}}` é o número de WhatsApp do subscriber. `{{id}}` é o ID interno do ManyChat. `{{last_input_text}}` é a última resposta de texto do usuário.

### 4.4 Aprovar HSM Template na Meta (se necessário)

Se você precisa enviar mensagens fora da janela de 24h (primeiro contato com o lead), é obrigatório usar um HSM template aprovado pela Meta.

1. No ManyChat → **Settings** → **WhatsApp** → **Message Templates**
2. Crie um novo template:
   - **Name:** `report_ready_v1`
   - **Language:** `pt_BR`
   - **Category:** `UTILITY`
   - **Body:** `Olá {{1}}, seu relatório de diagnóstico está pronto! Acesse aqui: {{2}}`
   - **Variables:**
     - `{{1}}` = Nome do lead
     - `{{2}}` = Link do relatório
3. Submeta para aprovação da Meta
4. Aguarde aprovação (pode levar de minutos a dias)
5. Após aprovado, confirme que o nome (`report_ready_v1`) está no campo **HSM Template Name** do flow no admin

> **Importante:** Sem HSM template aprovado, o flow só funciona se o lead já conversou com você nas últimas 24h (janela de conversação do WhatsApp Business). Para primeiro contato, o HSM é obrigatório.

### 4.5 Configurar Custom Fields no ManyChat

Para que o N8N consiga encontrar o subscriber correto, configure:

1. No ManyChat → **Settings** → **Custom Fields**
2. Crie (se ainda não existe): `WPP_ID` (tipo: Text)
   - Este campo armazena o número de telefone do lead no formato que o CRM usa
3. O N8N vai usar este campo para buscar o subscriber via `findByCustomField`

**Resultado esperado:** Flow criado no ManyChat, mc_flow_ns configurado no admin, External Requests apontando para o webhook, HSM template submetido.

---

## 5. Etapa 4 — Configurar o N8N

**Objetivo:** Criar o workflow genérico que recebe pedidos do CRM e executa via ManyChat API.

### 5.1 Criar o workflow

1. No N8N → **+ New Workflow** → nomeie: `ManyChat — Disparo de Flow`
2. Monte os seguintes nodes:

```
[Webhook: manychat-trigger-flow]
    ↓
[IF: hsm_template_name preenchido?]
    ├─ SIM → [ManyChat: sendContent (whatsapp_template)]
    └─ NÃO → [IF: mc_flow_ns preenchido?]
                 ├─ SIM → [ManyChat: sendFlow]
                 └─ NÃO → [Error: flow não configurado]
```

### 5.2 Node: Webhook

- **Method:** POST
- **Path:** `manychat-trigger-flow`
- A URL completa será: `https://n8n.euanapratica.com/webhook/manychat-trigger-flow`
- Essa URL já está cadastrada na tabela `n8n_automations`

### 5.3 Node: Buscar ou criar subscriber

Antes de enviar o flow, o N8N precisa encontrar (ou criar) o subscriber no ManyChat:

1. **HTTP Request — findByCustomField:**
   ```
   GET https://api.manychat.com/fb/subscriber/findByCustomField
   Headers: Authorization: Bearer {{$credentials.manychat_api_key}}
   Query: field_name=WPP_ID&field_value={{$json.lead_phone}}
   ```

2. Se subscriber não encontrado → **HTTP Request — createSubscriber:**
   ```
   POST https://api.manychat.com/fb/subscriber/createSubscriber
   Body: {
     "wa_phone": "{{$json.lead_phone}}",
     "first_name": "{{$json.lead_name}}",
     "custom_fields": [{"field_name": "WPP_ID", "field_value": "{{$json.lead_phone}}"}]
   }
   ```

### 5.4 Node: Enviar (HSM Template)

Se `hsm_template_name` está preenchido no payload:

```
POST https://api.manychat.com/fb/sending/sendContent
Body: {
  "subscriber_id": {{subscriber_id}},
  "content_type": "whatsapp_template",
  "template_name": "{{$json.hsm_template_name}}",
  "language": "{{$json.hsm_template_language}}",
  "body_params": {{$json.hsm_template_params}}
}
```

### 5.5 Node: Enviar (Flow Livre)

Se apenas `mc_flow_ns` está preenchido:

```
POST https://api.manychat.com/fb/sending/sendFlow
Body: {
  "subscriber_id": {{subscriber_id}},
  "flow_ns": "{{$json.mc_flow_ns}}"
}
```

### 5.6 Ativar o workflow

1. Clique em **"Active"** (toggle no canto superior direito)
2. O workflow agora está ouvindo no webhook

### 5.7 Testar o webhook isoladamente

Antes de testar pelo CRM, faça um teste direto:

1. No N8N, clique em **"Test workflow"**
2. Em outro terminal, execute:
   ```bash
   curl -X POST https://n8n.euanapratica.com/webhook-test/manychat-trigger-flow \
     -H "Content-Type: application/json" \
     -d '{
       "event": "manychat.trigger_flow",
       "lead_id": "test-id",
       "lead_name": "Teste",
       "lead_phone": "5511999999999",
       "flow_name": "report_delivery",
       "mc_flow_ns": null,
       "hsm_template_name": null,
       "variables": {"leadName": "Teste"},
       "trigger_source": "manual"
     }'
   ```
3. **Resultado esperado:** O N8N recebe o payload e mostra nos nodes (mesmo sem enviar de verdade, valida que o webhook funciona)

**Resultado esperado:** Workflow N8N criado e ativo, webhook respondendo, lógica de subscriber + envio configurada.

---

## 6. Etapa 5 — Disparo Manual (Outbound)

**Objetivo:** Testar o ciclo completo de disparo pelo CRM.

### 6.1 Abrir lead de teste no CRM

1. Acesse `/admin/leads-dashboard`
2. Encontre o lead de teste (que tem telefone válido com WhatsApp)
3. Clique para abrir o detalhe do lead

### 6.2 Abrir o dialog de envio

1. No header do lead, localize o botão verde **"WhatsApp"** com seta dropdown (▾)
2. Clique na seta para abrir o menu
3. Você verá duas opções:
   - **"Abrir wa.me"** — abre conversa direta no WhatsApp Web
   - **"Enviar Flow ManyChat"** — abre o dialog de disparo
4. Clique em **"Enviar Flow ManyChat"**

**Resultado esperado:** Dialog abre com título "Enviar Flow ManyChat" e um dropdown de seleção de flow.

### 6.3 Selecionar um flow

1. No dropdown **"Flow"**, clique para abrir
2. Você deve ver os flows com `trigger_type` diferente de `auto`:
   - Envio do Relatório
   - Feedback do Relatório
   - Mentoria Individual
   - Mentoria em Grupo
   - Convite para Plataforma
   - Convite para Live
   - Follow-up Pós-Consultoria
   - Reengajamento de Leads Frios
3. Selecione **"Envio do Relatório"**

**Resultado esperado:** Dialog mostra a descrição do flow, badges (HSM Template se configurado, caso de uso, fallback), e o preview da mensagem com as variáveis do lead substituídas (ex: "Olá João, seu relatório está pronto!").

### 6.4 Verificar variáveis automáticas

O sistema preenche automaticamente:
- `{{leadName}}` → nome do lead (ex: "João Silva")
- `{{reportLink}}` → `https://hub.euanapratica.com/report/{access_token}` do lead
- `{{leadEmail}}` → email do lead
- `{{leadPhone}}` → telefone do lead
- `{{registrationLink}}` → `https://hub.euanapratica.com/register`

**Resultado esperado:** O preview mostra a mensagem com os valores reais do lead, não os placeholders.

### 6.5 Testar flow com variáveis manuais

1. Selecione o flow **"Convite para Live"**
2. Abaixo dos badges, devem aparecer campos editáveis:
   - **liveTitle** — Digite: "Masterclass de Carreira 2026"
   - **liveDate** — Digite: "15/03/2026 às 20h"
   - **liveLink** — Digite: "https://hub.euanapratica.com/live/123"
3. O preview deve atualizar em tempo real com os valores digitados

**Resultado esperado:** Campos manuais visíveis, preview atualiza dinamicamente.

### 6.6 Enviar o flow

1. Volte para o flow **"Envio do Relatório"**
2. Clique no botão verde **"Enviar via ManyChat"**
3. O botão deve mostrar um spinner durante o envio

**Resultado esperado:**
- Toast verde: "Flow disparado — Flow disparado via WhatsApp"
- Dialog fecha automaticamente
- Nenhum erro

### 6.7 Verificar logs no Supabase

1. Abra o Supabase Dashboard → Table Editor → `manychat_flow_logs`
2. Deve haver um novo registro com:
   - `flow_name` = `report_delivery`
   - `channel` = `whatsapp`
   - `trigger_source` = `manual`
   - `status` = `dispatched`
   - `triggered_by` = seu user ID (o admin que disparou)
   - `metadata` contém: `flow_display_name`, `phone`, `variables`, `hsm_template_name` (se configurado), `mc_flow_ns` (se configurado)

3. Abra `lead_interactions`
4. Filtre pelo `lead_id` do lead de teste
5. Deve haver um novo registro com:
   - `type` = `manychat_flow_sent`
   - `direction` = `outbound`
   - `channel` = `whatsapp`
   - `content` = "Flow: Envio do Relatório"
   - `metadata` contém: `flow_name`, `mc_flow_ns`, `trigger_source`

### 6.8 Verificar logs no N8N

1. Abra o N8N → workflow "ManyChat — Disparo de Flow"
2. Clique em **"Executions"**
3. Deve haver uma execução recente com status "Success"
4. Clique para ver os dados — o payload deve conter todos os dados do lead e flow

### 6.9 Verificar no ManyChat

1. No ManyChat → **Live Chat** ou **Contacts**
2. Busque o subscriber pelo número de telefone do lead
3. Confirme que:
   - O subscriber existe (foi criado ou já existia)
   - O flow foi enviado (veja o histórico de mensagens do subscriber)
   - A mensagem do HSM template (ou flow livre) aparece no chat

### 6.10 Verificar no WhatsApp do lead

1. No celular de teste (número do lead), abra o WhatsApp
2. Confirme que a mensagem chegou
3. Se era HSM template: a mensagem deve ter o formato do template aprovado
4. Se era flow livre: a mensagem deve ter o conteúdo configurado no ManyChat

**Resultado esperado:** Ciclo completo funciona — CRM dispara → N8N recebe → ManyChat envia → Lead recebe no WhatsApp.

---

## 7. Etapa 6 — Fallback por Email

**Objetivo:** Testar que leads sem telefone recebem email em vez de WhatsApp.

### 7.1 Preparar lead sem telefone

1. No CRM, encontre (ou crie) um lead de teste **sem telefone** (campo phone vazio ou com menos de 10 dígitos)
2. Confirme que o lead tem **email válido**

### 7.2 Abrir dialog e enviar

1. Abra o detalhe do lead sem telefone
2. Clique em **WhatsApp ▾** → **"Enviar Flow ManyChat"**
3. Selecione **"Envio do Relatório"** (tem email_fallback_template = `report_ready`)

**Resultado esperado:**
- Alerta amarelo aparece: "Lead sem telefone — Será enviado por email usando o template 'report_ready'"
- O botão de envio muda para **"Enviar por Email"** (em vez de "Enviar via ManyChat")

4. Clique em **"Enviar por Email"**

**Resultado esperado:**
- Toast: "Flow disparado — Email enviado (lead sem telefone)"
- Dialog fecha

### 7.3 Verificar logs do fallback

1. No Supabase → `manychat_flow_logs`:
   - `channel` = `email_fallback`
   - `status` = `fallback_email`
   - `metadata` contém `email_template: 'report_ready'`, `used_fallback: true`

2. No Supabase → `lead_interactions`:
   - `type` = `email_sent` (não `manychat_flow_sent`, porque foi email)
   - `content` = "Fallback email: report_ready (flow: report_delivery)"

### 7.4 Testar flow sem fallback

1. Selecione o flow **"Follow-up Pós-Consultoria"** (não tem email_fallback_template)
2. **Resultado esperado:**
   - Alerta amarelo: "Lead sem telefone — Este flow requer telefone e não tem fallback por email."
   - Botão **"Enviar via ManyChat"** fica **desabilitado** (cinza, não clicável)

### 7.5 Verificar email recebido

1. Acesse a caixa de entrada do email do lead de teste
2. Confirme que o email chegou com:
   - Subject configurado no template `report_ready`
   - Conteúdo com as variáveis substituídas (nome do lead, link do relatório, etc.)

**Resultado esperado:** Fallback funciona corretamente — email enviado quando não tem telefone, bloqueado quando não tem fallback template.

---

## 8. Etapa 7 — Retorno do ManyChat (Inbound)

**Objetivo:** Testar que interações do lead no ManyChat aparecem na timeline do CRM.

### 8.1 Teste via curl (sem precisar interação real)

Antes de testar com o ManyChat real, valide que o webhook funciona:

```bash
curl -X POST https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/receive-manychat-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: <SEU_WEBHOOK_SECRET>" \
  -d '{
    "phone": "+5511999999999",
    "flow_name": "report_delivery",
    "step_name": "button_click_ver_relatorio",
    "action_type": "button_click",
    "subscriber_id": "mc_12345"
  }'
```

> Substitua `+5511999999999` pelo telefone do lead de teste e `<SEU_WEBHOOK_SECRET>` pelo valor da Etapa 1.4.

**Resultado esperado:** Resposta `{"success": true}`

### 8.2 Verificar interação logada

1. No Supabase → `lead_interactions`
2. Filtre pelo lead de teste
3. Deve haver um novo registro:
   - `type` = `manychat_reply`
   - `direction` = `inbound`
   - `channel` = `whatsapp`
   - `content` = `Clicou: button_click_ver_relatorio`
   - `metadata` contém: `flow_name`, `step_name`, `action_type`, `subscriber_id`, `phone`

### 8.3 Testar resposta de texto

```bash
curl -X POST https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/receive-manychat-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: <SEU_WEBHOOK_SECRET>" \
  -d '{
    "phone": "+5511999999999",
    "flow_name": "report_delivery",
    "step_name": "text_reply_feedback",
    "action_type": "text_reply",
    "user_input": "Adorei o relatório! Quero saber mais sobre mentoria.",
    "subscriber_id": "mc_12345"
  }'
```

**Resultado esperado:**
- Resposta: `{"success": true}`
- Nova interação com `content` = `Resposta: Adorei o relatório! Quero saber mais sobre mentoria.`

### 8.4 Testar flow concluído

```bash
curl -X POST https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/receive-manychat-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: <SEU_WEBHOOK_SECRET>" \
  -d '{
    "phone": "+5511999999999",
    "flow_name": "report_delivery",
    "step_name": "flow_completed",
    "action_type": "flow_completed",
    "subscriber_id": "mc_12345"
  }'
```

**Resultado esperado:**
- Resposta: `{"success": true}`
- Nova interação com `content` = `Flow concluído: report_delivery`
- O registro correspondente em `manychat_flow_logs` deve ter `status` atualizado para `delivered`

### 8.5 Testar com interação real no ManyChat

1. No celular de teste, abra a conversa do WhatsApp com o número do ManyChat
2. Interaja com o flow (clique em botão, responda texto)
3. Cada interação que tem um "External Request" no ManyChat deve gerar:
   - Uma chamada ao webhook `receive-manychat-webhook`
   - Um novo registro em `lead_interactions` com `type = 'manychat_reply'`
4. Verifique no Supabase se todas as interações foram logadas

### 8.6 Testar phone não encontrado

```bash
curl -X POST https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/receive-manychat-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: <SEU_WEBHOOK_SECRET>" \
  -d '{
    "phone": "+5500000000000",
    "flow_name": "report_delivery",
    "step_name": "test",
    "action_type": "text_reply"
  }'
```

**Resultado esperado:**
- Resposta: `{"success": true, "warning": "Lead not found"}`
- Nenhuma interação logada (o sistema ignora silenciosamente — não bloqueia o ManyChat)

**Resultado esperado:** Webhook recebe interações corretamente, loga no CRM, atualiza status dos logs.

---

## 9. Etapa 8 — Timeline do CRM

**Objetivo:** Verificar a visualização das interações ManyChat na timeline do lead.

### 9.1 Abrir timeline do lead

1. No CRM, abra o lead de teste que recebeu o flow (Etapa 5)
2. Vá para a aba de **Interações** (timeline)

### 9.2 Verificar interação de disparo (outbound)

Deve aparecer uma linha com:

- **Ícone:** balão de chat em cor **esmeralda** (verde-azulado)
- **Label:** "ManyChat Flow"
- **Direção:** seta para cima (↗ Saída / outbound)
- **Canal:** "whatsapp"
- **Conteúdo:** "Flow: Envio do Relatório"
- **Horário:** relativo (ex: "há 5 min") com data completa no hover

### 9.3 Verificar interação de retorno (inbound)

Se você executou os testes da Etapa 7, deve aparecer:

- **Ícone:** balão de chat em cor **teal** (verde-azulado mais escuro)
- **Label:** "ManyChat Resposta"
- **Direção:** seta para baixo (↙ Entrada / inbound)
- **Canal:** "whatsapp"
- **Conteúdo:** depende do `action_type`:
  - `"Clicou: button_click_ver_relatorio"`
  - `"Resposta: Adorei o relatório!..."`
  - `"Flow concluído: report_delivery"`

### 9.4 Verificar ordem cronológica

A timeline deve mostrar as interações na ordem correta:

```
🟢 ManyChat Flow      ↗ Saída    "Flow: Envio do Relatório"                      há 10min
🟢 ManyChat Resposta   ↙ Entrada  "Clicou: button_click_ver_relatorio"             há 8min
🟢 ManyChat Resposta   ↙ Entrada  "Resposta: Adorei o relatório! Quero saber..."   há 7min
🟢 ManyChat Resposta   ↙ Entrada  "Flow concluído: report_delivery"                há 5min
```

### 9.5 Verificar filtro de interações

1. Se a timeline tem filtro por tipo, selecione apenas "ManyChat Flow" e "ManyChat Resposta"
2. **Resultado:** Apenas as interações do ManyChat são exibidas

**Resultado esperado:** Timeline mostra o histórico completo da conversa ManyChat com ícones, cores e conteúdo corretos.

---

## 10. Etapa 9 — Cenários de Erro

**Objetivo:** Validar que o sistema lida corretamente com erros.

### 10.1 Flow desabilitado

1. Na página `/admin/manychat-flows`, desabilite o flow "Envio do Relatório" (toggle off)
2. Abra um lead → WhatsApp ▾ → Enviar Flow ManyChat
3. Selecione "Envio do Relatório" e tente enviar
4. **Resultado:** O flow não deve aparecer no dropdown (só flows habilitados são listados)

> Se por algum motivo aparecer (cache), o backend retornará erro: "Flow está desabilitado"

5. **Lembre-se:** reative o flow após o teste!

### 10.2 Webhook secret inválido

```bash
curl -X POST https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/receive-manychat-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: senha_errada_12345" \
  -d '{"phone": "+5511999999999", "flow_name": "test", "action_type": "text_reply"}'
```

**Resultado esperado:** Resposta `401 {"error": "Unauthorized"}`

### 10.3 Payload sem telefone

```bash
curl -X POST https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/receive-manychat-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: <SEU_WEBHOOK_SECRET>" \
  -d '{"flow_name": "test", "action_type": "text_reply"}'
```

**Resultado esperado:** Resposta `400 {"success": false, "error": "phone is required"}`

### 10.4 Flow inexistente (outbound)

Via curl direto (simulando chamada interna):

```bash
curl -X POST https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/trigger-manychat-flow \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: <INTERNAL_FUNCTION_SECRET>" \
  -d '{"lead_id": "<ID_LEAD_TESTE>", "flow_name": "flow_que_nao_existe"}'
```

**Resultado esperado:** Resposta `200 {"success": false, "error": "Flow 'flow_que_nao_existe' não encontrado"}`

### 10.5 Lead inexistente (outbound)

```bash
curl -X POST https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/trigger-manychat-flow \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: <INTERNAL_FUNCTION_SECRET>" \
  -d '{"lead_id": "00000000-0000-0000-0000-000000000000", "flow_name": "report_delivery"}'
```

**Resultado esperado:** Resposta `200 {"success": false, "error": "Lead não encontrado"}`

**Resultado esperado:** Todos os cenários de erro retornam mensagens claras sem quebrar o sistema.

---

## 11. Etapa 10 — Checklist Final

Marque cada item conforme for validando:

### Banco de Dados
- [ ] Tabela `manychat_flows` existe com 8 registros
- [ ] Tabela `manychat_flow_logs` existe
- [ ] Automação `manychat_trigger_flow` registrada em `n8n_automations`
- [ ] `manychat_webhook_secret` configurado em `app_configs` (valor não-vazio)
- [ ] `lead_interactions` aceita tipos `manychat_flow_sent` e `manychat_reply`

### Admin UI
- [ ] Menu "Flows ManyChat" aparece no sidebar
- [ ] Página `/admin/manychat-flows` lista os 8 flows
- [ ] Toggle ativar/desativar funciona
- [ ] Edição de flow salva corretamente (mc_flow_ns, HSM, fallback, descrição)
- [ ] Badge de HSM aparece quando `hsm_template_name` está preenchido

### ManyChat
- [ ] Pelo menos 1 flow criado no ManyChat (recomendado: "Envio do Relatório")
- [ ] `mc_flow_ns` do flow preenchido no admin
- [ ] External Request actions configuradas nos pontos-chave do flow
- [ ] Headers do webhook incluem `x-webhook-secret` correto
- [ ] Body do webhook inclui `phone`, `flow_name`, `step_name`, `action_type`
- [ ] HSM template submetido para aprovação (se necessário para primeiro contato)
- [ ] Custom field `WPP_ID` criado no ManyChat

### N8N
- [ ] Workflow "ManyChat — Disparo de Flow" criado e ativo
- [ ] Webhook URL responde em `https://n8n.euanapratica.com/webhook/manychat-trigger-flow`
- [ ] Lógica de subscriber (find/create) implementada
- [ ] Lógica de envio (HSM template vs flow livre) implementada
- [ ] Teste manual do webhook funciona

### Ciclo Outbound (CRM → Lead)
- [ ] Dialog "Enviar Flow ManyChat" abre corretamente
- [ ] Dropdown mostra apenas flows triggeráveis (exclui auto-only)
- [ ] Variáveis automáticas preenchidas (leadName, reportLink, etc.)
- [ ] Variáveis manuais aparecem para flows que precisam (ex: live_invite)
- [ ] Preview do HSM template renderiza com valores reais
- [ ] Envio com telefone: dispara via N8N → ManyChat → WhatsApp
- [ ] Envio sem telefone: fallback por email funciona
- [ ] Envio sem telefone + sem fallback: botão desabilitado
- [ ] Log criado em `manychat_flow_logs` (status: dispatched)
- [ ] Interação criada em `lead_interactions` (type: manychat_flow_sent)
- [ ] Log no N8N mostra execução com sucesso
- [ ] Lead recebe a mensagem no WhatsApp

### Ciclo Inbound (Lead → CRM)
- [ ] Webhook `receive-manychat-webhook` responde corretamente
- [ ] `action_type: button_click` → "Clicou: {step_name}"
- [ ] `action_type: text_reply` → "Resposta: {user_input}"
- [ ] `action_type: flow_completed` → "Flow concluído: {flow_name}"
- [ ] `action_type: flow_started` → "Flow iniciado: {flow_name}"
- [ ] Interação com phone desconhecido → 200 com warning (sem erro)
- [ ] Webhook secret inválido → 401
- [ ] Payload sem phone → 400
- [ ] `manychat_flow_logs` status atualizado (dispatched → replied/delivered)

### Timeline do CRM
- [ ] "ManyChat Flow" aparece com ícone esmeralda (outbound)
- [ ] "ManyChat Resposta" aparece com ícone teal (inbound)
- [ ] Direção correta (↗ saída / ↙ entrada)
- [ ] Conteúdo legível (não JSON bruto)
- [ ] Ordem cronológica correta

---

## 12. Referência: Payloads e Endpoints

### Endpoints

| Função | URL | Auth |
|--------|-----|------|
| Disparo (outbound) | `https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/trigger-manychat-flow` | Bearer token (admin) ou `x-internal-secret` |
| Retorno (inbound) | `https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/receive-manychat-webhook` | `x-webhook-secret` ou `x-internal-secret` |
| N8N Webhook | `https://n8n.euanapratica.com/webhook/manychat-trigger-flow` | (chamado pelo disparo via N8N service) |

### Payload: trigger-manychat-flow (request)

```json
{
  "lead_id": "uuid-do-lead",
  "flow_name": "report_delivery",
  "variables": {
    "customKey": "customValue"
  },
  "trigger_source": "manual"
}
```

### Payload: trigger-manychat-flow (response — sucesso)

```json
{
  "success": true,
  "channel": "whatsapp",
  "flow_name": "report_delivery",
  "message": "Flow 'Envio do Relatório' disparado para João Silva."
}
```

### Payload: trigger-manychat-flow (response — fallback email)

```json
{
  "success": true,
  "channel": "email_fallback",
  "flow_name": "report_delivery",
  "fallback": true,
  "message": "Lead sem telefone. Email enviado via template 'report_ready'."
}
```

### Payload: receive-manychat-webhook (request)

```json
{
  "phone": "+5511999999999",
  "flow_name": "report_delivery",
  "step_name": "button_click_ver_relatorio",
  "action_type": "button_click",
  "user_input": null,
  "subscriber_id": "mc_12345",
  "metadata": {}
}
```

### Payload: N8N recebe do CRM (completo)

```json
{
  "event": "manychat.trigger_flow",
  "timestamp": "2026-03-07T14:30:00.000Z",
  "source": "enp_hub_supabase",
  "lead_id": "uuid-do-lead",
  "lead_name": "João Silva",
  "lead_email": "joao@email.com",
  "lead_phone": "5511999999999",
  "flow_name": "report_delivery",
  "flow_display_name": "Envio do Relatório",
  "mc_flow_ns": "content20260301000000_abcdef",
  "hsm_template_name": "report_ready_v1",
  "hsm_template_language": "pt_BR",
  "hsm_template_params": [
    { "position": 1, "value": "João Silva" },
    { "position": 2, "value": "https://hub.euanapratica.com/report/abc123" }
  ],
  "variables": {
    "leadName": "João Silva",
    "reportLink": "https://hub.euanapratica.com/report/abc123",
    "leadEmail": "joao@email.com",
    "leadPhone": "5511999999999",
    "registrationLink": "https://hub.euanapratica.com/register"
  },
  "trigger_source": "manual"
}
```

### Configuração External Request no ManyChat

Para cada ponto de interação no flow ManyChat:

```
Method: POST
URL: https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/receive-manychat-webhook

Headers:
  Content-Type: application/json
  x-webhook-secret: <valor_do_app_configs>

Body:
{
  "phone": "{{wa_id}}",
  "flow_name": "report_delivery",
  "step_name": "<nome_descritivo_do_passo>",
  "action_type": "<button_click|text_reply|flow_completed|flow_started>",
  "user_input": "{{last_input_text}}",
  "subscriber_id": "{{id}}"
}
```

> **Variáveis ManyChat disponíveis:** `{{wa_id}}` (telefone), `{{id}}` (subscriber ID), `{{first_name}}`, `{{last_name}}`, `{{last_input_text}}` (última resposta de texto do lead).

---

**Documento criado em:** 2026-03-02
**Última atualização:** 2026-03-02
**Versão:** 1.0
