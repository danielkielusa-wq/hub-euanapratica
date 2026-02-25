# Email System — Developer Reference

## Architecture Overview

All transactional emails flow through a single centralized service. The database is the source of truth for both content and routing.

```
Admin UI (Unlayer editor)
        ↓
  email_templates table (Supabase)
        ↓
  get_email_template_by_name() RPC
        ↓
  emailTemplateService.ts (_shared)
        ↓
  Resend API → recipient
```

---

## Database

### Table: `public.email_templates`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK, auto-generated |
| `name` | TEXT UNIQUE | Machine identifier used in code (e.g. `booking_confirmation`) |
| `display_name` | TEXT | Human-readable name shown in admin UI |
| `subject` | TEXT | Email subject — supports `{{variable}}` syntax |
| `body_html` | TEXT | Final HTML from Unlayer — used for sending |
| `design_json` | JSONB | Unlayer design state — used for re-editing |
| `variables` | JSONB | Array of variable names: `["{{name}}", "{{date}}"]` |
| `category` | TEXT | `subscription` \| `booking` \| `espaco` \| `system` |
| `description` | TEXT | Internal note on when this template fires |
| `enabled` | BOOLEAN | Toggle without deleting. Disabled = email silently skipped |
| `created_at` / `updated_at` | TIMESTAMPTZ | Auto-managed |
| `created_by` / `updated_by` | UUID | Admin user reference |

### RLS Policies
All four operations (SELECT, INSERT, UPDATE, DELETE) restricted to `has_role(auth.uid(), 'admin')`.
Edge Functions bypass RLS via the RPC below.

### RPC: `get_email_template_by_name(p_template_name TEXT)`
`SECURITY DEFINER` function — called with `service_role` key from Edge Functions.
Returns only **enabled** templates. Returns empty if template not found or disabled.

```sql
-- Called from emailTemplateService.ts:
SELECT * FROM get_email_template_by_name('booking_confirmation');
```

---

## Shared Service: `emailTemplateService.ts`

**Location:** `supabase/functions/_shared/emailTemplateService.ts`

### `sendTemplatedEmail(options)`

```typescript
interface SendTemplatedEmailOptions {
  templateName: string;              // Must match email_templates.name
  to: string | string[];             // Recipient(s)
  variables: Record<string, string>; // Keys are "{{varName}}" with braces
  from?: string;                     // Optional override (defaults to api_configs)
}

interface EmailResult {
  success: boolean;
  message?: string;
  emailSent: boolean; // false if template missing/disabled or Resend not configured
}
```

**Behavior:**
1. Fetches template from DB via RPC
2. If template missing or disabled → returns `{ success: true, emailSent: false }` (silent skip, no error)
3. Performs regex substitution of all `{{variable}}` placeholders in both subject and body
4. Gets Resend API key from `api_configs` table via `getApiConfig("resend_email")`
5. POSTs to `https://api.resend.com/emails`
6. Returns result

**Variable substitution:**
```typescript
// Variables map uses the full placeholder as key including braces
variables: {
  "{{studentName}}": booking.student.full_name,
  "{{serviceName}}": booking.service.name,
}
```

**Conditional/optional content:**
For sections that are conditionally present (e.g., meeting link, cancellation reason), the Edge Function pre-renders the HTML snippet and passes it as a variable. The template contains `{{meetingLinkSection}}` as a placeholder; the Edge Function sets it to either the full HTML block or an empty string.

```typescript
let meetingLinkSection = "";
if (booking.meeting_link) {
  meetingLinkSection = `<a href="${booking.meeting_link}">Entrar na Reunião</a>`;
}
// Then pass: "{{meetingLinkSection}}": meetingLinkSection
```

---

## Edge Functions

### Template Name Mapping

