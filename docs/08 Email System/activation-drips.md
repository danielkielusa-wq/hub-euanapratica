# Email Activation Drips — Documentation

## Overview

Two automated email drip sequences that activate users after they join the platform, guiding them to use the available tools.

| Drip | Audience | Trigger | Steps | Goal |
|------|----------|---------|-------|------|
| **Ativacao Free** | Users who complete onboarding (no subscription) | `onboarding.completed` | 5 emails (D3-D14) | Introduce features, encourage upgrade |
| **Onboarding de Assinante** | Pro/VIP subscribers (payment via Ticto) | `subscription.activated` | 5 emails (D1-D10) | Activate all features, maximize retention |

---

## Drip 1: Ativacao Free (Usuarios Gratuitos)

**Trigger:** User completes onboarding flow (`send-welcome-email` fires `triggerEmailAutomation("onboarding.completed")`)

**Conversion check:** If the user subscribes (Pro/VIP) during the drip, the sequence stops automatically (`stop_on_subscription: true`).

| Day | Template Name | Subject | What It Does |
|-----|--------------|---------|--------------|
| D3 | `activation_free_d3_credits` | Seus creditos gratuitos | Presents 5 monthly credits and lists all 3 tools with costs |
| D5 | `activation_free_d5_jobtitle` | Traduza seu cargo | Explains why literal job title translation fails, CTA to Title Translator (1 credit) |
| D7 | `activation_free_d7_primejobs` | Vagas que patrocinam visto | Introduces Prime Jobs with verified H-1B sponsor filter (1 credit) |
| D10 | `activation_free_d10_resumepass` | Otimize seu curriculo | ResumePass AI pitch — ATS-friendly resume (3 credits, fits in free plan) |
| D14 | `activation_free_d14_upgrade` | Desbloqueie todo o potencial | Upgrade CTA: 30 credits, full report, mentoria. Dual CTA: plans + consultoria |

### Flow Diagram

```
User completes onboarding
       |
  send-welcome-email
  (sends onboarding_welcome)
       |
  triggerEmailAutomation("onboarding.completed")
       |
  process-email-automations (event trigger)
       |
  enrollInDrip("Ativacao Free")
       |
  Cron every 15min: handleDripProcessor()
       |
  D3 --> D5 --> D7 --> D10 --> D14
       |
  (stops if user subscribes Pro/VIP)
```

---

## Drip 2: Onboarding de Assinante (Pro/VIP)

**Trigger:** Ticto payment webhook activates subscription -> `triggerEmailAutomation("subscription.activated")`

| Day | Template Name | Subject | What It Does |
|-----|--------------|---------|--------------|
| D1 | `onboarding_sub_d1` | Bem-vindo ao plano | Overview of all features + CTA to dashboard |
| D3 | `onboarding_sub_d3` | Ja usou o ResumePass AI? | Direct CTA to optimize resume |
| D5 | `activation_pro_d5_jobtitle` | Traduza seus titulos | Title Translator with pro tip (use before ResumePass) |
| D7 | `activation_pro_d7_primejobs` | Vagas com patrocinio de visto | Prime Jobs with verified H-1B sponsors |
| D10 | `activation_pro_d10_community` | Comunidade e Mentoria | Mentoria individual + community access |

---

## How It Works (Technical)

### Components

| Component | Path | Role |
|-----------|------|------|
| Templates | `email_templates` table | HTML content, editable via Unlayer in `/admin/email-templates` |
| Automations | `email_automations` table | Drip config: trigger, steps, template mapping |
| Enrollments | `email_drip_enrollments` table | Tracks progress per recipient (current_step, next_send_at) |
| Drip Processor | `process-email-automations` (mode: `drip_processor`) | Cron every 15min, sends due steps |
| Trigger | `send-welcome-email` / `ticto-webhook` | Fires `triggerEmailAutomation()` to enroll users |
| Campaign Service | `_shared/emailCampaignService.ts` | Unsubscribe check, tracking pixel, HMAC unsubscribe link |

### Drip Step Timing

`delay_days` in each step is relative to the **previous step completion**, not to enrollment:

