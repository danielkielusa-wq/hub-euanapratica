
# Plan: Unificacao de Interface, Expansao de Layout e Customizacao Pro

## Overview
This mega-refactor unifies the Mentor and Student experience across the entire "Espacos" ecosystem, adds ultra-wide desktop support, and implements a professional gradient theme customization system with real-time preview.

---

## Phase 1: Database Schema Update

### 1.1 Add Visual Customization Columns to `espacos` Table

```sql
-- Add gradient theme columns to espacos
ALTER TABLE public.espacos 
ADD COLUMN IF NOT EXISTS gradient_preset TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gradient_start TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gradient_end TEXT DEFAULT NULL;

-- Add gradient theme columns to sessions for session-specific styling
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS gradient_preset TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gradient_start TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gradient_end TEXT DEFAULT NULL;
```

### 1.2 Update RLS Policies
No new RLS policies needed - existing policies for UPDATE on `espacos` and `sessions` cover these new columns.

---

## Phase 2: Premium Gradient Presets System

### 2.1 Create Gradient Presets Library

**File:** `src/lib/gradients.ts` (extend existing)

Add 6 premium gradient presets as shown in the reference image:

```typescript
export const GRADIENT_PRESETS = {
  sunrise: {
    name: 'Sunrise Serenity',
    colors: ['#FF9A8B', '#FF6A88', '#D4A5FF'],
    css: 'linear-gradient(135deg, #FF9A8B 0%, #FF6A88 50%, #D4A5FF 100%)'
  },
  ocean: {
    name: 'Ocean Whisper', 
    colors: ['#2193b0', '#6dd5ed'],
    css: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)'
  },
  mystic: {
    name: 'Mystic Dusk',
    colors: ['#4b6cb7', '#182848'],
    css: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)'
  },
  emerald: {
    name: 'Emerald Grove',
    colors: ['#11998e', '#38ef7d'],
    css: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
  },
  volcanic: {
    name: 'Volcanic Ember',
    colors: ['#e65c00', '#F9D423'],
    css: 'linear-gradient(135deg, #e65c00 0%, #F9D423 100%)'
  },
  slate: {
    name: 'Slate Monochrome',
    colors: ['#0F172A', '#334155', '#0F172A'],
    css: 'linear-gradient(135deg, #0F172A 0%, #334155 50%, #0F172A 100%)'
  }
};

// Helper to resolve gradient (preset, custom, or fallback)
export function resolveGradient(
  preset?: string | null,
  gradientStart?: string | null,
  gradientEnd?: string | null,
  fallbackId?: string
): string;
```

### 2.2 Create GradientThemePicker Component

**File:** `src/components/shared/GradientThemePicker.tsx`

Features:
- Grid of 6 preset gradient cards with names
- "Custom" option with two color hex inputs
- Real-time preview of selected gradient
- Responsive: 3x2 grid on desktop, 2x3 on mobile
- Each preset card shows a mini 3:4 aspect preview

```
Visual Structure:
+---------+---------+---------+
| Sunrise | Ocean   | Mystic  |
+---------+---------+---------+
| Emerald | Volcanic| Slate   |
+---------+---------+---------+
| [Custom] Start: [____] End: [____] |
+-----------------------------------+
```

---

## Phase 3: Visual Parity - Mentor EspacoDetail Refactor

### 3.1 Complete Refactor of MentorEspacoDetail

**File:** `src/pages/mentor/MentorEspacoDetail.tsx`

Transform from current basic layout to use the same premium components as Student:

**Import and use:**
- `EspacoHeroHeader` (with role-aware back button navigation)
- `EspacoMetricsRow` (show Alunos, Sessoes, Correcoes, Vagas)
- `EspacoStickyTabs` (add Discussao tab)
- `SessionTimeline` (same component, shared)
- `TaskListGrouped` (shared)
- `DiscussionSessionsList` (shared)

**Mentor-specific additions:**
- Settings gear icon in hero header top-right
- "Convidar Aluno" ghost button in sticky header
- Archive/Restore actions in Settings tab
- Students management tab with table

### 3.2 Update EspacoHeroHeader for Role Awareness

**File:** `src/components/espacos/detail/EspacoHeroHeader.tsx`

