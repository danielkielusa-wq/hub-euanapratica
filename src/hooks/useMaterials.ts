import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Material, MaterialFilters, FileType, AccessLevel, VisibilityScope } from '@/types/library';

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

// Hook para buscar materiais de um espaço específico com filtro de visibilidade
export function useMaterialsByEspaco(espacoId: string, visibilityScope?: VisibilityScope, ownerId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['materials-espaco', espacoId, visibilityScope, ownerId],
    queryFn: async () => {
      // Primeiro buscar as folders do espaço
      const { data: folders, error: foldersError } = await supabase
        .from('folders')
        .select('id')
        .eq('espaco_id', espacoId);

      if (foldersError) throw foldersError;
      if (!folders?.length) return [];

      const folderIds = folders.map(f => f.id);

      // Buscar materiais das pastas
      let query = supabase
        .from('materials')
        .select('*')
        .in('folder_id', folderIds)
        .order('uploaded_at', { ascending: false });

      if (visibilityScope) {
        query = query.eq('visibility_scope', visibilityScope);
      }

      if (ownerId) {
        query = query.eq('owner_user_id', ownerId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Buscar profiles dos owners
      const ownerIds = [...new Set(data.filter(m => m.owner_user_id).map(m => m.owner_user_id))];
      let profiles: Record<string, any> = {};
      
      if (ownerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email, profile_photo_url')
          .in('id', ownerIds);
        
        if (profilesData) {
          profiles = Object.fromEntries(profilesData.map(p => [p.id, p]));
        }
      }

      return data.map(m => ({
        ...m,
        owner_profile: m.owner_user_id ? profiles[m.owner_user_id] : null,
      })) as Material[];
    },
    enabled: !!user && !!espacoId,
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

// Nova versão com campos de ownership
export function useCreateMaterialWithOwner() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (material: {
      folder_id: string;
      filename: string;
      title?: string;
      description?: string | null;
      file_url: string;
      file_size?: number | null;
      file_type: FileType;
      access_level?: AccessLevel;
      available_at?: string;
      display_order?: number;
      owner_user_id: string;
      owner_role: string;
      visibility_scope: 'space_all' | 'mentor_and_owner';
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
      queryClient.invalidateQueries({ queryKey: ['materials-espaco'] });
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
