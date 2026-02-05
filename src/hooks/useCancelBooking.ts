import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { CancelBookingInput } from '@/types/booking';

/**
 * Cancel an existing booking
 * Uses the cancel_booking RPC which handles late cancellation (no-show) logic
 */
export function useCancelBooking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CancelBookingInput) => {
      const { data, error } = await supabase.rpc('cancel_booking', {
        p_booking_id: input.booking_id,
        p_user_id: user!.id,
        p_reason: input.reason || null,
      });

      if (error) {
        if (error.message.includes('permissão')) {
          throw new Error(error.message);
        }
        if (error.message.includes('confirmados')) {
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
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
      queryClient.invalidateQueries({ queryKey: ['booking-counts'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });

      toast({
        title: 'Agendamento cancelado',
        description: 'Seu agendamento foi cancelado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cancelar',
        description: error.message || 'Ocorreu um erro ao cancelar o agendamento.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Complete a booking (mentor/admin only)
 */
export function useCompleteBooking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { booking_id: string; mentor_notes?: string }) => {
      const { data, error } = await supabase.rpc('complete_booking', {
        p_booking_id: input.booking_id,
        p_user_id: user!.id,
        p_mentor_notes: input.mentor_notes || null,
      });

      if (error) throw error;
      return data as boolean;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', variables.booking_id] });
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] });

      toast({
        title: 'Sessão concluída',
        description: 'A sessão foi marcada como concluída.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao marcar a sessão como concluída.',
        variant: 'destructive',
      });
    },
  });
}
