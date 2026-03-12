import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Live, CreateLiveInput, UpdateLiveInput, LiveRegistrationWithProfile, LiveGuestParticipant, AddGuestParticipantInput } from '@/types/live';

/**
 * Fetch mentor's own lives
 */
export function useMentorLives() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mentor-lives', user?.id],
    queryFn: async (): Promise<Live[]> => {
      const { data, error } = await supabase
        .from('lives')
        .select('*')
        .eq('mentor_id', user!.id)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Live[];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}

/**
 * Fetch a single live by ID (mentor view)
 */
export function useMentorLiveById(liveId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mentor-live', liveId],
    queryFn: async (): Promise<Live | null> => {
      const { data, error } = await supabase
        .from('lives')
        .select('*')
        .eq('id', liveId!)
        .limit(1);

      if (error) throw error;
      return (data?.[0] as Live) || null;
    },
    enabled: !!user?.id && !!liveId,
  });
}

/**
 * Create a new live
 */
export function useCreateLive() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLiveInput) => {
      const { data, error } = await supabase
        .from('lives')
        .insert({
          ...input,
          mentor_id: user!.id,
          price: input.price || 0,
          duration_minutes: input.duration_minutes || 60,
          status: input.status || 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Live;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mentor-lives'] });
      queryClient.invalidateQueries({ queryKey: ['lives'] });
      toast({ title: 'Live criada!', description: 'Sua live foi criada com sucesso.' });

      // Dispatch live.created webhook (fire-and-forget)
      supabase.functions
        .invoke('send-live-notification', {
          body: { live_id: data.id, notification_type: 'created' },
        })
        .then(({ error }) => {
          if (error) console.error('Live created webhook error:', error);
        });
    },
    onError: (error: Error) => {
      if (error.message.includes('lives_slug_key')) {
        toast({
          title: 'Slug já existe',
          description: 'Esse slug já está em uso. Tente outro.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao criar live',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });
}

/**
 * Update an existing live
 */
export function useUpdateLive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateLiveInput) => {
      const { data, error } = await supabase
        .from('lives')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Live;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mentor-lives'] });
      queryClient.invalidateQueries({ queryKey: ['mentor-live', data.id] });
      queryClient.invalidateQueries({ queryKey: ['live', data.slug] });
      queryClient.invalidateQueries({ queryKey: ['lives'] });
      toast({ title: 'Live atualizada!' });

      // When going live, notify all registered participants (fire-and-forget)
      if (data.status === 'live') {
        supabase.functions
          .invoke('send-live-notification', {
            body: { live_id: data.id, notification_type: 'going_live' },
          })
          .then(({ error }) => {
            if (error) console.error('Live notification email error:', error);
          });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar live',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete a live (only drafts can be hard-deleted)
 */
export function useDeleteLive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (liveId: string) => {
      const { error } = await supabase
        .from('lives')
        .delete()
        .eq('id', liveId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-lives'] });
      queryClient.invalidateQueries({ queryKey: ['lives'] });
      toast({ title: 'Live removida.' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover live',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Fetch registrations for a live (mentor view with profiles)
 * Uses RPC to join registrations + profiles in a single query
 */
export function useLiveRegistrations(liveId: string | undefined) {
  return useQuery({
    queryKey: ['live-registrations', liveId],
    queryFn: async (): Promise<LiveRegistrationWithProfile[]> => {
      const { data, error } = await supabase
        .rpc('get_live_registrations_with_profiles', { p_live_id: liveId! });

      if (error) throw error;
      if (!data?.length) return [];

      return data.map((row: any) => ({
        id: row.id,
        live_id: row.live_id,
        user_id: row.user_id,
        registered_at: row.registered_at,
        attended: row.attended,
        payment_status: row.payment_status,
        profile: {
          full_name: row.full_name || '',
          email: row.email || '',
          profile_photo_url: row.profile_photo_url,
        },
      }));
    },
    enabled: !!liveId,
    staleTime: 15_000,
  });
}

/**
 * Toggle attended status for a registration
 */
export function useToggleAttended() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ registrationId, attended }: { registrationId: string; attended: boolean }) => {
      const { error } = await supabase
        .from('live_registrations')
        .update({ attended })
        .eq('id', registrationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-registrations'] });
    },
  });
}

/**
 * Fetch guest participants for a live
 */
export function useGuestParticipants(liveId: string | undefined) {
  return useQuery({
    queryKey: ['live-guest-participants', liveId],
    queryFn: async (): Promise<LiveGuestParticipant[]> => {
      const { data, error } = await supabase
        .from('live_guest_participants')
        .select('*')
        .eq('live_id', liveId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as LiveGuestParticipant[];
    },
    enabled: !!liveId,
    staleTime: 15_000,
  });
}

/**
 * Add a guest participant to a live
 */
export function useAddGuestParticipant() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddGuestParticipantInput) => {
      const { data, error } = await supabase
        .from('live_guest_participants')
        .insert({
          live_id: input.live_id,
          name: input.name,
          email: input.email,
          phone: input.phone || null,
          added_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as LiveGuestParticipant;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['live-guest-participants', data.live_id] });
      toast({ title: 'Participante adicionado!' });
    },
    onError: (error: Error) => {
      if (error.message.includes('live_guest_participants_live_id_email_key')) {
        toast({
          title: 'Email ja cadastrado',
          description: 'Este email ja esta na lista de participantes desta live.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao adicionar participante',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });
}

/**
 * Toggle attended status for a guest participant
 */
export function useToggleGuestAttended() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ guestId, attended }: { guestId: string; attended: boolean }) => {
      const { error } = await supabase
        .from('live_guest_participants')
        .update({ attended })
        .eq('id', guestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-guest-participants'] });
    },
  });
}

/**
 * Remove a guest participant
 */
export function useRemoveGuestParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (guestId: string) => {
      const { error } = await supabase
        .from('live_guest_participants')
        .delete()
        .eq('id', guestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-guest-participants'] });
      toast({ title: 'Participante removido.' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover participante',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Close a live: updates status to completed, saves recording URL,
 * and fires thank-you email to all participants (registered + guests)
 */
export function useCloseLive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ liveId, recordingUrl }: { liveId: string; recordingUrl?: string }) => {
      const updatePayload: Record<string, unknown> = { status: 'completed' };
      if (recordingUrl?.trim()) {
        updatePayload.recording_url = recordingUrl.trim();
      }

      const { data, error } = await supabase
        .from('lives')
        .update(updatePayload)
        .eq('id', liveId)
        .select()
        .single();

      if (error) throw error;
      return data as Live;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mentor-lives'] });
      queryClient.invalidateQueries({ queryKey: ['mentor-live', data.id] });
      queryClient.invalidateQueries({ queryKey: ['live', data.slug] });
      queryClient.invalidateQueries({ queryKey: ['lives'] });
      toast({ title: 'Live encerrada!', description: 'Emails de agradecimento serao enviados.' });

      // Fire-and-forget thank-you email
      supabase.functions
        .invoke('send-live-thankyou', {
          body: { live_id: data.id },
        })
        .then(({ error }) => {
          if (error) console.error('Live thankyou email error:', error);
        });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao encerrar live',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
