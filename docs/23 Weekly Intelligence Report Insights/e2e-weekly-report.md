# E2E Test Plan — Weekly Intelligence Report

**Feature**: Weekly Intelligence Report (`/admin/inteligencia-semanal`)
**Version**: 1.0
**Last Updated**: 2026-02-27

---

## Overview

This document describes end-to-end test scenarios for the Weekly Intelligence Report feature. It covers the full flow: data aggregation, AI analysis, UI display, approval for assistant, N8N webhook dispatch, and scheduled generation.

**Target audiences being tested:**
- Admin owner (generates, reads, approves reports)
- Sales assistant (reads briefings and talking points)

---

## Prerequisites

### 1. Environment

| Item | Value / Where to find |
|---|---|
| Admin account | Any user in `user_roles` with `role = 'admin'` |
| URL | `http://localhost:5173/admin/inteligencia-semanal` (local) or `https://hub.euanapratica.com/admin/inteligencia-semanal` |
| Supabase dashboard | `https://supabase.com/dashboard/project/seqgnxynrcylxsdzbloa` |
| Edge Function logs | Supabase Dashboard → Edge Functions → `generate-weekly-report` → Logs |
| N8N instance | Hostinger VPS (check `n8n_automations.webhook_url` in DB) |

### 2. Required Test Data

Before running scenarios, verify the following exist in the DB (Table Editor in Supabase Dashboard):

**a) At least 5 completed leads in `career_evaluations`:**
- `processing_status = 'completed'`
- Mix of temperatures: at least 2 with `lead_temperature IN ('quente', 'muito-quente')`
- Some with `phone` filled, some without
- At least 1 created in the last 7 days
- At least 1 created 30+ days ago

**How to create quickly** (SQL in Supabase SQL Editor):
```sql
-- Check existing hot leads
SELECT id, name, phone, lead_temperature, lead_priority_score, processing_status
FROM career_evaluations
WHERE lead_temperature IN ('quente', 'muito-quente')
  AND processing_status = 'completed'
ORDER BY lead_priority_score DESC NULLS LAST
LIMIT 10;
```
If fewer than 2 results, open the Admin > Leads panel, find a lead, and manually update their temperature.

**b) `app_configs` entries for the report (auto-seeded by migration):**
```sql
SELECT key, value FROM app_configs
WHERE key LIKE 'weekly_report%';
```
Expected: 5 rows (`weekly_report_prompt`, `weekly_report_api_key`, `weekly_report_period_days`, `weekly_report_max_hot_leads`, `weekly_report_cron_schedule`).

**c) An active API key in `api_configs`:**
```sql
SELECT api_key, display_name, model, is_active
FROM api_configs
WHERE api_key = (SELECT value FROM app_configs WHERE key = 'weekly_report_api_key');
```
The `api_key` column value (e.g., `openai_api`) must exist and `is_active = true`.

---

## Test Scenarios

---

### TC-01 — Empty State (No Reports Yet)

**Goal**: Confirm the UI gracefully handles the case where no reports have been generated.

**Setup**: Delete all existing reports from the table (only do this in a dev environment):
```sql
DELETE FROM weekly_intelligence_reports;
```

**Steps**:
1. Log in as admin
2. Navigate to `/admin/inteligencia-semanal`

**Expected Output**:
- Page loads without errors
- Header shows "Inteligencia Semanal" with a Brain icon
- A card with a dashed border appears in the center
- Text: "Nenhum relatorio gerado"
- A "Gerar Primeiro Relatorio" button is visible
- The status row at the top shows "—" / "Nenhum" for all fields

**Where to confirm**: Browser UI — no network calls should fail (verify in DevTools Network tab that the query to `weekly_intelligence_reports` returns an empty result, not an error).

---

### TC-02 — Manual Report Generation (Happy Path)

**Goal**: Confirm a manual trigger generates a complete report end-to-end.

**Setup**: Ensure test data prerequisites from section above are met.

**Steps**:
1. Navigate to `/admin/inteligencia-semanal`
2. Click "Gerar Agora" button (top-right)
3. Observe the UI while generation runs (should take 10–40 seconds)
4. Wait until status changes to "Concluido"

**Expected Inputs** (what the Edge Function receives):
- Body: `{ "period_days": undefined, "generation_method": "manual" }`
- The function will use `weekly_report_period_days` from `app_configs` (default: `7`)