| Edge Function | Trigger | Template Name(s) |
|---------------|---------|-----------------|
| `send-welcome-email` | `useCompleteOnboarding` `onSuccess` (frontend) | `onboarding_welcome` |
| `send-subscription-email` | `ticto-webhook` (server-side, on activation/dunning/cancellation) | `subscription_confirmation` |
| | `cancel-subscription` (server-side, on user-initiated cancel) | `subscription_payment_failure` |
| | | `subscription_cancellation` |
| | (manual/cron — not yet automated) | `subscription_renewal_reminder` |
| `send-booking-confirmation` | `useCreateBooking` `onSuccess` (frontend) | `booking_confirmation` |
| `send-booking-reminder` | pg_cron every 15 min (24h before) | `booking_reminder` |
| `send-booking-reminder` | pg_cron every 15 min (1h before) | `booking_reminder_1h` |
| `send-booking-rescheduled` | `useRescheduleBooking` `onSuccess` (frontend) | `booking_rescheduled` |
| `send-booking-cancelled` | `useCancelBooking` `onSuccess` (frontend) | `booking_cancelled` |
| `send-booking-cancelled` | No-show (manual/admin) | `booking_no_show` |
| `send-espaco-invitation` | Mentor invites student (frontend) | `espaco_invitation` |
| `send-session-reminder` | pg_cron every 15-30 min (creates notifications, not emails) | N/A |
| `send-prime-jobs-digest` | pg_cron weekly Monday 9:00 BRT (uses Resend directly) | N/A |
| `send-test-email` | Admin-initiated (UI) | any template |

### Admin Test Email: `send-test-email`

Admin-only function callable from the `/admin/email-templates` UI via the "Enviar Teste" dropdown item or the "Enviar Teste" button in the preview dialog.

**Key differences from production sending:**
- Queries `email_templates` directly (not via RPC), so it can send **disabled** templates too
- Prefixes the subject with `[TESTE]` after variable substitution
- Recipient, subject, and variables are all editable in the dialog before sending

**Dialog defaults:** Smart placeholder values are pre-filled for all known variables (`{{firstName}}` → "Maria", etc.) including pre-rendered HTML snippets for conditional blocks (`{{meetingLinkSection}}`, etc.).

**Trigger patterns:**

**Welcome email** — `useCompleteOnboarding` hook `onSuccess`, awaited with error check:
```typescript
// src/hooks/useOnboarding.ts (onSuccess callback)
if (user?.id) {
  const { error: fnError } = await supabase.functions.invoke('send-welcome-email', {
    body: { user_id: user.id },
  });
  if (fnError) console.error('Welcome email function error:', fnError);
}
```

**Booking emails** — fire-and-forget from booking hooks with `.then()` error check:
```typescript
// src/hooks/useCreateBooking.ts (onSuccess callback)
supabase.functions.invoke('send-booking-confirmation', {
  body: { booking_id: bookingId },
}).then(({ error }) => {
  if (error) console.error('Booking confirmation email error:', error);
});
```

**Subscription emails** — server-to-server via `fetch` with `x-internal-secret`:
```typescript
// supabase/functions/ticto-webhook/index.ts (after handleSubscriptionEvent)
fetch(`${supabaseUrl}/functions/v1/send-subscription-email`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-internal-secret": internalSecret,
  },
  body: JSON.stringify({ type: "confirmation", user_id: emailUserId }),
}).catch(err => console.error("Subscription email trigger error:", err));
```

### Calling a Function from Another Edge Function

Use `fetch` with the `x-internal-secret` header (not `supabase.functions.invoke`):
```typescript
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

fetch(`${supabaseUrl}/functions/v1/send-booking-confirmation`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-internal-secret": internalSecret,
  },
  body: JSON.stringify({ booking_id: "uuid-here" }),
}).catch(err => console.error("Error:", err));
```

### Cron Jobs (pg_cron + pg_net)

Three functions are triggered on schedule via `pg_cron` → `invoke_edge_function()` helper:

