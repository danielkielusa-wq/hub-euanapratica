import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ──────────────────────────────────────────────────────────────

export interface PriorityItem {
  lead_id: string;
  lead_name: string;
  lead_email: string;
  lead_phone: string | null;
  temperature: string;
  score: number;
  priority_score: number;
  phase: string;
  reason: string;
  suggested_action: string;
  suggested_message: string;
  channel: string;
  priority: string;
  product_to_offer: string | null;
  estimated_ltv: number | null;
}

export interface MentoringGroupItem {
  group_theme: string;
  rota_phase: string;
  leads: Array<{ lead_id: string; lead_name: string; score: number; phase: string }>;
  suggested_session_topic: string;
}

export interface PriorityCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  items: PriorityItem[] | MentoringGroupItem[];
}

export interface DailyPrioritiesResponse {
  generated_at: string;
  summary: string;
  total_actionable_leads: number;
  categories: PriorityCategory[];
}

// ── Hook ───────────────────────────────────────────────────────────────

export type ProgressPhase =
  | 'loading_config'
  | 'querying_leads'
  | 'querying_interactions'
  | 'calling_ai'
  | 'parsing_response'
  | 'done';

export const PHASE_LABELS: Record<ProgressPhase, string> = {
  loading_config: 'Carregando configurações...',
  querying_leads: 'Buscando leads no banco de dados...',
  querying_interactions: 'Verificando interações recentes...',
  calling_ai: 'Enviando para IA — aguardando resposta...',
  parsing_response: 'Interpretando resposta da IA...',
  done: 'Pronto!',
};

const PHASE_ORDER: ProgressPhase[] = [
  'loading_config',
  'querying_leads',
  'querying_interactions',
  'calling_ai',
  'parsing_response',
  'done',
];

export function useAIDailyPriorities() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [data, setData] = useState<DailyPrioritiesResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressPhase, setProgressPhase] = useState<ProgressPhase | null>(null);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [remainingUses, setRemainingUses] = useState<number | null>(null);

  const isAssistant = user?.role === 'assistant';
  const isLimitReached = isAssistant && remainingUses !== null && remainingUses <= 0;

  // Fetch remaining uses on mount for assistant role
  useEffect(() => {
    if (!isAssistant || !user?.id) return;
    supabase.rpc('check_daily_priorities_limit' as any, { p_user_id: user.id })
      .then(({ data: rows }: any) => {
        const row = Array.isArray(rows) ? rows[0] : rows;
        if (row) setRemainingUses(Math.max(0, row.max_limit - row.used));
      });
  }, [isAssistant, user?.id]);

  const generatePriorities = useCallback(async () => {
    try {
      setIsGenerating(true);
      setCompletedItems(new Set());

      // Simulate progress phases while waiting for the single Edge Function call
      setProgressPhase('loading_config');
      const phaseTimer1 = setTimeout(() => setProgressPhase('querying_leads'), 800);
      const phaseTimer2 = setTimeout(() => setProgressPhase('querying_interactions'), 2000);
      const phaseTimer3 = setTimeout(() => setProgressPhase('calling_ai'), 3500);

      const { data: result, error } = await supabase.functions.invoke(
        'generate-daily-priorities',
        { body: {} }
      );

      // Clear timers and move to final phase
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      clearTimeout(phaseTimer3);
      setProgressPhase('parsing_response');

      if (error) {
        // Extract actual error message from response body
        let detail = '';
        let body: any = null;
        try {
          body = await error.context?.json?.();
          detail = body?.error || body?.message || '';
        } catch { /* ignore parse errors */ }

        // Handle 429 rate limit — update remaining uses
        if (body?.remaining_uses !== undefined) {
          setRemainingUses(body.remaining_uses);
        }
        throw new Error(detail || error.message);
      }
      if (result?.error) {
        if (result.remaining_uses !== undefined) setRemainingUses(result.remaining_uses);
        throw new Error(result.error);
      }

      // Update remaining uses from response
      if (result?.remaining_uses !== undefined) {
        setRemainingUses(result.remaining_uses);
      }

      // Validate basic structure
      if (!result?.categories || !Array.isArray(result.categories)) {
        throw new Error('Resposta da IA em formato inesperado');
      }

      setProgressPhase('done');
      setData(result as DailyPrioritiesResponse);

      toast({
        title: 'Prioridades geradas!',
        description: result.summary?.slice(0, 100) || 'Briefing diário pronto.',
      });
    } catch (error: any) {
      console.error('[useAIDailyPriorities] Error:', error);
      toast({
        title: 'Erro ao gerar prioridades',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setProgressPhase(null);
    }
  }, [toast]);

  const markAsDone = useCallback(async (item: PriorityItem, notes?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Determine interaction type from channel
      const interactionType =
        item.channel === 'whatsapp' ? 'whatsapp_sent' :
        item.channel === 'email' ? 'email_sent' :
        item.channel === 'call' ? 'call' :
        'ai_suggestion_completed';

      // 1. Create lead_interaction
      const { error: interactionError } = await supabase
        .from('lead_interactions' as any)
        .insert({
          lead_id: item.lead_id,
          type: interactionType,
          content: notes || item.suggested_message || item.suggested_action,
          direction: 'outbound',
          channel: item.channel || 'system',
          metadata: {
            source: 'ai_daily_priorities',
            original_suggestion: item.suggested_action,
            product_offered: item.product_to_offer,
          },
          created_by: user.id,
        } as any);

      if (interactionError) {
        console.error('[markAsDone] Interaction insert error:', interactionError);
        throw interactionError;
      }

      // 2. Create completed lead_task
      const { error: taskError } = await supabase
        .from('lead_tasks' as any)
        .insert({
          lead_id: item.lead_id,
          title: item.suggested_action,
          description: item.reason,
          type: 'contact',
          priority: item.priority || 'medium',
          source: 'ai_suggestion',
          status: 'done',
          completed_at: new Date().toISOString(),
          completed_by: user.id,
          created_by: user.id,
        } as any);

      if (taskError) {
        console.error('[markAsDone] Task insert error:', taskError);
        throw taskError;
      }

      // 3. Update local state
      setCompletedItems(prev => new Set(prev).add(item.lead_id));

      toast({ title: 'Marcado como concluído!' });
    } catch (error: any) {
      console.error('[markAsDone] Error:', error);
      toast({
        title: 'Erro ao marcar como concluído',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  return {
    data,
    isGenerating,
    progressPhase,
    completedItems,
    generatePriorities,
    markAsDone,
    remainingUses,
    isLimitReached,
    isAssistant,
  };
}
