# ResumePass AI — Developer Documentation

**Last Updated:** 2026-02-19
**Audience:** Engineering team

---

## Quick Start

**Frontend entry point:**
```
src/pages/curriculo/CurriculoUSA.tsx
```

**Backend entry point:**
```
supabase/functions/analyze-resume/index.ts
```

**Core hook:**
```
src/hooks/useCurriculoAnalysis.ts
```

**Database migrations:**
```
supabase/migrations/20260127221741_*.sql  (plans, subscriptions, usage logs)
supabase/migrations/20260210100000_*.sql  (resumepass_reports table)
```

---

## System Architecture

```
User uploads PDF/DOCX
        ↓
File → temp-resumes bucket (Supabase Storage)
        ↓
Client calls analyze-resume edge function
        ↓
Edge function flow:
  1. Validate JWT auth
  2. Check quota (user_subscriptions + plans + usage_logs)
  3. Download file from temp-resumes
  4. Extract text (DOCX: XML parsing, PDF: base64 multimodal)
  5. Modify AI prompt based on plan features
  6. Call OpenAI Responses API (gpt-4.1-mini, strict JSON schema)
  7. Record usage to usage_logs (retry 3x with backoff)
  8. Return structured JSON result
        ↓
Client receives result → stores in localStorage
        ↓
Navigate to /curriculo/resultado
        ↓
Report page reads from localStorage → renders tabs
        ↓
Auto-save to resumepass_reports table (fire-and-forget)
```

---

## Database Schema

### Core Tables

#### `plans` (subscription tiers)
```sql
CREATE TABLE plans (
  id TEXT PRIMARY KEY,              -- 'basic', 'pro', 'vip'
  name TEXT NOT NULL,               -- 'Básico', 'Pro', 'VIP'
  monthly_limit INTEGER DEFAULT 1,
  features JSONB DEFAULT '{}',      -- Plan feature flags
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Seed data:**
| id | monthly_limit | features |
|----|---------------|----------|
| basic | 1 | `{ allow_pdf: false, show_improvements: false, show_cheat_sheet: false }` |
| pro | 10 | `{ allow_pdf: true, show_improvements: true, show_cheat_sheet: true, impact_cards: true }` |
| vip | 999 | All pro features + `priority_support: true` |

#### `user_subscriptions`
```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users,
  plan_id TEXT REFERENCES plans,
  status TEXT CHECK (status IN ('active', 'inactive', 'cancelled')),
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
```

#### `usage_logs` (quota tracking)
```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  app_id TEXT DEFAULT 'curriculo_usa',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Monthly quota = count rows WHERE `user_id = ? AND app_id = 'curriculo_usa' AND created_at >= start_of_month`

#### `resumepass_reports` (saved analyses)
```sql
CREATE TABLE resumepass_reports (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles,
  title TEXT DEFAULT '',               -- Auto: 'Resume Report - YYYY-MM-DD'
  report_data JSONB NOT NULL,          -- Full FullAnalysisResult object
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_resumepass_reports_user_id ON resumepass_reports(user_id);
CREATE INDEX idx_resumepass_reports_created_at ON resumepass_reports(created_at DESC);
```

### RPC Functions

#### `get_user_quota(p_user_id UUID)`
Returns current month's quota status:
```typescript
{
  plan_id: 'pro',
  plan_name: 'Pro',
  monthly_limit: 10,
  used_this_month: 3,
  remaining: 7,
  features: { allow_pdf: true, ... }
}
```

**Implementation:** LEFT JOINs user_subscriptions → plans, counts usage_logs for current month.

#### `record_curriculo_usage(p_user_id UUID)`
Inserts a row into `usage_logs`. Used by client-side fallback (edge function uses admin client directly).

---

## Data Flow

### Analysis Request Flow

**Client-side (useCurriculoAnalysis.ts):**
```typescript
1. Check quota.remaining > 0 (early exit for UX)
2. Upload file to temp-resumes bucket: {userId}/{timestamp}.{ext}
3. Call edge function with { filePath, jobDescription }
4. Delete temp file on completion
5. Handle LIMIT_REACHED (402 status)
6. Store result in localStorage key 'curriculo_analysis_result'
7. Auto-save to resumepass_reports (fire-and-forget)
8. Refetch quota
9. Navigate to /curriculo/resultado
```

