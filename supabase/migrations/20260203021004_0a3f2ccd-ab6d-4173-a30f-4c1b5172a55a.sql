-- ========================================
-- COMMUNITY SYSTEM: Complete Database Schema
-- ========================================

-- 1. Community Categories (admin-configurable)
CREATE TABLE public.community_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon_name TEXT DEFAULT 'hash',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Community Posts
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.community_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Community Comments (with nested replies support)
CREATE TABLE public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Community Likes (for posts and comments)
CREATE TABLE public.community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_post_like UNIQUE(user_id, post_id),
  CONSTRAINT unique_comment_like UNIQUE(user_id, comment_id),
  CONSTRAINT like_target_check CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR 
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- 5. User Gamification (points, levels, stats)
CREATE TABLE public.user_gamification (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  posts_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Gamification Rules (admin-editable)
CREATE TABLE public.gamification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL UNIQUE,
  points INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Badges definitions
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'award',
  condition_type TEXT NOT NULL,
  condition_value INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. User Badges (earned)
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- ========================================
-- INDEXES for performance
-- ========================================
CREATE INDEX idx_community_posts_user ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_category ON public.community_posts(category_id);
CREATE INDEX idx_community_posts_created ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_comments_post ON public.community_comments(post_id);
CREATE INDEX idx_community_likes_post ON public.community_likes(post_id);
CREATE INDEX idx_community_likes_user ON public.community_likes(user_id);
CREATE INDEX idx_user_gamification_points ON public.user_gamification(total_points DESC);

-- ========================================
-- Enable RLS on all tables
-- ========================================
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS POLICIES
-- ========================================

-- Community Categories: Anyone authenticated can read, admin can manage
CREATE POLICY "Anyone can read active categories" ON public.community_categories
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage categories" ON public.community_categories
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Community Posts: Authenticated users can read, authors can manage own
CREATE POLICY "Authenticated users can read posts" ON public.community_posts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create posts" ON public.community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.community_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts or admin" ON public.community_posts
  FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Community Comments
CREATE POLICY "Authenticated users can read comments" ON public.community_comments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create comments" ON public.community_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.community_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments or admin" ON public.community_comments
  FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Community Likes
CREATE POLICY "Authenticated users can read likes" ON public.community_likes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create own likes" ON public.community_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.community_likes
  FOR DELETE USING (auth.uid() = user_id);

-- User Gamification
CREATE POLICY "Anyone authenticated can read gamification" ON public.user_gamification
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System inserts gamification" ON public.user_gamification
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System updates gamification" ON public.user_gamification
  FOR UPDATE USING (true);

-- Gamification Rules
CREATE POLICY "Anyone can read rules" ON public.gamification_rules
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage rules" ON public.gamification_rules
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Badges
CREATE POLICY "Anyone can read badges" ON public.badges
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage badges" ON public.badges
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User Badges
CREATE POLICY "Anyone authenticated can read user badges" ON public.user_badges
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert user badges" ON public.user_badges
  FOR INSERT WITH CHECK (true);

-- ========================================
-- HELPER FUNCTION: Get points for action
-- ========================================
CREATE OR REPLACE FUNCTION public.get_gamification_points(p_action_type TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT points FROM gamification_rules WHERE action_type = p_action_type AND is_active = true),
    0
  )
$$;

