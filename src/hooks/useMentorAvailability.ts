import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { MentorAvailability, MentorBlockedTime, DayOfWeek } from '@/types/booking';

// ============================================
// MY MENTOR SERVICES
// ============================================

export function useMyMentorServices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-mentor-services', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_services')
        .select('*')
        .eq('mentor_id', user!.id)
        .eq('is_active', true);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch service names
      const serviceIds = data.map(ms => ms.service_id);
      const { data: services } = await supabase
        .from('hub_services')
        .select('id, name, description, icon_name')
        .in('id', serviceIds);

      const serviceMap = Object.fromEntries((services ?? []).map(s => [s.id, s]));

      return data.map(ms => ({
        ...ms,
        service: serviceMap[ms.service_id],
      }));
    },
    enabled: !!user,
  });
}

// ============================================
// MY AVAILABILITY
// ============================================

export function useMyAvailability() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-availability', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_availability')
        .select('*')
        .eq('mentor_id', user!.id)
        .order('day_of_week');

      if (error) throw error;
      return (data ?? []) as MentorAvailability[];
    },
    enabled: !!user,
  });
}

// ============================================
// MY BLOCKED TIMES
// ============================================

export function useMyBlockedTimes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-blocked-times', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_blocked_times')
        .select('*')
        .eq('mentor_id', user!.id)
        .gte('end_datetime', new Date().toISOString())
        .order('start_datetime');

      if (error) throw error;
      return (data ?? []) as MentorBlockedTime[];
    },
    enabled: !!user,
  });
}

// ============================================
// AVAILABILITY MUTATIONS
// ============================================

export function useUpsertMyAvailability() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id?: string;
      day_of_week: DayOfWeek;
      start_time: string;
      end_time: string;
      timezone?: string;
      is_active?: boolean;
    }) => {
      const { id, ...rest } = data;
      const payload = { ...rest, mentor_id: user!.id };

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
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-availability'] });
      toast.success('Disponibilidade salva com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar disponibilidade: ' + error.message);
    },
  });
}

export function useDeleteMyAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mentor_availability')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-availability'] });
      toast.success('Horário removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover: ' + error.message);
    },
  });
}

// ============================================
// BLOCKED TIME MUTATIONS
// ============================================

export function useCreateMyBlockedTime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { start_datetime: string; end_datetime: string; reason?: string }) => {
      const { data: result, error } = await supabase
        .from('mentor_blocked_times')
        .insert({ ...data, mentor_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-blocked-times'] });
      toast.success('Bloqueio criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar bloqueio: ' + error.message);
    },
  });
}

export function useDeleteMyBlockedTime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mentor_blocked_times')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-blocked-times'] });
      toast.success('Bloqueio removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover: ' + error.message);
    },
  });
}

// ============================================
// MEETING LINK MUTATION
// ============================================

export function useUpdateMyMeetingLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, default_meeting_link }: { id: string; default_meeting_link: string }) => {
      const { error } = await supabase
        .from('mentor_services')
        .update({ default_meeting_link })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-mentor-services'] });
      toast.success('Link da reunião atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar link: ' + error.message);
    },
  });
}
