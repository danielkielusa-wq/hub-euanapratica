import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HubService } from '@/types/hub';
import type { HubServiceFormSubmitData } from '@/components/admin/hub/HubServiceForm';
import { toast } from 'sonner';

const ESPACO_CATEGORY_MAP: Record<string, string> = {
  live_mentoring: 'group_mentoring',
  recorded_course: 'course',
  live_event: 'workshop',
};

function needsEspaco(serviceType: string): boolean {
  return serviceType in ESPACO_CATEGORY_MAP;
}

async function autoCreateEspaco(name: string, description: string | null | undefined, serviceType: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: newEspaco, error } = await supabase
    .from('espacos')
    .insert({
      name,
      description: description || null,
      category: ESPACO_CATEGORY_MAP[serviceType] as 'immersion' | 'group_mentoring' | 'workshop' | 'bootcamp' | 'course',
      visibility: 'private' as const,
      status: 'active',
      mentor_id: user?.id || null,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Erro ao criar espaço vinculado: ${error.message}`);
  }

  return newEspaco.id;
}

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
    mutationFn: async (formData: HubServiceFormSubmitData) => {
      const serviceType = formData.service_type || 'ai_tool';
      let espacoId = formData.espaco_id || null;

      // Auto-create espaco if service type requires one and none provided
      if (needsEspaco(serviceType) && !espacoId) {
        espacoId = await autoCreateEspaco(formData.name, formData.description, serviceType);
      }

      const { data, error } = await supabase
        .from('hub_services')
        .insert({
          name: formData.name,
          description: formData.description || null,
          icon_name: formData.icon_name || 'FileCheck',
          status: formData.status || 'available',
          service_type: serviceType,
          ribbon: formData.ribbon || null,
          category: formData.category || null,
          route: formData.route || null,
          redirect_url: formData.redirect_url || null,
          cta_text: formData.cta_text || 'Acessar Agora',
          is_visible_in_hub: formData.is_visible_in_hub ?? true,
          is_highlighted: formData.is_highlighted ?? false,
          display_order: formData.display_order ?? 0,
          price: formData.price ?? 0,
          anchor_price: formData.anchor_price ?? null,
          price_display: formData.price_display || null,
          currency: formData.currency || 'BRL',
          product_type: formData.product_type || 'one_time',
          stripe_price_id: formData.stripe_price_id || null,
          accent_color: formData.accent_color || null,
          report_dimension: formData.report_dimension || null,
          landing_page_url: formData.landing_page_url || null,
          // Ticto fields
          ticto_product_id: formData.ticto_product_id || null,
          ticto_checkout_url: formData.ticto_checkout_url || null,
          // Landing page fields
          duration: formData.duration || null,
          meeting_type: formData.meeting_type || null,
          landing_page_data: formData.landing_page_data as Record<string, unknown> | null,
          thank_you_page_data: formData.thank_you_page_data as Record<string, unknown> | null,
          // Upsell fields
          keywords: formData.keywords || [],
          target_tier: formData.target_tier || 'all',
          is_visible_for_upsell: formData.is_visible_for_upsell ?? true,
          // Course link
          espaco_id: espacoId,
          // Order bump
          order_bump_service_id: formData.order_bump_service_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-hub-services'] });
      queryClient.invalidateQueries({ queryKey: ['hub-services'] });
      queryClient.invalidateQueries({ queryKey: ['admin-espacos'] });

      if (data.espaco_id && needsEspaco(data.service_type || '')) {
        toast.success('Produto criado com espaço vinculado!');
      } else {
        toast.success('Produto criado com sucesso!');
      }
    },
    onError: (error) => {
      toast.error('Erro ao criar produto');
    },
  });
}

export function useUpdateHubService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...formData }: HubServiceFormSubmitData & { id: string }) => {
      // If setting is_highlighted to true, first unset all others
      if (formData.is_highlighted === true) {
        await supabase
          .from('hub_services')
          .update({ is_highlighted: false })
          .neq('id', id);
      }

      const serviceType = formData.service_type || 'ai_tool';
      let espacoId = formData.espaco_id || null;

      // Auto-create espaco if type requires one and none linked
      if (needsEspaco(serviceType) && !espacoId) {
        espacoId = await autoCreateEspaco(formData.name, formData.description, serviceType);
      }

      // Clear espaco link if type no longer requires one (don't delete the espaco)
      if (!needsEspaco(serviceType)) {
        espacoId = null;
      }

      const { data, error } = await supabase
        .from('hub_services')
        .update({
          name: formData.name,
          description: formData.description || null,
          icon_name: formData.icon_name,
          status: formData.status,
          service_type: serviceType,
          ribbon: formData.ribbon || null,
          category: formData.category || null,
          route: formData.route || null,
          redirect_url: formData.redirect_url || null,
          cta_text: formData.cta_text,
          is_visible_in_hub: formData.is_visible_in_hub,
          is_highlighted: formData.is_highlighted,
          display_order: formData.display_order,
          price: formData.price,
          anchor_price: formData.anchor_price ?? null,
          price_display: formData.price_display || null,
          currency: formData.currency,
          product_type: formData.product_type,
          stripe_price_id: formData.stripe_price_id || null,
          accent_color: formData.accent_color || null,
          report_dimension: formData.report_dimension || null,
          landing_page_url: formData.landing_page_url || null,
          // Ticto fields
          ticto_product_id: formData.ticto_product_id || null,
          ticto_checkout_url: formData.ticto_checkout_url || null,
          // Landing page fields
          duration: formData.duration || null,
          meeting_type: formData.meeting_type || null,
          landing_page_data: formData.landing_page_data as Record<string, unknown> | null,
          thank_you_page_data: formData.thank_you_page_data as Record<string, unknown> | null,
          // Upsell fields
          keywords: formData.keywords || [],
          target_tier: formData.target_tier || 'all',
          is_visible_for_upsell: formData.is_visible_for_upsell ?? true,
          // Course link
          espaco_id: espacoId,
          // Order bump
          order_bump_service_id: formData.order_bump_service_id || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-hub-services'] });
      queryClient.invalidateQueries({ queryKey: ['hub-services'] });
      queryClient.invalidateQueries({ queryKey: ['admin-espacos'] });

      if (data.espaco_id && needsEspaco(data.service_type || '')) {
        toast.success('Produto atualizado com espaço vinculado!');
      } else {
        toast.success('Produto atualizado com sucesso!');
      }
    },
    onError: (error) => {
      toast.error('Erro ao atualizar produto');
    },
  });
}

export function useToggleHubServiceVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_visible_in_hub }: { id: string; is_visible_in_hub: boolean }) => {
      const { error } = await supabase
        .from('hub_services')
        .update({ is_visible_in_hub })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hub-services'] });
      queryClient.invalidateQueries({ queryKey: ['hub-services'] });
    },
    onError: () => {
      toast.error('Erro ao alterar visibilidade');
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
      toast.error('Erro ao remover produto');
    },
  });
}
