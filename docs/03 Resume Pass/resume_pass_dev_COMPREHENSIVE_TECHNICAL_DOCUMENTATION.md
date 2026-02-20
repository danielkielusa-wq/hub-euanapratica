# EU NA PRÁTICA Hub (USAHUB) — Comprehensive Technical Documentation

---

## 1. Executive Summary

### What This Platform Does

EU NA PRÁTICA Hub is an online platform that helps Brazilian professionals build international careers, particularly in the United States. It combines structured learning programs, one-on-one mentoring with experts, and artificial intelligence tools that analyze resumes and provide personalized career guidance. Think of it as a career coaching school that also gives users AI-powered feedback and a supportive community — all in one place.

### Who It Serves and What Problem It Solves

The target users are Brazilian professionals at any career stage who want to work abroad. These people face a daunting combination of challenges: adapting their resumes to American standards, improving their English, understanding visa requirements, and navigating an unfamiliar job market. The platform solves this by providing step-by-step guidance through a proprietary framework called "ROTA EUA" (Route to the USA), expert mentors who have made the transition themselves, and AI tools that give instant, personalized feedback on resumes and career readiness.

### Current State of the Product

The platform is **live and in active use**. It has paying customers across three subscription tiers (Free, Pro, VIP), a working payment system, and AI features that are generating real analyses. Recent development activity (February 2026) shows the team actively adding features — including a product recommendation engine and a job title translation tool. The product has moved past the initial MVP stage and is in a **growth and feature-expansion phase**, though some planned features (like mock interviews with AI and a visa document tracker) are still listed as "coming soon."

### Key External Dependencies

- **Supabase** — This is the technology backbone. All user accounts, data storage, and backend logic run on their cloud service. If Supabase has problems, the entire platform is affected.
- **OpenAI** — The resume analysis tool uses OpenAI's AI models to generate feedback. This costs a small amount per analysis (roughly a fraction of a cent each) but would stop working if OpenAI's service becomes unavailable.
- **Anthropic (Claude)** — A second AI provider used for the job title translator and community-based product recommendations. Having two AI providers reduces single-vendor risk.
- **Ticto** — A Brazilian payment processor that handles all purchases. Revenue flows through this service.
- **n8n (Automation)** — Handles the automatic delivery of personalized reports to new leads and feeds lead data into the marketing/sales pipeline.

### Critical Risks and Open Questions

1. **Payment Security**: The payment webhook now validates tokens properly, which is good. However, there is no documented process for rotating the shared secret if it is compromised.
2. **AI Cost Scaling**: As usage grows, AI API costs will grow proportionally. There is currently no budget cap or alert system — a viral event could spike costs unexpectedly.
3. **Lead Delivery Reliability**: When a new lead enters the system, a webhook fires once to the automation platform. If that platform is down at that moment, the lead data is not retried — meaning a potential customer could be missed.
4. **No Documented Disaster Recovery**: There is no visible backup or disaster recovery strategy. If Supabase has a data loss event, recovery options are unclear.
5. **Single Payment Provider**: Ticto is Brazil-focused. International expansion would require adding a global payment provider like Stripe.

---

## 2. Product Overview

### Core Value Proposition

The platform delivers three things that are hard to get individually and nearly impossible to find combined:

1. **AI-Powered Career Tools** — Instant resume analysis against real US job descriptions, including ATS compatibility scoring, keyword matching, salary estimation, and cultural translation tips (Brazilian → American resume norms).
2. **Expert Human Guidance** — Live mentoring sessions and cohort-based courses led by professionals who have already made the Brazil-to-USA career transition.
3. **Structured Methodology** — The proprietary "ROTA EUA" framework breaks the overwhelming process into four clear phases (Recognize → Organize → Transition → Act), so users always know where they are and what to do next.

### User Flows

**Flow A: Lead Capture → Personalized Report → Sale**

A prospective customer fills out a career evaluation form or is imported via CSV by the admin team. The system generates an AI-powered personalized diagnostic report using the ROTA EUA framework, showing the person which phase they're in and what steps to take next. The report includes contextual product recommendations (e.g., "Based on your profile, we recommend our Resume Specialist service"). This is the primary sales funnel.

**Flow B: Authenticated User → Learning & Tools**

A registered user logs in and lands on their hub dashboard. From there they can:

- Browse and enroll in learning spaces (cohort-based courses with live sessions, materials, and assignments)
- Use ResumePass AI to analyze their resume against specific job descriptions
- Use the Title Translator to convert Brazilian job titles to US equivalents
- Book 1-on-1 mentoring sessions with available mentors
- Participate in the community forum (post questions, share experiences)
- Browse the Prime Jobs board for curated international opportunities

**Flow C: Admin Operations**

Admins manage the platform through a dedicated admin panel: importing leads via CSV, managing users and enrollments, configuring AI prompts, viewing payment logs, managing subscription plans, and monitoring platform analytics.

---

