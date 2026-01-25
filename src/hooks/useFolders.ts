import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Folder } from '@/types/library';

export function useFolders(espacoId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['folders', espacoId],
    queryFn: async () => {
      let query = supabase
        .from('folders')
        .select(`
          *,
          espacos (name)
        `)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (espacoId) {
        query = query.eq('espaco_id', espacoId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Folder[];
    },
    enabled: !!user,
  });
}

export function useFolderTree(espacoId?: string) {
  const { data: folders, ...rest } = useFolders(espacoId);

  const buildTree = (items: Folder[], parentId: string | null = null): Folder[] => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: buildTree(items, item.id),
      }))
      .sort((a, b) => a.display_order - b.display_order);
  };

  const tree = folders ? buildTree(folders) : [];

  return { data: tree, folders, ...rest };
}

export function useFolder(folderId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['folder', folderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select(`
          *,
          espacos (name)
        `)
        .eq('id', folderId)
        .maybeSingle();

      if (error) throw error;
      return data as Folder | null;
    },
    enabled: !!user && !!folderId,
  });
}

export function useFolderBreadcrumb(folderId: string | null) {
  const { data: folders } = useFolders();

  const getBreadcrumb = (): Folder[] => {
    if (!folderId || !folders) return [];

    const breadcrumb: Folder[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        breadcrumb.unshift(folder);
        currentId = folder.parent_id;
      } else {
        break;
      }
    }

    return breadcrumb;
  };

  return getBreadcrumb();
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folder: {
      name: string;
      description?: string;
      parent_id?: string | null;
      espaco_id: string;
      display_order?: number;
    }) => {
      const { data, error } = await supabase
        .from('folders')
        .insert(folder)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Folder> & { id: string }) => {
      const { data, error } = await supabase
        .from('folders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['folder', variables.id] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folderId: string) => {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

export function useReorderFolders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      const promises = updates.map(({ id, display_order }) =>
        supabase
          .from('folders')
          .update({ display_order })
          .eq('id', id)
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}
