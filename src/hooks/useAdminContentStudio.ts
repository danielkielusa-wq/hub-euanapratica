/**
 * Hook for managing Content Studio in admin UI.
 * Queries: insights, ideas, scripts, prompts.
 * Mutations: generate insights/ideas/scripts, update statuses, save prompts.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ── Types ────────────────────────────────────────────────────────────────

export interface ContentInsight {
  id: string;
  insight_type: string;
  title: string;
  summary: string;
  data_points: Record<string, unknown>;
  source_tables: string[];
  relevance_score: number;
  controversy_score: number;
  period_start: string;
  period_end: string;
  status: string;
  used_in_idea_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface HookVariation {
  text: string;
  style: 'question' | 'claim' | 'data' | 'provocation';
  score: number;
}

export interface ContentIdea {
  id: string;
  insight_id: string | null;
  title: string;
  description: string | null;
  content_type: string;
  category: string;
  hooks: HookVariation[];
  target_audience: string | null;
  data_points_used: Record<string, unknown>;
  estimated_virality_score: number;
  status: string;
  priority: string;
  scheduled_date: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ScriptSection {
  heading: string;
  content: string;
  data_callout: string | null;
  camera_note: string | null;
}

export interface ContentScript {
  id: string;
  idea_id: string;
  title: string;
  hook: string;
  body_sections: ScriptSection[];
  cta: string | null;
  duration_estimate_seconds: number | null;
  platform: string;
  tone: string;
  data_sources_summary: string | null;
  status: string;
  virality_score: number | null;
  metadata: Record<string, unknown> | null;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentSocialPost {
  id: string;
  script_id: string;
  platform: string;
  content: string;
  hashtags: string[];
  cta: string | null;
  tone: string;
  metadata: Record<string, unknown> | null;
  status: string;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentGenerationLog {
  id: string;
  generation_type: string;
  input_summary: string | null;
  output_summary: string | null;
  model_used: string | null;
  tokens_used: number | null;
  duration_ms: number | null;
  status: string;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── Queries ──────────────────────────────────────────────────────────────

export function useContentInsights(filters?: { type?: string; status?: string }) {
  return useQuery<ContentInsight[]>({
    queryKey: ['content-insights', filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from('content_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters?.type) query = query.eq('insight_type', filters.type);
      if (filters?.status) query = query.eq('status', filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ContentInsight[];
    },
  });
}

export function useContentIdeas(filters?: { status?: string; category?: string; content_type?: string }) {
  return useQuery<ContentIdea[]>({
    queryKey: ['content-ideas', filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from('content_ideas')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(200);

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.content_type) query = query.eq('content_type', filters.content_type);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ContentIdea[];
    },
  });
}

export function useContentScripts(ideaId?: string) {
  return useQuery<ContentScript[]>({
    queryKey: ['content-scripts', ideaId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('content_scripts')
        .select('*')
        .order('created_at', { ascending: false });

      if (ideaId) query = query.eq('idea_id', ideaId);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ContentScript[];
    },
  });
}

export function useContentSocialPosts(scriptId?: string) {
  return useQuery<ContentSocialPost[]>({
    queryKey: ['content-social-posts', scriptId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('content_social_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (scriptId) query = query.eq('script_id', scriptId);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ContentSocialPost[];
    },
  });
}

export function useContentGenerationLogs() {
  return useQuery<ContentGenerationLog[]>({
    queryKey: ['content-generation-logs'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('content_generation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as ContentGenerationLog[];
    },
  });
}

export function useContentPrompts() {
  return useQuery<Record<string, string>>({
    queryKey: ['content-prompts'],
    queryFn: async () => {
      const keys = [
        'content_studio_insights_prompt',
        'content_studio_ideas_prompt',
        'content_studio_script_prompt',
        'content_studio_insights_api_key',
        'content_studio_ideas_api_key',
        'content_studio_script_api_key',
        'content_studio_social_prompt',
        'content_studio_social_api_key',
        // Pipeline config
        'content_studio_cron_schedule',
        'content_studio_pipeline_mode',
        'content_studio_auto_ideas_count',
        'content_studio_auto_scripts_count',
      ];
      const { data, error } = await (supabase as any)
        .from('app_configs')
        .select('key, value')
        .in('key', keys);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data || []) {
        map[row.key] = row.value || '';
      }
      return map;
    },
  });
}

export interface ApiOption {
  api_key: string;
  name: string;
  is_active: boolean;
}

export function useAvailableApis() {
  return useQuery<ApiOption[]>({
    queryKey: ['content-studio-available-apis'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('api_configs')
        .select('api_key, name, is_active')
        .or('base_url.ilike.%openai%,base_url.ilike.%anthropic%,base_url.ilike.%openrouter%,base_url.ilike.%perplexity%')
        .order('name');
      if (error) throw error;
      return (data || []) as ApiOption[];
    },
  });
}

// ── Mutations: Generate ──────────────────────────────────────────────────

export function useGenerateInsights() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (periodDays: number = 7) => {
      const { data, error } = await supabase.functions.invoke(
        'generate-content-insights',
        { body: { period_days: periodDays } }
      );
      if (error) {
        // FunctionsHttpError.context is the raw Response — extract body for details
        const resp = (error as any).context;
        if (resp && typeof resp.json === 'function') {
          try {
            const body = await resp.json();
            throw new Error(body?.error || `HTTP ${resp.status}: ${error.message}`);
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
      queryClient.invalidateQueries({ queryKey: ['content-insights'] });
      queryClient.invalidateQueries({ queryKey: ['content-generation-logs'] });
      toast({ title: `${data?.count || 0} insights gerados com sucesso` });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao gerar insights', description: error.message, variant: 'destructive' });
    },
  });
}

export function useGenerateIdeas(callbacks?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { insight_ids?: string[]; free_text?: string; content_type?: string; count?: number }) => {
      const { data, error } = await supabase.functions.invoke(
        'generate-content-ideas',
        { body: input }
      );
      if (error) {
        const resp = (error as any).context;
        if (resp && typeof resp.json === 'function') {
          try {
            const body = await resp.json();
            throw new Error(body?.error || `HTTP ${resp.status}: ${error.message}`);
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
      queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
      queryClient.invalidateQueries({ queryKey: ['content-insights'] });
      queryClient.invalidateQueries({ queryKey: ['content-generation-logs'] });
      callbacks?.onSuccess?.(data);
    },
    onError: (error: any) => {
      callbacks?.onError?.(error);
    },
  });
}

export function useGenerateScript(callbacks?: { onSuccess?: () => void; onError?: (error: any) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { idea_id: string; platform?: string }) => {
      const { data, error } = await supabase.functions.invoke(
        'generate-content-script',
        { body: input }
      );
      if (error) {
        const resp = (error as any).context;
        if (resp && typeof resp.json === 'function') {
          try {
            const body = await resp.json();
            throw new Error(body?.error || `HTTP ${resp.status}: ${error.message}`);
          } catch (e) {
            if (e instanceof Error && e.message !== error.message) throw e;
          }
        }
        throw error;
      }
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-scripts'] });
      queryClient.invalidateQueries({ queryKey: ['content-generation-logs'] });
      callbacks?.onSuccess?.();
    },
    onError: (error: any) => {
      callbacks?.onError?.(error);
    },
  });
}

// ── Mutations: Update status ─────────────────────────────────────────────

export function useUpdateInsight() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContentInsight> & { id: string }) => {
      const { error } = await (supabase as any)
        .from('content_insights')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-insights'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar insight', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateIdea() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContentIdea> & { id: string }) => {
      const { error } = await (supabase as any)
        .from('content_ideas')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar ideia', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateScript() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContentScript> & { id: string }) => {
      const { error } = await (supabase as any)
        .from('content_scripts')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-scripts'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar roteiro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteIdea() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('content_ideas')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
      toast({ title: 'Ideia removida' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteScript() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('content_scripts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-scripts'] });
      toast({ title: 'Roteiro removido' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutations: Social Posts ──────────────────────────────────────────────

export function useGenerateSocialPosts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { script_id: string; platforms?: string[] }) => {
      const { data, error } = await supabase.functions.invoke(
        'generate-content-social-posts',
        { body: input }
      );
      if (error) {
        const resp = (error as any).context;
        if (resp && typeof resp.json === 'function') {
          try {
            const body = await resp.json();
            throw new Error(body?.error || `HTTP ${resp.status}: ${error.message}`);
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
      queryClient.invalidateQueries({ queryKey: ['content-social-posts'] });
      queryClient.invalidateQueries({ queryKey: ['content-generation-logs'] });
      toast({ title: `${data?.posts?.length || 0} posts sociais gerados` });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao gerar posts sociais', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateSocialPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContentSocialPost> & { id: string }) => {
      const { error } = await (supabase as any)
        .from('content_social_posts')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-social-posts'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar post', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteSocialPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('content_social_posts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-social-posts'] });
      toast({ title: 'Post removido' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutations: Save prompts ──────────────────────────────────────────────

export function useSavePrompt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await (supabase as any)
        .from('app_configs')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-prompts'] });
      toast({ title: 'Configuração salva com sucesso' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutations: Pipeline ──────────────────────────────────────────────────

export function useUpdateCronSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (cronExpression: string) => {
      const { data, error } = await (supabase as any).rpc('update_content_studio_cron', {
        p_cron_expression: cronExpression,
      });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || 'Failed to update schedule');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-prompts'] });
      toast({ title: 'Agendamento atualizado com sucesso' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar agendamento', description: error.message, variant: 'destructive' });
    },
  });
}

export function useRunPipeline() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (periodDays: number = 7) => {
      const { data, error } = await supabase.functions.invoke('run-content-pipeline', {
        body: { period_days: periodDays, source: 'manual' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-insights'] });
      queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
      queryClient.invalidateQueries({ queryKey: ['content-scripts'] });
      queryClient.invalidateQueries({ queryKey: ['content-generation-logs'] });
      const insights = data?.steps?.insights?.count || 0;
      const ideas = data?.steps?.ideas?.count || 0;
      const scripts = data?.steps?.scripts?.succeeded || 0;
      toast({
        title: 'Pipeline concluído',
        description: `${insights} insights, ${ideas} ideias, ${scripts} roteiros gerados`,
      });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao executar pipeline', description: error.message, variant: 'destructive' });
    },
  });
}
