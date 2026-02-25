-- ============================================================
-- FIX: FK constraints blocking user deletion from admin panel
-- ============================================================
-- Problem: ~15 FK constraints reference auth.users or profiles(id)
-- without ON DELETE clause, defaulting to RESTRICT. This prevents
-- supabaseAdmin.auth.admin.deleteUser() from completing.
--
-- Strategy: SET NULL for all metadata/audit columns (who created,
-- updated, cancelled, etc.) to preserve historical records while
-- allowing user deletion.
-- ============================================================

-- ============================================================
-- GROUP 1: FKs referencing auth.users(id)
-- ============================================================

-- materials.uploaded_by
ALTER TABLE public.materials
  DROP CONSTRAINT IF EXISTS materials_uploaded_by_fkey;
ALTER TABLE public.materials
  ADD CONSTRAINT materials_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- app_configs.updated_by
ALTER TABLE public.app_configs
  DROP CONSTRAINT IF EXISTS app_configs_updated_by_fkey;
ALTER TABLE public.app_configs
  ADD CONSTRAINT app_configs_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- bookings.cancelled_by
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_cancelled_by_fkey;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_cancelled_by_fkey
  FOREIGN KEY (cancelled_by) REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- booking_history.performed_by
ALTER TABLE public.booking_history
  DROP CONSTRAINT IF EXISTS booking_history_performed_by_fkey;
ALTER TABLE public.booking_history
  ADD CONSTRAINT booking_history_performed_by_fkey
  FOREIGN KEY (performed_by) REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- api_configs.updated_by
ALTER TABLE public.api_configs
  DROP CONSTRAINT IF EXISTS api_configs_updated_by_fkey;
ALTER TABLE public.api_configs
  ADD CONSTRAINT api_configs_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- email_templates.created_by
ALTER TABLE public.email_templates
  DROP CONSTRAINT IF EXISTS email_templates_created_by_fkey;
ALTER TABLE public.email_templates
  ADD CONSTRAINT email_templates_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- email_templates.updated_by
ALTER TABLE public.email_templates
  DROP CONSTRAINT IF EXISTS email_templates_updated_by_fkey;
ALTER TABLE public.email_templates
  ADD CONSTRAINT email_templates_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- api_cost_logs.user_id (preserve cost logs, null the user)
ALTER TABLE public.api_cost_logs
  DROP CONSTRAINT IF EXISTS api_cost_logs_user_id_fkey;
ALTER TABLE public.api_cost_logs
  ADD CONSTRAINT api_cost_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- whatsapp_templates.created_by
ALTER TABLE public.whatsapp_templates
  DROP CONSTRAINT IF EXISTS whatsapp_templates_created_by_fkey;
ALTER TABLE public.whatsapp_templates
  ADD CONSTRAINT whatsapp_templates_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- whatsapp_templates.updated_by
ALTER TABLE public.whatsapp_templates
  DROP CONSTRAINT IF EXISTS whatsapp_templates_updated_by_fkey;
ALTER TABLE public.whatsapp_templates
  ADD CONSTRAINT whatsapp_templates_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- ============================================================
-- GROUP 2: FKs referencing profiles(id)
-- (profiles cascades from auth.users, so these also block)
-- ============================================================

-- payment_logs.user_id (preserve payment audit trail)
ALTER TABLE public.payment_logs
  DROP CONSTRAINT IF EXISTS payment_logs_user_id_fkey;
ALTER TABLE public.payment_logs
  ADD CONSTRAINT payment_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- leads.imported_by (table may not exist in production yet)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_imported_by_fkey;
    ALTER TABLE public.leads ADD CONSTRAINT leads_imported_by_fkey
      FOREIGN KEY (imported_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- lead_interactions.created_by (table may not exist in production yet)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lead_interactions') THEN
    ALTER TABLE public.lead_interactions DROP CONSTRAINT IF EXISTS lead_interactions_created_by_fkey;
    ALTER TABLE public.lead_interactions ADD CONSTRAINT lead_interactions_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- lead_tasks.completed_by and created_by (table may not exist in production yet)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lead_tasks') THEN
    ALTER TABLE public.lead_tasks DROP CONSTRAINT IF EXISTS lead_tasks_completed_by_fkey;
    ALTER TABLE public.lead_tasks ADD CONSTRAINT lead_tasks_completed_by_fkey
      FOREIGN KEY (completed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

    ALTER TABLE public.lead_tasks DROP CONSTRAINT IF EXISTS lead_tasks_created_by_fkey;
    ALTER TABLE public.lead_tasks ADD CONSTRAINT lead_tasks_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;