| Job Name | Schedule | Function | Payload |
|----------|----------|----------|---------|
| `send-booking-reminder-24h` | Every 15 min | `send-booking-reminder` | `{"hours_before": 24}` |
| `send-booking-reminder-1h` | Every 15 min | `send-booking-reminder` | `{"hours_before": 1}` |
| `send-session-reminder-24h` | Every 30 min | `send-session-reminder` | `{"type": "reminder_24h"}` |
| `send-session-reminder-1h` | Every 15 min | `send-session-reminder` | `{"type": "reminder_1h"}` |
| `send-prime-jobs-digest-weekly` | Mon 12:00 UTC (9:00 BRT) | `send-prime-jobs-digest` | `{}` |

**Auth**: The `invoke_edge_function()` SQL helper reads the `internal_function_secret` from `app_configs` and passes it as the `x-internal-secret` header. Edge Functions validate via `requireAuthOrInternal()` → `validateInternalCall()`.

**Migration**: `20260224500000_schedule_email_cron_jobs.sql`

**Env var**: `INTERNAL_FUNCTION_SECRET` must be set on Edge Functions to match the value in `app_configs`:
```bash
npx supabase secrets set INTERNAL_FUNCTION_SECRET=<value-from-app_configs>
```

---

## Adding a New Email Type

1. **Insert a row** in `email_templates` (via admin UI or migration):
   ```sql
   INSERT INTO public.email_templates
     (name, display_name, subject, body_html, variables, category, description)
   VALUES
     ('my_new_email', 'My New Email', 'Subject with {{var}}',
      '<html>...{{var}}...</html>',
      '["{{var}}"]', 'system', 'Sent when X happens');
   ```

2. **Create or update an Edge Function** that calls:
   ```typescript
   import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";

   const result = await sendTemplatedEmail({
     templateName: "my_new_email",
     to: userEmail,
     variables: {
       "{{var}}": "actual value",
     },
   });
   ```

3. **Deploy the function:**
   ```bash
   npx supabase functions deploy my-new-function
   ```

No migration required if the template is created via admin UI. No code deploy required if only the template content changes.

---

## Resend Configuration

API key stored encrypted in `api_configs` table under `name = "resend_email"`.
Retrieved at send time via `getApiConfig("resend_email")` — never hardcoded.

The `from` address defaults to `resendConfig.parameters?.from` or `"EUA na Prática <noreply@euanapratica.com>"`.

---

## Admin UI

- **Route:** `/admin/email-templates`
- **Hook:** `src/hooks/useAdminEmailTemplates.ts`
- **Page:** `src/pages/admin/AdminEmailTemplates.tsx`
- **Dialog (edit):** `src/components/admin/email-templates/EmailTemplateDialog.tsx`
- **Dialog (preview):** `src/components/admin/email-templates/EmailTemplatePreviewDialog.tsx`
- **Dialog (test send):** `src/components/admin/email-templates/SendTestEmailDialog.tsx`
- **Edge Function (test send):** `supabase/functions/send-test-email/index.ts`
- **Editor:** Unlayer (`react-email-editor` v1.7.11)

Both `body_html` (for sending) and `design_json` (for re-editing in Unlayer) are stored. Saving the dialog exports from Unlayer to get both.

---

## Common Gotchas

### 1. `verify_jwt = false` required in `config.toml`

Every Edge Function that handles its own authentication (via `requireAdmin` or `requireAuthOrInternal`) **must** have `verify_jwt = false` in `supabase/config.toml`. Without it, the Supabase gateway validates the JWT itself and may return a response without proper CORS headers — causing the browser to throw `FunctionsFetchError: Failed to send a request to the Edge Function`.

```toml
# supabase/config.toml
[functions.my-new-function]
verify_jwt = false
```

After adding, redeploy the function: `npx supabase functions deploy my-new-function`

### 2. `service_role` needs table GRANT for direct queries

Functions that query a table directly (not through the `get_email_template_by_name` RPC) need an explicit GRANT:

