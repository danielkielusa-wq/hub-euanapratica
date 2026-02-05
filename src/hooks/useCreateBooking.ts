import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { CreateBookingInput } from '@/types/booking';

/**
 * Create a new booking
 * Uses the create_booking RPC for atomic creation with validation
 */
export function useCreateBooking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const { data, error } = await supabase.rpc('create_booking', {
        p_student_id: user!.id,
        p_service_id: input.service_id,
        p_scheduled_start: input.scheduled_start,
        p_duration_minutes: input.duration_minutes || null,
        p_student_notes: input.student_notes || null,
      });

      if (error) {
        // Handle specific error cases
        if (
          error.message.includes('não está mais disponível') ||
          error.message.includes('unique_violation')
        ) {
          throw new Error(
            'Este horário não está mais disponível. Por favor, escolha outro.'
          );
        }
        if (error.message.includes('limite')) {
          throw new Error(error.message);
        }
        if (error.message.includes('antecedência')) {
          throw new Error(error.message);
        }
        throw error;
      }

      return data as string; // Returns booking ID
    },
    onSuccess: (bookingId) => {
      // Invalidate all booking-related queries
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
      queryClient.invalidateQueries({ queryKey: ['booking-counts'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });

      toast({
        title: 'Agendamento confirmado!',
        description: 'Você receberá um email de confirmação em breve.',
      });

      return bookingId;
    },
    onError: (error: Error) => {
      // Refresh available slots on error (slot might have been taken)
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });

      toast({
        title: 'Erro ao agendar',
        description: error.message || 'Ocorreu um erro ao criar o agendamento.',
        variant: 'destructive',
      });
    },
  });
}
