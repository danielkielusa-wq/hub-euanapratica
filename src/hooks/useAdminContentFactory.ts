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
  source_url?: string;
  relevance_score: number;
  virality_potential: number;
  keywords: string[];
  growth_function: 'discovery' | 'conversion' | 'retention' | null;
  audience_stage: 'cold' | 'warm' | 'hot' | null;
  pillar: string | null;
  authority_building: boolean;
  title_options: string[];
  thumbnail_concept: string | null;
  short_cuts: TrendingShortCut[];
  format_suggestion: string | null;
  raw_data: Record<string, unknown>;
  expires_at: string;
  created_at: string;
}

export interface TrendingShortCut {
  hook: string;
  angle: string;
  script_hint: string;
  estimated_duration: string;
}

export interface HookVariation {
  text: string;
  style: 'question' | 'claim' | 'data' | 'provocation';
  score: number;
  retention_prediction?: 'alta' | 'media' | 'baixa';
}

export interface ScriptSection {
  heading: string;
  content: string;
  camera_note: string | null;
  data_callout: string | null;
  timestamp: string | null;
  is_short_cut_candidate?: boolean;
  is_product_showcase?: boolean;
  product_key?: string;
}

export interface ShortCut {
  source_section: string;
  timestamp_range: string;
  hook: string;
  script: string;
  angle: string;
  camera_note: string;
  estimated_duration: string;
}

export interface SocialPost {
  platform: string;
  content: string;
  hashtags: string[];
  char_count: number;
}

export interface ThumbnailConcept {
  visual: string;
  text_overlay: string;
  emotion: string;
}

export interface SeoMetadata {
  youtube_title?: string;
  youtube_description?: string;
  tags?: string[];
  thumbnail_ideas?: string[];
  thumbnail_concepts?: ThumbnailConcept[];
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
  growth_function: 'discovery' | 'conversion' | 'retention' | null;
  audience_stage: 'cold' | 'warm' | 'hot' | null;
  product_showcase_key: string | null;
  hook_variations: HookVariation[];
  script_sections: ScriptSection[];
  short_cuts: ShortCut[];
  cta: string | null;
  duration_estimate_seconds: number | null;
  virality_techniques_used: string[];
  social_posts: SocialPost[];
  seo_metadata: SeoMetadata;
  platform_context: Record<string, unknown> | null;
  virality_score: number;
  status: string;
  scheduled_for: string | null;
  production_date: string | null;
  production_reminder_sent: boolean;
  publish_reminder_sent: boolean;
  sort_order: number;
  model_used: string | null;
  tokens_used: number | null;
  generation_duration_ms: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  carousel_slides: CarouselSlide[] | null;
}

export interface CarouselSlide {
  slide_number: number;
  slide_type: 'cover' | 'content' | 'data' | 'cta';
  headline: string;
  body: string;
  accent_text: string;
  footnote: string;
}

export type ContentFormat = 'short' | 'medium_video' | 'long_video' | 'carousel' | 'stories';
export type ContentTone = 'polemic' | 'educational' | 'storytelling' | 'roast' | 'data_story' | 'myth_busting';
export type GrowthFunction = 'discovery' | 'conversion' | 'retention';
export type AudienceStage = 'cold' | 'warm' | 'hot';

export interface GenerateInput {
  input_text: string;
  input_type?: string;
  input_reference?: string;
  trending_topic_id?: string;
  format?: ContentFormat;
  tone?: ContentTone;
  growth_function?: GrowthFunction;
  audience_stage?: AudienceStage;
  product_showcase_key?: string;
  use_platform_data?: boolean;
  custom_instructions?: string;
  trending_angle?: string;
  trending_short_cuts?: TrendingShortCut[];
}

// ── Product Showcase types ───────────────────────────────────────────────

