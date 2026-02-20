# ENP Hub - Report Generation System Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Report Structure Breakdown](#report-structure-breakdown)
4. [Technical Implementation](#technical-implementation)
5. [AI Integration](#ai-integration)

---

## Overview

The ENP Hub report generation system creates personalized career diagnostic reports for leads interested in international careers (primarily focused on the US market). The system uses AI to transform raw lead data into a structured, visually appealing report following the **ROTA EUA™ Method**.

### Two Report Types

1. **Public Career Evaluation Report** (`/report/:token`)
   - For leads imported via CSV
   - Accessed via secure token link
   - Focuses on career readiness diagnostic
   - Uses the ROTA EUA™ framework

2. **Currículo USA Analysis Report** (`/curriculo/report`)
   - For authenticated users analyzing their resume
   - Compares resume against job description
   - Provides ATS compatibility scoring
   - Offers tactical improvements

**This documentation focuses on the Public Career Evaluation Report.**

---

## System Architecture

### Data Flow

```
Lead CSV Import (Admin)
  ↓
create-lead-user function (creates user if not exists)
  ↓
career_evaluations table (stores raw lead data + report)
  ↓
Access Token Generated (UUID)
  ↓
Link sent to lead: /report/:token
  ↓
User opens link → ReportGatekeeper (email verification)
  ↓
verify-report-access function (validates email matches)
  ↓
format-lead-report function (AI formatting on-demand)
  ↓
FormattedReport component (renders structured UI)
```

### Database Schema

**Table: `career_evaluations`**

```sql
- id: UUID (primary key)
- user_id: UUID (references profiles)
- name: TEXT
- email: TEXT
- phone: TEXT
- area: TEXT (professional area)
- atuacao: TEXT (current role/activity)
- trabalha_internacional: BOOLEAN
- experiencia: TEXT (years of experience)
- english_level: TEXT
- objetivo: TEXT (career goal)
- visa_status: TEXT
- timeline: TEXT (desired timeline)
- family_status: TEXT
- income_range: TEXT
- investment_range: TEXT
- impediment: TEXT
- impediment_other: TEXT
- main_concern: TEXT
- report_content: TEXT (raw report from CSV)
- formatted_report: TEXT (AI-generated JSON)
- formatted_at: TIMESTAMPTZ
- access_token: UUID (unique, for public access)
- first_accessed_at: TIMESTAMPTZ
- access_count: INTEGER
- created_at, updated_at: TIMESTAMPTZ
```

### Edge Functions

#### 1. `create-lead-user`
- **Purpose**: Creates or retrieves user account for lead
- **Access**: Admin only
- **Input**: `{ email, full_name, phone }`
- **Output**: `{ user_id, existing: boolean }`
- **Logic**:
  - Checks if email exists in profiles
  - If not, creates auth user with random password
  - Email is auto-confirmed
  - Returns user_id for linking to career_evaluation

#### 2. `verify-report-access`
- **Purpose**: Validates access token and email
- **Access**: Public (no auth required)
- **Input**: `{ token, email?, action: 'check' | 'verify' }`
- **Actions**:
  - `check`: Validates token exists
  - `verify`: Validates email matches and returns evaluation data
- **Output**: `{ valid: boolean, evaluation?: CareerEvaluation }`

#### 3. `format-lead-report`
- **Purpose**: AI-powered report formatting
- **Access**: Public (called after verification)
- **Input**: `{ evaluationId, forceRefresh?: boolean }`
- **Model**: `gpt-4.1-mini` (OpenAI Responses API)
- **Caching**: Stores result in `formatted_report` field
- **Output**: Structured JSON matching `FormattedReportData` type

---

## Report Structure Breakdown

The report follows a specific structure designed to guide leads through their career assessment. Each section serves a strategic purpose.

### 1. Welcome (Greeting/Saudação)

**Component**: [GreetingCard.tsx](../src/components/report/GreetingCard.tsx)

**Purpose**: Personalized welcome that immediately establishes connection and context

**Structure**:
```typescript
{
  title: string;          // "Olá, [First Name]! 👋"
  subtitle: string;       // Welcome message from team
  phase_highlight: string; // "Fase de Organização"
  phase_description: string; // What this phase means
}
```

**Visual Design**:
- Gradient background (blue tones)
- Large, bold personalized title
- Phase highlight box with Sparkles icon
- Warm, professional tone

**AI Generation**:
The AI analyzes the lead's profile and determines their current phase in the ROTA method, then generates:
- A personalized greeting using their first name
- Context about what their current phase means
- Encouraging message about their journey

**Example Output**:
```
Title: "Olá, João! 👋"
Subtitle: "Bem-vindo ao seu diagnóstico personalizado de carreira internacional..."
Phase Highlight: "Fase de Organização (O)"
Phase Description: "Você está preparando sua base: documentos, inglês e networking..."
```

---

### 2. Diagnóstico de Prontidão

**Component**: [DiagnosticGrid.tsx](../src/components/report/DiagnosticGrid.tsx)

**Purpose**: Quick visual snapshot of the lead's readiness across 4 key dimensions

**Structure**:
```typescript
{
  english: {
    level: string;        // "Intermediário"
    description: string;  // Impact analysis
  },
  experience: {
    summary: string;      // "+10 anos PM"
    details: string;      // Professional profile analysis
  },
  objective: {
    goal: string;         // "Remoto em dólar"
    timeline: string;     // Desired timeline
  },
  financial: {
    income: string;       // Current income range
    investment: string;   // Investment capacity
  }
}
```

**Visual Design**:
- 2x2 grid layout (responsive: 1 column on mobile)
- Each card has:
  - Unique icon (Languages, Briefcase, Target, DollarSign)
  - Color-coded background (blue, indigo, purple, amber)
  - Bold value/summary
  - Descriptive text

**AI Analysis**:
The AI synthesizes:
- **English**: Maps `english_level` field → business impact assessment
- **Experience**: Analyzes `experiencia` + `area` + `atuacao` → market positioning
- **Objective**: Combines `objetivo` + `timeline` → goal clarity
- **Financial**: Evaluates `income_range` + `investment_range` → readiness score

**Strategic Purpose**:
- Helps lead understand their starting point
- Identifies strengths and gaps
- Sets context for action plan

---

### 3. Método ROTA EUA™

**Component**: [RotaMethodSection.tsx](../src/components/report/RotaMethodSection.tsx)

**Purpose**: Educates leads on the framework and positions them within it

**Structure**:
```typescript
{
  current_phase: 'R' | 'O' | 'T' | 'A';
  phase_analysis: string; // Deep analysis of current moment
}
```

**The ROTA Framework**:
- **R** (Reconhecimento): Self-awareness and profile analysis
- **O** (Organização): Document prep, English, networking
- **T** (Transição): Active job search and applications
- **A** (Ação): Interviews, negotiation, relocation

**Visual Design**:
- Dark gradient background (navy to black)
- Horizontal stepper with 4 phases
- Active phase is highlighted (blue, scaled up, glowing ring)
- Past phases show completed styling
- Future phases are dimmed
- Phase analysis box below with detailed explanation

**AI Logic**:
The AI determines current phase based on:
- `english_level`: Low = still in R/O
- `trabalha_internacional`: false = likely R/O
- `visa_status`: "Nenhum" = R/O, "Em processo" = T/A
- `timeline`: "Imediato" might push to T/A
- `impediment`: If major blockers = R/O

**Strategic Purpose**:
- Provides clear roadmap
- Reduces overwhelm by showing "you are here"
- Establishes credibility through structured methodology
- Creates sense of progress (gamification)

---

### 4. Plano de Ação

**Component**: [ActionPlanList.tsx](../src/components/report/ActionPlanList.tsx)

**Purpose**: Tactical, prioritized action steps for immediate implementation

**Structure**:
```typescript
actionPlan: Array<{
  step: number;        // 1, 2, 3
  title: string;       // Short action title
  description: string; // Detailed what/why
}>
```

**Visual Design**:
- Vertical list of cards
- Each card has:
  - Circular numbered badge (emerald green gradient)
  - Bold title
  - Detailed description
- Progressive disclosure (step 1 is most urgent)

**AI Generation Logic**:
The AI prioritizes based on:

**Step 1** - Critical Blocker or Foundation:
- If `impediment` exists → address it
- If `english_level` is "Básico" → focus on English
- If no resume/LinkedIn → create foundation

**Step 2** - Next Critical Element:
- If Step 1 was English → now documentation
- If Step 1 was documentation → now networking
- Addresses the next biggest gap

**Step 3** - Medium-term Goal:
- Usually involves skill development
- Networking or community engagement
- Preparation for next ROTA phase

**Example**:
```
1. "Estruture seu currículo no formato americano"
   → "Seu perfil tem potencial mas precisa adaptar..."

2. "Aprimore seu inglês técnico para entrevistas"
   → "Com inglês intermediário, foque em vocabulário..."

3. "Construa sua presença no LinkedIn"
   → "Com currículo pronto, otimize seu perfil..."
```

**Strategic Purpose**:
- Prevents analysis paralysis
- Creates momentum with clear next steps
- Builds trust by showing actionable path
- Sets up service recommendations naturally

---

### 5. Próximos Passos Estratégicos

**Component**: [RecommendationsCTA.tsx](../src/components/report/RecommendationsCTA.tsx)

**Purpose**: Monetization - Contextual service recommendations with clear CTAs

**Structure**:
```typescript
recommendations: Array<{
  service_id: string;
  type: 'PRIMARY' | 'SECONDARY' | 'UPGRADE';
  reason: string;
  // Enriched from hub_services:
  service_name: string;
  service_description: string;
  service_price_display: string;
  service_cta_text: string;
  service_checkout_url: string;
}>
```

**Visual Design**:

**PRIMARY (Hero CTA)**:
- Large card (2/3 width on desktop)
- Dark background with gradient orb
- Prominent "Recomendação Para Você" badge
- Service icon
- Personalized reason
- Large CTA button (white on dark)

**SECONDARY & UPGRADE** (Side cards):
- Smaller cards (1/3 width, stacked)
- UPGRADE has crown icon + gradient background
- Smaller CTAs
- Less prominent but still clear

**AI Recommendation Logic**:

The AI receives available services from `hub_services` table and selects up to 3:

1. **PRIMARY**: Most urgent/relevant
   - If in R/O phase + English weak → English course
   - If in O/T phase + needs resume → Resume service
   - If in T/A phase → Interview prep or mentorship

2. **SECONDARY**: Complementary
   - Usually a diagnostic or assessment
   - LinkedIn optimization
   - Community access

3. **UPGRADE**: Premium ongoing
   - Mentorship programs
   - VIP coaching
   - Long-term support

**Example Selection**:
```
Lead Profile:
- Phase: O (Organização)
- English: Intermediário
- Objective: Remote job
- Timeline: 6-12 meses

AI Recommends:
PRIMARY: "Currículo Especialista USA" ($297)
  Reason: "Você está pronto para estruturar..."

SECONDARY: "LinkedIn Makeover" ($147)
  Reason: "Com currículo pronto, maximize..."

UPGRADE: "Mentoria VIP 3 Meses" ($2,997)
  Reason: "Para acelerar com acompanhamento..."
```

**Analytics Tracking**:
- All CTAs log `cta_click` events
- Metadata includes: service_id, placement, url
- Allows conversion tracking and optimization

**Strategic Purpose**:
- Natural transition from free value to paid services
- Personalization increases conversion
- Three-tier approach caters to different budgets
- Reason text builds trust (not just selling)

---

### 6. Recursos Recomendados

**Component**: [ResourcesPills.tsx](../src/components/report/ResourcesPills.tsx)

**Purpose**: Low-friction value add - free resources to build trust and engagement

**Structure**:
```typescript
resources: Array<{
  type: 'youtube' | 'instagram' | 'guide' | 'articles' | 'ebook';
  label: string;
  url: string;
}>;
whatsapp_keyword: string;
```

**Visual Design**:
- Horizontal pill badges (flex-wrap)
- Each type has unique:
  - Icon (YouTube, Instagram, FileText, BookOpen)
  - Color scheme (red, pink, blue, purple, amber)
- Clickable (opens in new tab)

**WhatsApp Keyword Box**:
- Prominent card (emerald gradient)
- MessageCircle icon
- Large badge with keyword
- Encourages direct engagement

**AI Generation Logic**:

The AI selects resources based on:
- **Phase**: Early phase (R/O) → foundational content
- **Area**: Tech → tech-specific videos/guides
- **Objective**: Remote → remote work guides
- **English Level**: Low → English resources

**Example**:
```
Resources for PM in O phase with Intermediate English:
1. YouTube: "Como estruturar currículo de PM"
2. Guide: "Guia de Networking para Tech"
3. Articles: "Melhores práticas LinkedIn 2026"

WhatsApp Keyword: "PMUSA2026"
```

**Strategic Purpose**:
- Provides immediate value (builds reciprocity)
- Drives traffic to owned channels (YouTube, Instagram)
- WhatsApp keyword enables direct follow-up
- Resources educate and warm up for services
- Low commitment → high trust building

---

## Technical Implementation

### Frontend Components

**Route**: `/report/:token`

**Main Component**: [PublicReport.tsx](../src/pages/report/PublicReport.tsx)

**Flow**:
```
1. Extract token from URL params
2. Call verify-report-access (action: 'check')
   → If invalid, show error
3. Show ReportGatekeeper (email input)
4. User enters email
5. Call verify-report-access (action: 'verify', email)
   → Returns evaluation data
6. Check if formatted_report exists and is fresh
7. If stale or missing, call format-lead-report
8. Pass to FormattedReport component
```

**State Management**:
```typescript
const [isLoading, setIsLoading] = useState(true);
const [isVerifying, setIsVerifying] = useState(false);
const [isFormatting, setIsFormatting] = useState(false);
const [error, setError] = useState<string>('');
const [evaluation, setEvaluation] = useState<CareerEvaluation | null>(null);
const [formattedContent, setFormattedContent] = useState<string>('');
const [tokenValid, setTokenValid] = useState(false);
```

**Caching Strategy**:
```typescript
const formattedAt = new Date(evaluation.formatted_at).getTime();
const updatedAt = new Date(evaluation.updated_at).getTime();
const isStale = formattedAt > 0 && updatedAt > formattedAt;

if (evaluation.formatted_report && !isStale) {
  // Use cached version
  setFormattedContent(evaluation.formatted_report);
} else {
  // Request fresh formatting
  const { data } = await supabase.functions.invoke('format-lead-report', {
    body: { evaluationId, forceRefresh: isStale }
  });
}
```

### Component Hierarchy

```
FormattedReport
├── ReportHeader (ENP Hub logo + navigation)
├── GreetingCard (personalized welcome)
├── DiagnosticGrid (4 metrics)
├── RotaMethodSection (stepper + phase)
├── ActionPlanList (3 action steps)
├── RecommendationsCTA (service recommendations)
├── ResourcesPills (free resources + WhatsApp)
└── ReportFooter (timestamp + branding)
```

**Fallback Rendering**:
If AI formatting fails or `formattedContent` can't be parsed:
```typescript
if (!reportData) {
  return (
    <SimpleGreeting name={evaluation.name} />
    <RawContentCard content={evaluation.report_content} />
  );
}
```

---

## AI Integration

### Model & API

**Provider**: OpenAI
**API**: Responses API (structured outputs)
**Model**: `gpt-4.1-mini`
**Why this model?**: Cost-effective, fast, excellent for structured generation

### System Prompt

**Stored in**: `app_configs` table, key: `lead_report_formatter_prompt`

**Current Prompt** (from migration):
```
Você é um especialista em carreiras internacionais da equipe EUA na Pratica,
liderada por Daniel Kiel.

Analise os dados do lead e estruture um relatório de diagnóstico de carreira
personalizado usando o Método ROTA EUA.

O Método ROTA EUA tem 4 fases:
- R (Reconhecimento): Autoconhecimento e análise de perfil
- O (Organização): Preparação de documentos, inglês e networking
- T (Transição): Busca ativa de oportunidades e aplicações
- A (Ação): Entrevistas, negociação e relocação

Baseado no perfil do lead, determine em qual fase ele está e forneça
orientação específica.

Seja acolhedor, use emojis apropriados e mantenha um tom profissional
mas amigável.
```

**This prompt can be updated by admins** via the `app_configs` table without code deployment.

### User Context

**Input to AI** (from [format-lead-report/index.ts](../supabase/functions/format-lead-report/index.ts:104-128)):
```typescript
const userContext = `
DADOS DO LEAD:
- Nome: ${evaluation.name}
- Email: ${evaluation.email}
- Area: ${evaluation.area || 'Nao informado'}
- Atuacao: ${evaluation.atuacao || 'Nao informado'}
- Trabalha Internacionalmente: ${evaluation.trabalha_internacional ? 'Sim' : 'Nao'}
- Experiencia: ${evaluation.experiencia || 'Nao informado'}
- Nivel de Ingles: ${evaluation.english_level || 'Nao informado'}
- Objetivo: ${evaluation.objetivo || 'Nao informado'}
- Status do Visto: ${evaluation.visa_status || 'Nao informado'}
- Timeline: ${evaluation.timeline || 'Nao informado'}
- Status Familiar: ${evaluation.family_status || 'Nao informado'}
- Faixa de Renda: ${evaluation.income_range || 'Nao informado'}
- Faixa de Investimento: ${evaluation.investment_range || 'Nao informado'}
- Impedimento: ${evaluation.impediment || 'Nenhum'}
- Outro Impedimento: ${evaluation.impediment_other || 'Nenhum'}
- Principal Preocupacao: ${evaluation.main_concern || 'Nao informado'}

CONTEUDO DO RELATORIO ORIGINAL (use como base para enriquecer a analise):
${evaluation.report_content}

SERVICOS DISPONIVEIS PARA RECOMENDAR:
${hubServices.map(s => `- ID: ${s.id} | Nome: ${s.name} | ...`).join('\n')}

Estruture o relatorio com todas as secoes necessarias...
`;
```

### Response Schema (Strict Mode)

**JSON Schema** enforces structure:

```typescript
{
  name: "format_career_report",
  strict: true,
  schema: {
    type: "object",
    properties: {
      greeting: {
        title: string,
        subtitle: string,
        phase_highlight: string,
        phase_description: string
      },
      diagnostic: {
        english: { level, description },
        experience: { summary, details },
        objective: { goal, timeline },
        financial: { income, investment }
      },
      rota_method: {
        current_phase: "R" | "O" | "T" | "A",
        phase_analysis: string
      },
      action_plan: [
        { step: 1, title, description },
        { step: 2, title, description },
        { step: 3, title, description }
      ],
      resources: [
        { type: "youtube" | ..., label, url }
      ],
      whatsapp_keyword: string,
      recommendations: [
        { service_id, type: "PRIMARY"|"SECONDARY"|"UPGRADE", reason }
      ]
    },
    required: [all fields],
    additionalProperties: false
  }
}
```

**Strict mode benefits**:
- Guaranteed valid JSON
- No hallucinated fields
- Type safety from AI to TypeScript
- Easier error handling

### Service Enrichment

After AI generates recommendations, the function enriches them:

```typescript
formattedReport.recommendations = formattedReport.recommendations.map(rec => {
  const service = hubServices.find(s => s.id === rec.service_id);
  return {
    ...rec,
    service_name: service?.name,
    service_description: service?.description,
    service_price_display: service?.price_display,
    service_cta_text: service?.cta_text,
    service_checkout_url: service?.ticto_checkout_url
  };
}).filter(rec => rec.service_name); // Remove invalid IDs
```

This allows AI to reference services by ID while frontend gets full details.

### Caching & Performance

**First-time generation**:
1. AI call (~2-4 seconds)
2. Store in `formatted_report` field
3. Set `formatted_at` timestamp

**Subsequent accesses**:
1. Check if `formatted_report` exists
2. Check if stale (`updated_at` > `formatted_at`)
3. If fresh, return cached version (instant)
4. If stale, regenerate

**Force refresh**:
- When admin updates evaluation data
- When `forceRefresh: true` parameter passed
- Marks old cache as invalid

**Cost optimization**:
- gpt-4.1-mini is ~1/10th the cost of GPT-4
- Caching reduces API calls by ~90%
- Average report: ~1,500 tokens (~$0.001 per generation)

---

## Best Practices

### Prompt Engineering

**Current best practices**:
1. **Role definition**: "Você é um especialista em carreiras internacionais..."
2. **Context**: Provide all lead data upfront
3. **Framework**: Reference ROTA method explicitly
4. **Tone**: "acolhedor, profissional mas amigável"
5. **Structured output**: Use strict JSON schema
6. **Examples** (optional): Could add few-shot examples for consistency

**Potential improvements**:
```
- Add examples of excellent outputs
- Specify emoji guidelines (when/where to use)
- Add constraints (e.g., "Keep descriptions under 200 chars")
- Include failure cases to avoid
```

### Testing

**Manual testing**:
1. Create test lead with known profile
2. Generate report
3. Verify all sections render
4. Check recommendations relevance
5. Test caching behavior

**Edge cases to test**:
- Lead with no impediments
- Lead with all advanced attributes (fluent English, visa, etc.)
- Lead with minimal data
- Lead with conflicting data (e.g., "immediate timeline" but "no English")

### Monitoring

**Key metrics**:
- Report generation time
- Cache hit rate
- AI token usage
- Conversion rate by recommendation type
- Link open rate (first_accessed_at)
- Repeat access count

**Error tracking**:
- AI API failures
- Invalid JSON parsing
- Missing service IDs
- Email verification failures

---

## Future Enhancements

### Potential Features

1. **Dynamic sections based on phase**
   - R phase: More self-assessment tools
   - T phase: Job search tactics
   - A phase: Interview & negotiation prep

2. **Personalized video messages**
   - Generate Synthesia-style video intro
   - Daniel Kiel addressing lead by name

3. **Interactive elements**
   - Clickable assessment quiz
   - Phase transition checklist
   - Progress tracker

4. **A/B testing**
   - Test different CTA placements
   - Test different recommendation strategies
   - Test different visual designs

5. **Multi-language support**
   - Generate reports in English for international leads
   - Spanish for Latin American market

6. **PDF export**
   - Similar to Currículo USA PDF
   - Branded, printable version

### Technical Improvements

1. **Incremental generation**
   - Stream sections as they generate
   - Show partial report while AI completes

2. **Webhook for completion**
   - Notify lead when report is ready
   - Send email with link

3. **Version control**
   - Track prompt versions
   - A/B test prompt variations
   - Roll back if quality drops

4. **Admin preview**
   - Let admins see report before sending
   - Edit/override AI suggestions

---

## Appendix

### Type Definitions

```typescript
// From src/types/leads.ts

interface CareerEvaluation {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  area?: string;
  atuacao?: string;
  trabalha_internacional: boolean;
  experiencia?: string;
  english_level?: string;
  objetivo?: string;
  visa_status?: string;
  timeline?: string;
  family_status?: string;
  income_range?: string;
  investment_range?: string;
  impediment?: string;
  impediment_other?: string;
  main_concern?: string;
  report_content: string;
  formatted_report?: string;
  formatted_at?: string;
  access_token: string;
  first_accessed_at?: string;
  access_count: number;
  created_at: string;
  updated_at: string;
}

interface FormattedReportData {
  greeting: {
    title: string;
    subtitle: string;
    phase_highlight: string;
    phase_description: string;
  };
  diagnostic: {
    english: { level: string; description: string };
    experience: { summary: string; details: string };
    objective: { goal: string; timeline: string };
    financial: { income: string; investment: string };
  };
  rota_method: {
    current_phase: 'R' | 'O' | 'T' | 'A';
    phase_analysis: string;
  };
  action_plan: Array<{
    step: number;
    title: string;
    description: string;
  }>;
  resources: Array<{
    type: 'youtube' | 'instagram' | 'guide' | 'articles' | 'ebook';
    label: string;
    url: string;
  }>;
  whatsapp_keyword: string;
  recommendations: ServiceRecommendation[];
}

interface ServiceRecommendation {
  service_id: string;
  type: 'PRIMARY' | 'SECONDARY' | 'UPGRADE';
  reason: string;
  // Enriched fields:
  service_name?: string;
  service_description?: string;
  service_price_display?: string;
  service_cta_text?: string;
  service_checkout_url?: string;
}
```

### File References

**Backend**:
- [verify-report-access](../supabase/functions/verify-report-access/index.ts)
- [format-lead-report](../supabase/functions/format-lead-report/index.ts)
- [create-lead-user](../supabase/functions/create-lead-user/index.ts)

**Frontend Pages**:
- [PublicReport.tsx](../src/pages/report/PublicReport.tsx)

**Components**:
- [FormattedReport.tsx](../src/components/report/FormattedReport.tsx)
- [ReportGatekeeper.tsx](../src/components/report/ReportGatekeeper.tsx)
- [GreetingCard.tsx](../src/components/report/GreetingCard.tsx)
- [DiagnosticGrid.tsx](../src/components/report/DiagnosticGrid.tsx)
- [RotaMethodSection.tsx](../src/components/report/RotaMethodSection.tsx)
- [ActionPlanList.tsx](../src/components/report/ActionPlanList.tsx)
- [RecommendationsCTA.tsx](../src/components/report/RecommendationsCTA.tsx)
- [ResourcesPills.tsx](../src/components/report/ResourcesPills.tsx)
- [ReportHeader.tsx](../src/components/report/ReportHeader.tsx)
- [ReportFooter.tsx](../src/components/report/ReportFooter.tsx)

**Database**:
- Migration: [20260130220747_cf0b6e62-dccc-4d38-be93-dd3867fb2c93.sql](../supabase/migrations/20260130220747_cf0b6e62-dccc-4d38-be93-dd3867fb2c93.sql)

---

## Conclusion

The ENP Hub report generation system is a sophisticated, AI-powered tool that transforms raw lead data into personalized, actionable career diagnostic reports. By combining:

- Structured data collection
- AI-powered content generation
- Strategic framework (ROTA EUA™)
- Beautiful, responsive UI
- Smart caching & performance optimization
- Conversion-focused design

...the system delivers high-value experiences that build trust, educate leads, and drive conversions to paid services.

The modular architecture allows for easy iteration, A/B testing, and continuous improvement based on user behavior and conversion data.

---

**Document Version**: 1.0
**Last Updated**: 2026-02-09
**Maintainer**: Development Team
