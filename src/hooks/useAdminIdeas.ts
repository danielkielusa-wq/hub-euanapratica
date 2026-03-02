import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { IdeaAttachment } from '@/hooks/useIdeaAttachments';

// ─── Types ───────────────────────────────────────────────────────────

export interface BusinessIdea {
  id: string;
  user_id: string;
  column_status: string;
  name: string;
  one_liner: string;
  problem: string;
  persona: string;
  interest_score: number;
  tags: string[];
  notes: string;
  existing_assets: string;
  market_size: string | null;
  competition: string | null;
  unfair_advantage: string;
  distribution_hypothesis: string;
  revenue_model: string;
  validation_method: string | null;
  signals_collected: string;
  strongest_objection: string;
  kill_criteria: string;
  pricing_model: string;
  mvp_scope: string;
  key_metric: string;
  integrations: string;
  gate_answers: Record<string, string>;
  attachments: IdeaAttachment[];
  created_at: string;
  updated_at: string;
}

export type BusinessIdeaInsert = Omit<BusinessIdea, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type BusinessIdeaUpdate = Partial<BusinessIdeaInsert> & { id: string };

const QUERY_KEY = 'admin-business-ideas';

// ─── Hook ────────────────────────────────────────────────────────────

export function useAdminIdeas() {
  const queryClient = useQueryClient();

  // Fetch all ideas (admin sees all via RLS policy)
  const ideasQuery = useQuery<BusinessIdea[]>({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('business_ideas' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200) as any);

      if (error) throw error;
      return (data || []) as BusinessIdea[];
    },
    staleTime: 30_000,
  });

  // Create idea
  const createMutation = useMutation({
    mutationFn: async (idea: BusinessIdeaInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase
        .from('business_ideas' as any)
        .insert({ ...idea, user_id: user.id })
        .select()
        .single() as any);

      if (error) throw error;
      return data as BusinessIdea;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (err: Error) => {
      toast.error('Failed to create idea: ' + err.message);
    },
  });

  // Update idea
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...fields }: BusinessIdeaUpdate) => {
      const { data, error } = await (supabase
        .from('business_ideas' as any)
        .update(fields)
        .eq('id', id)
        .select()
        .single() as any);

      if (error) throw error;
      return data as BusinessIdea;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (err: Error) => {
      toast.error('Failed to update idea: ' + err.message);
    },
  });

  // Delete idea (+ clean up storage attachments)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Fetch attachments before deleting the row
      const { data: idea } = await (supabase
        .from('business_ideas' as any)
        .select('attachments')
        .eq('id', id)
        .single() as any);

      const { error } = await (supabase
        .from('business_ideas' as any)
        .delete()
        .eq('id', id) as any);

      if (error) throw error;

      // Fire-and-forget: clean up storage files
      const attachments = (idea?.attachments as IdeaAttachment[]) || [];
      if (attachments.length > 0) {
        supabase.storage
          .from('idea-attachments')
          .remove(attachments.map(a => a.path))
          .catch(() => { /* orphaned files are harmless */ });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (err: Error) => {
      toast.error('Failed to delete idea: ' + err.message);
    },
  });

  // Move card (optimistic column update for drag-and-drop)
  const moveMutation = useMutation({
    mutationFn: async ({ id, column_status }: { id: string; column_status: string }) => {
      const { error } = await (supabase
        .from('business_ideas' as any)
        .update({ column_status })
        .eq('id', id) as any);

      if (error) throw error;
    },
    onMutate: async ({ id, column_status }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY] });
      const prev = queryClient.getQueryData<BusinessIdea[]>([QUERY_KEY]);
      queryClient.setQueryData<BusinessIdea[]>([QUERY_KEY], (old) =>
        old?.map(i => i.id === id ? { ...i, column_status } : i) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData([QUERY_KEY], context.prev);
      toast.error('Failed to move card');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  return {
    ideas: ideasQuery.data ?? [],
    isLoading: ideasQuery.isLoading,
    isError: ideasQuery.isError,
    refetch: ideasQuery.refetch,
    createIdea: createMutation.mutateAsync,
    updateIdea: updateMutation.mutateAsync,
    deleteIdea: deleteMutation.mutateAsync,
    moveCard: moveMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
