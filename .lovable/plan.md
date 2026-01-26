
# Plan: Redesign Agenda, Atividades (Tasks), and Suporte Pages

## Overview
This plan recreates three core pages to exactly match the reference images: the Agenda (calendar) page, the Atividades (tasks) page, and the Suporte (support) page. All three will be updated for all user types (Student, Mentor, Admin where applicable) with consistent modern styling.

---

## Reference Image Analysis

### Image 1: Agenda (Calendar) Page
- **Header**: "Agenda" with subtitle "Planejamento mensal"
- **Filters**: Right-aligned dropdowns "Todos os espaços" and "Todos os status" (not left-aligned)
- **Calendar Card**: White card with rounded corners
  - Navigation: Left/Right arrows + "Hoje" pill button (indigo background)
  - Month title: Centered, "Janeiro De 2026" format (capitalized "De")
  - Weekday headers: DOM, SEG, TER, QUA, QUI, SEX, SAB (uppercase, gray text)
  - Day cells: Large clickable cells with number in top-left
  - Today indicator: Blue circular background on day number
  - Session pills: Indigo gradient pills showing "10:00 • Session Title..." truncated
  - Sessions on the day appear as horizontal pills inside the cell

### Image 2: Atividades (Tasks) Page
- **Header**: "Atividades" with subtitle "Gerencie suas entregas e feedbacks"
- **Filter Tabs**: Right-aligned pill buttons: "Pendentes" (active/dark), "Concluídas", "Todas"
- **Task Cards**: Horizontal cards (not grid) with:
  - Left: Icon in circular indigo background (Upload icon)
  - Title: "Upload Currículo em Inglês"
  - Space badge: "Mentoria Elite Track" in gray pill
  - Due date: "Prazo: 10 Fev 2026"
  - Right: Status badge "Pendente" with clock icon (red outline)
  - Arrow button on far right

### Image 3: Suporte Page
- **Header**: "Suporte" with subtitle "Como podemos ajudar você hoje?"
- **Support Cards**: 2x2 grid layout with:
  - Each card has icon in colored circular background (purple, green variants)
  - "EM BREVE" badge in top-right for coming soon features
  - Title below icon
  - Description text
  - Full-width button at bottom (outline style)
- **Contact Section**: Separate card at bottom with:
  - Title: "Outras Formas de Contato"
  - Email with mail icon
  - Business hours text

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/calendar/MonthCalendar.tsx` | Major Rewrite | New layout with session pills in cells |
| `src/components/calendar/CalendarHeader.tsx` | Update | Centered title, "Hoje" as pill button |
| `src/components/calendar/DayCell.tsx` | Major Rewrite | Session pills instead of dots |
| `src/components/sessions/SessionFilters.tsx` | Update | Right-aligned layout |
| `src/pages/dashboards/StudentAgenda.tsx` | Update | New header layout, remove legend |
| `src/pages/mentor/MentorAgenda.tsx` | Update | Same changes as StudentAgenda |
| `src/components/assignments/student/AssignmentList.tsx` | Major Rewrite | Horizontal list layout with filters |
| `src/components/assignments/student/AssignmentCard.tsx` | Major Rewrite | Horizontal card design |
| `src/pages/assignments/StudentAssignments.tsx` | Update | New header, integrate top header |
| `src/pages/student/StudentSuporte.tsx` | Major Rewrite | Match reference design exactly |

---

## Detailed Implementation

### Phase 1: Redesign Calendar Components

#### CalendarHeader.tsx Updates

**New Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ [<] [>]  [Hoje]                    Janeiro De 2026              │
└────────────────────────────────────────────────────────────────┘
```

**Key Changes:**
- "Hoje" button: `bg-indigo-100 text-indigo-600 rounded-full px-4 py-1.5 text-sm font-medium`
- Month title: Centered in the middle (not right)
- Capitalize "De" in month format: "Janeiro De 2026"
- Remove spacer div, use proper justify-between with centered title

#### DayCell.tsx Major Rewrite

