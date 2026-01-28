-- Security Fix: Update submissions storage INSERT policy to enforce file ownership
-- This addresses STORAGE_EXPOSURE vulnerability where any authenticated user could upload to any path

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload submissions" ON storage.objects;

-- Create ownership-based INSERT policy (users can only upload to their own folders)
-- File path pattern: {assignmentId}/{userId}/{timestamp}.{ext}
CREATE POLICY "Users can upload own submissions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'submissions' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[2]
);