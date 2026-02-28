import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { WeeklyReport, WeeklyReportSummary } from './useAdminWeeklyReport';

/**
 * Fetch the latest approved weekly report for the assistant.
 * RLS automatically filters to approved_for_assistant = true AND status = 'completed'.
 */
export function useAssistantLatestReport() {
  return useQuery({
    queryKey: ['assistant-weekly-report-latest'],
    queryFn: async (): Promise<WeeklyReport | null> => {
      const { data, error } = await supabase
        .from('weekly_intelligence_reports')
        .select('*')
        .eq('status', 'completed')
        .eq('approved_for_assistant', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as WeeklyReport | null;
    },
  });
}

/**
 * Fetch history of approved reports for the assistant.
 */
export function useAssistantReportHistory() {
  return useQuery({
    queryKey: ['assistant-weekly-report-history'],
    queryFn: async (): Promise<WeeklyReportSummary[]> => {
      const { data, error } = await supabase
        .from('weekly_intelligence_reports')
        .select('id, period_start, period_end, status, generation_method, duration_ms, cost_usd, model_used, tokens_used, webhook_dispatched, created_at')
        .eq('status', 'completed')
        .eq('approved_for_assistant', true)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      return (data || []) as WeeklyReportSummary[];
    },
  });
}
