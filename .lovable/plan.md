
# Plan: Redesign Student "Meus Espacos" and Detail Pages

## Overview
This plan recreates the Student Spaces interface (list and detail pages) to exactly match the reference images, featuring horizontal course cards with gradient backgrounds, pill-style filters, and a modern detail page with full-width gradient hero header and reorganized tab content.

---

## Analysis of Reference Images

### Image 1: "Meus Espacos" List Page
- **Top Header**: Already implemented (search bar, mail/notification icons, user profile)
- **Page Title**: "Meus Espaços" with subtitle "Seus cursos e mentorias ativos"
- **Filter Tabs**: "Todos", "Em andamento", "Concluídos" (dark pill style for active)
- **Card Grid**: Horizontal cards (NOT Netflix vertical 3:4) with:
  - Gradient background (blue-purple, pink-purple, teal variants)
  - Category badge in top-left (MENTORIA, CURSO, WORKSHOP)
  - More options menu (⋮) in top-right
  - Title BELOW the gradient area (outside the colored section)
  - Stats: "X Módulos • Y Atividades" with icons
  - Progress bar with percentage label
- **"Explorar Cursos" Card**: Special card with arrow icon at bottom-left

### Images 2-6: Espaço Detail Page
- **Full-width Gradient Hero Header**:
  - "← Voltar" pill button (not icon-only)
  - "MENTORIA ELITE" badge in top-right
  - Large white title on gradient
  - Stats: "32 Alunos • 12 Sessões"
  - Right-side floating card: "PRÓXIMO ENCONTRO" with date and "Acessar Sala ao Vivo" button

- **Sticky Tabs** (pill style, dark active):
  - Visão Geral, Sessões (2), Tarefas (4), Materiais (6), Meus Arquivos (2)

- **Tab Contents**:
  - **Visão Geral**: 2-column layout
    - Left: "Na sua agenda" (sessions with day badge, AO VIVO, Participar button)
    - Left: "Para entregar" (assignments with icon, due date, Entregar button)
    - Right: "Seu Progresso" (circular progress), "Grupo do Telegram" card
  - **Sessões**: "Cronograma Completo" with "Baixar PDF" button, vertical session cards
  - **Tarefas**: "Suas Atividades" with status-colored icons, type badges
  - **Materiais**: Folder-grouped cards with colored file icons
  - **Meus Arquivos**: Upload zone (dashed, cloud icon), file list with view/delete

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/student/StudentEspacos.tsx` | Major Rewrite | New horizontal card layout with filters |
| `src/components/espacos/StudentEspacoCard.tsx` | Create | New horizontal card component |
| `src/pages/student/StudentEspacoDetail.tsx` | Major Rewrite | New hero header and content layout |
| `src/components/espacos/detail/EspacoHeroHeader.tsx` | Major Rewrite | Match reference gradient hero |
| `src/components/espacos/detail/EspacoStickyTabs.tsx` | Update | Pill-style tabs with badges |
| `src/components/espacos/detail/OverviewContent.tsx` | Major Rewrite | 3-column layout with progress card |
| `src/components/espacos/detail/SessionTimeline.tsx` | Update | New card design matching reference |
| `src/components/espacos/detail/TaskListGrouped.tsx` | Update | New card design with colored icons |
| `src/components/library/EspacoLibrary.tsx` | Update | Split into Materiais and Meus Arquivos tabs |
| `src/components/espacos/detail/MyFilesTab.tsx` | Create | New upload zone component |

---

## Detailed Implementation

### Phase 1: Create New Horizontal Card Component

**File:** `src/components/espacos/StudentEspacoCard.tsx`

```
Card Structure:
┌──────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [CATEGORY BADGE]                            [⋮]          │ │
│ │                                                          │ │
│ │            GRADIENT BACKGROUND AREA                      │ │
│ │              (aspect-[16/9])                             │ │
│ │                                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│ Title of the Course                                          │
│ 🔲 X Módulos  📋 Y Atividades                                │
│                                                              │
│ Progresso ──────────────────────────────────── XX%          │
└──────────────────────────────────────────────────────────────┘
```

**Key Styling:**
- Card: `rounded-[20px] bg-white border border-gray-100 overflow-hidden hover:shadow-lg`
- Gradient area: `aspect-[16/9] relative` with gradient background
- Category badge: `absolute top-4 left-4 bg-indigo-600/90 text-white rounded-full px-3 py-1`
- Menu button: `absolute top-4 right-4 text-white/70 hover:text-white`
- Title section: `p-4 pt-3`
- Stats row: `flex gap-4 text-sm text-gray-500`
- Progress: Label "Progresso" left, percentage right, bar below

**Category Colors:**
- MENTORIA: indigo-600/purple gradient
- CURSO: pink-500/purple gradient
- WORKSHOP: teal-400/emerald gradient

### Phase 2: Redesign StudentEspacos.tsx

**New Layout:**
```tsx
<DashboardLayout>
  <DashboardTopHeader />
  
  <div className="p-6 bg-gray-50/50">
    {/* Page Header */}
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">Meus Espaços</h1>
        <p className="text-gray-500">Seus cursos e mentorias ativos</p>
      </div>
      
      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'}
          className="rounded-full"
        >
          Todos
        </Button>
        <Button variant="outline" className="rounded-full">Em andamento</Button>
        <Button variant="outline" className="rounded-full">Concluídos</Button>
      </div>
    </div>
    
    {/* Card Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {espacos.map(espaco => (
        <StudentEspacoCard key={espaco.id} espaco={espaco} />
      ))}
      
      {/* Explore Card */}
      <ExploreCoursesCard />
    </div>
  </div>