**Expected Output** — UI:
- While generating: a loading skeleton replaces the content area, Loader2 spinner visible, status badge shows "Gerando..."
- After completion:
  - Status card row updates: shows today's date range, "Manual", "Concluido", cost in USD
  - **Resumo Executivo** card: 3–5 bullet points starting with emoji
  - **Leads Quentes sem Contato** card: table with lead names, phone, temperature badge (red for muito-quente, orange for quente), area, last contact date, and recommended action
  - **Oportunidades** section: 1–5 cards with urgency badges
  - **Alertas** section: 1–5 cards with severity badges (critical=red, warning=amber, info=blue)
  - **Pontos de Conversa** section: list of lead name + opener text + "Copiar" button
  - **Comparativo Semanal** section: paragraph comparing this week vs last
  - **Aprovacao para Assistente** card at the bottom

**Expected Output** — Database:
```sql
SELECT id, status, generation_method, model_used, tokens_used, cost_usd,
       duration_ms, webhook_dispatched, created_by
FROM weekly_intelligence_reports
ORDER BY created_at DESC LIMIT 1;
```
- `status = 'completed'`
- `generation_method = 'manual'`
- `model_used` is not null (e.g., `gpt-4o-mini` or similar)
- `tokens_used > 0`
- `cost_usd > 0`
- `duration_ms > 0`
- `webhook_dispatched = true`
- `created_by` = UUID of the admin user who clicked the button

**Expected Output** — Cost log:
```sql
SELECT edge_function, provider, model, input_tokens, output_tokens, cost_usd, status
FROM api_cost_logs
ORDER BY created_at DESC LIMIT 3;
```
- One row with `edge_function = 'generate-weekly-report'`, `status = 'success'`, `cost_usd > 0`

---

### TC-03 — Generating Status (Polling / Skeleton UI)

**Goal**: Confirm the UI polls and updates automatically while generation is in progress.

**Why this matters**: The Edge Function takes 10–40 seconds. The UI must not require a page refresh.

**Steps**:
1. Click "Gerar Agora"
2. Immediately watch the UI — do NOT refresh the page
3. Check the status row every few seconds

**Expected Behavior**:
- Within 1 second: UI shows skeleton/loader state, status badge turns to "Gerando..."
- Every 3 seconds: the UI re-queries the database (TanStack Query `refetchInterval: 3000`)
- When generation completes (DB `status` changes to `'completed'`): the skeleton disappears and the full report renders automatically
- Page title / status badge updates without any manual action

**How to verify polling**: Open DevTools → Network tab → filter by `weekly_intelligence_reports` — you should see a request every ~3 seconds while status is "generating".

---

### TC-04 — Error State (LLM Failure)

**Goal**: Confirm the error state is displayed and the user receives actionable feedback.

**How to simulate**: Temporarily set an invalid API key in `app_configs`:
```sql
UPDATE app_configs SET value = 'invalid_key' WHERE key = 'weekly_report_api_key';
```
Then click "Gerar Agora". Remember to restore afterward:
```sql
UPDATE app_configs SET value = 'openai_api' WHERE key = 'weekly_report_api_key';
```

**Expected Output** — UI:
- An error card appears with a red border
- Text: "Erro ao gerar relatorio"
- Error message text (from `error_message` column) describes what failed
- The "Gerar Agora" button remains available for retry

**Expected Output** — Database:
```sql
SELECT status, error_message FROM weekly_intelligence_reports ORDER BY created_at DESC LIMIT 1;
```
- `status = 'error'`
- `error_message` is not null (contains the LLM or API error)

**Expected Output** — Toast: a destructive toast notification at bottom-right with "Erro ao gerar relatorio" title.

---

### TC-05 — Hot Leads Section — Content Validation

**Goal**: Confirm that the hot leads table shows the right leads and excludes those with recent contact.

**Setup**: Prepare two hot leads for this test:
1. **Lead A** — temperature `muito-quente`, NO interactions in the last 7 days (no row in `lead_interactions` for this lead in the past week)
2. **Lead B** — temperature `quente`, WITH a recent interaction (add a row to `lead_interactions` with `created_at = NOW()`)

```sql
-- Add a recent interaction for Lead B (replace lead_id with actual UUID)
INSERT INTO lead_interactions (lead_id, type, channel, notes, created_at)
VALUES ('<lead_b_uuid>', 'call', 'phone', 'Test follow-up call', NOW());
```

**Steps**:
1. Generate a new report (TC-02)
2. Find the "Leads Quentes sem Contato" section

