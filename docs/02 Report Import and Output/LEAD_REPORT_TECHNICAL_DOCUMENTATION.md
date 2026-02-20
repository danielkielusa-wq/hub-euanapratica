# EUA Na Prática - Lead Diagnostic System
## Technical Documentation v2.0

**Last Updated:** February 19, 2026
**Document Status:** Canonical Engineering Reference
**Maintainers:** Engineering Team

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [N8N Pipeline](#2-n8n-pipeline)
3. [Supabase Schema](#3-supabase-schema)
4. [AI Prompt Layer](#4-ai-prompt-layer)
5. [Report Rendering](#5-report-rendering)
6. [Product Recommendation Logic](#6-product-recommendation-logic)
7. [Known Issues & Technical Debt](#7-known-issues--technical-debt)
8. [Deployment & Operations](#8-deployment--operations)

---

## 1. System Overview

### 1.1 High-Level Architecture

The EUA Na Prática Lead Diagnostic System is a multi-stage pipeline that transforms raw lead form submissions into personalized career assessment reports with AI-powered product recommendations.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW (End-to-End)                          │
└─────────────────────────────────────────────────────────────────────────┘

    User fills form
         │
         ▼
    ┌─────────┐
    │ N8N     │──── 1. Receives webhook (form submission)
    │ Webhook │
    └────┬────┘
         │
         ▼
    ┌──────────────┐
    │ N8N JS Code  │──── 2. Calculates scores (0-100)
    │ (v2.4)       │     3. Classifies phase (1-5)
    │              │     4. Determines tier (FREE/LOW/MED/HIGH)
    │              │     5. Identifies barriers
    └──────┬───────┘
         │
         ▼
    ┌──────────────┐
    │ N8N AI Prompt│──── 6. Generates narrative report (V2)
    │ (OpenAI)     │     7. Returns structured JSON
    └──────┬───────┘
         │
         ▼
    ┌──────────────┐
    │ Supabase     │──── 8. Saves formatted_report to career_evaluations
    │ Insert       │
    └──────┬───────┘
         │
         ├──────────────────────────────────┐
         │                                  │
         ▼                                  ▼
    ┌──────────────┐                 ┌──────────────┐
    │ PG Trigger   │                 │ Frontend     │
    │              │                 │ Requests     │
    └──────┬───────┘                 │ Report       │
         │                           └──────┬───────┘
         ▼                                  │
    ┌──────────────┐                       │
    │ recommend-   │◄──────────────────────┘
    │ product      │──── 9. Reads tier from formatted_report
    │ Edge Function│     10. Queries hub_services dynamically
    │              │     11. Calls LLM (Anthropic/OpenAI)
    │              │     12. Saves recommended_product_name,
    │              │         recommendation_description,
    │              │         recommendation_landing_page_url
    └──────┬───────┘
         │
         ▼
    ┌──────────────┐
    │ Frontend     │──── 13. Renders V2 report with:
    │ V2Report     │         - Score breakdown
    │ Container    │         - Phase classification
    │              │         - Detailed analysis
    │              │         - Product recommendation CTA
    └──────────────┘
```

### 1.2 Component List

| Component | Purpose | Technology | Location |
|-----------|---------|-----------|----------|
| **N8N Workflow** | Lead ingestion, scoring, tier classification | N8N (self-hosted) | ⚠️ Inferred - no direct source access |
| **N8N JS Code v2.4** | Scoring algorithm (0-100) + tier logic | JavaScript | Provided in session summary |
| **N8N AI Prompt** | Generates V2 narrative report | OpenAI GPT-4.1-mini | Configured in N8N |
| **Supabase DB** | Persistent storage for leads, reports, products | PostgreSQL 15 | `supabase/migrations/` |
| **Edge Functions** | `format-lead-report`, `recommend-product` | Deno + TypeScript | `supabase/functions/` |
| **Web App** | Report rendering, user dashboard | React + Vite + TypeScript | `src/` |
| **Admin Panel** | Product catalog, API configs, prompt management | React | `src/pages/admin/` |

### 1.3 Data Flow Summary

1. **Webhook receives form submission** → N8N
2. **JS Code calculates readiness_score** (0-100) and **tier** (FREE/LOW/MED/HIGH)
3. **AI prompt generates V2 report** with narrative, phase analysis, barriers, action plan
4. **Supabase INSERT** saves `formatted_report` (JSON) to `career_evaluations`
5. **Postgres trigger** fires `recommend-product` edge function via `pg_net`
6. **recommend-product** queries `hub_services`, calls LLM, saves product recommendation
7. **Frontend** reads `formatted_report` + `recommended_product_name` and renders V2 report

---

## 2. N8N Pipeline

⚠️ **Note:** The N8N workflow configuration is not directly accessible in the codebase. The following documentation is reconstructed from:
- N8N JS Code v2.4 (provided in session summary)
- N8N AI Prompt template (provided in session summary)
- Input/output contracts inferred from Supabase schema and edge function code

### 2.1 Webhook Trigger

**Expected Payload Structure:**

```json
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "telefone": "+5511987654321",
  "area": "Tecnologia",
  "atuacao": "Desenvolvedor Backend",
  "trabalhaInternacional": "Sim",
  "experiencia": "5-10 anos",
  "englishLevel": "Avançado",
  "objetivo": "Relocação permanente para os EUA",
  "visaStatus": "Nenhum visto ainda",
  "timeline": "6-12 meses",
  "familyStatus": "Casado, sem filhos",
  "incomeRange": "R$15.000 - R$25.000",
  "investmentRange": "R$5.000 - R$10.000",
  "impediment": "Falta de inglês fluente",
  "impedimentOther": "",
  "mainConcern": "Não sei por onde começar"
}
```

**Field Name Conventions:**

⚠️ **CRITICAL:** There was a camelCase vs snake_case mismatch between N8N (camelCase) and Supabase (snake_case). This was **fixed** by normalizing field names in the N8N JS Code node before database insert.

| N8N Field (camelCase) | Supabase Column (snake_case) |
|-----------------------|------------------------------|
| `nome` | `name` |
| `telefone` | `phone` |
| `atuacao` | `atuacao` |
| `trabalhaInternacional` | `trabalha_internacional` |
| `experiencia` | `experiencia` |
| `englishLevel` | `english_level` |
| `visaStatus` | `visa_status` |
| `familyStatus` | `family_status` |
| `incomeRange` | `income_range` |
| `investmentRange` | `investment_range` |
| `impedimentOther` | `impediment_other` |
| `mainConcern` | `main_concern` |

### 2.2 JS Code Node (v2.4): Scoring Algorithm

**Purpose:** Calculate readiness_score (0-100) and assign tier (FREE/LOW_TICKET/MED_TICKET/HIGH_TICKET).

**Score Dimensions:**

| Dimension | Max Score | Criteria | Notes |
|-----------|-----------|----------|-------|
| **English** | 25 | Básico=5, Intermediário=12, Avançado=18, Fluente=25 | Single most important factor |
| **Experience** | 20 | <2yrs=5, 2-5yrs=10, 5-10yrs=15, 10+=20 | Professional experience level |
| **International Work** | 10 | No=0, Yes=10 | ⚠️ **MISMATCH:** N8N gives 15 max, scoring.ts expects 10 |
| **Timeline** | 10 | Urgente=10, 6-12m=8, 1-2yrs=5, Indefinido=2 | Urgency of goal |
| **Objective** | 10 | Clear=10, Medium=6, Vague=3 | Clarity of goal |
| **Visa** | 10 | Has=10, In-process=7, None=3 | Immigration status |
| **Readiness (Mental)** | 10 | High=10, Medium=6, Low=3 | Commitment level |
| **Area Bonus** | 5 | Tech/Engineering=5, Other=0 | Industry advantage |
| **TOTAL** | **100** | Sum of all dimensions | |

**Scoring Logic (Excerpt from N8N JS Code v2.4):**

```javascript
// English scoring (0-25)
function scoreEnglish(level) {
  const normalized = level?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
  if (normalized.includes('fluente') || normalized.includes('nativo')) return 25;
  if (normalized.includes('avancado')) return 18;
  if (normalized.includes('intermediario')) return 12;
  if (normalized.includes('basico') || normalized.includes('iniciante')) return 5;
  return 8; // default
}

// Experience scoring (0-20)
function scoreExperience(exp) {
  const normalized = exp?.toLowerCase() || '';
  if (normalized.includes('10+') || normalized.includes('mais de 10')) return 20;
  if (normalized.includes('5-10')) return 15;
  if (normalized.includes('2-5')) return 10;
  if (normalized.includes('menos de 2') || normalized.includes('1-2')) return 5;
  return 10; // default
}

// International work (0-10) ⚠️ N8N has 0-15, should be 0-10
function scoreInternational(works) {
  return works === true || works === 'Sim' ? 15 : 0; // ⚠️ BUG: should be 10
}

// Total readiness score
const readiness_score =
  score_english +
  score_experience +
  score_international_work +
  score_timeline +
  score_objective +
  score_visa +
  score_readiness +
  score_area_bonus;

const readiness_percentual = Math.round((readiness_score / 100) * 100);
```

### 2.3 Phase Classification

**Four Phases (ROTA Framework):**

| Phase ID | Phase Name | Score Range | ROTA Letter | Urgency | Can Apply? | Prep Time (months) |
|----------|-----------|-------------|-------------|---------|------------|-------------------|
| 1 | Exploração Inicial | 0-25 | R | baixa | No | 18-24 |
| 2 | Desenvolvimento | 26-50 | R/O | media | No | 12-18 |
| 3 | Preparação Ativa | 51-70 | O/T | alta | Maybe | 6-12 |
| 4 | Pronto para Mercado | 71-85 | T/A | alta | Yes | 3-6 |
| 5 | Competitivo Internacional | 86-100 | A | urgente | Yes | 0-3 |

**ROTA Method Explanation:**

- **R (Reconhecimento):** Self-discovery, profile analysis, goal definition
- **O (Organização):** Document prep, professional English, networking
- **T (Transição):** Active job search, applications, international portfolio
- **A (Ação):** Interviews, offer negotiation, relocation

**Phase Assignment Logic (from N8N JS Code v2.4):**

```javascript
function getPhaseClassification(score) {
  if (score >= 86) return {
    phase_id: 5,
    phase_name: "Competitivo Internacional",
    phase_emoji: "🚀",
    phase_color: "#10b981",
    rota_letter: "A",
    urgency_level: "urgente",
    can_apply_jobs: true,
    estimated_preparation_months: 1
  };
  if (score >= 71) return {
    phase_id: 4,
    phase_name: "Pronto para Mercado",
    phase_emoji: "✅",
    phase_color: "#22c55e",
    rota_letter: "T",
    urgency_level: "alta",
    can_apply_jobs: true,
    estimated_preparation_months: 4
  };
  if (score >= 51) return {
    phase_id: 3,
    phase_name: "Preparação Ativa",
    phase_emoji: "📈",
    phase_color: "#3b82f6",
    rota_letter: "O",
    urgency_level: "alta",
    can_apply_jobs: false,
    estimated_preparation_months: 9
  };
  if (score >= 26) return {
    phase_id: 2,
    phase_name: "Desenvolvimento",
    phase_emoji: "🌱",
    phase_color: "#f59e0b",
    rota_letter: "R",
    urgency_level: "media",
    can_apply_jobs: false,
    estimated_preparation_months: 15
  };
  return {
    phase_id: 1,
    phase_name: "Exploração Inicial",
    phase_emoji: "🔍",
    phase_color: "#ef4444",
    rota_letter: "R",
    urgency_level: "baixa",
    can_apply_jobs: false,
    estimated_preparation_months: 21
  };
}
```

### 2.4 Tier Classification (FREE/LOW/MED/HIGH)

**Tier Logic (Score-Driven + Financial Filters):**

```javascript
function getProductTier(score, income, investment) {
  const hasHighIncome = income?.includes('25.000') || income?.includes('50.000+');
  const hasInvestmentCapacity = investment && !investment.includes('0 -');

  // HIGH_TICKET: 70+ score + high income + investment capacity
  if (score >= 70 && hasHighIncome && hasInvestmentCapacity) {
    return 'HIGH_TICKET';
  }

  // MED_TICKET: 50+ score + some income + some investment
  if (score >= 50 && hasInvestmentCapacity) {
    return 'MED_TICKET';
  }

  // LOW_TICKET: 35+ score
  if (score >= 35) {
    return 'LOW_TICKET';
  }

  // FREE: fallback for scores < 35 or no investment capacity
  return 'FREE';
}
```

**Tier Definitions:**

| Tier | Typical Score Range | Income Range | Investment Range | Target Products |
|------|---------------------|--------------|------------------|----------------|
| **FREE** | 0-34 | Any | R$0 - R$500 | Hub Gratuito, free resources |
| **LOW_TICKET** | 35-49 | R$5k - R$15k | R$500 - R$2k | Workshops, ebooks, mini-courses |
| **MED_TICKET** | 50-69 | R$15k - R$25k | R$2k - R$5k | Group coaching, ROTA sessions |
| **HIGH_TICKET** | 70+ | R$25k+ | R$5k+ | 1:1 mentorship, premium programs |

### 2.5 Barrier Identification

**Barrier Flags (Boolean):**

```javascript
const barriers = {
  has_english_barrier: score_english < 18, // Less than "Avançado"
  has_experience_barrier: score_experience < 10, // Less than 2-5 years
  has_financial_barrier: !investment || investment.includes('R$0 -'),
  has_family_barrier: family_status?.includes('resistência') || family_status?.includes('divórcio'),
  has_visa_barrier: score_visa < 7, // No visa or unclear strategy
  has_time_barrier: timeline?.includes('indefinido') || timeline?.includes('não sei'),
  has_clarity_barrier: score_objective < 6, // Vague objective
};

const critical_blockers = Object.entries(barriers)
  .filter(([key, val]) => val === true)
  .map(([key]) => key.replace('has_', '').replace('_barrier', ''));
```

### 2.6 AI Prompt Node

⚠️ **Inferred** - The exact N8N node configuration is not accessible, but the AI prompt template was provided in the session summary.

**System Message (Sent to OpenAI GPT-4.1-mini):**

```
Você é um especialista em carreiras internacionais da equipe EUA na Prática.

IMPORTANTE:
- Gere um relatório V2.0 COMPLETO e estruturado
- Use os dados de scoring já calculados (NÃO recalcule scores)
- Crie narrativas personalizadas para ESTE lead específico
- Seja honesto sobre gaps sem desmotivar
- Foco em ações concretas e próximos passos

TOM:
- Acolhedor mas profissional
- Direto sobre barreiras mas encorajador
- Orientado a ação e resultados mensuráveis
- Use emojis estrategicamente (não exagere)

ESTRUTURA OBRIGATÓRIA:
- report_metadata (com report_version: "2.0")
- user_data (passthrough dos dados do formulário)
- scoring (usar valores já calculados pelo JS Code)
- phase_classification (usar valores já calculados)
- barriers_analysis (detalhar cada barreira identificada)
- detailed_analysis (8 dimensões: english, experience, objective, timeline, visa_immigration, financial_context, mental_readiness, family_context)
- product_recommendation (REMOVIDO no N8N v2.4 - agora feito pela recommend-product edge function)
- lead_qualification (temperatura, prioridade, perfil comercial)
- timeline_milestones (próximos marcos e follow-ups)
- action_plan (30d, 90d, 6m)
- web_report_data (hero, ROTA progress, key metrics, resources)
```

**Fields Marked [ESCREVER] (AI must generate):**

- `phase_classification.short_diagnosis` (1-2 sentences)
- `phase_classification.full_diagnosis` (2-3 paragraphs)
- `barriers_analysis.critical_blockers[]` (list of critical barriers)
- `barriers_analysis.recommended_first_action` (next action)
- `detailed_analysis.*.assessment` (personalized assessment for each dimension)
- `detailed_analysis.*.recommendation` (specific recommendation)
- `lead_qualification.best_contact_time` (inferred from profile)
- `action_plan.next_30_days[]` (3-5 immediate actions)
- `action_plan.next_90_days[]` (3-5 foundation actions)
- `action_plan.next_6_months[]` (3-5 strategic actions)
- `web_report_data.hero_section.headline` (inspiring headline)
- `web_report_data.key_metrics.strengths[]` (3-5 strengths)
- `web_report_data.key_metrics.critical_gaps[]` (2-4 gaps)
- `web_report_data.resources[]` (4-6 curated resources)

**Passthrough Fields (Already Calculated by JS Code):**

- `scoring.*` (all score values and breakdown)
- `phase_classification.phase_id`, `phase_name`, `rota_letter`, `urgency_level`, `can_apply_jobs`, `estimated_preparation_months`
- `barriers_analysis.has_*_barrier` (boolean flags)
- `lead_qualification.lead_temperature`, `lead_priority_score`, `is_tech_professional`, `is_senior_level`, etc.

**Output Schema:**

The AI returns a strict JSON schema (see `format-lead-report/index.ts` lines 277-709 for the full OpenAI Responses API schema definition).

### 2.7 Supabase Insert Node

⚠️ **Inferred** - The N8N node inserts the following fields into `career_evaluations`:

**Columns Populated at This Stage:**

- `user_id` (looked up or created from email)
- `name`, `email`, `phone` (from form)
- `area`, `atuacao`, `trabalha_internacional`, `experiencia`, `english_level`, `objetivo`, `visa_status`, `timeline`, `family_status`, `income_range`, `investment_range`, `impediment`, `impediment_other`, `main_concern` (from form)
- `report_content` (raw form data or N8N-generated text - **DEPRECATED**, V2 reports don't use this)
- `formatted_report` (JSON string from AI prompt response)
- `formatted_at` (current timestamp)
- `processing_status` = `'completed'`

**Columns Populated Later (by recommend-product edge function):**

- `recommended_product_name`
- `recommendation_description`
- `recommendation_landing_page_url`
- `raw_llm_response` (from LLM recommendation)
- `recommendation_status` (`'pending'` → `'completed'`)

---

## 3. Supabase Schema

### 3.1 `career_evaluations` Table

**Purpose:** Stores lead data, raw reports, formatted V2 reports, and product recommendations.

**Schema:**

```sql
CREATE TABLE public.career_evaluations (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Lead data (from form submission)
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  area TEXT,
  atuacao TEXT,
  trabalha_internacional BOOLEAN DEFAULT false,
  experiencia TEXT,
  english_level TEXT,
  objetivo TEXT,
  visa_status TEXT,
  timeline TEXT,
  family_status TEXT,
  income_range TEXT,
  investment_range TEXT,
  impediment TEXT,
  impediment_other TEXT,
  main_concern TEXT,

  -- Report content
  report_content TEXT NOT NULL, -- DEPRECATED (V1 only)
  formatted_report TEXT,         -- V2 JSON report (from N8N AI prompt)
  formatted_at TIMESTAMPTZ,
  processing_status TEXT DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
  processing_error TEXT,
  processing_started_at TIMESTAMPTZ,

  -- Product recommendation (from recommend-product edge function)
  recommended_product_name TEXT,
  recommendation_description TEXT,
  recommendation_landing_page_url TEXT,
  raw_llm_response JSONB,
  recommendation_status TEXT DEFAULT 'pending'
    CHECK (recommendation_status IN ('pending', 'processing', 'completed', 'error', 'skipped')),

  -- Access tracking
  access_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  first_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,

  -- UTM tracking (recently added)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- Metadata
  imported_by UUID REFERENCES public.profiles(id),
  import_batch_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_career_evaluations_access_token ON career_evaluations(access_token);
CREATE INDEX idx_career_evaluations_email ON career_evaluations(email);
CREATE INDEX idx_career_evaluations_user_id ON career_evaluations(user_id);
```

**Column Details:**

| Column | Type | Populated By | Notes |
|--------|------|--------------|-------|
| `formatted_report` | TEXT (JSON) | N8N AI Prompt | V2 report structure (see `V2FormattedReportData` type) |
| `processing_status` | TEXT | N8N / Edge Function | `'pending'` → `'processing'` → `'completed'` or `'error'` |
| `recommended_product_name` | TEXT | `recommend-product` edge function | Service name from `hub_services` |
| `recommendation_description` | TEXT | `recommend-product` edge function | LLM-generated personalized description (1-2 paragraphs) |
| `recommendation_landing_page_url` | TEXT | `recommend-product` edge function | URL from `hub_services.landing_page_url` or `ticto_checkout_url` |
| `raw_llm_response` | JSONB | `recommend-product` edge function | Full LLM response for debugging |
| `recommendation_status` | TEXT | `recommend-product` edge function | Pipeline status for product recommendation |
| `access_token` | UUID | Supabase | Public URL token (`/report/{access_token}`) |
| `utm_*` | TEXT | Recently added | **⚠️ Not yet populated by N8N** |

### 3.2 `hub_services` Table

**Purpose:** Product/service catalog for recommendations and Hub display.

**Schema:**

```sql
CREATE TABLE public.hub_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'premium', 'coming_soon')),
  route TEXT,
  category TEXT,
  service_type TEXT, -- 'free', 'paid', 'consultation', etc.
  is_visible_in_hub BOOLEAN DEFAULT true,
  is_highlighted BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  -- Pricing
  price NUMERIC,
  price_display TEXT, -- "R$ 797" or "Grátis"
  currency TEXT DEFAULT 'BRL',
  product_type TEXT DEFAULT 'subscription'
    CHECK (product_type IN ('subscription', 'one_time')),
  stripe_price_id TEXT,

  -- Checkout/Landing
  landing_page_url TEXT, -- SEO landing page
  ticto_checkout_url TEXT, -- Direct checkout URL
  cta_text TEXT, -- "Agendar Sessão" or "Acessar Hub"

  -- Upsell (for contextual recommendations in community)
  is_upsell_eligible BOOLEAN DEFAULT false,
  upsell_keywords TEXT[], -- Trigger words for AI matching
  upsell_microcopy TEXT, -- Short motivational text

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Key Fields for Recommendation Logic:**

| Field | Type | Used By | Purpose |
|-------|------|---------|---------|
| `status` | TEXT | `recommend-product` edge function | Filter: `.in("status", ["available", "premium"])` |
| `is_visible_in_hub` | BOOLEAN | `recommend-product` edge function | Filter: `.eq("is_visible_in_hub", true)` |
| `service_type` | TEXT | LLM prompt | Helps LLM differentiate free vs paid services |
| `price_display` | TEXT | Frontend CTA | Displayed in V2CTAFinal component |
| `landing_page_url` | TEXT | Frontend CTA | Primary link for product details |
| `ticto_checkout_url` | TEXT | Frontend CTA | Fallback if no landing_page_url |
| `cta_text` | TEXT | Frontend CTA | Button text ("Conhecer o Serviço") |

**Example Rows:**

```sql
-- FREE tier product
INSERT INTO hub_services (name, status, service_type, price_display, landing_page_url, cta_text, is_visible_in_hub)
VALUES ('Hub Gratuito EUA na Prática', 'available', 'free', 'Grátis', '/hub', 'Acessar Hub', true);

-- MED_TICKET product
INSERT INTO hub_services (name, status, service_type, price, price_display, landing_page_url, ticto_checkout_url, cta_text, is_visible_in_hub)
VALUES ('Sessão de Direção ROTA EUA – 45 minutos', 'premium', 'paid', 797.00, 'R$ 797', 'https://hub.euanapratica.com/servicos/rota45min', 'https://pay.ticto.app/...', 'Agendar Sessão', true);
```

### 3.3 `api_configs` Table

**Purpose:** Centralized API configuration management with encrypted credentials.

**Schema:**

```sql
CREATE TABLE public.api_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- "OpenAI API", "Anthropic API"
  api_key TEXT NOT NULL UNIQUE, -- "openai_api", "anthropic_api"
  base_url TEXT, -- "https://api.openai.com/v1"
  credentials JSONB, -- Encrypted: { "api_key": "encrypted_value" }
  parameters JSONB, -- { "model": "gpt-4.1-mini", "max_tokens": 4000 }
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
```

**Configured APIs:**

| api_key | name | base_url | parameters |
|---------|------|----------|-----------|
| `openai_api` | OpenAI API | `https://api.openai.com/v1` | `{"model": "gpt-4.1-mini", "max_tokens": 4000}` |
| `anthropic_api` | Anthropic API | `https://api.anthropic.com/v1` | `{"model": "claude-haiku-4-5-20251001", "max_tokens": 150}` (⚠️ Shared with upsell, too low for recommendations) |
| `resend_email` | Resend Email | `https://api.resend.com` | `{"from": "EUA na Prática <contato@euanapratica.com>"}` |
| `ticto_webhook` | Ticto Webhook | NULL | `{}` |

**Credentials Access:**

- **Edge functions:** Call `getApiConfig(api_key)` from `_shared/apiConfigService.ts` (uses service_role to decrypt)
- **Admin UI:** Can update via `/admin/configuracoes` → "APIs Externas" tab (encrypts before save)

### 3.4 `app_configs` Table

**Purpose:** Feature flags, prompts, and system-wide configuration.

**Schema:**

```sql
CREATE TABLE public.app_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Key Configurations:**

| key | value | Editable Via | Used By |
|-----|-------|--------------|---------|
| `llm_product_recommendation_prompt` | (Long prompt template) | Admin UI → Prompts IA | `recommend-product` edge function |
| `llm_product_recommendation_api` | `'anthropic_api'` or `'openai_api'` | Admin UI or SQL | `recommend-product` edge function |
| `lead_report_formatter_prompt` | (System prompt for V2 generation) | Admin UI → Prompts IA | `format-lead-report` edge function |
| `upsell_enabled` | `'true'` or `'false'` | Admin UI | Upsell system (community posts) |
| `supabase_edge_url` | `'https://xxx.supabase.co/functions/v1'` | SQL | Postgres trigger (pg_net calls) |
| `supabase_anon_key` | `'eyJhbGc...'` | SQL | Postgres trigger (pg_net calls) |

---

## 4. AI Prompt Layer

### 4.1 System Message (N8N AI Prompt)

**Tone Rules:**

✅ **CAN:**
- Be welcoming and professional
- Be honest about gaps without demotivating
- Use strategic emojis (not excessive)
- Personalize narrative to THIS lead's specific profile
- Focus on concrete actions and measurable results

❌ **CANNOT:**
- Be overly salesy or pushy
- Guarantee results or timelines
- Ignore critical barriers
- Use generic advice that applies to everyone
- Exaggerate lead's readiness
- Make promises the company can't deliver

### 4.2 ROTA Framework Definition

**Four Phases (Embedded in AI Prompt):**

```
R (Reconhecimento) – Self-discovery, profile analysis, goal definition
O (Organização) – Document prep, professional English, networking
T (Transição) – Active job search, applications, international portfolio
A (Ação) – Interviews, offer negotiation, relocation
```

**AI Instructions:**

"Use the ROTA framework to map where the lead is TODAY and what phase they should focus on. Don't skip phases or oversimplify. If they're in R, tell them they need O before T."

### 4.3 Prompt Template Variables

**[ESCREVER] Fields (AI Must Generate):**

Full list in **Section 2.6** above.

**Word/Sentence Count Guidelines:**

- `short_diagnosis`: 1-2 sentences (max 200 chars)
- `full_diagnosis`: 2-3 paragraphs (300-500 words)
- `detailed_analysis.*.assessment`: 2-3 sentences (100-150 words)
- `detailed_analysis.*.recommendation`: 1-2 sentences (specific action)
- `action_plan.*.description`: 2-3 sentences (what, why, how)
- `web_report_data.hero_section.headline`: 1 sentence (max 80 chars)
- `web_report_data.key_metrics.strengths[]`: 1 sentence each (max 60 chars)
- `web_report_data.resources[].title`: Max 50 chars

### 4.4 Product Recommendation Section (REMOVED in v2.4)

⚠️ **DEPRECATED:** The `product_recommendation` section was **removed from the N8N AI prompt** as of N8N JS Code v2.4 (Feb 2026).

**Reason:** Hardcoded product names, prices, and URLs in the AI prompt led to stale data. Products were not reflecting changes in the `hub_services` table.

**New Architecture (Post-Decoupling):**

1. **N8N AI Prompt** generates `lead_qualification.recommended_product_tier` (FREE/LOW/MED/HIGH)
2. **recommend-product edge function** queries `hub_services` dynamically based on tier
3. **LLM (Anthropic/OpenAI)** selects the best service and writes personalized description
4. **Frontend** displays the recommendation from `career_evaluations.recommended_product_name`

**Old Product Recommendation Copy Guidelines (DEPRECATED):**

These were used when the AI prompt still generated product recommendations:

- **FREE tier:** "Explore o Hub Gratuito para acessar recursos educacionais e conteúdos sobre imigração."
- **LOW_TICKET:** "Considere um workshop ou ebook para dar os primeiros passos estruturados."
- **MED_TICKET:** "Uma sessão de direcionamento pode acelerar sua preparação e corrigir erros comuns."
- **HIGH_TICKET:** "Mentoria 1:1 é recomendada para perfis seniores que querem maximizar ROI e acelerar relocação."

**What the AI Could/Couldn't Reveal:**

- ✅ CAN: Mention product name, general benefits, who it's for
- ❌ CANNOT: Reveal exact price without user seeing it first (compliance with consumer protection)
- ❌ CANNOT: Make guarantees ("você VAI conseguir vaga em 3 meses")
- ✅ CAN: Set realistic expectations ("este serviço ACELERA o processo, mas depende do seu esforço")

### 4.5 Known Edge Cases / Failure Modes

1. **Silent Fallback to FREE Tier:**
   - **Symptom:** Lead with score 54/100 gets "Hub Gratuito" instead of paid product
   - **Root Cause:** `hub_services` query was `.eq("status", "available")`, excluding `"premium"` services
   - **Fix Applied:** Changed to `.in("status", ["available", "premium"])` in both edge functions

2. **Wrong Score Denominator:**
   - **Symptom:** V2ScoreBreakdown shows "15/15" for international_work dimension
   - **Root Cause:** N8N gives 15 points max, frontend scoring.ts expects 10 points max
   - **Status:** ⚠️ **KNOWN BUG - NOT YET FIXED**
   - **Recommended Fix:** Change N8N JS Code to give max 10 points (not 15) for international work

3. **Color/Label Mismatch:**
   - **Symptom:** Score percentage says 60% but badge shows "Bloqueador" (should show "Atenção")
   - **Root Cause:** Frontend was checking `is_barrier` flag before percentage
   - **Fix Applied:** Created `scoring.ts` as single source of truth with percentage-first logic

4. **UTM Data Not Captured:**
   - **Symptom:** `utm_source`, `utm_medium`, etc. columns exist but are always NULL
   - **Root Cause:** N8N webhook doesn't parse UTM params from form submission URL
   - **Status:** ⚠️ **KNOWN ISSUE - NOT YET FIXED**
   - **Recommended Fix:** Add UTM extraction logic to N8N webhook node

5. **Product Recommendation Hardcoded in N8N:**
   - **Symptom:** Product prices/URLs don't update when changed in `hub_services` table
   - **Root Cause:** N8N AI prompt had hardcoded product catalog
   - **Fix Applied:** Removed `product_recommendation` from AI prompt, moved logic to `recommend-product` edge function

---

## 5. Report Rendering

### 5.1 Data Flow (Frontend)

```
User visits /report/{access_token}
         │
         ▼
PublicReport.tsx (entry point)
         │
         ├─── Fetches career_evaluation by access_token
         │
         ├─── Parses formatted_report JSON
         │
         ├─── Type guard: isV2Report(data) → true
         │
         ▼
V2ReportContainer.tsx
         │
         ├─── V2HeaderScore (shows readiness_score + phase badge)
         │
         ├─── V2ScoreBreakdown (8 dimension bars with colors)
         │
         ├─── V2DetailedAnalysis (personalized assessments)
         │
         ├─── V2ActionPlan (30d, 90d, 6m steps)
         │
         └─── V2CTAFinal (product recommendation card)
```

### 5.2 Score → Color → Label Mapping (Single Source of Truth)

**File:** [`src/components/report/v2/scoring.ts`](src/components/report/v2/scoring.ts)

**Max Scores:**

```typescript
export const SCORE_MAX: Record<keyof V2ScoreBreakdown, number> = {
  score_english: 25,
  score_experience: 20,
  score_international_work: 10, // ⚠️ N8N gives 15 (mismatch)
  score_timeline: 10,
  score_objective: 10,
  score_visa: 10,
  score_readiness: 10,
  score_area_bonus: 5,
};
```

**Color Logic (Percentage-Driven):**

```typescript
export function getBarColor(pct: number): string {
  if (pct >= 70) return 'bg-green-500';  // Good
  if (pct >= 40) return 'bg-blue-500';   // Attention
  return 'bg-amber-400';                 // Blocker
}
```

**Label Logic (Percentage FIRST, then barrier flag):**

```typescript
export function getScoreLabel(
  pct: number,
  dim?: { is_barrier: boolean; priority?: string },
): ScoreLabel | null {
  // HIGH SCORE ALWAYS WINS (ignore barrier flag)
  if (pct >= 70) return LABEL_BOM; // "Bom" (green)

  // BARRIER + CRITICAL/HIGH PRIORITY → "Bloqueador" (red)
  if (dim?.is_barrier) {
    const priority = normalizePriority(dim.priority || '');
    if (priority === 'critica' || priority === 'alta') return LABEL_BLOQUEADOR;
    return LABEL_ATENCAO; // "Atenção" (amber)
  }

  // LOW SCORE WITHOUT BARRIER → "Atenção" (amber)
  if (pct < 40) return LABEL_ATENCAO;

  return null; // No badge
}

// Accent normalization: "CRÍTICA" → "critica", "MÉDIA" → "media"
function normalizePriority(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
```

**Why This Matters:**

Before `scoring.ts` was created, there were **THREE** different implementations of score→color→label logic:
1. V2ScoreBreakdown component (had its own denominator assumptions)
2. V2DetailedAnalysis component (hardcoded color/label logic)
3. V2HeaderScore component (used different thresholds)

This led to **inconsistent visuals** (a 60% score showing as "Bloqueador" in one component and "Atenção" in another). Now **all components import from scoring.ts**.

### 5.3 Inconsistencies Between `formatted_report` and `report_content`

**Two Report Formats:**

| Field | Format | Used By | Status |
|-------|--------|---------|--------|
| `report_content` | Plain text | V1 reports (legacy) | DEPRECATED |
| `formatted_report` | JSON (V2FormattedReportData) | V2 reports (current) | ACTIVE |

**How the App Decides Which to Use:**

```typescript
// PublicReport.tsx
const isV2 = (obj: Record<string, any>): boolean => {
  // Primary check: report_metadata.report_version === "2.0"
  if (obj.report_metadata?.report_version?.startsWith('2.')) return true;

  // Fallback: structural signature (scoring + phase + barriers)
  return obj.scoring?.score_breakdown != null &&
         obj.phase_classification != null &&
         obj.barriers_analysis != null;
};

if (isV2(parsedReport)) {
  return <V2ReportContainer data={parsedReport} />;
} else {
  return <FormattedReport content={evaluation.report_content} />;
}
```

**Known Issue:**

Some early V2 reports were generated **before** the `report_metadata` field was added to the schema. These reports are correctly detected by the fallback structural check.

### 5.4 Detailed Analysis Section

**Component:** [`V2DetailedAnalysis.tsx`](src/components/report/v2/V2DetailedAnalysis.tsx)

**Dimensions Rendered:**

1. English (Inglês)
2. Visa/Immigration (Visto)
3. Mental Readiness (Prontidão Mental)
4. Experience (Experiência)
5. Objective (Objetivo)
6. Timeline

**Display Logic:**

- **Barriers first:** Dimensions with `is_barrier: true` + priority "CRÍTICA" or "ALTA" appear at the top
- **Score badge:** Shows score with denominator (e.g., "18/25") and color/label from `getScoreLabel()`
- **Assessment:** AI-generated personalized text (2-3 sentences)
- **Recommendation:** AI-generated next action (1-2 sentences)

**Sub-Score Denominators (Source of Truth):**

All denominators come from `SCORE_MAX` in `scoring.ts`:

```typescript
const config = BREAKDOWN_DIMENSIONS.find(d => d.analysisKey === 'english');
const maxScore = config.maxScore; // 25

<span className="text-2xl font-bold">{score_english}/{maxScore}</span>
```

---

## 6. Product Recommendation Logic

### 6.1 Current Flow (Post-Decoupling)

```
N8N AI Prompt
     ↓
Generates lead_qualification.recommended_product_tier
     ↓
Saves formatted_report to Supabase
     ↓
Postgres Trigger (trigger_recommend_product_on_report)
     ↓
Checks for tier in:
  1. formatted_report.product_recommendation.primary_offer.recommended_product_tier
  2. formatted_report.lead_qualification.recommended_product_tier (fallback)
     ↓
Calls recommend-product edge function via pg_net
     ↓
Edge Function:
  - Queries hub_services (.in("status", ["available", "premium"]))
  - Reads admin prompt from app_configs (llm_product_recommendation_prompt)
  - Interpolates {{lead_data}}, {{tier}}, {{services}}
  - Calls LLM (Anthropic or OpenAI, configurable)
  - Parses JSON response
  - Matches service name to get landing_page_url
  - Saves to career_evaluations:
      • recommended_product_name
      • recommendation_description
      • recommendation_landing_page_url
      • raw_llm_response
      • recommendation_status = 'completed'
```

### 6.2 Hub Services Query

**Edge Function:** [`recommend-product/index.ts`](supabase/functions/recommend-product/index.ts) (lines 178-184)

```typescript
const { data: services } = await supabase
  .from("hub_services")
  .select("id, name, description, category, service_type, price, price_display, landing_page_url, ticto_checkout_url, cta_text")
  .in("status", ["available", "premium"]) // ✅ FIXED: was .eq("status", "available")
  .eq("is_visible_in_hub", true);
```

**Why This Matters:**

Before the fix, the query excluded `status: "premium"` services, so the LLM could only recommend free products. This caused **score 54/100 leads** (MED_TICKET tier) to incorrectly receive "Hub Gratuito" (FREE).

**Recommended Services by Tier:**

The LLM uses the following rules (from the admin-configurable prompt in `app_configs`):

| Tier | LLM Instructions |
|------|------------------|
| **FREE** | "Recomende serviços gratuitos (service_type: 'free'). Foco: Hub Gratuito, recursos educacionais, webinars." |
| **LOW_TICKET** | "Recomende produtos de entrada (price_display: R$97 - R$497). Foco: workshops, ebooks, mini-cursos." |
| **MED_TICKET** | "Recomende produtos de engajamento (price_display: R$497 - R$1.997). Foco: sessões de direcionamento, group coaching." |
| **HIGH_TICKET** | "Recomende produtos premium (price_display: R$1.997+). Foco: mentoria 1:1, programas completos, ROTA intensivo." |

### 6.3 Admin Prompt (Configurable)

**Key:** `llm_product_recommendation_prompt`
**Editable At:** `/admin/configuracoes` → "Prompts IA" tab
**Used By:** `recommend-product` edge function

**Prompt Structure:**

```
Você é um especialista em recomendação de produtos educacionais.

Dados do lead: {{lead_data}}
Tier recomendado: {{tier}}
Serviços disponíveis: {{services}}

REGRAS DE SELEÇÃO POR TIER:
- FREE: Recomende serviços gratuitos (service_type: 'free'). [...]
- LOW_TICKET: Recomende produtos de entrada (R$97 - R$497). [...]
- MED_TICKET: Recomende produtos de engajamento (R$497 - R$1.997). [...]
- HIGH_TICKET: Recomende produtos premium (R$1.997+). [...]

IMPORTANTE:
- O readiness_score do lead indica competência real, não só intenção
- Score 70+ = pronto para aplicar (recomendar produtos de aceleração)
- Score 40-69 = fase de preparação (recomendar produtos de fundação)
- Score <40 = fase de exploração (recomendar educação e autoconhecimento)
- Considere income_range e investment_range para validar fit financeiro

Retorne um JSON com:
- recommended_service_name: nome exato do serviço conforme cadastrado
- recommendation_description: 1 a 2 parágrafos personalizados
- justification: motivo técnico da escolha

Retorne apenas o JSON, sem texto adicional.
```

**Variables:**

- `{{lead_data}}`: JSON with name, area, readiness_score, phase_name, rota_letter, income_range, investment_range, etc.
- `{{tier}}`: "FREE" | "LOW_TICKET" | "MED_TICKET" | "HIGH_TICKET"
- `{{services}}`: JSON array of hub_services (name, description, category, service_type, price_display)

### 6.4 LLM Provider Selection (Multi-Provider Support)

**Config Key:** `llm_product_recommendation_api`
**Possible Values:** `'anthropic_api'` | `'openai_api'`
**Default:** `'anthropic_api'` (since OpenAI quota was exhausted in Feb 2026)

**Provider-Specific Logic:**

```typescript
const providerKey = providerConfig?.value?.trim() || "anthropic_api";

if (providerKey === "anthropic_api") {
  // Anthropic Messages API
  aiResponse = await fetch(`${apiConfig.base_url}/messages`, {
    method: "POST",
    headers: {
      "x-api-key": apiConfig.credentials.api_key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: apiConfig.parameters?.model || "claude-haiku-4-5-20251001",
      max_tokens: Math.max(1024, parseInt(String(apiConfig.parameters?.max_tokens || 1024), 10)),
      messages: [{ role: "user", content: prompt }],
    }),
  });
} else {
  // OpenAI Responses API
  aiResponse = await fetch(`${apiConfig.base_url}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiConfig.credentials.api_key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: apiConfig.parameters?.model || "gpt-4.1-mini",
      input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
      text: { format: { type: "json_object" } },
    }),
  });
}
```

**Known Issue: Shared `max_tokens` Config:**

The `anthropic_api` config in `api_configs` has `max_tokens: 150` (configured for upsell, which needs short responses). Product recommendations need **at least 1024 tokens** for 1-2 paragraph descriptions.

**Workaround Applied:**

```typescript
max_tokens: Math.max(1024, parseInt(String(apiConfig.parameters?.max_tokens || 1024), 10))
```

This ensures recommendations always get at least 1024 tokens, even if the shared config has a lower value.

### 6.5 Response Parsing (Code Fence Stripping)

**Problem:** Anthropic sometimes wraps JSON responses in markdown code fences:

```
```json
{"recommended_service_name": "..."}
```
```

**Solution:**

```typescript
const cleanedText = outputText
  .replace(/^```(?:json)?\s*/i, "")
  .replace(/\s*```\s*$/, "")
  .trim();

let recommendation: Record<string, any>;
try {
  recommendation = JSON.parse(cleanedText);
} catch {
  // Error handling
}
```

### 6.6 Service Matching & URL Resolution

After parsing the LLM response, the edge function matches the `recommended_service_name` to a record in `hub_services` to get the `landing_page_url`:

```typescript
const recommendedName = recommendation.recommended_service_name || "";
const matchedService = services.find(
  (s) =>
    s.name.toLowerCase() === recommendedName.toLowerCase() ||
    s.name.toLowerCase().includes(recommendedName.toLowerCase()) ||
    recommendedName.toLowerCase().includes(s.name.toLowerCase())
);

const landingUrl =
  matchedService?.landing_page_url ||
  matchedService?.ticto_checkout_url ||
  null;

// Save to career_evaluations
await supabase
  .from("career_evaluations")
  .update({
    recommended_product_name: recommendation.recommended_service_name,
    recommendation_description: recommendation.recommendation_description,
    recommendation_landing_page_url: landingUrl,
    raw_llm_response: recommendation,
    recommendation_status: "completed",
  })
  .eq("id", evaluationId);
```

### 6.7 Frontend Display (V2CTAFinal)

**Component:** [`V2CTAFinal.tsx`](src/components/report/v2/V2CTAFinal.tsx)

**Data Source Priority:**

1. **Primary:** `llmRecommendation` prop (from `career_evaluations.recommended_product_name`)
2. **Fallback:** `recommendation?.primary_offer` (from `formatted_report.product_recommendation` - DEPRECATED)
3. **Default:** "Hub Gratuito" (if no recommendation exists)

**Example:**

```tsx
const productName = llmRecommendation?.recommended_service_name ||
                    recommendation?.primary_offer?.recommended_product_name ||
                    "Hub Gratuito EUA na Prática";

const description = llmRecommendation?.recommendation_description ||
                    recommendation?.primary_offer?.why_this_fits ||
                    "Acesse recursos gratuitos...";

const ctaUrl = llmRecommendation?.recommendation_landing_page_url ||
               recommendation?.primary_offer?.recommended_product_url ||
               "/hub";

const ctaText = llmRecommendation?.cta_text || "Conhecer o Serviço";
```

### 6.8 Known Bug: Score 54/100 Getting FREE Tier (FIXED)

**Symptom:** Lead `rogerioignacio85@gmail.com` (readiness_score: 54, tier: MED_TICKET) was receiving "Hub Gratuito" instead of a paid product.

**Root Causes Found:**

1. **hub_services query excluding paid products:** `.eq("status", "available")` instead of `.in("status", ["available", "premium"])`
   - **Fixed in:** `recommend-product/index.ts` (line 183) and `format-lead-report/index.ts` (lines 138, 861)

2. **Financially-gated tier logic:** Even with MED_TICKET tier, if `investment_range` was low, LLM would default to FREE
   - **Fix:** Updated admin prompt to prioritize tier over financial fit (tier is already calculated considering finances)

3. **readiness_score not in LLM context:** The LLM didn't have the lead's score, so it couldn't make informed decisions
   - **Fixed in:** `recommend-product/index.ts` (added `readiness_score`, `phase_name`, `rota_letter` to `leadData`)

**Verification:**

After fixes, `rogerioignacio85@gmail.com` now receives:
- **Service:** "Sessão de Direção ROTA EUA – 45 minutos"
- **Price:** R$ 797
- **URL:** `https://hub.euanapratica.com/servicos/rota45min`
- **Status:** `recommendation_status: 'completed'`

### 6.9 Intended Future Architecture (Not Yet Implemented)

**Goal:** Move tier classification and product recommendation **entirely** to the app side, removing it from N8N.

**Benefits:**
- **Single source of truth:** All product logic in one place (`recommend-product` edge function)
- **Dynamic pricing:** Product price changes in `hub_services` reflect immediately
- **A/B testing:** Test different tier thresholds or recommendation algorithms without touching N8N
- **Better observability:** All recommendation logic is in version-controlled code (not N8N GUI)

**Migration Path:**

1. ✅ **DONE:** Remove `product_recommendation` from N8N AI prompt
2. ✅ **DONE:** N8N only outputs `recommended_product_tier` in `lead_qualification`
3. ✅ **DONE:** `recommend-product` edge function queries `hub_services` and calls LLM
4. ⚠️ **PENDING:** Move tier classification logic from N8N JS Code to edge function
5. ⚠️ **PENDING:** N8N only does scoring + phase classification + barriers (no tier)
6. ⚠️ **PENDING:** Edge function calculates tier + selects product + generates description

---

## 7. Known Issues & Technical Debt

### 7.1 Consolidated Bug List (Fixed During Feb 2026 Audit)

| Bug | Symptom | Root Cause | Fix Applied | Status |
|-----|---------|-----------|-------------|--------|
| **Field Name Mismatch** | `trabalhaInternacional` not saving to DB | N8N used camelCase, Supabase expected snake_case | Added normalization in N8N JS Code | ✅ FIXED |
| **Score Always 15/100** | All leads showing 15/100 regardless of profile | Wrong score variable name in N8N AI prompt input | Fixed variable reference | ✅ FIXED |
| **UTM Data Not Captured** | `utm_source`, etc. always NULL | N8N webhook doesn't parse UTM params | N/A (columns added, N8N not updated) | ⚠️ OPEN |
| **Color/Label Inconsistency** | 60% score showing "Bloqueador" (should be "Atenção") | Three different implementations of score→color logic | Created `scoring.ts` as single source of truth | ✅ FIXED |
| **Wrong Product Recommendation** | Score 54 getting FREE tier instead of MED_TICKET | hub_services query excluding premium, missing readiness_score in context | Fixed query + enriched LLM context | ✅ FIXED |
| **Edge Functions Not Deployed** | Local code changes not reflecting in production | Edge functions only changed locally, never deployed | Deployed via `supabase functions deploy` | ✅ FIXED |
| **Anthropic max_tokens Error** | LLM API returning 400 invalid_request_error | Database stores numbers as strings, needed `parseInt()` | Added `parseInt(String(...), 10)` | ✅ FIXED |
| **JSON Wrapped in Code Fences** | LLM response parse error | Anthropic wraps JSON in \`\`\`json...\`\`\` | Added regex to strip code fences | ✅ FIXED |
| **Recommendation Truncated at 150 Tokens** | Description cut off mid-sentence | Shared `anthropic_api` config had `max_tokens: 150` | Added `Math.max(1024, ...)` to enforce minimum | ✅ FIXED |

### 7.2 Open Issues (Not Yet Resolved)

| Issue | Impact | Recommended Fix | Priority |
|-------|--------|----------------|----------|
| **score_international_work Mismatch** | V2ScoreBreakdown shows "15/15" instead of "10/10" | Change N8N JS Code to give max 10 (not 15) | **HIGH** (visual inconsistency) |
| **UTM Tracking Not Implemented** | No attribution data for marketing | Add UTM extraction to N8N webhook node | **MEDIUM** (blocks marketing analytics) |
| **DEFAULT_PROMPT Hardcoded** | Edge function has fallback prompt hardcoded | Remove DEFAULT_PROMPT or simplify to minimal fallback | **LOW** (admin can override via app_configs) |
| **Shared max_tokens Config** | `anthropic_api` has `max_tokens: 150` (for upsell), recommendations need 1024+ | Create separate `anthropic_api_recommendations` config OR use `parameters` override | **MEDIUM** (workaround exists) |
| **N8N Still Does Tier Classification** | Tier logic lives in N8N JS Code, not in app | Move tier classification to `recommend-product` edge function | **LOW** (future architecture) |
| **V2ProductRecommendation Component Unused** | Dead code in `V2ProductRecommendation.tsx` | Remove file or integrate into V2ReportContainer | **LOW** (technical debt) |

### 7.3 Recommended Next Steps (Priority Order)

1. **Fix score_international_work max (N8N JS Code):** Change from 15 to 10 to match `scoring.ts`
2. **Add UTM tracking to N8N webhook:** Extract `utm_source`, `utm_medium`, etc. from query params
3. **Create separate Anthropic config for recommendations:** Avoid `max_tokens` conflicts with upsell
4. **Move tier classification to edge function:** Remove tier logic from N8N, make it app-side
5. **Remove V2ProductRecommendation dead code:** Clean up unused component
6. **Add llm_product_recommendation_api to admin UI:** Currently only editable via SQL

---

## 8. Deployment & Operations

### 8.1 Deployment Checklist

**Edge Functions:**

```bash
# Deploy both edge functions after code changes
supabase functions deploy recommend-product --project-ref <ref>
supabase functions deploy format-lead-report --project-ref <ref>
```

**Database Migrations:**

```bash
# Apply pending migrations
supabase db push

# Verify migration history
supabase migration list

# Repair orphaned migrations (if needed)
supabase migration repair --status reverted <migration_timestamp>
```

**Frontend:**

```bash
# Build and deploy (auto-deploys via Vercel on push to main)
npm run build
git push origin main
```

**N8N Workflow:**

⚠️ N8N changes are deployed via the N8N GUI (not version-controlled). When updating:
1. Update JS Code node with new scoring logic
2. Update AI Prompt node with new system message
3. Test with sample lead data
4. Activate workflow

### 8.2 Monitoring & Debugging

**Edge Function Logs:**

```bash
# Tail logs for recommend-product
supabase functions logs recommend-product --project-ref <ref> --tail

# View last 100 lines
supabase functions logs recommend-product --project-ref <ref> --limit 100
```

**Database Queries (Debug):**

```sql
-- Check recommendation status for a lead
SELECT
  id,
  name,
  email,
  recommendation_status,
  recommended_product_name,
  recommendation_landing_page_url
FROM career_evaluations
WHERE email = 'test@example.com';

-- Find failed recommendations
SELECT
  id,
  name,
  email,
  recommendation_status,
  raw_llm_response
FROM career_evaluations
WHERE recommendation_status = 'error'
ORDER BY created_at DESC
LIMIT 10;

-- Check hub_services query results
SELECT
  id,
  name,
  status,
  service_type,
  price_display,
  is_visible_in_hub
FROM hub_services
WHERE status IN ('available', 'premium')
  AND is_visible_in_hub = true;
```

**Reset Recommendation for Re-Processing:**

```sql
-- Reset recommendation_status to trigger re-processing
UPDATE career_evaluations
SET
  recommendation_status = 'pending',
  recommended_product_name = NULL,
  recommendation_description = NULL,
  recommendation_landing_page_url = NULL,
  raw_llm_response = NULL
WHERE id = '<evaluation_id>';
```

### 8.3 Configuration Management

**Admin UI Locations:**

- **Product Catalog:** `/admin/produtos` → Manage `hub_services` table
- **API Configs:** `/admin/configuracoes` → "APIs Externas" tab → Manage `api_configs` (encrypted credentials)
- **Prompts:** `/admin/configuracoes` → "Prompts IA" tab → Edit `llm_product_recommendation_prompt`
- **Feature Flags:** Direct SQL (no UI yet) → `app_configs` table

**Environment Variables (Supabase Secrets):**

```bash
# Set via Supabase Dashboard → Project Settings → Edge Functions → Secrets
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
OPENAI_API_KEY=sk-... (DEPRECATED - now in api_configs)
ANTHROPIC_API_KEY=sk-ant-... (now in api_configs)
```

**Database Encryption Key:**

The `app.encryption_key` is set in Postgres config (not visible in app_configs table):

```sql
-- Set encryption key (32 bytes base64)
ALTER DATABASE postgres SET app.encryption_key = 'your-32-byte-base64-key';
```

### 8.4 Rollback Procedures

**Edge Function Rollback:**

```bash
# Revert to previous version (if deployment fails)
# 1. Identify last working commit
git log --oneline supabase/functions/recommend-product/

# 2. Checkout previous version
git checkout <commit_hash> supabase/functions/recommend-product/index.ts

# 3. Redeploy
supabase functions deploy recommend-product --project-ref <ref>
```

**Database Migration Rollback:**

⚠️ Supabase does not support automatic rollback. To revert:

1. Write a **down migration** SQL file that reverses the changes
2. Apply manually via `supabase db execute --file rollback.sql`
3. Update migration history: `supabase migration repair --status reverted <timestamp>`

**N8N Workflow Rollback:**

1. Go to N8N → Workflow → Executions tab
2. Find the last successful execution before the change
3. Copy the workflow JSON from that execution
4. Paste into current workflow
5. Save and activate

---

## 9. Appendix

### 9.1 Key File Locations

| File | Purpose |
|------|---------|
| [`supabase/functions/recommend-product/index.ts`](supabase/functions/recommend-product/index.ts) | Product recommendation edge function |
| [`supabase/functions/format-lead-report/index.ts`](supabase/functions/format-lead-report/index.ts) | V2 report formatting edge function |
| [`supabase/functions/_shared/apiConfigService.ts`](supabase/functions/_shared/apiConfigService.ts) | API config loader (decrypts credentials) |
| [`src/types/leads.ts`](src/types/leads.ts) | TypeScript types for V2 reports |
| [`src/components/report/v2/scoring.ts`](src/components/report/v2/scoring.ts) | Single source of truth for score→color→label |
| [`src/components/report/v2/V2ReportContainer.tsx`](src/components/report/v2/V2ReportContainer.tsx) | Main V2 report layout |
| [`src/components/report/v2/V2CTAFinal.tsx`](src/components/report/v2/V2CTAFinal.tsx) | Product recommendation CTA card |
| [`src/pages/report/PublicReport.tsx`](src/pages/report/PublicReport.tsx) | Public report page (entry point) |
| [`supabase/migrations/20260218000000_product_recommendation_system.sql`](supabase/migrations/20260218000000_product_recommendation_system.sql) | Recommendation system migration |
| [`supabase/migrations/20260219000000_upsert_recommendation_prompt.sql`](supabase/migrations/20260219000000_upsert_recommendation_prompt.sql) | Enhanced recommendation prompt |
| [`supabase/migrations/20260219000002_add_recommendation_api_provider_config.sql`](supabase/migrations/20260219000002_add_recommendation_api_provider_config.sql) | Multi-provider LLM config |

### 9.2 External Dependencies

| Service | Purpose | API Docs |
|---------|---------|----------|
| **Supabase** | Backend (Postgres + Edge Functions + Auth) | [supabase.com/docs](https://supabase.com/docs) |
| **OpenAI** | AI report generation (GPT-4.1-mini) | [platform.openai.com/docs](https://platform.openai.com/docs) |
| **Anthropic** | AI product recommendations (Claude Haiku 4.5) | [docs.anthropic.com](https://docs.anthropic.com) |
| **N8N** | Workflow automation (lead ingestion) | [docs.n8n.io](https://docs.n8n.io) |
| **Resend** | Transactional emails | [resend.com/docs](https://resend.com/docs) |
| **Ticto** | Payment processing | (Internal webhook) |

### 9.3 Glossary

| Term | Definition |
|------|------------|
| **V2 Report** | Second-generation lead report format (structured JSON) introduced in Feb 2026 |
| **ROTA Framework** | Four-phase career transition framework: Reconhecimento, Organização, Transição, Ação |
| **Tier** | Product recommendation tier (FREE, LOW_TICKET, MED_TICKET, HIGH_TICKET) |
| **Readiness Score** | 0-100 score indicating lead's preparedness for international career transition |
| **Phase Classification** | 1-5 rating mapping score ranges to ROTA phases |
| **Barrier** | Critical blocker preventing lead from progressing (e.g., English, experience, visa) |
| **Edge Function** | Serverless function running on Supabase (Deno runtime) |
| **Hub Services** | Product/service catalog table (`hub_services`) |
| **API Configs** | Centralized API configuration table with encrypted credentials |
| **App Configs** | System-wide settings and feature flags (`app_configs`) |
| **Product Recommendation Decoupling** | Migration from hardcoded N8N product data to dynamic hub_services queries |
| **recommend-product** | Edge function that queries hub_services and calls LLM to recommend products |
| **format-lead-report** | Edge function that generates V2 reports via OpenAI (legacy N8N path) |

---

**Document Version:** 2.0
**Last Updated:** February 19, 2026
**Next Review:** March 2026 (after tier migration to edge function)
