-- =====================================================
-- Session Discussion System - Forum/Posts Tables
-- =====================================================

-- Security definer function to check session access
CREATE OR REPLACE FUNCTION public.can_access_session(_user_id uuid, _session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = _session_id
    AND (
      is_enrolled_in_espaco(_user_id, s.espaco_id) 
      OR is_admin_or_mentor(_user_id)
    )
  )
$$;

-- =====================================================
-- Table: session_posts
-- =====================================================
CREATE TABLE public.session_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_mentor_post BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_session_posts_session_id ON public.session_posts(session_id);
CREATE INDEX idx_session_posts_user_id ON public.session_posts(user_id);

-- Enable RLS
ALTER TABLE public.session_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for session_posts
CREATE POLICY "Users can view session posts"
  ON public.session_posts FOR SELECT
  USING (can_access_session(auth.uid(), session_id));

CREATE POLICY "Users can create posts in accessible sessions"
  ON public.session_posts FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    AND can_access_session(auth.uid(), session_id)
  );

CREATE POLICY "Users can update own posts"
  ON public.session_posts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own posts or admins can delete any"
  ON public.session_posts FOR DELETE
  USING (user_id = auth.uid() OR is_admin_or_mentor(auth.uid()));

-- =====================================================
-- Table: session_post_votes
-- =====================================================
CREATE TABLE public.session_post_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.session_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Index for vote counting
CREATE INDEX idx_session_post_votes_post_id ON public.session_post_votes(post_id);

-- Enable RLS
ALTER TABLE public.session_post_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for session_post_votes
CREATE POLICY "Users can view votes"
  ON public.session_post_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can vote on accessible posts"
  ON public.session_post_votes FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.session_posts p
      WHERE p.id = post_id AND can_access_session(auth.uid(), p.session_id)
    )
  );

CREATE POLICY "Users can remove own votes"
  ON public.session_post_votes FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- Enable Realtime for live updates
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_post_votes;

-- =====================================================
-- Trigger for updated_at
-- =====================================================
CREATE TRIGGER update_session_posts_updated_at
  BEFORE UPDATE ON public.session_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();