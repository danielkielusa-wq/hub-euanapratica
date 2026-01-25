import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Material, MaterialFilters, FileType, AccessLevel } from '@/types/library';

export function useMaterials(folderId?: string, filters?: MaterialFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['materials', folderId, filters],
    queryFn: async () => {
      let query = supabase
        .from('materials')
        .select(`
          *,
          folders (
            name,
            espaco_id,
            espacos (name)
          )
        `);

      if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      if (filters?.fileTypes?.length) {
        query = query.in('file_type', filters.fileTypes);
      }

      if (filters?.search) {
        query = query.or(`filename.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
      }

      const sortBy = filters?.sortBy || 'uploaded_at';
      const sortOrder = filters?.sortOrder === 'asc';
      query = query.order(sortBy, { ascending: sortOrder });

      const { data, error } = await query;
      if (error) throw error;

      return data as Material[];
    },
    enabled: !!user,
  });
}

export function useMaterial(materialId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['material', materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          folders (
            name,
            espaco_id,
            espacos (name)
          )
        `)
        .eq('id', materialId)
        .maybeSingle();

      if (error) throw error;
      return data as Material | null;
    },
    enabled: !!user && !!materialId,
  });
}

export function useSearchMaterials(query: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['materials-search', query],
    queryFn: async () => {
      if (!query.trim()) return [];

      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          folders (
            name,
            espaco_id,
            espacos (name)
          )
        `)
        .or(`filename.ilike.%${query}%,title.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return data as Material[];
    },
    enabled: !!user && query.length >= 2,
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (material: {
      folder_id: string;
      filename: string;
      title?: string;
      description?: string;
      file_url: string;
      file_size?: number;
      file_type: FileType;
      access_level?: AccessLevel;
      available_at?: string;
      display_order?: number;
    }) => {
      const { data, error } = await supabase
        .from('materials')
        .insert({
          ...material,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials', variables.folder_id] });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Material> & { id: string }) => {
      const { data, error } = await supabase
        .from('materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['material', variables.id] });
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (material: { id: string; file_url: string }) => {
      // Delete from storage first
      if (material.file_url && !material.file_url.startsWith('http')) {
        await supabase.storage
          .from('materials')
          .remove([material.file_url]);
      }

      // Then delete from database
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', material.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}

export function useReorderMaterials() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      const promises = updates.map(({ id, display_order }) =>
        supabase
          .from('materials')
          .update({ display_order })
          .eq('id', id)
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}
