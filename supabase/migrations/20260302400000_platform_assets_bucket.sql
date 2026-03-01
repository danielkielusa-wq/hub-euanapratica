-- ============================================================================
-- Platform Assets Storage Bucket + Logo Configuration
-- ============================================================================
-- Creates a public storage bucket for platform branding assets (logos, etc.)
-- and seeds app_configs entries for horizontal and square logos.
-- ============================================================================

-- 1. Create public storage bucket for platform assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'platform-assets',
  'platform-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policies

-- Anyone can read platform assets (public bucket)
CREATE POLICY "Public read platform assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'platform-assets');

-- Only admins can upload platform assets
CREATE POLICY "Admin upload platform assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'platform-assets'
    AND public.has_role(auth.uid(), 'admin')
  );

-- Only admins can update platform assets
CREATE POLICY "Admin update platform assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'platform-assets'
    AND public.has_role(auth.uid(), 'admin')
  );

-- Only admins can delete platform assets
CREATE POLICY "Admin delete platform assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'platform-assets'
    AND public.has_role(auth.uid(), 'admin')
  );

-- 3. Seed app_configs entries for logo URLs (empty = use static fallback)
INSERT INTO public.app_configs (key, value, description)
VALUES
  ('platform_logo_horizontal', '', 'URL do logo horizontal da plataforma (usado no sidebar, header, etc.)'),
  ('platform_logo_square', '', 'URL do logo quadrado da plataforma (usado como favicon, icone, etc.)')
ON CONFLICT (key) DO NOTHING;

-- 4. Allow anon (unauthenticated) to read platform branding configs
-- so login/public pages can show the custom logo
GRANT SELECT ON public.app_configs TO anon;

CREATE POLICY "Anon read platform branding configs"
  ON public.app_configs FOR SELECT
  TO anon
  USING (key LIKE 'platform_%');
