import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SendTemplateInput {
  lead_id: string;
  template_name: string;
  variables?: Record<string, string>;
}

interface SendCustomInput {
  lead_id: string;
  custom_subject: string;
  custom_body_html: string;
}

type SendLeadEmailInput = SendTemplateInput | SendCustomInput;

export function useSendLeadEmail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: SendLeadEmailInput) => {
      const { data, error } = await supabase.functions.invoke('send-lead-email', {
        body: input,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { success: boolean; emailSent: boolean; message?: string };
    },
    onSuccess: (_data, input) => {
      const isCustom = 'custom_subject' in input;
      toast({
        title: 'Email enviado',
        description: isCustom ? 'Email customizado enviado com sucesso' : 'Email disparado com sucesso via Resend',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-lead-interactions', input.lead_id] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao enviar email', description: error.message, variant: 'destructive' });
    },
  });
}
