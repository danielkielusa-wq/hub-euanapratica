-- Add image_url column to community_posts
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for community images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-images',
  'community-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: any authenticated user can upload
CREATE POLICY "Authenticated users can upload community images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-images');

-- Anyone can read community images (public bucket)
CREATE POLICY "Anyone can read community images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'community-images');

-- Users can delete their own uploaded images
CREATE POLICY "Users can delete own community images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'community-images' AND (storage.foldername(name))[1] = auth.uid()::text);