**Expected Output**:
- Lead A appears in the table
- Lead B does NOT appear (has recent contact within 7 days)
- Lead A row shows: name, phone (if filled), temperature badge, area, "Nunca contatado" or the date of last contact, recommended action from `recommended_first_action`
- Clicking the row navigates to `/admin/leads/<lead_a_uuid>`

**What if no hot leads appear**: Check the DB — if `lead_temperature` is stored as `"QUENTE"` (uppercase), the query won't match. Temperatures must be lowercase (`quente`, `muito-quente`). Check with:
```sql
SELECT DISTINCT lead_temperature FROM career_evaluations WHERE processing_status = 'completed';
```

---

### TC-06 — Report History (Last 12 Reports)

**Goal**: Confirm the history drawer shows up to 12 past reports and allows selecting any of them.

**Setup**: Generate at least 3 reports manually (run TC-02 three times, waiting for completion each time, or skip waiting and trigger them in sequence — each will still save to DB).

**Steps**:
1. On the `/admin/inteligencia-semanal` page, click the "Historico" button (top-right area)
2. The history sheet/drawer slides in
3. Observe the list of reports

**Expected Output**:
- Up to 12 entries shown, ordered newest first
- Each entry shows: date range (e.g., "20/02/2026 – 27/02/2026"), status badge, method (Manual/Agendado), cost
- Clicking an entry selects it and loads that report into the main view
- Clicking the same entry again deselects it, returning to the latest report

**What to check in DB**:
```sql
SELECT id, period_start, period_end, status, generation_method, cost_usd, created_at
FROM weekly_intelligence_reports
ORDER BY created_at DESC
LIMIT 12;
```
The history should match exactly what is shown in the UI.

---

### TC-07 — View Historical Report

**Goal**: Confirm that selecting an old report from history shows ITS data, not the latest report.

**Setup**: Generate 2 reports with different data (e.g., on different days, or change the period_days parameter between them).

**Steps**:
1. Open History drawer
2. Click on the second most recent report (not the latest)
3. The main content area updates

**Expected Output**:
- The "Periodo" in the status card row changes to the historical report's date range
- The executive summary, hot leads, and all sections reflect THAT report's `ai_analysis` data
- The status card shows the historical report's cost and duration
- The "Gerar Agora" button still generates a NEW report (does not overwrite the historical one)

---

### TC-08 — Approval for Assistant

**Goal**: Confirm the admin can approve a report for the sales assistant and add directives.

**Steps**:
1. Generate a report (TC-02)
2. Scroll to the bottom of the page — find the "Aprovacao para Assistente" card
3. Toggle the switch ON
4. Type directives in the textarea: `"Priorize o contato com leads que têm barreira financeira. Esta semana, foque em fechar vendas de consultoria (não mentoria)."`
5. Click "Salvar Aprovacao"

**Expected Output** — UI:
- A success toast: "Aprovacao atualizada"
- The switch remains ON after saving

**Expected Output** — Database:
```sql
SELECT id, approved_for_assistant, assistant_directives
FROM weekly_intelligence_reports
ORDER BY created_at DESC LIMIT 1;
```
- `approved_for_assistant = true`
- `assistant_directives` contains the text you typed

**Revoke Test**: Toggle the switch OFF, click "Salvar Aprovacao":
- `approved_for_assistant = false`
- `assistant_directives` can remain (or be cleared — either is valid)

**Where the assistant sees this**: The assistant's interface (if built) queries `weekly_intelligence_reports WHERE approved_for_assistant = true ORDER BY created_at DESC LIMIT 1`. Only approved reports are surfaced.

---

### TC-09 — N8N Webhook Dispatch

**Goal**: Confirm that generating a report dispatches the N8N webhook with the correct payload.

**Setup**:
1. In Supabase Dashboard → Table Editor → `n8n_automations`, find the row with `name = 'weekly_intelligence_report'`
2. Ensure `is_active = true`
3. The `webhook_url` should point to your N8N instance (e.g., `https://n8n.euanapratica.com/webhook/...`). If using a test webhook, use a service like `webhook.site` temporarily.

**Steps**:
1. Generate a report (TC-02)
2. After completion, check the webhook log:

```sql
SELECT trigger_event, status_code, payload_preview, error_message, dispatched_at
FROM n8n_webhook_logs
WHERE trigger_event = 'intelligence.weekly_report'
ORDER BY dispatched_at DESC LIMIT 1;
```

