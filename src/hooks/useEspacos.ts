import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Espaco {
  id: string;
  name: string;
  description: string | null;
  mentor_id: string | null;
  status: 'active' | 'inactive' | 'completed';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  category: 'immersion' | 'group_mentoring' | 'workshop' | 'bootcamp' | 'course' | null;
  visibility: 'public' | 'private' | null;
  max_students: number | null;
  cover_image_url: string | null;
}

export interface UserEspaco {
  id: string;
  user_id: string;
  espaco_id: string;
  enrolled_at: string;
  status: 'active' | 'expired' | 'cancelled' | 'paused';
  espacos?: Espaco;
}

export function useEspacos() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['espacos', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('espacos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Espaco[];
    },
    enabled: !!user,
  });
}

export function useUserEspacos() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-espacos', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_espacos')
        .select(`
          *,
          espacos (*)
        `)
        .eq('user_id', user!.id)
        .eq('status', 'active');

      if (error) throw error;
      return data as UserEspaco[];
    },
    enabled: !!user,
  });
}

export function useEspaco(espacoId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['espaco', espacoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('espacos')
        .select('*')
        .eq('id', espacoId)
        .single();

      if (error) throw error;
      return data as Espaco;
    },
    enabled: !!user && !!espacoId,
  });
}

export function useCreateEspaco() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (espacoData: Omit<Espaco, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('espacos')
        .insert(espacoData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['espacos'] });
    },
  });
}

export function useUpdateEspaco() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Espaco> & { id: string }) => {
      const { data, error } = await supabase
        .from('espacos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['espacos'] });
      queryClient.invalidateQueries({ queryKey: ['espaco', data.id] });
    },
  });
}

export function useEnrollUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, espacoId }: { userId: string; espacoId: string }) => {
      const { data, error } = await supabase
        .from('user_espacos')
        .insert({
          user_id: userId,
          espaco_id: espacoId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-espacos'] });
    },
  });
}
