-- ============================================================================
-- Fix recommend-product trigger: add missing app_configs entries
-- The trigger_recommend_product() function reads supabase_edge_url and
-- supabase_anon_key from app_configs, but these were never seeded.
-- Without them the trigger silently exits and recommendations stay "pending".
-- ============================================================================

-- 1. Insert missing config entries (idempotent via ON CONFLICT)
INSERT INTO app_configs (key, value, description) VALUES
  ('supabase_edge_url',
   'https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1',
   'Base URL for Supabase Edge Functions (used by DB triggers via pg_net)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO app_configs (key, value, description) VALUES
  ('supabase_anon_key',
   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcWdueHlucmN5bHhzZHpibG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTI1NTksImV4cCI6MjA4NTUyODU1OX0.YJGbf2Ja79mshCRG5I6lEhOvmstaeuZqJQVrTi9jdmg',
   'Supabase anonymous key (used by DB triggers to call Edge Functions via pg_net)')
ON CONFLICT (key) DO NOTHING;

-- 2. Reset stuck "pending" records so the frontend polling can re-trigger them.
--    The DB trigger only fires on INSERT/UPDATE of formatted_report, so records
--    that already have a formatted_report won't re-trigger — the frontend
--    polling path in PublicReport.tsx handles these.
--    (No-op if no pending records exist.)
