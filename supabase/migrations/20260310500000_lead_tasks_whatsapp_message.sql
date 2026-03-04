-- Add whatsapp_message column to lead_tasks
-- Stores AI-generated WhatsApp message ready to copy/send

ALTER TABLE public.lead_tasks
  ADD COLUMN IF NOT EXISTS whatsapp_message TEXT;
