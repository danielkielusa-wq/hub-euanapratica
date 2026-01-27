
# Currículo USA v2.0 - Enhanced Analysis Report Implementation

## Overview

This implementation upgrades the Currículo USA feature from a basic 5-field analysis to a comprehensive career consulting report using the full 20+ field JSON schema already configured in the admin prompt. The UI will match the provided reference designs with a premium "Clean Startup" aesthetic.

---

## Current vs. Target State

| Aspect | Current | Target |
|--------|---------|--------|
| AI Response Fields | 5 (score, summary, strengths, improvements, keywords) | 20+ (header, metrics, cultural_bridge, market_value, improvements with before/after, linkedin_fix, interview_cheat_sheet, etc.) |
| Score Display | Simple progress bar | Radial gauge chart with color coding |
| Metrics | None | 4-card grid (ATS, Keywords, Verbs, Brevity) |
| Improvements | Simple text list | Before/After cards with tags + copy button |
| Model | gemini-3-flash-preview | gemini-2.5-pro (better for complex structured output) |

---

## Reference Design Analysis

Based on the uploaded images:

**Image 1 (Score Section):**
- Radial gauge with score (82) in center + "SCORE" label
- Status badge: "COMPATIBILIDADE DE MERCADO: ALTA" (purple gradient)
- Main message: "Seu perfil e muito competitivo." (gradient text on "competitivo")
- Sub message: percentage ranking
- 2-column grid: Cultural Bridge card (left) + Market Value card (right)
- 4-column metrics row: Formatacao ATS, Palavras-Chave, Verbos de Acao, Brevidade

**Image 2 (Improvements Section):**
- Section title: "Melhoria de Impacto" with TrendingUp icon
- Subtitle: "Nossa IA reescreveu seus bullet points..."
- Pagination indicator (1/2)
- Power Verbs row: pill-shaped badges
- Improvement cards with:
  - Category tags (QUANTIFICACAO, POWER VERB, LIDERANCA, etc.)
  - Impact label badge on right (IMPACTO, CLAREZA)
  - ORIGINAL section with strikethrough text
  - US STANDARD section with sparkles icon + "Copiar" button
  - Divider line between sections

