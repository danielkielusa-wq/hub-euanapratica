-- 1. Limpar entradas duplicadas existentes (manter a mais recente)
DELETE FROM payment_logs a
USING payment_logs b
WHERE a.transaction_id = b.transaction_id
  AND a.event_type = b.event_type
  AND a.transaction_id IS NOT NULL
  AND a.created_at < b.created_at;

-- 2. Criar índice único para prevenir duplicatas futuras
CREATE UNIQUE INDEX IF NOT EXISTS payment_logs_transaction_event_unique 
ON payment_logs (transaction_id, event_type) 
WHERE transaction_id IS NOT NULL;