
# Plan: Redesign Sidebar & Student Dashboard

## Overview
Recreate the Student Dashboard interface to exactly match the reference image, featuring a structured sidebar with section headers, a top header bar with search, and a comprehensive main content area with hero card, metrics, activities, and upcoming sessions.

---

## Analysis of Reference Design

### 1. Sidebar (Left Panel)
- **Logo**: Replace with the official "EUA NA PRÁTICA" horizontal logo (uploaded)
- **Section Headers**: "OVERVIEW" and "SOCIAL" labels in uppercase gray text
- **Navigation Items**:
  - OVERVIEW: Dashboard (active/blue pill), Meus Espaços, Agenda, Tarefas
  - SOCIAL: Suporte
- **Bottom Section**: Configurações and Sair (red text with icon)
- **Style**: Clean white background, no user info card in sidebar

### 2. Top Header Bar (Desktop)
- **Left**: Search bar with placeholder "Pesquise por cursos, mentores..."
- **Right**: Mail icon, Notification bell icon, User profile (Avatar + "Aluno Exemplo" + "Aluno" role label)
- **Style**: White background, border-bottom

### 3. Main Content Area
**Hero Section:**
- Large blue/purple gradient card
- "ONLINE COURSE" label (uppercase, small)
- Title: "Domine sua carreira internacional com mentorias práticas"
- Button: "Acessar Mentoria →"

**Metrics Row (3 cards):**
- Card 1: Video icon, "Mentoria Elite", "2/8 Aulas"
- Card 2: Clipboard icon, "Atividades", "3 Pendentes"
- Card 3: Clock icon, "Tempo Total", "12h Estudadas"

**Activities Section:**
- Title: "Atividades Recentes" with "Ver todas" link
- Activity cards with:
  - Icon (different per type: Upload, Networking, Aula)
  - Title and category
  - Status badge (Pendente/Em andamento/Concluído)
  - Arrow button

### 4. Right Sidebar (Sessions)
- **Title**: "Próximas Sessões" with more options (...)
- **Live Session Card**: Green gradient with "AO VIVO • EM 20 MIN" badge, title, time, video icon
- **Other Sessions**: Date badge (29, 31), title, subtitle, time
- **Button**: "Ver Calendário Completo"

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/assets/logo-horizontal.png` | Copy | Copy uploaded logo to assets |
| `src/components/layouts/DashboardLayout.tsx` | Major Rewrite | New sidebar structure with sections |
| `src/pages/dashboards/StudentDashboard.tsx` | Major Rewrite | New layout with all components |
| `src/components/dashboard/DashboardTopHeader.tsx` | Create | Top bar with search and user menu |
| `src/components/dashboard/HeroCard.tsx` | Create | Blue gradient hero section |
| `src/components/dashboard/MetricsRow.tsx` | Create | 3-card metrics strip |
| `src/components/dashboard/RecentActivities.tsx` | Create | Activities list with status badges |
| `src/components/dashboard/SessionsSidebar.tsx` | Create | Right panel with upcoming sessions |

---

## Detailed Implementation

### Phase 1: Asset Setup

**Copy Logo to Project:**
```
lov-copy user-uploads://Logo_EUA_na_prática_horizontal_1.png src/assets/logo-horizontal.png
```

### Phase 2: Update DashboardLayout.tsx

**New Sidebar Structure:**

```
Sidebar Layout:
├── Logo Area (h-16)
│   └── <img src={logo} /> - Official horizontal logo
├── Navigation (flex-1)
│   ├── Section: "OVERVIEW" (uppercase label)
│   │   ├── Dashboard (active pill style)
│   │   ├── Meus Espaços
│   │   ├── Agenda
│   │   └── Tarefas
│   └── Section: "SOCIAL" (uppercase label)
│       └── Suporte
└── Bottom Actions (border-t)
    ├── Configurações
    └── Sair (red text)
