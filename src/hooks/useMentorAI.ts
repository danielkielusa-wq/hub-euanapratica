import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SessionPrepResult {
  briefing: string;
  provider: string;
  model: string;
  durationMs: number;
}

interface SessionSummaryResult {
  summary: string;
  provider: string;
  model: string;
  durationMs: number;
  stats: {
    totalEnrolled: number;
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
  };
}

interface StudentSuggestionResult {
  suggestion: string;
  provider: string;
  model: string;
  durationMs: number;
}

export function useGenerateSessionPrep() {
  return useMutation({
    mutationFn: async ({ sessionId, espacoId }: { sessionId: string; espacoId: string }) => {
      const { data, error } = await supabase.functions.invoke('generate-session-prep', {
        body: { sessionId, espacoId },
      });

      if (error) throw new Error(error.message || 'Erro ao gerar briefing');
      if (data?.error) throw new Error(data.error);
      return data as SessionPrepResult;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar briefing da sessão');
    },
  });
}

export function useGenerateSessionSummary() {
  return useMutation({
    mutationFn: async ({ sessionId, espacoId, mentorNotes }: { sessionId: string; espacoId: string; mentorNotes?: string }) => {
      const { data, error } = await supabase.functions.invoke('generate-session-summary', {
        body: { sessionId, espacoId, mentorNotes },
      });

      if (error) throw new Error(error.message || 'Erro ao gerar resumo');
      if (data?.error) throw new Error(data.error);
      return data as SessionSummaryResult;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar resumo da sessão');
    },
  });
}

export function useGenerateStudentSuggestion() {
  return useMutation({
    mutationFn: async ({ studentId, espacoId }: { studentId: string; espacoId: string }) => {
      const { data, error } = await supabase.functions.invoke('generate-student-suggestion', {
        body: { studentId, espacoId },
      });

      if (error) throw new Error(error.message || 'Erro ao gerar sugestão');
      if (data?.error) throw new Error(data.error);
      return data as StudentSuggestionResult;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar sugestão para o aluno');
    },
  });
}
