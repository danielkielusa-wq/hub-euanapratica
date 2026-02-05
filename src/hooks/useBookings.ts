import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { BookingWithDetails, BookingStatus, BookingStats } from '@/types/booking';

/**
 * Fetch student's bookings with optional filters
 */
export function useBookings(filter: 'upcoming' | 'past' | 'all' = 'all') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bookings', user?.id, filter],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          service:hub_services(id, name, description, icon_name),
          mentor:profiles!bookings_mentor_id_fkey(id, full_name, email, profile_photo_url)
        `)
        .eq('student_id', user!.id)
        .order('scheduled_start', { ascending: filter === 'upcoming' });

      // Apply filter
      if (filter === 'upcoming') {
        query = query
          .eq('status', 'confirmed')
          .gte('scheduled_start', new Date().toISOString());
      } else if (filter === 'past') {
        query = query.or(
          `status.neq.confirmed,scheduled_start.lt.${new Date().toISOString()}`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as BookingWithDetails[];
    },
    enabled: !!user,
  });
}

/**
 * Fetch upcoming bookings only (convenience hook)
 */
export function useUpcomingBookings() {
  return useBookings('upcoming');
}

/**
 * Fetch past bookings only (convenience hook)
 */
export function usePastBookings() {
  return useBookings('past');
}

/**
 * Fetch a single booking by ID
 */
export function useBooking(bookingId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:hub_services(id, name, description, icon_name),
          mentor:profiles!bookings_mentor_id_fkey(id, full_name, email, profile_photo_url)
        `)
        .eq('id', bookingId!)
        .single();

      if (error) throw error;
      return data as BookingWithDetails;
    },
    enabled: !!user && !!bookingId,
  });
}

/**
 * Fetch student's booking statistics
 */
export function useBookingStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['booking-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_student_booking_stats', {
          p_student_id: user!.id,
        });

      if (error) throw error;

      // RPC returns an array with one row
      const stats = Array.isArray(data) ? data[0] : data;
      return stats as BookingStats;
    },
    enabled: !!user,
  });
}

/**
 * Fetch booking history for a specific booking
 */
export function useBookingHistory(bookingId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['booking-history', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booking_history')
        .select('*')
        .eq('booking_id', bookingId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!bookingId,
  });
}

/**
 * Count bookings by status (for dashboard widgets)
 */
export function useBookingCounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['booking-counts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('status')
        .eq('student_id', user!.id);

      if (error) throw error;

      const counts: Record<BookingStatus | 'total', number> = {
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        no_show: 0,
        total: data.length,
      };

      data.forEach((booking) => {
        if (booking.status) {
          counts[booking.status as BookingStatus]++;
        }
      });

      return counts;
    },
    enabled: !!user,
  });
}
