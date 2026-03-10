/**
 * Hook for managing email campaigns and automations in admin UI.
 * Pattern: TanStack Query + mutations + toast notifications.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

// ── Types ──────────────────────────────────────────────────────────

export interface EmailCampaign {
  id: string;
  name: string;
  description: string | null;
  template_name: string;
  template_variables: Record<string, string>;
  audience_type: string;
  audience_filters: Record<string, unknown>;
  contacts_per_cycle: number;
  total_contacts: number;
  contacts_queued: number;
  contacts_sent: number;
  contacts_failed: number;
  contacts_skipped: number;
  status: string;
  scheduled_at: string | null;
  error_rate: number;
  last_cycle_at: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  paused_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
}

export interface EmailCampaignContact {
  id: string;
  campaign_id: string;
  email: string;
  user_id: string | null;
  lead_id: string | null;
  recipient_name: string | null;
  variables: Record<string, string>;
  status: string;
  processed_at: string | null;
  error_message: string | null;
  skip_reason: string | null;
  resend_id: string | null;
  position: number;
  created_at: string;
}

export interface EmailAutomation {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_event: string | null;
  trigger_cron: string | null;
  trigger_condition: Record<string, unknown>;
  is_drip: boolean;
  drip_steps: Array<{ step: number; delay_days: number; template_name: string }>;
  template_name: string | null;
  template_variables: Record<string, string>;
  enabled: boolean;
  total_sent: number;
  total_skipped: number;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

export interface EmailDripEnrollment {
  id: string;
  automation_id: string;
  email: string;
  user_id: string | null;
  lead_id: string | null;
  recipient_name: string | null;
  current_step: number;
  next_send_at: string;
  status: string;
  steps_completed: Array<{ step: number; template_name: string; sent_at: string; email_sent: boolean }>;
  created_at: string;
  updated_at: string;
}

export interface EmailUnsubscribe {
  email: string;
  unsubscribed_at: string;
  source: string;
  campaign_id: string | null;
  automation_id: string | null;
}

// ── Campaigns ──────────────────────────────────────────────────────

export function useCampaigns() {
  return useQuery<EmailCampaign[]>({
    queryKey: ['email-campaigns'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as EmailCampaign[];
    },
  });
}

export function useCampaignContacts(campaignId: string | null, limit = 100) {
  return useQuery<EmailCampaignContact[]>({
    queryKey: ['email-campaign-contacts', campaignId, limit],
    enabled: !!campaignId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('email_campaign_contacts')
        .select('*')
        .eq('campaign_id', campaignId!)
        .order('position', { ascending: true })
        .limit(limit);
      if (error) throw error;
      return (data || []) as EmailCampaignContact[];
    },
  });
}

// Auto-refresh campaigns every 15s when any are active
export function useActiveCampaignRefresh() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
    }, 15000);
    return () => clearInterval(interval);
  }, [queryClient]);
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      template_name: string;
      template_variables?: Record<string, string>;
      audience_type: string;
      audience_filters?: Record<string, unknown>;
      contacts_per_cycle?: number;
      scheduled_at?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from('email_campaigns')
        .insert({
          ...input,
          created_by: user?.id,
          status: 'draft',
        })
        .select()
        .single();
      if (error) throw error;
      return data as EmailCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast({ title: 'Campanha criada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar campanha', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { id: string } & Partial<EmailCampaign>) => {
      const { id, ...updates } = input;
      const { error } = await (supabase as any)
        .from('email_campaigns')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast({ title: 'Campanha atualizada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('email_campaigns')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast({ title: 'Campanha excluída' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });
}

// Edge Function calls for campaign lifecycle
export function useLaunchCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('process-email-campaign', {
        body: { mode: 'create', campaign_id: campaignId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast({ title: 'Campanha iniciada', description: `${data.total_contacts} contatos na fila` });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao iniciar campanha', description: error.message, variant: 'destructive' });
    },
  });
}

export function usePauseCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('process-email-campaign', {
        body: { mode: 'pause', campaign_id: campaignId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast({ title: 'Campanha pausada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao pausar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useResumeCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('process-email-campaign', {
        body: { mode: 'resume', campaign_id: campaignId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast({ title: 'Campanha retomada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao retomar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCancelCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('process-email-campaign', {
        body: { mode: 'cancel', campaign_id: campaignId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast({ title: 'Campanha cancelada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao cancelar', description: error.message, variant: 'destructive' });
    },
  });
}

export function usePreviewAudience() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { audience_type: string; audience_filters: Record<string, unknown> }) => {
      const { data, error } = await supabase.functions.invoke('process-email-campaign', {
        body: { mode: 'preview', ...input },
      });
      if (error) throw error;
      return data as { total: number; sample: Array<{ email: string; name: string | null }> };
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao carregar preview', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Automations ────────────────────────────────────────────────────

export function useEmailAutomations() {
  return useQuery<EmailAutomation[]>({
    queryKey: ['email-automations'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('email_automations')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []) as EmailAutomation[];
    },
  });
}

export function useToggleEmailAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await (supabase as any)
        .from('email_automations')
        .update({ enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['email-automations'] });
      toast({ title: enabled ? 'Automacao ativada' : 'Automacao desativada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao alterar status', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateEmailAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { id: string } & Partial<EmailAutomation>) => {
      const { id, ...updates } = input;
      const { error } = await (supabase as any)
        .from('email_automations')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-automations'] });
      toast({ title: 'Automacao atualizada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Drip Enrollments ───────────────────────────────────────────────

export function useDripEnrollments(automationId: string | null) {
  return useQuery<EmailDripEnrollment[]>({
    queryKey: ['email-drip-enrollments', automationId],
    enabled: !!automationId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('email_drip_enrollments')
        .select('*')
        .eq('automation_id', automationId!)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as EmailDripEnrollment[];
    },
  });
}

export function useCancelEnrollment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('email_drip_enrollments')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-drip-enrollments'] });
      toast({ title: 'Enrollment cancelado' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao cancelar', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Unsubscribes ───────────────────────────────────────────────────

export function useUnsubscribes() {
  return useQuery<EmailUnsubscribe[]>({
    queryKey: ['email-unsubscribes'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('email_unsubscribes')
        .select('*')
        .order('unsubscribed_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as EmailUnsubscribe[];
    },
  });
}

export function useAddUnsubscribe() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await (supabase as any)
        .from('email_unsubscribes')
        .upsert({
          email: email.toLowerCase().trim(),
          source: 'admin',
          unsubscribed_at: new Date().toISOString(),
        }, { onConflict: 'email' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-unsubscribes'] });
      toast({ title: 'Email adicionado a lista de opt-out' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useRemoveUnsubscribe() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await (supabase as any)
        .from('email_unsubscribes')
        .delete()
        .eq('email', email);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-unsubscribes'] });
      toast({ title: 'Email removido da lista de opt-out' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Campaign Events / Stats ────────────────────────────────────────

export function useCampaignStats() {
  return useQuery({
    queryKey: ['email-campaign-stats'],
    queryFn: async () => {
      // Total campaigns by status
      const { data: campaigns } = await (supabase as any)
        .from('email_campaigns')
        .select('status, contacts_sent, contacts_failed, contacts_skipped');

      const stats = {
        total: 0,
        active: 0,
        completed: 0,
        totalSent: 0,
        totalFailed: 0,
      };

      for (const c of campaigns || []) {
        stats.total++;
        if (['queued', 'processing', 'scheduled'].includes(c.status)) stats.active++;
        if (c.status === 'completed') stats.completed++;
        stats.totalSent += c.contacts_sent || 0;
        stats.totalFailed += c.contacts_failed || 0;
      }

      // Open/click rates from events
      const { count: openCount } = await (supabase as any)
        .from('email_campaign_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'open');

      const { count: clickCount } = await (supabase as any)
        .from('email_campaign_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'click');

      return {
        ...stats,
        opens: openCount || 0,
        clicks: clickCount || 0,
        openRate: stats.totalSent > 0 ? ((openCount || 0) / stats.totalSent * 100) : 0,
        clickRate: stats.totalSent > 0 ? ((clickCount || 0) / stats.totalSent * 100) : 0,
      };
    },
  });
}

// ── Test Automation ─────────────────────────────────────────────────

export function useSearchLeads(query: string) {
  return useQuery({
    queryKey: ['search-leads', query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const { data, error } = await (supabase as any)
        .from('career_evaluations')
        .select('id, name, email, access_token, processing_status')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .eq('processing_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Array<{
        id: string;
        name: string;
        email: string;
        access_token: string | null;
        processing_status: string;
      }>;
    },
    enabled: query.length >= 2,
    staleTime: 30000,
  });
}

export function useTestEmailAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      automation,
      lead,
    }: {
      automation: EmailAutomation;
      lead: { id: string; name: string; email: string; access_token: string | null };
    }) => {
      const { data, error } = await supabase.functions.invoke('process-email-automations', {
        body: {
          mode: 'trigger',
          trigger_event: automation.trigger_event || automation.name,
          payload: {
            lead_id: lead.id,
            email: lead.email,
            lead_name: lead.name,
            access_token: lead.access_token,
          },
        },
      });
      if (error) throw new Error(error.message || 'Erro ao chamar Edge Function');
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-automations'] });
      queryClient.invalidateQueries({ queryKey: ['drip-enrollments'] });
      const results = data?.results || [];
      const enrolled = results.some((r: any) => r.enrolled);
      const sent = results.some((r: any) => r.emailSent);
      toast({
        title: 'Teste executado',
        description: enrolled
          ? 'Lead matriculado no drip. D0 sera enviado no proximo ciclo (15 min).'
          : sent
            ? 'Email enviado com sucesso.'
            : 'Trigger processado. Verifique enrollments.',
      });
    },
    onError: (error: any) => {
      toast({ title: 'Erro no teste', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Email Templates (for campaign template picker) ─────────────────

export function useEmailTemplatesList() {
  return useQuery({
    queryKey: ['email-templates-list'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('email_templates')
        .select('name, display_name, category, enabled')
        .eq('enabled', true)
        .order('category')
        .order('display_name');
      if (error) throw error;
      return data as Array<{ name: string; display_name: string; category: string; enabled: boolean }>;
    },
    staleTime: 60000,
  });
}
