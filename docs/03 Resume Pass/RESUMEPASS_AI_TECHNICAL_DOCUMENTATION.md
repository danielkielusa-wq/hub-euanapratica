# ResumePass AI - Technical Documentation

> **Last updated:** 2026-02-19
> **Application:** ResumePass AI (feature within EU NA PRATICA Hub)
> **Stack:** React 18 + TypeScript + Supabase + OpenAI Responses API

---

## 1. Executive Summary

ResumePass AI is a SaaS resume analysis tool that compares user-uploaded resumes (PDF or DOCX) against US job descriptions using AI. It produces a structured compatibility report with ATS scoring, keyword analysis, cultural bridging (Brazil → US job title equivalents), market salary estimates, improvement suggestions, LinkedIn headline optimization, and interview preparation guidance.

The feature is monetized through a three-tier subscription model (Básico, Pro, VIP) that gates both the number of monthly analyses and the depth of report content. Usage enforcement is implemented with a dual-layer approach: client-side quota checking for UX responsiveness and server-side gating in the edge function for security.

**Key metrics at a glance:**
- **AI Model:** OpenAI `gpt-4.1-mini` via the Responses API with strict JSON schema enforcement
- **Supported formats:** PDF (multimodal/base64), DOCX (ZIP extraction), `.doc` rejected
- **Plan tiers:** Básico (1/mo, free), Pro (10/mo), VIP (999/mo)
- **Report output:** 10 structured sections with plan-gated content

---

## 2. Product Overview

### 2.1 What It Does

1. User uploads a resume (PDF or DOCX) and pastes a US job description
2. The system extracts resume text, sends it to OpenAI with the job description, and receives a structured JSON analysis
3. A multi-section report is rendered showing compatibility score, ATS metrics, improvement suggestions, and interview preparation
4. Reports are auto-saved to the database for future reference
5. PDF export of the report is available on Pro/VIP plans

### 2.2 User Flow

```
┌─────────────────┐     ┌──────────────┐     ┌───────────────────┐
│ /curriculo      │────▶│ Upload +     │────▶│ analyze-resume    │
│ (Main Page)     │     │ Job Desc     │     │ (Edge Function)   │
└─────────────────┘     └──────────────┘     └───────────────────┘
                                                       │
                         ┌──────────────┐              │
                         │ localStorage │◀─────────────┘
                         │ bridge       │
                         └──────┬───────┘
                                │
                    ┌───────────▼────────────┐
                    │ /curriculo/resultado   │
                    │ (Report Page)          │
                    └───────────┬────────────┘
                                │ auto-save
                    ┌───────────▼────────────┐
                    │ resumepass_reports     │
                    │ (Database)             │
                    └────────────────────────┘
```

### 2.3 Access Control

- Feature is protected by `ServiceGuard` component in the router
- Only authenticated users with the ResumePass service enabled can access `/curriculo`
- Admin users can view all saved reports

---

## 3. Architecture

### 3.1 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript | UI framework |
| Styling | Tailwind CSS + shadcn/ui | Component library |
| State | React hooks + localStorage | Client state management |
| Data Fetching | TanStack Query v5 | Server state & caching |
| Backend | Supabase Edge Functions (Deno) | Serverless API |
| AI | OpenAI Responses API (`gpt-4.1-mini`) | Resume analysis |
| Database | PostgreSQL (Supabase) | Data persistence |
| Storage | Supabase Storage (`temp-resumes` bucket) | Temporary file uploads |
| PDF Export | `@react-pdf/renderer` | Client-side PDF generation |

### 3.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                        │
│                                                                 │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────────┐ │
│  │ CurriculoUSA │  │ CurriculoReport│  │ SavedReportPage     │ │
│  │ (Upload)     │  │ (localStorage) │  │ (Database)          │ │
│  └──────┬───────┘  └────────────────┘  └─────────────────────┘ │
│         │                                                       │
│  ┌──────▼──────────────────────────────────────────────────┐   │
│  │  Hooks Layer                                             │   │
│  │  useCurriculoAnalysis  useSubscription  useResumePass*   │   │
│  └──────┬─────────────────────┬────────────────────────────┘   │
└─────────┼─────────────────────┼─────────────────────────────────┘
          │                     │
          ▼                     ▼
