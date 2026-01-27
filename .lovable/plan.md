
# Currículo USA v3.0 - Complete SaaS Subscription Ecosystem

## Overview

This implementation creates a fully dynamic, database-driven SaaS subscription system with:
1. **Enhanced database schema** with marketing fields (price, display_features, cta_text, is_popular)
2. **Smart Gatekeeper edge function** that checks quotas, strips features, and returns 402 on limit
3. **Feature-gated UI** with blur/lock overlays on restricted sections
4. **Upgrade Modal** that dynamically fetches plans and redirects to WhatsApp
5. **Admin Subscriptions Dashboard** for user plan management

---

## Current State Analysis

### What Already Exists
- `plans` table with `id`, `name`, `monthly_limit`, `features`, `is_active`
- `user_subscriptions` table linking users to plans
- `usage_logs` table tracking API calls
- `get_user_quota()` and `record_curriculo_usage()` RPC functions
- `useSubscription` hook for frontend quota management
- Basic quota checking in `useCurriculoAnalysis`

### What Needs to Be Added
- Marketing columns in `plans` table (`price`, `display_features`, `cta_text`, `is_popular`)
- Edge function quota enforcement with feature stripping
- Report page feature gating with blur/lock UI
- Upgrade modal component
- Admin subscription management page

---

## Architecture

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                           SUBSCRIPTION ECOSYSTEM                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   ┌─────────────┐     ┌─────────────────┐     ┌─────────────────────────┐    │
│   │   plans     │ ──► │ user_subscripts │ ──► │      usage_logs         │    │
│   │ (tiers)     │     │ (user mapping)  │     │ (monthly tracking)      │    │
│   └─────────────┘     └─────────────────┘     └─────────────────────────┘    │
│          │                    │                          ▲                    │
│          │                    │                          │                    │
│          ▼                    ▼                          │                    │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                     analyze-resume (Edge Function)                   │    │
│   │  1. Check user plan & monthly_limit                                 │    │
│   │  2. Count usage_logs for current month                              │    │
│   │  3. If count >= limit → return 402 LIMIT_REACHED                    │    │
│   │  4. Check features JSONB → strip disabled features from AI call     │    │
│   │  5. On success → insert usage_log                                   │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                   │                                           │
│                                   ▼                                           │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                         Frontend UI                                  │    │
│   │                                                                      │    │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │    │
│   │  │  CurriculoUSA│  │CurriculoReport  │Upgrade Modal (Dynamic)   │   │    │
│   │  │  (Quota      │  │  (Feature    │  │  - Fetches plans         │   │    │
│   │  │   Display)   │  │   Gating)    │  │  - Shows pricing cards   │   │    │
│   │  └──────────────┘  └──────────────┘  │  - WhatsApp CTA          │   │    │
│   │                                       └──────────────────────────┘   │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                    Admin Dashboard (/admin/assinaturas)              │    │
│   │  - User list with current plan                                       │    │
│   │  - Change plan dropdown                                              │    │
│   │  - Reset usage button                                                │    │
│   │  - Usage statistics                                                  │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Database Enhancement

**Migration: Add marketing columns to `plans` table**

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `price` | numeric | 0 | Price in BRL |
| `display_features` | jsonb | '[]' | Array of marketing feature strings |
| `cta_text` | text | 'Escolher Plano' | Call-to-action button text |
| `is_popular` | boolean | false | Show "Popular" badge |

**Update seed data:**
```sql
UPDATE plans SET 
  price = 0, 
  display_features = '["1 análise por mês", "Score básico", "Métricas principais"]'::jsonb,
  cta_text = 'Plano Atual',
  is_popular = false
WHERE id = 'basic';

UPDATE plans SET 
  price = 47, 
  display_features = '["10 análises por mês", "Relatório completo", "Power Verbs", "Melhorias sugeridas", "LinkedIn Quick-Fix", "Exportar PDF"]'::jsonb,
  cta_text = 'Fazer Upgrade',
  is_popular = true
WHERE id = 'pro';

UPDATE plans SET 
  price = 97, 
  display_features = '["Análises ilimitadas", "Tudo do Pro", "Cheat Sheet de Entrevista", "Suporte prioritário"]'::jsonb,
  cta_text = 'Quero Ser VIP',
  is_popular = false
WHERE id = 'vip';
```

---

### Phase 2: Edge Function - Smart Gatekeeper

**File:** `supabase/functions/analyze-resume/index.ts`

**New Logic Flow:**

