-- ============================================================
-- Title Translator System
-- Ferramenta de tradução de cargos BR → US
-- ============================================================

-- 1. Create title_translations table
CREATE TABLE IF NOT EXISTS public.title_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title_br_input VARCHAR(255) NOT NULL,
    area VARCHAR(100),
    responsibilities TEXT,
    years_experience INT,
    title_us_recommended VARCHAR(255),
    all_suggestions JSONB,
    credits_used INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.title_translations IS 'Stores title translation history for the Job Title Match tool';

-- 2. Indexes
CREATE INDEX idx_title_translations_user ON public.title_translations(user_id);
CREATE INDEX idx_title_translations_date ON public.title_translations(created_at DESC);

-- 3. RLS
ALTER TABLE public.title_translations ENABLE ROW LEVEL SECURITY;

-- Users can read their own translations
CREATE POLICY "Users can read own translations"
    ON public.title_translations FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own translations
CREATE POLICY "Users can insert own translations"
    ON public.title_translations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can read all translations
CREATE POLICY "Admins can read all translations"
    ON public.title_translations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Service role bypass (for edge functions)
CREATE POLICY "Service role full access"
    ON public.title_translations FOR ALL
    USING (auth.role() = 'service_role');

-- 4. Grant access
GRANT SELECT, INSERT ON public.title_translations TO authenticated;
GRANT ALL ON public.title_translations TO service_role;

-- 5. Seed app_configs for title translator prompt
INSERT INTO public.app_configs (key, value, description)
VALUES (
    'title_translator_prompt',
    'You are an expert in translating Brazilian job titles to US equivalents. You understand both the Brazilian corporate culture and the American job market deeply. Your translations must be practical, realistic, and based on actual job titles used by US companies.

Brazilian Title: {title_br}
Area: {area}
Responsibilities: {responsibilities}
Years of Experience: {years_experience}

Provide 3 US equivalent job titles, ranked by relevance and confidence.

For each title, provide:
1. The exact US title (string)
2. Confidence score (float 0-10)
3. Brief explanation of why this title is common in the US
4. Why this title fits this person''s profile specifically
5. List of 3-5 typical companies using this title (array of strings)
6. Salary range in USD per year (string format "$XX,000 - $XX,000")
7. A brief snippet (50-80 words) of what a typical job description would say for this role

Then provide:
- Which of the 3 titles you recommend most (string)
- Detailed reasoning for the recommendation (2-3 sentences)

Respond ONLY with valid JSON in this exact format:
{
  "suggestions": [
    {
      "title_us": "...",
      "confidence": 9.2,
      "explanation": "...",
      "why_this_fits": "...",
      "example_companies": ["...", "...", "..."],
      "salary_range": "$XX,000 - $XX,000",
      "example_jd_snippet": "..."
    }
  ],
  "recommended": "...",
  "reasoning": "..."
}

IMPORTANT:
- Titles must be real job titles used in the US market
- Salary ranges must be realistic for 2025 US market
- Companies must be real, well-known US companies
- Be specific and practical, avoid generic advice
- Confidence scores should reflect actual match quality',
    'Prompt usado pela IA para traduzir títulos de cargo BR → US'
)
ON CONFLICT (key) DO NOTHING;

-- 6. Seed app_configs for title translator API selection
INSERT INTO public.app_configs (key, value, description)
VALUES (
    'title_translator_api_config',
    'openai_api',
    'API config key (from api_configs table) used by the Title Translator tool. Options: openai_api, anthropic_api'
)
ON CONFLICT (key) DO NOTHING;

-- 7. Seed app_configs for title translator model
INSERT INTO public.app_configs (key, value, description)
VALUES (
    'title_translator_model',
    'gpt-4o-mini',
    'Model ID used by the Title Translator tool. E.g.: gpt-4o-mini, gpt-4o, claude-haiku-4-5-20251001'
)
ON CONFLICT (key) DO NOTHING;
