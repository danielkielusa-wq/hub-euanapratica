/**
 * Hook for managing WhatsApp Flows in admin UI.
 * Pattern: TanStack Query + mutations + toast notifications.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ── Types ────────────────────────────────────────────────────────────

export interface WhatsAppFlow {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  trigger_type: 'event' | 'keyword' | 'manual';
  trigger_config: Record<string, unknown>;
  status: 'draft' | 'active' | 'paused' | 'archived';
  allow_concurrent: boolean;
  session_timeout_hours: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Computed (from join/count)
  step_count?: number;
  active_session_count?: number;
}

export interface WhatsAppFlowStep {
  id: string;
  flow_id: string;
  step_order: number;
  step_key: string;
  display_name: string | null;
  step_type: 'message' | 'delay' | 'wait_reply';
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppFlowSession {
  id: string;
  flow_id: string;
  lead_id: string | null;
  phone: string;
  current_step_id: string | null;
  status: string;
  resume_at: string | null;
  timeout_at: string | null;
  variables: Record<string, string>;
  last_reply_text: string | null;
  messages_sent: number;
  messages_received: number;
  started_at: string;
  completed_at: string | null;
  last_activity_at: string;
  trigger_type: string | null;
  trigger_data: Record<string, unknown>;
  error_message: string | null;
  metadata: Record<string, unknown>;
  // Joined
  current_step?: WhatsAppFlowStep | null;
}

export interface FlowFormInput {
  name: string;
  display_name: string;
  description?: string;
  trigger_type: 'event' | 'keyword' | 'manual';
  trigger_config: Record<string, unknown>;
  allow_concurrent?: boolean;
  session_timeout_hours?: number;
}

export interface StepFormInput {
  flow_id: string;
  step_order: number;
  step_key: string;
  display_name?: string;
  step_type: 'message' | 'delay' | 'wait_reply';
  config: Record<string, unknown>;
}

// ── Query: All flows with counts ─────────────────────────────────────

export function useWhatsAppFlows() {
  return useQuery<WhatsAppFlow[]>({
    queryKey: ['whatsapp-flows'],
    queryFn: async () => {
      // Fetch flows
      const { data: flows, error } = await supabase
        .from('whatsapp_flows')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(100);
      if (error) throw error;

      // Fetch step counts per flow (scoped to fetched flows)
      const flowIds = (flows || []).map((f) => f.id);
      const { data: stepCounts } = flowIds.length > 0
        ? await supabase
            .from('whatsapp_flow_steps')
            .select('flow_id')
            .in('flow_id', flowIds)
        : { data: [] };

      // Fetch active session counts per flow (scoped to fetched flows)
      const { data: sessionCounts } = flowIds.length > 0
        ? await supabase
            .from('whatsapp_flow_sessions')
            .select('flow_id')
            .in('flow_id', flowIds)
            .in('status', ['active', 'waiting_delay', 'waiting_reply'])
        : { data: [] };

      const stepCountMap: Record<string, number> = {};
      for (const s of stepCounts || []) {
        stepCountMap[s.flow_id] = (stepCountMap[s.flow_id] || 0) + 1;
      }

      const sessionCountMap: Record<string, number> = {};
      for (const s of sessionCounts || []) {
        sessionCountMap[s.flow_id] = (sessionCountMap[s.flow_id] || 0) + 1;
      }

      return ((flows || []) as WhatsAppFlow[]).map((f) => ({
        ...f,
        step_count: stepCountMap[f.id] || 0,
        active_session_count: sessionCountMap[f.id] || 0,
      }));
    },
  });
}

// ── Query: Flow detail with steps ────────────────────────────────────

export function useWhatsAppFlowDetail(flowId: string | undefined) {
  return useQuery({
    queryKey: ['whatsapp-flow-detail', flowId],
    queryFn: async () => {
      if (!flowId) return null;

      const { data: flow, error } = await supabase
        .from('whatsapp_flows')
        .select('*')
        .eq('id', flowId)
        .single();
      if (error) throw error;

      const { data: steps, error: stepsError } = await supabase
        .from('whatsapp_flow_steps')
        .select('*')
        .eq('flow_id', flowId)
        .order('step_order', { ascending: true });
      if (stepsError) throw stepsError;

      return {
        flow: flow as WhatsAppFlow,
        steps: (steps || []) as WhatsAppFlowStep[],
      };
    },
    enabled: !!flowId,
  });
}

// ── Query: Flow sessions ─────────────────────────────────────────────

export function useFlowSessions(flowId: string | undefined, limit = 50) {
  return useQuery<WhatsAppFlowSession[]>({
    queryKey: ['whatsapp-flow-sessions', flowId, limit],
    queryFn: async () => {
      if (!flowId) return [];
      const { data, error } = await supabase
        .from('whatsapp_flow_sessions')
        .select('*, current_step:whatsapp_flow_steps(id, step_key, display_name, step_type)')
        .eq('flow_id', flowId)
        .order('started_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as WhatsAppFlowSession[];
    },
    enabled: !!flowId,
    refetchInterval: 15000,
  });
}

// ── Mutation: Create flow ────────────────────────────────────────────

export function useCreateFlow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: FlowFormInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('whatsapp_flows')
        .insert({ ...input, created_by: user?.id })
        .select('*')
        .single();
      if (error) throw error;
      return data as WhatsAppFlow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flows'] });
      toast({ title: 'Fluxo criado com sucesso' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar fluxo', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Update flow ────────────────────────────────────────────

export function useUpdateFlow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: Partial<FlowFormInput> & { id: string }) => {
      const { id, ...updates } = input;
      const { error } = await supabase
        .from('whatsapp_flows')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flows'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flow-detail'] });
      toast({ title: 'Fluxo atualizado' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar fluxo', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Delete flow ────────────────────────────────────────────

export function useDeleteFlow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whatsapp_flows')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flows'] });
      toast({ title: 'Fluxo excluído' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir fluxo', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Toggle flow status (active/paused) ─────────────────────

export function useToggleFlowStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'paused' }) => {
      const { error } = await supabase
        .from('whatsapp_flows')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flows'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flow-detail'] });
      toast({ title: status === 'active' ? 'Fluxo ativado' : 'Fluxo pausado' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao alterar status', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Duplicate flow ─────────────────────────────────────────

export function useDuplicateFlow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (sourceFlowId: string) => {
      // Fetch source flow + steps
      const { data: source, error: sourceErr } = await supabase
        .from('whatsapp_flows')
        .select('*')
        .eq('id', sourceFlowId)
        .single();
      if (sourceErr) throw sourceErr;

      const { data: steps, error: stepsErr } = await supabase
        .from('whatsapp_flow_steps')
        .select('*')
        .eq('flow_id', sourceFlowId)
        .order('step_order', { ascending: true });
      if (stepsErr) throw stepsErr;

      const { data: { user } } = await supabase.auth.getUser();

      // Create new flow
      const { data: newFlow, error: newErr } = await supabase
        .from('whatsapp_flows')
        .insert({
          name: `${source.name}_copy_${Date.now()}`,
          display_name: `${source.display_name} (cópia)`,
          description: source.description,
          trigger_type: source.trigger_type,
          trigger_config: source.trigger_config,
          status: 'draft',
          allow_concurrent: source.allow_concurrent,
          session_timeout_hours: source.session_timeout_hours,
          created_by: user?.id,
        })
        .select('*')
        .single();
      if (newErr) throw newErr;

      // Clone steps
      if (steps && steps.length > 0) {
        const newSteps = steps.map((s: any) => ({
          flow_id: newFlow.id,
          step_order: s.step_order,
          step_key: s.step_key,
          display_name: s.display_name,
          step_type: s.step_type,
          config: s.config,
        }));

        const { error: insertErr } = await supabase
          .from('whatsapp_flow_steps')
          .insert(newSteps);
        if (insertErr) throw insertErr;
      }

      return newFlow as WhatsAppFlow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flows'] });
      toast({ title: 'Fluxo duplicado' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao duplicar fluxo', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Create step ────────────────────────────────────────────

export function useCreateStep() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: StepFormInput) => {
      // Use RPC to atomically shift existing step_order values and insert
      const { data, error } = await supabase.rpc('insert_flow_step_with_shift', {
        p_flow_id: input.flow_id,
        p_step_order: input.step_order,
        p_step_key: input.step_key,
        p_display_name: input.display_name || null,
        p_step_type: input.step_type,
        p_config: input.config,
      });
      if (error) throw error;
      return { flow_id: input.flow_id, id: data } as WhatsAppFlowStep;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flow-detail', data.flow_id] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flows'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar etapa', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Update step ────────────────────────────────────────────

export function useUpdateStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<StepFormInput> & { id: string; flow_id: string }) => {
      const { id, flow_id, ...updates } = input;
      const { error } = await supabase
        .from('whatsapp_flow_steps')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      return { flow_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flow-detail', data.flow_id] });
    },
  });
}

// ── Mutation: Delete step ────────────────────────────────────────────

export function useDeleteStep() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, flow_id }: { id: string; flow_id: string }) => {
      const { error } = await supabase
        .from('whatsapp_flow_steps')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { flow_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flow-detail', data.flow_id] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flows'] });
      toast({ title: 'Etapa excluída' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir etapa', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Reorder steps ──────────────────────────────────────────

export function useReorderSteps() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ flow_id, steps }: { flow_id: string; steps: { id: string; step_order: number }[] }) => {
      // Use RPC for atomic reorder within a single transaction
      const { error } = await supabase.rpc('reorder_flow_steps', {
        p_flow_id: flow_id,
        p_steps: steps,
      });
      if (error) throw error;
      return { flow_id };
    },
    // Optimistic update: immediately reorder UI while mutation runs
    onMutate: async ({ flow_id, steps }) => {
      await queryClient.cancelQueries({ queryKey: ['whatsapp-flow-detail', flow_id] });

      const previousData = queryClient.getQueryData(['whatsapp-flow-detail', flow_id]);

      queryClient.setQueryData(['whatsapp-flow-detail', flow_id], (old: any) => {
        if (!old) return old;
        const orderMap = new Map(steps.map((s) => [s.id, s.step_order]));
        const updatedSteps = old.steps
          .map((s: WhatsAppFlowStep) => ({
            ...s,
            step_order: orderMap.get(s.id) ?? s.step_order,
          }))
          .sort((a: WhatsAppFlowStep, b: WhatsAppFlowStep) => a.step_order - b.step_order);
        return { ...old, steps: updatedSteps };
      });

      return { previousData, flow_id };
    },
    onError: (_error, _vars, context) => {
      // Roll back on error
      if (context?.previousData) {
        queryClient.setQueryData(['whatsapp-flow-detail', context.flow_id], context.previousData);
      }
      toast({ title: 'Erro ao reordenar etapas', variant: 'destructive' });
    },
    onSettled: (data) => {
      if (data?.flow_id) {
        queryClient.invalidateQueries({ queryKey: ['whatsapp-flow-detail', data.flow_id] });
      }
    },
  });
}

// ── Mutation: Cancel session ─────────────────────────────────────────

export function useCancelSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, flow_id }: { id: string; flow_id: string }) => {
      const { error } = await supabase
        .from('whatsapp_flow_sessions')
        .update({ status: 'cancelled', completed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return { flow_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flow-sessions', data.flow_id] });
      toast({ title: 'Sessão cancelada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao cancelar sessão', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Trigger flow manually ──────────────────────────────────

export function useTriggerFlowManually() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ flowId, phone, leadId, leadName, accessToken, notifyOnComplete }: {
      flowId: string;
      phone: string;
      leadId?: string;
      leadName?: string;
      accessToken?: string;
      notifyOnComplete?: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke('execute-whatsapp-flow', {
        body: {
          trigger_type: 'manual',
          trigger_data: {
            flow_id: flowId,
            phone,
            lead_id: leadId || null,
            lead_name: leadName || null,
            ...(accessToken ? { access_token: accessToken } : {}),
            ...(notifyOnComplete ? { notify_on_complete: true } : {}),
          },
        },
      });
      if (error) {
        // Extract actual error message from Edge Function response
        let msg = error.message;
        try {
          const body = await (error as any).context?.json?.();
          if (body?.error) msg = body.error;
        } catch { /* ignore parse errors */ }
        throw new Error(msg);
      }
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Fluxo iniciado com sucesso' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao iniciar fluxo', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Compliance Audit ──────────────────────────────────────────────────────────