Add props:
- `role?: 'student' | 'mentor'`
- `onSettingsClick?: () => void`
- `gradientPreset?: string`
- `gradientStart?: string`
- `gradientEnd?: string`

Changes:
- Back button navigates to role-appropriate list
- Show settings gear icon when `role="mentor"`
- Use `resolveGradient()` for background

---

## Phase 4: Desktop Layout Optimization (Ultra-Wide Support)

### 4.1 Fix Netflix Card Grid Layout

**Files to update:**
- `src/pages/student/StudentEspacos.tsx`
- `src/pages/mentor/MentorEspacos.tsx`

**Current (constrained):**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {espacos.map((espaco) => (
    <div className="flex justify-center sm:justify-start">
      <div className="w-full max-w-[280px]">
        <NetflixEspacoCard />
      </div>
    </div>
  ))}
</div>
```

**Updated (full-width):**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full">
  {espacos.map((espaco) => (
    <NetflixEspacoCard key={espaco.id} espaco={espaco} />
  ))}
</div>
```

### 4.2 Update NetflixEspacoCard to be Responsive

**File:** `src/components/espacos/NetflixEspacoCard.tsx`

- Remove fixed `max-w-[280px]` constraint from parent
- Make card width responsive: `w-full` with grid control
- Card maintains 3:4 aspect ratio internally
- Use `resolveGradient()` for gradient support

### 4.3 Update EspacoMetricsRow for Full Width

**File:** `src/components/espacos/detail/EspacoMetricsRow.tsx`

- Remove `max-w-4xl mx-auto` constraint on desktop
- Use `max-w-6xl` or full-width distribution
- Maintain horizontal scroll on mobile

### 4.4 Update Tab Content Container

**File:** `src/pages/student/StudentEspacoDetail.tsx` & `src/pages/mentor/MentorEspacoDetail.tsx`

- Change `max-w-4xl mx-auto` to `max-w-6xl mx-auto` for wider content
- Or use full-width for certain tabs (Sessions timeline)

---

## Phase 5: Visual Setup Menu (Mentor Form Integration)

### 5.1 Update CreateEspacoForm with Visual Setup Section

**File:** `src/components/admin/espacos/CreateEspacoForm.tsx`

Add new collapsible section "Visual Setup":

```tsx
<Collapsible>
  <CollapsibleTrigger className="flex items-center gap-2">
    <Palette className="h-4 w-4" />
    Configuracao Visual (Opcional)
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div className="space-y-4">
      {/* Cover Image Upload - existing */}
      <CoverImageUpload />
      
      {/* NEW: Gradient Theme Picker */}
      <GradientThemePicker 
        selectedPreset={gradientPreset}
        customStart={gradientStart}
        customEnd={gradientEnd}
        onChange={(preset, start, end) => {
          setValue('gradient_preset', preset);
          setValue('gradient_start', start);
          setValue('gradient_end', end);
        }}
      />
      
      {/* Live Preview */}
      <div className="aspect-[3/4] max-w-[200px] rounded-[24px] overflow-hidden">
        <NetflixEspacoCardPreview gradient={...} />
      </div>
    </div>
  </CollapsibleContent>
</Collapsible>
```

### 5.2 Update Form Schema

Add fields: `gradient_preset`, `gradient_start`, `gradient_end`

### 5.3 Update EspacoForm (Admin Modal)

**File:** `src/components/admin/espacos/EspacoForm.tsx`

Add same Visual Setup section with GradientThemePicker

---

## Phase 6: Unified Forum Integration

### 6.1 Ensure Discussao Tab Works Identically for Both Roles

**Already implemented in StudentEspacoDetail.tsx**

Add same implementation to MentorEspacoDetail.tsx:
- Import `DiscussionSessionsList`
- Add to tabs: `{ value: 'discussao', label: 'Discussao', icon: MessageCircle }`
- Render `<DiscussionSessionsList sessions={sessions} />` when tab active

### 6.2 Apply Slate Monochrome Theme to Forum Drawer

**File:** `src/components/sessions/SessionDiscussionDrawer.tsx`

Update SheetContent/DrawerContent:
```tsx
className="bg-gradient-to-b from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl"
```