```typescript
// 1. Get user's subscription and plan
const { data: subData } = await supabase
  .from('user_subscriptions')
  .select('plan_id, plans(monthly_limit, features)')
  .eq('user_id', userId)
  .eq('status', 'active')
  .maybeSingle();

// Default to basic if no subscription
const plan = subData?.plans || { monthly_limit: 1, features: {} };
const features = plan.features as Record<string, boolean>;

// 2. Count usage this month
const { count } = await supabase
  .from('usage_logs')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('app_id', 'curriculo_usa')
  .gte('created_at', startOfMonth);

// 3. Check quota
if (count >= plan.monthly_limit) {
  return new Response(
    JSON.stringify({ 
      error_code: 'LIMIT_REACHED',
      error: 'Limite mensal atingido',
      plan_id: subData?.plan_id || 'basic',
      monthly_limit: plan.monthly_limit,
      used: count
    }),
    { status: 402, headers: corsHeaders }
  );
}

// 4. Modify AI instructions based on features
let modifiedPrompt = systemPrompt;
if (!features.show_improvements) {
  modifiedPrompt += "\n\nIMPORTANT: Return an empty array for 'improvements'.";
}
if (!features.show_cheat_sheet) {
  modifiedPrompt += "\n\nIMPORTANT: Return an empty array for 'interview_cheat_sheet'.";
}

// 5. After successful AI call, record usage
await supabase.from('usage_logs').insert({
  user_id: userId,
  app_id: 'curriculo_usa'
});
```

---

### Phase 3: Frontend - Feature Gating

**New Component:** `src/components/curriculo/LockedFeature.tsx`

```typescript
interface LockedFeatureProps {
  isLocked: boolean;
  featureName: string;
  children: React.ReactNode;
}

// Renders children with blur overlay and lock icon if locked
// On click, opens upgrade modal
```

**Design:**
```text
┌─────────────────────────────────────────────────────────────────┐
│                      [Content with blur-sm]                      │
│                                                                  │
│              ┌────────────────────────────────┐                  │
│              │     🔒  Recurso Premium        │                  │
│              │                                │                  │
│              │  Faça upgrade para desbloquear │                  │
│              │                                │                  │
│              │    [ Ver Planos ]              │                  │
│              └────────────────────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**CSS Classes:**
- Container: `relative`
- Blur layer: `blur-sm pointer-events-none`
- Overlay: `absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center`
- Lock card: `bg-white rounded-2xl shadow-xl p-6 text-center`

---

### Phase 4: Upgrade Modal

**New Component:** `src/components/curriculo/UpgradeModal.tsx`

**Features:**
- Dynamically fetches all active plans from `plans` table
- Displays price, display_features list, and is_popular badge
- CTA button uses cta_text from database
- WhatsApp link: `https://chat.whatsapp.com/I7Drkh80c1b9ULOmnwPOwg?plan={plan_id}`

**Design:**
```text
┌─────────────────────────────────────────────────────────────────────────┐
│                      ⚡ Potencialize Suas Análises                      │
│                                                                         │
│  ┌───────────────┐  ┌───────────────────────┐  ┌───────────────┐       │
│  │    BÁSICO     │  │        ⭐ PRO         │  │      VIP      │       │
│  │               │  │      (Popular)        │  │               │       │
│  │    Grátis     │  │      R$ 47/mês        │  │   R$ 97/mês   │       │
│  │               │  │                       │  │               │       │
│  │ • 1 análise   │  │ • 10 análises         │  │ • Ilimitado   │       │
│  │ • Score       │  │ • Relatório completo  │  │ • Tudo do Pro │       │
│  │ • Métricas    │  │ • Power Verbs         │  │ • Entrevista  │       │
│  │               │  │ • LinkedIn Fix        │  │ • Suporte VIP │       │
│  │               │  │ • PDF Export          │  │               │       │
│  │               │  │                       │  │               │       │
│  │ [Plano Atual] │  │ [ Fazer Upgrade ]     │  │[Quero Ser VIP]│       │
│  └───────────────┘  └───────────────────────┘  └───────────────┘       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 5: Report Page Integration

**File:** `src/pages/curriculo/CurriculoReport.tsx`

**Changes:**

1. **Fetch user's features** via `useSubscription` hook (extend to return features)
2. **Wrap gated sections** with `LockedFeature` component:
   - `ImprovementsSection` → locked if `!features.show_improvements`
   - `InterviewCheatSheet` → locked if `!features.show_cheat_sheet`
   - PDF Download button → locked if `!features.allow_pdf`
3. **Handle 402 errors** in `useCurriculoAnalysis`:
   - If status 402, open UpgradeModal automatically

**Updated Tab Structure:**
```typescript
// Tab 2: Otimização
<LockedFeature 
  isLocked={!features?.show_improvements} 
  featureName="Melhorias Sugeridas"
  onUpgrade={() => setShowUpgradeModal(true)}
>
  <ImprovementsSection ... />
