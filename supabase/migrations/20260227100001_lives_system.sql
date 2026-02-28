-- ============================================================================
-- LIVES SYSTEM: Independent live events with mentor autonomy
-- ============================================================================

-- 1. Enums
CREATE TYPE public.live_access_type AS ENUM ('free', 'paid', 'subscribers', 'pro', 'vip');
CREATE TYPE public.live_status AS ENUM ('draft', 'scheduled', 'live', 'completed', 'cancelled');

-- 2. Lives table
CREATE TABLE public.lives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  long_description TEXT,
  thumbnail_url TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  meeting_link TEXT,
  access_type public.live_access_type NOT NULL DEFAULT 'free',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  ticto_product_id TEXT,
  ticto_checkout_url TEXT,
  max_attendees INT,
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.live_status NOT NULL DEFAULT 'scheduled',
  recording_url TEXT,
  og_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.lives IS 'Independent live events created by mentors. Decoupled from espacos/sessions system.';

-- 3. Live registrations table
CREATE TABLE public.live_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_id UUID NOT NULL REFERENCES public.lives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attended BOOLEAN NOT NULL DEFAULT false,
  payment_status TEXT NOT NULL DEFAULT 'none' CHECK (payment_status IN ('none', 'pending', 'paid', 'refunded')),
  UNIQUE(live_id, user_id)
);

COMMENT ON TABLE public.live_registrations IS 'User registrations for live events.';

-- 4. Indexes
CREATE INDEX idx_lives_slug ON public.lives(slug);
CREATE INDEX idx_lives_mentor_id ON public.lives(mentor_id);
CREATE INDEX idx_lives_status_scheduled ON public.lives(status, scheduled_at);
CREATE INDEX idx_lives_ticto_product_id ON public.lives(ticto_product_id) WHERE ticto_product_id IS NOT NULL;

CREATE INDEX idx_live_registrations_live_id ON public.live_registrations(live_id);
CREATE INDEX idx_live_registrations_user_id ON public.live_registrations(user_id);

-- 5. Updated_at trigger
CREATE TRIGGER update_lives_updated_at
  BEFORE UPDATE ON public.lives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Grants
GRANT ALL ON public.lives TO authenticated, service_role;
GRANT ALL ON public.live_registrations TO authenticated, service_role;

-- ============================================================================
-- 7. RLS — lives
-- ============================================================================
ALTER TABLE public.lives ENABLE ROW LEVEL SECURITY;

-- Authenticated can view published lives
CREATE POLICY "lives_select_published"
  ON public.lives FOR SELECT TO authenticated
  USING (status IN ('scheduled', 'live', 'completed'));

-- Mentors can view their own drafts
CREATE POLICY "lives_select_own_drafts"
  ON public.lives FOR SELECT TO authenticated
  USING (mentor_id = auth.uid() AND status = 'draft');

-- Mentors can create lives
CREATE POLICY "lives_insert_mentor"
  ON public.lives FOR INSERT TO authenticated
  WITH CHECK (
    mentor_id = auth.uid()
    AND public.is_admin_or_mentor(auth.uid())
  );

-- Mentors can update their own lives
CREATE POLICY "lives_update_own"
  ON public.lives FOR UPDATE TO authenticated
  USING (mentor_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid());

-- Mentors can delete their own draft lives
CREATE POLICY "lives_delete_own_draft"
  ON public.lives FOR DELETE TO authenticated
  USING (mentor_id = auth.uid() AND status = 'draft');

-- Admins full access
CREATE POLICY "lives_admin_all"
  ON public.lives FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 8. RLS — live_registrations
-- ============================================================================
ALTER TABLE public.live_registrations ENABLE ROW LEVEL SECURITY;

-- Users can see their own registrations
CREATE POLICY "live_reg_select_own"
  ON public.live_registrations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Mentors can see registrations for their lives
CREATE POLICY "live_reg_select_mentor"
  ON public.live_registrations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lives
      WHERE lives.id = live_registrations.live_id
      AND lives.mentor_id = auth.uid()
    )
  );

