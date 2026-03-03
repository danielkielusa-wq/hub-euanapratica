import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ── Types ────────────────────────────────────────────────────────────

export interface ManyChatFlow {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  mc_flow_ns: string | null;
  use_case: string;
  trigger_type: string;
  requires_phone: boolean;
  variables: Array<{ key: string; auto: boolean }>;
  email_fallback_template: string | null;
  hsm_template_name: string | null;
  hsm_template_language: string;
  hsm_template_params: Array<{ position: number; variable: string }>;
  hsm_template_preview: string | null;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ManyChatFlowLog {
  id: string;
  lead_id: string;
  flow_id: string | null;
  flow_name: string;
  channel: string;
  trigger_source: string;
  triggered_by: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface TriggerFlowInput {
  lead_id: string;
  flow_name: string;
  variables?: Record<string, string>;
  trigger_source?: string;
}

interface TriggerFlowResult {
  success: boolean;
  channel?: string;
  flow_name?: string;
  fallback?: boolean;
  message?: string;
  error?: string;
}

// ── Query: Available flows ───────────────────────────────────────────

export function useManyChatFlows(useCase?: string) {
  return useQuery<ManyChatFlow[]>({
    queryKey: ['manychat-flows', useCase],
    queryFn: async () => {
      let query = supabase
        .from('manychat_flows' as any)
        .select('*')
        .eq('enabled', true)
        .order('sort_order', { ascending: true });

      if (useCase) {
        query = query.eq('use_case', useCase);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as ManyChatFlow[];
    },
  });
}

// ── Query: Triggerable flows (excludes auto-only) ────────────────────

export function useManyChatTriggerableFlows() {
  return useQuery<ManyChatFlow[]>({
    queryKey: ['manychat-flows-triggerable'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manychat_flows' as any)
        .select('*')
        .eq('enabled', true)
        .neq('trigger_type', 'auto')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as ManyChatFlow[];
    },
  });
}

// ── Mutation: Trigger a flow ─────────────────────────────────────────

export function useTriggerManyChatFlow() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<TriggerFlowResult, Error, TriggerFlowInput>({
    mutationFn: async (input) => {
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('trigger-manychat-flow', {
        body: input,
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

      if (error) throw new Error(error.message || 'Erro ao disparar flow');
      if (!data?.success) throw new Error(data?.error || 'Falha ao disparar flow');

      return data as TriggerFlowResult;
    },
    onSuccess: (result, input) => {
      const msg = result.fallback
        ? `Email enviado (lead sem telefone)`
        : `Flow disparado via WhatsApp`;
      toast({ title: 'Flow disparado', description: msg });
      queryClient.invalidateQueries({ queryKey: ['admin-lead-interactions', input.lead_id] });
      queryClient.invalidateQueries({ queryKey: ['manychat-flow-logs', input.lead_id] });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Query: Flow logs for a lead ──────────────────────────────────────

export function useManyChatFlowLogs(leadId: string) {
  return useQuery<ManyChatFlowLog[]>({
    queryKey: ['manychat-flow-logs', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manychat_flow_logs' as any)
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as unknown as ManyChatFlowLog[];
    },
    enabled: !!leadId,
  });
}
