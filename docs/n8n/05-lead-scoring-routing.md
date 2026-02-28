# Fluxo 5 — Lead Scoring & Routing

## Objetivo e Valor

Rotear leads automaticamente por temperatura (muito-quente, quente, morno, frio), criando tarefas no CRM com prioridade e prazo adequados. Leads muito quentes recebem alerta Telegram urgente. Garante que nenhum lead qualificado fique sem atendimento.

---

## Evento Gatilho

**`report.generated`** — disparado por trigger PostgreSQL `trg_report_completed` quando `career_evaluations.processing_status` transiciona para `'completed'` (INSERT ou UPDATE). O trigger chama a Edge Function `dispatch-report-webhook` via `pg_net`, que le o relatorio do banco, normaliza a temperatura do lead (ex: `SUPER_QUENTE` → `muito-quente`) e dispara o webhook. Usa os dados de lead_qualification do relatorio.

### Campos relevantes do payload

```json
{
  "lead_id": "uuid-do-lead",
  "lead_name": "Maria Silva",
  "lead_email": "maria@email.com",
  "lead_phone": "5511999887766",
  "report_link": "https://hub.euanapratica.com/report/abc123token",
  "readiness_score": 72,
  "lead_temperature": "quente",
  "lead_priority_score": 85,
  "phase_name": "Decolagem",
  "primary_product": "mentoria-carreira"
}
```

### Temperaturas possiveis

| Temperatura | Score tipico | Acao |
|---|---|---|
| `muito-quente` | 85-100 | Task urgente (2h) + Telegram |
| `quente` | 70-84 | Task alta prioridade (1 dia) |
| `morno` | 50-69 | Task media prioridade (3 dias) |
| `frio` | 0-49 | Sem task (drip campaign cuida) |

---

## Fluxo

```
career_evaluations INSERT/UPDATE (processing_status = 'completed')
        │
        ▼ (trigger trg_report_completed → dispatch-report-webhook)
dispatchN8NWebhook("report.generated", payload)
        │
        ▼
┌─── N8N: Lead Scoring & Routing ─────────────────┐
│                                                   │
│   Webhook Trigger                                 │
│        │                                          │
│   Switch (lead_temperature)                       │
│   ┌──────┬──────┬──────┬──────┐                   │
│   ▼      ▼      ▼      ▼      │                   │
│  m-hot  hot   warm   cold     │                   │
│   │      │      │      │       │                   │
│   ▼      ▼      ▼      ▼       │                   │
│  Task   Task   Task   NoOp    │                   │
│  urg    high   med    (drip)  │                   │
│  +2h    +1d    +3d            │                   │
│   │                            │                   │
│   ▼                            │                   │
│  Telegram                      │                   │
│  (so muito-quente)             │                   │
└───────────────────────────────────────────────────┘
```

---

## Configuracao N8N

### Nos necessarios

| No | Tipo | Configuracao |
|---|---|---|
| 1 | Webhook | POST `/lead-scoring` |
| 2 | Switch | Campo: `{{ $json.body.lead_temperature }}` |
| 3a | HTTP Request | POST `lead_tasks` — urgente, +2h (muito-quente) |
| 3b | HTTP Request | POST `lead_tasks` — alta, +1d (quente) |
| 3c | HTTP Request | POST `lead_tasks` — media, +3d (morno) |
| 3d | NoOp | Nenhuma acao (frio) |
| 4 | Telegram | Alerta urgente (so apos 3a, muito-quente) |

### Criar Task via Supabase REST (muito-quente)

```
POST https://seqgnxynrcylxsdzbloa.supabase.co/rest/v1/lead_tasks
Headers:
  apikey: <SUPABASE_ANON_KEY>
  Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
  Content-Type: application/json
  Prefer: return=representation

Body:
{
  "lead_id": "{{ $json.body.lead_id }}",
  "type": "contact",
  "title": "🔥 URGENTE: Contatar {{ $json.body.lead_name }}",
  "description": "Lead muito-quente (score: {{ $json.body.readiness_score }}). Produto: {{ $json.body.primary_product }}",
  "priority": "urgent",
  "due_date": "{{ $now.plus(2, 'hours').toISO() }}",
  "source": "n8n_automation",
  "metadata": {
    "lead_temperature": "{{ $json.body.lead_temperature }}",
    "readiness_score": {{ $json.body.readiness_score }},
    "lead_priority_score": {{ $json.body.lead_priority_score }},
    "primary_product": "{{ $json.body.primary_product }}",
    "phase_name": "{{ $json.body.phase_name }}"
  }
}
```

### Criar Task (quente — +1 dia)

Mesmo formato, ajustando:
- `priority`: `"high"`
- `due_date`: `{{ $now.plus(1, 'days').toISO() }}`
- `title`: `"Contatar lead quente: {{ $json.body.lead_name }}"`

### Criar Task (morno — +3 dias)

Mesmo formato, ajustando:
- `priority`: `"medium"`
- `due_date`: `{{ $now.plus(3, 'days').toISO() }}`
- `title`: `"Acompanhar lead morno: {{ $json.body.lead_name }}"`

---

## Registro no CRM

- **lead_tasks**: tarefa criada automaticamente com `source: "n8n_automation"`
- **Telegram**: alerta interno para leads muito-quentes (sem registro CRM)
- Tarefas ficam visiveis no painel CRM do lead

---

## Relacao com Outros Fluxos

O evento `report.generated` dispara 4 workflows simultaneamente:

| Workflow | Funcao |
|---|---|
| Report Ready Notification | Enviar teaser WhatsApp + email fallback |
| High-Value Lead Alert | Telegram alerta (quente/muito-quente) |
| **Lead Scoring Routing** | Criar tasks por temperatura |
| Drip Campaign | Sequencia nurturing D0-D14 |

Nao ha conflito: cada workflow tem responsabilidade diferente. Lead Scoring cria tasks, High-Value envia Telegram (para muito-quente, ambos disparam — a task eh criada por Lead Scoring, o alerta por High-Value).

---

## Troubleshooting

| Problema | Verificacao |
|---|---|
| Task nao criada | Verifique credenciais REST no N8N e permissoes da tabela `lead_tasks` |
| Temperatura nao preenchida | Verifique se o relatorio contem `lead_qualification` e se `dispatch-report-webhook` esta normalizando corretamente |
| Duplicata de task | O workflow nao verifica duplicatas — considere adicionar check antes do INSERT |
| Lead frio sem acao | Correto — leads frios sao tratados pela drip campaign |
