-- Course Platform Enhancements: Abandoned Cart Recovery (F13)

-- ============================================================
-- 1. Landing page views tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS public.landing_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  service_id UUID NOT NULL REFERENCES public.hub_services(id) ON DELETE CASCADE,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ
);

ALTER TABLE public.landing_page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON public.landing_page_views FOR ALL TO service_role USING (true);

CREATE POLICY "Users can insert views"
  ON public.landing_page_views FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own views"
  ON public.landing_page_views FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can read all views"
  ON public.landing_page_views FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

GRANT ALL ON public.landing_page_views TO authenticated;
GRANT ALL ON public.landing_page_views TO service_role;

CREATE INDEX IF NOT EXISTS idx_landing_views_service
  ON public.landing_page_views(service_id, viewed_at);

CREATE INDEX IF NOT EXISTS idx_landing_views_unconverted
  ON public.landing_page_views(user_id, converted, reminder_sent_at)
  WHERE user_id IS NOT NULL AND converted = false AND reminder_sent_at IS NULL;

-- ============================================================
-- 2. Abandoned cart email template
-- ============================================================
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, enabled)
VALUES (
  'abandoned_cart_reminder',
  'Lembrete - Carrinho Abandonado',
  'Voce esqueceu algo? {{serviceName}} te espera!',
  '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #4F46E5;">Ola, {{studentName}}!</h2>
    <p>Notamos que voce visitou <strong>{{serviceName}}</strong> mas ainda nao completou sua matricula.</p>
    <p>Se tiver alguma duvida, estamos aqui para ajudar!</p>
    <p><a href="{{checkoutUrl}}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Finalizar Matricula</a></p>
    <p style="color: #6B7280; font-size: 14px;">Equipe EU na Pratica</p>
  </div>',
  '["studentName", "serviceName", "checkoutUrl"]'::jsonb,
  'marketing',
  true
) ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 3. N8N automation for abandoned cart
-- ============================================================
INSERT INTO public.n8n_automations (name, display_name, description, trigger_event, webhook_method, category, enabled)
VALUES (
  'abandoned_cart_recovery',
  'Recuperacao de Carrinho Abandonado',
  'Dispara quando usuario visita landing page mas nao converte em 24h',
  'cart.abandoned',
  'POST',
  'marketing',
  false
) ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Cron job for checking abandoned carts (hourly)
-- ============================================================
DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'check-abandoned-carts',
      '0 * * * *',
      $cron$SELECT net.http_post(
        url := (SELECT value FROM public.app_configs WHERE key = 'supabase_edge_url') || '/check-abandoned-carts',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-internal-secret', (SELECT value FROM public.app_configs WHERE key = 'internal_function_secret')
        ),
        body := '{}'::jsonb
      )$cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available, skipping abandoned cart cron job';
END $outer$;
