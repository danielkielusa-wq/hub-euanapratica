-- Add 'assistant' role for Customer Associate (Assistente de Relacionamento)
-- This role has access to leads management, WhatsApp, tasks, and AI tools
-- but NOT to sensitive financial data, system config, or user management.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'assistant';
