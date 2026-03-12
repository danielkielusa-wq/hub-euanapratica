-- ============================================================================
-- Content Social Publishing: OAuth accounts + Publications + Scheduling
--
-- 1. social_accounts — connected LinkedIn/X accounts with encrypted tokens
-- 2. content_publications — scheduled/published posts linked to content_pieces
-- 3. app_configs seeds for OAuth credentials
-- 4. cron job for scheduled publishing
-- ============================================================================

-- ── 1. social_accounts ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'x')),
    account_name TEXT,
    account_id TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    connected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one active account per platform
CREATE UNIQUE INDEX idx_social_accounts_active_platform
  ON public.social_accounts(platform) WHERE is_active = true;

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access social_accounts"
  ON public.social_accounts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.social_accounts TO authenticated, service_role;

CREATE TRIGGER set_social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 2. content_publications ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.content_publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    piece_id UUID NOT NULL REFERENCES public.content_pieces(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'x')),
    social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE SET NULL,
    post_text TEXT NOT NULL,
    media_asset_ids UUID[] DEFAULT '{}',
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    platform_post_id TEXT,
    platform_post_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_publications_piece ON public.content_publications(piece_id);
CREATE INDEX idx_publications_scheduled ON public.content_publications(scheduled_at)
  WHERE status = 'scheduled';
CREATE INDEX idx_publications_status ON public.content_publications(status);

ALTER TABLE public.content_publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access content_publications"
  ON public.content_publications FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.content_publications TO authenticated, service_role;

CREATE TRIGGER set_content_publications_updated_at
  BEFORE UPDATE ON public.content_publications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 3. App configs for OAuth ────────────────────────────────────────────

INSERT INTO public.app_configs (key, value, description) VALUES
  ('linkedin_client_id', '', 'LinkedIn OAuth App Client ID'),
  ('linkedin_client_secret', '', 'LinkedIn OAuth App Client Secret'),
  ('linkedin_redirect_uri', '', 'LinkedIn OAuth Redirect URI (auto-set on first connection)'),
  ('x_client_id', '', 'X/Twitter OAuth 2.0 Client ID'),
  ('x_client_secret', '', 'X/Twitter OAuth 2.0 Client Secret'),
  ('x_redirect_uri', '', 'X/Twitter OAuth Redirect URI (auto-set on first connection)')
ON CONFLICT (key) DO NOTHING;

-- ── 4. Cron job for scheduled publishing ────────────────────────────────

SELECT cron.schedule(
  'publish-scheduled-content',
  '*/5 * * * *',
  $$SELECT public.invoke_edge_function('publish-content', '{"mode": "cron"}'::jsonb);$$
);
