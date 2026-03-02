/**
 * Hooks for WhatsApp Batch Dispatch admin UI.
 * Pattern: TanStack Query v5 + supabase.functions.invoke + toast.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ── Types ────────────────────────────────────────────────────────────

export interface BatchJob {
  id: string;
  flow_id: string;
  name: string;
  source_type: 'report_backfill' | 'manual_list';
  source_config: Record<string, unknown>;
  contacts_per_cycle: number;
  business_hours_only: boolean;
  total_contacts: number;
  contacts_queued: number;
  contacts_sent: number;
  contacts_failed: number;
  contacts_skipped: number;
  status: 'queued' | 'processing' | 'paused' | 'completed' | 'cancelled' | 'scheduled';
  created_at: string;
  updated_at: string;
  started_at: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  paused_at: string | null;
  error_rate: number;
  last_cycle_at: string | null;
  metadata: Record<string, unknown>;
}

export interface BatchContact {
  id: string;
  batch_job_id: string;
  phone: string;
  lead_id: string | null;
  lead_name: string | null;
  lead_email: string | null;
  variables: Record<string, string>;
  status: 'queued' | 'processing' | 'sent' | 'failed' | 'skipped';
  session_id: string | null;
  processed_at: string | null;
  error_message: string | null;
  skip_reason: string | null;
  position: number;
  created_at: string;
}

export interface PreviewResult {
  eligible_count: number;
  sample: Array<{ phone: string; name: string; email: string }>;
}

// ── Query: Batch jobs for a flow ─────────────────────────────────

export function useBatchJobs(flowId: string | undefined) {
  return useQuery<BatchJob[]>({
    queryKey: ['batch-jobs', flowId],
    queryFn: async () => {
      if (!flowId) return [];
      const { data, error } = await supabase
        .from('whatsapp_batch_jobs')
        .select('*')
        .eq('flow_id', flowId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as BatchJob[];
    },
    enabled: !!flowId,
    refetchInterval: 15000,
  });
}

// ── Query: Batch contacts for a job ──────────────────────────────

export function useBatchContacts(jobId: string | undefined, limit = 100) {
  return useQuery<BatchContact[]>({
    queryKey: ['batch-contacts', jobId, limit],
    queryFn: async () => {
      if (!jobId) return [];
      const { data, error } = await supabase
        .from('whatsapp_batch_contacts')
        .select('*')
        .eq('batch_job_id', jobId)
        .order('position', { ascending: true })
        .limit(limit);
      if (error) throw error;
      return (data || []) as unknown as BatchContact[];
    },
    enabled: !!jobId,
    refetchInterval: 15000,
  });
}

// ── Mutation: Preview eligible contacts ──────────────────────────

export function usePreviewBatchContacts() {
  return useMutation<PreviewResult, Error, string>({
    mutationFn: async (flowId: string) => {
      const { data, error } = await supabase.functions.invoke('process-whatsapp-batch', {
        body: { action: 'preview', flowId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as PreviewResult;
    },
  });
}

// ── Mutation: Create batch job ───────────────────────────────────

export function useCreateBatchJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      flowId: string;
      name: string;
      sourceType: 'report_backfill' | 'manual_list';
      contactsPerCycle?: number;
      businessHoursOnly?: boolean;
      maxContacts?: number;
      notifyOnComplete?: boolean;
      manualContacts?: Array<{ phone: string; lead_name?: string }>;
      scheduledAt?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('process-whatsapp-batch', {
        body: {
          action: 'create',
          ...params,
          createdBy: user?.id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { jobId: string; totalContacts: number };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batch-jobs', variables.flowId] });
      const isScheduled = !!variables.scheduledAt;
      toast({
        title: isScheduled ? 'Lote agendado com sucesso' : 'Lote criado com sucesso',
        description: `${data.totalContacts} contatos na fila`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar lote',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ── Mutation: Pause batch job ────────────────────────────────────

export function usePauseBatchJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ jobId, flowId }: { jobId: string; flowId: string }) => {
      const { data, error } = await supabase.functions.invoke('process-whatsapp-batch', {
        body: { action: 'pause', jobId },
      });
      if (error) throw error;
      return { flowId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['batch-jobs', data.flowId] });
      toast({ title: 'Lote pausado' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao pausar lote', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Resume batch job ───────────────────────────────────

export function useResumeBatchJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ jobId, flowId }: { jobId: string; flowId: string }) => {
      const { data, error } = await supabase.functions.invoke('process-whatsapp-batch', {
        body: { action: 'resume', jobId },
      });
      if (error) throw error;
      return { flowId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['batch-jobs', data.flowId] });
      toast({ title: 'Lote retomado' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao retomar lote', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Cancel batch job ───────────────────────────────────

export function useCancelBatchJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ jobId, flowId }: { jobId: string; flowId: string }) => {
      const { data, error } = await supabase.functions.invoke('process-whatsapp-batch', {
        body: { action: 'cancel', jobId },
      });
      if (error) throw error;
      return { flowId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['batch-jobs', data.flowId] });
      toast({ title: 'Lote cancelado' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao cancelar lote', description: error.message, variant: 'destructive' });
    },
  });
}
