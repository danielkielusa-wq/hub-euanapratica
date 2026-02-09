import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CommunityCategory } from '@/types/community';
import { toast } from '@/hooks/use-toast';

export function useCommunityCategories() {
  const [categories, setCategories] = useState<CommunityCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('community_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;

      setCategories(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (category: Partial<CommunityCategory>) => {
    try {
      const { data, error } = await supabase
        .from('community_categories')
        .insert({
          name: category.name!,
          slug: category.slug!,
          icon_name: category.icon_name || 'hash',
          display_order: category.display_order || categories.length,
          is_active: category.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      toast({ title: 'Categoria criada com sucesso!' });
      return data;
    } catch (err: any) {
      toast({ title: 'Erro ao criar categoria', description: err.message, variant: 'destructive' });
      throw err;
    }
  };

  const updateCategory = async (id: string, updates: Partial<CommunityCategory>) => {
    try {
      const { data, error } = await supabase
        .from('community_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => prev.map(c => c.id === id ? data : c));
      toast({ title: 'Categoria atualizada!' });
      return data;
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar categoria', description: err.message, variant: 'destructive' });
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('community_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Categoria removida!' });
    } catch (err: any) {
      toast({ title: 'Erro ao remover categoria', description: err.message, variant: 'destructive' });
      throw err;
    }
  };

  const reorderCategories = async (orderedIds: string[]) => {
    try {
      const updates = orderedIds.map((id, index) => ({
        id,
        display_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('community_categories')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      setCategories(prev => {
        const categoryMap = new Map(prev.map(c => [c.id, c]));
        return orderedIds.map((id, index) => ({
          ...categoryMap.get(id)!,
          display_order: index,
        }));
      });
    } catch (err: any) {
      toast({ title: 'Erro ao reordenar', description: err.message, variant: 'destructive' });
    }
  };

  return {
    categories,
    activeCategories: categories.filter(c => c.is_active),
    isLoading,
    error,
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  };
}
