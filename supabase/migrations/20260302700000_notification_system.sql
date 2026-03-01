-- ============================================================================
-- NOTIFICATION SYSTEM: In-App Notifications with Admin Configuration
-- ============================================================================

-- ── 1. Extend notification_type enum ────────────────────────────────────────

-- Social
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'post_commented';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'post_liked';

-- Business
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'product_launch';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'live_scheduled';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'live_starting';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'live_reminder';

-- Learning
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'new_course_content';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'badge_earned';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'course_completed';

-- System
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'credits_recharged';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'subscription_activated';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'subscription_cancelled';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'payment_failed';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'welcome';

-- Scheduling
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'booking_confirmed';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'booking_cancelled';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'booking_rescheduled';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'espaco_invitation';


-- ── 2. ALTER notifications table ────────────────────────────────────────────

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS action_url TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'bell',
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, read_at)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);


-- ── 3. notification_type_configs table ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_type_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'bell',
  category TEXT DEFAULT 'system' CHECK (category IN ('system', 'social', 'business', 'learning', 'scheduling')),
  in_app_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_type_configs ENABLE ROW LEVEL SECURITY;

-- Admin can read/write
DROP POLICY IF EXISTS "admin_full_access_notification_configs" ON public.notification_type_configs;
CREATE POLICY "admin_full_access_notification_configs"
  ON public.notification_type_configs
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated can read (to check enabled status)
DROP POLICY IF EXISTS "authenticated_read_notification_configs" ON public.notification_type_configs;
CREATE POLICY "authenticated_read_notification_configs"
  ON public.notification_type_configs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

GRANT ALL ON public.notification_type_configs TO authenticated;
GRANT ALL ON public.notification_type_configs TO service_role;


-- ── 4. user_notification_preferences table ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type_key TEXT NOT NULL,
  in_app_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type_key)
);

ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users manage own preferences
DROP POLICY IF EXISTS "users_manage_own_notification_prefs" ON public.user_notification_preferences;
CREATE POLICY "users_manage_own_notification_prefs"
  ON public.user_notification_preferences
  FOR ALL
  USING (auth.uid() = user_id);

-- Admin can read all
DROP POLICY IF EXISTS "admin_read_all_notification_prefs" ON public.user_notification_preferences;
CREATE POLICY "admin_read_all_notification_prefs"
  ON public.user_notification_preferences
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.user_notification_preferences TO authenticated;
GRANT ALL ON public.user_notification_preferences TO service_role;


-- ── 5. RPC Functions ────────────────────────────────────────────────────────

-- Mark single notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = NOW()
  WHERE id = p_notification_id
    AND user_id = auth.uid()
    AND read_at IS NULL;
END;
$$;

-- Mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = NOW()
  WHERE user_id = auth.uid()
    AND read_at IS NULL;
END;
$$;

-- Get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.notifications
  WHERE user_id = auth.uid()
    AND read_at IS NULL;
  RETURN v_count;
END;
$$;


-- ── 6. Realtime (enable for notifications table) ────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END
$$;


-- ── 7. Seed notification_type_configs ───────────────────────────────────────

INSERT INTO public.notification_type_configs (type_key, display_name, description, icon, category, in_app_enabled, email_enabled) VALUES
  -- System
  ('welcome', 'Boas-vindas', 'Mensagem de boas-vindas ao novo usuario', 'hand-metal', 'system', true, false),
  ('credits_recharged', 'Creditos Recarregados', 'Quando creditos sao adicionados a sua conta', 'coins', 'system', true, false),
  ('subscription_activated', 'Assinatura Ativada', 'Quando sua assinatura e ativada com sucesso', 'check-circle', 'system', true, true),
  ('subscription_cancelled', 'Assinatura Cancelada', 'Quando sua assinatura e cancelada', 'x-circle', 'system', true, true),
  ('payment_failed', 'Falha no Pagamento', 'Quando um pagamento nao e processado', 'alert-triangle', 'system', true, true),

  -- Social
  ('post_commented', 'Comentario no Post', 'Quando alguem comenta no seu post', 'message-circle', 'social', true, false),
  ('post_liked', 'Curtida no Post', 'Quando alguem curte seu post', 'heart', 'social', true, false),

  -- Business
  ('product_launch', 'Novo Produto/Servico', 'Quando um novo produto ou servico e lancado', 'rocket', 'business', true, false),
  ('live_scheduled', 'Live Agendada', 'Quando uma nova live e agendada', 'video', 'business', true, true),
  ('live_starting', 'Live Comecando', 'Quando uma live que voce se registrou esta para comecar', 'radio', 'business', true, false),
  ('live_reminder', 'Lembrete de Live', 'Lembrete antes da live comecar', 'clock', 'business', true, false),

  -- Learning
  ('new_course_content', 'Novo Conteudo', 'Quando novo conteudo e publicado em um curso matriculado', 'book-open', 'learning', true, false),
  ('badge_earned', 'Badge Conquistada', 'Quando voce conquista uma nova badge', 'award', 'learning', true, false),
  ('course_completed', 'Curso Concluido', 'Quando voce conclui um curso', 'graduation-cap', 'learning', true, false),

  -- Scheduling (existing types + new)
  ('reminder_24h', 'Lembrete 24h', 'Lembrete 24 horas antes da sessao', 'clock', 'scheduling', true, true),
  ('reminder_1h', 'Lembrete 1h', 'Lembrete 1 hora antes da sessao', 'alarm-clock', 'scheduling', true, true),
  ('recording_available', 'Gravacao Disponivel', 'Quando a gravacao da sessao esta disponivel', 'film', 'scheduling', true, true),
  ('session_cancelled', 'Sessao Cancelada', 'Quando uma sessao e cancelada', 'calendar-x', 'scheduling', true, true),
  ('new_session', 'Nova Sessao', 'Quando uma nova sessao e criada', 'calendar-plus', 'scheduling', true, false),
  ('booking_confirmed', 'Agendamento Confirmado', 'Quando um agendamento e confirmado', 'calendar-check', 'scheduling', true, true),
  ('booking_cancelled', 'Agendamento Cancelado', 'Quando um agendamento e cancelado', 'calendar-x-2', 'scheduling', true, true),
  ('booking_rescheduled', 'Agendamento Reagendado', 'Quando um agendamento e reagendado', 'calendar-clock', 'scheduling', true, true),
  ('espaco_invitation', 'Convite para Espaco', 'Quando voce e convidado para um espaco de aprendizado', 'users', 'scheduling', true, true)
ON CONFLICT (type_key) DO NOTHING;


-- ── 8. Update trigger for updated_at ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_notification_config_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notification_config_updated ON public.notification_type_configs;
CREATE TRIGGER trg_notification_config_updated
  BEFORE UPDATE ON public.notification_type_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_config_timestamp();