┌─────────────────┐   ┌─────────────────────┐
│ Supabase Storage│   │ Supabase RPC        │
│ temp-resumes    │   │ get_user_quota()    │
│ bucket          │   │ record_curriculo_   │
│                 │   │ usage()             │
└────────┬────────┘   └─────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│  Edge Function: analyze-resume               │
│  (Deno runtime)                              │
│                                              │
│  1. Auth check (JWT)                         │
│  2. Quota gating (plans + usage_logs)        │
│  3. File download from temp-resumes          │
│  4. Text extraction (DOCX→XML / PDF→base64) │
│  5. Feature stripping (prompt injection)     │
│  6. OpenAI Responses API call               │
│  7. Usage recording (retry + backoff)        │
│  8. Return structured JSON                   │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
          ┌────────────────┐
          │ OpenAI API     │
          │ gpt-4.1-mini   │
          │ Responses API  │
          │ (strict JSON)  │
          └────────────────┘
```

### 3.3 File Structure

```
src/
├── pages/curriculo/
│   ├── CurriculoUSA.tsx           # Main upload page (/curriculo)
│   ├── CurriculoReport.tsx        # Report from localStorage (/curriculo/resultado)
│   └── SavedReportPage.tsx        # Report from DB (/resumepass/report/:id)
│
├── hooks/
│   ├── useCurriculoAnalysis.ts    # Core analysis orchestration
│   ├── useSubscription.ts         # Plan/quota management
│   └── useResumePassReports.ts    # TanStack Query CRUD hooks
│
├── types/
│   └── curriculo.ts               # TypeScript interfaces + constants
│
├── components/curriculo/
│   ├── ResumeUploadCard.tsx       # File upload widget
│   ├── JobDescriptionCard.tsx     # Job description textarea
│   ├── AnalyzingLoader.tsx        # Loading animation
│   ├── AnalysisResult.tsx         # Inline result preview
│   ├── QuotaDisplay.tsx           # Credits remaining display
│   ├── ReportHistory.tsx          # List of saved reports
│   ├── LockedFeature.tsx          # Plan-gated content overlay
│   ├── UpgradeModal.tsx           # Upgrade CTA modal
│   ├── CurriculoHeader.tsx        # Page header
│   ├── pdf/
│   │   └── CurriculoReportPDF.tsx # PDF export template
│   └── report/
│       ├── ReportContent.tsx      # Main tabbed report renderer
│       ├── ReportHeader.tsx       # Score + status banner
│       ├── ScoreGauge.tsx         # Circular score visualization
│       ├── MetricsRow.tsx         # 4-metric cards row
│       ├── CulturalBridgeCard.tsx # BR→US title translation
│       ├── MarketValueCard.tsx    # Salary range estimate
│       ├── PowerVerbsRow.tsx      # Suggested action verbs
│       ├── ImprovementsSection.tsx # Resume improvement cards (gated)
│       ├── ImprovementCard.tsx    # Single improvement before/after
│       ├── LinkedInQuickFix.tsx   # LinkedIn headline suggestion
│       ├── InterviewCheatSheet.tsx # Interview prep questions (gated)
│       └── CriticalAlert.tsx      # Low ATS score warning
│
supabase/
├── functions/
│   ├── analyze-resume/
│   │   └── index.ts               # Core edge function (647 lines)
│   └── _shared/
│       └── apiConfigService.ts    # Centralized API config service
│
└── migrations/
    ├── 20260127221741_*.sql        # plans, user_subscriptions, usage_logs, RPCs
    ├── 20260210100000_*.sql        # resumepass_reports table
    └── 20260210100001_*.sql        # resumepass_reports grants
```

---

## 4. Database Schema

### 4.1 Entity Relationship Diagram

```
┌───────────────┐     ┌────────────────────┐     ┌──────────────┐
│   plans       │     │ user_subscriptions │     │  usage_logs  │
│───────────────│     │────────────────────│     │──────────────│
│ id (PK, TEXT) │◄────│ plan_id (FK)       │     │ id (PK, UUID)│
│ name          │     │ id (PK, UUID)      │     │ user_id (FK) │
│ monthly_limit │     │ user_id (FK, UQ)   │     │ app_id       │
│ features JSONB│     │ status             │     │ created_at   │
│ is_active     │     │ starts_at          │     └──────────────┘
│ created_at    │     │ expires_at         │
└───────────────┘     │ created_at         │
                      │ updated_at         │
                      └────────────────────┘

