-- Course Platform Enhancements: Gamification + Milestones
-- F8: Course-specific gamification points & streaks
-- F9: Completion milestones with email celebrations

-- ============================================================
-- 1. Seed course-specific gamification rules (F8)
-- ============================================================
INSERT INTO public.gamification_rules (action_type, points, description, is_active)
VALUES
  ('lesson_completed', 10, 'Completou uma aula do curso', true),
  ('module_completed', 50, 'Completou todas as aulas de um modulo', true),
  ('quiz_passed', 20, 'Passou em um quiz de aula', true),
  ('course_completed', 100, 'Completou 100% de um curso', true)
ON CONFLICT (action_type) DO NOTHING;

-- ============================================================
-- 2. Course streaks table (F8)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.course_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.course_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own streaks"
  ON public.course_streaks FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.course_streaks TO authenticated;
GRANT ALL ON public.course_streaks TO service_role;

-- ============================================================
-- 3. RPC: award_course_points (F8)
-- Upserts user_gamification, updates level, updates streak.
-- Returns JSON with points, level-up status, streak.
-- ============================================================
CREATE OR REPLACE FUNCTION public.award_course_points(
  p_user_id UUID,
  p_action_type TEXT,
  p_context JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_points INTEGER;
  v_old_level INTEGER;
  v_new_points INTEGER;
  v_new_level INTEGER;
  v_current_streak INTEGER := 0;
BEGIN
  -- Get points for action
  SELECT points INTO v_points FROM public.gamification_rules
    WHERE action_type = p_action_type AND is_active = true;
  IF v_points IS NULL THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'rule_not_found');
  END IF;

  -- Upsert user_gamification
  INSERT INTO public.user_gamification (user_id, total_points, level, last_activity_at)
  VALUES (p_user_id, v_points, 1, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_points = user_gamification.total_points + v_points,
    last_activity_at = now();

  -- Get updated values
  SELECT total_points, level INTO v_new_points, v_old_level
    FROM public.user_gamification WHERE user_id = p_user_id;

  -- Calculate new level (matches existing level thresholds)
  v_new_level := CASE
    WHEN v_new_points >= 1000 THEN 5
    WHEN v_new_points >= 500 THEN 4
    WHEN v_new_points >= 250 THEN 3
    WHEN v_new_points >= 100 THEN 2
    ELSE 1
  END;

  IF v_new_level != v_old_level THEN
    UPDATE public.user_gamification SET level = v_new_level WHERE user_id = p_user_id;
  END IF;

  -- Update streak
  INSERT INTO public.course_streaks (user_id, current_streak, longest_streak, last_activity_date)
  VALUES (p_user_id, 1, 1, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = CASE
      WHEN course_streaks.last_activity_date = CURRENT_DATE THEN course_streaks.current_streak
      WHEN course_streaks.last_activity_date = CURRENT_DATE - 1 THEN course_streaks.current_streak + 1
      ELSE 1
    END,
    longest_streak = GREATEST(course_streaks.longest_streak,
      CASE
        WHEN course_streaks.last_activity_date = CURRENT_DATE THEN course_streaks.current_streak
        WHEN course_streaks.last_activity_date = CURRENT_DATE - 1 THEN course_streaks.current_streak + 1
        ELSE 1
      END),
    last_activity_date = CURRENT_DATE,
    updated_at = now();

  SELECT current_streak INTO v_current_streak
    FROM public.course_streaks WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'awarded', true,
    'points', v_points,
    'new_total', v_new_points,
    'level_up', v_new_level > v_old_level,
    'new_level', v_new_level,
    'streak', v_current_streak
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_course_points TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_course_points TO service_role;

-- ============================================================
-- 4. Course milestones table (F9)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.course_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  espaco_id UUID NOT NULL REFERENCES public.espacos(id) ON DELETE CASCADE,
  milestone INTEGER NOT NULL CHECK (milestone IN (25, 50, 75, 100)),
  reached_at TIMESTAMPTZ DEFAULT now(),
  email_sent BOOLEAN DEFAULT false,
  UNIQUE(user_id, espaco_id, milestone)
);

ALTER TABLE public.course_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own milestones"
  ON public.course_milestones FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.course_milestones TO authenticated;
GRANT ALL ON public.course_milestones TO service_role;

-- ============================================================
-- 5. Seed milestone email templates (F9)
-- ============================================================
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, enabled)
VALUES
  (
    'course_milestone_25',
    'Curso - 25% Concluido',
    'Voce ja completou 25% do {{courseName}}! 🎉',
    '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4F46E5;">Continue assim, {{studentName}}!</h2>
      <p>Voce ja completou <strong>25%</strong> do curso <strong>{{courseName}}</strong>.</p>
      <p>Esse e um otimo comeco! Continue estudando e logo voce alcancara novos marcos.</p>
      <p style="color: #6B7280; font-size: 14px;">Equipe EU na Pratica</p>
    </div>',
    '["studentName", "courseName"]'::jsonb,
    'course',
    true
  ),
  (
    'course_milestone_50',
    'Curso - 50% Concluido',
    'Metade do caminho! {{courseName}} 🚀',
    '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4F46E5;">Parabens, {{studentName}}!</h2>
      <p>Voce ja esta na <strong>metade</strong> do curso <strong>{{courseName}}</strong>!</p>
      <p>Voce esta indo muito bem. Continue focado e o resultado vira!</p>
      <p style="color: #6B7280; font-size: 14px;">Equipe EU na Pratica</p>
    </div>',
    '["studentName", "courseName"]'::jsonb,
    'course',
    true
  ),
  (
    'course_milestone_75',
    'Curso - 75% Concluido',
    'Quase la! 75% do {{courseName}} ✨',
    '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4F46E5;">Falta pouco, {{studentName}}!</h2>
      <p>Voce ja completou <strong>75%</strong> do curso <strong>{{courseName}}</strong>.</p>
      <p>A reta final esta ai! Mais um pouco de dedicacao e voce concluira o curso completo.</p>
      <p style="color: #6B7280; font-size: 14px;">Equipe EU na Pratica</p>
    </div>',
    '["studentName", "courseName"]'::jsonb,
    'course',
    true
  ),
  (
    'course_completed',
    'Curso Concluido',
    'Parabens! Voce completou {{courseName}}! 🎓',
    '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4F46E5;">Parabens, {{studentName}}! 🎉</h2>
      <p>Voce completou <strong>100%</strong> do curso <strong>{{courseName}}</strong>!</p>
      <p>Seu certificado de conclusao ja esta disponivel na plataforma. Acesse o curso para baixa-lo.</p>
      <p>Continue investindo no seu desenvolvimento. Explore nossos outros cursos!</p>
      <p style="color: #6B7280; font-size: 14px;">Equipe EU na Pratica</p>
    </div>',
    '["studentName", "courseName"]'::jsonb,
    'course',
    true
  )
ON CONFLICT (name) DO NOTHING;