```
Step 0: delay_days=3  -> fires 3 days after enrollment (D3)
Step 1: delay_days=2  -> fires 2 days after D3 (D5)
Step 2: delay_days=2  -> fires 2 days after D5 (D7)
Step 3: delay_days=3  -> fires 3 days after D7 (D10)
Step 4: delay_days=4  -> fires 4 days after D10 (D14)
```

### Conversion Check

The Free drip has `metadata: { stop_on_subscription: true }`. Before each step, the drip processor:

1. Looks up the user by `user_id` or `email` in `profiles`
2. Checks `user_subscriptions` for `status = 'active'`
3. If found, marks enrollment as `completed` with `metadata: { stopped_reason: "converted_to_subscriber" }`

This prevents a user who upgraded to Pro from receiving the remaining Free drip emails (including the D14 upgrade CTA).

### Deduplication

The `email_drip_enrollments` table has a UNIQUE constraint on `(automation_id, email)`. If the same user triggers `onboarding.completed` twice, the second enrollment is silently ignored (`ON CONFLICT ... ignoreDuplicates: true`).

---

## Editing Templates

All templates are editable in the admin panel at `/admin/email-templates`.

### Visual Identity

All activation drip templates share a consistent design:

- **Header:** Gradient background (`#1e3a5f` to `#2563eb`), white title text
- **Body:** White card, 30px padding, dark text (#333)
- **CTA button:** Blue (#2563eb), white text, 8px border-radius
- **Feature cards:** Light blue background (#f0f7ff) with left border accent
- **Footer:** Light gray (#f8f9fa), copyright text, unsubscribe link

### Variables Available

| Variable | Used In | Description |
|----------|---------|-------------|
| `{{firstName}}` | Free drip | User's first name |
| `{{recipientName}}` | Pro/VIP drip | Full name |
| `{{trackingPixel}}` | All | 1x1 pixel for open tracking |
| `{{unsubscribeLink}}` | All | HMAC-signed unsubscribe URL |

### Adding/Editing

1. Go to `/admin/email-templates`
2. Find the template (category: "campaign")
3. Click edit icon to open Unlayer editor
4. Make changes, click Save
5. Changes are live immediately — no deploy needed

---

## Monitoring

### Admin Panel

- **Automations:** `/admin/campanhas-email` shows automation status, total sent, last triggered
- **Drip Enrollments:** Query `email_drip_enrollments` to see individual user progress

### Useful Queries

```sql
-- Active drip enrollments
SELECT de.email, de.recipient_name, de.current_step, de.next_send_at, ea.name
FROM email_drip_enrollments de
JOIN email_automations ea ON ea.id = de.automation_id
WHERE de.status = 'active'
ORDER BY de.next_send_at;

-- Enrollments stopped by conversion
SELECT de.email, de.recipient_name, de.metadata
FROM email_drip_enrollments de
WHERE de.metadata->>'stopped_reason' = 'converted_to_subscriber';

-- Automation stats
SELECT name, enabled, total_sent, total_skipped, last_triggered_at
FROM email_automations
WHERE is_drip = true
ORDER BY name;
```

---

## Cron Jobs

| Job | Schedule | What It Does |
|-----|----------|--------------|
| `process-email-drips` | Every 15 minutes | Processes due drip steps |
| `process-email-automations-daily` | 10:00 UTC (7:00 BRT) | Runs daily cron automations (hot leads, win-back, etc.) |
| `process-email-automations-weekly` | Monday 10:00 UTC | Runs weekly cron automations (inactive subscribers, cold leads) |

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| User not enrolled in drip | `send-welcome-email` not triggering `triggerEmailAutomation` | Check Edge Function logs for `send-welcome-email` |
| Drip not advancing | Cron job `process-email-drips` not running | Check `pg_cron` jobs: `SELECT * FROM cron.job WHERE jobname = 'process-email-drips'` |
| Email not sending | Template disabled or unsubscribed | Check `email_templates.enabled` and `email_unsubscribes` |
| Free drip not stopping after upgrade | `metadata.stop_on_subscription` missing | Verify automation metadata in DB |
| Duplicate enrollments | Should be impossible (UNIQUE constraint) | Check `email_drip_enrollments` for constraint |