</LockedFeature>

// Tab 3: Preparação > Interview Cheat Sheet
<LockedFeature 
  isLocked={!features?.show_cheat_sheet}
  featureName="Cheat Sheet de Entrevista"
  onUpgrade={() => setShowUpgradeModal(true)}
>
  <InterviewCheatSheet ... />
</LockedFeature>
```

---

### Phase 6: Admin Subscriptions Page

**New File:** `src/pages/admin/AdminSubscriptions.tsx`

**Features:**
- Table with all users showing: Name, Email, Plan, Usage (X/Y), Last Analysis
- Dropdown to change user's plan
- "Reset Usage" button to clear current month's logs
- Stats cards: Total Users, Pro Users, VIP Users, Analyses This Month

**Table Columns:**
| Column | Content |
|--------|---------|
| Usuário | Avatar + Name + Email |
| Plano | Badge (Basic/Pro/VIP) |
| Uso | Progress bar X/Y |
| Último Uso | Date |
| Ações | Change Plan dropdown, Reset button |

**RPC Function:** Create `admin_get_users_with_usage()` to fetch aggregated data

---

### Phase 7: Extend useSubscription Hook

**File:** `src/hooks/useSubscription.ts`

**Changes:**
- Add `features` to the returned UserQuota interface
- Add `fetchPlans()` method to get all available plans
- Return plan pricing data for the upgrade modal

**Updated Interface:**
```typescript
interface UserQuota {
  planId: string;
  planName: string;
  monthlyLimit: number;
  usedThisMonth: number;
  remaining: number;
  features: {
    allow_pdf: boolean;
    show_improvements: boolean;
    show_cheat_sheet: boolean;
    impact_cards: boolean;
    priority_support: boolean;
  };
}

interface Plan {
  id: string;
  name: string;
  price: number;
  monthlyLimit: number;
  displayFeatures: string[];
  ctaText: string;
  isPopular: boolean;
}
```

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| MIGRATE | Database | Add marketing columns to plans table |
| MODIFY | `supabase/functions/analyze-resume/index.ts` | Add quota check, feature stripping, usage logging |
| MODIFY | `src/hooks/useSubscription.ts` | Add features, fetchPlans() |
| CREATE | `src/components/curriculo/LockedFeature.tsx` | Blur/lock overlay component |
| CREATE | `src/components/curriculo/UpgradeModal.tsx` | Dynamic pricing modal |
| MODIFY | `src/pages/curriculo/CurriculoReport.tsx` | Integrate feature gating |
| MODIFY | `src/hooks/useCurriculoAnalysis.ts` | Handle 402 errors |
| CREATE | `src/pages/admin/AdminSubscriptions.tsx` | Admin subscription management |
| CREATE | `src/hooks/useAdminSubscriptions.ts` | Admin data fetching |
| MODIFY | `src/App.tsx` | Add /admin/assinaturas route |
| MODIFY | `src/components/layouts/DashboardLayout.tsx` | Add sidebar menu item |

---

## Security Considerations

1. **Admin Access**: Uses existing `user_roles` table with `has_role()` function - NO is_admin column needed
2. **RLS Policies**: 
   - `usage_logs`: Users can only read their own logs (already configured)
   - Admin functions use SECURITY DEFINER to bypass RLS
3. **Edge Function**: Validates JWT token before any operation
4. **No Client-Side Gating Only**: Edge function enforces limits server-side; UI gating is purely UX

---

## WhatsApp Integration

CTA buttons link to the provided WhatsApp group with plan context:
```
https://chat.whatsapp.com/I7Drkh80c1b9ULOmnwPOwg?text=Olá!%20Quero%20fazer%20upgrade%20para%20o%20plano%20{plan_name}
```

---

## Testing Checklist

1. **Quota Enforcement**
   - [ ] Basic user: 1 analysis → 2nd attempt returns 402
   - [ ] Pro user: 10 analyses work, 11th returns 402
   - [ ] VIP user: 999+ analyses work

2. **Feature Gating**
   - [ ] Basic: Improvements tab is blurred/locked
   - [ ] Basic: Interview Cheat Sheet is blurred/locked
   - [ ] Basic: PDF button shows upgrade prompt
   - [ ] Pro: All features unlocked except priority support
   - [ ] VIP: Everything unlocked

3. **Upgrade Modal**
   - [ ] Opens on 402 error
   - [ ] Opens when clicking locked features
   - [ ] Correctly displays plan data from database
   - [ ] WhatsApp link works with plan context

4. **Admin Dashboard**
   - [ ] Only accessible by admin role
   - [ ] Shows all users with usage stats
   - [ ] Plan change updates immediately
   - [ ] Reset usage clears current month logs