</DashboardLayout>
```

**Filter State:**
- `useState<'all' | 'in_progress' | 'completed'>('all')`
- Filter espacos based on status and progress percentage

### Phase 3: Redesign EspacoHeroHeader.tsx

**New Structure:**
```
Full-width gradient header (no rounded corners, bleeds to edges)
┌────────────────────────────────────────────────────────────────────────┐
│ [← Voltar]                                        [MENTORIA ELITE]     │
│                                                                        │
│ Mentoria Elite Track                    ┌────────────────────────────┐ │
│ Turma Março 2026                        │ 📅 PRÓXIMO ENCONTRO        │ │
│                                         │    27 Jan, 10:00           │ │
│ 👥 32 Alunos  •  🎥 12 Sessões          │ [Acessar Sala ao Vivo]     │ │
│                                         └────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Full-width gradient (from-indigo-500 via-indigo-600 to-purple-700)
- "← Voltar" as pill button with text, not just icon
- Category badge "MENTORIA ELITE" in top-right as dark pill
- Large white title text
- Stats row with icons in white text
- Floating white card for "Próximo Encontro" on right side
- Remove the collapsing scroll behavior (always visible)

### Phase 4: Redesign EspacoStickyTabs.tsx

**New Tab Style:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ [✓ Visão Geral] [🎥 Sessões 2] [📋 Tarefas 4] [📁 Materiais 6] ... │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Tabs as pill buttons, not underlined text
- Active tab: `bg-indigo-600 text-white rounded-full`
- Inactive tab: `text-gray-600 hover:bg-gray-100 rounded-full`
- Badge: `bg-gray-100 text-gray-600 rounded-full` (inactive) or `bg-white/20` (active)
- Icons inside tabs
- Rename "Biblioteca" to "Materiais" and add "Meus Arquivos" tab

### Phase 5: Redesign OverviewContent.tsx

**New 3-Column Layout:**
```
┌───────────────────────────────────────┬─────────────────────────┐
│ Na sua agenda            [Ver todas]  │ Seu Progresso           │
│ ┌─────────────────────────────────┐   │ ┌─────────────────────┐ │
│ │ [TER] AO VIVO 10:00             │   │ │     ◐ 20%           │ │
│ │ de   Teste Titulo da Sessao     │   │ │ 2 de 12 Módulos     │ │
│ │      [Participar]               │   │ └─────────────────────┘ │
│ └─────────────────────────────────┘   │                         │
│ ┌─────────────────────────────────┐   │ Grupo do Telegram       │
│ │ [QUI] AO VIVO 10:00             │   │ ┌─────────────────────┐ │
│ │ de   01 Onboarding              │   │ │ Conecte-se com 32   │ │
│ │      [Participar]               │   │ │ alunos da turma     │ │
│ └─────────────────────────────────┘   │ │ [Acessar Grupo]     │ │
│                                       │ └─────────────────────┘ │
│ Para entregar            [Ver todas]  │                         │
│ ┌──────────────────┐┌────────────────┐│                         │
│ │ 📄              ││ 📄             ││                         │
│ │ Atualizar       ││ Quiz: Cultura  ││                         │
│ │ LinkedIn        ││ Americana      ││                         │
│ │ Vence: 05/02    ││ Vence: 12/02   ││                         │
│ │[Entregar]       ││[Entregar]      ││                         │
│ └──────────────────┘└────────────────┘│                         │
└───────────────────────────────────────┴─────────────────────────┘
```

