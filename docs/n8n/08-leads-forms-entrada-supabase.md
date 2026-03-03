# Fluxo N8N: Leads Forms — Entrada no Supabase

> Arquivo JSON: `[Leads forms] - Entrada no supabase (8).json`
> Versão atual: v8 (score engine v2.4 no branch principal)
> Última atualização: 2026-03-03

---

## Por que este fluxo é crítico

Este é o **ponto de entrada de todos os leads** que preenchem o formulário de diagnóstico. Ele:

1. Recebe o submit do formulário via webhook
2. Calcula o **Readiness Score** (0–100) com regras comerciais
3. Envia os dados para o **Claude (via OpenRouter)** gerar o diagnóstico personalizado completo
4. Salva tudo no Supabase (`career_evaluations`)
5. Cria ou atualiza o contato no **ManyChat** com os campos do relatório

Se este fluxo quebrar, **nenhum lead novo é processado**.

---

## Visão Geral do Fluxo

```
Formulário do Lead (POST)
  ↓
[Webhook] New Lead Form Webhook1
  ↓
[Code] Prepara Dados1 (v2.1)
  Normaliza campos + calcula score + classifica fase + produto tier
  ↓
[AI Agent] Claude Haiku 4.5 (via OpenRouter)
  Gera diagnóstico completo em JSON estruturado
  ↓
[Code] Prepare for Supabase1
  Faz parse inteligente do output da IA, valida, converte tipos
  ↓
[Supabase GET] Check if Exists1
  Busca na career_evaluations por email
  ↓
[IF] Lead Novo ou Existente1
       ├── Email vazio → Novo Lead (INSERT)
       └── Email existe → Lead Existente1 (UPDATE)
  ↓
[NoOp] ok3  ← merge dos dois caminhos
  ↓
[HTTP] Usuario ja Existe? (ManyChat findByCustomField WPP_ID)
  ↓
[Switch] Switch1
       ├── "Contato não existe" → Cria Usuario (ManyChat createSubscriber)
       │     ↓
       │   Pega Subscriber Id
       └── "Contato existe" → Edit Fields2 (extrai subscriber_id)
  ↓
[NoOp] ok2  ← merge dos dois caminhos
  ↓
[Wait] Wait1  ← aguarda resposta do Telegram (confirmação manual opcional)
  ↓
[HTTP] Preenche dados do Report
  ManyChat setCustomFields: área, cargo, concern, inglês, experiência, etc.
  ↓
[HTTP] Preenche Campos do Usuário3
  ManyChat setCustomFields: objetivo, visa, email_lead, link_report, WPP_ID
```

---

## Nós do Fluxo (detalhes)

### 1. `New Lead Form Webhook1`
- **Tipo**: Webhook POST
- **Path**: `lead_form`
- **Webhook ID**: `b962a9f3-1130-47d7-9e07-5686ef1c9121`
- **Payload esperado**: `body.lead.*` com os campos do formulário (ver seção Payload)

### 2. `Prepara Dados1` — Score Engine v2.1
- **Tipo**: Code Node (JavaScript)
- **Input**: `$json.body.lead` — campos do formulário principal
- **Campos de telefone**: `lead.ddd` (ex: `"11"`) + `lead.whatsapp` (ex: `"999999999"`)
- **Saída**: objeto estruturado com `user_data`, `scoring`, `phase_classification`, `barriers_analysis`, `lead_qualification`, `timeline_milestones`

> **Importante — Phone normalization (adicionado 2026-03-03)**:
> A função `normalizePhone(ddd, number)` garante que o campo `phone` salvo no Supabase
> **sempre tenha o formato `+5511999999999`** (com DDI +55).
> Isso é obrigatório para envio via ManyChat e para abrir WhatsApp Web pelo CRM.

```javascript
// Lógica da normalizePhone:
// - Remove não-dígitos
// - Se já começa com "55" e tem ≥12 dígitos → adiciona "+"
// - Caso contrário → adiciona "+55"
```

