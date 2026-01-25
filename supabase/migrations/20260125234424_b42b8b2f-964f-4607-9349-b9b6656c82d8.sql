-- Create storage bucket for espaco covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('espaco-covers', 'espaco-covers', true);

-- RLS policies for the bucket
CREATE POLICY "Anyone can read espaco covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'espaco-covers');

CREATE POLICY "Admins and mentors can upload covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'espaco-covers' AND
    (SELECT is_admin_or_mentor(auth.uid()))
  );

CREATE POLICY "Admins and mentors can update covers"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'espaco-covers' AND (SELECT is_admin_or_mentor(auth.uid())));

CREATE POLICY "Admins and mentors can delete covers"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'espaco-covers' AND (SELECT is_admin_or_mentor(auth.uid())));