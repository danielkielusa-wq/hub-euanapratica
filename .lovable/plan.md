

# Configurar Planos - Admin Interface & Dynamic Paywall System

## Overview

This implementation adds a new admin page `/admin/planos` for granular plan configuration matching the provided design reference, plus fixes the dynamic usage bars and ensures the report page respects all plan feature flags from the database.

---

## Current State Analysis

### What Already Exists
- **`plans` table**: Has columns `id`, `name`, `price`, `monthly_limit`, `features` (JSONB), `display_features` (JSONB), `cta_text`, `is_popular`, `is_active`
- **Feature flags in DB**: `allow_pdf`, `show_improvements`, `show_cheat_sheet`, `impact_cards`, `priority_support`
- **Admin Subscriptions page**: Lists users with usage bars (but uses hardcoded format)
- **Edge function**: Already checks quota and does feature stripping
- **LockedFeature component**: Already implements blur/lock overlay

### What Needs to Be Added/Fixed
1. **New Admin Page**: "Configurar Planos" with granular feature toggles matching the design
2. **Usage Bar Fix**: Make it dynamic based on actual `monthly_limit` from user's plan
3. **Multi-App Structure**: Organize features by app (Currículo USA, Job Marketplace future)
4. **Add Power Verbs toggle**: Missing from current features JSONB

---

## Design Reference Analysis

From the uploaded image:
- **Three cards** side-by-side: Plano Básico, Plano PRO (with "MAIS ESCOLHIDO" badge), Plano VIP (gold gradient header)
- **Fields per card**:
  - PREÇO MENSAL (R$) - Input/Select
  - LIMITE DE ANÁLISES/MÊS - Input/Select (or "Ilimitado")
  - FUNCIONALIDADES - Group of toggles organized by app
- **Currículo USA toggles**: Melhorias de Impacto, Power Verbs, Guia de Entrevistas, Exportar PDF
- **RECURSOS MARKETING** - Editable text field showing display_features
- **Save button** per card: "Salvar Configurações"

---

## Implementation Plan

### Phase 1: Database Enhancement

**Add Missing Feature Flag**

```sql
-- Add 'show_power_verbs' flag to features JSONB
UPDATE plans 
SET features = features || '{"show_power_verbs": false}'::jsonb 
WHERE id = 'basic';

UPDATE plans 
SET features = features || '{"show_power_verbs": true}'::jsonb 
WHERE id IN ('pro', 'vip');
```

**Update get_user_quota RPC to include all features**

The function already returns `features`, no changes needed.

---

### Phase 2: Admin Plan Configuration Page

**New File:** `src/pages/admin/AdminPlans.tsx`

