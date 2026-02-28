# Brainstorm: Market Intelligence Inspired by Teamblind.com

**Date**: 2026-02-28
**Context**: Teamblind.com is a community where employees anonymously share salary ranges, company culture, layoffs, satisfaction, and referrals. This brainstorm explores how to leverage similar market intelligence data to create monetization opportunities within ENP_HUB.

**Key Principle**: The free onboarding/lead capture form stays as-is. Market intelligence is used as a *gated upsell trigger*, not as a free feature.

---

## Gap Analysis: What ENP_HUB Lacks

The career evaluation collects `area`, `atuacao`, `experiencia`, `income_range`, and `objetivo` — but the report generation has **zero market benchmarking data**. The LLM generates recommendations in a vacuum, without knowing actual salary ranges, which companies sponsor visas, or hiring trends.

### Blind/Market Data vs. ENP_HUB Mapping

| Market Data                        | How It Enriches ENP_HUB                                               | Where It Fits                                          |
|------------------------------------|-----------------------------------------------------------------------|--------------------------------------------------------|
| Salary by role/level/location      | "People in your role earn $X-$Y in the US" — concrete financial context | `detailed_analysis.financial_context`                  |
| Visa sponsorship mentions          | Which companies actually sponsor H1B/Green Card for Brazilians        | `detailed_analysis.visa_immigration` + `prime_jobs`    |
| Company hiring/layoff signals      | Prioritize job recs toward companies actively hiring                  | `prime_jobs` filtering + lead nurture timing           |
| Company culture & WLB ratings      | Enrich job recs with "this company is known for X"                    | `web_report_data.resources` + job cards                |
| Role-level mapping (L3/L4/E5 etc.) | Map user's `experiencia` to actual market levels                      | `scoring.score_experience` calibration                 |

---

## Revenue Angle 1: Salary Reality Check — "Potencial Salarial"

### Concept
New locked section in the V2 career report showing real salary benchmarks by role/level/location. Uses existing `ReportSectionLock` infrastructure.

### User Experience
- **Free users see**: Teaser with headline multiplier ("Seu cargo paga 6-10x mais nos EUA") + blurred breakdown
- **Paid users see**: Full breakdown by city, company tier, seniority progression path, total comp (base + stock + bonus)

### Data Source
- `salary_benchmarks` table (new) or JSON in `app_configs`
- Curated from: Levels.fyi (structured, public), Glassdoor, Blind posts, LinkedIn Salary Insights
- Manual curation initially, automated scraping later

### Proposed Schema

