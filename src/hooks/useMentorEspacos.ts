import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { EspacoExtended } from '@/types/admin';

export interface MentorEspaco {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  visibility: string | null;
  status: string | null;
  mentor_id: string | null;
  max_students: number | null;
  start_date: string | null;
  end_date: string | null;
  cover_image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  student_count?: number;
  enrolled_count?: number;
}

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
  notes: string | null;
  churnScore: number; // 0-100, higher = healthier
  churnRisk: 'low' | 'medium' | 'high';
  submissionsCount: number;
  totalAssignments: number;
  scoreBreakdown: {
    attendanceScore: number;
    submissionScore: number;
    recencyScore: number;
    hasActivities: boolean;
    explanation: string;
  };
}

export interface TimelineItem {
  id: string;
  type: 'session' | 'assignment';
  title: string;
  datetime: string;
  status: string;
}

export function useMentorEspacos() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mentor-espacos', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('espacos')
        .select(`
          *,
          user_espacos(count)
        `)
        .eq('mentor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform and add student count
      return (data || []).map((espaco: any) => ({
        ...espaco,
        student_count: espaco.user_espacos?.[0]?.count || 0,
        enrolled_count: espaco.user_espacos?.[0]?.count || 0
      })) as MentorEspaco[];
    },
    enabled: !!user?.id
  });
}

export function useArchiveEspaco() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ espacoId, archive }: { espacoId: string; archive: boolean }) => {
      const newStatus = archive ? 'arquivado' : 'active';
      const { error } = await supabase
        .from('espacos')
        .update({ status: newStatus })
        .eq('id', espacoId);
      
      if (error) throw error;
      return { espacoId, newStatus };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mentor-espacos'] });
      queryClient.invalidateQueries({ queryKey: ['mentor-espaco'] });
      queryClient.invalidateQueries({ queryKey: ['admin-espacos'] });
      toast.success(data.newStatus === 'arquivado' ? 'Espaço arquivado com sucesso!' : 'Espaço restaurado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status do espaço');
    }
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

      const [enrollments, sessions, assignments, submissions, attendance] = await Promise.all([
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
          .eq('status', 'submitted'),
        supabase
          .from('session_attendance')
          .select('id, session_id, status, sessions!inner(espaco_id)')
          .eq('sessions.espaco_id', espacoId)
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

      // Calculate real attendance rate
      const attendanceData = attendance.data || [];
      const presentCount = attendanceData.filter(a => a.status === 'present').length;
      const totalAttendanceRecords = attendanceData.length;
      const avgAttendance = totalAttendanceRecords > 0
        ? Math.round((presentCount / totalAttendanceRecords) * 100)
        : 0;

      return {
        espacoId,
        enrolledCount: enrollments.count || 0,
        totalSessions: sessionData.length,
        completedSessions,
        upcomingSessions,
        totalAssignments: assignments.data?.length || 0,
        pendingReviews,
        avgAttendance,
      };
    },
    enabled: !!espacoId,
  });
}

