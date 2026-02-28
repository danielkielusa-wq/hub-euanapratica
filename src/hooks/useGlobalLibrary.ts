import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LibraryFolder, LibraryItem, LibraryFilters } from '@/types/global-library';

// ── Folders ──────────────────────────────────────────────

export function useGlobalLibraryFolders(hasFullAccess: boolean) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['library-folders', hasFullAccess],
    queryFn: async () => {
      let query = supabase
        .from('library_folders')
        .select('*')
        .order('display_order')
        .order('name');

      if (!hasFullAccess) {
        query = query.eq('access_level', 'public');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LibraryFolder[];
    },
    enabled: !!user,
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

export function useGlobalLibraryFolderTree(hasFullAccess: boolean) {
  const { data: folders, ...rest } = useGlobalLibraryFolders(hasFullAccess);
  const tree = folders ? buildTree(folders) : [];
  return { data: tree, folders, ...rest };
}

export function useGlobalLibraryBreadcrumb(folderId: string | null, hasFullAccess: boolean) {
  const { data: folders } = useGlobalLibraryFolders(hasFullAccess);

  const getBreadcrumb = (): LibraryFolder[] => {
    if (!folderId || !folders) return [];
    const breadcrumb: LibraryFolder[] = [];
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

// ── Items ────────────────────────────────────────────────

export function useGlobalLibraryItems(folderId?: string, filters?: LibraryFilters) {
  const { user } = useAuth();

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

      return data.map((item: any) => ({
        ...item,
        folder: item.library_folders,
      })) as LibraryItem[];
    },
    enabled: !!user,
  });
}

export function useSearchGlobalLibrary(searchQuery: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['library-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];

      const { data, error } = await supabase
        .from('library_items')
        .select('*, library_folders(name)')
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      return data.map((item: any) => ({
        ...item,
        folder: item.library_folders,
      })) as LibraryItem[];
    },
    enabled: !!user && searchQuery.length >= 2,
  });
}

// ── Favorites ────────────────────────────────────────────

export function useGlobalLibraryFavoriteIds() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['library-favorite-ids', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('library_item_favorites')
        .select('item_id')
        .eq('user_id', user!.id);

      if (error) throw error;
      return data.map(d => d.item_id);
    },
    enabled: !!user,
  });
}

export function useToggleGlobalLibraryFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ itemId, isFavorite }: { itemId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        const { error } = await supabase
          .from('library_item_favorites')
          .delete()
          .eq('item_id', itemId)
          .eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('library_item_favorites')
          .insert({ item_id: itemId, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-favorite-ids'] });
    },
  });
}

// ── Downloads ────────────────────────────────────────────

export function useRecordGlobalLibraryDownload() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('library_item_downloads')
        .insert({ item_id: itemId, user_id: user!.id });
      if (error) throw error;
    },
  });
}