## 3. Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLIENTS (Browsers)                               │
│  React SPA · Vite · TypeScript · Tailwind CSS · shadcn/ui · Radix UI   │
│  React Router (role-based guards) · TanStack Query · React Hook Form    │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │ HTTPS (JWT auth)
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE CLOUD                                  │
│                                                                         │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────┐  ┌───────────┐  │
│  │ PostgreSQL   │  │ Edge Functions    │  │ Auth (JWT) │  │ Storage   │  │
│  │ (RLS on all  │  │ (Deno runtime)   │  │            │  │ Buckets:  │  │
│  │  tables)     │  │                  │  │ Email/Pass │  │ materials │  │
│  │              │  │ • analyze-resume │  │ Magic Link │  │ submissns │  │
│  │ 40+ tables   │  │ • format-lead-   │  │            │  │ temp-     │  │
│  │ 15+ enums    │  │   report         │  │            │  │  resumes  │  │
│  │ pg_net ext   │  │ • ticto-webhook  │  │            │  │ espacos   │  │
│  │              │  │ • translate-title│  │            │  │           │  │
│  │              │  │ • recommend-     │  │            │  │           │  │
│  │              │  │   product        │  │            │  │           │  │
│  │              │  │ • analyze-post-  │  │            │  │           │  │
│  │              │  │   for-upsell     │  │            │  │           │  │
│  │              │  │ • create-lead-   │  │            │  │           │  │
│  │              │  │   user           │  │            │  │           │  │
│  │              │  │ • verify-report- │  │            │  │           │  │
│  │              │  │   access         │  │            │  │           │  │
│  │              │  │ • delete-user    │  │            │  │           │  │
│  │              │  │ • send-booking-* │  │            │  │           │  │
│  │              │  │ • send-session-  │  │            │  │           │  │
│  │              │  │   reminder       │  │            │  │           │  │
│  └─────────────┘  └──────────────────┘  └────────────┘  └───────────┘  │
│                          │                                              │
│        pg_net trigger    │ HTTPS calls                                  │
│        (async webhook)   │                                              │
└──────────────────────────┼──────────────────────────────────────────────┘
                           │
          ┌────────────────┼───────────────────┐
          ▼                ▼                   ▼
   ┌─────────────┐  ┌───────────┐     ┌──────────────┐
   │   OpenAI    │  │ Anthropic │     │    Ticto      │
   │  API        │  │ (Claude)  │     │  (Payments)   │
   │             │  │           │     │               │
   │ gpt-4.1-   │  │ claude-   │     │ Webhook ──────┤
   │ mini       │  │ haiku-4-5 │     │ callback      │
   │            │  │ claude-   │     │               │
   │ Resume     │  │ 3-5-sonnet│     │ Hosted        │
   │ analysis + │  │           │     │ checkout      │
   │ Lead       │  │ Title     │     │ pages         │
   │ reports    │  │ translator│     │               │
   │            │  │ + upsell  │     │               │
   │            │  │ + product │     │               │
   │            │  │   reco    │     │               │
   └─────────────┘  └───────────┘     └──────────────┘
                                             │
                                      ┌──────┘
                                      ▼
                              ┌──────────────┐
                              │     n8n      │
                              │ (Automation) │
                              │              │
                              │ Lead webhook │
                              │ → CRM       │
                              │ → Email seq  │
                              └──────────────┘
