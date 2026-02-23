import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CareerEvaluation, LeadInteraction, LeadTask } from '@/types/leads';

// ── Helper: batch-resolve profile names ──────────────────────────────

async function resolveProfileNames(userIds: string[]): Promise<Record<string, string>> {
  if (!userIds.length) return {};
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds);
  if (!profiles) return {};
  return Object.fromEntries(profiles.map((p: any) => [p.id, p.full_name || 'Sem nome']));
}

// ── Query: Single lead ───────────────────────────────────────────────

export function useLeadDetail(id: string) {
  return useQuery<CareerEvaluation>({
    queryKey: ['admin-lead', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('career_evaluations')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as CareerEvaluation;
    },
    enabled: !!id,
  });
}

// ── Query: Lead interactions ─────────────────────────────────────────

export function useLeadInteractions(leadId: string) {
  return useQuery<LeadInteraction[]>({
    queryKey: ['admin-lead-interactions', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_interactions' as any)
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const creatorIds = [...new Set((data || []).map((i: any) => i.created_by).filter(Boolean))];
      const profileMap = await resolveProfileNames(creatorIds as string[]);

      return (data || []).map((i: any) => ({
        ...i,
        creator_name: i.created_by ? profileMap[i.created_by] || 'Desconhecido' : 'Sistema',
      })) as LeadInteraction[];
    },
    enabled: !!leadId,
  });
}

// ── Query: Lead tasks ────────────────────────────────────────────────

export function useLeadTasks(leadId: string) {
  return useQuery<LeadTask[]>({
    queryKey: ['admin-lead-tasks', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_tasks' as any)
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const userIds = [...new Set([
        ...(data || []).map((t: any) => t.created_by),
        ...(data || []).map((t: any) => t.completed_by),
      ].filter(Boolean))];
      const profileMap = await resolveProfileNames(userIds as string[]);

      return (data || []).map((t: any) => ({
        ...t,
        creator_name: t.created_by ? profileMap[t.created_by] : null,
        completer_name: t.completed_by ? profileMap[t.completed_by] : null,
      })) as LeadTask[];
    },
    enabled: !!leadId,
  });
}

// ── Mutation: Add interaction ────────────────────────────────────────

export function useAddInteraction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      lead_id: string;
      type: string;
      content: string;
      direction: string;
      channel: string;
      metadata?: Record<string, any>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('lead_interactions' as any)
        .insert({ ...input, created_by: user.id } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lead-interactions', vars.lead_id] });
      toast({ title: 'Interação registrada!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao registrar interação', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Add task ───────────────────────────────────────────────

export function useAddTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      lead_id: string;
      title: string;
      description?: string;
      type: string;
      priority: string;
      due_date?: string;
      source?: 'manual' | 'ai_suggestion' | 'n8n_automation';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { source, ...rest } = input;
      const { error } = await supabase
        .from('lead_tasks' as any)
        .insert({
          ...rest,
          source: source ?? 'manual',
          status: 'pending',
          created_by: user.id,
        } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lead-tasks', vars.lead_id] });
      toast({ title: 'Tarefa criada!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar tarefa', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Edit interaction ────────────────────────────────────────

export function useEditInteraction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      lead_id: string;
      type: string;
      content: string;
      direction: string;
      channel: string;
    }) => {
      const { id, lead_id, ...updates } = input;
      const { error } = await supabase
        .from('lead_interactions' as any)
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lead-interactions', vars.lead_id] });
      toast({ title: 'Interação atualizada!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar interação', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Delete interaction ─────────────────────────────────────

export function useDeleteInteraction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { id: string; lead_id: string }) => {
      const { error } = await supabase
        .from('lead_interactions' as any)
        .delete()
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lead-interactions', vars.lead_id] });
      toast({ title: 'Interação excluída!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir interação', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Edit task ──────────────────────────────────────────────

export function useEditTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      lead_id: string;
      title: string;
      description?: string;
      type: string;
      priority: string;
      due_date?: string;
    }) => {
      const { id, lead_id, ...updates } = input;
      const { error } = await supabase
        .from('lead_tasks' as any)
        .update({ ...updates, due_date: updates.due_date || null } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lead-tasks', vars.lead_id] });
      toast({ title: 'Tarefa atualizada!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar tarefa', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Delete task ────────────────────────────────────────────

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { id: string; lead_id: string }) => {
      const { error } = await supabase
        .from('lead_tasks' as any)
        .delete()
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lead-tasks', vars.lead_id] });
      toast({ title: 'Tarefa excluída!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir tarefa', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Update task status ─────────────────────────────────────

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { id: string; lead_id: string; status: 'done' | 'skipped' | 'pending' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const updates: any = { status: input.status };
      if (input.status === 'done' || input.status === 'skipped') {
        updates.completed_at = new Date().toISOString();
        updates.completed_by = user.id;
      } else {
        updates.completed_at = null;
        updates.completed_by = null;
      }

      const { error } = await supabase
        .from('lead_tasks' as any)
        .update(updates)
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lead-tasks', vars.lead_id] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-pending-tasks'] });
      toast({ title: 'Tarefa atualizada!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar tarefa', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Update lead phone ──────────────────────────────────────

export function useUpdateLeadPhone() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { id: string; phone: string }) => {
      const { error } = await supabase
        .from('career_evaluations')
        .update({ phone: input.phone })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lead', vars.id] });
      toast({ title: 'Telefone atualizado!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar telefone', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Query: All pending tasks (global) ────────────────────────────────

export interface GlobalTask extends LeadTask {
  lead_name?: string;
  lead_email?: string;
}

export function useAllPendingTasks() {
  return useQuery<GlobalTask[]>({
    queryKey: ['admin-all-pending-tasks'],
    queryFn: async () => {
      const { data: tasks, error } = await supabase
        .from('lead_tasks' as any)
        .select('*')
        .eq('status', 'pending')
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;

      const leadIds = [...new Set((tasks || []).map((t: any) => t.lead_id).filter(Boolean))];
      let leadMap: Record<string, { name: string; email: string }> = {};
      if (leadIds.length) {
        const { data: leads } = await supabase
          .from('career_evaluations')
          .select('id, name, email')
          .in('id', leadIds);
        if (leads) {
          leadMap = Object.fromEntries(leads.map((l: any) => [l.id, { name: l.name || 'Sem nome', email: l.email || '' }]));
        }
      }

      const creatorIds = [...new Set((tasks || []).map((t: any) => t.created_by).filter(Boolean))];
      const profileMap = await resolveProfileNames(creatorIds as string[]);

      return (tasks || []).map((t: any) => ({
        ...t,
        lead_name: leadMap[t.lead_id]?.name || 'Desconhecido',
        lead_email: leadMap[t.lead_id]?.email || '',
        creator_name: t.created_by ? profileMap[t.created_by] : null,
      })) as GlobalTask[];
    },
  });
}
