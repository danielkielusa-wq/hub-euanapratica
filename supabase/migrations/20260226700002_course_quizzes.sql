-- Course Platform Enhancements: Quizzes / Assessments (F7)

-- ============================================================
-- 1. Quiz definitions (one per lesson)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.course_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Quiz',
  passing_grade INTEGER NOT NULL DEFAULT 70,
  is_required BOOLEAN DEFAULT false,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lesson_id)
);

ALTER TABLE public.course_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read quizzes"
  ON public.course_quizzes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage quizzes"
  ON public.course_quizzes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

GRANT ALL ON public.course_quizzes TO authenticated;
GRANT ALL ON public.course_quizzes TO service_role;

-- ============================================================
-- 2. Quiz questions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.course_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice'
    CHECK (question_type IN ('multiple_choice', 'true_false')),
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.course_quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read quiz questions"
  ON public.course_quiz_questions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage quiz questions"
  ON public.course_quiz_questions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

GRANT ALL ON public.course_quiz_questions TO authenticated;
GRANT ALL ON public.course_quiz_questions TO service_role;

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz
  ON public.course_quiz_questions(quiz_id, display_order);

-- ============================================================
-- 3. Quiz attempts (user submissions)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.course_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.course_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own attempts"
  ON public.course_quiz_attempts FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all attempts"
  ON public.course_quiz_attempts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

GRANT ALL ON public.course_quiz_attempts TO authenticated;
GRANT ALL ON public.course_quiz_attempts TO service_role;

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user
  ON public.course_quiz_attempts(user_id, quiz_id);