**Expected Output** — Database:
- `status_code = 200` (or the HTTP status returned by N8N/webhook.site)
- `error_message` is null
- `payload_preview` contains a snippet of the sent payload

**Expected Output** — Webhook payload (what N8N receives):
```json
{
  "event": "intelligence.weekly_report",
  "report_id": "<uuid>",
  "period": { "start": "2026-02-20", "end": "2026-02-27" },
  "executive_summary": "...",
  "hot_leads_count": 5,
  "new_leads_count": 12,
  "bookings_this_week": 3,
  "revenue_this_week_brl": 2400.00,
  "alerts_count": 2,
  "ai_analysis": { ... },
  "report_url": "https://hub.euanapratica.com/admin/inteligencia-semanal"
}
```

**Important**: The payload does NOT include `raw_metrics` (intentionally stripped for security/size) and does NOT include any emails.

**Also check** — `weekly_intelligence_reports`:
```sql
SELECT webhook_dispatched FROM weekly_intelligence_reports ORDER BY created_at DESC LIMIT 1;
```
- `webhook_dispatched = true`

**If webhook_url is null**: The function still completes without error. `webhook_dispatched` stays `false`. This is expected behavior — N8N integration is optional.

---

### TC-10 — Cost Tracking

**Goal**: Confirm that each report generation is logged in `api_cost_logs` with the correct provider, model, and a non-zero cost.

**Steps**:
1. Generate a report (TC-02)
2. Query the cost log:

```sql
SELECT
  edge_function,
  provider,
  model,
  input_tokens,
  output_tokens,
  cost_usd,
  duration_ms,
  status,
  metadata
FROM api_cost_logs
WHERE edge_function = 'generate-weekly-report'
ORDER BY created_at DESC LIMIT 1;
```

**Expected Output**:
- `edge_function = 'generate-weekly-report'`
- `provider` = `'openai'`, `'anthropic'`, or `'openrouter'` depending on which key is configured
- `model` matches the model in `api_configs` for the configured key
- `input_tokens > 500` (the prompt is large — 8 data blocks + system prompt)
- `output_tokens > 200` (the JSON response)
- `cost_usd > 0.0000` (not null, not zero)
- `status = 'success'`
- `metadata` may contain `{ "used_fallback": true }` if the primary API was unavailable

**If `cost_usd = 0` or null**: This indicates either:
1. The model name in `api_cost_logs.model` doesn't match any key in `app_configs.llm_model_pricing`
2. Token counts are null (LLM response parsing failed)
To diagnose: check `metadata->>'cost_warning'` field — it will say something like `"model_not_in_pricing:gpt-4o-mini"`.

**Also check in the admin UI**: Navigate to `/admin/custos-api` — the report generation should appear in the function cost table.

---

### TC-11 — Custom Period (30-Day Report)

**Goal**: Confirm that a manual generation with a custom period aggregates data over that wider window.

**Steps**: This requires calling the Edge Function directly with a custom period. You can test via:
1. Open browser DevTools → Console
2. Run:
```javascript
const { data, error } = await window.__supabase?.functions.invoke('generate-weekly-report', {
  body: { period_days: 30, generation_method: 'manual' }
});
console.log(data, error);
```
_(If `window.__supabase` is not accessible, use the Supabase Dashboard → Edge Functions → Test to invoke with this body.)_

**Expected Output** — Database:
```sql
SELECT period_start, period_end,
  (period_end - period_start) AS days_covered
FROM weekly_intelligence_reports
ORDER BY created_at DESC LIMIT 1;
```
- `days_covered` should be approximately 30 (28–31 days depending on exact calculation)
- `raw_metrics -> 'leads_pipeline' -> 'this_week' -> 'total'` should show more leads than a 7-day report

---

### TC-12 — Security: Unauthorized Access

**Goal**: Confirm that non-admin users cannot access the page or invoke the Edge Function.

#### 12a — UI Access Control

**Setup**: Log in as a non-admin user (a student or leads account).

**Steps**: Navigate to `/admin/inteligencia-semanal`

**Expected Output**: Redirect to `/` or `/dashboard`, or display a "403 Forbidden" / "Acesso negado" message. The page content must not be visible.

#### 12b — Direct Edge Function Call (No Token)

**Steps**: From a terminal or Postman, call the function without auth:
```bash
curl -X POST \
  'https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/generate-weekly-report' \
  -H 'Content-Type: application/json' \
  -d '{"period_days": 7}'
```

