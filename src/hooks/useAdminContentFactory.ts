/**
 * Hook for Content Factory admin UI.
 * Queries: trending topics, content pieces.
 * Mutations: fetch trending, generate content, update piece status.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ── Types ────────────────────────────────────────────────────────────────

export interface TrendingTopic {
  id: string;
  topic: string;
  summary: string;
  angle: string;
  source: string;
  relevance_score: number;
  virality_potential: number;
  keywords: string[];
  raw_data: Record<string, unknown>;
  expires_at: string;
  created_at: string;
}

export interface HookVariation {
  text: string;
  style: 'question' | 'claim' | 'data' | 'provocation';
  score: number;
}

export interface ScriptSection {
  heading: string;
  content: string;
  camera_note: string | null;
  data_callout: string | null;
}

export interface SocialPost {
  platform: string;
  content: string;
  hashtags: string[];
  char_count: number;
}

export interface SeoMetadata {
  youtube_title?: string;
  youtube_description?: string;
  tags?: string[];
  thumbnail_ideas?: string[];
}

export interface ContentPiece {
  id: string;
  input_type: string;
  input_text: string | null;
  input_reference: string | null;
  trending_topic_id: string | null;
  format: string;
  tone: string;
  use_platform_data: boolean;
  title: string | null;
  hook_variations: HookVariation[];
  script_sections: ScriptSection[];
  cta: string | null;
  duration_estimate_seconds: number | null;
  social_posts: SocialPost[];
  seo_metadata: SeoMetadata;
  platform_context: Record<string, unknown> | null;
  virality_score: number;
  status: string;
  scheduled_for: string | null;
  model_used: string | null;
  tokens_used: number | null;
  generation_duration_ms: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type ContentFormat = 'short' | 'long_video' | 'carousel' | 'stories';
export type ContentTone = 'polemic' | 'educational' | 'storytelling' | 'roast' | 'data_story' | 'myth_busting';

export interface GenerateInput {
  input_text: string;
  input_type?: string;
  input_reference?: string;
  trending_topic_id?: string;
  format?: ContentFormat;
  tone?: ContentTone;
  use_platform_data?: boolean;
  custom_instructions?: string;
}

// ── Config types ──────────────────────────────────────────────────────────

export interface ApiOption {
  api_key: string;
  name: string;
  is_active: boolean;
}

export interface ContentFactoryConfig {
  trending_api_key: string;
  generate_api_key: string;
  trending_prompt: string;
  generate_prompt: string;
}

// ── Queries ──────────────────────────────────────────────────────────────

export function useAvailableApis() {
  return useQuery<ApiOption[]>({
    queryKey: ['content-factory-available-apis'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('api_configs')
        .select('api_key, name, is_active')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data || []) as ApiOption[];
    },
    staleTime: 60 * 1000,
  });
}

export function useContentFactoryConfig() {
  return useQuery<ContentFactoryConfig>({
    queryKey: ['content-factory-config'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('app_configs')
        .select('key, value')
        .in('key', [
          'content_factory_trending_api_key',
          'content_factory_generate_api_key',
          'content_factory_trending_prompt',
          'content_factory_generate_prompt',
        ]);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data || []) map[row.key] = row.value || '';
      return {
        trending_api_key: map['content_factory_trending_api_key'] || 'perplexity_api',
        generate_api_key: map['content_factory_generate_api_key'] || 'openai_api',
        trending_prompt: map['content_factory_trending_prompt'] || '',
        generate_prompt: map['content_factory_generate_prompt'] || '',
      };
    },
  });
}

export function useSaveContentFactoryConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: Partial<ContentFactoryConfig>) => {
      const upserts = Object.entries({
        ...(config.trending_api_key !== undefined && { content_factory_trending_api_key: config.trending_api_key }),
        ...(config.generate_api_key !== undefined && { content_factory_generate_api_key: config.generate_api_key }),
        ...(config.trending_prompt !== undefined && { content_factory_trending_prompt: config.trending_prompt }),
        ...(config.generate_prompt !== undefined && { content_factory_generate_prompt: config.generate_prompt }),
      }).map(([key, value]) => ({ key, value }));

      for (const row of upserts) {
        const { error } = await (supabase as any)
          .from('app_configs')
          .upsert({ key: row.key, value: row.value }, { onConflict: 'key' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-factory-config'] });
      toast({ title: 'Configuracao salva' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useTrendingTopics() {
  return useQuery<TrendingTopic[]>({
    queryKey: ['content-factory-trending'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('content_trending_cache')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('virality_potential', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as TrendingTopic[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useContentPieces(filters?: { status?: string; format?: string }) {
  return useQuery<ContentPiece[]>({
    queryKey: ['content-factory-pieces', filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from('content_pieces')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.format) query = query.eq('format', filters.format);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ContentPiece[];
    },
  });
}

// ── Mutations ────────────────────────────────────────────────────────────

export function useClearTrendingCache() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from('content_trending_cache')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-factory-trending'] });
      toast({ title: 'Cache de trending limpo' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao limpar cache', description: error.message, variant: 'destructive' });
    },
  });
}

export function useFetchTrending() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input?: { niches?: string[]; force_refresh?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('content-trending', {
        body: input || { force_refresh: true },
      });
      if (error) {
        const resp = (error as any).context;
        if (resp?.json) {
          try {
            const body = await resp.json();
            throw new Error(body?.error || error.message);
          } catch (e) {
            if (e instanceof Error && e.message !== error.message) throw e;
          }
        }
        throw error;
      }
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-factory-trending'] });
      toast({
        title: data?.cached
          ? `${data.count} trending topics (cache)`
          : `${data.count} trending topics atualizados`,
      });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao buscar trending', description: error.message, variant: 'destructive' });
    },
  });
}

export function useGenerateContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: GenerateInput) => {
      const { data, error } = await supabase.functions.invoke('content-generate', {
        body: input,
      });
      if (error) {
        const resp = (error as any).context;
        if (resp?.json) {
          try {
            const body = await resp.json();
            throw new Error(body?.error || error.message);
          } catch (e) {
            if (e instanceof Error && e.message !== error.message) throw e;
          }
        }
        throw error;
      }
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-factory-pieces'] });
      toast({ title: `"${data?.piece?.title || 'Conteudo'}" gerado com sucesso` });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao gerar conteudo', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdatePieceStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from('content_pieces')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-factory-pieces'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeletePiece() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('content_pieces')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-factory-pieces'] });
      toast({ title: 'Conteudo removido' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    },
  });
}