-- ========================================
-- HELPER FUNCTION: Calculate level from points
-- ========================================
CREATE OR REPLACE FUNCTION public.calculate_level(p_points INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_points >= 1000 THEN 5
    WHEN p_points >= 500 THEN 4
    WHEN p_points >= 250 THEN 3
    WHEN p_points >= 100 THEN 2
    ELSE 1
  END
$$;

-- ========================================
-- TRIGGER: Update gamification on post creation
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_post_gamification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points INTEGER;
BEGIN
  v_points := get_gamification_points('create_post');
  
  INSERT INTO user_gamification (user_id, total_points, posts_count, last_activity_at)
  VALUES (NEW.user_id, v_points, 1, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_gamification.total_points + v_points,
    posts_count = user_gamification.posts_count + 1,
    last_activity_at = now(),
    level = calculate_level(user_gamification.total_points + v_points);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_post_gamification
AFTER INSERT ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION handle_post_gamification();

-- ========================================
-- TRIGGER: Update gamification on comment creation
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_comment_gamification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points INTEGER;
BEGIN
  v_points := get_gamification_points('create_comment');
  
  INSERT INTO user_gamification (user_id, total_points, comments_count, last_activity_at)
  VALUES (NEW.user_id, v_points, 1, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_gamification.total_points + v_points,
    comments_count = user_gamification.comments_count + 1,
    last_activity_at = now(),
    level = calculate_level(user_gamification.total_points + v_points);
  
  -- Update post comments count
  UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_comment_gamification
AFTER INSERT ON public.community_comments
FOR EACH ROW EXECUTE FUNCTION handle_comment_gamification();

-- ========================================
-- TRIGGER: Update gamification on like
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_like_gamification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points INTEGER;
  v_author_id UUID;
BEGIN
  IF NEW.post_id IS NOT NULL THEN
    v_points := get_gamification_points('receive_like_post');
    SELECT user_id INTO v_author_id FROM community_posts WHERE id = NEW.post_id;
    UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSE
    v_points := get_gamification_points('receive_like_comment');
    SELECT user_id INTO v_author_id FROM community_comments WHERE id = NEW.comment_id;
    UPDATE community_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  END IF;
  
  -- Award points to the author (not the liker)
  IF v_author_id IS NOT NULL AND v_author_id != NEW.user_id THEN
    INSERT INTO user_gamification (user_id, total_points, likes_received, last_activity_at)
    VALUES (v_author_id, v_points, 1, now())
    ON CONFLICT (user_id) DO UPDATE SET
      total_points = user_gamification.total_points + v_points,
      likes_received = user_gamification.likes_received + 1,
      last_activity_at = now(),
      level = calculate_level(user_gamification.total_points + v_points);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_like_gamification
AFTER INSERT ON public.community_likes
FOR EACH ROW EXECUTE FUNCTION handle_like_gamification();

-- ========================================
-- TRIGGER: Handle unlike
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_unlike_gamification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points INTEGER;
  v_author_id UUID;
BEGIN
  IF OLD.post_id IS NOT NULL THEN
    v_points := get_gamification_points('receive_like_post');
    SELECT user_id INTO v_author_id FROM community_posts WHERE id = OLD.post_id;
    UPDATE community_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  ELSE
    v_points := get_gamification_points('receive_like_comment');
    SELECT user_id INTO v_author_id FROM community_comments WHERE id = OLD.comment_id;
    UPDATE community_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
  END IF;
  
  -- Remove points from author
  IF v_author_id IS NOT NULL AND v_author_id != OLD.user_id THEN
    UPDATE user_gamification SET
      total_points = GREATEST(0, total_points - v_points),
      likes_received = GREATEST(0, likes_received - 1),
      level = calculate_level(GREATEST(0, total_points - v_points))
    WHERE user_id = v_author_id;
  END IF;
  
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_unlike_gamification
AFTER DELETE ON public.community_likes
FOR EACH ROW EXECUTE FUNCTION handle_unlike_gamification();

-- ========================================
-- TRIGGER: Handle comment delete
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_comment_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE community_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_comment_delete
AFTER DELETE ON public.community_comments
FOR EACH ROW EXECUTE FUNCTION handle_comment_delete();

-- ========================================
-- SEED: Default categories
-- ========================================
INSERT INTO public.community_categories (name, slug, icon_name, display_order) VALUES
  ('Vistos & Imigração', 'vistos-imigracao', 'passport', 1),
  ('Carreira & Jobs', 'carreira-jobs', 'briefcase', 2),
  ('Networking', 'networking', 'users', 3),
  ('Vida nos EUA', 'vida-nos-eua', 'home', 4),
  ('Dúvidas Gerais', 'duvidas-gerais', 'help-circle', 5);

-- ========================================
-- SEED: Default gamification rules
-- ========================================
INSERT INTO public.gamification_rules (action_type, points, description) VALUES
  ('create_post', 10, 'Criar uma nova discussão'),
  ('create_comment', 5, 'Comentar em uma discussão'),
  ('receive_like_post', 2, 'Receber like em post'),
  ('receive_like_comment', 1, 'Receber like em comentário'),
  ('participate_event', 20, 'Participar de um evento');

-- ========================================
-- SEED: Default badges
-- ========================================
INSERT INTO public.badges (name, description, icon_name, condition_type, condition_value) VALUES
  ('Primeiro Post', 'Criou sua primeira discussão', 'message-square', 'posts_count', 1),
  ('Contribuidor', 'Criou 10 discussões', 'edit-3', 'posts_count', 10),
  ('Social', 'Recebeu 10 likes', 'heart', 'likes_received', 10),
  ('Popular', 'Recebeu 50 likes', 'star', 'likes_received', 50),
  ('Mentor', 'Respondeu 20 discussões', 'message-circle', 'comments_count', 20),
  ('Expert', 'Atingiu nível 5', 'award', 'level', 5);

-- ========================================
-- RPC: Get community ranking
-- ========================================
CREATE OR REPLACE FUNCTION public.get_community_ranking(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  profile_photo_url TEXT,
  total_points INTEGER,
  level INTEGER
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
    ug.level
  FROM user_gamification ug
  JOIN profiles p ON p.id = ug.user_id
  ORDER BY ug.total_points DESC
  LIMIT p_limit
$$;