┌──────────────────────────┐     ┌──────────────┐
│  resumepass_reports      │     │   app_configs │
│──────────────────────────│     │──────────────│
│ id (PK, UUID)            │     │ key (PK)     │
│ user_id (FK → profiles)  │     │ value (TEXT)  │
│ title (TEXT)              │     │ ...          │
│ report_data (JSONB)      │     └──────────────┘
│ created_at (TIMESTAMPTZ) │
└──────────────────────────┘
```

### 4.2 Table Definitions

#### `plans`

Stores subscription plan definitions. Publicly readable, admin-managed.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `TEXT` (PK) | — | Plan identifier: `basic`, `pro`, `vip` |
| `name` | `TEXT` | — | Display name: "Básico", "Pro", "VIP" |
| `monthly_limit` | `INTEGER` | `1` | Max analyses per month |
| `features` | `JSONB` | `{}` | Feature flags (see 4.3) |
| `is_active` | `BOOLEAN` | `true` | Whether plan is available |
| `created_at` | `TIMESTAMPTZ` | `now()` | Creation timestamp |

**Seed data:**

| Plan | Monthly Limit | Features |
|------|--------------|----------|
| `basic` | 1 | `allow_pdf: false, show_improvements: false, show_cheat_sheet: false` |
| `pro` | 10 | `allow_pdf: true, show_improvements: true, show_cheat_sheet: true, impact_cards: true` |
| `vip` | 999 | All Pro features + `priority_support: true` |

#### `user_subscriptions`

Links users to their active plan. One subscription per user (UNIQUE constraint on `user_id`).

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `UUID` (PK) | `gen_random_uuid()` | — |
| `user_id` | `UUID` (FK → `auth.users`, UQ) | — | Subscriber |
| `plan_id` | `TEXT` (FK → `plans`) | — | Active plan |
| `status` | `TEXT` | `'active'` | `active \| inactive \| cancelled` |
| `starts_at` | `TIMESTAMPTZ` | `now()` | Subscription start |
| `expires_at` | `TIMESTAMPTZ` | `NULL` | Optional expiry |
| `created_at` | `TIMESTAMPTZ` | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | `now()` | — |

#### `usage_logs`

Records each analysis execution. Used for monthly quota counting.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `UUID` (PK) | `gen_random_uuid()` | — |
| `user_id` | `UUID` (FK → `auth.users`) | — | User who ran the analysis |
| `app_id` | `TEXT` | `'curriculo_usa'` | App identifier (currently always `curriculo_usa`) |
| `created_at` | `TIMESTAMPTZ` | `now()` | Timestamp for monthly aggregation |

#### `resumepass_reports`

Persists analysis results for future reference.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `UUID` (PK) | `gen_random_uuid()` | — |
| `user_id` | `UUID` (FK → `profiles`) | — | Report owner |
| `title` | `TEXT` | `''` | Auto-generated: `"Resume Report - YYYY-MM-DD"` |
| `report_data` | `JSONB` | — | Full `FullAnalysisResult` JSON |
| `created_at` | `TIMESTAMPTZ` | `now()` | — |

**Indexes:**
- `idx_resumepass_reports_user_id` on `user_id`
- `idx_resumepass_reports_created_at` on `created_at DESC`

#### `app_configs` (external, shared table)

Stores the AI system prompt used for analysis.

| Key | Purpose |
|-----|---------|
| `resume_analyzer_prompt` | System prompt sent to OpenAI for resume analysis |

### 4.3 Feature Flags (JSONB)

The `plans.features` column contains a JSON object controlling frontend feature gating and backend prompt modification:

```typescript
interface PlanFeatures {
  allow_pdf: boolean;           // PDF export of report
  show_improvements: boolean;   // Resume improvement suggestions (Tab 2)
  show_power_verbs: boolean;    // Power verbs suggestions
  show_cheat_sheet: boolean;    // Interview cheat sheet (Tab 3)
  impact_cards: boolean;        // Impact labels on improvements
  priority_support: boolean;    // Priority support badge
}
```

### 4.4 RPC Functions

#### `get_user_quota(p_user_id UUID)`

Returns the user's current quota status. Uses `SECURITY DEFINER` to bypass RLS.

**Returns:**

| Column | Type | Description |
|--------|------|-------------|
| `plan_id` | `TEXT` | Current plan (defaults to `'basic'`) |
| `plan_name` | `TEXT` | Display name (defaults to `'Básico'`) |
| `monthly_limit` | `INTEGER` | Max analyses/month |
| `used_this_month` | `INTEGER` | Count of `usage_logs` for current month |
| `remaining` | `INTEGER` | `MAX(0, monthly_limit - used_this_month)` |

**Logic:**
- LEFT JOINs `user_subscriptions` → `plans` for the user
- Counts `usage_logs` WHERE `app_id = 'curriculo_usa'` AND `created_at >= date_trunc('month', now())`
- Falls back to basic plan (1/month) if no subscription found

#### `record_curriculo_usage(p_user_id UUID)`

Inserts a row into `usage_logs`. Used as client-side fallback (the edge function uses its own admin client for reliability).

### 4.5 Row Level Security

| Table | Policy | Effect |
|-------|--------|--------|
| `plans` | Anyone can SELECT | Public catalog |
| `plans` | Admin-only INSERT/UPDATE/DELETE | Admin manages plans |
| `user_subscriptions` | User reads own | `user_id = auth.uid()` |
| `user_subscriptions` | Admin full CRUD | `has_role(auth.uid(), 'admin')` |
| `usage_logs` | User reads own | `user_id = auth.uid()` |
| `usage_logs` | Admin reads all | `has_role(auth.uid(), 'admin')` |
| `resumepass_reports` | User reads own | `user_id = auth.uid()` |
| `resumepass_reports` | User inserts own | `user_id = auth.uid()` |
| `resumepass_reports` | Admin reads all | `has_role(auth.uid(), 'admin')` |

---

## 5. Core Features

### 5.1 Resume Upload & Format Support

**Location:** `src/components/curriculo/ResumeUploadCard.tsx`

- Accepts PDF and DOCX files via drag-and-drop or file picker
- Files are uploaded to the `temp-resumes` Supabase Storage bucket
- File path format: `{userId}/{timestamp}.{extension}`
- Temporary files are deleted after analysis completes (cleanup in `useCurriculoAnalysis`)
- Legacy `.doc` format (binary OLE) is explicitly rejected with a user-friendly error

**DOCX extraction** (in edge function):
- Uses `zip.js` library to unzip the DOCX archive
- Extracts `word/document.xml` from the ZIP entries
- Parses `<w:t>` XML tags via regex to extract text content
- Minimum content threshold: 100 characters (below this → `INSUFFICIENT_CONTENT` error)
- Text is truncated to 15,000 characters before sending to AI

**PDF processing** (in edge function):
- Converted to base64 using chunked encoding (8KB chunks to avoid stack overflow)
- Sent as `input_file` content type to OpenAI for multimodal processing
- No text extraction needed — the AI reads the PDF directly

### 5.2 AI Analysis Engine

**Location:** `supabase/functions/analyze-resume/index.ts`

**AI Provider:**
- OpenAI Responses API (not Chat Completions)
- Model: `gpt-4.1-mini`
- Strict JSON schema enforcement via `text.format.type = "json_schema"`

**System Prompt:**
- Stored in `app_configs` table under key `resume_analyzer_prompt`
- Admin-editable via the admin settings panel
- Dynamically modified based on user's plan features (see 6.2)

**Structured Output Schema** (10 required fields):

| Field | Type | Description |
|-------|------|-------------|
| `header` | Object | `score` (0-100), `status_tag`, `main_message`, `sub_message` |
| `metrics.ats_format` | Object | ATS format compatibility score + details |
| `metrics.keywords` | Object | Keyword match `score`, `matched_count`, `total_required` |
| `metrics.action_verbs` | Object | Action verb usage `score`, `count` |
| `metrics.brevity` | Object | Length assessment `score`, `page_count`, `ideal_page_count` |
| `cultural_bridge` | Object | `brazil_title` → `us_equivalent` translation with explanation |
| `market_value` | Object | Salary `range` (e.g. "$85k-$110k/yr") + `context` |
| `power_verbs_suggestions` | Array\<string\> | 5-8 suggested power verbs in English |
| `improvements` | Array\<Improvement\> | 3-5 before/after improvement cards with tags |
| `linkedin_fix` | Object | Suggested `headline` + `reasoning_pt` (Portuguese) |
| `interview_cheat_sheet` | Array\<InterviewQuestion\> | 3-5 questions with `context_pt` |
| `parsing_error` | boolean | AI-detected content issues |
| `parsing_error_message` | string | Error description in Portuguese |

### 5.3 Report Display

**Locations:**
- `src/pages/curriculo/CurriculoReport.tsx` — reads from localStorage (immediate after analysis)
- `src/pages/curriculo/SavedReportPage.tsx` — reads from `resumepass_reports` table (history)
- `src/components/curriculo/report/ReportContent.tsx` — shared report renderer

**Report Tabs:**

| Tab | Components | Plan Gating |
|-----|-----------|-------------|
| **Overview** | ScoreGauge, MetricsRow, CulturalBridgeCard, MarketValueCard | All plans |
| **Optimization** | ImprovementsSection, PowerVerbsRow | `show_improvements`, `show_power_verbs` required |
| **Preparation** | LinkedInQuickFix, InterviewCheatSheet | `show_cheat_sheet` required |

**Critical Alert:** When `metrics.ats_format.score < 50`, a `CriticalAlert` banner is displayed warning the user of serious ATS compatibility issues.

### 5.4 Report Persistence

**Hook:** `src/hooks/useResumePassReports.ts`

Three TanStack Query hooks:

| Hook | Query Key | Stale Time | Purpose |
|------|-----------|-----------|---------|
| `useResumePassReports()` | `['resumepass-reports']` | 2 minutes | List all user reports (newest first) |
| `useResumePassReport(id)` | `['resumepass-report', id]` | 5 minutes | Fetch single report by UUID |
| `useSaveResumePassReport()` | Mutation | — | Insert new report |

Reports are auto-saved after analysis completes (fire-and-forget, non-blocking):

```typescript
// From useCurriculoAnalysis.ts (simplified)
supabase.from('resumepass_reports').insert({
  user_id: user.id,
  title: `Resume Report - ${YYYY-MM-DD}`,
  report_data: analysisResult,
});
```

### 5.5 PDF Export

**Location:** `src/components/curriculo/pdf/CurriculoReportPDF.tsx`

- Uses `@react-pdf/renderer` for client-side PDF generation
- Creates a downloadable blob from the `FullAnalysisResult` data
- **Plan-gated:** Only available when `features.allow_pdf === true` (Pro and VIP plans)
- Rendered in `CurriculoReport.tsx` page with a download button

### 5.6 Report History

**Location:** `src/components/curriculo/ReportHistory.tsx`

- Displayed on the main `/curriculo` page below the upload form
- Lists all saved reports using `useResumePassReports()` hook
- Each entry links to `/resumepass/report/:id` (SavedReportPage)
- Shows title and creation date

---

## 6. Key Business Logic

### 6.1 Quota Enforcement (Dual-Layer)

Quota is enforced at two levels to balance UX with security:

**Layer 1 — Client-Side (UX):**
```
src/hooks/useCurriculoAnalysis.ts:73
```
```typescript
if (quota && quota.remaining <= 0) {
  setShowUpgradeModal(true);
  return; // Blocks UI before upload
}
```
- Prevents file upload when quota is exhausted
- Shows `UpgradeModal` with plan upgrade CTA
- Button text changes from "Analisar" to "Upgrade"

**Layer 2 — Server-Side (Security):**
```
supabase/functions/analyze-resume/index.ts:49-101
```
```typescript
// Count usage this month
const { count: usageCount } = await supabase
  .from("usage_logs")
  .select("*", { count: "exact", head: true })
  .eq("user_id", userId)
  .eq("app_id", "curriculo_usa")
  .gte("created_at", startOfMonth.toISOString());

