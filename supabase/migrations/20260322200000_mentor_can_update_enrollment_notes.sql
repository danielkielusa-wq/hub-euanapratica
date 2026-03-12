-- Allow mentors to update enrollment fields (notes, status) for students in their own espacos
CREATE POLICY "Mentors can update enrollments in own espacos"
ON public.user_espacos FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.espacos
    WHERE espacos.id = user_espacos.espaco_id
      AND espacos.mentor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.espacos
    WHERE espacos.id = user_espacos.espaco_id
      AND espacos.mentor_id = auth.uid()
  )
);
