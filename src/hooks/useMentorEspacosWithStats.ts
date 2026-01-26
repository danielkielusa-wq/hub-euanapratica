import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { EspacoWithStats } from './useStudentEspacosWithStats';

export interface MentorEspacoWithStats extends EspacoWithStats {
  enrolled_count: number;
  max_students: number | null;
}

export function useMentorEspacosWithStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mentor-espacos-stats', user?.id],
    queryFn: async (): Promise<MentorEspacoWithStats[]> => {
      if (!user?.id) return [];

      // Get espacos owned by mentor (or all if admin)
      let query = supabase
        .from('espacos')
        .select('*');
      
      if (user.role !== 'admin') {
        query = query.eq('mentor_id', user.id);
      }

      const { data: espacos, error: espacosError } = await query
        .order('created_at', { ascending: false });

      if (espacosError) throw espacosError;
      if (!espacos || espacos.length === 0) return [];

      const espacoIds = espacos.map(e => e.id);

      // Get enrollment counts
      const { data: enrollments } = await supabase
        .from('user_espacos')
        .select('espaco_id')
        .in('espaco_id', espacoIds)
        .eq('status', 'active');

      // Get upcoming sessions
      const { data: sessions } = await supabase
        .from('sessions')
        .select('espaco_id')
        .in('espaco_id', espacoIds)
        .gte('datetime', new Date().toISOString())
        .in('status', ['scheduled', 'live']);

      // Get published assignments
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, espaco_id')
        .in('espaco_id', espacoIds)
        .eq('status', 'published');

      // Get pending submissions (for mentor = submissions awaiting review)
      const assignmentIds = (assignments || []).map(a => a.id);
      const { data: submissions } = await supabase
        .from('submissions')
        .select('assignment_id, status')
        .in('assignment_id', assignmentIds)
        .eq('status', 'submitted');

      // Calculate stats per espaco
      return espacos.map(espaco => {
        // Count enrollments
        const enrolled_count = (enrollments || []).filter(
          e => e.espaco_id === espaco.id
        ).length;

        // Count upcoming sessions
        const upcomingSessions = (sessions || []).filter(
          s => s.espaco_id === espaco.id
        ).length;

        // Get assignments for this espaco
        const espacoAssignments = (assignments || []).filter(
          a => a.espaco_id === espaco.id
        );
        const espacoAssignmentIds = espacoAssignments.map(a => a.id);

        // Count pending reviews (submissions waiting for mentor review)
        const pendingAssignments = (submissions || []).filter(
          s => espacoAssignmentIds.includes(s.assignment_id)
        ).length;

        // Progress = completed sessions / total sessions
        const totalAssignments = espacoAssignments.length;
        const reviewedCount = (submissions || []).filter(
          s => espacoAssignmentIds.includes(s.assignment_id) && s.status === 'reviewed'
        ).length;
        const progressPercent = totalAssignments > 0
          ? Math.round((reviewedCount / totalAssignments) * 100)
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
          max_students: espaco.max_students,
          enrolled_count,
          upcomingSessions,
          pendingAssignments,
          progressPercent
        };
      });
    },
    enabled: !!user?.id
  });
}
