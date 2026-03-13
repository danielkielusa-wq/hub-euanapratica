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
  cron_job_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CronSchedule {
  jobname: string;
  schedule: string;
  command: string;
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

// ── Mutation: Create automation ────────────────────────────────────
export function useCreateAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      display_name: string;
      trigger_event: string;
      webhook_url?: string | null;
      category?: string;
      description?: string;
    }) => {
      const { error } = await (supabase as any)
        .from('n8n_automations')
        .insert({
          ...input,
          enabled: false,
          webhook_method: 'POST',
          headers: {},
          timeout_ms: 10000,
          max_retries: 3,
          metadata: {},
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['n8n-automations'] });
      toast({ title: 'Automacao criada com sucesso' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar automacao', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Delete automation ────────────────────────────────────
export function useDeleteAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('n8n_automations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['n8n-automations'] });
      toast({ title: 'Automacao removida' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    },
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
      display_name?: string;
      name?: string;
      trigger_event?: string;
      description?: string | null;
      category?: string;
      webhook_url?: string | null;
      headers?: Record<string, string>;
      timeout_ms?: number;
      max_retries?: number;
      metadata?: Record<string, unknown>;
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

// ── Mutation: Test webhook (proxied through Edge Function to avoid CORS) ──
export function useTestAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (automation: N8NAutomation) => {
      if (!automation.webhook_url) throw new Error('Webhook URL nao configurada');

      const { data, error } = await supabase.functions.invoke('test-n8n-webhook', {
        body: { automation_id: automation.id },
      });

      if (error) throw new Error(error.message || 'Erro ao chamar Edge Function');
      if (data?.status === 'error' || data?.status === 'timeout') {
        throw new Error(data.error || `Webhook retornou ${data.status}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['n8n-automations'] });
      queryClient.invalidateQueries({ queryKey: ['n8n-webhook-logs'] });
      toast({ title: 'Teste enviado com sucesso' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro no teste', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Query: All cron jobs ──────────────────────────────────────────────
export interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  command: string;
  active: boolean;
}

export function useAllCronJobs() {
  return useQuery<CronJob[]>({
    queryKey: ['cron-jobs-all'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_cron_jobs');
      if (error) throw error;
      return (data || []) as CronJob[];
    },
    staleTime: 60_000,
  });
}

// ── Query: Cron schedule for a job ────────────────────────────────────
export function useCronSchedule(jobName: string | null) {
  return useQuery<CronSchedule | null>({
    queryKey: ['cron-schedule', jobName],
    enabled: !!jobName,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_cron_schedule', {
        p_job_name: jobName!,
      });
      if (error) throw error;
      const rows = data as CronSchedule[];
      return rows?.[0] ?? null;
    },
    staleTime: 60_000,
  });
}

// ── Mutation: Update cron schedule ────────────────────────────────────
export function useUpdateCronSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ jobName, schedule }: { jobName: string; schedule: string }) => {
      const { error } = await supabase.rpc('admin_update_cron_schedule', {
        p_job_name: jobName,
        p_new_schedule: schedule,
      });
      if (error) throw error;
    },
    onSuccess: (_, { jobName }) => {
      queryClient.invalidateQueries({ queryKey: ['cron-schedule', jobName] });
      toast({ title: 'Horario atualizado', description: 'O cron foi reagendado com sucesso.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar horario', description: error.message, variant: 'destructive' });
    },
  });
}
