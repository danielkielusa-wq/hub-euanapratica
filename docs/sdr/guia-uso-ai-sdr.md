# AI SDR Agent — Guia de Uso

## O que é e por que existe separado do CRM?

O AI SDR opera com **prospects** — pessoas que **ainda NÃO preencheram** o diagnóstico `/avaliar`. O CRM (`career_evaluations`) guarda **leads** que já estão no funil.

```
FORA DO FUNIL                    DENTRO DO FUNIL
┌──────────────┐    conversão    ┌──────────────────────┐
│  SDR         │ ──────────────→ │  CRM                 │
│  prospects   │  (preenche      │  career_evaluations  │
│  (cold)      │   o form)       │  (warm/hot)          │
└──────────────┘                 └──────────────────────┘
```

### Pontes SDR ↔ CRM (implementadas)

| Bridge | Como funciona |
|--------|---------------|
| **Deduplicação no import** | CSV import cruza email/phone com `career_evaluations` e ignora quem já é lead |
| **Auto-conversão** | Trigger PostgreSQL: quando alguém preenche o form, se o email/phone bate com um prospect, marca automaticamente como `converted` |
| **CRM check no outreach** | Antes de cada envio (cron), verifica se prospect já virou lead no CRM |
| **CRM check na qualificação** | Ao qualificar, detecta se prospect já existe no CRM |
| **Unique indexes** | Email e phone têm unique index — impossível duplicar |

---

## Casos de Uso

### Caso 1: Prospecção LinkedIn (mais comum)

**Cenário**: Você extraiu 50 perfis de brasileiros em tech no LinkedIn via Sales Navigator / Phantombuster.

**Passo a passo**:
1. **Exportar CSV** do Sales Navigator com colunas: `name, email, headline, company, location, linkedin_url`
2. Ir em `/admin/sdr` → aba **Prospects** → **Importar CSV**
3. Fazer upload — o sistema automaticamente:
   - Remove quem já é lead no CRM
   - Remove duplicatas (email/phone/linkedin)
   - Importa o restante como `status: new`
4. Selecionar todos → **Qualificar com AI**
   - AI analisa cada perfil e dá score 0-100
   - Score < 20 → `disqualified` (sem fit)
   - Score 20+ → `qualified` (pronto para outreach)
5. Criar uma **Campanha** com sequência:
   - Step 1: LinkedIn connect (delay 0h) → template `sdr_linkedin_connect`
   - Step 2: Email intro (delay 72h) → template `sdr_intro_email`
   - Step 3: WhatsApp (delay 120h) → template `sdr_whatsapp_value`
   - Step 4: Email final (delay 168h) → template `sdr_final_email`
6. Selecionar a campanha → **Iniciar Sequência**
   - Todos os prospects `qualified` entram na fila
   - Cron envia automaticamente respeitando delays e horário comercial (9-18h BRT)

**Resultado esperado**: ~5-15% reply rate, ~2-5% conversão (preenchem o form)

---

### Caso 2: Reativação de Contatos Frios

**Cenário**: Você tem uma lista de emails de pessoas que demonstraram interesse mas nunca preencheram o diagnóstico.

**Passo a passo**:
1. Montar CSV: `name, email, source=reativacao`
2. Importar → sistema filtra quem já é lead
3. Qualificar com AI (se tiver dados de perfil) ou pular direto
4. Criar campanha "Reativação Q1 2026":
   - Step 1: Email intro personalizado (delay 0h)
   - Step 2: Email followup com social proof (delay 96h)
   - Step 3: Email final (delay 168h)
5. Iniciar sequência

**Dica**: No campo `ai_context` da campanha, escreva: "Estes contatos já demonstraram interesse antes. Tom mais direto, menos introdução."

---

### Caso 3: Prospect Individual (Inbound)

**Cenário**: Você encontrou um perfil interessante no LinkedIn/Instagram e quer iniciar outreach manual.

**Passo a passo**:
1. `/admin/sdr` → aba Prospects → **Novo Prospect**
2. Preencher dados: nome, email, headline, company, LinkedIn
3. Clicar no prospect → **Qualificar**
4. Se qualificado → **Gerar Mensagem** (escolher template)
5. Revisar a mensagem gerada pela AI → **Enviar**

---

### Caso 4: Import de Grupo do WhatsApp / Instagram

**Cenário**: Você tem contatos de um grupo de WhatsApp ou lista de seguidores do Instagram.

**Passo a passo**:
1. Montar CSV: `name, phone` (WhatsApp) ou `name, instagram_handle` (Instagram)
2. Importar via CSV
3. Qualificar (scores serão menores sem dados de perfil profissional)
4. Para WhatsApp: usar campanha com template `sdr_whatsapp_value`
5. Para Instagram: por enquanto, usar N8N + Phantombuster para DMs