// Get students of an espaco with churn score
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

      const userIds = enrollments.map(e => e.user_id);

      // Parallel queries for profiles, sessions, attendance, assignments, submissions, churn config
      const nowISO = new Date().toISOString();
      const [profilesRes, sessionsRes, attendanceRes, assignmentsRes, submissionsRes, churnConfigRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, profile_photo_url').in('id', userIds),
        supabase.from('sessions').select('id').eq('espaco_id', espacoId).lt('scheduled_at', nowISO),
        supabase.from('session_attendance').select('user_id, status, session_id, sessions!inner(espaco_id)').eq('sessions.espaco_id', espacoId),
        supabase.from('assignments').select('id, due_date').eq('espaco_id', espacoId).eq('status', 'published'),
        supabase.from('submissions').select('user_id, assignment_id, status, submitted_at').in('user_id', userIds),
        supabase.from('app_configs').select('value').eq('key', 'churn_score_weights').maybeSingle(),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const totalSessions = sessionsRes.data?.length || 0; // already filtered to past sessions
      const attendanceData = attendanceRes.data || [];
      // All published assignments and their IDs
      const allAssignments = assignmentsRes.data || [];
      const allAssignmentIds = allAssignments.map(a => a.id);
      // Only past-due assignments count for engagement score (don't penalize for future tasks)
      const pastAssignments = allAssignments.filter(a => new Date(a.due_date).getTime() < Date.now());
      const pastAssignmentIds = pastAssignments.map(a => a.id);
      // All submissions for this espaco (for display)
      const allEspacoSubmissions = (submissionsRes.data || []).filter(s => allAssignmentIds.includes(s.assignment_id) && s.submitted_at);
      // Only past-due submissions (for engagement score)
      const pastDueSubmissions = (submissionsRes.data || []).filter(s => pastAssignmentIds.includes(s.assignment_id) && s.submitted_at);

      // Parse churn weights from config
      const defaultWeights = { attendance_weight: 0.4, submission_weight: 0.3, recency_weight: 0.3, high_risk_threshold: 30, medium_risk_threshold: 60 };
      let weights = defaultWeights;
      try {
        if (churnConfigRes.data?.value) {
          weights = { ...defaultWeights, ...JSON.parse(churnConfigRes.data.value) };
        }
      } catch { /* use defaults */ }

      const now = Date.now();

      return enrollments.map(e => {
        const profile = profileMap.get(e.user_id);

        // Attendance score (0-100) — only past sessions count
        const studentAttendance = attendanceData.filter(a => a.user_id === e.user_id);
        const presentCount = studentAttendance.filter(a => a.status === 'present').length;
        const attendanceScore = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : -1;

        // Submission score (0-100) — only past-due assignments count for engagement
        const studentPastDueSubmissions = pastDueSubmissions.filter(s => s.user_id === e.user_id);
        const pastDueCount = pastAssignments.length;
        const submissionScore = pastDueCount > 0 ? Math.round((studentPastDueSubmissions.length / pastDueCount) * 100) : -1;
        // All submissions for display (including future-due tasks already submitted)
        const studentAllSubmissions = allEspacoSubmissions.filter(s => s.user_id === e.user_id);

        // Recency score (0-100): based on last access or enrollment date, decays over 30 days
        const lastAccess = e.last_access_at ? new Date(e.last_access_at).getTime() : new Date(e.enrolled_at || now).getTime();
        const daysSinceAccess = Math.max(0, (now - lastAccess) / (1000 * 60 * 60 * 24));
        const recencyScore = daysSinceAccess < 1 ? 100 : Math.round(Math.max(0, 100 - (daysSinceAccess / 30) * 100));

        // Build weighted score using only available dimensions
        const dimensions: { score: number; weight: number; label: string }[] = [];
        if (attendanceScore >= 0) dimensions.push({ score: attendanceScore, weight: weights.attendance_weight, label: `Presença ${presentCount}/${totalSessions}` });
        if (submissionScore >= 0) dimensions.push({ score: submissionScore, weight: weights.submission_weight, label: `Entregas ${studentPastDueSubmissions.length}/${pastDueCount}` });
        const recencyLabel = e.last_access_at
          ? (daysSinceAccess < 1 ? 'Acessou hoje' : `Último acesso há ${Math.round(daysSinceAccess)} dia(s)`)
          : 'Nunca acessou (usando data de matrícula)';
        dimensions.push({ score: recencyScore, weight: weights.recency_weight, label: recencyLabel });

        // Normalize weights so they sum to 1.0
        const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
        const churnScore = Math.round(dimensions.reduce((sum, d) => sum + d.score * (d.weight / totalWeight), 0));

        const hasActivities = attendanceScore >= 0 || submissionScore >= 0;

        // Build explanation in plain language
        const parts = dimensions.map(d => {
          const pct = Math.round((d.weight / totalWeight) * 100);
          return `${d.label}: ${d.score}% (peso ${pct}%)`;
        });
        const explanation = hasActivities
          ? parts.join('\n')
          : 'Ainda não há sessões realizadas nem tarefas vencidas.\nO score reflete apenas quando o aluno acessou a plataforma pela última vez (decai ao longo de 30 dias sem acesso).';

        const churnRisk: 'low' | 'medium' | 'high' =
          churnScore >= weights.medium_risk_threshold ? 'low' :
          churnScore >= weights.high_risk_threshold ? 'medium' : 'high';

        return {
          id: e.id,
          userId: e.user_id,
          fullName: profile?.full_name || 'Usuário',
          email: profile?.email || '',
          profilePhotoUrl: profile?.profile_photo_url || null,
          enrolledAt: e.enrolled_at || '',
          status: e.status || 'active',
          lastAccessAt: e.last_access_at,
          sessionsAttended: presentCount,
          totalSessions,
          needsAttention: churnRisk === 'high' || (e.notes?.includes('atenção') ?? false),
          notes: e.notes || null,
          churnScore,
          churnRisk,
          submissionsCount: studentAllSubmissions.length,
          totalAssignments: allAssignments.length,
          scoreBreakdown: {
            attendanceScore: Math.max(0, attendanceScore),
            submissionScore: Math.max(0, submissionScore),
            recencyScore,
            hasActivities,
            explanation,
          },
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

// Update student notes
export function useUpdateStudentNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ enrollmentId, notes, espacoId }: { enrollmentId: string; notes: string; espacoId: string }) => {
      const { error } = await supabase
        .from('user_espacos')
        .update({ notes })
        .eq('id', enrollmentId);

      if (error) throw error;
      return { enrollmentId, espacoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['espaco-students', data.espacoId] });
      toast.success('Anotação salva');
    },
    onError: () => {
      toast.error('Erro ao salvar anotação');
    },
  });
}

