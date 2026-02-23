import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WhatsAppTemplateRow {
  id: string;
  name: string;
  display_name: string;
  body: string;
  variables: string[];
  category: string | null;
  description: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ── Query: All templates (admin CRUD) ────────────────────────────────

export function useWhatsAppTemplatesAll() {
  return useQuery<WhatsAppTemplateRow[]>({
    queryKey: ['whatsapp-templates-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_templates' as any)
        .select('*')
        .order('category')
        .order('display_name');
      if (error) throw error;
      return (data || []) as unknown as WhatsAppTemplateRow[];
    },
  });
}

// ── Mutation: Create template ────────────────────────────────────────

export function useCreateWhatsAppTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      display_name: string;
      body: string;
      variables?: string[];
      category?: string;
      description?: string;
    }) => {
      const { error } = await supabase
        .from('whatsapp_templates' as any)
        .insert(input as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates-all'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates-active'] });
      toast({ title: 'Template criado!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar template', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Update template ────────────────────────────────────────

export function useUpdateWhatsAppTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      name: string;
      display_name: string;
      body: string;
      variables?: string[];
      category?: string;
      description?: string;
      enabled?: boolean;
    }) => {
      const { id, ...updates } = input;
      const { error } = await supabase
        .from('whatsapp_templates' as any)
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates-all'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates-active'] });
      toast({ title: 'Template atualizado!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar template', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Delete template ────────────────────────────────────────

export function useDeleteWhatsAppTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whatsapp_templates' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates-all'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates-active'] });
      toast({ title: 'Template excluído!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir template', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Toggle enabled ─────────────────────────────────────────

export function useToggleWhatsAppTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('whatsapp_templates' as any)
        .update({ enabled } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates-all'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates-active'] });
      toast({ title: enabled ? 'Template ativado!' : 'Template desativado!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao alterar status', description: error.message, variant: 'destructive' });
    },
  });
}
