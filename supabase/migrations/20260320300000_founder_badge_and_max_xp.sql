-- Add special_badge column to profiles (displayed in community UI)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS special_badge TEXT;

-- Recreate get_community_ranking to include special_badge
DROP FUNCTION IF EXISTS public.get_community_ranking(INTEGER);
CREATE OR REPLACE FUNCTION public.get_community_ranking(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  profile_photo_url TEXT,
  total_points INTEGER,
  level INTEGER,
  special_badge TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ug.user_id,
    p.full_name,
    p.profile_photo_url,
    ug.total_points,
    ug.level,
    p.special_badge
  FROM user_gamification ug
  JOIN profiles p ON p.id = ug.user_id
  ORDER BY ug.total_points DESC
  LIMIT p_limit;
$$;

-- Create the Founder badge definition
INSERT INTO public.badges (name, description, icon_name, condition_type, condition_value, is_active)
VALUES ('Founder', 'Fundador da plataforma', 'crown', 'manual', 0, true)
ON CONFLICT DO NOTHING;

-- Set Daniel Kiel as Founder with max XP
DO $$
DECLARE
  v_user_id UUID;
  v_badge_id UUID;
BEGIN
  -- Look up user by email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'daniel@danielkielmentor.com';

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User daniel@danielkielmentor.com not found, skipping';
    RETURN;
  END IF;

  -- Set special_badge on profile
  UPDATE public.profiles SET special_badge = 'Founder' WHERE id = v_user_id;

  -- Upsert user_gamification with max XP and level 5
  INSERT INTO public.user_gamification (user_id, total_points, level, posts_count, comments_count, likes_received, last_activity_at)
  VALUES (v_user_id, 99999, 5, 0, 0, 0, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = 99999,
    level = 5,
    last_activity_at = NOW();

  -- Award the Founder badge
  SELECT id INTO v_badge_id FROM public.badges WHERE name = 'Founder';

  IF v_badge_id IS NOT NULL THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (v_user_id, v_badge_id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- Also award all other active badges to the founder
  INSERT INTO public.user_badges (user_id, badge_id)
  SELECT v_user_id, b.id
  FROM public.badges b
  WHERE b.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.user_badges ub WHERE ub.user_id = v_user_id AND ub.badge_id = b.id
    );

END $$;