// Get mentor activity feed for an espaco
export function useMentorActivityFeed(espacoId: string) {
  return useQuery({
    queryKey: ['mentor-activity-feed', espacoId],
    queryFn: async () => {
      if (!espacoId) return [];

      const [submissionsRes, enrollmentsRes, attendanceRes] = await Promise.all([
        supabase
          .from('submissions')
          .select('id, created_at, status, user_id, assignment_id, assignments!inner(title, espaco_id)')
          .eq('assignments.espaco_id', espacoId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('user_espacos')
          .select('id, enrolled_at, user_id')
          .eq('espaco_id', espacoId)
          .order('enrolled_at', { ascending: false })
          .limit(5),
        supabase
          .from('session_attendance')
          .select('id, marked_at, user_id, status, session_id, sessions!inner(title, espaco_id)')
          .eq('sessions.espaco_id', espacoId)
          .eq('status', 'present')
          .order('marked_at', { ascending: false })
          .limit(5),
      ]);

      // Get profile names for all user_ids
      const allUserIds = [
        ...(submissionsRes.data || []).map(s => s.user_id),
        ...(enrollmentsRes.data || []).map(e => e.user_id),
        ...(attendanceRes.data || []).map(a => a.user_id),
      ].filter(Boolean);
      const uniqueIds = [...new Set(allUserIds)];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', uniqueIds.length > 0 ? uniqueIds : ['__none__']);

      const nameMap = new Map((profiles || []).map(p => [p.id, p.full_name || 'Usuário']));

      type ActivityItem = { id: string; type: 'submission' | 'enrollment' | 'attendance'; text: string; timestamp: string };
      const items: ActivityItem[] = [];

      (submissionsRes.data || []).forEach(s => {
        const name = nameMap.get(s.user_id) || 'Aluno';
        const task = (s as any).assignments?.title || 'tarefa';
        items.push({
          id: `sub-${s.id}`,
          type: 'submission',
          text: `${name} enviou a tarefa "${task}"`,
          timestamp: s.created_at,
        });
      });

      (enrollmentsRes.data || []).forEach(e => {
        const name = nameMap.get(e.user_id) || 'Aluno';
        items.push({
          id: `enr-${e.id}`,
          type: 'enrollment',
          text: `${name} se matriculou no espaço`,
          timestamp: e.enrolled_at || '',
        });
      });

      (attendanceRes.data || []).forEach(a => {
        const name = nameMap.get(a.user_id) || 'Aluno';
        const session = (a as any).sessions?.title || 'sessão';
        items.push({
          id: `att-${a.id}`,
          type: 'attendance',
          text: `${name} participou de "${session}"`,
          timestamp: a.marked_at || '',
        });
      });

      return items
        .filter(i => i.timestamp)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    },
    enabled: !!espacoId,
  });
}

// Remove student from espaco
export function useRemoveStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ enrollmentId, espacoId }: { enrollmentId: string; espacoId: string }) => {
      const { error } = await supabase
        .from('user_espacos')
        .delete()
        .eq('id', enrollmentId);

      if (error) throw error;
      return { enrollmentId, espacoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['espaco-students', data.espacoId] });
      queryClient.invalidateQueries({ queryKey: ['espaco-stats', data.espacoId] });
      queryClient.invalidateQueries({ queryKey: ['mentor-espacos'] });
      toast.success('Aluno removido do espaço');
    },
    onError: () => {
      toast.error('Erro ao remover aluno');
    },
  });
}

