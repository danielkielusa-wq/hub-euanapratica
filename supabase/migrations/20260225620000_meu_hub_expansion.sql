-- ============================================
-- Meu Hub Expansion: access_source, sessions, metadata + plan_feature_key
-- ============================================

-- 1. Expand user_hub_services
ALTER TABLE public.user_hub_services
  ADD COLUMN IF NOT EXISTS access_source TEXT NOT NULL DEFAULT 'purchase'
    CHECK (access_source IN ('purchase', 'plan', 'admin_grant', 'free')),
  ADD COLUMN IF NOT EXISTS sessions_total INT,
  ADD COLUMN IF NOT EXISTS sessions_used INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

-- 2. Retroactively mark all existing rows as 'purchase' (they were all manual/webhook inserts)
UPDATE public.user_hub_services SET access_source = 'purchase' WHERE access_source = 'purchase';
-- (no-op, just ensuring the default is set if column was already purchase)

-- 3. Add plan_feature_key to hub_services
--    Allows linking a service to a plan feature (e.g. 'resume_pass', 'title_translator')
ALTER TABLE public.hub_services
  ADD COLUMN IF NOT EXISTS plan_feature_key TEXT;

-- 4. Grants (in case they changed)
GRANT ALL ON public.user_hub_services TO authenticated, service_role;
GRANT ALL ON public.hub_services TO authenticated, service_role;