```sql
GRANT ALL ON public.email_templates TO service_role;
```

Without this, `service_role` gets an empty result set (or permission error) even though it bypasses RLS. The RPC approach (`SECURITY DEFINER`) avoids this because it runs as the function owner (postgres).

### 3. Use `getCorsHeaders(req)` not the static `corsHeaders` export

The static `corsHeaders` export from `authGuard.ts` always returns `Access-Control-Allow-Origin: https://hub.euanapratica.com`. This blocks requests from localhost during development.

```typescript
// ❌ Static — always returns prod origin
import { corsHeaders } from "../_shared/authGuard.ts";
return new Response(null, { headers: corsHeaders });

// ✅ Dynamic — reflects the actual request origin (including localhost)
import { getCorsHeaders } from "../_shared/authGuard.ts";
const cors = getCorsHeaders(req);
return new Response(null, { headers: cors });
```

### 4. Table GRANT vs RLS — the "permission denied" error

`GRANT ALL ON public.<table> TO authenticated` must exist for PostgREST to even evaluate RLS policies. Without the grant, users get `"permission denied for table"` before RLS is ever checked.

### 5. `supabase.functions.invoke()` never rejects — check `{ error }` field

`supabase.functions.invoke()` always resolves its promise. Errors (CORS, auth, network) are returned in the resolved `{ error }` object. Using `.catch()` alone is a **silent no-op** that swallows all failures.

```typescript
// ❌ WRONG — .catch() never fires, errors are silently lost
supabase.functions.invoke('send-welcome-email', { body: { user_id } })
  .catch((err) => console.error('Error:', err));

// ✅ CORRECT — check the resolved { error } field
supabase.functions.invoke('send-welcome-email', { body: { user_id } })
  .then(({ error }) => {
    if (error) console.error('Error:', error);
  });

// ✅ ALSO CORRECT — await with destructuring
const { error } = await supabase.functions.invoke('send-welcome-email', {
  body: { user_id },
});
if (error) console.error('Error:', error);
```

### 6. `Access-Control-Allow-Methods` header required for CORS

`getCorsHeaders(req)` must include `Access-Control-Allow-Methods: POST, OPTIONS`. Without it, browsers reject preflighted requests (any request with `Authorization` header) silently.

### 7. `INTERNAL_FUNCTION_SECRET` env var for server-to-server calls

Edge Functions validate internal calls via `validateInternalCall()` which checks the `x-internal-secret` header against:
1. `INTERNAL_FUNCTION_SECRET` env var (preferred)
2. `SUPABASE_SERVICE_ROLE_KEY` env var (fallback — logs a warning)

Set the secret:
```bash
npx supabase secrets set INTERNAL_FUNCTION_SECRET=<your-secret>
```
The same value must exist in `app_configs` table (key: `internal_function_secret`) for pg_cron jobs to read it.

---

## Deployment Checklist

```bash
# 1. Push schema changes (includes cron job schedules)
npx supabase db push --include-all

# 2. Regenerate TypeScript types
npx supabase gen types typescript --project-id seqgnxynrcylxsdzbloa > src/integrations/supabase/types.ts

# 3. Verify build
npm run build

# 4. Deploy all email Edge Functions
npx supabase functions deploy send-welcome-email send-subscription-email \
  send-booking-confirmation send-booking-reminder send-booking-rescheduled \
  send-booking-cancelled send-espaco-invitation send-test-email \
  send-session-reminder send-prime-jobs-digest

# 5. Deploy Edge Functions that trigger emails
npx supabase functions deploy ticto-webhook cancel-subscription

# 6. Ensure INTERNAL_FUNCTION_SECRET is set (for cron + server-to-server calls)
npx supabase secrets set INTERNAL_FUNCTION_SECRET=<value-from-app_configs>
```

---

**Last Updated**: 2026-02-24
**Version**: 1.1
