import { useRef, useEffect, useState, type KeyboardEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Square, Sparkles, Loader2, Database, Bell } from 'lucide-react';
import { useAdminAssistant, getToolLabel } from '@/hooks/useAdminAssistant';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MessageBubble } from './MessageBubble';
import { ToolCallBlock } from './ToolCallBlock';
import { ConversationList } from './ConversationList';
import { AlertCard, type AssistantAlert } from './AlertCard';
import { AuroraHelpSheet } from './AuroraHelpSheet';
import { getContextualSuggestions } from './contextualSuggestions';

interface AdminAssistantChatProps {
  open: boolean;
  onClose: () => void;
}

function StreamingIndicator({
  content,
  toolCalls,
}: {
  content: string;
  toolCalls: Array<{ id: string; name: string; args: Record<string, unknown>; result?: string; status: string }>;
}) {
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0 bg-amber-100">
        <AvatarFallback className="bg-amber-100 text-amber-700">
          <Sparkles className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] text-sm">
        {/* Active tool calls */}
        {toolCalls.map((tc) => (
          <ToolCallBlock key={tc.id} toolCall={tc} />
        ))}

        {/* Streaming text or thinking indicator */}
        {content ? (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <span className="whitespace-pre-wrap">{content}</span>
            <span className="inline-block w-1.5 h-4 bg-amber-500 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
          </div>
        ) : toolCalls.length === 0 ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Aurora está pensando</span>
            <span className="flex gap-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState({ onSuggestionClick, suggestions }: { onSuggestionClick: (q: string) => void; suggestions: string[] }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8">
      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-4">
        <Sparkles className="h-8 w-8 text-amber-600" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Olá! Eu sou a Aurora</h3>
      <p className="text-sm text-muted-foreground mb-2 max-w-[280px]">
        Sua assistente IA do Hub — agora com acesso a dados em tempo real.
      </p>
      <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-6">
        <Database className="h-3.5 w-3.5" />
        <span>Posso consultar leads, custos, assinaturas e mais</span>
      </div>
      <div className="space-y-2 w-full max-w-[320px]">
        {suggestions.map((q) => (
          <button
            key={q}
            onClick={() => onSuggestionClick(q)}
            className="w-full text-left text-sm px-4 py-2.5 rounded-xl border border-border/60 hover:bg-muted/50 hover:border-border transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AdminAssistantChat({ open, onClose }: AdminAssistantChatProps) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const {
    messages,
    streamingContent,
    streamingToolCalls,
    isStreaming,
    activeConversationId,
    conversations,
    loadConversation,
    newConversation,
    deleteConversation,
    sendMessage,
    stopStreaming,
    confirmAction,
  } = useAdminAssistant();

  const [input, setInput] = useState('');
  const [showConversations, setShowConversations] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const alertQueryClient = useQueryClient();

  // Query unacknowledged alerts
  const alertsQuery = useQuery({
    queryKey: ['assistant-alerts-unacked'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assistant_alerts')
        .select('*')
        .eq('acknowledged', false)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) return [];
      return (data || []) as AssistantAlert[];
    },
    refetchInterval: 60000,
  });

  const alerts = alertsQuery.data || [];

  const handleAcknowledgeAlert = async (alertId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('assistant_alerts')
      .update({ acknowledged: true, acknowledged_by: user?.id, acknowledged_at: new Date().toISOString() })
      .eq('id', alertId);
    alertQueryClient.invalidateQueries({ queryKey: ['assistant-alerts-unacked'] });
    alertQueryClient.invalidateQueries({ queryKey: ['assistant-alerts-count'] });
  };

  const handleAskAuroraAboutAlert = (question: string) => {
    sendMessage(question, location.pathname);
  };

  // Auto-scroll to bottom on new messages or streaming
  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [messages, streamingContent, streamingToolCalls, isStreaming]);

  // Focus textarea when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [open]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const msg = input;
    setInput('');
    await sendMessage(msg, location.pathname);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (question: string) => {
    sendMessage(question, location.pathname);
  };

  const chatContent = (
    <div className="flex flex-col h-full min-h-0">
      {/* Conversation list toggle */}
      {showConversations && (
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={(id) => {
            loadConversation(id);
            setShowConversations(false);
          }}
          onNew={() => {
            newConversation();
            setShowConversations(false);
          }}
          onDelete={deleteConversation}
        />
      )}

      {/* Messages feed */}
      <ScrollArea className="flex-1 min-h-0">
        <div ref={scrollRef} className="px-4 py-4">
          {/* Alert feed */}
          {alerts.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <Bell className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs font-medium text-red-600">{alerts.length} alerta{alerts.length > 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={handleAcknowledgeAlert}
                    onAskAurora={handleAskAuroraAboutAlert}
                  />
                ))}
              </div>
            </div>
          )}

          {messages.length === 0 && !isStreaming ? (
            <EmptyState onSuggestionClick={handleSuggestionClick} suggestions={getContextualSuggestions(location.pathname)} />
          ) : (
            <div className="space-y-4 pb-2">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onConfirmAction={(action) => confirmAction(action, true)}
                  onCancelAction={(action) => confirmAction(action, false)}
                />
              ))}
              {isStreaming && (
                <StreamingIndicator
                  content={streamingContent}
                  toolCalls={streamingToolCalls}
                />
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="shrink-0 p-4 bg-background/80 backdrop-blur-md border-t border-border/40">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre o sistema..."
            className="min-h-[44px] max-h-[120px] resize-none text-sm"
            disabled={isStreaming}
          />
          <div className="flex flex-col gap-1">
            {isStreaming ? (
              <Button
                size="icon"
                variant="destructive"
                onClick={stopStreaming}
                className="h-10 w-10 shrink-0"
                title="Parar resposta"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim()}
                className="h-10 w-10 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const headerContent = (
    <div className="flex items-center gap-3 w-full">
      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
        <Sparkles className="h-4.5 w-4.5 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-semibold">Aurora</span>
        <span className="text-xs text-muted-foreground block">Assistente IA do Admin</span>
      </div>
      <div className="flex items-center gap-1">
        <AuroraHelpSheet />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowConversations(!showConversations)}
          className="text-xs h-7 px-2"
        >
          {showConversations ? 'Fechar' : 'Conversas'}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DrawerContent className="h-[90vh] max-h-[90vh]">
          <DrawerHeader className="border-b border-border/40 pb-4">
            <DrawerTitle>{headerContent}</DrawerTitle>
            <DrawerDescription className="sr-only">
              Chat com Aurora, assistente IA administrativa
            </DrawerDescription>
          </DrawerHeader>
          {chatContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/40 shrink-0">
          <SheetTitle>{headerContent}</SheetTitle>
          <SheetDescription className="sr-only">
            Chat com Aurora, assistente IA administrativa
          </SheetDescription>
        </SheetHeader>
        {chatContent}
      </SheetContent>
    </Sheet>
  );
}
