import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useAdminAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('admin-assistant', {
        body: {
          message: content.trim(),
          history,
        },
      });

      if (error) {
        // FunctionsHttpError.message is generic — try to read the actual body
        let errMsg = 'Falha ao obter resposta';
        if (error.context && typeof error.context.json === 'function') {
          try {
            const body = await error.context.json();
            errMsg = body?.error || error.message || errMsg;
          } catch {
            errMsg = error.message || errMsg;
          }
        } else {
          errMsg = error.message || errMsg;
        }
        throw new Error(errMsg);
      }

      const reply = data?.reply;
      if (typeof reply !== 'string' || !reply.trim()) {
        throw new Error('Resposta vazia do assistente');
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: 'Erro no assistente',
        description: errMsg,
        variant: 'destructive',
      });
      // Remove user message on error so they can retry
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, toast]);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearHistory,
  };
}
