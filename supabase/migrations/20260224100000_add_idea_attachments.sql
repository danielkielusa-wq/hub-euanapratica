-- Add attachments JSONB column to business_ideas
ALTER TABLE public.business_ideas
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Create PRIVATE storage bucket for idea attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'idea-attachments',
  'idea-attachments',
  false,
  10485760, -- 10MB per file
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: path convention is {ideaId}/{timestamp}_{safeName}

-- INSERT: any authenticated user can upload
CREATE POLICY "Authenticated users can upload idea attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'idea-attachments');

-- SELECT: idea owner or admin/mentor
CREATE POLICY "Idea owner or admin can read idea attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'idea-attachments'
  AND (
    EXISTS (
      SELECT 1 FROM public.business_ideas
      WHERE id::text = (storage.foldername(name))[1]
        AND user_id = auth.uid()
    )
    OR is_admin_or_mentor(auth.uid())
  )
);

-- DELETE: idea owner or admin/mentor
CREATE POLICY "Idea owner or admin can delete idea attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'idea-attachments'
  AND (
    EXISTS (
      SELECT 1 FROM public.business_ideas
      WHERE id::text = (storage.foldername(name))[1]
        AND user_id = auth.uid()
    )
    OR is_admin_or_mentor(auth.uid())
  )
);