### 3. `AI Agent` — Claude Haiku 4.5
- **Modelo**: `anthropic/claude-haiku-4.5` via OpenRouter
- **Input**: JSON completo com todos os dados normalizados + scoring
- **Output**: JSON estruturado com diagnóstico personalizado completo
- **System prompt**: Analista de carreira "EUA Na Prática", tom "tough love", proibido revelar metodologia interna

O agente preenche os campos marcados com `[ESCREVER]` no template JSON, incluindo:
- `phase_classification.short_diagnosis` / `full_diagnosis`
- `barriers_analysis.critical_blockers` / `recommended_first_action`
- `detailed_analysis.*` (inglês, experiência, objetivo, timeline, visto, financeiro, mental, família)
- `web_report_data` (hero section, key metrics, action plan 30/90/180 dias)

### 4. `Prepare for Supabase1` — Smart Parser
- **Tipo**: Code Node (JavaScript)
- **Input**: Output do AI Agent (pode vir em `output`, `text` ou direto na raiz)
- Faz parse robusto — aceita JSON embrulhado em Markdown (` ```json ... ``` `)
- Converte tipos: `toBool()`, `toInt()`, `toNumeric()`
- Valida campos obrigatórios
- Retorna objeto flat pronto para INSERT/UPDATE no Supabase

> **Nota**: O campo `recommended_product_name/price/url` é deixado como `null` aqui.
> A Edge Function `recommend-product` preenche via trigger PostgreSQL.

### 5. `Check if Exists1`
- **Tipo**: Supabase GET
- **Tabela**: `career_evaluations`
- **Filtro**: `email = $json.email`

### 6. `Lead Novo ou Existente1`
- **Tipo**: IF Node
- **Condição**: `$json.email` vazio → Novo Lead (true) / email existe → Existente (false)

### 7. `Novo Lead` / `Lead Existente1`
- Ambos escrevem os mesmos ~60 campos na `career_evaluations`
- `Novo Lead` = INSERT; `Lead Existente1` = UPDATE filtrado por email
- UTM params vêm de `$('Prepare for LLM1').item.json.tracking.*`

### 8. ManyChat Integration
- **`Usuario ja Existe?`**: `GET /fb/subscriber/findByCustomField?field_id=14227232&field_value={ddd}{whatsapp}`
  - `field_id 14227232` = campo `WPP_ID` no ManyChat
- **`Cria Usuario`**: `POST /fb/subscriber/createSubscriber` com `wa_id = ddd+whatsapp`
- **`Preenche dados do Report`**: 9 custom fields (área, cargo, concern, inglês, experiência, família, impedimento, renda, investimento)
- **`Preenche Campos do Usuário3`**: 5 custom fields (objetivo, visa, email_lead, link_report, WPP_ID)

> **Atenção**: O `WPP_ID` enviado ao ManyChat é `ddd + whatsapp` sem `+55`.
> O `phone` salvo no Supabase usa `normalizePhone` e **tem** `+55`.
> São dois formatos diferentes por intenção.

---

## Payload do Formulário (Form 1 — ativo)

```json
{
  "lead": {
    "fullName": "Nome Completo",
    "email": "email@exemplo.com",
    "ddd": "11",
    "whatsapp": "999999999",
    "currentRole": "Cargo atual",
    "area": "Tecnologia/IT",
    "worksInternational": "Não",
    "experience": "5-10 anos",
    "englishLevel": "Intermediário",
    "goal": "Emprego remoto em dólar",
    "visaStatus": "Ainda não iniciei nada",
    "timeline": "Entre 6 e 12 meses",
    "familyStatus": "Com família e filhos",
    "incomeRange": "De R$ 5 mil a R$ 10 mil",
    "investmentRange": "De R$ 1.500 a R$ 3.000",
    "impediment": "Tempo ou rotina",
    "mainConcern": "texto livre",
    "tracking": {
      "submitted_at": "2026-03-03T12:00:00Z",
      "device": "mobile",
      "utm_source": "instagram",
      "utm_medium": "paid",
      "utm_campaign": "...",
      "utm_content": "...",
      "utm_term": "...",
      "fbclid": "...",
      "gclid": "..."
    }
  }
}
```

