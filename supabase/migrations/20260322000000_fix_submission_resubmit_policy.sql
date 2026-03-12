-- Fix: Allow students to resubmit after mentor requests revision
-- The old policy blocked ALL updates when status='reviewed', but students need to
-- resubmit when review_result='revision' (mentor asked for changes).
DROP POLICY IF EXISTS "Students can update own submissions" ON public.submissions;

CREATE POLICY "Students can update own submissions"
ON public.submissions FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND (
    status != 'reviewed'
    OR review_result = 'revision'
  )
)
WITH CHECK (user_id = auth.uid());
