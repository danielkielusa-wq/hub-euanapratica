-- Remover índice parcial que não funciona com upsert do PostgREST
DROP INDEX IF EXISTS payment_logs_transaction_event_unique;

-- Remover duplicatas antes de criar constraint (manter o mais recente)
DELETE FROM payment_logs a USING payment_logs b
WHERE a.transaction_id = b.transaction_id 
  AND a.event_type = b.event_type 
  AND a.created_at < b.created_at
  AND a.transaction_id IS NOT NULL;

-- Criar constraint única (funciona com onConflict do Supabase JS)
ALTER TABLE payment_logs ADD CONSTRAINT payment_logs_transaction_event_key 
UNIQUE (transaction_id, event_type);