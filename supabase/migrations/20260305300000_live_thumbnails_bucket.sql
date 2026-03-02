-- Create storage bucket for live thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('live-thumbnails', 'live-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies
CREATE POLICY "Anyone can read live thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'live-thumbnails');

CREATE POLICY "Admins and mentors can upload live thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'live-thumbnails' AND
    (SELECT is_admin_or_mentor(auth.uid()))
  );

CREATE POLICY "Admins and mentors can update live thumbnails"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'live-thumbnails' AND (SELECT is_admin_or_mentor(auth.uid())));

CREATE POLICY "Admins and mentors can delete live thumbnails"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'live-thumbnails' AND (SELECT is_admin_or_mentor(auth.uid())));