---

### Caso 5: Monitoramento de Conversões

**Cenário**: Verificar quantos prospects viraram leads.

**Passo a passo**:
1. `/admin/sdr` → dashboard mostra:
   - Total prospects por status
   - Número de convertidos
   - Reply rate e send rate
2. Filtrar por status `converted` para ver quem preencheu o form
3. O `converted_evaluation_id` linka direto ao relatório do lead no CRM

---

## Templates Disponíveis

| Template Key | Canal | Uso |
|-------------|-------|-----|
| `sdr_intro_email` | Email | Primeiro contato, apresenta o diagnóstico |
| `sdr_followup_email` | Email | Follow-up com social proof (78% stat) |
| `sdr_whatsapp_value` | WhatsApp | Mensagem curta e amigável |
| `sdr_final_email` | Email | Último toque, respeitoso |
| `sdr_linkedin_connect` | LinkedIn | Connection request (300 chars max) |

Todos são **editáveis** em `/admin/sdr` → aba Templates.

A AI personaliza cada template usando os dados do prospect (nome, cargo, empresa, bio, pain points da qualificação).

---

## Sequência Recomendada (Default)

```
Dia 0:  LinkedIn Connect         → sdr_linkedin_connect
Dia 3:  Email Introdução         → sdr_intro_email
Dia 5:  WhatsApp (se tem phone)  → sdr_whatsapp_value
Dia 7:  Email Follow-up          → sdr_followup_email
Dia 10: Email Final              → sdr_final_email
```

**Horário de envio**: 9h-18h BRT (verificação automática)
**Rate limit**: 50 mensagens por ciclo de cron
**Cron**: A cada 30 minutos (precisa configurar — ver seção abaixo)

---

## Setup Pendente

### 1. Cron Job (obrigatório para outreach automático)
Executar no Supabase SQL Editor:
```sql
SELECT cron.schedule(
  'sdr-execute-outreach',
  '*/30 9-21 * * *',  -- A cada 30min, 9h-21h UTC (6h-18h BRT)
  $$SELECT net.http_post(
    url := (SELECT value FROM app_configs WHERE key = 'supabase_edge_url') || '/sdr-execute-outreach',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', (SELECT value FROM app_configs WHERE key = 'internal_function_secret')
    ),
    body := '{"mode": "cron"}'::jsonb
  )$$
);
```

### 2. N8N Workflows (para WhatsApp e LinkedIn)
- **sdr.send_whatsapp**: Receber webhook → Evolution API → enviar mensagem
- **sdr.send_linkedin**: Receber webhook → Phantombuster → enviar connection/message
- Ver `docs/n8n/` para setup detalhado

### 3. Deploy
```bash
cd "c:\Users\I335869\ENP_HUB\hub-euanapratica"

# Migration
npx supabase db push --include-all

# Edge Functions
npx supabase functions deploy sdr-qualify-prospect sdr-generate-message sdr-execute-outreach

# Regenerar types
npx supabase gen types typescript --project-id seqgnxynrcylxsdzbloa > src/integrations/supabase/types.ts
```

---

## Fluxo de Dados Completo

```
CSV/Manual Import
      │
      ▼
┌─────────────────┐
│ sdr_prospects    │ status: new
│ (dedup check)    │
└────────┬────────┘
         │ Qualificar
         ▼
┌─────────────────┐     ┌─── CRM check ───┐
│ AI Qualification │────→│ Já é lead?       │
│ (callLLM)        │     │ → converted      │
└────────┬────────┘     └──────────────────┘
         │ score >= 20
         ▼
┌─────────────────┐
│ qualified        │ pronto para campanha
└────────┬────────┘
         │ Iniciar Sequência
         ▼
┌─────────────────┐
│ in_sequence      │ cron processa a cada 30min
│                  │ → gera msg AI → envia
└────────┬────────┘
         │
    ┌────┼────────────┐
    │    │             │
    ▼    ▼             ▼
 Email  WhatsApp    LinkedIn
(Resend)(N8N→Evo)  (N8N→Phantom)
    │    │             │
    └────┼────────────┘
         │
    ┌────┴────┐
    │ Resposta │──→ replied
    └─────────┘
         │
    ┌────┴────────────┐
    │ Preenche /avaliar│──→ converted (auto-trigger)
    └─────────────────┘         │
                                ▼
                        career_evaluations (CRM)
                                │
                                ▼
                        AI Report → WhatsApp Drip → Nurturing
```
