

# Currículo USA - Stage 1 Implementation Plan

## Overview

"Currículo USA" is an AI-powered resume analyzer that helps students and mentors compare their resumes against US job descriptions. This Stage 1 focuses on building the user interface for upload, job description input, and loading states.

---

## Feature Access

The feature will be accessible from the sidebar navigation for:
- **Students**: New item under "OVERVIEW" section
- **Mentors**: New item under "OVERVIEW" section  
- **Admins**: Access via Admin Settings to manage the AI prompt

---

## Architecture Overview

```text
+------------------+     +-------------------+     +------------------+
|   Frontend UI    | --> |   Edge Function   | --> |   Lovable AI     |
|  (React Page)    |     | (analyze-resume)  |     | (Gemini/GPT)     |
+------------------+     +-------------------+     +------------------+
        |                        |
        v                        v
+------------------+     +-------------------+
| Supabase Storage |     | app_configs Table |
|  (temp-resumes)  |     | (AI Prompt Store) |
+------------------+     +-------------------+
```

---

## Database Schema

A new `app_configs` table will store configurable settings like the AI prompt:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| key | text | Config key (unique) - e.g., "resume_analyzer_prompt" |
| value | text | Config value (the AI prompt) |
| updated_at | timestamptz | Last update timestamp |
| updated_by | uuid | User who last updated |

**RLS Policies:**
- Everyone can READ configs
- Only admins can UPDATE configs

---

## File Structure

```text
src/
├── pages/
│   ├── curriculo/
│   │   └── CurriculoUSA.tsx          # Main page (students/mentors)
│   └── admin/
│       └── AdminSettings.tsx          # Admin config page (new)
│
├── components/
│   └── curriculo/
│       ├── ResumeUploadCard.tsx       # Drag-drop upload zone
│       ├── JobDescriptionCard.tsx     # Textarea for job description
│       ├── AnalyzingLoader.tsx        # Animated loading screen
│       └── CurriculoHeader.tsx        # Page header with title/credits
│
├── hooks/
│   └── useCurriculoAnalysis.ts        # Hook for AI analysis
│
supabase/
└── functions/
    └── analyze-resume/
        └── index.ts                    # Edge function for AI call
```

---

## Screen 1: Input View

### Visual Design (Following Reference)

**Background**: `#F5F5F7` (light gray)

**Layout Structure:**
1. **Header Row** - Title with icon + Credits badge (right-aligned)
2. **Hero Section** - Large centered title with gradient highlight
3. **Subtitle** - Descriptive text about ATS simulation
4. **2-Column Grid** - Upload card + Job description card
5. **CTA Button** - Large centered "Analisar Compatibilidade Agora"

### Component Details

**CurriculoHeader.tsx**
```text
┌────────────────────────────────────────────────────┐
│ [■] Currículo USA                    [∞ Créditos] │
└────────────────────────────────────────────────────┘
```
- Left: Gray-900 icon box + "Currículo USA" title
- Right: Pill-shaped badge showing credits (future use)

**Hero Title**
```text
       Seu currículo está pronto para o
              mercado Americano?
```
- Font: Inter ExtraBold, 4xl/5xl
- "mercado Americano?" has gradient: from-brand-600 to-indigo-600

**Subtitle**
```text
Compare seu CV com a vaga desejada e vença o ATS 
(Applicant Tracking System). Nossa IA simula os robôs 
de recrutamento dos EUA para te dar um score real.
```

**ResumeUploadCard.tsx**
```text
┌──────────────────────────────────────┐
│           ┌─────────┐                │
│           │   ⬆️    │ (gray-50 box)   │
│           └─────────┘                │
│                                      │
│          Seu Currículo               │
│  Arraste e solte seu arquivo         │
│  (PDF/DOCX) aqui ou clique para      │
│             enviar.                  │
│                                      │
│  📄 FORMATO PREFERENCIAL: PDF        │
└──────────────────────────────────────┘

Styling:
- rounded-[32px]
- border-2 dashed border-gray-200
- Hover: border-brand-500, bg-brand-50/50
- Height: 320px
```

**JobDescriptionCard.tsx**
```text
┌──────────────────────────────────────┐
│                                      │
│  Cole aqui a Descrição da Vaga       │
│  (Job Description) que você deseja   │
│  aplicar...                          │
│                                      │
│                                      │
│                                      │
│                             [💼]     │
└──────────────────────────────────────┘

Styling:
- rounded-[32px]
- border border-gray-200
- shadow-sm
- Full-height textarea, no border
- Briefcase icon bottom-right (ghost)
```

**CTA Button**
```text
     ┌──────────────────────────────────┐
     │ ✨ Analisar Compatibilidade Agora │
     └──────────────────────────────────┘

Styling:
- bg-brand-600 (#2563EB)
- rounded-[20px]
- py-5 px-16
- shadow-xl shadow-brand-600/30
- Hover: subtle shimmer animation
```

---

## Screen 2: Loading View

### Visual Design

**Full-height centered container** with:

**Animated Icon**
```text
        ╭──────────────╮
       │   ╭──────╮    │  ← Outer ring: pulsating (animate-ping)
       │   │  ✨  │    │  ← Inner: Sparkles icon (#2563EB)
       │   ╰──────╯    │
        ╰──────────────╯

Container: w-32 h-32 white circle
Outer ring: bg-brand-500 rounded-full opacity-20 animate-ping
```

