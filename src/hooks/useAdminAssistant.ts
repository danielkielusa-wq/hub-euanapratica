import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ── Types ────────────────────────────────────────────────────

export interface PendingAction {
  id: string;
  name: string;
  args: Record<string, unknown>;
  description: string;
  status: 'pending' | 'confirming' | 'confirmed' | 'cancelled';
  result?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCallDisplay[];
  pendingAction?: PendingAction;
}

export interface ToolCallDisplay {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
  status: 'calling' | 'done' | 'error';
}

export interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

// ── SSE Event Types ──────────────────────────────────────────

interface SSEConversationId { type: 'conversation_id'; id: string }
interface SSETextDelta { type: 'text_delta'; content: string }
interface SSEToolCall { type: 'tool_call'; name: string; args: Record<string, unknown> }
interface SSEToolResult { type: 'tool_result'; name: string; result: string }
interface SSEActionConfirm { type: 'action_confirm'; name: string; args: Record<string, unknown>; description: string }
interface SSEActionResult { type: 'action_result'; name: string; result: string; confirmed: boolean }
interface SSEDone { type: 'done'; model: string; provider: string }
interface SSEError { type: 'error'; message: string }

type SSEEvent = SSEConversationId | SSETextDelta | SSEToolCall | SSEToolResult | SSEActionConfirm | SSEActionResult | SSEDone | SSEError;

// ── Tool display names ───────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
  count_leads: 'Consultando leads',
  get_api_costs: 'Consultando custos de API',
  get_subscription_stats: 'Consultando assinaturas',
  get_booking_stats: 'Consultando agendamentos',
  get_user_info: 'Buscando usuário',
  get_recent_errors: 'Verificando erros recentes',
  get_credit_usage: 'Consultando uso de créditos',
  get_whatsapp_flow_stats: 'Consultando WhatsApp',
  get_email_campaign_stats: 'Consultando campanhas de email',
  get_platform_overview: 'Carregando visão geral',
  get_conversion_funnel: 'Analisando funil de conversão',
  compare_periods: 'Comparando períodos',
  get_churn_analysis: 'Analisando churn',
  get_email_performance: 'Consultando performance de emails',
};

export function getToolLabel(name: string): string {
  return TOOL_LABELS[name] || `Executando ${name}`;
}

// ── Hook ─────────────────────────────────────────────────────

