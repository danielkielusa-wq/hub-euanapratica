-- 1. Atualizar status de serviços com checkout Ticto para 'premium'
UPDATE hub_services 
SET status = 'premium' 
WHERE ticto_checkout_url IS NOT NULL 
  AND status = 'available'
  AND price > 0;

-- 2. Permitir usuários verem seus próprios payment_logs
CREATE POLICY "Users can view own payment logs"
ON public.payment_logs FOR SELECT
USING (user_id = auth.uid());