---

## Sistema de Score (Readiness Score)

O score é calculado pela soma de 7 dimensões (máx 100):

| Dimensão | Campos | Pontos possíveis |
|---|---|---|
| Inglês | `englishLevel` | Básico=0, Intermediário=12, Avançado=20, Fluente=25 |
| Experiência | `experience` | <2a=5, 2-5a=12, 5-10a=17, +10a=20 |
| Trabalho Internacional | `worksInternational` | Não=5, Sim=15 |
| Timeline | `timeline` | Sem prazo=2, 6-12m=5, 3-6m=8, <3m=10 |
| Objetivo | `goal` | Sem clareza=0, Estudar=6, Remoto=8, Imigrar=10 |
| Visto | `visaStatus` | Nenhum=0, Turista=3, Em processo=7, Aprovado=10 |
| Prontidão | `impediment` | Família=1, Inglês=2, Financeiro=3, Outro=3, Medo=4, Tempo=6, Nenhum=10 |

### Classificação de Fase (ROTA EUA™)

| Score | Phase ID | Nome | ROTA Letter | Urgência | Pode aplicar vagas | Preparo |
|---|---|---|---|---|---|---|
| 0–35 | 0 | BASE INSUFICIENTE | Pré-R | BAIXA | ❌ | 24 meses |
| 36–60 | 1 | PREPARAÇÃO ESTRUTURADA | R-O | MÉDIA | ❌ | 15 meses |
| 61–85 | 2 | TRAÇÃO ATIVA | O-T | ALTA | ✅ | 9 meses |
| 86–100 | 3 | ACELERAÇÃO | T-A | CRÍTICA | ✅ | 3 meses |

### Tier do Produto (v2.4 — score-driven)

O tier é determinado **pelo score**, não pela capacidade financeira.
A capacidade financeira vai como contexto para a IA ajustar o texto.

| Score | Tier | Produto |
|---|---|---|
| 0–30 | FREE | Recursos Gratuitos |
| 31–50 | LOW_TICKET | Curso ROTA Internacional (~R$ 697) |
| 51–70 | MED_TICKET | Mentoria em Grupo ROTA EUA™ (~R$ 2.497) |
| 71+ | HIGH_TICKET | Mentoria Individual com Daniel Kiel (~R$ 10.000) |

### Temperatura do Lead

| Condição | Temperatura |
|---|---|
| Score ≥ 80 E tem budget | SUPER_QUENTE |
| Score ≥ 65 E tem budget | QUENTE |
| Score ≥ 40 | MORNO |
| Score < 40 | FRIO |

`has_budget = true` quando `investment_range` NÃO for `"Até R$ 1.500"` ou `"Ainda não sei"`.

### Sequências de Nurture

| Condição | Sequência |
|---|---|
| FREE + barreira financeira | `Free_FinancialBarrier_Nurture` |
| FREE | `Free_Content_Engagement` |
| Fase 0 + barreira inglês | `Fase0_Ingles_Basico` |
| Fase 0 + barreira experiência | `Fase0_Sem_Experiencia` |
| MED sem budget | `MedTicket_NoBudget_Nurture` |
| MED + objeção financeira | `Fase1_Med_Ticket_FinancialObjection` |
| MED | `Fase1_Med_Ticket_Nurture` |
| LOW + fase 1 | `Fase1_Low_Ticket_Education` |
| Fase 2 | `Fase2_Traction_Active` |
| Fase 3 | `Fase3_Acceleration_VIP` |

---