This creates a professional, text-focused environment for discussions.

---

## Phase 7: Animation & Transition Polish

### 7.1 Add New Animations to tailwind.config.ts

```typescript
keyframes: {
  // ... existing
  'theme-switch': {
    '0%': { opacity: '0.7', transform: 'scale(0.98)' },
    '100%': { opacity: '1', transform: 'scale(1)' }
  }
},
animation: {
  // ... existing
  'theme-switch': 'theme-switch 0.3s ease-out'
}
```

### 7.2 Apply Transitions to Theme Changes

When gradient selection changes:
- Add `transition-all duration-300` to preview containers
- Use `animate-theme-switch` on gradient change

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/xxx.sql` | Create | Add gradient columns to espacos and sessions |
| `src/lib/gradients.ts` | Extend | Add GRADIENT_PRESETS and resolveGradient() |
| `src/components/shared/GradientThemePicker.tsx` | Create | Preset picker with custom color inputs |
| `src/pages/mentor/MentorEspacoDetail.tsx` | Major Rewrite | Use premium components like Student view |
| `src/components/espacos/detail/EspacoHeroHeader.tsx` | Update | Add role awareness, gradient support |
| `src/pages/student/StudentEspacos.tsx` | Update | Remove max-w constraint, add 2xl:grid-cols-5 |
| `src/pages/mentor/MentorEspacos.tsx` | Update | Remove max-w constraint, add 2xl:grid-cols-5 |
| `src/components/espacos/NetflixEspacoCard.tsx` | Update | Add gradient props, use resolveGradient() |
| `src/components/espacos/detail/EspacoMetricsRow.tsx` | Update | Expand max-width for ultra-wide |
| `src/components/admin/espacos/CreateEspacoForm.tsx` | Update | Add Visual Setup section |
| `src/components/admin/espacos/EspacoForm.tsx` | Update | Add Visual Setup section |
| `src/components/sessions/SessionDiscussionDrawer.tsx` | Update | Apply Slate Monochrome theme |
| `tailwind.config.ts` | Update | Add theme-switch animation |

---

## Visual Design Specifications

### Premium Gradient Presets (from reference image)
1. **Sunrise Serenity**: #FF9A8B -> #FF6A88 -> #D4A5FF
2. **Ocean Whisper**: #2193b0 -> #6dd5ed  
3. **Mystic Dusk**: #4b6cb7 -> #182848
4. **Emerald Grove**: #11998e -> #38ef7d
5. **Volcanic Ember**: #e65c00 -> #F9D423
6. **Slate Monochrome**: #0F172A -> #334155 -> #0F172A

### Layout Breakpoints
- Mobile: 1 column
- sm (640px): 2 columns
- lg (1024px): 3 columns
- xl (1280px): 4 columns
- 2xl (1536px): 5 columns

### Consistent Styling
- All cards: `rounded-[24px]`
- Soft shadows: `shadow-xl` at 5% opacity
- Transitions: `duration-300`
- Forum drawer: Slate Monochrome gradient background

---

## Technical Implementation Order

1. **Database Migration** - Add gradient columns
2. **Extend gradients.ts** - Add presets and resolver
3. **Create GradientThemePicker** - Reusable picker component  
4. **Update NetflixEspacoCard** - Accept gradient props
5. **Update EspacoHeroHeader** - Role + gradient awareness
6. **Fix Grid Layouts** - Remove constraints, add 2xl breakpoint
7. **Rewrite MentorEspacoDetail** - Full premium component adoption
8. **Update Forms** - Add Visual Setup section
9. **Style Forum Drawer** - Apply Slate Monochrome
10. **Final Polish** - Animations and transitions

---

## Expected Results

After implementation:
1. Mentor and Student "Meus Espacos" are visually identical with full-width grids
2. MentorEspacoDetail uses same premium glassmorphism UI as Student
3. Mentors can select from 6 premium gradient themes or define custom colors
4. Theme changes persist to database and sync to all enrolled students
5. Ultra-wide monitors display 5 columns of cards
6. Discussion tab active for both roles in Espaco details
7. Forum drawer has professional Slate Monochrome theme
8. All transitions are smooth 300ms with fade effects