**New Structure:**
```
┌─────────────────────────────────┐
│ 27                              │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 10:00 • Teste Título da Se..│ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Key Changes:**
- Day number: Top-left corner, `text-gray-600` (or `text-gray-400` for outside month)
- Today: Day number in `bg-indigo-500 text-white rounded-full` circle
- Session pills: Horizontal pills with gradient background
  - Format: "HH:MM • Session Title..."
  - Color: `bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg px-2 py-1`
  - Max 1-2 visible with "+X" for more
  - Text truncated with ellipsis
- Cell size: Larger to accommodate session pills

#### MonthCalendar.tsx Updates

**Key Changes:**
- Pass full session objects to DayCell (not just indicators)
- Increase cell height for session pills
- Add proper spacing between cells
- Card styling: `rounded-[20px] bg-white border border-gray-100 shadow-sm`

### Phase 2: Redesign Session Filters

#### SessionFilters.tsx Updates

**New Layout (Right-aligned):**
```tsx
<div className="flex items-center gap-3 justify-end">
  <Select ...>
    <SelectTrigger className="w-[180px] rounded-lg border-gray-200">
      <SelectValue placeholder="Todos os espaços" />
    </SelectTrigger>
  </Select>
  <Select ...>
    <SelectTrigger className="w-[160px] rounded-lg border-gray-200">
      <SelectValue placeholder="Todos os status" />
    </SelectTrigger>
  </Select>
</div>
```

**Key Changes:**
- Remove clear button (use "all" option in dropdown)
- Right-aligned filters
- Smaller, cleaner select styling
- Rounded-lg borders

### Phase 3: Update Agenda Pages

#### StudentAgenda.tsx Updates

**New Layout:**
```tsx
<DashboardLayout>
  <DashboardTopHeader />
  
  <div className="flex-1 p-6 bg-gray-50/50">
    {/* Header Row */}
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
        <p className="text-gray-500">Planejamento mensal</p>
      </div>
      <SessionFilters ... />
    </div>
    
    {/* Calendar */}
    <MonthCalendar ... />
  </div>
</DashboardLayout>
```

**Key Changes:**
- Add DashboardTopHeader
- Remove status legend (not in reference)
- Subtitle: "Planejamento mensal"
- Filters right-aligned next to title

#### MentorAgenda.tsx Updates
- Same changes as StudentAgenda
- Keep "Nova Sessão" button (positioned in header row if needed)

### Phase 4: Redesign Task/Assignment Components

#### AssignmentList.tsx Major Rewrite

**New Layout:**
```tsx
<div className="space-y-4">
  {/* Header with filters */}
  <div className="flex items-start justify-between">
    <div>
      <h1 className="text-2xl font-bold">Atividades</h1>
      <p className="text-gray-500">Gerencie suas entregas e feedbacks</p>
    </div>
    
    {/* Pill Filter Tabs */}
    <div className="flex gap-2">
      <Button 
        variant={activeTab === 'pending' ? 'default' : 'ghost'}
        className="rounded-full"
      >
        Pendentes
      </Button>
      <Button variant="ghost" className="rounded-full">
        Concluídas
      </Button>
      <Button variant="ghost" className="rounded-full">
        Todas
      </Button>
    </div>
  </div>
  
  {/* Vertical Stack of Cards */}
  <div className="space-y-3">
    {assignments.map(a => <AssignmentCard key={a.id} assignment={a} />)}
  </div>
