
# Currículo USA v2.2 - UI Polish & PDF Export

## Overview

This update focuses on three areas:
1. Fixing the Cultural Bridge card's title overflow issue
2. Adding educational tooltips and copy-to-clipboard for Power Verbs
3. Implementing a "Baixar Relatório PDF" button using html2pdf.js

---

## Current Issues (From Screenshot)

Looking at the uploaded image:
- The Cultural Bridge card shows "BR" and "US" prefixes that should be removed
- Long job titles like "Senior Manager / Principal Consultant" can overflow
- The layout uses flags (🇧🇷 / 🇺🇸) which should be removed per requirements

---

## Implementation Plan

### 1. Cultural Bridge UI Refinement

**File**: `src/components/curriculo/report/CulturalBridgeCard.tsx`

**Changes:**

| Issue | Solution |
|-------|----------|
| Flags/country codes | Remove all 🇧🇷, 🇺🇸, "BR", "US" labels |
| Title overflow | Use `break-words`, `hyphens-auto`, remove `truncate` |
| Long titles | Limit width, use `text-sm` with `leading-tight` |
| Visual transition | Clean arrow between titles without country labels |

**New Design:**
```text
┌─────────────────────────────────────────────────────────────────┐
│  🌐 CULTURAL BRIDGE                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐        ┌─────────────────────┐         │
│  │ Senior Manager /    │   →    │ SAP Manager         │         │
│  │ Principal Consultant│        │                     │         │
│  └─────────────────────┘        └─────────────────────┘         │
│           (gray bg)                  (indigo bg)                 │
│                                                                  │
│  Seus títulos se alinham perfeitamente...                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**CSS Changes:**
- Replace `truncate` with `break-words hyphens-auto`
- Use `max-w-[200px]` or flex-wrap for containment
- Use `text-balance` for better text distribution (where supported)
- Remove all country symbols and flags

---

### 2. Power Verbs UX Enhancement

**File**: `src/components/curriculo/report/ImprovementsSection.tsx`

**Changes:**

| Feature | Implementation |
|---------|----------------|
| Info icon with tooltip | Add Lucide `Info` icon next to "Power Verbs:" label |
| Tooltip content | Portuguese explanation about action verbs |
| Clickable pills | Add `cursor-pointer` and `onClick` handler |
| Copy to clipboard | Each verb copies to clipboard with toast notification |

**New Layout:**
```text
Power Verbs: ⓘ   [Led] [Spearheaded] [Orchestrated] [Delivered]
             ↑
        Hover shows tooltip explaining why power verbs matter
        Click any pill → copies to clipboard → shows toast
```

**Tooltip Content (PT-BR):**
> "Recrutadores americanos escaneiam seu currículo em busca de verbos de ação que demonstrem liderança e iniciativa. Use estas sugestões para substituir verbos passivos e aumentar o impacto das suas conquistas."

**Technical Implementation:**
- Wrap Power Verbs label with Tooltip component
- Add Info icon from Lucide
- Each verb pill becomes a button with onClick
- Use existing `useToast` hook for copy feedback

---

### 3. PDF Export Functionality

**New File**: Will add pdf generation logic

**File**: `src/pages/curriculo/CurriculoReport.tsx`

**Changes:**

| Feature | Implementation |
|---------|----------------|
| Download button | Primary button at top with FileText/Download icon |
| Button label | "Baixar Relatório PDF" |
| Loading state | "Gerando arquivo..." with spinner |
| Library | html2pdf.js (lightweight, client-side) |

**Button Placement:**
```text
┌─────────────────────────────────────────────────────────────────┐
│  ← Nova Análise                      [ 📄 Baixar Relatório PDF ]│
└─────────────────────────────────────────────────────────────────┘
```

**PDF Generation Logic:**
1. Create a wrapper ref around the report content
2. On click, show loading state
3. Use html2pdf.js to convert the DOM to PDF
4. Configure options for page breaks and styling
5. Download the file with name: `curriculo-usa-report.pdf`

**html2pdf.js Options:**
```typescript
const opt = {
  margin: [10, 10, 10, 10],
  filename: 'curriculo-usa-report.pdf',
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: { 
    scale: 2,
    useCORS: true,
    logging: false
  },
  jsPDF: { 
    unit: 'mm', 
    format: 'a4', 
    orientation: 'portrait' 
  },
  pagebreak: { 
    mode: ['avoid-all', 'css', 'legacy'],
    avoid: ['div.improvement-card', '.metric-card']
  }
};
```

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| MODIFY | `src/components/curriculo/report/CulturalBridgeCard.tsx` | Fix overflow, remove flags/labels |
| MODIFY | `src/components/curriculo/report/ImprovementsSection.tsx` | Add tooltip and copy-to-clipboard for Power Verbs |
| MODIFY | `src/pages/curriculo/CurriculoReport.tsx` | Add PDF download button and generation logic |

---

## Technical Details

### Cultural Bridge Overflow Fix

Current problematic code:
```tsx
<span className="text-sm font-semibold text-gray-700 truncate">
  {data.brazil_title}
