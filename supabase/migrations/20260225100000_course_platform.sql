-- =============================================
-- Course Platform: Tables, RLS, Indexes, Seeds
-- =============================================

-- 1. Link hub_services to espacos (for course products)
ALTER TABLE public.hub_services
  ADD COLUMN IF NOT EXISTS espaco_id UUID REFERENCES espacos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hub_services_espaco
  ON public.hub_services(espaco_id) WHERE espaco_id IS NOT NULL;

-- 2. Unique constraint on user_espacos for upsert on enrollment
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_espacos_user_espaco_unique'
  ) THEN
    -- Remove duplicates first (keep earliest enrollment)
    DELETE FROM public.user_espacos a
    USING public.user_espacos b
    WHERE a.id > b.id
      AND a.user_id = b.user_id
      AND a.espaco_id = b.espaco_id;

    ALTER TABLE public.user_espacos
      ADD CONSTRAINT user_espacos_user_espaco_unique UNIQUE (user_id, espaco_id);
  END IF;
END $$;

-- 3. Course Modules
CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  espaco_id UUID NOT NULL REFERENCES espacos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read published modules"
  ON public.course_modules FOR SELECT TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage modules"
  ON public.course_modules FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_course_modules_espaco
  ON public.course_modules(espaco_id, display_order);

GRANT ALL ON public.course_modules TO authenticated;
GRANT ALL ON public.course_modules TO service_role;

-- 4. Course Lessons
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_html TEXT,
  video_url TEXT,
  bunny_video_id TEXT,
  video_duration_seconds INTEGER,
  video_status TEXT DEFAULT 'pending'
    CHECK (video_status IN ('pending','processing','ready','failed')),
  thumbnail_url TEXT,
  is_free_preview BOOLEAN DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read published lessons"
  ON public.course_lessons FOR SELECT TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage lessons"
  ON public.course_lessons FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_course_lessons_module
  ON public.course_lessons(module_id, display_order);

CREATE INDEX idx_course_lessons_bunny
  ON public.course_lessons(bunny_video_id) WHERE bunny_video_id IS NOT NULL;

GRANT ALL ON public.course_lessons TO authenticated;
GRANT ALL ON public.course_lessons TO service_role;

-- 5. Course Lesson Attachments
CREATE TABLE IF NOT EXISTS public.course_lesson_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.course_lesson_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read attachments"
  ON public.course_lesson_attachments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage attachments"
  ON public.course_lesson_attachments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

GRANT ALL ON public.course_lesson_attachments TO authenticated;
GRANT ALL ON public.course_lesson_attachments TO service_role;

-- 6. Course Progress
CREATE TABLE IF NOT EXISTS public.course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','completed')),
  watch_percentage INTEGER DEFAULT 0,
  last_position_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own progress"
  ON public.course_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_course_progress_user
  ON public.course_progress(user_id, lesson_id);

GRANT ALL ON public.course_progress TO authenticated;
GRANT ALL ON public.course_progress TO service_role;

-- 7. Storage bucket for course attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('course-attachments', 'course-attachments', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can read, admins can write
CREATE POLICY "Authenticated can read course attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'course-attachments');

CREATE POLICY "Admins can manage course attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'course-attachments' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete course attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'course-attachments' AND has_role(auth.uid(), 'admin'::app_role));

-- 8. Seed Bunny.net Stream API config
INSERT INTO public.api_configs (api_key, name, description, base_url, credentials, parameters, is_active)
VALUES (
  'bunny_stream',
  'Bunny.net Stream',
  'Video hosting e streaming via Bunny.net Stream. Preencha credentials com: api_key, token_auth_key, library_id',
  'https://video.bunnycdn.com',
  '{}'::jsonb,
  '{}'::jsonb,
  true
)
ON CONFLICT (api_key) DO NOTHING;
