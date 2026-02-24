-- Business Ideas Kanban table
CREATE TABLE IF NOT EXISTS public.business_ideas (
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
  validation_method TEXT CHECK (validation_method IS NULL OR validation_method IN ('interview','landing_page','pre_sale','prototype')),
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

-- RLS
ALTER TABLE public.business_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ideas"
  ON public.business_ideas FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all ideas"
  ON public.business_ideas FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Grants
GRANT ALL ON public.business_ideas TO authenticated;
GRANT ALL ON public.business_ideas TO service_role;

-- Index for user lookups
CREATE INDEX idx_business_ideas_user ON public.business_ideas(user_id);
CREATE INDEX idx_business_ideas_user_col ON public.business_ideas(user_id, column_status);

-- Updated_at trigger
CREATE TRIGGER set_business_ideas_updated_at
  BEFORE UPDATE ON public.business_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