## Campos Gravados no Supabase (`career_evaluations`)

O fluxo grava ~60 campos. Os principais por categoria:

**Dados do formulário**: `name`, `email`, `phone`, `area`, `atuacao`, `trabalha_internacional`, `experiencia`, `english_level`, `objetivo`, `visa_status`, `timeline`, `family_status`, `income_range`, `investment_range`, `impediment`, `main_concern`

**Relatório**: `report_content` (1 frase resumo), `formatted_report` (JSONB completo), `formatted_at`

**Scoring**: `readiness_score`, `readiness_percentual`, `phase_id`, `phase_name`, `phase_emoji`, `rota_letter`, `urgency_level`, `can_apply_jobs`, `estimated_preparation_months`, `score_english`, `score_experience`, `score_international_work`, `score_timeline`, `score_objective`, `score_visa`, `score_readiness`, `score_area_bonus`

**Produto** (preenchido pelo fluxo): `recommended_product_tier`, `has_budget`, `budget_gap`, `estimated_ltv`
> `recommended_product_name/price/url`, `fit_score` são `null` aqui — preenchidos pela Edge Function `recommend-product`

**Barreiras**: `has_english_barrier`, `has_experience_barrier`, `has_financial_barrier`, `has_family_barrier`, `has_visa_barrier`, `has_time_barrier`, `has_clarity_barrier`, `critical_blockers`, `recommended_first_action`

**Qualificação**: `lead_temperature`, `lead_priority_score`, `is_tech_professional`, `is_senior_level`, `works_remotely`, `has_family`, `is_high_income`, `best_contact_time`, `preferred_communication`

**Timeline**: `next_milestone_action`, `next_milestone_deadline`, `recheck_recommended_at`, `scheduled_follow_up_1/2/3`, `auto_nurture_sequence`

