import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { EspacoExtended, EspacoFilters, EspacoCategory, EspacoVisibility } from '@/types/admin';
import { toast } from 'sonner';

export function useAdminEspacos(filters?: EspacoFilters) {
  return useQuery({
    queryKey: ['admin-espacos', filters],
    queryFn: async () => {
      let query = supabase
        .from('espacos')
        .select(`
          *,
          user_espacos (id)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.mentor_id) {
        query = query.eq('mentor_id', filters.mentor_id);
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch mentor info separately if needed
      const mentorIds = [...new Set(data.map(e => e.mentor_id).filter(Boolean))];
      let mentorMap: Record<string, { full_name: string; email: string }> = {};
      
      if (mentorIds.length > 0) {
        const { data: mentors } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', mentorIds);
        
        if (mentors) {
          mentorMap = Object.fromEntries(mentors.map(m => [m.id, { full_name: m.full_name, email: m.email }]));
        }
      }

      return data.map(espaco => ({
        ...espaco,
        mentor: espaco.mentor_id ? mentorMap[espaco.mentor_id] : undefined,
        enrolled_count: espaco.user_espacos?.length ?? 0
      })) as unknown as EspacoExtended[];
    }
  });
}

export function useAdminEspaco(id: string) {
  return useQuery({
    queryKey: ['admin-espaco', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('espacos')
        .select(`
          *,
          user_espacos (
            id,
            user_id,
            enrolled_at,
            status,
            access_expires_at,
            last_access_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch mentor info separately
      let mentor: { full_name: string; email: string } | undefined;
      if (data.mentor_id) {
        const { data: mentorData } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', data.mentor_id)
          .single();
        if (mentorData) {
          mentor = mentorData;
        }
      }

      // Fetch student profiles
      const studentIds = data.user_espacos?.map(ue => ue.user_id) ?? [];
      let studentMap: Record<string, any> = {};
      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .from('profiles')
          .select('id, full_name, email, profile_photo_url')
          .in('id', studentIds);
        if (students) {
          studentMap = Object.fromEntries(students.map(s => [s.id, s]));
        }
      }

      const user_espacos = data.user_espacos?.map(ue => ({
        ...ue,
        profiles: studentMap[ue.user_id]
      })) ?? [];

      return {
        ...data,
        mentor,
        user_espacos,
        enrolled_count: user_espacos.length
      } as unknown as EspacoExtended & { user_espacos: any[] };
    },
    enabled: !!id
  });
}

interface CreateEspacoData {
  name: string;
  description?: string;
  category?: EspacoCategory;
  visibility?: EspacoVisibility;
  max_students?: number;
  mentor_id?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  cover_image_url?: string;
}

export function useCreateEspacoAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEspacoData) => {
      const { data: result, error } = await supabase
        .from('espacos')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-espacos'] });
      toast.success('Turma criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar turma: ' + error.message);
    }
  });
}

export function useUpdateEspacoAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: CreateEspacoData & { id: string }) => {
      const { data: result, error } = await supabase
        .from('espacos')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-espacos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-espaco', variables.id] });
      toast.success('Turma atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar turma: ' + error.message);
    }
  });
}

export function useDeleteEspaco() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Check if espaco has enrollments
      const { count } = await supabase
        .from('user_espacos')
        .select('id', { count: 'exact', head: true })
        .eq('espaco_id', id);

      if (count && count > 0) {
        throw new Error('Não é possível excluir uma turma com alunos matriculados');
      }

      const { error } = await supabase
        .from('espacos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-espacos'] });
      toast.success('Turma excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir turma: ' + error.message);
    }
  });
}

export function useDuplicateEspaco() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Fetch original espaco
      const { data: original, error: fetchError } = await supabase
        .from('espacos')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Create duplicate with new name
      const { id: _, created_at, updated_at, ...rest } = original;
      const { data: result, error } = await supabase
        .from('espacos')
        .insert({
          ...rest,
          name: `${original.name} (Cópia)`,
          status: 'inactive'
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-espacos'] });
      toast.success('Turma duplicada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao duplicar turma: ' + error.message);
    }
  });
}

export function useMentors() {
  return useQuery({
    queryKey: ['mentors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          profiles:user_id (id, full_name, email)
        `)
        .in('role', ['mentor', 'admin']);

      if (error) throw error;
      return data?.map(r => r.profiles).filter(Boolean) ?? [];
    }
  });
}