if (currentUsage >= plan.monthly_limit) {
  return new Response(JSON.stringify({
    error_code: "LIMIT_REACHED", // ...
  }), { status: 402 });
}
```
- Independent server-side check using `user_subscriptions` + `plans` + `usage_logs`
- Returns HTTP 402 with `LIMIT_REACHED` error code
- Cannot be bypassed by client manipulation

### 6.2 Feature Stripping via Prompt Injection

**Location:** `supabase/functions/analyze-resume/index.ts:147-157`

Plan features are enforced at the AI level by appending restrictions to the system prompt:

```typescript
if (!features.show_improvements) {
  systemPrompt += "\n\nIMPORTANT RESTRICTION: Return an EMPTY array [] for 'improvements'.";
}
if (!features.show_power_verbs) {
  systemPrompt += "\n\nIMPORTANT RESTRICTION: Return an EMPTY array [] for 'power_verbs_suggestions'.";
}
if (!features.show_cheat_sheet) {
  systemPrompt += "\n\nIMPORTANT RESTRICTION: Return an EMPTY array [] for 'interview_cheat_sheet'.";
}
```

This ensures that even if the frontend gating (`LockedFeature` component) is bypassed, the AI simply does not generate the premium content.

**Frontend enforcement** is handled by `LockedFeature` component:
```
src/components/curriculo/LockedFeature.tsx
```
- Wraps premium content sections
- When `isLocked === true`: blurs content, overlays lock icon + upgrade CTA
- Double protection: even if UI lock is bypassed, data arrays are empty from backend

### 6.3 Usage Recording with Retry

**Location:** `supabase/functions/analyze-resume/index.ts:557-633`

Usage recording is CRITICAL — the analysis result is only returned AFTER usage is successfully recorded:

```typescript
const recordUsageWithRetry = async (uid, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { error } = await adminSupabase
      .from('usage_logs')
      .insert({ user_id: uid, app_id: 'curriculo_usa' });

    if (!error) return true;

    // Exponential backoff: 200ms, 400ms, 800ms
    await new Promise(r => setTimeout(r, 200 * Math.pow(2, attempt)));
  }
  return false;
};

