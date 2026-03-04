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
    },
    onError: (error) => {
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
      // Invalidate queries para esconder o card
      queryClient.invalidateQueries({ queryKey: ['post-upsell'] });
    },
    onError: (error) => {
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
      toast.success('Obrigado pela compra!');
    },
    onError: (error) => {
    },
  });

  return {
    markClick,
    markDismiss,
    markConversion,
  };
}
