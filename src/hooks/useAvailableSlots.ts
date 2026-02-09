import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { addDays, startOfDay, format } from 'date-fns';
import type { TimeSlot, DaySlots, WeekSlots, DayOfWeek } from '@/types/booking';

/**
 * Fetch available time slots for a service within a date range
 */
export function useAvailableSlots(
  serviceId: string | undefined,
  startDate: Date,
  endDate: Date
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [
      'available-slots',
      serviceId,
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd'),
    ],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_service_id: serviceId!,
        p_start_date: format(startDate, 'yyyy-MM-dd'),
        p_end_date: format(endDate, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return data as TimeSlot[];
    },
    enabled: !!user && !!serviceId,
    // Keep slots fresh but not overly aggressive
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Fetch available slots for the current week
 */
export function useWeeklySlots(serviceId: string | undefined, weekOffset: number = 0) {
  const { user } = useAuth();

  // Calculate week boundaries
  const today = startOfDay(new Date());
  const startDate = addDays(today, weekOffset * 7);
  const endDate = addDays(startDate, 6);

  const query = useAvailableSlots(serviceId, startDate, endDate);

  // Transform flat slots into organized week structure
  const weekSlots: WeekSlots | null = query.data
    ? organizeSlotsByDay(query.data, startDate, endDate)
    : null;

  return {
    ...query,
    data: weekSlots,
    startDate,
    endDate,
  };
}

/**
 * Organize flat slot array into day-grouped structure
 */
function organizeSlotsByDay(
  slots: TimeSlot[],
  startDate: Date,
  endDate: Date
): WeekSlots {
  const days: DaySlots[] = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayName = format(currentDate, 'EEEE').toLowerCase() as DayOfWeek;

    // Filter slots for this day
    const daySlots = slots.filter((slot) => {
      const slotDate = new Date(slot.slot_start);
      return format(slotDate, 'yyyy-MM-dd') === dateStr;
    });

    days.push({
      date: new Date(currentDate),
      dayOfWeek: dayName,
      slots: daySlots,
    });

    currentDate = addDays(currentDate, 1);
  }

  return {
    startDate,
    endDate,
    days,
  };
}

/**
 * Check if a specific slot is still available (real-time check)
 */
export function useSlotAvailability(
  serviceId: string | undefined,
  slotStart: string | undefined
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['slot-availability', serviceId, slotStart],
    queryFn: async () => {
      if (!slotStart) return false;

      const slotDate = new Date(slotStart);
      const startDate = format(slotDate, 'yyyy-MM-dd');

      // Fetch slots for just that day
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_service_id: serviceId!,
        p_start_date: startDate,
        p_end_date: startDate,
      });

      if (error) throw error;

      // Check if the specific slot is in the available slots
      return (data as TimeSlot[]).some(
        (slot) => slot.slot_start === slotStart
      );
    },
    enabled: !!user && !!serviceId && !!slotStart,
    staleTime: 10 * 1000, // 10 seconds - more aggressive for availability check
  });
}

/**
 * Get mentor info for a service (single mentor per service)
 */
export function useMentorForService(serviceId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mentor-for-service', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_services')
        .select(`
          *,
          mentor:profiles!mentor_services_mentor_id_fkey(
            id,
            full_name,
            email,
            profile_photo_url
          ),
          service:hub_services(
            id,
            name,
            description,
            icon_name
          )
        `)
        .eq('service_id', serviceId!)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!serviceId,
  });
}
