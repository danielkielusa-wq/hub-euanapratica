import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInHours } from 'date-fns';
import type { BookingPolicy, Booking, BookingPolicyLimits } from '@/types/booking';

/**
 * Fetch booking policy for a specific service (or global if no service-specific)
 */
export function useBookingPolicy(serviceId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['booking-policy', serviceId],
    queryFn: async () => {
      // Try service-specific first, then global
      let query = supabase
        .from('booking_policies')
        .select('*')
        .eq('is_active', true);

      if (serviceId) {
        query = query.or(`service_id.eq.${serviceId},service_id.is.null`);
      } else {
        query = query.is('service_id', null);
      }

      const { data, error } = await query
        .order('service_id', { ascending: false, nullsFirst: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data as BookingPolicy;
    },
    enabled: !!user,
  });
}

/**
 * Fetch global booking policy
 */
export function useGlobalBookingPolicy() {
  return useBookingPolicy(undefined);
}

/**
 * Calculate policy limits for a specific booking
 * Determines if user can cancel/reschedule based on policy and timing
 */
export function useBookingLimits(booking: Booking | undefined) {
  const { data: policy, isLoading: policyLoading } = useBookingPolicy(
    booking?.service_id
  );
  const { data: stats, isLoading: statsLoading } = useBookingStats();

  if (!booking || !policy || policyLoading || statsLoading) {
    return {
      isLoading: policyLoading || statsLoading,
      data: null,
    };
  }

  const now = new Date();
  const sessionStart = new Date(booking.scheduled_start);
  const hoursUntilSession = differenceInHours(sessionStart, now);

  const limits: BookingPolicyLimits = {
    // Can book if under concurrent limit
    canBook: (stats?.remaining_slots ?? 0) > 0,

    // Can reschedule if:
    // 1. Status is confirmed
    // 2. Under reschedule limit
    // 3. Outside cancellation window
    canReschedule:
      booking.status === 'confirmed' &&
      booking.reschedule_count < policy.max_reschedules_per_booking &&
      hoursUntilSession >= policy.cancellation_window_hours,

    // Can cancel if:
    // 1. Status is confirmed
    // 2. Outside cancellation window (or will be marked as no-show)
    canCancel: booking.status === 'confirmed',

    remainingBookings: stats?.remaining_slots ?? 0,
    remainingReschedules: Math.max(
      0,
      policy.max_reschedules_per_booking - booking.reschedule_count
    ),
    hoursUntilSession,
    cancellationWindowHours: policy.cancellation_window_hours,
  };

  // Generate appropriate messages
  if (!limits.canReschedule && booking.status === 'confirmed') {
    if (booking.reschedule_count >= policy.max_reschedules_per_booking) {
      limits.message = `Você já reagendou esta sessão ${booking.reschedule_count} vezes (limite máximo).`;
    } else if (hoursUntilSession < policy.cancellation_window_hours) {
      limits.message = `Não é possível reagendar com menos de ${policy.cancellation_window_hours} horas de antecedência.`;
    }
  }

  return {
    isLoading: false,
    data: limits,
  };
}

/**
 * Import from useBookings to avoid circular dependency
 */
import { useQuery as useStatsQuery } from '@tanstack/react-query';

function useBookingStats() {
  const { user } = useAuth();

  return useStatsQuery({
    queryKey: ['booking-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_student_booking_stats', {
        p_student_id: user!.id,
      });

      if (error) throw error;
      const stats = Array.isArray(data) ? data[0] : data;
      return stats as {
        total_bookings: number;
        upcoming_bookings: number;
        completed_bookings: number;
        cancelled_bookings: number;
        no_show_bookings: number;
        remaining_slots: number;
      };
    },
    enabled: !!user,
  });
}

/**
 * Check if user can create a new booking
 */
export function useCanCreateBooking() {
  const { data: stats, isLoading } = useBookingStats();
  const { data: policy, isLoading: policyLoading } = useGlobalBookingPolicy();

  return {
    isLoading: isLoading || policyLoading,
    canBook: (stats?.remaining_slots ?? 0) > 0,
    remainingSlots: stats?.remaining_slots ?? 0,
    maxSlots: policy?.max_concurrent_bookings ?? 3,
    message:
      (stats?.remaining_slots ?? 0) <= 0
        ? `Você atingiu o limite de ${policy?.max_concurrent_bookings ?? 3} agendamentos simultâneos.`
        : null,
  };
}