export interface ProductShowcase {
  id: string;
  product_key: string;
  display_name: string;
  description: string | null;
  key_features: string[];
  talking_points: string[];
  demo_instructions: string | null;
  cta_suggestion: string | null;
  enabled: boolean;
  sort_order: number;
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
  social_api_key: string;
  social_prompt: string;
  calendar_recipients: string;
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
          'content_factory_social_api_key',
          'content_factory_social_prompt',
          'content_calendar_recipients',
        ]);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data || []) map[row.key] = row.value || '';
      return {
        trending_api_key: map['content_factory_trending_api_key'] || 'perplexity_api',
        generate_api_key: map['content_factory_generate_api_key'] || 'openai_api',
        trending_prompt: map['content_factory_trending_prompt'] || '',
        generate_prompt: map['content_factory_generate_prompt'] || '',
        social_api_key: map['content_factory_social_api_key'] || 'openai_api',
        social_prompt: map['content_factory_social_prompt'] || '',
        calendar_recipients: map['content_calendar_recipients'] || '',
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
        ...(config.social_api_key !== undefined && { content_factory_social_api_key: config.social_api_key }),
        ...(config.social_prompt !== undefined && { content_factory_social_prompt: config.social_prompt }),
        ...(config.calendar_recipients !== undefined && { content_calendar_recipients: config.calendar_recipients }),
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
        .order('sort_order', { ascending: true })
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
        let detail = error.message;
        try {
          const resp = (error as any).context;
          if (resp?.json) {
            const body = await Promise.race([
              resp.json(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
            ]);
            detail = (body as any)?.error || detail;
          }
        } catch {
          // ignore — use original error.message
        }
        throw new Error(detail);
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

export interface UpdatePieceInput {
  id: string;
  title?: string;
  hook_variations?: HookVariation[];
  script_sections?: ScriptSection[];
  cta?: string;
  social_posts?: SocialPost[];
  seo_metadata?: SeoMetadata;
  status?: string;
  format?: string;
  tone?: string;
  growth_function?: string | null;
  audience_stage?: string | null;
  product_showcase_key?: string | null;
  scheduled_for?: string | null;
  production_date?: string | null;
}

export function useUpdatePiece() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...fields }: UpdatePieceInput) => {
      const { error } = await (supabase as any)
        .from('content_pieces')
        .update(fields)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-factory-pieces'] });
      toast({ title: 'Conteudo salvo' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdatePieceStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status, sort_order }: { id: string; status: string; sort_order?: number }) => {
      const update: Record<string, unknown> = { status };
      if (sort_order !== undefined) update.sort_order = sort_order;
      const { error } = await (supabase as any)
        .from('content_pieces')
        .update(update)
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

export function useReorderPieces() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; sort_order: number; status?: string }[]) => {
      // Batch update sort_order for each piece
      for (const u of updates) {
        const fields: Record<string, unknown> = { sort_order: u.sort_order };
        if (u.status) fields.status = u.status;
        const { error } = await (supabase as any)
          .from('content_pieces')
          .update(fields)
          .eq('id', u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-factory-pieces'] });
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

// ── Product Showcases ────────────────────────────────────────────────────

export function useProductShowcases() {
  return useQuery<ProductShowcase[]>({
    queryKey: ['content-factory-product-showcases'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('content_product_showcases')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as ProductShowcase[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useEnabledProductShowcases() {
  return useQuery<ProductShowcase[]>({
    queryKey: ['content-factory-product-showcases-enabled'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('content_product_showcases')
        .select('*')
        .eq('enabled', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as ProductShowcase[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveProductShowcase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (showcase: Partial<ProductShowcase> & { product_key: string }) => {
      const { error } = await (supabase as any)
        .from('content_product_showcases')
        .upsert(showcase, { onConflict: 'product_key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-factory-product-showcases'] });
      queryClient.invalidateQueries({ queryKey: ['content-factory-product-showcases-enabled'] });
      toast({ title: 'Produto salvo' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar produto', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteProductShowcase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('content_product_showcases')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-factory-product-showcases'] });
      queryClient.invalidateQueries({ queryKey: ['content-factory-product-showcases-enabled'] });
      toast({ title: 'Produto removido' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao remover produto', description: error.message, variant: 'destructive' });
    },
  });
}