-- Admins can see all
CREATE POLICY "live_reg_select_admin"
  ON public.live_registrations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can register themselves
CREATE POLICY "live_reg_insert_own"
  ON public.live_registrations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can unregister
CREATE POLICY "live_reg_delete_own"
  ON public.live_registrations FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Admins can manage all registrations
CREATE POLICY "live_reg_admin_all"
  ON public.live_registrations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role full access (for Ticto webhook)
CREATE POLICY "live_reg_service_role"
  ON public.live_registrations FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "lives_service_role"
  ON public.lives FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 9. RPC: check_live_access
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_live_access(p_user_id UUID, p_live_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_live RECORD;
  v_plan_id TEXT;
  v_sub_status TEXT;
  v_already_registered BOOLEAN;
  v_registration_count INT;
BEGIN
  -- Fetch live
  SELECT * INTO v_live FROM public.lives WHERE id = p_live_id;
  IF v_live IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'live_not_found');
  END IF;

  -- Check if already registered
  SELECT EXISTS(
    SELECT 1 FROM public.live_registrations
    WHERE live_id = p_live_id AND user_id = p_user_id
  ) INTO v_already_registered;

  IF v_already_registered THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'already_registered', 'registered', true);
  END IF;

  -- Check capacity
  IF v_live.max_attendees IS NOT NULL THEN
    SELECT COUNT(*) INTO v_registration_count
    FROM public.live_registrations WHERE live_id = p_live_id;
    IF v_registration_count >= v_live.max_attendees THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'full');
    END IF;
  END IF;

  -- Check access_type
  CASE v_live.access_type
    WHEN 'free' THEN
      RETURN jsonb_build_object('allowed', true, 'reason', 'free');

    WHEN 'paid' THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'payment_required',
        'checkout_url', v_live.ticto_checkout_url,
        'price', v_live.price
      );

    WHEN 'subscribers' THEN
      SELECT us.plan_id, us.status INTO v_plan_id, v_sub_status
      FROM public.user_subscriptions us
      WHERE us.user_id = p_user_id AND us.status IN ('active', 'grace_period')
      ORDER BY us.created_at DESC LIMIT 1;

      IF v_sub_status IS NOT NULL THEN
        RETURN jsonb_build_object('allowed', true, 'reason', 'subscriber');
      END IF;
      RETURN jsonb_build_object('allowed', false, 'reason', 'no_subscription');

    WHEN 'pro' THEN
      SELECT us.plan_id, us.status INTO v_plan_id, v_sub_status
      FROM public.user_subscriptions us
      WHERE us.user_id = p_user_id AND us.status IN ('active', 'grace_period')
      ORDER BY us.created_at DESC LIMIT 1;

      IF v_plan_id IN ('pro', 'vip') THEN
        RETURN jsonb_build_object('allowed', true, 'reason', 'pro_subscriber');
      END IF;
      IF v_sub_status IS NOT NULL THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'plan_too_low', 'required', 'pro');
      END IF;
      RETURN jsonb_build_object('allowed', false, 'reason', 'no_subscription');

    WHEN 'vip' THEN
      SELECT us.plan_id, us.status INTO v_plan_id, v_sub_status
      FROM public.user_subscriptions us
      WHERE us.user_id = p_user_id AND us.status IN ('active', 'grace_period')
      ORDER BY us.created_at DESC LIMIT 1;

      IF v_plan_id = 'vip' THEN
        RETURN jsonb_build_object('allowed', true, 'reason', 'vip_subscriber');
      END IF;
      IF v_sub_status IS NOT NULL THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'plan_too_low', 'required', 'vip');
      END IF;
      RETURN jsonb_build_object('allowed', false, 'reason', 'no_subscription');

    ELSE
      RETURN jsonb_build_object('allowed', false, 'reason', 'unknown_access_type');
  END CASE;
END;
$$;
