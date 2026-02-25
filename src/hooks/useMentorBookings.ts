import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { BookingWithDetails } from '@/types/booking';

export function useMentorBookings(filter: 'upcoming' | 'past' | 'all' = 'all') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mentor-bookings', user?.id, filter],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select('*')
        .eq('mentor_id', user!.id)
        .order('scheduled_start', { ascending: filter === 'upcoming' });

      if (filter === 'upcoming') {
        query = query.eq('status', 'confirmed').gte('scheduled_start', new Date().toISOString());
      } else if (filter === 'past') {
        query = query.or(`status.neq.confirmed,scheduled_start.lt.${new Date().toISOString()}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch student profiles
      const studentIds = [...new Set(data.map(b => b.student_id).filter(Boolean))];
      let profileMap: Record<string, { id: string; full_name: string; email: string; profile_photo_url: string | null }> = {};
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, profile_photo_url')
          .in('id', studentIds);
        if (profiles) {
          profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
        }
      }

      // Fetch services
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

      return data.map(b => ({
        ...b,
        student: profileMap[b.student_id],
        service: serviceMap[b.service_id],
      })) as BookingWithDetails[];
    },
    enabled: !!user,
  });
}

export function useUpcomingMentorBookings() {
  return useMentorBookings('upcoming');
}

export function usePastMentorBookings() {
  return useMentorBookings('past');
}
