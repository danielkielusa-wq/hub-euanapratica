import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ── Mutation: Send WhatsApp message ──────────────────────────────────

export function useSendWhatsApp() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      lead_id: string;
      message?: string;
      template_name?: string;
      variables?: Record<string, string>;
    }) => {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: input,
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Erro desconhecido ao enviar WhatsApp');
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lead-interactions', vars.lead_id] });
      toast({ title: 'Mensagem WhatsApp enviada!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar WhatsApp',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ── Query: WhatsApp templates (for SendWhatsAppDialog) ───────────────

export interface WhatsAppTemplate {
  id: string;
  name: string;
  display_name: string;
  body: string;
  variables: string[];
  category: string | null;
  description: string | null;
  enabled: boolean;
}

export function useWhatsAppTemplates() {
  return useQuery<WhatsAppTemplate[]>({
    queryKey: ['whatsapp-templates-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_templates' as any)
        .select('*')
        .eq('enabled', true)
        .order('category')
        .order('display_name');
      if (error) throw error;
      return (data || []) as unknown as WhatsAppTemplate[];
    },
  });
}

// ── Query: WhatsApp connection status ────────────────────────────────

export interface WhatsAppStatus {
  connected: boolean;
  state?: string;
  instance?: string;
  qrCode?: string | null;
  error?: string;
}

export function useWhatsAppStatus(enabled = true) {
  return useQuery<WhatsAppStatus>({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-whatsapp-status');
      if (error) {
        const detail = (error as any).context?.error || error.message;
        return { connected: false, error: detail } as WhatsAppStatus;
      }
      return data as WhatsAppStatus;
    },
    enabled,
    refetchInterval: 30000, // Poll every 30s
    staleTime: 10000,
  });
}
