import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';
import type { CalendarEvent } from '@/types/calendar';

export interface Session {
  id: string;
  title: string;
  description: string | null;
  datetime: string;
  duration_minutes: number | null;
  espaco_id: string | null;
  capacity: number | null;
  is_public: boolean;
  price: number;
  meeting_link: string | null;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled' | null;
  recording_url: string | null;
  transcript: string | null;
  summary: string | null;
  summary_visible: boolean;
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

// Student agenda sessions filtered by enrolled espacos (RLS handles filtering)
export function useStudentAgendaSessions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sessions', 'student-agenda', user?.id],
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
        .not('espaco_id', 'is', null)
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
  espaco_id?: string | null;
  meeting_link?: string | null;
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
  is_recurring?: boolean;
  recurrence_pattern?: Json | null;
  capacity?: number | null;
  is_public?: boolean;
  price?: number;
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
          espaco_id: sessionData.espaco_id ?? null,
          meeting_link: sessionData.meeting_link ?? null,
          status: sessionData.status ?? 'scheduled',
          is_recurring: sessionData.is_recurring ?? false,
          recurrence_pattern: sessionData.recurrence_pattern ?? null,
          created_by: user?.id ?? null,
          capacity: sessionData.capacity ?? null,
          is_public: sessionData.is_public ?? false,
          price: sessionData.price ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['mentor-calendar-events'] });
    },
  });
}

interface UpdateSessionInput {
  id: string;
  title?: string;
  description?: string | null;
  datetime?: string;
  duration_minutes?: number;
  espaco_id?: string | null;
  meeting_link?: string | null;
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
  is_recurring?: boolean;
  recurrence_pattern?: Json | null;
  recording_url?: string | null;
  transcript?: string | null;
  summary?: string | null;
  summary_visible?: boolean;
  capacity?: number | null;
  is_public?: boolean;
  price?: number;
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
      if (updates.transcript !== undefined) updateData.transcript = updates.transcript;
      if (updates.summary !== undefined) updateData.summary = updates.summary;
      if (updates.summary_visible !== undefined) updateData.summary_visible = updates.summary_visible;
      if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
      if (updates.is_public !== undefined) updateData.is_public = updates.is_public;
      if (updates.price !== undefined) updateData.price = updates.price;

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
      queryClient.invalidateQueries({ queryKey: ['mentor-calendar-events'] });
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
      queryClient.invalidateQueries({ queryKey: ['mentor-calendar-events'] });
    },
  });
}

// ============================================
// UNIFIED CALENDAR HOOKS
// ============================================

export function useAllMentorCalendarEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mentor-calendar-events', user?.id],
    queryFn: async (): Promise<CalendarEvent[]> => {
      // Fetch sessions created by this mentor (includes Espaço sessions + standalone events)
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select(`*, espacos (id, name)`)
        .eq('created_by', user!.id)
        .order('datetime', { ascending: true });

      if (sessionsError) throw sessionsError;

      // Fetch confirmed bookings for this mentor
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('mentor_id', user!.id)
        .eq('status', 'confirmed')
        .order('scheduled_start', { ascending: true });

      if (bookingsError) throw bookingsError;

      const sessionEvents: CalendarEvent[] = (sessions ?? []).map(s => ({
        kind: 'session' as const,
        data: s as Session,
        datetime: s.datetime,
      }));

      // Enrich bookings with student profiles and service names
      const studentIds = [...new Set((bookings ?? []).map(b => b.student_id).filter(Boolean))];
      const serviceIds = [...new Set((bookings ?? []).map(b => b.service_id).filter(Boolean))];

      let profileMap: Record<string, { id: string; full_name: string; email: string; profile_photo_url: string | null }> = {};
      let serviceMap: Record<string, { id: string; name: string; description: string | null; icon_name: string | null }> = {};

      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, profile_photo_url')
          .in('id', studentIds);
        if (profiles) profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
      }

      if (serviceIds.length > 0) {
        const { data: services } = await supabase
          .from('hub_services')
          .select('id, name, description, icon_name')
          .in('id', serviceIds);
        if (services) serviceMap = Object.fromEntries(services.map(s => [s.id, s]));
      }

      const bookingEvents: CalendarEvent[] = (bookings ?? []).map(b => ({
        kind: 'booking' as const,
        data: {
          ...b,
          student: profileMap[b.student_id],
          service: serviceMap[b.service_id],
        },
        datetime: b.scheduled_start,
      }));

      const combined = [...sessionEvents, ...bookingEvents];
      combined.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
      return combined;
    },
    enabled: !!user,
  });
}

export function useAllStudentCalendarEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-calendar-events', user?.id],
    queryFn: async (): Promise<CalendarEvent[]> => {
      // Query sessions directly — RLS policy "Students can read sessions from enrolled espacos"
      // handles filtering via is_enrolled_in_espaco(auth.uid(), espaco_id).
      // This avoids the indirection through user_espacos which could silently return empty.
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select(`*, espacos (id, name)`)
        .not('espaco_id', 'is', null)
        .order('datetime', { ascending: true });

      if (sessionsError) throw sessionsError;

      const sessionEvents: CalendarEvent[] = (sessions ?? []).map(s => ({
        kind: 'session' as const,
        data: s as Session,
        datetime: s.datetime,
      }));

      // Fetch student's confirmed 1:1 bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('student_id', user!.id)
        .eq('status', 'confirmed')
        .order('scheduled_start', { ascending: true });

      if (bookingsError) throw bookingsError;

      const mentorIds = [...new Set((bookings ?? []).map(b => b.mentor_id).filter(Boolean))];
      const serviceIds = [...new Set((bookings ?? []).map(b => b.service_id).filter(Boolean))];

      let profileMap: Record<string, { id: string; full_name: string; email: string; profile_photo_url: string | null }> = {};
      let serviceMap: Record<string, { id: string; name: string; description: string | null; icon_name: string | null }> = {};

      if (mentorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, profile_photo_url')
          .in('id', mentorIds);
        if (profiles) profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
      }

      if (serviceIds.length > 0) {
        const { data: services } = await supabase
          .from('hub_services')
          .select('id, name, description, icon_name')
          .in('id', serviceIds);
        if (services) serviceMap = Object.fromEntries(services.map(s => [s.id, s]));
      }

      const bookingEvents: CalendarEvent[] = (bookings ?? []).map(b => ({
        kind: 'booking' as const,
        data: {
          ...b,
          mentor: profileMap[b.mentor_id],
          service: serviceMap[b.service_id],
        },
        datetime: b.scheduled_start,
      }));

      const combined = [...sessionEvents, ...bookingEvents];
      combined.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
      return combined;
    },
    enabled: !!user,
  });
}