const usageRecorded = await recordUsageWithRetry(userId);

if (!usageRecorded) {
  // REQUEST FAILS — prevents giving away free analyses
  return new Response(JSON.stringify({
    error_code: 'USAGE_RECORDING_FAILED'
  }), { status: 500 });
}
```

**Key design decision:** The admin client (`SUPABASE_SERVICE_ROLE_KEY`) is used for usage recording to bypass RLS, ensuring the insert always succeeds regardless of user permissions.

**Audit recording** is separate and best-effort (non-blocking). It logs to `audit_events` but does not block the response if it fails.

### 6.4 localStorage Bridge Pattern

**Location:** `src/hooks/useCurriculoAnalysis.ts:175` and `src/pages/curriculo/CurriculoReport.tsx`

The analysis result is passed between pages via localStorage rather than URL params or React state:

```
Analyze page → localStorage.setItem('curriculo_analysis_result', JSON.stringify(data))
                → navigate('/curriculo/resultado')

Report page  → localStorage.getItem('curriculo_analysis_result')
                → JSON.parse(stored) → render report
```

**Rationale:** The `FullAnalysisResult` payload is too large for URL parameters and would be lost on page refresh with React state alone. localStorage persists across navigation.

**Cleanup:** The `reset()` function in `useCurriculoAnalysis` removes the localStorage key.

**Saved reports** bypass localStorage entirely — `SavedReportPage` fetches directly from `resumepass_reports` table via `useResumePassReport(id)`.

### 6.5 Dual Supabase Client Strategy

The edge function creates two Supabase clients:

| Client | Key Used | RLS | Purpose |
|--------|----------|-----|---------|
| `supabase` | `SUPABASE_ANON_KEY` + user JWT | Enforced | Reading data with user's permissions (subscriptions, configs, files) |
| `adminSupabase` | `SUPABASE_SERVICE_ROLE_KEY` | Bypassed | Reliable usage recording (inserts into `usage_logs`) |

This ensures that usage recording never fails due to RLS policy issues while still respecting data access permissions for everything else.

---

## 7. External Integrations

### 7.1 OpenAI Responses API

**Configuration source:** `api_configs` table, key `openai_api` (managed via `apiConfigService.ts`)

| Parameter | Value |
|-----------|-------|
| **Endpoint** | `{base_url}/responses` |
| **Model** | `gpt-4.1-mini` |
| **Response format** | `json_schema` (strict mode) |
| **Schema name** | `resume_analysis` |
| **Content types** | `input_text` (DOCX text), `input_file` (PDF base64) |

**API Config Service** (`supabase/functions/_shared/apiConfigService.ts`):
- Centralized service for all external API credentials
- Fetches from `api_configs` table via `get_api_config_by_key` RPC
- Falls back to Deno environment variables if DB config is empty
- Legacy fallback: `OPENAI_API_KEY` env var with hardcoded `gpt-4o-mini` model

**Request structure (PDF):**
```json
{
  "model": "gpt-4.1-mini",
  "instructions": "<system_prompt>",
  "input": [{
    "role": "user",
    "content": [
      { "type": "input_text", "text": "Job description + context" },
      { "type": "input_file", "file_data": "<base64>", "filename": "resume.pdf" }
    ]
  }],
  "text": {
    "format": {
      "type": "json_schema",
      "name": "resume_analysis",
      "schema": { ... },
      "strict": true
    }
  }
}
```

**Error handling:**
- HTTP 429 → "Rate limit exceeded" forwarded to client
- HTTP 402 → "Payment required" forwarded to client
- Other errors → generic "AI analysis failed" with server-side logging

### 7.2 Supabase Storage

**Bucket:** `temp-resumes`

- Used for temporary file storage during analysis
- Files are uploaded by the client before calling the edge function
- Files are deleted by the client after analysis completes
- Path format: `{userId}/{timestamp}.{extension}`

### 7.3 Supabase Auth

- JWT-based authentication via `Authorization: Bearer <token>` header
- Edge function validates the token with `supabase.auth.getUser(token)`
- User ID extracted from claims for quota checking and usage recording

---

## 8. Known Issues & Technical Debt

### 8.1 Active Issues

1. **localStorage as inter-page data bus**
   - **Risk:** Data loss if user clears browser data before viewing report
   - **Impact:** Low (reports are also auto-saved to DB)
   - **Recommendation:** Consider using a query parameter with the saved report ID instead, redirecting to `/resumepass/report/:id` after save

2. **Feature stripping relies on prompt injection**
   - **Risk:** AI may occasionally ignore "IMPORTANT RESTRICTION" directives, especially with model updates
   - **Impact:** Medium (premium content could leak to free-tier users)
   - **Recommendation:** Add server-side post-processing to empty the gated arrays before returning the response, regardless of what the AI returned

3. **DOCX text extraction is regex-based**
   - **Risk:** Complex formatting (tables, text boxes, headers/footers) may be missed
   - **Impact:** Medium (incomplete resume text → lower quality analysis)
   - **Current regex:** `/<w:t[^>]*>([^<]*)<\/w:t>/g`
   - **Recommendation:** Consider a proper XML parser or a DOCX-to-text library

4. **No file size validation**
   - **Risk:** Very large files could cause timeout or memory issues in the edge function
   - **Impact:** Low (Supabase Storage has its own limits)
   - **Recommendation:** Add client-side and server-side file size checks (e.g., 10MB max)

5. **`app_id` hardcoded to `curriculo_usa`**
   - **Issue:** The `usage_logs.app_id` column exists to support multiple apps, but `curriculo_usa` is hardcoded everywhere
   - **Impact:** Low (only one app currently uses it)
   - **Recommendation:** Make it configurable if new analysis tools are added

### 8.2 Technical Debt

1. **Quota check duplicated** — The edge function queries `user_subscriptions` + `plans` + `usage_logs` directly (lines 52-101), while the `get_user_quota()` RPC function does the same logic. The edge function should call the RPC instead of duplicating the query.

2. **`get_user_quota()` RPC doesn't return `features`** — The RPC function's return type doesn't include the `features` JSONB column from `plans`, but the `useSubscription` hook still needs it. A separate migration later added `features` to the return, but the original RPC definition shown in the migration doesn't include it. This may cause issues if the RPC is recreated from the original migration.

3. **Fire-and-forget report save** — The auto-save after analysis (`useCurriculoAnalysis.ts:178-193`) uses `.then()` without awaiting. If the save fails, the user has no indication. The localStorage copy is the only backup.

4. **No retry on analysis API call** — The OpenAI API call has no retry logic. If the call fails transiently, the user must manually retry. Compare with usage recording which has 3 retries with exponential backoff.

5. **Temp file cleanup on error path** — If the edge function throws before the client's cleanup step, the temp file remains in storage. There is no background job to clean orphaned files from `temp-resumes`.

6. **Legacy model in env var fallback** — The `apiConfigService.ts` legacy fallback for OpenAI uses `gpt-4o-mini` (line 117), while the edge function hardcodes `gpt-4.1-mini` (line 476). If the DB config is unavailable and the fallback is used, a different model would be selected.

### 8.3 Security Considerations

1. **Temp file access** — Files in `temp-resumes` bucket should have appropriate storage policies to prevent users from accessing other users' uploads. Verify bucket-level RLS is configured.

2. **Admin-editable system prompt** — The `resume_analyzer_prompt` in `app_configs` is admin-editable. A compromised admin account could modify the prompt to exfiltrate data or produce harmful output.

3. **Service role key in edge function** — The `SUPABASE_SERVICE_ROLE_KEY` is used for usage recording. This is appropriate for the use case but should be audited to ensure it's not used for broader operations than necessary.

---

## Appendix A: TypeScript Type Definitions

```typescript
// src/types/curriculo.ts

