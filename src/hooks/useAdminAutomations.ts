/**
 * Hook for managing N8N automations in admin UI.
 * Pattern: TanStack Query + mutations + toast notifications.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface N8NAutomation {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  trigger_event: string;
  webhook_url: string | null;
  webhook_method: string;
  headers: Record<string, string>;
  enabled: boolean;
  category: string;
  timeout_ms: number;
  max_retries: number;
  last_triggered_at: string | null;
  last_status: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface N8NWebhookLog {
  id: string;
  automation_id: string | null;
  automation_name: string;
  trigger_event: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  duration_ms: number | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

// ── Query: All automations ──────────────────────────────────────────
export function useAutomations() {
  return useQuery<N8NAutomation[]>({
    queryKey: ['n8n-automations'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('n8n_automations')
        .select('*')
        .order('category')
        .order('display_name');
      if (error) throw error;
      return (data || []) as N8NAutomation[];
    },
  });
}

// ── Query: Webhook logs ─────────────────────────────────────────────
export function useWebhookLogs(automationId?: string | null, limit = 50) {
  return useQuery<N8NWebhookLog[]>({
    queryKey: ['n8n-webhook-logs', automationId, limit],
    queryFn: async () => {
      let query = (supabase as any)
        .from('n8n_webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (automationId) {
        query = query.eq('automation_id', automationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as N8NWebhookLog[];
    },
    refetchInterval: 30000,
  });
}

// ── Mutation: Toggle enabled ────────────────────────────────────────
export function useToggleAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await (supabase as any)
        .from('n8n_automations')
        .update({ enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['n8n-automations'] });
      toast({ title: enabled ? 'Automacao ativada' : 'Automacao desativada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao alterar status', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Update automation ─────────────────────────────────────
export function useUpdateAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      webhook_url?: string | null;
      headers?: Record<string, string>;
      timeout_ms?: number;
      max_retries?: number;
      metadata?: Record<string, unknown>;
      description?: string;
    }) => {
      const { id, ...updates } = input;
      const { error } = await (supabase as any)
        .from('n8n_automations')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['n8n-automations'] });
      toast({ title: 'Automacao atualizada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Test webhook ──────────────────────────────────────────
export function useTestAutomation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (automation: N8NAutomation) => {
      if (!automation.webhook_url) throw new Error('Webhook URL nao configurada');

      const testPayload = {
        event: automation.trigger_event.replace('.*', '.test'),
        timestamp: new Date().toISOString(),
        source: 'enp_hub_admin_test',
        test: true,
        lead_id: '00000000-0000-0000-0000-000000000000',
        lead_name: 'Lead Teste',
        lead_email: 'teste@example.com',
        lead_phone: '5511999999999',
      };

      const response = await fetch(automation.webhook_url, {
        method: automation.webhook_method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(automation.headers || {}),
        },
        body: JSON.stringify(testPayload),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);
      }

      return { status: response.status };
    },
    onSuccess: () => {
      toast({ title: 'Teste enviado com sucesso' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro no teste', description: error.message, variant: 'destructive' });
    },
  });
}
