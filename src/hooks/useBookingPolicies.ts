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
 * Calculate policy limits for a specific booking (per-card hook — kept for backward compatibility)
 */
export function useBookingLimits(booking: Booking | undefined) {
  const { data: policy, isLoading: policyLoading } = useBookingPolicy(
    booking?.service_id
  );
  const { data: stats, isLoading: statsLoading } = useBookingStats();

  if (!booking || !policy || policyLoading || statsLoading) {
    return { isLoading: policyLoading || statsLoading, data: null };
  }

  return { isLoading: false, data: computeBookingLimits(booking, policy, stats) };
}

/**
 * Fetch ALL active booking policies in one query.
 * Returns a Map keyed by service_id (or '__global__' for the global policy).
 * Eliminates N+1: one query instead of one per unique service_id.
 */
export function useBookingPoliciesMap() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['booking-policies-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booking_policies')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const map = new Map<string, BookingPolicy>();
      for (const p of data as BookingPolicy[]) {
        map.set(p.service_id ?? '__global__', p);
      }
      return map;
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

/**
 * Resolve the correct policy for a booking from the policies map.
 * Falls back to global policy if no service-specific policy exists.
 */
export function resolvePolicyForBooking(
  booking: Booking,
  policiesMap: Map<string, BookingPolicy>
): BookingPolicy | undefined {
  return policiesMap.get(booking.service_id) ?? policiesMap.get('__global__');
}

/**
 * Pure function: compute limits for a booking given a policy and stats.
 */
export function computeBookingLimits(
  booking: Booking,
  policy: BookingPolicy,
  stats: { remaining_slots: number } | null
): BookingPolicyLimits {
  const now = new Date();
  const sessionStart = new Date(booking.scheduled_start);
  const hoursUntilSession = differenceInHours(sessionStart, now);

  const limits: BookingPolicyLimits = {
    canBook: (stats?.remaining_slots ?? 0) > 0,
    canReschedule:
      booking.status === 'confirmed' &&
      booking.reschedule_count < policy.max_reschedules_per_booking &&
      hoursUntilSession >= policy.cancellation_window_hours,
    canCancel: booking.status === 'confirmed',
    remainingBookings: stats?.remaining_slots ?? 0,
    remainingReschedules: Math.max(
      0,
      policy.max_reschedules_per_booking - booking.reschedule_count
    ),
    hoursUntilSession,
    cancellationWindowHours: policy.cancellation_window_hours,
  };

  if (!limits.canReschedule && booking.status === 'confirmed') {
    if (booking.reschedule_count >= policy.max_reschedules_per_booking) {
      limits.message = `Você já reagendou esta sessão ${booking.reschedule_count} vezes (limite máximo).`;
    } else if (hoursUntilSession < policy.cancellation_window_hours) {
      limits.message = `Não é possível reagendar com menos de ${policy.cancellation_window_hours} horas de antecedência.`;
    }
  }

  return limits;
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
 * Fetch session credit info for a specific service
 */
export function useSessionCredits(serviceId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['session-credits', user?.id, serviceId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_service_session_info', {
        p_student_id: user!.id,
        p_service_id: serviceId!,
      });

      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row as {
        sessions_total: number | null;
        sessions_used: number;
        upcoming_confirmed: number;
        available: number | null; // null = unlimited
      };
    },
    enabled: !!user?.id && !!serviceId,
  });
}

/**
 * Check if user can create a new booking
 * Combines concurrent slot limit + session credit check
 */
export function useCanCreateBooking(serviceId?: string) {
  const { data: stats, isLoading } = useBookingStats();
  const { data: policy, isLoading: policyLoading } = useGlobalBookingPolicy();
  const { data: credits, isLoading: creditsLoading } = useSessionCredits(serviceId);

  const concurrentCanBook = (stats?.remaining_slots ?? 0) > 0;

  // Session credit check: null available = unlimited (skip check)
  const hasCredits = credits?.available === null || credits?.available === undefined || credits.available > 0;

  const canBook = concurrentCanBook && hasCredits;

  let message: string | null = null;
  if (!concurrentCanBook) {
    message = `Você atingiu o limite de ${policy?.max_concurrent_bookings ?? 3} agendamentos simultâneos.`;
  } else if (!hasCredits) {
    message = `Você já utilizou todas as sessões disponíveis para este serviço (${credits?.sessions_total ?? 0} sessões).`;
  }

  return {
    isLoading: isLoading || policyLoading || creditsLoading,
    canBook,
    remainingSlots: stats?.remaining_slots ?? 0,
    maxSlots: policy?.max_concurrent_bookings ?? 3,
    // Session credit info
    sessionsTotal: credits?.sessions_total ?? null,
    sessionsUsed: credits?.sessions_used ?? 0,
    sessionsAvailable: credits?.available ?? null,
    message,
  };
}