**Expected Output**:
```json
{"error": "Unauthorized"}
```
HTTP Status: `401`

#### 12c — Direct Edge Function Call (Student JWT)

**Steps**: Get a student user's JWT from their browser session (DevTools → Application → Local Storage → find the Supabase auth token). Call the function with that token:
```bash
curl -X POST \
  'https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/generate-weekly-report' \
  -H 'Authorization: Bearer <student_jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"period_days": 7}'
```

**Expected Output**:
```json
{"error": "Forbidden: Admin role required"}
```
HTTP Status: `403`

---

### TC-13 — Scheduled Generation (Cron Job Simulation)

**Goal**: Confirm the cron job path (`generation_method: 'scheduled'`) works without user auth.

**Why**: The cron runs with `x-internal-secret` (not a user JWT). This tests a different auth path than manual generation.

**Steps**:
1. Find the `INTERNAL_FUNCTION_SECRET` value:
```sql
SELECT value FROM app_configs WHERE key = 'internal_function_secret';
```
2. Simulate the cron call:
```bash
curl -X POST \
  'https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/generate-weekly-report' \
  -H 'x-internal-secret: <secret_value>' \
  -H 'Content-Type: application/json' \
  -d '{"generation_method": "scheduled"}'
```

**Expected Output** — HTTP: `200 OK` with `{ "report_id": "...", "status": "completed" }`

**Expected Output** — Database:
```sql
SELECT generation_method, created_by FROM weekly_intelligence_reports ORDER BY created_at DESC LIMIT 1;
```
- `generation_method = 'scheduled'`
- `created_by = NULL` (no user — cron has no user context)

**To verify the real cron runs correctly**: On a Monday, check Supabase Dashboard → Database → Extensions → pg_cron → Job Run Details for `generate-weekly-intelligence-report`. Status should be `succeeded`.

---

### TC-14 — Custom Prompt via app_configs

**Goal**: Confirm that the LLM prompt is read from `app_configs` at runtime, not hardcoded.

**Steps**:
1. Update the prompt to add a custom marker:
```sql
UPDATE app_configs
SET value = value || E'\n\nALWAYS include the phrase "RELATORIO CUSTOMIZADO" in your executive_summary.'
WHERE key = 'weekly_report_prompt';
```
2. Generate a new report (TC-02)
3. Check the executive summary section in the UI

**Expected Output**: The executive_summary text contains "RELATORIO CUSTOMIZADO" (or similar phrasing in Portuguese from the LLM interpreting the instruction).

4. Restore the original prompt:
```sql
-- Remove the custom marker (restore to original)
UPDATE app_configs
SET value = LEFT(value, LENGTH(value) - LENGTH(E'\n\nALWAYS include the phrase "RELATORIO CUSTOMIZADO" in your executive_summary.'))
WHERE key = 'weekly_report_prompt';
```

---

## Regression Checklist

After any change to the Edge Function or React components, run through this quick checklist:

| Check | How |
|---|---|
| Page loads without console errors | DevTools Console, no red errors |
| Generate button triggers generation | Click button, status changes to "Gerando..." |
| Skeleton shown while generating | Observe UI during generation |
| All 6 sections render on completion | Scroll through the completed report |
| Hot leads link to lead detail | Click any row in the hot leads table |
| Copy button works on talking points | Click "Copiar", paste into a text editor |
| History sheet opens | Click "Historico" |
| Historical report loads | Click any item in the history list |
| Approval save works | Toggle + type + save, check DB |
| No emails in LLM payload | Check Edge Function logs for DEBUG output |
| Webhook dispatched | Check `n8n_webhook_logs` |
| Cost logged | Check `api_cost_logs` |

---

## Known Limitations / Out of Scope

- **Real cron timing**: The Monday 09:00 UTC cron can only be fully tested by waiting for Monday or manually invoking via `x-internal-secret` (TC-13).
- **N8N downstream actions**: Testing what N8N does with the payload (sends email, Telegram, etc.) is outside the scope of this document — it belongs in N8N's own test suite.
- **LLM output quality**: The content of AI-generated text (quality of insights, accuracy of talking points) is a manual review concern, not an automated test. Review 2–3 reports per month with business stakeholders.
- **Fallback API testing**: If the primary API key is down and the fallback activates, check `api_cost_logs.metadata` for `"used_fallback": true`. Full fallback testing requires temporarily disabling the primary key's quota.
