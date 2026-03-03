import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ManyChatFlow, ManyChatFlowLog } from './useManyChatFlows';

// ── Query: All flows (admin, includes disabled) ──────────────────────

export function useAdminManyChatFlows() {
  return useQuery<ManyChatFlow[]>({
    queryKey: ['admin-manychat-flows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manychat_flows' as any)
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ManyChatFlow[];
    },
  });
}

// ── Mutation: Toggle enabled ─────────────────────────────────────────

export function useToggleManyChatFlow() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('manychat_flows' as any)
        .update({ enabled, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { enabled }) => {
      toast({ title: enabled ? 'Flow ativado' : 'Flow desativado' });
      queryClient.invalidateQueries({ queryKey: ['admin-manychat-flows'] });
      queryClient.invalidateQueries({ queryKey: ['manychat-flows'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Update flow fields ─────────────────────────────────────

interface UpdateFlowInput {
  id: string;
  mc_flow_ns?: string | null;
  hsm_template_name?: string | null;
  hsm_template_language?: string;
  hsm_template_params?: Array<{ position: number; variable: string }>;
  hsm_template_preview?: string | null;
  email_fallback_template?: string | null;
  description?: string | null;
}

export function useUpdateManyChatFlow() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...fields }: UpdateFlowInput) => {
      const { data, error } = await supabase
        .from('manychat_flows' as any)
        .update({ ...fields, updated_at: new Date().toISOString() } as any)
        .eq('id', id)
        .select('id') as any;
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Update não aplicado — verifique permissões de admin');
      }
    },
    onSuccess: () => {
      toast({ title: 'Flow atualizado' });
      queryClient.invalidateQueries({ queryKey: ['admin-manychat-flows'] });
      queryClient.invalidateQueries({ queryKey: ['manychat-flows'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Query: Recent flow logs ──────────────────────────────────────────

export function useAdminManyChatFlowLogs(limit = 50) {
  return useQuery<ManyChatFlowLog[]>({
    queryKey: ['admin-manychat-flow-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manychat_flow_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as unknown as ManyChatFlowLog[];
    },
    refetchInterval: 30000,
  });
}