```sql
CREATE TABLE public.salary_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL,                    -- maps to career_evaluations.area
  role_title TEXT NOT NULL,              -- e.g. "Software Engineer", "Product Manager"
  seniority_level TEXT NOT NULL,         -- e.g. "Junior", "Mid", "Senior", "Staff", "Principal"
  country TEXT NOT NULL DEFAULT 'US',
  city TEXT,                             -- e.g. "San Francisco", "New York", "Austin", NULL = national avg
  salary_min_usd INTEGER,
  salary_median_usd INTEGER,
  salary_max_usd INTEGER,
  total_comp_median_usd INTEGER,         -- base + stock + bonus
  source TEXT DEFAULT 'manual',          -- 'levels.fyi', 'glassdoor', 'blind', 'manual'
  sample_size INTEGER,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Implementation Steps
1. Create `salary_benchmarks` table
2. Seed with 30-50 role/level/location combos (focus on tech roles that match `area` values)
3. Inject benchmark data into `format-lead-report` LLM prompt as context
4. Create new report component `V2SalaryBenchmark.tsx` with `ReportSectionLock`
5. Gate behind `plans.features.salary_benchmarks` (Pro/VIP only)

### Revenue Impact
- **Subscription upsell**: Most compelling reason for free→Pro conversion (people can't resist salary comparisons)
- **Consultoria trigger**: "Your role pays $200K in the US. Let's plan how to get there." → booking

---

## Revenue Angle 2: Empresas que Contratam Brasileiros — Premium Directory

### Concept
Curated directory of companies that hire Brazilians internationally, sponsor visas, with culture & hiring status. Gated behind subscription feature flag.

### User Experience
- **Free users see**: "47 empresas correspondem ao seu perfil" (count only)
- **Paid users see**: Full list with company details, culture notes, visa sponsorship info, salary ranges, active positions

### Proposed Schema

```sql
CREATE TABLE public.company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  industry TEXT,
  size_category TEXT CHECK (size_category IN ('startup', 'mid', 'large', 'enterprise')),
  headquarters_country TEXT DEFAULT 'US',
  headquarters_city TEXT,
  -- Hiring intel
  hires_from_brazil BOOLEAN DEFAULT false,
  sponsors_h1b BOOLEAN DEFAULT false,
  sponsors_green_card BOOLEAN DEFAULT false,
  hiring_status TEXT CHECK (hiring_status IN ('actively_hiring', 'stable', 'freeze', 'layoffs')),
  -- Culture & ratings
  glassdoor_rating NUMERIC(2,1),
  blind_sentiment TEXT CHECK (blind_sentiment IN ('positive', 'neutral', 'negative')),
  work_life_balance TEXT CHECK (work_life_balance IN ('excellent', 'good', 'average', 'poor')),
  culture_notes TEXT,
  -- Salary intel
  avg_tc_senior_usd INTEGER,
  avg_tc_mid_usd INTEGER,
  -- Matching
  primary_areas TEXT[],           -- maps to career_evaluations.area values
  tech_stack TEXT[],              -- for tech role matching
  remote_friendly BOOLEAN DEFAULT false,
  -- Metadata
  source TEXT,
  logo_url TEXT,
  careers_url TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Integration with prime_jobs
- Link via `prime_jobs.company` → `company_profiles.name`
- Enrich job cards with culture badge, visa sponsorship flag
- Filter jobs by "visa-friendly" toggle

### Implementation Steps
1. Create `company_profiles` table
2. Seed with 30-50 companies known to hire Brazilians (FAANG, Nubank US, etc.)
3. Add `plans.features.company_directory` feature flag
4. Create `/empresas` page (or section in report) with company cards
5. Link from report `visa_immigration` section: "X empresas no seu perfil patrocinam visto"

### Revenue Impact
- **Subscription feature**: Recurring value that justifies monthly/annual payment
- **Data moat**: Curated, niche-specific data is hard to replicate

---

## Revenue Angle 3: Market Positioning — Consultoria Upsell via WhatsApp

### Concept
Automated WhatsApp flow triggered when a lead has high readiness score but a salary/positioning gap. Uses salary benchmark data as the hook to sell consultoria sessions.

### Trigger Criteria
- `readiness_score >= 65`
- `has_financial_barrier = true` OR `income_range` shows significant gap vs. market benchmark
- `lead_temperature IN ('QUENTE', 'SUPER_QUENTE')`

### WhatsApp Flow Script
```
[Delay 2h after report delivery]

Message 1: "Oi {{name}}! Vi que seu perfil tem potencial alto —
score {{readiness_score}}/100. Sabia que profissionais como você
({{area}}, {{experiencia}}) ganham em média ${{salary_median}}K/ano
nos EUA? Isso é {{multiplier}}x o que você ganha hoje."

[Wait Reply — keywords: "sério", "quanto", "como", "sim"]

Message 2: "Sim! E com seu nível de inglês {{english_level}} e
experiência, você está mais perto do que imagina.
Quer que eu monte uma estratégia personalizada de posicionamento
pra você? Tenho horários essa semana."

[Wait Reply — keywords: "quero", "sim", "horário", "agendar"]

Message 3: "Perfeito! Agenda aqui: {{booking_url}}
Nessa sessão vamos definir: empresas alvo, faixa salarial
realista, e seu plano de 90 dias."
```

### Implementation Steps
1. Depends on: Revenue Angle 1 (salary_benchmarks table)
2. Create WhatsApp flow `salary_positioning_upsell` in `whatsapp_flows`
3. Add trigger: `event: report.generated` with filter on score + financial gap
4. Enrich flow step variables with salary benchmark data (new field in flow engine)
5. Track conversion: flow session → booking created

