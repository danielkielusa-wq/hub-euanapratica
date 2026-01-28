-- Security Fix: Update submissions storage bucket policies to enforce file ownership
-- This addresses STORAGE_EXPOSURE vulnerability where any authenticated user could access all files

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own submission files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own submission files" ON storage.objects;

-- Create ownership-based SELECT policy (users can view own files, admins/mentors can view all)
CREATE POLICY "Users can view own submissions or admins all"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'submissions' 
  AND (
    auth.uid()::text = (storage.foldername(name))[2]
    OR is_admin_or_mentor(auth.uid())
  )
);

-- Create ownership-based UPDATE policy (users can only update own files)
CREATE POLICY "Users can update own submission files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'submissions' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Create ownership-based DELETE policy (users can only delete own files)
CREATE POLICY "Users can delete own submission files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'submissions' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);