**UI Structure:**
```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Configurar Planos                                          [ Atualizar Dashboard ] │
│  Defina os limites e funcionalidades de cada plano para os usuários.                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐    │
│  │  Plano Básico   │   │    ❖ MAIS ESCOLHIDO     │   │  ✦ Plano VIP            │    │
│  │                 │   │      Plano PRO          │   │  (gold gradient header)  │    │
│  │  PREÇO: R$0.00  │   │                         │   │                          │    │
│  │  LIMITE: 1      │   │  PREÇO: R$47.00         │   │  PREÇO: R$197.00         │    │
│  │                 │   │  LIMITE: 10             │   │  LIMITE: Ilimitado       │    │
│  │  FUNCIONALIDADES│   │                         │   │                          │    │
│  │  ──────────────  │   │  FUNCIONALIDADES       │   │  FUNCIONALIDADES         │    │
│  │  ○ Melhorias    │   │  ● Melhorias           │   │  ● Melhorias             │    │
│  │  ○ Power Verbs  │   │  ● Power Verbs         │   │  ● Power Verbs           │    │
│  │  ○ Guia Entrev. │   │  ○ Guia Entrev.        │   │  ● Guia Entrev.          │    │
│  │  ○ Exportar PDF │   │  ● Exportar PDF        │   │  ● Exportar PDF          │    │
│  │                 │   │                         │   │                          │    │
│  │  RECURSOS MKTG  │   │  RECURSOS MKTG         │   │  RECURSOS MKTG           │    │
│  │  [textarea]     │   │  [textarea]            │   │  [textarea]              │    │
│  │                 │   │                         │   │                          │    │
│  │ [Salvar Config] │   │ [Salvar Configurações] │   │ [Salvar Configurações]   │    │
│  └─────────────────┘   └─────────────────────────┘   └─────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Components for Each Plan Card:**
- Input for price (number with BRL formatting)
- Select for monthly_limit (1, 5, 10, 20, 50, 100, "Ilimitado" = 999)
- Section header "FUNCIONALIDADES"
- App group header "App: Currículo USA"
- Toggle rows with icons:
  - TrendingUp icon + "Melhorias de Impacto" (`show_improvements`)
  - Zap icon + "Power Verbs" (`show_power_verbs`)
  - GraduationCap icon + "Guia de Entrevistas" (`show_cheat_sheet`)
  - Download icon + "Exportar PDF" (`allow_pdf`)
- Future: App group "App: Job Marketplace" with placeholder toggles
- Textarea for marketing features (comma-separated, parsed to array)
- Save button

**State Management:**
```typescript
interface PlanConfig {
  id: string;
  name: string;
  price: number;
  monthly_limit: number;
  features: {
    show_improvements: boolean;
    show_power_verbs: boolean;
    show_cheat_sheet: boolean;
    allow_pdf: boolean;
    impact_cards: boolean;
    priority_support: boolean;
  };
  display_features: string[];
  is_popular: boolean;
}
```

**Save Logic:**
```typescript
const savePlanConfig = async (plan: PlanConfig) => {
  const { error } = await supabase
    .from('plans')
    .update({
      price: plan.price,
      monthly_limit: plan.monthly_limit,
      features: plan.features,
      display_features: plan.display_features,
    })
    .eq('id', plan.id);
  
  if (error) throw error;
  toast({ title: 'Plano atualizado!' });
};
```

---

### Phase 3: Fix Dynamic Usage Bars

**File:** `src/pages/admin/AdminSubscriptions.tsx`

**Current Problem:**
The usage bar shows `/1` for all users regardless of their actual plan limit.

**Fix:**
The `admin_get_users_with_usage` RPC already returns `monthly_limit` from the user's plan. The current code at line 239 already uses `user.monthly_limit`:
```tsx
/{user.monthly_limit === 999 ? '∞' : user.monthly_limit}
```

This appears to already be working correctly. I'll verify the RPC function returns the correct data.

---

### Phase 4: Update Subscription Hook & Report

**File:** `src/hooks/useSubscription.ts`

**Add `show_power_verbs` to features interface:**
```typescript
interface PlanFeatures {
  allow_pdf: boolean;
  show_improvements: boolean;
  show_power_verbs: boolean;  // NEW
  show_cheat_sheet: boolean;
  impact_cards: boolean;
  priority_support: boolean;
}
```

**File:** `src/pages/curriculo/CurriculoReport.tsx`

**Ensure Power Verbs respects feature flag:**
The `ImprovementsSection` component displays power verbs. We need to check if the feature is locked.

---

### Phase 5: Update Edge Function Feature Stripping

**File:** `supabase/functions/analyze-resume/index.ts`

**Add Power Verbs stripping:**
```typescript
if (!features.show_power_verbs) {
  systemPrompt += "\n\nIMPORTANT RESTRICTION: The user's plan does not include power verbs. Return an EMPTY array [] for the 'power_verbs_suggestions' field.";
}
```

---

### Phase 6: Navigation & Routes

**File:** `src/App.tsx`
- Add route for `/admin/planos`

**File:** `src/components/layouts/DashboardLayout.tsx`
- Add "Configurar Planos" menu item under CONFIGURAÇÕES section for admins

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| CREATE | `src/pages/admin/AdminPlans.tsx` | Plan configuration admin page |
| CREATE | `src/components/admin/plans/PlanConfigCard.tsx` | Reusable plan config card component |
| CREATE | `src/hooks/useAdminPlans.ts` | Hook for plan CRUD operations |
| MODIFY | `src/App.tsx` | Add /admin/planos route |
| MODIFY | `src/components/layouts/DashboardLayout.tsx` | Add sidebar menu item |
| MODIFY | `src/hooks/useSubscription.ts` | Add show_power_verbs to PlanFeatures |
| MODIFY | `src/pages/curriculo/CurriculoReport.tsx` | Gate Power Verbs section if needed |
| MODIFY | `supabase/functions/analyze-resume/index.ts` | Add power verbs feature stripping |
| MIGRATE | Database | Add show_power_verbs to features JSONB |

---

## Design Specifications (Matching Reference)

### Card Styling
- **Container**: `bg-white rounded-[24px] border border-border shadow-sm p-6`
- **PRO badge**: `absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs uppercase tracking-wider`
- **VIP header**: Gold gradient `bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-[24px] -mx-6 -mt-6 px-6 py-4 mb-6`
- **Section labels**: `text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2`
- **Inputs**: `rounded-xl border-border bg-muted/30`
- **Toggle rows**: `flex items-center justify-between py-2`
- **Save button**: Full width, `rounded-xl bg-primary text-white py-3 font-medium`

### Toggle Row Structure
```tsx
<div className="flex items-center justify-between py-2">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
      <Icon className="w-4 h-4 text-muted-foreground" />
    </div>
    <span className="text-sm font-medium">Feature Name</span>
  </div>
  <Switch checked={value} onCheckedChange={onChange} />
</div>
```

### Marketing Resources Field
```tsx
<div className="space-y-2">
  <div className="flex items-center gap-2">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      RECURSOS MARKETING
    </span>
    <Tooltip>
      <TooltipTrigger>
        <Info className="w-3 h-3 text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent>
        Bullets que aparecem na página de preços
      </TooltipContent>
    </Tooltip>
  </div>
  <Input 
    value={displayFeatures.join(', ')}
    onChange={(e) => setDisplayFeatures(e.target.value.split(',').map(s => s.trim()))}
    className="rounded-xl text-sm"
    placeholder="[Feature 1, Feature 2, ...]"
  />
</div>
```

---

## Feature Mapping

| UI Toggle | DB Feature Key | Edge Function Param |
|-----------|----------------|---------------------|
| Melhorias de Impacto | `show_improvements` | strips `improvements` |
| Power Verbs | `show_power_verbs` | strips `power_verbs_suggestions` |
| Guia de Entrevistas | `show_cheat_sheet` | strips `interview_cheat_sheet` |
| Exportar PDF | `allow_pdf` | (frontend only) |

---

## Summary

1. **AdminPlans.tsx**: New admin page with three cards matching the design
2. **Database migration**: Add `show_power_verbs` feature flag
3. **Edge function update**: Strip power verbs when not in plan
4. **Frontend gating**: Extend LockedFeature usage for Power Verbs section
5. **Routing**: Add `/admin/planos` route and sidebar item
6. **Usage bars**: Already dynamic - verify RPC returns correct limit

