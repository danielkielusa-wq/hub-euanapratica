-- Allow students to update their own last_access_at on user_espacos
-- This is needed so the engagement score "recency" dimension works correctly.
CREATE POLICY "Students can update own last_access_at"
ON public.user_espacos FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
