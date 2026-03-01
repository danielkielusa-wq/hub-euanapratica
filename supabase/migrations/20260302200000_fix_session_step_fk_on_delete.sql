-- Fix: allow deleting whatsapp_flow_steps even when sessions reference them.
-- Change current_step_id FK from RESTRICT (default) to SET NULL.
-- A NULL current_step_id simply means the session is not on any specific step.

ALTER TABLE public.whatsapp_flow_sessions
  DROP CONSTRAINT whatsapp_flow_sessions_current_step_id_fkey;

ALTER TABLE public.whatsapp_flow_sessions
  ADD CONSTRAINT whatsapp_flow_sessions_current_step_id_fkey
    FOREIGN KEY (current_step_id)
    REFERENCES public.whatsapp_flow_steps(id)
    ON DELETE SET NULL;
