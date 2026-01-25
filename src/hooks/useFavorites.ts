import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserFavorite } from '@/types/library';

export function useFavorites() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          materials (
            *,
            folders (
              name,
              espaco_id,
              espacos (name)
            )
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserFavorite[];
    },
    enabled: !!user,
  });
}

export function useFavoriteIds() {
  const { data: favorites } = useFavorites();
  return new Set(favorites?.map(f => f.material_id) || []);
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ materialId, isFavorite }: { materialId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        // Remove favorite
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user!.id)
          .eq('material_id', materialId);

        if (error) throw error;
      } else {
        // Add favorite
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user!.id,
            material_id: materialId,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