**Server-side (analyze-resume edge function):**
```typescript
1. Validate JWT (supabase.auth.getUser)
2. Quota check:
   - Query user_subscriptions + plans
   - Count usage_logs for current month
   - If used >= monthly_limit → HTTP 402 LIMIT_REACHED
3. Validate file format (reject .doc, accept .pdf/.docx)
4. Download from temp-resumes bucket
5. Extract text:
   - DOCX: Unzip → parse word/document.xml → extract <w:t> tags
   - PDF: Convert to base64 (chunked 8KB to avoid stack overflow)
6. Load system prompt from app_configs.resume_analyzer_prompt
7. Feature stripping based on plan:
   if (!features.show_improvements)
     systemPrompt += "\n\nRETURN EMPTY ARRAY for 'improvements'"
8. Call OpenAI Responses API:
   - Model: gpt-4.1-mini
   - Strict JSON schema (10 required fields)
   - Content: job description + resume (text or base64 file)
9. Record usage with retry (3 attempts, exponential backoff):
   - Uses admin client (service_role key) to bypass RLS
   - If all retries fail → HTTP 500 USAGE_RECORDING_FAILED
10. Return structured JSON
```

### Report Display Flow

**Option 1: Immediate (after analysis)**
```
/curriculo/resultado
  ↓
Read localStorage['curriculo_analysis_result']
  ↓
Render ReportContent with 3 tabs
```

**Option 2: Saved (from history)**
```
/resumepass/report/:id
  ↓
useResumePassReport(id) hook
  ↓
Fetch from resumepass_reports WHERE id = ?
  ↓
Render ReportContent with 3 tabs
```

---

## TypeScript Types

```typescript
// src/types/curriculo.ts

interface FullAnalysisResult {
  header: {
    score: number;                    // 0-100 compatibility score
    status_tag: string;               // "COMPATIBILIDADE: ALTA"
    main_message: string;
    sub_message: string;
  };
  metrics: {
    ats_format: MetricItem;           // ATS compatibility
    keywords: KeywordsMetric;         // Keyword match ratio
    action_verbs: VerbsMetric;        // Action verb density
    brevity: BrevityMetric;           // Length (page count)
  };
  cultural_bridge: {
    brazil_title: string;             // "Engenheiro de Software"
    us_equivalent: string;            // "Software Engineer"
    explanation: string;
  };
  market_value: {
    range: string;                    // "$85k - $110k/yr"
    context: string;
  };
  power_verbs_suggestions: string[];  // 5-8 verbs
  improvements: Improvement[];        // 3-5 before/after cards
  linkedin_fix: {
    headline: string;
    reasoning_pt: string;
  };
  interview_cheat_sheet: InterviewQuestion[];  // 3-5 questions
  parsing_error?: boolean;
  parsing_error_message?: string;
}

interface MetricItem {
  score: number;
  label: string;
  details_pt: string;
}

interface Improvement {
  tags: string[];                     // ["QUANTIFICACAO", "LIDERANCA"]
  original: string;
  improved: string;
  impact_label: string;               // "IMPACTO", "CLAREZA"
}
```

**Error types:**
```typescript
type AnalysisErrorCode =
  | "UNSUPPORTED_FORMAT"    // .doc files
  | "EXTRACTION_FAILED"     // DOCX corrupted or unreadable
  | "INSUFFICIENT_CONTENT"  // <100 chars extracted
  | "AI_ERROR";             // OpenAI API failure
```

---

## Component Structure

```
pages/curriculo/
├── CurriculoUSA.tsx          Main upload page (/curriculo)
├── CurriculoReport.tsx       Report from localStorage
└── SavedReportPage.tsx       Report from DB by ID

components/curriculo/
├── ResumeUploadCard.tsx      File picker widget
├── JobDescriptionCard.tsx    Textarea for job desc
├── QuotaDisplay.tsx          "X/Y analyses remaining"
├── ReportHistory.tsx         List of saved reports
├── LockedFeature.tsx         Blur + lock overlay for gated content
├── UpgradeModal.tsx          Plan upgrade CTA
└── report/
    ├── ReportContent.tsx     Main tabbed report (3 tabs)
    ├── ReportHeader.tsx      Score banner + status tag
    ├── ScoreGauge.tsx        Circular gauge (0-100)
    ├── MetricsRow.tsx        4 metric cards
    ├── CulturalBridgeCard.tsx BR→US title translation
    ├── MarketValueCard.tsx   Salary estimate
    ├── PowerVerbsRow.tsx     Suggested verbs (gated)
    ├── ImprovementsSection.tsx  Before/after cards (gated)
    ├── LinkedInQuickFix.tsx  LinkedIn headline
    ├── InterviewCheatSheet.tsx  Questions + tips (gated)
    └── CriticalAlert.tsx     Warning for ATS score <50
```

---

## Feature Gating Implementation

