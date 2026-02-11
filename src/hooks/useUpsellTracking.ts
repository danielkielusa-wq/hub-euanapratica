import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useUpsellTracking() {
  const queryClient = useQueryClient();

  const markClick = useMutation({
    mutationFn: async (impressionId: string) => {
      const { error } = await supabase.rpc('mark_upsell_click', {
        p_impression_id: impressionId,
      });
      if (error) throw error;
    },
    onSuccess: (_, impressionId) => {
      console.log('Upsell click tracked:', impressionId);
    },
    onError: (error) => {
      console.error('Failed to track upsell click:', error);
    },
  });

  const markDismiss = useMutation({
    mutationFn: async (impressionId: string) => {
      const { error } = await supabase.rpc('mark_upsell_dismiss', {
        p_impression_id: impressionId,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      console.log('Upsell dismissed:', variables);
      // Invalidate queries para esconder o card
      queryClient.invalidateQueries({ queryKey: ['post-upsell'] });
    },
    onError: (error) => {
      console.error('Failed to track upsell dismiss:', error);
      toast.error('Erro ao processar ação');
    },
  });

  const markConversion = useMutation({
    mutationFn: async (impressionId: string) => {
      const { error } = await supabase.rpc('mark_upsell_conversion', {
        p_impression_id: impressionId,
      });
      if (error) throw error;
    },
    onSuccess: (_, impressionId) => {
      console.log('Upsell conversion tracked:', impressionId);
      toast.success('Obrigado pela compra!');
    },
    onError: (error) => {
      console.error('Failed to track upsell conversion:', error);
    },
  });

  return {
    markClick,
    markDismiss,
    markConversion,
  };
}