**UTM**: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`

**Status**: `processing_status = "completed"`, `access_count = 0`

---

## Campos ManyChat Atualizados

| field_id | field_name | Valor |
|---|---|---|
| 14210786 | rep_area | `area` (raw, do formulário) |
| 14210785 | rep_atuacao | cargo normalizado |
| 14210804 | rep_concern | `goal` do formulário |
| 14210791 | rep_english_level | `englishLevel` raw |
| 14216632 | rep_experience | `experience` raw |
| 14210799 | rep_family_status | `familyStatus` raw |
| 14210802 | rep_impediment | `impediment` raw |
| 14210800 | rep_income | `incomeRange` raw |
| 14210801 | rep_investment_range | `investmentRange` raw |
| 14210793 | rep_objetivo | `goal` raw |
| 14210796 | rep_visa_status | `visaStatus` raw |
| 14227294 | email_lead | email |
| 14280454 | link_report | `access_token` do Supabase |
| 14227232 | WPP_ID | `ddd + whatsapp` (só dígitos, sem +55) |

---

## Versões e Branches

O JSON contém **dois branches** de processamento (histórico de evolução):

| Branch | Status | Score Engine | Form path | Telefone |
|---|---|---|---|---|
| **Ativo** (Y=1728) | ✅ Ativo | `Prepara Dados1` v2.1 | `lead_form` | `lead.ddd` + `lead.whatsapp` separados |
| Legado (Y=2112) | ❌ Desabilitado | `Prepare for LLM` v2.4 | `lead_form2` | `body.whatsapp` único |

O branch ativo (`Prepara Dados1`) foi atualizado para incluir a função `normalizePhone()` que adiciona `+55` automaticamente. O branch desabilitado usa `lead.whatsapp` direto sem normalização de DDI.

---

## Normalização do Telefone

**Problema**: O formulário envia DDD e número separados (`ddd: "11"`, `whatsapp: "999999999"`). Sem tratamento, o número ficava como `"11999999999"` — sem `+55`. Isso quebrava:
- Envio via ManyChat (exige `+55`)
- Abertura via WhatsApp Web no CRM (`wa.me/5511...`)

**Solução** (implementada em 2026-03-03):

```javascript
function normalizePhone(ddd = "", number = "") {
  const raw = (ddd + number).replace(/\D/g, "");
  if (!raw) return "";
  // Já tem DDI 55 (ex: "5511999999999")
  if (raw.startsWith("55") && raw.length >= 12) return "+" + raw;
  // Apenas DDD + número (ex: "11999999999")
  return "+55" + raw;
}
```

| Entrada | Saída |
|---|---|
| ddd=`"11"`, number=`"999999999"` | `+5511999999999` |
| ddd=`""`, number=`"5511999999999"` | `+5511999999999` |
| ddd=`"11"`, number=`"99999-9999"` | `+5511999999999` |
| ddd=`""`, number=`""` | `""` |

> O `WPP_ID` no ManyChat continua sendo enviado **sem `+55`** (`ddd + whatsapp` brutos),
> pois é assim que o ManyChat identifica o contato por wa_id.

---

## Credenciais Necessárias no N8N

| Credencial | ID | Usado em |
|---|---|---|
| `Supabase account` | `SHEFLfQdt2th2mQd` | Check if Exists1, Novo Lead, Lead Existente1 |
| `ManyChat API` | `bqxn4Lv8OoDJZBHB` | Usuario ja Existe?, Cria Usuario, Preenche dados..., Preenche Campos... |
| `OpenRouter account` | `WqRAMztC5HsztEjH` | AI Agent (Claude Haiku 4.5) |

---

## Troubleshooting

### Lead salvo mas sem formatted_report
- **Causa**: AI Agent falhou ou retornou JSON inválido
- **Verificar**: `processing_status` na `career_evaluations` — se `pending`, o relatório ainda não foi gerado
- O trigger `trg_report_completed` dispara quando `processing_status` muda para `completed`

### Telefone sem +55 em leads antigos
- Executar query de correção:
```sql
UPDATE career_evaluations
SET phone = '+55' || regexp_replace(phone, '\D', '', 'g')
WHERE phone NOT LIKE '+%'
  AND phone IS NOT NULL
  AND phone != '';
```

### Lead não aparece no ManyChat
- Verificar se `WPP_ID` foi salvo corretamente (sem +55, só dígitos)
- O `findByCustomField` busca por `ddd + whatsapp` sem formatação
- Se o contato não for encontrado por WPP_ID, o fluxo cria um novo subscriber

### AI Agent retorna conteúdo fora do JSON
- O `Prepare for Supabase1` tenta parsear Markdown (` ```json ... ``` `) automaticamente
- Se falhar, verifica `output`, `text`, e raiz do JSON
- Erro explícito com preview do input recebido facilita diagnóstico

### Score ou tier diferente do esperado
- Checar o campo `_debug` no `formatted_report` — está presente no JSONB salvo
- Campos: `english`, `experience`, `area`, `investment`, `income`, `impediment`, `tier_logic`, `total`

---

## Fluxo Downstream (após este fluxo)

Quando `processing_status = "completed"` é salvo:

1. **Trigger PostgreSQL** `trg_report_completed` detecta o INSERT/UPDATE
2. **`dispatch-report-webhook`** é chamado via `pg_net`
3. Despacha evento `report.generated` para **N8N automations**
4. **`execute-whatsapp-flow`** inicia o flow de WhatsApp `report_ready_drip`
5. **`recommend-product`** preenche os campos de produto nulos

---

## Arquivo JSON

O arquivo de workflow versionado está em:
```
[Leads forms] - Entrada no supabase (8).json
```

Para importar no N8N: **Settings → Workflows → Import from file**.

Versões anteriores (arquivadas):
- `(6).json` — em `hub-euanapratica - Copy (2)/`
- `(7).json` — versão imediatamente anterior

---

**Versão doc**: 1.0
**Data**: 2026-03-03