### Frontend (LockedFeature component)
```typescript
<LockedFeature
  isLocked={!quota?.features.show_improvements}
  featureName="Sugestões de Melhoria"
  onUpgrade={() => setShowUpgradeModal(true)}
>
  <ImprovementsSection improvements={result.improvements} />
</LockedFeature>
```
Renders blurred content + lock overlay + upgrade button.

### Backend (Edge Function)
```typescript
// analyze-resume/index.ts line 147-157
if (!features.show_improvements) {
  systemPrompt += "\n\nIMPORTANT RESTRICTION: Return an EMPTY array [] for 'improvements'.";
}
```
Even if UI is bypassed, AI returns empty arrays for gated content.

### Double Protection
1. Frontend: Locks UI visibility
2. Backend: Forces empty data from AI

**⚠️ Known issue:** Prompt injection is not 100% reliable. AI may occasionally ignore the restriction. Recommended fix: add server-side post-processing to force-empty gated arrays.

---

## API Integration

### OpenAI Responses API

**Endpoint:** `https://api.openai.com/v1/responses`
**Model:** `gpt-4.1-mini`
**Format:** Strict JSON schema (additionalProperties: false)

**Request structure (PDF example):**
```json
{
  "model": "gpt-4.1-mini",
  "instructions": "<system_prompt>",
  "input": [{
    "role": "user",
    "content": [
      {
        "type": "input_text",
        "text": "DESCRICAO DA VAGA:\n<job_description>"
      },
      {
        "type": "input_file",
        "file_data": "<base64_pdf>",
        "filename": "resume.pdf"
      }
    ]
  }],
  "text": {
    "format": {
      "type": "json_schema",
      "name": "resume_analysis",
      "schema": { ... },
      "strict": true
    }
  }
}
```

**Error handling:**
- HTTP 429 → "Rate limit exceeded" (pass to client)
- HTTP 402 → "Payment required" (OpenAI credits depleted)
- Other → Generic "AI analysis failed"

**Response extraction:**
```typescript
const outputText = aiData.output?.[0]?.content?.[0]?.text;
const result = JSON.parse(outputText);
```

---

## File Processing

### DOCX Extraction
```typescript
// Uses zip.js library
const zipReader = new ZipReader(new BlobReader(blob));
const entries = await zipReader.getEntries();
const documentEntry = entries.find(e => e.filename === "word/document.xml");
const documentXml = await documentEntry.getData(new BlobWriter()).text();

// Extract <w:t> tags
const textMatches = documentXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
const extractedText = textMatches
  .map(match => match.replace(/<[^>]+>/g, ''))
  .join(' ')
  .replace(/\s+/g, ' ');
```

**Known limitation:** Tables, text boxes, headers/footers may be missed. Regex-based extraction.

### PDF Processing
```typescript
// Convert to base64 with chunked encoding (avoids stack overflow)
const uint8Array = new Uint8Array(arrayBuffer);
const chunkSize = 8192;
let binaryString = "";
for (let i = 0; i < uint8Array.length; i += chunkSize) {
  const chunk = uint8Array.subarray(i, i + chunkSize);
  binaryString += String.fromCharCode.apply(null, Array.from(chunk));
}
const pdfBase64 = btoa(binaryString);
```

Sent as `input_file` to OpenAI for multimodal processing.

---

## Quota & Usage Tracking

### Client-Side Check (UX)
```typescript
// useCurriculoAnalysis.ts:73
if (quota && quota.remaining <= 0) {
  setShowUpgradeModal(true);
  return; // Block before upload
}
```

### Server-Side Check (Security)
```typescript
// analyze-resume edge function:49-101
const { count: usageCount } = await supabase
  .from("usage_logs")
  .select("*", { count: "exact", head: true })
  .eq("user_id", userId)
  .eq("app_id", "curriculo_usa")
  .gte("created_at", startOfMonth.toISOString());

if (usageCount >= plan.monthly_limit) {
  return new Response(JSON.stringify({
    error_code: "LIMIT_REACHED",
    error_message: `Limite de ${plan.monthly_limit} análise(s) atingido.`
  }), { status: 402 });
}
```

### Usage Recording (Critical)
```typescript
// analyze-resume:561-627
const recordUsageWithRetry = async (uid, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { error } = await adminSupabase  // Uses service_role key
      .from('usage_logs')
      .insert({ user_id: uid, app_id: 'curriculo_usa' });

    if (!error) return true;

    // Exponential backoff: 200ms, 400ms, 800ms
    await new Promise(r => setTimeout(r, 200 * Math.pow(2, attempt)));
  }
  return false;
};

if (!usageRecorded) {
  // FAIL THE REQUEST — prevents free usage during DB issues
  return new Response(JSON.stringify({
    error_code: 'USAGE_RECORDING_FAILED'
  }), { status: 500 });
}
```

