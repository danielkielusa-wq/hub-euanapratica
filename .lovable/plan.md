
# Plan: Professional SaaS Admin - Subscription & User Management Redesign

## Overview

This plan redesigns the `/admin/assinaturas` page into a modern, high-end SaaS Admin Dashboard following the reference mockups provided. The design will feature a unified "Gestao de Usuarios" page with consumption tracking, slide-over drawer for user details, and real-time data synchronization.

## Current State Analysis

### Existing Components
- `AdminSubscriptions.tsx`: Basic table with plan dropdowns and reset functionality
- `AdminUsers.tsx`: Separate user management page with role/status controls
- `useAdminSubscriptions.ts`: Hook fetching users with usage data via RPC
- `StatCard.tsx`: Reusable stat card component with glass variant
- `UserAuditLogModal.tsx`: Existing audit log modal that can be repurposed

### Database Structure
- `usage_logs`: Tracks app usage per user (user_id, app_id, created_at)
- `plans`: Contains monthly_limit for each plan tier
- RPC `admin_get_users_with_usage`: Already aggregates user + plan + usage data

---

## Part 1: Page Layout & Design System

### 1.1 Background & Core Style
- Main background: `#F5F5F7` (bg-[#F5F5F7])
- Font family: Inter (already configured in Tailwind)
- Card containers: `rounded-[32px]` with `shadow-sm`
- Remove existing card backgrounds, use pure white cards

### 1.2 Header Section
```text
+----------------------------------------------------------+
| Gestao de Usuarios                        [Search Input] |
| Controle o consumo e as permissoes de cada conta         |
+----------------------------------------------------------+
```

### 1.3 Stat Cards Row (4 columns)
```text
+-------------+ +-------------+ +-------------+ +-------------+
|   Users     | |    Zap      | |   Crown     | |  BarChart   |
|   icon      | |   icon      | |   icon      | |   icon      |
|    127      | |     23      | |      8      | |    456      |
| Total Users | | Plano Pro   | | Plano VIP   | |  Analises   |
| +12% mes    | | +5% mes     | | +2% mes     | | +18% mes    |
+-------------+ +-------------+ +-------------+ +-------------+
```

Each card includes:
- Distinct icon (Users, Zap, Crown, BarChart4)
- Large bold value
- Label text
- Percentage trend indicator (calculated from data if available, else static)

---

## Part 2: User Table Design

### 2.1 Table Structure
```text
| USUARIO           | PLANO   | CONSUMO: CURRICULO USA | CONSUMO: JOBS | ACOES |
|-------------------|---------|------------------------|---------------|-------|
| [Avatar] Name     | [VIP]   | 45/∞  [=========]      | 12/∞ [====]   |  >    |
| email@test.com    | badge   | Blue progress bar      | Green bar     |       |
```

### 2.2 Column Specifications

**USUARIO Column:**
- Circular avatar with initials (Blue-600 background)
- Name in Slate-900, font-medium
- Email in Slate-500, text-sm

**PLANO Column:**
- Pill badges with distinct colors:
  - VIP: Gold/Amber background (`bg-amber-100 text-amber-700 border-amber-200`)
  - PRO: Blue background (`bg-blue-100 text-blue-700 border-blue-200`)
  - BASICO: Gray background (`bg-gray-100 text-gray-600 border-gray-200`)

**CONSUMO Columns:**
- Two separate columns for each app
- Counter format: `used/limit` (show ∞ for 999)
- Thin progress bar below (h-1.5)
- Blue-600 for Curriculo USA
- Emerald-500 for Jobs (future placeholder, show 0/0 for now)

**ACOES Column:**
- Chevron right icon (`>`) to indicate clickable row
- Entire row is clickable to open drawer

### 2.3 Row Interactivity
- Hover state: subtle background highlight
- Click anywhere on row opens the slide-over drawer

---

## Part 3: User Detail Slide-over Drawer

### 3.1 Drawer Structure (400px width)
```text
+------------------------------------------+
| [X]                                       |
| [Avatar]  Admin Teste                     |
|           admin@teste.com                 |
|                                           |
| +------------------+ +------------------+ |
| | PLANO ATUAL      | | STATUS           | |
| |      VIP         | |   • Ativo        | |
| +------------------+ +------------------+ |
|                                           |
| Uso Detalhado por App                     |
| +-----------------------------------------+
| | [FileText] Curriculo USA AI             |
| |   45  / ∞               ANALISES USADAS |
| |   [=========================]           |
| +-----------------------------------------+
| | [Briefcase] Job Marketplace             |
| |   12  / ∞               VAGAS APLICADAS |
| |   [==============]                      |
| +-----------------------------------------+
|                                           |
| [History] Historico de Atividades         |
| | [Check] Analise de CV: Senior React Dev |
| |         Curriculo USA • 25/05 14:20     |
| | [Check] Visualizacao de Empresa: Google |
| |         Job Marketplace • 24/05 10:15   |
|                                           |
| +-------------------+ +-------------------+
| | [Refresh] Resetar | |    Suspender     |
| |    Creditos       | |                  |
| +-------------------+ +-------------------+
+------------------------------------------+
```

### 3.2 Drawer Components

**Profile Header:**
- Large avatar (64px)
- Name in text-xl font-semibold
- Email in text-muted-foreground

**Info Cards (2-column grid):**
- Plan card: Label + large badge
- Status card: Label + status indicator with colored dot

**App Consumption Cards:**
- Icon + App name header
- Large counter (text-4xl font-bold)
- "/ limit" in muted text
- Label on right (ANALISES USADAS / VAGAS APLICADAS)
- Full-width progress bar

**Activity Feed:**
- Pull from `usage_logs` table, showing recent activities
- Each entry: Check icon + title + app name + timestamp
- Scrollable if many entries

**Action Buttons (Footer):**
- Primary: "Resetar Creditos" - Blue-600 background
- Secondary: "Suspender" - Outline/ghost variant

---

## Part 4: Technical Implementation

### 4.1 New/Modified Files

| File | Action | Description |
|------|--------|-------------|
| `src/pages/admin/AdminSubscriptions.tsx` | Rewrite | Complete redesign with new layout |
| `src/components/admin/subscriptions/UserDetailDrawer.tsx` | Create | Slide-over drawer component |
| `src/components/admin/subscriptions/AppConsumptionCard.tsx` | Create | Reusable app usage card |
| `src/components/admin/subscriptions/PlanBadge.tsx` | Create | Styled plan pill badge |
| `src/components/admin/subscriptions/UsageProgressBar.tsx` | Create | Thin colored progress bar |
| `src/hooks/useAdminSubscriptions.ts` | Extend | Add user activity logs fetching |

### 4.2 Data Flow

1. Page loads → `fetchUsers()` via RPC gets all users with usage
2. Stats calculated from users array
3. Table renders with real-time data
4. Row click → sets `selectedUser` state → opens drawer
5. Drawer fetches user's `usage_logs` for activity feed
6. Reset action → calls `resetUsage()` → refetches → drawer updates
7. Table updates reactively via React Query invalidation

### 4.3 Database Considerations

The current `usage_logs` table structure:
```
id | user_id | app_id | created_at
```

For the activity feed, we need to query:
```sql
SELECT ul.id, ul.app_id, ul.created_at 
FROM usage_logs ul 
WHERE ul.user_id = $1 
ORDER BY ul.created_at DESC 
LIMIT 10
```

Note: The activity feed currently only has basic log entries. For richer descriptions like "Analise de CV: Senior React Dev", we would need to extend the `usage_logs` table with a `metadata` JSONB column. For now, we'll display generic activity labels.

### 4.4 Color Palette

```text
Text Primary:    Slate-900 (#0f172a)
Text Secondary:  Slate-500 (#64748b)
Primary Action:  Blue-600 (#2563eb)
App Curriculo:   Blue-600 (#2563eb)
App Jobs:        Emerald-500 (#10b981)
VIP Badge:       Amber-100/700 (#fef3c7/#b45309)
PRO Badge:       Blue-100/700 (#dbeafe/#1d4ed8)
Basic Badge:     Gray-100/600 (#f3f4f6/#4b5563)
Background:      #F5F5F7
Card Background: White
```

---

## Part 5: Responsive Considerations

### Desktop (1280px+)
- Full table with all columns
- 4-column stat cards
- 400px drawer width

### Tablet (768px - 1279px)
- Condensed table (hide some columns)
- 2-column stat cards
- Full-width drawer

### Mobile (< 768px)
- Card-based user list instead of table
- Stacked stat cards (2x2 or 1 column)
- Full-screen drawer

---

## Part 6: Implementation Order

1. **Create component structure:**
   - UserDetailDrawer
   - AppConsumptionCard
   - PlanBadge
   - UsageProgressBar

2. **Redesign AdminSubscriptions.tsx:**
   - New background and layout
   - Enhanced stat cards with trend indicators
   - New table design with progress bars
   - Row click handler for drawer

3. **Wire up the drawer:**
   - Profile section
   - Plan and status cards
   - App consumption cards
   - Activity feed (basic version)
   - Action buttons

4. **Add real-time sync:**
   - Invalidate queries after actions
   - Drawer updates when data changes

---

## Technical Notes

### Dynamic Progress Bar Maximum
The progress bar maximum is already dynamically fetched from `plans.monthly_limit` via the `admin_get_users_with_usage` RPC. The UI will use:
```typescript
const usagePercent = user.monthly_limit === 999 
  ? Math.min((user.used_this_month / 100) * 100, 100) // Cap visual at 100%
  : (user.used_this_month / user.monthly_limit) * 100;
```

### Job Marketplace Placeholder
Since there's no Job Marketplace app yet, we'll show "0/0" with an empty progress bar for that column, preparing the UI for future expansion.

### Activity Feed Fallback
Without rich metadata, activity entries will display as:
- "Analise de curriculo realizada" for app_id = 'curriculo_usa'
- "Atividade registrada" for other apps
With timestamp from `created_at`

---

## Expected Outcome

The redesigned page will match the reference mockups with:
- Clean, modern SaaS aesthetic
- High-contrast, readable typography
- Intuitive progress visualization
- Smooth drawer interactions
- Real-time data synchronization
- Accessible and responsive design
