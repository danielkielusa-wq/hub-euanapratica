import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type {
  BookingStatus,
  BookingWithDetails,
  MentorAvailability,
  MentorBlockedTime,
  DayOfWeek,
} from '@/types/booking';

// ============================================
// Filter types
// ============================================

export interface AdminBookingFilters {
  status?: BookingStatus | 'all';
  mentor_id?: string;
  service_id?: string;
  search?: string;
}

// ============================================
// BOOKINGS QUERIES
// ============================================

export function useAdminBookings(filters?: AdminBookingFilters) {
  return useQuery({
    queryKey: ['admin-bookings', filters],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select('*')
        .order('scheduled_start', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.mentor_id) {
        query = query.eq('mentor_id', filters.mentor_id);
      }
      if (filters?.service_id) {
        query = query.eq('service_id', filters.service_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch profiles for students and mentors
      const studentIds = [...new Set(data.map(b => b.student_id).filter(Boolean))];
      const mentorIds = [...new Set(data.map(b => b.mentor_id).filter(Boolean))] as string[];
      const allIds = [...new Set([...studentIds, ...mentorIds])];

      let profileMap: Record<string, { id: string; full_name: string; email: string; profile_photo_url: string | null }> = {};
      if (allIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, profile_photo_url')
          .in('id', allIds);
        if (profiles) {
          profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
        }
      }

      // Fetch service names
      const serviceIds = [...new Set(data.map(b => b.service_id).filter(Boolean))];
      let serviceMap: Record<string, { id: string; name: string; description: string | null; icon_name: string | null }> = {};
      if (serviceIds.length > 0) {
        const { data: services } = await supabase
          .from('hub_services')
          .select('id, name, description, icon_name')
          .in('id', serviceIds);
        if (services) {
          serviceMap = Object.fromEntries(services.map(s => [s.id, s]));
        }
      }

      return data.map(booking => ({
        ...booking,
        student: profileMap[booking.student_id],
        mentor: booking.mentor_id ? profileMap[booking.mentor_id] : undefined,
        service: serviceMap[booking.service_id],
      })) as BookingWithDetails[];
    },
  });
}

// ============================================
// MENTOR SERVICES QUERIES
// ============================================

export interface MentorServiceExtended {
  id: string;
  mentor_id: string;
  service_id: string;
  is_active: boolean;
  slot_duration_minutes: number;
  buffer_minutes: number;
  price_override: number | null;
  default_meeting_link: string | null;
  created_at: string;
  updated_at: string;
  mentor?: { id: string; full_name: string; email: string; profile_photo_url: string | null };
  service?: { id: string; name: string; description: string | null; icon_name: string | null };
}

export function useAdminMentorServices() {
  return useQuery({
    queryKey: ['admin-mentor-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch mentor profiles
      const mentorIds = [...new Set(data.map(ms => ms.mentor_id))];
      let mentorMap: Record<string, any> = {};
      if (mentorIds.length > 0) {
        const { data: mentors } = await supabase
          .from('profiles')
          .select('id, full_name, email, profile_photo_url')
          .in('id', mentorIds);
        if (mentors) {
          mentorMap = Object.fromEntries(mentors.map(m => [m.id, m]));
        }
      }

      // Fetch services
      const serviceIds = [...new Set(data.map(ms => ms.service_id))];
      let serviceMap: Record<string, any> = {};
      if (serviceIds.length > 0) {
        const { data: services } = await supabase
          .from('hub_services')
          .select('id, name, description, icon_name')
          .in('id', serviceIds);
        if (services) {
          serviceMap = Object.fromEntries(services.map(s => [s.id, s]));
        }
      }

      return data.map(ms => ({
        ...ms,
        mentor: mentorMap[ms.mentor_id],
        service: serviceMap[ms.service_id],
      })) as MentorServiceExtended[];
    },
  });
}

// ============================================
// MENTOR AVAILABILITY QUERIES
// ============================================

export function useAdminMentorAvailability(mentorId?: string) {
  return useQuery({
    queryKey: ['admin-mentor-availability', mentorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_availability')
        .select('*')
        .eq('mentor_id', mentorId!)
        .order('day_of_week');

      if (error) throw error;
      return (data ?? []) as MentorAvailability[];
    },
    enabled: !!mentorId,
  });
}

export function useAdminMentorBlockedTimes(mentorId?: string) {
  return useQuery({
    queryKey: ['admin-mentor-blocked-times', mentorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_blocked_times')
        .select('*')
        .eq('mentor_id', mentorId!)
        .gte('end_datetime', new Date().toISOString())
        .order('start_datetime');

      if (error) throw error;
      return (data ?? []) as MentorBlockedTime[];
    },
    enabled: !!mentorId,
  });
}

// ============================================
// BOOKING POLICY QUERY
// ============================================

export function useAdminBookingPolicy() {
  return useQuery({
    queryKey: ['admin-booking-policy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booking_policies')
        .select('*')
        .is('service_id', null)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
  });
}

// ============================================
// MENTOR SERVICE MUTATIONS
// ============================================

interface UpsertMentorServiceData {
  id?: string;
  mentor_id: string;
  service_id: string;
  slot_duration_minutes?: number;
  buffer_minutes?: number;
  default_meeting_link?: string;
  is_active?: boolean;
}

export function useUpsertMentorService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpsertMentorServiceData) => {
      const { id, ...rest } = data;
      if (id) {
        const { data: result, error } = await supabase
          .from('mentor_services')
          .update(rest)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('mentor_services')
          .insert(rest)
          .select()
          .single();
        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mentor-services'] });
      toast.success('Atribuição de mentor salva com sucesso!');
    },
    onError: (error) => {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        toast.error('Este mentor já está atribuído a este serviço.');
      } else {
        toast.error('Erro ao salvar atribuição: ' + error.message);
      }
    },
  });
}