```

### Full Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 18.3 | UI framework |
| | TypeScript | 5.8 | Type safety |
| | Vite | 5.4 | Build tool & dev server |
| | React Router DOM | 6.30 | Client-side routing |
| | TanStack Query | 5.83 | Server state management |
| | Tailwind CSS | 3.4 | Utility-first styling |
| | shadcn/ui + Radix UI | — | Component library |
| | React Hook Form + Zod | 7.61 / 3.25 | Forms & validation |
| | @react-pdf/renderer | 4.3 | PDF report export |
| | Recharts | 2.15 | Dashboard charts |
| | Lucide React | 0.462 | Icons |
| **Backend** | Supabase | — | BaaS platform |
| | PostgreSQL | 14+ | Database (with RLS) |
| | Deno | — | Edge function runtime |
| | pg_net | — | Async HTTP from DB triggers |
| **AI** | OpenAI API | — | Resume analysis, lead reports |
| | Anthropic API | — | Title translation, upsells, product reco |
| **Payments** | Ticto | — | Brazilian payment gateway |
| **Automation** | n8n | — | Webhook-triggered workflows |
| **Testing** | Vitest | 3.2 | Unit tests |
| | Testing Library | 16.0 | Component testing |

### How Components Communicate

- **Frontend → Supabase**: The `@supabase/supabase-js` client makes authenticated REST calls (JWT in Authorization header). All queries respect Row-Level Security policies — users only see data they're allowed to.
- **Frontend → Edge Functions**: Invoked via `supabase.functions.invoke('function-name', { body })`. Auth token forwarded automatically.
- **Edge Functions → External APIs**: Standard `fetch()` calls to OpenAI/Anthropic. API keys retrieved at runtime from the `api_configs` table (encrypted storage, decrypted via helper function `getApiConfig()`).
- **Database → n8n**: PostgreSQL triggers use `pg_net` extension to fire async HTTP POST requests to n8n webhooks. This is fire-and-forget (no retries).
- **Ticto → Edge Function**: Ticto sends HTTP POST to `/functions/ticto-webhook` after payment events. Token validated against stored secret in `api_configs`.

---

## 4. Database Schema

### Enums

```sql
app_role:           'admin' | 'mentor' | 'student'
session_status:     'scheduled' | 'live' | 'completed' | 'cancelled'
material_type:      'pdf' | 'link' | 'video' | 'other'
attendance_status:  'present' | 'absent' | 'unmarked'
notification_type:  'reminder_24h' | 'reminder_1h' | 'recording_available' | 'session_cancelled' | 'new_session'
assignment_status:  'draft' | 'published' | 'closed'
submission_type:    'file' | 'text' | 'both'
submission_status:  'draft' | 'submitted' | 'reviewed'
review_result:      'approved' | 'revision' | 'rejected'
booking_status:     'confirmed' | 'completed' | 'cancelled' | 'no_show'
booking_action:     'created' | 'rescheduled' | 'cancelled' | 'completed' | 'no_show_marked'
day_of_week:        'sunday' | 'monday' | ... | 'saturday'
file_type:          'pdf' | 'docx' | 'xlsx' | 'pptx' | 'zip' | 'png' | 'jpg' | 'link'
access_level:       'public' | 'restricted'
espaco_category:    'immersion' | 'group_mentoring' | 'workshop' | 'bootcamp' | 'course'
espaco_visibility:  'public' | 'private'
```

### Tables by Domain

#### Users & Auth

| Table | Key Columns | Notes |
|-------|------------|-------|
| **`profiles`** | `id` (PK, FK→auth.users), `email`, `full_name`, `phone`, `phone_country_code`, `is_whatsapp`, `profile_photo_url`, `timezone`, `status` ('active'\|'inactive'), `has_completed_onboarding`, `last_login_at` | Auto-created via trigger on auth.users INSERT |
| **`user_roles`** | `user_id` (FK→auth.users), `role` (app_role) | UNIQUE(user_id, role). Checked via `has_role()` function |

#### Subscription & Quota

| Table | Key Columns | Notes |
|-------|------------|-------|
| **`plans`** | `id` (TEXT PK: 'basic'\|'pro'\|'vip'), `name`, `monthly_limit` (1, 10, 999), `features` (JSONB), `is_active` | Features: `allow_pdf`, `show_improvements`, `show_cheat_sheet`, `show_power_verbs`, `impact_cards`, `priority_support` |
| **`user_subscriptions`** | `user_id` (FK, UNIQUE), `plan_id` (FK→plans), `status` ('active'\|'inactive'\|'cancelled'), `starts_at`, `expires_at` | One subscription per user |
| **`usage_logs`** | `user_id`, `app_id` (default 'curriculo_usa'), `created_at` | One row per AI analysis. Monthly count checked before allowing new analysis |

#### Learning Spaces (Espaços)

| Table | Key Columns | Notes |
|-------|------------|-------|
| **`espacos`** | `id`, `name`, `description`, `mentor_id` (FK), `status`, `category` (espaco_category), `visibility`, `max_students`, `cover_image_url`, `start_date`, `end_date` | Cohort/class container |
| **`user_espacos`** | `user_id`, `espaco_id`, `status`, `access_expires_at`, `enrolled_by`, `last_access_at` | UNIQUE(user_id, espaco_id). Enrollment record |
| **`sessions`** | `id`, `title`, `datetime`, `duration_minutes`, `espaco_id`, `meeting_link`, `status` (session_status), `recording_url`, `is_recurring`, `recurrence_pattern` (JSONB) | Live class sessions |
| **`session_attendance`** | `session_id`, `user_id`, `status` (attendance_status), `marked_at`, `marked_by` | UNIQUE(session_id, user_id) |
| **`session_materials`** | `session_id`, `title`, `file_url`, `material_type` | Session-specific files |

#### Library (Materials)

| Table | Key Columns | Notes |
|-------|------------|-------|
| **`folders`** | `id`, `name`, `parent_id` (self-FK for hierarchy), `espaco_id`, `display_order` | Hierarchical folder tree |
| **`materials`** | `folder_id`, `filename`, `title`, `file_url`, `file_size`, `file_type`, `access_level`, `available_at`, `display_order` | Supports drip-release via `available_at`. GIN index for full-text search |
| **`material_downloads`** | `material_id`, `user_id`, `downloaded_at` | Analytics |
| **`user_favorites`** | `user_id`, `material_id` | UNIQUE(user_id, material_id) |

#### Assignments

| Table | Key Columns | Notes |
|-------|------------|-------|
| **`assignments`** | `espaco_id`, `title`, `instructions`, `due_date`, `submission_type`, `status` (assignment_status), `max_file_size` (10MB), `allowed_file_types`, `allow_late_submission` | Mentor-created tasks |
| **`assignment_materials`** | `assignment_id`, `title`, `file_url` | Support files attached to assignment |
| **`submissions`** | `assignment_id`, `user_id`, `status` (submission_status), `file_url`, `text_content`, `submitted_at`, `reviewed_by`, `review_result`, `feedback` | UNIQUE(assignment_id, user_id) |

#### Booking System

| Table | Key Columns | Notes |
|-------|------------|-------|
| **`hub_services`** | `id`, `name`, `description`, `icon_name`, `status` ('available'\|'premium'\|'coming_soon'), `route`, `category`, `service_type`, `price`, `price_display`, `ticto_checkout_url`, `ticto_product_id`, `landing_page_url`, `is_visible_in_hub`, `is_visible_for_upsell`, `keywords` (TEXT[]), `cta_text` | Master catalog of all platform services |
| **`user_hub_services`** | `user_id`, `service_id`, `status`, `started_at`, `expires_at` | UNIQUE(user_id, service_id). Access grants |
| **`mentor_services`** | `mentor_id`, `service_id`, `slot_duration_minutes` (60), `buffer_minutes` (15), `price_override` | Which mentors offer which bookable services |
| **`mentor_availability`** | `mentor_id`, `day_of_week`, `start_time`, `end_time`, `timezone` | Recurring weekly windows. CHECK(start < end) |
| **`mentor_blocked_times`** | `mentor_id`, `start_datetime`, `end_datetime`, `reason` | Holidays, vacations |
| **`bookings`** | `student_id`, `mentor_id`, `service_id`, `scheduled_start`, `scheduled_end`, `status` (booking_status), `meeting_link`, `student_notes`, `reschedule_count`, `cancelled_by`, `cancellation_reason`, `mentor_notes` | UNIQUE INDEX on (mentor_id, scheduled_start) WHERE confirmed — prevents double-booking |
| **`booking_history`** | `booking_id`, `action` (booking_action), `performed_by`, `old_datetime`, `new_datetime`, `notes` | Audit trail |
| **`booking_policies`** | `service_id` (nullable=global), `max_concurrent_bookings` (3), `max_reschedules_per_booking` (2), `min_notice_hours` (48), `max_advance_days` (30), `cancellation_window_hours` (24), `default_duration_minutes` (60), `slot_interval_minutes` (30) | Configurable rules |

#### ResumePass AI

| Table | Key Columns | Notes |
|-------|------------|-------|
| **`resumepass_reports`** | `user_id`, `title`, `report_data` (JSONB), `created_at` | Persisted AI analysis results |

#### Career Evaluations (Lead System)

| Table | Key Columns | Notes |
|-------|------------|-------|
| **`career_evaluations`** | `user_id`, `name`, `email`, `phone`, `area`, `atuacao`, `trabalha_internacional`, `experiencia`, `english_level`, `objetivo`, `visa_status`, `timeline`, `family_status`, `income_range`, `investment_range`, `impediment`, `main_concern`, `report_content` (raw CSV), `formatted_report` (AI JSON), `access_token` (UUID, UNIQUE), `access_count`, `recommended_product_name`, `recommendation_description`, `recommendation_landing_page_url`, `recommendation_status` | Core lead/funnel table. Triggers: notify_new_lead (webhook), trigger_recommend_product (AI) |

#### Community

| Table | Key Columns | Notes |
|-------|------------|-------|
| **`community_categories`** | `id`, `name`, `slug`, `description`, `display_order` | Forum categories |
| **`community_posts`** | `user_id`, `category_id`, `title`, `content`, `likes_count`, `comments_count`, `is_pinned` | Denormalized counts for performance |
| **`community_comments`** | `post_id`, `user_id`, `content`, `parent_id` (self-FK for nesting) | Nested replies |
| **`community_likes`** | `post_id`, `user_id` | UNIQUE(post_id, user_id) |

#### Upsell System

| Table | Key Columns | Notes |
|-------|------------|-------|
| **`upsell_impressions`** | `user_id`, `service_id`, `post_id` (UNIQUE), `confidence_score` (>=0.7), `reason`, `microcopy`, `shown_at`, `clicked_at`, `dismissed_at`, `converted_at` | AI-generated contextual product suggestions on community posts |
| **`upsell_blacklist`** | `user_id`, `service_id`, `blacklisted_until` | UNIQUE(user_id, service_id). Users who dismissed a service 2x are blacklisted for 30 days |

#### Payments & Orders

| Table | Key Columns | Notes |
|-------|------------|-------|
| **`products`** | `name`, `description`, `access_duration_days`, `price`, `is_active` | Package offerings |
| **`product_espacos`** | `product_id`, `espaco_id` | Maps products to learning spaces they grant access to |
| **`user_products`** | `user_id`, `product_id`, `expires_at`, `status` | UNIQUE(user_id, product_id) |
| **`payment_logs`** | `user_id`, `service_id`, `transaction_id`, `event_type`, `payload` (JSONB), `status`, `processed_at` | Full webhook event log. UNIQUE(transaction_id, event_type) for idempotency |

#### Analytics & Audit

| Table | Key Columns | Notes |
|-------|------------|-------|
| **`analytics_events`** | `user_id`, `event_type`, `entity_type`, `entity_id`, `metadata` (JSONB) | Page views, CTA clicks, service access |
| **`audit_events`** | `user_id`, `actor_id`, `action`, `entity_type`, `entity_id`, `old_values`, `new_values`, `source`, `idempotency_key` (UNIQUE) | Compliance audit trail |
| **`enrollment_history`** | `user_id`, `espaco_id`, `action`, `old_status`, `new_status`, `performed_by` | Triggered automatically on user_espacos changes |

#### Configuration

| Table | Key Columns | Notes |
|-------|------------|-------|
| **`app_configs`** | `key` (UNIQUE TEXT), `value` (TEXT), `description` | Runtime-configurable settings. Keys include: `lead_webhook_url`, `lead_webhook_enabled`, `resume_analyzer_prompt`, `lead_report_formatter_prompt`, `llm_product_recommendation_prompt`, `upsell_enabled`, `upsell_prompt_template`, `upsell_model`, `supabase_edge_url`, `supabase_anon_key` |
| **`api_configs`** | `name` (UNIQUE: 'openai_api', 'anthropic_api', 'ticto_webhook'), `api_key` (encrypted), `base_url`, `credentials` (JSONB), `parameters` (JSONB), `is_active` | Encrypted API key storage |

### Key RLS Patterns

All tables have RLS enabled. Four security-definer helper functions power the policies:

```sql
has_role(user_id, role)              -- Does user have this specific role?
is_admin_or_mentor(user_id)          -- Is user admin or mentor?
is_enrolled_in_espaco(user_id, id)   -- Is user enrolled in this space?
is_mentor_of_espaco(user_id, id)     -- Is user the mentor of this space?
```

**Pattern**: Students see only their own data + data from enrolled spaces. Mentors see their spaces + all profiles. Admins see everything.

### Notable Indexes

```sql
-- Prevent double-booking (CRITICAL race condition prevention)
CREATE UNIQUE INDEX idx_bookings_mentor_no_overlap
  ON bookings(mentor_id, scheduled_start) WHERE status = 'confirmed';