</span>
```

Fixed code:
```tsx
<span className="text-sm font-semibold text-gray-700 break-words hyphens-auto text-center leading-tight">
  {data.brazil_title}
</span>
```

### Power Verbs Copy Handler

```typescript
const handleVerbCopy = async (verb: string) => {
  try {
    await navigator.clipboard.writeText(verb);
    toast({
      title: 'Copiado!',
      description: `"${verb}" copiado para a área de transferência.`,
    });
  } catch (err) {
    toast({
      title: 'Erro ao copiar',
      description: 'Não foi possível copiar o verbo.',
      variant: 'destructive',
    });
  }
};
```

### PDF Generation

Using html2pdf.js which is a wrapper around jsPDF + html2canvas:
```typescript
import html2pdf from 'html2pdf.js';

const handleDownloadPDF = async () => {
  if (!reportRef.current) return;
  
  setIsGeneratingPDF(true);
  
  try {
    const element = reportRef.current;
    
    await html2pdf()
      .set({
        margin: 10,
        filename: 'curriculo-usa-report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      })
      .from(element)
      .save();
      
    toast({
      title: 'PDF gerado!',
      description: 'O relatório foi baixado com sucesso.',
    });
  } catch (err) {
    toast({
      title: 'Erro ao gerar PDF',
      description: 'Não foi possível criar o arquivo.',
      variant: 'destructive',
    });
  } finally {
    setIsGeneratingPDF(false);
  }
};
```

---

## Design System Consistency

| Element | Specification |
|---------|---------------|
| Main cards | `rounded-[32px]` |
| Internal elements | `rounded-2xl` (16px) |
| Buttons | `rounded-xl` (12px) |
| Primary color | `#2563EB` (Corporate Blue) |
| PDF button | Primary variant with FileText icon |
| Tooltips | Use existing Tooltip component from shadcn/ui |

---

## Dependencies

**New package required:** `html2pdf.js`

This is a lightweight client-side library that combines jsPDF and html2canvas. It's the simplest solution for converting styled HTML to PDF without server-side processing.

---

## Summary of Changes

1. **CulturalBridgeCard.tsx**
   - Remove 🇧🇷, 🇺🇸 flags
   - Remove "BR" and "US" labels
   - Fix text overflow with `break-words`, `hyphens-auto`
   - Use flexible width containers
   - Keep clean arrow transition

2. **ImprovementsSection.tsx**
   - Add Info icon next to "Power Verbs:" label
   - Wrap with Tooltip explaining importance
   - Make verb pills clickable
   - Add copy-to-clipboard with toast feedback

3. **CurriculoReport.tsx**
   - Add "Baixar Relatório PDF" button in header
   - Implement PDF generation with html2pdf.js
   - Add loading state during generation
   - Add ref wrapper for PDF content capture
