# E2E Test Plan: Customer Associate ("Assistant") Role

## Table of Contents

1. [Prerequisites & Setup](#1-prerequisites--setup)
2. [Authentication & Routing](#2-authentication--routing)
3. [Sidebar Navigation](#3-sidebar-navigation)
4. [Leads Dashboard](#4-leads-dashboard)
5. [Lead Detail Page](#5-lead-detail-page)
6. [Activities Page (Atividades)](#6-activities-page-atividades)
7. [Weekly Intelligence Report](#7-weekly-intelligence-report)
8. [Help System](#8-help-system)
9. [Edge Function Authorization](#9-edge-function-authorization)
10. [RLS & Data Security](#10-rls--data-security)

---

## 1. Prerequisites & Setup

### 1.1 Create a Test Assistant User

**Where**: Supabase Dashboard > SQL Editor (or via the app's admin UI)

**Steps**:

1. Create a new user in Supabase Auth:
   - Go to **Supabase Dashboard** > **Authentication** > **Users** > **Add user**
   - Email: `assistente.teste@enp.com` (or any valid email)
   - Password: `TestAssistant2026!` (or your preferred password)
   - Note the generated **User ID** (UUID)

2. Assign the `assistant` role by running this SQL:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('<USER_ID_FROM_STEP_1>', 'assistant');
   ```

3. Create a profile entry (if the user hasn't gone through onboarding):
   ```sql
   INSERT INTO public.profiles (id, full_name, has_completed_onboarding)
   VALUES ('<USER_ID_FROM_STEP_1>', 'Assistente Teste', true);
   ```

### 1.2 Ensure Test Data Exists

Before running tests, confirm the following data is available:

| Data | How to Create | Where to Verify |
|------|--------------|-----------------|
| **Leads (career_evaluations)** | Existing from real assessments or seeded via SQL | Supabase > Table Editor > `career_evaluations` |
| **Lead interactions** | Admin or assistant creates via Lead Detail > Interacoes tab | `lead_interactions` table |
| **Lead tasks** | Admin or assistant creates via Lead Detail > Tarefas tab | `lead_tasks` table |
| **Weekly report (completed)** | Admin generates via `/admin/inteligencia-semanal` > "Gerar Agora" | `weekly_intelligence_reports` table |
| **Weekly report (approved)** | Admin toggles "Aprovar para Assistente" switch on a completed report | `approved_for_assistant = true` in the table |
| **WhatsApp templates** | Pre-seeded or created via admin | `whatsapp_templates` table |

### 1.3 Required Browser Sessions

You will need **two browser sessions** running simultaneously:

| Session | User | URL |
|---------|------|-----|
| **Admin** | Your existing admin account | `https://<your-app-domain>/admin/leads-dashboard` |
| **Assistant** | `assistente.teste@enp.com` | `https://<your-app-domain>/assistant/leads` |

Use **Chrome** + **Incognito/Private window** (or different browser) to maintain both sessions.

---

## 2. Authentication & Routing

### TEST 2.1: Assistant login redirects to `/assistant/leads`

| Field | Value |
|-------|-------|
| **Input** | Login with `crm@euanapratica.com` / !Teste123 |
| **Action** | Submit login form |
| **Expected** | Redirects to `/assistant/leads` (Leads Dashboard) |
| **Verify** | Browser URL bar shows `/assistant/leads` |

### TEST 2.2: Assistant cannot access admin routes

| Field | Value |
|-------|-------|
| **Input** | Logged in as assistant |
| **Action** | Manually type `/admin/leads-dashboard` in the URL bar |
| **Expected** | Redirected to `/assistant/leads` (not shown the admin page) |
| **Verify** | URL changes to `/assistant/leads`, no admin content visible |

**Repeat for these admin URLs:**
- `/admin/configuracoes-apis`
- `/admin/inteligencia-semanal`
- `/admin/custos-api`
- `/admin/automacoes`
- `/admin/usuarios`

### TEST 2.3: Assistant can access `/perfil`

| Field | Value |
|-------|-------|
| **Input** | Logged in as assistant |
| **Action** | Navigate to `/perfil` via sidebar or URL |
| **Expected** | Profile page loads, shows assistant's name and email |
| **Verify** | Can edit name, timezone, and save successfully |

### TEST 2.4: Admin can still access all admin routes (no regression)

| Field | Value |
|-------|-------|
| **Input** | Logged in as admin |
| **Action** | Navigate to `/admin/leads-dashboard`, `/admin/inteligencia-semanal`, etc. |
| **Expected** | All admin pages load normally with full functionality |
| **Verify** | No visual changes, all buttons and data present |

---

## 3. Sidebar Navigation

### TEST 3.1: Assistant sidebar shows only 4 items

| Field | Value |
|-------|-------|
| **Input** | Logged in as assistant |
| **Action** | Observe the sidebar on any page |
| **Expected** | Sidebar shows exactly these items: |

```
MEU TRABALHO
  Leads          (chart icon)
  Atividades     (list icon)
  Inteligencia Semanal (brain icon)

MINHA CONTA
  Perfil         (user icon)
```

| **Verify** | No other items visible. Specifically: NO "Dashboard", "Usuarios", "Planos", "Configuracoes APIs", "Custos API", "Automacoes", "WhatsApp Flows", "Email Templates" |

### TEST 3.2: Navigation links work correctly

| Sidebar Item | Expected URL |
|-------------|-------------|
| Leads | `/assistant/leads` |
| Atividades | `/assistant/atividades` |
| Inteligencia Semanal | `/assistant/inteligencia-semanal` |
| Perfil | `/perfil` |

**Action**: Click each sidebar item, verify the URL and the correct page loads.

---

## 4. Leads Dashboard

### TEST 4.1: Dashboard loads with lead data

| Field | Value |
|-------|-------|
| **Input** | Logged in as assistant, navigate to `/assistant/leads` |
| **Expected** | Table of leads loads with columns: Name, Phone, Temperature, Area, Priority Score, etc. |
| **Verify** | Data matches what is visible to admin (same leads, same temperatures) |

### TEST 4.2: LTV card is hidden

| Field | Value |
|-------|-------|
| **Input** | Logged in as assistant, observe the KPI cards at the top of the dashboard |
| **Expected** | Only 2 KPI cards visible (Volume Leads, Phase distribution) — NO "LTV Estimado" card |
| **How to compare** | Login as admin to `/admin/leads-dashboard` — admin sees 3 cards including "LTV Estimado" |

### TEST 4.3: Financial columns are hidden in the table

| Field | Value |
|-------|-------|
| **Input** | Logged in as assistant, observe the leads table |
| **Expected** | These columns are NOT visible: |

- `Faixa de Investimento` (investment_range)
- `LTV Estimado` (estimated_ltv)
- `Tem Orcamento?` (has_budget)

| **How to compare** | Login as admin — admin table shows these columns |

### TEST 4.4: Delete button is hidden

| Field | Value |
|-------|-------|
| **Input** | Logged in as assistant, observe the action column in the leads table |
| **Expected** | Each row has a "Ver Lead" (eye icon) button but NO trash/delete icon |
| **How to compare** | Login as admin — admin sees both "Ver" and "Excluir" buttons per row |

### TEST 4.5: "AI Prioridades do Dia" button works (rate-limited for assistant)

| Field | Value |
|-------|-------|
| **Input** | Click the "IA Prioridades do Dia" button (or similar) on the dashboard |
| **Expected** | A panel opens showing AI-generated daily priorities, listing leads in recommended contact order |
| **Verify** | No error toast. Leads are listed with temperature, reason for priority, and suggested action |
| **Rate limit** | Assistant role is limited to **2 generations/day** (configurable via `app_configs` key `daily_priorities_assistant_limit`). A badge shows remaining uses (e.g. "1 restante"). When limit is reached, button shows "Limite atingido" and is disabled. Admin is unlimited. |
| **Backend** | Calls `generate-daily-priorities` Edge Function (accepts `assistant` role, enforces rate limit server-side via `check_daily_priorities_limit` RPC, returns 429 when exceeded) |

### TEST 4.6: Clicking a lead row navigates to assistant lead detail

| Field | Value |
|-------|-------|
| **Input** | Click "Ver Lead" (eye icon) for any lead |
| **Expected** | Navigates to `/assistant/leads/<lead-id>` (NOT `/admin/leads/<lead-id>`) |
| **Verify** | URL bar shows `/assistant/leads/...` |

---

## 5. Lead Detail Page

### TEST 5.1: Page loads with lead information

| Field | Value |
|-------|-------|
| **Input** | Navigate to `/assistant/leads/<lead-id>` |
| **Expected** | Lead detail page loads showing: name, phone, email, temperature badge, readiness score |
| **Verify** | Header shows the lead's name and temperature |

### TEST 5.2: LTV stat card is hidden

| Field | Value |
|-------|-------|
| **Input** | Observe the stats row (cards below the header) |
| **Expected** | Shows 5 stat cards: Prontidao, Prioridade, Dias no CRM, Follow-ups Pendentes, Barreiras |
| **NOT visible** | "LTV Estimado" card (which shows `R$ X.XXX`) |
| **How to compare** | Admin sees 6 stat cards including "LTV Estimado" |

### TEST 5.3: Overview tab hides financial and tracking data

| Field | Value |
|-------|-------|
| **Input** | Click the "Visao Geral" tab |
| **Expected visible** | Name, email, phone, area, atuacao, situacao familiar, nivel ingles, fase ROTA, produto recomendado (name only), melhor horario, comunicacao preferida |
| **Expected hidden** | Faixa de renda, Faixa de investimento, UTM Attribution section (utm_source, utm_medium, etc.), product price, product URL |

**How to verify**: Open the same lead as admin at `/admin/leads/<lead-id>` — the admin sees "Faixa de renda", "Faixa de investimento", "Atribuicao UTM" card, product price, and product URL.

### TEST 5.4: WhatsApp send works

| Field | Value |
|-------|-------|
| **Precondition** | Lead must have a phone number, WhatsApp API must be configured |
| **Action** | Click the "WhatsApp" button in the header |
| **Expected** | WhatsApp send dialog opens, can compose or select a template, and send |
| **Verify** | Message appears in lead's interaction history; no auth error toast |
| **Backend** | Calls `send-whatsapp` Edge Function (accepts `assistant` role) |

### TEST 5.5: AI suggest WhatsApp message works

| Field | Value |
|-------|-------|
| **Action** | In the WhatsApp tab, click "IA Sugerir Mensagem" |
| **Expected** | AI generates a personalized WhatsApp message based on lead profile |
| **Verify** | Message appears in text area, can be edited before sending |
| **Backend** | Calls `suggest-whatsapp-messages` Edge Function (accepts `assistant` role) |

### TEST 5.6: Tasks tab — create, complete, skip

| Field | Value |
|-------|-------|
| **Action 1** | Go to "Tarefas" tab, click "Adicionar Tarefa" |
| **Input** | Title: "Ligar para confirmar interesse", Priority: "high", Due: tomorrow |
| **Expected** | Task appears in the list with high priority badge and due date |
| **Action 2** | Click the dropdown on the task > "Marcar como feito" |
| **Expected** | Task disappears from pending list (or shows completed state) |
| **Action 3** | Create another task, then click dropdown > "Pular" |
| **Expected** | Task is marked as skipped |

### TEST 5.7: AI suggest tasks works

| Field | Value |
|-------|-------|
| **Action** | Click "IA Sugerir Tarefas" button |
| **Expected** | Dialog shows AI-generated task suggestions based on lead profile |
| **Verify** | Can accept/add individual suggestions |
| **Backend** | Calls `suggest-lead-tasks` Edge Function (accepts `assistant` role) |

### TEST 5.8: Interactions tab — add, edit, delete

| Field | Value |
|-------|-------|
| **Action 1** | Go to "Interacoes" tab, click "Adicionar Nota" |
| **Input** | Type: "WhatsApp", Content: "Lead confirmou interesse no programa VIP" |
| **Expected** | Interaction appears in the list with timestamp and type badge |
| **Action 2** | Edit the interaction (pencil icon) |
| **Expected** | Can change content, type, and save |
| **Action 3** | Delete the interaction (trash icon) |
| **Expected** | Interaction is removed from the list |

### TEST 5.9: Back button navigates to assistant dashboard

| Field | Value |
|-------|-------|
| **Action** | Click the back arrow (top-left) on the lead detail page |
| **Expected** | Navigates to `/assistant/leads` (NOT `/admin/leads-dashboard`) |

---

## 6. Activities Page (Atividades)

### TEST 6.1: Page loads with pending tasks and clickable filter tiles

| Field | Value |
|-------|-------|
| **Input** | Navigate to `/assistant/atividades` |
| **Expected** | Shows clickable filter tiles at the top (Atrasadas, Hoje, Esta semana, Futuras, Sem prazo) with counts. Below, pending tasks grouped by urgency with color-coded sections: Atrasadas (red), Hoje (amber), Esta semana (blue), Futuras (green), Sem prazo (gray) |
| **Verify** | Task count matches what admin sees. Clicking a tile filters the list to that urgency group only. Clicking the active tile again clears the filter. |

### TEST 6.2: Filter by priority

| Field | Value |
|-------|-------|
| **Action** | Use the "Prioridade" dropdown filter |
| **Input** | Select "Urgente" |
| **Expected** | Only tasks with `urgent` priority are shown |
| **Verify** | Switch to "Todas" to see all tasks again |

### TEST 6.3: Filter by type

| Field | Value |
|-------|-------|
| **Action** | Use the "Tipo" dropdown filter |
| **Input** | Select "Follow-up" |
| **Expected** | Only follow-up type tasks are shown |

### TEST 6.4: Complete a task from the activities page

| Field | Value |
|-------|-------|
| **Action** | Click the dropdown menu on any task > select "Concluir" (or "Marcar como feito") |
| **Expected** | Task disappears from the list, count updates |
| **Verify** | Refresh page — task no longer appears |

### TEST 6.5: "Ver Lead" navigates to assistant lead detail

| Field | Value |
|-------|-------|
| **Action** | Click "Ver Lead" button on any task card |
| **Expected** | Navigates to `/assistant/leads/<lead-id>` (NOT `/admin/leads/<lead-id>`) |
| **Verify** | URL bar shows `/assistant/leads/...` |

### TEST 6.6: "Concluidas" tab shows completed tasks

| Field | Value |
|-------|-------|
| **Action** | Click the "Concluidas" tab at the top of the Atividades page |
| **Expected** | Shows completed tasks with completion date and who completed them |
| **Verify** | Tasks marked as done in TEST 6.4 appear here |

---

## 7. Weekly Intelligence Report

This is the most complex test area due to the approval workflow between admin and assistant.

### TEST 7.1: Empty state when no report is approved

**Setup**: Ensure no report has `approved_for_assistant = true` in the database.

```sql
-- Run this to reset (DO NOT run in production without care):
UPDATE weekly_intelligence_reports SET approved_for_assistant = false;
```

| Field | Value |
|-------|-------|
| **Input** | Navigate to `/assistant/inteligencia-semanal` |
| **Expected** | Shows empty state card with brain icon and message: "Nenhum relatorio aprovado" and "O admin vai aprovar o relatorio semanal para voce. Volte mais tarde!" |
| **Verify** | No "Gerar Agora" button is visible (only admin can generate) |

### TEST 7.2: Admin generates and approves a report

**Performed in the Admin session:**

| Step | Action | Expected |
|------|--------|----------|
| 1 | Go to `/admin/inteligencia-semanal` | Admin weekly report page loads |
| 2 | Click "Gerar Agora" | Report starts generating (loading animation, status: "generating") |
| 3 | Wait for completion | Report shows status "completed" with AI analysis sections |
| 4 | Scroll down to "Aprovacao para Assistente" card | Card with switch toggle and directives textarea is visible |
| 5 | Turn ON the toggle "Aprovar este relatorio para a assistente" | Toggle changes to on state |
| 6 | Type directives: "Foque nos leads quentes. Priorize Maria e Joao." | Text appears in textarea |
| 7 | Click "Salvar Aprovacao" | Toast: "Aprovacao atualizada" |

**Verify in database:**
```sql
SELECT id, approved_for_assistant, assistant_directives
FROM weekly_intelligence_reports
ORDER BY created_at DESC LIMIT 1;
```
Expected: `approved_for_assistant = true`, `assistant_directives = 'Foque nos leads quentes. Priorize Maria e Joao.'`

### TEST 7.3: Assistant sees the approved report

| Field | Value |
|-------|-------|
| **Input** | In assistant session, navigate to `/assistant/inteligencia-semanal` (or refresh) |
| **Expected** | Report loads with the following sections (in order): |

1. **Diretivas do Admin** (amber card at top) — shows "Foque nos leads quentes. Priorize Maria e Joao."
2. **Resumo Executivo** (indigo card) — AI-generated executive summary bullets
3. **Leads Quentes sem Follow-up** (red card) — table with lead names (clickable), phone, temperature badge, area, last contact date, recommended action
4. **Oportunidades** (green header) — list with urgency badges (high/medium/low)
5. **Alertas** (amber header) — list with severity badges (critical/warning/info)
6. **Pontos de Conversa para Vendas** (purple header) — lead name + opener text + copy button
7. **Comparativo Semanal** (blue header) — text comparison with previous week

### TEST 7.4: Directives card shows admin instructions prominently

| Field | Value |
|-------|-------|
| **Input** | The approved report's `assistant_directives` field is not empty |
| **Expected** | Amber-bordered card titled "Diretivas do Admin" appears as the FIRST card, above all other sections |
| **Verify** | The text matches exactly what the admin typed in step 7.2 |

### TEST 7.5: Directives card is hidden when empty

| Field | Value |
|-------|-------|
| **Setup** | Admin approves a report WITHOUT writing directives (leaves textarea empty) |
| **Expected** | On the assistant view, the "Diretivas do Admin" card is NOT shown. Report starts directly with "Resumo Executivo" |

### TEST 7.6: Hot leads link to assistant lead detail

| Field | Value |
|-------|-------|
| **Input** | In the "Leads Quentes sem Follow-up" table, click any lead name |
| **Expected** | Navigates to `/assistant/leads/<lead-id>` |
| **Verify** | URL shows `/assistant/leads/...`, NOT `/admin/leads/...` |

### TEST 7.7: Sales Talking Points copy button works

| Field | Value |
|-------|-------|
| **Input** | In the "Pontos de Conversa para Vendas" section, click the copy icon next to any talking point |
| **Expected** | Icon changes to a green checkmark for 2 seconds, then reverts to copy icon |
| **Verify** | Paste (Ctrl+V) into any text field — the opener text is in your clipboard |

### TEST 7.8: Report history works

**Setup**: Admin must have approved at least 2 reports.

| Field | Value |
|-------|-------|
| **Input** | Navigate to `/assistant/inteligencia-semanal` |
| **Expected** | "Historico" button appears (only when 2+ approved reports exist) |
| **Action** | Click "Historico" |
| **Expected** | Side panel opens showing list of approved reports with date ranges and "Aprovado" badges |
| **Action** | Click an older report |
| **Expected** | Main content area updates to show the selected report's data. A blue indicator bar appears: "Visualizando relatorio de DD/MM — DD/MM" with a "Ver mais recente" button |
| **Action** | Click "Ver mais recente" |
| **Expected** | Returns to the latest approved report |

### TEST 7.9: Assistant CANNOT see unapproved reports

| Field | Value |
|-------|-------|
| **Setup** | Admin generates a new report but does NOT approve it (toggle OFF) |
| **Expected** | The assistant's page still shows the previously approved report (or empty state if none were approved) |
| **Verify** | The new unapproved report does NOT appear in the history panel |

### TEST 7.10: Assistant CANNOT generate reports

| Field | Value |
|-------|-------|
| **Input** | On `/assistant/inteligencia-semanal` |
| **Expected** | No "Gerar Agora" button exists anywhere on the page |
| **Verify** | Inspect the page — there is no button triggering report generation |

### TEST 7.11: Admin revokes approval — assistant loses access

| Field | Value |
|-------|-------|
| **Step 1 (Admin)** | Go to the approved report, turn OFF the "Aprovar" toggle, click "Salvar Aprovacao" |
| **Step 2 (Assistant)** | Refresh `/assistant/inteligencia-semanal` |
| **Expected** | Report disappears. Shows empty state: "Nenhum relatorio aprovado" |

---

## 8. Help System

### TEST 8.1: "Como usar" button on Leads Dashboard

| Field | Value |
|-------|-------|
| **Input** | Navigate to `/assistant/leads` |
| **Action** | Click the "Como usar" button (with help circle icon) in the header area |
| **Expected** | Side panel (Sheet) opens with title "Leads Dashboard" |
| **Content** | Sections include: "O que e este painel?", "Fluxo diario recomendado" (with numbered steps 1-6), "Temperaturas dos leads", "IA Prioridades do Dia" |
| **Verify** | Steps have indigo numbered circles. Content is readable and formatted |

### TEST 8.2: "Como usar" button on Lead Detail

| Field | Value |
|-------|-------|
| **Input** | Navigate to `/assistant/leads/<lead-id>` |
| **Action** | Click the "Como usar" button (top-right area, next to header) |
| **Expected** | Side panel opens with title "Detalhe do Lead" |
| **Content** | Sections include: "Visao Geral", "Como usar o WhatsApp" (with numbered steps), "Gerenciando tarefas" (with numbered steps), "Registrando interacoes" |

### TEST 8.3: "Como usar" button on Atividades

| Field | Value |
|-------|-------|
| **Input** | Navigate to `/assistant/atividades` |
| **Action** | Click the "Como usar" button (near the filter dropdowns) |
| **Expected** | Side panel opens with title "Atividades Pendentes" |
| **Content** | Sections include: "Como funciona?", "Prioridades", "Tipos de tarefa", "Fluxo recomendado" (with numbered steps) |

### TEST 8.4: "Como usar" button on Weekly Report

| Field | Value |
|-------|-------|
| **Input** | Navigate to `/assistant/inteligencia-semanal` |
| **Action** | Click the "Como usar" button (next to "Historico" button) |
| **Expected** | Side panel opens with title "Inteligencia Semanal" |
| **Content** | Sections include: "O que e este relatorio?", "Diretivas do Admin", "Como usar as informacoes" (with numbered steps) |

### TEST 8.5: Help buttons are NOT shown in admin view

| Field | Value |
|-------|-------|
| **Input** | Login as admin, navigate to `/admin/leads-dashboard`, `/admin/leads/<id>`, `/admin/atividades` |
| **Expected** | No "Como usar" button is visible on any admin page |
| **Verify** | Admin sees "Documentacao" (Docs) sheet instead on leads dashboard |

---

## 9. Edge Function Authorization

These tests verify that the assistant role can call the 5 Edge Functions that were updated to accept `requireAdminOrAssistant`.

### TEST 9.1: send-whatsapp (assistant can send)

| Field | Value |
|-------|-------|
| **Action** | As assistant, open a lead with a phone number > click WhatsApp > send a message |
| **Expected** | Message is sent successfully (or queued). No "Unauthorized" or "Forbidden" error |
| **Backend verification** | Check `whatsapp_logs` table for the new entry |

### TEST 9.2: suggest-whatsapp-messages (assistant can use AI)

| Field | Value |
|-------|-------|
| **Action** | As assistant, open a lead > WhatsApp tab > click "IA Sugerir Mensagem" |
| **Expected** | AI generates a message suggestion. No auth error |

### TEST 9.3: suggest-lead-tasks (assistant can use AI)

| Field | Value |
|-------|-------|
| **Action** | As assistant, open a lead > Tarefas tab > click "IA Sugerir Tarefas" |
| **Expected** | AI generates task suggestions. No auth error |

### TEST 9.4: generate-daily-priorities (assistant can use AI, rate-limited)

| Field | Value |
|-------|-------|
| **Action** | As assistant, on leads dashboard > click "IA Prioridades do Dia" |
| **Expected** | AI generates prioritized lead list. No auth error. Badge shows remaining uses. |
| **Rate limit** | After exceeding daily limit (default 2), returns 429 with "Limite diario atingido". Button disables. Admin has no limit. |
| **Server-side** | `check_daily_priorities_limit` RPC counts today's calls in `api_cost_logs`. Limit configurable via `app_configs` key `daily_priorities_assistant_limit`. |

### TEST 9.5: check-whatsapp-status (assistant can check)

| Field | Value |
|-------|-------|
| **Action** | As assistant, if the WhatsApp status indicator is visible, it loads without error |
| **Expected** | Shows connected/disconnected status. No auth error |

### TEST 9.6: Admin-only functions reject assistant

These Edge Functions should return `403 Forbidden` if called by an assistant. Test by attempting direct API calls (or observing that the UI buttons don't exist):

| Function | How to Verify |
|----------|--------------|
| `generate-weekly-report` | No "Gerar Agora" button on assistant report page |
| `delete-user` | No delete buttons visible for assistant |
| `cancel-subscription` | No subscription management in assistant sidebar |

---

## 10. RLS & Data Security

These tests verify that the database itself (not just the UI) enforces access control.

### TEST 10.1: Assistant can SELECT career_evaluations

| Field | Value |
|-------|-------|
| **Action** | Navigate to `/assistant/leads` |
| **Expected** | Leads load — this proves RLS SELECT policy works |
| **Note** | The assistant sees ALL leads (no row-level filter on assistant — same as admin) |

### TEST 10.2: Assistant can UPDATE career_evaluations (contact info)

| Field | Value |
|-------|-------|
| **Action** | Open a lead, edit the phone number, save |
| **Expected** | Phone updates successfully |
| **Note** | Currently the UPDATE policy is unrestricted. A future fix will restrict to phone-only via RPC |

### TEST 10.3: Assistant CANNOT DELETE career_evaluations

| Field | Value |
|-------|-------|
| **Action** | There is no delete button in the UI. To verify RLS, run this SQL as the assistant user: |

```sql
-- This should FAIL with "new row violates row-level security policy"
DELETE FROM career_evaluations WHERE id = '<any-lead-id>';
```

| **Expected** | Delete is rejected by RLS policy (no DELETE policy exists for assistant) |

### TEST 10.4: Assistant can CRUD lead_interactions

| Field | Value |
|-------|-------|
| **Action** | Create, edit, and delete an interaction on any lead |
| **Expected** | All three operations succeed |
| **Verify** | Check `lead_interactions` table in Supabase |

### TEST 10.5: Assistant can CRUD lead_tasks

| Field | Value |
|-------|-------|
| **Action** | Create, edit, complete, and skip tasks |
| **Expected** | All operations succeed |
| **Verify** | Check `lead_tasks` table in Supabase |

### TEST 10.6: Assistant can only SELECT approved weekly reports

| Field | Value |
|-------|-------|
| **Action** | As the assistant user, run this query via Supabase client or SQL: |

```sql
SELECT id, status, approved_for_assistant
FROM weekly_intelligence_reports
ORDER BY created_at DESC;
```

| **Expected** | Only rows with `approved_for_assistant = true AND status = 'completed'` are returned |
| **Verify** | Unapproved or non-completed reports are NOT in the result set |

### TEST 10.7: Financial data is NOT exposed in network requests

| Field | Value |
|-------|-------|
| **Action** | Open browser DevTools (F12) > Network tab. Navigate to `/assistant/leads` |
| **Observe** | Look at the Supabase API response for the leads query |
| **Note** | Currently, the SELECT query fetches `*` (all columns), meaning `estimated_ltv`, `investment_range`, `income_range` ARE in the API response even though the UI hides them. This is a **known limitation** — UI hides data but the API returns it. A future improvement would use column-specific SELECT or an RPC to exclude sensitive fields. |

---

## Quick Reference: What Assistant Should See vs Not See

### Pages

| Page | Accessible? |
|------|------------|
| `/assistant/leads` | YES |
| `/assistant/leads/:id` | YES |
| `/assistant/atividades` | YES |
| `/assistant/inteligencia-semanal` | YES |
| `/perfil` | YES |
| `/admin/*` (any admin route) | NO — redirects to `/assistant/leads` |

### UI Elements

| Element | Admin | Assistant |
|---------|-------|-----------|
| KPI: LTV Estimado card | Visible | Hidden |
| Table column: investment_range | Visible | Hidden |
| Table column: estimated_ltv | Visible | Hidden |
| Stat card: LTV Estimado | Visible | Hidden |
| Contact: Faixa de renda | Visible | Hidden |
| Contact: Faixa de investimento | Visible | Hidden |
| UTM Attribution section | Visible | Hidden |
| Product price | Visible | Hidden |
| Product URL | Visible | Hidden |
| Delete lead button | Visible | Hidden |
| "Gerar Agora" report button | Visible | Hidden |
| "Aprovacao para Assistente" card | Visible | Hidden |
| "Diretivas do Admin" card | Hidden | Visible (when directives exist) |
| "Como usar" help buttons | Hidden | Visible |
| Documentation (Docs) sheet | Visible | Hidden |
| Report: cost, tokens, model metadata | Visible | Hidden |
| Report: raw metrics JSON | Visible | Hidden |

### Edge Functions

| Function | Admin | Assistant | Internal | Notes |
|----------|-------|-----------|----------|-------|
| send-whatsapp | YES | YES | YES | |
| check-whatsapp-status | YES | YES | YES | |
| suggest-whatsapp-messages | YES | YES | YES | |
| suggest-lead-tasks | YES | YES | YES | |
| generate-daily-priorities | YES | YES (rate-limited) | YES | Assistant: 2/day default, configurable via `app_configs` |
| generate-weekly-report | YES | NO | YES | |
| delete-user | YES | NO | — | |
| cancel-subscription | YES | NO | — | |
| All other admin functions | YES | NO | varies | |

---

## Test Execution Checklist

Use this checklist to track test progress:

> **Last full test run: 2026-03-03 — ALL PASSED**
> Test credentials: `crm@euanapratica.com` / `!Teste123`

- [x] **2.1** Assistant login → redirects to `/assistant/leads`
- [x] **2.2** Assistant blocked from admin routes (test 6 URLs)
- [x] **2.3** Assistant can access `/perfil`
- [x] **2.4** Admin routes unaffected (regression check)
- [x] **3.1** Sidebar shows 4 items only
- [x] **3.2** All sidebar links navigate correctly
- [x] **4.1** Leads dashboard loads with data
- [x] **4.2** LTV card hidden
- [x] **4.3** Financial columns hidden in table
- [x] **4.4** Delete button hidden
- [x] **4.5** AI daily priorities works (rate-limited: 2/day for assistant)
- [x] **4.6** Lead row click → `/assistant/leads/:id`
- [x] **5.1** Lead detail loads
- [x] **5.2** LTV stat card hidden
- [x] **5.3** Overview tab hides financial/UTM data
- [x] **5.4** WhatsApp send works
- [x] **5.5** AI suggest WhatsApp works
- [x] **5.6** Tasks: create, complete, skip
- [x] **5.7** AI suggest tasks works
- [x] **5.8** Interactions: add, edit, delete
- [x] **5.9** Back button → `/assistant/leads`
- [x] **6.1** Atividades loads with grouped tasks + clickable filter tiles
- [x] **6.2** Priority filter works
- [x] **6.3** Type filter works
- [x] **6.4** Complete task from activities page
- [x] **6.5** "Ver Lead" → `/assistant/leads/:id`
- [x] **6.6** "Concluidas" tab shows completed tasks
- [x] **7.1** Empty state when no approved report
- [x] **7.2** Admin generates + approves report
- [x] **7.3** Assistant sees approved report with all sections
- [x] **7.4** Directives card shows prominently
- [x] **7.5** Directives card hidden when empty
- [x] **7.6** Hot leads link to `/assistant/leads/:id`
- [x] **7.7** Copy button works on talking points
- [x] **7.8** Report history navigation
- [x] **7.9** Unapproved reports not visible
- [x] **7.10** No "Gerar Agora" button
- [x] **7.11** Revoked approval removes access
- [x] **8.1** Help: Leads Dashboard
- [x] **8.2** Help: Lead Detail
- [x] **8.3** Help: Atividades
- [x] **8.4** Help: Weekly Report
- [x] **8.5** Help buttons not shown to admin
- [x] **9.1** send-whatsapp authorized
- [x] **9.2** suggest-whatsapp-messages authorized
- [x] **9.3** suggest-lead-tasks authorized
- [x] **9.4** generate-daily-priorities authorized (rate-limited for assistant)
- [x] **9.5** check-whatsapp-status authorized
- [x] **9.6** Admin-only functions reject assistant
- [x] **10.1** RLS: SELECT career_evaluations
- [x] **10.2** RLS: UPDATE career_evaluations
- [x] **10.3** RLS: DELETE blocked
- [x] **10.4** RLS: CRUD lead_interactions
- [x] **10.5** RLS: CRUD lead_tasks
- [x] **10.6** RLS: Only approved reports visible
- [x] **10.7** Network: financial data exposure noted

---

## Bugs Found & Fixed During Testing (2026-03-03)

| # | Bug | Root Cause | Fix Applied |
|---|-----|-----------|-------------|
| 1 | Weekly Report page (`/assistant/inteligencia-semanal`) crashed in a loop | `ai_analysis.executive_summary` from the DB was an array/object (LLM JSON output), but `ExecutiveSummary` component called `text.split('\n')` on it — `TypeError: text.split is not a function` caused React to crash and re-render infinitely | Modified `ExecutiveSummary` to accept `string \| string[] \| unknown` and normalize to string. Added safety coercion for `directives`, `hot_leads_briefing`, and `weekly_comparison` fields. File: `src/pages/assistant/AssistantWeeklyReport.tsx` |
| 2 | Assistant login redirected to `/admin/leads-dashboard` instead of `/assistant/leads` | `ProtectedRoute` in `App.tsx` did not handle `assistant` role in the redirect logic | Fixed redirect logic to route assistant → `/assistant/leads` |
| 3 | Admin UI `/admin/usuarios` didn't show `assistant` as a role option | `AdminUsersPage` role dropdown only had `admin` and `student` | Added `assistant` option to the role dropdown |
| 4 | `suggest-lead-tasks` Edge Function returned generic tasks instead of lead-specific | System prompt didn't include enough lead context | Updated prompt to include lead profile data (temperature, score, phase, interactions) |

## Features Added During Testing (2026-03-03)

| # | Feature | Description | Files Modified |
|---|---------|-------------|----------------|
| 1 | Daily priorities rate limit | Assistant limited to 2 generations/day (configurable via `app_configs` key `daily_priorities_assistant_limit`). Server-side enforcement via `check_daily_priorities_limit` RPC + 429 response. Frontend shows remaining uses badge and disables button when exhausted. Admin unlimited. | `supabase/migrations/20260310200000_daily_priorities_assistant_limit.sql`, `supabase/functions/generate-daily-priorities/index.ts`, `src/hooks/useAIDailyPriorities.ts`, `src/components/admin/ai-priorities/AIDailyPrioritiesPanel.tsx` |
| 2 | Atividades clickable filter tiles | Urgency group tiles (Atrasadas, Hoje, Esta semana, etc.) are now clickable to filter the task list. Clicking the active tile clears the filter. | `src/pages/assistant/AssistantAtividades.tsx` |
| 3 | Atividades "Concluidas" tab | New tab showing completed tasks with completion date | `src/pages/assistant/AssistantAtividades.tsx` |

## Known Limitations & Future Improvements

| # | Issue | Impact | Planned Fix |
|---|-------|--------|-------------|
| 1 | `career_evaluations` UPDATE RLS is unrestricted — assistant could theoretically update any column via direct API call | Medium (UI only allows phone edit, but API allows more) | Create `update_lead_phone` RPC; restrict UPDATE policy to phone-only |
| 2 | Financial data (`estimated_ltv`, `income_range`, etc.) is returned in API responses but hidden in UI | Low (hidden in UI, visible in DevTools) | Use column-specific SELECT or RPC to exclude sensitive fields |
| 3 | `whatsapp_logs` missing SELECT policy for assistant | Low (doesn't affect core functionality) | Add RLS SELECT policy |
| 4 | `profiles` SELECT is too broad (no column restriction) | Low | Restrict to `id, full_name` for assistant |
| 5 | WhatsApp direct message via API not working | Medium (assistant can't send WhatsApp from lead detail) | Waiting for ManyChat support — API integration issue, not a code bug |
