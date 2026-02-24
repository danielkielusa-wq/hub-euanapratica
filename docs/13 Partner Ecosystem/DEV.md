# Partner Ecosystem & Idea Kanban — Developer Reference

**Date:** 2026-02-23
**Status:** Implemented — Kanban migrated from localStorage to Supabase

---

## Architecture Overview

```
┌─────────────────────┐     ┌──────────────────────────┐
│  AdminIdeaKanban.tsx │────▶│  useAdminIdeas.ts (hook)  │
│  (React + DnD UI)   │     │  TanStack Query + Supabase│
└─────────────────────┘     └────────────┬─────────────┘
                                         │
                                         ▼
                            ┌──────────────────────────┐
                            │  Supabase PostgREST       │
                            │  table: business_ideas    │
                            │  RLS: admin + own user    │
                            └────────────┬─────────────┘
                                         │
                            ┌──────────────────────────┐
                            │  PostgreSQL               │
                            │  16 seed ideas (partner   │
                            │  ecosystem strategy)      │
                            └──────────────────────────┘
```

---

## Key Files

| File | Purpose |
|---|---|
| `src/pages/admin/AdminIdeaKanban.tsx` | Kanban UI — columns, cards, drag-and-drop, edit drawer |
| `src/hooks/useAdminIdeas.ts` | Supabase CRUD hook — useQuery, useMutation, optimistic updates |
| `supabase/migrations/20260223210000_create_business_ideas.sql` | Table DDL, RLS policies, grants, indexes, trigger |
| `supabase/migrations/20260223220000_seed_partner_ecosystem_ideas.sql` | 16 seed ideas from partner ecosystem strategy |
| `src/App.tsx` | Route: `/admin/idea-kanban` with `ProtectedRoute allowedRoles=['admin']` |
| `src/components/layouts/SidebarNav.tsx` | Sidebar link under "GESTAO DO NEGOCIO" |

---

## Database Schema

### Table: `public.business_ideas`

```sql
CREATE TABLE public.business_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  column_status TEXT NOT NULL DEFAULT 'spark'
    CHECK (column_status IN ('spark','qualified','validated','designed','active','parked')),

  -- Core fields (always visible)
  name TEXT NOT NULL DEFAULT 'Untitled Idea',
  one_liner TEXT DEFAULT '',
  problem TEXT DEFAULT '',
  persona TEXT DEFAULT '',
  interest_score INTEGER DEFAULT 0 CHECK (interest_score >= 0 AND interest_score <= 5),
  tags TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  existing_assets TEXT DEFAULT '',

  -- Qualification layer (column_status >= qualified)
  market_size TEXT CHECK (market_size IS NULL OR market_size IN ('niche','growing','massive')),
  competition TEXT CHECK (competition IS NULL OR competition IN ('none','crowded','blue_ocean')),
  unfair_advantage TEXT DEFAULT '',
  distribution_hypothesis TEXT DEFAULT '',
  revenue_model TEXT DEFAULT '',

  -- Validation layer (column_status >= validated)
  validation_method TEXT CHECK (validation_method IS NULL OR validation_method IN
    ('interview','landing_page','pre_sale','prototype')),
  signals_collected TEXT DEFAULT '',
  strongest_objection TEXT DEFAULT '',
  kill_criteria TEXT DEFAULT '',

  -- Design layer (column_status >= designed)
  pricing_model TEXT DEFAULT '',
  mvp_scope TEXT DEFAULT '',
  key_metric TEXT DEFAULT '',
  integrations TEXT DEFAULT '',

  -- Gate answers
  gate_answers JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies

```sql
-- Users manage own ideas
CREATE POLICY "Users manage own ideas"
  ON public.business_ideas FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins manage all ideas
CREATE POLICY "Admins manage all ideas"
  ON public.business_ideas FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
```

### Grants

```sql
GRANT ALL ON public.business_ideas TO authenticated;
GRANT ALL ON public.business_ideas TO service_role;
```

### Indexes

```sql
CREATE INDEX idx_business_ideas_user ON public.business_ideas(user_id);
CREATE INDEX idx_business_ideas_user_col ON public.business_ideas(user_id, column_status);
```

### Trigger

```sql
CREATE TRIGGER set_business_ideas_updated_at
  BEFORE UPDATE ON public.business_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Hook: `useAdminIdeas.ts`

### Exports

