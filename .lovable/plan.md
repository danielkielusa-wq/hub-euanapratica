
# Lead Report Import System - Implementation Plan

## Overview

This plan implements a complete Lead Report Import System with:
1. CSV bulk import for leads
2. Database storage with user creation/linking logic
3. Secure external report access with email verification
4. AI-powered report formatting
5. Admin UI with import functionality

---

## Database Schema

### New Table: `career_evaluations`

```sql
CREATE TABLE public.career_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Lead data from CSV
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  area TEXT,
  atuacao TEXT,
  trabalha_internacional BOOLEAN DEFAULT false,
  experiencia TEXT,
  english_level TEXT,
  objetivo TEXT,
  visa_status TEXT,
  timeline TEXT,
  family_status TEXT,
  income_range TEXT,
  investment_range TEXT,
  impediment TEXT,
  impediment_other TEXT,
  main_concern TEXT,
  
  -- Report content (raw from CSV)
  report_content TEXT NOT NULL,
  
  -- AI-formatted report (generated on-demand)
  formatted_report TEXT,
  formatted_at TIMESTAMPTZ,
  
  -- Access tracking
  access_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  first_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  
  -- Metadata
  imported_by UUID REFERENCES public.profiles(id),
  import_batch_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast token lookup
CREATE INDEX idx_career_evaluations_access_token ON career_evaluations(access_token);
CREATE INDEX idx_career_evaluations_email ON career_evaluations(email);
CREATE INDEX idx_career_evaluations_user_id ON career_evaluations(user_id);
```

### RLS Policies

```sql
-- Admins can manage all evaluations
CREATE POLICY "Admins can manage career_evaluations"
  ON career_evaluations FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Users can view their own evaluations
CREATE POLICY "Users can view own evaluations"
  ON career_evaluations FOR SELECT
  USING (user_id = auth.uid());
```

### New App Config Entry

```sql
INSERT INTO app_configs (key, value, description)
VALUES (
  'lead_report_formatter_prompt',
  '# Lead Report Formatter\n\nVocê é um formatador de relatórios de diagnóstico de carreira...',
  'Prompt de IA para formatar relatórios de diagnóstico de leads importados'
);
```

---

## Files to Create

### 1. Types (`src/types/leads.ts`)

```typescript
export interface LeadCSVRow {
  Nome: string;
  email: string;
  telefone?: string;
  Area?: string;
  Atuação?: string;
  'trabalha internacional'?: string;
  experiencia?: string;
  Englishlevel?: string;
  objetivo?: string;
  VisaStatus?: string;
  timeline?: string;
  FamilyStatus?: string;
  incomerange?: string;
  'investment range'?: string;
  impediment?: string;
  impedmentother?: string;
  'main concern'?: string;
  relatorio: string;
}

export interface CareerEvaluation {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  area?: string;
  atuacao?: string;
  trabalha_internacional?: boolean;
  experiencia?: string;
  english_level?: string;
  objetivo?: string;
  visa_status?: string;
  timeline?: string;
  family_status?: string;
  income_range?: string;
  investment_range?: string;
  impediment?: string;
  impediment_other?: string;
  main_concern?: string;
  report_content: string;
  formatted_report?: string;
  formatted_at?: string;
  access_token: string;
  first_accessed_at?: string;
  access_count: number;
  imported_by?: string;
  import_batch_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ImportResult {
  totalRows: number;
  newUsersCreated: number;
  reportsLinkedToExisting: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  email?: string;
  message: string;
}
```

### 2. Hook (`src/hooks/useLeadImport.ts`)

Handles CSV parsing, validation, and import logic:
- Parse CSV with proper encoding
- Validate emails and required fields
- Check existing users by email
- Create new users when needed
- Insert career evaluations
- Return detailed import summary

### 3. Admin Page (`src/pages/admin/AdminLeadsImport.tsx`)

Features:
- Drag-and-drop CSV upload zone
- Preview of parsed data before import
- Import button with progress
- Summary modal showing results
- Table of imported evaluations
- Design: 24px border-radius, glassmorphism cards

### 4. Edge Function (`supabase/functions/format-lead-report/index.ts`)

- Accepts evaluation ID and email for verification
- Uses Lovable AI to format raw report content
- Returns beautifully formatted markdown/HTML
- Caches formatted result in database

### 5. Public Report Page (`src/pages/report/PublicReport.tsx`)

- Route: `/report/:token`
- Gatekeeper: Email verification form
- Branded landing page design
- On successful verification: Display formatted report
- Sections based on reference images:
  - Greeting header with user name
  - "Diagnóstico de Prontidão" grid (4 cards)
  - "Método ROTA EUA™" visual
  - "Plano de Ação (3 Passos)"
  - "Recursos Recomendados"

