import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HubService, HubServiceFormData } from '@/types/hub';
import { toast } from 'sonner';

export function useAdminHubServices() {
  return useQuery({
    queryKey: ['admin-hub-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hub_services')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return data as HubService[];
    },
  });
}

export function useCreateHubService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: Partial<HubServiceFormData>) => {
      const { data, error } = await supabase
        .from('hub_services')
        .insert({
          name: formData.name!,
          description: formData.description || null,
          icon_name: formData.icon_name || 'FileCheck',
          status: formData.status || 'available',
          service_type: formData.service_type || 'ai_tool',
          ribbon: formData.ribbon || null,
          category: formData.category || null,
          route: formData.route || null,
          redirect_url: formData.redirect_url || null,
          cta_text: formData.cta_text || 'Acessar Agora',
          is_visible_in_hub: formData.is_visible_in_hub ?? true,
          is_highlighted: formData.is_highlighted ?? false,
          display_order: formData.display_order ?? 0,
          price: formData.price ?? 0,
          price_display: formData.price_display || null,
          currency: formData.currency || 'BRL',
          product_type: formData.product_type || 'one_time',
          stripe_price_id: formData.stripe_price_id || null,
          accent_color: formData.accent_color || null,
          // Ticto fields
          ticto_product_id: formData.ticto_product_id || null,
          ticto_checkout_url: formData.ticto_checkout_url || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hub-services'] });
      queryClient.invalidateQueries({ queryKey: ['hub-services'] });
      toast.success('Produto criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating hub service:', error);
      toast.error('Erro ao criar produto');
    },
  });
}

export function useUpdateHubService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...formData }: Partial<HubServiceFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('hub_services')
        .update({
          name: formData.name,
          description: formData.description || null,
          icon_name: formData.icon_name,
          status: formData.status,
          service_type: formData.service_type,
          ribbon: formData.ribbon || null,
          category: formData.category || null,
          route: formData.route || null,
          redirect_url: formData.redirect_url || null,
          cta_text: formData.cta_text,
          is_visible_in_hub: formData.is_visible_in_hub,
          is_highlighted: formData.is_highlighted,
          display_order: formData.display_order,
          price: formData.price,
          price_display: formData.price_display || null,
          currency: formData.currency,
          product_type: formData.product_type,
          stripe_price_id: formData.stripe_price_id || null,
          accent_color: formData.accent_color || null,
          // Ticto fields
          ticto_product_id: formData.ticto_product_id || null,
          ticto_checkout_url: formData.ticto_checkout_url || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hub-services'] });
      queryClient.invalidateQueries({ queryKey: ['hub-services'] });
      toast.success('Produto atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating hub service:', error);
      toast.error('Erro ao atualizar produto');
    },
  });
}

export function useDeleteHubService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hub_services')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hub-services'] });
      queryClient.invalidateQueries({ queryKey: ['hub-services'] });
      toast.success('Produto removido com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting hub service:', error);
      toast.error('Erro ao remover produto');
    },
  });
}
