import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// ── Types ────────────────────────────────────────────────────────

export interface SDRProspect {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  instagram_handle: string | null;
  headline: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  skills: string[] | null;
  experience_years: number | null;
  english_level: string | null;
  ai_score: number | null;
  ai_temperature: string | null;
  ai_qualification: Record<string, unknown> | null;
  ai_qualified_at: string | null;
  outreach_status: string;
  current_step: number;
  next_outreach_at: string | null;
  source: string;
  source_metadata: Record<string, unknown> | null;
  campaign_id: string | null;
  converted_evaluation_id: string | null;
  created_at: string;
  updated_at: string;
  last_contacted_at: string | null;
  last_replied_at: string | null;
}

export interface SDRCampaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  sequence: Array<{
    step: number;
    channel: string;
    delay_hours: number;
    template_key: string;
  }>;
  target_criteria: Record<string, unknown> | null;
  ai_persona: string;
  ai_context: string | null;
  total_prospects: number;
  total_sent: number;
  total_replied: number;
  total_converted: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface SDRTemplate {
  id: string;
  template_key: string;
  channel: string;
  subject_template: string | null;
  body_template: string;
  ai_instructions: string | null;
  variant: string;
  performance_score: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SDROutreachLog {
  id: string;
  prospect_id: string;
  campaign_id: string | null;
  step_number: number;
  channel: string;
  subject: string | null;
  message_body: string;
  status: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

// ── Dashboard Stats ──────────────────────────────────────────────

export function useSDRStats() {
  return useQuery({
    queryKey: ['sdr-stats'],
    queryFn: async () => {
      const [prospectsRes, campaignsRes, outreachRes] = await Promise.all([
        supabase.from('sdr_prospects').select('outreach_status', { count: 'exact' }),
        supabase.from('sdr_campaigns').select('status, total_prospects, total_sent, total_replied, total_converted'),
        supabase.from('sdr_outreach_logs').select('status', { count: 'exact' }),
      ]);

      const prospects = prospectsRes.data || [];
      const campaigns = campaignsRes.data || [];

      const statusCounts: Record<string, number> = {};
      prospects.forEach((p: { outreach_status: string }) => {
        statusCounts[p.outreach_status] = (statusCounts[p.outreach_status] || 0) + 1;
      });

      return {
        total_prospects: prospects.length,
        by_status: statusCounts,
        active_campaigns: campaigns.filter((c: { status: string }) => c.status === 'active').length,
        total_sent: campaigns.reduce((sum: number, c: { total_sent: number }) => sum + (c.total_sent || 0), 0),
        total_replied: campaigns.reduce((sum: number, c: { total_replied: number }) => sum + (c.total_replied || 0), 0),
        total_converted: campaigns.reduce((sum: number, c: { total_converted: number }) => sum + (c.total_converted || 0), 0),
      };
    },
    refetchInterval: 30000,
  });
}

// ── Prospects CRUD ───────────────────────────────────────────────

export function useSDRProspects(status?: string) {
  return useQuery({
    queryKey: ['sdr-prospects', status],
    queryFn: async () => {
      let query = supabase
        .from('sdr_prospects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (status && status !== 'all') {
        query = query.eq('outreach_status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SDRProspect[];
    },
  });
}

export function useCreateProspect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prospect: Partial<SDRProspect>) => {
      const { data, error } = await supabase
        .from('sdr_prospects')
        .insert(prospect)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sdr-prospects'] });
      qc.invalidateQueries({ queryKey: ['sdr-stats'] });
      toast({ title: 'Prospect criado com sucesso' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao criar prospect', description: err.message, variant: 'destructive' });
    },
  });
}

export function useImportProspectsCSV() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prospects: Array<Partial<SDRProspect>>) => {
      const { data, error } = await supabase
        .from('sdr_prospects')
        .insert(prospects)
        .select('id');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['sdr-prospects'] });
      qc.invalidateQueries({ queryKey: ['sdr-stats'] });
      toast({ title: `${data?.length || 0} prospects importados com sucesso` });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro na importação', description: err.message, variant: 'destructive' });
    },
  });
}