```typescript
export interface BusinessIdea {
  id: string;
  user_id: string;
  column_status: string;
  name: string;
  one_liner: string;
  problem: string;
  persona: string;
  interest_score: number;
  tags: string[];
  notes: string;
  existing_assets: string;
  market_size: string | null;
  competition: string | null;
  unfair_advantage: string;
  distribution_hypothesis: string;
  revenue_model: string;
  validation_method: string | null;
  signals_collected: string;
  strongest_objection: string;
  kill_criteria: string;
  pricing_model: string;
  mvp_scope: string;
  key_metric: string;
  integrations: string;
  gate_answers: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export type BusinessIdeaInsert = Omit<BusinessIdea, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type BusinessIdeaUpdate = Partial<BusinessIdeaInsert> & { id: string };
```

### Hook Return

```typescript
{
  ideas: BusinessIdea[];          // All ideas (admin sees all via RLS)
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  createIdea: (idea: BusinessIdeaInsert) => Promise<BusinessIdea>;
  updateIdea: (update: BusinessIdeaUpdate) => Promise<BusinessIdea>;
  deleteIdea: (id: string) => Promise<void>;
  moveCard: (args: { id: string; column_status: string }) => void;  // Optimistic
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}
```

### Query Key

```typescript
const QUERY_KEY = 'admin-business-ideas';
```

### Optimistic Updates

The `moveCard` mutation uses TanStack Query's optimistic update pattern for instant drag-and-drop feedback:

1. `onMutate`: Cancels in-flight queries, snapshots current data, updates cache immediately
2. `onError`: Rolls back to snapshot if the Supabase update fails
3. `onSettled`: Invalidates query to re-fetch authoritative data

---

## Component: `AdminIdeaKanban.tsx`

### Field Naming Convention

The component uses **snake_case** field names matching the database schema directly. No camelCase mapping layer.

### Progressive Field Unlocking

Fields unlock based on `column_status`:

```
All columns   -> name, one_liner, problem, persona, interest_score, tags
Qualified+    -> market_size, competition, unfair_advantage, distribution_hypothesis, revenue_model
Validated+    -> validation_method, signals_collected, strongest_objection, kill_criteria
Designed+     -> pricing_model, mvp_scope, key_metric, integrations
```

### Tags

12 available tags (updated to support partner ecosystem):

| Tag | Use Case |
|---|---|
| SaaS | Software products |
| Marketplace | Two-sided platforms |
| Content | Content-driven |
| B2B | Business-to-business |
| B2C | Business-to-consumer |
| AI/ML | AI/Machine Learning |
| **Affiliate** | Affiliate/referral partnerships |
| **LeadGen** | Lead generation services |
| Service | Service-based |
| Community | Community-driven |
| **Data** | Data products/intelligence |
| **Ads** | Advertising/sponsored content |

### Health Dot

Calculated over unlocked fields for the card's current column:

| Color | Threshold |
|---|---|
| Red `#EF4444` | < 40% fields filled |
| Amber `#F59E0B` | 40-80% fields filled |
| Green `#10B981` | > 80% fields filled |

### Drag & Drop

HTML5 Drag and Drop API. Drag state is in `useRef` (no re-renders during drag). Drop triggers optimistic `moveCard` mutation.

---

## Seed Data: 16 Partner Ecosystem Ideas

Migration `20260223220000_seed_partner_ecosystem_ideas.sql` inserts 16 ideas assigned to the first admin user.

```sql
-- Retrieves admin user for seed ownership
SELECT ur.user_id INTO admin_uid
  FROM public.user_roles ur
  WHERE ur.role = 'admin'
  LIMIT 1;
```

### Ideas by Revenue Channel

| # | Name | Tags | Interest | Channel |
|---|---|---|---|---|
| 1 | Affiliate: Escolas de Ingles | Affiliate, B2C | 4 | Affiliate |
| 2 | Affiliate: Advogados de Imigracao | Affiliate, B2B | 5 | Affiliate |
| 3 | Affiliate: Servicos de Curriculo | Affiliate, B2C | 3 | Affiliate |
| 4 | Affiliate: Credenciamento US (WES/ECE) | Affiliate, B2B | 3 | Affiliate |
| 5 | Affiliate: Servicos de Relocacao | Affiliate, Service | 3 | Affiliate |
| 6 | Affiliate: LinkedIn Coaching | Affiliate, Service | 3 | Affiliate |
| 7 | B2B Lead Marketplace | B2B, LeadGen | 5 | Lead Sales |
| 8 | Native Advertising nos Touchpoints de IA | Ads, B2B | 4 | Advertising |
| 9 | Sponsored Learning Spaces (Espacos) | B2B, Content | 4 | Advertising |
| 10 | Sponsored Prime Jobs | Ads, B2B | 3 | Advertising |
| 11 | Co-Branded Career Evaluation Funnels | LeadGen, B2B | 5 | LGaaS |
| 12 | API Access & Partner Dashboards | LeadGen, B2B, SaaS | 3 | LGaaS |
| 13 | External Mentor Marketplace | Marketplace, Service | 5 | Marketplace |
| 14 | Partner Program Tiers | B2B | 4 | Structure |
| 15 | Data & Intelligence Products | Data, B2B | 3 | Data |