-- Full-text search on materials
CREATE INDEX idx_materials_search ON materials
  USING gin(to_tsvector('portuguese', coalesce(filename,'') || ' ' || coalesce(title,'')));

-- Partial indexes for active-only queries
CREATE INDEX idx_mentor_services_active ON mentor_services(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_bookings_student_upcoming ON bookings(student_id, scheduled_start) WHERE status = 'confirmed';
```

---

## 5. Core Features

### Feature 1: ResumePass AI (Resume Analysis)

**What it does**: Analyzes a user's resume (PDF or DOCX) against a specific US job description, producing a detailed compatibility report.

**Technical flow**:
1. User uploads resume to Supabase Storage bucket `temp-resumes`
2. User pastes target job description text
3. Frontend calls Edge Function `analyze-resume` with `{ filePath, jobDescription }`
4. Edge Function performs **gatekeeper check**: queries `user_subscriptions` → `plans` to get `monthly_limit`, counts `usage_logs` this month. Returns HTTP 402 if quota exceeded.
5. Downloads file from Storage. For PDF: converts to base64 for multimodal processing. For DOCX: unzips (DOCX is a ZIP archive), extracts `word/document.xml`, parses `<w:t>` tags for text content. Rejects `.doc` (legacy binary format).
6. Retrieves AI system prompt from `app_configs` (key: `resume_analyzer_prompt`). **Feature stripping**: appends restrictions based on plan features (e.g., if `show_improvements` is false, instructs AI to return empty improvements array).
7. Calls OpenAI Responses API (`gpt-4.1-mini`) with strict JSON schema enforcement.
8. Records usage in `usage_logs` with retry logic (3 attempts, exponential backoff). **If recording fails, the request fails** — prevents abuse.
9. Records audit event (best-effort, non-blocking).
10. Returns structured JSON to frontend.

**Output schema** (enforced by OpenAI strict mode):
```typescript
{
  header:       { score: 0-100, status_tag, main_message, sub_message }
  metrics:      { ats_format: {score, label, details_pt},
                  keywords: {score, matched_count, total_required, ...},
                  action_verbs: {score, count, ...},
                  brevity: {score, page_count, ideal_page_count, ...} }
  cultural_bridge: { brazil_title, us_equivalent, explanation }
  market_value:    { range: "$85k-$110k/yr", context }
  power_verbs_suggestions: string[]           // Plan-gated
  improvements: [{tags, original, improved, impact_label}]  // Plan-gated
  linkedin_fix: { headline, reasoning_pt }
  interview_cheat_sheet: [{question, context_pt}]  // Plan-gated
}
```

**Relevant endpoints**: Edge Function `analyze-resume`

---

### Feature 2: Career Diagnostic Reports (Lead Funnel)

**What it does**: Generates AI-powered personalized career assessment reports for leads using the ROTA EUA framework. Reports are publicly accessible via a token URL (no login required).

**Technical flow**:
1. Admin imports leads via CSV at `/admin/leads`. Each row creates an `auth.users` record (via `create-lead-user` edge function) and a `career_evaluations` record.
2. Database trigger `trigger_notify_new_lead` fires, calling `notify_new_lead()` which uses `pg_net` to POST the full lead payload + report link to the n8n webhook URL.
3. n8n workflow sends the lead an email with their personalized report link.
4. Lead opens `/report/:access_token`. Frontend calls `verify-report-access` edge function (action: 'check') to validate the token exists.
5. Lead enters their email for verification. Frontend calls `verify-report-access` (action: 'verify') to match email against the evaluation record.
6. If `formatted_report` is null or stale, frontend calls `format-lead-report` edge function. This function:
   - Loads system prompt from `app_configs` (key: `lead_report_formatter_prompt`)
   - Queries all `hub_services` for contextual recommendations
   - Calls OpenAI GPT-4.1-mini with Responses API (strict JSON schema)
   - AI generates: greeting, diagnostic, ROTA phase determination, 3-step action plan, service recommendations (PRIMARY/SECONDARY/UPGRADE), free resources, WhatsApp keyword
   - Enriches recommendations with service details (price, CTA, checkout URL)
   - Caches result in `formatted_report` column
7. After report formatting, trigger `trigger_recommend_product_on_report` fires, calling `recommend-product` edge function via `pg_net`. This function calls an LLM (Anthropic or OpenAI, admin-configurable) to pick a single best-fit product from `hub_services` and saves it to the evaluation record.

**Relevant endpoints**: Edge Functions `create-lead-user`, `verify-report-access`, `format-lead-report`, `recommend-product`

---

### Feature 3: Booking System (1-on-1 Mentoring)

**What it does**: Students book 1-on-1 sessions with mentors based on real-time calendar availability.

**Technical flow**:
1. Frontend queries `mentor_services` (active mentors for selected service), `mentor_availability` (recurring weekly windows), `mentor_blocked_times` (specific blocked periods), and existing confirmed `bookings`.
2. Frontend calculates available slots by: generating all possible slots from recurring availability → subtracting blocked times → subtracting confirmed bookings → applying policy constraints (min 48h notice, max 30 days ahead).
3. User selects slot → INSERT into `bookings` with status='confirmed'.
4. Database unique index `idx_bookings_mentor_no_overlap` atomically prevents double-booking (concurrent inserts for same mentor/time will fail with constraint violation).
5. Edge functions handle notifications: `send-booking-confirmation`, `send-booking-reminder` (24h + 1h before), `send-booking-rescheduled`, `send-booking-cancelled`.
6. Rescheduling: UPDATE `bookings` SET new time, `reschedule_count++`. Max 2 reschedules enforced in frontend.
7. Cancellation: Must be 24h+ before session. UPDATE status='cancelled', `cancelled_at`, `cancelled_by`.
8. Completion: Mentor marks complete with notes. UPDATE status='completed', `completed_at`.
9. All state changes logged in `booking_history` table.

**Relevant endpoints**: Edge Functions `send-booking-confirmation`, `send-booking-reminder`, `send-booking-rescheduled`, `send-booking-cancelled`

---

### Feature 4: Learning Spaces (Espaços)

**What it does**: Cohort-based learning environments with live sessions, materials library, assignments, and attendance tracking.

**Key components**:
- **Enrollment**: Admin creates `user_espacos` records (or users self-enroll for public spaces). Changes auto-logged via trigger to `enrollment_history`.
- **Sessions**: Mentor creates scheduled sessions with meeting links. Attendance marked post-session. Reminders sent via `send-session-reminder` edge function.
- **Materials**: Hierarchical folder system. Files uploaded to Supabase Storage bucket `materials` (50MB limit). Supports drip-release via `available_at` field — materials become visible to students only after the scheduled date.
- **Assignments**: Mentor creates tasks with due dates. Students submit files (10MB limit, bucket `submissions`) or text. Mentor reviews with feedback and result (approved/revision/rejected).

**Relevant endpoints**: Edge Function `send-session-reminder`, `send-espaco-invitation`

---

### Feature 5: Community Forum

**What it does**: In-platform social forum where users post questions, share experiences, and engage via comments and likes.

**Key components**:
- Posts organized by categories
- Nested comment replies (via `parent_id` self-join)
- Like system (one like per user per post, enforced by UNIQUE constraint)
- Denormalized `likes_count` and `comments_count` on posts for performance
- **AI-powered contextual upsell**: After a user creates a post, the `analyze-post-for-upsell` edge function is called. It:
  1. Checks if upsell is globally enabled (`app_configs`)
  2. Checks user rate limit (max 1 upsell card per configured time window)
  3. Pre-filters services by keyword match against post text
  4. If keywords match, calls Anthropic Claude API to determine if there's a genuine contextual match
  5. If confidence >= 0.7 and service isn't blacklisted for this user, creates an `upsell_impressions` record
  6. Frontend renders a subtle product suggestion card on the post
  7. If user dismisses twice, service is blacklisted for 30 days

**Relevant endpoints**: Edge Function `analyze-post-for-upsell`

---

### Feature 6: Title Translator

**What it does**: Translates Brazilian job titles to US equivalents using AI.

**Technical flow**: Frontend calls `translate-title` edge function → retrieves Anthropic API config → calls Claude API → returns translated title with explanation. Usage counted against quota.

**Relevant endpoints**: Edge Function `translate-title`

---

### Feature 7: Prime Jobs (Job Board)

**What it does**: Curated board of international job opportunities.

**Key features**: Job listings, bookmarking (plan-gated for saved bookmarks), weekly digest emails via `send-prime-jobs-digest` edge function.

**Relevant endpoints**: Edge Function `send-prime-jobs-digest`

---

### Feature 8: Admin Impersonation

**What it does**: Admins can "view as" any user to debug issues or provide support, without needing the user's password.

**Technical implementation** (from `AuthContext.tsx`):
- Admin clicks "Impersonate" on a user in the admin panel
- `impersonate(userId)` function loads the target user's profile and role
- Sets `impersonatedUser` state — all subsequent renders use this user's context
- Audit event logged: `impersonation_started` with `actor_id` = admin
- Admin's real identity preserved in `realUser` state
- `stopImpersonation()` reverts to admin context
- **Important**: This is a frontend-only impersonation — the admin's actual auth token is still used for API calls, so RLS policies still apply as admin

---

## 6. Key Business Logic

### Plan Feature Gating

```
Plan     │ monthly_limit │ allow_pdf │ show_improvements │ show_cheat_sheet │ show_power_verbs │ priority_support
─────────┼───────────────┼───────────┼───────────────────┼──────────────────┼──────────────────┼─────────────────
Básico   │       1       │     ✗     │        ✗          │        ✗         │        ✗         │       ✗
Pro      │      10       │     ✓     │        ✓          │        ✓         │        ✓         │       ✗
VIP      │     999       │     ✓     │        ✓          │        ✓         │        ✓         │       ✓
```

The `analyze-resume` edge function enforces this at the AI prompt level: it appends `IMPORTANT RESTRICTION: Return an EMPTY array [] for the 'improvements' field` when the user's plan doesn't include that feature. This means the AI call still happens, but restricted sections return empty.

### Quota Enforcement

```sql
-- PostgreSQL function: get_user_quota(user_id)
-- Returns: plan_id, plan_name, monthly_limit, used_this_month, remaining
-- Logic: COUNT(*) FROM usage_logs WHERE created_at >= date_trunc('month', now())
```

1. Edge function checks quota BEFORE processing
2. If quota exceeded → HTTP 402 with plan details + upgrade prompt
3. Usage recorded AFTER successful AI call but BEFORE returning result
4. Recording uses 3-attempt retry with exponential backoff (200ms, 400ms, 800ms)
5. If all retries fail → request fails (prevents free usage)

### ROTA EUA Phase Determination (AI-driven)

The AI determines which of 4 phases a lead is in based on their profile:
- **R (Reconhecimento)**: Low English, no international experience, major impediments
- **O (Organização)**: Intermediate English, no visa, needs document prep
- **T (Transição)**: Advanced English, visa in process, actively searching
- **A (Ação)**: Fluent English, immediate timeline, ready for interviews

### Payment Processing Flow

```
User clicks purchase → Redirect to Ticto checkout URL
                        ↓ (user completes payment)
Ticto POSTs webhook → ticto-webhook edge function
                        ↓
1. Validate token (body.token OR X-Ticto-Token header vs api_configs secret)
2. Parse event: paid/completed/approved → SALE; reembolso/refunded → REFUND
3. Find profile by email, find service by ticto_product_id
4. SALE → UPSERT user_hub_services (status='active')
   REFUND → UPDATE user_hub_services (status='cancelled')
5. Log to payment_logs (UPSERT by transaction_id+event_type for idempotency)
```

### Contextual Upsell Decision Pipeline

```
Post created → keyword pre-filter → AI confidence analysis → blacklist check → impression created

Safeguards:
- Global kill switch: app_configs.upsell_enabled
- Rate limit: max 1 upsell per user per configurable window
- Confidence threshold: >= 0.7 required
- Blacklist: dismissed 2x → blacklisted for 30 days
- One upsell per post: UNIQUE(post_id) constraint
```

---

## 7. External Integrations

### OpenAI API

| Aspect | Details |
|--------|---------|
| **Used by** | `analyze-resume`, `format-lead-report`, `recommend-product` (configurable) |
| **Model** | `gpt-4.1-mini` |
| **API Style** | Responses API with strict JSON schema |
| **Auth** | Bearer token from `api_configs` (name: 'openai_api') |
| **Data sent** | Resume text (or PDF base64), job descriptions, lead profile data, available services list |
| **Data received** | Structured JSON (enforced by schema) |
| **Error handling** | 429 (rate limit) → surfaced to user; 402 (billing) → surfaced; other → generic error |

### Anthropic API (Claude)

| Aspect | Details |
|--------|---------|
| **Used by** | `translate-title`, `analyze-post-for-upsell`, `recommend-product` (configurable) |
| **Models** | `claude-haiku-4-5-20251001` (upsell, fast+cheap), `claude-3-5-sonnet-20241022` (title translation, higher quality) |
| **API Style** | Messages API |
| **Auth** | x-api-key header from `api_configs` (name: 'anthropic_api') |
| **Data sent** | Post content (upsell), job titles (translator), lead profile + services (recommendation) |
| **Configurability** | Model, max_tokens, temperature all configurable via `app_configs` |

### Ticto Payment Gateway

| Aspect | Details |
|--------|---------|
| **Integration type** | Hosted checkout + webhook callback |
| **Webhook endpoint** | Edge Function `ticto-webhook` |
| **Auth** | Token validation: `payload.token` OR `X-Ticto-Token` header matched against `api_configs` (name: 'ticto_webhook') secret |
| **Sale events** | `paid`, `completed`, `approved`, `authorized`, `venda_realizada` → grants service access |
| **Refund events** | `reembolso`, `refunded`, `chargedback`, `cancelled` → revokes service access |
| **Idempotency** | UPSERT by `(transaction_id, event_type)` prevents duplicate processing |
| **Logging** | All events logged to `payment_logs` with full payload |

### n8n Automation

| Aspect | Details |
|--------|---------|
| **Webhook URL** | `https://n8n.sapunplugged.com/webhook/7df09015-...` (hardcoded in trigger function) |
| **Trigger** | PostgreSQL `AFTER INSERT` trigger on `career_evaluations` |
| **Mechanism** | `pg_net.http_post()` (async, fire-and-forget) |
| **Data sent** | Full lead profile + `report_link` (public report URL) |
| **No retry** | If n8n is down, webhook is lost |
| **Configurability** | Webhook URL is hardcoded in the trigger function (later migrations add `app_configs` key `lead_webhook_url`, but the trigger still uses hardcoded URL) |

### Supabase Auth

| Aspect | Details |
|--------|---------|
| **Methods** | Email/password (primary), magic links |
| **Auto-provisioning** | Trigger `on_auth_user_created` creates `profiles` record + `user_roles` (default: 'student') |
| **Password resets** | Built-in Supabase flow via `/reset-password` route |
| **JWT** | Standard Supabase JWT in Authorization header; used by all RLS policies via `auth.uid()` |

### Supabase Storage

| Bucket | Max Size | Allowed Types | Purpose |
|--------|----------|---------------|---------|
| `materials` | 50MB | PDF, DOCX, XLSX, PPTX, ZIP, PNG, JPG | Course materials |
| `submissions` | 10MB | PDF, DOCX, XLSX, ZIP | Student assignment submissions |
| `temp-resumes` | ⚠️ *Not visible in migrations* | PDF, DOCX | ResumePass uploads |
| `espacos` | ⚠️ *Inferred — needs verification* | Images | Espaco cover images |

---

## 8. Known Issues & Technical Debt

### Active TODOs in Code

**`src/pages/thankyou/ThankYouRota60.tsx:20`**
```typescript
// TODO: Update with actual Calendly or booking link
```
**Impact**: Thank-you page after "Rota 60min" purchase uses a placeholder link. Customers who just paid cannot book their session.

---

### Webhook URL Hardcoded in Database Trigger

**File**: Migration `20260209000000_lead_webhook_trigger.sql`, line 8
```sql
webhook_url TEXT := 'https://n8n.sapunplugged.com/webhook/7df09015-...';
```
**Issue**: The n8n webhook URL is hardcoded in the PostgreSQL trigger function. Later migrations added `app_configs` keys for webhook configuration, but the trigger function was never updated to read from `app_configs`.
**Impact**: Changing the webhook URL requires a database migration, not just a config change.
**Recommendation**: Update `notify_new_lead()` to read URL from `app_configs`.

---

### No Retry Logic for Lead Webhooks

**Issue**: `pg_net.http_post()` is fire-and-forget. If n8n is unreachable, the webhook is silently lost.
**Impact**: Leads may never receive their diagnostic report email.
**Recommendation**: Add a `webhook_delivery_status` column to `career_evaluations` and a scheduled job to retry failed deliveries.

---

### Feature Stripping via Prompt Injection

**File**: `analyze-resume/index.ts`, lines 148-157
```typescript
if (!features.show_improvements) {
  systemPrompt += "\n\nIMPORTANT RESTRICTION: ... Return an EMPTY array []...";
}
```
**Issue**: Plan feature gating is done by appending instructions to the AI prompt. The AI call still happens at full cost — it just returns empty sections. A dedicated user could also potentially override this by manipulating the request.
**Recommendation**: Post-process the AI response server-side to strip gated sections, rather than relying on prompt instructions. This saves tokens and is more secure.

---

### Missing Notification UI

**Issue**: A `notifications` table exists with types like `reminder_24h`, `recording_available`, etc. However, no frontend notification bell, inbox, or toast system was found that reads from this table.
**Impact**: In-app notifications may not be visible to users even though they're being created.
**Recommendation**: Either implement notification UI or deprecate the table.

---

### Assignment Re-submission Flow Unclear

**Issue**: The `review_result` enum includes 'revision' (needs rework), but there's no documented flow for how students re-submit. The `submissions` table has UNIQUE(assignment_id, user_id), meaning a student can only have one submission record per assignment.
**Impact**: If a mentor requests revisions, it's unclear whether the student updates their existing submission or the workflow is manual.
**Recommendation**: Document the intended flow. Consider adding a `revision_count` field or allowing multiple submission versions.

---

### Storage Bucket `temp-resumes` Not Created in Migrations

**Issue**: The `analyze-resume` edge function downloads files from a `temp-resumes` bucket, but no migration creates this bucket (unlike `materials` and `submissions` which are created via `INSERT INTO storage.buckets`).
**Impact**: ⚠️ *Inferred — needs verification* — The bucket may have been created manually or via the Supabase dashboard, which means it wouldn't be reproduced in a fresh environment setup.

---

### Admin Impersonation is Frontend-Only

**Issue**: The impersonation system in `AuthContext.tsx` only swaps the displayed user context on the frontend. The actual Supabase auth token remains the admin's, so all API calls go through with admin-level RLS permissions.
**Impact**: Admin seeing the "student view" still has admin data access — it doesn't truly replicate the student experience (e.g., they might see materials a student can't).
**Recommendation**: Document this limitation. For true impersonation, consider using Supabase's admin API to generate a temporary token for the target user.