export function useQualifyProspects() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prospectIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('sdr-qualify-prospect', {
        body: { prospect_ids: prospectIds },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['sdr-prospects'] });
      qc.invalidateQueries({ queryKey: ['sdr-stats'] });
      const results = data?.results || [];
      const qualified = results.filter((r: { status: string }) => r.status === 'qualified').length;
      toast({ title: `${qualified} de ${results.length} prospects qualificados` });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro na qualificação', description: err.message, variant: 'destructive' });
    },
  });
}

export function useDeleteProspect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sdr_prospects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sdr-prospects'] });
      qc.invalidateQueries({ queryKey: ['sdr-stats'] });
      toast({ title: 'Prospect removido' });
    },
  });
}

// ── Campaigns CRUD ───────────────────────────────────────────────

export function useSDRCampaigns() {
  return useQuery({
    queryKey: ['sdr-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sdr_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SDRCampaign[];
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaign: Partial<SDRCampaign>) => {
      const { data, error } = await supabase
        .from('sdr_campaigns')
        .insert(campaign)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sdr-campaigns'] });
      toast({ title: 'Campanha criada com sucesso' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao criar campanha', description: err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SDRCampaign> & { id: string }) => {
      const { error } = await supabase
        .from('sdr_campaigns')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sdr-campaigns'] });
      toast({ title: 'Campanha atualizada' });
    },
  });
}

export function useStartSequence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, prospectId }: { campaignId: string; prospectId?: string }) => {
      const { data, error } = await supabase.functions.invoke('sdr-execute-outreach', {
        body: { mode: 'start_sequence', campaign_id: campaignId, prospect_id: prospectId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['sdr-prospects'] });
      qc.invalidateQueries({ queryKey: ['sdr-campaigns'] });
      toast({ title: `${data?.enrolled || 0} prospects adicionados à sequência` });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao iniciar sequência', description: err.message, variant: 'destructive' });
    },
  });
}

// ── Templates CRUD ───────────────────────────────────────────────

export function useSDRTemplates() {
  return useQuery({
    queryKey: ['sdr-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sdr_message_templates')
        .select('*')
        .order('channel', { ascending: true });
      if (error) throw error;
      return (data || []) as SDRTemplate[];
    },
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SDRTemplate> & { id: string }) => {
      const { error } = await supabase
        .from('sdr_message_templates')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sdr-templates'] });
      toast({ title: 'Template atualizado' });
    },
  });
}

// ── Generate + Send Message ──────────────────────────────────────

export function useGenerateMessage() {
  return useMutation({
    mutationFn: async ({ prospectId, templateKey, campaignId }: {
      prospectId: string;
      templateKey: string;
      campaignId?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('sdr-generate-message', {
        body: { prospect_id: prospectId, template_key: templateKey, campaign_id: campaignId },
      });
      if (error) throw error;
      return data;
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao gerar mensagem', description: err.message, variant: 'destructive' });
    },
  });
}

export function useSendOutreach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (outreachLogId: string) => {
      const { data, error } = await supabase.functions.invoke('sdr-execute-outreach', {
        body: { mode: 'manual', outreach_log_id: outreachLogId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sdr-prospects'] });
      qc.invalidateQueries({ queryKey: ['sdr-outreach-logs'] });
      toast({ title: 'Mensagem enviada com sucesso' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao enviar', description: err.message, variant: 'destructive' });
    },
  });
}

// ── Outreach Logs ────────────────────────────────────────────────

export function useSDROutreachLogs(prospectId?: string) {
  return useQuery({
    queryKey: ['sdr-outreach-logs', prospectId],
    queryFn: async () => {
      let query = supabase
        .from('sdr_outreach_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (prospectId) {
        query = query.eq('prospect_id', prospectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SDROutreachLog[];
    },
    enabled: !!prospectId || prospectId === undefined,
  });
}
