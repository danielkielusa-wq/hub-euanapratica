-- Create plans table for SaaS tiers
CREATE TABLE public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_limit INTEGER NOT NULL DEFAULT 1,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Anyone can read plans (public catalog)
CREATE POLICY "Anyone can read plans" ON public.plans
FOR SELECT USING (true);

-- Only admins can manage plans
CREATE POLICY "Admins can insert plans" ON public.plans
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update plans" ON public.plans
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete plans" ON public.plans
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial plan data
INSERT INTO public.plans (id, name, monthly_limit, features) VALUES
('basic', 'Básico', 1, '{"allow_pdf": false, "show_cheat_sheet": false, "show_improvements": false}'::jsonb),
('pro', 'Pro', 10, '{"allow_pdf": true, "show_cheat_sheet": true, "show_improvements": true, "impact_cards": true}'::jsonb),
('vip', 'VIP', 999, '{"allow_pdf": true, "show_cheat_sheet": true, "show_improvements": true, "impact_cards": true, "priority_support": true}'::jsonb);

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "Users can read own subscription" ON public.user_subscriptions
FOR SELECT USING (user_id = auth.uid());

-- Admins can manage all subscriptions
CREATE POLICY "Admins can insert subscriptions" ON public.user_subscriptions
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update subscriptions" ON public.user_subscriptions
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete subscriptions" ON public.user_subscriptions
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read all subscriptions" ON public.user_subscriptions
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Create usage_logs table
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL DEFAULT 'curriculo_usa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own logs
CREATE POLICY "Users can read own usage logs" ON public.usage_logs
FOR SELECT USING (user_id = auth.uid());

-- Admins can read all logs
CREATE POLICY "Admins can read all usage logs" ON public.usage_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to get user quota (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_user_quota(p_user_id UUID)
RETURNS TABLE (
  plan_id TEXT,
  plan_name TEXT,
  monthly_limit INTEGER,
  used_this_month INTEGER,
  remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(us.plan_id, 'basic')::TEXT,
    COALESCE(p.name, 'Básico')::TEXT,
    COALESCE(p.monthly_limit, 1)::INTEGER,
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM public.usage_logs ul 
      WHERE ul.user_id = p_user_id 
        AND ul.app_id = 'curriculo_usa'
        AND ul.created_at >= date_trunc('month', now())
    ), 0)::INTEGER AS used,
    GREATEST(0, COALESCE(p.monthly_limit, 1) - COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM public.usage_logs ul 
      WHERE ul.user_id = p_user_id 
        AND ul.app_id = 'curriculo_usa'
        AND ul.created_at >= date_trunc('month', now())
    ), 0))::INTEGER AS remaining
  FROM (SELECT p_user_id AS user_id) u
  LEFT JOIN public.user_subscriptions us ON us.user_id = u.user_id AND us.status = 'active'
  LEFT JOIN public.plans p ON p.id = COALESCE(us.plan_id, 'basic');
END;
$$;

-- Create function to record usage (SECURITY DEFINER to insert without RLS issues)
CREATE OR REPLACE FUNCTION public.record_curriculo_usage(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usage_logs (user_id, app_id)
  VALUES (p_user_id, 'curriculo_usa');
  RETURN true;
END;
$$;