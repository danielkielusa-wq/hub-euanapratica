import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { FeedbackItem, FeedbackFilters, FeedbackType, FeedbackPriority, FeedbackStatus } from '@/types/feedback';

interface CreateFeedbackInput {
  type: FeedbackType;
  title: string;
  description: string;
  page_url: string;
  user_role: string;
  priority?: FeedbackPriority;
  attachment_url?: string;
  attachment_name?: string;
}

interface UpdateFeedbackInput {
  id: string;
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  admin_notes?: string;
}

// Hook para criar feedback (qualquer usuário autenticado)
export function useCreateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFeedbackInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('feedback_items')
        .insert({
          type: input.type,
          title: input.title,
          description: input.description,
          page_url: input.page_url,
          user_id: user.id,
          user_role: input.user_role,
          priority: input.priority || 'medium',
          attachment_url: input.attachment_url,
          attachment_name: input.attachment_name,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Obrigado! Seu feedback foi registrado com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
    onError: (error) => {
      console.error('Erro ao criar feedback:', error);
      toast.error('Não conseguimos registrar seu feedback. Tente novamente mais tarde.');
    },
  });
}

// Hook para listar feedbacks (apenas admin)
export function useAdminFeedback(filters: FeedbackFilters = {}) {
  return useQuery({
    queryKey: ['admin-feedback', filters],
    queryFn: async () => {
      let query = supabase
        .from('feedback_items')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }
      if (filters.userRole && filters.userRole !== 'all') {
        query = query.eq('user_role', filters.userRole);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,page_url.ilike.%${filters.search}%`);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar perfis separadamente
      const userIds = [...new Set(data.map(f => f.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, profile_photo_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(item => ({
        ...item,
        profiles: profileMap.get(item.user_id) || null,
      })) as FeedbackItem[];
    },
  });
}

// Hook para buscar um feedback específico
export function useFeedbackDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['feedback-detail', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('feedback_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email, profile_photo_url')
        .eq('id', data.user_id)
        .single();

      return {
        ...data,
        profiles: profile || null,
      } as FeedbackItem;
    },
    enabled: !!id,
  });
}

// Hook para atualizar feedback (apenas admin)
export function useUpdateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateFeedbackInput) => {
      const updateData: Record<string, unknown> = {};
      
      if (input.status !== undefined) updateData.status = input.status;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.admin_notes !== undefined) updateData.admin_notes = input.admin_notes;

      const { data, error } = await supabase
        .from('feedback_items')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('Feedback atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-detail', variables.id] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar feedback:', error);
      toast.error('Erro ao atualizar o feedback. Tente novamente.');
    },
  });
}

// Hook para estatísticas de feedback
export function useFeedbackStats() {
  return useQuery({
    queryKey: ['feedback-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback_items')
        .select('status, type');

      if (error) throw error;

      const stats = {
        total: data.length,
        new: data.filter(f => f.status === 'new').length,
        inReview: data.filter(f => f.status === 'in_review').length,
        resolved: data.filter(f => f.status === 'resolved').length,
        bugs: data.filter(f => f.type === 'bug').length,
        enhancements: data.filter(f => f.type === 'enhancement').length,
      };

      return stats;
    },
  });
}
