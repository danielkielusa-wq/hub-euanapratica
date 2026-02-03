import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export interface Session {
  id: string;
  title: string;
  description: string | null;
  datetime: string;
  duration_minutes: number | null;
  espaco_id: string;
  meeting_link: string | null;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled' | null;
  recording_url: string | null;
  is_recurring: boolean | null;
  recurrence_pattern: Json | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  espacos?: {
    id: string;
    name: string;
  };
}

export interface SessionMaterial {
  id: string;
  session_id: string;
  title: string;
  file_url: string;
  material_type: 'pdf' | 'link' | 'video' | 'other' | null;
  uploaded_at: string | null;
}

export function useSessions(espacoId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sessions', espacoId, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('sessions')
        .select(`
          *,
          espacos (
            id,
            name
          )
        `)
        .order('datetime', { ascending: true });

      if (espacoId) {
        query = query.eq('espaco_id', espacoId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Session[];
    },
    enabled: !!user,
  });
}

// Student agenda sessions filtered by enrolled espacos
export function useStudentAgendaSessions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sessions', 'student-agenda', user?.id],
    queryFn: async () => {
      const { data: enrollments, error: enrollError } = await supabase
        .from('user_espacos')
        .select('espaco_id')
        .eq('user_id', user!.id)
        .eq('status', 'active');

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        return [] as Session[];
      }

      const espacoIds = enrollments.map(e => e.espaco_id);

      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          espacos (
            id,
            name
          )
        `)
        .in('espaco_id', espacoIds)
        .order('datetime', { ascending: true });

      if (error) throw error;
      return data as Session[];
    },
    enabled: !!user,
  });
}

export function useUpcomingSessions(limit = 3) {
  const { user } = useAuth();
  const now = new Date().toISOString();

  return useQuery({
    queryKey: ['sessions', 'upcoming', limit, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          espacos (
            id,
            name
          )
        `)
        .gte('datetime', now)
        .in('status', ['scheduled', 'live'])
        .order('datetime', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as Session[];
    },
    enabled: !!user,
  });
}

export function useSession(sessionId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          espacos (
            id,
            name
          )
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data as Session;
    },
    enabled: !!user && !!sessionId,
  });
}

export function useSessionMaterials(sessionId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['session-materials', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_materials')
        .select('*')
        .eq('session_id', sessionId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as SessionMaterial[];
    },
    enabled: !!user && !!sessionId,
  });
}

interface CreateSessionInput {
  title: string;
  description?: string | null;
  datetime: string;
  duration_minutes?: number;
  espaco_id: string;
  meeting_link?: string | null;
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
  is_recurring?: boolean;
  recurrence_pattern?: Json | null;
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sessionData: CreateSessionInput) => {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          title: sessionData.title,
          description: sessionData.description ?? null,
          datetime: sessionData.datetime,
          duration_minutes: sessionData.duration_minutes ?? 60,
          espaco_id: sessionData.espaco_id,
          meeting_link: sessionData.meeting_link ?? null,
          status: sessionData.status ?? 'scheduled',
          is_recurring: sessionData.is_recurring ?? false,
          recurrence_pattern: sessionData.recurrence_pattern ?? null,
          created_by: user?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

interface UpdateSessionInput {
  id: string;
  title?: string;
  description?: string | null;
  datetime?: string;
  duration_minutes?: number;
  espaco_id?: string;
  meeting_link?: string | null;
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
  is_recurring?: boolean;
  recurrence_pattern?: Json | null;
  recording_url?: string | null;
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateSessionInput) => {
      const updateData: Record<string, unknown> = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.datetime !== undefined) updateData.datetime = updates.datetime;
      if (updates.duration_minutes !== undefined) updateData.duration_minutes = updates.duration_minutes;
      if (updates.espaco_id !== undefined) updateData.espaco_id = updates.espaco_id;
      if (updates.meeting_link !== undefined) updateData.meeting_link = updates.meeting_link;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.is_recurring !== undefined) updateData.is_recurring = updates.is_recurring;
      if (updates.recurrence_pattern !== undefined) updateData.recurrence_pattern = updates.recurrence_pattern;
      if (updates.recording_url !== undefined) updateData.recording_url = updates.recording_url;

      const { data, error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session', data.id] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
