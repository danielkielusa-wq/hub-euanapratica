# Title Translator — Technical Documentation

**Last Updated:** February 19, 2026
**Audience:** Software Engineers
**Status:** Production

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Folder Structure](#folder-structure)
4. [Database Schema](#database-schema)
5. [Core Features](#core-features)
6. [API Endpoints & Server Actions](#api-endpoints--server-actions)
7. [Business Logic](#business-logic)
8. [External Integrations](#external-integrations)
9. [Environment Variables](#environment-variables)
10. [Known Issues & TODOs](#known-issues--todos)
11. [Local Setup](#local-setup)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  TitleTranslator.tsx (UI)                               │   │
│  │  ├─ Form (titleBr, area, responsibilities, years)       │   │
│  │  └─ Results Display (3 suggestions + reasoning)         │   │
│  └─────────────────┬───────────────────────────────────────┘   │
│                    │                                            │
│  ┌─────────────────▼───────────────────────────────────────┐   │
│  │  useTitleTranslator.ts (React Hook)                     │   │
│  │  ├─ Form state management                               │   │
│  │  ├─ Quota fetching (get_app_quota RPC)                  │   │
│  │  ├─ Client-side quota check                             │   │
│  │  └─ Call supabase.functions.invoke('translate-title')   │   │
│  └─────────────────┬───────────────────────────────────────┘   │
└────────────────────┼───────────────────────────────────────────┘
                     │
                     │ HTTP POST (Authorization: Bearer token)
                     │ Body: { titleBr, area, responsibilities, years }
                     │
┌────────────────────▼───────────────────────────────────────────┐
│              SUPABASE EDGE FUNCTION                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  translate-title/index.ts                               │   │
│  │  1. Auth check (validate JWT)                           │   │
│  │  2. Server-side quota check (usage_logs + plans)        │   │
│  │  3. Fetch AI prompt from app_configs                    │   │
│  │  4. Fetch API provider from app_configs                 │   │
│  │  5. Build prompt with user data                         │   │
│  │  6. Call OpenAI or Anthropic API                        │   │
│  │  7. Parse JSON response                                 │   │
│  │  8. Record usage (usage_logs + audit_events)            │   │
│  │  9. Save translation (title_translations)               │   │
│  │  10. Return result                                      │   │
│  └─────────────────┬───────────────────────────────────────┘   │
└────────────────────┼───────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼────────┐ ┌▼────────────────┐
│ OpenAI API   │ │ Claude API│ │ Supabase DB     │
│ gpt-4o-mini  │ │ (fallback)│ │ - usage_logs    │
│ JSON Schema  │ │ Messages  │ │ - title_trans.  │
└──────────────┘ └───────────┘ │ - audit_events  │
                                └─────────────────┘
```

**Flow Summary:**
1. User fills form in UI
2. React hook checks client-side quota
3. If quota OK, invoke edge function
4. Edge function validates auth + quota server-side
5. Edge function calls AI provider (OpenAI or Anthropic)
6. AI returns 3 title suggestions with metadata
7. Edge function records usage & saves history
8. Frontend displays results

---

## Tech Stack

**Frontend:**
- React 18.3.1
- TypeScript 5.8.3
- Vite 5.4.19
- Tailwind CSS 3.4.17
- shadcn-ui (Radix UI primitives)
- TanStack Query 5.83.0 (react-query)
- React Router DOM 6.30.1
- Lucide React (icons)

**Backend:**
- Supabase (PostgreSQL 15.x)
- Supabase Edge Functions (Deno runtime)
- Row Level Security (RLS) policies

**Third-Party Services:**
- **OpenAI** (primary): GPT-4o-mini model
- **Anthropic** (fallback): Claude Haiku 4.5
- Supabase Auth (JWT-based)

**Hosting:**
- Frontend: Vercel
- Database: Supabase Cloud
- Edge Functions: Supabase (Deno Deploy)

---

## Folder Structure

```
hub-euanapratica/
├── src/
│   ├── pages/
│   │   └── title-translator/
│   │       └── TitleTranslator.tsx          # Main UI component
│   ├── hooks/
│   │   ├── useTitleTranslator.ts            # Business logic hook
│   │   ├── usePlanAccess.ts                 # Generic plan/quota access
│   │   └── useAdminPlans.ts                 # Admin plan management
│   ├── types/
│   │   └── plans.ts                         # TypeScript types for plans
│   ├── components/
│   │   ├── layouts/DashboardLayout.tsx      # Wrapper layout
│   │   └── curriculo/UpgradeModal.tsx       # Upgrade prompt modal
│   └── App.tsx                              # Route: /title-translator
│
├── supabase/
│   ├── functions/
│   │   ├── translate-title/
│   │   │   └── index.ts                     # Edge function handler
│   │   └── _shared/
│   │       └── apiConfigService.ts          # API config fetcher
│   └── migrations/
│       ├── 20260212100000_title_translator_system.sql
│       ├── 20260212140000_fix_title_translator_model.sql
│       └── 20260212160000_title_translator_credits.sql
│
└── docs/
    └── title_translator_dev.md              # This file
```

---

## Database Schema

### Table: `title_translations`

Stores translation history for all users.

```sql
CREATE TABLE public.title_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title_br_input VARCHAR(255) NOT NULL,
    area VARCHAR(100),
    responsibilities TEXT,
    years_experience INT,
    title_us_recommended VARCHAR(255),
    all_suggestions JSONB,
    credits_used INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_title_translations_user ON title_translations(user_id);
CREATE INDEX idx_title_translations_date ON title_translations(created_at DESC);
```

**Columns:**
- `id`: UUID primary key
- `user_id`: Foreign key to auth.users (CASCADE delete)
- `title_br_input`: Brazilian job title entered by user
- `area`: Optional area selection (Tecnologia, Financas, etc.)
- `responsibilities`: Optional text describing job duties
- `years_experience`: Optional integer for years of experience
- `title_us_recommended`: The AI's top recommendation
- `all_suggestions`: JSONB storing full AI response (suggestions array + reasoning)
- `credits_used`: Always 1 (for future pricing flexibility)
- `created_at`: Timestamp

**RLS Policies:**
- Users can SELECT own translations
- Users can INSERT own translations
- Admins can SELECT all translations
- Service role has full access

---

### Table: `plans`

Defines subscription tiers.

```sql
CREATE TABLE public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly NUMERIC,
  price_annual NUMERIC,
  theme TEXT,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  monthly_limit INTEGER DEFAULT 1,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  display_features TEXT[],
  cta_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Relevant Features JSONB Fields:**
- `title_translator_limit`: Number of translations per month
  - Basic: 1
  - Pro: 10
  - VIP: 999

Example:
```json
{
  "title_translator_limit": 10,
  "resume_pass_limit": 10,
  "community": true,
  "allow_pdf": true
}
```

---

### Table: `user_subscriptions`

Tracks active subscriptions.

```sql
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
```

**Key Points:**
- One active subscription per user (UNIQUE constraint)
- Status: 'active' | 'inactive' | 'cancelled'
- Nullable expires_at for non-expiring subs

---

### Table: `usage_logs`

Generic usage tracking for all quota-based features.

```sql
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL DEFAULT 'curriculo_usa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_usage_logs_user_app ON usage_logs(user_id, app_id);
CREATE INDEX idx_usage_logs_created ON usage_logs(created_at);
```

**For Title Translator:**
- `app_id` = `'title_translator'`
- One row inserted per translation
- Quota calculated by counting rows for current month

---

### Table: `app_configs`

System-wide configuration key-value store.

```sql
CREATE TABLE public.app_configs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Title Translator Configs:**
- `title_translator_prompt`: Full AI prompt template with placeholders
- `title_translator_api_config`: API key reference (e.g., 'openai_api' or 'anthropic_api')
- `title_translator_model`: Model ID (e.g., 'gpt-4o-mini' or 'claude-haiku-4-5-20251001')

---

### Table: `api_configs`

Stores API provider credentials and configurations.

```sql
CREATE TABLE public.api_configs (
  api_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  base_url TEXT,
  credentials JSONB,
  parameters JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Example Row (OpenAI):**
```json
{
  "api_key": "openai_api",
  "name": "OpenAI",
  "slug": "openai",
  "base_url": "https://api.openai.com/v1",
  "credentials": {
    "api_key": "sk-..."  // Encrypted
  },
  "parameters": {
    "model": "gpt-4o-mini",
    "temperature": 0.7
  },
  "is_active": true
}
```

---

### RPC: `get_app_quota`

Generic quota fetcher for any app_id.

```sql
CREATE OR REPLACE FUNCTION public.get_app_quota(p_user_id UUID, p_app_id TEXT)
RETURNS TABLE (
  plan_id TEXT,
  plan_name TEXT,
  monthly_limit INTEGER,
  used_this_month INTEGER,
  remaining INTEGER,
  features JSONB
)
```

**For Title Translator:**
```typescript
const { data } = await supabase.rpc('get_app_quota', {
  p_user_id: user.id,
  p_app_id: 'title_translator'
});
```

Returns:
```json
{
  "plan_id": "pro",
  "plan_name": "Pro",
  "monthly_limit": 10,
  "used_this_month": 3,
  "remaining": 7,
  "features": { "title_translator_limit": 10, ... }
}
```

---

## Core Features

### 1. Translation Request Flow

**Input:**
- `titleBr` (required): Brazilian job title
- `area` (optional): Predefined category (Tecnologia, Financas, etc.)
- `responsibilities` (optional): Free text describing job duties
- `years` (optional): Integer for years of experience

**Processing:**
1. Client-side quota check (UX optimization to fail fast)
2. Edge function validates auth (JWT)
3. Server-side quota check (authoritative)
4. Fetch prompt template from `app_configs`
5. Fetch API provider config from `app_configs` + `api_configs`
6. Build prompt by replacing placeholders:
   - `{title_br}` → user input
   - `{area}` → selected area or "Not specified"
   - `{responsibilities}` → user text or "Not provided"
   - `{years_experience}` → number or "Not specified"
7. Call AI API (OpenAI or Anthropic based on config)
8. Parse JSON response
9. Record usage in `usage_logs`
10. Save translation in `title_translations`
11. Audit log in `audit_events`
12. Return result to frontend

**Output:**
```typescript
{
  "suggestions": [
    {
      "title_us": "IT Team Lead",
      "confidence": 9.2,
      "explanation": "This title is widely used in US tech companies...",
      "why_this_fits": "Given your 5 years of experience managing a team...",
      "example_companies": ["Google", "Microsoft", "Amazon"],
      "salary_range": "$95,000 - $125,000",
      "example_jd_snippet": "Lead a team of 5-8 engineers..."
    },
    // ... 2 more suggestions
  ],
  "recommended": "IT Team Lead",
  "reasoning": "Based on your responsibilities and team size, IT Team Lead is the most accurate match..."
}
```

---

### 2. Quota Enforcement

**Two-Layer Check:**

**Layer 1: Client-Side (UX)**
- Hook fetches quota via `get_app_quota` RPC on mount
- Disables submit button if `remaining <= 0`
- Shows upgrade modal immediately

**Layer 2: Server-Side (Security)**
- Edge function independently checks quota
- Counts `usage_logs` rows for current month
- Returns 402 error if limit exceeded
- **Critical:** Usage is recorded BEFORE returning result to prevent double-charging on retries

**Race Condition Handling:**
- Usage recording uses retry logic (3 attempts with exponential backoff)
- If recording fails after retries, returns 500 error (does not deliver result)
- Prevents scenario where user gets result but quota isn't decremented

---

### 3. Multi-Provider AI Support

**Architecture:**
- Admin selects provider via `app_configs.title_translator_api_config`
- Edge function detects provider type by:
  1. Checking `api_key` (e.g., 'openai_api' vs 'anthropic_api')
  2. Inspecting `base_url` (contains 'anthropic.com'?)

**OpenAI Flow:**
- Uses `/chat/completions` endpoint
- Sends `response_format: { type: "json_schema" }` for structured output
- Strict schema enforcement (all fields required)
- Model: `gpt-4o-mini` by default (configurable)

**Anthropic Flow:**
- Uses `/messages` endpoint
- Sends plain prompt (no structured output mode)
- Parses JSON from response text (regex extraction)
- Model: `claude-haiku-4-5-20251001` by default

**Fallback Logic:**
⚠️ **Does NOT exist.** If primary API fails, edge function returns error. Admin must manually switch providers in settings. Recommend implementing automatic failover in future.

---

## API Endpoints & Server Actions

### Edge Function: `translate-title`

**Endpoint:** `https://[project-ref].supabase.co/functions/v1/translate-title`

**Method:** POST

**Headers:**
- `Authorization: Bearer [jwt-token]` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "titleBr": "Coordenador de TI",
  "area": "Tecnologia",
  "responsibilities": "Lidero equipe de 5 devs, gerencio cronograma, faco code review",
  "years": "5"
}
```

**Success Response (200):**
```json
{
  "suggestions": [ /* array of 3 suggestions */ ],
  "recommended": "IT Team Lead",
  "reasoning": "..."
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{ "error": "Unauthorized" }
```

**402 Limit Reached:**
```json
{
  "error_code": "LIMIT_REACHED",
  "error": "Limite mensal atingido",
  "error_message": "Voce atingiu o limite de 10 traducao(es) do seu plano este mes.",
  "plan_id": "pro",
  "monthly_limit": 10,
  "used": 10
}
```

**400 Bad Request:**
```json
{ "error": "titleBr is required" }
```

**500 Internal Server Error:**
```json
{ "error": "AI analysis failed" }
```

---

## Business Logic

### Quota Calculation

**Algorithm:**
```typescript
const startOfMonth = new Date();
startOfMonth.setDate(1);
startOfMonth.setHours(0, 0, 0, 0);

const { count } = await supabase
  .from("usage_logs")
  .select("*", { count: "exact", head: true })
  .eq("user_id", userId)
  .eq("app_id", "title_translator")
  .gte("created_at", startOfMonth.toISOString());

const currentUsage = count || 0;
const limit = plan.features.title_translator_limit || 1;
const remaining = Math.max(0, limit - currentUsage);
```

**Edge Cases:**
- Negative remaining → clamped to 0
- Missing plan → defaults to Basic (limit 1)
- Missing subscription → defaults to Basic
- Inactive subscription → defaults to Basic

---

### AI Prompt Construction

**Template (stored in `app_configs`):**
```
You are an expert in translating Brazilian job titles to US equivalents...

Brazilian Title: {title_br}
Area: {area}
Responsibilities: {responsibilities}
Years of Experience: {years_experience}

Provide 3 US equivalent job titles, ranked by relevance...

Respond ONLY with valid JSON in this exact format:
{
  "suggestions": [ ... ],
  "recommended": "...",
  "reasoning": "..."
}
```

**Placeholder Replacement:**
```typescript
const systemPrompt = promptConfig.value
  .replace("{title_br}", titleBr.trim())
  .replace("{area}", area || "Not specified")
  .replace("{responsibilities}", responsibilities || "Not provided")
  .replace("{years_experience}", years ? String(years) : "Not specified");
```

---

### Confidence Scoring

⚠️ **Inferred — needs verification:** Confidence scores are generated by the AI, not calculated programmatically. The prompt instructs the AI to provide a float between 0-10 reflecting "actual match quality." No validation ensures scores are reasonable or consistent.

**UI Interpretation:**
- Displayed as percentage (e.g., 9.2 → "92% Match")
- Color-coded progress bar (green)
- No thresholds or filtering based on low scores

---

### Validation Rules

**Frontend:**
- `titleBr`: Required, non-empty string
- `area`: Optional, must match predefined list
- `responsibilities`: Optional, free text
- `years`: Optional, integer 0-50

**Backend:**
- `titleBr`: Required, non-empty string (else 400 error)
- Other fields: Optional, passed as-is to AI

**AI Response Validation:**
```typescript
if (!result.suggestions || !Array.isArray(result.suggestions) || !result.recommended) {
  return 500 error;
}
```

⚠️ **No schema validation.** If AI returns malformed JSON or missing fields, edge function crashes with 500 error. Recommend adding Zod schema validation.

---

## External Integrations

### OpenAI API

**Endpoint:** `https://api.openai.com/v1/chat/completions`

**Authentication:** Bearer token in `Authorization` header

**Request:**
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    { "role": "system", "content": "You are an expert career consultant..." },
    { "role": "user", "content": "[constructed prompt]" }
  ],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "title_translation",
      "strict": true,
      "schema": { /* JSON Schema */ }
    }
  }
}
```

**Response:**
```json
{
  "choices": [
    {
      "message": {
        "content": "{\"suggestions\":[...]}"
      }
    }
  ]
}
```

**Error Handling:**
- 429 Rate Limit → Return 429 to client
- Other errors → Log and return 500

**Cost:** ~$0.002 per translation (based on 2025 pricing)

---

### Anthropic API

**Endpoint:** `https://api.anthropic.com/v1/messages`

**Authentication:** `x-api-key` header

**Request:**
```json
{
  "model": "claude-haiku-4-5-20251001",
  "max_tokens": 4000,
  "messages": [
    { "role": "user", "content": "[constructed prompt]" }
  ]
}
```

**Response:**
```json
{
  "content": [
    { "text": "{\"suggestions\":[...]}" }
  ]
}
```

**JSON Extraction:**
```typescript
const jsonMatch = text.match(/\{[\s\S]*\}/);
const result = JSON.parse(jsonMatch[0]);
```

**Error Handling:**
- Non-200 status → Log and return 500
- No JSON in response → Return 500

**Cost:** ~$0.0015 per translation (Haiku pricing)

---

### Supabase Auth

**Authentication Flow:**
1. User logs in via Supabase Auth (handled by AuthContext)
2. JWT token stored in client (localStorage/session)
3. Token sent in `Authorization: Bearer` header
4. Edge function validates token via `supabase.auth.getUser(token)`
5. User ID extracted from validated claims

**Permissions:**
- All endpoints require authenticated user
- No guest/anonymous access
- Service role bypasses RLS for internal writes

---

## Environment Variables

**Frontend (.env):**
```
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
```

**Edge Function (Supabase Secrets):**
```
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Database (api_configs table):**
- OpenAI API Key (encrypted in `api_configs.credentials.api_key`)
- Anthropic API Key (encrypted in `api_configs.credentials.api_key`)

⚠️ **Security:** API keys are encrypted at rest in the database. Encryption key is managed by Supabase. If database is compromised, attacker needs both database access AND encryption key to extract plaintext API keys.

---

## Known Issues & TODOs

### Bugs

1. **No rate limit handling for burst traffic**
   - If 100 users submit simultaneously, OpenAI could return 429
   - No retry queue or exponential backoff for user requests

2. **Race condition in quota check**
   - Tiny window between quota check and usage recording
   - Two simultaneous requests could both pass check and consume 2 credits
   - Mitigation: Server-side check is authoritative, but UX could show stale quota

3. **AI response parsing fragility**
   - If OpenAI returns valid JSON but missing a field, edge function crashes
   - No graceful degradation or fallback

### Missing Features

1. **Translation history UI**
   - Data is stored in `title_translations` table
   - No frontend to view past translations
   - Users can't reference previous results

2. **Bulk translation**
   - No support for uploading multiple titles at once
   - Would require different credit consumption logic

3. **Feedback mechanism**
   - No way for users to rate translation quality
   - Can't improve AI prompts based on user feedback

4. **Export functionality**
   - No CSV/PDF export of results
   - Users must copy-paste manually

### Performance Concerns

1. **Cold start latency**
   - Edge functions have ~2-5s cold start
   - First request after inactivity is slow

2. **No caching**
   - Same input translation requested multiple times hits AI every time
   - Could cache common title translations (e.g., "Gerente de TI")

3. **Sequential quota fetching**
   - Frontend fetches quota separately from translation
   - Could batch into single RPC call

### Security Gaps

1. **No input sanitization**
   - User input passed directly to AI prompt
   - Potential for prompt injection (user adds malicious instructions in responsibilities field)

2. **No response size limit**
   - AI could theoretically return massive JSON payload
   - Could cause OOM in edge function

---

## Local Setup

### Prerequisites

- Node.js 18+ or Bun
- Supabase CLI
- Git

### Steps

1. **Clone repository:**
   ```bash
   git clone [repo-url]
   cd hub-euanapratica
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Supabase project credentials.

4. **Run database migrations:**
   ```bash
   supabase db reset
   # or
   supabase db push
   ```

5. **Start local development:**
   ```bash
   npm run dev
   ```

6. **Serve edge functions locally:**
   ```bash
   supabase functions serve translate-title
   ```

7. **Seed test data:**
   - Create test user via Supabase Dashboard
   - Insert plan records (Basic, Pro, VIP)
   - Insert API configs (OpenAI key)
   - Insert app_configs (prompt, model)

8. **Test translation:**
   - Navigate to `http://localhost:5173/title-translator`
   - Log in with test user
   - Submit form

### Testing

⚠️ **No automated tests found.** Recommend adding:
- Unit tests for `useTitleTranslator` hook
- Integration tests for edge function
- E2E tests for full flow

**Manual Testing Checklist:**
- [ ] Translation with all fields filled
- [ ] Translation with only titleBr
- [ ] Quota enforcement (use all credits)
- [ ] Upgrade modal appears when limit hit
- [ ] OpenAI provider works
- [ ] Anthropic provider works
- [ ] Error handling for invalid API key
- [ ] Error handling for AI timeout
- [ ] Copy-to-clipboard functionality
- [ ] Mobile responsive layout

---

## Additional Notes

**Code Quality:** TypeScript strict mode enabled, comprehensive type definitions, well-structured component hierarchy.

**Accessibility:** Basic ARIA labels present, keyboard navigation supported for buttons, but no comprehensive a11y audit performed.

**Internationalization:** All UI strings hardcoded in Portuguese. No i18n framework in place. Translation to English would require manual string replacement.

**Monitoring:** Usage recorded in `usage_logs` and `audit_events`, but no real-time dashboards or alerts configured. Recommend adding Sentry or LogRocket for error tracking.

**Deployment:** Vite build outputs to `/dist`, deployed to Vercel via GitHub integration. Edge functions auto-deploy on push to main branch.
