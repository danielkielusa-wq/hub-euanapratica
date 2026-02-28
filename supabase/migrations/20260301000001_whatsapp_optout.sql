-- =============================================
-- WhatsApp Opt-Out Registry
-- =============================================
-- Stores phone numbers that have opted out via PARAR/STOP keyword.
-- Edge Functions check this before creating new flow sessions.

CREATE TABLE public.whatsapp_optouts (
  phone        TEXT PRIMARY KEY,
  opted_out_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source       TEXT NOT NULL DEFAULT 'keyword' -- 'keyword' | 'admin'
);

ALTER TABLE public.whatsapp_optouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on whatsapp_optouts"
  ON public.whatsapp_optouts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

GRANT ALL ON public.whatsapp_optouts TO service_role, authenticated;
