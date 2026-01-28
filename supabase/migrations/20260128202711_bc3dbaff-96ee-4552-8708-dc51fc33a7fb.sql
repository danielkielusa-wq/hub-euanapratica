-- Adicionar campos Ticto na tabela hub_services
ALTER TABLE public.hub_services 
  ADD COLUMN IF NOT EXISTS ticto_product_id TEXT,
  ADD COLUMN IF NOT EXISTS ticto_checkout_url TEXT;

-- Criar tabela de logs de pagamento para auditoria
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  service_id UUID REFERENCES public.hub_services(id),
  transaction_id TEXT,
  event_type TEXT NOT NULL,
  payload JSONB,
  status TEXT DEFAULT 'received',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas admins podem gerenciar logs de pagamento
CREATE POLICY "Admins can manage payment logs"
ON public.payment_logs FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_payment_logs_user_id ON public.payment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_service_id ON public.payment_logs(service_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_transaction_id ON public.payment_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_hub_services_ticto_product_id ON public.hub_services(ticto_product_id);

-- Adicionar constraint unique em user_hub_services para upsert funcionar
ALTER TABLE public.user_hub_services 
ADD CONSTRAINT user_hub_services_user_service_unique UNIQUE (user_id, service_id);