export function useAdminAssistant() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingToolCalls, setStreamingToolCalls] = useState<ToolCallDisplay[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Conversation list ────────────────────────────────────

  const conversationsQuery = useQuery({
    queryKey: ['assistant-conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assistant_conversations')
        .select('id, title, updated_at')
        .order('updated_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data || []) as Conversation[];
    },
  });

  // ── Load conversation messages ───────────────────────────

  const loadConversation = useCallback(async (convId: string) => {
    const { data, error } = await supabase
      .from('assistant_conversations')
      .select('messages')
      .eq('id', convId)
      .single();

    if (error || !data?.messages) return;

    const msgs = (data.messages as Array<{ role: string; content: string }>).map((m, i) => ({
      id: `${convId}-${i}`,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      timestamp: new Date(),
    }));

    setMessages(msgs);
    setActiveConversationId(convId);
    setStreamingContent('');
    setStreamingToolCalls([]);
  }, []);

  // ── Send message with SSE streaming ──────────────────────

  const sendMessage = useCallback(async (content: string, currentPage?: string) => {
    if (!content.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    setStreamingContent('');
    setStreamingToolCalls([]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/admin-assistant`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            conversationId: activeConversationId,
            message: content.trim(),
            currentPage,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        let errMsg = `Erro ${response.status}`;
        try {
          const parsed = JSON.parse(errorBody);
          errMsg = parsed.error || errMsg;
        } catch { /* use default */ }
        throw new Error(errMsg);
      }

      // Parse SSE stream
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';
      const toolCalls: ToolCallDisplay[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const event: SSEEvent = JSON.parse(trimmed.slice(6));

            switch (event.type) {
              case 'conversation_id':
                if (event.id) {
                  setActiveConversationId(event.id);
                }
                break;

              case 'text_delta':
                accumulatedContent += event.content;
                setStreamingContent(accumulatedContent);
                break;

              case 'tool_call': {
                const tc: ToolCallDisplay = {
                  id: crypto.randomUUID(),
                  name: event.name,
                  args: event.args,
                  status: 'calling',
                };
                toolCalls.push(tc);
                setStreamingToolCalls([...toolCalls]);
                break;
              }

              case 'tool_result': {
                const existing = toolCalls.find((t) => t.name === event.name && t.status === 'calling');
                if (existing) {
                  existing.result = event.result;
                  existing.status = 'done';
                  setStreamingToolCalls([...toolCalls]);
                }
                break;
              }

              case 'action_confirm': {
                // LLM wants to execute an action — show confirmation card
                const actionMsg: ChatMessage = {
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: accumulatedContent,
                  timestamp: new Date(),
                  toolCalls: toolCalls.length > 0 ? [...toolCalls] : undefined,
                  pendingAction: {
                    id: crypto.randomUUID(),
                    name: event.name,
                    args: event.args,
                    description: event.description,
                    status: 'pending',
                  },
                };
                setMessages((prev) => [...prev, actionMsg]);
                setStreamingContent('');
                setStreamingToolCalls([]);
                // Don't wait for done — stream ends, admin decides
                queryClient.invalidateQueries({ queryKey: ['assistant-conversations'] });
                break;
              }

              case 'action_result': {
                // Update the pending action in messages
                setMessages((prev) => prev.map((m) => {
                  if (m.pendingAction && m.pendingAction.name === event.name && (m.pendingAction.status === 'pending' || m.pendingAction.status === 'confirming')) {
                    let resultMsg = '';
                    try { resultMsg = JSON.parse(event.result).message || event.result; } catch { resultMsg = event.result; }
                    return {
                      ...m,
                      pendingAction: {
                        ...m.pendingAction,
                        status: event.confirmed ? 'confirmed' : 'cancelled',
                        result: resultMsg,
                      },
                    };
                  }
                  return m;
                }));
                break;
              }

              case 'done': {
                // Finalize: add assistant message with full content
                const assistantMessage: ChatMessage = {
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: accumulatedContent,
                  timestamp: new Date(),
                  toolCalls: toolCalls.length > 0 ? [...toolCalls] : undefined,
                };
                setMessages((prev) => [...prev, assistantMessage]);
                setStreamingContent('');
                setStreamingToolCalls([]);

                // Refresh conversation list
                queryClient.invalidateQueries({ queryKey: ['assistant-conversations'] });
                break;
              }

              case 'error':
                throw new Error(event.message);
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== 'Unexpected end of JSON input') {
              throw parseErr;
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;

      const errMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: 'Erro no assistente',
        description: errMsg,
        variant: 'destructive',
      });
      // Remove user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      setStreamingContent('');
      setStreamingToolCalls([]);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [activeConversationId, isStreaming, toast, queryClient]);

  // ── Stop streaming ───────────────────────────────────────

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // ── New conversation ─────────────────────────────────────

  const newConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setStreamingContent('');
    setStreamingToolCalls([]);
  }, []);

  // ── Delete conversation ──────────────────────────────────

  const deleteConversation = useMutation({
    mutationFn: async (convId: string) => {
      const { error } = await supabase
        .from('assistant_conversations')
        .delete()
        .eq('id', convId);
      if (error) throw error;
    },
    onSuccess: (_, convId) => {
      if (activeConversationId === convId) {
        newConversation();
      }
      queryClient.invalidateQueries({ queryKey: ['assistant-conversations'] });
    },
  });

  // ── Rename conversation ──────────────────────────────────

  const renameConversation = useMutation({
    mutationFn: async ({ convId, title }: { convId: string; title: string }) => {
      const { error } = await supabase
        .from('assistant_conversations')
        .update({ title })
        .eq('id', convId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistant-conversations'] });
    },
  });

  // ── Confirm/cancel action ──────────────────────────────

  const confirmAction = useCallback(async (action: PendingAction, confirmed: boolean) => {
    // Update UI immediately
    setMessages((prev) => prev.map((m) => {
      if (m.pendingAction?.id === action.id) {
        return { ...m, pendingAction: { ...m.pendingAction, status: 'confirming' as const } };
      }
      return m;
    }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sessão expirada');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/admin-assistant`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            conversationId: activeConversationId,
            message: confirmed ? `Confirmo: ${action.description}` : `Cancelo: ${action.description}`,
            confirmAction: {
              toolName: action.name,
              args: action.args,
              confirmed,
            },
          }),
        },
      );

      // Parse SSE for action_result
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          try {
            const event: SSEEvent = JSON.parse(trimmed.slice(6));
            if (event.type === 'action_result') {
              let resultMsg = '';
              try { resultMsg = JSON.parse(event.result).message || event.result; } catch { resultMsg = event.result; }
              setMessages((prev) => prev.map((m) => {
                if (m.pendingAction?.id === action.id) {
                  return {
                    ...m,
                    pendingAction: {
                      ...m.pendingAction,
                      status: event.confirmed ? 'confirmed' : 'cancelled',
                      result: resultMsg,
                    },
                  };
                }
                return m;
              }));
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Erro';
      setMessages((prev) => prev.map((m) => {
        if (m.pendingAction?.id === action.id) {
          return { ...m, pendingAction: { ...m.pendingAction, status: 'cancelled' as const, result: errMsg } };
        }
        return m;
      }));
    }
  }, [activeConversationId]);

  return {
    // State
    messages,
    streamingContent,
    streamingToolCalls,
    isStreaming,
    activeConversationId,

    // Conversations
    conversations: conversationsQuery.data || [],
    conversationsLoading: conversationsQuery.isLoading,
    loadConversation,
    newConversation,
    deleteConversation: deleteConversation.mutate,
    renameConversation: renameConversation.mutate,

    // Actions
    sendMessage,
    stopStreaming,
    confirmAction,
  };
}