### Revenue Impact
- **High-ticket conversion**: Consultoria is the highest-margin product
- **Personalized**: Data-driven message feels like 1-on-1 attention, not spam
- **Automated**: No manual outreach needed

---

## Revenue Angle 4: Interview & Negotiation Prep — Content/Course Upsell

### Concept
Once a lead has target salary ranges and target companies from the report, they need interview prep and salary negotiation coaching. Natural product to recommend in `V2ProductRecommendation`.

### Product Ideas
1. **"Prep Pack" (digital product)**: Company-specific interview guides, salary negotiation scripts, cultural fit checklists. R$297-497.
2. **"Mock Interview" (service)**: 1-on-1 session with someone who's been through the process. R$197-397/session.
3. **"Negotiation Masterclass" (course)**: How to negotiate international offers, understand equity, compare total comp. R$497-997.
4. **"Company Intel Report" (premium content)**: Detailed report on a specific company's interview process, culture, and comp ranges. R$97-197 each.

### Where It Fits in the Funnel
```
Free Report → "You can earn $180K"
  ↓
Subscription → See companies + full benchmarks
  ↓
Consultoria → Strategy session (positioning)
  ↓
Interview Prep → Prep for specific companies ← THIS
  ↓
Job Offer → Negotiation coaching ← THIS
  ↓
Referral (future) → Get introduced via community
```

### Implementation Steps
1. Create products/services in `hub_services` table
2. Update `recommend-product` edge function to suggest prep products based on:
   - `phase_id >= 3` (Tração/Aceleração)
   - `can_apply_jobs = true`
   - High `fit_score` with specific companies from directory
3. Add prep recommendations to report `action_plan.next_30_days`
4. WhatsApp flow for leads who booked consultoria → upsell prep pack

### Revenue Impact
- **Natural progression**: Follows the career journey (evaluate → prepare → apply → negotiate)
- **Recurring**: Each new target company = new prep needed
- **Stackable**: Can buy pack + session + course

---

## Data Sources (No Scraping Required Initially)

| Source | Data Type | Access Method | Quality |
|--------|-----------|---------------|---------|
| **Levels.fyi** | Salary by company/role/level | Public web, structured | High (verified) |
| **Glassdoor** | Reviews, salary estimates | Public web | Medium |
| **Teamblind.com** | Culture, layoffs, qualitative | Manual curation from posts | High (insider) |
| **LinkedIn Salary** | Salary by role/location | LinkedIn API (limited) | Medium |
| **H1B Salary DB** | H1B sponsor salary data | Public (DoL database) | High (official) |
| **Manual research** | Company profiles, visa info | Admin curation | Highest (niche-specific) |

### Future Automation
- Edge Function to periodically fetch/update salary data from Levels.fyi
- Admin interface to curate and validate company profiles
- Community contribution model (verified users submit salary/company data)

---

## Implementation Priority

| Priority | Revenue Angle | Effort | Impact | Dependencies |
|----------|--------------|--------|--------|--------------|
| 1 | Salary Reality Check | Medium | High | salary_benchmarks table, report component |
| 2 | Company Directory | Medium | Medium-High | company_profiles table, subscription feature |
| 3 | Market Positioning WhatsApp | Low | High | #1 + existing WhatsApp flow system |
| 4 | Interview & Negotiation Prep | High | Medium | New products/services, #1 + #2 |

### Quick Win (Zero Schema Changes)
Even before building any of this, enrich the `format-lead-report` system prompt with a static salary reference block. This makes reports immediately more concrete and naturally teases the full data.

---

## Future: Referral System (Not In Scope Yet)

```sql
CREATE TABLE public.referral_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES company_profiles(id),
  role_level TEXT,
  department TEXT,
  can_refer BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Matching leads with community members who can refer them to specific companies. Monetization: referral fee (percentage of first month salary) or subscription-gated feature.
