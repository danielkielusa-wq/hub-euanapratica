-- ============================================================================
-- Content Visual Assets: Templates + Generated Assets + Storage Bucket
--
-- 1. content_visual_templates — carousel/thumbnail/cover template definitions
-- 2. content_assets — generated images linked to content_pieces
-- 3. content-assets storage bucket
-- ============================================================================

-- ── 1. content_visual_templates ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.content_visual_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('carousel', 'thumbnail', 'cover', 'story')),
    html_template TEXT NOT NULL,
    css TEXT NOT NULL DEFAULT '',
    variables JSONB DEFAULT '[]'::jsonb,
    colors JSONB DEFAULT '{}'::jsonb,
    fonts JSONB DEFAULT '{}'::jsonb,
    preview_url TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_visual_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access content_visual_templates"
  ON public.content_visual_templates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.content_visual_templates TO authenticated, service_role;

-- Updated_at trigger
CREATE TRIGGER set_content_visual_templates_updated_at
  BEFORE UPDATE ON public.content_visual_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 2. content_assets ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.content_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    piece_id UUID NOT NULL REFERENCES public.content_pieces(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('slide', 'thumbnail', 'cover')),
    template_id UUID REFERENCES public.content_visual_templates(id) ON DELETE SET NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    position INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_assets_piece ON public.content_assets(piece_id);

ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access content_assets"
  ON public.content_assets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.content_assets TO authenticated, service_role;

-- ── 3. Storage bucket ───────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-assets',
  'content-assets',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Public read content assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'content-assets');

-- Admin upload
CREATE POLICY "Admin upload content assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'content-assets'
    AND public.has_role(auth.uid(), 'admin')
  );

-- Admin update
CREATE POLICY "Admin update content assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'content-assets'
    AND public.has_role(auth.uid(), 'admin')
  );

-- Admin delete
CREATE POLICY "Admin delete content assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'content-assets'
    AND public.has_role(auth.uid(), 'admin')
  );

-- ── 4. Seed default carousel templates ──────────────────────────────────

INSERT INTO public.content_visual_templates (name, display_name, type, html_template, css, colors, fonts, is_default)
VALUES
(
  'dark_professional',
  'Dark Professional',
  'carousel',
  '<div class="slide">
  <div class="slide-number">{{slideNumber}}/{{totalSlides}}</div>
  <div class="heading">{{heading}}</div>
  <div class="content">{{content}}</div>
  <div class="brand">@eua_na_pratica</div>
</div>',
  '.slide {
  width: 1080px; height: 1080px; padding: 80px;
  display: flex; flex-direction: column; justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  font-family: "Inter", sans-serif; box-sizing: border-box; position: relative;
}
.heading {
  font-size: 52px; font-weight: 800; color: #f97316;
  margin-bottom: 32px; line-height: 1.2;
}
.content {
  font-size: 30px; color: #e2e8f0; line-height: 1.6;
}
.slide-number {
  position: absolute; top: 40px; right: 40px;
  font-size: 18px; color: #64748b; font-weight: 600;
}
.brand {
  position: absolute; bottom: 40px; left: 80px;
  font-size: 18px; color: #64748b; font-weight: 500;
}',
  '{"bg": "#0f172a", "text": "#e2e8f0", "accent": "#f97316", "secondary": "#64748b"}'::jsonb,
  '{"heading": "Inter", "body": "Inter"}'::jsonb,
  true
),
(
  'light_minimal',
  'Light Minimal',
  'carousel',
  '<div class="slide">
  <div class="slide-number">{{slideNumber}}/{{totalSlides}}</div>
  <div class="accent-bar"></div>
  <div class="heading">{{heading}}</div>
  <div class="content">{{content}}</div>
  <div class="brand">@eua_na_pratica</div>
</div>',
  '.slide {
  width: 1080px; height: 1080px; padding: 80px;
  display: flex; flex-direction: column; justify-content: center;
  background: #ffffff; font-family: "Inter", sans-serif;
  box-sizing: border-box; position: relative;
}
.accent-bar {
  width: 60px; height: 4px; background: #2563eb; margin-bottom: 24px;
}
.heading {
  font-size: 48px; font-weight: 800; color: #0f172a;
  margin-bottom: 28px; line-height: 1.2;
}
.content {
  font-size: 28px; color: #334155; line-height: 1.6;
}
.slide-number {
  position: absolute; top: 40px; right: 40px;
  font-size: 18px; color: #94a3b8; font-weight: 600;
}
.brand {
  position: absolute; bottom: 40px; left: 80px;
  font-size: 18px; color: #94a3b8; font-weight: 500;
}',
  '{"bg": "#ffffff", "text": "#334155", "accent": "#2563eb", "secondary": "#94a3b8"}'::jsonb,
  '{"heading": "Inter", "body": "Inter"}'::jsonb,
  false
),
(
  'brand_orange',
  'Brand Orange',
  'carousel',
  '<div class="slide">
  <div class="slide-number">{{slideNumber}}/{{totalSlides}}</div>
  <div class="heading">{{heading}}</div>
  <div class="content">{{content}}</div>
  <div class="brand">@eua_na_pratica</div>
</div>',
  '.slide {
  width: 1080px; height: 1080px; padding: 80px;
  display: flex; flex-direction: column; justify-content: center;
  background: linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%);
  font-family: "Inter", sans-serif; box-sizing: border-box; position: relative;
}
.heading {
  font-size: 52px; font-weight: 800; color: #ffffff;
  margin-bottom: 32px; line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.content {
  font-size: 30px; color: #fff7ed; line-height: 1.6;
}
.slide-number {
  position: absolute; top: 40px; right: 40px;
  font-size: 18px; color: rgba(255,255,255,0.6); font-weight: 600;
}
.brand {
  position: absolute; bottom: 40px; left: 80px;
  font-size: 18px; color: rgba(255,255,255,0.6); font-weight: 500;
}',
  '{"bg": "#f97316", "text": "#fff7ed", "accent": "#ffffff", "secondary": "rgba(255,255,255,0.6)"}'::jsonb,
  '{"heading": "Inter", "body": "Inter"}'::jsonb,
  false
)
ON CONFLICT (name) DO NOTHING;
