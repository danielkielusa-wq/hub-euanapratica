
# Currículo USA v2.1 - Enhanced UX & Error Handling

## Problem Analysis

Based on the error screenshots and the uploaded `.doc` file:

1. **File Parsing Issue**: The edge function doesn't handle legacy `.doc` files (binary format) - it only supports `.docx` (XML-based) and PDF. The uploaded file is `*.doc` which uses a completely different binary format that cannot be parsed with XML regex.

2. **Poor Error UX**: When parsing fails, the AI returns generic/empty data (0% scores, "Não informado") instead of meaningful error states.

3. **No Parsing Validation**: The system doesn't detect when document content couldn't be extracted and continues with the analysis anyway.

---

## Solution Architecture

```text
+------------------+     +-------------------+     +------------------+
|   Frontend UI    | --> |   Edge Function   | --> |   Lovable AI     |
|  (Tab-Based)     |     | (Smart Parsing)   |     | (Gemini 2.5 Pro) |
+------------------+     +-------------------+     +------------------+
        |                        |
        v                        v
+------------------+     +-------------------+
| Error States     |     | Parsing Detection |
| (Critical Alert) |     | (.doc fallback)   |
+------------------+     +-------------------+
```

---

## Implementation Plan

### Phase 1: Backend - Fix Document Parsing

**File**: `supabase/functions/analyze-resume/index.ts`

**Changes:**

1. **Detect .doc vs .docx formats**:
   - `.doc` files are binary and cannot be parsed with XML extraction
   - Add detection for `.doc` files and return a specific error code

2. **Add text content validation**:
   - After extraction, validate that meaningful content was extracted
   - If content is too short (<100 chars) or mostly garbage, return error

3. **Return structured error codes**:
   ```typescript
   type ParseError = 
     | "UNSUPPORTED_FORMAT"     // .doc files
     | "EXTRACTION_FAILED"      // Could not extract text
     | "INSUFFICIENT_CONTENT"   // Too little readable content
   ```

4. **Handle error in AI response**:
   - Add an `error` field to the schema that AI can populate if content is unreadable
   - Include `parsing_error` boolean and `parsing_error_message` in response

**Updated Logic:**
```typescript
// Check for unsupported .doc format
const isDoc = filePath.toLowerCase().endsWith(".doc") && !filePath.toLowerCase().endsWith(".docx");
if (isDoc) {
  return Response with error: "UNSUPPORTED_FORMAT" and message in Portuguese
}

// After extraction, validate content quality
if (resumeContent.length < 100 || !hasValidTextPatterns(resumeContent)) {
  return Response with error: "EXTRACTION_FAILED"
}
```

---

### Phase 2: Types - Add Error Handling

**File**: `src/types/curriculo.ts`

**Add new interfaces:**

```typescript
export interface AnalysisError {
  code: "UNSUPPORTED_FORMAT" | "EXTRACTION_FAILED" | "INSUFFICIENT_CONTENT" | "AI_ERROR";
  message: string;
}

export interface FullAnalysisResult {
  // Existing fields...
  parsing_error?: boolean;
  parsing_error_message?: string;
}

// Add qualitative label type
export type QualitativeScore = "Crítico" | "Precisa Melhorar" | "Perfeito";
```

---

### Phase 3: Report Page - Tab-Based Layout

**File**: `src/pages/curriculo/CurriculoReport.tsx`

**New Layout Structure:**

```text
┌─────────────────────────────────────────────────────────────────┐
│  ← Nova Análise                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │             [SCORE GAUGE: 82] ⓘ                         │    │
│  │  COMPATIBILIDADE DE MERCADO: ALTA                        │    │
│  │  "Seu perfil é muito competitivo..."                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  [ Visão Geral ]  [ Otimização ]  [ Preparação ]        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ══════════════ TAB CONTENT AREA ══════════════════════════════  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Tab 1 - "Visão Geral":**
- Metrics row (4 cards with qualitative labels + info tooltips)
- Market Intelligence section (Cultural Bridge + Market Value)
- Critical Alert (if ATS format is "Crítico")

**Tab 2 - "Otimização":**
- Power Verbs horizontal scroll bar (at top)
- Before/After improvement cards with copy functionality

**Tab 3 - "Preparação":**
- LinkedIn Quick-Fix card
- Interview Cheat Sheet (as carousel with "Perspectiva do Recrutador" button)

---

### Phase 4: Metrics Row - Qualitative Labels + Tooltips

**File**: `src/components/curriculo/report/MetricsRow.tsx`

**Changes:**

1. **Replace percentages with qualitative labels:**
   ```typescript
   const getQualitativeLabel = (score: number): QualitativeScore => {
     if (score >= 80) return "Perfeito";
     if (score >= 50) return "Precisa Melhorar";
     return "Crítico";
   };
   ```

2. **Add info icon with tooltip to each metric card:**
   ```typescript
   const metricTooltips = {
     ats: "Verifica se o formato do seu currículo é compatível com sistemas ATS (Applicant Tracking Systems). Formatos PDF simples e sem tabelas complexas são ideais.",
     keywords: "Analisa quantas palavras-chave da vaga estão presentes no seu currículo. Quanto mais correspondências, maior a chance de passar pelos filtros automatizados.",
     verbs: "Verbos de ação como 'Led', 'Developed', 'Achieved' demonstram impacto e liderança. Currículos americanos priorizam verbos fortes no início das frases.",
     brevity: "Nos EUA, currículos devem ter 1-2 páginas. Recrutadores gastam em média 6 segundos na primeira triagem."
   };
   ```

3. **Color coding:**
   - Crítico: Red background/text (`bg-red-50 text-red-600`)
   - Precisa Melhorar: Amber (`bg-amber-50 text-amber-600`)
   - Perfeito: Green (`bg-green-50 text-green-600`)

---

### Phase 5: Critical Alert Component

**File**: `src/components/curriculo/report/CriticalAlert.tsx` (new)

**Design:**
```text
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️  ALERTA CRÍTICO: FORMATO ATS                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  O formato do seu currículo parece corrompido ou inválido,      │
│  o que resultará em falha em 100% dos sistemas ATS.              │
│                                                                  │
│  Recomendação: Salve seu currículo como PDF simples e tente     │
│  novamente.                                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Styling:**
- Background: `bg-red-50`
- Border: `border-2 border-red-200`
- Icon: `AlertTriangle` in red
- Rounded: `rounded-[24px]`

