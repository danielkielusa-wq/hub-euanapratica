import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EspacoWithStats {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_image_url: string | null;
  category: string | null;
  upcomingSessions: number;
  pendingAssignments: number;
  progressPercent: number;
}

export function useStudentEspacosWithStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-espacos-with-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get enrolled espacos
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('user_espacos')
        .select(`
          espaco_id,
          espacos (
            id,
            name,
            description,
            status,
            start_date,
            end_date,
            cover_image_url,
            category
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (enrollmentError) throw enrollmentError;
      if (!enrollments) return [];

      // Get stats for each espaco
      const espacosWithStats: EspacoWithStats[] = await Promise.all(
        enrollments
          .filter((e) => e.espacos)
          .map(async (enrollment) => {
            const espaco = enrollment.espacos as any;

            // Get upcoming sessions count
            const { count: sessionsCount } = await supabase
              .from('sessions')
              .select('*', { count: 'exact', head: true })
              .eq('espaco_id', espaco.id)
              .eq('status', 'scheduled')
              .gte('datetime', new Date().toISOString());

            // Get pending assignments count (published assignments without reviewed submission)
            const { data: assignments } = await supabase
              .from('assignments')
              .select('id')
              .eq('espaco_id', espaco.id)
              .eq('status', 'published');

            let pendingCount = 0;
            let completedCount = 0;

            if (assignments && assignments.length > 0) {
              for (const assignment of assignments) {
                const { data: submission } = await supabase
                  .from('submissions')
                  .select('status')
                  .eq('assignment_id', assignment.id)
                  .eq('user_id', user.id)
                  .maybeSingle();

                if (!submission || submission.status === 'draft') {
                  pendingCount++;
                } else if (submission.status === 'reviewed') {
                  completedCount++;
                }
              }
            }

            // Calculate progress (based on completed assignments)
            const totalAssignments = assignments?.length || 0;
            const progressPercent = totalAssignments > 0 
              ? Math.round((completedCount / totalAssignments) * 100)
              : 0;

            return {
              id: espaco.id,
              name: espaco.name,
              description: espaco.description,
              status: espaco.status,
              start_date: espaco.start_date,
              end_date: espaco.end_date,
              cover_image_url: espaco.cover_image_url,
              category: espaco.category,
              upcomingSessions: sessionsCount || 0,
              pendingAssignments: pendingCount,
              progressPercent,
            };
          })
      );

      return espacosWithStats;
    },
    enabled: !!user,
  });
}