**Text**
```text
      Analisando seu Currículo...
      
  Nossa IA está comparando suas experiências
   com os requisitos da vaga e padrões americanos.
```
- Title: font-bold text-gray-900
- Subtitle: text-gray-500

---

## State Management

**useCurriculoAnalysis.ts Hook**

```typescript
interface AnalysisState {
  status: 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error';
  uploadedFile: File | null;
  jobDescription: string;
  result: AnalysisResult | null;
  error: string | null;
}

interface AnalysisResult {
  score: number;              // 0-100 compatibility score
  summary: string;            // Brief summary
  strengths: string[];        // What matches well
  improvements: string[];     // What to improve
  keywords: {                 // Keyword analysis
    found: string[];
    missing: string[];
  };
}
```

---

## Edge Function: analyze-resume

**Flow:**
1. Receive resume file path + job description
2. Fetch current AI prompt from `app_configs` table
3. Parse the resume content (PDF/DOCX)
4. Call Lovable AI with dynamic prompt
5. Return structured analysis result

**Implementation Notes:**
- Uses `LOVABLE_API_KEY` (already configured)
- Model: `google/gemini-3-flash-preview` (default)
- Uses tool calling for structured output

---

## Admin Prompt Management

**Admin Settings Page** (new route: `/admin/configuracoes`)

A simple interface for admins to:
1. View current AI prompt
2. Edit and save the prompt
3. See when it was last updated

**UI:**
```text
┌─────────────────────────────────────────────────────┐
│  Configurações da Plataforma                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Analisador de Currículos - Prompt de IA           │
│  ┌─────────────────────────────────────────────┐   │
│  │ Você é um especialista em recrutamento...   │   │
│  │ ...                                          │   │
│  │                                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Última atualização: 27/01/2026 por Admin          │
│                                                     │
│                           [Salvar Alterações]       │
└─────────────────────────────────────────────────────┘
```

---

## Navigation Updates

**DashboardLayout.tsx Updates:**

```typescript
// Student navigation (line 42-57)
student: [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Meus Espaços', href: '/dashboard/espacos', icon: GraduationCap },
      { label: 'Currículo USA', href: '/curriculo', icon: FileCheck },  // NEW
      { label: 'Agenda', href: '/dashboard/agenda', icon: Calendar },
      { label: 'Tarefas', href: '/dashboard/tarefas', icon: ClipboardList },
    ],
  },
  // ...
],

// Mentor navigation (line 59-76)
mentor: [
  {
    label: 'OVERVIEW',
    items: [
      // ...existing items...
      { label: 'Currículo USA', href: '/curriculo', icon: FileCheck },  // NEW
    ],
  },
  // ...
],

// Admin navigation (line 77-97)
admin: [
  // ...existing items...
  {
    label: 'CONFIGURAÇÕES',
    items: [
      { label: 'Configurações', href: '/admin/configuracoes', icon: Settings }, // NEW
    ],
  },
],
```

---

## Routes (App.tsx)

```typescript
// Add new routes
<Route path="/curriculo" element={
  <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
    <CurriculoUSA />
  </ProtectedRoute>
} />

<Route path="/admin/configuracoes" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminSettings />
  </ProtectedRoute>
} />
```

---

## Implementation Order

### Phase 1: Database Setup
1. Create `app_configs` table with RLS policies
2. Insert default AI prompt

### Phase 2: UI Components
1. Create `CurriculoHeader.tsx`
2. Create `ResumeUploadCard.tsx` (with react-dropzone)
3. Create `JobDescriptionCard.tsx`
4. Create `AnalyzingLoader.tsx`
5. Create main `CurriculoUSA.tsx` page

### Phase 3: Navigation
1. Update `DashboardLayout.tsx` with new menu items
2. Add routes in `App.tsx`

### Phase 4: Backend
1. Create `analyze-resume` edge function
2. Create `useCurriculoAnalysis.ts` hook

### Phase 5: Admin
1. Create `AdminSettings.tsx` page
2. Create `useAppConfigs.ts` hook for admin

---

## Default AI Prompt

The system will include a default prompt that administrators can customize:

```text
Você é um especialista em recrutamento e ATS (Applicant Tracking Systems) do mercado americano.

Analise o currículo fornecido em comparação com a descrição da vaga e forneça:

1. **Score de Compatibilidade** (0-100): Baseado em keywords, experiência e formatação
2. **Pontos Fortes**: O que no currículo se alinha bem com a vaga
3. **Melhorias Sugeridas**: O que precisa ser ajustado para aumentar as chances
4. **Análise de Keywords**: 
   - Keywords encontradas no currículo
   - Keywords importantes da vaga que estão faltando

Considere os padrões americanos de formatação de currículo:
- Uma página para até 10 anos de experiência
- Foco em resultados quantificáveis
- Verbos de ação no passado
- Sem foto, idade ou informações pessoais desnecessárias

Responda em português brasileiro de forma clara e direta.
```

---

## Technical Notes

1. **File Parsing**: For this stage, we'll send the file to the edge function and use Lovable AI's multimodal capabilities to read PDF content directly

2. **Storage**: Temporary files stored in `temp-resumes` bucket, auto-deleted after analysis

3. **Credits**: Placeholder for now - will show "∞ Créditos" (infinite credits since it's free)

4. **Styling**: Following the "Clean Startup" design system from the reference images with rounded-[32px] cards, soft shadows, and gradient accents

