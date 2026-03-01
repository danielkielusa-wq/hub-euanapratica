import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EspacoWithStats {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  visibility: string | null;
  status: string | null;
  mentor_id: string | null;
  cover_image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  upcomingSessions: number;
  pendingAssignments: number;
  totalAssignments: number;
  totalSessions: number;
  progressPercent: number;
  membersCount: number;
  nextSessionLabel: string | null;
  hasLiveSession: boolean;
}

export function useStudentEspacosWithStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-espacos-stats', user?.id],
    queryFn: async (): Promise<EspacoWithStats[]> => {
      console.time('[PERF] useStudentEspacosWithStats');
      if (!user?.id) return [];

      // Get enrolled espacos - exclude archived ones
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('user_espacos')
        .select(`
          espaco_id,
          espacos!inner(
            id,
            name,
            description,
            category,
            visibility,
            status,
            mentor_id,
            cover_image_url,
            start_date,
            end_date
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .neq('espacos.status', 'arquivado'); // Filter out archived espacos

      if (enrollmentError) throw enrollmentError;

      if (!enrollments || enrollments.length === 0) return [];

      // Get stats for each espaco — run all queries in parallel
      const espacoIds = enrollments.map(e => e.espaco_id);

      const [futureSessionsResult, allSessionsResult, assignmentsResult, submissionsResult, membersResult] = await Promise.all([
        // Future sessions (for next session label & live detection)
        supabase
          .from('sessions')
          .select('espaco_id, datetime, status')
          .in('espaco_id', espacoIds)
          .gte('datetime', new Date().toISOString())
          .in('status', ['scheduled', 'live'])
          .order('datetime', { ascending: true }),
        // All sessions (for total module count)
        supabase
          .from('sessions')
          .select('espaco_id')
          .in('espaco_id', espacoIds),
        // Published assignments
        supabase
          .from('assignments')
          .select('id, espaco_id')
          .in('espaco_id', espacoIds)
          .eq('status', 'published'),
        // User submissions
        supabase
          .from('submissions')
          .select('assignment_id, status')
          .eq('user_id', user.id),
        // Members count per espaco
        supabase
          .from('user_espacos')
          .select('espaco_id')
          .in('espaco_id', espacoIds)
          .eq('status', 'active'),
      ]);

      const futureSessions = futureSessionsResult.data;
      const allSessions = allSessionsResult.data;
      const assignments = assignmentsResult.data;
      const submissions = submissionsResult.data;
      const members = membersResult.data;
      console.timeEnd('[PERF] useStudentEspacosWithStats');

      // Calculate stats per espaco
      return enrollments.map(enrollment => {
        const espaco = enrollment.espacos as any;

        // Future sessions for this espaco
        const espacoFutureSessions = (futureSessions || []).filter(
          s => s.espaco_id === espaco.id
        );
        const upcomingSessions = espacoFutureSessions.length;

        // Next session label (already ordered by datetime asc)
        const nextSession = espacoFutureSessions[0];
        let nextSessionLabel: string | null = null;
        if (nextSession) {
          const dt = new Date(nextSession.datetime);
          const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
          const day = days[dt.getDay()];
          const time = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          nextSessionLabel = `${day}, ${time}`;
        }

        // Has live session
        const hasLiveSession = espacoFutureSessions.some(s => s.status === 'live');

        // Total sessions (modules)
        const totalSessions = (allSessions || []).filter(
          s => s.espaco_id === espaco.id
        ).length;

        // Get assignments for this espaco
        const espacoAssignments = (assignments || []).filter(
          a => a.espaco_id === espaco.id
        );

        // Count pending (not submitted or draft)
        const submittedAssignmentIds = new Set(
          (submissions || [])
            .filter(s => s.status === 'submitted' || s.status === 'reviewed')
            .map(s => s.assignment_id)
        );

        const pendingAssignments = espacoAssignments.filter(
          a => !submittedAssignmentIds.has(a.id)
        ).length;

        // Calculate progress (completed assignments / total)
        const totalAssignments = espacoAssignments.length;
        const completedAssignments = espacoAssignments.filter(
          a => submittedAssignmentIds.has(a.id)
        ).length;
        const progressPercent = totalAssignments > 0
          ? Math.round((completedAssignments / totalAssignments) * 100)
          : 0;

        // Members count
        const membersCount = (members || []).filter(
          m => m.espaco_id === espaco.id
        ).length;

        return {
          id: espaco.id,
          name: espaco.name,
          description: espaco.description,
          category: espaco.category,
          visibility: espaco.visibility,
          status: espaco.status,
          mentor_id: espaco.mentor_id,
          cover_image_url: espaco.cover_image_url,
          start_date: espaco.start_date,
          end_date: espaco.end_date,
          upcomingSessions,
          pendingAssignments,
          totalAssignments,
          totalSessions,
          progressPercent,
          membersCount,
          nextSessionLabel,
          hasLiveSession,
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000, // 5 min — sidebar data rarely changes
  });
}