// Kanban submission item (for mentor corrections view)
export interface KanbanSubmission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  status: 'pending' | 'submitted' | 'approved' | 'revision' | 'rejected';
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewResult: string | null;
  feedback: string | null;
  dueDate: string;
  isLate: boolean;
}

// Get all submissions for an espaco grouped for Kanban (mentor view)
export function useEspacoKanbanSubmissions(espacoId: string) {
  return useQuery({
    queryKey: ['espaco-kanban-submissions', espacoId],
    queryFn: async (): Promise<KanbanSubmission[]> => {
      if (!espacoId) return [];

      // Get all published assignments in this space
      const { data: assignments, error: assErr } = await supabase
        .from('assignments')
        .select('id, title, due_date')
        .eq('espaco_id', espacoId)
        .eq('status', 'published');

      if (assErr) throw assErr;
      if (!assignments || assignments.length === 0) return [];

      // Get enrolled students
      const { data: enrollments } = await supabase
        .from('user_espacos')
        .select('user_id')
        .eq('espaco_id', espacoId)
        .eq('status', 'active');

      const enrolledIds = enrollments?.map(e => e.user_id) || [];
      if (enrolledIds.length === 0) return [];

      // Get all submissions for these assignments
      const assignmentIds = assignments.map(a => a.id);
      const { data: submissions } = await supabase
        .from('submissions')
        .select('*')
        .in('assignment_id', assignmentIds);

      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, profile_photo_url')
        .in('id', enrolledIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      const submissionMap = new Map((submissions || []).map(s => [`${s.assignment_id}-${s.user_id}`, s]));

      const now = new Date();
      const items: KanbanSubmission[] = [];

      for (const assignment of assignments) {
        const dueDate = new Date(assignment.due_date);
        for (const userId of enrolledIds) {
          const sub = submissionMap.get(`${assignment.id}-${userId}`);
          const profile = profileMap.get(userId);

          let status: KanbanSubmission['status'] = 'pending';
          if (sub?.status === 'reviewed') {
            status = (sub.review_result as 'approved' | 'revision' | 'rejected') || 'approved';
          } else if (sub?.status === 'submitted') {
            status = 'submitted';
          }

          items.push({
            id: sub?.id || `pending-${assignment.id}-${userId}`,
            assignmentId: assignment.id,
            assignmentTitle: assignment.title,
            userId,
            userName: profile?.full_name || 'Usuário',
            userEmail: profile?.email || '',
            userAvatar: profile?.profile_photo_url || null,
            status,
            submittedAt: sub?.submitted_at || null,
            reviewedAt: sub?.reviewed_at || null,
            reviewResult: sub?.review_result || null,
            feedback: sub?.feedback || null,
            dueDate: assignment.due_date,
            isLate: !sub?.submitted_at && dueDate < now,
          });
        }
      }

      return items;
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
