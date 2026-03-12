import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ── Types ──────────────────────────────────────────────────────

export interface ContentItem {
  type: string;
  title: string;
  body: string;
  copied_at?: string;
}

export interface GroupContentSuggestion {
  id: string;
  generated_date: string;
  contents: ContentItem[];
  api_config_key: string | null;
  model: string | null;
  tokens_used: number | null;
  status: string;
  error_message: string | null;
  webhook_dispatched: boolean;
  created_at: string;
}

export interface GroupContentConfig {
  api_config_key: string;
  count: number;
  schedule_hour_utc: number;
  enabled: boolean;
  webhook_event: string;
}

const DEFAULT_CONFIG: GroupContentConfig = {
  api_config_key: 'openai_api',
  count: 3,
  schedule_hour_utc: 9,
  enabled: true,
  webhook_event: 'group_content.generated',
};

// ── Hook ───────────────────────────────────────────────────────

export function useAdminGroupContent() {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<GroupContentSuggestion[]>([]);
  const [config, setConfig] = useState<GroupContentConfig>(DEFAULT_CONFIG);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // ── Fetch suggestions ────────────────────────────────────────
  const fetchSuggestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('group_content_suggestions')
        .select('*')
        .order('generated_date', { ascending: false })
        .limit(30);

      if (error) throw error;
      setSuggestions((data || []) as unknown as GroupContentSuggestion[]);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar conteúdos', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // ── Fetch config + prompt ────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_configs')
        .select('key, value')
        .in('key', ['group_content_config', 'group_content_prompt']);

      if (error) throw error;

      for (const row of data || []) {
        if (row.key === 'group_content_config') {
          try {
            setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(row.value) });
          } catch { /* keep default */ }
        }
        if (row.key === 'group_content_prompt') {
          setPrompt(row.value);
        }
      }
    } catch (error: any) {
      toast({ title: 'Erro ao carregar config', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  // ── Save config ──────────────────────────────────────────────
  const saveConfig = useCallback(async (newConfig: GroupContentConfig, newPrompt: string) => {
    try {
      setIsSavingConfig(true);
      const { data: { user } } = await supabase.auth.getUser();

      const updates = [
        supabase.from('app_configs').upsert({
          key: 'group_content_config',
          value: JSON.stringify(newConfig),
          updated_by: user?.id,
        }, { onConflict: 'key' }),
        supabase.from('app_configs').upsert({
          key: 'group_content_prompt',
          value: newPrompt,
          updated_by: user?.id,
        }, { onConflict: 'key' }),
      ];

      const results = await Promise.all(updates);
      const err = results.find(r => r.error);
      if (err?.error) throw err.error;

      setConfig(newConfig);
      setPrompt(newPrompt);
      toast({ title: 'Configurações salvas!' });
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setIsSavingConfig(false);
    }
  }, [toast]);

  // ── Generate now ─────────────────────────────────────────────
  const generateNow = useCallback(async (date?: string) => {
    try {
      setIsGenerating(true);
      const { data, error } = await supabase.functions.invoke('generate-group-content', {
        body: date ? { action: 'regenerate', date } : {},
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Conteúdo gerado!', description: `${data.count} textos criados com ${data.model}` });
      await fetchSuggestions();
    } catch (error: any) {
      toast({ title: 'Erro ao gerar', description: error.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  }, [toast, fetchSuggestions]);

  // ── Delete suggestion ────────────────────────────────────────
  const deleteSuggestion = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('group_content_suggestions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setSuggestions(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Removido!' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  // ── Init ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchSuggestions();
    fetchConfig();
  }, [fetchSuggestions, fetchConfig]);

  return {
    suggestions,
    config,
    prompt,
    isLoading,
    isGenerating,
    isSavingConfig,
    generateNow,
    saveConfig,
    deleteSuggestion,
    refetch: fetchSuggestions,
  };
}
