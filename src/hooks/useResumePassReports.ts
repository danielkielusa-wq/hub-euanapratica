import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FullAnalysisResult } from '@/types/curriculo';

export interface ResumePassReport {
  id: string;
  user_id: string;
  title: string;
  report_data: FullAnalysisResult;
  created_at: string;
}

export function useResumePassReports() {
  return useQuery({
    queryKey: ['resumepass-reports'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return [];

      const { data, error } = await supabase
        .from('resumepass_reports')
        .select('id, user_id, title, report_data, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ResumePassReport[];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useResumePassReport(reportId: string | undefined) {
  return useQuery({
    queryKey: ['resumepass-report', reportId],
    queryFn: async () => {
      if (!reportId) return null;

      const { data, error } = await supabase
        .from('resumepass_reports')
        .select('id, user_id, title, report_data, created_at')
        .eq('id', reportId)
        .single();

      if (error) throw error;
      return data as unknown as ResumePassReport;
    },
    enabled: !!reportId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveResumePassReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportData: FullAnalysisResult) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('User not authenticated');

      const today = new Date();
      const title = `Resume Report - ${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('resumepass_reports')
        .insert({
          user_id: session.user.id,
          title,
          report_data: reportData as unknown as Record<string, unknown>,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumepass-reports'] });
    },
  });
}
