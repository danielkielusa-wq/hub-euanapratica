import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LibraryFolder, LibraryItem, LibraryFilters } from '@/types/global-library';

// ── Folders ──────────────────────────────────────────────

export function useLibraryFolders() {
  return useQuery({
    queryKey: ['library-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('library_folders')
        .select('*')
        .order('display_order')
        .order('name');

      if (error) throw error;
      return data as LibraryFolder[];
    },
  });
}

function buildTree(items: LibraryFolder[], parentId: string | null = null): LibraryFolder[] {
  return items
    .filter(item => item.parent_id === parentId)
    .map(item => ({
      ...item,
      children: buildTree(items, item.id),
    }))
    .sort((a, b) => a.display_order - b.display_order);
}

export function useLibraryFolderTree() {
  const { data: folders, ...rest } = useLibraryFolders();
  const tree = folders ? buildTree(folders) : [];
  return { data: tree, folders, ...rest };
}

export function useCreateLibraryFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folder: {
      name: string;
      description?: string;
      icon?: string;
      parent_id?: string | null;
      access_level?: 'public' | 'restricted';
      display_order?: number;
    }) => {
      const { data, error } = await supabase
        .from('library_folders')
        .insert(folder)
        .select()
        .single();
      if (error) throw error;
      return data as LibraryFolder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-folders'] });
    },
  });
}

export function useUpdateLibraryFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LibraryFolder> & { id: string }) => {
      const { data, error } = await supabase
        .from('library_folders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as LibraryFolder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-folders'] });
    },
  });
}

export function useDeleteLibraryFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folderId: string) => {
      const { error } = await supabase
        .from('library_folders')
        .delete()
        .eq('id', folderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-folders'] });
      queryClient.invalidateQueries({ queryKey: ['library-items'] });
    },
  });
}

export function useReorderLibraryFolders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      const promises = updates.map(({ id, display_order }) =>
        supabase.from('library_folders').update({ display_order }).eq('id', id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-folders'] });
    },
  });
}

// ── Items ────────────────────────────────────────────────

export function useLibraryItems(folderId?: string, filters?: LibraryFilters) {
  return useQuery({
    queryKey: ['library-items', folderId, filters],
    queryFn: async () => {
      let query = supabase
        .from('library_items')
        .select('*, library_folders(name)');

      if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      if (filters?.itemTypes?.length) {
        query = query.in('item_type', filters.itemTypes);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.tags?.length) {
        query = query.overlaps('tags', filters.tags);
      }

      const sortBy = filters?.sortBy || 'display_order';
      const ascending = filters?.sortOrder !== 'desc';
      query = query.order(sortBy, { ascending });

      const { data, error } = await query;
      if (error) throw error;

      // Fetch download counts
      const itemIds = data.map((d: any) => d.id);
      if (itemIds.length > 0) {
        const { data: counts } = await supabase
          .from('library_item_downloads')
          .select('item_id')
          .in('item_id', itemIds);

        const countMap: Record<string, number> = {};
        counts?.forEach((c: any) => {
          countMap[c.item_id] = (countMap[c.item_id] || 0) + 1;
        });

        return data.map((item: any) => ({
          ...item,
          download_count: countMap[item.id] || 0,
          folder: item.library_folders,
        })) as LibraryItem[];
      }

      return data.map((item: any) => ({
        ...item,
        download_count: 0,
        folder: item.library_folders,
      })) as LibraryItem[];
    },
  });
}

export function useCreateLibraryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: {
      folder_id: string;
      title: string;
      description?: string;
      item_type: 'file' | 'link';
      file_url?: string;
      file_size?: number;
      file_type?: string;
      filename?: string;
      link_url?: string;
      tags?: string[];
      display_order?: number;
    }) => {
      const { data, error } = await supabase
        .from('library_items')
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data as LibraryItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-items'] });
    },
  });
}

export function useUpdateLibraryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LibraryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('library_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as LibraryItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-items'] });
    },
  });
}

export function useDeleteLibraryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: { id: string; file_url?: string | null }) => {
      // Delete file from storage if it's a file item
      if (item.file_url && !item.file_url.startsWith('http')) {
        await supabase.storage.from('materials').remove([item.file_url]);
      }

      const { error } = await supabase
        .from('library_items')
        .delete()
        .eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-items'] });
    },
  });
}

export function useReorderLibraryItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      const promises = updates.map(({ id, display_order }) =>
        supabase.from('library_items').update({ display_order }).eq('id', id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-items'] });
    },
  });
}

// ── Stats (admin) ────────────────────────────────────────

export function useLibraryStats() {
  return useQuery({
    queryKey: ['library-stats'],
    queryFn: async () => {
      const [foldersRes, itemsRes, downloadsRes] = await Promise.all([
        supabase.from('library_folders').select('id', { count: 'exact', head: true }),
        supabase.from('library_items').select('id', { count: 'exact', head: true }),
        supabase.from('library_item_downloads').select('id', { count: 'exact', head: true }),
      ]);

      return {
        totalFolders: foldersRes.count || 0,
        totalItems: itemsRes.count || 0,
        totalDownloads: downloadsRes.count || 0,
      };
    },
  });
}
