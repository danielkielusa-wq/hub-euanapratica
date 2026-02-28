-- Content Studio: Social Posts table for LinkedIn & X posts generated from scripts
-- This is the 4th stage of the pipeline: Insights → Ideas → Scripts → Social Posts

-- ── Table ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.content_social_posts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    script_id UUID NOT NULL REFERENCES public.content_scripts(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'x')),
    content TEXT NOT NULL,
    hashtags TEXT[] DEFAULT '{}',
    cta TEXT,
    tone TEXT NOT NULL DEFAULT 'professional'
        CHECK (tone IN ('professional','provocative','storytelling','data_driven','casual')),
    metadata JSONB DEFAULT '{}'::JSONB,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','review','approved','published')),
    scheduled_for DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_social_posts_script ON public.content_social_posts(script_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON public.content_social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled_for
    ON public.content_social_posts(scheduled_for)
    WHERE scheduled_for IS NOT NULL;

-- ── RLS (admin-only) ──────────────────────────────────────────────────────
ALTER TABLE public.content_social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_social_posts" ON public.content_social_posts FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- ── Grants ────────────────────────────────────────────────────────────────
GRANT ALL ON public.content_social_posts TO authenticated;
GRANT ALL ON public.content_social_posts TO service_role;

-- ── Updated_at trigger ────────────────────────────────────────────────────
CREATE TRIGGER update_content_social_posts_updated_at
    BEFORE UPDATE ON public.content_social_posts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Expand generation_type CHECK to include 'social_post' ─────────────────
DO $$
BEGIN
    ALTER TABLE public.content_generation_logs
        DROP CONSTRAINT IF EXISTS content_generation_logs_generation_type_check;
    ALTER TABLE public.content_generation_logs
        ADD CONSTRAINT content_generation_logs_generation_type_check
        CHECK (generation_type IN ('insights','ideas','script','hooks','pipeline','social_post'));
EXCEPTION WHEN others THEN
    RAISE NOTICE 'generation_type constraint update: %', SQLERRM;
END;
$$;

-- ── Seed app_configs ──────────────────────────────────────────────────────
INSERT INTO public.app_configs (key, value, description) VALUES
    ('content_studio_social_prompt', '', 'Prompt para geração de posts sociais (LinkedIn/X). Se vazio, usa prompt padrão.'),
    ('content_studio_social_api_key', '', 'API key override para social posts. Se vazio, usa content_studio_api_key.'),
    ('content_studio_auto_social_enabled', 'false', 'Se true, o pipeline automático gera social posts após roteiros. Default: false (não impacta pipeline existente).')
ON CONFLICT (key) DO NOTHING;