Each seed idea includes: `name`, `one_liner`, `problem`, `persona`, `interest_score`, `tags`, `notes`, `existing_assets`, `revenue_model`.

---

## Migration from localStorage

The previous implementation used `localStorage` with key `idea-kanban-data`. The migration involved:

1. **Removed:** `localStorage.getItem/setItem`, `seedData()`, `blankIdea()`, `uid()`, `STORAGE_KEY`
2. **Added:** `useAdminIdeas()` hook import, `blankInsert()` factory
3. **Changed:** All field names from camelCase to snake_case (`oneLiner` -> `one_liner`, `interestScore` -> `interest_score`, `column` -> `column_status`)
4. **Added:** Loading state with `Loader2` spinner
5. **Added:** `disabled` state on buttons during mutations
6. **Added:** 4 new tags: Affiliate, LeadGen, Data, Ads
7. **Removed:** Hardware, Mobile tags (not relevant to partner ecosystem)

> The `manage-ideas` Edge Function referenced in the old docs is **no longer needed** — the component now queries Supabase PostgREST directly via the hook.

---

## Troubleshooting

### No ideas showing up

```sql
-- Check if table has data
SELECT count(*), column_status FROM business_ideas GROUP BY column_status;

-- Check RLS — run as the admin user
SELECT * FROM business_ideas LIMIT 5;
```

If zero rows: the seed migration may not have found an admin user. Check:

```sql
SELECT user_id, role FROM user_roles WHERE role = 'admin' LIMIT 1;
```

### "Permission denied" error

Ensure grants exist:

```sql
GRANT ALL ON public.business_ideas TO authenticated;
GRANT ALL ON public.business_ideas TO service_role;
```

### Drag-and-drop not persisting

The `moveCard` mutation fires a Supabase update. If it fails silently, check:

1. Network tab for 4xx/5xx from PostgREST
2. RLS policy — user must be admin or idea owner
3. `column_status` CHECK constraint — value must be one of: `spark`, `qualified`, `validated`, `designed`, `active`, `parked`

### Enum fields saving as empty string instead of NULL

The component sends `null` for empty enum selects (`market_size`, `competition`, `validation_method`). If you see empty strings, check the `onChange` handler — it should use `e.target.value || null`.

---

## Deployment Checklist

```bash
# 1. Push migrations (table + seed data)
npx supabase db push --include-all

# 2. Regenerate types
npx supabase gen types typescript --project-id seqgnxynrcylxsdzbloa > src/integrations/supabase/types.ts

# 3. Build
npm run build

# 4. No Edge Function deploy needed — uses PostgREST directly
```

---

## Extending: Adding New Seed Ideas

To add more ideas via migration:

```sql
DO $$
DECLARE
  admin_uid UUID;
BEGIN
  SELECT ur.user_id INTO admin_uid
    FROM public.user_roles ur WHERE ur.role = 'admin' LIMIT 1;

  INSERT INTO public.business_ideas
    (user_id, column_status, name, one_liner, problem, persona, interest_score, tags, notes, existing_assets, revenue_model)
  VALUES
  (
    admin_uid, 'spark',
    'Your Idea Name',
    'One-liner description',
    'Problem statement',
    'Target persona',
    4,  -- interest_score 0-5
    ARRAY['B2B', 'SaaS'],  -- tags
    'Notes and implementation details',
    'Existing platform assets that support this',
    'Revenue model description'
  );
END $$;
```

## Extending: Adding New Tags

Tags are defined in `AdminIdeaKanban.tsx` in the `TAGS` constant. Add new entries:

```typescript
const TAGS = [
  // ... existing tags
  { name: 'NewTag', bg: '#hex-bg', fg: '#hex-fg' },
] as const;
```

No database migration needed — tags are stored as `TEXT[]` and accept any string value.

---

*Generated 2026-02-23. Platform: hub-euanapratica.*