### 6. Edge Function for Report Verification (`supabase/functions/verify-report-access/index.ts`)

- Validates token exists
- Checks email matches
- Updates access tracking
- Returns evaluation data or error

---

## Component Structure

```text
src/
├── pages/
│   ├── admin/
│   │   └── AdminLeadsImport.tsx      # New admin import page
│   └── report/
│       └── PublicReport.tsx          # Public gatekeeper + report view
├── components/
│   ├── admin/
│   │   └── leads/
│   │       ├── CSVUploadZone.tsx     # Drag-and-drop upload
│   │       ├── ImportPreview.tsx     # Data preview before import
│   │       ├── ImportSummaryModal.tsx # Results after import
│   │       └── LeadsTable.tsx        # List of imported leads
│   └── report/
│       ├── ReportGatekeeper.tsx      # Email verification form
│       ├── DiagnosticGrid.tsx        # 4-card metrics grid
│       ├── RotaMethod.tsx            # ROTA EUA visual
│       ├── ActionPlan.tsx            # 3 steps numbered list
│       └── RecommendedResources.tsx  # Resource chips + WhatsApp
├── hooks/
│   └── useLeadImport.ts              # CSV parsing and import logic
└── types/
    └── leads.ts                      # TypeScript types
```

---

## User Flows

### Admin Import Flow

```text
Admin clicks "Importar Leads" in admin area
           │
           ▼
Upload CSV file (drag-and-drop)
           │
           ▼
Preview parsed data (table with validation)
           │
           ▼
Click "Importar" button
           │
           ▼
For each row:
    ├── Validate email format
    ├── Check if user exists by email
    │      ├── YES: Link evaluation to user_id
    │      └── NO: Create user → Link evaluation
    └── Insert career_evaluation record
           │
           ▼
Show summary modal:
  - Total processed: X
  - New users created: Y
  - Linked to existing: Z
  - Errors: [list]
```

### External Report Access Flow

```text
User receives link: /report/abc123-uuid
           │
           ▼
Gatekeeper page loads (branded)
           │
           ▼
User enters email
           │
           ▼
Edge function verifies:
    ├── Token exists?
    ├── Email matches?
    │      ├── YES: Update access_count, return data
    │      └── NO: "Email não corresponde"
           │
           ▼
AI formats report (if not cached)
           │
           ▼
Display formatted report with sections:
  - Greeting with name
  - Diagnostic grid
  - ROTA method visualization
  - Action plan steps
  - Recommended resources
```

---

## Security Considerations

1. **RLS Policies**: Only admins can import; users see only their own evaluations
2. **Token-based access**: Non-sequential UUIDs prevent enumeration
3. **Email verification**: Must match to view report
4. **No auth required for public page**: Controlled by token + email combo
5. **Rate limiting**: Edge function should track access attempts

---

## Route Updates (`src/App.tsx`)

```typescript
// New routes
<Route path="/admin/leads" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminLeadsImport />
  </ProtectedRoute>
} />

<Route path="/report/:token" element={
  <PublicReport />
} />
```

---

## Admin Settings Integration

Add a new card in `AdminSettings.tsx` for the Lead Report Formatter prompt, following the same pattern as the resume analyzer prompt.

---

## Design Guidelines

Following the platform standards:
- **Border Radius**: 24px for cards, 12px for buttons
- **Font**: Inter (already configured)
- **Colors**: Primary gradient (Indigo-Purple), glassmorphism backgrounds
- **Cards**: White background, subtle shadow, rounded corners
- **Icons**: Lucide React icons throughout
- **Animations**: Subtle fade-in transitions

---

## Implementation Order

1. **Database migration**: Create `career_evaluations` table with RLS
2. **Types**: Define TypeScript interfaces
3. **Edge functions**: 
   - `format-lead-report` for AI formatting
   - `verify-report-access` for gatekeeper
4. **Hooks**: CSV parsing and import logic
5. **Admin UI**: Import page with upload, preview, summary
6. **Public report page**: Gatekeeper + formatted report display
7. **App Config**: Add formatter prompt to settings
8. **Routes**: Add new routes to App.tsx
9. **Navigation**: Add "Importar Leads" to admin sidebar

---

## Files Summary

| Category | Files |
|----------|-------|
| Database | 1 migration file |
| Types | `src/types/leads.ts` |
| Hooks | `src/hooks/useLeadImport.ts` |
| Pages | `src/pages/admin/AdminLeadsImport.tsx`, `src/pages/report/PublicReport.tsx` |
| Components | 8 new components in `admin/leads/` and `report/` |
| Edge Functions | `format-lead-report/index.ts`, `verify-report-access/index.ts` |
| Updates | `App.tsx` (routes), `AdminSettings.tsx` (new prompt card) |
