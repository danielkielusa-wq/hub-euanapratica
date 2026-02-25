# Fluxo 2 — Report Ready Notification (Teaser Strategy)

## Objetivo e Valor

Quando o relatorio de diagnostico fica pronto, notificar o lead via WhatsApp usando estrategia de engajamento: enviar teaser sem link, esperar o lead responder "SIM", e so entao enviar o link. Fallback por email apos 24h sem resposta. Maximiza engajamento e taxa de abertura.

---

## Evento Gatilho

**`report.generated`** — disparado por trigger PostgreSQL `trg_report_completed` quando `career_evaluations.processing_status` transiciona para `'completed'` (INSERT ou UPDATE). O trigger chama a Edge Function `dispatch-report-webhook` via `pg_net`, que le o relatorio do banco, normaliza a temperatura do lead (ex: `SUPER_QUENTE` → `muito-quente`) e dispara o webhook.

### Payload completo

```json
{
  "event": "report.generated",
  "timestamp": "2026-02-25T10:00:00.000Z",
  "source": "enp_hub_supabase",
  "lead_id": "uuid-do-lead",
  "lead_name": "Maria Silva",
  "lead_email": "maria@email.com",
  "lead_phone": "5511999887766",
  "access_token": "abc123token",
  "report_link": "https://hub.euanapratica.com/report/abc123token",
  "readiness_score": 72,
  "lead_temperature": "quente",
  "lead_priority_score": 85,
  "phase_id": "decolagem",
  "phase_name": "Decolagem",
  "is_tech_professional": true,
  "is_senior_level": true,
  "is_high_income": false,
  "primary_product": "mentoria-carreira",
  "barriers": ["networking", "portfolio"]
}
```

---

## Fluxo

```
career_evaluations INSERT/UPDATE (processing_status = 'completed')
        │
        ▼ (trigger PostgreSQL trg_report_completed)
dispatch-report-webhook Edge Function
        │
        ▼
dispatchN8NWebhook("report.generated", payload)
        │
        ▼
┌─── N8N Workflow A: Report Ready Notification ───┐
│                                                   │
│   Webhook Trigger                                 │
│        │                                          │
│   Wait 60 min (anti-spam, nao enviar imediato)    │
│        │                                          │
│   IF has_phone?                                   │
│   ├── SIM:                                        │
│   │   POST send-whatsapp                          │
│   │   { template: "report_ready_teaser" }         │
│   │        │                                      │
│   │   Wait 24h                                    │
│   │        │                                      │
│   │   GET lead_interactions                       │
│   │   (verifica se link ja foi enviado)           │
│   │        │                                      │
│   │   IF link NAO enviado?                        │
│   │   └── POST send-lead-email                    │
│   │       { template: "report_ready" }            │
│   │                                               │
│   └── NAO:                                        │
│       POST send-lead-email                        │
│       { template: "report_ready" }                │
└───────────────────────────────────────────────────┘


┌─── N8N Workflow B: WhatsApp Reply Handler ────────┐
│                                                    │
│   Webhook Trigger (whatsapp.inbound)               │
│        │                                           │
│   IF message matches /sim|yes|quero/i ?            │
│   ├── SIM:                                         │
│   │   GET lead_interactions                        │
│   │   (busca teaser recente em 48h)                │
│   │        │                                       │
│   │   IF teaser encontrado?                        │
│   │   └── POST send-whatsapp                      │
│   │       { template: "report_ready_link" }        │
│   │                                                │
│   └── NAO: (mensagem normal, ignorar)              │
└────────────────────────────────────────────────────┘
```

---

## Templates Utilizados

### WhatsApp: `report_ready_teaser`
> Ola {{leadName}}! Seu diagnostico de carreira ficou pronto. Descobrimos insights valiosos sobre seu perfil profissional. Quer receber o link do seu relatorio personalizado? Responda SIM!

### WhatsApp: `report_ready_link`
> {{leadName}}, aqui esta o link do seu relatorio: {{reportLink}} Ele fica disponivel por tempo limitado. Qualquer duvida, estamos aqui!

### Email: `report_ready`
- **Subject**: Seu Diagnostico de Carreira esta pronto!
- **Body**: HTML com botao para o report link, resumo do score

---

## Configuracao N8N

### Workflow A — Report Ready Notification

| No | Tipo | Configuracao |
|---|---|---|
| 1 | Webhook | POST `/report-ready` |
| 2 | Wait | 60 minutos |
| 3 | IF | `{{ $json.body.lead_phone }}` is not empty |
| 4 | HTTP Request | POST `send-whatsapp` com template `report_ready_teaser` |
| 5 | Wait | 24 horas |
| 6 | HTTP Request | GET `lead_interactions?lead_id=eq.{id}&type=eq.whatsapp_sent&metadata->>template_name=eq.report_ready_link&limit=1` |
| 7 | IF | Response body is empty (link nao enviado) |
| 8 | HTTP Request | POST `send-lead-email` com template `report_ready` |

### Workflow B — Reply Handler

| No | Tipo | Configuracao |
|---|---|---|
| 1 | Webhook | POST `/whatsapp-reply-handler` (trigger: whatsapp.inbound) |
| 2 | IF | `{{ $json.body.message_text }}` matches regex `/^(sim\|yes\|quero\|enviar?)\s*$/i` |
| 3 | HTTP Request | GET `lead_interactions?lead_id=eq.{id}&metadata->>template_name=eq.report_ready_teaser&created_at=gte.{48h_ago}&limit=1` |
| 4 | IF | Response body is not empty (teaser encontrado) |
| 5 | HTTP Request | POST `send-whatsapp` com template `report_ready_link` |

---

## Edge Functions Envolvidas

### `send-whatsapp`
```
POST /functions/v1/send-whatsapp
x-internal-secret: <SECRET>
Content-Type: application/json

{ "lead_id": "uuid", "template_name": "report_ready_teaser" }
```

### `send-lead-email`
```
POST /functions/v1/send-lead-email
x-internal-secret: <SECRET>
Content-Type: application/json

{ "lead_id": "uuid", "template_name": "report_ready" }
```

---

## Registro no CRM

Todas as comunicacoes sao registradas automaticamente em `lead_interactions`:

| Acao | type | channel | template |
|---|---|---|---|
| Teaser WhatsApp | whatsapp_sent | whatsapp | report_ready_teaser |
| Link WhatsApp | whatsapp_sent | whatsapp | report_ready_link |
| Email fallback | email_sent | email | report_ready |
| Resposta do lead | whatsapp_inbound | whatsapp | — |

---

## Troubleshooting

| Problema | Verificacao |
|---|---|
| Teaser nao enviado | Verifique se `report_ready_notification` esta enabled e com webhook URL |
| Lead responde SIM mas nao recebe link | Verifique `whatsapp_reply_handler` workflow no N8N, regex match, e query de teaser |
| Email fallback nao enviado | Verifique template `report_ready` enabled em `email_templates` |
| Duplo envio | O workflow verifica `lead_interactions` antes de enviar email fallback |