type AnalysisErrorCode = "UNSUPPORTED_FORMAT" | "EXTRACTION_FAILED"
                       | "INSUFFICIENT_CONTENT" | "AI_ERROR";

interface AnalysisError {
  error_code: AnalysisErrorCode;
  error: string;
  error_message: string;
  parsing_error: boolean;
}

interface FullAnalysisResult {
  header: {
    score: number;            // 0-100
    status_tag: string;       // e.g. "COMPATIBILIDADE DE MERCADO: ALTA"
    main_message: string;
    sub_message: string;
  };
  metrics: {
    ats_format: MetricItem;
    keywords: KeywordsMetric;
    action_verbs: VerbsMetric;
    brevity: BrevityMetric;
  };
  cultural_bridge: {
    brazil_title: string;     // e.g. "Engenheiro de Software"
    us_equivalent: string;    // e.g. "Software Engineer"
    explanation: string;
  };
  market_value: {
    range: string;            // e.g. "$85k - $110k/yr"
    context: string;
  };
  power_verbs_suggestions: string[];       // 5-8 verbs
  improvements: Improvement[];             // 3-5 items
  linkedin_fix: {
    headline: string;
    reasoning_pt: string;
  };
  interview_cheat_sheet: InterviewQuestion[];  // 3-5 items
  parsing_error?: boolean;
  parsing_error_message?: string;
}

