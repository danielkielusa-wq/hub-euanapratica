import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ── Types ────────────────────────────────────────────────────────────────────

export interface WeeklyReportOpportunity {
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  suggested_action: string;
}

export interface WeeklyReportAlert {
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface SalesTalkingPoint {
  lead_name: string;
  opener: string;
}

export interface WeeklyReportAIAnalysis {
  executive_summary: string;
  hot_leads_briefing: string;
  opportunities: WeeklyReportOpportunity[];
  alerts: WeeklyReportAlert[];
  weekly_comparison: string;
  sales_talking_points: SalesTalkingPoint[];
}

export interface HotLeadMetric {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  temperature: string;
  area: string | null;
  priority_score: number | null;
  recommended_product: string | null;
  recommended_first_action: string | null;
  barriers: string[];
  best_contact_time: string | null;
  preferred_communication: string | null;
  last_interaction_date: string | null;
  last_interaction_type: string | null;
  overdue_tasks_count: number;
  days_since_created: number;
}

export interface WeeklyReport {
  id: string;
  period_start: string;
  period_end: string;
  raw_metrics: {
    period?: { start: string; end: string; days: number };
    leads_pipeline?: any;
    hot_leads_without_followup?: HotLeadMetric[];
    reengagement_opportunities?: any;
    funnel_metrics?: any;
    booking_activity?: any;
    subscription_revenue?: any;
    engagement_signals?: any;
    task_health?: any;
  };
  ai_analysis: WeeklyReportAIAnalysis;
  ai_analysis_text: string | null;
  generation_method: 'manual' | 'scheduled';
  status: 'generating' | 'completed' | 'error';
  error_message: string | null;
  model_used: string | null;
  tokens_used: number | null;
  cost_usd: number | null;
  duration_ms: number | null;
  webhook_dispatched: boolean;
  approved_for_assistant: boolean;
  assistant_directives: string | null;
  created_at: string;
  created_by: string | null;
}

export type WeeklyReportSummary = Pick<
  WeeklyReport,
  'id' | 'period_start' | 'period_end' | 'status' | 'generation_method' |
  'duration_ms' | 'cost_usd' | 'model_used' | 'tokens_used' | 'webhook_dispatched' | 'created_at'
>;

// ── Queries ──────────────────────────────────────────────────────────────────

export function useLatestReport() {
  return useQuery({
    queryKey: ['weekly-report-latest'],
    queryFn: async (): Promise<WeeklyReport | null> => {
      const { data, error } = await supabase
        .from('weekly_intelligence_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as WeeklyReport | null;
    },
    refetchInterval: (query) => {
      const report = query.state.data as WeeklyReport | null | undefined;
      // Poll every 3s while report is generating
      return report?.status === 'generating' ? 3000 : false;
    },
  });
}

export function useReportHistory() {
  return useQuery({
    queryKey: ['weekly-report-history'],
    queryFn: async (): Promise<WeeklyReportSummary[]> => {
      const { data, error } = await supabase
        .from('weekly_intelligence_reports')
        .select('id, period_start, period_end, status, generation_method, duration_ms, cost_usd, model_used, tokens_used, webhook_dispatched, created_at')
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      return (data || []) as WeeklyReportSummary[];
    },
  });
}

export function useReportById(id: string | null) {
  return useQuery({
    queryKey: ['weekly-report', id],
    queryFn: async (): Promise<WeeklyReport | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('weekly_intelligence_reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as WeeklyReport;
    },
    enabled: !!id,
  });
}

// ── Mutation: Approve for assistant ──────────────────────────────────────────

export function useApproveWeeklyReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, approved, directives }: { id: string; approved: boolean; directives: string }) => {
      const { error } = await supabase
        .from('weekly_intelligence_reports')
        .update({
          approved_for_assistant: approved,
          assistant_directives: directives || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-report-latest'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-report-history'] });
      toast({ title: 'Aprovacao atualizada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar aprovacao', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Generate ───────────────────────────────────────────────────────

export function useGenerateWeeklyReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (periodDays?: number) => {
      const { data, error } = await supabase.functions.invoke(
        'generate-weekly-report',
        { body: { period_days: periodDays, generation_method: 'manual' } }
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-report-latest'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-report-history'] });
      toast({ title: 'Relatorio gerado com sucesso' });
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: ['weekly-report-latest'] });
      toast({
        title: 'Erro ao gerar relatorio',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