```

**Key Styling Changes:**
- Remove user info card from sidebar (move to header)
- Add section header labels: "OVERVIEW", "SOCIAL"
- Active nav item: `bg-indigo-500 text-white rounded-lg`
- Default nav item: `text-gray-600 hover:bg-gray-100`
- Bottom items: `text-gray-600` and `text-red-500` for Sair
- Icons from lucide-react: LayoutDashboard, Grid2X2, Calendar, ClipboardList, MessageCircle, Settings, LogOut

### Phase 3: Create DashboardTopHeader.tsx

**Structure:**
```tsx
<header className="h-16 flex items-center justify-between px-6 bg-white border-b">
  {/* Search Bar */}
  <div className="relative w-96">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    <Input 
      placeholder="Pesquise por cursos, mentores..."
      className="pl-10 bg-gray-50 border-none rounded-xl"
    />
  </div>

  {/* Right Section */}
  <div className="flex items-center gap-4">
    <Button variant="ghost" size="icon">
      <Mail className="h-5 w-5 text-gray-500" />
    </Button>
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5 text-gray-500" />
      {/* Notification dot */}
      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
    </Button>
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-medium">{user.full_name}</p>
        <p className="text-xs text-gray-500">Aluno</p>
      </div>
      <Avatar className="h-9 w-9">
        <AvatarImage src={user.profile_photo_url} />
        <AvatarFallback className="bg-indigo-100 text-indigo-600">
          {initials}
        </AvatarFallback>
      </Avatar>
    </div>
  </div>
</header>
```

### Phase 4: Create HeroCard.tsx

**Structure:**
```tsx
<div className="p-8 rounded-[24px] bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white">
  <span className="text-xs font-semibold tracking-widest uppercase opacity-80">
    ONLINE COURSE
  </span>
  <h1 className="text-2xl md:text-3xl font-bold mt-2 max-w-md">
    Domine sua carreira internacional com mentorias práticas
  </h1>
  <Button 
    className="mt-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-2.5"
  >
    Acessar Mentoria
    <ArrowRight className="ml-2 h-4 w-4" />
  </Button>
</div>
```

### Phase 5: Create MetricsRow.tsx

**Structure:**
```tsx
<div className="grid grid-cols-3 gap-4">
  {/* Card 1 - Mentoria Elite */}
  <Card className="p-4 rounded-[20px] border border-gray-100">
    <div className="flex items-center gap-3">
      <div className="p-2.5 rounded-xl bg-indigo-50">
        <Video className="h-5 w-5 text-indigo-500" />
      </div>
      <div>
        <p className="text-sm text-gray-500">Mentoria Elite</p>
        <p className="text-lg font-bold">2/8 Aulas</p>
      </div>
    </div>
  </Card>
  
  {/* Card 2 - Atividades */}
  <Card className="p-4 rounded-[20px] border border-gray-100">
    <div className="flex items-center gap-3">
      <div className="p-2.5 rounded-xl bg-amber-50">
        <ClipboardList className="h-5 w-5 text-amber-500" />
      </div>
      <div>
        <p className="text-sm text-gray-500">Atividades</p>
        <p className="text-lg font-bold">3 Pendentes</p>
      </div>
    </div>
  </Card>
  
  {/* Card 3 - Tempo Total */}
  <Card className="p-4 rounded-[20px] border border-gray-100">
    <div className="flex items-center gap-3">
      <div className="p-2.5 rounded-xl bg-emerald-50">
        <Clock className="h-5 w-5 text-emerald-500" />
      </div>
      <div>
        <p className="text-sm text-gray-500">Tempo Total</p>
        <p className="text-lg font-bold">12h Estudadas</p>
      </div>
    </div>
  </Card>
</div>
```

### Phase 6: Create RecentActivities.tsx

**Structure:**
```tsx
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-semibold">Atividades Recentes</h2>
    <Button variant="link" className="text-indigo-600">Ver todas</Button>
  </div>
  
  <div className="space-y-3">
    {/* Activity Card */}
    <Card className="p-4 rounded-[20px] border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50">
            <FileText className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="font-medium">Atualizar Currículo em Inglês</p>
            <p className="text-sm text-gray-500">Upload</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-amber-100 text-amber-700 border-0">Pendente</Badge>
          <Button variant="ghost" size="icon">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
    {/* More activity cards... */}
  </div>