**Image 3 (LinkedIn + Interview):**
- LinkedIn Quick-Fix card: LinkedIn icon, headline in gray box, copy button
- Cheat Sheet: Entrevista card: numbered list of interview questions

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/types/curriculo.ts` | TypeScript interfaces for full analysis result |
| `src/pages/curriculo/CurriculoReport.tsx` | Report page layout |
| `src/components/curriculo/report/ScoreGauge.tsx` | Radial gauge SVG component |
| `src/components/curriculo/report/ReportHeader.tsx` | Score + status + messages |
| `src/components/curriculo/report/MetricsRow.tsx` | 4-metric cards grid |
| `src/components/curriculo/report/CulturalBridgeCard.tsx` | Brazil → US title card |
| `src/components/curriculo/report/MarketValueCard.tsx` | Salary range card |
| `src/components/curriculo/report/ImprovementsSection.tsx` | Section wrapper with pagination |
| `src/components/curriculo/report/PowerVerbsRow.tsx` | Suggested power verbs pills |
| `src/components/curriculo/report/ImprovementCard.tsx` | Before/after with copy |
| `src/components/curriculo/report/LinkedInQuickFix.tsx` | LinkedIn headline card |
| `src/components/curriculo/report/InterviewCheatSheet.tsx` | Interview questions list |
| `src/components/curriculo/report/index.ts` | Barrel export |

### Modified Files

| File | Changes |
|------|---------|
| `supabase/functions/analyze-resume/index.ts` | Update tool schema to full 20+ fields, switch to gemini-2.5-pro |
| `src/hooks/useCurriculoAnalysis.ts` | Update types, add navigation to report page |
| `src/pages/curriculo/CurriculoUSA.tsx` | Navigate to report after analysis |
| `src/App.tsx` | Add `/curriculo/resultado` route |
| `src/components/curriculo/index.ts` | Export new components |

---

## Implementation Details

### Phase 1: TypeScript Interfaces

Create `src/types/curriculo.ts` with the full analysis result interface:

```typescript
export interface FullAnalysisResult {
  header: {
    score: number;
    status_tag: string;
    main_message: string;
    sub_message: string;
  };
  metrics: {
    ats_format: MetricItem;
    keywords: KeywordsMetric;
    action_verbs: VerbsMetric;
    impact_metrics: ImpactMetric;
    brevity: BrevityMetric;
  };
  cultural_bridge: {
    brazil_title: string;
    us_equivalent: string;
    explanation: string;
  };
  market_value: {
    range: string;
    context: string;
  };
  power_verbs_suggestions: string[];
  improvements: Improvement[];
  linkedin_fix: {
    headline: string;
    reasoning_pt: string;
  };
  interview_cheat_sheet: InterviewQuestion[];
  // ... etc
}
```

### Phase 2: Edge Function Update

Update `supabase/functions/analyze-resume/index.ts`:

1. Change model to `google/gemini-2.5-pro` for complex structured output
2. Expand tool calling schema to include all 20+ fields
3. Ensure proper nesting for metrics, improvements, etc.

**Key Schema Changes:**
- Add `header` object with score, status_tag, main_message, sub_message
- Add `metrics` object with 5 sub-objects (ats_format, keywords, action_verbs, impact_metrics, brevity)
- Add `cultural_bridge` object
- Add `market_value` object
- Add `power_verbs_suggestions` array
- Update `improvements` to include tags, original, improved, impact_label
- Add `linkedin_fix` object
- Add `interview_cheat_sheet` array

### Phase 3: Report UI Components

**ScoreGauge.tsx**
- SVG-based radial progress indicator
- Color coded: green (75+), yellow (50-74), red (<50)
- Center displays score + "SCORE" label
- Outer ring shows progress arc

**ReportHeader.tsx**
- Purple gradient status badge
- Large title with gradient highlight on key word
- Percentile sub-message
- Back button to analyze another resume

**MetricsRow.tsx**
- 4-column responsive grid (1 col mobile, 2 tablet, 4 desktop)
- Each card: icon, label, score badge, status text
- Color coding: green=100%, orange=60-99%, yellow=<60%

**CulturalBridgeCard.tsx**
- Globe icon in blue container
- Brazil title with flag indicator
- Arrow → US title with flag indicator
- Explanation text below

**MarketValueCard.tsx**
- Dollar icon in green container
- Large salary range text
- Context message (e.g., "+15% acima da media global")

**ImprovementsSection.tsx**
- Section header with icon and pagination
- PowerVerbsRow with 5 verb pills
- Map through improvements array

**ImprovementCard.tsx**
- Category tags (pill badges) on left
- Impact label badge on right
- ORIGINAL section: gray text with line-through
- US STANDARD section: dark text with Sparkles icon + Copiar button
- Copy-to-clipboard functionality with toast notification

**LinkedInQuickFix.tsx**
- LinkedIn icon in blue container
- Headline in gray/white box
- Copy button

**InterviewCheatSheet.tsx**
- Question mark icon
- Numbered list of interview questions
- Each question in italics

### Phase 4: Report Page Layout

**CurriculoReport.tsx**
```text
<DashboardLayout>
  <div className="min-h-screen bg-[#F5F5F7] p-6 md:p-8">
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Header with Back Button */}
      <Button variant="ghost" onClick={goBack}>
        ← Nova Analise
      </Button>
      
      {/* Score Section */}
      <ReportHeader result={result} />
      
      {/* Metrics Row */}
      <MetricsRow metrics={result.metrics} />
      
      {/* Cultural Bridge + Market Value Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CulturalBridgeCard data={result.cultural_bridge} />
        <MarketValueCard data={result.market_value} />
      </div>
      
      {/* Improvements Section */}
      <ImprovementsSection 
        improvements={result.improvements}
        powerVerbs={result.power_verbs_suggestions}
      />
      
      {/* LinkedIn + Interview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LinkedInQuickFix data={result.linkedin_fix} />
        <InterviewCheatSheet questions={result.interview_cheat_sheet} />
      </div>
      
    </div>
  </div>
</DashboardLayout>
```

### Phase 5: State Management & Navigation

**Update useCurriculoAnalysis.ts:**
1. Import `useNavigate` from react-router-dom
2. Store result in localStorage for page refresh persistence
3. After successful analysis, navigate to `/curriculo/resultado`
4. Add method to retrieve stored result

**Update App.tsx:**
```typescript
<Route path="/curriculo/resultado" element={
  <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
    <CurriculoReport />
  </ProtectedRoute>
} />
```

---

## Design System Specifications

Following the "Clean Startup" aesthetic from references:

| Element | Style |
|---------|-------|
| Background | `#F5F5F7` (Apple light gray) |
| Cards | `bg-white rounded-[24px] border border-gray-100 shadow-sm` |
| Status Badge | `bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full px-4 py-1.5` |
| Metric Cards | `rounded-[20px]` with colored icon containers |
| Score Colors | Green: `#22c55e`, Yellow: `#f59e0b`, Red: `#ef4444` |
| Category Tags | `bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-xs font-medium` |
| Impact Badge | `bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold` |
| Copy Button | Ghost variant with icon, shows toast on click |

---

## Implementation Order

1. **Create TypeScript interfaces** (`src/types/curriculo.ts`)
2. **Update Edge Function** with full schema (deploy and test)
3. **Create report components** (ScoreGauge, MetricsRow, etc.)
4. **Create CurriculoReport page**
5. **Update navigation and routing**
6. **Update useCurriculoAnalysis hook** for navigation
7. **Test full flow**

---

## Technical Notes

1. **Model Upgrade**: Using `google/gemini-2.5-pro` instead of flash for better structured output with complex nested schemas

2. **Copy to Clipboard**: Use `navigator.clipboard.writeText()` with toast feedback

3. **State Persistence**: Store result in localStorage to survive page refresh. Clear on "Nova Analise"

4. **Pagination**: Improvements section shows 3 items per page with prev/next controls

5. **Responsive Design**: 
   - Mobile: single column, stacked cards
   - Tablet: 2-column grids
   - Desktop: 4-column metrics row

6. **Animation**: Subtle fade-in on page load using existing `animate-fade-slide-up`

---

## Expected User Flow

1. User uploads resume + pastes job description
2. Clicks "Analisar Compatibilidade Agora"
3. Loading animation displays
4. AI processes (10-20 seconds for full analysis)
5. Navigates to `/curriculo/resultado`
6. Report displays with all sections:
   - Score gauge + status message
   - 4 metrics cards
   - Cultural Bridge + Market Value
   - Power Verbs suggestions
   - Before/After improvement cards with copy buttons
   - LinkedIn headline with copy
   - Interview cheat sheet questions
7. User can copy improved bullet points directly
8. "Nova Analise" button returns to input screen
