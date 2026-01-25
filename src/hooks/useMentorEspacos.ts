import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { EspacoExtended } from '@/types/admin';

export interface EspacoStats {
  espacoId: string;
  enrolledCount: number;
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  totalAssignments: number;
  pendingReviews: number;
  avgAttendance: number;
}

export interface EspacoStudent {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  profilePhotoUrl: string | null;
  enrolledAt: string;
  status: string;
  lastAccessAt: string | null;
  sessionsAttended: number;
  totalSessions: number;
  needsAttention: boolean;
}

export interface TimelineItem {
  id: string;
  type: 'session' | 'assignment';
  title: string;
  datetime: string;
  status: string;
}

// List all espacos where user is mentor
export function useMentorEspacos() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mentor-espacos', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: espacos, error } = await supabase
        .from('espacos')
        .select(`
          *,
          user_espacos(count)
        `)
        .eq('mentor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to EspacoExtended with counts
      const result: EspacoExtended[] = (espacos || []).map(e => ({
        id: e.id,
        name: e.name,
        description: e.description,
        category: e.category || 'immersion',
        visibility: e.visibility || 'private',
        max_students: e.max_students || 30,
        mentor_id: e.mentor_id,
        status: e.status || 'active',
        start_date: e.start_date,
        end_date: e.end_date,
        cover_image_url: e.cover_image_url,
        created_at: e.created_at || '',
        updated_at: e.updated_at || null,
        enrolled_count: (e.user_espacos as any)?.[0]?.count || 0
      }));

      return result;
    },
    enabled: !!user?.id,
  });
}

// Get single espaco with full details
export function useMentorEspaco(espacoId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mentor-espaco', espacoId],
    queryFn: async () => {
      if (!espacoId) return null;

      const { data: espaco, error } = await supabase
        .from('espacos')
        .select('*')
        .eq('id', espacoId)
        .maybeSingle();

      if (error) throw error;
      if (!espaco) return null;

      // Verify mentor has access
      if (user?.role !== 'admin' && espaco.mentor_id !== user?.id) {
        throw new Error('Acesso não autorizado');
      }

      return espaco as EspacoExtended;
    },
    enabled: !!espacoId && !!user?.id,
  });
}

// Get espaco statistics
export function useEspacoStats(espacoId: string) {
  return useQuery({
    queryKey: ['espaco-stats', espacoId],
    queryFn: async (): Promise<EspacoStats> => {
      if (!espacoId) throw new Error('espacoId required');

      const [enrollments, sessions, assignments, submissions] = await Promise.all([
        supabase
          .from('user_espacos')
          .select('id', { count: 'exact' })
          .eq('espaco_id', espacoId)
          .eq('status', 'active'),
        supabase
          .from('sessions')
          .select('id, status, datetime')
          .eq('espaco_id', espacoId),
        supabase
          .from('assignments')
          .select('id')
          .eq('espaco_id', espacoId)
          .eq('status', 'published'),
        supabase
          .from('submissions')
          .select('id, assignment_id, status')
          .eq('status', 'submitted')
      ]);

      const now = new Date().toISOString();
      const sessionData = sessions.data || [];
      const completedSessions = sessionData.filter(s => s.status === 'completed').length;
      const upcomingSessions = sessionData.filter(s => s.datetime > now && s.status === 'scheduled').length;

      // Filter submissions to only those belonging to this espaco's assignments
      const espacoAssignmentIds = (assignments.data || []).map(a => a.id);
      const pendingReviews = (submissions.data || [])
        .filter(s => espacoAssignmentIds.includes(s.assignment_id))
        .length;

      return {
        espacoId,
        enrolledCount: enrollments.count || 0,
        totalSessions: sessionData.length,
        completedSessions,
        upcomingSessions,
        totalAssignments: assignments.data?.length || 0,
        pendingReviews,
        avgAttendance: 0, // Would need session_attendance query
      };
    },
    enabled: !!espacoId,
  });
}

// Get students of an espaco
export function useEspacoStudents(espacoId: string) {
  return useQuery({
    queryKey: ['espaco-students', espacoId],
    queryFn: async (): Promise<EspacoStudent[]> => {
      if (!espacoId) return [];

      const { data: enrollments, error } = await supabase
        .from('user_espacos')
        .select(`
          id,
          user_id,
          enrolled_at,
          status,
          last_access_at,
          notes
        `)
        .eq('espaco_id', espacoId)
        .eq('status', 'active');

      if (error) throw error;
      if (!enrollments || enrollments.length === 0) return [];

      // Get profiles for these users
      const userIds = enrollments.map(e => e.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, profile_photo_url')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Get session count for the espaco
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id')
        .eq('espaco_id', espacoId);
      const totalSessions = sessions?.length || 0;

      return enrollments.map(e => {
        const profile = profileMap.get(e.user_id);
        return {
          id: e.id,
          userId: e.user_id,
          fullName: profile?.full_name || 'Usuário',
          email: profile?.email || '',
          profilePhotoUrl: profile?.profile_photo_url || null,
          enrolledAt: e.enrolled_at || '',
          status: e.status || 'active',
          lastAccessAt: e.last_access_at,
          sessionsAttended: 0, // Would need attendance query
          totalSessions,
          needsAttention: e.notes?.includes('atenção') || false,
        };
      });
    },
    enabled: !!espacoId,
  });
}

// Get timeline for next 2 weeks
export function useEspacoTimeline(espacoId: string) {
  return useQuery({
    queryKey: ['espaco-timeline', espacoId],
    queryFn: async (): Promise<TimelineItem[]> => {
      if (!espacoId) return [];

      const now = new Date();
      const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      const [sessions, assignments] = await Promise.all([
        supabase
          .from('sessions')
          .select('id, title, datetime, status')
          .eq('espaco_id', espacoId)
          .gte('datetime', now.toISOString())
          .lte('datetime', twoWeeksLater.toISOString())
          .order('datetime', { ascending: true }),
        supabase
          .from('assignments')
          .select('id, title, due_date, status')
          .eq('espaco_id', espacoId)
          .eq('status', 'published')
          .gte('due_date', now.toISOString())
          .lte('due_date', twoWeeksLater.toISOString())
          .order('due_date', { ascending: true }),
      ]);

      const items: TimelineItem[] = [
        ...(sessions.data || []).map(s => ({
          id: s.id,
          type: 'session' as const,
          title: s.title,
          datetime: s.datetime,
          status: s.status || 'scheduled',
        })),
        ...(assignments.data || []).map(a => ({
          id: a.id,
          type: 'assignment' as const,
          title: a.title,
          datetime: a.due_date,
          status: a.status || 'published',
        })),
      ];

      return items.sort((a, b) => 
        new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      );
    },
    enabled: !!espacoId,
  });
}

// Get next 3 sessions
export function useEspacoUpcomingSessions(espacoId: string) {
  return useQuery({
    queryKey: ['espaco-upcoming-sessions', espacoId],
    queryFn: async () => {
      if (!espacoId) return [];

      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, datetime, status, duration_minutes, meeting_link')
        .eq('espaco_id', espacoId)
        .gte('datetime', new Date().toISOString())
        .order('datetime', { ascending: true })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    enabled: !!espacoId,
  });
}