export interface AuditFlowWithSteps {
  id: string;
  name: string;
  display_name: string;
  status: string;
  trigger_type: string;
  session_timeout_hours: number;
  steps: WhatsAppFlowStep[];
}

export interface AuditData {
  flows: AuditFlowWithSteps[];
  templateBodies: Record<string, string>; // template_name → body text
}

export function useFlowAuditData() {
  return useQuery<AuditData>({
    queryKey: ['whatsapp-flow-audit'],
    queryFn: async () => {
      const [flowsResult, stepsResult, templatesResult] = await Promise.all([
        supabase
          .from('whatsapp_flows')
          .select('id, name, display_name, status, trigger_type, session_timeout_hours')
          .eq('status', 'active')
          .order('updated_at', { ascending: false }),
        supabase
          .from('whatsapp_flow_steps')
          .select('*')
          .order('step_order', { ascending: true }),
        supabase
          .from('whatsapp_templates')
          .select('name, body')
          .eq('enabled', true),
      ]);

      if (flowsResult.error) throw flowsResult.error;
      if (stepsResult.error) throw stepsResult.error;
      // Templates query is best-effort — don't fail audit if templates table is inaccessible

      const stepsByFlow = (stepsResult.data || []).reduce<Record<string, WhatsAppFlowStep[]>>((acc, s) => {
        const step = s as WhatsAppFlowStep;
        if (!acc[step.flow_id]) acc[step.flow_id] = [];
        acc[step.flow_id].push(step);
        return acc;
      }, {});

      const templateBodies = (templatesResult.data || []).reduce<Record<string, string>>((acc, t) => {
        acc[(t as any).name] = String((t as any).body || '');
        return acc;
      }, {});

      return {
        flows: (flowsResult.data || []).map((f) => ({
          ...f,
          steps: stepsByFlow[f.id] || [],
        })),
        templateBodies,
      };
    },
    enabled: false,
    staleTime: 0,
  });
}