**Key Changes:**
- 2/3 + 1/3 grid layout
- Session cards with day badge (TER, QUI, etc.) on left
- "AO VIVO" badge with time
- "Participar" button on right
- Assignment cards in 2-column grid
- Progress card with circular chart (using SVG or chart library)
- Telegram group card at bottom-right

### Phase 6: Redesign SessionTimeline.tsx (Sessions Tab)

**New Design:**
- Header: "Cronograma Completo" with "↓ Baixar PDF" button on right
- Each session as a full card:
  - Video icon in circle on left
  - Title, date/time, description
  - "Ao Vivo" badge on right for live sessions
  - "Participar da Sessão" button (indigo, rounded)

### Phase 7: Redesign TaskListGrouped.tsx (Tarefas Tab)

**New Design:**
- Title: "Suas Atividades"
- Each task as a horizontal card:
  - Left: Colored icon circle (blue for normal, pink for overdue, green for completed)
  - Title and type badge (Arquivo, Link, Video, Quiz)
  - Due date (red if overdue)
  - Right: Status indicator or "Enviar Entrega" button

**Type Badges:**
- Arquivo, Link, Video, Quiz as small gray pills

**Status Colors:**
- Normal: Blue icon
- Atrasada: Pink/red icon + red text
- Entregue: Green checkmark

### Phase 8: Split Library into Materiais and Meus Arquivos

**Materiais Tab:**
- Group by folder (e.g., "Módulo 01: Fundamentos", "Templates & Recursos")
- Grid of material cards:
  - File type icon (colored: red for PDF, blue for DOC, gray for TXT, yellow for ZIP)
  - Filename
  - File type + size label
  - More options menu (⋮)

**Meus Arquivos Tab (New Component):**
- Title: "Seus Arquivos" with subtitle
- Upload zone:
  - Dashed orange/amber border
  - Cloud upload icon
  - "Clique para enviar ou arraste"
  - Supported formats text
- File list:
  - Icon, filename
  - Size, upload date
  - View (👁) and Delete (🗑) buttons

---

## Visual Specifications

### Colors
- **Primary Gradient**: `from-indigo-500 via-indigo-600 to-purple-700`
- **Card Backgrounds**: White with subtle gray-100 border
- **Active Tab/Button**: `bg-indigo-600 text-white`
- **Inactive Tab/Button**: `text-gray-600 bg-transparent`
- **Progress Bar**: Indigo for in-progress, Emerald for complete
- **Overdue**: Pink/red accents

### Typography
- **Page Title**: `text-2xl font-bold text-gray-900`
- **Section Headers**: `text-lg font-semibold text-gray-900`
- **Card Titles**: `text-base font-semibold`
- **Stats/Meta**: `text-sm text-gray-500`
- **Badges**: `text-xs font-medium uppercase tracking-wide`

### Spacing & Borders
- **Cards**: `rounded-[20px]` for main cards, `rounded-[16px]` for inner cards
- **Buttons**: `rounded-full` for pills, `rounded-xl` for action buttons
- **Gaps**: `gap-6` between cards, `gap-4` within cards

---

## Data Requirements

The existing hooks provide sufficient data:
- `useStudentEspacosWithStats()`: Provides espacos with progress, sessions, assignments counts
- `useSessions()`: Session list with dates, links, status
- `useAssignments()`: Assignment list with due dates, submissions
- `useMaterials()` / `useFolders()`: Library data

**New Fields Needed in UI (derived):**
- Module count: Count of unique sessions or folder count
- Activity count: Assignment count
- Day abbreviation from session date (TER, QUI, SEX, etc.)
- Circular progress visualization

---

## Expected Results

After implementation:
1. "Meus Espaços" page shows horizontal cards matching the reference exactly
2. Filter tabs work to show All, In Progress, or Completed spaces
3. Detail page has full-width gradient hero with floating "Próximo Encontro" card
4. Sticky tabs use pill style with badges
5. Overview tab has 3-column layout with progress circle and Telegram card
6. Sessions tab shows timeline with "Baixar PDF" option
7. Tarefas tab shows tasks with colored status icons
8. Materiais tab shows folder-grouped files
9. Meus Arquivos tab has upload zone and file management
10. All styling matches the premium, modern aesthetic from references