export function useDeleteMentorService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mentor_services')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mentor-services'] });
      toast.success('Atribuição removida com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover atribuição: ' + error.message);
    },
  });
}

// ============================================
// AVAILABILITY MUTATIONS
// ============================================

interface UpsertAvailabilityData {
  id?: string;
  mentor_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  timezone?: string;
  is_active?: boolean;
}

export function useUpsertAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpsertAvailabilityData) => {
      const { id, ...rest } = data;
      if (id) {
        const { data: result, error } = await supabase
          .from('mentor_availability')
          .update(rest)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('mentor_availability')
          .insert(rest)
          .select()
          .single();
        if (error) throw error;
        return result;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-mentor-availability', variables.mentor_id] });
      toast.success('Disponibilidade salva com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar disponibilidade: ' + error.message);
    },
  });
}

export function useDeleteAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, mentor_id }: { id: string; mentor_id: string }) => {
      const { error } = await supabase
        .from('mentor_availability')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-mentor-availability', variables.mentor_id] });
      toast.success('Horário removido com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover horário: ' + error.message);
    },
  });
}

// ============================================
// BLOCKED TIME MUTATIONS
// ============================================

interface CreateBlockedTimeData {
  mentor_id: string;
  start_datetime: string;
  end_datetime: string;
  reason?: string;
}

export function useCreateBlockedTime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBlockedTimeData) => {
      const { data: result, error } = await supabase
        .from('mentor_blocked_times')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-mentor-blocked-times', variables.mentor_id] });
      toast.success('Bloqueio criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar bloqueio: ' + error.message);
    },
  });
}

export function useDeleteBlockedTime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, mentor_id }: { id: string; mentor_id: string }) => {
      const { error } = await supabase
        .from('mentor_blocked_times')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-mentor-blocked-times', variables.mentor_id] });
      toast.success('Bloqueio removido com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover bloqueio: ' + error.message);
    },
  });
}

// ============================================
// BOOKING POLICY MUTATION
// ============================================

export function useUpdateBookingPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      max_concurrent_bookings?: number;
      max_reschedules_per_booking?: number;
      min_notice_hours?: number;
      max_advance_days?: number;
      cancellation_window_hours?: number;
      default_duration_minutes?: number;
      slot_interval_minutes?: number;
    }) => {
      const { id, ...rest } = data;
      const { data: result, error } = await supabase
        .from('booking_policies')
        .update(rest)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-booking-policy'] });
      toast.success('Política de agendamento atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar política: ' + error.message);
    },
  });
}

// ============================================
// ADMIN BOOKING ACTIONS
// ============================================

export function useAdminCancelBooking() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ booking_id, reason }: { booking_id: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('cancel_booking', {
        p_booking_id: booking_id,
        p_user_id: user!.id,
        p_reason: reason || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      supabase.functions.invoke('send-booking-cancelled', {
        body: { booking_id: variables.booking_id },
      }).catch(() => {});
      toast.success('Agendamento cancelado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao cancelar: ' + error.message);
    },
  });
}

export function useAdminCompleteBooking() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ booking_id, mentor_notes }: { booking_id: string; mentor_notes?: string }) => {
      const { data, error } = await supabase.rpc('complete_booking', {
        p_booking_id: booking_id,
        p_user_id: user!.id,
        p_mentor_notes: mentor_notes || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast.success('Sessão marcada como concluída!');
    },
    onError: (error) => {
      toast.error('Erro ao concluir sessão: ' + error.message);
    },
  });
}

export function useAdminMarkNoShow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ booking_id }: { booking_id: string }) => {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'no_show' as BookingStatus,
          cancelled_at: new Date().toISOString(),
          cancelled_by: user!.id,
        })
        .eq('id', booking_id);
      if (error) throw error;

      // Record history
      await supabase.from('booking_history').insert({
        booking_id,
        action: 'no_show_marked',
        performed_by: user!.id,
        notes: 'Marcado como no-show pelo admin',
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      supabase.functions.invoke('send-booking-cancelled', {
        body: { booking_id: variables.booking_id },
      }).catch(() => {});
      toast.success('Marcado como no-show!');
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });
}

// Re-export useMentors from useAdminEspacos (same query)
export { useMentors } from './useAdminEspacos';