---

### Phase 6: Interview Carousel

**File**: `src/components/curriculo/report/InterviewCheatSheet.tsx`

**Changes:**

1. **Convert to carousel with navigation arrows**
2. **Each card shows one question**
3. **Add "Perspectiva do Recrutador" expandable button**

**New Design:**
```text
┌─────────────────────────────────────────────────────────────────┐
│  ❓ CHEAT SHEET: ENTREVISTA                        ← 1/5 →      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │  "Tell me about a time you led a complex SAP             │    │
│  │   implementation project."                                │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────┐        │    │
│  │  │  📋 Perspectiva do Recrutador               │        │    │
│  │  └─────────────────────────────────────────────┘        │    │
│  │                                                          │    │
│  │  ▼ (expanded)                                            │    │
│  │  Esta pergunta testa sua experiência em liderança...    │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Phase 7: Score Gauge Tooltip

**File**: `src/components/curriculo/report/ScoreGauge.tsx`

**Add tooltip on hover:**
```text
┌─────────────────────────────────────────────────────────┐
│  Este score representa a compatibilidade geral do seu   │
│  currículo com a vaga analisada.                        │
│                                                          │
│  • 75-100: Alta compatibilidade                          │
│  • 50-74: Compatibilidade média                          │
│  • 0-49: Baixa compatibilidade                           │
└─────────────────────────────────────────────────────────┘
```

---

### Phase 8: Copy Toast Enhancement

**Already implemented** - The existing `ImprovementCard` and `LinkedInQuickFix` components already show toast notifications with checkmarks when copying. We'll verify and enhance if needed.

---

### Phase 9: Upload Card Enhancement

**File**: `src/components/curriculo/ResumeUploadCard.tsx`

**Changes:**

1. **Accept .doc files** (for user convenience, but show warning)
2. **Add note about PDF preference being stronger**
3. **When .doc is uploaded, show warning message**

```text
⚠️ Arquivos .doc podem não ser processados corretamente.
   Recomendamos converter para PDF para melhor precisão.
```

---

### Phase 10: Design System Refinements

**Background**: Change to `#F8F9FB` (slightly cooler tone)

**Animations**:
- Add `animate-fade-in` class to tab content on switch
- Smooth transitions between tabs

**Typography**:
- Headers: `font-bold tracking-tight`
- Labels: `text-[10px] font-bold uppercase tracking-wider`

**Rounding**:
- Main containers: `rounded-[32px]`
- Internal elements: `rounded-2xl`

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| MODIFY | `supabase/functions/analyze-resume/index.ts` | Add .doc detection, content validation, error codes |
| MODIFY | `src/types/curriculo.ts` | Add error types, qualitative score type |
| MODIFY | `src/pages/curriculo/CurriculoReport.tsx` | Implement tab-based layout with 3 tabs |
| MODIFY | `src/components/curriculo/report/MetricsRow.tsx` | Qualitative labels + info tooltips |
| MODIFY | `src/components/curriculo/report/ScoreGauge.tsx` | Add info tooltip for score explanation |
| MODIFY | `src/components/curriculo/report/InterviewCheatSheet.tsx` | Convert to carousel with expandable reasoning |
| CREATE | `src/components/curriculo/report/CriticalAlert.tsx` | Critical error alert component |
| MODIFY | `src/components/curriculo/ResumeUploadCard.tsx` | Add .doc file warning |
| MODIFY | `src/components/curriculo/report/ImprovementsSection.tsx` | Horizontal scroll power verbs |
| MODIFY | `src/hooks/useCurriculoAnalysis.ts` | Handle error responses gracefully |

---

## Testing Plan

After implementation:

1. **Test with PDF file** - Should work normally
2. **Test with .doc file** - Should show error alert recommending PDF
3. **Test with .docx file** - Should work (if text extraction succeeds)
4. **Verify tab navigation** works smoothly
5. **Verify tooltips appear** on info icons and score gauge
6. **Verify copy toast** shows green checkmark
7. **Test interview carousel** navigation and "Perspectiva" expansion
8. **Verify qualitative labels** display correctly based on scores

---

## Implementation Order

1. **Edge Function** - Fix parsing and add error handling
2. **Types** - Add error interfaces
3. **Critical Alert** - Create new component
4. **Metrics Row** - Qualitative labels + tooltips
5. **Score Gauge** - Add tooltip
6. **Interview Cheat Sheet** - Convert to carousel
7. **Report Page** - Implement tab navigation
8. **Upload Card** - Add .doc warning
9. **Hook** - Handle errors
10. **Deploy & Test** with provided resume and job description
