import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AttendanceStatus = 'present' | 'absent' | 'unmarked';

export interface AttendanceRecord {
  id: string;
  session_id: string;
  user_id: string;
  status: AttendanceStatus;
  marked_at: string | null;
  marked_by: string | null;
  profile?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  unmarked: number;
}

export function useSessionAttendance(sessionId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['attendance', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_attendance')
        .select(`
          *,
          profile:profiles!session_attendance_user_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('session_id', sessionId)
        .order('marked_at', { ascending: false });

      if (error) throw error;
      return data as unknown as AttendanceRecord[];
    },
    enabled: !!user && !!sessionId,
  });
}

export function useMyAttendance(sessionId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-attendance', sessionId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('session_attendance')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as AttendanceRecord | null;
    },
    enabled: !!user && !!sessionId,
  });
}

interface MarkAttendanceInput {
  session_id: string;
  user_id: string;
  status: AttendanceStatus;
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ session_id, user_id, status }: MarkAttendanceInput) => {
      // Try to update first
      const { data: existing } = await supabase
        .from('session_attendance')
        .select('id')
        .eq('session_id', session_id)
        .eq('user_id', user_id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('session_attendance')
          .update({
            status,
            marked_at: new Date().toISOString(),
            marked_by: user?.id ?? null,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('session_attendance')
          .insert({
            session_id,
            user_id,
            status,
            marked_at: new Date().toISOString(),
            marked_by: user?.id ?? null,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', variables.session_id] });
      queryClient.invalidateQueries({ queryKey: ['my-attendance', variables.session_id] });
    },
  });
}

interface BulkMarkAttendanceInput {
  session_id: string;
  records: Array<{ user_id: string; status: AttendanceStatus }>;
}

export function useBulkMarkAttendance() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ session_id, records }: BulkMarkAttendanceInput) => {
      const results = await Promise.all(
        records.map(async ({ user_id, status }) => {
          const { data: existing } = await supabase
            .from('session_attendance')
            .select('id')
            .eq('session_id', session_id)
            .eq('user_id', user_id)
            .maybeSingle();

          if (existing) {
            return supabase
              .from('session_attendance')
              .update({
                status,
                marked_at: new Date().toISOString(),
                marked_by: user?.id ?? null,
              })
              .eq('id', existing.id);
          } else {
            return supabase
              .from('session_attendance')
              .insert({
                session_id,
                user_id,
                status,
                marked_at: new Date().toISOString(),
                marked_by: user?.id ?? null,
              });
          }
        })
      );

      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} records`);
      }

      return results;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', variables.session_id] });
    },
  });
}

export function calculateAttendanceStats(records: AttendanceRecord[]): AttendanceStats {
  return {
    total: records.length,
    present: records.filter((r) => r.status === 'present').length,
    absent: records.filter((r) => r.status === 'absent').length,
    unmarked: records.filter((r) => r.status === 'unmarked').length,
  };
}

export function exportAttendanceCSV(
  records: AttendanceRecord[],
  sessionTitle: string
): void {
  const headers = ['Nome', 'Email', 'Status', 'Marcado em'];
  const rows = records.map((r) => [
    r.profile?.full_name || 'N/A',
    r.profile?.email || 'N/A',
    r.status === 'present' ? 'Presente' : r.status === 'absent' ? 'Ausente' : 'Não marcado',
    r.marked_at ? new Date(r.marked_at).toLocaleString('pt-BR') : 'N/A',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `presenca-${sessionTitle.replace(/\s+/g, '-')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
