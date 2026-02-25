import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { RescheduleBookingInput } from '@/types/booking';

/**
 * Reschedule an existing booking
 * Uses the reschedule_booking RPC for atomic rescheduling with validation
 */
export function useRescheduleBooking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const oldDatetimeRef = useRef<string | null>(null);

  return useMutation({
    mutationFn: async (input: RescheduleBookingInput) => {
      // Capture old datetime before rescheduling (needed for email)
      const { data: currentBooking } = await supabase
        .from('bookings')
        .select('scheduled_start')
        .eq('id', input.booking_id)
        .single();
      oldDatetimeRef.current = currentBooking?.scheduled_start || null;

      const { data, error } = await supabase.rpc('reschedule_booking', {
        p_booking_id: input.booking_id,
        p_new_start: input.new_start,
        p_user_id: user!.id,
      });

      if (error) {
        // Handle specific error cases
        if (
          error.message.includes('não está disponível') ||
          error.message.includes('unique_violation')
        ) {
          throw new Error(
            'O novo horário não está mais disponível. Por favor, escolha outro.'
          );
        }
        if (error.message.includes('vezes')) {
          throw new Error(error.message);
        }
        if (error.message.includes('antecedência')) {
          throw new Error(error.message);
        }
        if (error.message.includes('permissão')) {
          throw new Error(error.message);
        }
        throw error;
      }

      return data as boolean;
    },
    onSuccess: (_, variables) => {
      // Invalidate all booking-related queries
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', variables.booking_id] });
      queryClient.invalidateQueries({ queryKey: ['booking-history', variables.booking_id] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });

      // Send reschedule email with old datetime (fire-and-forget)
      supabase.functions.invoke('send-booking-rescheduled', {
        body: {
          booking_id: variables.booking_id,
          old_datetime: oldDatetimeRef.current,
        },
      }).then(({ error }) => {
        if (error) console.error('Booking reschedule email error:', error);
      });
      oldDatetimeRef.current = null;

      toast({
        title: 'Agendamento reagendado!',
        description: 'Você receberá um email com a confirmação do novo horário.',
      });
    },
    onError: (error: Error) => {
      // Refresh available slots on error
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });

      toast({
        title: 'Erro ao reagendar',
        description: error.message || 'Ocorreu um erro ao reagendar.',
        variant: 'destructive',
      });
    },
  });
}
