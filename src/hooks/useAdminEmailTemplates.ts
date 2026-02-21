import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmailTemplate {
  id: string;
  name: string;
  display_name: string;
  subject: string;
  body_html: string;
  design_json: any | null; // Unlayer design JSON
  variables: string[]; // Array of variable names
  category: string | null;
  description: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface EmailTemplateInput {
  name: string;
  display_name: string;
  subject: string;
  body_html: string;
  design_json?: any;
  variables?: string[];
  category?: string;
  description?: string;
  enabled?: boolean;
}

/**
 * Hook para gerenciar templates de email no admin
 */
export function useAdminEmailTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('display_name', { ascending: true });

      if (error) throw error;

      setTemplates((data || []) as EmailTemplate[]);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar templates',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createTemplate = useCallback(async (input: EmailTemplateInput) => {
    try {
      setIsSaving('creating');
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          ...input,
          created_by: user?.id,
          updated_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Template criado',
        description: `${input.display_name} foi criado com sucesso.`,
      });

      await fetchTemplates();
      return data;
    } catch (error: any) {
      toast({
        title: 'Erro ao criar template',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSaving(null);
    }
  }, [toast, fetchTemplates]);

  const updateTemplate = useCallback(async (id: string, input: Partial<EmailTemplateInput>) => {
    try {
      setIsSaving(id);
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('email_templates')
        .update({
          ...input,
          updated_by: user?.id,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Template atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });

      await fetchTemplates();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar template',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSaving(null);
    }
  }, [toast, fetchTemplates]);

  const toggleEnabled = useCallback(async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ enabled })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: enabled ? 'Template ativado' : 'Template desativado',
        description: enabled
          ? 'O template agora pode ser usado para envio de emails.'
          : 'O template não será mais usado para envio de emails.',
      });

      await fetchTemplates();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast, fetchTemplates]);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      setIsSaving(id);
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Template removido',
        description: 'O template foi removido com sucesso.',
      });

      await fetchTemplates();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover template',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSaving(null);
    }
  }, [toast, fetchTemplates]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    isLoading,
    isSaving,
    createTemplate,
    updateTemplate,
    toggleEnabled,
    deleteTemplate,
    refetch: fetchTemplates,
  };
}