</div>
```

**Key Changes:**
- Remove Tabs component, use pill buttons
- Active filter: `bg-indigo-600 text-white rounded-full`
- Inactive: `text-gray-600 hover:bg-gray-100 rounded-full`
- Vertical stack of cards (not grid)

#### AssignmentCard.tsx Major Rewrite

**New Horizontal Layout:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│ ┌─────┐   Upload Currículo em Inglês                                     │
│ │ ↑   │   [Mentoria Elite Track]  Prazo: 10 Fev 2026   [⏱ Pendente] [→] │
│ └─────┘                                                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Horizontal card layout (flex row)
- Left: Icon in indigo circular background (Upload, Link, FileText based on type)
- Middle: Title on top line, space badge + due date on bottom line
- Right: Status badge + arrow button
- Status badge: `border border-red-200 text-red-600 rounded-full` for pending
- Arrow button: Ghost button with ChevronRight icon
- Card: `bg-white rounded-[20px] p-4 border border-gray-100 shadow-sm hover:shadow-md`

### Phase 5: Redesign Suporte Page

#### StudentSuporte.tsx Major Rewrite

**New 2x2 Grid Layout:**
```
┌────────────────────────────┬────────────────────────────┐
│ ┌──────┐                   │ ┌──────┐                   │
│ │ 💬   │        [EM BREVE] │ │ ✉️   │                   │
│ └──────┘                   │ └──────┘                   │
│                            │                            │
│ Chat de Suporte            │ E-mail                     │
│ Converse com nossa equipe  │ Envie um e-mail para nossa │
│ em tempo real...           │ equipe de suporte...       │
│                            │                            │
│ [    Iniciar Chat     ]    │ [   Enviar E-mail  ↗   ]   │
└────────────────────────────┴────────────────────────────┘
┌────────────────────────────┬────────────────────────────┐
│ ┌──────┐                   │ ┌──────┐                   │
│ │ ❓   │        [EM BREVE] │ │ 📄   │        [EM BREVE] │
│ └──────┘                   │ └──────┘                   │
│                            │                            │
│ Central de Ajuda           │ Documentação               │
│ Encontre respostas para as │ Guias passo a passo e      │
│ perguntas frequentes...    │ tutoriais...               │
│                            │                            │
│ [      Ver FAQ        ]    │ [      Ver Docs       ]    │
└────────────────────────────┴────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ Outras Formas de Contato                                 │
│ ✉️ suporte@euanapratica.com                              │
│ Nosso horário de atendimento...                          │
└──────────────────────────────────────────────────────────┘
```

**Key Card Styling:**
- Card: `bg-white rounded-[20px] p-6 border border-gray-100`
- Icon container: `p-3 rounded-2xl` with colored background
  - Chat: `bg-purple-100` with purple icon
  - Email: `bg-emerald-100` with emerald icon
  - FAQ: `bg-cyan-100` with cyan icon
  - Docs: `bg-green-100` with green icon
- "EM BREVE" badge: `bg-gray-100 text-gray-500 text-xs rounded-full px-2 py-0.5` positioned top-right
- Button: Full-width outline button with gray background for disabled

**Icon Colors:**
- Chat de Suporte: Purple (`MessageCircle`)
- E-mail: Green/Emerald (`Mail`)
- Central de Ajuda: Cyan (`HelpCircle`)
- Documentação: Green (`FileText`)

---

## Visual Specifications

### Colors
- **Primary**: `#4F46E5` (indigo-600)
- **Session Pills**: `bg-gradient-to-r from-indigo-500 to-purple-500`
- **Background**: `#F9FAFB` (gray-50)
- **Cards**: White with `border-gray-100`
- **Pending Status**: `border-red-200 text-red-600`
- **Completed Status**: `border-green-200 text-green-600`

### Typography
- **Page Title**: `text-2xl font-bold text-gray-900`
- **Subtitle**: `text-gray-500`
- **Card Title**: `font-semibold text-gray-900`
- **Meta Text**: `text-sm text-gray-500`
- **Badge Text**: `text-xs font-medium`

### Borders & Spacing
- **Cards**: `rounded-[20px]` or `rounded-2xl`
- **Buttons/Pills**: `rounded-full`
- **Gaps**: `gap-4` to `gap-6` between sections
- **Card Padding**: `p-4` to `p-6`

---

## Data Requirements

All existing hooks provide sufficient data:
- `useSessions()`: Session list with datetime, title, status
- `useEspacos()`: Space list for filtering
- `useAssignments()`: Assignment list with due dates, submissions

**Derived Data:**
- Session time from `datetime` field formatted as "HH:MM"
- Day abbreviation from session date
- Truncated session titles for calendar pills

---

## Responsive Behavior

**Desktop (lg+):**
- Full calendar grid with session pills visible
- Horizontal assignment cards
- 2x2 support card grid

**Mobile:**
- Calendar cells smaller, session pills truncated more aggressively
- Assignment cards stack vertically (same layout, responsive width)
- Support cards stack in single column

---

## Files to Create/Update

### Updates:
1. `src/components/calendar/CalendarHeader.tsx` - Centered title, "Hoje" pill
2. `src/components/calendar/DayCell.tsx` - Session pills instead of dots
3. `src/components/calendar/MonthCalendar.tsx` - Pass session data to cells
4. `src/components/sessions/SessionFilters.tsx` - Right-aligned layout
5. `src/pages/dashboards/StudentAgenda.tsx` - New layout with header
6. `src/pages/mentor/MentorAgenda.tsx` - Same as StudentAgenda
7. `src/components/assignments/student/AssignmentList.tsx` - Pill filters, vertical list
8. `src/components/assignments/student/AssignmentCard.tsx` - Horizontal card design
9. `src/pages/assignments/StudentAssignments.tsx` - Integrate header
10. `src/pages/student/StudentSuporte.tsx` - Complete redesign

---

## Expected Results

After implementation:
1. Agenda page shows calendar with session pills inside day cells
2. "Hoje" button is styled as indigo pill
3. Month title centered with "De" capitalized
4. Filters right-aligned next to page title
5. No status legend (removed)
6. Atividades page shows horizontal task cards in vertical stack
7. Pill-style filter tabs (Pendentes/Concluídas/Todas)
8. Status badges with clock icon for pending
9. Suporte page shows 2x2 grid with colored icon backgrounds
10. "EM BREVE" badges on coming soon features
11. Contact section at bottom with email and hours
