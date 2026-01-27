import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EspacoInvitation {
  id: string;
  espaco_id: string;
  email: string;
  invited_name: string | null;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invited_by: string;
  accepted_by: string | null;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}

export interface InviteStudentData {
  espaco_id: string;
  email: string;
  invited_name?: string;
}

export function useEspacoInvitations(espacoId: string) {
  return useQuery({
    queryKey: ['espaco-invitations', espacoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('espaco_invitations')
        .select('*')
        .eq('espaco_id', espacoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EspacoInvitation[];
    },
    enabled: !!espacoId,
  });
}

export function useSearchProfiles(searchTerm: string) {
  return useQuery({
    queryKey: ['search-profiles', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, profile_photo_url')
        .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: searchTerm.length >= 2,
  });
}

interface InviteResponse {
  success: boolean;
  emailSent: boolean;
  inviteLink?: string;
  token?: string;
  message?: string;
}

export function useInviteStudent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InviteStudentData): Promise<InviteResponse> => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke('send-espaco-invitation', {
        body: {
          espaco_id: data.espaco_id,
          email: data.email,
          invited_name: data.invited_name,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao enviar convite');
      }

      return response.data as InviteResponse;
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['espaco-invitations', variables.espaco_id] });
      
      if (response.emailSent) {
        toast({
          title: 'Convite enviado!',
          description: `Um email foi enviado para ${variables.email}`,
        });
      } else if (response.inviteLink) {
        // Email not sent, provide fallback link
        toast({
          title: 'Convite criado',
          description: 'Email não enviado. Copie o link abaixo para compartilhar manualmente.',
          duration: 10000,
        });
        // Copy link to clipboard
        navigator.clipboard.writeText(response.inviteLink).then(() => {
          toast({
            title: 'Link copiado!',
            description: 'O link de convite foi copiado para a área de transferência.',
          });
        });
      } else {
        toast({
          title: 'Convite criado',
          description: 'O convite foi registrado no sistema.',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar convite',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useEnrollExistingStudent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ espacoId, userId }: { espacoId: string; userId: string }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        throw new Error('Não autenticado');
      }

      const { data, error } = await supabase
        .from('user_espacos')
        .insert({
          espaco_id: espacoId,
          user_id: userId,
          enrolled_by: session.session.user.id,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este aluno já está matriculado neste espaço');
        }
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['espaco-students', variables.espacoId] });
      queryClient.invalidateQueries({ queryKey: ['mentor-espaco', variables.espacoId] });
      toast({
        title: 'Aluno matriculado!',
        description: 'O aluno foi adicionado ao espaço com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao matricular aluno',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ invitationId, espacoId }: { invitationId: string; espacoId: string }) => {
      const { error } = await supabase
        .from('espaco_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;
      return { espacoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['espaco-invitations', data.espacoId] });
      toast({
        title: 'Convite cancelado',
        description: 'O convite foi cancelado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cancelar convite',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useInvitationByToken(token: string | null) {
  return useQuery({
    queryKey: ['invitation-by-token', token],
    queryFn: async () => {
      if (!token) return null;

      const { data, error } = await supabase
        .from('espaco_invitations')
        .select(`
          *,
          espacos:espaco_id (
            id,
            name,
            description,
            cover_image_url
          )
        `)
        .eq('token', token)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    },
    enabled: !!token,
  });
}
