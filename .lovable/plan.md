

# Currículo USA v2.3 - Report Header Redesign & SaaS Infrastructure

## Part 1: Report Header Redesign

### Current Problem
The current `ReportHeader` component stacks elements vertically:
- Score gauge (large, centered)
- Status badge
- Main message
- Sub message

### Reference Design Analysis
From the uploaded image, the new layout should be:
- **Horizontal layout** with score wheel on the left, text content on the right
- Score wheel is **smaller** (~100px instead of 200px)
- Status badge appears **above** the main message (green pill badge)
- Main text is **left-aligned** with highlight on key word
- All content in a single row on desktop

### New Design Structure

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌───────────┐     ✦ COMPATIBILIDADE DE MERCADO: ALTA                       │
│  │           │                                                               │
│  │    82     │     Seu perfil é **muito competitivo**.                      │
│  │   SCORE   │                                                               │
│  │           │     Você superou 82% dos candidatos para esta vaga.          │
│  └───────────┘     Ajustando algumas palavras-chave e verbos de impacto,    │
│                    você pode chegar a 95%.                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Files to Modify

**1. `src/components/curriculo/report/ScoreGauge.tsx`**

Changes:
- Add `size` prop to control dimensions (default 200, compact 120)
- Add `compact` boolean prop for smaller variant
- Reduce pulse animation in compact mode
- Keep tooltip functionality

**2. `src/components/curriculo/report/ReportHeader.tsx`**

Changes:
- Convert from vertical flex to horizontal flex layout
- Position ScoreGauge on left (compact variant)
- Stack text content on right:
  - Status badge (top, small green pill)
  - Main message (large, with highlighted word)
  - Sub message (gray, smaller)
- Mobile: Stack vertically
- Desktop: Side-by-side layout using `md:flex-row`

### Design Tokens
- Card: `rounded-[24px]` (keeping existing)
- Background: White with subtle border
- Padding: `p-6 md:p-8`
- Score wheel size: 120px (compact)
- Gap between wheel and text: `gap-8`

---

## Part 2: SaaS Subscription Infrastructure

### Database Architecture

#### 1. Create `plans` Table

Stores the tiered subscription plans.

```sql
CREATE TABLE public.plans (
  id TEXT PRIMARY KEY,  -- 'basic', 'pro', 'vip'
  name TEXT NOT NULL,
  monthly_limit INTEGER NOT NULL DEFAULT 1,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);
```

**Initial Data:**
| id | name | monthly_limit | features |
|----|------|---------------|----------|
| basic | Básico | 1 | `{"allow_pdf": false, "show_cheat_sheet": false, "show_improvements": false}` |
| pro | Pro | 10 | `{"allow_pdf": true, "show_cheat_sheet": true, "show_improvements": true, "impact_cards": true}` |
| vip | VIP | 999 | `{"allow_pdf": true, "show_cheat_sheet": true, "show_improvements": true, "impact_cards": true, "priority_support": true}` |

**RLS Policies:**
- Anyone can read plans (public catalog)
- Only admins can insert/update/delete

---

#### 2. Create `user_subscriptions` Table

Links users to their subscription plan.

```sql
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)  -- One subscription per user
);
```

**RLS Policies:**
- Users can read their own subscription
- Only admins can insert/update/delete

---

#### 3. Create `usage_logs` Table

Tracks every successful analysis for quota enforcement.

```sql
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL DEFAULT 'curriculo_usa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**RLS Policies:**
- Users can read their own logs
- Only authenticated users can insert their own logs
- Admins can read all logs

---

#### 4. Create Helper Functions

**Function: Get User's Remaining Quota**
```sql
CREATE OR REPLACE FUNCTION public.get_user_quota(p_user_id UUID)
RETURNS TABLE (
  plan_id TEXT,
  plan_name TEXT,
  monthly_limit INTEGER,
  used_this_month INTEGER,
  remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(us.plan_id, 'basic'),
    COALESCE(p.name, 'Básico'),
    COALESCE(p.monthly_limit, 1),
    COUNT(ul.id)::INTEGER AS used,
    GREATEST(0, COALESCE(p.monthly_limit, 1) - COUNT(ul.id)::INTEGER) AS remaining
  FROM public.user_subscriptions us
  RIGHT JOIN (SELECT p_user_id AS user_id) u ON us.user_id = u.user_id
  LEFT JOIN public.plans p ON p.id = COALESCE(us.plan_id, 'basic')
  LEFT JOIN public.usage_logs ul ON ul.user_id = p_user_id 
    AND ul.app_id = 'curriculo_usa'
    AND ul.created_at >= date_trunc('month', now())
  GROUP BY us.plan_id, p.name, p.monthly_limit;
END;
$$;
```

**Function: Record Usage**
```sql
CREATE OR REPLACE FUNCTION public.record_curriculo_usage(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.usage_logs (user_id, app_id)
  VALUES (p_user_id, 'curriculo_usa');
  RETURN true;
END;
$$;
```

---

### Frontend Integration

#### 1. Create Hook: `useSubscription`

**File**: `src/hooks/useSubscription.ts`

```typescript
// Hook to fetch user's subscription status and quota
// - Fetches quota from RPC function
// - Returns: planId, planName, limit, used, remaining
// - isLoading state
// - Caches result for session
```

#### 2. Update Analysis Flow

**File**: `src/hooks/useCurriculoAnalysis.ts`

Changes:
- Before analysis, check user's remaining quota
- If quota is 0, show upgrade prompt toast
- After successful analysis, call `record_curriculo_usage` RPC
- Handle quota exceeded error gracefully

#### 3. Create Quota Display Component

**File**: `src/components/curriculo/QuotaDisplay.tsx`

Shows user's remaining analyses (e.g., "2/10 análises restantes este mês")

---

### Admin Controls

The system already has admin roles via `user_roles.role = 'admin'`. We'll leverage the existing `has_role()` function.

**Admin Capabilities:**
- View all user subscriptions
- Upgrade/downgrade user plans
- View usage statistics

---

## Implementation Order

### Phase 1: UI Redesign (Report Header)
1. Update `ScoreGauge.tsx` - Add compact prop
2. Update `ReportHeader.tsx` - Horizontal layout

### Phase 2: Database (SaaS Infrastructure)
1. Create `plans` table with initial data
2. Create `user_subscriptions` table
3. Create `usage_logs` table
4. Create helper functions

### Phase 3: Frontend Integration
1. Create `useSubscription` hook
2. Create `QuotaDisplay` component
3. Update `useCurriculoAnalysis` to check/record quota

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| MODIFY | `src/components/curriculo/report/ScoreGauge.tsx` | Add compact mode with configurable size |
| MODIFY | `src/components/curriculo/report/ReportHeader.tsx` | Horizontal layout matching reference |
| MIGRATE | Database | Create plans, user_subscriptions, usage_logs tables |
| CREATE | `src/hooks/useSubscription.ts` | Hook for quota management |
| CREATE | `src/components/curriculo/QuotaDisplay.tsx` | Display remaining analyses |
| MODIFY | `src/hooks/useCurriculoAnalysis.ts` | Integrate quota checking |

---

## Security Considerations

1. **Role-based access**: Admin checks use existing `has_role()` SECURITY DEFINER function
2. **RLS everywhere**: All new tables have RLS enabled
3. **No is_admin column**: Following the critical security warning, we use the existing `user_roles` table
4. **Server-side quota enforcement**: Usage is recorded via SECURITY DEFINER function