interface MetricItem {
  score: number;
  label: string;
  details_pt: string;
}

interface KeywordsMetric extends MetricItem {
  matched_count: number;
  total_required: number;
}

interface VerbsMetric extends MetricItem {
  count: number;
}

interface BrevityMetric extends MetricItem {
  page_count: number;
  ideal_page_count: number;
}

interface Improvement {
  tags: string[];           // e.g. ["QUANTIFICACAO", "LIDERANCA"]
  original: string;
  improved: string;
  impact_label: string;     // e.g. "IMPACTO", "CLAREZA"
}

interface InterviewQuestion {
  question: string;         // In English
  context_pt: string;       // Tip/context in Portuguese
}

// localStorage key
const CURRICULO_RESULT_STORAGE_KEY = 'curriculo_analysis_result';
```

## Appendix B: Analysis State Machine

```
                 ┌──────┐
                 │ idle │ ◄── reset()
                 └──┬───┘
                    │ analyze()
                    ▼
              ┌──────────┐
              │uploading │
              └────┬─────┘
                   │ upload complete
                   ▼
              ┌──────────┐
              │analyzing │
              └────┬─────┘
                   │
          ┌────────┼──────────┐
          ▼        ▼          ▼
    ┌──────────┐ ┌─────┐ ┌──────────────┐
    │ complete │ │error│ │limit_reached │
    └──────────┘ └─────┘ └──────────────┘
