import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/types/admin';
import { toast } from 'sonner';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch linked espacos for each product
      const productIds = data.map(p => p.id);
      const { data: links } = await supabase
        .from('product_espacos')
        .select('product_id, espaco_id')
        .in('product_id', productIds);

      const espacoIds = [...new Set((links ?? []).map(l => l.espaco_id))];
      const { data: espacos } = await supabase
        .from('espacos')
        .select('id, name')
        .in('id', espacoIds);

      const espacoMap = Object.fromEntries((espacos ?? []).map(e => [e.id, e]));
      const productEspacos: Record<string, any[]> = {};
      
      (links ?? []).forEach(l => {
        if (!productEspacos[l.product_id]) {
          productEspacos[l.product_id] = [];
        }
        if (espacoMap[l.espaco_id]) {
          productEspacos[l.product_id].push(espacoMap[l.espaco_id]);
        }
      });

      return data.map(product => ({
        ...product,
        espacos: productEspacos[product.id] || []
      })) as Product[];
    }
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch linked espacos
      const { data: links } = await supabase
        .from('product_espacos')
        .select('espaco_id')
        .eq('product_id', id);

      const espacoIds = (links ?? []).map(l => l.espaco_id);
      const { data: espacos } = await supabase
        .from('espacos')
        .select('id, name')
        .in('id', espacoIds);

      return {
        ...data,
        espacos: espacos ?? []
      } as Product;
    },
    enabled: !!id
  });
}

interface CreateProductData {
  name: string;
  description?: string;
  access_duration_days?: number;
  price?: number;
  is_active?: boolean;
  espaco_ids?: string[];
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductData) => {
      const { espaco_ids, ...productData } = data;

      const { data: product, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) throw error;

      // Link espacos if provided
      if (espaco_ids && espaco_ids.length > 0) {
        const links = espaco_ids.map(espaco_id => ({
          product_id: product.id,
          espaco_id
        }));

        await supabase.from('product_espacos').insert(links);
      }

      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar produto: ' + error.message);
    }
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, espaco_ids, ...data }: CreateProductData & { id: string }) => {
      const { data: product, error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update espaco links if provided
      if (espaco_ids !== undefined) {
        // Remove existing links
        await supabase
          .from('product_espacos')
          .delete()
          .eq('product_id', id);

        // Add new links
        if (espaco_ids.length > 0) {
          const links = espaco_ids.map(espaco_id => ({
            product_id: id,
            espaco_id
          }));
          await supabase.from('product_espacos').insert(links);
        }
      }

      return product;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      toast.success('Produto atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar produto: ' + error.message);
    }
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir produto: ' + error.message);
    }
  });
}
