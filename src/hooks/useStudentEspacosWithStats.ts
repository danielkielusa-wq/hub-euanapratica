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
  progressPercent: number;
}

export function useStudentEspacosWithStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-espacos-stats', user?.id],
    queryFn: async (): Promise<EspacoWithStats[]> => {
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

      // Get stats for each espaco
      const espacoIds = enrollments.map(e => e.espaco_id);

      // Get upcoming sessions
      const { data: sessions } = await supabase
        .from('sessions')
        .select('espaco_id')
        .in('espaco_id', espacoIds)
        .gte('datetime', new Date().toISOString())
        .in('status', ['scheduled', 'live']);

      // Get all assignments for these espacos
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, espaco_id')
        .in('espaco_id', espacoIds)
        .eq('status', 'published');

      // Get user submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('assignment_id, status')
        .eq('user_id', user.id);

      // Calculate stats per espaco
      return enrollments.map(enrollment => {
        const espaco = enrollment.espacos as any;
        
        // Count upcoming sessions for this espaco
        const upcomingSessions = (sessions || []).filter(
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
          progressPercent
        };
      });
    },
    enabled: !!user?.id
  });
}