---

### Potential Areas of Fragility

1. **DOCX Parsing**: The DOCX text extraction in `analyze-resume` uses regex on raw XML (`<w:t>` tags). Complex DOCX files with nested elements, tables, or embedded objects may lose content.

2. **Concurrent Booking Error UX**: The unique index prevents double-booking, but throws a raw constraint violation error. The frontend should handle this gracefully with a user-friendly message and slot refresh.

3. **OpenAI Response Format Changes**: The edge function has a custom `extractOutputText()` function that handles multiple OpenAI response formats. If OpenAI changes their Responses API format again, this could break silently.

4. **Community Post Counts Denormalization**: `likes_count` and `comments_count` on `community_posts` could drift out of sync if triggers or application logic have bugs. No reconciliation mechanism is visible.

---

### Security Considerations

1. **Ticto Webhook Validation** - Token validation IS implemented (checks `payload.token` against stored secret). This is good.

2. **API Key Encryption** - Keys are stored in `api_configs` with an encrypted `credentials` JSONB field, decrypted via `getApiConfig()` helper. The encryption mechanism uses Supabase Vault. ⚠️ *Inferred — exact encryption method should be verified.*

3. **Public Report Token Expiration** - Career evaluation reports are accessible indefinitely via UUID token. There's no expiration mechanism. `access_count` is tracked but not capped.

4. **CORS Wildcard** - All edge functions use `Access-Control-Allow-Origin: *`. This is appropriate for a public-facing API but worth noting.

---

**Document Version**: 1.0
**Generated**: 2026-02-19
**Source**: Full codebase analysis of `hub-euanapratica/`
**Coverage**: 90+ migration files, 20 edge functions, all routing and auth logic, existing documentation