**Why admin client?** Bypasses RLS to ensure usage is always recorded, even if user permissions are misconfigured.

---

## Configuration Management

### System Prompt Storage
```sql
SELECT value FROM app_configs WHERE key = 'resume_analyzer_prompt';
```
Admin-editable via admin panel. Loaded dynamically on each analysis.

### API Keys
Managed via `apiConfigService.ts`:
```typescript
const openaiConfig = await getApiConfig("openai_api");
// Returns: { base_url, credentials: { api_key }, parameters, ... }
```

Fetches from `api_configs` table, falls back to `OPENAI_API_KEY` env var.

---

## Testing Scenarios

### Test Case 1: Free Tier Quota Exhaustion
1. Create user with `basic` plan (1/month)
2. Run 1 analysis → success
3. Run 2nd analysis → HTTP 402 LIMIT_REACHED
4. Verify `usage_logs` count = 1
5. Verify client shows "Upgrade" button

### Test Case 2: Feature Gating
1. Create user with `basic` plan
2. Run analysis
3. Verify `result.improvements` is empty array
4. Verify `result.interview_cheat_sheet` is empty array
5. Frontend should show locked overlay on Optimization/Preparation tabs

### Test Case 3: DOCX Extraction Failure
1. Upload corrupted DOCX (empty ZIP or missing document.xml)
2. Verify HTTP 400 `EXTRACTION_FAILED`

### Test Case 4: Usage Recording Retry
1. Temporarily break DB connection during analysis
2. Verify 3 retry attempts with exponential backoff
3. Verify HTTP 500 `USAGE_RECORDING_FAILED` if all fail

---

## Deployment Checklist

- [ ] `OPENAI_API_KEY` environment variable set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured (for usage recording)
- [ ] `temp-resumes` storage bucket created with RLS policies
- [ ] `app_configs.resume_analyzer_prompt` populated
- [ ] Plans seeded in `plans` table (basic, pro, vip)
- [ ] RLS policies enabled on all tables
- [ ] Edge function deployed: `supabase functions deploy analyze-resume`

---

## Known Issues & Tech Debt

1. **Single AI vendor dependency** — No fallback if OpenAI fails
2. **Feature stripping via prompt** — Not 100% reliable, needs server-side enforcement
3. **No file size validation** — Large files could cause timeouts
4. **Fire-and-forget report save** — User not notified if auto-save fails
5. **Orphaned temp files** — No cleanup job for failed uploads
6. **DOCX extraction is regex-based** — Complex formatting may be missed
7. **Duplicate quota logic** — Edge function reimplements `get_user_quota` RPC instead of calling it

---

## Performance Considerations

**Analysis latency breakdown:**
- File upload: ~1-2s (client → Supabase Storage)
- Edge function processing: ~5-15s
  - DOCX extraction: <1s
  - PDF base64 encoding: ~1-2s
  - OpenAI API call: 3-10s (varies by model load)
  - Usage recording: ~200ms (with retries)
- Report rendering: <500ms (client-side)

**Bottleneck:** OpenAI API call is the dominant factor.

**Optimization opportunities:**
- Cache common job descriptions + resume patterns
- Implement request batching if users analyze multiple resumes
- Consider cheaper models for Básico tier

---

## Security Notes

1. **Temp file RLS** — Verify `temp-resumes` bucket has policies preventing cross-user access
2. **Admin prompt editing** — `app_configs` admin access should be tightly controlled
3. **Service role key scope** — Currently used only for usage_logs inserts (appropriate)
4. **JWT validation** — Edge function validates on every request
5. **Client-side quota bypass** — Not exploitable due to server-side enforcement

---

## Monitoring Recommendations

1. **OpenAI API costs** — Track spend per analysis, alert on >$X/day
2. **Usage recording failures** — Alert on `USAGE_RECORDING_FAILED` errors
3. **Analysis success rate** — Track ratio of 200 vs 402/500 responses
4. **DOCX extraction failures** — Monitor `EXTRACTION_FAILED` rate
5. **Temp file cleanup** — Monitor `temp-resumes` bucket growth

---

## Local Development

```bash
# Start Supabase locally
supabase start

# Run edge function locally
supabase functions serve analyze-resume --env-file .env.local

# Test analysis
curl -X POST http://localhost:54321/functions/v1/analyze-resume \
  -H "Authorization: Bearer <user_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"filePath":"user123/test.pdf","jobDescription":"..."}'
```

**Required env vars for local testing:**
```
OPENAI_API_KEY=sk-...
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>
```