</div>
```

**Activity Types and Colors:**
- Upload (FileText): amber-50/amber-500
- Networking (Users): indigo-50/indigo-500
- Aula (Video): emerald-50/emerald-500

**Status Badges:**
- Pendente: `bg-amber-100 text-amber-700`
- Em andamento: `bg-blue-100 text-blue-700`
- Concluído: `bg-emerald-100 text-emerald-700` with checkmark

### Phase 7: Create SessionsSidebar.tsx

**Structure:**
```tsx
<Card className="p-4 rounded-[24px]">
  <div className="flex items-center justify-between mb-4">
    <h2 className="font-semibold">Próximas Sessões</h2>
    <Button variant="ghost" size="icon">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </div>
  
  {/* Live Session (highlighted) */}
  <div className="p-4 rounded-[16px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-3">
    <div className="flex items-center gap-2 mb-2">
      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      <span className="text-xs font-medium">AO VIVO • EM 20 MIN</span>
    </div>
    <h3 className="font-semibold">Onboarding Elite Track</h3>
    <div className="flex items-center justify-between mt-2 text-sm opacity-90">
      <span className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        10:00 - 11:30
      </span>
      <Video className="h-5 w-5" />
    </div>
  </div>
  
  {/* Other Sessions */}
  <div className="space-y-3">
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
      <span className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
        29
      </span>
      <div>
        <p className="font-medium text-sm">Mock Interview Prática</p>
        <p className="text-xs text-gray-500">Mentoria Elite • 19:00</p>
      </div>
    </div>
    {/* More sessions... */}
  </div>
  
  <Button variant="outline" className="w-full mt-4 rounded-xl">
    Ver Calendário Completo
  </Button>
</Card>
```

### Phase 8: Update StudentDashboard.tsx

**New Layout Structure:**
```tsx
<DashboardLayout>
  <div className="flex flex-col h-full">
    {/* Top Header - Only visible on desktop */}
    <DashboardTopHeader />
    
    {/* Main Content Area */}
    <div className="flex-1 p-6 lg:p-8 bg-gray-50/50">
      <div className="grid lg:grid-cols-3 gap-6 xl:gap-8">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <HeroCard />
          <MetricsRow />
          <RecentActivities />
        </div>
        
        {/* Right Column - 1/3 width */}
        <div>
          <SessionsSidebar />
        </div>
      </div>
    </div>
  </div>
</DashboardLayout>
```

---

## Visual Specifications

### Colors
- **Primary Blue**: `#4F46E5` (indigo-600) for active states and gradient
- **Background**: `#F9FAFB` (gray-50) for main content area
- **Cards**: White with subtle gray-100 border
- **Text Primary**: `#1F2937` (gray-800)
- **Text Secondary**: `#6B7280` (gray-500)

### Typography
- **Section Headers**: `text-xs uppercase tracking-wider text-gray-400 font-medium`
- **Card Titles**: `text-lg font-semibold text-gray-900`
- **Body Text**: `text-sm text-gray-600`

### Spacing & Borders
- **Cards**: `rounded-[20px]` or `rounded-[24px]`
- **Icon Containers**: `rounded-xl` (12px)
- **Content Gaps**: `gap-6` between major sections

### Navigation
- **Active Item**: `bg-indigo-500 text-white rounded-lg px-4 py-2.5`
- **Default Item**: `text-gray-600 hover:bg-gray-100 rounded-lg px-4 py-2.5`
- **Icons**: 20x20px aligned with text

---

## Responsive Behavior

**Desktop (lg+):**
- Sidebar fixed left (w-64)
- Top header visible
- 3-column grid (2+1)

**Tablet/Mobile:**
- Sidebar in hamburger menu
- Top header hidden (user menu moves to mobile header)
- Single column stack
- Sessions sidebar moves below main content

---

## Data Integration

The dashboard will continue to use existing hooks:
- `useStudentUpcomingSessions()` for sessions
- `useStudentProgress()` for progress metrics
- `useAssignments()` for pending tasks

New data needs:
- Study time tracking (can be placeholder for now)
- Recent activities (can derive from assignments)

---

## Expected Results

After implementation:
1. Sidebar matches reference with section headers and clean navigation
2. Official "EUA NA PRÁTICA" logo displayed in sidebar
3. Top header with search, notifications, and user profile
4. Hero card with gradient matching the design
5. Three metric cards in a row
6. Recent activities with status badges
7. Right sidebar with live session highlight
8. Responsive design for mobile/tablet
9. All data integrated from existing Supabase hooks
