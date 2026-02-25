# Fluxo 3 — High-Value Lead Alert

## Objetivo e Valor

Alertar a equipe imediatamente quando um lead de alto valor eh identificado (temperatura quente ou muito-quente). Cria automaticamente uma task no CRM com prioridade urgente para contato rapido, maximizando a taxa de conversao.

---

## Evento Gatilho

**`report.generated`** — mesmo evento do fluxo de Report Ready Notification. Um unico dispatch dispara multiplos workflows.

### Campos relevantes do payload

```json
{
  "lead_id": "uuid-do-lead",
  "lead_name": "Maria Silva",
  "lead_email": "maria@email.com",
  "lead_phone": "5511999887766",
  "report_link": "https://hub.euanapratica.com/report/abc123token",
  "readiness_score": 85,
  "lead_temperature": "muito-quente",
  "lead_priority_score": 92,
  "phase_name": "Decolagem",
  "is_tech_professional": true,
  "is_senior_level": true,
  "is_high_income": true,
  "primary_product": "mentoria-carreira",
  "barriers": ["networking"]
}
```

---

## Fluxo

```
format-lead-report (relatorio pronto)
        │
        ▼
dispatchN8NWebhook("report.generated", payload)
        │
        ▼
┌─── N8N: High Value Lead Alert ──────────────────┐
│                                                   │
│   Webhook Trigger                                 │
│        │                                          │
│   IF lead_temperature IN [quente, muito-quente]?  │
│   ├── SIM:                                        │
│   │   Telegram: alerta com detalhes do lead       │
│   │        │                                      │
│   │   POST lead_tasks (via Supabase REST)         │
│   │   { type: "contact",                          │
│   │     priority: "urgent",                       │
│   │     due: NOW + 2h,                            │
│   │     source: "n8n_automation" }                │
│   │                                               │
│   └── NAO: (lead frio/morno, ignorar)             │
└───────────────────────────────────────────────────┘
```

---

## Configuracao N8N

### Nos necessarios

| No | Tipo | Configuracao |
|---|---|---|
| 1 | Webhook | POST `/high-value-lead` |
| 2 | IF | `{{ $json.body.lead_temperature }}` equals `"quente"` OR `"muito-quente"` |
| 3 | Telegram | Mensagem com detalhes do lead |
| 4 | HTTP Request | POST `lead_tasks` via Supabase REST API |

### Mensagem Telegram

```
🔥 LEAD DE ALTO VALOR!

👤 {{ $json.body.lead_name }}
📧 {{ $json.body.lead_email }}
📱 {{ $json.body.lead_phone }}

📊 Score: {{ $json.body.readiness_score }}/100
🌡️ Temperatura: {{ $json.body.lead_temperature }}
🎯 Prioridade: {{ $json.body.lead_priority_score }}

📋 Fase: {{ $json.body.phase_name }}
💼 Senior: {{ $json.body.is_senior_level }}
💰 Alta renda: {{ $json.body.is_high_income }}
🎯 Produto: {{ $json.body.primary_product }}

🔗 Relatorio: {{ $json.body.report_link }}
```

### Criar Task via REST

```
POST https://seqgnxynrcylxsdzbloa.supabase.co/rest/v1/lead_tasks
Headers:
  apikey: <SUPABASE_ANON_KEY>
  Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
  Content-Type: application/json

Body:
{
  "lead_id": "{{ $json.body.lead_id }}",
  "type": "contact",
  "title": "Contatar lead quente: {{ $json.body.lead_name }}",
  "priority": "urgent",
  "due_date": "{{ $now.plus(2, 'hours').toISO() }}",
  "source": "n8n_automation",
  "metadata": {
    "lead_temperature": "{{ $json.body.lead_temperature }}",
    "readiness_score": {{ $json.body.readiness_score }},
    "primary_product": "{{ $json.body.primary_product }}"
  }
}
```

---

## Registro no CRM

- **Telegram**: alerta interno, sem registro no CRM
- **lead_tasks**: cria tarefa com `source: "n8n_automation"`, visivel no CRM do lead

---

## Troubleshooting

| Problema | Verificacao |
|---|---|
| Alerta nao dispara | Verifique se `high_value_lead_alert` esta enabled e lead_temperature esta preenchida |
| Task nao criada | Verifique credenciais REST no N8N (apikey + service_role) |
| Lead qualificado mas sem alerta | Verifique o enriquecimento do lead_qualification no format-lead-report |
| Falso positivo | Ajuste criterios no IF node (pode adicionar readiness_score > 70) |
