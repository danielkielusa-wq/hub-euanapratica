import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Session } from '@/types/dashboard';

// Hook para buscar sessões reais do aluno (via espaços matriculados)
export function useStudentUpcomingSessions(limit = 3) {
  const { user } = useAuth();
  const now = new Date().toISOString();

  return useQuery({
    queryKey: ['student-sessions', 'upcoming', limit, user?.id],
    queryFn: async (): Promise<Session[]> => {
      // Primeiro buscar espaços onde o aluno está matriculado
      const { data: enrollments, error: enrollError } = await supabase
        .from('user_espacos')
        .select('espaco_id')
        .eq('user_id', user!.id)
        .eq('status', 'active');

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      const espacoIds = enrollments.map(e => e.espaco_id);

      // Buscar sessões dos espaços matriculados
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          id,
          title,
          datetime,
          status,
          meeting_link,
          espacos (
            id,
            name
          )
        `)
        .in('espaco_id', espacoIds)
        .gte('datetime', now)
        .in('status', ['scheduled', 'live'])
        .order('datetime', { ascending: true })
        .limit(limit);

      if (error) throw error;

      // Transformar para o formato do dashboard
      return (sessions || []).map(s => ({
        id: s.id,
        title: s.title,
        date: new Date(s.datetime),
        status: s.status === 'live' ? 'in_progress' : (s.status as 'scheduled' | 'completed' | 'cancelled'),
        cohortName: s.espacos?.name || 'Sem turma',
        meetingUrl: s.meeting_link || undefined,
      }));
    },
    enabled: !!user,
  });
}

// Hook para buscar todas as sessoes do aluno (via espacos matriculados)
export function useStudentSessions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-sessions', 'all', user?.id],
    queryFn: async (): Promise<Session[]> => {
      // Buscar espacos onde o aluno esta matriculado
      const { data: enrollments, error: enrollError } = await supabase
        .from('user_espacos')
        .select('espaco_id')
        .eq('user_id', user!.id)
        .eq('status', 'active');

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      const espacoIds = enrollments.map(e => e.espaco_id);

      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          id,
          title,
          datetime,
          status,
          meeting_link,
          espacos (
            id,
            name
          )
        `)
        .in('espaco_id', espacoIds)
        .order('datetime', { ascending: true });

      if (error) throw error;

      return (sessions || []).map(s => ({
        id: s.id,
        title: s.title,
        date: new Date(s.datetime),
        status: s.status === 'live' ? 'in_progress' : (s.status as 'scheduled' | 'completed' | 'cancelled'),
        cohortName: s.espacos?.name || 'Sem turma',
        meetingUrl: s.meeting_link || undefined,
      }));
    },
    enabled: !!user,
  });
}

// Hook para buscar progresso por espaço
export function useStudentProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-progress', user?.id],
    queryFn: async () => {
      // Buscar espaços matriculados
      const { data: enrollments, error: enrollError } = await supabase
        .from('user_espacos')
        .select(`
          espaco_id,
          espacos (
            id,
            name
          )
        `)
        .eq('user_id', user!.id)
        .eq('status', 'active');

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      // Para cada espaço, buscar estatísticas de sessões
      const progressData = await Promise.all(
        enrollments.map(async (enrollment) => {
          const espacoId = enrollment.espaco_id;
          const espacoName = enrollment.espacos?.name || 'Sem nome';

          // Total de sessões
          const { count: totalSessions } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .eq('espaco_id', espacoId);

          // Sessões concluídas
          const { count: completedSessions } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .eq('espaco_id', espacoId)
            .eq('status', 'completed');

          const total = totalSessions || 0;
          const completed = completedSessions || 0;
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

          return {
            id: espacoId,
            name: espacoName,
            completedSessions: completed,
            totalSessions: total,
            percentComplete: percent,
          };
        })
      );

      return progressData;
    },
    enabled: !!user,
  });
}