```

States defined in `useCurriculoAnalysis.ts`:
- **`idle`** — Initial state, waiting for user input
- **`uploading`** — File being uploaded to `temp-resumes` bucket
- **`analyzing`** — Edge function processing (AI call in progress)
- **`complete`** — Analysis succeeded, result stored in localStorage
- **`error`** — Generic error (network, AI, parsing)
- **`limit_reached`** — Monthly quota exhausted (triggers UpgradeModal)

## Appendix C: API Request/Response Examples

### Successful Analysis Request

**Client → Edge Function:**
```
POST /functions/v1/analyze-resume
Authorization: Bearer <user_jwt>
Content-Type: application/json

{
  "filePath": "abc123/1708300000000.pdf",
  "jobDescription": "We are looking for a Senior Software Engineer..."
}
```

**Edge Function → Client (200):**
```json
{
  "header": {
    "score": 78,
    "status_tag": "COMPATIBILIDADE DE MERCADO: ALTA",
    "main_message": "Seu perfil tem forte alinhamento com a vaga",
    "sub_message": "Você está no top 25% dos candidatos"
  },
  "metrics": {
    "ats_format": { "score": 85, "label": "Bom", "details_pt": "..." },
    "keywords": { "score": 72, "label": "Adequado", "details_pt": "...", "matched_count": 8, "total_required": 12 },
    "action_verbs": { "score": 60, "label": "Precisa Melhorar", "details_pt": "...", "count": 4 },
    "brevity": { "score": 90, "label": "Perfeito", "details_pt": "...", "page_count": 1, "ideal_page_count": 1 }
  },
  "cultural_bridge": {
    "brazil_title": "Engenheiro de Software Sênior",
    "us_equivalent": "Senior Software Engineer",
    "explanation": "..."
  },
  "market_value": { "range": "$120k - $160k/yr", "context": "+20% acima da média regional" },
  "power_verbs_suggestions": ["Spearheaded", "Orchestrated", "Optimized", "Architected", "Streamlined"],
  "improvements": [ ... ],
  "linkedin_fix": { "headline": "Senior Software Engineer | ...", "reasoning_pt": "..." },
  "interview_cheat_sheet": [ ... ],
  "parsing_error": false,
  "parsing_error_message": ""
}
```

### Quota Exceeded Response

**Edge Function → Client (402):**
```json
{
  "error_code": "LIMIT_REACHED",
  "error": "Limite mensal atingido",
  "error_message": "Você atingiu o limite de 1 análise(s) do seu plano este mês.",
  "plan_id": "basic",
  "monthly_limit": 1,
  "used": 1
}
```
